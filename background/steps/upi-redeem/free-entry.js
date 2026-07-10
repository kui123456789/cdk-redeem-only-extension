(function attachMultiPageUpiRedeemFreeEntry(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.MultiPageUpiRedeemFreeEntry = api;
})(typeof self !== 'undefined' ? self : globalThis, function createMultiPageUpiRedeemFreeEntryModule() {
  function createUpiRedeemFreeEntry(context = {}) {
    const constants = context.constants || {};
    const { UPI_ELIGIBILITY_CHECK_MAX_ATTEMPTS, UPI_ELIGIBILITY_CHECK_RETRY_DELAYS_MS, UPI_CREDENTIAL_MEMBERSHIP_CHECK_RESULTS_STORAGE_KEY } = constants;
    const chrome = context.chrome;
    const now = context.now;
    const setState = context.setState;
    const setPersistentSettings = context.setPersistentSettings;
    const broadcastDataUpdate = context.broadcastDataUpdate;
    const sleepWithStop = context.sleepWithStop;
    const throwIfStopped = context.throwIfStopped;
    const upsertTrialEligibleFreeCredential = context.upsertTrialEligibleFreeCredential;
    const markCurrentRegistrationAccountTrialIneligible = context.markCurrentRegistrationAccountTrialIneligible;
    const markCustomEmailPoolEntryTrialEligibility = context.markCustomEmailPoolEntryTrialEligibility;

    const normalizeString = (...args) => context.normalizeString(...args);
    const maskAccessToken = (...args) => context.maskAccessToken(...args);
    const toIsoTimestamp = (...args) => context.toIsoTimestamp(...args);
    const getErrorMessage = (...args) => context.getErrorMessage(...args);
    const addStepLog = (...args) => context.addStepLog(...args);
    const resolveVisibleStep = (...args) => context.resolveVisibleStep(...args);
    const getMergedState = (...args) => context.getMergedState(...args);
    const parseCdkeyPoolText = (...args) => context.parseCdkeyPoolText(...args);
    const splitPoolEntrySource = (...args) => context.splitPoolEntrySource(...args);
    const parsePoolEntryEmail = (...args) => context.parsePoolEntryEmail(...args);
    const resolveSessionAccountEmail = (...args) => context.resolveSessionAccountEmail(...args);
    const resolveTargetRedeemEmail = (...args) => context.resolveTargetRedeemEmail(...args);
    const assertSessionMatchesTargetEmail = (...args) => context.assertSessionMatchesTargetEmail(...args);
    const normalizeChatGptSessionPayload = (...args) => context.normalizeChatGptSessionPayload(...args);
    const getChatGptSessionAccessToken = (...args) => context.getChatGptSessionAccessToken(...args);
    const buildCurrentUpiCredentialForMembership = (...args) => context.buildCurrentUpiCredentialForMembership(...args);
    const normalizeTrialEligibilityApiItem = (...args) => context.normalizeTrialEligibilityApiItem(...args);
    const isTrialEligibilityAccountIneligibleDecision = (...args) => context.isTrialEligibilityAccountIneligibleDecision(...args);
    const buildTrialEligibilityResultPatch = (...args) => context.buildTrialEligibilityResultPatch(...args);
    const isUpiAccountIneligibleError = (...args) => context.isUpiAccountIneligibleError(...args);
    const isRecoverableUpiEligibilityError = (...args) => context.isRecoverableUpiEligibilityError(...args);
    const checkUpiRedeemAccessTokenEligibility = (...args) => context.checkUpiRedeemAccessTokenEligibility(...args);
    const isFlowStoppedError = (...args) => context.isFlowStoppedError(...args);

        function normalizeEmailPoolValues(value = []) {
          const seen = new Set();
          const entries = [];
          for (const item of splitPoolEntrySource(value)) {
            const rawValue = item && typeof item === 'object'
              ? (item.credential || item.email || '')
              : item;
            const email = parsePoolEntryEmail(rawValue);
            if (!email || seen.has(email)) {
              continue;
            }
            seen.add(email);
            entries.push(email);
          }
          return entries;
        }


        function normalizeCustomEmailPoolEntryObjectsForCleanup(value = []) {
          const seen = new Set();
          const entries = [];
          for (const rawEntry of splitPoolEntrySource(value)) {
            const source = rawEntry && typeof rawEntry === 'object' && !Array.isArray(rawEntry)
              ? rawEntry
              : { email: rawEntry };
            const email = parsePoolEntryEmail(source.credential || source.email || '');
            if (!email || seen.has(email)) {
              continue;
            }
            seen.add(email);
            entries.push({
              ...source,
              email,
              enabled: source.enabled !== undefined ? Boolean(source.enabled) : true,
              used: Boolean(source.used),
            });
          }
          return entries;
        }


        function removeCdkeyFromPoolText(value = '', cdkey = '') {
          const target = normalizeString(cdkey);
          return parseCdkeyPoolText(value)
            .filter((item) => item !== target)
            .join('\n');
        }


        function removeEmailFromPoolValues(value = [], email = '') {
          const target = normalizeString(email).toLowerCase();
          const seen = new Set();
          const entries = [];
          for (const item of splitPoolEntrySource(value)) {
            const rawValue = item && typeof item === 'object'
              ? (item.credential || item.email || '')
              : item;
            const entryText = normalizeString(rawValue);
            const entryEmail = parsePoolEntryEmail(entryText);
            if (!entryEmail || seen.has(entryEmail) || (target && entryEmail === target)) {
              continue;
            }
            seen.add(entryEmail);
            entries.push(entryText);
          }
          return entries;
        }


        function buildSuccessfulRedeemCleanupUpdates(state = {}, cdkey = '', email = '') {
          const updates = {};
          const normalizedEmail = normalizeString(email).toLowerCase();

          if (normalizedEmail) {
            const nextCustomMailProviderPool = removeEmailFromPoolValues(state.customMailProviderPool, normalizedEmail);
            if (normalizeEmailPoolValues(nextCustomMailProviderPool).join('\n') !== normalizeEmailPoolValues(state.customMailProviderPool).join('\n')) {
              updates.customMailProviderPool = nextCustomMailProviderPool;
            }

            if (normalizeString(state.selectedCustomEmailPoolEmail).toLowerCase() === normalizedEmail) {
              updates.selectedCustomEmailPoolEmail = '';
            }
          }

          return updates;
        }


        async function checkRegistrationUpiTrialEligibility(input = {}) {
          throwIfStopped();
          const runtimeState = await getMergedState(input.state || {});
          const patch = input.patch && typeof input.patch === 'object' && !Array.isArray(input.patch)
            ? input.patch
            : {};
          const visibleStep = Math.floor(Number(input.visibleStep || runtimeState.visibleStep) || 0)
            || resolveVisibleStep(runtimeState);
          const chatGptSession = normalizeChatGptSessionPayload(input.session || input.chatGptSession || input.chatgptSession || {});
          const accessToken = getChatGptSessionAccessToken(chatGptSession)
            || normalizeString(input.accessToken || input.token || input.access_token);
          const targetEmail = parsePoolEntryEmail(input.email)
            || resolveTargetRedeemEmail({
              ...runtimeState,
              ...patch,
            });
          const sessionEmail = resolveSessionAccountEmail(chatGptSession);
          const email = assertSessionMatchesTargetEmail({ targetEmail, sessionEmail, visibleStep });
          const checkedAt = toIsoTimestamp();

          await addStepLog(
            visibleStep,
            `UPI 注册后试用资格检查：正在检测 ${email || 'unknown'}，确认有试用资格后才会进入 Free 组。`,
            'info'
          );

          try {
            let eligibility = null;
            let lastEligibilityError = null;
            for (let attempt = 1; attempt <= UPI_ELIGIBILITY_CHECK_MAX_ATTEMPTS; attempt += 1) {
              try {
                if (attempt > 1) {
                  await addStepLog(
                    visibleStep,
                    `UPI 注册后试用资格检查：正在第 ${attempt}/${UPI_ELIGIBILITY_CHECK_MAX_ATTEMPTS} 次复核临时网络失败。`,
                    'warn'
                  );
                }
                eligibility = await checkUpiRedeemAccessTokenEligibility({
                  state: runtimeState,
                  session: chatGptSession,
                  accessToken,
                  expectedEmail: email,
                });
                break;
              } catch (eligibilityError) {
                lastEligibilityError = eligibilityError;
                if (isUpiAccountIneligibleError(eligibilityError)) {
                  throw eligibilityError;
                }
                const message = getErrorMessage(eligibilityError) || 'UPI 试用资格检测失败。';
                if (!isRecoverableUpiEligibilityError(eligibilityError) || attempt >= UPI_ELIGIBILITY_CHECK_MAX_ATTEMPTS) {
                  throw eligibilityError;
                }
                const retryDelayMs = UPI_ELIGIBILITY_CHECK_RETRY_DELAYS_MS[Math.min(attempt - 1, UPI_ELIGIBILITY_CHECK_RETRY_DELAYS_MS.length - 1)] || 3000;
                await addStepLog(
                  visibleStep,
                  `UPI 注册后试用资格检查遇到临时网络异常：${message}，${Math.round(retryDelayMs / 1000)} 秒后复核（${attempt + 1}/${UPI_ELIGIBILITY_CHECK_MAX_ATTEMPTS}）。`,
                  'warn'
                );
                await sleepWithStop(retryDelayMs);
              }
            }
            if (!eligibility) {
              throw lastEligibilityError || new Error('UPI 注册后试用资格检查未返回结果。');
            }
            const eligibilityDecision = eligibility?.item?.trialEligibilityDecision || normalizeTrialEligibilityApiItem(eligibility?.item || {});
            const eligibilityPatch = buildTrialEligibilityResultPatch(eligibilityDecision);
            const eligibilityStatus = normalizeString(eligibilityPatch.trialEligibilityStatus || eligibilityDecision.trialEligibilityStatus).toLowerCase();
            if (eligibilityStatus && eligibilityStatus !== 'eligible') {
              const statusReason = normalizeString(eligibilityPatch.trialEligibilityReason || eligibilityDecision.trialEligibilityReason) || (eligibilityStatus === 'ineligible' ? '账号无试用资格。' : 'UPI 试用资格检测失败。');
              const statusError = new Error(eligibilityStatus === 'ineligible' ? `UPI 试用资格检查确认无资格：${statusReason}` : statusReason);
              statusError.trialEligibilityDecision = {
                ...eligibilityDecision,
                ...eligibilityPatch,
                trialEligibilityStatus: eligibilityStatus,
                trialEligibilityReason: statusReason,
              };
              throw statusError;
            }
            const reason = normalizeString(eligibilityPatch.trialEligibilityReason)
              || normalizeString(eligibility?.item?.message || eligibility?.item?.reason)
              || '账号有试用资格，已进入 Free 分组';
            if (typeof upsertTrialEligibleFreeCredential !== 'function') {
              throw new Error('资格已通过，但 Free 分组写入能力未接入，无法保存账号。');
            }
            const freeResults = await upsertTrialEligibleFreeCredential({
              source: 'registration-upi-eligibility',
              email,
              credential: buildCurrentUpiCredentialForMembership({
                ...runtimeState,
                ...patch,
                email,
              }, email),
              accessToken,
              accessTokenMasked: maskAccessToken(accessToken),
              reason,
              checkedAt,
              ...eligibilityPatch,
              trialEligibilityStatus: 'eligible',
              trialEligibilityReason: reason,
              trialEligibilityCheckedAt: checkedAt,
              trialEligibilityRetryCount: 0,
              trialEligibilityLastError: '',
              verificationUrl: normalizeString(patch.verificationUrl || runtimeState.verificationUrl || runtimeState.emailVerificationUrl || ''),
              recordedAt: Math.max(0, Math.floor(Number(patch.recordedAt || runtimeState.recordedAt || runtimeState.no2faFreeRecordedAt) || Date.now())),
              twoFactorEnabled: patch.twoFactorEnabled === true || runtimeState.twoFactorEnabled === true,
                no2faFreeRoute: patch.no2faFreeRoute === true || runtimeState.no2faFreeRoute === true,
                gptPassword: (patch.no2faFreeRoute === true || runtimeState.no2faFreeRoute === true)
                  ? ''
                  : normalizeString(patch.gptPassword || runtimeState.gptPassword || runtimeState.password || ''),
                passkeyEnabled: patch.passkeyEnabled === true || runtimeState.passkeyEnabled === true,
                passkeyEnabledAt: normalizeString(patch.passkeyEnabledAt || runtimeState.passkeyEnabledAt),
                passkeyCredentialId: normalizeString(patch.passkeyCredentialId || runtimeState.passkeyCredentialId),
                passkeyFactorId: normalizeString(patch.passkeyFactorId || runtimeState.passkeyFactorId),
                passkeyRpId: normalizeString(patch.passkeyRpId || runtimeState.passkeyRpId),
                passkeyUserHandle: normalizeString(patch.passkeyUserHandle || runtimeState.passkeyUserHandle),
                passkeyPrivateJwk: patch.passkeyPrivateJwk || runtimeState.passkeyPrivateJwk || null,
                passkeyPublicKeyCose: normalizeString(patch.passkeyPublicKeyCose || runtimeState.passkeyPublicKeyCose),
                passkeyApiPersisted: patch.passkeyApiPersisted === true || runtimeState.passkeyApiPersisted === true,
                resetRedeemState: true,
              });
            const persistedFreeResults = await ensureTrialEligibleFreeCredentialPersisted(freeResults, email, visibleStep);
            let emailPoolStatusUpdated = false;
            let emailPoolStatusChanged = false;
            if (typeof markCustomEmailPoolEntryTrialEligibility === 'function') {
              const persistedFreeItem = findMembershipResultItem(persistedFreeResults, email)
                || findMembershipResultItem(freeResults, email);
              const emailPoolAccessToken = accessToken
                || normalizeString(persistedFreeItem?.accessToken || persistedFreeItem?.token || persistedFreeItem?.access_token || persistedFreeItem?.upiRedeemAccessToken);
              const latestEmailPoolState = await getMergedState({
                ...runtimeState,
                ...patch,
                email,
                accessToken: emailPoolAccessToken,
                upiRedeemAccessToken: emailPoolAccessToken,
                accessTokenUpdatedAt: checkedAt,
              });
              const markResult = await markCustomEmailPoolEntryTrialEligibility(latestEmailPoolState, {
                email,
                status: 'eligible',
                reason,
                checkedAt,
                accessToken: emailPoolAccessToken,
                accessTokenUpdatedAt: checkedAt,
                markUsed: true,
                clearSelectedEmail: true,
                log: false,
              });
              emailPoolStatusChanged = Boolean(markResult?.updated);
              const markedEntry = (Array.isArray(markResult?.customEmailPoolEntries) ? markResult.customEmailPoolEntries : [])
                .find((entry) => parsePoolEntryEmail(entry?.email) === email);
              emailPoolStatusUpdated = Boolean(
                markedEntry
                && markedEntry.used === true
                && (normalizeString(markedEntry.accessToken || markedEntry.token || markedEntry.access_token || markedEntry.upiRedeemAccessToken) || markedEntry.manualSkipped === true)
                && normalizeString(markedEntry.trialEligibilityStatus).toLowerCase() === 'eligible'
              );
            }
            await addStepLog(
              visibleStep,
              `UPI 注册后试用资格检查通过，已保存到 Free 结果表：${email || 'unknown'}；${emailPoolStatusUpdated ? '已同步邮箱池为“已用/有试用资格”。' : (emailPoolStatusChanged ? '已尝试同步邮箱池，但未形成“已用+AT”状态，请刷新后复核。' : '未找到源邮箱池条目可同步。')}侧边栏刷新后会按当前 Free/Plus 显示规则重新计算数量。`,
              'ok'
            );
            return {
              eligible: true,
              email,
              reason,
              checkedAt,
              freeResults: persistedFreeResults,
            };
          } catch (error) {
            if (isFlowStoppedError(error)) {
              throw error;
            }
            const decision = error?.trialEligibilityDecision || null;
            const message = normalizeString(decision?.trialEligibilityReason) || getErrorMessage(error) || 'UPI 试用资格检测失败。';
            const failedAt = toIsoTimestamp();
            const trialEligibilityStatus = isTrialEligibilityAccountIneligibleDecision(decision || {})
              || isUpiAccountIneligibleError(error)
              ? 'ineligible'
              : 'failed';
            let emailPoolStatusUpdated = false;
            if (trialEligibilityStatus === 'ineligible') {
              const ineligibleStatePatch = { ...runtimeState, ...patch, email, accessToken, upiRedeemAccessToken: accessToken, accessTokenUpdatedAt: failedAt };
              const markOptions = { email, reason: message, checkedAt: failedAt, accessToken, accessTokenUpdatedAt: failedAt };
              if (typeof markCurrentRegistrationAccountTrialIneligible === 'function') {
                const markResult = await markCurrentRegistrationAccountTrialIneligible(ineligibleStatePatch, {
                  ...markOptions,
                  logPrefix: '第 7 步 UPI 资格检查',
                  level: 'warn',
                });
                emailPoolStatusUpdated = Boolean(markResult?.updated);
              }
              if (!emailPoolStatusUpdated && typeof markCustomEmailPoolEntryTrialEligibility === 'function') {
                const latestEmailPoolState = await getMergedState(ineligibleStatePatch);
                const markResult = await markCustomEmailPoolEntryTrialEligibility(latestEmailPoolState, {
                  ...markOptions,
                  status: 'ineligible',
                  markUsed: true,
                  clearSelectedEmail: true,
                  log: false,
                });
                emailPoolStatusUpdated = Boolean(markResult?.updated);
              }
            } else if (typeof markCustomEmailPoolEntryTrialEligibility === 'function') {
              const failedStatePatch = {
                ...runtimeState,
                ...patch,
                email,
                accessToken,
                upiRedeemAccessToken: accessToken,
                accessTokenUpdatedAt: failedAt,
              };
              const markResult = await markCustomEmailPoolEntryTrialEligibility(
                await getMergedState(failedStatePatch),
                {
                  email,
                  status: 'failed',
                  reason: message,
                  checkedAt: failedAt,
                  accessToken,
                  accessTokenUpdatedAt: failedAt,
                  trialEligibilityRetryable: true,
                  trialEligibilityTransientFailure: decision?.trialEligibilityTransientFailure === true,
                  markUsed: Boolean(accessToken),
                  clearSelectedEmail: Boolean(accessToken),
                  log: false,
                }
              );
              emailPoolStatusUpdated = Boolean(markResult?.updated);
            }
            await addStepLog(
              visibleStep,
              trialEligibilityStatus === 'ineligible'
                ? `UPI 注册后试用资格检查确认无资格，${emailPoolStatusUpdated ? '已在邮箱池标记“无试用资格”' : '未找到源邮箱池条目'}，不会写入 Free：${email || 'unknown'}：${message}`
                : `UPI 注册后试用资格检查失败，${emailPoolStatusUpdated ? '已在邮箱池标记“已用/资格待重试”，可点击“检查资格”重新检测' : '未找到源邮箱池条目'}，账号未进入 Free 组：${email || 'unknown'}：${message}`,
              trialEligibilityStatus === 'ineligible' ? 'warn' : 'error'
            );
            return {
              eligible: false,
              email,
              reason: message,
              checkedAt: failedAt,
              freeResults: null,
              trialEligibilityStatus,
              emailPoolStatusUpdated,
            };
          }
        }


        function findMembershipResultItem(results = {}, email = '') {
          const targetEmail = parsePoolEntryEmail(email);
          return (Array.isArray(results?.items) ? results.items : [])
            .find((item) => parsePoolEntryEmail(item?.email) === targetEmail) || null;
        }


        function assertTrialEligibleFreeCredentialSaved(results = {}, email = '', context = '') {
          const normalizedEmail = parsePoolEntryEmail(email);
          const item = findMembershipResultItem(results, normalizedEmail);
          const status = normalizeString(item?.status).toLowerCase();
          if (!normalizedEmail || !item || status !== 'free') {
            const prefix = normalizeString(context) || '资格已通过';
            throw new Error(`${prefix}，但 Free 分组写入后没有找到账号 ${normalizedEmail || 'unknown'}，请重新加载扩展后再试。`);
          }
          return item;
        }


        async function readPersistedUpiCredentialMembershipResults() {
          if (!chrome?.storage?.local?.get) {
            return null;
          }
          const stored = await chrome.storage.local
            .get([UPI_CREDENTIAL_MEMBERSHIP_CHECK_RESULTS_STORAGE_KEY])
            .catch(() => ({}));
          const results = stored?.[UPI_CREDENTIAL_MEMBERSHIP_CHECK_RESULTS_STORAGE_KEY];
          return results && typeof results === 'object' && !Array.isArray(results)
            ? results
            : null;
        }


        function buildTrialEligibleFreeCredentialPersistRepairPayload(persistedResults = {}, expectedResults = {}, email = '') {
          const normalizedEmail = parsePoolEntryEmail(email);
          const expectedItem = assertTrialEligibleFreeCredentialSaved(expectedResults, normalizedEmail, '资格已通过');
          const persisted = persistedResults && typeof persistedResults === 'object' && !Array.isArray(persistedResults)
            ? persistedResults
            : {};
          const persistedItems = Array.isArray(persisted.items) ? persisted.items : [];
          const expectedItems = Array.isArray(expectedResults.items) ? expectedResults.items : [];
          const nextItems = persistedItems
            .filter((item) => parsePoolEntryEmail(item?.email) !== normalizedEmail);
          if (!nextItems.some((item) => parsePoolEntryEmail(item?.email) === normalizedEmail)) {
            nextItems.push(expectedItem);
          }
          const updatedAt = normalizeString(expectedResults.updatedAt)
            || normalizeString(expectedItem.checkedAt)
            || toIsoTimestamp();
          const nextDeletedEmails = (Array.isArray(persisted.redeemAutoDeletedEmails)
            ? persisted.redeemAutoDeletedEmails
            : []
          ).map(parsePoolEntryEmail).filter((item) => item && item !== normalizedEmail);
          return {
            ...persisted,
            items: nextItems,
            redeemAutoDeletedEmails: nextDeletedEmails,
            redeemAutoDeletedCount: nextDeletedEmails.length,
            redeemPlusDeletedEmailsByChannel: expectedResults.redeemPlusDeletedEmailsByChannel
              || persisted.redeemPlusDeletedEmailsByChannel,
            redeemPlusDeletedCountByChannel: expectedResults.redeemPlusDeletedCountByChannel
              || persisted.redeemPlusDeletedCountByChannel,
            updatedAt,
            source: normalizeString(expectedResults.source || persisted.source || 'registration-upi-eligibility'),
            total: Math.max(
              Math.floor(Number(persisted.total) || 0),
              Math.floor(Number(expectedResults.total) || 0),
              expectedItems.length,
              nextItems.length
            ),
            completed: Math.max(
              Math.floor(Number(persisted.completed) || 0),
              Math.floor(Number(expectedResults.completed) || 0),
              expectedItems.length,
              nextItems.length
            ),
          };
        }


        async function writeUpiCredentialMembershipResults(results = {}) {
          if (typeof setState === 'function') {
            await setState({
              [UPI_CREDENTIAL_MEMBERSHIP_CHECK_RESULTS_STORAGE_KEY]: results,
            }).catch(() => {});
          }
          if (chrome?.storage?.session?.set) {
            await chrome.storage.session.set({
              [UPI_CREDENTIAL_MEMBERSHIP_CHECK_RESULTS_STORAGE_KEY]: results,
            }).catch(() => {});
          }
          if (chrome?.storage?.local?.set) {
            await chrome.storage.local.set({
              [UPI_CREDENTIAL_MEMBERSHIP_CHECK_RESULTS_STORAGE_KEY]: results,
            });
          }
          if (typeof broadcastDataUpdate === 'function') {
            broadcastDataUpdate({
              [UPI_CREDENTIAL_MEMBERSHIP_CHECK_RESULTS_STORAGE_KEY]: results,
            });
          }
          return readPersistedUpiCredentialMembershipResults();
        }


        async function ensureTrialEligibleFreeCredentialPersisted(results = {}, email = '', visibleStep = 7) {
          const normalizedEmail = parsePoolEntryEmail(email);
          assertTrialEligibleFreeCredentialSaved(results, normalizedEmail, '资格已通过');
          const persistedResults = await readPersistedUpiCredentialMembershipResults();
          const persistedItem = findMembershipResultItem(persistedResults, normalizedEmail);
          if (normalizeString(persistedItem?.status).toLowerCase() === 'free') {
            return persistedResults || results;
          }
          const repairedResults = buildTrialEligibleFreeCredentialPersistRepairPayload(
            persistedResults,
            results,
            normalizedEmail
          );
          await addStepLog(
            visibleStep,
            `检测到 Free 分组写入未落到当前持久存储，已重新同步：${normalizedEmail}`,
            'warn'
          );
          const confirmedResults = await writeUpiCredentialMembershipResults(repairedResults);
          assertTrialEligibleFreeCredentialSaved(confirmedResults || repairedResults, normalizedEmail, '资格已通过并重新同步');
          return confirmedResults || repairedResults;
        }


        async function applyPaidSubscriptionCleanup({ state = {}, cdkey = '', email = '', visibleStep = 0 } = {}) {
          const cleanupUpdates = buildSuccessfulRedeemCleanupUpdates(state, cdkey, email);
          if (!Object.keys(cleanupUpdates).length) {
            return cleanupUpdates;
          }

          await setState(cleanupUpdates);
          try {
            await setPersistentSettings(cleanupUpdates);
          } catch (error) {
            await addStepLog(
              visibleStep,
              `已确认 Plus/Pro/Team，但保存邮箱/CDK 列表清理结果失败：${getErrorMessage(error) || error}`,
              'warn'
            );
          }
          if (typeof broadcastDataUpdate === 'function') {
            broadcastDataUpdate({
              ...cleanupUpdates,
              upiRedeemForceCdkeyPoolRefresh: true,
            });
          }
          return cleanupUpdates;
        }


        async function writeTrialEligibleFreeRedeemState({
          runtimeState = {},
          email = '',
          accessToken = '',
          checkedAt = '',
          reason = '',
          cdkey = '',
          patch = {},
        } = {}) {
          if (typeof upsertTrialEligibleFreeCredential !== 'function') {
            throw new Error('Free 分组写入能力未接入，无法保存主流程兑换状态。');
          }
          const normalizedEmail = parsePoolEntryEmail(email);
          if (!normalizedEmail) {
            return null;
          }
          const stateForCredential = {
            ...runtimeState,
            email: normalizedEmail,
          };
          const hasPatchCdkey = Object.prototype.hasOwnProperty.call(patch, 'upiRedeemCdkey')
            || Object.prototype.hasOwnProperty.call(patch, 'cdkey');
          const results = await upsertTrialEligibleFreeCredential({
            source: 'registration-auto-redeem',
            email: normalizedEmail,
            credential: {
              ...buildCurrentUpiCredentialForMembership(stateForCredential, normalizedEmail),
              ...patch,
            },
            accessToken,
            accessTokenMasked: maskAccessToken(accessToken),
            reason,
            checkedAt: normalizeString(checkedAt) || toIsoTimestamp(),
            cdkey: hasPatchCdkey ? (patch.upiRedeemCdkey ?? patch.cdkey ?? '') : cdkey,
            ...patch,
          });
          assertTrialEligibleFreeCredentialSaved(results, normalizedEmail, '主流程兑换状态保存');
          return results;
        }


    return {
      normalizeEmailPoolValues,
      normalizeCustomEmailPoolEntryObjectsForCleanup,
      removeCdkeyFromPoolText,
      removeEmailFromPoolValues,
      buildSuccessfulRedeemCleanupUpdates,
      checkRegistrationUpiTrialEligibility,
      findMembershipResultItem,
      assertTrialEligibleFreeCredentialSaved,
      readPersistedUpiCredentialMembershipResults,
      buildTrialEligibleFreeCredentialPersistRepairPayload,
      writeUpiCredentialMembershipResults,
      ensureTrialEligibleFreeCredentialPersisted,
      applyPaidSubscriptionCleanup,
      writeTrialEligibleFreeRedeemState,
    };
  }

  return {
    createUpiRedeemFreeEntry,
  };
});
