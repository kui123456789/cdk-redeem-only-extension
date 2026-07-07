(function attachSidepanelAppController(root, factory) {
  const api = factory(root);
  root.SidepanelAppController = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis, function createSidepanelAppControllerModule(rootScope) {
  function createSidepanelApp(deps = {}) {
    let startPromise = null;
    return {
      start() {
        if (!startPromise) {
          startPromise = Promise.resolve().then(() => startSidepanelApp(deps));
        }
        return startPromise;
      },
    };
  }

  async function startSidepanelApp(deps = {}) {
    const window = deps.window || rootScope;
    const document = deps.document || window.document;
    const chrome = deps.chromeApi || window.chrome;
    const self = window;
    const rootScope = window;
// sidepanel/sidepanel.js — Side Panel logic

const STATUS_ICONS = {
  pending: '',
  running: '',
  completed: '完成',
  failed: '失败',
  stopped: '停止',
  manual_completed: '跳过',
  skipped: '跳过',
};

const dom = self.SidepanelDomBindings.getBindings();
const {
  logArea,
  btnOpenAccountRecords,
  accountRecordsOverlay,
  accountRecordsMeta,
  accountRecordsStats,
  accountRecordsList,
  accountRecordsPageLabel,
  btnAccountRecordsPrev,
  btnAccountRecordsNext,
  btnCloseAccountRecords,
  btnClearAccountRecords,
  btnExportSuccessAccountRecords,
  btnToggleAccountRecordsSelection,
  btnDeleteSelectedAccountRecords,
  updateSection,
  btnRepoHome,
  extensionUpdateStatus,
  extensionVersionMeta,
  btnReleaseLog,
  updateCardVersion,
  updateCardSummary,
  updateReleaseList,
  btnIgnoreRelease,
  btnOpenRelease,
  settingsCard,
  contributionModePanel,
  contributionModeBadge,
  contributionModeText,
  inputContributionNickname,
  inputContributionQq,
  contributionOauthStatus,
  contributionCallbackStatus,
  contributionModeSummary,
  btnStartContribution,
  btnOpenContributionUpload,
  btnExitContributionMode,
  displayOauthUrl,
  displayOauthLoginCode,
  displayLocalhostUrl,
  displayStatus,
  statusBar,
  inputEmail,
  inputPassword,
  btnToggleVpsUrl,
  btnToggleVpsPassword,
  btnFetchEmail,
  btnTogglePassword,
  btnExportCurrentSessionCpaJson,
  btnExportCurrentSessionSub2Json,
  btnSaveSettings,
  btnStop,
  btnReset,
  btnContributionMode,
  contributionUpdateLayer,
  contributionUpdateHint,
  contributionUpdateHintText,
  btnDismissContributionUpdateHint,
  stepsProgress,
  btnAutoRun,
  btnAutoContinue,
  autoContinueBar,
  autoScheduleBar,
  autoScheduleTitle,
  autoScheduleMeta,
  btnAutoRunNow,
  btnAutoCancelSchedule,
  btnClearLog,
  configMenuShell,
  btnConfigMenu,
  configMenu,
  btnExportSettings,
  btnImportSettings,
  inputImportSettingsFile,
  selectPanelMode,
  rowAccountAccessStrategy,
  selectAccountAccessStrategy,
  accountAccessStrategyCaption,
  rowLocalCpaJsonPluginDir,
  inputLocalCpaJsonPluginDir,
  rowLocalCpaJsonAdvancedToggle,
  btnToggleLocalCpaJsonAuthDir,
  rowLocalCpaJsonRelativeAuthDir,
  inputLocalCpaJsonRelativeAuthDir,
  rowVpsUrl,
  inputVpsUrl,
  rowVpsPassword,
  inputVpsPassword,
  rowLocalCpaStep9Mode,
  localCpaStep9ModeButtons,
  rowSub2ApiUrl,
  inputSub2ApiUrl,
  rowSub2ApiEmail,
  inputSub2ApiEmail,
  rowSub2ApiPassword,
  inputSub2ApiPassword,
  rowSub2ApiGroup,
  inputSub2ApiGroup,
  sub2ApiGroupPickerRoot,
  btnSub2ApiGroupMenu,
  sub2ApiGroupCurrent,
  sub2ApiGroupMenu,
  btnAddSub2ApiGroup,
  rowSub2ApiAccountPriority,
  inputSub2ApiAccountPriority,
  rowSub2ApiDefaultProxy,
  inputSub2ApiDefaultProxy,
  rowCodex2ApiUrl,
  inputCodex2ApiUrl,
  rowCodex2ApiAdminKey,
  inputCodex2ApiAdminKey,
  rowCustomPassword,
  rowPlusMode,
  inputPlusModeEnabled,
  chatgptSessionReaderModeSwitchGroup,
  inputChatgptSessionReaderModeUs,
  inputChatgptSessionReaderModeJp,
  rowPlusPaymentMethod,
  selectPlusPaymentMethod,
  rowLegacyWalletAccount,
  selectLegacyWalletAccount,
  legacyWalletAccountPickerRoot,
  btnLegacyWalletAccountMenu,
  legacyWalletAccountCurrent,
  legacyWalletAccountMenu,
  btnAddLegacyWalletAccount,
  btnUpiInfoCardKeyPurchase,
  plusPaymentMethodCaption,
  rowPlusRemovedContactOauthDelay,
  inputPlusRemovedContactOauthDelaySeconds,
  rowChatgptSessionReaderConversionProxy,
  inputChatgptSessionReaderConversionProxy,
  rowChatgptSessionReaderConversionProxyTest,
  btnChatgptSessionReaderConversionProxyTest,
  inputChatgptSessionReaderCloudConversionEnabled,
  rowChatgptSessionReaderCloudConversionApiUrl,
  inputChatgptSessionReaderCloudConversionApiUrl,
  rowChatgptSessionReaderCloudConversionApiKey,
  inputChatgptSessionReaderCloudConversionApiKey,
  displayChatgptSessionReaderConversionProxyTestResult,
  rowRemovedContactVerificationUrl,
  inputRemovedContactVerificationUrl,
  rowRemovedContactManualFetch,
  btnRemovedContactManualFetch,
  displayRemovedContactManualCode,
  rowRemovedContactResendSettings,
  inputRemovedContactFirstDirectResendEnabled,
  inputRemovedContactCardDeclinedRetryEnabled,
  inputRemovedContactFirstResendWaitSeconds,
  inputRemovedContactSubsequentResendWaitSeconds,
  inputRemovedContactVerificationPollAttempts,
  inputRemovedContactVerificationPollIntervalSeconds,
  inputRemovedContactVerificationResendMaxAttempts,
  rowUpiInfoHelperApi,
  inputUpiInfoHelperApi,
  btnUpiInfoHelperConvertApiKey,
  rowUpiInfoHelperCardKey,
  inputUpiInfoHelperCardKey,
  btnToggleUpiInfoHelperCardKey,
  btnUpiInfoHelperBalance,
  displayUpiInfoHelperBalance,
  rowUpiInfoHelperCountryCode,
  selectUpiInfoHelperCountryCode,
  rowUpiInfoHelperOtpChannel,
  selectUpiInfoHelperOtpChannel,
  rowUpiInfoHelperPin,
  inputUpiInfoHelperPin,
  btnToggleUpiInfoHelperPin,
  rowUpiSubscriptionApiBaseUrl,
  inputUpiSubscriptionApiBaseUrl,
  rowUpiRedeemExternalApiKey,
  inputUpiRedeemExternalApiKey,
  btnToggleUpiRedeemExternalApiKey,
  rowUpiRedeemClientId,
  inputUpiRedeemClientId,
  rowUpiRedeemFailedAccountRetryLimit,
  inputUpiRedeemFailedAccountRetryLimit,
  rowTotpMfaAfterProfileEnabled,
  inputTotpMfaAfterProfileEnabled,
  rowRegistrationFreeRoute,
  selectRegistrationFreeRoute,
  rowSetGptPasswordVerificationWaitSeconds,
  inputSetGptPasswordVerificationWaitSeconds,
  rowUpiCredentialMembershipTotpApiBaseUrl,
  inputUpiCredentialMembershipTotpApiBaseUrl,
  rowUpiCredentialMembershipTotpLookupKey,
  inputUpiCredentialMembershipTotpLookupKey,
  rowUpiRedeemStopAfterRedeem,
  selectUpiRedeemAfterMode,
  inputUpiRedeemStopAfterRedeem,
  rowUpiRedeemCdkeyPool,
  inputUpiRedeemCdkeyPool,
  btnImportCdkPool,
  btnDeleteAllCdkPool,
  upiRedeemCdkeyPoolSummary,
  inputIdealRedeemCdkeyPool,
  btnImportIdealCdkPool,
  btnDeleteAllIdealCdkPool,
  idealRedeemCdkeyPoolSummary,
  btnShowUpiCredentialBackups,
  btnExportUpiCredentialBackups,
  btnCheckUpiCredentialMembershipLocal,
  btnImportUpiCredentialMembershipTxt,
  btnImportUpiCredentialMembershipFreeTxt,
  btnStopUpiCredentialMembershipCheck,
  inputUpiCredentialMembershipTxt,
  btnExportUpiRedeemSuccessRecords,
  btnUpiRedeemCdkeyStatusRefresh,
  upiCredentialBackupPreviewWrap,
  upiCredentialBackupPreview,
  upiCredentialMembershipCheckResults,
  upiRedeemCdkeyStatusList,
  idealRedeemCdkeyStatusList,
  rowLegacyPayCountryCode,
  selectLegacyPayCountryCode,
  rowLegacyPayOtp,
  inputLegacyPayOtp,
  rowLegacyPayPin,
  inputLegacyPayPin,
  selectMailProvider,
  btnMailLogin,
  rowCustomMailProviderPool,
  inputCustomMailProviderPool,
  rowMail2925Mode,
  rowMail2925PoolSettings,
  mail2925ModeButtons,
  rowEmailGenerator,
  selectEmailGenerator,
  rowCustomEmailPool,
  inputCustomEmailPool,
  btnCustomEmailPoolRefresh,
  btnCustomEmailPoolClearUsed,
  btnCustomEmailPoolDeleteAll,
  inputCustomEmailPoolImport,
  btnCustomEmailPoolImport,
  inputSignupVerificationCodeWaitSeconds,
  customEmailPoolSummary,
  inputCustomEmailPoolSearch,
  selectCustomEmailPoolFilter,
  checkboxCustomEmailPoolSelectAll,
  customEmailPoolSelectionSummary,
  btnCustomEmailPoolBulkUsed,
  btnCustomEmailPoolBulkUnused,
  btnCustomEmailPoolBulkEnable,
  btnCustomEmailPoolBulkDisable,
  btnCustomEmailPoolBulkDelete,
  customEmailPoolList,
  rowTempEmailBaseUrl,
  inputTempEmailBaseUrl,
  rowTempEmailAdminAuth,
  inputTempEmailAdminAuth,
  rowTempEmailCustomAuth,
  inputTempEmailCustomAuth,
  rowTempEmailLookupMode,
  tempEmailLookupModeButtons,
  rowTempEmailReceiveMailbox,
  inputTempEmailReceiveMailbox,
  rowTempEmailRandomSubdomainToggle,
  inputTempEmailUseRandomSubdomain,
  rowTempEmailDomain,
  selectTempEmailDomain,
  tempEmailDomainPickerRoot,
  btnTempEmailDomainMenu,
  tempEmailDomainCurrent,
  tempEmailDomainMenu,
  inputTempEmailDomain,
  btnTempEmailDomainMode,
  cloudflareTempEmailSection,
  btnCloudflareTempEmailUsageGuide,
  btnCloudflareTempEmailGithub,
  cloudMailSection,
  rowCloudMailBaseUrl,
  rowCloudMailAdminEmail,
  rowCloudMailAdminPassword,
  rowCloudMailReceiveMailbox,
  rowCloudMailDomain,
  inputCloudMailBaseUrl,
  inputCloudMailAdminEmail,
  inputCloudMailAdminPassword,
  inputCloudMailReceiveMailbox,
  inputCloudMailDomain,
  freemailSection,
  btnFreemailGithub,
  rowFreemailBaseUrl,
  rowFreemailAdminUsername,
  rowFreemailAdminPassword,
  rowFreemailDomain,
  inputFreemailBaseUrl,
  inputFreemailAdminUsername,
  inputFreemailAdminPassword,
  inputFreemailDomain,
  moemailSection,
  btnMoemailDocs,
  rowMoemailBaseUrl,
  rowMoemailApiKey,
  rowMoemailDomain,
  inputMoemailBaseUrl,
  inputMoemailApiKey,
  inputMoemailDomain,
  yydsmailSection,
  btnYydsMailDocs,
  rowYydsMailBaseUrl,
  rowYydsMailApiKey,
  rowYydsMailDomain,
  inputYydsMailBaseUrl,
  inputYydsMailApiKey,
  inputYydsMailDomain,
  outlookEmailPlusSection,
  btnOutlookEmailPlusGithub,
  rowOutlookEmailPlusBaseUrl,
  rowOutlookEmailPlusApiKey,
  rowOutlookEmailPlusProvider,
  rowOutlookEmailPlusProjectKey,
  rowOutlookEmailPlusCallerIdPrefix,
  rowOutlookEmailPlusAliasMax,
  inputOutlookEmailPlusBaseUrl,
  inputOutlookEmailPlusApiKey,
  inputOutlookEmailPlusProvider,
  inputOutlookEmailPlusProjectKey,
  inputOutlookEmailPlusCallerIdPrefix,
  inputOutlookEmailPlusAliasMaxPerMailbox,
  hotmailSection,
  mail2925Section,
  luckmailSection,
  icloudSection,
  icloudSummary,
  icloudList,
  icloudLoginHelp,
  icloudLoginHelpTitle,
  icloudLoginHelpText,
  btnIcloudLoginDone,
  btnIcloudRefresh,
  btnIcloudDeleteUsed,
  selectIcloudHostPreference,
  rowIcloudTargetMailboxType,
  selectIcloudTargetMailboxType,
  rowIcloudForwardMailProvider,
  selectIcloudForwardMailProvider,
  rowIcloudApiBaseUrl,
  rowIcloudApiAdminKey,
  inputIcloudApiBaseUrl,
  inputIcloudApiAdminKey,
  selectIcloudFetchMode,
  checkboxAutoDeleteIcloud,
  inputIcloudSearch,
  selectIcloudFilter,
  checkboxIcloudSelectAll,
  icloudSelectionSummary,
  btnIcloudBulkUsed,
  btnIcloudBulkUnused,
  btnIcloudBulkPreserve,
  btnIcloudBulkUnpreserve,
  btnIcloudBulkDelete,
  rowHotmailServiceMode,
  hotmailServiceModeButtons,
  rowHotmailRemoteBaseUrl,
  inputHotmailRemoteBaseUrl,
  rowHotmailLocalBaseUrl,
  inputHotmailLocalBaseUrl,
  rowHotmailAliasEnabled,
  inputHotmailAliasEnabled,
  rowOutlookAliasMax,
  inputOutlookAliasMaxPerAccount,
  inputHotmailEmail,
  inputHotmailClientId,
  inputHotmailPassword,
  inputHotmailRefreshToken,
  inputHotmailImport,
  inputHotmailSearch,
  selectHotmailFilter,
  btnAddHotmailAccount,
  btnImportHotmailAccounts,
  btnToggleHotmailForm,
  btnHotmailUsageGuide,
  btnClearUsedHotmailAccounts,
  btnDeleteAllHotmailAccounts,
  btnToggleHotmailList,
  hotmailFormShell,
  hotmailListShell,
  hotmailAccountsList,
  removedPaymentWorkerSection,
  displayRemovedPaymentWorkerStatus,
  inputRemovedPaymentWorkerEnabled,
  removedPaymentWorkerSettingsShell,
  selectRemovedPaymentWorkerBrowserBackend,
  rowRemovedPaymentWorkerAdsPowerApiBase,
  inputRemovedPaymentWorkerAdsPowerApiBase,
  rowRemovedPaymentWorkerAdsPowerApiKey,
  inputRemovedPaymentWorkerAdsPowerApiKey,
  rowRemovedPaymentWorkerRoxyBrowserApiBase,
  inputRemovedPaymentWorkerRoxyBrowserApiBase,
  rowRemovedPaymentWorkerRoxyBrowserApiKey,
  inputRemovedPaymentWorkerRoxyBrowserApiKey,
  rowRemovedPaymentWorkerAdsPowerProfileId,
  inputRemovedPaymentWorkerAdsPowerProfileId,
  rowRemovedPaymentWorkerRoxyBrowserProfileId,
  inputRemovedPaymentWorkerRoxyBrowserProfileId,
  inputRemovedPaymentWorkerStripePublishableKey,
  inputRemovedPaymentWorkerDeviceId,
  inputRemovedPaymentWorkerUserAgent,
  inputRemovedPaymentWorkerMaxAttempts,
  selectRemovedPaymentWorkerPaymentLocale,
  inputRemovedPaymentWorkerCheckoutRebuildMaxAttempts,
  inputRemovedPaymentWorkerDefaultProxy,
  rowRemovedPaymentWorkerProviderProxy,
  inputRemovedPaymentWorkerProviderProxy,
  btnSaveRemovedPaymentWorkerSettings,
  btnClearRemovedPaymentWorkerSettings,
  btnRemovedPaymentWorkerPause,
  btnRemovedPaymentWorkerResume,
  displayRemovedPaymentWorkerRuntime,
  inputMail2925Email,
  inputMail2925Password,
  inputMail2925Import,
  inputMail2925Search,
  selectMail2925Filter,
  btnAddMail2925Account,
  btnToggleMail2925Form,
  btnImportMail2925Accounts,
  btnDeleteAllMail2925Accounts,
  btnToggleMail2925List,
  mail2925FormShell,
  mail2925ListShell,
  mail2925AccountsList,
  inputLuckmailApiKey,
  inputLuckmailBaseUrl,
  selectLuckmailEmailType,
  inputLuckmailDomain,
  btnLuckmailRefresh,
  btnLuckmailDisableUsed,
  luckmailSummary,
  inputLuckmailSearch,
  selectLuckmailFilter,
  checkboxLuckmailSelectAll,
  luckmailSelectionSummary,
  btnLuckmailBulkUsed,
  btnLuckmailBulkUnused,
  btnLuckmailBulkPreserve,
  btnLuckmailBulkUnpreserve,
  btnLuckmailBulkDisable,
  btnLuckmailBulkEnable,
  luckmailList,
  rowEmailPrefix,
  labelEmailPrefix,
  inputEmailPrefix,
  selectMail2925PoolAccount,
  inputMail2925UseAccountPool,
  labelMail2925UseAccountPool,
  rowInbucketHost,
  inputInbucketHost,
  rowInbucketMailbox,
  inputInbucketMailbox,
  rowCfDomain,
  selectCfDomain,
  cfDomainPickerRoot,
  btnCfDomainMenu,
  cfDomainCurrent,
  cfDomainMenu,
  inputCfDomain,
  btnCfDomainMode,
  inputRunCount,
  inputAutoSkipFailures,
  inputAutoRunRetryNonFreeTrial,
  inputAutoRunRetryLegacyWalletCallback,
  inputAutoRunRetryShortLinkError,
  inputAutoSkipFailuresThreadIntervalMinutes,
  inputStep6CookieCleanupEnabled,
  inputAutoDelayEnabled,
  inputAutoDelayMinutes,
  inputAutoStepDelaySeconds,
  inputOperationDelayEnabled,
  inputOAuthFlowTimeoutEnabled,
  rowAccountRunHistoryHelperBaseUrl,
  inputAccountRunHistoryHelperBaseUrl,
  autoStartModal,
  sharedFormModal,
  sharedFormModalTitle,
  btnSharedFormModalClose,
  sharedFormModalMessage,
  sharedFormModalAlert,
  sharedFormModalFields,
  btnSharedFormModalCancel,
  btnSharedFormModalConfirm,
  autoStartTitle,
  autoStartMessage,
  autoStartAlert,
  modalOptionRow,
  modalOptionInput,
  modalOptionText,
  btnAutoStartClose,
  btnAutoStartCancel,
  btnAutoStartRestart,
  btnAutoStartContinue,
  autoHintText,
  stepsList,
  toastContainer,
} = dom;

const actionModalService = window.SidepanelActionModalService?.createActionModalService?.({
  dom: {
    modal: autoStartModal,
    title: autoStartTitle,
    message: autoStartMessage,
    alert: autoStartAlert,
    optionRow: modalOptionRow,
    optionInput: modalOptionInput,
    optionText: modalOptionText,
    cancelButton: btnAutoStartCancel,
    restartButton: btnAutoStartRestart,
    continueButton: btnAutoStartContinue,
  },
});

const PLUS_PAYMENT_METHOD_LEGACY_WALLET = 'legacyWallet';
const PLUS_PAYMENT_METHOD_LEGACY_PAY = 'legacyPay';
const PLUS_PAYMENT_METHOD_UPI_INFO_HELPER = 'upiInfo-helper';
const PLUS_PAYMENT_METHOD_UPI = 'upi';
const BUILTIN_CHATGPT_SESSION_READER_CLOUD_CONVERSION_API_URL = 'https://gujumpgate.zg.fyi/api/checkout';
const BUILTIN_CHATGPT_SESSION_READER_CLOUD_CONVERSION_API_KEY = '';
const PLUS_ACCOUNT_ACCESS_STRATEGY_OAUTH = 'oauth';
const ACCOUNT_ACCESS_STRATEGY_UI_OAUTH = 'oauth';
const ACCOUNT_ACCESS_STRATEGY_UI_SESSION_JSON = 'session_json';
const DEFAULT_UPI_INFO_HELPER_API_URL = 'https://your-upiInfo-helper-domain.example';
const UPI_INFO_HELPER_PORTAL_URL = '';
const DEFAULT_PLUS_PAYMENT_METHOD = PLUS_PAYMENT_METHOD_UPI;
const CHATGPT_SESSION_READER_MODE_US_PP = 'us_pp';
const CHATGPT_SESSION_READER_MODE_JP_PP = 'jp_pp';
const DEFAULT_CHATGPT_SESSION_READER_MODE = CHATGPT_SESSION_READER_MODE_US_PP;
const CHATGPT_SESSION_READER_MODE_LABELS = Object.freeze({
  [CHATGPT_SESSION_READER_MODE_US_PP]: '美区PP ChatGPT 会话读取',
  [CHATGPT_SESSION_READER_MODE_JP_PP]: '日区PP ChatGPT 会话读取',
});
const REMOVED_PAYMENT_WORKER_DEFAULT_MAX_ATTEMPTS = 10;
const REMOVED_PAYMENT_WORKER_MAX_ATTEMPTS_LIMIT = 20;
const REMOVED_PAYMENT_WORKER_ALLOWED_PAYMENT_LOCALES = new Set(['en', 'zh-CN', 'zh-TW', 'ja', 'ko', 'de', 'fr', 'es', 'id', 'pt-BR']);
const CHATGPT_SESSION_READER_PROFILE_SETTING_KEYS = Object.freeze([
  'removedContactVerificationUrl',
  'removedContactCardDeclinedRetryEnabled',
  'removedContactFirstDirectResendEnabled',
  'removedContactFirstResendWaitSeconds',
  'removedContactSubsequentResendWaitSeconds',
  'removedContactVerificationResendMaxAttempts',
  'removedContactVerificationPollAttempts',
  'removedContactVerificationPollIntervalSeconds',
]);
const FIXED_PLUS_MODE_ENABLED = true;
const GUIDE_REPOSITORY_URL = 'https://github.com/kui123456789/cdk-redeem-only-extension';
const SIGNUP_METHOD_EMAIL = 'email';
const DEFAULT_SIGNUP_METHOD = SIGNUP_METHOD_EMAIL;
const DEFAULT_ACTIVE_FLOW_ID = 'openai';
const DEFAULT_TOTP_MFA_AFTER_PROFILE_ENABLED = true;
const REGISTRATION_FREE_ROUTE_FULL_2FA = 'full-2fa';
const REGISTRATION_FREE_ROUTE_NO_2FA = 'no-2fa-free';
const REGISTRATION_FREE_ROUTE_PASSKEY = 'passkey-free';
const DEFAULT_REGISTRATION_FREE_ROUTE = REGISTRATION_FREE_ROUTE_FULL_2FA;
const DEFAULT_SET_GPT_PASSWORD_VERIFICATION_WAIT_SECONDS = 10;
const SET_GPT_PASSWORD_VERIFICATION_WAIT_MAX_SECONDS = 300;
const DEFAULT_UPI_REDEEM_FAILED_ACCOUNT_RETRY_LIMIT = 3;
const UPI_REDEEM_FAILED_ACCOUNT_RETRY_LIMIT_MAX = 20;
const DEFAULT_SIGNUP_VERIFICATION_CODE_WAIT_SECONDS = 10;
const SIGNUP_VERIFICATION_CODE_WAIT_MAX_SECONDS = 300;

const appState = window.SidepanelAppState.createSidepanelAppState({
      latestState: undefined,
      localChatgptSessionReaderMode: undefined,
      localChatgptSessionReaderProfiles: undefined,
      currentPlusModeEnabled: undefined,
      currentPlusPaymentMethod: undefined,
      currentPlusAccountAccessStrategy: undefined,
      currentSignupMethod: undefined,
      currentUpiRedeemStopAfterRedeem: undefined,
      currentTotpMfaAfterProfileEnabled: undefined,
      currentRegistrationFreeRoute: undefined,
      localCpaJsonAuthDirExpanded: undefined,
      lastConfirmedOperationDelayEnabled: undefined,
      stepDefinitions: undefined,
      workflowNodes: undefined,
      STEP_IDS: undefined,
      STEP_DEFAULT_STATUSES: undefined,
      SKIPPABLE_STEPS: undefined,
      NODE_IDS: undefined,
      NODE_DEFAULT_STATUSES: undefined,
      SKIPPABLE_NODES: undefined,
      currentAutoRun: undefined,
      settingsDirty: undefined,
      settingsSaveInFlight: undefined,
      settingsAutoSaveTimer: undefined,
      settingsSaveRevision: undefined,
      customPasswordSaveRevision: undefined,
      cloudflareDomainEditMode: undefined,
      cloudflareTempEmailDomainEditMode: undefined,
      activePlusManualConfirmationRequestId: undefined,
      plusManualConfirmationDialogInFlight: undefined,
      configActionInFlight: undefined,
      currentReleaseSnapshot: undefined,
      currentContributionContentSnapshot: undefined,
      contributionContentSnapshotRequestInFlight: undefined,
      accountRecordsManager: undefined,
      settingsStateManager: undefined,
      workflowControlsManager: undefined,
      settingsTransferManager: undefined,
      customEmailPoolEntriesState: undefined,
      lastLocalHelperStartupAlertAt: undefined,
      customEmailPoolManager: undefined,
      cdkPoolManager: undefined,
      accountRunHistoryRefreshTimer: undefined,
      flowCapabilityRegistry: undefined,
});

with (appState.createScope()) {
  function buildSettingsControllerScopeValues() {
    return {
      btnSaveSettings,
      collectSettingsPayload,
      sendRuntimeMessageWithTimeout,
      applySettingsState,
      syncLatestState,
      updatePanelModeUI,
      updateMailProviderUI,
      updateButtonStates,
      updateConfigMenuControls,
      showToast,
      currentAutoRun,
    };
  }

  function buildRuntimeMessageControllerScopeValues() {
    return {
      accountRecordsManager,
      appendLog,
      applyAutoRunStatus,
      applyChatgptSessionReaderProfileToInputs,
      applyOperationDelayState,
      checkboxAutoDeleteIcloud,
      currentAutoRun,
      DEFAULT_PANEL_MODE,
      DEFAULT_SIGNUP_METHOD,
      displayLocalhostUrl,
      displayOauthUrl,
      displayStatus,
      displayUpiInfoHelperBalance,
      document,
      formatAutoStepDelayInputValue,
      getAccountAccessStrategyUiValueForState,
      getCurrentHotmailEmail,
      getCurrentLuckmailEmail,
      getExportTargetForPanelMode,
      getSelectedRegistrationFreeRoute,
      getSelectedTotpMfaAfterProfileEnabled,
      getSelectedUpiRedeemStopAfterRedeem,
      icloudSummary,
      inputAccountRunHistoryHelperBaseUrl,
      inputAutoDelayEnabled,
      inputAutoDelayMinutes,
      inputAutoRunRetryLegacyWalletCallback,
      inputAutoRunRetryNonFreeTrial,
      inputAutoRunRetryShortLinkError,
      inputAutoSkipFailures,
      inputAutoSkipFailuresThreadIntervalMinutes,
      inputAutoStepDelaySeconds,
      inputChatgptSessionReaderCloudConversionApiKey,
      inputChatgptSessionReaderCloudConversionApiUrl,
      inputChatgptSessionReaderCloudConversionEnabled,
      inputChatgptSessionReaderConversionProxy,
      inputCloudMailAdminEmail,
      inputCloudMailAdminPassword,
      inputCloudMailBaseUrl,
      inputCloudMailDomain,
      inputCloudMailReceiveMailbox,
      inputCustomMailProviderPool,
      inputEmail,
      inputFreemailAdminPassword,
      inputFreemailAdminUsername,
      inputFreemailBaseUrl,
      inputFreemailDomain,
      inputHotmailAliasEnabled,
      inputIcloudApiAdminKey,
      inputIcloudApiBaseUrl,
      inputLuckmailApiKey,
      inputLuckmailBaseUrl,
      inputLuckmailDomain,
      inputMoemailApiKey,
      inputMoemailBaseUrl,
      inputMoemailDomain,
      inputOAuthFlowTimeoutEnabled,
      inputOutlookAliasMaxPerAccount,
      inputOutlookEmailPlusAliasMaxPerMailbox,
      inputOutlookEmailPlusApiKey,
      inputOutlookEmailPlusBaseUrl,
      inputOutlookEmailPlusCallerIdPrefix,
      inputOutlookEmailPlusProjectKey,
      inputOutlookEmailPlusProvider,
      inputPlusModeEnabled,
      inputPlusRemovedContactOauthDelaySeconds,
      inputRemovedContactCardDeclinedRetryEnabled,
      inputRemovedContactFirstDirectResendEnabled,
      inputRemovedContactFirstResendWaitSeconds,
      inputRemovedContactSubsequentResendWaitSeconds,
      inputRemovedContactVerificationPollAttempts,
      inputRemovedContactVerificationPollIntervalSeconds,
      inputRemovedContactVerificationResendMaxAttempts,
      inputRemovedContactVerificationUrl,
      inputSetGptPasswordVerificationWaitSeconds,
      inputSignupVerificationCodeWaitSeconds,
      inputStep6CookieCleanupEnabled,
      inputTempEmailAdminAuth,
      inputTempEmailBaseUrl,
      inputTempEmailCustomAuth,
      inputTempEmailReceiveMailbox,
      inputTempEmailUseRandomSubdomain,
      inputTotpMfaAfterProfileEnabled,
      inputUpiCredentialMembershipTotpApiBaseUrl,
      inputUpiCredentialMembershipTotpLookupKey,
      inputUpiRedeemClientId,
      inputUpiRedeemExternalApiKey,
      inputUpiRedeemFailedAccountRetryLimit,
      inputUpiRedeemStopAfterRedeem,
      inputUpiSubscriptionApiBaseUrl,
      inputYydsMailApiKey,
      inputYydsMailBaseUrl,
      inputYydsMailDomain,
      isLocalHelperStartupErrorMessage,
      isLuckmailProvider,
      logArea,
      NODE_DEFAULT_STATUSES,
      normalizeAccountRunHistoryHelperBaseUrlValue,
      normalizeAutoDelayMinutes,
      normalizeAutoRunThreadIntervalMinutes,
      normalizeChatgptSessionReaderCloudConversionApiKeyValue,
      normalizeChatgptSessionReaderCloudConversionApiUrlValue,
      normalizeChatgptSessionReaderConversionProxyUrlValue,
      normalizeCustomEmailPoolEntryValues,
      normalizeIcloudApiBaseUrlValue,
      normalizeIcloudFetchMode,
      normalizeIcloudForwardMailProvider,
      normalizeIcloudTargetMailboxType,
      normalizeLuckmailBaseUrl,
      normalizeLuckmailEmailType,
      normalizeOutlookAliasMaxPerAccount,
      normalizeOutlookEmailPlusAliasMaxPerMailbox,
      normalizeOutlookEmailPlusCallerIdPrefixValue,
      normalizeOutlookEmailPlusProjectKeyValue,
      normalizeOutlookEmailPlusProviderValue,
      normalizePlusPaymentMethod,
      normalizePlusRemovedContactOauthDelaySeconds,
      normalizeRegistrationFreeRoute,
      normalizeRemovedContactResendWaitSeconds,
      normalizeRemovedContactVerificationPollAttempts,
      normalizeRemovedContactVerificationPollIntervalSeconds,
      normalizeRemovedContactVerificationResendMaxAttempts,
      normalizeRemovedContactVerificationUrlValue,
      normalizeSignupMethod,
      normalizeUpiInfoOtpChannelValue,
      normalizeUpiRedeemFailedAccountRetryLimit,
      openConfirmModal,
      openCustomVerificationConfirmDialog,
      openLegacyPayOtpInputDialog,
      queueCustomEmailPoolRefresh,
      queueIcloudAliasRefresh,
      queueLuckmailPurchaseRefresh,
      renderAccountRecords,
      renderCloudflareTempEmailDomainOptions,
      renderContributionMode,
      renderCustomEmailPoolEntries,
      renderHotmailAccounts,
      renderLegacyWalletAccounts,
      renderMail2925Accounts,
      renderStepStatuses,
      renderSub2ApiGroupOptions,
      resetCustomEmailPoolManager,
      resetIcloudManager,
      resetLuckmailManager,
      resolveStepDefinitionCapabilityState,
      restoreCustomEmailPoolEntriesFromState,
      scheduleAccountRunHistoryRefresh,
      scheduleUpiRedeemCdkeyStatusAutoRefresh,
      selectAccountAccessStrategy,
      selectIcloudFetchMode,
      selectIcloudForwardMailProvider,
      selectIcloudHostPreference,
      selectIcloudTargetMailboxType,
      selectLuckmailEmailType,
      selectMailProvider,
      selectPanelMode,
      selectPlusPaymentMethod,
      selectRegistrationFreeRoute,
      selectUpiInfoHelperOtpChannel,
      setCloudflareTempEmailLookupMode,
      setCustomEmailPoolEntriesState,
      setLocalCpaStep9Mode,
      setManagedAliasBaseEmailInputForProvider,
      setOauthLoginCodeDisplay,
      setRemovedContactManualCodeDisplay,
      setSharedVerificationCodeWaitInputs,
      setSignupMethod,
      showIcloudLoginHelp,
      showLocalHelperStartupAlert,
      showToast,
      statusBar,
      syncAutoRunState,
      syncLatestState,
      syncPasswordField,
      syncPlusManualConfirmationDialog,
      syncRunCountFromConfiguredEmailPool,
      syncRunCountFromCustomMailProviderPool,
      syncStepDefinitionsForMode,
      syncTotpMfaAfterProfileStepDefinitions,
      syncUpiRedeemAfterModeControls,
      syncUpiRedeemAfterModeStepDefinitions,
      updateAccountRunHistorySettingsUI,
      updateAllUpiRedeemCdkeyPoolSummaries,
      updateAutoDelayInputState,
      updateButtonStates,
      updateChatgptSessionReaderConversionModeUi,
      updateFallbackThreadIntervalInputState,
      updateMailProviderUI,
      updateNodeUI,
      updatePanelModeUI,
      updatePlusModeUI,
      updateProgressCounter,
      updateRemovedPaymentWorkerUi,
      updateSignupMethodUI,
      updateStatusDisplay,
      validateChatgptSessionReaderCloudConversionConfig,
      validateRemovedContactContactConfig,
    };
  }
  latestState = null;
  localChatgptSessionReaderMode = DEFAULT_CHATGPT_SESSION_READER_MODE;
  localChatgptSessionReaderProfiles = {
    [CHATGPT_SESSION_READER_MODE_US_PP]: null,
    [CHATGPT_SESSION_READER_MODE_JP_PP]: null,
  };
  currentPlusModeEnabled = false;
  currentPlusPaymentMethod = DEFAULT_PLUS_PAYMENT_METHOD;
  currentPlusAccountAccessStrategy = PLUS_ACCOUNT_ACCESS_STRATEGY_OAUTH;
  currentSignupMethod = DEFAULT_SIGNUP_METHOD;
  currentUpiRedeemStopAfterRedeem = true;
  currentTotpMfaAfterProfileEnabled = DEFAULT_TOTP_MFA_AFTER_PROFILE_ENABLED;
  currentRegistrationFreeRoute = DEFAULT_REGISTRATION_FREE_ROUTE;
  localCpaJsonAuthDirExpanded = false;
  lastConfirmedOperationDelayEnabled = false;
  stepDefinitions = getStepDefinitionsForMode(false, {
    plusPaymentMethod: currentPlusPaymentMethod,
    plusAccountAccessStrategy: currentPlusAccountAccessStrategy,
    signupMethod: currentSignupMethod,
    upiRedeemStopAfterRedeem: currentUpiRedeemStopAfterRedeem,
    totpMfaAfterProfileEnabled: currentTotpMfaAfterProfileEnabled,
    registrationFreeRoute: currentRegistrationFreeRoute,
  });
  workflowNodes = getWorkflowNodesForMode(false, {
    plusPaymentMethod: currentPlusPaymentMethod,
    plusAccountAccessStrategy: currentPlusAccountAccessStrategy,
    signupMethod: currentSignupMethod,
    upiRedeemStopAfterRedeem: currentUpiRedeemStopAfterRedeem,
    totpMfaAfterProfileEnabled: currentTotpMfaAfterProfileEnabled,
    registrationFreeRoute: currentRegistrationFreeRoute,
  });
  STEP_IDS = stepDefinitions.map((step) => Number(step.id)).filter(Number.isFinite);
  STEP_DEFAULT_STATUSES = Object.fromEntries(STEP_IDS.map((stepId) => [stepId, 'pending']));
  SKIPPABLE_STEPS = new Set(STEP_IDS);
  NODE_IDS = workflowNodes.map((node) => String(node.nodeId || '').trim()).filter(Boolean);
  NODE_DEFAULT_STATUSES = Object.fromEntries(NODE_IDS.map((nodeId) => [nodeId, 'pending']));
  SKIPPABLE_NODES = new Set(NODE_IDS);
  const INDEPENDENT_EXECUTE_NODES = new Set(['enable-totp-mfa', 'enable-passkey']);
  const AUTO_DELAY_MIN_MINUTES = 1;
  const AUTO_DELAY_MAX_MINUTES = 1440;
  const AUTO_DELAY_DEFAULT_MINUTES = 30;
  const AUTO_FALLBACK_THREAD_INTERVAL_MIN_MINUTES = 0;
  const AUTO_FALLBACK_THREAD_INTERVAL_MAX_MINUTES = 1440;
  const AUTO_FALLBACK_THREAD_INTERVAL_DEFAULT_MINUTES = 0;
  const AUTO_RUN_MAX_RETRIES_PER_ROUND = 3;
  const AUTO_STEP_DELAY_MIN_SECONDS = 0;
  const AUTO_STEP_DELAY_MAX_SECONDS = 600;
  const AUTO_STEP_DELAY_DEFAULT_SECONDS = 10;
  const VERIFICATION_RESEND_COUNT_MIN = 0;
  const VERIFICATION_RESEND_COUNT_MAX = 20;
  const DEFAULT_VERIFICATION_RESEND_COUNT = 0;
  const LOCAL_CPA_JSON_PANEL_MODE = 'local-cpa-json';
  const LOCAL_CPA_JSON_NO_RT_PANEL_MODE = 'local-cpa-json-no-rt';
  const DEFAULT_PANEL_MODE = LOCAL_CPA_JSON_PANEL_MODE;
  const DEFAULT_LOCAL_CPA_JSON_RELATIVE_AUTH_DIR = '.cli-proxy-api';
  const DEFAULT_LOCAL_CPA_STEP9_MODE = 'submit';
  const DEFAULT_CPA_CALLBACK_MODE = 'step8';
  const MAIL_2925_MODE_PROVIDE = 'provide';
  const MAIL_2925_MODE_RECEIVE = 'receive';
  const DEFAULT_MAIL_2925_MODE = MAIL_2925_MODE_PROVIDE;
  const CLOUDFLARE_TEMP_EMAIL_LOOKUP_MODE_RECEIVE_MAILBOX = 'receive-mailbox';
  const CLOUDFLARE_TEMP_EMAIL_LOOKUP_MODE_REGISTRATION_EMAIL = 'registration-email';
  const DEFAULT_CLOUDFLARE_TEMP_EMAIL_LOOKUP_MODE = CLOUDFLARE_TEMP_EMAIL_LOOKUP_MODE_RECEIVE_MAILBOX;
  const NEW_USER_GUIDE_PROMPT_DISMISSED_STORAGE_KEY = 'multipage-new-user-guide-prompt-dismissed';
  const AUTO_SKIP_FAILURES_PROMPT_DISMISSED_STORAGE_KEY = 'multipage-auto-skip-failures-prompt-dismissed';
  const AUTO_RUN_FALLBACK_RISK_PROMPT_DISMISSED_STORAGE_KEY = 'multipage-auto-run-fallback-risk-prompt-dismissed';
  const CLOUDFLARE_TEMP_EMAIL_REGISTRATION_LOOKUP_PROMPT_DISMISSED_STORAGE_KEY = 'multipage-cloudflare-temp-email-registration-lookup-prompt-dismissed';
  const autoRunNormalizers = window.SidepanelAutoRunNormalizers.createAutoRunNormalizers({
    autoDelayDefaultMinutes: AUTO_DELAY_DEFAULT_MINUTES,
    autoDelayMaxMinutes: AUTO_DELAY_MAX_MINUTES,
    autoDelayMinMinutes: AUTO_DELAY_MIN_MINUTES,
    autoRunThreadIntervalDefaultMinutes: AUTO_FALLBACK_THREAD_INTERVAL_DEFAULT_MINUTES,
    autoRunThreadIntervalMaxMinutes: AUTO_FALLBACK_THREAD_INTERVAL_MAX_MINUTES,
    autoRunThreadIntervalMinMinutes: AUTO_FALLBACK_THREAD_INTERVAL_MIN_MINUTES,
    autoStepDelayDefaultSeconds: AUTO_STEP_DELAY_DEFAULT_SECONDS,
    autoStepDelayMaxSeconds: AUTO_STEP_DELAY_MAX_SECONDS,
    autoStepDelayMinSeconds: AUTO_STEP_DELAY_MIN_SECONDS,
  });
  const chatgptSessionReaderSettings = window.SidepanelChatgptSessionReaderSettings.createChatgptSessionReaderSettings({
    chatgptSessionReaderModeUs: CHATGPT_SESSION_READER_MODE_US_PP,
    chatgptSessionReaderModeJp: CHATGPT_SESSION_READER_MODE_JP_PP,
    defaultChatgptSessionReaderMode: DEFAULT_CHATGPT_SESSION_READER_MODE,
    profileSettingKeys: CHATGPT_SESSION_READER_PROFILE_SETTING_KEYS,
    removedPaymentWorkerDefaultMaxAttempts: REMOVED_PAYMENT_WORKER_DEFAULT_MAX_ATTEMPTS,
    removedPaymentWorkerMaxAttemptsLimit: REMOVED_PAYMENT_WORKER_MAX_ATTEMPTS_LIMIT,
    removedPaymentWorkerAllowedPaymentLocales: REMOVED_PAYMENT_WORKER_ALLOWED_PAYMENT_LOCALES,
    normalizePlusRemovedContactOauthDelaySeconds: (value) => normalizePlusRemovedContactOauthDelaySeconds(value),
    normalizeRemovedContactResendWaitSeconds: (value, fallback) => normalizeRemovedContactResendWaitSeconds(value, fallback),
    normalizeRemovedContactVerificationResendMaxAttempts: (value, fallback) => normalizeRemovedContactVerificationResendMaxAttempts(value, fallback),
    normalizeRemovedContactVerificationPollAttempts: (value, fallback) => normalizeRemovedContactVerificationPollAttempts(value, fallback),
    normalizeRemovedContactVerificationPollIntervalSeconds: (value, fallback) => normalizeRemovedContactVerificationPollIntervalSeconds(value, fallback),
    normalizeChatgptSessionReaderConversionProxyUrlValue: (value) => normalizeChatgptSessionReaderConversionProxyUrlValue(value),
    normalizeChatgptSessionReaderCloudConversionApiUrlValue: (value) => normalizeChatgptSessionReaderCloudConversionApiUrlValue(value),
    normalizeChatgptSessionReaderCloudConversionApiKeyValue: (value) => normalizeChatgptSessionReaderCloudConversionApiKeyValue(value),
    normalizeRemovedContactVerificationUrlValue: (value) => normalizeRemovedContactVerificationUrlValue(value),
  });
  const {
    normalizeChatgptSessionReaderModeValue,
    buildDefaultChatgptSessionReaderProfile,
    buildDefaultRemovedPaymentWorkerSettings,
    normalizeRemovedPaymentWorkerMaxAttemptsValue,
    normalizeRemovedPaymentWorkerPaymentLocaleValue,
    normalizeRemovedPaymentWorkerBrowserBackendValue,
    normalizeRemovedPaymentWorkerAdsPowerApiBaseValue,
    normalizeRemovedPaymentWorkerRoxyBrowserApiBaseValue,
    normalizeRemovedPaymentWorkerCheckoutRebuildMaxAttemptsValue,
    normalizeRemovedPaymentWorkerSettingsValue,
    normalizeChatgptSessionReaderProfileValue,
    normalizeChatgptSessionReaderProfilesValue,
    buildChatgptSessionReaderLegacyPatchFromProfile,
    normalizeChatgptSessionReaderStateForUi,
  } = chatgptSessionReaderSettings;
  const upiInfoHelperState = window.SidepanelUpiInfoHelperState.createUpiInfoHelperState({
    rootScope: window,
  });
  const {
    getUpiInfoAutoModePermissionFromPayload,
    hasUpiInfoAutoModePermissionField,
    isUpiInfoAutoModePermissionDenied,
    normalizeUpiInfoRemainingUsesValue,
    getUpiInfoBalanceRemainingUsesFromResponse,
    getUpiInfoAutoModeEnabledFromResponse,
    normalizeUpiInfoOtpChannelValue,
  } = upiInfoHelperState;
  function getStepDefinitionsForMode(plusModeEnabled = false, options = {}) {
    const defaultFlowId = typeof DEFAULT_ACTIVE_FLOW_ID !== 'undefined' ? DEFAULT_ACTIVE_FLOW_ID : 'openai';
    const defaultMethod = typeof DEFAULT_PLUS_PAYMENT_METHOD !== 'undefined' ? DEFAULT_PLUS_PAYMENT_METHOD : 'legacyWallet';
    const defaultAccountAccessStrategy = typeof PLUS_ACCOUNT_ACCESS_STRATEGY_OAUTH === 'string'
      ? PLUS_ACCOUNT_ACCESS_STRATEGY_OAUTH
      : 'oauth';
    const rawPaymentMethod = typeof options === 'string'
      ? options
      : (options.plusPaymentMethod || currentPlusPaymentMethod || defaultMethod);
    const rawAccountAccessStrategy = typeof options === 'string'
      ? currentPlusAccountAccessStrategy
      : (options.plusAccountAccessStrategy || currentPlusAccountAccessStrategy || defaultAccountAccessStrategy);
    const rawSignupMethod = typeof options === 'string'
      ? currentSignupMethod
      : (options.signupMethod || currentSignupMethod || DEFAULT_SIGNUP_METHOD);
    const upiRedeemStopAfterRedeem = typeof options === 'string'
      ? currentUpiRedeemStopAfterRedeem
      : Boolean(options.upiRedeemStopAfterRedeem ?? currentUpiRedeemStopAfterRedeem);
    const upiRedeemContinueAfterRedeem = typeof options === 'string'
      ? !currentUpiRedeemStopAfterRedeem
      : Boolean(options.upiRedeemContinueAfterRedeem ?? !upiRedeemStopAfterRedeem);
    const totpMfaAfterProfileEnabled = typeof options === 'string'
      ? currentTotpMfaAfterProfileEnabled
      : Boolean(options.totpMfaAfterProfileEnabled ?? currentTotpMfaAfterProfileEnabled);
    const registrationFreeRoute = typeof options === 'string'
      ? currentRegistrationFreeRoute
      : normalizeRegistrationFreeRoute(options.registrationFreeRoute ?? currentRegistrationFreeRoute);
    const activeFlowId = typeof options === 'string'
      ? ((typeof latestState !== 'undefined' ? latestState?.activeFlowId : '') || defaultFlowId)
      : (options.activeFlowId || (typeof latestState !== 'undefined' ? latestState?.activeFlowId : '') || defaultFlowId);
    const requestOptions = {
      activeFlowId: String(activeFlowId || '').trim().toLowerCase() || defaultFlowId,
      plusModeEnabled,
      plusPaymentMethod: normalizePlusPaymentMethod(rawPaymentMethod),
      signupMethod: normalizeSignupMethod(rawSignupMethod),
      upiRedeemStopAfterRedeem,
      upiRedeemContinueAfterRedeem,
      totpMfaAfterProfileEnabled,
      registrationFreeRoute,
    };
    const normalizedAccountAccessStrategy = typeof normalizePlusAccountAccessStrategy === 'function'
      ? normalizePlusAccountAccessStrategy(rawAccountAccessStrategy)
      : rawAccountAccessStrategy;
    if (normalizedAccountAccessStrategy && normalizedAccountAccessStrategy !== defaultAccountAccessStrategy) {
      requestOptions.plusAccountAccessStrategy = normalizedAccountAccessStrategy;
    }
    if (typeof options !== 'string' && options?.panelMode !== undefined) {
      requestOptions.panelMode = options.panelMode;
    }
    return (window.MultiPageStepDefinitions?.getSteps?.(requestOptions) || [])
      .sort((left, right) => {
        const leftOrder = Number.isFinite(left.order) ? left.order : left.id;
        const rightOrder = Number.isFinite(right.order) ? right.order : right.id;
        if (leftOrder !== rightOrder) return leftOrder - rightOrder;
        return left.id - right.id;
      });
  }
  
  function getWorkflowNodesForMode(plusModeEnabled = false, options = {}) {
    const defaultFlowId = typeof DEFAULT_ACTIVE_FLOW_ID !== 'undefined' ? DEFAULT_ACTIVE_FLOW_ID : 'openai';
    const defaultMethod = typeof DEFAULT_PLUS_PAYMENT_METHOD !== 'undefined' ? DEFAULT_PLUS_PAYMENT_METHOD : 'legacyWallet';
    const defaultAccountAccessStrategy = typeof PLUS_ACCOUNT_ACCESS_STRATEGY_OAUTH === 'string'
      ? PLUS_ACCOUNT_ACCESS_STRATEGY_OAUTH
      : 'oauth';
    const rawPaymentMethod = typeof options === 'string'
      ? options
      : (options.plusPaymentMethod || currentPlusPaymentMethod || defaultMethod);
    const rawAccountAccessStrategy = typeof options === 'string'
      ? currentPlusAccountAccessStrategy
      : (options.plusAccountAccessStrategy || currentPlusAccountAccessStrategy || defaultAccountAccessStrategy);
    const rawSignupMethod = typeof options === 'string'
      ? currentSignupMethod
      : (options.signupMethod || currentSignupMethod || DEFAULT_SIGNUP_METHOD);
    const upiRedeemStopAfterRedeem = typeof options === 'string'
      ? currentUpiRedeemStopAfterRedeem
      : Boolean(options.upiRedeemStopAfterRedeem ?? currentUpiRedeemStopAfterRedeem);
    const upiRedeemContinueAfterRedeem = typeof options === 'string'
      ? !currentUpiRedeemStopAfterRedeem
      : Boolean(options.upiRedeemContinueAfterRedeem ?? !upiRedeemStopAfterRedeem);
    const totpMfaAfterProfileEnabled = typeof options === 'string'
      ? currentTotpMfaAfterProfileEnabled
      : Boolean(options.totpMfaAfterProfileEnabled ?? currentTotpMfaAfterProfileEnabled);
    const registrationFreeRoute = typeof options === 'string'
      ? currentRegistrationFreeRoute
      : normalizeRegistrationFreeRoute(options.registrationFreeRoute ?? currentRegistrationFreeRoute);
    const activeFlowId = typeof options === 'string'
      ? ((typeof latestState !== 'undefined' ? latestState?.activeFlowId : '') || defaultFlowId)
      : (options.activeFlowId || (typeof latestState !== 'undefined' ? latestState?.activeFlowId : '') || defaultFlowId);
    const requestOptions = {
      activeFlowId: String(activeFlowId || '').trim().toLowerCase() || defaultFlowId,
      plusModeEnabled,
      plusPaymentMethod: normalizePlusPaymentMethod(rawPaymentMethod),
      signupMethod: normalizeSignupMethod(rawSignupMethod),
      upiRedeemStopAfterRedeem,
      upiRedeemContinueAfterRedeem,
      totpMfaAfterProfileEnabled,
      registrationFreeRoute,
    };
    const normalizedAccountAccessStrategy = typeof normalizePlusAccountAccessStrategy === 'function'
      ? normalizePlusAccountAccessStrategy(rawAccountAccessStrategy)
      : rawAccountAccessStrategy;
    if (normalizedAccountAccessStrategy && normalizedAccountAccessStrategy !== defaultAccountAccessStrategy) {
      requestOptions.plusAccountAccessStrategy = normalizedAccountAccessStrategy;
    }
    if (typeof options !== 'string' && options?.panelMode !== undefined) {
      requestOptions.panelMode = options.panelMode;
    }
    const nodes = window.MultiPageStepDefinitions?.getNodes?.(requestOptions);
    if (Array.isArray(nodes) && nodes.length) {
      return nodes.slice().sort((left, right) => {
        const leftOrder = Number.isFinite(Number(left.displayOrder)) ? Number(left.displayOrder) : Number(left.legacyStepId);
        const rightOrder = Number.isFinite(Number(right.displayOrder)) ? Number(right.displayOrder) : Number(right.legacyStepId);
        if (leftOrder !== rightOrder) return leftOrder - rightOrder;
        return String(left.nodeId || '').localeCompare(String(right.nodeId || ''));
      });
    }
  
    return getStepDefinitionsForMode(plusModeEnabled, options).map((step) => ({
      legacyStepId: Number(step.id),
      nodeId: String(step.key || '').trim(),
      title: step.title,
      displayOrder: Number.isFinite(Number(step.order)) ? Number(step.order) : Number(step.id),
      executeKey: String(step.key || '').trim(),
      ui: step.ui && typeof step.ui === 'object' ? { ...step.ui } : {},
    })).filter((node) => node.nodeId);
  }
  
  function getStepIdByKeyForCurrentMode(stepKey = '') {
    const normalizedKey = String(stepKey || '').trim();
    if (!normalizedKey) {
      return 0;
    }
    const match = (stepDefinitions || []).find((step) => String(step?.key || '') === normalizedKey);
    return Number(match?.id) || 0;
  }
  
  function getNodeIdByStepForCurrentMode(step) {
    const numericStep = Number(step);
    const node = (workflowNodes || []).find((candidate) => Number(candidate?.legacyStepId) === numericStep);
    if (node?.nodeId) {
      return String(node.nodeId).trim();
    }
    const definition = (stepDefinitions || []).find((candidate) => Number(candidate?.id) === numericStep);
    return String(definition?.key || '').trim();
  }
  
  function getStepIdByNodeIdForCurrentMode(nodeId = '') {
    const normalizedNodeId = String(nodeId || '').trim();
    if (!normalizedNodeId) {
      return 0;
    }
    const node = (workflowNodes || []).find((candidate) => String(candidate?.nodeId || '').trim() === normalizedNodeId);
    const legacyStepId = Number(node?.legacyStepId);
    if (Number.isInteger(legacyStepId) && legacyStepId > 0) {
      return legacyStepId;
    }
    return getStepIdByKeyForCurrentMode(normalizedNodeId);
  }
  
  function rebuildStepDefinitionState(plusModeEnabled = false, options = {}) {
    currentPlusModeEnabled = Boolean(plusModeEnabled);
    const currentRemovedPaymentWorkerEnabled = Boolean(
      options?.removedPaymentWorkerEnabled
      ?? (typeof inputRemovedPaymentWorkerEnabled !== 'undefined' && inputRemovedPaymentWorkerEnabled ? inputRemovedPaymentWorkerEnabled.checked : latestState?.removedPaymentWorkerEnabled)
    );
    const defaultMethod = typeof DEFAULT_PLUS_PAYMENT_METHOD !== 'undefined' ? DEFAULT_PLUS_PAYMENT_METHOD : 'legacyWallet';
    const rawPaymentMethod = typeof options === 'string'
      ? options
      : (options.plusPaymentMethod || currentPlusPaymentMethod || defaultMethod);
    const rawAccountAccessStrategy = typeof options === 'string'
      ? currentPlusAccountAccessStrategy
      : (options.plusAccountAccessStrategy || currentPlusAccountAccessStrategy || defaultAccountAccessStrategy);
    const rawSignupMethod = typeof options === 'string'
      ? currentSignupMethod
      : (options.signupMethod || currentSignupMethod || DEFAULT_SIGNUP_METHOD);
    const upiRedeemStopAfterRedeem = typeof options === 'string'
      ? currentUpiRedeemStopAfterRedeem
      : Boolean(options.upiRedeemStopAfterRedeem ?? currentUpiRedeemStopAfterRedeem);
    const upiRedeemContinueAfterRedeem = typeof options === 'string'
      ? !currentUpiRedeemStopAfterRedeem
      : Boolean(options.upiRedeemContinueAfterRedeem ?? !upiRedeemStopAfterRedeem);
    const totpMfaAfterProfileEnabled = typeof options === 'string'
      ? currentTotpMfaAfterProfileEnabled
      : Boolean(options.totpMfaAfterProfileEnabled ?? currentTotpMfaAfterProfileEnabled);
    const registrationFreeRoute = typeof options === 'string'
      ? currentRegistrationFreeRoute
      : normalizeRegistrationFreeRoute(options.registrationFreeRoute ?? currentRegistrationFreeRoute);
    const normalizeAccountAccessStrategySafe = typeof normalizePlusAccountAccessStrategy === 'function'
      ? normalizePlusAccountAccessStrategy
      : (() => 'oauth');
    currentPlusPaymentMethod = normalizePlusPaymentMethod(rawPaymentMethod);
    currentPlusAccountAccessStrategy = normalizeAccountAccessStrategySafe(rawAccountAccessStrategy);
    currentSignupMethod = normalizeSignupMethod(rawSignupMethod);
    currentUpiRedeemStopAfterRedeem = upiRedeemStopAfterRedeem;
    currentTotpMfaAfterProfileEnabled = totpMfaAfterProfileEnabled;
    currentRegistrationFreeRoute = registrationFreeRoute;
    stepDefinitions = getStepDefinitionsForMode(currentPlusModeEnabled, {
      activeFlowId: options?.activeFlowId,
      panelMode: options?.panelMode,
      plusPaymentMethod: currentPlusPaymentMethod,
      plusAccountAccessStrategy: currentPlusAccountAccessStrategy,
      signupMethod: currentSignupMethod,
      upiRedeemStopAfterRedeem: currentUpiRedeemStopAfterRedeem,
      upiRedeemContinueAfterRedeem,
      totpMfaAfterProfileEnabled: currentTotpMfaAfterProfileEnabled,
      registrationFreeRoute: currentRegistrationFreeRoute,
      removedPaymentWorkerEnabled: currentRemovedPaymentWorkerEnabled,
    });
    const nextWorkflowNodes = typeof getWorkflowNodesForMode === 'function'
      ? getWorkflowNodesForMode(currentPlusModeEnabled, {
        activeFlowId: options?.activeFlowId,
        panelMode: options?.panelMode,
        plusPaymentMethod: currentPlusPaymentMethod,
        plusAccountAccessStrategy: currentPlusAccountAccessStrategy,
        signupMethod: currentSignupMethod,
        upiRedeemStopAfterRedeem: currentUpiRedeemStopAfterRedeem,
        upiRedeemContinueAfterRedeem,
        totpMfaAfterProfileEnabled: currentTotpMfaAfterProfileEnabled,
        registrationFreeRoute: currentRegistrationFreeRoute,
        removedPaymentWorkerEnabled: currentRemovedPaymentWorkerEnabled,
      })
      : stepDefinitions.map((step) => ({
        legacyStepId: Number(step.id),
        nodeId: String(step.key || step.id || '').trim(),
        title: step.title,
        displayOrder: Number.isFinite(Number(step.order)) ? Number(step.order) : Number(step.id),
        ui: step.ui && typeof step.ui === 'object' ? { ...step.ui } : {},
      }));
    if (typeof workflowNodes !== 'undefined') {
      workflowNodes = nextWorkflowNodes;
    }
    STEP_IDS = stepDefinitions.map((step) => Number(step.id)).filter(Number.isFinite);
    STEP_DEFAULT_STATUSES = Object.fromEntries(STEP_IDS.map((stepId) => [stepId, 'pending']));
    SKIPPABLE_STEPS = new Set(STEP_IDS);
    if (typeof NODE_IDS !== 'undefined') {
      NODE_IDS = nextWorkflowNodes.map((node) => String(node.nodeId || '').trim()).filter(Boolean);
    }
    if (typeof NODE_DEFAULT_STATUSES !== 'undefined') {
      NODE_DEFAULT_STATUSES = Object.fromEntries((typeof NODE_IDS !== 'undefined' ? NODE_IDS : []).map((nodeId) => [nodeId, 'pending']));
    }
    if (typeof SKIPPABLE_NODES !== 'undefined') {
      SKIPPABLE_NODES = new Set(typeof NODE_IDS !== 'undefined' ? NODE_IDS : []);
    }
  }
  const CONTRIBUTION_CONTENT_PROMPT_DISMISSED_VERSION_STORAGE_KEY = 'multipage-contribution-content-prompt-dismissed-version';
  const AUTO_RUN_FALLBACK_RISK_WARNING_MIN_RUNS = 6;
  const HOTMAIL_SERVICE_MODE_REMOTE = 'remote';
  const HOTMAIL_SERVICE_MODE_LOCAL = 'local';
  const ICLOUD_PROVIDER = 'icloud';
  const ICLOUD_API_PROVIDER = 'icloud-api';
  const GMAIL_PROVIDER = 'gmail';
  const GMAIL_ALIAS_GENERATOR = 'gmail-alias';
  const HOTMAIL_PROVIDER = 'hotmail-api';
  const LUCKMAIL_PROVIDER = 'luckmail-api';
  const CLOUDFLARE_TEMP_EMAIL_PROVIDER = 'cloudflare-temp-email';
  const CLOUD_MAIL_PROVIDER = 'cloudmail';
  const FREEMAIL_PROVIDER = 'freemail';
  const MOEMAIL_PROVIDER = 'moemail';
  const MOEMAIL_GENERATOR = 'moemail';
  const YYDSMAIL_PROVIDER = 'yydsmail';
  const YYDSMAIL_GENERATOR = 'yydsmail';
  const OUTLOOK_EMAIL_PLUS_PROVIDER = 'outlook-email-plus';
  const OUTLOOK_EMAIL_PLUS_GENERATOR = 'outlook-email-plus';
  const CUSTOM_EMAIL_POOL_GENERATOR = 'custom-pool';
  const DEFAULT_LUCKMAIL_BASE_URL = 'https://mails.luckyous.com';
  const DEFAULT_LUCKMAIL_EMAIL_TYPE = 'ms_graph';
  const DISPLAY_TIMEZONE = 'Asia/Shanghai';
  const DEFAULT_ACCOUNT_RUN_HISTORY_HELPER_BASE_URL = 'http://127.0.0.1:17373';
  const CONTRIBUTION_UPLOAD_URL = '';
  const DEFAULT_AUTH_VERIFICATION_ENABLED = false;
  
  const mailProviderState = window.SidepanelMailProviderState.createMailProviderState({
    rootScope: window,
    constants: {
      cloudMailProvider: CLOUD_MAIL_PROVIDER,
      cloudflareTempEmailProvider: CLOUDFLARE_TEMP_EMAIL_PROVIDER,
      customEmailPoolGenerator: CUSTOM_EMAIL_POOL_GENERATOR,
      defaultLuckmailBaseUrl: DEFAULT_LUCKMAIL_BASE_URL,
      defaultLuckmailEmailType: DEFAULT_LUCKMAIL_EMAIL_TYPE,
      freemailProvider: FREEMAIL_PROVIDER,
      gmailAliasGenerator: GMAIL_ALIAS_GENERATOR,
      gmailProvider: GMAIL_PROVIDER,
      luckmailProvider: LUCKMAIL_PROVIDER,
      mail2925ModeProvide: MAIL_2925_MODE_PROVIDE,
      moemailGenerator: MOEMAIL_GENERATOR,
      outlookEmailPlusGenerator: OUTLOOK_EMAIL_PLUS_GENERATOR,
      yydsMailGenerator: YYDSMAIL_GENERATOR,
    },
    getters: {
      getInputEmailValue: () => inputEmail?.value?.trim?.() || '',
      getLatestState: () => latestState,
      getSelectedEmailGeneratorValue: () => selectEmailGenerator?.value,
      getSelectedMail2925Mode: () => getSelectedMail2925Mode(),
      getSelectedMailProviderValue: () => selectMailProvider?.value,
    },
    helpers: {
      getCurrentMail2925Email: (state) => getCurrentMail2925Email(state),
      usesGeneratedAliasMailProvider: (provider, mail2925Mode) => usesGeneratedAliasMailProvider(provider, mail2925Mode),
    },
    normalizers: {
      normalizeMail2925Mode: (value) => normalizeMail2925Mode(value),
    },
  });
  const {
    getMailProviderValue,
    getManagedAliasBaseEmailForProvider,
    getManagedAliasBaseEmailKey,
    getManagedAliasProviderUiCopy,
    getManagedAliasUtils,
    getSelectedEmailGenerator,
    isCustomMailProvider,
    isLuckmailProvider,
    isMail2925AccountPoolEnabled,
    isManagedAliasEmail,
    isManagedAliasProvider,
    normalizeLuckmailBaseUrl,
    normalizeLuckmailEmailType,
    parseManagedAliasBaseEmail,
  } = mailProviderState;
  
  function getPreferredMail2925PoolAccountId(state = latestState) {
    const currentId = String(state?.currentMail2925AccountId || '').trim();
    if (currentId && getMail2925Accounts(state).some((account) => account.id === currentId)) {
      return currentId;
    }
    return '';
  }
  
  function syncMail2925PoolAccountOptions(state = latestState) {
    if (!selectMail2925PoolAccount) {
      return;
    }
  
    const accounts = getMail2925Accounts(state);
    const selectedId = getPreferredMail2925PoolAccountId(state);
    const options = ['<option value="">请选择号池邮箱</option>'].concat(
      accounts.map((account) => `<option value="${escapeHtml(account.id)}">${escapeHtml(account.email || '(未命名账号)')}</option>`)
    );
    selectMail2925PoolAccount.innerHTML = options.join('');
    selectMail2925PoolAccount.value = selectedId;
  }
  
  async function syncSelectedMail2925PoolAccount(options = {}) {
    const { silent = false } = options;
    if (!selectMail2925PoolAccount || !isMail2925AccountPoolEnabled(latestState)) {
      return null;
    }
  
    const accountId = String(selectMail2925PoolAccount.value || '').trim();
    if (!accountId) {
      syncLatestState({ currentMail2925AccountId: null });
      setManagedAliasBaseEmailInputForProvider('2925', latestState);
      return null;
    }
  
    const response = await chrome.runtime.sendMessage({
      type: 'SELECT_MAIL2925_ACCOUNT',
      source: 'sidepanel',
      payload: { accountId },
    });
    if (response?.error) {
      throw new Error(response.error);
    }
  
    syncLatestState({
      currentMail2925AccountId: response.account?.id || accountId,
      ...(response.account?.email ? { mail2925BaseEmail: String(response.account.email).trim() } : {}),
    });
    setManagedAliasBaseEmailInputForProvider('2925', latestState);
    if (!silent) {
      showToast(`已切换当前 2925 号池邮箱为 ${response.account?.email || accountId}`, 'success', 1800);
    }
    return response.account || null;
  }
  
  function buildManagedAliasBaseEmailPayload(state = latestState) {
    const payload = {
      gmailBaseEmail: String(state?.gmailBaseEmail || '').trim(),
      mail2925BaseEmail: String(state?.mail2925BaseEmail || '').trim(),
      mail2925UseAccountPool: Boolean(state?.mail2925UseAccountPool),
      emailPrefix: '',
    };
    const key = getManagedAliasBaseEmailKey();
    if (key) {
      if (key === 'mail2925BaseEmail' && isMail2925AccountPoolEnabled(state)) {
        payload[key] = String(state?.mail2925BaseEmail || '').trim();
      } else {
        payload[key] = inputEmailPrefix.value.trim();
      }
    }
    return payload;
  }
  
  function syncManagedAliasBaseEmailDraftFromInput(provider = selectMailProvider.value) {
    const key = getManagedAliasBaseEmailKey(provider);
    if (!key) {
      return;
    }
    if (key === 'mail2925BaseEmail' && isMail2925AccountPoolEnabled(latestState)) {
      return;
    }
    syncLatestState({ [key]: inputEmailPrefix.value.trim() });
  }
  
  function setManagedAliasBaseEmailInputForProvider(provider = selectMailProvider.value, state = latestState) {
    syncMail2925PoolAccountOptions(state);
    inputEmailPrefix.value = getManagedAliasBaseEmailForProvider(provider, state);
  }
  
  function getCurrentRegistrationEmailUiCopy() {
    if (isCustomMailProvider()) {
      return getCustomMailProviderUiCopy();
    }
    if (usesGeneratedAliasMailProvider()) {
      return getManagedAliasProviderUiCopy();
    }
    return getEmailGeneratorUiCopy();
  }
  
  function isCurrentRegistrationEmailCompatible(email = inputEmail.value.trim(), provider = selectMailProvider.value, state = latestState) {
    return mailProviderState.isRegistrationEmailCompatible({
      email,
      mail2925Mode: getSelectedMail2925Mode(),
      provider,
      state,
    });
  }
  
  function validateCurrentRegistrationEmail(email = inputEmail.value.trim(), options = {}) {
    const { showToastOnFailure = false } = options;
    if (isCurrentRegistrationEmailCompatible(email)) {
      return true;
    }
  
    if (showToastOnFailure) {
      const uiCopy = getManagedAliasProviderUiCopy();
      const baseEmail = getManagedAliasBaseEmailForProvider();
      showToast(
        baseEmail
          ? `当前邮箱服务为“${uiCopy?.label || '别名邮箱'}”，注册邮箱需与 ${uiCopy?.baseLabel || '基邮箱'} 对应。`
          : `当前邮箱服务为“${uiCopy?.label || '别名邮箱'}”，请直接填写完整邮箱，或先填写基邮箱后点击“生成”。`,
        'warn'
      );
    }
    return false;
  }
  
  const autoRunStateModel = window.SidepanelAutoRunState.createAutoRunStateModel();
  currentAutoRun = autoRunStateModel.getAutoRunState();
  const workflowButtonStateManager = window.SidepanelWorkflowButtonState.createWorkflowButtonStateManager({
    getNodeIds: () => NODE_IDS,
    getIndependentExecuteNodes: () => INDEPENDENT_EXECUTE_NODES,
    getSkippableNodes: () => SKIPPABLE_NODES,
    isDoneStatus: (status) => isDoneStatus(status),
  });
  const workflowStatusDisplayManager = window.SidepanelWorkflowStatusDisplay.createWorkflowStatusDisplayManager({
    isDoneStatus: (status) => isDoneStatus(status),
    formatCountdown: (remainingMs) => formatCountdown(remainingMs),
  });
  settingsDirty = false;
  settingsSaveInFlight = false;
  settingsAutoSaveTimer = null;
  settingsSaveRevision = 0;
  customPasswordSaveRevision = 0;
  cloudflareDomainEditMode = false;
  cloudflareTempEmailDomainEditMode = false;
  activePlusManualConfirmationRequestId = '';
  plusManualConfirmationDialogInFlight = false;
  const autoRunCountdownView = window.SidepanelAutoRunCountdownView.createAutoRunCountdownView({
    dom: {
      autoScheduleBar,
      autoScheduleMeta,
      autoScheduleTitle,
      btnAutoCancelSchedule,
      btnAutoRunNow,
    },
    getAutoRun: () => currentAutoRun,
    getLatestState: () => latestState,
    timeZone: DISPLAY_TIMEZONE,
    updateStatusDisplay: (state) => updateStatusDisplay(state),
  });
  const configMenuController = window.SidepanelConfigMenuController.createConfigMenuController({
    dom: { btnConfigMenu, configMenu, btnExportSettings, btnImportSettings, inputImportSettingsFile },
    exportSettings,
    importSettingsFromFile,
    onUpdate: () => updateSaveButtonState(),
    onError: (error) => showToast('配置操作失败：' + (error?.message || error), 'error'),
  });
  const settingsFieldBindings = window.SidepanelSettingsFieldBindings.createSettingsFieldBindings({
    scheduleSettingsSave,
  });
  configActionInFlight = false;
  currentReleaseSnapshot = null;
  currentContributionContentSnapshot = null;
  contributionContentSnapshotRequestInFlight = null;
  accountRecordsManager = null;
  settingsStateManager = null;
  workflowControlsManager = null;
  settingsTransferManager = null;
  
  const sidepanelRuntimeBridge = window.SidepanelRuntimeBridge.createSidepanelRuntimeBridge({
    chromeApi: chrome,
    getLatestState: () => latestState,
    logger: console,
    syncLatestState,
  });
  const {
    getCurrentSidepanelWindowId,
    normalizeAutomationWindowId,
    sendSidepanelMessage,
    shouldAttachAutomationWindow,
  } = sidepanelRuntimeBridge;
  window.sendSidepanelMessage = sendSidepanelMessage;
  
  const DEFAULT_SUB2API_GROUP_OPTIONS = ['codex', 'openai-plus'];
  const editableListPickerModule = window.SidepanelEditableListPicker || {};
  const normalizeEditableListValues = editableListPickerModule.normalizeEditableListValues
    || ((...sources) => {
      const values = [];
      const seen = new Set();
      const append = (value) => {
        const items = Array.isArray(value)
          ? value
          : String(value || '').split(/[\r\n,，、]+/);
        items.forEach((item) => {
          const normalized = String(item || '').trim();
          const key = normalized.toLowerCase();
          if (key && !seen.has(key)) {
            seen.add(key);
            values.push(normalized);
          }
        });
      };
      sources.forEach(append);
      return values;
    });
  const createEditableListPicker = editableListPickerModule.createEditableListPicker
    || (() => ({
      close() { },
      render() { },
      setOpen() { },
      setSelection() { },
      setVisible() { },
    }));
  const closeEditableListPickers = editableListPickerModule.closeEditableListPickers || (() => { });
  const isClickInsideEditableListPicker = editableListPickerModule.isClickInsideEditableListPicker || (() => false);
  
  function normalizeSub2ApiGroupOptions(...sources) {
    return normalizeEditableListValues(...sources);
  }
  
  function normalizeSub2ApiAccountPriorityValue(value) {
    const rawValue = String(value ?? '').trim();
    const numeric = Number(rawValue);
    if (!rawValue || !Number.isSafeInteger(numeric) || numeric < 1) {
      return 1;
    }
    return numeric;
  }
  
  function getSelectedSub2ApiGroupName() {
    return String(inputSub2ApiGroup?.value || '').trim()
      || DEFAULT_SUB2API_GROUP_OPTIONS[0];
  }
  
  function getSub2ApiGroupOptionsState(state = latestState) {
    const options = normalizeSub2ApiGroupOptions(
      state?.sub2apiGroupNames,
      state?.sub2apiGroupName
    );
    return options.length ? options : [...DEFAULT_SUB2API_GROUP_OPTIONS];
  }
  
  async function handleDeleteSub2ApiGroup(groupName) {
    const target = String(groupName || '').trim();
    if (!target) {
      return;
    }
    const nextOptions = getSub2ApiGroupOptionsState(latestState)
      .filter((name) => name.toLowerCase() !== target.toLowerCase());
    const fallbackOptions = nextOptions.length ? nextOptions : [...DEFAULT_SUB2API_GROUP_OPTIONS];
    const nextSelected = fallbackOptions[0] || '';
    syncLatestState({
      sub2apiGroupNames: fallbackOptions,
      sub2apiGroupName: nextSelected,
    });
    renderSub2ApiGroupOptions(latestState, nextSelected);
    await chrome.runtime.sendMessage({
      type: 'SAVE_SETTING',
      source: 'sidepanel',
      payload: {
        sub2apiGroupNames: fallbackOptions,
        sub2apiGroupName: nextSelected,
      },
    });
  }
  
  const sub2ApiGroupPicker = createEditableListPicker({
    root: sub2ApiGroupPickerRoot,
    input: inputSub2ApiGroup,
    trigger: btnSub2ApiGroupMenu,
    current: sub2ApiGroupCurrent,
    menu: sub2ApiGroupMenu,
    fallbackItems: DEFAULT_SUB2API_GROUP_OPTIONS,
    minItems: 1,
    itemLabel: '分组',
    onDelete: handleDeleteSub2ApiGroup,
    onDeleteError: (error) => showToast(error?.message || '删除 SUB2API 分组失败。', 'error'),
  });
  
  const cloudflareDomainUi = window.SidepanelCloudflareDomainUi.createCloudflareDomainUi({
    chromeApi: chrome,
    createEditableListPicker,
    dom: {
      btnCfDomainMenu,
      btnTempEmailDomainMenu,
      cfDomainCurrent,
      cfDomainMenu,
      cfDomainPickerRoot,
      selectCfDomain,
      selectTempEmailDomain,
      tempEmailDomainCurrent,
      tempEmailDomainMenu,
      tempEmailDomainPickerRoot,
    },
    getLatestState: () => latestState,
    helpers: {
      normalizeCloudflareDomainValue: (value) => normalizeCloudflareDomainValue(value),
      normalizeCloudflareDomains: (values) => normalizeCloudflareDomains(values),
      normalizeCloudflareTempEmailDomainValue: (value) => normalizeCloudflareTempEmailDomainValue(value),
      normalizeCloudflareTempEmailDomains: (values) => normalizeCloudflareTempEmailDomains(values),
    },
    showToast,
    syncLatestState,
  });
  const {
    cfDomainPicker,
    handleDeleteCloudflareDomain,
    handleDeleteCloudflareTempEmailDomain,
    tempEmailDomainPicker,
  } = cloudflareDomainUi;
  
  function renderSub2ApiGroupOptions(state = latestState, selectedValue = '') {
    if (!inputSub2ApiGroup) {
      return;
    }
  
    const selected = String(selectedValue || state?.sub2apiGroupName || '').trim();
    const options = getSub2ApiGroupOptionsState({
      ...(state || {}),
      sub2apiGroupName: selected || state?.sub2apiGroupName,
    });
    if (selected && !options.some((name) => name.toLowerCase() === selected.toLowerCase())) {
      options.unshift(selected);
    }
  
    sub2ApiGroupPicker.render(options, selected || options[0] || DEFAULT_SUB2API_GROUP_OPTIONS[0]);
  }
  customEmailPoolEntriesState = [];
  
  const EYE_OPEN_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>';
  const EYE_CLOSED_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 19C5 19 1 12 1 12a21.77 21.77 0 0 1 5.06-6.94"/><path d="M9.9 4.24A10.94 10.94 0 0 1 12 5c7 0 11 7 11 7a21.86 21.86 0 0 1-2.16 3.19"/><path d="M1 1l22 22"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/></svg>';
  const sidepanelUiHelpers = window.SidepanelUiHelpers?.createSidepanelUiHelpers?.({
    documentRef: document,
    navigatorRef: navigator,
    icons: {
      eyeOpen: EYE_OPEN_ICON,
      eyeClosed: EYE_CLOSED_ICON,
    },
  });
  const COPY_ICON = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
  const parseHotmailImportText = window.HotmailUtils?.parseHotmailImportText;
  const normalizeHotmailServiceModeFromUtils = window.HotmailUtils?.normalizeHotmailServiceMode;
  const shouldClearHotmailCurrentSelection = window.HotmailUtils?.shouldClearHotmailCurrentSelection;
  const upsertHotmailAccountInList = window.HotmailUtils?.upsertHotmailAccountInList;
  const filterHotmailAccountsByUsage = window.HotmailUtils?.filterHotmailAccountsByUsage;
  const getHotmailBulkActionLabel = window.HotmailUtils?.getHotmailBulkActionLabel;
  const getHotmailListToggleLabel = window.HotmailUtils?.getHotmailListToggleLabel;
  const upsertLegacyWalletAccountInList = window.LegacyWalletUtils?.upsertLegacyWalletAccountInList;
  const normalizeLuckmailTimestampValue = window.LuckMailUtils?.normalizeTimestamp
    || ((value) => {
      const timestamp = Date.parse(String(value || ''));
      return Number.isFinite(timestamp) ? timestamp : 0;
    });
  const sidepanelUpdateService = window.SidepanelUpdateService;
  const contributionContentService = window.SidepanelContributionContentService;
  const sharedFormDialog = window.SidepanelFormDialog?.createFormDialog?.({
    overlay: sharedFormModal,
    titleNode: sharedFormModalTitle,
    closeButton: btnSharedFormModalClose,
    messageNode: sharedFormModalMessage,
    alertNode: sharedFormModalAlert,
    fieldsContainer: sharedFormModalFields,
    cancelButton: btnSharedFormModalCancel,
    confirmButton: btnSharedFormModalConfirm,
  });
  const DEFAULT_LUCKMAIL_PRESERVE_TAG_NAME = window.LuckMailUtils?.DEFAULT_LUCKMAIL_PRESERVE_TAG_NAME || '保留';
  const normalizeIcloudHost = window.IcloudUtils?.normalizeIcloudHost
    || ((value) => {
      const normalized = String(value || '').trim().toLowerCase();
      return normalized === 'icloud.com' || normalized === 'icloud.com.cn' ? normalized : '';
    });
  const normalizeIcloudFetchMode = (value) => {
    const normalized = String(value || '').trim().toLowerCase();
    return normalized === 'always_new' ? 'always_new' : 'reuse_existing';
  };
  const normalizeIcloudTargetMailboxType = window.MailProviderUtils?.normalizeIcloudTargetMailboxType
    || ((value) => String(value || '').trim().toLowerCase() === 'forward-mailbox'
      ? 'forward-mailbox'
      : 'icloud-inbox');
  const getIcloudForwardMailProviderOptions = window.MailProviderUtils?.getIcloudForwardMailProviderOptions
    || (() => Array.from(selectIcloudForwardMailProvider?.options || [])
      .map((option) => ({
        value: String(option?.value || '').trim().toLowerCase(),
        label: String(option?.textContent || option?.label || option?.value || '').trim(),
      }))
      .filter((option) => option.value));
  const normalizeIcloudForwardMailProvider = window.MailProviderUtils?.normalizeIcloudForwardMailProvider
    || ((value) => {
      const normalized = String(value || '').trim().toLowerCase();
      const options = getIcloudForwardMailProviderOptions();
      return options.some((option) => option.value === normalized)
        ? normalized
        : (options[0]?.value || 'qq');
    });
  const normalizeIcloudApiBaseUrlValue = window.MailProviderUtils?.normalizeIcloudApiBaseUrl
    || ((value = '') => String(value || '').trim().replace(/\/+$/g, ''));
  const parseHiddenEmailCredential = window.MailProviderUtils?.parseHiddenEmailCredential
    || ((value = '') => {
      const raw = String(value || '').trim();
      const separatorIndex = raw.indexOf('----');
      const emailSource = separatorIndex >= 0 ? raw.slice(0, separatorIndex) : raw;
      const credential = separatorIndex >= 0 ? raw : '';
      return {
        email: emailSource.trim().toLowerCase(),
        credential: credential.trim(),
      };
    });
  const normalizeCustomEmailVerificationUrlValue = window.MailProviderUtils?.normalizeCustomEmailVerificationUrl
    || ((value = '') => {
      const raw = String(value || '').trim();
      if (!/^https?:\/\//i.test(raw)) return '';
      try {
        const parsed = new URL(raw);
        return /^https?:$/i.test(parsed.protocol) ? parsed.toString() : '';
      } catch {
        return '';
      }
    });
  const parseCustomEmailPoolEntryValueForSidepanel = window.MailProviderUtils?.parseCustomEmailPoolEntryValue
    || ((value = '') => {
      const raw = String(value || '').trim();
      const parts = raw.split(/-{3,}/).map((part) => part.trim());
      const hasSeparator = parts.length > 1;
      const emailSource = hasSeparator ? parts[0] : raw;
      const verificationUrl = (hasSeparator ? parts.slice(1) : [raw])
        .map((part) => normalizeCustomEmailVerificationUrlValue(part))
        .find(Boolean) || '';
      let urlEmail = '';
      if (verificationUrl) {
        try {
          const parsed = new URL(verificationUrl);
          urlEmail = String(parsed.searchParams.get('mail') || parsed.searchParams.get('email') || '').trim().toLowerCase();
        } catch { }
      }
      const normalizedEmail = String(emailSource || '').trim().toLowerCase();
      return {
        email: /^[^\s@:/?#]+@[^\s@:/?#]+\.[^\s@:/?#]+$/.test(normalizedEmail) ? normalizedEmail : urlEmail,
        credential: hasSeparator && !verificationUrl ? raw : '',
        verificationUrl,
      };
    });
  const settingsNormalization = window.SidepanelSettingsNormalization.createSettingsNormalization({
    parseCustomEmailPoolEntryValue: parseCustomEmailPoolEntryValueForSidepanel,
    normalizeCustomEmailVerificationUrl: normalizeCustomEmailVerificationUrlValue,
    cryptoApi: window.crypto,
    verificationResendCountMin: VERIFICATION_RESEND_COUNT_MIN,
    verificationResendCountMax: VERIFICATION_RESEND_COUNT_MAX,
  });
  const {
    normalizeVerificationResendCount,
    splitCustomEmailPoolEntrySource,
    normalizeCustomEmailPoolEntries,
    normalizeCustomEmailPoolEntryEmail,
    createCustomEmailPoolEntryId,
    normalizeCustomEmailPoolTrialEligibilityStatus,
    isCustomEmailPoolEntryTrialIneligible,
    isCustomEmailPoolEntryAvailable,
    normalizeCustomEmailPoolEntryObjects,
    formatCustomEmailPoolEntryValue,
    normalizeCustomEmailPoolEntryValues,
    normalizeCloudflareDomainValue,
    normalizeCloudflareDomains,
    normalizeCloudflareTempEmailBaseUrlValue,
    normalizeCloudflareTempEmailReceiveMailboxValue,
    normalizeCloudflareTempEmailDomainValue,
    normalizeCloudflareTempEmailDomains,
    normalizeCloudMailBaseUrlValue,
    normalizeCloudMailReceiveMailboxValue,
    normalizeCloudMailDomainValue,
    normalizeMoemailBaseUrlValue,
    normalizeMoemailDomainValue,
    normalizeYydsMailBaseUrlValue,
    normalizeYydsMailDomainValue,
    normalizeFreemailBaseUrlValue,
    normalizeFreemailDomainValue,
  } = settingsNormalization;
  const ICLOUD_FORWARD_MAIL_PROVIDER_LABELS = Object.fromEntries(
    getIcloudForwardMailProviderOptions().map((option) => [option.value, option.label])
  );
  const getIcloudLoginUrlForHost = window.IcloudUtils?.getIcloudLoginUrlForHost
    || ((host) => host === 'icloud.com.cn' ? 'https://www.icloud.com.cn/' : (host === 'icloud.com' ? 'https://www.icloud.com/' : ''));
  
  btnAutoCancelSchedule?.remove();
  const MAIL_PROVIDER_LOGIN_CONFIGS = {
    [ICLOUD_PROVIDER]: {
      label: 'iCloud 邮箱',
      buttonLabel: '登录',
    },
    [ICLOUD_API_PROVIDER]: {
      label: 'iCloud API（QQ 转发）',
      buttonLabel: '登录',
    },
    [GMAIL_PROVIDER]: {
      label: 'Gmail 邮箱',
      url: 'https://mail.google.com/mail/u/0/#inbox',
      buttonLabel: '登录',
    },
    '163': {
      label: '163 邮箱',
      url: 'https://mail.163.com/',
      buttonLabel: '登录',
    },
    '163-vip': {
      label: '163 VIP 邮箱',
      url: 'https://webmail.vip.163.com/',
      buttonLabel: '登录',
    },
    '126': {
      label: '126 邮箱',
      url: 'https://mail.126.com/',
      buttonLabel: '登录',
    },
    qq: {
      label: 'QQ 邮箱',
      url: 'https://wx.mail.qq.com/',
      buttonLabel: '登录',
    },
    'cloudflare-temp-email': {
      label: 'Cloudflare Temp Email 部署',
      url: 'https://github.com/QLHazyCoder/cloudflare_temp_email',
      buttonLabel: '部署',
    },
    freemail: {
      label: 'freemail 部署',
      url: 'https://github.com/idinging/freemail',
      buttonLabel: '部署',
    },
    [MOEMAIL_PROVIDER]: {
      label: 'MoeMail 文档',
      url: 'https://docs.moemail.app/api',
      buttonLabel: '文档',
    },
    [YYDSMAIL_PROVIDER]: {
      label: 'YYDS Mail 文档',
      url: 'https://vip.215.im/docs',
      buttonLabel: '文档',
    },
    [OUTLOOK_EMAIL_PLUS_PROVIDER]: {
      label: 'Outlook Email Plus 部署',
      url: 'https://github.com/ZeroPointSix/outlookEmailPlus',
      buttonLabel: '部署',
    },
    '2925': {
      label: '2925 邮箱',
      url: 'https://2925.com/#/mailList',
    },
  };
  
  // ============================================================
  // Toast Notifications
  // ============================================================
  
  const LOG_LEVEL_LABELS = {
    info: '信息',
    ok: '成功',
    warn: '警告',
    error: '错误',
  };
  
  const logPanelManager = self.SidepanelLogPanelManager.create({
    logArea,
    state: {
      getLatestState: () => latestState,
      syncLatestState,
    },
    sendMessage: (message) => chrome.runtime.sendMessage(message),
    helpers: {
      escapeHtml,
    },
    constants: {
      displayTimeZone: DISPLAY_TIMEZONE,
      logLevelLabels: LOG_LEVEL_LABELS,
      clearLogMessageType: 'SAVE_SETTING',
    },
  });
  
  const workflowStateView = self.SidepanelWorkflowStateView.create({
    dom: {
      stepsList,
      stepsProgress,
    },
    constants: {
      statusIcons: STATUS_ICONS,
      getWorkflowNodes: () => workflowNodes,
      getNodeIds: () => NODE_IDS,
    },
    helpers: {
      escapeCssValue,
      escapeHtml,
      getNodeIdByStepForCurrentMode,
      getNodeStatuses,
      getStepIdByNodeIdForCurrentMode,
      isDoneStatus,
    },
    state: {
      getLatestState: () => latestState,
    },
    callbacks: {
      initializeManualStepActions,
      updateButtonStates,
    },
  });
  const workflowController = window.SidepanelWorkflowController.createWorkflowController({
    dom: {
      btnAutoCancelSchedule,
      btnAutoContinue,
      btnAutoRun,
      btnAutoRunNow,
      btnClearLog,
      btnReset,
      btnStop,
      displayStatus,
      document,
      statusBar,
      stepsList,
    },
    managers: {
      workflowButtonStateManager,
      workflowStateView,
      workflowStatusDisplayManager,
    },
    actions: {
      autoContinue: () => autoContinue(),
      cancelSchedule: () => cancelSchedule(),
      clearLog: () => clearLog(),
      handleStepListClick: (event) => handleStepListClick(event),
      resetWorkflow: () => resetWorkflow(),
      runScheduledNow: () => runScheduledNow(),
      startAutoRun: () => startAutoRun(),
      stopCurrentRun: () => stopCurrentRun(),
      syncLatestState,
    },
    state: {
      getLatestState: () => latestState,
      setLatestState: (nextState) => {
        latestState = nextState;
      },
    },
    workflow: {
      defaultSignupMethod: DEFAULT_SIGNUP_METHOD,
      getActiveAutoRunCountdown: () => getActiveAutoRunCountdown(),
      getCurrentAutoRun: () => currentAutoRun,
      getCurrentPlusAccountAccessStrategy: () => currentPlusAccountAccessStrategy,
      getCurrentRegistrationFreeRoute: () => currentRegistrationFreeRoute,
      getCurrentSignupMethod: () => currentSignupMethod,
      getCurrentTotpMfaAfterProfileEnabled: () => currentTotpMfaAfterProfileEnabled,
      getCurrentUpiRedeemStopAfterRedeem: () => currentUpiRedeemStopAfterRedeem,
      getNodeIdByStepForCurrentMode,
      getNodeIds: () => NODE_IDS,
      getNodeStatuses: (state) => getNodeStatuses(state),
      getRunningNodes: (state) => getRunningNodes(state),
      getSelectedPlusPaymentMethod: (state) => getSelectedPlusPaymentMethod(state),
      getWorkflowNodes: () => workflowNodes,
      isAutoRunLockedPhase: () => isAutoRunLockedPhase(),
      isAutoRunPausedPhase: () => isAutoRunPausedPhase(),
      isAutoRunScheduledPhase: () => isAutoRunScheduledPhase(),
      normalizePlusAccountAccessStrategy,
      rebuildStepDefinitionState,
      resolveStepDefinitionCapabilityState,
      getAutoRunLabel: () => getAutoRunLabel(),
    },
    helpers: {
      escapeCssValue,
      normalizeSignupMethod,
    },
  });
  
  const CLOUDFLARE_TEMP_EMAIL_REPOSITORY_URL = 'https://github.com/QLHazyCoder/cloudflare_temp_email';
  
  lastLocalHelperStartupAlertAt = 0;
  
  function usesGeneratedAliasMailProvider(
    provider,
    mail2925Mode = getSelectedMail2925Mode(),
    generator = undefined
  ) {
    const customEmailPoolGenerator = typeof CUSTOM_EMAIL_POOL_GENERATOR === 'string'
      ? CUSTOM_EMAIL_POOL_GENERATOR
      : 'custom-pool';
    const resolvedGenerator = generator !== undefined
      ? generator
      : (typeof getSelectedEmailGenerator === 'function' ? getSelectedEmailGenerator() : '');
    return resolvedGenerator !== customEmailPoolGenerator
      && isManagedAliasProvider(provider, mail2925Mode);
  }
  
  function parseGmailBaseEmail(rawValue = '') {
    const value = String(rawValue || '').trim().toLowerCase();
    const match = value.match(/^([^@\s+]+)@((?:gmail|googlemail)\.com)$/i);
    if (!match) return null;
  
    return {
      localPart: match[1],
      domain: match[2].toLowerCase(),
    };
  }
  
  function isManagedGmailAlias(value, baseEmail) {
    const parsedBase = parseGmailBaseEmail(baseEmail);
    if (!parsedBase) return false;
  
    const match = String(value || '').trim().toLowerCase().match(/^([^@\s+]+)(?:\+[^@\s]+)?@((?:gmail|googlemail)\.com)$/i);
    if (!match) return false;
  
    return match[1] === parsedBase.localPart && match[2] === parsedBase.domain;
  }
  
  const toastService = self.SidepanelToastService.createToastService({
    container: toastContainer,
    documentRef: document,
    escapeHtml,
  });
  
  function showToast(message, type = 'error', duration = 4000) {
    return toastService.showToast(message, type, duration);
  }
  
  function isLocalHelperStartupErrorMessage(message = '') {
    return /请检查本地\s*(?:hotmail-helper|removedPaymentWorker)\s*是否启动|start-(?:hotmail-helper|removedPaymentWorker)\.(?:bat|command)/i.test(String(message || ''));
  }
  
  function showLocalHelperStartupAlert(message = '') {
    const now = Date.now();
    if (now - lastLocalHelperStartupAlertAt < 10000) {
      return;
    }
    lastLocalHelperStartupAlertAt = now;
    openConfirmModal({
      title: '本地 helper 未连接',
      message: String(message || '本地 CPA JSON 导出无法连接本地 helper。'),
      alert: {
        text: '请检查本地 hotmail-helper / RemovedPaymentWorker 是否启动。',
        tone: 'danger',
      },
      confirmLabel: '我知道了',
      confirmVariant: 'btn-danger',
    }).catch(() => { });
  }
  
  function dismissToast(toast) {
    return toastService.dismissToast(toast);
  }
  
  function setRemovedContactManualCodeDisplay(value = '未获取', title = '') {
    if (!displayRemovedContactManualCode) {
      return;
    }
    displayRemovedContactManualCode.textContent = String(value || '').trim() || '未获取';
    displayRemovedContactManualCode.title = String(title || '').trim();
  }
  
  function setOauthLoginCodeDisplay(value = '') {
    if (!displayOauthLoginCode) {
      return;
    }
    const normalized = String(value || '').trim();
    displayOauthLoginCode.textContent = normalized || '未获取';
    displayOauthLoginCode.title = normalized;
    displayOauthLoginCode.classList.toggle('has-value', Boolean(normalized));
  }
  
  function resolveModalChoice(choice) {
    return actionModalService?.resolveModalChoice?.(choice);
  }
  
  function openActionModal({ title, message, messageHtml, actions, option, alert, buildResult }) {
    return actionModalService?.openActionModal?.({ title, message, messageHtml, actions, option, alert, buildResult })
      || Promise.resolve(null);
  }
  
  function openAutoStartChoiceDialog(startStep, options = {}) {
    return actionModalService?.openAutoStartChoiceDialog?.(startStep, options) || Promise.resolve(null);
  }
  
  async function openConfirmModal({ title, message, confirmLabel = '确认', confirmVariant = 'btn-primary', alert = null }) {
    return Boolean(await actionModalService?.openConfirmModal?.({ title, message, confirmLabel, confirmVariant, alert }));
  }
  
  async function openConfirmModalWithOption({
    title,
    message,
    messageHtml = '',
    confirmLabel = '确认',
    confirmVariant = 'btn-primary',
    alert = null,
    optionLabel = '不再提示',
    optionChecked = false,
    optionDisabled = false,
  }) {
    return actionModalService?.openConfirmModalWithOption?.({
      title,
      message,
      messageHtml,
      confirmLabel,
      confirmVariant,
      alert,
      optionLabel,
      optionChecked,
      optionDisabled,
    }) || { confirmed: false, optionChecked: false };
  }
  
  function isPromptDismissed(storageKey) {
    return localStorage.getItem(storageKey) === '1';
  }
  
  function setPromptDismissed(storageKey, dismissed) {
    if (dismissed) {
      localStorage.setItem(storageKey, '1');
    } else {
      localStorage.removeItem(storageKey);
    }
  }
  
  function isNewUserGuidePromptDismissed() {
    return isPromptDismissed(NEW_USER_GUIDE_PROMPT_DISMISSED_STORAGE_KEY);
  }
  
  function setNewUserGuidePromptDismissed(dismissed) {
    setPromptDismissed(NEW_USER_GUIDE_PROMPT_DISMISSED_STORAGE_KEY, dismissed);
  }
  
  function shouldPromptNewUserGuide() {
    if (isNewUserGuidePromptDismissed()) {
      return false;
    }
    if (!btnContributionMode || btnContributionMode.disabled) {
      return false;
    }
    if (latestState?.contributionMode) {
      return false;
    }
    return true;
  }
  
  function getContributionPortalUrl() {
    return String(contributionContentService?.portalUrl || GUIDE_REPOSITORY_URL).trim();
  }
  
  function openNewUserGuidePrompt() {
    return openActionModal({
      title: '新手引导',
      message: '如果你是第一次使用，可以先阅读仓库里的使用说明。点击“查看说明”会打开项目说明页。',
      alert: {
        text: '本提示仅出现一次。',
      },
      actions: [
        { id: null, label: '取消', variant: 'btn-ghost' },
        { id: 'confirm', label: '查看说明', variant: 'btn-primary' },
      ],
    });
  }
  
  async function maybeShowNewUserGuidePrompt() {
    if (!shouldPromptNewUserGuide()) {
      return false;
    }
  
    setNewUserGuidePromptDismissed(true);
    return false;
  }
  
  function getDismissedContributionContentPromptVersion() {
    return String(localStorage.getItem(CONTRIBUTION_CONTENT_PROMPT_DISMISSED_VERSION_STORAGE_KEY) || '').trim();
  }
  
  function setDismissedContributionContentPromptVersion(version) {
    const normalized = String(version || '').trim();
    if (normalized) {
      localStorage.setItem(CONTRIBUTION_CONTENT_PROMPT_DISMISSED_VERSION_STORAGE_KEY, normalized);
    } else {
      localStorage.removeItem(CONTRIBUTION_CONTENT_PROMPT_DISMISSED_VERSION_STORAGE_KEY);
    }
  }
  
  function isAutoSkipFailuresPromptDismissed() {
    return isPromptDismissed(AUTO_SKIP_FAILURES_PROMPT_DISMISSED_STORAGE_KEY);
  }
  
  function setAutoSkipFailuresPromptDismissed(dismissed) {
    setPromptDismissed(AUTO_SKIP_FAILURES_PROMPT_DISMISSED_STORAGE_KEY, dismissed);
  }
  
  function isAutoRunFallbackRiskPromptDismissed() {
    return isPromptDismissed(AUTO_RUN_FALLBACK_RISK_PROMPT_DISMISSED_STORAGE_KEY);
  }
  
  function setAutoRunFallbackRiskPromptDismissed(dismissed) {
    setPromptDismissed(AUTO_RUN_FALLBACK_RISK_PROMPT_DISMISSED_STORAGE_KEY, dismissed);
  }
  
  function isCloudflareTempEmailRegistrationLookupPromptDismissed() {
    return isPromptDismissed(CLOUDFLARE_TEMP_EMAIL_REGISTRATION_LOOKUP_PROMPT_DISMISSED_STORAGE_KEY);
  }
  
  function setCloudflareTempEmailRegistrationLookupPromptDismissed(dismissed) {
    setPromptDismissed(CLOUDFLARE_TEMP_EMAIL_REGISTRATION_LOOKUP_PROMPT_DISMISSED_STORAGE_KEY, dismissed);
  }
  
  function shouldWarnAutoRunFallbackRisk(totalRuns, autoRunSkipFailures) {
    return totalRuns >= AUTO_RUN_FALLBACK_RISK_WARNING_MIN_RUNS;
  }
  
  function buildCloudflareTempEmailRegistrationLookupPromptHtml() {
    const repositoryUrl = escapeHtml(CLOUDFLARE_TEMP_EMAIL_REPOSITORY_URL);
    return `需要部署本扩展作者修改后的 <a href="${repositoryUrl}" target="_blank" rel="noopener noreferrer" data-external-url="${repositoryUrl}">Cloudflare Temp Email</a>；部署后可支持多线程收码。`;
  }
  
  async function confirmCloudflareTempEmailRegistrationLookupIfNeeded() {
    if (isCloudflareTempEmailRegistrationLookupPromptDismissed()) {
      return true;
    }
  
    const result = await openConfirmModalWithOption({
      title: '注册邮箱查信',
      messageHtml: buildCloudflareTempEmailRegistrationLookupPromptHtml(),
      confirmLabel: '我已知晓',
      optionLabel: '不再提醒',
    });
  
    if (result.confirmed && result.optionChecked) {
      setCloudflareTempEmailRegistrationLookupPromptDismissed(true);
    }
  
    return result.confirmed;
  }
  
  async function openAutoSkipFailuresConfirmModal() {
    const result = await openConfirmModalWithOption({
      title: '自动重试说明',
      message: `开启后，自动模式在某一轮失败时，会先在当前轮自动重试；单轮最多重试 ${AUTO_RUN_MAX_RETRIES_PER_ROUND} 次，仍失败则放弃当前轮并继续下一轮。线程间隔只在开启自动重试且总轮数大于 1 时生效。`,
      confirmLabel: '确认开启',
    });
  
    return {
      confirmed: result.confirmed,
      dismissPrompt: result.optionChecked,
    };
  }
  
  async function openAutoRunFallbackRiskConfirmModal(totalRuns) {
    const result = await openConfirmModalWithOption({
      title: '自动运行风险提醒',
      message: `当前轮数可能不适合单节点情况，可选择对应代理工具节点轮询功能（若没有配置，请使用说明按钮，根据README中使用教程进行配置），避免连续使用一个节点注册导致认证风控。`,
      confirmLabel: '继续',
    });
  
    return {
      confirmed: result.confirmed,
      dismissPrompt: result.optionChecked,
    };
  }
  
  function updateConfigMenuControls() {
    const actionLocked = configActionInFlight;
    const contributionModeEnabled = Boolean(latestState?.contributionMode);
    if (contributionModeEnabled && configMenuController.isOpen()) {
      configMenuController.setOpen(false);
    }
    configMenuController.setOpen(configMenuController.isOpen());
    const configMenuOpen = configMenuController.isOpen();
    const importLocked = actionLocked
      || settingsSaveInFlight
      || contributionModeEnabled
      || currentAutoRun.autoRunning
      || Object.values(getStepStatuses()).some((status) => status === 'running');
    if (btnConfigMenu) {
      btnConfigMenu.disabled = contributionModeEnabled;
      btnConfigMenu.setAttribute('aria-expanded', String(configMenuOpen));
      btnConfigMenu.title = contributionModeEnabled ? '贡献模式下暂不可导入导出配置' : '导入或导出配置';
    }
    if (configMenu) {
      configMenu.hidden = contributionModeEnabled || !configMenuOpen;
    }
    if (btnExportSettings) {
      btnExportSettings.disabled = actionLocked || contributionModeEnabled;
    }
    if (btnImportSettings) {
      btnImportSettings.disabled = importLocked;
    }
  }
  
  function setConfigActionInFlight(value) {
    configActionInFlight = Boolean(value);
    updateConfigMenuControls();
  }
  
  function resetImportSettingsFile() {
    if (inputImportSettingsFile) {
      inputImportSettingsFile.value = '';
    }
  }
  
  function closeConfigMenu() {
    configMenuController.close();
    updateConfigMenuControls();
  }
  
  function openConfigMenu() {
    configMenuController.setOpen(true);
    updateConfigMenuControls();
  }
  
  function toggleConfigMenu() {
    configMenuController.isOpen() ? closeConfigMenu() : openConfigMenu();
  }
  
  function buildDownloadFileTimestamp() {
    const now = new Date();
    const pad = (value) => String(value).padStart(2, '0');
    return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  }
  
  function inferDownloadExtension(mimeType = '') {
    const normalized = String(mimeType || '').toLowerCase();
    if (normalized.includes('text/plain')) return 'txt';
    if (normalized.includes('json')) return 'json';
    return 'txt';
  }
  
  function normalizeDownloadFileName(fileName = '', mimeType = '') {
    const extension = inferDownloadExtension(mimeType);
    const sanitized = String(fileName || '')
      .trim()
      .replace(/[\\/:*?"<>|]+/g, '-')
      .replace(/^\.+/g, '')
      .trim();
    const fallback = `download-${buildDownloadFileTimestamp()}.${extension}`;
    const safeName = sanitized || fallback;
    return /\.[a-z0-9]{1,8}$/i.test(safeName) ? safeName : `${safeName}.${extension}`;
  }
  
  const downloadService = window.SidepanelDownloadService?.createDownloadService?.({
    normalizeDownloadFileName,
    inferDownloadExtension,
    chromeApi: chrome,
  });
  
  function getDownloadService() {
    if (!downloadService) {
      throw new Error('下载服务未加载。');
    }
    return downloadService;
  }
  
  async function requestTextFileSaveTarget(fileName, mimeType = 'application/json;charset=utf-8') {
    return getDownloadService().requestTextFileSaveTarget(fileName, mimeType);
  }
  
  async function downloadTextFile(content, fileName, mimeType = 'application/json;charset=utf-8', options = {}) {
    return getDownloadService().downloadTextFile(content, fileName, mimeType, options);
  }
  
  async function reloadUpiCredentialMembershipAfterRuntimeImport() {
    await getAccountRecordsManager()?.reloadUpiCredentialMembershipAfterRuntimeImport?.({ silent: true });
  }
  
  function getSettingsStateManager() {
    if (settingsStateManager) {
      return settingsStateManager;
    }
  
    settingsStateManager = window.SidepanelSettingsStateManager?.createSettingsStateManager?.({
      helpers: {
        collectSettingsPayload,
        applySettingsState,
      },
    }) || null;
  
    return settingsStateManager;
  }
  
  function getWorkflowControlsManager() {
    if (workflowControlsManager) {
      return workflowControlsManager;
    }
  
    workflowControlsManager = window.SidepanelWorkflowControlsManager?.createWorkflowControlsManager?.({
      helpers: {
        executeNode: executeNodeFromSidepanel,
        skipNode: handleSkipNode,
        renderStepsList,
        renderStepStatuses,
      },
    }) || null;
  
    return workflowControlsManager;
  }
  
  getSettingsStateManager();
  getWorkflowControlsManager();
  
  function getSettingsTransferManager() {
    if (settingsTransferManager) {
      return settingsTransferManager;
    }
  
    settingsTransferManager = window.SidepanelSettingsTransferManager?.createSettingsTransferManager?.({
      controls: {
        setConfigActionInFlight,
        updateConfigMenuControls,
        resetImportSettingsFile,
      },
      helpers: {
        requestTextFileSaveTarget,
        buildDownloadFileTimestamp,
        downloadTextFile,
        closeConfigMenu,
        flushPendingSettingsBeforeExport,
        settlePendingSettingsBeforeImport,
        openConfirmModal,
        showToast,
        applySettingsState,
        reloadUpiCredentialMembershipAfterRuntimeImport,
        updateStatusDisplay,
      },
      runtime: {
        sendMessage: (message) => chrome.runtime.sendMessage(message),
      },
    }) || null;
  
    return settingsTransferManager;
  }
  
  async function exportSettings() {
    await getSettingsTransferManager()?.exportSettingsFile?.();
  }
  
  async function importSettingsFromFile(file) {
    await getSettingsTransferManager()?.importSettingsFromFile?.(file);
  }
  
  function bindConfigMenuEvents() {
    configMenuController.bind();
  }
  
  function setCurrentSessionExportButtonsDisabled(disabled) {
    [
      btnExportCurrentSessionCpaJson,
      btnExportCurrentSessionSub2Json,
    ].forEach((button) => {
      if (button) {
        button.disabled = Boolean(disabled);
      }
    });
  }
  
  async function confirmCurrentSessionExportWarning(format) {
    const normalizedFormat = String(format || '').trim().toLowerCase() === 'sub2'
      ? 'sub2'
      : 'cpa';
    const label = normalizedFormat === 'sub2' ? 'SUB2 JSON' : 'CPA JSON';
    return openConfirmModal({
      title: '导出提醒',
      message: '目前SESSION导出的JSON无法直接使用',
      alert: {
        text: `确认后仍会继续导出 ${label} 文件。`,
        tone: 'danger',
      },
      confirmLabel: '继续导出',
      confirmVariant: 'btn-danger',
    });
  }
  
  async function exportCurrentSessionJson(format) {
    const normalizedFormat = String(format || '').trim().toLowerCase() === 'sub2'
      ? 'sub2'
      : 'cpa';
    const confirmed = await confirmCurrentSessionExportWarning(normalizedFormat);
    if (!confirmed) {
      return;
    }
    const saveTarget = await requestTextFileSaveTarget(
      `current-session-${normalizedFormat}-${buildDownloadFileTimestamp()}.json`,
      'application/json;charset=utf-8'
    );
    if (saveTarget?.cancelled) {
      showToast('已取消导出当前 SESSION。', 'info', 1800);
      return;
    }
    if (saveTarget?.error) {
      showToast('导出当前 SESSION JSON 失败：' + (saveTarget.error?.message || '无法打开保存窗口。'), 'error', 3200);
      return;
    }
    setCurrentSessionExportButtonsDisabled(true);
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'EXPORT_CURRENT_SESSION_JSON',
        source: 'sidepanel',
        payload: { format: normalizedFormat },
      });
      if (response?.error) {
        throw new Error(response.error);
      }
      if (!response?.fileContent || !response?.fileName) {
        throw new Error('后台未返回可下载的 SESSION JSON。');
      }
      const downloadResult = await downloadTextFile(response.fileContent, response.fileName, 'application/json;charset=utf-8', {
        saveTarget,
      });
      if (downloadResult?.cancelled) {
        showToast('已取消导出当前 SESSION。', 'info', 1800);
        return;
      }
      const label = normalizedFormat === 'sub2' ? 'SUB2 JSON' : 'CPA JSON';
      showToast(`已导出当前 SESSION：${label}`, 'success', 1800);
      (response.warnings || []).forEach((warning) => {
        if (warning) {
          showToast(String(warning), 'warn', 2600);
        }
      });
    } catch (error) {
      showToast(error?.message || '导出当前 SESSION JSON 失败。', 'error', 3200);
    } finally {
      setCurrentSessionExportButtonsDisabled(false);
    }
  }
  
  function isDoneStatus(status) {
    return status === 'completed' || status === 'manual_completed' || status === 'skipped';
  }
  
  function escapeCssValue(value = '') {
    const raw = String(value || '');
    if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
      return CSS.escape(raw);
    }
    return raw.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }
  
  function getNodeStatuses(state = latestState) {
    return normalizeNodeStatusesForCurrentWorkflow(state?.nodeStatuses || {});
  }
  
  function getStepStatuses(state = latestState) {
    const merged = { ...STEP_DEFAULT_STATUSES };
    if (typeof getNodeStatuses === 'function') {
      const nodeStatuses = getNodeStatuses(state);
      for (const [nodeId, status] of Object.entries(nodeStatuses)) {
        const step = getStepIdByNodeIdForCurrentMode(nodeId);
        if (step) {
          merged[step] = status || 'pending';
        }
      }
    }
    return Object.fromEntries(STEP_IDS.map((stepId) => [stepId, merged[stepId] || 'pending']));
  }
  
  function getFirstUnfinishedNode(state = latestState) {
    const statuses = getNodeStatuses(state);
    for (const nodeId of NODE_IDS) {
      if (!isDoneStatus(statuses[nodeId])) {
        return nodeId;
      }
    }
    return '';
  }
  
  function getFirstUnfinishedStep(state = latestState) {
    const nodeId = getFirstUnfinishedNode(state);
    return nodeId ? getStepIdByNodeIdForCurrentMode(nodeId) : null;
  }
  
  function getRunningNodes(state = latestState) {
    const statuses = getNodeStatuses(state);
    return Object.entries(statuses)
      .filter(([, status]) => status === 'running')
      .map(([nodeId]) => nodeId);
  }
  
  function getRunningSteps(state = latestState) {
    return getRunningNodes(state)
      .map((nodeId) => getStepIdByNodeIdForCurrentMode(nodeId))
      .filter((step) => Number.isInteger(step) && step > 0)
      .sort((a, b) => a - b);
  }
  
  function hasSavedProgress(state = latestState) {
    const statuses = getNodeStatuses(state);
    return Object.values(statuses).some((status) => status !== 'pending');
  }
  
  function isContributionModeSwitchBlocked(state = latestState) {
    const statuses = getStepStatuses(state);
    const anyRunning = Object.values(statuses).some((status) => status === 'running');
    return anyRunning || isAutoRunLockedPhase() || isAutoRunPausedPhase() || isAutoRunScheduledPhase();
  }
  
  function shouldOfferAutoModeChoice(state = latestState) {
    return hasSavedProgress(state) && getFirstUnfinishedStep(state) !== null;
  }
  
  function syncLatestState(nextState) {
    const mergedNodeStatuses = nextState?.nodeStatuses
      ? normalizeNodeStatusesForCurrentWorkflow({
        ...(latestState?.nodeStatuses || {}),
        ...nextState.nodeStatuses,
      })
      : getNodeStatuses(latestState);
  
    latestState = normalizeChatgptSessionReaderStateForUi({
      ...(latestState || {}),
      ...(nextState || {}),
      nodeStatuses: mergedNodeStatuses,
    }, {
      legacyOverrideSource: nextState || {},
    });
    syncLocalChatgptSessionReaderDraftFromState(latestState);
  
    renderAccountRecords(latestState);
  }
  
  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[char] || char));
  }
  
  function normalizeNodeStatusesForCurrentWorkflow(statuses = {}) {
    const source = statuses && typeof statuses === 'object' ? statuses : {};
    const merged = { ...NODE_DEFAULT_STATUSES, ...source };
    return Object.fromEntries(NODE_IDS.map((nodeId) => [nodeId, merged[nodeId] || 'pending']));
  }
  
  function initializeManualStepActions() {
    document.querySelectorAll('.step-row').forEach((row) => {
      if (row.querySelector('.step-actions')) {
        return;
      }
      const step = Number(row.dataset.step);
      const nodeId = String(row.dataset.nodeId || getNodeIdByStepForCurrentMode(step) || '').trim();
      const statusEl = row.querySelector('.step-status');
      if (!statusEl) {
        return;
      }
  
      const actions = document.createElement('div');
      actions.className = 'step-actions';
  
      const manualBtn = document.createElement('button');
      manualBtn.type = 'button';
      manualBtn.className = 'step-manual-btn';
      manualBtn.dataset.step = String(step || '');
      manualBtn.dataset.nodeId = nodeId;
      manualBtn.title = '跳过此节点';
      manualBtn.setAttribute('aria-label', `跳过节点 ${nodeId || step}`);
      manualBtn.textContent = '跳过';
      manualBtn.addEventListener('click', async (event) => {
        event.stopPropagation();
        try {
          await handleSkipNode(nodeId || getNodeIdByStepForCurrentMode(step));
        } catch (err) {
          showToast(err?.message || String(err || '跳过节点失败'), 'error');
        }
      });
  
      statusEl.parentNode.replaceChild(actions, statusEl);
      actions.appendChild(manualBtn);
      actions.appendChild(statusEl);
    });
  }
  
  function renderStepsList() {
    workflowController.renderStepsList();
  }
  
  function syncStepDefinitionsForMode(plusModeEnabled = false, plusPaymentMethodOrOptions = {}, maybeOptions = {}) {
    workflowController.syncStepDefinitionsForMode(plusModeEnabled, plusPaymentMethodOrOptions, maybeOptions);
  }
  
  function renderSingleNodeStatus(nodeId, status) {
    workflowController.renderSingleNodeStatus(nodeId, status);
  }
  
  function renderSingleStepStatus(step, status) {
    workflowController.renderSingleStepStatus(step, status);
  }
  
  function renderStepStatuses(state = latestState) {
    workflowController.renderStepStatuses(state);
  }
  
  function updateProgressCounter() {
    workflowController.updateProgressCounter();
  }
  
  function arePreviousNodesReadyForManualExecute(nodeId = '', statuses = getNodeStatuses()) {
    return workflowController.arePreviousNodesReadyForManualExecute(nodeId, statuses);
  }
  
  function canExecuteNodeWithoutPreviousNode(nodeId = '', statuses = getNodeStatuses()) {
    return workflowController.canExecuteNodeWithoutPreviousNode(nodeId, statuses);
  }
  
  function updateButtonStates() {
    workflowController.updateButtonStates();
  }
  
  function updateNodeUI(nodeId, status) {
    workflowController.updateNodeUI(nodeId, status);
  }
  
  function updateStepUI(step, status) {
    workflowController.updateStepUI(step, status);
  }

  function updateStopButtonState(active) {
    if (btnStop) {
      btnStop.disabled = !active;
    }
  }
  
  function updateStatusDisplay(state = latestState) {
    workflowController.updateStatusDisplay(state);
  }
  
  function appendLog(entry = {}) {
    logPanelManager.appendLog(entry);
  }
  
  function syncPasswordField(state = latestState) {
    if (inputPassword) {
      inputPassword.value = state?.customPassword || state?.password || '';
    }
  }
  
  function syncPasswordToggleLabel() {
    sidepanelUiHelpers?.syncPasswordVisibilityToggle?.(btnTogglePassword);
  }
  
  function syncVpsUrlToggleLabel() {
    sidepanelUiHelpers?.syncPasswordVisibilityToggle?.(btnToggleVpsUrl);
  }
  
  function syncVpsPasswordToggleLabel() {
    sidepanelUiHelpers?.syncPasswordVisibilityToggle?.(btnToggleVpsPassword);
  }
  
  function syncPasswordVisibilityToggles() {
    sidepanelUiHelpers?.syncPasswordVisibilityToggles?.(document);
  }
  
  function bindPasswordVisibilityToggles() {
    sidepanelUiHelpers?.bindPasswordVisibilityToggles?.(document);
  }
  
  function applySettingsState(state = {}) {
    const normalizedState = normalizeChatgptSessionReaderStateForUi(state || {});
    const stepDefinitionState = typeof resolveStepDefinitionCapabilityState === 'function'
      ? resolveStepDefinitionCapabilityState(normalizedState, {
        signupMethod: normalizedState?.signupMethod,
        panelMode: normalizedState?.panelMode,
        activeFlowId: normalizedState?.activeFlowId,
      })
      : {
        plusModeEnabled: Boolean(normalizedState?.plusModeEnabled),
        signupMethod: normalizeSignupMethod(normalizedState?.signupMethod || DEFAULT_SIGNUP_METHOD),
        plusAccountAccessStrategy: normalizePlusAccountAccessStrategy(normalizedState?.plusAccountAccessStrategy),
      };
    syncStepDefinitionsForMode(stepDefinitionState.plusModeEnabled, {
      activeFlowId: normalizedState?.flowId || normalizedState?.activeFlowId,
      panelMode: normalizedState?.panelMode,
      plusPaymentMethod: normalizedState?.plusPaymentMethod,
      plusAccountAccessStrategy: stepDefinitionState.plusAccountAccessStrategy,
      signupMethod: stepDefinitionState.signupMethod,
      upiRedeemStopAfterRedeem: true,
      upiRedeemContinueAfterRedeem: false,
      totpMfaAfterProfileEnabled: normalizedState?.totpMfaAfterProfileEnabled !== false,
      registrationFreeRoute: normalizeRegistrationFreeRoute(normalizedState?.registrationFreeRoute),
    });
    syncLatestState(normalizedState);
    syncAutoRunState(normalizedState);
    if (typeof applyOperationDelayState === 'function') {
      applyOperationDelayState(normalizedState);
    }
  
    if (inputEmail) {
      inputEmail.value = normalizedState.email || '';
    }
    syncPasswordField(normalizedState);
    if (inputPlusModeEnabled) {
      inputPlusModeEnabled.checked = FIXED_PLUS_MODE_ENABLED;
    }
    if (selectPlusPaymentMethod) {
      selectPlusPaymentMethod.value = normalizePlusPaymentMethod(normalizedState.plusPaymentMethod);
    }
    if (inputUpiRedeemExternalApiKey) {
      inputUpiRedeemExternalApiKey.value = String(normalizedState.upiRedeemExternalApiKey ?? normalizedState.pixRedeemExternalApiKey ?? '').trim();
    }
    if (inputUpiRedeemClientId) {
      inputUpiRedeemClientId.value = String(normalizedState.upiRedeemClientId ?? normalizedState.pixRedeemClientId ?? '').trim();
    }
    if (inputUpiRedeemFailedAccountRetryLimit) {
      inputUpiRedeemFailedAccountRetryLimit.value = String(normalizeUpiRedeemFailedAccountRetryLimit(
        normalizedState.upiRedeemFailedAccountRetryLimit,
        DEFAULT_UPI_REDEEM_FAILED_ACCOUNT_RETRY_LIMIT
      ));
    }
    if (inputTotpMfaAfterProfileEnabled) {
      inputTotpMfaAfterProfileEnabled.checked = normalizedState.totpMfaAfterProfileEnabled !== false;
    }
    if (selectRegistrationFreeRoute) {
      selectRegistrationFreeRoute.value = normalizeRegistrationFreeRoute(normalizedState.registrationFreeRoute);
    }
    if (inputUpiCredentialMembershipTotpApiBaseUrl) {
      inputUpiCredentialMembershipTotpApiBaseUrl.value = String(normalizedState.upiCredentialMembershipCheckTotpApiBaseUrl || 'https://cha.nerver.cc').trim();
    }
    if (inputUpiCredentialMembershipTotpLookupKey) {
      inputUpiCredentialMembershipTotpLookupKey.value = String(normalizedState.upiCredentialMembershipCheckTotpLookupKey || '').trim();
    }
    if (inputUpiSubscriptionApiBaseUrl) {
      inputUpiSubscriptionApiBaseUrl.value = String(normalizedState.upiSubscriptionApiBaseUrl || 'https://cha.nerver.cc').trim();
    }
    setSharedVerificationCodeWaitInputs(
      normalizedState.setGptPasswordVerificationWaitSeconds ?? normalizedState.signupVerificationCodeWaitSeconds,
      DEFAULT_SET_GPT_PASSWORD_VERIFICATION_WAIT_SECONDS
    );
    syncUpiRedeemAfterModeControls((normalizedState.upiRedeemContinueAfterRedeem ?? normalizedState.pixRedeemContinueAfterRedeem) === true ? false : true);
    if (inputVpsUrl) {
      inputVpsUrl.value = normalizedState.vpsUrl || '';
    }
    if (inputVpsPassword) {
      inputVpsPassword.value = normalizedState.vpsPassword || '';
    }
    if (inputLocalCpaJsonPluginDir) {
      inputLocalCpaJsonPluginDir.value = normalizedState.localCpaJsonPluginDir || '';
    }
    if (inputLocalCpaJsonRelativeAuthDir) {
      inputLocalCpaJsonRelativeAuthDir.value = normalizeLocalCpaJsonRelativeAuthDirValue(normalizedState.localCpaJsonRelativeAuthDir);
    }
    if (selectPanelMode) {
      selectPanelMode.value = getExportTargetForPanelMode(normalizedState.panelMode || DEFAULT_PANEL_MODE);
    }
    if (selectAccountAccessStrategy) {
      selectAccountAccessStrategy.value = getAccountAccessStrategyUiValueForState(normalizedState);
    }
    const restoredMailProvider = (
      typeof normalizeSupportedMailProvider === 'function'
        ? normalizeSupportedMailProvider
        : ((value = '') => String(value || '').trim().toLowerCase())
    )(normalizedState?.mailProvider);
    if (selectMailProvider) {
      selectMailProvider.value = restoredMailProvider;
    }
    setMail2925Mode(normalizedState?.mail2925Mode);
    if (selectEmailGenerator) {
      const cloudflareTempEmailProvider = typeof CLOUDFLARE_TEMP_EMAIL_PROVIDER === 'string'
        ? CLOUDFLARE_TEMP_EMAIL_PROVIDER
        : 'cloudflare-temp-email';
      const freemailProvider = typeof FREEMAIL_PROVIDER === 'string'
        ? FREEMAIL_PROVIDER
        : 'freemail';
      const moemailProvider = typeof MOEMAIL_PROVIDER === 'string'
        ? MOEMAIL_PROVIDER
        : 'moemail';
      const yydsmailProvider = typeof YYDSMAIL_PROVIDER === 'string'
        ? YYDSMAIL_PROVIDER
        : 'yydsmail';
      const outlookEmailPlusProvider = typeof OUTLOOK_EMAIL_PLUS_PROVIDER === 'string'
        ? OUTLOOK_EMAIL_PLUS_PROVIDER
        : 'outlook-email-plus';
      const outlookEmailPlusGenerator = typeof OUTLOOK_EMAIL_PLUS_GENERATOR === 'string'
        ? OUTLOOK_EMAIL_PLUS_GENERATOR
        : 'outlook-email-plus';
      const gmailProvider = typeof GMAIL_PROVIDER === 'string'
        ? GMAIL_PROVIDER
        : 'gmail';
      const customEmailPoolGenerator = typeof CUSTOM_EMAIL_POOL_GENERATOR === 'string'
        ? CUSTOM_EMAIL_POOL_GENERATOR
        : 'custom-pool';
      const gmailAliasGenerator = typeof GMAIL_ALIAS_GENERATOR === 'string'
        ? GMAIL_ALIAS_GENERATOR
        : 'gmail-alias';
      const restoredEmailGenerator = String(normalizedState?.emailGenerator || '').trim().toLowerCase();
      if (restoredMailProvider === cloudflareTempEmailProvider) {
        selectEmailGenerator.value = cloudflareTempEmailProvider;
      } else if (restoredMailProvider === freemailProvider) {
        selectEmailGenerator.value = freemailProvider;
      } else if (restoredMailProvider === moemailProvider) {
        selectEmailGenerator.value = moemailProvider;
      } else if (restoredMailProvider === yydsmailProvider) {
        selectEmailGenerator.value = yydsmailProvider;
      } else if (restoredMailProvider === outlookEmailPlusProvider) {
        selectEmailGenerator.value = outlookEmailPlusGenerator;
      } else if (restoredMailProvider === 'hotmail-api') {
        selectEmailGenerator.value = 'duck';
      } else if (restoredMailProvider === gmailProvider) {
        selectEmailGenerator.value = restoredEmailGenerator === customEmailPoolGenerator
          ? customEmailPoolGenerator
          : gmailAliasGenerator;
      } else if (restoredEmailGenerator === customEmailPoolGenerator) {
        selectEmailGenerator.value = customEmailPoolGenerator;
      } else if (restoredEmailGenerator === 'icloud') {
        selectEmailGenerator.value = 'icloud';
      } else if (restoredEmailGenerator === 'cloudflare') {
        selectEmailGenerator.value = 'cloudflare';
      } else if (restoredEmailGenerator === cloudflareTempEmailProvider) {
        selectEmailGenerator.value = cloudflareTempEmailProvider;
      } else if (restoredEmailGenerator === CLOUD_MAIL_PROVIDER) {
        selectEmailGenerator.value = CLOUD_MAIL_PROVIDER;
      } else if (restoredEmailGenerator === freemailProvider) {
        selectEmailGenerator.value = freemailProvider;
      } else if (restoredEmailGenerator === moemailProvider) {
        selectEmailGenerator.value = moemailProvider;
      } else if (restoredEmailGenerator === yydsmailProvider) {
        selectEmailGenerator.value = yydsmailProvider;
      } else if (restoredEmailGenerator === outlookEmailPlusGenerator) {
        selectEmailGenerator.value = outlookEmailPlusGenerator;
      } else {
        selectEmailGenerator.value = 'duck';
      }
    }
    if (selectIcloudHostPreference) {
      const hostPreference = String(normalizedState?.icloudHostPreference || '').trim().toLowerCase();
      selectIcloudHostPreference.value = hostPreference === 'icloud.com' || hostPreference === 'icloud.com.cn'
        ? hostPreference
        : 'auto';
    }
    if (selectIcloudFetchMode) {
      selectIcloudFetchMode.value = normalizeIcloudFetchMode(normalizedState?.icloudFetchMode);
    }
    if (selectIcloudTargetMailboxType) {
      selectIcloudTargetMailboxType.value = normalizeIcloudTargetMailboxType(normalizedState?.icloudTargetMailboxType);
    }
    if (selectIcloudForwardMailProvider) {
      selectIcloudForwardMailProvider.value = normalizeIcloudForwardMailProvider(normalizedState?.icloudForwardMailProvider);
    }
    if (inputIcloudApiBaseUrl) {
      inputIcloudApiBaseUrl.value = normalizeIcloudApiBaseUrlValue(normalizedState?.icloudApiBaseUrl);
    }
    if (inputIcloudApiAdminKey) {
      inputIcloudApiAdminKey.value = normalizedState?.icloudApiAdminKey || '';
    }
    if (checkboxAutoDeleteIcloud) {
      checkboxAutoDeleteIcloud.checked = Boolean(normalizedState?.autoDeleteUsedIcloudAlias);
    }
    if (inputMail2925UseAccountPool) {
      inputMail2925UseAccountPool.checked = Boolean(normalizedState?.mail2925UseAccountPool);
    }
    setManagedAliasBaseEmailInputForProvider(restoredMailProvider, normalizedState);
    if (inputInbucketHost) inputInbucketHost.value = normalizedState?.inbucketHost || '';
    if (inputInbucketMailbox) inputInbucketMailbox.value = normalizedState?.inbucketMailbox || '';
    if (inputCustomMailProviderPool) {
      inputCustomMailProviderPool.value = normalizeCustomEmailPoolEntryValues(normalizedState?.customMailProviderPool).join('\n');
    }
    setCustomEmailPoolEntriesState(restoreCustomEmailPoolEntriesFromState(normalizedState));
    if (inputSub2ApiUrl) inputSub2ApiUrl.value = normalizedState.sub2apiUrl || '';
    if (inputSub2ApiEmail) inputSub2ApiEmail.value = normalizedState.sub2apiEmail || '';
    if (inputSub2ApiPassword) inputSub2ApiPassword.value = normalizedState.sub2apiPassword || '';
    if (inputSub2ApiAccountPriority) {
      inputSub2ApiAccountPriority.value = String(normalizeSub2ApiAccountPriorityValue(normalizedState.sub2apiAccountPriority));
    }
    if (inputSub2ApiDefaultProxy) {
      inputSub2ApiDefaultProxy.value = normalizedState.sub2apiDefaultProxyName || '';
    }
    renderSub2ApiGroupOptions(normalizedState, normalizedState.sub2apiGroupName || '');
    applyChatgptSessionReaderProfileToInputs(normalizedState, {
      mode: normalizedState.chatgptSessionReaderMode,
    });
    if (!shouldPreserveFocusedUpiRedeemCdkeyPoolEdit('upi') && inputUpiRedeemCdkeyPool) {
      inputUpiRedeemCdkeyPool.value = '';
    }
    if (!shouldPreserveFocusedUpiRedeemCdkeyPoolEdit('ideal') && inputIdealRedeemCdkeyPool) {
      inputIdealRedeemCdkeyPool.value = '';
    }
    updateAllUpiRedeemCdkeyPoolSummaries(normalizedState);
    renderStepStatuses(latestState);
    updatePanelModeUI();
    updatePlusModeUI();
    updateMailProviderUI();
    updateButtonStates();
    updateStatusDisplay(latestState);
    markSettingsDirty(false);
  }
  
  async function restoreState() {
    try {
      const state = await chrome.runtime.sendMessage({ type: 'GET_STATE', source: 'sidepanel' });
      applySettingsState(state || {});
      if (state?.oauthUrl) {
        displayOauthUrl.textContent = state.oauthUrl;
        displayOauthUrl.classList.add('has-value');
      }
      setOauthLoginCodeDisplay(state?.lastLoginCode || '');
      if (state?.localhostUrl) {
        displayLocalhostUrl.textContent = state.localhostUrl;
        displayLocalhostUrl.classList.add('has-value');
      }
      if (Array.isArray(state?.logs)) {
        logPanelManager.renderLogs(state.logs);
      }
      renderContributionMode();
    } catch (err) {
      console.error('Failed to restore state:', err);
      if (typeof applyOperationDelayState === 'function') {
        applyOperationDelayState(undefined, { restoreFailed: true });
      }
    }
  }
  
  function getHotmailAccounts(state = latestState) {
    return Array.isArray(state?.hotmailAccounts) ? state.hotmailAccounts : [];
  }
  
  function preserveHotmailAccountsForSettingsSaveResponse(responseState = {}, requestPayload = {}) {
    const nextState = responseState && typeof responseState === 'object' && !Array.isArray(responseState)
      ? { ...responseState }
      : {};
    const payloadIncludesHotmailAccounts = Object.prototype.hasOwnProperty.call(requestPayload || {}, 'hotmailAccounts');
    const payloadIncludesCurrentHotmail = Object.prototype.hasOwnProperty.call(requestPayload || {}, 'currentHotmailAccountId');
    const currentHotmailAccounts = getHotmailAccounts(latestState);
    const responseHotmailAccounts = getHotmailAccounts(nextState);
  
    if (!payloadIncludesHotmailAccounts && currentHotmailAccounts.length > 0 && responseHotmailAccounts.length === 0) {
      nextState.hotmailAccounts = currentHotmailAccounts;
    }
    if (
      !payloadIncludesCurrentHotmail
      && !nextState.currentHotmailAccountId
      && latestState?.currentHotmailAccountId
      && getHotmailAccounts(nextState).some((account) => account.id === latestState.currentHotmailAccountId)
    ) {
      nextState.currentHotmailAccountId = latestState.currentHotmailAccountId;
    }
  
    return nextState;
  }
  
  function getCurrentHotmailAccount(state = latestState) {
    const currentId = state?.currentHotmailAccountId;
    return getHotmailAccounts(state).find((account) => account.id === currentId) || null;
  }
  
  function getCurrentHotmailEmail(state = latestState) {
    return String(getCurrentHotmailAccount(state)?.email || '').trim();
  }
  
  function getMail2925Accounts(state = latestState) {
    return Array.isArray(state?.mail2925Accounts) ? state.mail2925Accounts : [];
  }
  
  function getCurrentMail2925Account(state = latestState) {
    const currentId = state?.currentMail2925AccountId;
    return getMail2925Accounts(state).find((account) => account.id === currentId) || null;
  }
  
  function getCurrentMail2925Email(state = latestState) {
    return String(getCurrentMail2925Account(state)?.email || '').trim();
  }
  
  function getLegacyWalletAccounts(state = latestState) {
    return Array.isArray(state?.legacyWalletAccounts) ? state.legacyWalletAccounts : [];
  }
  
  function getCurrentLegacyWalletAccount(state = latestState) {
    const currentId = String(state?.currentLegacyWalletAccountId || '').trim();
    return getLegacyWalletAccounts(state).find((account) => account.id === currentId) || null;
  }
  
  function getCurrentLuckmailPurchase(state = latestState) {
    return state?.currentLuckmailPurchase || null;
  }
  
  function getCurrentLuckmailEmail(state = latestState) {
    return String(getCurrentLuckmailPurchase(state)?.email_address || '').trim();
  }
  
  function getAccountRecordsManager() {
    if (accountRecordsManager) {
      return accountRecordsManager;
    }
    accountRecordsManager = window.SidepanelAccountRecordsManager?.createAccountRecordsManager?.({
      state: {
        getLatestState: () => latestState,
        syncLatestState,
      },
      dom: {
        accountRecordsList,
        accountRecordsMeta,
        accountRecordsOverlay,
        accountRecordsPageLabel,
        accountRecordsStats,
        btnAccountRecordsNext,
        btnAccountRecordsPrev,
        btnClearAccountRecords,
        btnDeleteSelectedAccountRecords,
        btnExportSuccessAccountRecords,
        btnShowUpiCredentialBackups,
        btnExportUpiCredentialBackups,
        btnCheckUpiCredentialMembershipLocal,
        btnImportUpiCredentialMembershipTxt,
        btnImportUpiCredentialMembershipFreeTxt,
        btnStopUpiCredentialMembershipCheck,
        inputUpiCredentialMembershipTxt,
        inputUpiCredentialMembershipTotpApiBaseUrl,
        inputUpiCredentialMembershipTotpLookupKey,
        inputUpiRedeemExternalApiKey,
        inputUpiRedeemClientId,
        inputUpiRedeemFailedAccountRetryLimit,
        inputUpiRedeemCdkeyPool,
        inputIdealRedeemCdkeyPool,
        btnExportUpiRedeemSuccessRecords,
        upiCredentialBackupPreviewWrap,
        upiCredentialBackupPreview,
        upiCredentialMembershipCheckResults,
        btnCloseAccountRecords,
        btnOpenAccountRecords,
        btnToggleAccountRecordsSelection,
      },
      helpers: {
        downloadTextFile,
        escapeHtml,
        openConfirmModal,
        refreshUpiRedeemCdkeyStatuses,
        showToast,
      },
      runtime: {
        sendMessage: (message) => chrome.runtime.sendMessage(message),
      },
      constants: {
        displayTimeZone: DISPLAY_TIMEZONE,
        pageSize: 10,
      },
    }) || null;
    return accountRecordsManager;
  }
  
  function renderAccountRecords(currentState = latestState) {
    getAccountRecordsManager()?.render?.(currentState);
  }
  
  function bindAccountRecordEvents() {
    getAccountRecordsManager()?.bindEvents?.();
  }
  
  function closeAccountRecordsPanel() {
    getAccountRecordsManager()?.closePanel?.();
  }
  
  function setElementVisible(element, visible) {
    if (element) {
      element.style.display = visible ? '' : 'none';
    }
  }
  
  function updateMailProviderUI() {
    const provider = String(selectMailProvider?.value || latestState?.mailProvider || '').trim().toLowerCase();
    const emailGenerator = String(selectEmailGenerator?.value || latestState?.emailGenerator || '').trim().toLowerCase();
    const useCustomProvider = provider === 'custom';
    const use2925 = provider === '2925';
    const useLuckmail = provider === LUCKMAIL_PROVIDER;
    const useIcloud = provider === ICLOUD_PROVIDER || provider === ICLOUD_API_PROVIDER || emailGenerator === ICLOUD_PROVIDER;
    const useCustomPool = provider === CUSTOM_EMAIL_POOL_GENERATOR || emailGenerator === CUSTOM_EMAIL_POOL_GENERATOR;
    const useCloudflareTempEmail = provider === CLOUDFLARE_TEMP_EMAIL_PROVIDER || emailGenerator === CLOUDFLARE_TEMP_EMAIL_PROVIDER;
    const useCloudMail = provider === CLOUD_MAIL_PROVIDER || emailGenerator === CLOUD_MAIL_PROVIDER;
    const useFreemail = provider === FREEMAIL_PROVIDER || emailGenerator === FREEMAIL_PROVIDER;
  
    setElementVisible(rowCustomMailProviderPool, useCustomProvider);
    setElementVisible(rowMail2925Mode, use2925);
    setElementVisible(rowMail2925PoolSettings, use2925);
    setElementVisible(rowCustomEmailPool, useCustomPool);
    if (useCustomPool) {
      queueCustomEmailPoolRefresh();
    } else {
      resetCustomEmailPoolManager();
    }
    setElementVisible(icloudSection, useIcloud);
    setElementVisible(luckmailSection, useLuckmail);
    setElementVisible(cloudflareTempEmailSection, useCloudflareTempEmail);
    setElementVisible(cloudMailSection, useCloudMail);
    setElementVisible(freemailSection, useFreemail);
    setElementVisible(rowEmailGenerator, !useCustomProvider);
    if (selectEmailGenerator) {
      selectEmailGenerator.disabled = useCustomProvider || useLuckmail || provider === 'hotmail-api';
    }
  
    if (inputIcloudApiBaseUrl) {
      inputIcloudApiBaseUrl.disabled = provider !== ICLOUD_API_PROVIDER;
    }
    if (inputIcloudApiAdminKey) {
      inputIcloudApiAdminKey.disabled = provider !== ICLOUD_API_PROVIDER;
    }
  }
  
  function updatePanelModeUI() {
    const panelMode = typeof getSelectedPanelMode === 'function'
      ? getSelectedPanelMode()
      : normalizePanelMode(latestState?.panelMode || DEFAULT_PANEL_MODE);
    const exportTarget = getExportTargetForPanelMode(panelMode);
    const useLocalCpaJson = exportTarget === LOCAL_CPA_JSON_PANEL_MODE || panelMode === LOCAL_CPA_JSON_NO_RT_PANEL_MODE;
    const useLocalCpaJsonNoRt = panelMode === LOCAL_CPA_JSON_NO_RT_PANEL_MODE;
    const useCodex2Api = exportTarget === 'codex2api';
    const useSub2Api = false;
    const useCpa = false;
  
    if (selectPanelMode) {
      selectPanelMode.value = exportTarget;
    }
    if (selectAccountAccessStrategy) {
      selectAccountAccessStrategy.value = getAccountAccessStrategyUiValueForState(latestState);
      selectAccountAccessStrategy.disabled = useCodex2Api;
      selectAccountAccessStrategy.title = useCodex2Api ? 'Codex2API 仅支持 OAuth' : '';
    }
    setElementVisible(rowAccountAccessStrategy, false);
    setElementVisible(rowLocalCpaJsonPluginDir, useLocalCpaJson);
    setElementVisible(rowLocalCpaJsonAdvancedToggle, useLocalCpaJson);
    setElementVisible(rowLocalCpaJsonRelativeAuthDir, useLocalCpaJson && localCpaJsonAuthDirExpanded);
    setElementVisible(rowVpsUrl, useCpa);
    setElementVisible(rowVpsPassword, useCpa);
    setElementVisible(rowLocalCpaStep9Mode, useCpa);
    setElementVisible(rowSub2ApiUrl, useSub2Api);
    setElementVisible(rowSub2ApiEmail, useSub2Api);
    setElementVisible(rowSub2ApiPassword, useSub2Api);
    setElementVisible(rowSub2ApiGroup, useSub2Api);
    setElementVisible(rowSub2ApiAccountPriority, useSub2Api);
    setElementVisible(rowSub2ApiDefaultProxy, useSub2Api);
    setElementVisible(rowCodex2ApiUrl, useCodex2Api);
    setElementVisible(rowCodex2ApiAdminKey, useCodex2Api);
  
    const platformButton = document.querySelector('.step-btn[data-step-key="platform-verify"]');
    if (platformButton) {
      platformButton.textContent = useLocalCpaJson
        ? (useLocalCpaJsonNoRt ? '本地CPA JSON 无RT 导出' : '本地CPA JSON 有RT 导出')
        : (useCodex2Api ? 'Codex2API 回调验证' : 'CPA 回调验证');
    }
  }
  
  async function initializeReleaseInfo() {
    try {
      const manifest = chrome.runtime.getManifest?.() || {};
      const versionLabel = manifest.version_name || (manifest.version ? `CDK Redeem Only V${manifest.version}` : 'GitHub');
      if (extensionUpdateStatus) {
        extensionUpdateStatus.textContent = versionLabel;
        extensionUpdateStatus.classList.add('is-version-label');
      }
      if (extensionVersionMeta) {
        extensionVersionMeta.hidden = true;
        extensionVersionMeta.textContent = '';
      }
      if (btnReleaseLog) {
        btnReleaseLog.onclick = () => {
          chrome.tabs?.create?.({ url: `${GUIDE_REPOSITORY_URL}/releases`, active: true }).catch(() => null);
        };
      }
    } catch (error) {
      console.warn('Failed to initialize release info:', error?.message || error);
    }
  }
  
  async function refreshContributionContentHint() {
    if (contributionUpdateLayer) {
      contributionUpdateLayer.hidden = true;
    }
    if (contributionUpdateHint) {
      contributionUpdateHint.hidden = true;
    }
    return null;
  }
  
  function renderContributionMode() {
    if (contributionModePanel) {
      contributionModePanel.hidden = !Boolean(latestState?.contributionMode);
    }
    if (contributionModeBadge) {
      contributionModeBadge.hidden = !Boolean(latestState?.contributionMode);
    }
  }
  
  function resetIcloudManager() { }
  function resetLuckmailManager() { }
  function renderHotmailAccounts() { }
  function renderMail2925Accounts() { }
  function initHotmailListExpandedState() { }
  function initMail2925ListExpandedState() { }
  function queueLuckmailPurchaseRefresh() { }
  function queueIcloudAliasRefresh() { }
  function positionContributionUpdateHint() { }
  
  async function copyTextToClipboard(text) {
    if (sidepanelUiHelpers?.copyTextToClipboard) {
      return sidepanelUiHelpers.copyTextToClipboard(text);
    }
    const value = String(text || '').trim();
    if (!value) {
      throw new Error('没有可复制的内容。');
    }
    if (!navigator.clipboard?.writeText) {
      throw new Error('当前环境不支持剪贴板复制。');
    }
    await navigator.clipboard.writeText(value);
  }
  
  customEmailPoolManager = null;
  
  function getCustomEmailPoolManager() {
    if (customEmailPoolManager) {
      return customEmailPoolManager;
    }
    customEmailPoolManager = window.SidepanelCustomEmailPoolManager?.createCustomEmailPoolManager?.({
      dom: {
        btnCustomEmailPoolRefresh,
        btnCustomEmailPoolClearUsed,
        btnCustomEmailPoolDeleteAll,
        inputCustomEmailPoolImport,
        btnCustomEmailPoolImport,
        customEmailPoolSummary,
        inputCustomEmailPoolSearch,
        selectCustomEmailPoolFilter,
        checkboxCustomEmailPoolSelectAll,
        customEmailPoolSelectionSummary,
        btnCustomEmailPoolBulkUsed,
        btnCustomEmailPoolBulkUnused,
        btnCustomEmailPoolBulkEnable,
        btnCustomEmailPoolBulkDisable,
        btnCustomEmailPoolBulkDelete,
        customEmailPoolList,
      },
      helpers: {
        copyTextToClipboard,
        escapeHtml,
        openConfirmModal,
        showToast,
      },
      state: {
        getEntries: () => getNormalizedCustomEmailPoolEntriesState(),
        setEntries: (entries) => {
          setCustomEmailPoolEntriesState(entries);
        },
        getCredentialForEmail: (email) => {
          const normalizedEmail = String(email || '').trim().toLowerCase();
          const items = Array.isArray(latestState?.upiCredentialMembershipCheckResults?.items)
            ? latestState.upiCredentialMembershipCheckResults.items
            : [];
          return items.find((item) => String(item?.email || '').trim().toLowerCase() === normalizedEmail) || {};
        },
        getCurrentEmail: () => String(inputEmail?.value || latestState?.email || '').trim().toLowerCase(),
        isVisible: () => Boolean(rowCustomEmailPool) && rowCustomEmailPool.style.display !== 'none',
      },
      actions: {
        persistEntries: async () => {
          syncRunCountFromConfiguredEmailPool();
          updateMailProviderUI();
          await persistCustomEmailPoolSettings();
        },
        setRuntimeEmail: async (email) => {
          const selectedEmail = String(email || '').trim().toLowerCase();
          await setRuntimeEmailState(selectedEmail);
          syncLatestState({ email: selectedEmail, selectedCustomEmailPoolEmail: selectedEmail });
          if (inputEmail) {
            inputEmail.value = selectedEmail || '';
          }
          await persistCustomEmailPoolSettings({
            email: selectedEmail,
            selectedCustomEmailPoolEmail: selectedEmail,
          });
        },
        checkTrialEligibility: async (entry = {}) => {
          const email = String(entry.email || '').trim().toLowerCase();
          const accessToken = String(entry.accessToken || entry.token || entry.access_token || entry.upiRedeemAccessToken || '').trim();
          const response = await chrome.runtime.sendMessage({
            type: 'CHECK_UPI_CREDENTIAL_MEMBERSHIP_TRIAL_ELIGIBILITY',
            source: 'sidepanel',
            payload: {
              source: 'custom-email-pool-trial-eligibility-check',
              emailPoolOnly: true,
              updateCustomEmailPoolEntry: true,
              credentials: [{
                ...entry,
                email,
                accessToken,
                token: accessToken,
                verificationUrl: String(entry.verificationUrl || '').trim(),
                checkedAt: String(entry.accessTokenUpdatedAt || entry.trialEligibilityCheckedAt || '').trim(),
              }],
              settings: collectSettingsPayload(),
            },
          });
          if (response?.error) {
            throw new Error(response.error);
          }
          if (response?.results) {
            syncLatestState({
              upiCredentialMembershipCheckResults: response.results,
            });
          }
          return response || {};
        },
      },
      constants: {
        copyIcon: COPY_ICON,
      },
    }) || null;
    return customEmailPoolManager;
  }
  
  function queueCustomEmailPoolRefresh() {
    getCustomEmailPoolManager()?.queueCustomEmailPoolRefresh?.();
  }
  
  async function refreshCustomEmailPoolEntries(options = {}) {
    await getCustomEmailPoolManager()?.refreshCustomEmailPoolEntries?.(options);
  }
  
  function renderCustomEmailPoolEntries(entries = getNormalizedCustomEmailPoolEntriesState()) {
    getCustomEmailPoolManager()?.renderCustomEmailPoolEntries?.(entries);
  }
  
  function resetCustomEmailPoolManager() {
    getCustomEmailPoolManager()?.reset?.();
  }
  
  function bindCustomEmailPoolEvents() {
    getCustomEmailPoolManager()?.bindEvents?.();
  }
  
  function validateRemovedContactContactConfig() {
    return { valid: true, message: '' };
  }
  
  cdkPoolManager = null;
  
  function getCdkPoolManager() {
    if (cdkPoolManager) {
      return cdkPoolManager;
    }
    cdkPoolManager = window.SidepanelCdkPoolManager?.createCdkPoolManager?.({
      dom: {
        btnUpiRedeemCdkeyStatusRefresh,
        btnImportCdkPool,
        btnDeleteAllCdkPool,
        btnImportIdealCdkPool,
        btnDeleteAllIdealCdkPool,
        inputUpiRedeemCdkeyPool,
        inputIdealRedeemCdkeyPool,
      },
      helpers: {
        showToast,
        importCdkPoolFromTextarea,
        deleteAllUpiRedeemCdkeys,
        refreshAllUpiRedeemCdkeyStatuses,
      },
    }) || null;
    return cdkPoolManager;
  }
  
  function bindCdkPoolEvents() {
    getCdkPoolManager()?.bindEvents?.();
  }
  
  async function maybeTakeoverAutoRun(actionLabel) {
    if (!isAutoRunPausedPhase()) {
      return true;
    }
    const confirmed = await openConfirmModal({
      title: '接管自动',
      message: `当前自动流程已暂停。若继续${actionLabel}，将停止自动流程并切换为手动控制。是否继续？`,
      confirmLabel: '确认接管',
      confirmVariant: 'btn-primary',
    });
    if (!confirmed) {
      return false;
    }
    const response = await chrome.runtime.sendMessage({ type: 'TAKEOVER_AUTO_RUN', source: 'sidepanel', payload: {} });
    if (response?.error) {
      throw new Error(response.error);
    }
    return true;
  }
  
  async function handleSkipNode(nodeId) {
    const normalizedNodeId = String(nodeId || '').trim();
    if (!normalizedNodeId) {
      throw new Error('缺少要跳过的节点。');
    }
    if (!(await maybeTakeoverAutoRun(`跳过节点 ${normalizedNodeId}`))) {
      return;
    }
    await persistCurrentSettingsForAction();
    const response = await sendSidepanelMessage({
      type: 'SKIP_NODE',
      source: 'sidepanel',
      payload: {
        nodeId: normalizedNodeId,
        step: getStepIdByNodeIdForCurrentMode(normalizedNodeId),
      },
    });
    if (response?.error) {
      throw new Error(response.error);
    }
    showToast(`节点 ${normalizedNodeId} 已跳过`, 'success', 2200);
  }
  
  async function executeNodeFromSidepanel(nodeId, step) {
    const normalizedNodeId = String(nodeId || '').trim();
    if (!normalizedNodeId) {
      throw new Error('缺少要执行的节点。');
    }
    if (!(await maybeTakeoverAutoRun(`执行节点 ${normalizedNodeId}`))) {
      return;
    }
    await persistCurrentSettingsForAction();
    const response = await sendSidepanelMessage({
      type: 'EXECUTE_NODE',
      source: 'sidepanel',
      payload: {
        nodeId: normalizedNodeId,
        step: Number(step) || getStepIdByNodeIdForCurrentMode(normalizedNodeId),
        email: inputEmail?.value?.trim() || undefined,
      },
    });
    if (response?.error) {
      throw new Error(response.error);
    }
  }
  
  accountRunHistoryRefreshTimer = null;
  
  function scheduleAccountRunHistoryRefresh(delayMs = 150) {
    if (accountRunHistoryRefreshTimer) {
      clearTimeout(accountRunHistoryRefreshTimer);
    }
    accountRunHistoryRefreshTimer = setTimeout(() => {
      accountRunHistoryRefreshTimer = null;
      chrome.runtime.sendMessage({ type: 'GET_STATE', source: 'sidepanel' }).then(state => {
        syncLatestState(state);
        syncAutoRunState(state);
        updateStatusDisplay(latestState);
        updateButtonStates();
      }).catch(() => { });
    }, Math.max(0, Number(delayMs) || 0));
  }
  
  function normalizeOperationDelayEnabled(value) {
    return typeof value === 'boolean' ? value : false;
  }
  
  function appendOperationDelayLog(enabled, level = 'info', message = '') {
    appendLog({
      timestamp: Date.now(),
      level,
      message: message || (enabled
        ? '操作间延迟已开启：页面输入、选择、点击、提交、继续、授权后等待 2 秒。'
        : '操作间延迟已关闭：页面操作将连续执行。'),
    });
  }
  
  function applyOperationDelayState(state = latestState, options = {}) {
    const enabled = options.restoreFailed ? false : normalizeOperationDelayEnabled(state?.operationDelayEnabled);
    lastConfirmedOperationDelayEnabled = enabled;
    if (inputOperationDelayEnabled) inputOperationDelayEnabled.checked = enabled;
    if (typeof syncLatestState === 'function') {
      syncLatestState({ operationDelayEnabled: enabled });
    }
    if (options.restoreFailed) {
      appendOperationDelayLog(false, 'warn', '操作间延迟设置读取失败，已回退为默认关闭。');
    }
  }
  
  async function persistOperationDelayToggle() {
    const nextEnabled = normalizeOperationDelayEnabled(inputOperationDelayEnabled?.checked);
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'SAVE_SETTING',
        source: 'sidepanel',
        payload: { operationDelayEnabled: nextEnabled },
      });
      if (response?.error) throw new Error(response.error);
      const confirmed = normalizeOperationDelayEnabled(response?.state?.operationDelayEnabled ?? nextEnabled);
      lastConfirmedOperationDelayEnabled = confirmed;
      if (inputOperationDelayEnabled) inputOperationDelayEnabled.checked = confirmed;
      syncLatestState({ operationDelayEnabled: confirmed });
      appendOperationDelayLog(confirmed);
    } catch (error) {
      if (inputOperationDelayEnabled) inputOperationDelayEnabled.checked = lastConfirmedOperationDelayEnabled;
      appendOperationDelayLog(lastConfirmedOperationDelayEnabled, 'error', `操作间延迟设置保存失败，已恢复为上一次确认的状态：${error.message}`);
      throw error;
    }
  }
  
  function normalizePlusPaymentMethod(value = '') {
    const normalized = String(value || '').trim().toLowerCase();
    if (normalized === PLUS_PAYMENT_METHOD_UPI || normalized === 'pix') {
      return PLUS_PAYMENT_METHOD_UPI;
    }
    return PLUS_PAYMENT_METHOD_UPI;
  }
  
  const cdkPoolStateHelpers = window.SidepanelCdkPoolState.createCdkPoolStateHelpers();
  const {
    normalizeUpiRedeemCdkeyPoolTextValue,
    parseUpiRedeemCdkeyPoolTextValue,
    normalizeUpiRedeemSubscriptionActiveValue,
    normalizeUpiRedeemSubscriptionPlanType,
    normalizeUpiRedeemJobCapabilityValue,
    normalizeUpiRedeemCdkeyUsageValue,
    normalizeRedeemChannel,
    getRedeemChannelLabel,
    getStoredCdkPoolText,
    getStoredCdkUsage,
    buildCdkPoolStatePatch,
    getUpiRedeemRemoteStatusLabel,
    isUpiRedeemDuplicateCdkeyMessage,
    normalizeUpiRedeemRemoteStatusValue,
    isRetryableUpiRedeemRemoteStatus,
    isUpiRedeemRemoteActiveStatus,
    isUpiRedeemCdkeySelectableForRedeem,
    getUpiRedeemRemoteStatusClass,
    canCancelUpiRedeemCdkeyJob,
    canRetryUpiRedeemCdkeyJob,
    getUpiRedeemSubscriptionPlanLabel,
  } = cdkPoolStateHelpers;
  
  const upiRedeemCdkController = window.SidepanelUpiRedeemCdkController.createUpiRedeemCdkController({
    cdkPoolStateHelpers,
    dom: {
      document,
      window,
      rowUpiRedeemCdkeyPool,
      inputUpiRedeemCdkeyPool,
      btnImportCdkPool,
      btnDeleteAllCdkPool,
      upiRedeemCdkeyPoolSummary,
      inputIdealRedeemCdkeyPool,
      btnImportIdealCdkPool,
      btnDeleteAllIdealCdkPool,
      idealRedeemCdkeyPoolSummary,
      inputUpiRedeemExternalApiKey,
      inputUpiRedeemClientId,
      inputPlusModeEnabled,
      inputUpiRedeemFailedAccountRetryLimit,
      btnUpiRedeemCdkeyStatusRefresh,
      upiRedeemCdkeyStatusList,
      idealRedeemCdkeyStatusList,
    },
    state: {
      getLatestState: () => latestState,
      syncLatestState,
      getAccountRecordsManager: () => accountRecordsManager,
    },
    helpers: {
      showToast,
      openConfirmModal,
      renderAccountRecords,
      markSettingsDirty,
      saveSettings,
      normalizeUpiRedeemFailedAccountRetryLimit,
      getSelectedPlusPaymentMethod: () => getSelectedPlusPaymentMethod(),
      isAutoRunLockedPhase,
      isAutoRunPausedPhase,
      isAutoRunScheduledPhase,
    },
    constants: {
      PLUS_PAYMENT_METHOD_UPI,
      UPI_REDEEM_CDKEY_STATUS_AUTO_REFRESH_MS: 5000,
    },
    runtime: {
      sendMessage: (message) => chrome.runtime.sendMessage(message),
    },
  });
  const {
    shouldPreserveFocusedUpiRedeemCdkeyPoolEdit,
    importCdkPoolFromTextarea,
    deleteAllUpiRedeemCdkeys,
    refreshUpiRedeemCdkeyStatuses,
    refreshAllUpiRedeemCdkeyStatuses,
    scheduleUpiRedeemCdkeyStatusAutoRefresh,
    clearUpiRedeemCdkeyStatusAutoRefresh,
    updateUpiRedeemCdkeyPoolSummary,
    updateAllUpiRedeemCdkeyPoolSummaries,
  } = upiRedeemCdkController;
  
  function getSelectedPlusPaymentMethod(state = latestState) {
    const selected = typeof selectPlusPaymentMethod !== 'undefined' && selectPlusPaymentMethod
      ? selectPlusPaymentMethod.value
      : state?.plusPaymentMethod;
    return normalizePlusPaymentMethod(selected || DEFAULT_PLUS_PAYMENT_METHOD);
  }
  
  function normalizeUpiRedeemAfterMode(value = '') {
    return String(value || '').trim().toLowerCase() === 'continue' ? 'continue' : 'stop';
  }
  
  function syncUpiRedeemAfterModeControls(stopAfterRedeem = true) {
    const stop = stopAfterRedeem !== false;
    if (typeof selectUpiRedeemAfterMode !== 'undefined' && selectUpiRedeemAfterMode) {
      selectUpiRedeemAfterMode.value = stop ? 'stop' : 'continue';
    }
    if (typeof inputUpiRedeemStopAfterRedeem !== 'undefined' && inputUpiRedeemStopAfterRedeem) {
      inputUpiRedeemStopAfterRedeem.checked = stop;
    }
    return stop;
  }
  
  function getSelectedUpiRedeemStopAfterRedeem(state = latestState) {
    if (typeof selectUpiRedeemAfterMode !== 'undefined' && selectUpiRedeemAfterMode) {
      return normalizeUpiRedeemAfterMode(selectUpiRedeemAfterMode.value) !== 'continue';
    }
    if (typeof inputUpiRedeemStopAfterRedeem !== 'undefined' && inputUpiRedeemStopAfterRedeem) {
      return Boolean(inputUpiRedeemStopAfterRedeem.checked);
    }
    return (state?.upiRedeemContinueAfterRedeem ?? state?.pixRedeemContinueAfterRedeem) === true ? false : true;
  }
  
  function getSelectedTotpMfaAfterProfileEnabled(state = latestState) {
    if (typeof inputTotpMfaAfterProfileEnabled !== 'undefined' && inputTotpMfaAfterProfileEnabled) {
      return Boolean(inputTotpMfaAfterProfileEnabled.checked);
    }
    return state?.totpMfaAfterProfileEnabled !== false;
  }
  
  function normalizeRegistrationFreeRoute(value = '') {
    const normalized = String(value || '').trim().toLowerCase();
    if (normalized === REGISTRATION_FREE_ROUTE_NO_2FA) {
      return REGISTRATION_FREE_ROUTE_NO_2FA;
    }
    if (normalized === REGISTRATION_FREE_ROUTE_PASSKEY) {
      return REGISTRATION_FREE_ROUTE_PASSKEY;
    }
    return REGISTRATION_FREE_ROUTE_FULL_2FA;
  }
  
  function getSelectedRegistrationFreeRoute(state = latestState) {
    const selected = typeof selectRegistrationFreeRoute !== 'undefined' && selectRegistrationFreeRoute
      ? selectRegistrationFreeRoute.value
      : state?.registrationFreeRoute;
    return normalizeRegistrationFreeRoute(selected || DEFAULT_REGISTRATION_FREE_ROUTE);
  }
  
  function normalizeSetGptPasswordVerificationWaitSeconds(value, fallback = DEFAULT_SET_GPT_PASSWORD_VERIFICATION_WAIT_SECONDS) {
    const rawValue = String(value ?? '').trim();
    const fallbackNumber = Number.parseInt(String(fallback ?? '').trim(), 10);
    const fallbackValue = Number.isFinite(fallbackNumber)
      ? Math.max(0, Math.min(SET_GPT_PASSWORD_VERIFICATION_WAIT_MAX_SECONDS, fallbackNumber))
      : DEFAULT_SET_GPT_PASSWORD_VERIFICATION_WAIT_SECONDS;
    if (!rawValue) {
      return fallbackValue;
    }
    const numeric = Number.parseInt(rawValue, 10);
    if (!Number.isFinite(numeric)) {
      return fallbackValue;
    }
    return Math.max(0, Math.min(SET_GPT_PASSWORD_VERIFICATION_WAIT_MAX_SECONDS, numeric));
  }
  
  function normalizeUpiRedeemFailedAccountRetryLimit(value, fallback = DEFAULT_UPI_REDEEM_FAILED_ACCOUNT_RETRY_LIMIT) {
    const rawValue = String(value ?? '').trim();
    const fallbackNumber = Number.parseInt(String(fallback ?? '').trim(), 10);
    const fallbackValue = Number.isFinite(fallbackNumber)
      ? Math.max(0, Math.min(UPI_REDEEM_FAILED_ACCOUNT_RETRY_LIMIT_MAX, fallbackNumber))
      : DEFAULT_UPI_REDEEM_FAILED_ACCOUNT_RETRY_LIMIT;
    if (!rawValue) {
      return fallbackValue;
    }
    const numeric = Number.parseInt(rawValue, 10);
    if (!Number.isFinite(numeric)) {
      return fallbackValue;
    }
    return Math.max(0, Math.min(UPI_REDEEM_FAILED_ACCOUNT_RETRY_LIMIT_MAX, numeric));
  }
  
  function normalizeSignupVerificationCodeWaitSeconds(value, fallback = DEFAULT_SIGNUP_VERIFICATION_CODE_WAIT_SECONDS) {
    const rawValue = String(value ?? '').trim();
    const fallbackNumber = Number.parseInt(String(fallback ?? '').trim(), 10);
    const fallbackValue = Number.isFinite(fallbackNumber)
      ? Math.max(0, Math.min(SIGNUP_VERIFICATION_CODE_WAIT_MAX_SECONDS, fallbackNumber))
      : DEFAULT_SIGNUP_VERIFICATION_CODE_WAIT_SECONDS;
    if (!rawValue) {
      return fallbackValue;
    }
    const numeric = Number.parseInt(rawValue, 10);
    if (!Number.isFinite(numeric)) {
      return fallbackValue;
    }
    return Math.max(0, Math.min(SIGNUP_VERIFICATION_CODE_WAIT_MAX_SECONDS, numeric));
  }
  
  function resolveSharedVerificationCodeWaitSeconds(state = latestState) {
    const primaryValue = String(inputSetGptPasswordVerificationWaitSeconds?.value ?? '').trim();
    const secondaryValue = String(inputSignupVerificationCodeWaitSeconds?.value ?? '').trim();
    const fallbackValue = state?.setGptPasswordVerificationWaitSeconds
      ?? state?.signupVerificationCodeWaitSeconds
      ?? DEFAULT_SET_GPT_PASSWORD_VERIFICATION_WAIT_SECONDS;
    return normalizeSetGptPasswordVerificationWaitSeconds(primaryValue || secondaryValue, fallbackValue);
  }
  
  function setSharedVerificationCodeWaitInputs(value, fallback = DEFAULT_SET_GPT_PASSWORD_VERIFICATION_WAIT_SECONDS) {
    const normalizedValue = String(normalizeSetGptPasswordVerificationWaitSeconds(value, fallback));
    if (typeof inputSetGptPasswordVerificationWaitSeconds !== 'undefined' && inputSetGptPasswordVerificationWaitSeconds) {
      inputSetGptPasswordVerificationWaitSeconds.value = normalizedValue;
    }
    if (typeof inputSignupVerificationCodeWaitSeconds !== 'undefined' && inputSignupVerificationCodeWaitSeconds) {
      inputSignupVerificationCodeWaitSeconds.value = normalizedValue;
    }
    return normalizedValue;
  }
  
  function mirrorSharedVerificationCodeWaitInput(sourceInput) {
    if (!sourceInput) {
      return;
    }
    const rawValue = String(sourceInput.value ?? '');
    if (sourceInput !== inputSetGptPasswordVerificationWaitSeconds && inputSetGptPasswordVerificationWaitSeconds) {
      inputSetGptPasswordVerificationWaitSeconds.value = rawValue;
    }
    if (sourceInput !== inputSignupVerificationCodeWaitSeconds && inputSignupVerificationCodeWaitSeconds) {
      inputSignupVerificationCodeWaitSeconds.value = rawValue;
    }
  }
  
  function syncUpiRedeemAfterModeStepDefinitions() {
    syncUpiRedeemAfterModeControls(true);
    const stepDefinitionState = typeof resolveStepDefinitionCapabilityState === 'function'
      ? resolveStepDefinitionCapabilityState({
        ...(latestState || {}),
        plusModeEnabled: Boolean(inputPlusModeEnabled?.checked),
        signupMethod: getSelectedSignupMethod(),
      }, {
        signupMethod: getSelectedSignupMethod(),
      })
      : {
        plusModeEnabled: Boolean(inputPlusModeEnabled?.checked),
        signupMethod: getSelectedSignupMethod(),
      };
    syncStepDefinitionsForMode(stepDefinitionState.plusModeEnabled, {
      render: true,
      plusPaymentMethod: getSelectedPlusPaymentMethod(),
      signupMethod: stepDefinitionState.signupMethod,
      plusAccountAccessStrategy: stepDefinitionState.plusAccountAccessStrategy,
      upiRedeemStopAfterRedeem: true,
      upiRedeemContinueAfterRedeem: false,
      totpMfaAfterProfileEnabled: getSelectedTotpMfaAfterProfileEnabled(latestState),
      registrationFreeRoute: getSelectedRegistrationFreeRoute(latestState),
    });
  }
  
  function syncTotpMfaAfterProfileStepDefinitions() {
    const stepDefinitionState = typeof resolveStepDefinitionCapabilityState === 'function'
      ? resolveStepDefinitionCapabilityState({
        ...(latestState || {}),
        plusModeEnabled: Boolean(inputPlusModeEnabled?.checked),
        signupMethod: getSelectedSignupMethod(),
      }, {
        signupMethod: getSelectedSignupMethod(),
      })
      : {
        plusModeEnabled: Boolean(inputPlusModeEnabled?.checked),
        signupMethod: getSelectedSignupMethod(),
      };
    syncStepDefinitionsForMode(stepDefinitionState.plusModeEnabled, {
      render: true,
      plusPaymentMethod: getSelectedPlusPaymentMethod(),
      signupMethod: stepDefinitionState.signupMethod,
      plusAccountAccessStrategy: stepDefinitionState.plusAccountAccessStrategy,
      upiRedeemStopAfterRedeem: true,
      upiRedeemContinueAfterRedeem: false,
      totpMfaAfterProfileEnabled: getSelectedTotpMfaAfterProfileEnabled(latestState),
      registrationFreeRoute: getSelectedRegistrationFreeRoute(latestState),
    });
  }
  
  
  function setRemovedPaymentWorkerInputValue(input, value = '') {
    if (!input) {
      return;
    }
    if (typeof document !== 'undefined' && document.activeElement === input) {
      return;
    }
    const nextValue = String(value ?? '');
    if (input.value !== nextValue) {
      input.value = nextValue;
    }
  }
  
  function syncLocalChatgptSessionReaderDraftFromState(state = latestState) {
    const normalizedState = normalizeChatgptSessionReaderStateForUi(state || {});
    localChatgptSessionReaderMode = normalizeChatgptSessionReaderModeValue(normalizedState.chatgptSessionReaderMode);
    localChatgptSessionReaderProfiles = normalizeChatgptSessionReaderProfilesValue(
      normalizedState.chatgptSessionReaderProfiles || {},
      normalizedState
    );
    return {
      mode: localChatgptSessionReaderMode,
      profiles: localChatgptSessionReaderProfiles,
    };
  }
  
  function getLocalChatgptSessionReaderProfilesDraft(state = latestState) {
    const usProfile = localChatgptSessionReaderProfiles?.[CHATGPT_SESSION_READER_MODE_US_PP];
    const jpProfile = localChatgptSessionReaderProfiles?.[CHATGPT_SESSION_READER_MODE_JP_PP];
    if (!usProfile || !jpProfile) {
      syncLocalChatgptSessionReaderDraftFromState(state);
    }
    return localChatgptSessionReaderProfiles;
  }
  
  function getSelectedChatgptSessionReaderMode(state = latestState) {
    if (inputChatgptSessionReaderModeUs?.checked) {
      return CHATGPT_SESSION_READER_MODE_US_PP;
    }
    if (inputChatgptSessionReaderModeJp?.checked) {
      return CHATGPT_SESSION_READER_MODE_JP_PP;
    }
    return normalizeChatgptSessionReaderModeValue(state?.chatgptSessionReaderMode);
  }
  
  function buildChatgptSessionReaderProfileFromInputs() {
    return normalizeChatgptSessionReaderProfileValue({
      removedContactVerificationUrl: inputRemovedContactVerificationUrl?.value || '',
      removedContactCardDeclinedRetryEnabled: Boolean(inputRemovedContactCardDeclinedRetryEnabled?.checked),
    });
  }
  
  function getActiveChatgptSessionReaderModeFromState(state = latestState) {
    return normalizeChatgptSessionReaderModeValue(localChatgptSessionReaderMode || state?.chatgptSessionReaderMode);
  }
  
  function syncChatgptSessionReaderProfileForModeIntoLatestState(mode, profile) {
    const normalizedMode = normalizeChatgptSessionReaderModeValue(mode);
    const currentProfiles = getLocalChatgptSessionReaderProfilesDraft(latestState);
    const nextProfiles = {
      ...currentProfiles,
      [normalizedMode]: normalizeChatgptSessionReaderProfileValue(
        profile,
        currentProfiles[normalizedMode]
      ),
    };
    localChatgptSessionReaderProfiles = nextProfiles;
    const activeMode = getActiveChatgptSessionReaderModeFromState(latestState);
    localChatgptSessionReaderMode = activeMode;
    const activeProfile = nextProfiles[activeMode] || currentProfiles[activeMode] || buildDefaultChatgptSessionReaderProfile();
    syncLatestState({
      chatgptSessionReaderMode: activeMode,
      chatgptSessionReaderProfiles: nextProfiles,
      ...buildChatgptSessionReaderLegacyPatchFromProfile(activeProfile),
    });
  }
  
  function syncActiveChatgptSessionReaderProfileIntoLatestState() {
    const activeMode = getActiveChatgptSessionReaderModeFromState(latestState);
    const draftProfile = buildChatgptSessionReaderProfileFromInputs();
    syncChatgptSessionReaderProfileForModeIntoLatestState(activeMode, draftProfile);
  }
  
  function syncActiveChatgptSessionReaderProfilePatch(partialPatch = {}) {
    const currentMode = getActiveChatgptSessionReaderModeFromState(latestState);
    const currentProfiles = getLocalChatgptSessionReaderProfilesDraft(latestState);
    const currentProfile = currentProfiles[currentMode] || buildDefaultChatgptSessionReaderProfile();
    const nextProfile = normalizeChatgptSessionReaderProfileValue({
      ...currentProfile,
      ...(partialPatch && typeof partialPatch === 'object' ? partialPatch : {}),
    }, currentProfile);
    syncChatgptSessionReaderProfileForModeIntoLatestState(currentMode, nextProfile);
  }
  
  function applyChatgptSessionReaderProfileToInputs(state = latestState, options = {}) {
    const normalizedState = normalizeChatgptSessionReaderStateForUi(state || {});
    const currentMode = normalizeChatgptSessionReaderModeValue(
      options.mode !== undefined ? options.mode : normalizedState?.chatgptSessionReaderMode
    );
    const currentProfiles = getLocalChatgptSessionReaderProfilesDraft(normalizedState);
    const profile = currentProfiles[currentMode] || buildDefaultChatgptSessionReaderProfile();
    if (inputChatgptSessionReaderModeUs) {
      inputChatgptSessionReaderModeUs.checked = currentMode === CHATGPT_SESSION_READER_MODE_US_PP;
      inputChatgptSessionReaderModeUs.disabled = Boolean(options.disabled);
    }
    if (inputChatgptSessionReaderModeJp) {
      inputChatgptSessionReaderModeJp.checked = currentMode === CHATGPT_SESSION_READER_MODE_JP_PP;
      inputChatgptSessionReaderModeJp.disabled = Boolean(options.disabled);
    }
    if (inputPlusRemovedContactOauthDelaySeconds) {
      inputPlusRemovedContactOauthDelaySeconds.value = String(
        normalizePlusRemovedContactOauthDelaySeconds(normalizedState?.plusRemovedContactOauthDelaySeconds)
      );
    }
    if (inputChatgptSessionReaderCloudConversionEnabled) {
      inputChatgptSessionReaderCloudConversionEnabled.checked = Boolean(normalizedState?.chatgptSessionReaderCloudConversionEnabled);
    }
    if (inputChatgptSessionReaderCloudConversionApiUrl) {
      inputChatgptSessionReaderCloudConversionApiUrl.value = normalizeChatgptSessionReaderCloudConversionApiUrlValue(normalizedState?.chatgptSessionReaderCloudConversionApiUrl || '');
    }
    if (inputChatgptSessionReaderCloudConversionApiKey) {
      inputChatgptSessionReaderCloudConversionApiKey.value = normalizeChatgptSessionReaderCloudConversionApiKeyValue(normalizedState?.chatgptSessionReaderCloudConversionApiKey || '');
    }
    if (inputChatgptSessionReaderConversionProxy) {
      inputChatgptSessionReaderConversionProxy.value = normalizeChatgptSessionReaderConversionProxyUrlValue(normalizedState?.chatgptSessionReaderConversionProxyUrl || '');
    }
    if (inputRemovedContactVerificationUrl) {
      inputRemovedContactVerificationUrl.value = normalizeRemovedContactVerificationUrlValue(profile.removedContactVerificationUrl || '');
    }
    if (inputRemovedContactFirstDirectResendEnabled) {
      inputRemovedContactFirstDirectResendEnabled.checked = Boolean(normalizedState?.removedContactFirstDirectResendEnabled);
    }
    if (inputRemovedContactCardDeclinedRetryEnabled) {
      inputRemovedContactCardDeclinedRetryEnabled.checked = Boolean(profile.removedContactCardDeclinedRetryEnabled);
    }
    if (inputRemovedContactFirstResendWaitSeconds) {
      inputRemovedContactFirstResendWaitSeconds.value = String(
        normalizeRemovedContactResendWaitSeconds(normalizedState?.removedContactFirstResendWaitSeconds, 20)
      );
    }
    if (inputRemovedContactSubsequentResendWaitSeconds) {
      inputRemovedContactSubsequentResendWaitSeconds.value = String(
        normalizeRemovedContactResendWaitSeconds(normalizedState?.removedContactSubsequentResendWaitSeconds, 25)
      );
    }
    if (inputRemovedContactVerificationPollAttempts) {
      inputRemovedContactVerificationPollAttempts.value = String(
        normalizeRemovedContactVerificationPollAttempts(normalizedState?.removedContactVerificationPollAttempts, 6)
      );
    }
    if (inputRemovedContactVerificationPollIntervalSeconds) {
      inputRemovedContactVerificationPollIntervalSeconds.value = String(
        normalizeRemovedContactVerificationPollIntervalSeconds(normalizedState?.removedContactVerificationPollIntervalSeconds, 5)
      );
    }
    if (inputRemovedContactVerificationResendMaxAttempts) {
      inputRemovedContactVerificationResendMaxAttempts.value = String(
        normalizeRemovedContactVerificationResendMaxAttempts(normalizedState?.removedContactVerificationResendMaxAttempts, 1)
      );
    }
    setChatgptSessionReaderConversionProxyTestResult('未测试');
    if (typeof setRemovedContactManualCodeDisplay === 'function') {
      setRemovedContactManualCodeDisplay('未获取');
    }
    updateChatgptSessionReaderConversionModeUi();
    validateRemovedContactContactConfig();
  }
  
  function updateRemovedPaymentWorkerUi(state = latestState) {
    const normalized = normalizeRemovedPaymentWorkerSettingsValue(state || {});
    const runtimeStatus = String(state?.removedPaymentWorkerJobStatus || '').trim().toLowerCase();
    const currentAttempt = Math.max(0, Number(state?.removedPaymentWorkerCurrentAttempt) || 0);
    const enabled = Boolean(normalized.removedPaymentWorkerEnabled);
    if (removedPaymentWorkerSection) {
      removedPaymentWorkerSection.style.display = '';
    }
    if (inputRemovedPaymentWorkerEnabled) {
      inputRemovedPaymentWorkerEnabled.checked = enabled;
    }
    if (removedPaymentWorkerSettingsShell) {
      removedPaymentWorkerSettingsShell.hidden = !enabled;
    }
    const browserBackend = normalized.removedPaymentWorkerBrowserBackend;
    if (selectRemovedPaymentWorkerBrowserBackend) {
      selectRemovedPaymentWorkerBrowserBackend.value = browserBackend;
    }
    if (rowRemovedPaymentWorkerAdsPowerApiBase) {
      rowRemovedPaymentWorkerAdsPowerApiBase.style.display = '';
    }
    setRemovedPaymentWorkerInputValue(inputRemovedPaymentWorkerAdsPowerApiBase, normalized.removedPaymentWorkerAdsPowerApiBase);
    if (rowRemovedPaymentWorkerAdsPowerApiKey) {
      rowRemovedPaymentWorkerAdsPowerApiKey.style.display = '';
    }
    setRemovedPaymentWorkerInputValue(inputRemovedPaymentWorkerAdsPowerApiKey, normalized.removedPaymentWorkerAdsPowerApiKey);
    if (rowRemovedPaymentWorkerRoxyBrowserApiBase) {
      rowRemovedPaymentWorkerRoxyBrowserApiBase.style.display = '';
    }
    setRemovedPaymentWorkerInputValue(inputRemovedPaymentWorkerRoxyBrowserApiBase, normalized.removedPaymentWorkerRoxyBrowserApiBase);
    if (rowRemovedPaymentWorkerRoxyBrowserApiKey) {
      rowRemovedPaymentWorkerRoxyBrowserApiKey.style.display = '';
    }
    setRemovedPaymentWorkerInputValue(inputRemovedPaymentWorkerRoxyBrowserApiKey, normalized.removedPaymentWorkerRoxyBrowserApiKey);
    if (rowRemovedPaymentWorkerAdsPowerProfileId) {
      rowRemovedPaymentWorkerAdsPowerProfileId.style.display = '';
    }
    setRemovedPaymentWorkerInputValue(inputRemovedPaymentWorkerAdsPowerProfileId, normalized.removedPaymentWorkerAdsPowerProfileId);
    if (rowRemovedPaymentWorkerRoxyBrowserProfileId) {
      rowRemovedPaymentWorkerRoxyBrowserProfileId.style.display = '';
    }
    setRemovedPaymentWorkerInputValue(inputRemovedPaymentWorkerRoxyBrowserProfileId, normalized.removedPaymentWorkerRoxyBrowserProfileId);
    if (inputRemovedPaymentWorkerStripePublishableKey) {
      inputRemovedPaymentWorkerStripePublishableKey.value = normalized.removedPaymentWorkerStripePublishableKey;
    }
    if (inputRemovedPaymentWorkerDeviceId) {
      inputRemovedPaymentWorkerDeviceId.value = normalized.removedPaymentWorkerDeviceId;
    }
    if (inputRemovedPaymentWorkerUserAgent) {
      inputRemovedPaymentWorkerUserAgent.value = normalized.removedPaymentWorkerUserAgent;
    }
    if (inputRemovedPaymentWorkerMaxAttempts) {
      inputRemovedPaymentWorkerMaxAttempts.value = String(normalized.removedPaymentWorkerMaxAttempts);
    }
    if (selectRemovedPaymentWorkerPaymentLocale) {
      selectRemovedPaymentWorkerPaymentLocale.value = normalized.removedPaymentWorkerPaymentLocale;
    }
    if (inputRemovedPaymentWorkerCheckoutRebuildMaxAttempts) {
      inputRemovedPaymentWorkerCheckoutRebuildMaxAttempts.value = String(normalized.removedPaymentWorkerCheckoutRebuildMaxAttempts);
    }
    if (inputRemovedPaymentWorkerDefaultProxy) {
      inputRemovedPaymentWorkerDefaultProxy.value = normalized.removedPaymentWorkerDefaultProxy;
    }
    if (inputRemovedPaymentWorkerProviderProxy) {
      inputRemovedPaymentWorkerProviderProxy.value = normalized.removedPaymentWorkerProviderProxy;
    }
    if (rowRemovedPaymentWorkerProviderProxy) {
      rowRemovedPaymentWorkerProviderProxy.hidden = false;
    }
    if (displayRemovedPaymentWorkerStatus) {
      displayRemovedPaymentWorkerStatus.textContent = enabled ? '已启用' : '默认关闭';
    }
    if (displayRemovedPaymentWorkerRuntime) {
      if (runtimeStatus === 'pending') {
        displayRemovedPaymentWorkerRuntime.textContent = `准备中：第 ${currentAttempt} / ${normalized.removedPaymentWorkerMaxAttempts} 次`;
      } else if (runtimeStatus === 'running') {
        displayRemovedPaymentWorkerRuntime.textContent = `运行中：第 ${currentAttempt} / ${normalized.removedPaymentWorkerMaxAttempts} 次`;
      } else if (runtimeStatus === 'paused') {
        displayRemovedPaymentWorkerRuntime.textContent = `已暂停：第 ${currentAttempt} / ${normalized.removedPaymentWorkerMaxAttempts} 次`;
      } else if (runtimeStatus === 'succeeded') {
        displayRemovedPaymentWorkerRuntime.textContent = `已成功：第 ${currentAttempt} 次`;
      } else if (runtimeStatus === 'failed') {
        displayRemovedPaymentWorkerRuntime.textContent = `已失败：共 ${currentAttempt} 次`;
      } else {
        displayRemovedPaymentWorkerRuntime.textContent = '未运行';
      }
    }
    if (btnRemovedPaymentWorkerPause) {
      btnRemovedPaymentWorkerPause.disabled = !(enabled && (runtimeStatus === 'running' || runtimeStatus === 'pending'));
    }
    if (btnRemovedPaymentWorkerResume) {
      btnRemovedPaymentWorkerResume.disabled = !(enabled && runtimeStatus === 'paused');
    }
  }
  
  function buildRemovedPaymentWorkerSettingsPayloadFromInputs() {
    const browserBackend = normalizeRemovedPaymentWorkerBrowserBackendValue(selectRemovedPaymentWorkerBrowserBackend?.value || 'local');
    return {
      removedPaymentWorkerEnabled: Boolean(inputRemovedPaymentWorkerEnabled?.checked),
      removedPaymentWorkerBrowserBackend: browserBackend,
      removedPaymentWorkerAdsPowerApiBase: normalizeRemovedPaymentWorkerAdsPowerApiBaseValue(inputRemovedPaymentWorkerAdsPowerApiBase?.value || ''),
      removedPaymentWorkerAdsPowerApiKey: String(inputRemovedPaymentWorkerAdsPowerApiKey?.value || '').trim(),
      removedPaymentWorkerAdsPowerProfileId: String(inputRemovedPaymentWorkerAdsPowerProfileId?.value || '').trim(),
      removedPaymentWorkerRoxyBrowserApiBase: normalizeRemovedPaymentWorkerRoxyBrowserApiBaseValue(inputRemovedPaymentWorkerRoxyBrowserApiBase?.value || ''),
      removedPaymentWorkerRoxyBrowserApiKey: String(inputRemovedPaymentWorkerRoxyBrowserApiKey?.value || '').trim(),
      removedPaymentWorkerRoxyBrowserProfileId: String(inputRemovedPaymentWorkerRoxyBrowserProfileId?.value || '').trim(),
      removedPaymentWorkerStripePublishableKey: String(inputRemovedPaymentWorkerStripePublishableKey?.value || '').trim(),
      removedPaymentWorkerDeviceId: String(inputRemovedPaymentWorkerDeviceId?.value || '').trim(),
      removedPaymentWorkerUserAgent: String(inputRemovedPaymentWorkerUserAgent?.value || '').trim(),
      removedPaymentWorkerMaxAttempts: normalizeRemovedPaymentWorkerMaxAttemptsValue(inputRemovedPaymentWorkerMaxAttempts?.value, REMOVED_PAYMENT_WORKER_DEFAULT_MAX_ATTEMPTS),
      removedPaymentWorkerPaymentLocale: normalizeRemovedPaymentWorkerPaymentLocaleValue(selectRemovedPaymentWorkerPaymentLocale?.value || 'en'),
      removedPaymentWorkerCheckoutRebuildMaxAttempts: normalizeRemovedPaymentWorkerCheckoutRebuildMaxAttemptsValue(
        inputRemovedPaymentWorkerCheckoutRebuildMaxAttempts?.value,
        3,
      ),
      removedPaymentWorkerDefaultProxy: String(inputRemovedPaymentWorkerDefaultProxy?.value || '').trim(),
      removedPaymentWorkerProviderProxy: String(inputRemovedPaymentWorkerProviderProxy?.value || '').trim(),
    };
  }
  
  function resetRemovedPaymentWorkerInputsToDefaults() {
    const defaults = buildDefaultRemovedPaymentWorkerSettings();
    if (inputRemovedPaymentWorkerEnabled) {
      inputRemovedPaymentWorkerEnabled.checked = defaults.removedPaymentWorkerEnabled;
    }
    if (selectRemovedPaymentWorkerBrowserBackend) {
      selectRemovedPaymentWorkerBrowserBackend.value = defaults.removedPaymentWorkerBrowserBackend;
    }
    if (inputRemovedPaymentWorkerAdsPowerApiBase) {
      inputRemovedPaymentWorkerAdsPowerApiBase.value = defaults.removedPaymentWorkerAdsPowerApiBase;
    }
    if (inputRemovedPaymentWorkerAdsPowerApiKey) {
      inputRemovedPaymentWorkerAdsPowerApiKey.value = defaults.removedPaymentWorkerAdsPowerApiKey;
    }
    if (inputRemovedPaymentWorkerAdsPowerProfileId) {
      inputRemovedPaymentWorkerAdsPowerProfileId.value = defaults.removedPaymentWorkerAdsPowerProfileId;
    }
    if (inputRemovedPaymentWorkerRoxyBrowserProfileId) {
      inputRemovedPaymentWorkerRoxyBrowserProfileId.value = defaults.removedPaymentWorkerRoxyBrowserProfileId;
    }
    if (inputRemovedPaymentWorkerRoxyBrowserApiBase) {
      inputRemovedPaymentWorkerRoxyBrowserApiBase.value = defaults.removedPaymentWorkerRoxyBrowserApiBase;
    }
    if (inputRemovedPaymentWorkerRoxyBrowserApiKey) {
      inputRemovedPaymentWorkerRoxyBrowserApiKey.value = defaults.removedPaymentWorkerRoxyBrowserApiKey;
    }
    if (inputRemovedPaymentWorkerStripePublishableKey) {
      inputRemovedPaymentWorkerStripePublishableKey.value = defaults.removedPaymentWorkerStripePublishableKey;
    }
    if (inputRemovedPaymentWorkerDeviceId) {
      inputRemovedPaymentWorkerDeviceId.value = defaults.removedPaymentWorkerDeviceId;
    }
    if (inputRemovedPaymentWorkerUserAgent) {
      inputRemovedPaymentWorkerUserAgent.value = defaults.removedPaymentWorkerUserAgent;
    }
    if (inputRemovedPaymentWorkerMaxAttempts) {
      inputRemovedPaymentWorkerMaxAttempts.value = String(defaults.removedPaymentWorkerMaxAttempts);
    }
    if (selectRemovedPaymentWorkerPaymentLocale) {
      selectRemovedPaymentWorkerPaymentLocale.value = defaults.removedPaymentWorkerPaymentLocale;
    }
    if (inputRemovedPaymentWorkerCheckoutRebuildMaxAttempts) {
      inputRemovedPaymentWorkerCheckoutRebuildMaxAttempts.value = String(defaults.removedPaymentWorkerCheckoutRebuildMaxAttempts);
    }
    if (inputRemovedPaymentWorkerDefaultProxy) {
      inputRemovedPaymentWorkerDefaultProxy.value = defaults.removedPaymentWorkerDefaultProxy;
    }
    if (inputRemovedPaymentWorkerProviderProxy) {
      inputRemovedPaymentWorkerProviderProxy.value = defaults.removedPaymentWorkerProviderProxy;
    }
    updateRemovedPaymentWorkerUi({
      ...latestState,
      ...defaults,
    });
  }
  
  function getUpiInfoHelperAutoModeEnabled(state = latestState) {
    return Boolean(state?.legacyPayHelperAutoModeEnabled);
  }
  
  function readAutoRunStateValue(source, keys, fallback) {
    return autoRunStateModel.readAutoRunStateValue(source, keys, fallback);
  }
  
  function normalizePendingAutoRunStartRunCount(value) {
    return autoRunStateModel.normalizePendingAutoRunStartRunCount(value);
  }
  
  function registerPendingAutoRunStartRunCount(totalRuns) {
    autoRunStateModel.registerPendingAutoRunStartRunCount(totalRuns);
  }
  
  function clearPendingAutoRunStartRunCount() {
    autoRunStateModel.clearPendingAutoRunStartRunCount();
  }
  
  function getPendingAutoRunStartRunCount() {
    return autoRunStateModel.getPendingAutoRunStartRunCount();
  }
  
  function getAutoRunSourceTotalRuns(source = {}) {
    return autoRunStateModel.getAutoRunSourceTotalRuns(source);
  }
  
  function syncAutoRunState(source = {}) {
    currentAutoRun = autoRunStateModel.syncAutoRunState(source);
    return currentAutoRun;
  }
  
  function isContributionButtonLocked() {
    const autoActive = currentAutoRun.autoRunning
      || isAutoRunLockedPhase()
      || isAutoRunPausedPhase()
      || isAutoRunScheduledPhase();
    if (autoActive) {
      return false;
    }
  
    const statuses = getStepStatuses();
    const anyRunning = Object.values(statuses).some((status) => status === 'running');
    return anyRunning;
  }
  
  function isAutoRunLockedPhase() {
    return autoRunStateModel.isAutoRunLockedPhase();
  }
  
  function isAutoRunPausedPhase() {
    return autoRunStateModel.isAutoRunPausedPhase();
  }
  
  function isAutoRunWaitingStepPhase() {
    return autoRunStateModel.isAutoRunWaitingStepPhase();
  }
  
  function isAutoRunScheduledPhase() {
    return autoRunStateModel.isAutoRunScheduledPhase();
  }
  
  function isAutoRunSourceSyncPhase(phase) {
    return autoRunStateModel.isAutoRunSourceSyncPhase(phase);
  }
  
  function shouldSyncRunCountFromAutoRunSource(source = {}) {
    return autoRunStateModel.shouldSyncRunCountFromAutoRunSource(source);
  }
  
  function getAutoRunLabel(payload = currentAutoRun) {
    return autoRunStateModel.getAutoRunLabel(payload);
  }
  
  function normalizeAutoDelayMinutes(value) {
    return autoRunNormalizers.normalizeAutoDelayMinutes(value);
  }
  
  function normalizeAutoRunThreadIntervalMinutes(value) {
    return autoRunNormalizers.normalizeAutoRunThreadIntervalMinutes(value);
  }
  
  function normalizeAutoStepDelaySeconds(value) {
    return autoRunNormalizers.normalizeAutoStepDelaySeconds(value);
  }
  
  function normalizePlusRemovedContactOauthDelaySeconds(value) {
    return autoRunNormalizers.normalizePlusRemovedContactOauthDelaySeconds(value);
  }
  
  function normalizeRemovedContactResendWaitSeconds(value, fallback = 20) {
    return autoRunNormalizers.normalizeRemovedContactResendWaitSeconds(value, fallback);
  }
  
  function normalizeRemovedContactVerificationResendMaxAttempts(value, fallback = 1) {
    return autoRunNormalizers.normalizeRemovedContactVerificationResendMaxAttempts(value, fallback);
  }
  
  function normalizeRemovedContactVerificationPollAttempts(value, fallback = 6) {
    return autoRunNormalizers.normalizeRemovedContactVerificationPollAttempts(value, fallback);
  }
  
  function normalizeRemovedContactVerificationPollIntervalSeconds(value, fallback = 5) {
    return autoRunNormalizers.normalizeRemovedContactVerificationPollIntervalSeconds(value, fallback);
  }
  
  function normalizeChatgptSessionReaderConversionProxyUrlValue(value = '') {
    const rawValue = String(value || '').trim();
    if (!rawValue) {
      return '';
    }
    try {
      const parsed = new URL(rawValue);
      const protocol = String(parsed.protocol || '').replace(/:$/g, '').trim().toLowerCase();
      if (!['http', 'https', 'socks4', 'socks5', 'socks5h'].includes(protocol)) {
        return rawValue;
      }
      const host = String(parsed.hostname || '').trim();
      const port = String(parsed.port || '').trim();
      if (!host || !port) {
        return rawValue;
      }
      const username = parsed.username ? decodeURIComponent(parsed.username) : '';
      const password = parsed.password ? decodeURIComponent(parsed.password) : '';
      const auth = username || password
        ? `${encodeURIComponent(username)}${parsed.password || password ? `:${encodeURIComponent(password)}` : ''}@`
        : '';
      return `${protocol}://${auth}${host}:${port}`;
    } catch {
      return rawValue;
    }
  }
  
  function normalizeChatgptSessionReaderCloudConversionApiUrlValue(value = '') {
    const rawValue = String(value || '').trim();
    if (!rawValue) {
      return '';
    }
    try {
      const parsed = new URL(rawValue);
      parsed.hash = '';
      return parsed.toString();
    } catch {
      return rawValue;
    }
  }
  
  function normalizeChatgptSessionReaderCloudConversionApiKeyValue(value = '') {
    return String(value || '').trim();
  }
  
  function normalizeRemovedContactVerificationUrlValue(value = '') {
    const rawValue = String(value || '').trim();
    if (!rawValue) {
      return '';
    }
    try {
      const parsed = new URL(rawValue);
      parsed.searchParams.delete('t');
      return parsed.toString();
    } catch {
      return rawValue
        .replace(/([?&])t=\d+(?=(&|$))/i, '$1')
        .replace(/[?&]$/g, '');
    }
  }
  
  function normalizeOutlookAliasMaxPerAccount(value) {
    const rawValue = String(value ?? '').trim();
    if (!rawValue) {
      return 5;
    }
    const numeric = Number(rawValue);
    if (!Number.isFinite(numeric)) {
      return 5;
    }
    return Math.min(50, Math.max(1, Math.floor(numeric)));
  }
  
  function normalizeHotmailAliasEnabledValue(value) {
    return Boolean(value);
  }
  
  function normalizeSupportedMailProvider(value = '') {
    const normalized = String(value || '').trim().toLowerCase();
    if (normalized === ICLOUD_PROVIDER || normalized === ICLOUD_API_PROVIDER) {
      return normalized;
    }
    if (normalized === CLOUDFLARE_TEMP_EMAIL_PROVIDER) {
      return CLOUDFLARE_TEMP_EMAIL_PROVIDER;
    }
    if (normalized === CLOUD_MAIL_PROVIDER) {
      return CLOUD_MAIL_PROVIDER;
    }
    if (normalized === FREEMAIL_PROVIDER) {
      return FREEMAIL_PROVIDER;
    }
    if (normalized === MOEMAIL_PROVIDER) {
      return MOEMAIL_PROVIDER;
    }
    if (normalized === YYDSMAIL_PROVIDER) {
      return YYDSMAIL_PROVIDER;
    }
    if (normalized === OUTLOOK_EMAIL_PLUS_PROVIDER) {
      return OUTLOOK_EMAIL_PLUS_PROVIDER;
    }
    return HOTMAIL_PROVIDER;
  }
  
  function normalizeOutlookEmailPlusBaseUrlValue(value = '') {
    const raw = String(value || '').trim();
    if (!raw) return '';
    const candidate = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(raw) ? raw : `https://${raw}`;
    try {
      const parsed = new URL(candidate);
      parsed.hash = '';
      parsed.search = '';
      let pathname = String(parsed.pathname || '').replace(/\/+/g, '/');
      pathname = pathname.replace(/\/api\/external(?:\/.*)?$/i, '');
      pathname = pathname === '/' ? '' : pathname.replace(/\/+$/g, '');
      return `${parsed.origin}${pathname}`;
    } catch {
      return '';
    }
  }
  
  function normalizeOutlookEmailPlusProviderValue(value = '') {
    return String(value || '').trim().toLowerCase() || 'outlook';
  }
  
  function normalizeOutlookEmailPlusProjectKeyValue(value = '') {
    return String(value || '').trim().toLowerCase() || 'openai';
  }
  
  function normalizeOutlookEmailPlusCallerIdPrefixValue(value = '') {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '-')
      .replace(/-{2,}/g, '-')
      .replace(/^[-._]+|[-._]+$/g, '') || 'cdk-redeem';
  }
  
  function normalizeOutlookEmailPlusAliasMaxPerMailbox(value) {
    const rawValue = String(value ?? '').trim();
    if (!rawValue) {
      return 5;
    }
    const numeric = Number(rawValue);
    if (!Number.isFinite(numeric)) {
      return 5;
    }
    return Math.min(50, Math.max(1, Math.floor(numeric)));
  }
  
  function formatAutoStepDelayInputValue(value) {
    const normalized = normalizeAutoStepDelaySeconds(value);
    return String(normalized);
  }
  
  function getNormalizedCustomEmailPoolEntriesState() {
    const entries = (typeof customEmailPoolEntriesState !== 'undefined' && Array.isArray(customEmailPoolEntriesState))
      ? customEmailPoolEntriesState
      : [];
    return normalizeCustomEmailPoolEntryObjects(entries);
  }
  
  function getActiveCustomEmailPoolEmails(entries = getNormalizedCustomEmailPoolEntriesState()) {
    return normalizeCustomEmailPoolEntryObjects(entries)
      .filter(isCustomEmailPoolEntryAvailable)
      .map((entry) => entry.email);
  }
  
  function setCustomEmailPoolEntriesState(entries = [], options = {}) {
    const { syncInput = true } = options;
    customEmailPoolEntriesState = normalizeCustomEmailPoolEntryObjects(entries);
    if (syncInput && inputCustomEmailPool) {
      inputCustomEmailPool.value = normalizeCustomEmailPoolEntryValues(
        customEmailPoolEntriesState.filter(isCustomEmailPoolEntryAvailable)
      ).join('\n');
    }
  }
  
  function restoreCustomEmailPoolEntriesFromState(state = {}) {
    const rawEntries = Array.isArray(state?.customEmailPoolEntries)
      ? state.customEmailPoolEntries
      : [];
    if (rawEntries.length > 0) {
      return normalizeCustomEmailPoolEntryObjects(rawEntries);
    }
    return normalizeCustomEmailPoolEntryObjects(state?.customEmailPool);
  }
  
  function usesCustomEmailPoolGenerator(provider = selectMailProvider.value) {
    return !isCustomMailProvider(provider)
      && !isLuckmailProvider(provider)
      && getSelectedEmailGenerator() === CUSTOM_EMAIL_POOL_GENERATOR;
  }
  
  function getCustomMailProviderPoolSize() {
    return normalizeCustomEmailPoolEntries(inputCustomMailProviderPool?.value).length;
  }
  
  function usesCustomMailProviderPool(provider = selectMailProvider.value) {
    return isCustomMailProvider(provider) && getCustomMailProviderPoolSize() > 0;
  }
  
  function getCustomEmailPoolSize() {
    if (typeof customEmailPoolEntriesState !== 'undefined' && Array.isArray(customEmailPoolEntriesState)) {
      const activeEntries = getActiveCustomEmailPoolEmails(customEmailPoolEntriesState);
      if (activeEntries.length > 0 || customEmailPoolEntriesState.length > 0) {
        return activeEntries.length;
      }
    }
    return normalizeCustomEmailPoolEntries(inputCustomEmailPool?.value).length;
  }
  
  function getLockedRunCountFromEmailPool(provider = selectMailProvider.value) {
    if (usesCustomMailProviderPool(provider)) {
      return getCustomMailProviderPoolSize();
    }
    if (usesCustomEmailPoolGenerator(provider)) {
      return getCustomEmailPoolSize();
    }
    return 0;
  }
  
  function shouldLockRunCountToEmailPool(provider = (typeof selectMailProvider !== 'undefined' ? selectMailProvider?.value : undefined)) {
    return getLockedRunCountFromEmailPool(provider) > 0;
  }
  
  function syncRunCountFromCustomEmailPool() {
    if (!usesCustomEmailPoolGenerator()) {
      return;
    }
    const poolSize = getCustomEmailPoolSize();
    if (poolSize > 0) {
      inputRunCount.value = String(poolSize);
    }
  }
  
  function syncRunCountFromCustomMailProviderPool() {
    if (!usesCustomMailProviderPool()) {
      return;
    }
    const poolSize = getCustomMailProviderPoolSize();
    if (poolSize > 0) {
      inputRunCount.value = String(poolSize);
    }
  }
  
  function syncRunCountFromConfiguredEmailPool(provider = selectMailProvider.value) {
    const poolSize = getLockedRunCountFromEmailPool(provider);
    if (poolSize > 0) {
      inputRunCount.value = String(poolSize);
    }
  }
  
  function getRunCountValue() {
    const poolSize = getLockedRunCountFromEmailPool();
    if (poolSize > 0) {
      return poolSize;
    }
    return Math.max(1, parseInt(inputRunCount.value, 10) || 1);
  }
  
  function updateFallbackThreadIntervalInputState() {
    if (!inputAutoSkipFailuresThreadIntervalMinutes) {
      return;
    }
  
    inputAutoSkipFailuresThreadIntervalMinutes.disabled = Boolean(inputAutoSkipFailures.disabled);
  }
  
  function updateAutoDelayInputState() {
    if (!inputAutoDelayEnabled || !inputAutoDelayMinutes) {
      return;
    }
    const scheduled = isAutoRunScheduledPhase();
    inputAutoDelayEnabled.disabled = scheduled;
    inputAutoDelayMinutes.disabled = scheduled || !inputAutoDelayEnabled.checked;
  }
  
  function formatCountdown(remainingMs) {
    return autoRunCountdownView.formatCountdown(remainingMs);
  }
  
  function formatScheduleTime(timestamp) {
    return autoRunCountdownView.formatScheduleTime(timestamp);
  }
  
  function stopScheduledCountdownTicker() {
    return autoRunCountdownView.stopScheduledCountdownTicker();
  }
  
  function getActiveAutoRunCountdown() {
    return autoRunCountdownView.getActiveAutoRunCountdown();
  }
  
  function renderScheduledAutoRunInfo() {
    return autoRunCountdownView.renderScheduledAutoRunInfo();
  }
  
  function syncScheduledCountdownTicker() {
    return autoRunCountdownView.syncScheduledCountdownTicker();
  }
  
  function setDefaultAutoRunButton() {
    btnAutoRun.disabled = false;
    inputRunCount.disabled = false;
    btnAutoRun.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> 自动';
  }
  
  function getCloudflareDomainsFromState() {
    const domains = normalizeCloudflareDomains(latestState?.cloudflareDomains || []);
    const activeDomain = normalizeCloudflareDomainValue(latestState?.cloudflareDomain || '');
    if (activeDomain && !domains.includes(activeDomain)) {
      domains.unshift(activeDomain);
    }
    return { domains, activeDomain: activeDomain || domains[0] || '' };
  }
  
  function getCloudflareTempEmailDomainsFromState() {
    const domains = normalizeCloudflareTempEmailDomains(latestState?.cloudflareTempEmailDomains || []);
    const activeDomain = normalizeCloudflareTempEmailDomainValue(latestState?.cloudflareTempEmailDomain || '');
    if (activeDomain && !domains.includes(activeDomain)) {
      domains.unshift(activeDomain);
    }
    return { domains, activeDomain: activeDomain || domains[0] || '' };
  }
  
  function renderCloudflareDomainOptions(preferredDomain = '') {
    const preferred = normalizeCloudflareDomainValue(preferredDomain);
    const { domains, activeDomain } = getCloudflareDomainsFromState();
    const selected = preferred || activeDomain;
    cfDomainPicker.render(domains, domains.includes(selected) ? selected : domains[0] || '');
  }
  
  function renderCloudflareTempEmailDomainOptions(preferredDomain = '') {
    const preferred = normalizeCloudflareTempEmailDomainValue(preferredDomain);
    const { domains, activeDomain } = getCloudflareTempEmailDomainsFromState();
    const selected = preferred || activeDomain;
    tempEmailDomainPicker.render(domains, domains.includes(selected) ? selected : domains[0] || '');
  }
  
  function setCloudflareDomainEditMode(editing, options = {}) {
    const { clearInput = false } = options;
    cloudflareDomainEditMode = Boolean(editing);
    cfDomainPicker.setVisible(!cloudflareDomainEditMode);
    inputCfDomain.style.display = cloudflareDomainEditMode ? '' : 'none';
    btnCfDomainMode.textContent = cloudflareDomainEditMode ? '保存' : '添加';
    if (cloudflareDomainEditMode) {
      if (clearInput) {
        inputCfDomain.value = '';
      }
      inputCfDomain.focus();
    } else if (clearInput) {
      inputCfDomain.value = '';
    }
  }
  
  function setCloudflareTempEmailDomainEditMode(editing, options = {}) {
    const { clearInput = false } = options;
    cloudflareTempEmailDomainEditMode = false;
    tempEmailDomainPicker.setVisible(true);
    inputTempEmailDomain.style.display = 'none';
    btnTempEmailDomainMode.textContent = '更新';
    if (clearInput) {
      inputTempEmailDomain.value = '';
    }
  }
  
  function applyCloudflareTempEmailSettingsState(state = {}) {
    inputTempEmailBaseUrl.value = state?.cloudflareTempEmailBaseUrl || '';
    inputTempEmailAdminAuth.value = state?.cloudflareTempEmailAdminAuth || '';
    inputTempEmailCustomAuth.value = state?.cloudflareTempEmailCustomAuth || '';
    inputTempEmailReceiveMailbox.value = state?.cloudflareTempEmailReceiveMailbox || '';
    setCloudflareTempEmailLookupMode(state?.cloudflareTempEmailLookupMode);
    if (inputTempEmailUseRandomSubdomain) {
      inputTempEmailUseRandomSubdomain.checked = Boolean(state?.cloudflareTempEmailUseRandomSubdomain);
    }
    renderCloudflareTempEmailDomainOptions(state?.cloudflareTempEmailDomain || '');
    setCloudflareTempEmailDomainEditMode(false, { clearInput: true });
  }
  
  function applyCloudMailSettingsState(state = {}) {
    if (inputCloudMailBaseUrl) {
      inputCloudMailBaseUrl.value = state?.cloudMailBaseUrl || '';
    }
    if (inputCloudMailAdminEmail) {
      inputCloudMailAdminEmail.value = state?.cloudMailAdminEmail || '';
    }
    if (inputCloudMailAdminPassword) {
      inputCloudMailAdminPassword.value = state?.cloudMailAdminPassword || '';
    }
    if (inputCloudMailReceiveMailbox) {
      inputCloudMailReceiveMailbox.value = state?.cloudMailReceiveMailbox || '';
    }
    if (inputCloudMailDomain) {
      inputCloudMailDomain.value = state?.cloudMailDomain || '';
    }
  }
  
  function applyFreemailSettingsState(state = {}) {
    if (inputFreemailBaseUrl) {
      inputFreemailBaseUrl.value = state?.freemailBaseUrl || '';
    }
    if (inputFreemailAdminUsername) {
      inputFreemailAdminUsername.value = state?.freemailAdminUsername || '';
    }
    if (inputFreemailAdminPassword) {
      inputFreemailAdminPassword.value = state?.freemailAdminPassword || '';
    }
    if (inputFreemailDomain) {
      inputFreemailDomain.value = state?.freemailDomain || '';
    }
  }
  
  function applyMoemailSettingsState(state = {}) {
    if (inputMoemailBaseUrl) {
      inputMoemailBaseUrl.value = state?.moemailBaseUrl || '';
    }
    if (inputMoemailApiKey) {
      inputMoemailApiKey.value = state?.moemailApiKey || '';
    }
    if (inputMoemailDomain) {
      inputMoemailDomain.value = state?.moemailDomain || '';
    }
  }
  
  function applyYydsMailSettingsState(state = {}) {
    if (inputYydsMailBaseUrl) {
      inputYydsMailBaseUrl.value = state?.yydsMailBaseUrl || '';
    }
    if (inputYydsMailApiKey) {
      inputYydsMailApiKey.value = state?.yydsMailApiKey || '';
    }
    if (inputYydsMailDomain) {
      inputYydsMailDomain.value = state?.yydsMailDomain || '';
    }
  }
  
  function validateFreemailConfigForGeneration(options = {}) {
    const { focusOnError = false } = options;
    if (getSelectedEmailGenerator() !== FREEMAIL_PROVIDER) {
      return { valid: true };
    }
  
    const baseUrl = normalizeFreemailBaseUrlValue(inputFreemailBaseUrl?.value || '');
    if (!baseUrl) {
      if (focusOnError) {
        inputFreemailBaseUrl?.focus();
        inputFreemailBaseUrl?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
      return {
        valid: false,
        message: '请先填写 freemail API 地址，例如 https://your-worker-domain。',
      };
    }
  
    const adminUsername = String(inputFreemailAdminUsername?.value || '').trim();
    if (!adminUsername) {
      if (focusOnError) {
        inputFreemailAdminUsername?.focus();
        inputFreemailAdminUsername?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
      return { valid: false, message: '请先填写 freemail 管理员用户名。' };
    }
  
    if (!String(inputFreemailAdminPassword?.value || '')) {
      if (focusOnError) {
        inputFreemailAdminPassword?.focus();
        inputFreemailAdminPassword?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
      return { valid: false, message: '请先填写 freemail 管理员密码。' };
    }
  
    return { valid: true };
  }
  
  function validateMoemailConfigForGeneration(options = {}) {
    const { focusOnError = false } = options;
    if (getSelectedEmailGenerator() !== MOEMAIL_GENERATOR) {
      return { valid: true };
    }
  
    const baseUrl = normalizeMoemailBaseUrlValue(inputMoemailBaseUrl?.value || '');
    if (!baseUrl) {
      if (focusOnError) {
        inputMoemailBaseUrl?.focus();
        inputMoemailBaseUrl?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
      return {
        valid: false,
        message: '请先填写 MoeMail API 地址，例如 https://your-moemail-domain。',
      };
    }
  
    if (!String(inputMoemailApiKey?.value || '').trim()) {
      if (focusOnError) {
        inputMoemailApiKey?.focus();
        inputMoemailApiKey?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
      return { valid: false, message: '请先填写 MoeMail API Key。' };
    }
  
    return { valid: true };
  }
  
  function validateYydsMailConfigForGeneration(options = {}) {
    const { focusOnError = false } = options;
    if (getSelectedEmailGenerator() !== YYDSMAIL_GENERATOR) {
      return { valid: true };
    }
  
    const baseUrl = normalizeYydsMailBaseUrlValue(inputYydsMailBaseUrl?.value || '');
    if (!baseUrl) {
      if (focusOnError) {
        inputYydsMailBaseUrl?.focus();
        inputYydsMailBaseUrl?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
      return {
        valid: false,
        message: '请先填写 YYDS Mail API 地址，例如 https://vip.215.im。',
      };
    }
  
    if (!String(inputYydsMailApiKey?.value || '').trim()) {
      if (focusOnError) {
        inputYydsMailApiKey?.focus();
        inputYydsMailApiKey?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
      return { valid: false, message: '请先填写 YYDS Mail API Key。' };
    }
  
    return { valid: true };
  }
  
  function applyOutlookEmailPlusSettingsState(state = {}) {
    if (inputOutlookEmailPlusBaseUrl) {
      inputOutlookEmailPlusBaseUrl.value = state?.outlookEmailPlusBaseUrl || '';
    }
    if (inputOutlookEmailPlusApiKey) {
      inputOutlookEmailPlusApiKey.value = state?.outlookEmailPlusApiKey || '';
    }
    if (inputOutlookEmailPlusProvider) {
      inputOutlookEmailPlusProvider.value = normalizeOutlookEmailPlusProviderValue(state?.outlookEmailPlusProvider);
    }
    if (inputOutlookEmailPlusProjectKey) {
      inputOutlookEmailPlusProjectKey.value = normalizeOutlookEmailPlusProjectKeyValue(state?.outlookEmailPlusProjectKey);
    }
    if (inputOutlookEmailPlusCallerIdPrefix) {
      inputOutlookEmailPlusCallerIdPrefix.value = normalizeOutlookEmailPlusCallerIdPrefixValue(state?.outlookEmailPlusCallerIdPrefix);
    }
    if (inputOutlookEmailPlusAliasMaxPerMailbox) {
      inputOutlookEmailPlusAliasMaxPerMailbox.value = String(
        normalizeOutlookEmailPlusAliasMaxPerMailbox(state?.outlookEmailPlusAliasMaxPerMailbox)
      );
    }
  }
  
  function collectSettingsPayload() {
    const defaultUpiInfoHelperApiUrl = typeof DEFAULT_UPI_INFO_HELPER_API_URL !== 'undefined'
      ? DEFAULT_UPI_INFO_HELPER_API_URL
      : 'https://your-upiInfo-helper-domain.example';
    const { domains, activeDomain } = getCloudflareDomainsFromState();
    const selectedCloudflareDomain = normalizeCloudflareDomainValue(
      !cloudflareDomainEditMode ? selectCfDomain.value : activeDomain
    ) || activeDomain;
    const { domains: tempEmailDomains, activeDomain: tempEmailActiveDomain } = getCloudflareTempEmailDomainsFromState();
    const selectedCloudflareTempEmailDomain = normalizeCloudflareTempEmailDomainValue(
      !cloudflareTempEmailDomainEditMode ? selectTempEmailDomain.value : tempEmailActiveDomain
    ) || tempEmailActiveDomain;
    const normalizeCloudMailBaseUrlInput = typeof normalizeCloudMailBaseUrlValue === 'function'
      ? normalizeCloudMailBaseUrlValue
      : normalizeCloudflareTempEmailBaseUrlValue;
    const normalizeCloudMailReceiveMailboxInput = typeof normalizeCloudMailReceiveMailboxValue === 'function'
      ? normalizeCloudMailReceiveMailboxValue
      : normalizeCloudflareTempEmailReceiveMailboxValue;
    const normalizeCloudMailDomainInput = typeof normalizeCloudMailDomainValue === 'function'
      ? normalizeCloudMailDomainValue
      : normalizeCloudflareTempEmailDomainValue;
    const normalizeFreemailBaseUrlInput = typeof normalizeFreemailBaseUrlValue === 'function'
      ? normalizeFreemailBaseUrlValue
      : normalizeCloudflareTempEmailBaseUrlValue;
    const normalizeFreemailDomainInput = typeof normalizeFreemailDomainValue === 'function'
      ? normalizeFreemailDomainValue
      : normalizeCloudflareTempEmailDomainValue;
    const normalizeMoemailBaseUrlInput = typeof normalizeMoemailBaseUrlValue === 'function'
      ? normalizeMoemailBaseUrlValue
      : normalizeCloudflareTempEmailBaseUrlValue;
    const normalizeMoemailDomainInput = typeof normalizeMoemailDomainValue === 'function'
      ? normalizeMoemailDomainValue
      : normalizeCloudflareTempEmailDomainValue;
    const normalizeYydsMailBaseUrlInput = typeof normalizeYydsMailBaseUrlValue === 'function'
      ? normalizeYydsMailBaseUrlValue
      : normalizeCloudflareTempEmailBaseUrlValue;
    const normalizeYydsMailDomainInput = typeof normalizeYydsMailDomainValue === 'function'
      ? normalizeYydsMailDomainValue
      : normalizeCloudflareTempEmailDomainValue;
    const normalizeOutlookEmailPlusBaseUrlInput = typeof normalizeOutlookEmailPlusBaseUrlValue === 'function'
      ? normalizeOutlookEmailPlusBaseUrlValue
      : ((value = '') => String(value || '').trim().replace(/\/+$/g, ''));
    const normalizeOutlookEmailPlusProviderInput = typeof normalizeOutlookEmailPlusProviderValue === 'function'
      ? normalizeOutlookEmailPlusProviderValue
      : ((value = '') => String(value || '').trim().toLowerCase() || 'outlook');
    const normalizeOutlookEmailPlusProjectKeyInput = typeof normalizeOutlookEmailPlusProjectKeyValue === 'function'
      ? normalizeOutlookEmailPlusProjectKeyValue
      : ((value = '') => String(value || '').trim().toLowerCase() || 'openai');
    const normalizeOutlookEmailPlusCallerIdPrefixInput = typeof normalizeOutlookEmailPlusCallerIdPrefixValue === 'function'
      ? normalizeOutlookEmailPlusCallerIdPrefixValue
      : ((value = '') => String(value || '').trim().toLowerCase() || 'cdk-redeem');
    const cdkPoolTextForSave = getStoredCdkPoolText(latestState, 'upi');
    const cdkUsageForSave = getStoredCdkUsage(latestState, 'upi');
    const idealCdkPoolTextForSave = getStoredCdkPoolText(latestState, 'ideal');
    const idealCdkUsageForSave = getStoredCdkUsage(latestState, 'ideal');
    const contributionModeEnabled = Boolean(latestState?.contributionMode);
    const icloudFetchModeRawValue = typeof selectIcloudFetchMode !== 'undefined'
      ? String(selectIcloudFetchMode?.value || '')
      : '';
    const icloudTargetMailboxTypeValue = typeof selectIcloudTargetMailboxType !== 'undefined'
      ? selectIcloudTargetMailboxType?.value
      : '';
    const icloudForwardMailProviderValue = typeof selectIcloudForwardMailProvider !== 'undefined'
      ? selectIcloudForwardMailProvider?.value
      : '';
    const normalizedIcloudTargetMailboxType = normalizeIcloudTargetMailboxType(icloudTargetMailboxTypeValue);
    const normalizedIcloudForwardMailProvider = normalizeIcloudForwardMailProvider(icloudForwardMailProviderValue);
    const normalizeUpiInfoOtpChannelSafe = typeof normalizeUpiInfoOtpChannelValue === 'function'
      ? normalizeUpiInfoOtpChannelValue
      : ((value = '') => {
        const rootScope = typeof window !== 'undefined' ? window : globalThis;
        if (rootScope.LegacyPayUtils?.normalizeUpiInfoOtpChannel) {
          return rootScope.LegacyPayUtils.normalizeUpiInfoOtpChannel(value);
        }
        return 'whatsapp';
      });
    const mail2925UseAccountPool = typeof inputMail2925UseAccountPool !== 'undefined'
      ? Boolean(inputMail2925UseAccountPool?.checked)
      : Boolean(latestState?.mail2925UseAccountPool);
    const selectedSignupMethod = 'email';
    const normalizedCustomEmailPool = typeof getActiveCustomEmailPoolEmails === 'function'
      ? getActiveCustomEmailPoolEmails()
      : (typeof normalizeCustomEmailPoolEntries === 'function'
        ? normalizeCustomEmailPoolEntries(inputCustomEmailPool?.value)
        : []);
    const normalizedCustomEmailPoolEntries = typeof getNormalizedCustomEmailPoolEntriesState === 'function'
      ? getNormalizedCustomEmailPoolEntriesState()
      : [];
    const legacyWalletAccounts = typeof getLegacyWalletAccounts === 'function'
      ? getLegacyWalletAccounts(latestState)
      : (Array.isArray(latestState?.legacyWalletAccounts) ? latestState.legacyWalletAccounts : []);
    const currentLegacyWalletAccount = typeof getCurrentLegacyWalletAccount === 'function'
      ? getCurrentLegacyWalletAccount(latestState)
      : legacyWalletAccounts.find((account) => account?.id === String(latestState?.currentLegacyWalletAccountId || '').trim()) || null;
    const normalizePanelModeSafe = typeof normalizePanelMode === 'function'
      ? normalizePanelMode
      : ((value = '') => {
        const normalized = String(value || '').trim().toLowerCase();
        return normalized === 'local-cpa-json'
          || normalized === 'local-cpa-json-no-rt'
          || normalized === 'codex2api'
          ? normalized
          : 'local-cpa-json';
      });
    const selectedExportSettings = typeof getSelectedExportSettings === 'function'
      ? getSelectedExportSettings()
      : {
        panelMode: normalizePanelModeSafe(
          selectPanelMode?.value
          || latestState?.panelMode
          || (typeof DEFAULT_PANEL_MODE === 'string' ? DEFAULT_PANEL_MODE : 'local-cpa-json')
        ),
        plusAccountAccessStrategy: PLUS_ACCOUNT_ACCESS_STRATEGY_OAUTH,
      };
    const rawPanelMode = selectedExportSettings.panelMode;
    const rawPlusAccountAccessStrategy = normalizePlusAccountAccessStrategy(
      selectedExportSettings.plusAccountAccessStrategy
    );
    const rawPlusModeEnabled = typeof inputPlusModeEnabled !== 'undefined' && inputPlusModeEnabled
      ? Boolean(inputPlusModeEnabled.checked)
      : Boolean(latestState?.plusModeEnabled);
    const capabilityState = typeof resolveCurrentSidepanelCapabilities === 'function'
      ? resolveCurrentSidepanelCapabilities({
        panelMode: rawPanelMode,
        signupMethod: selectedSignupMethod,
        state: {
          ...(latestState || {}),
          panelMode: rawPanelMode,
          plusAccountAccessStrategy: rawPlusAccountAccessStrategy,
          plusModeEnabled: rawPlusModeEnabled,
          signupMethod: selectedSignupMethod,
        },
      })
      : (() => {
        const rootScope = typeof window !== 'undefined' ? window : globalThis;
        const registry = rootScope.MultiPageFlowCapabilities?.createFlowCapabilityRegistry?.({
          defaultFlowId: typeof DEFAULT_ACTIVE_FLOW_ID === 'string' ? DEFAULT_ACTIVE_FLOW_ID : 'openai',
        }) || null;
        return registry?.resolveSidepanelCapabilities
          ? registry.resolveSidepanelCapabilities({
            activeFlowId: latestState?.activeFlowId,
            panelMode: rawPanelMode,
            signupMethod: selectedSignupMethod,
            state: {
              ...(latestState || {}),
              panelMode: rawPanelMode,
              plusAccountAccessStrategy: rawPlusAccountAccessStrategy,
              plusModeEnabled: rawPlusModeEnabled,
              signupMethod: selectedSignupMethod,
            },
          })
          : null;
      })();
    const effectivePanelMode = capabilityState?.effectivePanelMode || capabilityState?.panelMode || rawPanelMode;
    const effectivePlusModeEnabled = capabilityState
      ? Boolean(capabilityState.runtimeLocks?.plusModeEnabled)
      : rawPlusModeEnabled;
    const effectiveSignupMethod = capabilityState?.effectiveSignupMethod || selectedSignupMethod;
    const effectivePlusAccountAccessStrategy = capabilityState?.effectivePlusAccountAccessStrategy
      || rawPlusAccountAccessStrategy;
    const plusPaymentMethod = getSelectedPlusPaymentMethod();
    const selectedUpiInfoOtpChannel = normalizeUpiInfoOtpChannelSafe(
      typeof selectUpiInfoHelperOtpChannel !== 'undefined' && selectUpiInfoHelperOtpChannel
        ? selectUpiInfoHelperOtpChannel.value
        : (latestState?.legacyPayHelperOtpChannel || 'whatsapp')
    );
    const selectedSub2ApiGroupName = String(inputSub2ApiGroup.value || '').trim();
    const sub2apiGroupNames = [];
    const seenSub2ApiGroupNames = new Set();
    const appendSub2ApiGroupNames = (value) => {
      if (Array.isArray(value)) {
        value.forEach(appendSub2ApiGroupNames);
        return;
      }
      String(value || '')
        .split(/[\r\n,，、]+/)
        .map((name) => name.trim())
        .filter(Boolean)
        .forEach((name) => {
          const key = name.toLowerCase();
          if (!key || seenSub2ApiGroupNames.has(key)) {
            return;
          }
          seenSub2ApiGroupNames.add(key);
          sub2apiGroupNames.push(name);
        });
    };
    [
      latestState?.sub2apiGroupNames,
      latestState?.sub2apiGroupName,
      selectedSub2ApiGroupName,
    ].forEach(appendSub2ApiGroupNames);
    if (sub2apiGroupNames.length === 0) {
      appendSub2ApiGroupNames(['codex', 'openai-plus']);
    }
    const sub2apiAccountPriorityNormalizer = typeof normalizeSub2ApiAccountPriorityValue === 'function'
      ? normalizeSub2ApiAccountPriorityValue
      : ((value) => {
        const numeric = Number(String(value ?? '').trim());
        return Number.isSafeInteger(numeric) && numeric >= 1 ? numeric : 1;
      });
    const localCpaJsonPluginDirNormalizer = typeof normalizeLocalCpaJsonPluginDirValue === 'function'
      ? normalizeLocalCpaJsonPluginDirValue
      : ((value) => String(value || '').trim());
    const localCpaJsonRelativeAuthDirNormalizer = typeof normalizeLocalCpaJsonRelativeAuthDirValue === 'function'
      ? normalizeLocalCpaJsonRelativeAuthDirValue
      : ((value) => String(value || '').trim() || '.cli-proxy-api');
    const supportedMailProviderNormalizer = typeof normalizeSupportedMailProvider === 'function'
      ? normalizeSupportedMailProvider
      : ((value) => String(value || '').trim().toLowerCase());
    const cloudflareTempEmailBaseUrlNormalizer = typeof normalizeCloudflareTempEmailBaseUrlValue === 'function'
      ? normalizeCloudflareTempEmailBaseUrlValue
      : ((value) => String(value || '').trim());
    const cloudflareTempEmailReceiveMailboxNormalizer = typeof normalizeCloudflareTempEmailReceiveMailboxValue === 'function'
      ? normalizeCloudflareTempEmailReceiveMailboxValue
      : ((value) => String(value || '').trim());
    const fixedPlusModeEnabled = typeof FIXED_PLUS_MODE_ENABLED === 'boolean'
      ? FIXED_PLUS_MODE_ENABLED
      : true;
    const selectedChatgptSessionReaderMode = getActiveChatgptSessionReaderModeFromState(latestState);
    const currentChatgptSessionReaderProfiles = getLocalChatgptSessionReaderProfilesDraft(latestState);
    const nextChatgptSessionReaderProfiles = {
      ...currentChatgptSessionReaderProfiles,
      [selectedChatgptSessionReaderMode]: normalizeChatgptSessionReaderProfileValue(
        buildChatgptSessionReaderProfileFromInputs(),
        currentChatgptSessionReaderProfiles[selectedChatgptSessionReaderMode]
      ),
    };
    const activeChatgptSessionReaderProfile = nextChatgptSessionReaderProfiles[selectedChatgptSessionReaderMode];
    const hotmailAccountsForSave = getHotmailAccounts(latestState);
    return {
      ...(contributionModeEnabled ? {} : {
        panelMode: effectivePanelMode,
      }),
      plusAccountAccessStrategy: effectivePlusAccountAccessStrategy,
      localCpaJsonPluginDir: typeof inputLocalCpaJsonPluginDir !== 'undefined' && inputLocalCpaJsonPluginDir
        ? localCpaJsonPluginDirNormalizer(inputLocalCpaJsonPluginDir.value)
        : '',
      localCpaJsonRelativeAuthDir: typeof inputLocalCpaJsonRelativeAuthDir !== 'undefined' && inputLocalCpaJsonRelativeAuthDir
        ? localCpaJsonRelativeAuthDirNormalizer(inputLocalCpaJsonRelativeAuthDir.value)
        : (typeof DEFAULT_LOCAL_CPA_JSON_RELATIVE_AUTH_DIR === 'string' ? DEFAULT_LOCAL_CPA_JSON_RELATIVE_AUTH_DIR : '.cli-proxy-api'),
      vpsUrl: inputVpsUrl.value.trim(),
      vpsPassword: inputVpsPassword.value,
      localCpaStep9Mode: getSelectedLocalCpaStep9Mode(),
      sub2apiUrl: inputSub2ApiUrl.value.trim(),
      sub2apiEmail: inputSub2ApiEmail.value.trim(),
      sub2apiPassword: inputSub2ApiPassword.value,
      sub2apiGroupName: selectedSub2ApiGroupName,
      sub2apiGroupNames,
      sub2apiAccountPriority: sub2apiAccountPriorityNormalizer(
        typeof inputSub2ApiAccountPriority !== 'undefined' && inputSub2ApiAccountPriority
          ? inputSub2ApiAccountPriority.value
          : latestState?.sub2apiAccountPriority
      ),
      sub2apiDefaultProxyName: String(inputSub2ApiDefaultProxy?.value || latestState?.sub2apiDefaultProxyName || '').trim(),
      codex2apiUrl: inputCodex2ApiUrl.value.trim(),
      codex2apiAdminKey: inputCodex2ApiAdminKey.value.trim(),
      plusModeEnabled: fixedPlusModeEnabled,
      plusPaymentMethod,
      chatgptSessionReaderMode: selectedChatgptSessionReaderMode,
      chatgptSessionReaderProfiles: nextChatgptSessionReaderProfiles,
      upiSubscriptionApiBaseUrl: String(inputUpiSubscriptionApiBaseUrl?.value || '').trim(),
      upiRedeemExternalApiKey: String(inputUpiRedeemExternalApiKey?.value || '').trim(),
      upiRedeemClientId: String(inputUpiRedeemClientId?.value || '').trim(),
      upiRedeemFailedAccountRetryLimit: normalizeUpiRedeemFailedAccountRetryLimit(
        inputUpiRedeemFailedAccountRetryLimit?.value,
        latestState?.upiRedeemFailedAccountRetryLimit
      ),
      upiRedeemStopAfterRedeem: true,
      upiRedeemContinueAfterRedeem: false,
      totpMfaAfterProfileEnabled: getSelectedTotpMfaAfterProfileEnabled(latestState),
      registrationFreeRoute: getSelectedRegistrationFreeRoute(latestState),
      upiCredentialMembershipCheckTotpApiBaseUrl: String(inputUpiCredentialMembershipTotpApiBaseUrl?.value || '').trim(),
      upiCredentialMembershipCheckTotpLookupKey: String(inputUpiCredentialMembershipTotpLookupKey?.value || '').trim(),
      setGptPasswordVerificationWaitSeconds: resolveSharedVerificationCodeWaitSeconds(latestState),
      cdkPoolText: cdkPoolTextForSave,
      upiRedeemCdkPoolText: cdkPoolTextForSave,
      upiRedeemCdkeyPoolText: cdkPoolTextForSave,
      pixRedeemCdkeyPoolText: cdkPoolTextForSave,
      idealRedeemCdkeyPoolText: idealCdkPoolTextForSave,
      cdkUsage: cdkUsageForSave,
      upiRedeemCdkUsage: cdkUsageForSave,
      upiRedeemCdkeyUsage: cdkUsageForSave,
      pixRedeemCdkeyUsage: cdkUsageForSave,
      idealRedeemCdkeyUsage: idealCdkUsageForSave,
      legacyWalletEmail: String(currentLegacyWalletAccount?.email || latestState?.legacyWalletEmail || '').trim(),
      legacyWalletPassword: String(currentLegacyWalletAccount?.password || latestState?.legacyWalletPassword || ''),
      currentLegacyWalletAccountId: String(latestState?.currentLegacyWalletAccountId || '').trim(),
      legacyWalletAccounts: legacyWalletAccounts,
      legacyPayCountryCode: window.LegacyPayUtils?.normalizeLegacyPayCountryCode
        ? window.LegacyPayUtils.normalizeLegacyPayCountryCode(typeof selectLegacyPayCountryCode !== 'undefined' && selectLegacyPayCountryCode ? selectLegacyPayCountryCode.value : latestState?.legacyPayCountryCode)
        : (typeof selectLegacyPayCountryCode !== 'undefined' && selectLegacyPayCountryCode
          ? String(selectLegacyPayCountryCode.value || '+86').trim()
          : String(latestState?.legacyPayCountryCode || '+86').trim()),
      legacyPayOtp: window.LegacyPayUtils?.normalizeLegacyPayOtp
        ? window.LegacyPayUtils.normalizeLegacyPayOtp(typeof inputLegacyPayOtp !== 'undefined' && inputLegacyPayOtp ? inputLegacyPayOtp.value : latestState?.legacyPayOtp)
        : (typeof inputLegacyPayOtp !== 'undefined' && inputLegacyPayOtp
          ? String(inputLegacyPayOtp.value || '').trim().replace(/[^\d]/g, '')
          : String(latestState?.legacyPayOtp || '').trim().replace(/[^\d]/g, '')),
      legacyPayPin: window.LegacyPayUtils?.normalizeLegacyPayPin
        ? window.LegacyPayUtils.normalizeLegacyPayPin(typeof inputLegacyPayPin !== 'undefined' && inputLegacyPayPin ? inputLegacyPayPin.value : latestState?.legacyPayPin)
        : (typeof inputLegacyPayPin !== 'undefined' && inputLegacyPayPin
          ? String(inputLegacyPayPin.value || '')
          : String(latestState?.legacyPayPin || '')),
      legacyPayHelperApiUrl: window.LegacyPayUtils?.normalizeUpiInfoHelperBaseUrl
        ? window.LegacyPayUtils.normalizeUpiInfoHelperBaseUrl(defaultUpiInfoHelperApiUrl)
        : String(defaultUpiInfoHelperApiUrl).trim().replace(/\/+$/g, ''),
      legacyPayHelperApiKey: typeof inputUpiInfoHelperCardKey !== 'undefined' && inputUpiInfoHelperCardKey
        ? String(inputUpiInfoHelperCardKey.value || '').trim()
        : String(latestState?.legacyPayHelperApiKey || latestState?.legacyPayHelperCardKey || '').trim(),
      legacyPayHelperCardKey: '',
      legacyPayHelperCountryCode: window.LegacyPayUtils?.normalizeLegacyPayCountryCode
        ? window.LegacyPayUtils.normalizeLegacyPayCountryCode(typeof selectUpiInfoHelperCountryCode !== 'undefined' && selectUpiInfoHelperCountryCode ? selectUpiInfoHelperCountryCode.value : latestState?.legacyPayHelperCountryCode)
        : (typeof selectUpiInfoHelperCountryCode !== 'undefined' && selectUpiInfoHelperCountryCode
          ? String(selectUpiInfoHelperCountryCode.value || '+86').trim()
          : String(latestState?.legacyPayHelperCountryCode || '+86').trim()),
      legacyPayHelperPin: window.LegacyPayUtils?.normalizeLegacyPayPin
        ? window.LegacyPayUtils.normalizeLegacyPayPin(typeof inputUpiInfoHelperPin !== 'undefined' && inputUpiInfoHelperPin ? inputUpiInfoHelperPin.value : latestState?.legacyPayHelperPin)
        : (typeof inputUpiInfoHelperPin !== 'undefined' && inputUpiInfoHelperPin
          ? String(inputUpiInfoHelperPin.value || '')
          : String(latestState?.legacyPayHelperPin || '')),
      legacyPayHelperOtpChannel: selectedUpiInfoOtpChannel,
      customPassword: inputPassword.value,
      mailProvider: supportedMailProviderNormalizer(selectMailProvider?.value || latestState?.mailProvider),
      mail2925Mode: getSelectedMail2925Mode(),
      mail2925UseAccountPool,
      currentMail2925AccountId: String(latestState?.currentMail2925AccountId || '').trim(),
      emailGenerator: selectEmailGenerator.value,
      customMailProviderPool: typeof normalizeCustomEmailPoolEntryValues === 'function'
        ? normalizeCustomEmailPoolEntryValues(inputCustomMailProviderPool?.value)
        : [],
      customEmailPool: normalizedCustomEmailPool,
      customEmailPoolEntries: normalizedCustomEmailPoolEntries,
      selectedCustomEmailPoolEmail: String(latestState?.selectedCustomEmailPoolEmail || '').trim().toLowerCase(),
      signupVerificationCodeWaitSeconds: resolveSharedVerificationCodeWaitSeconds(latestState),
      autoDeleteUsedIcloudAlias: checkboxAutoDeleteIcloud?.checked,
      icloudHostPreference: selectIcloudHostPreference?.value || 'auto',
      icloudTargetMailboxType: normalizedIcloudTargetMailboxType,
      icloudForwardMailProvider: normalizedIcloudForwardMailProvider,
      icloudApiBaseUrl: normalizeIcloudApiBaseUrlValue(inputIcloudApiBaseUrl?.value || ''),
      icloudApiAdminKey: inputIcloudApiAdminKey?.value || '',
      icloudFetchMode: (icloudFetchModeRawValue.trim().toLowerCase() === 'always_new'
        ? 'always_new'
        : 'reuse_existing'),
      ...(contributionModeEnabled ? {} : {
        accountRunHistoryTextEnabled: true,
        accountRunHistoryHelperBaseUrl: normalizeAccountRunHistoryHelperBaseUrlValue(inputAccountRunHistoryHelperBaseUrl?.value),
      }),
      ...buildManagedAliasBaseEmailPayload(),
      inbucketHost: inputInbucketHost.value.trim(),
      inbucketMailbox: inputInbucketMailbox.value.trim(),
      ...(hotmailAccountsForSave.length > 0 ? {
        hotmailAccounts: hotmailAccountsForSave,
        currentHotmailAccountId: String(latestState?.currentHotmailAccountId || '').trim(),
      } : {}),
      hotmailServiceMode: getSelectedHotmailServiceMode(),
      hotmailRemoteBaseUrl: inputHotmailRemoteBaseUrl.value.trim(),
      hotmailLocalBaseUrl: inputHotmailLocalBaseUrl.value.trim(),
      hotmailAliasEnabled: typeof inputHotmailAliasEnabled !== 'undefined' && inputHotmailAliasEnabled
        ? normalizeHotmailAliasEnabledValue(inputHotmailAliasEnabled.checked)
        : false,
      outlookAliasMaxPerAccount: typeof inputOutlookAliasMaxPerAccount !== 'undefined' && inputOutlookAliasMaxPerAccount
        ? normalizeOutlookAliasMaxPerAccount(inputOutlookAliasMaxPerAccount.value)
        : 5,
      luckmailApiKey: inputLuckmailApiKey.value,
      luckmailBaseUrl: normalizeLuckmailBaseUrl(inputLuckmailBaseUrl.value),
      luckmailEmailType: normalizeLuckmailEmailType(selectLuckmailEmailType.value),
      luckmailDomain: inputLuckmailDomain.value.trim(),
      cloudflareDomain: selectedCloudflareDomain,
      cloudflareDomains: domains,
      cloudflareTempEmailBaseUrl: cloudflareTempEmailBaseUrlNormalizer(inputTempEmailBaseUrl.value),
      cloudflareTempEmailAdminAuth: inputTempEmailAdminAuth.value,
      cloudflareTempEmailCustomAuth: inputTempEmailCustomAuth.value,
      cloudflareTempEmailLookupMode: typeof getSelectedCloudflareTempEmailLookupMode === 'function'
        ? getSelectedCloudflareTempEmailLookupMode()
        : 'receive-mailbox',
      cloudflareTempEmailReceiveMailbox: cloudflareTempEmailReceiveMailboxNormalizer(inputTempEmailReceiveMailbox.value),
      cloudflareTempEmailUseRandomSubdomain: Boolean(inputTempEmailUseRandomSubdomain?.checked),
      cloudflareTempEmailDomain: selectedCloudflareTempEmailDomain,
      cloudflareTempEmailDomains: tempEmailDomains,
      cloudMailBaseUrl: normalizeCloudMailBaseUrlInput((typeof inputCloudMailBaseUrl !== 'undefined' && inputCloudMailBaseUrl) ? inputCloudMailBaseUrl.value : ''),
      cloudMailAdminEmail: ((typeof inputCloudMailAdminEmail !== 'undefined' && inputCloudMailAdminEmail) ? inputCloudMailAdminEmail.value : '').trim(),
      cloudMailAdminPassword: (typeof inputCloudMailAdminPassword !== 'undefined' && inputCloudMailAdminPassword) ? inputCloudMailAdminPassword.value : '',
      cloudMailReceiveMailbox: normalizeCloudMailReceiveMailboxInput((typeof inputCloudMailReceiveMailbox !== 'undefined' && inputCloudMailReceiveMailbox) ? inputCloudMailReceiveMailbox.value : ''),
      cloudMailDomain: normalizeCloudMailDomainInput((typeof inputCloudMailDomain !== 'undefined' && inputCloudMailDomain) ? inputCloudMailDomain.value : ''),
      freemailBaseUrl: normalizeFreemailBaseUrlInput((typeof inputFreemailBaseUrl !== 'undefined' && inputFreemailBaseUrl) ? inputFreemailBaseUrl.value : ''),
      freemailAdminUsername: ((typeof inputFreemailAdminUsername !== 'undefined' && inputFreemailAdminUsername) ? inputFreemailAdminUsername.value : '').trim(),
      freemailAdminPassword: (typeof inputFreemailAdminPassword !== 'undefined' && inputFreemailAdminPassword) ? inputFreemailAdminPassword.value : '',
      freemailDomain: normalizeFreemailDomainInput((typeof inputFreemailDomain !== 'undefined' && inputFreemailDomain) ? inputFreemailDomain.value : ''),
      moemailBaseUrl: normalizeMoemailBaseUrlInput((typeof inputMoemailBaseUrl !== 'undefined' && inputMoemailBaseUrl) ? inputMoemailBaseUrl.value : ''),
      moemailApiKey: ((typeof inputMoemailApiKey !== 'undefined' && inputMoemailApiKey) ? inputMoemailApiKey.value : '').trim(),
      moemailDomain: normalizeMoemailDomainInput((typeof inputMoemailDomain !== 'undefined' && inputMoemailDomain) ? inputMoemailDomain.value : ''),
      yydsMailBaseUrl: normalizeYydsMailBaseUrlInput((typeof inputYydsMailBaseUrl !== 'undefined' && inputYydsMailBaseUrl) ? inputYydsMailBaseUrl.value : ''),
      yydsMailApiKey: ((typeof inputYydsMailApiKey !== 'undefined' && inputYydsMailApiKey) ? inputYydsMailApiKey.value : '').trim(),
      yydsMailDomain: normalizeYydsMailDomainInput((typeof inputYydsMailDomain !== 'undefined' && inputYydsMailDomain) ? inputYydsMailDomain.value : ''),
      outlookEmailPlusBaseUrl: normalizeOutlookEmailPlusBaseUrlInput((typeof inputOutlookEmailPlusBaseUrl !== 'undefined' && inputOutlookEmailPlusBaseUrl) ? inputOutlookEmailPlusBaseUrl.value : ''),
      outlookEmailPlusApiKey: (typeof inputOutlookEmailPlusApiKey !== 'undefined' && inputOutlookEmailPlusApiKey) ? inputOutlookEmailPlusApiKey.value : '',
      outlookEmailPlusProvider: normalizeOutlookEmailPlusProviderInput((typeof inputOutlookEmailPlusProvider !== 'undefined' && inputOutlookEmailPlusProvider) ? inputOutlookEmailPlusProvider.value : ''),
      outlookEmailPlusProjectKey: normalizeOutlookEmailPlusProjectKeyInput((typeof inputOutlookEmailPlusProjectKey !== 'undefined' && inputOutlookEmailPlusProjectKey) ? inputOutlookEmailPlusProjectKey.value : ''),
      outlookEmailPlusCallerIdPrefix: normalizeOutlookEmailPlusCallerIdPrefixInput((typeof inputOutlookEmailPlusCallerIdPrefix !== 'undefined' && inputOutlookEmailPlusCallerIdPrefix) ? inputOutlookEmailPlusCallerIdPrefix.value : ''),
      outlookEmailPlusAliasMaxPerMailbox: normalizeOutlookEmailPlusAliasMaxPerMailbox((typeof inputOutlookEmailPlusAliasMaxPerMailbox !== 'undefined' && inputOutlookEmailPlusAliasMaxPerMailbox) ? inputOutlookEmailPlusAliasMaxPerMailbox.value : 5),
      autoRunSkipFailures: true,
      autoRunRetryNonFreeTrial: Boolean(inputAutoRunRetryNonFreeTrial?.checked),
      autoRunRetryLegacyWalletCallback: Boolean(inputAutoRunRetryLegacyWalletCallback?.checked),
      autoRunRetryShortLinkError: inputAutoRunRetryShortLinkError !== undefined && inputAutoRunRetryShortLinkError
        ? Boolean(inputAutoRunRetryShortLinkError.checked)
        : true,
      autoRunFallbackThreadIntervalMinutes: normalizeAutoRunThreadIntervalMinutes(inputAutoSkipFailuresThreadIntervalMinutes.value),
      step6CookieCleanupEnabled: typeof inputStep6CookieCleanupEnabled !== 'undefined' && inputStep6CookieCleanupEnabled
        ? Boolean(inputStep6CookieCleanupEnabled.checked)
        : false,
      autoRunDelayEnabled: Boolean(inputAutoDelayEnabled?.checked),
      autoRunDelayMinutes: inputAutoDelayMinutes
        ? normalizeAutoDelayMinutes(inputAutoDelayMinutes.value)
        : AUTO_DELAY_DEFAULT_MINUTES,
      autoStepDelaySeconds: normalizeAutoStepDelaySeconds(inputAutoStepDelaySeconds.value),
      plusRemovedContactOauthDelaySeconds: typeof inputPlusRemovedContactOauthDelaySeconds !== 'undefined' && inputPlusRemovedContactOauthDelaySeconds
        ? normalizePlusRemovedContactOauthDelaySeconds(inputPlusRemovedContactOauthDelaySeconds.value)
        : 0,
      chatgptSessionReaderCloudConversionEnabled: typeof inputChatgptSessionReaderCloudConversionEnabled !== 'undefined' && inputChatgptSessionReaderCloudConversionEnabled
        ? Boolean(inputChatgptSessionReaderCloudConversionEnabled.checked)
        : false,
      chatgptSessionReaderCloudConversionApiUrl: BUILTIN_CHATGPT_SESSION_READER_CLOUD_CONVERSION_API_URL,
      chatgptSessionReaderCloudConversionApiKey: BUILTIN_CHATGPT_SESSION_READER_CLOUD_CONVERSION_API_KEY,
      chatgptSessionReaderConversionProxyUrl: typeof inputChatgptSessionReaderConversionProxy !== 'undefined' && inputChatgptSessionReaderConversionProxy
        ? normalizeChatgptSessionReaderConversionProxyUrlValue(inputChatgptSessionReaderConversionProxy.value)
        : '',
      ...buildRemovedPaymentWorkerSettingsPayloadFromInputs(),
      ...buildChatgptSessionReaderLegacyPatchFromProfile(activeChatgptSessionReaderProfile),
      removedContactCardDeclinedRetryEnabled: typeof inputRemovedContactCardDeclinedRetryEnabled !== 'undefined' && inputRemovedContactCardDeclinedRetryEnabled
        ? Boolean(inputRemovedContactCardDeclinedRetryEnabled.checked)
        : true,
      removedContactFirstDirectResendEnabled: typeof inputRemovedContactFirstDirectResendEnabled !== 'undefined' && inputRemovedContactFirstDirectResendEnabled
        ? Boolean(inputRemovedContactFirstDirectResendEnabled.checked)
        : false,
      removedContactFirstResendWaitSeconds: typeof inputRemovedContactFirstResendWaitSeconds !== 'undefined' && inputRemovedContactFirstResendWaitSeconds
        ? normalizeRemovedContactResendWaitSeconds(inputRemovedContactFirstResendWaitSeconds.value, 20)
        : 20,
      removedContactSubsequentResendWaitSeconds: typeof inputRemovedContactSubsequentResendWaitSeconds !== 'undefined' && inputRemovedContactSubsequentResendWaitSeconds
        ? normalizeRemovedContactResendWaitSeconds(inputRemovedContactSubsequentResendWaitSeconds.value, 25)
        : 25,
      removedContactVerificationPollAttempts: typeof inputRemovedContactVerificationPollAttempts !== 'undefined' && inputRemovedContactVerificationPollAttempts
        ? normalizeRemovedContactVerificationPollAttempts(inputRemovedContactVerificationPollAttempts.value, 6)
        : 6,
      removedContactVerificationPollIntervalSeconds: typeof inputRemovedContactVerificationPollIntervalSeconds !== 'undefined' && inputRemovedContactVerificationPollIntervalSeconds
        ? normalizeRemovedContactVerificationPollIntervalSeconds(inputRemovedContactVerificationPollIntervalSeconds.value, 5)
        : 5,
      removedContactVerificationResendMaxAttempts: typeof inputRemovedContactVerificationResendMaxAttempts !== 'undefined' && inputRemovedContactVerificationResendMaxAttempts
        ? normalizeRemovedContactVerificationResendMaxAttempts(inputRemovedContactVerificationResendMaxAttempts.value, 1)
        : 1,
      oauthFlowTimeoutEnabled: typeof inputOAuthFlowTimeoutEnabled !== 'undefined' && inputOAuthFlowTimeoutEnabled
        ? Boolean(inputOAuthFlowTimeoutEnabled.checked)
        : true,
      signupMethod: effectiveSignupMethod,
    };
  }
  
  function normalizeLocalCpaStep9Mode(value = '') {
    return String(value || '').trim().toLowerCase() === 'bypass'
      ? 'bypass'
      : DEFAULT_LOCAL_CPA_STEP9_MODE;
  }
  
  function normalizeMail2925Mode(value = '') {
    return String(value || '').trim().toLowerCase() === MAIL_2925_MODE_RECEIVE
      ? MAIL_2925_MODE_RECEIVE
      : DEFAULT_MAIL_2925_MODE;
  }
  
  function normalizeCloudflareTempEmailLookupMode(value = '') {
    return String(value || '').trim().toLowerCase() === CLOUDFLARE_TEMP_EMAIL_LOOKUP_MODE_REGISTRATION_EMAIL
      ? CLOUDFLARE_TEMP_EMAIL_LOOKUP_MODE_REGISTRATION_EMAIL
      : DEFAULT_CLOUDFLARE_TEMP_EMAIL_LOOKUP_MODE;
  }
  
  function normalizeHotmailServiceMode(value = '') {
    if (typeof normalizeHotmailServiceModeFromUtils === 'function') {
      return normalizeHotmailServiceModeFromUtils(value);
    }
    return String(value || '').trim().toLowerCase() === HOTMAIL_SERVICE_MODE_REMOTE
      ? HOTMAIL_SERVICE_MODE_REMOTE
      : HOTMAIL_SERVICE_MODE_LOCAL;
  }
  
  function normalizeAccountRunHistoryHelperBaseUrlValue(value = '') {
    const trimmed = String(value || '').trim();
    if (!trimmed) {
      return DEFAULT_ACCOUNT_RUN_HISTORY_HELPER_BASE_URL;
    }
  
    try {
      const parsed = new URL(trimmed);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return DEFAULT_ACCOUNT_RUN_HISTORY_HELPER_BASE_URL;
      }
  
      if (parsed.pathname === '/append-account-log' || parsed.pathname === '/sync-account-run-records') {
        parsed.pathname = '';
        parsed.search = '';
        parsed.hash = '';
      }
  
      return parsed.toString().replace(/\/$/, '');
    } catch {
      return DEFAULT_ACCOUNT_RUN_HISTORY_HELPER_BASE_URL;
    }
  }
  
  function getSelectedLocalCpaStep9Mode() {
    const activeButton = localCpaStep9ModeButtons.find((button) => button.classList.contains('is-active'));
    return normalizeLocalCpaStep9Mode(activeButton?.dataset.localCpaStep9Mode);
  }
  
  function setLocalCpaStep9Mode(mode) {
    const resolvedMode = normalizeLocalCpaStep9Mode(mode);
    localCpaStep9ModeButtons.forEach((button) => {
      const active = button.dataset.localCpaStep9Mode === resolvedMode;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }
  
  function getSelectedMail2925Mode() {
    const activeButton = mail2925ModeButtons.find((button) => button.classList.contains('is-active'));
    return normalizeMail2925Mode(activeButton?.dataset.mail2925Mode);
  }
  
  function setMail2925Mode(mode) {
    const resolvedMode = normalizeMail2925Mode(mode);
    mail2925ModeButtons.forEach((button) => {
      const active = button.dataset.mail2925Mode === resolvedMode;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }
  
  function getSelectedCloudflareTempEmailLookupMode() {
    const activeButton = tempEmailLookupModeButtons.find((button) => button.classList.contains('is-active'));
    return normalizeCloudflareTempEmailLookupMode(activeButton?.dataset.tempEmailLookupMode);
  }
  
  function setCloudflareTempEmailLookupMode(mode) {
    const resolvedMode = normalizeCloudflareTempEmailLookupMode(mode);
    tempEmailLookupModeButtons.forEach((button) => {
      const active = button.dataset.tempEmailLookupMode === resolvedMode;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }
  
  function getSelectedHotmailServiceMode() {
    const activeButton = hotmailServiceModeButtons.find((button) => button.classList.contains('is-active'));
    return normalizeHotmailServiceMode(activeButton?.dataset.hotmailServiceMode);
  }
  
  function setHotmailServiceMode(mode) {
    const resolvedMode = normalizeHotmailServiceMode(mode);
    hotmailServiceModeButtons.forEach((button) => {
      const active = button.dataset.hotmailServiceMode === resolvedMode;
      button.disabled = false;
      button.setAttribute('aria-disabled', 'false');
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }
  
  function updateAccountRunHistorySettingsUI() {
    if (!rowAccountRunHistoryHelperBaseUrl) {
      return;
    }
  
    rowAccountRunHistoryHelperBaseUrl.style.display = 'none';
  }
  
  function normalizeSignupMethod() {
    return SIGNUP_METHOD_EMAIL;
  }
  
  function normalizePanelMode(value = '') {
    const normalized = String(value || '').trim().toLowerCase();
    const localCpaJsonMode = typeof LOCAL_CPA_JSON_PANEL_MODE === 'string'
      ? LOCAL_CPA_JSON_PANEL_MODE
      : 'local-cpa-json';
    const localCpaJsonNoRtMode = typeof LOCAL_CPA_JSON_NO_RT_PANEL_MODE === 'string'
      ? LOCAL_CPA_JSON_NO_RT_PANEL_MODE
      : 'local-cpa-json-no-rt';
    if (
      normalized === localCpaJsonMode
      || normalized === localCpaJsonNoRtMode
      || normalized === 'codex2api'
    ) {
      return normalized;
    }
    return localCpaJsonMode;
  }
  
  function normalizePlusAccountAccessStrategy() {
    return PLUS_ACCOUNT_ACCESS_STRATEGY_OAUTH;
  }
  
  function normalizeAccountAccessStrategyUiValue(value = '') {
    const normalized = String(value || '').trim().toLowerCase();
    if (normalized === ACCOUNT_ACCESS_STRATEGY_UI_SESSION_JSON) {
      return ACCOUNT_ACCESS_STRATEGY_UI_SESSION_JSON;
    }
    return ACCOUNT_ACCESS_STRATEGY_UI_OAUTH;
  }
  
  function getExportTargetForPanelMode(panelMode = '') {
    const normalized = normalizePanelMode(panelMode || DEFAULT_PANEL_MODE);
    return normalized === LOCAL_CPA_JSON_NO_RT_PANEL_MODE
      ? LOCAL_CPA_JSON_PANEL_MODE
      : normalized;
  }
  
  function getAccountAccessStrategyUiValueForState(state = latestState) {
    const panelMode = normalizePanelMode(state?.panelMode || DEFAULT_PANEL_MODE);
    if (panelMode === LOCAL_CPA_JSON_NO_RT_PANEL_MODE) {
      return ACCOUNT_ACCESS_STRATEGY_UI_SESSION_JSON;
    }
    return ACCOUNT_ACCESS_STRATEGY_UI_OAUTH;
  }
  
  function resolvePanelModeFromExportAndStrategy(exportTarget = '', strategyUiValue = '') {
    const target = getExportTargetForPanelMode(exportTarget || DEFAULT_PANEL_MODE);
    const strategy = normalizeAccountAccessStrategyUiValue(strategyUiValue);
    if (target === LOCAL_CPA_JSON_PANEL_MODE && strategy === ACCOUNT_ACCESS_STRATEGY_UI_SESSION_JSON) {
      return LOCAL_CPA_JSON_NO_RT_PANEL_MODE;
    }
    return target === LOCAL_CPA_JSON_NO_RT_PANEL_MODE ? LOCAL_CPA_JSON_PANEL_MODE : target;
  }
  
  function resolvePlusAccountAccessStrategyFromExportAndStrategy(exportTarget = '', strategyUiValue = '') {
    return PLUS_ACCOUNT_ACCESS_STRATEGY_OAUTH;
  }
  
  function getSelectedExportTarget() {
    return getExportTargetForPanelMode(
      (typeof selectPanelMode !== 'undefined' && selectPanelMode
        ? selectPanelMode.value
        : latestState?.panelMode) || DEFAULT_PANEL_MODE
    );
  }
  
  function getSelectedAccountAccessStrategyUiValue() {
    return normalizeAccountAccessStrategyUiValue(
      (typeof selectAccountAccessStrategy !== 'undefined' && selectAccountAccessStrategy
        ? selectAccountAccessStrategy.value
        : getAccountAccessStrategyUiValueForState(latestState))
    );
  }
  
  function getSelectedExportSettings() {
    const exportTarget = LOCAL_CPA_JSON_PANEL_MODE;
    const strategyUiValue = ACCOUNT_ACCESS_STRATEGY_UI_OAUTH;
    return {
      exportTarget,
      strategyUiValue,
      panelMode: resolvePanelModeFromExportAndStrategy(exportTarget, strategyUiValue),
      plusAccountAccessStrategy: resolvePlusAccountAccessStrategyFromExportAndStrategy(exportTarget, strategyUiValue),
    };
  }
  
  function normalizeLocalCpaJsonPluginDirValue(value = '') {
    return String(value || '').trim();
  }
  
  function normalizeLocalCpaJsonRelativeAuthDirValue(value = '') {
    return String(value || '').trim() || DEFAULT_LOCAL_CPA_JSON_RELATIVE_AUTH_DIR;
  }
  
  flowCapabilityRegistry = null;
  
  function getFlowCapabilityRegistry() {
    if (flowCapabilityRegistry) {
      return flowCapabilityRegistry;
    }
    const rootScope = typeof window !== 'undefined' ? window : globalThis;
    flowCapabilityRegistry = rootScope.MultiPageFlowCapabilities?.createFlowCapabilityRegistry?.({
      defaultFlowId: DEFAULT_ACTIVE_FLOW_ID,
    }) || null;
    return flowCapabilityRegistry;
  }
  
  function resolveCurrentSidepanelCapabilities(options = {}) {
    const registry = getFlowCapabilityRegistry();
    if (!registry?.resolveSidepanelCapabilities) {
      return null;
    }
    const state = {
      ...(latestState || {}),
      ...(options?.state || {}),
    };
    return registry.resolveSidepanelCapabilities({
      activeFlowId: options?.activeFlowId ?? state?.activeFlowId,
      panelMode: options?.panelMode ?? state?.panelMode,
      plusAccountAccessStrategy: options?.plusAccountAccessStrategy ?? state?.plusAccountAccessStrategy,
      signupMethod: options?.signupMethod ?? state?.signupMethod,
      state,
    });
  }
  
  function resolveStepDefinitionCapabilityState(state = latestState, options = {}) {
    const nextState = {
      ...(state || {}),
      ...(options?.state || {}),
    };
    const capabilityState = resolveCurrentSidepanelCapabilities({
      activeFlowId: options?.activeFlowId ?? nextState?.activeFlowId,
      panelMode: options?.panelMode ?? nextState?.panelMode,
      plusAccountAccessStrategy: options?.plusAccountAccessStrategy ?? nextState?.plusAccountAccessStrategy,
      signupMethod: options?.signupMethod ?? nextState?.signupMethod,
      state: nextState,
    });
    return {
      capabilityState,
      plusModeEnabled: capabilityState
        ? Boolean(capabilityState.runtimeLocks?.plusModeEnabled)
        : Boolean(nextState?.plusModeEnabled),
      signupMethod: capabilityState?.effectiveSignupMethod
        || normalizeSignupMethod((options?.signupMethod ?? nextState?.signupMethod) || DEFAULT_SIGNUP_METHOD),
      plusAccountAccessStrategy: capabilityState?.effectivePlusAccountAccessStrategy
        || normalizePlusAccountAccessStrategy(
          options?.plusAccountAccessStrategy ?? nextState?.plusAccountAccessStrategy
        ),
    };
  }
  
  function getSelectedPanelMode() {
    const exportSettings = typeof getSelectedExportSettings === 'function'
      ? getSelectedExportSettings()
      : null;
    const selectedValue = exportSettings?.panelMode
      || (typeof selectPanelMode !== 'undefined' && selectPanelMode
        ? selectPanelMode.value
        : (typeof latestState !== 'undefined' ? latestState?.panelMode : ''));
    const resolvedPanelMode = normalizePanelMode(selectedValue || DEFAULT_PANEL_MODE);
    const capabilityState = typeof resolveCurrentSidepanelCapabilities === 'function'
      ? resolveCurrentSidepanelCapabilities({ panelMode: resolvedPanelMode })
      : null;
    return capabilityState?.effectivePanelMode || capabilityState?.panelMode || resolvedPanelMode;
  }
  
  function getSelectedSignupMethod() {
    return SIGNUP_METHOD_EMAIL;
  }
  
  function setSignupMethod() {
    currentSignupMethod = SIGNUP_METHOD_EMAIL;
    syncLatestState({ signupMethod: SIGNUP_METHOD_EMAIL });
    return SIGNUP_METHOD_EMAIL;
  }
  
  function isSignupMethodSwitchLocked() {
    return isAutoRunLockedPhase() || isAutoRunPausedPhase() || isAutoRunScheduledPhase();
  }
  
  function updateSignupMethodUI() {
    setSignupMethod(SIGNUP_METHOD_EMAIL);
    syncStepDefinitionsForMode(currentPlusModeEnabled, {
      plusPaymentMethod: getSelectedPlusPaymentMethod(latestState),
      plusAccountAccessStrategy: currentPlusAccountAccessStrategy,
      signupMethod: SIGNUP_METHOD_EMAIL,
      upiRedeemStopAfterRedeem: getSelectedUpiRedeemStopAfterRedeem(latestState),
      totpMfaAfterProfileEnabled: getSelectedTotpMfaAfterProfileEnabled(latestState),
    });
  }
  
  function updatePlusModeUI() {
    const legacyWalletValue = typeof PLUS_PAYMENT_METHOD_LEGACY_WALLET !== 'undefined' ? PLUS_PAYMENT_METHOD_LEGACY_WALLET : 'legacyWallet';
    const legacyPayValue = typeof PLUS_PAYMENT_METHOD_LEGACY_PAY !== 'undefined' ? PLUS_PAYMENT_METHOD_LEGACY_PAY : 'legacyPay';
    const upiInfoValue = typeof PLUS_PAYMENT_METHOD_UPI_INFO_HELPER !== 'undefined' ? PLUS_PAYMENT_METHOD_UPI_INFO_HELPER : 'upiInfo-helper';
    const upiValue = typeof PLUS_PAYMENT_METHOD_UPI !== 'undefined' ? PLUS_PAYMENT_METHOD_UPI : 'upi';
    const defaultMethod = typeof DEFAULT_PLUS_PAYMENT_METHOD !== 'undefined' ? DEFAULT_PLUS_PAYMENT_METHOD : legacyWalletValue;
    const isUpiOnlyMode = Boolean(document.body?.classList?.contains('upi-only'));
    const rawEnabled = isUpiOnlyMode
      ? true
      : typeof inputPlusModeEnabled !== 'undefined' && inputPlusModeEnabled
      ? Boolean(inputPlusModeEnabled.checked)
      : false;
    const capabilityState = typeof resolveCurrentSidepanelCapabilities === 'function'
      ? resolveCurrentSidepanelCapabilities({
        panelMode: typeof getSelectedPanelMode === 'function' ? getSelectedPanelMode() : latestState?.panelMode,
        state: {
          ...(latestState || {}),
          plusModeEnabled: rawEnabled,
        },
      })
      : (() => {
        const rootScope = typeof window !== 'undefined' ? window : globalThis;
        const registry = rootScope.MultiPageFlowCapabilities?.createFlowCapabilityRegistry?.({
          defaultFlowId: typeof DEFAULT_ACTIVE_FLOW_ID === 'string' ? DEFAULT_ACTIVE_FLOW_ID : 'openai',
        }) || null;
        return registry?.resolveSidepanelCapabilities
          ? registry.resolveSidepanelCapabilities({
            activeFlowId: latestState?.activeFlowId,
            panelMode: typeof getSelectedPanelMode === 'function'
              ? getSelectedPanelMode()
              : (latestState?.panelMode || (typeof DEFAULT_PANEL_MODE !== 'undefined' ? DEFAULT_PANEL_MODE : 'local-cpa-json')),
            state: {
              ...(latestState || {}),
              plusModeEnabled: rawEnabled,
            },
          })
          : null;
      })();
    const supportsPlusMode = capabilityState
      ? Boolean(capabilityState.canShowPlusSettings)
      : true;
    const enabled = supportsPlusMode && rawEnabled;
    const method = isUpiOnlyMode ? upiValue : (enabled ? getSelectedPlusPaymentMethod() : defaultMethod);
    const upiInfoOtpChannel = normalizeUpiInfoOtpChannelValue(
      typeof selectUpiInfoHelperOtpChannel !== 'undefined' && selectUpiInfoHelperOtpChannel
        ? selectUpiInfoHelperOtpChannel.value
        : (latestState?.legacyPayHelperOtpChannel || 'whatsapp')
    );
    const selectedMethod = method;
    const upiInfoRowsVisible = enabled && selectedMethod === upiInfoValue;
    const upiRowsVisible = enabled && selectedMethod === upiValue;
    if (typeof rowPlusMode !== 'undefined' && rowPlusMode) {
      rowPlusMode.style.display = supportsPlusMode && !isUpiOnlyMode ? '' : 'none';
    }
    const checkoutModeSwitchVisible = supportsPlusMode && enabled && selectedMethod === legacyWalletValue;
    if (chatgptSessionReaderModeSwitchGroup) {
      chatgptSessionReaderModeSwitchGroup.style.display = supportsPlusMode && !isUpiOnlyMode ? '' : 'none';
    }
    [inputChatgptSessionReaderModeUs, inputChatgptSessionReaderModeJp].filter(Boolean).forEach((input) => {
      input.disabled = !checkoutModeSwitchVisible;
    });
    if (typeof selectPlusPaymentMethod !== 'undefined' && selectPlusPaymentMethod) {
      selectPlusPaymentMethod.value = selectedMethod;
      if (selectPlusPaymentMethod.style) {
        selectPlusPaymentMethod.style.display = supportsPlusMode ? '' : 'none';
      }
    }
    if (typeof plusPaymentMethodCaption !== 'undefined' && plusPaymentMethodCaption) {
      plusPaymentMethodCaption.textContent = selectedMethod === upiInfoValue
        ? 'UPI_INFO 订阅链路'
        : selectedMethod === upiValue
        ? 'UPI 资格检测与手动 CDK 兑换链路'
        : selectedMethod === legacyPayValue
        ? 'LegacyPay 印尼订阅链路'
        : 'LegacyWallet 订阅链路';
    }
    [
      typeof rowPlusPaymentMethod !== 'undefined' ? rowPlusPaymentMethod : null,
      typeof rowLegacyWalletAccount !== 'undefined' ? rowLegacyWalletAccount : null,
    ].forEach((row) => {
      if (!row) {
        return;
      }
      if (row === rowLegacyWalletAccount) {
        // Keep the legacy LegacyWallet account controls mounted for compatibility,
        // but hide the row from the sidepanel UI.
        row.style.display = 'none';
        return;
      }
      row.style.display = enabled && !isUpiOnlyMode ? '' : 'none';
    });
    [
      typeof rowPlusRemovedContactOauthDelay !== 'undefined' ? rowPlusRemovedContactOauthDelay : null,
      typeof rowChatgptSessionReaderConversionProxy !== 'undefined' ? rowChatgptSessionReaderConversionProxy : null,
      typeof rowChatgptSessionReaderConversionProxyTest !== 'undefined' ? rowChatgptSessionReaderConversionProxyTest : null,
      typeof rowRemovedContactVerificationUrl !== 'undefined' ? rowRemovedContactVerificationUrl : null,
      typeof rowRemovedContactManualFetch !== 'undefined' ? rowRemovedContactManualFetch : null,
      typeof rowRemovedContactResendSettings !== 'undefined' ? rowRemovedContactResendSettings : null,
    ].forEach((row) => {
      if (!row) {
        return;
      }
      row.style.display = enabled && selectedMethod === legacyWalletValue ? '' : 'none';
    });
    updateChatgptSessionReaderConversionModeUi();
    [
      typeof rowUpiInfoHelperApi !== 'undefined' ? rowUpiInfoHelperApi : null,
      typeof rowUpiInfoHelperCardKey !== 'undefined' ? rowUpiInfoHelperCardKey : null,
    ].forEach((row) => {
      if (!row) {
        return;
      }
      row.style.display = upiInfoRowsVisible ? '' : 'none';
    });
    [
      typeof rowUpiSubscriptionApiBaseUrl !== 'undefined' ? rowUpiSubscriptionApiBaseUrl : null,
      typeof rowUpiRedeemExternalApiKey !== 'undefined' ? rowUpiRedeemExternalApiKey : null,
      typeof rowUpiRedeemClientId !== 'undefined' ? rowUpiRedeemClientId : null,
      typeof rowUpiRedeemFailedAccountRetryLimit !== 'undefined' ? rowUpiRedeemFailedAccountRetryLimit : null,
      typeof rowTotpMfaAfterProfileEnabled !== 'undefined' ? rowTotpMfaAfterProfileEnabled : null,
      typeof rowRegistrationFreeRoute !== 'undefined' ? rowRegistrationFreeRoute : null,
      typeof rowSetGptPasswordVerificationWaitSeconds !== 'undefined' ? rowSetGptPasswordVerificationWaitSeconds : null,
      typeof rowUpiCredentialMembershipTotpApiBaseUrl !== 'undefined' ? rowUpiCredentialMembershipTotpApiBaseUrl : null,
      typeof rowUpiCredentialMembershipTotpLookupKey !== 'undefined' ? rowUpiCredentialMembershipTotpLookupKey : null,
      typeof rowUpiRedeemCdkeyPool !== 'undefined' ? rowUpiRedeemCdkeyPool : null,
    ].forEach((row) => {
      if (!row) {
        return;
      }
      row.style.display = upiRowsVisible ? '' : 'none';
    });
    if (typeof rowUpiRedeemStopAfterRedeem !== 'undefined' && rowUpiRedeemStopAfterRedeem) {
      rowUpiRedeemStopAfterRedeem.style.display = 'none';
    }
    if (typeof selectUpiRedeemAfterMode !== 'undefined' && selectUpiRedeemAfterMode) {
      selectUpiRedeemAfterMode.value = 'stop';
    }
    updateAllUpiRedeemCdkeyPoolSummaries(latestState);
    scheduleUpiRedeemCdkeyStatusAutoRefresh({ immediate: upiRowsVisible });
    [
      typeof rowUpiInfoHelperCountryCode !== 'undefined' ? rowUpiInfoHelperCountryCode : null,
      typeof rowUpiInfoHelperOtpChannel !== 'undefined' ? rowUpiInfoHelperOtpChannel : null,
      typeof rowUpiInfoHelperPin !== 'undefined' ? rowUpiInfoHelperPin : null,
    ].forEach((row) => {
      if (!row) {
        return;
      }
      row.style.display = upiInfoRowsVisible ? '' : 'none';
    });
    if (typeof selectUpiInfoHelperOtpChannel !== 'undefined' && selectUpiInfoHelperOtpChannel) {
      selectUpiInfoHelperOtpChannel.value = upiInfoOtpChannel;
    }
    if (typeof btnUpiInfoCardKeyPurchase !== 'undefined' && btnUpiInfoCardKeyPurchase) {
      btnUpiInfoCardKeyPurchase.style.display = upiInfoRowsVisible ? '' : 'none';
    }
    [
      typeof rowLegacyPayCountryCode !== 'undefined' ? rowLegacyPayCountryCode : null,
      typeof rowLegacyPayOtp !== 'undefined' ? rowLegacyPayOtp : null,
      typeof rowLegacyPayPin !== 'undefined' ? rowLegacyPayPin : null,
    ].forEach((row) => {
      if (!row) {
        return;
      }
      row.style.display = enabled && selectedMethod === legacyPayValue ? '' : 'none';
    });
  }
  
  function setSettingsCardLocked(locked) {
    if (!settingsCard) {
      return;
    }
    settingsCard.classList.toggle('is-locked', locked);
    settingsCard.toggleAttribute('inert', false);
    Array.from(settingsCard.children).forEach((child) => {
      const keepInteractive = child?.id === 'row-custom-email-pool'
        || child?.id === 'row-upi-redeem-cdkey-pool';
      child.toggleAttribute('inert', Boolean(locked && !keepInteractive));
    });
    updateAllUpiRedeemCdkeyPoolSummaries(latestState, { skipRender: true });
  }
  
  async function setRuntimeEmailState(email) {
    const normalizedEmail = String(email || '').trim() || null;
    const response = await chrome.runtime.sendMessage({
      type: 'SET_EMAIL_STATE',
      source: 'sidepanel',
      payload: { email: normalizedEmail },
    });
  
    if (response?.error) {
      throw new Error(response.error);
    }
  
    return normalizedEmail;
  }
  
  function isUpiInfoHelperCheckoutSelected() {
    const upiInfoValue = typeof PLUS_PAYMENT_METHOD_UPI_INFO_HELPER !== 'undefined' ? PLUS_PAYMENT_METHOD_UPI_INFO_HELPER : 'upiInfo-helper';
    const plusEnabled = typeof inputPlusModeEnabled !== 'undefined' && inputPlusModeEnabled
      ? Boolean(inputPlusModeEnabled.checked)
      : Boolean(latestState?.plusModeEnabled);
    return plusEnabled && getSelectedPlusPaymentMethod() === upiInfoValue;
  }
  
  async function showUpiInfoStartBlockedDialog(message) {
    await openConfirmModal({
      title: 'UPI_INFO 任务无法开启',
      message,
      confirmLabel: '知道了',
    });
  }
  
  async function refreshUpiInfoBalanceForStart() {
    const response = await chrome.runtime.sendMessage({
      type: 'REFRESH_UPI_INFO_CARD_BALANCE',
      source: 'sidepanel',
      payload: {
        legacyPayHelperApiUrl: inputUpiInfoHelperApi?.value || DEFAULT_UPI_INFO_HELPER_API_URL,
        legacyPayHelperApiKey: inputUpiInfoHelperCardKey?.value || latestState?.legacyPayHelperApiKey || '',
        reason: 'before_start',
      },
    });
    if (response?.error) {
      throw new Error(response.error);
    }
    const nextState = {
      legacyPayHelperBalance: response?.balance || latestState?.legacyPayHelperBalance || '',
      legacyPayHelperBalancePayload: response?.data || response?.payload?.data || response?.payload || latestState?.legacyPayHelperBalancePayload || null,
      legacyPayHelperBalanceUpdatedAt: response?.updatedAt || Date.now(),
      legacyPayHelperBalanceError: '',
      legacyPayHelperRemainingUses: getUpiInfoBalanceRemainingUsesFromResponse(response) ?? 0,
      legacyPayHelperAutoModeEnabled: getUpiInfoAutoModeEnabledFromResponse(response),
      legacyPayHelperApiKeyStatus: response?.apiKeyStatus || response?.data?.status || response?.payload?.data?.status || response?.payload?.status || '',
    };
    syncLatestState(nextState);
    if (displayUpiInfoHelperBalance && nextState.legacyPayHelperBalance) {
      displayUpiInfoHelperBalance.textContent = nextState.legacyPayHelperBalance;
    }
    updatePlusModeUI();
    return nextState;
  }
  
  async function ensureUpiInfoApiKeyReadyForStart(options = {}) {
    if (!isUpiInfoHelperCheckoutSelected()) {
      return true;
    }
    let balanceState;
    try {
      balanceState = await refreshUpiInfoBalanceForStart();
    } catch (error) {
      await showUpiInfoStartBlockedDialog(`API Key 余额校验失败：${error?.message || '未知错误'}。请先确认 API Key 是否正确。`);
      return false;
    }
  
    const remainingUses = normalizeUpiInfoRemainingUsesValue(balanceState.legacyPayHelperRemainingUses);
    const apiKeyStatus = String(balanceState.legacyPayHelperApiKeyStatus || '').trim().toLowerCase();
    if (apiKeyStatus && apiKeyStatus !== 'active') {
      await showUpiInfoStartBlockedDialog(`当前 UPI_INFO API Key 状态为 ${balanceState.legacyPayHelperApiKeyStatus}，不能开启任务。`);
      return false;
    }
    if (remainingUses !== null && remainingUses <= 0) {
      await showUpiInfoStartBlockedDialog('当前 UPI_INFO API Key 剩余次数不足，不能开启任务。');
      return false;
    }
  
    if (options?.notify) {
      showToast('UPI_INFO API Key 余额和权限校验通过。', 'success', 1800);
    }
    return true;
  }
  
  async function openPlusManualConfirmationDialog(options = {}) {
    const method = String(options.method || '').trim().toLowerCase();
    const legacyPayValue = typeof PLUS_PAYMENT_METHOD_LEGACY_PAY !== 'undefined' ? PLUS_PAYMENT_METHOD_LEGACY_PAY : 'legacyPay';
    if (method === 'legacyWallet-hosted-generic-error') {
      return openActionModal({
        title: String(options.title || '').trim() || 'LegacyWallet Checkout 异常',
        message: String(options.message || '').trim()
          || 'LegacyWallet Checkout 暂时不可用。请检查 PLUS 是否正常开通，或重新创建 ChatGPT 会话读取。',
        actions: [
          { id: 'cancel', label: '取消', variant: 'btn-ghost' },
          { id: 'check', label: '检查', variant: 'btn-outline' },
          { id: 'retry', label: '重试', variant: 'btn-primary' },
        ],
        alert: { text: '检查会打开 ChatGPT；重试会从创建 ChatGPT 会话读取 重新开始。', tone: 'info' },
      });
    }
    if (method === 'legacyPay-otp') {
      if (!sharedFormDialog?.open) {
        return null;
      }
      const result = await sharedFormDialog.open({
        title: String(options.title || '').trim() || 'UPI_INFO OTP 验证',
        message: String(options.message || '').trim() || '请在WhatsApp里面获取验证码（耐心等待三十秒左右）',
        fields: [
          {
            key: 'otp',
            label: 'OTP',
            type: 'text',
            placeholder: '请输入 OTP 验证码',
            inputMode: 'numeric',
            autocomplete: 'one-time-code',
            required: true,
            requiredMessage: '请输入 OTP 验证码。',
            normalize: (value) => String(value || '').trim().replace(/[^\d]/g, ''),
            validate: (value) => {
              const normalized = String(value || '').trim().replace(/[^\d]/g, '');
              if (!normalized) return '请输入 OTP 验证码。';
              if (!/^\d{6}$/.test(normalized)) return 'OTP 必须是 6 位数字，请检查。';
              return '';
            },
          },
        ],
        confirmLabel: '提交 OTP',
      });
      return result ? { action: 'confirm', otp: String(result.otp || '').trim().replace(/[^\d]/g, '') } : { action: 'cancel' };
    }
    const title = String(options.title || '').trim() || (method === legacyPayValue ? 'LegacyPay 订阅确认' : '手动确认');
    const message = String(options.message || '').trim()
      || (method === legacyPayValue
        ? '请在当前订阅页中手动完成 LegacyPay 订阅，完成后点击“我已完成订阅”继续。'
        : '请先在页面中完成当前手动操作，完成后点击确认继续。');
    return openActionModal({
      title,
      message,
      actions: [
        { id: 'cancel', label: '取消等待', variant: 'btn-ghost' },
        { id: 'confirm', label: '我已完成订阅', variant: 'btn-primary' },
      ],
      alert: method === legacyPayValue
        ? { text: '确认后流程会直接继续到 Plus 模式第 10 步 OAuth 登录。', tone: 'info' }
        : null,
    });
  }
  
  async function syncPlusManualConfirmationDialog() {
    const legacyPayValue = typeof PLUS_PAYMENT_METHOD_LEGACY_PAY !== 'undefined' ? PLUS_PAYMENT_METHOD_LEGACY_PAY : 'legacyPay';
    const requestId = String(latestState?.plusManualConfirmationRequestId || '').trim();
    const pending = Boolean(latestState?.plusManualConfirmationPending);
    if (!pending || !requestId || plusManualConfirmationDialogInFlight || activePlusManualConfirmationRequestId === requestId) {
      return;
    }
  
    const step = Number(latestState?.plusManualConfirmationStep) || 0;
    const method = String(latestState?.plusManualConfirmationMethod || '').trim().toLowerCase();
    const title = latestState?.plusManualConfirmationTitle;
    const message = latestState?.plusManualConfirmationMessage;
    activePlusManualConfirmationRequestId = requestId;
    plusManualConfirmationDialogInFlight = true;
    let shouldReopenDialog = false;
  
    try {
      const choice = await openPlusManualConfirmationDialog({
        method,
        title,
        message,
      });
      const currentRequestId = String(latestState?.plusManualConfirmationRequestId || '').trim();
      const stillPending = Boolean(latestState?.plusManualConfirmationPending);
      if (!stillPending || currentRequestId !== requestId) {
        return;
      }
      if (choice == null) {
        shouldReopenDialog = true;
        showToast('当前订阅确认仍在等待中，将重新弹出确认窗口。', 'info', 1800);
        return;
      }
  
      const choiceAction = String(choice?.action || choice || '').trim();
      const confirmed = choice === 'confirm'
        || choice?.action === 'confirm'
        || choiceAction === 'check'
        || choiceAction === 'retry';
      const response = await chrome.runtime.sendMessage({
        type: 'RESOLVE_PLUS_MANUAL_CONFIRMATION',
        source: 'sidepanel',
        payload: {
          step,
          requestId,
          confirmed,
          action: choiceAction,
          ...(choice?.otp ? { otp: choice.otp } : {}),
        },
      });
      if (response?.error) {
        throw new Error(response.error);
      }
      if (
        method === 'legacyWallet-hosted-generic-error'
        && choiceAction === 'check'
        && confirmed
        && response?.plusActive === false
      ) {
        shouldReopenDialog = true;
        showToast(
          response?.checkError
            ? `PLUS 状态检查失败：${response.checkError}`
            : '已刷新 ChatGPT 会话，但暂未检测到 PLUS 生效，将重新弹出确认窗口。',
          'warn',
          2600
        );
        return;
      }
      if (confirmed) {
        showToast(
          method === 'legacyPay-otp'
            ? 'UPI_INFO OTP 已提交，正在继续验证...'
            : (method === 'legacyWallet-hosted-generic-error'
              ? (choiceAction === 'check' ? '已检测到 PLUS 生效，正在继续下一步...' : '正在重新创建 ChatGPT 会话读取...')
              : (method === legacyPayValue ? 'LegacyPay 订阅已确认，正在继续 OAuth 登录...' : '已确认，流程继续执行中...')),
          'info',
          2200
        );
      } else {
        showToast(
          method === 'legacyPay-otp'
            ? '已取消 UPI_INFO OTP 输入。'
            : (method === legacyPayValue ? '已取消 LegacyPay 订阅等待。' : '已取消当前手动确认。'),
          'warn',
          2200
        );
      }
    } catch (error) {
      showToast(error?.message || String(error || '未知错误'), 'error');
    } finally {
      if (activePlusManualConfirmationRequestId === requestId) {
        activePlusManualConfirmationRequestId = '';
      }
      plusManualConfirmationDialogInFlight = false;
      if (
        shouldReopenDialog
        && latestState?.plusManualConfirmationPending
        && String(latestState?.plusManualConfirmationRequestId || '').trim() === requestId
      ) {
        setTimeout(() => {
          void syncPlusManualConfirmationDialog();
        }, 0);
      }
    }
  }
  
  async function clearRegistrationEmail(options = {}) {
    const { silent = false } = options;
    if (!inputEmail.value.trim() && !latestState?.email) {
      return;
    }
  
    inputEmail.value = '';
    syncLatestState({ email: null });
  
    try {
      await setRuntimeEmailState(null);
    } catch (err) {
      if (!silent) {
        showToast(`清空邮箱失败：${err.message}`, 'error');
      }
      throw err;
    }
  }
  

const settingsController = window.SidepanelSettingsController.createSettingsController({
  appState,
  scopeValues: buildSettingsControllerScopeValues(),
});
const {
  markSettingsDirty,
  updateSaveButtonState,
  scheduleSettingsAutoSave,
  scheduleSettingsSave,
  shouldUseSettingsCardAutosave,
  queueSettingsCardAutosaveFromEvent,
  flushDirtySettingsBeforePanelUnload,
  waitForSettingsSaveIdle,
  flushPendingSettingsBeforeExport,
  settlePendingSettingsBeforeImport,
  sendRuntimeMessageWithTimeout,
  buildCustomEmailPoolSettingsPayload,
  persistCustomEmailPoolSettings,
  persistCustomPasswordInput,
  saveSettings,
  persistCurrentSettingsForAction,
} = settingsController;
  function applyAutoRunStatus(payload = currentAutoRun) {
    syncAutoRunState(payload);
    const runLabel = getAutoRunLabel(currentAutoRun);
    const locked = isAutoRunLockedPhase();
    const paused = isAutoRunPausedPhase();
    const scheduled = isAutoRunScheduledPhase();
    const settingsCardLocked = scheduled || locked;
  
    setSettingsCardLocked(settingsCardLocked);
  
    inputRunCount.disabled = currentAutoRun.autoRunning || shouldLockRunCountToEmailPool();
    inputRunCount.title = shouldLockRunCountToEmailPool()
      ? '运行次数已跟随当前可用邮箱数量'
      : '';
    btnAutoRun.disabled = currentAutoRun.autoRunning;
    btnFetchEmail.disabled = locked
      || isCustomMailProvider()
      || usesCustomEmailPoolGenerator();
    inputEmail.disabled = locked;
  
    if (typeof inputSub2ApiAccountPriority !== 'undefined' && inputSub2ApiAccountPriority) {
      inputSub2ApiAccountPriority.disabled = locked;
    }
    inputAutoSkipFailures.checked = true;
    inputAutoSkipFailures.disabled = scheduled;
    if (inputAutoRunRetryNonFreeTrial) {
      inputAutoRunRetryNonFreeTrial.disabled = scheduled;
    }
    if (inputAutoRunRetryLegacyWalletCallback) {
      inputAutoRunRetryLegacyWalletCallback.disabled = scheduled;
    }
    if (inputRemovedContactCardDeclinedRetryEnabled) {
      inputRemovedContactCardDeclinedRetryEnabled.disabled = scheduled;
    }
  
    const isSyncPhase = typeof isAutoRunSourceSyncPhase === 'function'
      ? isAutoRunSourceSyncPhase
      : (phase) => ['scheduled', 'running', 'waiting_step', 'waiting_email', 'retrying', 'waiting_interval'].includes(phase);
    const shouldSyncRunCount = typeof shouldSyncRunCountFromAutoRunSource === 'function'
      ? shouldSyncRunCountFromAutoRunSource(currentAutoRun)
      : (currentAutoRun.autoRunning || isSyncPhase(currentAutoRun.phase));
    if (shouldSyncRunCount && currentAutoRun.totalRuns > 0) {
      inputRunCount.value = String(currentAutoRun.totalRuns);
    }
  
    switch (currentAutoRun.phase) {
      case 'scheduled':
        autoContinueBar.style.display = 'none';
        btnAutoRun.innerHTML = `已计划${runLabel}`;
        break;
      case 'waiting_step':
        autoContinueBar.style.display = 'none';
        btnAutoRun.innerHTML = `等待中${runLabel}`;
        break;
      case 'waiting_email':
        autoContinueBar.style.display = 'flex';
        btnAutoRun.innerHTML = `已暂停${runLabel}`;
        break;
      case 'running':
        autoContinueBar.style.display = 'none';
        btnAutoRun.innerHTML = `运行中${runLabel}`;
        break;
      case 'retrying':
        autoContinueBar.style.display = 'none';
        btnAutoRun.innerHTML = `重试中${runLabel}`;
        break;
      case 'waiting_interval':
        autoContinueBar.style.display = 'none';
        btnAutoRun.innerHTML = `等待中${runLabel}`;
        break;
      default:
        autoContinueBar.style.display = 'none';
        setDefaultAutoRunButton();
        inputEmail.disabled = false;
        if (!locked) {
          btnFetchEmail.disabled = isCustomMailProvider() || usesCustomEmailPoolGenerator();
        }
        break;
    }
  
    updateAutoDelayInputState();
    updateFallbackThreadIntervalInputState();
    syncScheduledCountdownTicker();
    updateStopButtonState(scheduled || paused || locked || Object.values(getStepStatuses()).some(status => status === 'running'));
    updateConfigMenuControls();
    renderContributionMode();
  }
  
  settingsFieldBindings.bindInput(inputVpsUrl, {
    key: 'vpsUrl',
    normalize: (value) => String(value || '').trim(),
  });
  settingsFieldBindings.bindBlur(inputVpsUrl, {
    afterBlur: () => saveSettings({ silent: true }).catch(() => { }),
  });
  
  settingsFieldBindings.bindInput(inputVpsPassword, {
    key: 'vpsPassword',
  });
  settingsFieldBindings.bindBlur(inputVpsPassword, {
    afterBlur: () => saveSettings({ silent: true }).catch(() => { }),
  });
  
  [inputHotmailRemoteBaseUrl, inputHotmailLocalBaseUrl].forEach((input) => {
    input?.addEventListener('input', () => {
      markSettingsDirty(true);
      scheduleSettingsAutoSave();
    });
    input?.addEventListener('blur', () => {
      saveSettings({ silent: true }).catch(() => { });
    });
  });
  
  [inputLuckmailApiKey, inputLuckmailBaseUrl, inputLuckmailDomain].forEach((input) => {
    input?.addEventListener('input', () => {
      markSettingsDirty(true);
      scheduleSettingsAutoSave();
    });
    input?.addEventListener('blur', () => {
      saveSettings({ silent: true }).catch(() => { });
    });
  });
  
  selectLuckmailEmailType?.addEventListener('change', () => {
    markSettingsDirty(true);
    saveSettings({ silent: true }).catch(() => { });
  });
  
  settingsFieldBindings.bindInput(inputPassword, {
    key: 'customPassword',
    afterChange: (value) => {
      syncLatestState({ customPassword: value });
      updateButtonStates();
      persistCustomPasswordInput({ silent: true }).catch(() => { });
    },
  });
  settingsFieldBindings.bindBlur(inputPassword, {
    afterBlur: () => {
      persistCustomPasswordInput({ silent: true }).catch(() => { });
      saveSettings({ silent: true }).catch(() => { });
    },
  });
  
  inputPlusModeEnabled?.addEventListener('change', () => {
    updatePlusModeUI();
    updateSignupMethodUI({ notify: true });
    const stepDefinitionState = typeof resolveStepDefinitionCapabilityState === 'function'
      ? resolveStepDefinitionCapabilityState({
        ...(latestState || {}),
        plusModeEnabled: Boolean(inputPlusModeEnabled.checked),
        signupMethod: getSelectedSignupMethod(),
      }, {
        signupMethod: getSelectedSignupMethod(),
      })
      : {
        plusModeEnabled: Boolean(inputPlusModeEnabled.checked),
        signupMethod: getSelectedSignupMethod(),
      };
    syncStepDefinitionsForMode(stepDefinitionState.plusModeEnabled, getSelectedPlusPaymentMethod(), {
      render: true,
      signupMethod: stepDefinitionState.signupMethod,
      plusAccountAccessStrategy: stepDefinitionState.plusAccountAccessStrategy,
      upiRedeemStopAfterRedeem: getSelectedUpiRedeemStopAfterRedeem(latestState),
      totpMfaAfterProfileEnabled: getSelectedTotpMfaAfterProfileEnabled(latestState),
    });
    validateRemovedContactContactConfig();
    markSettingsDirty(true);
    saveSettings({ silent: true }).catch(() => { });
  });
  
  [inputChatgptSessionReaderModeUs, inputChatgptSessionReaderModeJp].filter(Boolean).forEach((input) => {
    input.addEventListener('change', () => {
      if (!input.checked) {
        return;
      }
      handleChatgptSessionReaderModeSelectionChange(input.value);
    });
  });
  
  inputOperationDelayEnabled?.addEventListener('change', () => {
    persistOperationDelayToggle().catch(() => { });
  });
  
  selectPlusPaymentMethod?.addEventListener('change', () => {
    selectPlusPaymentMethod.value = normalizePlusPaymentMethod(selectPlusPaymentMethod.value);
    updatePlusModeUI();
    const stepDefinitionState = typeof resolveStepDefinitionCapabilityState === 'function'
      ? resolveStepDefinitionCapabilityState({
        ...(latestState || {}),
        plusModeEnabled: Boolean(inputPlusModeEnabled?.checked),
        signupMethod: getSelectedSignupMethod(),
      }, {
        signupMethod: getSelectedSignupMethod(),
      })
      : {
        plusModeEnabled: Boolean(inputPlusModeEnabled?.checked),
        signupMethod: getSelectedSignupMethod(),
      };
    syncStepDefinitionsForMode(stepDefinitionState.plusModeEnabled, selectPlusPaymentMethod.value, {
      render: true,
      signupMethod: stepDefinitionState.signupMethod,
      plusAccountAccessStrategy: stepDefinitionState.plusAccountAccessStrategy,
      upiRedeemStopAfterRedeem: getSelectedUpiRedeemStopAfterRedeem(latestState),
      totpMfaAfterProfileEnabled: getSelectedTotpMfaAfterProfileEnabled(latestState),
    });
    validateRemovedContactContactConfig();
    markSettingsDirty(true);
    saveSettings({ silent: true }).catch(() => { });
  });
  
  btnUpiInfoCardKeyPurchase?.addEventListener('click', () => {
    showToast('已移除默认购买入口，请自行准备和配置你的服务。', 'info');
  });
  
  btnUpiInfoHelperConvertApiKey?.addEventListener('click', () => {
    showToast('请填写你自己的 UPI_INFO API 地址和 API Key。', 'info');
  });
  
  btnUpiInfoHelperBalance?.addEventListener('click', async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'REFRESH_UPI_INFO_CARD_BALANCE',
        source: 'sidepanel',
        payload: {
          legacyPayHelperApiUrl: inputUpiInfoHelperApi?.value || DEFAULT_UPI_INFO_HELPER_API_URL,
          legacyPayHelperApiKey: inputUpiInfoHelperCardKey?.value || '',
          reason: 'manual',
        },
      });
      if (response?.error) {
        throw new Error(response.error);
      }
      if (displayUpiInfoHelperBalance) {
        displayUpiInfoHelperBalance.textContent = response?.balance || '余额已更新';
      }
      const nextState = {
        legacyPayHelperBalance: response?.balance || latestState?.legacyPayHelperBalance || '',
        legacyPayHelperBalancePayload: response?.data || response?.payload?.data || response?.payload || latestState?.legacyPayHelperBalancePayload || null,
        legacyPayHelperBalanceUpdatedAt: response?.updatedAt || Date.now(),
        legacyPayHelperBalanceError: '',
        legacyPayHelperRemainingUses: getUpiInfoBalanceRemainingUsesFromResponse(response) ?? 0,
        legacyPayHelperAutoModeEnabled: getUpiInfoAutoModeEnabledFromResponse(response),
        legacyPayHelperApiKeyStatus: response?.apiKeyStatus || response?.data?.status || response?.payload?.data?.status || response?.payload?.status || '',
      };
      const nextAutoModePermission = getUpiInfoAutoModePermissionFromPayload(nextState.legacyPayHelperBalancePayload);
      const nextAutoModeDenied = nextAutoModePermission === false;
      const nextAutoModeConfirmed = nextAutoModePermission === true || nextState.legacyPayHelperAutoModeEnabled;
      syncLatestState(nextState);
      if (nextAutoModeDenied) {
        showToast('UPI_INFO 余额已更新，当前 API Key 未返回自动权限。', 'success');
      } else if (nextAutoModeConfirmed) {
        showToast('UPI_INFO 余额已更新。', 'success');
      } else {
        showToast('UPI_INFO 余额已更新。', 'success');
      }
      updatePlusModeUI();
    } catch (error) {
      showToast(error?.message || '查询 UPI_INFO 余额失败。', 'error');
    }
  });
  
  bindCdkPoolEvents();
  
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clearUpiRedeemCdkeyStatusAutoRefresh();
      flushDirtySettingsBeforePanelUnload();
      return;
    }
    scheduleUpiRedeemCdkeyStatusAutoRefresh({ immediate: true });
  });
  
  window.addEventListener('pagehide', () => {
    clearUpiRedeemCdkeyStatusAutoRefresh();
    flushDirtySettingsBeforePanelUnload();
  });
  
  window.addEventListener('beforeunload', () => {
    clearUpiRedeemCdkeyStatusAutoRefresh();
    flushDirtySettingsBeforePanelUnload();
  });
  
  selectPlusPaymentMethod?.addEventListener('change', () => {
    updatePlusModeUI();
    const stepDefinitionState = typeof resolveStepDefinitionCapabilityState === 'function'
      ? resolveStepDefinitionCapabilityState({
        ...(latestState || {}),
        plusModeEnabled: Boolean(inputPlusModeEnabled?.checked),
        signupMethod: getSelectedSignupMethod(),
      }, {
        signupMethod: getSelectedSignupMethod(),
      })
      : {
        plusModeEnabled: Boolean(inputPlusModeEnabled?.checked),
        signupMethod: getSelectedSignupMethod(),
      };
    syncStepDefinitionsForMode(stepDefinitionState.plusModeEnabled, {
      render: true,
      plusPaymentMethod: selectPlusPaymentMethod.value,
      signupMethod: stepDefinitionState.signupMethod,
      plusAccountAccessStrategy: stepDefinitionState.plusAccountAccessStrategy,
      upiRedeemStopAfterRedeem: getSelectedUpiRedeemStopAfterRedeem(latestState),
      totpMfaAfterProfileEnabled: getSelectedTotpMfaAfterProfileEnabled(latestState),
    });
    validateRemovedContactContactConfig();
    markSettingsDirty(true);
    saveSettings({ silent: true }).catch(() => { });
  });
  
  [
    inputUpiInfoHelperApi,
    inputUpiInfoHelperCardKey,
    selectUpiInfoHelperCountryCode,
    selectUpiInfoHelperOtpChannel,
    inputUpiInfoHelperPin,
    inputUpiSubscriptionApiBaseUrl,
    inputUpiRedeemExternalApiKey,
    inputUpiRedeemClientId,
    inputUpiRedeemFailedAccountRetryLimit,
    inputTotpMfaAfterProfileEnabled,
    selectRegistrationFreeRoute,
    inputSetGptPasswordVerificationWaitSeconds,
    inputUpiCredentialMembershipTotpApiBaseUrl,
    inputUpiCredentialMembershipTotpLookupKey,
    selectUpiRedeemAfterMode,
    inputUpiRedeemStopAfterRedeem,
    selectLegacyPayCountryCode,
    inputLegacyPayOtp,
    inputLegacyPayPin,
    inputIdealRedeemCdkeyPool,
  ].forEach((input) => {
    input?.addEventListener('input', () => {
      if (input === inputUpiRedeemCdkeyPool || input === inputIdealRedeemCdkeyPool) {
        updateUpiRedeemCdkeyPoolSummary(latestState, {
          channel: input === inputIdealRedeemCdkeyPool ? 'ideal' : 'upi',
        });
      }
      if (
        input === inputUpiRedeemExternalApiKey
        || input === inputUpiRedeemClientId
        || input === inputUpiRedeemCdkeyPool
        || input === inputIdealRedeemCdkeyPool
      ) {
        scheduleUpiRedeemCdkeyStatusAutoRefresh({ immediate: true });
      }
      if (input === selectUpiRedeemAfterMode || input === inputUpiRedeemStopAfterRedeem) {
        syncUpiRedeemAfterModeStepDefinitions();
      }
      if (input === inputTotpMfaAfterProfileEnabled) {
        syncTotpMfaAfterProfileStepDefinitions();
      }
      if (input === selectRegistrationFreeRoute) {
        syncTotpMfaAfterProfileStepDefinitions();
      }
      if (input === inputSetGptPasswordVerificationWaitSeconds) {
        mirrorSharedVerificationCodeWaitInput(input);
      }
      markSettingsDirty(true);
      scheduleSettingsAutoSave();
    });
    input?.addEventListener('change', () => {
      if (input === selectUpiRedeemAfterMode || input === inputUpiRedeemStopAfterRedeem) {
        syncUpiRedeemAfterModeStepDefinitions();
      }
      if (input === inputTotpMfaAfterProfileEnabled) {
        syncTotpMfaAfterProfileStepDefinitions();
      }
      if (input === selectRegistrationFreeRoute) {
        syncTotpMfaAfterProfileStepDefinitions();
      }
      if (input === selectUpiInfoHelperOtpChannel) {
        updatePlusModeUI();
      }
      if (
        input === inputUpiRedeemExternalApiKey
        || input === inputUpiRedeemClientId
        || input === inputUpiRedeemCdkeyPool
        || input === inputIdealRedeemCdkeyPool
      ) {
        scheduleUpiRedeemCdkeyStatusAutoRefresh({ immediate: true });
      }
      markSettingsDirty(true);
      saveSettings({ silent: true }).catch(() => { });
    });
    input?.addEventListener('blur', () => {
      saveSettings({ silent: true }).catch(() => { });
    });
  });
  
  selectMailProvider.addEventListener('change', async () => {
    const previousProvider = latestState?.mailProvider || '';
    const previousMail2925Mode = latestState?.mail2925Mode;
    const nextProvider = selectMailProvider.value;
    syncManagedAliasBaseEmailDraftFromInput(previousProvider);
    setManagedAliasBaseEmailInputForProvider(nextProvider, latestState);
    updateMailProviderUI();
    const leavingHotmail = previousProvider === 'hotmail-api'
      && nextProvider !== 'hotmail-api'
      && isCurrentEmailManagedByHotmail();
    const leavingLuckmail = previousProvider === LUCKMAIL_PROVIDER
      && nextProvider !== LUCKMAIL_PROVIDER
      && isCurrentEmailManagedByLuckmail();
    const leavingGeneratedAlias = (
      previousProvider !== nextProvider
      || (previousProvider === '2925' && normalizeMail2925Mode(previousMail2925Mode) !== getSelectedMail2925Mode())
    ) && usesGeneratedAliasMailProvider(previousProvider, previousMail2925Mode)
      && isCurrentEmailManagedByGeneratedAlias(previousProvider, latestState, previousMail2925Mode);
    if (leavingHotmail || leavingLuckmail || leavingGeneratedAlias) {
      await clearRegistrationEmail({ silent: true }).catch(() => { });
    }
    if (nextProvider === '2925' && Boolean(inputMail2925UseAccountPool?.checked)) {
      syncMail2925PoolAccountOptions(latestState);
      if (!selectMail2925PoolAccount.value && getMail2925Accounts().length > 0) {
        selectMail2925PoolAccount.value = String(getMail2925Accounts()[0]?.id || '');
      }
      await syncSelectedMail2925PoolAccount({ silent: true }).catch(() => { });
    }
    if (nextProvider === LUCKMAIL_PROVIDER) {
      queueLuckmailPurchaseRefresh();
    }
    markSettingsDirty(true);
    saveSettings({ silent: true }).catch(() => { });
  });
  
  mail2925ModeButtons.forEach((button) => {
    button.addEventListener('click', async () => {
      const nextMode = normalizeMail2925Mode(button.dataset.mail2925Mode);
      const previousMode = normalizeMail2925Mode(latestState?.mail2925Mode);
      if (nextMode === getSelectedMail2925Mode()) {
        return;
      }
  
      setMail2925Mode(nextMode);
      updateMailProviderUI();
  
      const leavingGeneratedAlias = selectMailProvider.value === '2925'
        && previousMode === MAIL_2925_MODE_PROVIDE
        && nextMode !== MAIL_2925_MODE_PROVIDE
        && isCurrentEmailManagedByGeneratedAlias('2925', latestState, previousMode);
      if (leavingGeneratedAlias) {
        await clearRegistrationEmail({ silent: true }).catch(() => { });
      }
  
      markSettingsDirty(true);
      saveSettings({ silent: true }).catch(() => { });
    });
  });
  
  tempEmailLookupModeButtons.forEach((button) => {
    button.addEventListener('click', async () => {
      const nextMode = normalizeCloudflareTempEmailLookupMode(button.dataset.tempEmailLookupMode);
      const previousMode = getSelectedCloudflareTempEmailLookupMode();
      if (nextMode === previousMode) {
        return;
      }
  
      if (nextMode === CLOUDFLARE_TEMP_EMAIL_LOOKUP_MODE_REGISTRATION_EMAIL) {
        const confirmed = await confirmCloudflareTempEmailRegistrationLookupIfNeeded();
        if (!confirmed) {
          setCloudflareTempEmailLookupMode(previousMode);
          updateMailProviderUI();
          return;
        }
      }
  
      setCloudflareTempEmailLookupMode(nextMode);
      updateMailProviderUI();
      markSettingsDirty(true);
      saveSettings({ silent: true }).catch(() => { });
    });
  });
  
  selectEmailGenerator.addEventListener('change', () => {
    updateMailProviderUI();
    clearRegistrationEmail({ silent: true }).catch(() => { });
    markSettingsDirty(true);
    saveSettings({ silent: true }).catch(() => { });
  });
  
  selectIcloudHostPreference?.addEventListener('change', () => {
    updateMailProviderUI();
    markSettingsDirty(true);
    saveSettings({ silent: true }).catch(() => { });
    if (getSelectedEmailGenerator() === 'icloud') {
      queueIcloudAliasRefresh();
    }
  });
  
  selectIcloudTargetMailboxType?.addEventListener('change', () => {
    updateMailProviderUI();
    markSettingsDirty(true);
    saveSettings({ silent: true }).catch(() => { });
  });
  
  selectIcloudForwardMailProvider?.addEventListener('change', () => {
    updateMailProviderUI();
    markSettingsDirty(true);
    saveSettings({ silent: true }).catch(() => { });
  });
  
  selectIcloudFetchMode?.addEventListener('change', () => {
    markSettingsDirty(true);
    saveSettings({ silent: true }).catch(() => { });
  });
  
  checkboxAutoDeleteIcloud?.addEventListener('change', () => {
    markSettingsDirty(true);
    saveSettings({ silent: true }).catch(() => { });
  });
  
  selectPanelMode.addEventListener('change', async () => {
    const previousPanelMode = normalizePanelMode(latestState?.panelMode || DEFAULT_PANEL_MODE);
    const previousExportTarget = getExportTargetForPanelMode(previousPanelMode);
    const previousStrategyUiValue = getAccountAccessStrategyUiValueForState(latestState);
    try {
      const nextExportTarget = getExportTargetForPanelMode(selectPanelMode.value);
      selectPanelMode.value = nextExportTarget;
      if (nextExportTarget === 'codex2api' && selectAccountAccessStrategy) {
        selectAccountAccessStrategy.value = ACCOUNT_ACCESS_STRATEGY_UI_OAUTH;
      }
      updatePanelModeUI();
      const nextExportSettings = getSelectedExportSettings();
      const nextPanelMode = getSelectedPanelMode();
      syncLatestState({
        panelMode: nextPanelMode,
        plusAccountAccessStrategy: nextExportSettings.plusAccountAccessStrategy,
      });
      syncStepDefinitionsForMode(currentPlusModeEnabled, {
        activeFlowId: latestState?.activeFlowId,
        panelMode: nextPanelMode,
        plusPaymentMethod: currentPlusPaymentMethod,
        plusAccountAccessStrategy: nextExportSettings.plusAccountAccessStrategy,
        signupMethod: currentSignupMethod,
        upiRedeemStopAfterRedeem: getSelectedUpiRedeemStopAfterRedeem(latestState),
        totpMfaAfterProfileEnabled: getSelectedTotpMfaAfterProfileEnabled(latestState),
      });
      updatePanelModeUI();
      markSettingsDirty(true);
      saveSettings({ silent: true }).catch((error) => {
        console.error('Failed to save panel mode setting:', error);
        showToast(`保存导出模式失败：${error.message}`, 'error');
      });
    } catch (error) {
      console.error('Failed to switch panel mode:', error);
      selectPanelMode.value = previousExportTarget;
      if (selectAccountAccessStrategy) {
        selectAccountAccessStrategy.value = previousStrategyUiValue;
      }
      updatePanelModeUI();
      showToast(`切换导出模式失败：${error.message}`, 'error');
    }
  });
  
  selectAccountAccessStrategy?.addEventListener('change', async () => {
    const previousPanelMode = normalizePanelMode(latestState?.panelMode || DEFAULT_PANEL_MODE);
    const previousExportTarget = getExportTargetForPanelMode(previousPanelMode);
    const previousStrategyUiValue = getAccountAccessStrategyUiValueForState(latestState);
    try {
      if (getSelectedExportTarget() === 'codex2api') {
        selectAccountAccessStrategy.value = ACCOUNT_ACCESS_STRATEGY_UI_OAUTH;
      } else {
        selectAccountAccessStrategy.value = normalizeAccountAccessStrategyUiValue(selectAccountAccessStrategy.value);
      }
      const nextExportSettings = getSelectedExportSettings();
      syncLatestState({
        panelMode: nextExportSettings.panelMode,
        plusAccountAccessStrategy: nextExportSettings.plusAccountAccessStrategy,
        signupMethod: SIGNUP_METHOD_EMAIL,
      });
      const stepDefinitionState = resolveStepDefinitionCapabilityState({
        ...(latestState || {}),
        panelMode: nextExportSettings.panelMode,
        plusAccountAccessStrategy: nextExportSettings.plusAccountAccessStrategy,
        signupMethod: SIGNUP_METHOD_EMAIL,
      }, {
        panelMode: nextExportSettings.panelMode,
        plusAccountAccessStrategy: nextExportSettings.plusAccountAccessStrategy,
        signupMethod: SIGNUP_METHOD_EMAIL,
      });
      syncStepDefinitionsForMode(currentPlusModeEnabled, {
        activeFlowId: latestState?.activeFlowId,
        panelMode: nextExportSettings.panelMode,
        plusPaymentMethod: currentPlusPaymentMethod,
        plusAccountAccessStrategy: stepDefinitionState.plusAccountAccessStrategy,
        signupMethod: stepDefinitionState.signupMethod,
        upiRedeemStopAfterRedeem: getSelectedUpiRedeemStopAfterRedeem(latestState),
        totpMfaAfterProfileEnabled: getSelectedTotpMfaAfterProfileEnabled(latestState),
      });
      updateSignupMethodUI();
      updatePanelModeUI();
      markSettingsDirty(true);
      saveSettings({ silent: true }).catch((error) => {
        console.error('Failed to save account access strategy setting:', error);
        showToast(`保存账号接入策略失败：${error.message}`, 'error');
      });
    } catch (error) {
      console.error('Failed to switch account access strategy:', error);
      selectPanelMode.value = previousExportTarget;
      selectAccountAccessStrategy.value = previousStrategyUiValue;
      updatePanelModeUI();
      showToast(`切换账号接入策略失败：${error.message}`, 'error');
    }
  });
  
  selectCfDomain.addEventListener('change', () => {
    if (selectCfDomain.disabled) {
      return;
    }
    markSettingsDirty(true);
    saveSettings({ silent: true }).catch(() => { });
  });
  
  selectTempEmailDomain.addEventListener('change', () => {
    if (selectTempEmailDomain.disabled) {
      return;
    }
    markSettingsDirty(true);
    saveSettings({ silent: true }).catch(() => { });
  });
  
  btnCfDomainMode.addEventListener('click', async () => {
    try {
      if (!cloudflareDomainEditMode) {
        setCloudflareDomainEditMode(true, { clearInput: true });
        return;
      }
  
      const newDomain = normalizeCloudflareDomainValue(inputCfDomain.value);
      if (!newDomain) {
        showToast('请输入有效的 Cloudflare 域名。', 'warn');
        inputCfDomain.focus();
        return;
      }
  
      const { domains } = getCloudflareDomainsFromState();
      await saveCloudflareDomainSettings([...domains, newDomain], newDomain);
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
  
  btnTempEmailDomainMode.addEventListener('click', async () => {
    try {
      await syncCloudflareTempEmailDomainsFromService();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
  
  inputCfDomain.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      btnCfDomainMode.click();
    }
  });
  
  inputTempEmailDomain.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      btnTempEmailDomainMode.click();
    }
  });
  
  inputSub2ApiUrl.addEventListener('input', () => {
    markSettingsDirty(true);
    scheduleSettingsAutoSave();
  });
  inputSub2ApiUrl.addEventListener('blur', () => {
    saveSettings({ silent: true }).catch(() => { });
  });
  
  inputSub2ApiEmail.addEventListener('input', () => {
    markSettingsDirty(true);
    scheduleSettingsAutoSave();
  });
  inputSub2ApiEmail.addEventListener('blur', () => {
    saveSettings({ silent: true }).catch(() => { });
  });
  
  inputSub2ApiPassword.addEventListener('input', () => {
    markSettingsDirty(true);
    scheduleSettingsAutoSave();
  });
  inputSub2ApiPassword.addEventListener('blur', () => {
    saveSettings({ silent: true }).catch(() => { });
  });
  
  inputSub2ApiGroup.addEventListener('change', () => {
    syncLatestState({
      sub2apiGroupName: getSelectedSub2ApiGroupName(),
      sub2apiGroupNames: normalizeSub2ApiGroupOptions(
        getSub2ApiGroupOptionsState(latestState),
        getSelectedSub2ApiGroupName()
      ),
    });
    markSettingsDirty(true);
    saveSettings({ silent: true }).catch(() => { });
  });
  
  inputSub2ApiAccountPriority.addEventListener('input', () => {
    markSettingsDirty(true);
    scheduleSettingsAutoSave();
  });
  inputSub2ApiAccountPriority.addEventListener('blur', () => {
    inputSub2ApiAccountPriority.value = String(normalizeSub2ApiAccountPriorityValue(inputSub2ApiAccountPriority.value));
    saveSettings({ silent: true }).catch(() => { });
  });
  
  btnAddSub2ApiGroup?.addEventListener('click', () => {
    handleAddSub2ApiGroup().catch((error) => {
      showToast(error?.message || '添加 SUB2API 分组失败。', 'error');
    });
  });
  
  inputSub2ApiDefaultProxy?.addEventListener('input', () => {
    markSettingsDirty(true);
    scheduleSettingsAutoSave();
  });
  inputSub2ApiDefaultProxy?.addEventListener('blur', () => {
    saveSettings({ silent: true }).catch(() => { });
  });
  
  inputCodex2ApiUrl.addEventListener('input', () => {
    markSettingsDirty(true);
    scheduleSettingsAutoSave();
  });
  inputCodex2ApiUrl.addEventListener('blur', () => {
    saveSettings({ silent: true }).catch(() => { });
  });
  
  inputCodex2ApiAdminKey.addEventListener('input', () => {
    markSettingsDirty(true);
    scheduleSettingsAutoSave();
  });
  inputCodex2ApiAdminKey.addEventListener('blur', () => {
    saveSettings({ silent: true }).catch(() => { });
  });
  
  settingsFieldBindings.bindInput(inputEmailPrefix, {
    afterChange: () => {
      maybeClearGeneratedAliasAfterEmailPrefixChange().catch(() => { });
      syncManagedAliasBaseEmailDraftFromInput();
      scheduleSettingsSave();
    },
  });
  settingsFieldBindings.bindBlur(inputEmailPrefix, {
    afterBlur: () => {
      maybeClearGeneratedAliasAfterEmailPrefixChange().catch(() => { });
      syncManagedAliasBaseEmailDraftFromInput();
      saveSettings({ silent: true }).catch(() => { });
    },
  });
  
  inputCustomEmailPool?.addEventListener('input', () => {
    syncRunCountFromConfiguredEmailPool();
    updateMailProviderUI();
    markSettingsDirty(true);
    scheduleSettingsAutoSave();
  });
  inputCustomEmailPool?.addEventListener('blur', () => {
    inputCustomEmailPool.value = normalizeCustomEmailPoolEntries(inputCustomEmailPool.value).join('\n');
    syncRunCountFromConfiguredEmailPool();
    updateMailProviderUI();
    saveSettings({ silent: true }).catch(() => { });
  });
  
  inputCustomMailProviderPool?.addEventListener('input', () => {
    syncRunCountFromConfiguredEmailPool();
    updateMailProviderUI();
    markSettingsDirty(true);
    scheduleSettingsAutoSave();
  });
  inputCustomMailProviderPool?.addEventListener('blur', () => {
    inputCustomMailProviderPool.value = normalizeCustomEmailPoolEntries(inputCustomMailProviderPool.value).join('\n');
    syncRunCountFromConfiguredEmailPool();
    updateMailProviderUI();
    saveSettings({ silent: true }).catch(() => { });
  });
  
  inputSignupVerificationCodeWaitSeconds?.addEventListener('input', () => {
    mirrorSharedVerificationCodeWaitInput(inputSignupVerificationCodeWaitSeconds);
    markSettingsDirty(true);
    scheduleSettingsAutoSave();
  });
  inputSetGptPasswordVerificationWaitSeconds?.addEventListener('blur', () => {
    setSharedVerificationCodeWaitInputs(
      inputSetGptPasswordVerificationWaitSeconds.value,
      latestState?.setGptPasswordVerificationWaitSeconds ?? latestState?.signupVerificationCodeWaitSeconds
    );
    saveSettings({ silent: true }).catch(() => { });
  });
  inputSignupVerificationCodeWaitSeconds?.addEventListener('blur', () => {
    setSharedVerificationCodeWaitInputs(
      inputSignupVerificationCodeWaitSeconds.value,
      latestState?.setGptPasswordVerificationWaitSeconds ?? latestState?.signupVerificationCodeWaitSeconds
    );
    saveSettings({ silent: true }).catch(() => { });
  });
  
  selectMail2925PoolAccount?.addEventListener('change', async () => {
    try {
      await syncSelectedMail2925PoolAccount();
      markSettingsDirty(true);
      saveSettings({ silent: true }).catch(() => { });
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
  
  inputMail2925UseAccountPool?.addEventListener('change', async () => {
    const enabled = Boolean(inputMail2925UseAccountPool.checked);
    syncLatestState({ mail2925UseAccountPool: enabled });
    if (enabled) {
      syncMail2925PoolAccountOptions(latestState);
      if (!selectMail2925PoolAccount.value && getMail2925Accounts().length > 0) {
        selectMail2925PoolAccount.value = String(getMail2925Accounts()[0]?.id || '');
      }
      try {
        await syncSelectedMail2925PoolAccount({ silent: true });
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
    setManagedAliasBaseEmailInputForProvider('2925', latestState);
    updateMailProviderUI();
    markSettingsDirty(true);
    saveSettings({ silent: true }).catch(() => { });
  });
  
  settingsFieldBindings.bindInput(inputInbucketMailbox, {
    key: 'inbucketMailbox',
    normalize: (value) => String(value || '').trim(),
  });
  settingsFieldBindings.bindBlur(inputInbucketMailbox, {
    afterBlur: () => saveSettings({ silent: true }).catch(() => { }),
  });
  
  settingsFieldBindings.bindInput(inputInbucketHost, {
    key: 'inbucketHost',
    normalize: (value) => String(value || '').trim(),
  });
  settingsFieldBindings.bindBlur(inputInbucketHost, {
    afterBlur: () => saveSettings({ silent: true }).catch(() => { }),
  });
  
  settingsFieldBindings.bindInput(inputRunCount, {
    afterChange: () => {
      clearPendingAutoRunStartRunCount();
      updateFallbackThreadIntervalInputState();
    },
  });
  settingsFieldBindings.bindBlur(inputRunCount, {
    afterBlur: () => {
      inputRunCount.value = String(getRunCountValue());
      updateFallbackThreadIntervalInputState();
    },
  });
  
  inputAutoSkipFailures.addEventListener('change', async () => {
    if (!inputAutoSkipFailures.checked) {
      inputAutoSkipFailures.checked = true;
      showToast('主流程已固定为失败自动继续，直到邮箱池/轮次用完。', 'info', 2200);
    }
    updateFallbackThreadIntervalInputState();
    markSettingsDirty(true);
    saveSettings({ silent: true }).catch(() => { });
  });
  
  inputAutoRunRetryNonFreeTrial?.addEventListener('change', () => {
    markSettingsDirty(true);
    saveSettings({ silent: true }).catch(() => { });
  });
  
  inputAutoRunRetryLegacyWalletCallback?.addEventListener('change', () => {
    markSettingsDirty(true);
    saveSettings({ silent: true }).catch(() => { });
  });
  
  inputTempEmailBaseUrl.addEventListener('input', () => {
    markSettingsDirty(true);
    scheduleSettingsAutoSave();
  });
  inputTempEmailBaseUrl.addEventListener('blur', () => {
    inputTempEmailBaseUrl.value = normalizeCloudflareTempEmailBaseUrlValue(inputTempEmailBaseUrl.value);
    saveSettings({ silent: true }).catch(() => { });
  });
  
  inputTempEmailAdminAuth.addEventListener('input', () => {
    markSettingsDirty(true);
    scheduleSettingsAutoSave();
  });
  inputTempEmailAdminAuth.addEventListener('blur', () => {
    saveSettings({ silent: true }).catch(() => { });
  });
  
  inputTempEmailCustomAuth.addEventListener('input', () => {
    markSettingsDirty(true);
    scheduleSettingsAutoSave();
  });
  inputTempEmailCustomAuth.addEventListener('blur', () => {
    saveSettings({ silent: true }).catch(() => { });
  });
  
  inputTempEmailReceiveMailbox.addEventListener('input', () => {
    markSettingsDirty(true);
    scheduleSettingsAutoSave();
  });
  inputTempEmailReceiveMailbox.addEventListener('blur', () => {
    inputTempEmailReceiveMailbox.value = normalizeCloudflareTempEmailReceiveMailboxValue(inputTempEmailReceiveMailbox.value);
    saveSettings({ silent: true }).catch(() => { });
  });
  
  inputTempEmailUseRandomSubdomain?.addEventListener('change', () => {
    updateMailProviderUI();
    clearRegistrationEmail({ silent: true }).catch(() => { });
    markSettingsDirty(true);
    saveSettings({ silent: true }).catch(() => { });
  });
  
  inputAutoSkipFailuresThreadIntervalMinutes.addEventListener('input', () => {
    markSettingsDirty(true);
    scheduleSettingsAutoSave();
  });
  inputAutoSkipFailuresThreadIntervalMinutes.addEventListener('blur', () => {
    inputAutoSkipFailuresThreadIntervalMinutes.value = String(
      normalizeAutoRunThreadIntervalMinutes(inputAutoSkipFailuresThreadIntervalMinutes.value)
    );
    saveSettings({ silent: true }).catch(() => { });
  });
  
  inputAutoDelayEnabled?.addEventListener('change', () => {
    updateAutoDelayInputState();
    markSettingsDirty(true);
    saveSettings({ silent: true }).catch(() => { });
  });
  
  inputStep6CookieCleanupEnabled?.addEventListener('change', () => {
    markSettingsDirty(true);
    saveSettings({ silent: true }).catch(() => { });
  });
  
  inputAutoDelayMinutes?.addEventListener('input', () => {
    markSettingsDirty(true);
    scheduleSettingsAutoSave();
  });
  inputAutoDelayMinutes?.addEventListener('blur', () => {
    inputAutoDelayMinutes.value = String(normalizeAutoDelayMinutes(inputAutoDelayMinutes.value));
    saveSettings({ silent: true }).catch(() => { });
  });
  
  inputAccountRunHistoryHelperBaseUrl?.addEventListener('input', () => {
    markSettingsDirty(true);
    scheduleSettingsAutoSave();
  });
  
  inputAccountRunHistoryHelperBaseUrl?.addEventListener('blur', () => {
    inputAccountRunHistoryHelperBaseUrl.value = normalizeAccountRunHistoryHelperBaseUrlValue(inputAccountRunHistoryHelperBaseUrl.value);
    saveSettings({ silent: true }).catch(() => { });
  });
  
  function syncAutoStepDelayInputs() {
    inputAutoStepDelaySeconds.value = formatAutoStepDelayInputValue(inputAutoStepDelaySeconds.value);
  }
  
  function syncPlusRemovedContactOauthDelayInput() {
    if (!inputPlusRemovedContactOauthDelaySeconds) {
      return;
    }
    inputPlusRemovedContactOauthDelaySeconds.value = String(
      normalizePlusRemovedContactOauthDelaySeconds(inputPlusRemovedContactOauthDelaySeconds.value)
    );
  }
  
  function syncRemovedContactResendSettingsInputs() {
    if (inputRemovedContactFirstResendWaitSeconds) {
      inputRemovedContactFirstResendWaitSeconds.value = String(
        normalizeRemovedContactResendWaitSeconds(inputRemovedContactFirstResendWaitSeconds.value, 20)
      );
    }
    if (inputRemovedContactSubsequentResendWaitSeconds) {
      inputRemovedContactSubsequentResendWaitSeconds.value = String(
        normalizeRemovedContactResendWaitSeconds(inputRemovedContactSubsequentResendWaitSeconds.value, 25)
      );
    }
    if (inputRemovedContactVerificationPollAttempts) {
      inputRemovedContactVerificationPollAttempts.value = String(
        normalizeRemovedContactVerificationPollAttempts(inputRemovedContactVerificationPollAttempts.value, 6)
      );
    }
    if (inputRemovedContactVerificationPollIntervalSeconds) {
      inputRemovedContactVerificationPollIntervalSeconds.value = String(
        normalizeRemovedContactVerificationPollIntervalSeconds(inputRemovedContactVerificationPollIntervalSeconds.value, 5)
      );
    }
    if (inputRemovedContactVerificationResendMaxAttempts) {
      inputRemovedContactVerificationResendMaxAttempts.value = String(
        normalizeRemovedContactVerificationResendMaxAttempts(inputRemovedContactVerificationResendMaxAttempts.value, 1)
      );
    }
  }
  
  function setChatgptSessionReaderConversionProxyTestResult(message = '未测试', options = {}) {
    if (!displayChatgptSessionReaderConversionProxyTestResult) {
      return;
    }
    const normalizedMessage = String(message || '').trim() || '未测试';
    const status = String(options?.status || 'idle').trim().toLowerCase();
    const detail = String(options?.detail || '').trim();
    displayChatgptSessionReaderConversionProxyTestResult.textContent = normalizedMessage;
    displayChatgptSessionReaderConversionProxyTestResult.title = detail || normalizedMessage;
    displayChatgptSessionReaderConversionProxyTestResult.classList.remove('status-running', 'status-success', 'status-error');
    if (status === 'running') {
      displayChatgptSessionReaderConversionProxyTestResult.classList.add('status-running');
    } else if (status === 'success') {
      displayChatgptSessionReaderConversionProxyTestResult.classList.add('status-success');
    } else if (status === 'error') {
      displayChatgptSessionReaderConversionProxyTestResult.classList.add('status-error');
    }
  }
  
  function isChatgptSessionReaderCloudConversionEnabled() {
    if (typeof inputChatgptSessionReaderCloudConversionEnabled !== 'undefined' && inputChatgptSessionReaderCloudConversionEnabled) {
      return Boolean(inputChatgptSessionReaderCloudConversionEnabled.checked);
    }
    return Boolean(latestState?.chatgptSessionReaderCloudConversionEnabled);
  }
  
  function validateChatgptSessionReaderCloudConversionConfig(options = {}) {
    const method = normalizePlusPaymentMethod(
      typeof selectPlusPaymentMethod !== 'undefined' && selectPlusPaymentMethod
        ? selectPlusPaymentMethod.value
        : latestState?.plusPaymentMethod
    );
    if (method !== DEFAULT_PLUS_PAYMENT_METHOD || !isChatgptSessionReaderCloudConversionEnabled()) {
      return { valid: true, message: '' };
    }
  
    const normalizedApiUrl = normalizeChatgptSessionReaderCloudConversionApiUrlValue(
      BUILTIN_CHATGPT_SESSION_READER_CLOUD_CONVERSION_API_URL
        || (typeof inputChatgptSessionReaderCloudConversionApiUrl !== 'undefined' && inputChatgptSessionReaderCloudConversionApiUrl
          ? inputChatgptSessionReaderCloudConversionApiUrl.value
          : latestState?.chatgptSessionReaderCloudConversionApiUrl)
    );
    if (!normalizedApiUrl) {
      return {
        valid: false,
        message: '云端支付转换服务地址未内置成功，请联系开发者检查扩展配置。',
      };
    }
  
    try {
      const parsed = new URL(normalizedApiUrl);
      if (!/^https?:$/i.test(String(parsed.protocol || ''))) {
        throw new Error('unsupported protocol');
      }
    } catch {
      return {
        valid: false,
        message: '云端支付转换服务地址不是有效的 HTTP/HTTPS URL。',
      };
    }
  
    return { valid: true, message: '' };
  }
  
  function updateChatgptSessionReaderConversionModeUi() {
    const cloudEnabled = isChatgptSessionReaderCloudConversionEnabled();
    const plusModeEnabled = typeof inputPlusModeEnabled !== 'undefined' && inputPlusModeEnabled
      ? Boolean(inputPlusModeEnabled.checked)
      : Boolean(latestState?.plusModeEnabled);
    const selectedMethod = normalizePlusPaymentMethod(
      typeof selectPlusPaymentMethod !== 'undefined' && selectPlusPaymentMethod
        ? selectPlusPaymentMethod.value
        : latestState?.plusPaymentMethod
    );
    const legacyWalletMode = selectedMethod === DEFAULT_PLUS_PAYMENT_METHOD;
    const cloudRowsVisible = plusModeEnabled && legacyWalletMode && cloudEnabled;
  
    if (typeof inputChatgptSessionReaderConversionProxy !== 'undefined' && inputChatgptSessionReaderConversionProxy) {
      inputChatgptSessionReaderConversionProxy.disabled = cloudEnabled;
      inputChatgptSessionReaderConversionProxy.readOnly = cloudEnabled;
      inputChatgptSessionReaderConversionProxy.setAttribute('aria-disabled', cloudEnabled ? 'true' : 'false');
      inputChatgptSessionReaderConversionProxy.title = cloudEnabled
        ? '已启用云端支付转换，本地支付转换代理已锁定且不会生效。'
        : '仅在第 6 步创建 checkout 并跳转 pay.openai.com / Stripe hosted checkout 时临时生效；留空则沿用当前网络环境';
    }
    if (typeof btnChatgptSessionReaderConversionProxyTest !== 'undefined' && btnChatgptSessionReaderConversionProxyTest) {
      btnChatgptSessionReaderConversionProxyTest.disabled = cloudEnabled;
      btnChatgptSessionReaderConversionProxyTest.setAttribute('aria-disabled', cloudEnabled ? 'true' : 'false');
      btnChatgptSessionReaderConversionProxyTest.title = cloudEnabled
        ? '已启用云端支付转换，本地支付转换代理测试不可用。'
        : '';
    }
    if (typeof rowChatgptSessionReaderCloudConversionApiUrl !== 'undefined' && rowChatgptSessionReaderCloudConversionApiUrl) {
      rowChatgptSessionReaderCloudConversionApiUrl.style.display = cloudRowsVisible ? '' : 'none';
    }
    if (typeof rowChatgptSessionReaderCloudConversionApiKey !== 'undefined' && rowChatgptSessionReaderCloudConversionApiKey) {
      rowChatgptSessionReaderCloudConversionApiKey.style.display = cloudRowsVisible ? '' : 'none';
    }
    if (typeof inputChatgptSessionReaderCloudConversionApiUrl !== 'undefined' && inputChatgptSessionReaderCloudConversionApiUrl) {
      inputChatgptSessionReaderCloudConversionApiUrl.disabled = !cloudEnabled;
    }
    if (typeof inputChatgptSessionReaderCloudConversionApiKey !== 'undefined' && inputChatgptSessionReaderCloudConversionApiKey) {
      inputChatgptSessionReaderCloudConversionApiKey.disabled = !cloudEnabled;
    }
  
    if (cloudEnabled) {
      setChatgptSessionReaderConversionProxyTestResult('云端模式', {
        detail: '已启用云端支付转换，本地支付转换代理与代理测试已自动停用。',
      });
    } else {
      setChatgptSessionReaderConversionProxyTestResult('未测试');
    }
  }
  
  async function handleChatgptSessionReaderConversionProxyTest() {
    if (!btnChatgptSessionReaderConversionProxyTest || !inputChatgptSessionReaderConversionProxy) {
      return;
    }
  
    const proxyUrl = normalizeChatgptSessionReaderConversionProxyUrlValue(inputChatgptSessionReaderConversionProxy.value);
    inputChatgptSessionReaderConversionProxy.value = proxyUrl;
    if (!proxyUrl) {
      setChatgptSessionReaderConversionProxyTestResult('请先填写代理', {
        status: 'error',
        detail: '请先填写支付转换代理地址，再执行测试。',
      });
      showToast('请先填写支付转换代理地址。', 'error');
      return;
    }
  
    const previousLabel = btnChatgptSessionReaderConversionProxyTest.textContent;
    btnChatgptSessionReaderConversionProxyTest.disabled = true;
    btnChatgptSessionReaderConversionProxyTest.textContent = '测试中...';
    setChatgptSessionReaderConversionProxyTestResult('测试中...', {
      status: 'running',
      detail: '正在检测代理出口和 chatgpt.com 可达性。',
    });
  
    try {
      const response = await sendRuntimeMessageWithTimeout({
        type: 'TEST_CHATGPT_SESSION_READER_CONVERSION_PROXY',
        source: 'sidepanel',
        payload: {
          proxyUrl,
        },
      }, 45000, '支付转换代理测试');
      if (response?.error) {
        throw new Error(response.error);
      }
      const exitIp = String(response?.exitIp || '').trim();
      const exitRegion = String(response?.exitRegion || '').trim();
      const exitSummary = exitIp
        ? `${exitIp}${exitRegion ? ` [${exitRegion}]` : ''}`
        : '已连通';
      const detailParts = [
        response?.proxyDisplayName ? `代理：${response.proxyDisplayName}` : '',
        response?.exitEndpoint ? `出口探测：${response.exitEndpoint}` : '',
        response?.targetEndpoint ? `目标连通：${response.targetEndpoint}` : '',
        response?.diagnostics ? `诊断：${response.diagnostics}` : '',
      ].filter(Boolean);
      setChatgptSessionReaderConversionProxyTestResult(`可用: ${exitSummary}`, {
        status: 'success',
        detail: detailParts.join(' | ') || `代理测试通过：${exitSummary}`,
      });
      showToast(`支付转换代理测试通过：${exitSummary}`, 'success', 2500);
    } catch (error) {
      const message = error?.message || String(error || '支付转换代理测试失败');
      setChatgptSessionReaderConversionProxyTestResult('测试失败', {
        status: 'error',
        detail: message,
      });
      showToast(message, 'error');
    } finally {
      btnChatgptSessionReaderConversionProxyTest.disabled = false;
      btnChatgptSessionReaderConversionProxyTest.textContent = previousLabel || '测试代理';
    }
  }
  
  async function handleRemovedContactManualFetch() {
    if (!btnRemovedContactManualFetch) {
      return;
    }
  
    const normalizedVerificationUrl = normalizeRemovedContactVerificationUrlValue(inputRemovedContactVerificationUrl?.value || '');
    if (inputRemovedContactVerificationUrl) {
      inputRemovedContactVerificationUrl.value = normalizedVerificationUrl;
    }
  
    const previousLabel = btnRemovedContactManualFetch.textContent;
    btnRemovedContactManualFetch.disabled = true;
    btnRemovedContactManualFetch.textContent = '获取中...';
    setRemovedContactManualCodeDisplay('获取中...');
  
    try {
      const response = await sendRuntimeMessageWithTimeout({
        type: 'FETCH_REMOVED_CONTACT_VERIFICATION_CODE',
        source: 'sidepanel',
        payload: {
          verificationUrl: normalizedVerificationUrl,
        },
      }, 20000, '手动获取验证码');
      if (response?.error) {
        throw new Error(response.error);
      }
      const code = String(response?.code || '').trim();
      if (!code) {
        throw new Error('未返回有效验证码。');
      }
      setRemovedContactManualCodeDisplay(code, response?.verificationUrl || normalizedVerificationUrl);
      showToast('已获取 hosted checkout 验证码。', 'success', 2500);
    } catch (error) {
      const message = error?.message || String(error || '手动获取验证码失败');
      setRemovedContactManualCodeDisplay('获取失败', message);
      showToast(message, 'error');
    } finally {
      btnRemovedContactManualFetch.disabled = false;
      btnRemovedContactManualFetch.textContent = previousLabel || '手动获取验证码';
    }
  }
  
  async function handleSaveRemovedPaymentWorkerSettings() {
    const payload = buildRemovedPaymentWorkerSettingsPayloadFromInputs();
    const activeWindowId = payload.removedPaymentWorkerBrowserBackend === 'roxybrowser'
      ? payload.removedPaymentWorkerRoxyBrowserProfileId
      : payload.removedPaymentWorkerAdsPowerProfileId;
    if (payload.removedPaymentWorkerBrowserBackend === 'adspower' && !activeWindowId) {
      throw new Error('AdsPower窗口ID 为必填项。');
    }
    if (payload.removedPaymentWorkerBrowserBackend === 'roxybrowser' && !activeWindowId) {
      throw new Error('RoxyBrowser窗口ID 为必填项。');
    }
    if (payload.removedPaymentWorkerBrowserBackend === 'roxybrowser' && /^\d+$/.test(activeWindowId || '')) {
      throw new Error('RoxyBrowser窗口ID 不是 workspaceId。请在 RoxyBrowser-全部窗口-右键窗口-窗口操作-复制窗口ID。');
    }
    if (payload.removedPaymentWorkerBrowserBackend === 'roxybrowser' && !payload.removedPaymentWorkerRoxyBrowserApiKey) {
      throw new Error('RoxyBrowser API Key 为必填项。');
    }
    if (selectRemovedPaymentWorkerBrowserBackend) {
      selectRemovedPaymentWorkerBrowserBackend.value = payload.removedPaymentWorkerBrowserBackend;
    }
    if (inputRemovedPaymentWorkerAdsPowerApiBase) {
      inputRemovedPaymentWorkerAdsPowerApiBase.value = payload.removedPaymentWorkerAdsPowerApiBase;
    }
    if (inputRemovedPaymentWorkerAdsPowerApiKey) {
      inputRemovedPaymentWorkerAdsPowerApiKey.value = payload.removedPaymentWorkerAdsPowerApiKey;
    }
    if (inputRemovedPaymentWorkerAdsPowerProfileId) {
      inputRemovedPaymentWorkerAdsPowerProfileId.value = payload.removedPaymentWorkerAdsPowerProfileId;
    }
    if (inputRemovedPaymentWorkerRoxyBrowserProfileId) {
      inputRemovedPaymentWorkerRoxyBrowserProfileId.value = payload.removedPaymentWorkerRoxyBrowserProfileId;
    }
    if (inputRemovedPaymentWorkerRoxyBrowserApiBase) {
      inputRemovedPaymentWorkerRoxyBrowserApiBase.value = payload.removedPaymentWorkerRoxyBrowserApiBase;
    }
    if (inputRemovedPaymentWorkerRoxyBrowserApiKey) {
      inputRemovedPaymentWorkerRoxyBrowserApiKey.value = payload.removedPaymentWorkerRoxyBrowserApiKey;
    }
    if (inputRemovedPaymentWorkerMaxAttempts) {
      inputRemovedPaymentWorkerMaxAttempts.value = String(payload.removedPaymentWorkerMaxAttempts);
    }
    if (selectRemovedPaymentWorkerPaymentLocale) {
      selectRemovedPaymentWorkerPaymentLocale.value = payload.removedPaymentWorkerPaymentLocale;
    }
    if (inputRemovedPaymentWorkerCheckoutRebuildMaxAttempts) {
      inputRemovedPaymentWorkerCheckoutRebuildMaxAttempts.value = String(payload.removedPaymentWorkerCheckoutRebuildMaxAttempts);
    }
    if (inputRemovedPaymentWorkerDefaultProxy) {
      inputRemovedPaymentWorkerDefaultProxy.value = payload.removedPaymentWorkerDefaultProxy;
    }
    if (inputRemovedPaymentWorkerProviderProxy) {
      inputRemovedPaymentWorkerProviderProxy.value = payload.removedPaymentWorkerProviderProxy;
    }
    const response = await sendRuntimeMessageWithTimeout({
      type: 'SAVE_SETTING',
      source: 'sidepanel',
      payload,
    }, 20000, '保存 RemovedPaymentWorker 配置');
    if (response?.error) {
      throw new Error(response.error);
    }
    syncLatestState({
      ...(latestState || {}),
      ...payload,
      ...(response?.state && typeof response.state === 'object' ? response.state : {}),
    });
    updateRemovedPaymentWorkerUi(latestState);
    markSettingsDirty(false);
    showToast('RemovedPaymentWorker 配置已保存。', 'success', 1800);
  }
  
  async function handleClearRemovedPaymentWorkerSettings() {
    const defaults = buildDefaultRemovedPaymentWorkerSettings();
    resetRemovedPaymentWorkerInputsToDefaults();
    const response = await sendRuntimeMessageWithTimeout({
      type: 'SAVE_SETTING',
      source: 'sidepanel',
      payload: defaults,
    }, 20000, '清除 RemovedPaymentWorker 配置');
    if (response?.error) {
      throw new Error(response.error);
    }
    syncLatestState({
      ...(latestState || {}),
      ...defaults,
      ...(response?.state && typeof response.state === 'object' ? response.state : {}),
    });
    updateRemovedPaymentWorkerUi(latestState);
    markSettingsDirty(false);
    showToast('RemovedPaymentWorker 配置已重置。', 'success', 1800);
  }
  
  async function controlRemovedPaymentWorkerJob(action = 'pause') {
    const type = action === 'resume' ? 'REMOVED_PAYMENT_WORKER_RESUME_JOB' : 'REMOVED_PAYMENT_WORKER_PAUSE_JOB';
    const response = await sendRuntimeMessageWithTimeout({
      type,
      source: 'sidepanel',
      payload: {},
    }, 20000, action === 'resume' ? '继续 RemovedPaymentWorker 任务' : '暂停 RemovedPaymentWorker 任务');
    if (response?.error) {
      throw new Error(response.error);
    }
    if (response?.state && typeof response.state === 'object') {
      syncLatestState({
        ...(latestState || {}),
        ...response.state,
      });
      updateRemovedPaymentWorkerUi(latestState);
    }
    showToast(action === 'resume' ? 'RemovedPaymentWorker 已继续。' : 'RemovedPaymentWorker 已请求暂停。', 'info', 1800);
  }
  
  function handleChatgptSessionReaderModeSelectionChange(nextMode) {
    const previousMode = getActiveChatgptSessionReaderModeFromState(latestState);
    const previousProfileDraft = buildChatgptSessionReaderProfileFromInputs();
    syncChatgptSessionReaderProfileForModeIntoLatestState(previousMode, previousProfileDraft);
    const normalizedMode = normalizeChatgptSessionReaderModeValue(nextMode);
    localChatgptSessionReaderMode = normalizedMode;
    const normalizedState = normalizeChatgptSessionReaderStateForUi({
      ...(latestState || {}),
      chatgptSessionReaderMode: normalizedMode,
    }, {
      legacyOverrideSource: { chatgptSessionReaderMode: normalizedMode },
    });
    syncLocalChatgptSessionReaderDraftFromState(normalizedState);
    const nextProfile = normalizedState?.chatgptSessionReaderProfiles?.[normalizedMode] || buildDefaultChatgptSessionReaderProfile();
    syncLatestState({
      chatgptSessionReaderMode: normalizedMode,
      chatgptSessionReaderProfiles: localChatgptSessionReaderProfiles,
      ...buildChatgptSessionReaderLegacyPatchFromProfile(nextProfile),
    });
    applyChatgptSessionReaderProfileToInputs(latestState, { mode: normalizedMode });
    updatePlusModeUI();
    markSettingsDirty(true);
    saveSettings({ silent: true }).catch(() => { });
  }
  
  settingsFieldBindings.bindInput(inputAutoStepDelaySeconds, {
    key: 'autoStepDelaySeconds',
    normalize: (value) => normalizeAutoStepDelaySeconds(value),
  });
  settingsFieldBindings.bindBlur(inputAutoStepDelaySeconds, {
    afterBlur: () => {
      syncAutoStepDelayInputs();
      saveSettings({ silent: true }).catch(() => { });
    },
  });
  
  inputPlusRemovedContactOauthDelaySeconds?.addEventListener('input', () => {
    markSettingsDirty(true);
    scheduleSettingsAutoSave();
  });
  inputPlusRemovedContactOauthDelaySeconds?.addEventListener('blur', () => {
    syncPlusRemovedContactOauthDelayInput();
    saveSettings({ silent: true }).catch(() => { });
  });
  
  inputChatgptSessionReaderConversionProxy?.addEventListener('input', () => {
    setChatgptSessionReaderConversionProxyTestResult('未测试');
    markSettingsDirty(true);
    scheduleSettingsAutoSave();
  });
  inputChatgptSessionReaderConversionProxy?.addEventListener('blur', () => {
    inputChatgptSessionReaderConversionProxy.value = normalizeChatgptSessionReaderConversionProxyUrlValue(inputChatgptSessionReaderConversionProxy.value);
    setChatgptSessionReaderConversionProxyTestResult('未测试');
    saveSettings({ silent: true }).catch(() => { });
  });
  btnChatgptSessionReaderConversionProxyTest?.addEventListener('click', () => {
    handleChatgptSessionReaderConversionProxyTest().catch((error) => {
      showToast(error?.message || String(error || '支付转换代理测试失败'), 'error');
    });
  });
  
  inputRemovedPaymentWorkerEnabled?.addEventListener('change', () => {
    const stepDefinitionState = typeof resolveStepDefinitionCapabilityState === 'function'
      ? resolveStepDefinitionCapabilityState({
        ...latestState,
        ...buildRemovedPaymentWorkerSettingsPayloadFromInputs(),
      }, {
        signupMethod: latestState?.signupMethod,
      })
      : {
        plusModeEnabled: Boolean(latestState?.plusModeEnabled),
        signupMethod: normalizeSignupMethod(latestState?.signupMethod || DEFAULT_SIGNUP_METHOD),
        plusAccountAccessStrategy: latestState?.plusAccountAccessStrategy,
      };
    syncStepDefinitionsForMode(stepDefinitionState.plusModeEnabled, {
      plusPaymentMethod: getSelectedPlusPaymentMethod(latestState),
      signupMethod: stepDefinitionState.signupMethod,
      plusAccountAccessStrategy: stepDefinitionState.plusAccountAccessStrategy,
      removedPaymentWorkerEnabled: Boolean(inputRemovedPaymentWorkerEnabled.checked),
      render: true,
    });
    updateRemovedPaymentWorkerUi({
      ...latestState,
      ...buildRemovedPaymentWorkerSettingsPayloadFromInputs(),
    });
    markSettingsDirty(true);
  });
  selectRemovedPaymentWorkerBrowserBackend?.addEventListener('change', () => {
    updateRemovedPaymentWorkerUi({
      ...latestState,
      ...buildRemovedPaymentWorkerSettingsPayloadFromInputs(),
    });
    markSettingsDirty(true);
  });
  inputRemovedPaymentWorkerAdsPowerApiBase?.addEventListener('input', () => {
    markSettingsDirty(true);
  });
  inputRemovedPaymentWorkerAdsPowerApiBase?.addEventListener('blur', () => {
    inputRemovedPaymentWorkerAdsPowerApiBase.value = normalizeRemovedPaymentWorkerAdsPowerApiBaseValue(inputRemovedPaymentWorkerAdsPowerApiBase.value);
  });
  inputRemovedPaymentWorkerAdsPowerApiKey?.addEventListener('input', () => {
    markSettingsDirty(true);
  });
  inputRemovedPaymentWorkerAdsPowerProfileId?.addEventListener('input', () => {
    markSettingsDirty(true);
  });
  inputRemovedPaymentWorkerRoxyBrowserProfileId?.addEventListener('input', () => {
    markSettingsDirty(true);
  });
  inputRemovedPaymentWorkerRoxyBrowserApiBase?.addEventListener('input', () => {
    markSettingsDirty(true);
  });
  inputRemovedPaymentWorkerRoxyBrowserApiBase?.addEventListener('blur', () => {
    inputRemovedPaymentWorkerRoxyBrowserApiBase.value = normalizeRemovedPaymentWorkerRoxyBrowserApiBaseValue(inputRemovedPaymentWorkerRoxyBrowserApiBase.value);
  });
  inputRemovedPaymentWorkerRoxyBrowserApiKey?.addEventListener('input', () => {
    markSettingsDirty(true);
  });
  inputRemovedPaymentWorkerStripePublishableKey?.addEventListener('input', () => {
    markSettingsDirty(true);
  });
  inputRemovedPaymentWorkerDeviceId?.addEventListener('input', () => {
    markSettingsDirty(true);
  });
  inputRemovedPaymentWorkerUserAgent?.addEventListener('input', () => {
    markSettingsDirty(true);
  });
  inputRemovedPaymentWorkerMaxAttempts?.addEventListener('input', () => {
    markSettingsDirty(true);
  });
  inputRemovedPaymentWorkerMaxAttempts?.addEventListener('blur', () => {
    inputRemovedPaymentWorkerMaxAttempts.value = String(normalizeRemovedPaymentWorkerMaxAttemptsValue(inputRemovedPaymentWorkerMaxAttempts.value));
  });
  selectRemovedPaymentWorkerPaymentLocale?.addEventListener('change', () => {
    markSettingsDirty(true);
  });
  inputRemovedPaymentWorkerCheckoutRebuildMaxAttempts?.addEventListener('input', () => {
    markSettingsDirty(true);
  });
  inputRemovedPaymentWorkerCheckoutRebuildMaxAttempts?.addEventListener('blur', () => {
    inputRemovedPaymentWorkerCheckoutRebuildMaxAttempts.value = String(
      normalizeRemovedPaymentWorkerCheckoutRebuildMaxAttemptsValue(inputRemovedPaymentWorkerCheckoutRebuildMaxAttempts.value, 3)
    );
  });
  inputRemovedPaymentWorkerDefaultProxy?.addEventListener('input', () => {
    markSettingsDirty(true);
  });
  inputRemovedPaymentWorkerProviderProxy?.addEventListener('input', () => {
    markSettingsDirty(true);
  });
  btnSaveRemovedPaymentWorkerSettings?.addEventListener('click', () => {
    handleSaveRemovedPaymentWorkerSettings().catch((error) => {
      showToast(error?.message || String(error || '保存 RemovedPaymentWorker 配置失败'), 'error');
    });
  });
  btnClearRemovedPaymentWorkerSettings?.addEventListener('click', () => {
    handleClearRemovedPaymentWorkerSettings().catch((error) => {
      showToast(error?.message || String(error || '清除 RemovedPaymentWorker 配置失败'), 'error');
    });
  });
  btnRemovedPaymentWorkerPause?.addEventListener('click', () => {
    controlRemovedPaymentWorkerJob('pause').catch((error) => {
      showToast(error?.message || String(error || '暂停 RemovedPaymentWorker 失败'), 'error');
    });
  });
  btnRemovedPaymentWorkerResume?.addEventListener('click', () => {
    controlRemovedPaymentWorkerJob('resume').catch((error) => {
      showToast(error?.message || String(error || '继续 RemovedPaymentWorker 失败'), 'error');
    });
  });
  
  inputChatgptSessionReaderCloudConversionEnabled?.addEventListener('change', () => {
    updateChatgptSessionReaderConversionModeUi();
    validateChatgptSessionReaderCloudConversionConfig();
    markSettingsDirty(true);
    saveSettings({ silent: true }).catch(() => { });
  });
  inputChatgptSessionReaderCloudConversionApiUrl?.addEventListener('input', () => {
    validateChatgptSessionReaderCloudConversionConfig();
    markSettingsDirty(true);
    scheduleSettingsAutoSave();
  });
  inputChatgptSessionReaderCloudConversionApiUrl?.addEventListener('blur', () => {
    inputChatgptSessionReaderCloudConversionApiUrl.value = normalizeChatgptSessionReaderCloudConversionApiUrlValue(inputChatgptSessionReaderCloudConversionApiUrl.value);
    validateChatgptSessionReaderCloudConversionConfig();
    saveSettings({ silent: true }).catch(() => { });
  });
  inputChatgptSessionReaderCloudConversionApiKey?.addEventListener('input', () => {
    markSettingsDirty(true);
    scheduleSettingsAutoSave();
  });
  inputChatgptSessionReaderCloudConversionApiKey?.addEventListener('blur', () => {
    inputChatgptSessionReaderCloudConversionApiKey.value = normalizeChatgptSessionReaderCloudConversionApiKeyValue(inputChatgptSessionReaderCloudConversionApiKey.value);
    saveSettings({ silent: true }).catch(() => { });
  });
  
  inputRemovedContactVerificationUrl?.addEventListener('input', () => {
    setRemovedContactManualCodeDisplay('未获取');
    validateRemovedContactContactConfig();
    syncActiveChatgptSessionReaderProfilePatch({
      removedContactVerificationUrl: inputRemovedContactVerificationUrl.value,
    });
    markSettingsDirty(true);
    scheduleSettingsAutoSave();
  });
  inputRemovedContactVerificationUrl?.addEventListener('blur', () => {
    inputRemovedContactVerificationUrl.value = normalizeRemovedContactVerificationUrlValue(inputRemovedContactVerificationUrl.value);
    validateRemovedContactContactConfig();
    syncActiveChatgptSessionReaderProfilePatch({
      removedContactVerificationUrl: inputRemovedContactVerificationUrl.value,
    });
    saveSettings({ silent: true }).catch(() => { });
  });
  btnRemovedContactManualFetch?.addEventListener('click', () => {
    handleRemovedContactManualFetch().catch((error) => {
      showToast(error?.message || String(error || '手动获取验证码失败'), 'error');
    });
  });
  
  inputRemovedContactFirstDirectResendEnabled?.addEventListener('change', () => {
    markSettingsDirty(true);
    saveSettings({ silent: true }).catch(() => { });
  });
  
  inputRemovedContactCardDeclinedRetryEnabled?.addEventListener('change', () => {
    syncActiveChatgptSessionReaderProfilePatch({
      removedContactCardDeclinedRetryEnabled: Boolean(inputRemovedContactCardDeclinedRetryEnabled.checked),
    });
    markSettingsDirty(true);
    saveSettings({ silent: true }).catch(() => { });
  });
  [
    inputRemovedContactFirstResendWaitSeconds,
    inputRemovedContactSubsequentResendWaitSeconds,
    inputRemovedContactVerificationPollAttempts,
    inputRemovedContactVerificationPollIntervalSeconds,
    inputRemovedContactVerificationResendMaxAttempts,
  ].filter(Boolean).forEach((input) => {
    input.addEventListener('input', () => {
      markSettingsDirty(true);
      scheduleSettingsAutoSave();
    });
    input.addEventListener('blur', () => {
      syncRemovedContactResendSettingsInputs();
      saveSettings({ silent: true }).catch(() => { });
    });
  });
  
  inputOutlookAliasMaxPerAccount?.addEventListener('input', () => {
    markSettingsDirty(true);
    scheduleSettingsAutoSave();
  });
  inputOutlookAliasMaxPerAccount?.addEventListener('blur', () => {
    inputOutlookAliasMaxPerAccount.value = String(
      normalizeOutlookAliasMaxPerAccount(inputOutlookAliasMaxPerAccount.value)
    );
    saveSettings({ silent: true }).catch(() => { });
  });
  
  inputHotmailAliasEnabled?.addEventListener('change', () => {
    updateMailProviderUI();
    markSettingsDirty(true);
    saveSettings({ silent: true }).catch(() => { });
  });
  
  // ============================================================
  // Listen for Background broadcasts// ============================================================
  // Listen for Background broadcasts
  // ============================================================
  

const runtimeMessageController = window.SidepanelRuntimeMessageController.createRuntimeMessageController({
  appState,
  chromeApi: chrome,
  scopeValues: buildRuntimeMessageControllerScopeValues(),
});
runtimeMessageController.start();
  async function handleStepListClick(event) {
    const btn = event.target.closest('.step-btn');
    if (!btn) {
      return;
    }
    try {
      await executeNodeFromSidepanel(btn.dataset.nodeId, btn.dataset.step);
    } catch (err) {
      showToast(err?.message || String(err || '执行节点失败'), 'error');
    }
  }
  
  async function startAutoRun() {
    try {
      await persistCurrentSettingsForAction();
      const totalRuns = getRunCountValue();
      const payload = {
        totalRuns,
        mode: shouldOfferAutoModeChoice(latestState) ? 'continue' : 'restart',
        autoRunRetryNonFreeTrial: Boolean(inputAutoRunRetryNonFreeTrial?.checked),
        autoRunRetryLegacyWalletCallback: Boolean(inputAutoRunRetryLegacyWalletCallback?.checked),
      };
      const delayEnabled = Boolean(inputAutoDelayEnabled?.checked);
      const delayMinutes = Math.max(0, Number(inputAutoDelayMinutes?.value) || 0);
      const response = delayEnabled && delayMinutes > 0
        ? await sendSidepanelMessage({
          type: 'SCHEDULE_AUTO_RUN',
          source: 'sidepanel',
          payload: {
            ...payload,
            delayMinutes,
          },
        })
        : await sendSidepanelMessage({ type: 'AUTO_RUN', source: 'sidepanel', payload });
      if (response?.error) {
        throw new Error(response.error);
      }
      showToast(delayEnabled && delayMinutes > 0 ? '已计划自动运行。' : '自动流程已启动。', 'success', 1800);
    } catch (err) {
      showToast(err?.message || String(err || '启动自动流程失败'), 'error');
    }
  }
  
  async function autoContinue() {
    try {
      await persistCurrentSettingsForAction();
      const response = await sendSidepanelMessage({
        type: 'RESUME_AUTO_RUN',
        source: 'sidepanel',
        payload: {
          email: inputEmail?.value?.trim() || undefined,
        },
      });
      if (response?.error) {
        throw new Error(response.error);
      }
    } catch (err) {
      showToast(err?.message || String(err || '继续自动流程失败'), 'error');
    }
  }
  
  async function runScheduledNow() {
    try {
      const response = await sendSidepanelMessage({
        type: currentAutoRun.phase === 'waiting_interval' ? 'SKIP_AUTO_RUN_COUNTDOWN' : 'START_SCHEDULED_AUTO_RUN_NOW',
        source: 'sidepanel',
        payload: {},
      });
      if (response?.error) {
        throw new Error(response.error);
      }
    } catch (err) {
      showToast(err?.message || String(err || '立即开始失败'), 'error');
    }
  }
  
  async function cancelSchedule() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'CANCEL_SCHEDULED_AUTO_RUN',
        source: 'sidepanel',
        payload: {},
      });
      if (response?.error) {
        throw new Error(response.error);
      }
    } catch (err) {
      showToast(err?.message || String(err || '取消计划失败'), 'error');
    }
  }
  
  async function stopCurrentRun() {
    try {
      btnStop.disabled = true;
      const response = await chrome.runtime.sendMessage({ type: 'STOP_FLOW', source: 'sidepanel', payload: {} });
      if (response?.error) {
        throw new Error(response.error);
      }
      showToast('已请求停止当前流程。', 'info', 1800);
    } catch (err) {
      showToast(err?.message || String(err || '停止流程失败'), 'error');
    } finally {
      updateButtonStates();
    }
  }
  
  async function resetWorkflow() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'RESET', source: 'sidepanel', payload: {} });
      if (response?.error) {
        throw new Error(response.error);
      }
      syncLatestState({
        nodeStatuses: NODE_DEFAULT_STATUSES,
        logs: [],
        oauthUrl: null,
        lastLoginCode: null,
        localhostUrl: null,
      });
      await logPanelManager.clearLog();
      renderStepStatuses(latestState);
      updateStatusDisplay(latestState);
      showToast('流程已重置。', 'success', 1800);
    } catch (err) {
      showToast(err?.message || String(err || '重置流程失败'), 'error');
    }
  }
  
  async function clearLog() {
    await logPanelManager.clearLog({ persist: true });
  }
  
  workflowController.bindActions();
  
  document.addEventListener('click', (event) => {
    const clickedInsideConfigMenu = Boolean(configMenuShell?.contains(event.target));
    const clickedInsideEditableListPicker = isClickInsideEditableListPicker(event.target);
  
    if (configMenuController.isOpen() && !clickedInsideConfigMenu) {
      closeConfigMenu();
    }
  
    if (!clickedInsideEditableListPicker) {
      closeEditableListPickers();
    }
  });
  
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') {
      return;
    }
    if (configMenuController.isOpen()) {
      closeConfigMenu();
    }
    closeEditableListPickers();
  });
  
  window.addEventListener('resize', () => {
    positionContributionUpdateHint();
  });
  
  document.addEventListener('scroll', () => {
    positionContributionUpdateHint();
  }, true);
  
  // ============================================================
  // Init
  // ============================================================
  
  renderStepsList();
  initializeManualStepActions();
  bindConfigMenuEvents();
  bindAccountRecordEvents();
  bindCustomEmailPoolEvents();
  bindPasswordVisibilityToggles();
  initHotmailListExpandedState();
  initMail2925ListExpandedState();
  updateSaveButtonState();
  updateConfigMenuControls();
  setLocalCpaStep9Mode(DEFAULT_LOCAL_CPA_STEP9_MODE);
  setMail2925Mode(DEFAULT_MAIL_2925_MODE);
  setCloudflareTempEmailLookupMode(DEFAULT_CLOUDFLARE_TEMP_EMAIL_LOOKUP_MODE);
  updatePanelModeUI();
  updatePlusModeUI();
  updateMailProviderUI();
  updateButtonStates();
  initializeReleaseInfo().catch((err) => {
    console.error('Failed to initialize release info:', err);
  });
  void restoreState().then(async () => {
    syncPasswordToggleLabel();
    syncVpsUrlToggleLabel();
    syncVpsPasswordToggleLabel();
    syncPasswordVisibilityToggles();
    updatePanelModeUI();
    updatePlusModeUI();
    updateButtonStates();
    updateStatusDisplay(latestState);
    return refreshContributionContentHint()
      .catch((error) => {
        console.warn('Failed to refresh contribution content hint during initialization:', error);
        return null;
      })
      .then(() => maybeShowNewUserGuidePrompt());
  }).catch((err) => {
    console.error('Failed to initialize sidepanel state:', err);
  });
  
}
  }

  return { createSidepanelApp };
});
