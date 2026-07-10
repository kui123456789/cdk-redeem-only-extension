(function attachCustomEmailPoolState(root, factory) {
  const api = factory();
  root.MultiPageCustomEmailPoolState = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof self !== 'undefined' ? self : globalThis, function createCustomEmailPoolStateRegistry() {
  function wrapDependency(fn) {
    return typeof fn === 'function' ? (...args) => fn(...args) : undefined;
  }

  function createCustomEmailPoolState(deps = {}) {
    const parseCustomEmailPoolEntryValue = typeof deps.parseCustomEmailPoolEntryValue === 'function'
      ? deps.parseCustomEmailPoolEntryValue
      : null;
    const parseHiddenEmailCredential = typeof deps.parseHiddenEmailCredential === 'function'
      ? deps.parseHiddenEmailCredential
      : (value = '') => {
        const raw = String(value || '').trim();
        const separatorIndex = raw.indexOf('----');
        const emailSource = separatorIndex >= 0 ? raw.slice(0, separatorIndex) : raw;
        return {
          email: emailSource.trim().toLowerCase(),
          credential: separatorIndex >= 0 ? raw : '',
        };
      };
    const hasCustomEmailVerificationUrlNormalizer = typeof deps.normalizeCustomEmailVerificationUrl === 'function';
    const normalizeCustomEmailVerificationUrl = hasCustomEmailVerificationUrlNormalizer
      ? deps.normalizeCustomEmailVerificationUrl
      : (value = '') => {
        const raw = String(value || '').trim();
        return /^https?:\/\//i.test(raw) ? raw : '';
      };
    const normalizeEmailGenerator = typeof deps.normalizeEmailGenerator === 'function'
      ? deps.normalizeEmailGenerator
      : (value = '') => String(value || '').trim().toLowerCase();
    const getCustomEmailPoolGeneratorName = typeof deps.getCustomEmailPoolGeneratorName === 'function'
      ? deps.getCustomEmailPoolGeneratorName
      : () => 'custom-pool';
    const getState = wrapDependency(deps.getState) || (async () => ({}));
    const setState = wrapDependency(deps.setState) || (async () => undefined);
    const setPersistentSettings = wrapDependency(deps.setPersistentSettings) || (async () => undefined);
    const broadcastDataUpdate = wrapDependency(deps.broadcastDataUpdate) || (() => undefined);
    const addLog = wrapDependency(deps.addLog) || (async () => undefined);

    function splitCustomEmailPoolEntrySource(value = []) {
      return Array.isArray(value)
        ? value
        : String(value || '').split(/[\r\n,，;；]+/);
    }

    function normalizeCustomEmailPool(value = []) {
      const source = splitCustomEmailPoolEntrySource(value);

      return source
        .map((item) => {
          const rawValue = item && typeof item === 'object'
            ? (item.credential || item.email || '')
            : item;
          if (parseCustomEmailPoolEntryValue) {
            return parseCustomEmailPoolEntryValue(rawValue).email;
          }
          return parseHiddenEmailCredential(rawValue).email;
        })
        .filter((item) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item));
    }

    function normalizeCustomMailProviderPoolEntries(value = []) {
      const source = splitCustomEmailPoolEntrySource(value);
      const seenEmails = new Set();
      const entries = [];

      for (const item of source) {
        const rawValue = item && typeof item === 'object'
          ? (item.credential || item.email || '')
          : item;
        const rawText = String(rawValue || '').trim();
        if (!rawText) {
          continue;
        }
        const parsed = parseCustomEmailPoolEntryValue
          ? parseCustomEmailPoolEntryValue(rawText)
          : parseHiddenEmailCredential(rawText);
        const email = String(parsed?.email || '').trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || seenEmails.has(email)) {
          continue;
        }
        seenEmails.add(email);
        entries.push(rawText.includes('----') ? rawText : email);
      }

      return entries;
    }

    function parseCustomEmailPoolEntryForState(value = '') {
      if (parseCustomEmailPoolEntryValue) {
        return parseCustomEmailPoolEntryValue(value);
      }
      const parsedCredential = parseHiddenEmailCredential(value);
      return {
        email: parsedCredential.email,
        credential: parsedCredential.credential,
        verificationUrl: '',
      };
    }

    function normalizeCustomEmailVerificationUrlForState(value = '') {
      if (hasCustomEmailVerificationUrlNormalizer) {
        return normalizeCustomEmailVerificationUrl(value);
      }
      const raw = String(value || '').trim();
      return /^https?:\/\//i.test(raw) ? raw : '';
    }

    function normalizeCustomEmailPoolTrialEligibilityStatus(value = '') {
      const normalized = String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
      if (['ineligible', 'not_eligible', 'no_trial', 'trial_ineligible', 'rejected'].includes(normalized)) return 'ineligible';
      if (['eligible', 'trial_eligible', 'ok', 'passed'].includes(normalized)) return 'eligible';
      if (['failed', 'error', 'unknown'].includes(normalized)) return 'failed';
      return '';
    }

    function isCustomEmailPoolEntryTrialIneligible(entry = {}) {
      return normalizeCustomEmailPoolTrialEligibilityStatus(entry?.trialEligibilityStatus) === 'ineligible';
    }

    function isCustomEmailPoolEntryRegistrationBlocked(entry = {}) {
      return entry?.registrationBlocked === true;
    }

    function isCustomEmailPoolEntryAvailable(entry = {}) {
      return Boolean(entry?.enabled)
        && !entry?.used
        && !isCustomEmailPoolEntryTrialIneligible(entry)
        && !isCustomEmailPoolEntryRegistrationBlocked(entry);
    }

    function getNextAvailableCustomEmailPoolEmail(entries = [], currentEmail = '') {
      const normalizedCurrentEmail = String(currentEmail || '').trim().toLowerCase();
      const startIndex = entries.findIndex((entry) => entry.email === normalizedCurrentEmail);
      const orderedEntries = startIndex >= 0
        ? entries.slice(startIndex + 1).concat(entries.slice(0, startIndex))
        : entries;
      const nextEntry = orderedEntries.find((entry) => {
        return entry.email !== normalizedCurrentEmail && isCustomEmailPoolEntryAvailable(entry);
      });
      return String(nextEntry?.email || '').trim().toLowerCase();
    }

    function maskCustomEmailPoolAccessToken(token = '') {
      const raw = String(token || '').trim();
      if (!raw) {
        return '';
      }
      if (raw.length <= 16) {
        return `${raw.slice(0, 4)}****${raw.slice(-4)}`;
      }
      return `${raw.slice(0, 8)}****${raw.slice(-6)}`;
    }

    function normalizeCustomEmailPoolEntryObjects(value = []) {
      const source = splitCustomEmailPoolEntrySource(value);
      const seenEmails = new Set();
      const entries = [];

      for (const rawEntry of source) {
        const asObject = rawEntry && typeof rawEntry === 'object'
          ? rawEntry
          : { email: rawEntry };
        const parsedEntry = parseCustomEmailPoolEntryForState(asObject.credential || asObject.email || '');
        const email = parsedEntry.email;
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          continue;
        }
        if (seenEmails.has(email)) {
          continue;
        }
        seenEmails.add(email);
        const accessToken = String(asObject.accessToken || asObject.access_token || asObject.upiRedeemAccessToken || '').trim();
        const accessTokenMasked = String(asObject.accessTokenMasked || '').trim()
          || (accessToken ? maskCustomEmailPoolAccessToken(accessToken) : '');
        const note = String(asObject.note || '').trim();
        const manualSkipped = asObject.manualSkipped === true || note === '手动跳过';
        entries.push({
          id: String(asObject.id || `custom-pool-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`),
          email,
          credential: parsedEntry.verificationUrl ? '' : (parsedEntry.credential || String(asObject.credential || '').trim()),
          verificationUrl: normalizeCustomEmailVerificationUrlForState(asObject.verificationUrl || asObject.url || parsedEntry.verificationUrl || ''),
          enabled: asObject.enabled !== undefined ? Boolean(asObject.enabled) : true,
          used: Boolean(asObject.used) && (Boolean(accessToken) || manualSkipped),
          manualSkipped,
          note,
          lastUsedAt: Number.isFinite(Number(asObject.lastUsedAt)) ? Number(asObject.lastUsedAt) : 0,
          registrationBlocked: asObject.registrationBlocked === true,
          registrationBlockedReason: String(asObject.registrationBlockedReason || '').trim(),
          registrationBlockedReasonCode: String(asObject.registrationBlockedReasonCode || '').trim(),
          registrationBlockedAt: String(asObject.registrationBlockedAt || '').trim(),
          accessToken,
          accessTokenMasked,
          accessTokenUpdatedAt: String(asObject.accessTokenUpdatedAt || asObject.tokenUpdatedAt || asObject.checkedAt || '').trim(),
          trialEligibilityStatus: normalizeCustomEmailPoolTrialEligibilityStatus(asObject.trialEligibilityStatus),
          trialEligibilityReason: String(asObject.trialEligibilityReason || '').trim(),
          trialEligibilityReasonCode: String(asObject.trialEligibilityReasonCode || '').trim(),
          trialEligibilityCheckedAt: String(asObject.trialEligibilityCheckedAt || '').trim(),
          trialEligibilityRetryable: asObject.trialEligibilityRetryable === true,
          trialEligibilityTransientFailure: asObject.trialEligibilityTransientFailure === true,
          trialEligibilityLastError: String(asObject.trialEligibilityLastError || '').trim(),
        });
      }

      return entries;
    }

    function isCustomEmailPoolGenerator(stateOrValue = {}) {
      const generator = typeof stateOrValue === 'string'
        ? stateOrValue
        : stateOrValue?.emailGenerator;
      return normalizeEmailGenerator(generator) === getCustomEmailPoolGeneratorName();
    }

    function getCustomEmailPool(state = {}) {
      const entries = normalizeCustomEmailPoolEntryObjects(state?.customEmailPoolEntries);
      if (entries.length > 0) {
        return entries
          .filter(isCustomEmailPoolEntryAvailable)
          .map((entry) => entry.email);
      }
      return normalizeCustomEmailPool(state?.customEmailPool);
    }

    function buildCustomEmailPoolRecoveryPatch(runtimeState = {}, persistedState = {}) {
      if (!isCustomEmailPoolGenerator(runtimeState) && !isCustomEmailPoolGenerator(persistedState)) {
        return null;
      }

      // A populated runtime pool may include newer used/blocked flags than storage.
      // Only recover when the runtime copy has disappeared completely.
      if (getCustomEmailPoolEntries(runtimeState).length > 0) {
        return null;
      }

      const persistedEntries = getCustomEmailPoolEntries(persistedState);
      const availableEmails = getCustomEmailPool(persistedState);
      if (persistedEntries.length === 0 || availableEmails.length === 0) {
        return null;
      }

      const runtimeSelectedEmail = String(runtimeState?.selectedCustomEmailPoolEmail || '').trim().toLowerCase();
      const persistedSelectedEmail = String(persistedState?.selectedCustomEmailPoolEmail || '').trim().toLowerCase();
      const selectedEmail = availableEmails.includes(runtimeSelectedEmail)
        ? runtimeSelectedEmail
        : availableEmails.includes(persistedSelectedEmail)
          ? persistedSelectedEmail
          : availableEmails[0];

      return {
        customEmailPoolEntries: persistedEntries,
        customEmailPool: availableEmails,
        selectedCustomEmailPoolEmail: selectedEmail,
      };
    }

    function getCustomEmailPoolEntries(state = {}) {
      const entries = normalizeCustomEmailPoolEntryObjects(state?.customEmailPoolEntries);
      if (entries.length > 0) {
        return entries;
      }
      return normalizeCustomEmailPoolEntryObjects(state?.customEmailPool);
    }

    function getCustomEmailPoolCredentialForEmail(state = {}, email = '') {
      const normalizedEmail = String(email || '').trim().toLowerCase();
      if (!normalizedEmail) return '';
      const entry = getCustomEmailPoolEntries(state).find((item) => item.email === normalizedEmail);
      return String(entry?.credential || '').trim();
    }

    function hasCustomEmailPoolEntryForEmail(state = {}, email = '') {
      const normalizedEmail = String(email || '').trim().toLowerCase();
      if (!normalizedEmail) return false;
      return getCustomEmailPoolEntries(state).some((entry) => entry.email === normalizedEmail);
    }

    function mergeCustomEmailPoolStateForTarget(currentState = {}, providedState = {}, email = '') {
      const currentPatch = currentState && typeof currentState === 'object' ? currentState : {};
      const providedPatch = providedState && typeof providedState === 'object' ? providedState : {};
      const latestState = {
        ...currentPatch,
        ...providedPatch,
      };
      const normalizedEmail = String(email || '').trim().toLowerCase();
      const currentEntries = getCustomEmailPoolEntries(currentPatch);
      if (!currentEntries.length) {
        return latestState;
      }

      return {
        ...latestState,
        // Step payloads may include only the account currently being processed.
        // Never let that partial snapshot replace the full persisted email pool.
        customEmailPoolEntries: currentEntries,
        customEmailPool: getCustomEmailPool(currentPatch),
        ...(Object.prototype.hasOwnProperty.call(currentPatch, 'selectedCustomEmailPoolEmail')
          ? { selectedCustomEmailPoolEmail: currentPatch.selectedCustomEmailPoolEmail }
          : {}),
      };
    }

    async function markCustomEmailPoolEntryTrialEligibility(state = {}, options = {}) {
      const providedState = state && typeof state === 'object' ? state : {};
      const currentState = await getState();
      const currentStatePatch = currentState && typeof currentState === 'object' ? currentState : {};
      const currentEmail = String(options.email || providedState?.email || currentStatePatch?.email || '').trim().toLowerCase();
      if (!currentEmail) {
        return { updated: false };
      }
      const latestState = mergeCustomEmailPoolStateForTarget(currentStatePatch, providedState, currentEmail);

      const entries = getCustomEmailPoolEntries(latestState);
      if (!entries.length) {
        return { updated: false };
      }

      const status = normalizeCustomEmailPoolTrialEligibilityStatus(options.status || options.trialEligibilityStatus);
      const reason = String(options.reason || options.trialEligibilityReason || '').trim();
      const reasonCode = String(options.reasonCode || options.trialEligibilityReasonCode || '').trim();
      const checkedAt = String(options.checkedAt || options.trialEligibilityCheckedAt || new Date().toISOString()).trim();
      const accessToken = String(options.accessToken || options.token || options.access_token || latestState.accessToken || latestState.upiRedeemAccessToken || '').trim();
      const accessTokenMasked = String(options.accessTokenMasked || '').trim()
        || (accessToken ? maskCustomEmailPoolAccessToken(accessToken) : '');
      const accessTokenUpdatedAt = String(options.accessTokenUpdatedAt || checkedAt || '').trim();
      const selectedEmail = String(latestState?.selectedCustomEmailPoolEmail || '').trim().toLowerCase();
      const shouldAdvanceSelectedEmail = options.clearSelectedEmail !== false && (
        selectedEmail === currentEmail
        || options.markUsed === true
        || status === 'ineligible'
      );
      let matched = false;
      let changed = false;

      const nextEntries = entries.map((entry) => {
        if (entry.email !== currentEmail) {
          return entry;
        }
        matched = true;
        const nextEntry = { ...entry };
        const entryAccessToken = accessToken || String(entry.accessToken || entry.token || entry.access_token || entry.upiRedeemAccessToken || '').trim();
        const canMarkUsed = Boolean(entryAccessToken) || options.manualSkipped === true;
        if (status) {
          nextEntry.trialEligibilityStatus = status;
          nextEntry.trialEligibilityReason = reason || (
            status === 'eligible'
              ? '账号有试用资格。'
              : status === 'ineligible'
                ? '账号无试用资格。'
                : '资格检查失败，可稍后重试。'
          );
          nextEntry.trialEligibilityCheckedAt = checkedAt;
          nextEntry.trialEligibilityReasonCode = reasonCode;
          nextEntry.trialEligibilityRetryable = options.trialEligibilityRetryable === true || status === 'failed';
          nextEntry.trialEligibilityTransientFailure = options.trialEligibilityTransientFailure === true;
          nextEntry.trialEligibilityLastError = status === 'failed' ? nextEntry.trialEligibilityReason : '';
          if (status === 'ineligible') {
            nextEntry.used = canMarkUsed ? true : Boolean(entry.used && entry.manualSkipped);
            nextEntry.lastUsedAt = canMarkUsed ? (entry.lastUsedAt || Date.now()) : entry.lastUsedAt;
            nextEntry.note = entry.note || '无试用资格';
          } else if (status === 'eligible') {
            nextEntry.note = entry.note === '无试用资格' ? '' : entry.note;
          }
        }
        if (options.markUsed === true && canMarkUsed) {
          nextEntry.used = true;
          nextEntry.lastUsedAt = entry.lastUsedAt || Date.now();
          nextEntry.manualSkipped = options.manualSkipped === true;
        }
        if (entryAccessToken) {
          nextEntry.accessToken = entryAccessToken;
          nextEntry.accessTokenMasked = accessTokenMasked || entry.accessTokenMasked || maskCustomEmailPoolAccessToken(entryAccessToken);
          nextEntry.accessTokenUpdatedAt = accessTokenUpdatedAt;
        }
        changed = changed || JSON.stringify(entry) !== JSON.stringify(nextEntry);
        return nextEntry;
      });

      if (!matched) {
        return { updated: false };
      }

      const nextCustomEmailPool = nextEntries
        .filter(isCustomEmailPoolEntryAvailable)
        .map((entry) => entry.email);

      if (!changed && !shouldAdvanceSelectedEmail) {
        return {
          updated: true,
          unchanged: true,
          email: currentEmail,
          status,
          reason,
          checkedAt,
          customEmailPoolEntries: nextEntries,
          customEmailPool: nextCustomEmailPool,
        };
      }

      const selectionUpdate = shouldAdvanceSelectedEmail
        ? { selectedCustomEmailPoolEmail: getNextAvailableCustomEmailPoolEmail(nextEntries, currentEmail) }
        : {};
      await setPersistentSettings({
        customEmailPoolEntries: nextEntries,
        customEmailPool: nextCustomEmailPool,
        ...selectionUpdate,
      });
      await setState({
        customEmailPoolEntries: nextEntries,
        customEmailPool: nextCustomEmailPool,
        ...selectionUpdate,
      });
      broadcastDataUpdate({
        customEmailPoolEntries: nextEntries,
        customEmailPool: nextCustomEmailPool,
        ...selectionUpdate,
      });

      if (options.log !== false) {
        const logPrefix = String(options.logPrefix || '').trim() || '自定义邮箱池试用资格';
        const statusLabel = status === 'eligible'
          ? '有试用资格'
          : status === 'ineligible'
            ? '无试用资格'
            : '资格检查失败，可重试';
        await addLog(`${logPrefix}：${currentEmail} 已更新为${statusLabel}${reason ? `：${reason}` : ''}`, options.level || (status === 'eligible' ? 'ok' : 'warn'));
      }

      return {
        updated: true,
        email: currentEmail,
        status,
        reason,
        checkedAt,
        customEmailPoolEntries: nextEntries,
        customEmailPool: nextCustomEmailPool,
      };
    }

    async function markCurrentCustomEmailPoolEntryUsed(state = {}, options = {}) {
      const providedState = state && typeof state === 'object' ? state : {};
      const currentState = await getState();
      const currentStatePatch = currentState && typeof currentState === 'object' ? currentState : {};
      const currentEmail = String(options.email || providedState?.email || currentStatePatch?.email || '').trim().toLowerCase();
      if (!currentEmail) {
        return { updated: false };
      }

      const latestState = mergeCustomEmailPoolStateForTarget(currentStatePatch, providedState, currentEmail);
      if (!isCustomEmailPoolGenerator(latestState)) {
        return { updated: false };
      }

      const entries = getCustomEmailPoolEntries(latestState);
      if (!entries.length) {
        return { updated: false };
      }
      const shouldAdvanceSelectedEmail = options.advanceSelectedEmail !== false;

      let changed = false;
      const now = Date.now();
      const accessToken = String(latestState.accessToken || latestState.upiRedeemAccessToken || '').trim();
      const currentEntry = entries.find((entry) => entry.email === currentEmail) || {};
      const effectiveAccessToken = accessToken || String(currentEntry.accessToken || currentEntry.token || currentEntry.access_token || currentEntry.upiRedeemAccessToken || '').trim();
      const accessTokenMasked = String(latestState.accessTokenMasked || currentEntry.accessTokenMasked || '').trim()
        || (effectiveAccessToken ? maskCustomEmailPoolAccessToken(effectiveAccessToken) : '');
      const manualSkipped = options.manualSkipped === true;
      if (!effectiveAccessToken && !manualSkipped) {
        if (options.log !== false) {
          const logPrefix = String(options.logPrefix || '').trim() || '自定义邮箱池：流程成功后';
          await addLog(`${logPrefix}未读取到 AT，已保留该邮箱为未用，避免产生缺 AT 的已用账号：${currentEmail}`, options.level || 'warn');
        }
        return { updated: false, skipped: true, reason: 'missing_access_token', email: currentEmail };
      }
      const nextEntries = entries.map((entry) => {
        if (entry.email !== currentEmail) {
          return entry;
        }
        if (entry.used && entry.lastUsedAt && (!effectiveAccessToken || entry.accessToken === effectiveAccessToken)) {
          return entry;
        }
        changed = true;
        return {
          ...entry,
          used: true,
          lastUsedAt: now,
          manualSkipped,
          ...(effectiveAccessToken ? {
            accessToken: effectiveAccessToken,
            accessTokenMasked,
            accessTokenUpdatedAt: String(latestState.accessTokenUpdatedAt || latestState.checkedAt || new Date().toISOString()).trim(),
          } : {}),
        };
      });

      if (!changed && !shouldAdvanceSelectedEmail) {
        return { updated: false };
      }

      const nextCustomEmailPool = nextEntries
        .filter(isCustomEmailPoolEntryAvailable)
        .map((entry) => entry.email);
      const selectionUpdate = shouldAdvanceSelectedEmail
        ? { selectedCustomEmailPoolEmail: getNextAvailableCustomEmailPoolEmail(nextEntries, currentEmail) }
        : {};
      await setPersistentSettings({
        customEmailPoolEntries: nextEntries,
        customEmailPool: nextCustomEmailPool,
        ...selectionUpdate,
      });
      await setState({
        customEmailPoolEntries: nextEntries,
        customEmailPool: nextCustomEmailPool,
        ...selectionUpdate,
      });
      broadcastDataUpdate({
        customEmailPoolEntries: nextEntries,
        customEmailPool: nextCustomEmailPool,
        ...selectionUpdate,
      });
      const logPrefix = String(options.logPrefix || '').trim() || '自定义邮箱池：流程成功后';
      await addLog(`${logPrefix}已将 ${currentEmail} 标记为已用。`, options.level || 'ok');
      return {
        updated: true,
        customEmailPoolEntries: nextEntries,
        customEmailPool: nextCustomEmailPool,
      };
    }

    async function markCurrentCustomEmailPoolEntryRegistrationBlocked(state = {}, options = {}) {
      const providedState = state && typeof state === 'object' ? state : {};
      const currentState = await getState();
      const currentStatePatch = currentState && typeof currentState === 'object' ? currentState : {};
      const currentEmail = String(
        options.email
        || providedState?.email
        || currentStatePatch?.email
        || providedState?.selectedCustomEmailPoolEmail
        || currentStatePatch?.selectedCustomEmailPoolEmail
        || ''
      ).trim().toLowerCase();
      if (!currentEmail) {
        return { updated: false };
      }
      const latestState = mergeCustomEmailPoolStateForTarget(currentStatePatch, providedState, currentEmail);
      if (!isCustomEmailPoolGenerator(latestState)) {
        return { updated: false };
      }

      const entries = getCustomEmailPoolEntries(latestState);
      if (!entries.length) {
        return { updated: false };
      }

      const reason = String(options.reason || '当前邮箱已注册，不能继续用于注册流程。').trim();
      const reasonCode = String(options.reasonCode || options.registrationBlockedReasonCode || 'user_already_exists').trim();
      const blockedAt = String(options.blockedAt || new Date().toISOString()).trim();
      const selectedEmail = String(latestState?.selectedCustomEmailPoolEmail || '').trim().toLowerCase();
      const shouldAdvanceSelectedEmail = options.clearSelectedEmail !== false && selectedEmail === currentEmail;
      let matched = false;
      let changed = false;

      const nextEntries = entries.map((entry) => {
        if (entry.email !== currentEmail) {
          return entry;
        }
        matched = true;
        const nextEntry = {
          ...entry,
          registrationBlocked: true,
          registrationBlockedReason: reason,
          registrationBlockedReasonCode: reasonCode,
          registrationBlockedAt: blockedAt,
          note: entry.note || '已注册',
        };
        changed = changed || JSON.stringify(entry) !== JSON.stringify(nextEntry);
        return nextEntry;
      });

      if (!matched) {
        return { updated: false };
      }

      const nextCustomEmailPool = nextEntries
        .filter(isCustomEmailPoolEntryAvailable)
        .map((entry) => entry.email);

      if (!changed && !shouldAdvanceSelectedEmail) {
        return {
          updated: true,
          unchanged: true,
          email: currentEmail,
          reason,
          reasonCode,
          customEmailPoolEntries: nextEntries,
          customEmailPool: nextCustomEmailPool,
        };
      }

      const selectionUpdate = shouldAdvanceSelectedEmail
        ? { selectedCustomEmailPoolEmail: getNextAvailableCustomEmailPoolEmail(nextEntries, currentEmail) }
        : {};
      await setPersistentSettings({
        customEmailPoolEntries: nextEntries,
        customEmailPool: nextCustomEmailPool,
        ...selectionUpdate,
      });
      await setState({
        customEmailPoolEntries: nextEntries,
        customEmailPool: nextCustomEmailPool,
        ...selectionUpdate,
      });
      broadcastDataUpdate({
        customEmailPoolEntries: nextEntries,
        customEmailPool: nextCustomEmailPool,
        ...selectionUpdate,
      });

      if (options.log !== false) {
        const logPrefix = String(options.logPrefix || '').trim() || '自定义邮箱池';
        await addLog(`${logPrefix}：${currentEmail} 已标记为已注册并从可注册邮箱池排除${reason ? `：${reason}` : ''}`, options.level || 'warn');
      }

      return {
        updated: true,
        email: currentEmail,
        reason,
        reasonCode,
        customEmailPoolEntries: nextEntries,
        customEmailPool: nextCustomEmailPool,
      };
    }

    async function markCurrentCustomEmailPoolEntryTrialIneligible(state = {}, options = {}) {
      const currentEmail = String(options.email || state?.email || '').trim().toLowerCase();
      if (!currentEmail) {
        return { updated: false };
      }

      const reason = String(options.reason || '账号无试用资格').trim();
      const checkedAt = String(options.checkedAt || new Date().toISOString()).trim();
      const result = await markCustomEmailPoolEntryTrialEligibility(state, {
        ...options,
        email: currentEmail,
        status: 'ineligible',
        reason,
        checkedAt,
        clearSelectedEmail: true,
        logPrefix: String(options.logPrefix || '').trim() || '当前账号：自定义邮箱池',
        level: options.level || 'warn',
      });
      return {
        updated: Boolean(result?.updated),
        email: currentEmail,
        reason,
        checkedAt,
        customEmailPoolEntries: result?.customEmailPoolEntries,
        customEmailPool: result?.customEmailPool,
      };
    }

    function getCustomEmailPoolEmailForRun(state = {}, targetRun = 1) {
      const structuredEntries = normalizeCustomEmailPoolEntryObjects(state?.customEmailPoolEntries);
      if (structuredEntries.length > 0) {
        const selectedEmail = String(state?.selectedCustomEmailPoolEmail || '').trim().toLowerCase();
        if (selectedEmail) {
          const selectedEntry = structuredEntries.find((entry) => entry.email === selectedEmail);
          if (selectedEntry && isCustomEmailPoolEntryAvailable(selectedEntry)) {
            return selectedEntry.email;
          }
        }
        const nextEntry = structuredEntries.find(isCustomEmailPoolEntryAvailable);
        return nextEntry?.email || '';
      }
      const entries = normalizeCustomEmailPool(state?.customEmailPool);
      const numericRun = Math.max(1, Math.floor(Number(targetRun) || 1));
      return entries[numericRun - 1] || '';
    }

    function getCustomMailProviderPool(state = {}) {
      return normalizeCustomEmailPool(state?.customMailProviderPool);
    }

    function getCustomMailProviderPoolEmailForRun(state = {}, targetRun = 1) {
      const entries = getCustomMailProviderPool(state);
      const numericRun = Math.max(1, Math.floor(Number(targetRun) || 1));
      return entries[numericRun - 1] || '';
    }

    return {
      buildCustomEmailPoolRecoveryPatch,
      getCustomEmailPool,
      getCustomEmailPoolCredentialForEmail,
      getCustomEmailPoolEmailForRun,
      getCustomEmailPoolEntries,
      getCustomMailProviderPool,
      getCustomMailProviderPoolEmailForRun,
      isCustomEmailPoolEntryAvailable,
      isCustomEmailPoolEntryRegistrationBlocked,
      isCustomEmailPoolEntryTrialIneligible,
      isCustomEmailPoolGenerator,
      markCustomEmailPoolEntryTrialEligibility,
      markCurrentCustomEmailPoolEntryRegistrationBlocked,
      markCurrentCustomEmailPoolEntryTrialIneligible,
      markCurrentCustomEmailPoolEntryUsed,
      maskCustomEmailPoolAccessToken,
      normalizeCustomEmailPool,
      normalizeCustomEmailPoolEntryObjects,
      normalizeCustomEmailPoolTrialEligibilityStatus,
      normalizeCustomEmailVerificationUrlForState,
      normalizeCustomMailProviderPoolEntries,
      parseCustomEmailPoolEntryForState,
      splitCustomEmailPoolEntrySource,
    };
  }

  return {
    createCustomEmailPoolState,
  };
});
