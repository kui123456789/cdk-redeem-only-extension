(function attachFreePoolService(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.MultiPageFreePoolService = api;
})(typeof self !== 'undefined' ? self : globalThis, function createFreePoolServiceModule() {
  const REDEEM_CHANNEL_FAILURE_LIMIT = 3;

  function defaultNormalizeString(value = '') {
    return String(value || '').trim();
  }

  function defaultNormalizeEmail(value = '') {
    return defaultNormalizeString(value).toLowerCase();
  }

  function defaultNormalizeRetryCount(value = 0) {
    const count = Math.floor(Number(value) || 0);
    return count > 0 ? count : 0;
  }

  function createFreePoolService(deps = {}) {
    const {
      addLog = async () => {},
      buildPasskeyNumericMetadataPatch = () => ({}),
      checkUpiRedeemAccessTokenEligibility = null,
      getErrorMessage = (error) => error?.message || String(error || '未知错误'),
      getState = async () => ({}),
      getStoredResults = async () => ({}),
      getUpiCredentialMembershipCredentialPool = async () => ({ items: [] }),
      hasChatGptSessionPayload = () => false,
      isActiveUpiCredentialMembershipRedeemResultItem = () => false,
      isBatchRunning = () => false,
      isCdkeyRetryRunning = () => false,
      isRedeemRunning = () => false,
      isUpiTrialIneligibleError = () => false,
      loginAndReadAccessToken = async () => ({}),
      markRegistrationEmailTrialIneligible = null,
      maskAccessToken = () => '',
      mergeCredentialsIntoResultItems = (items = []) => items,
      normalizeEmail = defaultNormalizeEmail,
      normalizePlanType = (value = '') => defaultNormalizeString(value).toLowerCase().replace(/[\s-]+/g, '_'),
      normalizeRedeemChannel = defaultNormalizeString,
      normalizeRedeemPlusDeletedEmailsByChannel = () => ({ upi: [], ideal: [], pix: [] }),
      normalizeResultItem = (item = {}) => item,
      normalizeRetryCount = defaultNormalizeRetryCount,
      normalizeString = defaultNormalizeString,
      normalizeTotpSecret = defaultNormalizeString,
      resolveInputCredentials = () => [],
      saveResults = async (results = {}) => results,
      setBatchRunning = () => {},
      setBatchStopRequested = () => {},
      throwIfMembershipStopRequested = () => {},
      upsertResultItem = (items = []) => items,
    } = deps;

    async function upsertTrialEligibleFreeCredential(input = {}) {
      const credential = input.credential && typeof input.credential === 'object' && !Array.isArray(input.credential)
        ? input.credential
        : {};
      const email = normalizeEmail(input.email || credential.email);
      if (!email) {
        throw new Error('缺少要写入 Free 分组的账号邮箱。');
      }
      const checkedAt = normalizeString(input.checkedAt) || new Date().toISOString();
      const currentResults = await getStoredResults();
      const nextRedeemAutoDeletedEmails = (Array.isArray(currentResults.redeemAutoDeletedEmails)
        ? currentResults.redeemAutoDeletedEmails
        : []
      ).map(normalizeEmail).filter((item) => item && item !== email);
      const currentRedeemPlusDeletedEmailsByChannel = normalizeRedeemPlusDeletedEmailsByChannel(
        currentResults.redeemPlusDeletedEmailsByChannel
      );
      const existingItem = currentResults.items.find((item) => normalizeEmail(item?.email) === email) || {};
      let backupCredential = {};
      try {
        const pool = await getUpiCredentialMembershipCredentialPool();
        backupCredential = (pool.items || []).find((item) => normalizeEmail(item?.email) === email) || {};
      } catch {
        backupCredential = {};
      }
      const source = normalizeString(input.source || credential.source);
      const reason = normalizeString(input.reason || input.message || credential.reason) || '账号有试用资格，可进行 CDK 兑换';
      const trialEligibilityStatus = normalizeString(
        input.trialEligibilityStatus
        || credential.trialEligibilityStatus
        || existingItem.trialEligibilityStatus
        || 'eligible'
      );
      const trialEligibilityReason = normalizeString(
        input.trialEligibilityReason
        || credential.trialEligibilityReason
        || reason
      );
      const trialEligibilityCheckedAt = normalizeString(
        input.trialEligibilityCheckedAt
        || credential.trialEligibilityCheckedAt
        || checkedAt
      );
      const trialEligibilityReasonCode = normalizeString(input.trialEligibilityReasonCode || credential.trialEligibilityReasonCode || existingItem.trialEligibilityReasonCode);
      const trialEligibilityTransientFailure = input.trialEligibilityTransientFailure === true || credential.trialEligibilityTransientFailure === true;
      const trialEligibilityRetryable = input.trialEligibilityRetryable === true || credential.trialEligibilityRetryable === true || trialEligibilityTransientFailure;
      const trialEligibilityRetryCount = Math.max(0, Math.floor(Number(input.trialEligibilityRetryCount || credential.trialEligibilityRetryCount || existingItem.trialEligibilityRetryCount) || 0));
      const trialEligibilityLastError = normalizeString(input.trialEligibilityLastError || credential.trialEligibilityLastError || existingItem.trialEligibilityLastError);
      const couponState = normalizeString(input.couponState || credential.couponState || existingItem.couponState);
      const registrationType = normalizeString(input.registrationType || credential.registrationType || existingItem.registrationType);
      const registrationPhone = normalizeString(input.registrationPhone || credential.registrationPhone || existingItem.registrationPhone);
      const phoneVerified = input.phoneVerified === true || credential.phoneVerified === true || existingItem.phoneVerified === true;
      const accountId = normalizeString(input.accountId || credential.accountId || existingItem.accountId);
      const responseEmail = normalizeEmail(input.responseEmail || credential.responseEmail || existingItem.responseEmail);
      const jwtExpired = input.jwtExpired === true || credential.jwtExpired === true || existingItem.jwtExpired === true;
      const jwtExpiresInSeconds = Math.max(0, Math.floor(Number(input.jwtExpiresInSeconds || credential.jwtExpiresInSeconds || existingItem.jwtExpiresInSeconds) || 0));
      const upiChannelEligibilityStatus = normalizeString(input.upiChannelEligibilityStatus || credential.upiChannelEligibilityStatus || existingItem.upiChannelEligibilityStatus);
      const upiChannelEligibilityReason = normalizeString(input.upiChannelEligibilityReason || credential.upiChannelEligibilityReason || existingItem.upiChannelEligibilityReason);
      const idealChannelEligibilityStatus = normalizeString(input.idealChannelEligibilityStatus || credential.idealChannelEligibilityStatus || existingItem.idealChannelEligibilityStatus);
      const idealChannelEligibilityReason = normalizeString(input.idealChannelEligibilityReason || credential.idealChannelEligibilityReason || existingItem.idealChannelEligibilityReason);
      const pixChannelEligibilityStatus = normalizeString(input.pixChannelEligibilityStatus || credential.pixChannelEligibilityStatus || existingItem.pixChannelEligibilityStatus);
      const pixChannelEligibilityReason = normalizeString(input.pixChannelEligibilityReason || credential.pixChannelEligibilityReason || existingItem.pixChannelEligibilityReason);
      const accessToken = normalizeString(input.accessToken || input.token || input.access_token || credential.accessToken || existingItem.accessToken);
      const accessTokenUpdatedAt = accessToken
        ? normalizeString(input.accessTokenUpdatedAt || credential.accessTokenUpdatedAt || checkedAt)
        : normalizeString(existingItem.accessTokenUpdatedAt);
      const verificationUrl = normalizeString(
        input.verificationUrl
        || credential.verificationUrl
        || credential.emailVerificationUrl
        || credential.url
        || existingItem.verificationUrl
        || existingItem.emailVerificationUrl
      );
      const recordedAt = Math.max(0, Math.floor(Number(
        input.recordedAt
        || credential.recordedAt
        || existingItem.recordedAt
        || Date.parse(trialEligibilityCheckedAt)
        || Date.now()
      ) || Date.now()));
      const hasIncoming2faMaterial = Boolean(
        normalizeTotpSecret(credential.totpMfaSecret || credential.totpSecret || input.totpMfaSecret || input.totpSecret)
      );
      const no2faFreeRoute = input.no2faFreeRoute === true
        || credential.no2faFreeRoute === true
        || (!hasIncoming2faMaterial && existingItem.no2faFreeRoute === true);
      const twoFactorEnabled = no2faFreeRoute ? false : (
        input.twoFactorEnabled === true
        || credential.twoFactorEnabled === true
        || Boolean(normalizeTotpSecret(credential.totpMfaSecret || credential.totpSecret || input.totpMfaSecret || input.totpSecret || backupCredential.totpMfaSecret || existingItem.totpMfaSecret))
      );
      const nextPassword = no2faFreeRoute
        ? ''
        : normalizeString(credential.password || input.password || backupCredential.password || existingItem.password);
      const nextTotpMfaSecret = no2faFreeRoute
        ? ''
        : normalizeTotpSecret(credential.totpMfaSecret || credential.totpSecret || input.totpMfaSecret || input.totpSecret || backupCredential.totpMfaSecret || existingItem.totpMfaSecret);
      const gptPassword = no2faFreeRoute
        ? ''
        : normalizeString(credential.gptPassword || input.gptPassword || credential.password || input.password || backupCredential.password || existingItem.gptPassword || existingItem.password);
      const passkeyCredentialId = normalizeString(
        input.passkeyCredentialId
        || credential.passkeyCredentialId
        || backupCredential.passkeyCredentialId
        || existingItem.passkeyCredentialId
      );
      const passkeyEnabled = no2faFreeRoute ? false : (
        input.passkeyEnabled === true
        || credential.passkeyEnabled === true
        || backupCredential.passkeyEnabled === true
        || existingItem.passkeyEnabled === true
        || Boolean(passkeyCredentialId)
      );
      const passkeyPrivateJwk = input.passkeyPrivateJwk !== undefined
        ? input.passkeyPrivateJwk
        : (
          credential.passkeyPrivateJwk !== undefined
            ? credential.passkeyPrivateJwk
            : (backupCredential.passkeyPrivateJwk || existingItem.passkeyPrivateJwk || null)
        );
      const hasRedeemField = (key) => (
        Object.prototype.hasOwnProperty.call(input, key)
        || Object.prototype.hasOwnProperty.call(credential, key)
      );
      const getRedeemField = (key) => (
        Object.prototype.hasOwnProperty.call(input, key) ? input[key] : credential[key]
      );
      const hasRedeemCdkey = (
        Object.prototype.hasOwnProperty.call(input, 'cdkey')
        || hasRedeemField('upiRedeemCdkey')
        || hasRedeemField('cdkey')
      );
      const resetRedeemStateRequested = input.resetRedeemState === true
        || credential.resetRedeemState === true
        || source === 'registration-free-entry'
        || source === 'registration-upi-eligibility';
      const shouldResetRedeemState = resetRedeemStateRequested
        && !isActiveUpiCredentialMembershipRedeemResultItem(existingItem, currentResults);
      const nextRedeemPlusDeletedEmailsByChannel = currentRedeemPlusDeletedEmailsByChannel;
      const nextRedeemStatus = hasRedeemField('redeemStatus')
        ? normalizeString(getRedeemField('redeemStatus'))
        : (shouldResetRedeemState ? '' : (existingItem.redeemStatus === 'success' ? existingItem.redeemStatus : normalizeString(existingItem.redeemStatus)));
      const nextRedeemReason = hasRedeemField('redeemReason')
        ? normalizeString(getRedeemField('redeemReason'))
        : (shouldResetRedeemState ? '' : existingItem.redeemReason);
      const nextRedeemFailureCount = hasRedeemField('redeemFailureCount')
        ? normalizeRetryCount(getRedeemField('redeemFailureCount'))
        : (shouldResetRedeemState || existingItem.redeemStatus === 'success' ? 0 : existingItem.redeemFailureCount);
      const nextRedeemChannel = hasRedeemField('redeemChannel') || hasRedeemField('channel')
        ? normalizeRedeemChannel(getRedeemField('redeemChannel') || getRedeemField('channel'))
        : (shouldResetRedeemState ? '' : normalizeString(existingItem.redeemChannel));
      const nextRedeemCdkey = hasRedeemCdkey
        ? normalizeString(
          Object.prototype.hasOwnProperty.call(input, 'cdkey')
            ? input.cdkey
            : (getRedeemField('upiRedeemCdkey') || getRedeemField('cdkey'))
        )
        : (shouldResetRedeemState ? '' : normalizeString(existingItem.upiRedeemCdkey));
      const passkeyNumericMetadataPatch = buildPasskeyNumericMetadataPatch(input, credential, backupCredential, existingItem);
      const nextItems = upsertResultItem(currentResults.items, {
        ...existingItem,
        ...backupCredential,
        ...credential,
        email,
        password: nextPassword,
        gptPassword,
        totpMfaSecret: nextTotpMfaSecret,
        verificationUrl,
        recordedAt,
        no2faFreeRoute,
        twoFactorEnabled,
        passkeyEnabled,
        passkeyEnabledAt: normalizeString(input.passkeyEnabledAt || credential.passkeyEnabledAt || backupCredential.passkeyEnabledAt || existingItem.passkeyEnabledAt), passkeyCredentialId,
        passkeyFactorId: normalizeString(input.passkeyFactorId || credential.passkeyFactorId || backupCredential.passkeyFactorId || existingItem.passkeyFactorId),
        passkeyRpId: normalizeString(input.passkeyRpId || credential.passkeyRpId || backupCredential.passkeyRpId || existingItem.passkeyRpId),
        passkeyUserHandle: normalizeString(input.passkeyUserHandle || credential.passkeyUserHandle || backupCredential.passkeyUserHandle || existingItem.passkeyUserHandle),
        passkeyPrivateJwk: passkeyPrivateJwk && typeof passkeyPrivateJwk === 'object' && !Array.isArray(passkeyPrivateJwk) ? passkeyPrivateJwk : null,
        passkeyPublicKeyCose: normalizeString(input.passkeyPublicKeyCose || credential.passkeyPublicKeyCose || backupCredential.passkeyPublicKeyCose || existingItem.passkeyPublicKeyCose), ...passkeyNumericMetadataPatch,
        passkeyApiPersisted: input.passkeyApiPersisted === true || credential.passkeyApiPersisted === true || backupCredential.passkeyApiPersisted === true || existingItem.passkeyApiPersisted === true,
        status: 'free',
        planType: 'free',
        checkedAt,
        reason,
        accessToken,
        accessTokenMasked: normalizeString(input.accessTokenMasked || credential.accessTokenMasked || existingItem.accessTokenMasked) || maskAccessToken(accessToken),
        accessTokenUpdatedAt,
        trialEligibilityStatus,
        trialEligibilityReason,
        trialEligibilityCheckedAt,
        trialEligibilityReasonCode,
        trialEligibilityCheckedByApi: input.trialEligibilityCheckedByApi === true || credential.trialEligibilityCheckedByApi === true || existingItem.trialEligibilityCheckedByApi === true,
        trialEligibilityTransientFailure,
        trialEligibilityRetryable,
        trialEligibilityRetryCount,
        trialEligibilityLastError,
        couponState,
        registrationType,
        registrationPhone,
        phoneVerified,
        accountId,
        responseEmail,
        jwtExpired,
        jwtExpiresInSeconds,
        upiChannelEligibilityStatus,
        upiChannelEligibilityReason,
        idealChannelEligibilityStatus,
        idealChannelEligibilityReason,
        pixChannelEligibilityStatus,
        pixChannelEligibilityReason,
        redeemStatus: nextRedeemStatus,
        redeemReason: nextRedeemReason,
        redeemFailureCount: nextRedeemFailureCount,
        redeemFailureLimit: hasRedeemField('redeemFailureLimit')
          ? normalizeRetryCount(getRedeemField('redeemFailureLimit'))
          : (shouldResetRedeemState ? REDEEM_CHANNEL_FAILURE_LIMIT : existingItem.redeemFailureLimit),
        upiRedeemFailureCount: hasRedeemField('upiRedeemFailureCount')
          ? normalizeRetryCount(getRedeemField('upiRedeemFailureCount'))
          : (shouldResetRedeemState ? 0 : existingItem.upiRedeemFailureCount),
        idealRedeemFailureCount: hasRedeemField('idealRedeemFailureCount')
          ? normalizeRetryCount(getRedeemField('idealRedeemFailureCount'))
          : (shouldResetRedeemState ? 0 : existingItem.idealRedeemFailureCount),
        pixRedeemFailureCount: hasRedeemField('pixRedeemFailureCount')
          ? normalizeRetryCount(getRedeemField('pixRedeemFailureCount'))
          : (shouldResetRedeemState ? 0 : existingItem.pixRedeemFailureCount),
        redeemLocked: hasRedeemField('redeemLocked') ? getRedeemField('redeemLocked') === true : (shouldResetRedeemState ? false : existingItem.redeemLocked),
        redeemLockedReason: hasRedeemField('redeemLockedReason') ? normalizeString(getRedeemField('redeemLockedReason')) : (shouldResetRedeemState ? '' : existingItem.redeemLockedReason),
        redeemLockedAt: hasRedeemField('redeemLockedAt') ? normalizeString(getRedeemField('redeemLockedAt')) : (shouldResetRedeemState ? '' : existingItem.redeemLockedAt),
        redeemChannel: nextRedeemChannel,
        redeemLastFailedAt: hasRedeemField('redeemLastFailedAt')
          ? normalizeString(getRedeemField('redeemLastFailedAt'))
          : (shouldResetRedeemState || existingItem.redeemStatus === 'success' ? '' : existingItem.redeemLastFailedAt),
        redeemAttemptedAt: hasRedeemField('redeemAttemptedAt') ? normalizeString(getRedeemField('redeemAttemptedAt')) : (shouldResetRedeemState ? '' : existingItem.redeemAttemptedAt),
        redeemSuccessAt: hasRedeemField('redeemSuccessAt') ? normalizeString(getRedeemField('redeemSuccessAt')) : (shouldResetRedeemState ? '' : existingItem.redeemSuccessAt),
        lastFailedUpiRedeemCdkey: hasRedeemField('lastFailedUpiRedeemCdkey') ? normalizeString(getRedeemField('lastFailedUpiRedeemCdkey')) : (shouldResetRedeemState ? '' : existingItem.lastFailedUpiRedeemCdkey),
        upiRedeemCdkey: nextRedeemCdkey,
        upiRedeemPendingVerifySince: hasRedeemField('upiRedeemPendingVerifySince') ? normalizeString(getRedeemField('upiRedeemPendingVerifySince')) : (shouldResetRedeemState ? '' : existingItem.upiRedeemPendingVerifySince),
        upiRedeemPendingVerifyLastCheckedAt: hasRedeemField('upiRedeemPendingVerifyLastCheckedAt') ? normalizeString(getRedeemField('upiRedeemPendingVerifyLastCheckedAt')) : (shouldResetRedeemState ? '' : existingItem.upiRedeemPendingVerifyLastCheckedAt),
        upiRedeemPendingVerifyLoggedAt: hasRedeemField('upiRedeemPendingVerifyLoggedAt') ? normalizeString(getRedeemField('upiRedeemPendingVerifyLoggedAt')) : (shouldResetRedeemState ? '' : existingItem.upiRedeemPendingVerifyLoggedAt),
        upiRedeemPendingVerifyReason: hasRedeemField('upiRedeemPendingVerifyReason') ? normalizeString(getRedeemField('upiRedeemPendingVerifyReason')) : (shouldResetRedeemState ? '' : existingItem.upiRedeemPendingVerifyReason),
        membershipOverrideStatus: hasRedeemField('membershipOverrideStatus')
          ? normalizeString(getRedeemField('membershipOverrideStatus'))
          : (shouldResetRedeemState ? 'free' : existingItem.membershipOverrideStatus),
        membershipOverrideCheckedAt: hasRedeemField('membershipOverrideCheckedAt')
          ? normalizeString(getRedeemField('membershipOverrideCheckedAt'))
          : (shouldResetRedeemState ? checkedAt : existingItem.membershipOverrideCheckedAt),
        ...(hasRedeemField('upiRedeemSubscriptionActive') || shouldResetRedeemState || Object.prototype.hasOwnProperty.call(existingItem, 'upiRedeemSubscriptionActive')
          ? {
              upiRedeemSubscriptionActive: hasRedeemField('upiRedeemSubscriptionActive')
                ? getRedeemField('upiRedeemSubscriptionActive') === true
                : (shouldResetRedeemState ? false : existingItem.upiRedeemSubscriptionActive),
            }
          : {}),
        ...(hasRedeemField('upiRedeemSubscriptionPlanType') || shouldResetRedeemState || Object.prototype.hasOwnProperty.call(existingItem, 'upiRedeemSubscriptionPlanType')
          ? {
              upiRedeemSubscriptionPlanType: hasRedeemField('upiRedeemSubscriptionPlanType')
                ? normalizePlanType(getRedeemField('upiRedeemSubscriptionPlanType'))
                : (shouldResetRedeemState ? '' : existingItem.upiRedeemSubscriptionPlanType),
            }
          : {}),
        ...(hasRedeemField('upiRedeemSubscriptionCheckedAt') || shouldResetRedeemState || Object.prototype.hasOwnProperty.call(existingItem, 'upiRedeemSubscriptionCheckedAt')
          ? {
              upiRedeemSubscriptionCheckedAt: hasRedeemField('upiRedeemSubscriptionCheckedAt')
                ? normalizeString(getRedeemField('upiRedeemSubscriptionCheckedAt'))
                : (shouldResetRedeemState ? '' : existingItem.upiRedeemSubscriptionCheckedAt),
            }
          : {}),
      });
      return saveResults({
        ...currentResults,
        items: nextItems,
        redeemAutoDeletedEmails: nextRedeemAutoDeletedEmails,
        redeemPlusDeletedEmailsByChannel: nextRedeemPlusDeletedEmailsByChannel,
        updatedAt: checkedAt,
        source: source || normalizeString(currentResults.source || 'registration-upi-eligibility'),
        total: Math.max(currentResults.total || 0, nextItems.length),
        completed: Math.max(currentResults.completed || 0, nextItems.length),
      });
    }

    async function pruneIneligibleFreeUpiCredentialMembership(input = {}) {
      if (isBatchRunning()) {
        throw new Error('UPI 备份账号会员核验正在运行，请等待完成或先停止。');
      }
      if (isRedeemRunning() || isCdkeyRetryRunning()) {
        throw new Error('UPI 无会员账号补兑/CDK 重试正在运行，请等待完成或先停止。');
      }
      if (typeof checkUpiRedeemAccessTokenEligibility !== 'function') {
        throw new Error('UPI 试用资格检查能力尚未接入。');
      }

      const requestedCredentials = resolveInputCredentials(input)
        .filter((credential) => credential.email);
      const source = normalizeString(input.source || 'free-trial-eligibility');
      setBatchRunning(true);
      setBatchStopRequested(false);
      const startedAt = new Date().toISOString();
      let currentResults = await getStoredResults();
      let items = mergeCredentialsIntoResultItems(currentResults.items, requestedCredentials);
      const kept = [];
      const skipped = [];
      const failed = [];
      const ineligibleEmails = [];

      const saveProgress = async (stage = 'token', email = '') => {
        currentResults = await saveResults({
          ...currentResults,
          items,
          running: true,
          updatedAt: new Date().toISOString(),
          flowStage: stage,
          flowStageEmail: normalizeEmail(email),
          source: source || currentResults.source,
          total: requestedCredentials.length,
          completed: kept.length + skipped.length + failed.length,
        });
      };

      try {
        if (!requestedCredentials.length) {
          return await saveResults({
            ...currentResults,
            items,
            running: false,
            updatedAt: startedAt,
            finishedAt: startedAt,
            flowStage: '',
            flowStageEmail: '',
          });
        }

        await addLog(`UPI Free 分组试用资格检测：开始检测 ${requestedCredentials.length} 个账号，无资格会标记到邮箱池并移出 Free，不会删除邮箱本身。`, 'info');
        const runtimeState = {
          ...(await getState()),
          ...(input.settings || {}),
        };

        for (const credential of requestedCredentials) {
          throwIfMembershipStopRequested('check');
          const email = normalizeEmail(credential.email);
          const checkedAt = new Date().toISOString();
          if (!email) {
            continue;
          }
          const existingItem = items.find((item) => normalizeEmail(item?.email) === email) || {};
          const activeCredential = normalizeResultItem({
            ...existingItem,
            ...credential,
            email,
            status: 'free',
            planType: 'free',
            checkedAt,
          });

          if (!activeCredential.password || !activeCredential.totpMfaSecret) {
            const reason = !activeCredential.password ? '缺少 GPT 密码，无法检测试用资格' : '缺少 2FA 密钥，无法检测试用资格';
            skipped.push({ email, reason });
            items = upsertResultItem(items, {
              ...activeCredential,
              status: 'free',
              planType: 'free',
              reason,
              trialEligibilityStatus: 'skipped',
              trialEligibilityReason: reason,
              trialEligibilityCheckedAt: checkedAt,
            });
            await saveProgress('token', email);
            await addLog(`UPI Free 分组试用资格检测：${email} -> 跳过：${reason}`, 'warn');
            continue;
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
            throwIfMembershipStopRequested('check');
            if (!hasChatGptSessionPayload(session.session || session)) {
              throw new Error('未读取到 ChatGPT session');
            }
            await saveProgress('subscription-check', email);
            const eligibility = await checkUpiRedeemAccessTokenEligibility({
              state: {
                ...runtimeState,
                ...currentResults,
              },
              credential: activeCredential,
              session: session.session || session,
              accessToken: session.accessToken,
              cdkey: input.cdkey,
              expectedEmail: email,
            });
            const reason = eligibility?.item?.message || eligibility?.item?.reason || '账号有试用资格';
            kept.push({ email, reason });
            items = upsertResultItem(items, {
              ...activeCredential,
              status: 'free',
              planType: 'free',
              reason,
              accessToken: session.accessToken,
              accessTokenMasked: maskAccessToken(session.accessToken),
              accessTokenUpdatedAt: checkedAt,
              trialEligibilityStatus: 'eligible',
              trialEligibilityReason: reason,
              trialEligibilityCheckedAt: checkedAt,
            });
            await saveProgress('subscription-check', email);
            await addLog(`UPI Free 分组试用资格检测：${email} -> 有试用资格。`, 'ok');
          } catch (error) {
            const reason = getErrorMessage(error) || '试用资格检测失败';
            if (isUpiTrialIneligibleError(error)) {
              ineligibleEmails.push(email);
              failed.push({ email, reason, trialEligibilityStatus: 'ineligible' });
              const markerResult = typeof markRegistrationEmailTrialIneligible === 'function'
                ? await markRegistrationEmailTrialIneligible({
                    ...runtimeState,
                    ...activeCredential,
                    email,
                  }, {
                    email,
                    reason,
                    checkedAt,
                    logPrefix: 'UPI Free 分组试用资格检测',
                    level: 'warn',
                  })
                : { updated: false };
              items = markerResult?.updated
                ? items.filter((item) => normalizeEmail(item?.email) !== email)
                : upsertResultItem(items, {
                    ...activeCredential,
                    status: 'free',
                    planType: 'free',
                    reason,
                    redeemStatus: 'blocked',
                    redeemReason: `账号无试用资格：${reason}`,
                    trialEligibilityStatus: 'ineligible',
                    trialEligibilityReason: reason,
                    trialEligibilityCheckedAt: checkedAt,
                  });
              await saveProgress('subscription-check', email);
              await addLog(
                markerResult?.updated
                  ? `UPI Free 分组试用资格检测：${email} -> 无试用资格，已在邮箱池标记并移出 Free，不再参与兑换。原因：${reason}`
                  : `UPI Free 分组试用资格检测：${email} -> 无试用资格，但没有找到源邮箱池条目，已在 Free 中标记为不可兑换。原因：${reason}`,
                'warn'
              );
              continue;
            }
            failed.push({ email, reason });
            items = upsertResultItem(items, {
              ...activeCredential,
              status: 'free',
              planType: 'free',
              reason,
              trialEligibilityStatus: 'failed',
              trialEligibilityReason: reason,
              trialEligibilityCheckedAt: checkedAt,
            });
            await saveProgress('subscription-check', email);
            await addLog(`UPI Free 分组试用资格检测：${email} -> 检测失败，保留账号：${reason}`, 'warn');
          }
        }

        const finishedAt = new Date().toISOString();
        const finalResults = await saveResults({
          ...currentResults,
          items,
          running: false,
          updatedAt: finishedAt,
          finishedAt,
          flowStage: '',
          flowStageEmail: '',
          source: source || currentResults.source,
          total: items.length,
          completed: items.length,
          trialEligibilitySummary: {
            checkedAt: finishedAt,
            kept,
            skipped,
            failed,
            deletedEmails: [],
            ineligibleEmails,
            eligibleCount: kept.length,
            skippedCount: skipped.length,
            failedCount: failed.length,
            deletedCount: 0,
            ineligibleCount: ineligibleEmails.length,
          },
        });
        await addLog(
          `UPI Free 分组试用资格检测：完成，有资格 ${kept.length}，无试用资格 ${ineligibleEmails.length}，跳过 ${skipped.length}，失败 ${Math.max(0, failed.length - ineligibleEmails.length)}。`,
          'ok'
        );
        return {
          results: finalResults,
          deletedEmails: [],
          ineligibleEmails,
          kept,
          skipped,
          failed,
        };
      } catch (error) {
        const stoppedAt = new Date().toISOString();
        await saveResults({
          ...currentResults,
          items,
          running: false,
          updatedAt: stoppedAt,
          stoppedAt,
          flowStage: currentResults.flowStage,
          flowStageEmail: currentResults.flowStageEmail,
          source: source || currentResults.source,
        }).catch(() => null);
        throw error;
      } finally {
        setBatchRunning(false);
      }
    }

    return {
      pruneIneligibleFreeUpiCredentialMembership,
      upsertTrialEligibleFreeCredential,
    };
  }

  return {
    createFreePoolService,
  };
});
