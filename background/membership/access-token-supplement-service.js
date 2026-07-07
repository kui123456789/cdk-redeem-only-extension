(function attachAccessTokenSupplementService(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.MultiPageAccessTokenSupplementService = api;
})(typeof self !== 'undefined' ? self : globalThis, function createAccessTokenSupplementServiceModule() {
  function defaultNormalizeString(value = '') {
    return String(value || '').trim();
  }

  function defaultNormalizeEmail(value = '') {
    return defaultNormalizeString(value).toLowerCase();
  }

  function createAccessTokenSupplementService(deps = {}) {
    const {
      addLog = async () => {},
      findBackupCredentialByEmail = async () => ({}),
      getChatGptSessionAccessToken = () => '',
      getErrorMessage = (error) => error?.message || String(error || '未知错误'),
      getState = async () => ({}),
      getStoredResults = async () => ({}),
      hasPasskeyCredential = () => false,
      isBatchRunning = () => false,
      isCdkeyRetryRunning = () => false,
      isRedeemRunning = () => false,
      loginAndReadAccessToken = async () => ({}),
      maskAccessToken = () => '',
      mergeCredentialAuthMaterial = (primary = {}) => primary,
      mergeCredentialsIntoResultItems = (items = []) => items,
      normalizeEmail = defaultNormalizeEmail,
      normalizeResultItem = (item = {}) => item,
      normalizeString = defaultNormalizeString,
      normalizeTotpSecret = defaultNormalizeString,
      resolveInputCredentials = () => [],
      saveResults = async (results = {}) => results,
      setBatchRunning = () => {},
      setBatchStopRequested = () => {},
      throwIfMembershipStopRequested = () => {},
      upsertResultItem = (items = []) => items,
    } = deps;

    async function fillUpiCredentialMembershipFreeAccessTokens(input = {}) {
      if (isBatchRunning()) {
        throw new Error('UPI 备份账号会员核验正在运行，请等待完成或先停止。');
      }
      if (isRedeemRunning() || isCdkeyRetryRunning()) {
        throw new Error('UPI Free 账号兑换/CDK 重试正在运行，请等待完成或先停止。');
      }

      setBatchRunning(true);
      setBatchStopRequested(false);
      const startedAt = new Date().toISOString();
      let currentResults = await getStoredResults();
      const requestedCredentials = resolveInputCredentials(input).filter((credential) => credential.email);
      let items = mergeCredentialsIntoResultItems(currentResults.items, requestedCredentials);
      const lookup = {};
      items.forEach((item) => {
        const email = normalizeEmail(item?.email);
        if (email) lookup[email] = item;
      });
      const rawCandidates = requestedCredentials.length
        ? requestedCredentials.map((credential) => ({ ...(lookup[normalizeEmail(credential.email)] || {}), ...credential }))
        : items;
      const credentials = rawCandidates
        .map((credential) => normalizeResultItem({ ...credential, status: credential.status || 'free' }))
        .filter((credential) => credential.email && credential.status === 'free' && !credential.accessToken);
      const runtimeState = {
        ...(await getState()),
        ...(input.settings || {}),
      };
      const filled = [];
      const skipped = [];
      const failed = [];

      const saveProgress = async (stage = 'token', email = '') => {
        currentResults = await saveResults({
          ...currentResults,
          items,
          running: true,
          updatedAt: new Date().toISOString(),
          flowStage: stage,
          flowStageEmail: normalizeEmail(email),
          source: normalizeString(input.source || currentResults.source || 'free-fill-at'),
          total: credentials.length,
          completed: filled.length + skipped.length + failed.length,
        });
      };

      try {
        if (!credentials.length) {
          return {
            results: await saveResults({
              ...currentResults,
              items,
              running: false,
              updatedAt: startedAt,
              finishedAt: startedAt,
              flowStage: '',
              flowStageEmail: '',
            }),
            filled,
            skipped,
            failed,
          };
        }

        await addLog(`UPI Free 分组补充 AT：开始处理 ${credentials.length} 个缺 AT 账号。`, 'info');
        for (const credential of credentials) {
          throwIfMembershipStopRequested('check');
          const email = normalizeEmail(credential.email);
          const existingItem = items.find((item) => normalizeEmail(item?.email) === email) || {};
          let activeCredential = normalizeResultItem({
            ...existingItem,
            ...credential,
            email,
            status: 'free',
            planType: 'free',
          });
          const backupCredential = await findBackupCredentialByEmail(email);
          if (backupCredential?.email) {
            activeCredential = normalizeResultItem(mergeCredentialAuthMaterial(activeCredential, backupCredential));
          }
          if (!activeCredential.password) {
            const reason = '缺少 GPT 密码，无法补充 AT';
            skipped.push({ email, reason });
            items = upsertResultItem(items, {
              ...activeCredential,
              reason,
            });
            await saveProgress('token', email);
            await addLog(`UPI Free 分组补充 AT：${email} -> 跳过：${reason}`, 'warn');
            continue;
          }
          if (hasPasskeyCredential(activeCredential)) {
            await addLog(`UPI Free 分组补充 AT：${email} -> 检测到 Passkey，优先使用 Nerver Passkey 登录接口补 AT。`, 'info');
          } else if (!normalizeTotpSecret(activeCredential.totpMfaSecret || activeCredential.totpSecret)) {
            await addLog(`UPI Free 分组补充 AT：${email} -> 未保存 2FA/Passkey，先按邮箱+密码登录；如页面要求验证码会按实际错误返回。`, 'info');
          }

          try {
            await saveProgress('login', email);
            const session = await loginAndReadAccessToken(activeCredential, {
              ...runtimeState,
              ...currentResults,
            }, {
              onStage: async (stage) => saveProgress(stage, email),
              throwIfStopRequested: () => throwIfMembershipStopRequested('check'),
            });
            const accessToken = normalizeString(session.accessToken || getChatGptSessionAccessToken(session.session || session));
            if (!accessToken) {
              throw new Error('未读取到 accessToken');
            }
            const updatedAt = new Date().toISOString();
            filled.push({ email, accessTokenMasked: maskAccessToken(accessToken), updatedAt });
            items = upsertResultItem(items, {
              ...activeCredential,
              reason: activeCredential.reason || '已补充 AT',
              accessToken,
              accessTokenMasked: maskAccessToken(accessToken),
              accessTokenUpdatedAt: updatedAt,
              checkedAt: activeCredential.checkedAt || updatedAt,
            });
            await saveProgress('token', email);
            await addLog(`UPI Free 分组补充 AT：${email} -> 已保存 AT。`, 'ok');
          } catch (error) {
            const reason = getErrorMessage(error) || '补充 AT 失败';
            failed.push({ email, reason });
            items = upsertResultItem(items, {
              ...activeCredential,
              reason,
            });
            await saveProgress('token', email);
            await addLog(`UPI Free 分组补充 AT：${email} -> 失败：${reason}`, 'warn');
          }
        }

        const finishedAt = new Date().toISOString();
        const results = await saveResults({
          ...currentResults,
          items,
          running: false,
          updatedAt: finishedAt,
          finishedAt,
          flowStage: '',
          flowStageEmail: '',
          total: items.length,
          completed: items.length,
        });
        await addLog(`UPI Free 分组补充 AT：完成，成功 ${filled.length}，跳过 ${skipped.length}，失败 ${failed.length}。`, 'ok');
        return { results, filled, skipped, failed };
      } finally {
        setBatchRunning(false);
      }
    }

    return {
      fillUpiCredentialMembershipFreeAccessTokens,
    };
  }

  return {
    createAccessTokenSupplementService,
  };
});
