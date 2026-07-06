(function attachSidepanelDomBindings(globalScope) {
  function getBindings() {
    const logArea = document.getElementById('log-area');
    const btnOpenAccountRecords = document.getElementById('btn-open-account-records');
    const accountRecordsOverlay = document.getElementById('account-records-overlay');
    const accountRecordsMeta = document.getElementById('account-records-meta');
    const accountRecordsStats = document.getElementById('account-records-stats');
    const accountRecordsList = document.getElementById('account-records-list');
    const accountRecordsPageLabel = document.getElementById('account-records-page-label');
    const btnAccountRecordsPrev = document.getElementById('btn-account-records-prev');
    const btnAccountRecordsNext = document.getElementById('btn-account-records-next');
    const btnCloseAccountRecords = document.getElementById('btn-close-account-records');
    const btnClearAccountRecords = document.getElementById('btn-clear-account-records');
    const btnExportSuccessAccountRecords = document.getElementById('btn-export-success-account-records');
    const btnToggleAccountRecordsSelection = document.getElementById('btn-toggle-account-records-selection');
    const btnDeleteSelectedAccountRecords = document.getElementById('btn-delete-selected-account-records');
    const updateSection = document.getElementById('update-section');
    const btnRepoHome = document.getElementById('btn-repo-home');
    const extensionUpdateStatus = document.getElementById('extension-update-status');
    const extensionVersionMeta = document.getElementById('extension-version-meta');
    const btnReleaseLog = document.getElementById('btn-release-log');
    const updateCardVersion = document.getElementById('update-card-version');
    const updateCardSummary = document.getElementById('update-card-summary');
    const updateReleaseList = document.getElementById('update-release-list');
    const btnIgnoreRelease = document.getElementById('btn-ignore-release');
    const btnOpenRelease = document.getElementById('btn-open-release');
    const settingsCard = document.getElementById('settings-card');
    const contributionModePanel = document.getElementById('contribution-mode-panel');
    const contributionModeBadge = document.getElementById('contribution-mode-badge');
    const contributionModeText = document.getElementById('contribution-mode-text');
    const inputContributionNickname = document.getElementById('input-contribution-nickname');
    const inputContributionQq = document.getElementById('input-contribution-qq');
    const contributionOauthStatus = document.getElementById('contribution-oauth-status');
    const contributionCallbackStatus = document.getElementById('contribution-callback-status');
    const contributionModeSummary = document.getElementById('contribution-mode-summary');
    const btnStartContribution = document.getElementById('btn-start-contribution');
    const btnOpenContributionUpload = document.getElementById('btn-open-contribution-upload');
    const btnExitContributionMode = document.getElementById('btn-exit-contribution-mode');
    const displayOauthUrl = document.getElementById('display-oauth-url');
    const displayOauthLoginCode = document.getElementById('display-oauth-login-code');
    const displayLocalhostUrl = document.getElementById('display-localhost-url');
    const displayStatus = document.getElementById('display-status');
    const statusBar = document.getElementById('status-bar');
    const inputEmail = document.getElementById('input-email');
    const inputPassword = document.getElementById('input-password');
    const btnToggleVpsUrl = document.getElementById('btn-toggle-vps-url');
    const btnToggleVpsPassword = document.getElementById('btn-toggle-vps-password');
    const btnFetchEmail = document.getElementById('btn-fetch-email');
    const btnTogglePassword = document.getElementById('btn-toggle-password');
    const btnExportCurrentSessionCpaJson = document.getElementById('btn-export-current-session-cpa-json');
    const btnExportCurrentSessionSub2Json = document.getElementById('btn-export-current-session-sub2-json');
    const btnSaveSettings = document.getElementById('btn-save-settings');
    const btnStop = document.getElementById('btn-stop');
    const btnReset = document.getElementById('btn-reset');
    const btnContributionMode = document.getElementById('btn-contribution-mode');
    const contributionUpdateLayer = document.getElementById('contribution-update-layer');
    const contributionUpdateHint = document.getElementById('contribution-update-hint');
    const contributionUpdateHintText = document.getElementById('contribution-update-hint-text');
    const btnDismissContributionUpdateHint = document.getElementById('btn-dismiss-contribution-update-hint');
    const stepsProgress = document.getElementById('steps-progress');
    const btnAutoRun = document.getElementById('btn-auto-run');
    const btnAutoContinue = document.getElementById('btn-auto-continue');
    const autoContinueBar = document.getElementById('auto-continue-bar');
    const autoScheduleBar = document.getElementById('auto-schedule-bar');
    const autoScheduleTitle = document.getElementById('auto-schedule-title');
    const autoScheduleMeta = document.getElementById('auto-schedule-meta');
    const btnAutoRunNow = document.getElementById('btn-auto-run-now');
    const btnAutoCancelSchedule = document.getElementById('btn-auto-cancel-schedule');
    const btnClearLog = document.getElementById('btn-clear-log');
    const configMenuShell = document.getElementById('config-menu-shell');
    const btnConfigMenu = document.getElementById('btn-config-menu');
    const configMenu = document.getElementById('config-menu');
    const btnExportSettings = document.getElementById('btn-export-settings');
    const btnImportSettings = document.getElementById('btn-import-settings');
    const inputImportSettingsFile = document.getElementById('input-import-settings-file');
    const selectPanelMode = document.getElementById('select-panel-mode');
    const rowAccountAccessStrategy = document.getElementById('row-account-access-strategy');
    const selectAccountAccessStrategy = document.getElementById('select-account-access-strategy');
    const accountAccessStrategyCaption = document.getElementById('account-access-strategy-caption');
    const rowLocalCpaJsonPluginDir = document.getElementById('row-local-cpa-json-plugin-dir');
    const inputLocalCpaJsonPluginDir = document.getElementById('input-local-cpa-json-plugin-dir');
    const rowLocalCpaJsonAdvancedToggle = document.getElementById('row-local-cpa-json-advanced-toggle');
    const btnToggleLocalCpaJsonAuthDir = document.getElementById('btn-toggle-local-cpa-json-auth-dir');
    const rowLocalCpaJsonRelativeAuthDir = document.getElementById('row-local-cpa-json-relative-auth-dir');
    const inputLocalCpaJsonRelativeAuthDir = document.getElementById('input-local-cpa-json-relative-auth-dir');
    const rowVpsUrl = document.getElementById('row-vps-url');
    const inputVpsUrl = document.getElementById('input-vps-url');
    const rowVpsPassword = document.getElementById('row-vps-password');
    const inputVpsPassword = document.getElementById('input-vps-password');
    const rowLocalCpaStep9Mode = document.getElementById('row-local-cpa-step9-mode');
    const localCpaStep9ModeButtons = Array.from(document.querySelectorAll('[data-local-cpa-step9-mode]'));
    const rowSub2ApiUrl = document.getElementById('row-sub2api-url');
    const inputSub2ApiUrl = document.getElementById('input-sub2api-url');
    const rowSub2ApiEmail = document.getElementById('row-sub2api-email');
    const inputSub2ApiEmail = document.getElementById('input-sub2api-email');
    const rowSub2ApiPassword = document.getElementById('row-sub2api-password');
    const inputSub2ApiPassword = document.getElementById('input-sub2api-password');
    const rowSub2ApiGroup = document.getElementById('row-sub2api-group');
    const inputSub2ApiGroup = document.getElementById('input-sub2api-group');
    const sub2ApiGroupPickerRoot = document.getElementById('sub2api-group-picker');
    const btnSub2ApiGroupMenu = document.getElementById('btn-sub2api-group-menu');
    const sub2ApiGroupCurrent = document.getElementById('sub2api-group-current');
    const sub2ApiGroupMenu = document.getElementById('sub2api-group-menu');
    const btnAddSub2ApiGroup = document.getElementById('btn-add-sub2api-group');
    const rowSub2ApiAccountPriority = document.getElementById('row-sub2api-account-priority');
    const inputSub2ApiAccountPriority = document.getElementById('input-sub2api-account-priority');
    const rowSub2ApiDefaultProxy = document.getElementById('row-sub2api-default-proxy');
    const inputSub2ApiDefaultProxy = document.getElementById('input-sub2api-default-proxy');
    const rowCodex2ApiUrl = document.getElementById('row-codex2api-url');
    const inputCodex2ApiUrl = document.getElementById('input-codex2api-url');
    const rowCodex2ApiAdminKey = document.getElementById('row-codex2api-admin-key');
    const inputCodex2ApiAdminKey = document.getElementById('input-codex2api-admin-key');
    const rowCustomPassword = document.getElementById('row-custom-password');
    const rowPlusMode = document.getElementById('row-plus-mode');
    const inputPlusModeEnabled = document.getElementById('input-plus-mode-enabled');
    const chatgptSessionReaderModeSwitchGroup = document.getElementById('chatgpt-session-reader-mode-switch-group');
    const inputChatgptSessionReaderModeUs = document.getElementById('input-chatgpt-session-reader-mode-us');
    const inputChatgptSessionReaderModeJp = document.getElementById('input-chatgpt-session-reader-mode-jp');
    const rowPlusPaymentMethod = document.getElementById('row-plus-payment-method');
    const selectPlusPaymentMethod = document.getElementById('select-plus-payment-method');
    const rowLegacyWalletAccount = document.getElementById('row-legacyWallet-account');
    const selectLegacyWalletAccount = document.getElementById('select-legacyWallet-account');
    const legacyWalletAccountPickerRoot = document.getElementById('legacyWallet-account-picker');
    const btnLegacyWalletAccountMenu = document.getElementById('btn-legacyWallet-account-menu');
    const legacyWalletAccountCurrent = document.getElementById('legacyWallet-account-current');
    const legacyWalletAccountMenu = document.getElementById('legacyWallet-account-menu');
    const btnAddLegacyWalletAccount = document.getElementById('btn-add-legacyWallet-account');
    const btnUpiInfoCardKeyPurchase = document.getElementById('btn-upiInfo-card-key-purchase');
    const plusPaymentMethodCaption = document.getElementById('plus-payment-method-caption');
    const rowPlusRemovedContactOauthDelay = document.getElementById('row-plus-removed-contact-oauth-delay');
    const inputPlusRemovedContactOauthDelaySeconds = document.getElementById('input-plus-removed-contact-oauth-delay-seconds');
    const rowChatgptSessionReaderConversionProxy = document.getElementById('row-chatgpt-session-reader-conversion-proxy');
    const inputChatgptSessionReaderConversionProxy = document.getElementById('input-chatgpt-session-reader-conversion-proxy');
    const rowChatgptSessionReaderConversionProxyTest = document.getElementById('row-chatgpt-session-reader-conversion-proxy-test');
    const btnChatgptSessionReaderConversionProxyTest = document.getElementById('btn-chatgpt-session-reader-conversion-proxy-test');
    const inputChatgptSessionReaderCloudConversionEnabled = document.getElementById('input-chatgpt-session-reader-cloud-conversion-enabled');
    const rowChatgptSessionReaderCloudConversionApiUrl = document.getElementById('row-chatgpt-session-reader-cloud-conversion-api-url');
    const inputChatgptSessionReaderCloudConversionApiUrl = document.getElementById('input-chatgpt-session-reader-cloud-conversion-api-url');
    const rowChatgptSessionReaderCloudConversionApiKey = document.getElementById('row-chatgpt-session-reader-cloud-conversion-api-key');
    const inputChatgptSessionReaderCloudConversionApiKey = document.getElementById('input-chatgpt-session-reader-cloud-conversion-api-key');
    const displayChatgptSessionReaderConversionProxyTestResult = document.getElementById('display-chatgpt-session-reader-conversion-proxy-test-result');
    const rowRemovedContactVerificationUrl = document.getElementById('row-removed-contact-verification-url');
    const inputRemovedContactVerificationUrl = document.getElementById('input-removed-contact-verification-url');
    const rowRemovedContactManualFetch = document.getElementById('row-removed-contact-manual-fetch');
    const btnRemovedContactManualFetch = document.getElementById('btn-removed-contact-manual-fetch');
    const displayRemovedContactManualCode = document.getElementById('display-removed-contact-manual-code');
    const rowRemovedContactResendSettings = document.getElementById('row-removed-contact-resend-settings');
    const inputRemovedContactFirstDirectResendEnabled = document.getElementById('input-removed-contact-first-direct-resend-enabled');
    const inputRemovedContactCardDeclinedRetryEnabled = document.getElementById('input-removed-contact-card-declined-retry-enabled');
    const inputRemovedContactFirstResendWaitSeconds = document.getElementById('input-removed-contact-first-resend-wait-seconds');
    const inputRemovedContactSubsequentResendWaitSeconds = document.getElementById('input-removed-contact-subsequent-resend-wait-seconds');
    const inputRemovedContactVerificationPollAttempts = document.getElementById('input-removed-contact-verification-poll-attempts');
    const inputRemovedContactVerificationPollIntervalSeconds = document.getElementById('input-removed-contact-verification-poll-interval-seconds');
    const inputRemovedContactVerificationResendMaxAttempts = document.getElementById('input-removed-contact-verification-resend-max-attempts');
    const rowUpiInfoHelperApi = document.getElementById('row-upiInfo-helper-api');
    const inputUpiInfoHelperApi = document.getElementById('input-upiInfo-helper-api');
    const btnUpiInfoHelperConvertApiKey = document.getElementById('btn-upiInfo-helper-convert-api-key');
    const rowUpiInfoHelperCardKey = document.getElementById('row-upiInfo-helper-card-key');
    const inputUpiInfoHelperCardKey = document.getElementById('input-upiInfo-helper-card-key');
    const btnToggleUpiInfoHelperCardKey = document.getElementById('btn-toggle-upiInfo-helper-card-key');
    const btnUpiInfoHelperBalance = document.getElementById('btn-upiInfo-helper-balance');
    const displayUpiInfoHelperBalance = document.getElementById('display-upiInfo-helper-balance');
    const rowUpiInfoHelperCountryCode = document.getElementById('row-upiInfo-helper-country-code');
    const selectUpiInfoHelperCountryCode = document.getElementById('select-upiInfo-helper-country-code');
    const rowUpiInfoHelperOtpChannel = document.getElementById('row-upiInfo-helper-otp-channel');
    const selectUpiInfoHelperOtpChannel = document.getElementById('select-upiInfo-helper-otp-channel');
    const rowUpiInfoHelperPin = document.getElementById('row-upiInfo-helper-pin');
    const inputUpiInfoHelperPin = document.getElementById('input-upiInfo-helper-pin');
    const btnToggleUpiInfoHelperPin = document.getElementById('btn-toggle-upiInfo-helper-pin');
    const rowUpiSubscriptionApiBaseUrl = document.getElementById('row-upi-subscription-api-base-url');
    const inputUpiSubscriptionApiBaseUrl = document.getElementById('input-upi-subscription-api-base-url');
    const rowUpiRedeemExternalApiKey = document.getElementById('row-upi-redeem-external-api-key');
    const inputUpiRedeemExternalApiKey = document.getElementById('input-upi-redeem-external-api-key');
    const btnToggleUpiRedeemExternalApiKey = document.getElementById('btn-toggle-upi-redeem-external-api-key');
    const rowUpiRedeemClientId = document.getElementById('row-upi-redeem-client-id');
    const inputUpiRedeemClientId = document.getElementById('input-upi-redeem-client-id');
    const rowUpiRedeemFailedAccountRetryLimit = document.getElementById('row-upi-redeem-failed-account-retry-limit');
    const inputUpiRedeemFailedAccountRetryLimit = document.getElementById('input-upi-redeem-failed-account-retry-limit');
    const rowTotpMfaAfterProfileEnabled = document.getElementById('row-totp-mfa-after-profile-enabled');
    const inputTotpMfaAfterProfileEnabled = document.getElementById('input-totp-mfa-after-profile-enabled');
    const rowRegistrationFreeRoute = document.getElementById('row-registration-free-route');
    const selectRegistrationFreeRoute = document.getElementById('select-registration-free-route');
    const rowSetGptPasswordVerificationWaitSeconds = document.getElementById('row-set-gpt-password-verification-wait-seconds');
    const inputSetGptPasswordVerificationWaitSeconds = document.getElementById('input-set-gpt-password-verification-wait-seconds');
    const rowUpiCredentialMembershipTotpApiBaseUrl = document.getElementById('row-upi-credential-membership-totp-api-base-url');
    const inputUpiCredentialMembershipTotpApiBaseUrl = document.getElementById('input-upi-credential-membership-totp-api-base-url');
    const rowUpiCredentialMembershipTotpLookupKey = document.getElementById('row-upi-credential-membership-totp-lookup-key');
    const inputUpiCredentialMembershipTotpLookupKey = document.getElementById('input-upi-credential-membership-totp-lookup-key');
    const rowUpiRedeemStopAfterRedeem = document.getElementById('row-upi-redeem-stop-after-redeem');
    const selectUpiRedeemAfterMode = document.getElementById('select-upi-redeem-after-mode');
    const inputUpiRedeemStopAfterRedeem = document.getElementById('input-upi-redeem-stop-after-redeem');
    const rowUpiRedeemCdkeyPool = document.getElementById('row-upi-redeem-cdkey-pool');
    const inputUpiRedeemCdkeyPool = document.getElementById('input-upi-redeem-cdkey-pool');
    const btnImportCdkPool = document.getElementById('btn-import-cdk-pool');
    const btnDeleteAllCdkPool = document.getElementById('btn-delete-all-cdk-pool');
    const upiRedeemCdkeyPoolSummary = document.getElementById('upi-redeem-cdkey-pool-summary');
    const inputIdealRedeemCdkeyPool = document.getElementById('input-ideal-redeem-cdkey-pool');
    const btnImportIdealCdkPool = document.getElementById('btn-import-ideal-cdk-pool');
    const btnDeleteAllIdealCdkPool = document.getElementById('btn-delete-all-ideal-cdk-pool');
    const idealRedeemCdkeyPoolSummary = document.getElementById('ideal-redeem-cdkey-pool-summary');
    const btnShowUpiCredentialBackups = document.getElementById('btn-show-upi-credential-backups');
    const btnExportUpiCredentialBackups = document.getElementById('btn-export-upi-credential-backups');
    const btnCheckUpiCredentialMembershipLocal = document.getElementById('btn-check-upi-credential-membership-local');
    const btnImportUpiCredentialMembershipTxt = document.getElementById('btn-import-upi-credential-membership-txt');
    const btnImportUpiCredentialMembershipFreeTxt = document.getElementById('btn-import-upi-credential-membership-free-txt');
    const btnStopUpiCredentialMembershipCheck = document.getElementById('btn-stop-upi-credential-membership-check');
    const inputUpiCredentialMembershipTxt = document.getElementById('input-upi-credential-membership-txt');
    const btnExportUpiRedeemSuccessRecords = document.getElementById('btn-export-upi-redeem-success-records');
    const btnUpiRedeemCdkeyStatusRefresh = document.getElementById('btn-upi-redeem-cdkey-status-refresh');
    const upiCredentialBackupPreviewWrap = document.getElementById('upi-credential-backup-preview-wrap');
    const upiCredentialBackupPreview = document.getElementById('upi-credential-backup-preview');
    const upiCredentialMembershipCheckResults = document.getElementById('upi-credential-membership-check-results');
    const upiRedeemCdkeyStatusList = document.getElementById('upi-redeem-cdkey-status-list');
    const idealRedeemCdkeyStatusList = document.getElementById('ideal-redeem-cdkey-status-list');
    const rowLegacyPayCountryCode = document.getElementById('row-legacyPay-country-code');
    const selectLegacyPayCountryCode = document.getElementById('select-legacyPay-country-code');
    const rowLegacyPayOtp = document.getElementById('row-legacyPay-otp');
    const inputLegacyPayOtp = document.getElementById('input-legacyPay-otp');
    const rowLegacyPayPin = document.getElementById('row-legacyPay-pin');
    const inputLegacyPayPin = document.getElementById('input-legacyPay-pin');
    const selectMailProvider = document.getElementById('select-mail-provider');
    const btnMailLogin = document.getElementById('btn-mail-login');
    const rowCustomMailProviderPool = document.getElementById('row-custom-mail-provider-pool');
    const inputCustomMailProviderPool = document.getElementById('input-custom-mail-provider-pool');
    const rowMail2925Mode = document.getElementById('row-mail-2925-mode');
    const rowMail2925PoolSettings = document.getElementById('row-mail2925-pool-settings');
    const mail2925ModeButtons = Array.from(document.querySelectorAll('[data-mail2925-mode]'));
    const rowEmailGenerator = document.getElementById('row-email-generator');
    const selectEmailGenerator = document.getElementById('select-email-generator');
    const rowCustomEmailPool = document.getElementById('row-custom-email-pool');
    const inputCustomEmailPool = document.getElementById('input-custom-email-pool');
    const btnCustomEmailPoolRefresh = document.getElementById('btn-custom-email-pool-refresh');
    const btnCustomEmailPoolClearUsed = document.getElementById('btn-custom-email-pool-clear-used');
    const btnCustomEmailPoolDeleteAll = document.getElementById('btn-custom-email-pool-delete-all');
    const inputCustomEmailPoolImport = document.getElementById('input-custom-email-pool-import');
    const btnCustomEmailPoolImport = document.getElementById('btn-custom-email-pool-import');
    const inputSignupVerificationCodeWaitSeconds = document.getElementById('input-signup-verification-code-wait-seconds');
    const customEmailPoolSummary = document.getElementById('custom-email-pool-summary');
    const inputCustomEmailPoolSearch = document.getElementById('input-custom-email-pool-search');
    const selectCustomEmailPoolFilter = document.getElementById('select-custom-email-pool-filter');
    const checkboxCustomEmailPoolSelectAll = document.getElementById('checkbox-custom-email-pool-select-all');
    const customEmailPoolSelectionSummary = document.getElementById('custom-email-pool-selection-summary');
    const btnCustomEmailPoolBulkUsed = document.getElementById('btn-custom-email-pool-bulk-used');
    const btnCustomEmailPoolBulkUnused = document.getElementById('btn-custom-email-pool-bulk-unused');
    const btnCustomEmailPoolBulkEnable = document.getElementById('btn-custom-email-pool-bulk-enable');
    const btnCustomEmailPoolBulkDisable = document.getElementById('btn-custom-email-pool-bulk-disable');
    const btnCustomEmailPoolBulkDelete = document.getElementById('btn-custom-email-pool-bulk-delete');
    const customEmailPoolList = document.getElementById('custom-email-pool-list');
    const rowTempEmailBaseUrl = document.getElementById('row-temp-email-base-url');
    const inputTempEmailBaseUrl = document.getElementById('input-temp-email-base-url');
    const rowTempEmailAdminAuth = document.getElementById('row-temp-email-admin-auth');
    const inputTempEmailAdminAuth = document.getElementById('input-temp-email-admin-auth');
    const rowTempEmailCustomAuth = document.getElementById('row-temp-email-custom-auth');
    const inputTempEmailCustomAuth = document.getElementById('input-temp-email-custom-auth');
    const rowTempEmailLookupMode = document.getElementById('row-temp-email-lookup-mode');
    const tempEmailLookupModeButtons = Array.from(document.querySelectorAll('[data-temp-email-lookup-mode]'));
    const rowTempEmailReceiveMailbox = document.getElementById('row-temp-email-receive-mailbox');
    const inputTempEmailReceiveMailbox = document.getElementById('input-temp-email-receive-mailbox');
    const rowTempEmailRandomSubdomainToggle = document.getElementById('row-temp-email-random-subdomain-toggle');
    const inputTempEmailUseRandomSubdomain = document.getElementById('input-temp-email-use-random-subdomain');
    const rowTempEmailDomain = document.getElementById('row-temp-email-domain');
    const selectTempEmailDomain = document.getElementById('select-temp-email-domain');
    const tempEmailDomainPickerRoot = document.getElementById('temp-email-domain-picker');
    const btnTempEmailDomainMenu = document.getElementById('btn-temp-email-domain-menu');
    const tempEmailDomainCurrent = document.getElementById('temp-email-domain-current');
    const tempEmailDomainMenu = document.getElementById('temp-email-domain-menu');
    const inputTempEmailDomain = document.getElementById('input-temp-email-domain');
    const btnTempEmailDomainMode = document.getElementById('btn-temp-email-domain-mode');
    const cloudflareTempEmailSection = document.getElementById('cloudflare-temp-email-section');
    const btnCloudflareTempEmailUsageGuide = document.getElementById('btn-cloudflare-temp-email-usage-guide');
    const btnCloudflareTempEmailGithub = document.getElementById('btn-cloudflare-temp-email-github');
    const cloudMailSection = document.getElementById('cloud-mail-section');
    const rowCloudMailBaseUrl = document.getElementById('row-cloud-mail-base-url');
    const rowCloudMailAdminEmail = document.getElementById('row-cloud-mail-admin-email');
    const rowCloudMailAdminPassword = document.getElementById('row-cloud-mail-admin-password');
    const rowCloudMailReceiveMailbox = document.getElementById('row-cloud-mail-receive-mailbox');
    const rowCloudMailDomain = document.getElementById('row-cloud-mail-domain');
    const inputCloudMailBaseUrl = document.getElementById('input-cloud-mail-base-url');
    const inputCloudMailAdminEmail = document.getElementById('input-cloud-mail-admin-email');
    const inputCloudMailAdminPassword = document.getElementById('input-cloud-mail-admin-password');
    const inputCloudMailReceiveMailbox = document.getElementById('input-cloud-mail-receive-mailbox');
    const inputCloudMailDomain = document.getElementById('input-cloud-mail-domain');
    const freemailSection = document.getElementById('freemail-section');
    const btnFreemailGithub = document.getElementById('btn-freemail-github');
    const rowFreemailBaseUrl = document.getElementById('row-freemail-base-url');
    const rowFreemailAdminUsername = document.getElementById('row-freemail-admin-username');
    const rowFreemailAdminPassword = document.getElementById('row-freemail-admin-password');
    const rowFreemailDomain = document.getElementById('row-freemail-domain');
    const inputFreemailBaseUrl = document.getElementById('input-freemail-base-url');
    const inputFreemailAdminUsername = document.getElementById('input-freemail-admin-username');
    const inputFreemailAdminPassword = document.getElementById('input-freemail-admin-password');
    const inputFreemailDomain = document.getElementById('input-freemail-domain');
    const moemailSection = document.getElementById('moemail-section');
    const btnMoemailDocs = document.getElementById('btn-moemail-docs');
    const rowMoemailBaseUrl = document.getElementById('row-moemail-base-url');
    const rowMoemailApiKey = document.getElementById('row-moemail-api-key');
    const rowMoemailDomain = document.getElementById('row-moemail-domain');
    const inputMoemailBaseUrl = document.getElementById('input-moemail-base-url');
    const inputMoemailApiKey = document.getElementById('input-moemail-api-key');
    const inputMoemailDomain = document.getElementById('input-moemail-domain');
    const yydsmailSection = document.getElementById('yydsmail-section');
    const btnYydsMailDocs = document.getElementById('btn-yydsmail-docs');
    const rowYydsMailBaseUrl = document.getElementById('row-yydsmail-base-url');
    const rowYydsMailApiKey = document.getElementById('row-yydsmail-api-key');
    const rowYydsMailDomain = document.getElementById('row-yydsmail-domain');
    const inputYydsMailBaseUrl = document.getElementById('input-yydsmail-base-url');
    const inputYydsMailApiKey = document.getElementById('input-yydsmail-api-key');
    const inputYydsMailDomain = document.getElementById('input-yydsmail-domain');
    const outlookEmailPlusSection = document.getElementById('outlook-email-plus-section');
    const btnOutlookEmailPlusGithub = document.getElementById('btn-outlook-email-plus-github');
    const rowOutlookEmailPlusBaseUrl = document.getElementById('row-outlook-email-plus-base-url');
    const rowOutlookEmailPlusApiKey = document.getElementById('row-outlook-email-plus-api-key');
    const rowOutlookEmailPlusProvider = document.getElementById('row-outlook-email-plus-provider');
    const rowOutlookEmailPlusProjectKey = document.getElementById('row-outlook-email-plus-project-key');
    const rowOutlookEmailPlusCallerIdPrefix = document.getElementById('row-outlook-email-plus-caller-id-prefix');
    const rowOutlookEmailPlusAliasMax = document.getElementById('row-outlook-email-plus-alias-max');
    const inputOutlookEmailPlusBaseUrl = document.getElementById('input-outlook-email-plus-base-url');
    const inputOutlookEmailPlusApiKey = document.getElementById('input-outlook-email-plus-api-key');
    const inputOutlookEmailPlusProvider = document.getElementById('input-outlook-email-plus-provider');
    const inputOutlookEmailPlusProjectKey = document.getElementById('input-outlook-email-plus-project-key');
    const inputOutlookEmailPlusCallerIdPrefix = document.getElementById('input-outlook-email-plus-caller-id-prefix');
    const inputOutlookEmailPlusAliasMaxPerMailbox = document.getElementById('input-outlook-email-plus-alias-max-per-mailbox');
    const hotmailSection = document.getElementById('hotmail-section');
    const mail2925Section = document.getElementById('mail2925-section');
    const luckmailSection = document.getElementById('luckmail-section');
    const icloudSection = document.getElementById('icloud-section');
    const icloudSummary = document.getElementById('icloud-summary');
    const icloudList = document.getElementById('icloud-list');
    const icloudLoginHelp = document.getElementById('icloud-login-help');
    const icloudLoginHelpTitle = document.getElementById('icloud-login-help-title');
    const icloudLoginHelpText = document.getElementById('icloud-login-help-text');
    const btnIcloudLoginDone = document.getElementById('btn-icloud-login-done');
    const btnIcloudRefresh = document.getElementById('btn-icloud-refresh');
    const btnIcloudDeleteUsed = document.getElementById('btn-icloud-delete-used');
    const selectIcloudHostPreference = document.getElementById('select-icloud-host-preference');
    const rowIcloudTargetMailboxType = document.getElementById('row-icloud-target-mailbox-type');
    const selectIcloudTargetMailboxType = document.getElementById('select-icloud-target-mailbox-type');
    const rowIcloudForwardMailProvider = document.getElementById('row-icloud-forward-mail-provider');
    const selectIcloudForwardMailProvider = document.getElementById('select-icloud-forward-mail-provider');
    const rowIcloudApiBaseUrl = document.getElementById('row-icloud-api-base-url');
    const rowIcloudApiAdminKey = document.getElementById('row-icloud-api-admin-key');
    const inputIcloudApiBaseUrl = document.getElementById('input-icloud-api-base-url');
    const inputIcloudApiAdminKey = document.getElementById('input-icloud-api-admin-key');
    const selectIcloudFetchMode = document.getElementById('select-icloud-fetch-mode');
    const checkboxAutoDeleteIcloud = document.getElementById('checkbox-auto-delete-icloud');
    const inputIcloudSearch = document.getElementById('input-icloud-search');
    const selectIcloudFilter = document.getElementById('select-icloud-filter');
    const checkboxIcloudSelectAll = document.getElementById('checkbox-icloud-select-all');
    const icloudSelectionSummary = document.getElementById('icloud-selection-summary');
    const btnIcloudBulkUsed = document.getElementById('btn-icloud-bulk-used');
    const btnIcloudBulkUnused = document.getElementById('btn-icloud-bulk-unused');
    const btnIcloudBulkPreserve = document.getElementById('btn-icloud-bulk-preserve');
    const btnIcloudBulkUnpreserve = document.getElementById('btn-icloud-bulk-unpreserve');
    const btnIcloudBulkDelete = document.getElementById('btn-icloud-bulk-delete');
    const rowHotmailServiceMode = document.getElementById('row-hotmail-service-mode');
    const hotmailServiceModeButtons = Array.from(document.querySelectorAll('[data-hotmail-service-mode]'));
    const rowHotmailRemoteBaseUrl = document.getElementById('row-hotmail-remote-base-url');
    const inputHotmailRemoteBaseUrl = document.getElementById('input-hotmail-remote-base-url');
    const rowHotmailLocalBaseUrl = document.getElementById('row-hotmail-local-base-url');
    const inputHotmailLocalBaseUrl = document.getElementById('input-hotmail-local-base-url');
    const rowHotmailAliasEnabled = document.getElementById('row-hotmail-alias-enabled');
    const inputHotmailAliasEnabled = document.getElementById('input-hotmail-alias-enabled');
    const rowOutlookAliasMax = document.getElementById('row-outlook-alias-max');
    const inputOutlookAliasMaxPerAccount = document.getElementById('input-outlook-alias-max-per-account');
    const inputHotmailEmail = document.getElementById('input-hotmail-email');
    const inputHotmailClientId = document.getElementById('input-hotmail-client-id');
    const inputHotmailPassword = document.getElementById('input-hotmail-password');
    const inputHotmailRefreshToken = document.getElementById('input-hotmail-refresh-token');
    const inputHotmailImport = document.getElementById('input-hotmail-import');
    const inputHotmailSearch = document.getElementById('input-hotmail-search');
    const selectHotmailFilter = document.getElementById('select-hotmail-filter');
    const btnAddHotmailAccount = document.getElementById('btn-add-hotmail-account');
    const btnImportHotmailAccounts = document.getElementById('btn-import-hotmail-accounts');
    const btnToggleHotmailForm = document.getElementById('btn-toggle-hotmail-form');
    const btnHotmailUsageGuide = document.getElementById('btn-hotmail-usage-guide');
    const btnClearUsedHotmailAccounts = document.getElementById('btn-clear-used-hotmail-accounts');
    const btnDeleteAllHotmailAccounts = document.getElementById('btn-delete-all-hotmail-accounts');
    const btnToggleHotmailList = document.getElementById('btn-toggle-hotmail-list');
    const hotmailFormShell = document.getElementById('hotmail-form-shell');
    const hotmailListShell = document.getElementById('hotmail-list-shell');
    const hotmailAccountsList = document.getElementById('hotmail-accounts-list');
    const removedPaymentWorkerSection = document.getElementById('removedPaymentWorker-section');
    const displayRemovedPaymentWorkerStatus = document.getElementById('display-removedPaymentWorker-status');
    const inputRemovedPaymentWorkerEnabled = document.getElementById('input-removedPaymentWorker-enabled');
    const removedPaymentWorkerSettingsShell = document.getElementById('removedPaymentWorker-settings-shell');
    const selectRemovedPaymentWorkerBrowserBackend = document.getElementById('select-removedPaymentWorker-browser-backend');
    const rowRemovedPaymentWorkerAdsPowerApiBase = document.getElementById('row-removedPaymentWorker-adspower-api-base');
    const inputRemovedPaymentWorkerAdsPowerApiBase = document.getElementById('input-removedPaymentWorker-adspower-api-base');
    const rowRemovedPaymentWorkerAdsPowerApiKey = document.getElementById('row-removedPaymentWorker-adspower-api-key');
    const inputRemovedPaymentWorkerAdsPowerApiKey = document.getElementById('input-removedPaymentWorker-adspower-api-key');
    const rowRemovedPaymentWorkerRoxyBrowserApiBase = document.getElementById('row-removedPaymentWorker-roxybrowser-api-base');
    const inputRemovedPaymentWorkerRoxyBrowserApiBase = document.getElementById('input-removedPaymentWorker-roxybrowser-api-base');
    const rowRemovedPaymentWorkerRoxyBrowserApiKey = document.getElementById('row-removedPaymentWorker-roxybrowser-api-key');
    const inputRemovedPaymentWorkerRoxyBrowserApiKey = document.getElementById('input-removedPaymentWorker-roxybrowser-api-key');
    const rowRemovedPaymentWorkerAdsPowerProfileId = document.getElementById('row-removedPaymentWorker-adspower-profile-id');
    const inputRemovedPaymentWorkerAdsPowerProfileId = document.getElementById('input-removedPaymentWorker-adspower-profile-id');
    const rowRemovedPaymentWorkerRoxyBrowserProfileId = document.getElementById('row-removedPaymentWorker-roxybrowser-profile-id');
    const inputRemovedPaymentWorkerRoxyBrowserProfileId = document.getElementById('input-removedPaymentWorker-roxybrowser-profile-id');
    const inputRemovedPaymentWorkerStripePublishableKey = document.getElementById('input-removedPaymentWorker-stripe-publishable-key');
    const inputRemovedPaymentWorkerDeviceId = document.getElementById('input-removedPaymentWorker-device-id');
    const inputRemovedPaymentWorkerUserAgent = document.getElementById('input-removedPaymentWorker-user-agent');
    const inputRemovedPaymentWorkerMaxAttempts = document.getElementById('input-removedPaymentWorker-max-attempts');
    const selectRemovedPaymentWorkerPaymentLocale = document.getElementById('select-removedPaymentWorker-payment-locale');
    const inputRemovedPaymentWorkerCheckoutRebuildMaxAttempts = document.getElementById('input-removedPaymentWorker-checkout-rebuild-max-attempts');
    const inputRemovedPaymentWorkerDefaultProxy = document.getElementById('input-removedPaymentWorker-default-proxy');
    const rowRemovedPaymentWorkerProviderProxy = document.getElementById('row-removedPaymentWorker-provider-proxy');
    const inputRemovedPaymentWorkerProviderProxy = document.getElementById('input-removedPaymentWorker-provider-proxy');
    const btnSaveRemovedPaymentWorkerSettings = document.getElementById('btn-save-removedPaymentWorker-settings');
    const btnClearRemovedPaymentWorkerSettings = document.getElementById('btn-clear-removedPaymentWorker-settings');
    const btnRemovedPaymentWorkerPause = document.getElementById('btn-removedPaymentWorker-pause');
    const btnRemovedPaymentWorkerResume = document.getElementById('btn-removedPaymentWorker-resume');
    const displayRemovedPaymentWorkerRuntime = document.getElementById('display-removedPaymentWorker-runtime');
    const inputMail2925Email = document.getElementById('input-mail2925-email');
    const inputMail2925Password = document.getElementById('input-mail2925-password');
    const inputMail2925Import = document.getElementById('input-mail2925-import');
    const inputMail2925Search = document.getElementById('input-mail2925-search');
    const selectMail2925Filter = document.getElementById('select-mail2925-filter');
    const btnAddMail2925Account = document.getElementById('btn-add-mail2925-account');
    const btnToggleMail2925Form = document.getElementById('btn-toggle-mail2925-form');
    const btnImportMail2925Accounts = document.getElementById('btn-import-mail2925-accounts');
    const btnDeleteAllMail2925Accounts = document.getElementById('btn-delete-all-mail2925-accounts');
    const btnToggleMail2925List = document.getElementById('btn-toggle-mail2925-list');
    const mail2925FormShell = document.getElementById('mail2925-form-shell');
    const mail2925ListShell = document.getElementById('mail2925-list-shell');
    const mail2925AccountsList = document.getElementById('mail2925-accounts-list');
    const inputLuckmailApiKey = document.getElementById('input-luckmail-api-key');
    const inputLuckmailBaseUrl = document.getElementById('input-luckmail-base-url');
    const selectLuckmailEmailType = document.getElementById('select-luckmail-email-type');
    const inputLuckmailDomain = document.getElementById('input-luckmail-domain');
    const btnLuckmailRefresh = document.getElementById('btn-luckmail-refresh');
    const btnLuckmailDisableUsed = document.getElementById('btn-luckmail-disable-used');
    const luckmailSummary = document.getElementById('luckmail-summary');
    const inputLuckmailSearch = document.getElementById('input-luckmail-search');
    const selectLuckmailFilter = document.getElementById('select-luckmail-filter');
    const checkboxLuckmailSelectAll = document.getElementById('checkbox-luckmail-select-all');
    const luckmailSelectionSummary = document.getElementById('luckmail-selection-summary');
    const btnLuckmailBulkUsed = document.getElementById('btn-luckmail-bulk-used');
    const btnLuckmailBulkUnused = document.getElementById('btn-luckmail-bulk-unused');
    const btnLuckmailBulkPreserve = document.getElementById('btn-luckmail-bulk-preserve');
    const btnLuckmailBulkUnpreserve = document.getElementById('btn-luckmail-bulk-unpreserve');
    const btnLuckmailBulkDisable = document.getElementById('btn-luckmail-bulk-disable');
    const btnLuckmailBulkEnable = document.getElementById('btn-luckmail-bulk-enable');
    const luckmailList = document.getElementById('luckmail-list');
    const rowEmailPrefix = document.getElementById('row-email-prefix');
    const labelEmailPrefix = document.getElementById('label-email-prefix');
    const inputEmailPrefix = document.getElementById('input-email-prefix');
    const selectMail2925PoolAccount = document.getElementById('select-mail2925-pool-account');
    const inputMail2925UseAccountPool = document.getElementById('input-mail2925-use-account-pool');
    const labelMail2925UseAccountPool = document.getElementById('label-mail2925-use-account-pool');
    const rowInbucketHost = document.getElementById('row-inbucket-host');
    const inputInbucketHost = document.getElementById('input-inbucket-host');
    const rowInbucketMailbox = document.getElementById('row-inbucket-mailbox');
    const inputInbucketMailbox = document.getElementById('input-inbucket-mailbox');
    const rowCfDomain = document.getElementById('row-cf-domain');
    const selectCfDomain = document.getElementById('select-cf-domain');
    const cfDomainPickerRoot = document.getElementById('cf-domain-picker');
    const btnCfDomainMenu = document.getElementById('btn-cf-domain-menu');
    const cfDomainCurrent = document.getElementById('cf-domain-current');
    const cfDomainMenu = document.getElementById('cf-domain-menu');
    const inputCfDomain = document.getElementById('input-cf-domain');
    const btnCfDomainMode = document.getElementById('btn-cf-domain-mode');
    const inputRunCount = document.getElementById('input-run-count');
    const inputAutoSkipFailures = document.getElementById('input-auto-skip-failures');
    const inputAutoRunRetryNonFreeTrial = document.getElementById('input-auto-run-retry-non-free-trial');
    const inputAutoRunRetryLegacyWalletCallback = document.getElementById('input-auto-run-retry-legacyWallet-callback');
    const inputAutoRunRetryShortLinkError = document.getElementById('input-auto-run-retry-short-link-error');
    const inputAutoSkipFailuresThreadIntervalMinutes = document.getElementById('input-auto-skip-failures-thread-interval-minutes');
    const inputStep6CookieCleanupEnabled = document.getElementById('input-step6-cookie-cleanup-enabled');
    const inputAutoDelayEnabled = document.getElementById('input-auto-delay-enabled');
    const inputAutoDelayMinutes = document.getElementById('input-auto-delay-minutes');
    const inputAutoStepDelaySeconds = document.getElementById('input-auto-step-delay-seconds');
    const inputOperationDelayEnabled = document.getElementById('input-operation-delay-enabled');
    const inputOAuthFlowTimeoutEnabled = document.getElementById('input-oauth-flow-timeout-enabled');
    const rowAccountRunHistoryHelperBaseUrl = document.getElementById('row-account-run-history-helper-base-url');
    const inputAccountRunHistoryHelperBaseUrl = document.getElementById('input-account-run-history-helper-base-url');
    const autoStartModal = document.getElementById('auto-start-modal');
    const sharedFormModal = document.getElementById('shared-form-modal');
    const sharedFormModalTitle = document.getElementById('shared-form-modal-title');
    const btnSharedFormModalClose = document.getElementById('btn-shared-form-modal-close');
    const sharedFormModalMessage = document.getElementById('shared-form-modal-message');
    const sharedFormModalAlert = document.getElementById('shared-form-modal-alert');
    const sharedFormModalFields = document.getElementById('shared-form-modal-fields');
    const btnSharedFormModalCancel = document.getElementById('btn-shared-form-modal-cancel');
    const btnSharedFormModalConfirm = document.getElementById('btn-shared-form-modal-confirm');
    const autoStartTitle = autoStartModal?.querySelector('.modal-title');
    const autoStartMessage = document.getElementById('auto-start-message');
    const autoStartAlert = document.getElementById('auto-start-alert');
    const modalOptionRow = document.getElementById('modal-option-row');
    const modalOptionInput = document.getElementById('modal-option-input');
    const modalOptionText = document.getElementById('modal-option-text');
    const btnAutoStartClose = document.getElementById('btn-auto-start-close');
    const btnAutoStartCancel = document.getElementById('btn-auto-start-cancel');
    const btnAutoStartRestart = document.getElementById('btn-auto-start-restart');
    const btnAutoStartContinue = document.getElementById('btn-auto-start-continue');
    const autoHintText = document.querySelector('.auto-hint');
    const stepsList = document.querySelector('.steps-list');
    const toastContainer = document.getElementById('toast-container');

    return {
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
    };
  }

  globalScope.SidepanelDomBindings = {
    getBindings,
  };
})(self);
