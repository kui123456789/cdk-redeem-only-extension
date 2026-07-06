(function attachNo2faFreeRouteExecutor(root, factory) {
  root.MultiPageBackgroundNo2faFreeRoute = factory();
})(typeof self !== 'undefined' ? self : globalThis, function createNo2faFreeRouteModule() {
  function normalizeString(value = '') {
    return String(value || '').trim();
  }

  function normalizeEmail(value = '') {
    return normalizeString(value).toLowerCase();
  }

  function normalizeTimestamp(value, fallback = Date.now()) {
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric > 0) {
      return Math.floor(numeric > 1000000000000 ? numeric / 1000 : numeric);
    }
    const parsed = Date.parse(String(value || ''));
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.floor(parsed / 1000);
    }
    const fallbackNumber = Number(fallback) || Date.now();
    return Math.max(1, Math.floor(fallbackNumber > 1000000000000 ? fallbackNumber / 1000 : fallbackNumber));
  }

  function decodeJwtPayload(token = '') {
    const rawPayload = normalizeString(token).split('.')[1] || '';
    if (!rawPayload) {
      return null;
    }
    try {
      const padded = rawPayload.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(rawPayload.length / 4) * 4, '=');
      const json = typeof atob === 'function'
        ? atob(padded)
        : Buffer.from(padded, 'base64').toString('utf8');
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  function getAccessTokenIssuedAtSeconds(token = '') {
    const payload = decodeJwtPayload(token);
    const issuedAt = Number(payload?.iat);
    return Number.isFinite(issuedAt) && issuedAt > 0 ? normalizeTimestamp(issuedAt, 0) : 0;
  }

  function getSessionEmail(session = {}) {
    return normalizeEmail(
      session?.user?.email
      || session?.email
      || session?.account?.email
      || session?.profile?.email
      || ''
    );
  }

  function isValidEmail(value = '') {
    return /^[^\s@:/?#]+@[^\s@:/?#]+\.[^\s@:/?#]+$/.test(normalizeEmail(value));
  }

  function normalizeVerificationUrl(value = '') {
    const raw = normalizeString(value);
    if (!/^https?:\/\//i.test(raw)) {
      return '';
    }
    try {
      const parsed = new URL(raw);
      return /^https?:$/i.test(parsed.protocol) ? parsed.toString() : '';
    } catch {
      return '';
    }
  }

  function normalizeAssurivoOpenVerificationUrl(value = '') {
    const normalizedUrl = normalizeVerificationUrl(value);
    if (!normalizedUrl) {
      return '';
    }
    try {
      const parsed = new URL(normalizedUrl);
      if (
        parsed.hostname.toLowerCase() !== 'assurivo.com'
        || !['/console/open.php', '/console/feed.php'].includes(parsed.pathname)
      ) {
        return '';
      }
      parsed.pathname = '/console/open.php';
      return parsed.toString();
    } catch {
      return '';
    }
  }

  function normalizeVerificationUrlForFreeRecord(value = '') {
    const normalizedUrl = normalizeVerificationUrl(value);
    return normalizeAssurivoOpenVerificationUrl(normalizedUrl) || normalizedUrl;
  }

  function getEmailFromVerificationUrl(value = '') {
    const normalizedUrl = normalizeVerificationUrl(value);
    if (!normalizedUrl) {
      return '';
    }
    try {
      const parsed = new URL(normalizedUrl);
      const email = normalizeEmail(parsed.searchParams.get('mail') || parsed.searchParams.get('email') || '');
      return isValidEmail(email) ? email : '';
    } catch {
      return '';
    }
  }

  function splitPoolEntrySource(value = []) {
    if (Array.isArray(value)) {
      return value;
    }
    return normalizeString(value).split(/[\r\n]+/).map((line) => line.trim()).filter(Boolean);
  }

  function getFirstVerificationUrlFromParts(parts = []) {
    for (const part of parts) {
      const verificationUrl = normalizeVerificationUrlForFreeRecord(part);
      if (verificationUrl) {
        return verificationUrl;
      }
    }
    return '';
  }

  function buildAssurivoOpenUrlFromCredential(value = '', fallbackEmail = '', state = {}) {
    const raw = normalizeString(value);
    if (!raw) {
      return '';
    }
    const directUrl = normalizeVerificationUrlForFreeRecord(raw);
    if (directUrl) {
      return directUrl;
    }
    const parts = raw.split(/-{3,}/).map((part) => part.trim()).filter(Boolean);
    if (parts.length < 2) {
      return '';
    }
    const urlFromParts = getFirstVerificationUrlFromParts(parts.slice(1));
    if (urlFromParts) {
      return urlFromParts;
    }
    const email = isValidEmail(parts[0]) ? normalizeEmail(parts[0]) : normalizeEmail(fallbackEmail);
    const pwd = normalizeString(parts[1]);
    if (!email || !pwd) {
      return '';
    }
    const limit = Math.max(1, Math.min(20, Math.floor(Number(state?.assurivoMailLimit) || 5)));
    const url = new URL('https://assurivo.com/console/open.php');
    url.searchParams.set('mail', email);
    url.searchParams.set('pwd', pwd);
    url.searchParams.set('limit', String(limit));
    return url.toString();
  }

  function getEmailFromCredential(value = '') {
    const raw = normalizeString(value);
    if (!raw) {
      return '';
    }
    const parts = raw.split(/-{3,}/).map((part) => part.trim()).filter(Boolean);
    const candidate = parts.length ? parts[0] : raw;
    return isValidEmail(candidate) ? normalizeEmail(candidate) : '';
  }

  function createNo2faFreeRouteExecutor(deps = {}) {
    const {
      addLog = async () => {},
      checkRegistrationUpiTrialEligibility = null,
      completeNodeFromBackground = async () => {},
      getCustomEmailPoolEntries = null,
      getState = async () => ({}),
      markCurrentRegistrationAccountUsed = null,
      readCurrentChatGptSessionForExport = null,
      setState = async () => {},
      throwIfStopped = () => {},
    } = deps;

    async function addStepLog(message, level = 'info') {
      return addLog(message, level, {
        step: 6,
        stepKey: 'persist-no-2fa-free',
        nodeId: 'persist-no-2fa-free',
      });
    }

    function resolveVerificationUrl(state = {}, email = '') {
      const direct = normalizeVerificationUrlForFreeRecord(
        state.verificationUrl
        || state.emailVerificationUrl
        || state.currentVerificationUrl
        || state.currentEmailVerificationUrl
        || ''
      );
      if (direct) {
        return direct;
      }

      const entries = typeof getCustomEmailPoolEntries === 'function'
        ? getCustomEmailPoolEntries(state)
        : [];
      const rawEntries = [
        ...entries,
        ...splitPoolEntrySource(state.customEmailPoolEntries),
        ...splitPoolEntrySource(state.customEmailPool),
      ];
      const normalizedEmail = normalizeEmail(email);
      const matched = rawEntries.find((rawEntry) => {
        const entry = rawEntry && typeof rawEntry === 'object' ? rawEntry : { credential: rawEntry, email: rawEntry };
        const candidateUrl = normalizeVerificationUrlForFreeRecord(
          entry?.verificationUrl
          || entry?.emailVerificationUrl
          || entry?.url
          || entry?.fetchUrl
          || entry?.codeUrl
          || entry?.queryUrl
          || ''
        ) || buildAssurivoOpenUrlFromCredential(entry?.credential || entry?.email || '', entry?.email, state);
        const explicitEmailSource = entry?.email || entry?.mail || entry?.address || '';
        const explicitEmail = getEmailFromCredential(explicitEmailSource) || normalizeEmail(explicitEmailSource);
        const entryEmail = (isValidEmail(explicitEmail) ? explicitEmail : '')
          || getEmailFromVerificationUrl(candidateUrl)
          || getEmailFromCredential(entry?.credential);
        return entryEmail && entryEmail === normalizedEmail;
      });
      if (!matched) {
        return '';
      }
      const matchedEntry = matched && typeof matched === 'object' ? matched : { credential: matched, email: matched };
      return normalizeVerificationUrlForFreeRecord(
        matchedEntry?.verificationUrl
        || matchedEntry?.emailVerificationUrl
        || matchedEntry?.url
        || matchedEntry?.fetchUrl
        || matchedEntry?.codeUrl
        || matchedEntry?.queryUrl
        || ''
      ) || buildAssurivoOpenUrlFromCredential(matchedEntry?.credential || matchedEntry?.email || '', normalizedEmail, state);
    }

    async function executeNo2faFreeRoute(state = {}) {
      throwIfStopped();
      const latestState = {
        ...(await getState().catch(() => ({}))),
        ...(state || {}),
      };
      await addStepLog('免 2FA Free 路线：第 5 步完成，开始读取邮箱、取码链接和 AT。', 'info');
      if (typeof readCurrentChatGptSessionForExport !== 'function') {
        throw new Error('免 2FA Free 路线缺少 ChatGPT session 读取能力。');
      }
      if (typeof checkRegistrationUpiTrialEligibility !== 'function') {
        throw new Error('免 2FA Free 路线缺少 UPI 试用资格检测能力。');
      }

      const sessionResult = await readCurrentChatGptSessionForExport();
      const session = sessionResult?.session || {};
      const accessToken = normalizeString(sessionResult?.accessToken || session?.accessToken);
      const email = getSessionEmail(session)
        || normalizeEmail(latestState.email)
        || normalizeEmail(latestState.registrationEmailState?.current)
        || normalizeEmail(latestState.selectedCustomEmailPoolEmail);
      if (!email) {
        throw new Error('免 2FA Free 路线未读取到当前 ChatGPT 邮箱。');
      }
      if (!accessToken) {
        throw new Error(`免 2FA Free 路线未读取到 ${email} 的 AT，账号未进入 Free。`);
      }

      const verificationUrl = resolveVerificationUrl(latestState, email);
      if (!verificationUrl) {
        throw new Error(`免 2FA Free 路线未找到 ${email} 的邮箱取码链接，账号未进入 Free。`);
      }

      const recordedAt = getAccessTokenIssuedAtSeconds(accessToken)
        || normalizeTimestamp(latestState.no2faFreeRecordedAt);
      await setState({
        email,
        verificationUrl,
        no2faFreeRecordedAt: recordedAt,
        upiRedeemAccessToken: accessToken,
      });

      if (typeof markCurrentRegistrationAccountUsed === 'function') {
        await markCurrentRegistrationAccountUsed({
          ...latestState,
          email,
          verificationUrl,
          no2faFreeRecordedAt: recordedAt,
          upiRedeemAccessToken: accessToken,
          accessToken,
          accessTokenUpdatedAt: new Date().toISOString(),
        }, {
          logPrefix: '免 2FA Free 路线已读取 AT',
          level: 'ok',
          preferProvidedState: true,
        });
      }

      const eligibility = await checkRegistrationUpiTrialEligibility({
        state: latestState,
        email,
        session,
        accessToken,
        visibleStep: 6,
        patch: {
          email,
          verificationUrl,
          recordedAt,
          no2faFreeRoute: true,
          twoFactorEnabled: false,
          password: '',
          gptPassword: '',
          totpMfaSecret: '',
        },
      });
      if (!eligibility?.eligible) {
        throw new Error(`免 2FA Free 路线：账号未通过 UPI 试用资格检测，未进入 Free：${eligibility?.reason || '未知原因'}`);
      }

      await addStepLog(`免 2FA Free 路线：已检测到 UPI 试用资格，写入 Free：${email}。`, 'ok');
      if (typeof markCurrentRegistrationAccountUsed === 'function') {
        await markCurrentRegistrationAccountUsed({
          ...latestState,
          email,
          verificationUrl,
          no2faFreeRecordedAt: recordedAt,
          accessToken,
          upiRedeemAccessToken: accessToken,
        }, {
          logPrefix: '免 2FA Free 路线',
          level: 'ok',
          preferProvidedState: true,
        });
      }
      await completeNodeFromBackground('persist-no-2fa-free', {
        email,
        accessToken,
        verificationUrl,
        recordedAt,
        trialEligibilityStatus: 'eligible',
      });
      return eligibility;
    }

    return {
      executeNo2faFreeRoute,
      resolveVerificationUrl,
    };
  }

  return {
    createNo2faFreeRouteExecutor,
  };
});
