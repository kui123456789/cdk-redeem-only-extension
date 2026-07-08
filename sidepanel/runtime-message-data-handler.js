(function attachSidepanelRuntimeMessageDataHandler(root, factory) {
  const api = factory();
  root.SidepanelRuntimeMessageDataHandler = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis, function createSidepanelRuntimeMessageDataHandlerModule() {
  function createRuntimeMessageDataHandler(deps = {}) {
    const {
      appState = null,
      createCombinedScope = null,
      scopeValues = {},
    } = deps;

    function buildMessageScope(message, sender, sendResponse) {
      if (typeof createCombinedScope === 'function') {
        return createCombinedScope(appState, {
          ...scopeValues,
          message,
          _sender: sender,
          sendResponse,
        });
      }
      return {
        ...scopeValues,
        message,
        _sender: sender,
        sendResponse,
      };
    }

    function handleDataUpdated(message, sender, sendResponse) {
      const messageScope = buildMessageScope(message, sender, sendResponse);
      messageScope.__sidepanelRuntimeIsArray = Array.isArray;
      with (messageScope) {
        const currentCustomEmailPoolEntries = (() => {
          try {
            return typeof getNormalizedCustomEmailPoolEntriesState === 'function'
              ? getNormalizedCustomEmailPoolEntriesState()
              : [];
          } catch (_) {
            return [];
          }
        })();
        if (
          __sidepanelRuntimeIsArray(message?.payload?.customEmailPoolEntries)
          && message.payload.customEmailPoolEntries.length === 0
          && currentCustomEmailPoolEntries.length > 0
          && !(__sidepanelRuntimeIsArray(message.payload.customEmailPool) && message.payload.customEmailPool.length > 0)
        ) {
          message = {
            ...message,
            payload: {
              ...message.payload,
              customEmailPoolEntries: currentCustomEmailPoolEntries,
            },
          };
        }
        syncLatestState(message.payload);
        if (
          message.payload.upiCredentialMembershipCheckResults !== undefined
          || message.payload.cdkPoolText !== undefined
          || message.payload.cdkUsage !== undefined
          || message.payload.upiRedeemCdkPoolText !== undefined
          || message.payload.upiRedeemCdkUsage !== undefined
          || message.payload.upiRedeemCdkeyPoolText !== undefined
          || message.payload.upiRedeemCdkeyUsage !== undefined
          || message.payload.pixRedeemCdkeyPoolText !== undefined
          || message.payload.pixRedeemCdkeyUsage !== undefined
          || message.payload.idealRedeemCdkeyPoolText !== undefined
          || message.payload.idealRedeemCdkeyUsage !== undefined
          || message.payload.upiAccountCredentialBackups !== undefined
        ) {
          renderAccountRecords(latestState);
          if (message.payload.upiCredentialMembershipCheckResults !== undefined) {
            syncCustomEmailPoolEntriesFromMembershipResults?.(latestState?.upiCredentialMembershipCheckResults);
            renderCustomEmailPoolEntries();
            queueCustomEmailPoolRefresh();
          }
          if (message.payload.upiAccountCredentialBackups !== undefined) {
            accountRecordsManager?.reloadUpiCredentialMembershipAfterRuntimeImport?.({ silent: true }).catch(() => null);
          }
        }
        if (message.payload.operationDelayEnabled !== undefined && typeof applyOperationDelayState === 'function') {
          applyOperationDelayState(message.payload);
        }
        if (message.payload.email !== undefined) {
          inputEmail.value = message.payload.email || '';
          renderCustomEmailPoolEntries();
          queueCustomEmailPoolRefresh();
        } else if (message.payload.selectedCustomEmailPoolEmail !== undefined) {
          renderCustomEmailPoolEntries();
          queueCustomEmailPoolRefresh();
        }
        if (
          message.payload.password !== undefined
          || message.payload.customPassword !== undefined
          || message.payload.contributionMode !== undefined
        ) {
          syncPasswordField(latestState || {});
        }
        if (message.payload.localCpaStep9Mode !== undefined) {
          setLocalCpaStep9Mode(message.payload.localCpaStep9Mode);
        }
        if (message.payload.panelMode !== undefined) {
          selectPanelMode.value = getExportTargetForPanelMode(message.payload.panelMode || DEFAULT_PANEL_MODE);
          if (selectAccountAccessStrategy) {
            selectAccountAccessStrategy.value = getAccountAccessStrategyUiValueForState(latestState);
          }
          updatePanelModeUI();
        }
        if (message.payload.plusAccountAccessStrategy !== undefined && selectAccountAccessStrategy) {
          selectAccountAccessStrategy.value = getAccountAccessStrategyUiValueForState(latestState);
          updatePanelModeUI();
        }
        if (
          message.payload.sub2apiGroupName !== undefined
          || message.payload.sub2apiGroupNames !== undefined
        ) {
          renderSub2ApiGroupOptions(latestState, latestState?.sub2apiGroupName || '');
        }
        if (message.payload.oauthUrl !== undefined) {
          displayOauthUrl.textContent = message.payload.oauthUrl || '等待中...';
          displayOauthUrl.classList.toggle('has-value', Boolean(message.payload.oauthUrl));
        }
        if (message.payload.lastLoginCode !== undefined) {
          setOauthLoginCodeDisplay(message.payload.lastLoginCode || '');
        }
        if (message.payload.localhostUrl !== undefined) {
          displayLocalhostUrl.textContent = message.payload.localhostUrl || '等待中...';
          displayLocalhostUrl.classList.toggle('has-value', Boolean(message.payload.localhostUrl));
        }
        if (message.payload.cloudflareTempEmailBaseUrl !== undefined) {
          inputTempEmailBaseUrl.value = message.payload.cloudflareTempEmailBaseUrl || '';
        }
        if (message.payload.cloudflareTempEmailAdminAuth !== undefined) {
          inputTempEmailAdminAuth.value = message.payload.cloudflareTempEmailAdminAuth || '';
        }
        if (message.payload.cloudflareTempEmailCustomAuth !== undefined) {
          inputTempEmailCustomAuth.value = message.payload.cloudflareTempEmailCustomAuth || '';
        }
        if (message.payload.cloudflareTempEmailLookupMode !== undefined) {
          setCloudflareTempEmailLookupMode(message.payload.cloudflareTempEmailLookupMode);
        }
        if (message.payload.cloudflareTempEmailReceiveMailbox !== undefined) {
          inputTempEmailReceiveMailbox.value = message.payload.cloudflareTempEmailReceiveMailbox || '';
        }
        if (message.payload.cloudflareTempEmailUseRandomSubdomain !== undefined && inputTempEmailUseRandomSubdomain) {
          inputTempEmailUseRandomSubdomain.checked = Boolean(message.payload.cloudflareTempEmailUseRandomSubdomain);
        }
        if (message.payload.cloudflareTempEmailDomain !== undefined || message.payload.cloudflareTempEmailDomains !== undefined) {
          renderCloudflareTempEmailDomainOptions(message.payload.cloudflareTempEmailDomain || latestState?.cloudflareTempEmailDomain || '');
        }
        if (
          message.payload.cloudflareTempEmailUseRandomSubdomain !== undefined
          || message.payload.cloudflareTempEmailLookupMode !== undefined
          || message.payload.cloudflareTempEmailDomain !== undefined
          || message.payload.cloudflareTempEmailDomains !== undefined
        ) {
          updateMailProviderUI();
        }
        if (message.payload.cloudMailBaseUrl !== undefined && inputCloudMailBaseUrl) {
          inputCloudMailBaseUrl.value = message.payload.cloudMailBaseUrl || '';
        }
        if (message.payload.cloudMailAdminEmail !== undefined && inputCloudMailAdminEmail) {
          inputCloudMailAdminEmail.value = message.payload.cloudMailAdminEmail || '';
        }
        if (message.payload.cloudMailAdminPassword !== undefined && inputCloudMailAdminPassword) {
          inputCloudMailAdminPassword.value = message.payload.cloudMailAdminPassword || '';
        }
        if (message.payload.cloudMailReceiveMailbox !== undefined && inputCloudMailReceiveMailbox) {
          inputCloudMailReceiveMailbox.value = message.payload.cloudMailReceiveMailbox || '';
        }
        if (message.payload.cloudMailDomain !== undefined && inputCloudMailDomain) {
          inputCloudMailDomain.value = message.payload.cloudMailDomain || '';
        }
        if (message.payload.freemailBaseUrl !== undefined && inputFreemailBaseUrl) {
          inputFreemailBaseUrl.value = message.payload.freemailBaseUrl || '';
        }
        if (message.payload.freemailAdminUsername !== undefined && inputFreemailAdminUsername) {
          inputFreemailAdminUsername.value = message.payload.freemailAdminUsername || '';
        }
        if (message.payload.freemailAdminPassword !== undefined && inputFreemailAdminPassword) {
          inputFreemailAdminPassword.value = message.payload.freemailAdminPassword || '';
        }
        if (message.payload.freemailDomain !== undefined && inputFreemailDomain) {
          inputFreemailDomain.value = message.payload.freemailDomain || '';
        }
        if (
          message.payload.freemailBaseUrl !== undefined
          || message.payload.freemailAdminUsername !== undefined
          || message.payload.freemailAdminPassword !== undefined
          || message.payload.freemailDomain !== undefined
        ) {
          updateMailProviderUI();
        }
        if (message.payload.moemailBaseUrl !== undefined && inputMoemailBaseUrl) {
          inputMoemailBaseUrl.value = message.payload.moemailBaseUrl || '';
        }
        if (message.payload.moemailApiKey !== undefined && inputMoemailApiKey) {
          inputMoemailApiKey.value = message.payload.moemailApiKey || '';
        }
        if (message.payload.moemailDomain !== undefined && inputMoemailDomain) {
          inputMoemailDomain.value = message.payload.moemailDomain || '';
        }
        if (
          message.payload.moemailBaseUrl !== undefined
          || message.payload.moemailApiKey !== undefined
          || message.payload.moemailDomain !== undefined
        ) {
          updateMailProviderUI();
        }
        if (message.payload.yydsMailBaseUrl !== undefined && inputYydsMailBaseUrl) {
          inputYydsMailBaseUrl.value = message.payload.yydsMailBaseUrl || '';
        }
        if (message.payload.yydsMailApiKey !== undefined && inputYydsMailApiKey) {
          inputYydsMailApiKey.value = message.payload.yydsMailApiKey || '';
        }
        if (message.payload.yydsMailDomain !== undefined && inputYydsMailDomain) {
          inputYydsMailDomain.value = message.payload.yydsMailDomain || '';
        }
        if (
          message.payload.yydsMailBaseUrl !== undefined
          || message.payload.yydsMailApiKey !== undefined
          || message.payload.yydsMailDomain !== undefined
        ) {
          updateMailProviderUI();
        }
        if (message.payload.outlookEmailPlusBaseUrl !== undefined && inputOutlookEmailPlusBaseUrl) {
          inputOutlookEmailPlusBaseUrl.value = message.payload.outlookEmailPlusBaseUrl || '';
        }
        if (message.payload.outlookEmailPlusApiKey !== undefined && inputOutlookEmailPlusApiKey) {
          inputOutlookEmailPlusApiKey.value = message.payload.outlookEmailPlusApiKey || '';
        }
        if (message.payload.outlookEmailPlusProvider !== undefined && inputOutlookEmailPlusProvider) {
          inputOutlookEmailPlusProvider.value = normalizeOutlookEmailPlusProviderValue(message.payload.outlookEmailPlusProvider);
        }
        if (message.payload.outlookEmailPlusProjectKey !== undefined && inputOutlookEmailPlusProjectKey) {
          inputOutlookEmailPlusProjectKey.value = normalizeOutlookEmailPlusProjectKeyValue(message.payload.outlookEmailPlusProjectKey);
        }
        if (message.payload.outlookEmailPlusCallerIdPrefix !== undefined && inputOutlookEmailPlusCallerIdPrefix) {
          inputOutlookEmailPlusCallerIdPrefix.value = normalizeOutlookEmailPlusCallerIdPrefixValue(message.payload.outlookEmailPlusCallerIdPrefix);
        }
        if (message.payload.outlookEmailPlusAliasMaxPerMailbox !== undefined && inputOutlookEmailPlusAliasMaxPerMailbox) {
          inputOutlookEmailPlusAliasMaxPerMailbox.value = String(normalizeOutlookEmailPlusAliasMaxPerMailbox(message.payload.outlookEmailPlusAliasMaxPerMailbox));
        }
        if (
          message.payload.outlookEmailPlusBaseUrl !== undefined
          || message.payload.outlookEmailPlusApiKey !== undefined
          || message.payload.outlookEmailPlusProvider !== undefined
          || message.payload.outlookEmailPlusProjectKey !== undefined
          || message.payload.outlookEmailPlusCallerIdPrefix !== undefined
          || message.payload.outlookEmailPlusAliasMaxPerMailbox !== undefined
        ) {
          updateMailProviderUI();
        }
        if (message.payload.plusModeEnabled !== undefined && inputPlusModeEnabled) {
          inputPlusModeEnabled.checked = Boolean(message.payload.plusModeEnabled);
        }
        if (message.payload.plusPaymentMethod !== undefined && selectPlusPaymentMethod) {
          selectPlusPaymentMethod.value = normalizePlusPaymentMethod(message.payload.plusPaymentMethod);
        }
        if (message.payload.chatgptSessionReaderMode !== undefined || message.payload.chatgptSessionReaderProfiles !== undefined) {
          applyChatgptSessionReaderProfileToInputs(latestState, {
            mode: latestState?.chatgptSessionReaderMode,
          });
        }
        if (message.payload.legacyPayHelperOtpChannel !== undefined && selectUpiInfoHelperOtpChannel) {
          selectUpiInfoHelperOtpChannel.value = normalizeUpiInfoOtpChannelValue(message.payload.legacyPayHelperOtpChannel);
        }
        if (message.payload.legacyPayHelperBalance !== undefined || message.payload.legacyPayHelperBalanceError !== undefined) {
          if (typeof displayUpiInfoHelperBalance !== 'undefined' && displayUpiInfoHelperBalance) {
            const balanceText = String(message.payload.legacyPayHelperBalance ?? latestState?.legacyPayHelperBalance ?? '').trim();
            const balanceError = String(message.payload.legacyPayHelperBalanceError ?? latestState?.legacyPayHelperBalanceError ?? '').trim();
            displayUpiInfoHelperBalance.textContent = balanceError
              ? `余额查询失败：${balanceError}`
              : (balanceText || '余额已更新');
          }
        }
        if (message.payload.upiSubscriptionApiBaseUrl !== undefined && inputUpiSubscriptionApiBaseUrl) {
          inputUpiSubscriptionApiBaseUrl.value = String(message.payload.upiSubscriptionApiBaseUrl || 'https://cha.nerver.cc').trim();
        }
        if ((message.payload.upiRedeemExternalApiKey !== undefined || message.payload.pixRedeemExternalApiKey !== undefined) && inputUpiRedeemExternalApiKey) {
          inputUpiRedeemExternalApiKey.value = String(message.payload.upiRedeemExternalApiKey ?? message.payload.pixRedeemExternalApiKey ?? '').trim();
        }
        if ((message.payload.upiRedeemClientId !== undefined || message.payload.pixRedeemClientId !== undefined) && inputUpiRedeemClientId) {
          inputUpiRedeemClientId.value = String(message.payload.upiRedeemClientId ?? message.payload.pixRedeemClientId ?? '').trim();
        }
        if (message.payload.upiRedeemFailedAccountRetryLimit !== undefined && inputUpiRedeemFailedAccountRetryLimit) {
          inputUpiRedeemFailedAccountRetryLimit.value = String(normalizeUpiRedeemFailedAccountRetryLimit(
            message.payload.upiRedeemFailedAccountRetryLimit,
            latestState?.upiRedeemFailedAccountRetryLimit
          ));
        }
        if (
          (message.payload.upiRedeemStopAfterRedeem !== undefined
            || message.payload.upiRedeemContinueAfterRedeem !== undefined
            || message.payload.pixRedeemStopAfterRedeem !== undefined
            || message.payload.pixRedeemContinueAfterRedeem !== undefined)
          && inputUpiRedeemStopAfterRedeem
        ) {
          syncUpiRedeemAfterModeControls((message.payload.upiRedeemContinueAfterRedeem ?? message.payload.pixRedeemContinueAfterRedeem) === true ? false : true);
        }
        if (message.payload.totpMfaAfterProfileEnabled !== undefined && inputTotpMfaAfterProfileEnabled) {
          inputTotpMfaAfterProfileEnabled.checked = message.payload.totpMfaAfterProfileEnabled !== false;
        }
        if (message.payload.registrationFreeRoute !== undefined && selectRegistrationFreeRoute) {
          selectRegistrationFreeRoute.value = normalizeRegistrationFreeRoute(message.payload.registrationFreeRoute);
        }
        if (message.payload.upiCredentialMembershipCheckTotpApiBaseUrl !== undefined && inputUpiCredentialMembershipTotpApiBaseUrl) {
          inputUpiCredentialMembershipTotpApiBaseUrl.value = String(message.payload.upiCredentialMembershipCheckTotpApiBaseUrl || 'https://cha.nerver.cc').trim();
        }
        if (message.payload.upiCredentialMembershipCheckTotpLookupKey !== undefined && inputUpiCredentialMembershipTotpLookupKey) {
          inputUpiCredentialMembershipTotpLookupKey.value = String(message.payload.upiCredentialMembershipCheckTotpLookupKey || '').trim();
        }
        if (message.payload.setGptPasswordVerificationWaitSeconds !== undefined && inputSetGptPasswordVerificationWaitSeconds) {
          setSharedVerificationCodeWaitInputs(
            message.payload.setGptPasswordVerificationWaitSeconds,
            latestState?.setGptPasswordVerificationWaitSeconds ?? latestState?.signupVerificationCodeWaitSeconds
          );
        }
        if (
          message.payload.upiCredentialMembershipCheckResults !== undefined
          || message.payload.cdkPoolText !== undefined
          || message.payload.cdkUsage !== undefined
          || message.payload.upiRedeemCdkPoolText !== undefined
          || message.payload.upiRedeemCdkUsage !== undefined
          || message.payload.upiRedeemCdkeyPoolText !== undefined
          || message.payload.upiRedeemCdkeyUsage !== undefined
          || message.payload.pixRedeemCdkeyPoolText !== undefined
          || message.payload.pixRedeemCdkeyUsage !== undefined
          || message.payload.idealRedeemCdkeyPoolText !== undefined
          || message.payload.idealRedeemCdkeyUsage !== undefined
        ) {
          updateAllUpiRedeemCdkeyPoolSummaries(latestState);
          scheduleUpiRedeemCdkeyStatusAutoRefresh();
        }
        if (
          message.payload.plusModeEnabled !== undefined
          || message.payload.plusPaymentMethod !== undefined
          || message.payload.plusAccountAccessStrategy !== undefined
          || message.payload.upiRedeemStopAfterRedeem !== undefined
          || message.payload.upiRedeemContinueAfterRedeem !== undefined
          || message.payload.totpMfaAfterProfileEnabled !== undefined
          || message.payload.registrationFreeRoute !== undefined
          || message.payload.pixRedeemStopAfterRedeem !== undefined
          || message.payload.pixRedeemContinueAfterRedeem !== undefined
          || message.payload.legacyPayHelperAutoModeEnabled !== undefined
          || message.payload.legacyPayHelperOtpChannel !== undefined
        ) {
          const stepDefinitionState = typeof resolveStepDefinitionCapabilityState === 'function'
            ? resolveStepDefinitionCapabilityState(latestState, {
              signupMethod: latestState?.signupMethod,
            })
            : {
              plusModeEnabled: Boolean(latestState?.plusModeEnabled),
              signupMethod: normalizeSignupMethod(latestState?.signupMethod || DEFAULT_SIGNUP_METHOD),
            };
          syncStepDefinitionsForMode(
            stepDefinitionState.plusModeEnabled,
            latestState?.plusPaymentMethod,
            {
              render: true,
              signupMethod: stepDefinitionState.signupMethod,
              plusAccountAccessStrategy: stepDefinitionState.plusAccountAccessStrategy,
              upiRedeemStopAfterRedeem: getSelectedUpiRedeemStopAfterRedeem(latestState),
              upiRedeemContinueAfterRedeem: Boolean(latestState?.upiRedeemContinueAfterRedeem ?? latestState?.pixRedeemContinueAfterRedeem),
              totpMfaAfterProfileEnabled: getSelectedTotpMfaAfterProfileEnabled(latestState),
              registrationFreeRoute: getSelectedRegistrationFreeRoute(latestState),
            }
          );
          updatePlusModeUI();
          updateSignupMethodUI({ notify: true });
        }
        if (
          message.payload.removedPaymentWorkerEnabled !== undefined
          || message.payload.removedPaymentWorkerBrowserBackend !== undefined
          || message.payload.removedPaymentWorkerAdsPowerApiBase !== undefined
          || message.payload.removedPaymentWorkerAdsPowerApiKey !== undefined
          || message.payload.removedPaymentWorkerAdsPowerProfileId !== undefined
          || message.payload.removedPaymentWorkerRoxyBrowserApiBase !== undefined
          || message.payload.removedPaymentWorkerRoxyBrowserApiKey !== undefined
          || message.payload.removedPaymentWorkerRoxyBrowserProfileId !== undefined
          || message.payload.removedPaymentWorkerStripePublishableKey !== undefined
          || message.payload.removedPaymentWorkerDeviceId !== undefined
          || message.payload.removedPaymentWorkerUserAgent !== undefined
          || message.payload.removedPaymentWorkerMaxAttempts !== undefined
          || message.payload.removedPaymentWorkerPaymentLocale !== undefined
          || message.payload.removedPaymentWorkerCheckoutRebuildMaxAttempts !== undefined
          || message.payload.removedPaymentWorkerProxy !== undefined
          || message.payload.removedPaymentWorkerDefaultProxy !== undefined
          || message.payload.removedPaymentWorkerProviderProxy !== undefined
          || message.payload.removedPaymentWorkerJobStatus !== undefined
          || message.payload.removedPaymentWorkerCurrentAttempt !== undefined
          || message.payload.removedPaymentWorkerPauseRequested !== undefined
        ) {
          updateRemovedPaymentWorkerUi(latestState);
        }
        if (
          message.payload.plusManualConfirmationPending !== undefined
          || message.payload.plusManualConfirmationRequestId !== undefined
          || message.payload.plusManualConfirmationStep !== undefined
          || message.payload.plusManualConfirmationMethod !== undefined
          || message.payload.plusManualConfirmationTitle !== undefined
          || message.payload.plusManualConfirmationMessage !== undefined
        ) {
          void syncPlusManualConfirmationDialog();
        }
        if (message.payload.currentHotmailAccountId !== undefined || message.payload.hotmailAccounts !== undefined) {
          renderHotmailAccounts();
          if (selectMailProvider.value === 'hotmail-api') {
            inputEmail.value = getCurrentHotmailEmail();
          }
        }
        if (message.payload.currentLegacyWalletAccountId !== undefined || message.payload.legacyWalletAccounts !== undefined) {
          renderLegacyWalletAccounts();
        }
        if (message.payload.customMailProviderPool !== undefined && inputCustomMailProviderPool) {
          inputCustomMailProviderPool.value = normalizeCustomEmailPoolEntryValues(message.payload.customMailProviderPool).join('\n');
          syncRunCountFromCustomMailProviderPool();
        }
        if (message.payload.currentMail2925AccountId !== undefined || message.payload.mail2925Accounts !== undefined) {
          renderMail2925Accounts();
          if (selectMailProvider.value === '2925') {
            setManagedAliasBaseEmailInputForProvider('2925', latestState);
          }
        }
        if (message.payload.customEmailPoolEntries !== undefined) {
          const restoredCustomEmailPoolEntries = restoreCustomEmailPoolEntriesFromState({
            ...latestState,
            ...message.payload,
          });
          setCustomEmailPoolEntriesState(restoredCustomEmailPoolEntries);
          syncCustomEmailPoolEntriesFromMembershipResults?.(latestState?.upiCredentialMembershipCheckResults);
          renderCustomEmailPoolEntries();
          syncRunCountFromConfiguredEmailPool();
          queueCustomEmailPoolRefresh();
        } else if (message.payload.customEmailPool !== undefined) {
          renderCustomEmailPoolEntries();
          syncRunCountFromConfiguredEmailPool();
          queueCustomEmailPoolRefresh();
        }
        if (message.payload.signupVerificationCodeWaitSeconds !== undefined && inputSignupVerificationCodeWaitSeconds) {
          setSharedVerificationCodeWaitInputs(
            message.payload.setGptPasswordVerificationWaitSeconds ?? message.payload.signupVerificationCodeWaitSeconds,
            latestState?.setGptPasswordVerificationWaitSeconds ?? latestState?.signupVerificationCodeWaitSeconds
          );
        }
        if (message.payload.luckmailApiKey !== undefined) {
          inputLuckmailApiKey.value = message.payload.luckmailApiKey || '';
        }
        if (message.payload.luckmailBaseUrl !== undefined) {
          inputLuckmailBaseUrl.value = normalizeLuckmailBaseUrl(message.payload.luckmailBaseUrl);
        }
        if (message.payload.luckmailEmailType !== undefined) {
          selectLuckmailEmailType.value = normalizeLuckmailEmailType(message.payload.luckmailEmailType);
        }
        if (message.payload.luckmailDomain !== undefined) {
          inputLuckmailDomain.value = message.payload.luckmailDomain || '';
        }
        if (message.payload.luckmailUsedPurchases !== undefined && isLuckmailProvider()) {
          queueLuckmailPurchaseRefresh();
        }
        if (message.payload.currentLuckmailPurchase !== undefined && isLuckmailProvider()) {
          inputEmail.value = getCurrentLuckmailEmail();
          queueLuckmailPurchaseRefresh();
        }
        if (message.payload.autoDeleteUsedIcloudAlias !== undefined && checkboxAutoDeleteIcloud) {
          checkboxAutoDeleteIcloud.checked = Boolean(message.payload.autoDeleteUsedIcloudAlias);
        }
        if (message.payload.accountRunHistoryHelperBaseUrl !== undefined && inputAccountRunHistoryHelperBaseUrl) {
          inputAccountRunHistoryHelperBaseUrl.value = normalizeAccountRunHistoryHelperBaseUrlValue(message.payload.accountRunHistoryHelperBaseUrl);
          updateAccountRunHistorySettingsUI();
        }
        if (message.payload.icloudHostPreference !== undefined && selectIcloudHostPreference) {
          const hostPreference = String(message.payload.icloudHostPreference || '').trim().toLowerCase();
          selectIcloudHostPreference.value = hostPreference === 'icloud.com'
            ? 'icloud.com'
            : (hostPreference === 'icloud.com.cn' ? 'icloud.com.cn' : 'auto');
          updateMailProviderUI();
        }
        if (message.payload.icloudTargetMailboxType !== undefined && selectIcloudTargetMailboxType) {
          selectIcloudTargetMailboxType.value = normalizeIcloudTargetMailboxType(message.payload.icloudTargetMailboxType);
          updateMailProviderUI();
        }
        if (message.payload.icloudForwardMailProvider !== undefined && selectIcloudForwardMailProvider) {
          selectIcloudForwardMailProvider.value = normalizeIcloudForwardMailProvider(message.payload.icloudForwardMailProvider);
          updateMailProviderUI();
        }
        if (message.payload.icloudApiBaseUrl !== undefined && inputIcloudApiBaseUrl) {
          inputIcloudApiBaseUrl.value = normalizeIcloudApiBaseUrlValue(message.payload.icloudApiBaseUrl);
        }
        if (message.payload.icloudApiAdminKey !== undefined && inputIcloudApiAdminKey) {
          inputIcloudApiAdminKey.value = message.payload.icloudApiAdminKey || '';
        }
        if (message.payload.icloudFetchMode !== undefined && selectIcloudFetchMode) {
          selectIcloudFetchMode.value = normalizeIcloudFetchMode(message.payload.icloudFetchMode);
        }
        if (message.payload.autoRunSkipFailures !== undefined) {
          inputAutoSkipFailures.checked = true;
          updateFallbackThreadIntervalInputState();
        }
        if (message.payload.autoRunRetryNonFreeTrial !== undefined && inputAutoRunRetryNonFreeTrial) {
          inputAutoRunRetryNonFreeTrial.checked = Boolean(message.payload.autoRunRetryNonFreeTrial);
        }
        if (message.payload.autoRunRetryLegacyWalletCallback !== undefined && inputAutoRunRetryLegacyWalletCallback) {
          inputAutoRunRetryLegacyWalletCallback.checked = Boolean(message.payload.autoRunRetryLegacyWalletCallback);
        }
        if (message.payload.autoRunRetryShortLinkError !== undefined && inputAutoRunRetryShortLinkError) {
          inputAutoRunRetryShortLinkError.checked = Boolean(message.payload.autoRunRetryShortLinkError);
        }
        if (message.payload.autoRunDelayEnabled !== undefined && inputAutoDelayEnabled) {
          inputAutoDelayEnabled.checked = Boolean(message.payload.autoRunDelayEnabled);
          updateAutoDelayInputState();
        }
        if (
          message.payload.step6CookieCleanupEnabled !== undefined
          && typeof inputStep6CookieCleanupEnabled !== 'undefined'
          && inputStep6CookieCleanupEnabled
        ) {
          inputStep6CookieCleanupEnabled.checked = Boolean(message.payload.step6CookieCleanupEnabled);
        }
        if (message.payload.autoRunDelayMinutes !== undefined && inputAutoDelayMinutes) {
          inputAutoDelayMinutes.value = String(normalizeAutoDelayMinutes(message.payload.autoRunDelayMinutes));
        }
        if (message.payload.autoRunFallbackThreadIntervalMinutes !== undefined) {
          inputAutoSkipFailuresThreadIntervalMinutes.value = String(
            normalizeAutoRunThreadIntervalMinutes(message.payload.autoRunFallbackThreadIntervalMinutes)
          );
          updateFallbackThreadIntervalInputState();
        }
        if (message.payload.autoStepDelaySeconds !== undefined) {
          inputAutoStepDelaySeconds.value = formatAutoStepDelayInputValue(message.payload.autoStepDelaySeconds);
        }
        if (message.payload.plusRemovedContactOauthDelaySeconds !== undefined && inputPlusRemovedContactOauthDelaySeconds) {
          inputPlusRemovedContactOauthDelaySeconds.value = String(
            normalizePlusRemovedContactOauthDelaySeconds(message.payload.plusRemovedContactOauthDelaySeconds)
          );
        }
        if (message.payload.chatgptSessionReaderCloudConversionEnabled !== undefined && inputChatgptSessionReaderCloudConversionEnabled) {
          inputChatgptSessionReaderCloudConversionEnabled.checked = Boolean(message.payload.chatgptSessionReaderCloudConversionEnabled);
          updateChatgptSessionReaderConversionModeUi();
        }
        if (message.payload.chatgptSessionReaderCloudConversionApiUrl !== undefined && inputChatgptSessionReaderCloudConversionApiUrl) {
          inputChatgptSessionReaderCloudConversionApiUrl.value = normalizeChatgptSessionReaderCloudConversionApiUrlValue(message.payload.chatgptSessionReaderCloudConversionApiUrl);
          validateChatgptSessionReaderCloudConversionConfig();
        }
        if (message.payload.chatgptSessionReaderCloudConversionApiKey !== undefined && inputChatgptSessionReaderCloudConversionApiKey) {
          inputChatgptSessionReaderCloudConversionApiKey.value = normalizeChatgptSessionReaderCloudConversionApiKeyValue(message.payload.chatgptSessionReaderCloudConversionApiKey);
        }
        if (message.payload.chatgptSessionReaderConversionProxyUrl !== undefined && inputChatgptSessionReaderConversionProxy) {
          inputChatgptSessionReaderConversionProxy.value = normalizeChatgptSessionReaderConversionProxyUrlValue(message.payload.chatgptSessionReaderConversionProxyUrl);
          updateChatgptSessionReaderConversionModeUi();
        }
        if (message.payload.removedContactVerificationUrl !== undefined && inputRemovedContactVerificationUrl) {
          inputRemovedContactVerificationUrl.value = normalizeRemovedContactVerificationUrlValue(message.payload.removedContactVerificationUrl);
          setRemovedContactManualCodeDisplay('未获取');
          validateRemovedContactContactConfig();
        }
        if (message.payload.removedContactFirstDirectResendEnabled !== undefined && inputRemovedContactFirstDirectResendEnabled) {
          inputRemovedContactFirstDirectResendEnabled.checked = Boolean(message.payload.removedContactFirstDirectResendEnabled);
        }
        if (message.payload.removedContactCardDeclinedRetryEnabled !== undefined && inputRemovedContactCardDeclinedRetryEnabled) {
          inputRemovedContactCardDeclinedRetryEnabled.checked = Boolean(message.payload.removedContactCardDeclinedRetryEnabled);
        }
        if (message.payload.removedContactFirstResendWaitSeconds !== undefined && inputRemovedContactFirstResendWaitSeconds) {
          inputRemovedContactFirstResendWaitSeconds.value = String(
            normalizeRemovedContactResendWaitSeconds(message.payload.removedContactFirstResendWaitSeconds, 20)
          );
        }
        if (message.payload.removedContactSubsequentResendWaitSeconds !== undefined && inputRemovedContactSubsequentResendWaitSeconds) {
          inputRemovedContactSubsequentResendWaitSeconds.value = String(
            normalizeRemovedContactResendWaitSeconds(message.payload.removedContactSubsequentResendWaitSeconds, 25)
          );
        }
        if (message.payload.removedContactVerificationPollAttempts !== undefined && inputRemovedContactVerificationPollAttempts) {
          inputRemovedContactVerificationPollAttempts.value = String(
            normalizeRemovedContactVerificationPollAttempts(message.payload.removedContactVerificationPollAttempts, 6)
          );
        }
        if (message.payload.removedContactVerificationPollIntervalSeconds !== undefined && inputRemovedContactVerificationPollIntervalSeconds) {
          inputRemovedContactVerificationPollIntervalSeconds.value = String(
            normalizeRemovedContactVerificationPollIntervalSeconds(message.payload.removedContactVerificationPollIntervalSeconds, 5)
          );
        }
        if (message.payload.removedContactVerificationResendMaxAttempts !== undefined && inputRemovedContactVerificationResendMaxAttempts) {
          inputRemovedContactVerificationResendMaxAttempts.value = String(
            normalizeRemovedContactVerificationResendMaxAttempts(message.payload.removedContactVerificationResendMaxAttempts, 1)
          );
        }
        if (message.payload.hotmailAliasEnabled !== undefined && inputHotmailAliasEnabled) {
          inputHotmailAliasEnabled.checked = Boolean(message.payload.hotmailAliasEnabled);
          updateMailProviderUI();
        }
        if (message.payload.outlookAliasMaxPerAccount !== undefined && inputOutlookAliasMaxPerAccount) {
          inputOutlookAliasMaxPerAccount.value = String(
            normalizeOutlookAliasMaxPerAccount(message.payload.outlookAliasMaxPerAccount)
          );
        }
        if (message.payload.oauthFlowTimeoutEnabled !== undefined && typeof inputOAuthFlowTimeoutEnabled !== 'undefined' && inputOAuthFlowTimeoutEnabled) {
          inputOAuthFlowTimeoutEnabled.checked = Boolean(message.payload.oauthFlowTimeoutEnabled);
        }
        if (message.payload.signupMethod !== undefined) {
          setSignupMethod(message.payload.signupMethod);
          updateSignupMethodUI();
        }
        updateAccountRunHistorySettingsUI();
        renderContributionMode();
        void syncPlusManualConfirmationDialog();
      }
      return undefined;
    }

    return { handleDataUpdated };
  }

  return { createRuntimeMessageDataHandler };
});
