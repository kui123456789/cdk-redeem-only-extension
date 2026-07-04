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
const rowUpiInfoHelperPhoneMode = document.getElementById('row-upiInfo-helper-phone-mode');
const selectUpiInfoHelperPhoneMode = document.getElementById('select-upiInfo-helper-phone-mode');
const rowUpiInfoHelperCountryCode = document.getElementById('row-upiInfo-helper-country-code');
const selectUpiInfoHelperCountryCode = document.getElementById('select-upiInfo-helper-country-code');
const rowUpiInfoHelperPhone = document.getElementById('row-upiInfo-helper-phone');
const inputUpiInfoHelperPhone = document.getElementById('input-upiInfo-helper-phone');
const rowUpiInfoHelperOtpChannel = document.getElementById('row-upiInfo-helper-otp-channel');
const selectUpiInfoHelperOtpChannel = document.getElementById('select-upiInfo-helper-otp-channel');
const rowUpiInfoHelperLocalSmsEnabled = document.getElementById('row-upiInfo-helper-local-sms-enabled');
const inputUpiInfoHelperLocalSmsEnabled = document.getElementById('input-upiInfo-helper-local-sms-enabled');
const rowUpiInfoHelperLocalSmsUrl = document.getElementById('row-upiInfo-helper-local-sms-url');
const inputUpiInfoHelperLocalSmsUrl = document.getElementById('input-upiInfo-helper-local-sms-url');
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
const rowLegacyPayPhone = document.getElementById('row-legacyPay-phone');
const inputLegacyPayPhone = document.getElementById('input-legacyPay-phone');
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
const inputVerificationResendCount = document.getElementById('input-verification-resend-count');
const authVerificationSection = document.getElementById('auth-verification-section');
const rowAuthVerificationEnabled = document.getElementById('row-auth-verification-enabled');
const btnToggleAuthVerificationSection = document.getElementById('btn-toggle-auth-verification-section');
const rowAuthVerificationFold = document.getElementById('row-auth-verification-fold');
const inputAuthVerificationEnabled = document.getElementById('input-auth-verification-enabled');
const rowSignupMethod = document.getElementById('row-signup-method');
const signupMethodButtons = Array.from(document.querySelectorAll('[data-signup-method]'));
const rowAuthVerificationResendCount = document.getElementById('row-auth-verification-resend-count');
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
const autoHintText = document.querySelector('.auto-hint');
const stepsList = document.querySelector('.steps-list');

function placeAuthVerificationSectionNearMainSettings() {
  const mailProviderRow = document.getElementById('row-mail-provider');
  if (!settingsCard || !authVerificationSection || !mailProviderRow) {
    return;
  }
  authVerificationSection.classList.remove('data-card');
  authVerificationSection.classList.add('module-divider-start');
  if (authVerificationSection.parentElement !== settingsCard || authVerificationSection.nextElementSibling !== mailProviderRow) {
    settingsCard.insertBefore(authVerificationSection, mailProviderRow);
  }
}

placeAuthVerificationSectionNearMainSettings();

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
const UPI_INFO_HELPER_PHONE_MODE_AUTO = 'auto';
const UPI_INFO_HELPER_PHONE_MODE_MANUAL = 'manual';
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
const DEFAULT_SET_GPT_PASSWORD_VERIFICATION_WAIT_SECONDS = 10;
const SET_GPT_PASSWORD_VERIFICATION_WAIT_MAX_SECONDS = 300;
const DEFAULT_UPI_REDEEM_FAILED_ACCOUNT_RETRY_LIMIT = 3;
const UPI_REDEEM_FAILED_ACCOUNT_RETRY_LIMIT_MAX = 20;
const DEFAULT_SIGNUP_VERIFICATION_CODE_WAIT_SECONDS = 10;
const SIGNUP_VERIFICATION_CODE_WAIT_MAX_SECONDS = 300;
let latestState = null;
let localChatgptSessionReaderMode = DEFAULT_CHATGPT_SESSION_READER_MODE;
let localChatgptSessionReaderProfiles = {
  [CHATGPT_SESSION_READER_MODE_US_PP]: null,
  [CHATGPT_SESSION_READER_MODE_JP_PP]: null,
};
let currentPlusModeEnabled = false;
let currentPlusPaymentMethod = DEFAULT_PLUS_PAYMENT_METHOD;
let currentPlusAccountAccessStrategy = PLUS_ACCOUNT_ACCESS_STRATEGY_OAUTH;
let currentSignupMethod = DEFAULT_SIGNUP_METHOD;
let currentUpiRedeemStopAfterRedeem = true;
let currentTotpMfaAfterProfileEnabled = DEFAULT_TOTP_MFA_AFTER_PROFILE_ENABLED;
let localCpaJsonAuthDirExpanded = false;
let lastConfirmedOperationDelayEnabled = false;
let stepDefinitions = getStepDefinitionsForMode(false, {
  plusPaymentMethod: currentPlusPaymentMethod,
  plusAccountAccessStrategy: currentPlusAccountAccessStrategy,
  signupMethod: currentSignupMethod,
  upiRedeemStopAfterRedeem: currentUpiRedeemStopAfterRedeem,
  totpMfaAfterProfileEnabled: currentTotpMfaAfterProfileEnabled,
});
let workflowNodes = getWorkflowNodesForMode(false, {
  plusPaymentMethod: currentPlusPaymentMethod,
  plusAccountAccessStrategy: currentPlusAccountAccessStrategy,
  signupMethod: currentSignupMethod,
  upiRedeemStopAfterRedeem: currentUpiRedeemStopAfterRedeem,
  totpMfaAfterProfileEnabled: currentTotpMfaAfterProfileEnabled,
});
let STEP_IDS = stepDefinitions.map((step) => Number(step.id)).filter(Number.isFinite);
let STEP_DEFAULT_STATUSES = Object.fromEntries(STEP_IDS.map((stepId) => [stepId, 'pending']));
let SKIPPABLE_STEPS = new Set(STEP_IDS);
let NODE_IDS = workflowNodes.map((node) => String(node.nodeId || '').trim()).filter(Boolean);
let NODE_DEFAULT_STATUSES = Object.fromEntries(NODE_IDS.map((nodeId) => [nodeId, 'pending']));
let SKIPPABLE_NODES = new Set(NODE_IDS);
const INDEPENDENT_EXECUTE_NODES = new Set(['enable-totp-mfa']);
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
const AUTH_VERIFICATION_SECTION_EXPANDED_STORAGE_KEY = 'multipage-auth-verification-section-expanded';
const AUTH_VERIFICATION_SECTION_COLLAPSED_VALUE = '0';
let authVerificationSectionExpanded = true;

function readAuthVerificationSectionExpanded() {
  try {
    const savedValue = window.localStorage?.getItem(AUTH_VERIFICATION_SECTION_EXPANDED_STORAGE_KEY);
    return savedValue !== AUTH_VERIFICATION_SECTION_COLLAPSED_VALUE;
  } catch (err) {
    return true;
  }
}

function persistAuthVerificationSectionExpanded(expanded) {
  try {
    if (expanded) {
      window.localStorage?.setItem(AUTH_VERIFICATION_SECTION_EXPANDED_STORAGE_KEY, '1');
    } else {
      window.localStorage?.setItem(AUTH_VERIFICATION_SECTION_EXPANDED_STORAGE_KEY, AUTH_VERIFICATION_SECTION_COLLAPSED_VALUE);
    }
  } catch (err) {
    // Ignore storage errors; the current in-memory state is enough for this session.
  }
}

function setAuthVerificationSectionExpanded(expanded) {
  authVerificationSectionExpanded = Boolean(expanded);
  persistAuthVerificationSectionExpanded(authVerificationSectionExpanded);
  if (typeof updateAuthVerificationSettingsUI === 'function') {
    updateAuthVerificationSettingsUI();
  }
}

function toggleAuthVerificationSectionExpanded() {
  setAuthVerificationSectionExpanded(!authVerificationSectionExpanded);
}

function initAuthVerificationSectionExpandedState() {
  authVerificationSectionExpanded = readAuthVerificationSectionExpanded();
  if (typeof updateAuthVerificationSettingsUI === 'function') {
    updateAuthVerificationSettingsUI();
  }
}

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
  const normalizeAccountAccessStrategySafe = typeof normalizePlusAccountAccessStrategy === 'function'
    ? normalizePlusAccountAccessStrategy
    : (() => 'oauth');
  currentPlusPaymentMethod = normalizePlusPaymentMethod(rawPaymentMethod);
  currentPlusAccountAccessStrategy = normalizeAccountAccessStrategySafe(rawAccountAccessStrategy);
  currentSignupMethod = normalizeSignupMethod(rawSignupMethod);
  currentUpiRedeemStopAfterRedeem = upiRedeemStopAfterRedeem;
  currentTotpMfaAfterProfileEnabled = totpMfaAfterProfileEnabled;
  stepDefinitions = getStepDefinitionsForMode(currentPlusModeEnabled, {
    activeFlowId: options?.activeFlowId,
    panelMode: options?.panelMode,
    plusPaymentMethod: currentPlusPaymentMethod,
    plusAccountAccessStrategy: currentPlusAccountAccessStrategy,
    signupMethod: currentSignupMethod,
    upiRedeemStopAfterRedeem: currentUpiRedeemStopAfterRedeem,
    upiRedeemContinueAfterRedeem,
    totpMfaAfterProfileEnabled: currentTotpMfaAfterProfileEnabled,
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

function getManagedAliasUtils() {
  return window.MultiPageManagedAliasUtils || null;
}

function isManagedAliasProvider(provider = selectMailProvider.value, mail2925Mode = getSelectedMail2925Mode()) {
  const utils = getManagedAliasUtils();
  if (utils?.usesManagedAliasGeneration) {
    return utils.usesManagedAliasGeneration(provider, { mail2925Mode });
  }
  if (utils?.isManagedAliasProvider) {
    const normalizedProvider = String(provider || '').trim().toLowerCase();
    if (normalizedProvider === '2925') {
      return utils.isManagedAliasProvider(provider)
        && normalizeMail2925Mode(mail2925Mode) === MAIL_2925_MODE_PROVIDE;
    }
    return utils.isManagedAliasProvider(provider);
  }
  const normalizedProvider = String(provider || '').trim().toLowerCase();
  if (normalizedProvider === '2925') {
    return normalizeMail2925Mode(mail2925Mode) === MAIL_2925_MODE_PROVIDE;
  }
  return normalizedProvider === GMAIL_PROVIDER;
}

function parseManagedAliasBaseEmail(rawValue, provider = selectMailProvider.value) {
  const utils = getManagedAliasUtils();
  if (utils?.parseManagedAliasBaseEmail) {
    return utils.parseManagedAliasBaseEmail(rawValue, provider);
  }
  return null;
}

function isManagedAliasEmail(value, baseEmail = '', provider = selectMailProvider.value) {
  const utils = getManagedAliasUtils();
  if (utils?.isManagedAliasEmail) {
    return utils.isManagedAliasEmail(value, provider, baseEmail);
  }
  return false;
}

function getManagedAliasProviderUiCopy(provider = selectMailProvider.value, mail2925Mode = getSelectedMail2925Mode()) {
  if (!isManagedAliasProvider(provider, mail2925Mode)) {
    return null;
  }
  const utils = getManagedAliasUtils();
  if (utils?.getManagedAliasProviderUiCopy) {
    return utils.getManagedAliasProviderUiCopy(provider);
  }
  if (String(provider || '').trim().toLowerCase() === GMAIL_PROVIDER) {
    return {
      baseLabel: '基邮箱',
      basePlaceholder: '例如 yourname@gmail.com',
      buttonLabel: '生成',
      successVerb: '生成',
      label: 'Gmail +tag 邮箱',
      placeholder: '点击生成 Gmail +tag 邮箱，或手动填写完整邮箱',
      hint: '先填写基邮箱后点“生成”，也可以直接手动填写完整的 Gmail 邮箱。',
    };
  }
  if (String(provider || '').trim().toLowerCase() === '2925') {
    return {
      baseLabel: '基邮箱',
      basePlaceholder: '例如 yourname@2925.com',
      buttonLabel: '生成',
      successVerb: '生成',
      label: '2925 邮箱',
      placeholder: '点击生成 2925 邮箱，或手动填写完整邮箱',
      hint: '先填写基邮箱后点“生成”，也可以直接手动填写完整的 2925 邮箱。',
    };
  }
  return null;
}

function getManagedAliasBaseEmailKey(provider = selectMailProvider.value) {
  const normalizedProvider = String(provider || '').trim().toLowerCase();
  if (normalizedProvider === GMAIL_PROVIDER) {
    return 'gmailBaseEmail';
  }
  if (normalizedProvider === '2925') {
    return 'mail2925BaseEmail';
  }
  return '';
}

function isMail2925AccountPoolEnabled(state = latestState) {
  return Boolean(state?.mail2925UseAccountPool);
}

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

function getManagedAliasBaseEmailForProvider(provider = selectMailProvider.value, state = latestState) {
  if (String(provider || '').trim().toLowerCase() === '2925' && isMail2925AccountPoolEnabled(state)) {
    const currentMail2925Email = getCurrentMail2925Email(state);
    if (currentMail2925Email) {
      return currentMail2925Email;
    }
  }

  const key = getManagedAliasBaseEmailKey(provider);
  if (!key) {
    return '';
  }

  const providerValue = String(state?.[key] || '').trim();
  if (providerValue) {
    return providerValue;
  }

  const legacyEmailPrefix = String(state?.emailPrefix || '').trim();
  return parseManagedAliasBaseEmail(legacyEmailPrefix, provider) ? legacyEmailPrefix : '';
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
  if (!usesGeneratedAliasMailProvider(provider, getSelectedMail2925Mode()) || !email) {
    return true;
  }
  const baseEmail = getManagedAliasBaseEmailForProvider(provider, state);
  return isManagedAliasEmail(email, baseEmail, provider);
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

let currentAutoRun = {
  autoRunning: false,
  phase: 'idle',
  currentRun: 0,
  totalRuns: 1,
  attemptRun: 0,
  scheduledAt: null,
  countdownAt: null,
  countdownTitle: '',
  countdownNote: '',
};
let pendingAutoRunStartTotalRuns = 0;
let pendingAutoRunStartExpiresAt = 0;
let settingsDirty = false;
let settingsSaveInFlight = false;
let settingsAutoSaveTimer = null;
let settingsSaveRevision = 0;
let customPasswordSaveRevision = 0;
let cloudflareDomainEditMode = false;
let cloudflareTempEmailDomainEditMode = false;
let activePlusManualConfirmationRequestId = '';
let plusManualConfirmationDialogInFlight = false;
let scheduledCountdownTimer = null;
let configMenuOpen = false;
let configActionInFlight = false;
let currentReleaseSnapshot = null;
let currentContributionContentSnapshot = null;
let contributionContentSnapshotRequestInFlight = null;

function normalizeAutomationWindowId(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const numeric = Number(value);
  return Number.isInteger(numeric) && numeric >= 0 ? numeric : null;
}

async function getCurrentSidepanelWindowId() {
  if (chrome?.windows?.getCurrent) {
    try {
      const currentWindow = await chrome.windows.getCurrent();
      const windowId = normalizeAutomationWindowId(currentWindow?.id);
      if (windowId !== null) {
        return windowId;
      }
    } catch (error) {
      console.warn('Failed to get current sidepanel window:', error?.message || error);
    }
  }

  return normalizeAutomationWindowId(latestState?.automationWindowId);
}

function shouldAttachAutomationWindow(message = {}) {
  const source = String(message?.source || '').trim();
  if (source && source !== 'sidepanel') {
    return false;
  }
  return [
    'EXECUTE_NODE',
    'AUTO_RUN',
    'SCHEDULE_AUTO_RUN',
    'RESUME_AUTO_RUN',
    'START_SCHEDULED_AUTO_RUN_NOW',
    'SKIP_AUTO_RUN_COUNTDOWN',
  ].includes(String(message?.type || '').trim());
}

async function sendSidepanelMessage(message = {}) {
  const payload = {
    ...(message || {}),
    source: message?.source || 'sidepanel',
  };
  if (shouldAttachAutomationWindow(payload)) {
    const windowId = await getCurrentSidepanelWindowId();
    if (windowId !== null) {
      payload.payload = {
        ...(payload.payload || {}),
        automationWindowId: windowId,
      };
      syncLatestState({ automationWindowId: windowId });
    }
  }
  return chrome.runtime.sendMessage(payload);
}

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

const cfDomainPicker = createEditableListPicker({
  root: cfDomainPickerRoot,
  input: selectCfDomain,
  trigger: btnCfDomainMenu,
  current: cfDomainCurrent,
  menu: cfDomainMenu,
  emptyLabel: '请先添加域名',
  itemLabel: '域名',
  normalizeItems: normalizeCloudflareDomains,
  normalizeValue: normalizeCloudflareDomainValue,
  onDelete: handleDeleteCloudflareDomain,
  onDeleteError: (error) => showToast(error?.message || '删除 Cloudflare 域名失败。', 'error'),
});

const tempEmailDomainPicker = createEditableListPicker({
  root: tempEmailDomainPickerRoot,
  input: selectTempEmailDomain,
  trigger: btnTempEmailDomainMenu,
  current: tempEmailDomainCurrent,
  menu: tempEmailDomainMenu,
  emptyLabel: '请先更新域名',
  itemLabel: '域名',
  normalizeItems: normalizeCloudflareTempEmailDomains,
  normalizeValue: normalizeCloudflareTempEmailDomainValue,
  onDelete: handleDeleteCloudflareTempEmailDomain,
  onDeleteError: (error) => showToast(error?.message || '删除 Cloudflare Temp Email 域名失败。', 'error'),
});

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
let customEmailPoolEntriesState = [];

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
    const separatorIndex = raw.indexOf('----');
    const emailSource = separatorIndex >= 0 ? raw.slice(0, separatorIndex) : raw;
    const suffix = separatorIndex >= 0 ? raw.slice(separatorIndex + 4).trim() : '';
    const verificationUrl = normalizeCustomEmailVerificationUrlValue(suffix);
    return {
      email: emailSource.trim().toLowerCase(),
      credential: separatorIndex >= 0 && !verificationUrl ? raw : '',
      verificationUrl,
    };
  });
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

const toastContainer = document.getElementById('toast-container');

const TOAST_ICONS = {
  error: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
  warn: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  success: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  info: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
};

const LOG_LEVEL_LABELS = {
  info: '信息',
  ok: '成功',
  warn: '警告',
  error: '错误',
};

const CLOUDFLARE_TEMP_EMAIL_REPOSITORY_URL = 'https://github.com/QLHazyCoder/cloudflare_temp_email';

let lastLocalHelperStartupAlertAt = 0;

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

function showToast(message, type = 'error', duration = 4000) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `${TOAST_ICONS[type] || ''}<span class="toast-msg">${escapeHtml(message)}</span><button class="toast-close">&times;</button>`;

  toast.querySelector('.toast-close').addEventListener('click', () => dismissToast(toast));
  toastContainer.appendChild(toast);

  if (duration > 0) {
    setTimeout(() => dismissToast(toast), duration);
  }
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
  if (!toast.parentNode) return;
  toast.classList.add('toast-exit');
  toast.addEventListener('animationend', () => toast.remove());
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
    message: `当前轮数可能不适合单节点情况，可选择对应代理工具节点轮询功能（若没有配置，请使用说明按钮，根据README中使用教程进行配置），避免连续使用一个节点注册，导致出现手机号验证。`,
    confirmLabel: '继续',
  });

  return {
    confirmed: result.confirmed,
    dismissPrompt: result.optionChecked,
  };
}

function updateConfigMenuControls() {
  const disabled = configActionInFlight || settingsSaveInFlight;
  const contributionModeEnabled = Boolean(latestState?.contributionMode);
  if (contributionModeEnabled && configMenuOpen) {
    configMenuOpen = false;
  }
  const importLocked = disabled
    || contributionModeEnabled
    || currentAutoRun.autoRunning
    || Object.values(getStepStatuses()).some((status) => status === 'running');
  if (btnConfigMenu) {
    btnConfigMenu.disabled = disabled || contributionModeEnabled;
    btnConfigMenu.setAttribute('aria-expanded', String(configMenuOpen));
  }
  if (configMenu) {
    configMenu.hidden = contributionModeEnabled || !configMenuOpen;
  }
  if (btnExportSettings) {
    btnExportSettings.disabled = disabled || contributionModeEnabled;
  }
  if (btnImportSettings) {
    btnImportSettings.disabled = importLocked;
  }
}

function closeConfigMenu() {
  configMenuOpen = false;
  updateConfigMenuControls();
}

function openConfigMenu() {
  configMenuOpen = true;
  updateConfigMenuControls();
}

function toggleConfigMenu() {
  configMenuOpen ? closeConfigMenu() : openConfigMenu();
}

async function waitForSettingsSaveIdle() {
  while (settingsSaveInFlight) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

async function flushPendingSettingsBeforeExport() {
  clearTimeout(settingsAutoSaveTimer);
  await waitForSettingsSaveIdle();
  if (settingsDirty) {
    await saveSettings({ silent: true });
  }
}

async function settlePendingSettingsBeforeImport() {
  clearTimeout(settingsAutoSaveTimer);
  await waitForSettingsSaveIdle();
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
  const merged = { ...NODE_DEFAULT_STATUSES, ...(state?.nodeStatuses || {}) };
  return Object.fromEntries(NODE_IDS.map((nodeId) => [nodeId, merged[nodeId] || 'pending']));
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
    ? { ...NODE_DEFAULT_STATUSES, ...(latestState?.nodeStatuses || {}), ...nextState.nodeStatuses }
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

let accountRunHistoryRefreshTimer = null;

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

function normalizeUpiRedeemCdkeyPoolTextValue(value = '') {
  const seen = new Set();
  return String(value || '')
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => {
      if (!line || seen.has(line)) {
        return false;
      }
      seen.add(line);
      return true;
    })
    .join('\n');
}

function parseUpiRedeemCdkeyPoolTextValue(value = '') {
  return normalizeUpiRedeemCdkeyPoolTextValue(value)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function shouldPreserveFocusedUpiRedeemCdkeyPoolEdit(channel = '') {
  const focusedInputs = channel
    ? [getCdkPoolInputForChannel(channel)]
    : [inputUpiRedeemCdkeyPool, inputIdealRedeemCdkeyPool];
  return Boolean(
    typeof document !== 'undefined'
    && focusedInputs.some((input) => input && document.activeElement === input)
  );
}

function normalizeUpiRedeemSubscriptionActiveValue(value) {
  if (value === true) {
    return true;
  }
  if (value === false) {
    return false;
  }
  return null;
}

function normalizeUpiRedeemSubscriptionPlanType(value = '') {
  const normalized = String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (normalized.includes('team')) {
    return 'team';
  }
  if (normalized.includes('pro')) {
    return 'pro';
  }
  if (normalized.includes('plus')) {
    return 'plus';
  }
  if (normalized.includes('free')) {
    return 'free';
  }
  return normalized;
}

function normalizeUpiRedeemJobCapabilityValue(value) {
  if (value === true) {
    return true;
  }
  if (value === false || value === null || value === undefined) {
    return false;
  }
  return ['1', 'true', 'yes', 'y', 'ok', 'active', 'success'].includes(
    String(value || '').trim().toLowerCase()
  );
}

function normalizeUpiRedeemCdkeyUsageValue(value = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  return Object.fromEntries(Object.entries(value).map(([key, usage]) => {
    const cdkey = String(key || '').trim();
    const item = usage && typeof usage === 'object' && !Array.isArray(usage) ? usage : {};
    return [cdkey, {
      usedAt: Math.max(0, Number(item.usedAt) || 0),
      lastAttemptAt: Math.max(0, Number(item.lastAttemptAt) || 0),
      lastError: String(item.lastError || '').trim(),
      enabled: item.enabled !== false,
      email: String(item.email || item.accountEmail || item.credentialEmail || '').trim().toLowerCase(),
      accessToken: String(item.accessToken || item.access_token || item.upiRedeemAccessToken || '').trim(),
      accessTokenMasked: String(item.accessTokenMasked || '').trim(),
      accessTokenUpdatedAt: Math.max(0, Number(item.accessTokenUpdatedAt) || Number(item.tokenUpdatedAt) || 0),
      lastFailedEmail: String(item.lastFailedEmail || '').trim().toLowerCase(),
      lastFailedAt: Math.max(0, Number(item.lastFailedAt) || 0),
      lastFailedReason: String(item.lastFailedReason || '').trim(),
      releasedEmail: String(item.releasedEmail || item.approveBlockedEmail || '').trim().toLowerCase(),
      releaseReason: String(item.releaseReason || '').trim(),
      releasedAt: Math.max(0, Number(item.releasedAt) || 0),
      remoteStatus: String(item.remoteStatus || '').trim(),
      remoteMessage: String(item.remoteMessage || '').trim(),
      remoteCheckedAt: Math.max(0, Number(item.remoteCheckedAt) || 0),
      canCancel: normalizeUpiRedeemJobCapabilityValue(item.canCancel ?? item.can_cancel),
      canRetry: normalizeUpiRedeemJobCapabilityValue(item.canRetry ?? item.can_retry),
      canReuseToken: normalizeUpiRedeemJobCapabilityValue(item.canReuseToken ?? item.can_reuse_token),
      hasAccessToken: normalizeUpiRedeemJobCapabilityValue(item.hasAccessToken ?? item.has_access_token),
      retryCount: Math.max(0, Math.floor(Number(item.retryCount) || 0)),
      lastRetryAt: Math.max(0, Number(item.lastRetryAt) || 0),
      retrying: item.retrying === true,
      retryError: String(item.retryError || '').trim(),
      subscriptionActive: normalizeUpiRedeemSubscriptionActiveValue(item.subscriptionActive),
      subscriptionPlanType: normalizeUpiRedeemSubscriptionPlanType(item.subscriptionPlanType || item.subscription_plan_type),
      subscriptionCheckedAt: Math.max(0, Number(item.subscriptionCheckedAt) || 0),
      subscriptionReason: String(item.subscriptionReason || '').trim(),
    }];
  }).filter(([key]) => Boolean(key)));
}

function normalizeRedeemChannel(value = '') {
  return String(value || '').trim().toLowerCase() === 'ideal' ? 'ideal' : 'upi';
}

function getRedeemChannelLabel(channel = 'upi') {
  return normalizeRedeemChannel(channel) === 'ideal' ? 'IDEAL' : 'UPI';
}

function getCdkPoolInputForChannel(channel = 'upi') {
  return normalizeRedeemChannel(channel) === 'ideal' ? inputIdealRedeemCdkeyPool : inputUpiRedeemCdkeyPool;
}

function getCdkPoolSummaryForChannel(channel = 'upi') {
  return normalizeRedeemChannel(channel) === 'ideal' ? idealRedeemCdkeyPoolSummary : upiRedeemCdkeyPoolSummary;
}

function getCdkStatusListForChannel(channel = 'upi') {
  return normalizeRedeemChannel(channel) === 'ideal' ? idealRedeemCdkeyStatusList : upiRedeemCdkeyStatusList;
}

function getImportCdkButtonForChannel(channel = 'upi') {
  return normalizeRedeemChannel(channel) === 'ideal' ? btnImportIdealCdkPool : btnImportCdkPool;
}

function getDeleteAllCdkButtonForChannel(channel = 'upi') {
  return normalizeRedeemChannel(channel) === 'ideal' ? btnDeleteAllIdealCdkPool : btnDeleteAllCdkPool;
}

function getStoredCdkPoolText(state = latestState, channel = 'upi') {
  const normalizedChannel = normalizeRedeemChannel(channel);
  return normalizeUpiRedeemCdkeyPoolTextValue(
    normalizedChannel === 'ideal'
      ? (state?.idealRedeemCdkeyPoolText ?? '')
      : (state?.cdkPoolText
        ?? state?.upiRedeemCdkPoolText
        ?? state?.upiRedeemCdkeyPoolText
        ?? state?.pixRedeemCdkeyPoolText
        ?? '')
  );
}

function getStoredCdkUsage(state = latestState, channel = 'upi') {
  const normalizedChannel = normalizeRedeemChannel(channel);
  return normalizeUpiRedeemCdkeyUsageValue(
    normalizedChannel === 'ideal'
      ? (state?.idealRedeemCdkeyUsage || {})
      : (state?.cdkUsage
        || state?.upiRedeemCdkUsage
        || state?.upiRedeemCdkeyUsage
        || state?.pixRedeemCdkeyUsage
        || {})
  );
}

function buildCdkPoolStatePatch(poolText = '', usage = {}, channel = 'upi') {
  const normalizedChannel = normalizeRedeemChannel(channel);
  const normalizedPoolText = normalizeUpiRedeemCdkeyPoolTextValue(poolText);
  const normalizedUsage = normalizeUpiRedeemCdkeyUsageValue(usage);
  if (normalizedChannel === 'ideal') {
    return {
      idealRedeemCdkeyPoolText: normalizedPoolText,
      idealRedeemCdkeyUsage: normalizedUsage,
    };
  }
  return {
    cdkPoolText: normalizedPoolText,
    upiRedeemCdkPoolText: normalizedPoolText,
    upiRedeemCdkeyPoolText: normalizedPoolText,
    pixRedeemCdkeyPoolText: normalizedPoolText,
    cdkUsage: normalizedUsage,
    upiRedeemCdkUsage: normalizedUsage,
    upiRedeemCdkeyUsage: normalizedUsage,
    pixRedeemCdkeyUsage: normalizedUsage,
  };
}

const UPI_REDEEM_REMOTE_STATUS_LABELS = Object.freeze({
  pending: '等待处理',
  pending_dispatch: '等待兑换',
  dispatched: '已派发',
  dispatching: '派发中',
  running: '兑换中',
  redeeming: '兑换中',
  processing: '处理中',
  in_progress: '处理中',
  queued: '排队中',
  accepted: '已接收',
  submitted: '已提交',
  success: '兑换成功',
  failed: '兑换失败',
  timeout: '兑换超时',
  not_found: '未找到',
  rejected: '提交失败',
  approve_blocked: '审核阻塞',
  canceled: '已取消',
  cancelled: '已取消',
  unused: '可用',
  available: '可用',
  new: '可用',
  ready: '可用',
});
const UPI_REDEEM_CDKEY_STATUS_AUTO_REFRESH_MS = 5000;
let upiRedeemCdkeyStatusAutoRefreshTimer = null;
let upiRedeemCdkeyStatusRefreshInFlight = false;

function isUpiRedeemApiAuthErrorMessage(message = '') {
  const text = String(message || '').trim();
  return /UPI_REDEEM_AUTH_ERROR::/i.test(text)
    || /UPI[\s\S]*(?:HTTP\s*40[13]|API\s*Key|ApiKey|External API Key|认证失败|权限不足|无权限|forbidden|unauthorized)/i.test(text)
    || /(?:HTTP\s*40[13]|API\s*Key|ApiKey|External API Key|认证失败|权限不足|无权限|forbidden|unauthorized)[\s\S]*UPI/i.test(text);
}

function maskUpiRedeemExternalApiKeyForDisplay(key = '') {
  const text = String(key || '').trim();
  if (!text) {
    return 'empty';
  }
  if (text.length <= 14) {
    return `${text.slice(0, 4)}***${text.slice(-3)}`;
  }
  return `${text.slice(0, 10)}...${text.slice(-6)}`;
}

function getUpiRedeemApiAuthErrorDisplayMessage(message = '') {
  const text = String(message || '').trim()
    .replace(/^UPI_REDEEM_AUTH_ERROR::/i, '')
    .replace(/^UPI\s*远端接口(?:认证失败|拒绝请求)[:：]?\s*/i, '');
  return `CDK 状态刷新被远端拒绝：${text || '请检查 API Key 权限、CDK 归属或后端返回原因。'} 当前输入 Key：${maskUpiRedeemExternalApiKeyForDisplay(getCurrentUpiRedeemExternalApiKey())}。`;
}

function getUpiRedeemRemoteStatusLabel(status = '') {
  const normalized = normalizeUpiRedeemRemoteStatusValue(status);
  return UPI_REDEEM_REMOTE_STATUS_LABELS[normalized] || normalized || '';
}

function isUpiRedeemDuplicateCdkeyMessage(message = '') {
  const text = String(message || '').trim();
  return /(?:CDK|CDKEY|卡密)[\s\S]*(?:不可重复提交|重复提交|已提交|already\s+submitted|duplicate\s+submit|duplicate\s+submission|already\s+redeemed|already\s+used)|(?:不可重复提交|重复提交|已提交|already\s+submitted|duplicate\s+submit|duplicate\s+submission|already\s+redeemed|already\s+used)[\s\S]*(?:CDK|CDKEY|卡密)/i.test(text);
}

function normalizeUpiRedeemRemoteStatusValue(status = '') {
  const normalized = String(status || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  switch (normalized) {
    case 'pending_dispatch':
    case 'dispatched':
    case 'running':
    case 'success':
    case 'failed':
    case 'timeout':
    case 'not_found':
      return normalized;
    case 'cancelled':
    case 'canceled':
      return 'canceled';
    default:
      break;
  }
  if (normalized === 'approve_blocked') {
    return 'approve_blocked';
  }
  if (/兑换成功|成功|已兑换|已使用|已用/.test(normalized)) {
    return 'success';
  }
  if (/提交失败|兑换失败|充值失败|失败|超时|拒绝|已拒绝|取消|已取消/.test(normalized)) {
    if (/超时/.test(normalized)) return 'timeout';
    if (/拒绝/.test(normalized)) return 'rejected';
    if (/取消/.test(normalized)) return 'canceled';
    return 'failed';
  }
  if (/未找到|不存在/.test(normalized)) {
    return 'not_found';
  }
  if (/无效|不可用/.test(normalized)) {
    return 'invalid';
  }
  if (/未使用|未兑换|可用/.test(normalized)) {
    return 'unused';
  }
  if (/waiting|queue|br_recharge|进入兑换队列|兑换队列|等待系统处理|等待.*接单|任务.*等待/.test(normalized)) {
    return 'queued';
  }
  if (/等待处理|待处理|待兑换|待派发/.test(normalized)) {
    return 'pending_dispatch';
  }
  if (/派发中|正在派发/.test(normalized)) {
    return 'dispatching';
  }
  if (/已派发/.test(normalized)) {
    return 'dispatched';
  }
  if (/兑换中|处理中|进行中|正在兑换/.test(normalized)) {
    return 'processing';
  }
  if (/已提交|已接收|排队/.test(normalized)) {
    return 'submitted';
  }
  if (normalized === 'succeeded' || normalized === 'redeemed' || normalized === 'used') {
    return 'success';
  }
  if (normalized === 'failure' || normalized === 'error') {
    return 'failed';
  }
  if (normalized === 'cancelled') {
    return 'canceled';
  }
  if (normalized === 'notused' || normalized === 'not_used' || normalized === 'unredeemed') {
    return 'unused';
  }
  return normalized;
}

function isRetryableUpiRedeemRemoteStatus(status = '') {
  return ['failed', 'timeout', 'rejected', 'approve_blocked'].includes(normalizeUpiRedeemRemoteStatusValue(status));
}

function isUpiRedeemRemoteActiveStatus(status = '') {
  return [
    'pending',
    'pending_token',
    'pending_dispatch',
    'dispatched',
    'dispatching',
    'running',
    'redeeming',
    'processing',
    'in_progress',
    'queued',
    'accepted',
    'submitted',
  ].includes(normalizeUpiRedeemRemoteStatusValue(status));
}

function isUpiRedeemCdkeySelectableForRedeem(entry = {}) {
  if (!entry || entry.enabled === false) {
    return false;
  }
  const remoteStatus = normalizeUpiRedeemRemoteStatusValue(entry.remoteStatus);
  const remoteMessageStatus = normalizeUpiRedeemRemoteStatusValue(entry.remoteMessage);
  if (entry.subscriptionActive === true) {
    return false;
  }
  if (
    remoteStatus === 'success'
    || (
      (remoteStatus === 'pending_dispatch' || remoteMessageStatus === 'pending_dispatch')
      && Boolean(String(entry.email || entry.accessToken || entry.access_token || entry.upiRedeemAccessToken || '').trim())
    )
    || remoteStatus === 'invalid'
    || remoteMessageStatus === 'invalid'
    || isUpiRedeemRemoteActiveStatus(remoteStatus)
    || isUpiRedeemRemoteActiveStatus(entry.remoteMessage)
    || entry.retrying === true
  ) {
    return false;
  }
  if (
    isUpiRedeemDuplicateCdkeyMessage(entry.remoteStatus)
    || isUpiRedeemDuplicateCdkeyMessage(entry.remoteMessage)
    || isUpiRedeemDuplicateCdkeyMessage(entry.lastError)
  ) {
    return false;
  }
  return true;
}

function getUpiRedeemRemoteStatusClass(status = '', used = false, enabled = true) {
  const normalized = normalizeUpiRedeemRemoteStatusValue(status);
  if (used || normalized === 'success') {
    return 'used';
  }
  if (isRetryableUpiRedeemRemoteStatus(normalized) || normalized === 'invalid') {
    return 'failed';
  }
  if (normalized === 'canceled') {
    return 'failed';
  }
  if (['pending', 'pending_token', 'pending_dispatch', 'dispatched', 'dispatching', 'queued', 'accepted', 'submitted'].includes(normalized)) {
    return 'pending';
  }
  if (['running', 'redeeming', 'processing', 'in_progress'].includes(normalized)) {
    return 'running';
  }
  return enabled ? 'active' : '';
}

function canCancelUpiRedeemCdkeyJob(entry = {}, used = false) {
  if (used || entry?.enabled === false || entry?.subscriptionActive === true) {
    return false;
  }
  return entry?.canCancel === true
    || isUpiRedeemRemoteActiveStatus(entry?.remoteStatus)
    || isUpiRedeemRemoteActiveStatus(entry?.remoteMessage);
}

function canRetryUpiRedeemCdkeyJob(entry = {}, used = false) {
  if (used || entry?.enabled === false || entry?.subscriptionActive === true) {
    return false;
  }
  const remoteStatus = normalizeUpiRedeemRemoteStatusValue(entry?.remoteStatus);
  const remoteMessageStatus = normalizeUpiRedeemRemoteStatusValue(entry?.remoteMessage);
  if (remoteStatus === 'canceled' || remoteStatus === 'not_found' || remoteMessageStatus === 'canceled' || remoteMessageStatus === 'not_found') {
    return false;
  }
  return entry?.canRetry === true
    && entry?.canReuseToken === true
    && entry?.hasAccessToken === true;
}

function getUpiRedeemSubscriptionPlanLabel(value = '') {
  const planType = normalizeUpiRedeemSubscriptionPlanType(value);
  if (planType === 'pro') {
    return 'Pro';
  }
  if (planType === 'team') {
    return 'Team';
  }
  return 'Plus';
}

function hasUpiRedeemSubscriptionConfirmation(entry = {}) {
  return entry.subscriptionActive === true
    || entry.subscriptionActive === false
    || Number(entry.subscriptionCheckedAt) > 0
    || Boolean(String(entry.subscriptionPlanType || '').trim())
    || Boolean(String(entry.subscriptionReason || '').trim());
}

function getUpiRedeemCdkeySubscriptionDisplay(entry = {}) {
  if (!hasUpiRedeemSubscriptionConfirmation(entry)) {
    return null;
  }
  const active = normalizeUpiRedeemSubscriptionActiveValue(entry.subscriptionActive);
  const planType = normalizeUpiRedeemSubscriptionPlanType(entry.subscriptionPlanType);
  const reason = String(entry.subscriptionReason || '').trim();
  if (active === true) {
    const planLabel = getUpiRedeemSubscriptionPlanLabel(planType);
    return {
      label: `已开通 ${planLabel} 会员`,
      className: 'used',
      title: reason || `订阅接口已确认 ${planLabel} 会员`,
    };
  }
  if (active === false) {
    const reasonText = reason.toLowerCase();
    const knownNotPaid = planType === 'free'
      || /free|inactive|no active|not active|无会员|未激活|未开通/.test(reasonText);
    return {
      label: knownNotPaid ? '已兑换未开通会员' : '会员待确认',
      className: knownNotPaid ? 'failed' : 'pending',
      title: reason || (planType ? `订阅接口返回套餐：${planType}` : 'CDK 已提交成功，但订阅接口未确认 Plus/Pro/Team'),
    };
  }
  return null;
}

function mergeCurrentUpiRedeemSubscriptionState(entry = {}, cdkey = '', state = latestState) {
  const currentCdkey = String(state?.upiRedeemCdkey || '').trim();
  if (!currentCdkey || currentCdkey !== String(cdkey || '').trim()) {
    return mergeUpiRedeemSubscriptionHistoryState(entry, cdkey, state);
  }
  const hasCurrentConfirmation = state?.upiRedeemSubscriptionActive === true
    || state?.upiRedeemSubscriptionActive === false
    || Boolean(String(state?.upiRedeemSubscriptionPlanType || '').trim())
    || Boolean(String(state?.upiRedeemSubscriptionCheckedAt || '').trim());
  if (!hasCurrentConfirmation) {
    return mergeUpiRedeemSubscriptionHistoryState(entry, cdkey, state);
  }
  const parsedCheckedAt = Date.parse(String(state?.upiRedeemSubscriptionCheckedAt || ''));
  return {
    ...entry,
    subscriptionActive: normalizeUpiRedeemSubscriptionActiveValue(state?.upiRedeemSubscriptionActive),
    subscriptionPlanType: normalizeUpiRedeemSubscriptionPlanType(state?.upiRedeemSubscriptionPlanType || entry.subscriptionPlanType),
    subscriptionCheckedAt: Number.isFinite(parsedCheckedAt)
      ? parsedCheckedAt
      : Math.max(0, Number(entry.subscriptionCheckedAt) || 0),
    subscriptionReason: String(state?.upiRedeemSubscriptionReason || entry.subscriptionReason || '').trim(),
  };
}

function mergeUpiRedeemSubscriptionHistoryState(entry = {}, cdkey = '', state = latestState) {
  const normalizedCdkey = String(cdkey || '').trim();
  if (!normalizedCdkey || hasUpiRedeemSubscriptionConfirmation(entry)) {
    return entry;
  }
  const records = Array.isArray(state?.accountRunHistory) ? state.accountRunHistory : [];
  for (let index = records.length - 1; index >= 0; index -= 1) {
    const record = records[index] || {};
    if (String(record.upiRedeemCdkey || '').trim() !== normalizedCdkey) {
      continue;
    }
    const hasRecordConfirmation = record.upiRedeemSubscriptionActive === true
      || record.upiRedeemSubscriptionActive === false
      || Boolean(String(record.upiRedeemSubscriptionPlanType || '').trim())
      || Boolean(String(record.upiRedeemSubscriptionCheckedAt || '').trim());
    if (!hasRecordConfirmation) {
      continue;
    }
    const parsedCheckedAt = Date.parse(String(record.upiRedeemSubscriptionCheckedAt || ''));
    return {
      ...entry,
      subscriptionActive: normalizeUpiRedeemSubscriptionActiveValue(record.upiRedeemSubscriptionActive),
      subscriptionPlanType: normalizeUpiRedeemSubscriptionPlanType(record.upiRedeemSubscriptionPlanType || entry.subscriptionPlanType),
      subscriptionCheckedAt: Number.isFinite(parsedCheckedAt)
        ? parsedCheckedAt
        : Math.max(0, Number(entry.subscriptionCheckedAt) || 0),
      subscriptionReason: String(record.upiRedeemSubscriptionReason || entry.subscriptionReason || '').trim(),
    };
  }
  return entry;
}

function getDefaultUpiRedeemCdkeyUsageEntry() {
  return {
    usedAt: 0,
    lastAttemptAt: 0,
    lastError: '',
    enabled: true,
    remoteStatus: '',
    remoteMessage: '',
    remoteCheckedAt: 0,
    canCancel: false,
    canRetry: false,
    canReuseToken: false,
    hasAccessToken: false,
    retryCount: 0,
    lastRetryAt: 0,
    retrying: false,
    retryError: '',
    subscriptionActive: null,
    subscriptionPlanType: '',
    subscriptionCheckedAt: 0,
    subscriptionReason: '',
  };
}

function getUpiRedeemCdkeyUsageEntry(usage = {}, cdkey = '') {
  return {
    ...getDefaultUpiRedeemCdkeyUsageEntry(),
    ...(usage?.[cdkey] || {}),
    enabled: usage?.[cdkey]?.enabled !== false,
  };
}

function isUpiRedeemCdkeyPoolMutationLocked() {
  return (typeof isAutoRunLockedPhase === 'function' && isAutoRunLockedPhase())
    || (typeof isAutoRunPausedPhase === 'function' && isAutoRunPausedPhase())
    || (typeof isAutoRunScheduledPhase === 'function' && isAutoRunScheduledPhase());
}

function updateUpiRedeemCdkeyEnabled(cdkey = '', enabled = true, channel = 'upi') {
  const redeemChannel = normalizeRedeemChannel(channel);
  const normalizedCdkey = String(cdkey || '').trim();
  if (!normalizedCdkey) {
    return;
  }
  if (isUpiRedeemCdkeyPoolMutationLocked()) {
    showToast('自动流程运行中只能追加导入 CDK，不能修改已保存 CDK 状态。', 'warn', 2200);
    renderUpiRedeemCdkeyStatusList(latestState, redeemChannel);
    return;
  }
  const usage = getStoredCdkUsage(latestState, redeemChannel);
  const currentEntry = getUpiRedeemCdkeyUsageEntry(usage, normalizedCdkey);
  const nextUsage = {
    ...usage,
    [normalizedCdkey]: {
      ...currentEntry,
      enabled: Boolean(enabled),
    },
  };
  syncLatestState(buildCdkPoolStatePatch(getStoredCdkPoolText(latestState, redeemChannel), nextUsage, redeemChannel));
  renderUpiRedeemCdkeyStatusList(latestState, redeemChannel);
  updateUpiRedeemCdkeyPoolSummary(latestState, { skipRender: true, channel: redeemChannel });
  renderAccountRecords(latestState);
  markSettingsDirty(true);
  saveSettings({ silent: true }).catch(() => { });
}

function markUpiRedeemCdkeyUnused(cdkey = '', channel = 'upi') {
  const redeemChannel = normalizeRedeemChannel(channel);
  const normalizedCdkey = String(cdkey || '').trim();
  if (!normalizedCdkey) {
    return;
  }
  if (isUpiRedeemCdkeyPoolMutationLocked()) {
    showToast('自动流程运行中只能追加导入 CDK，不能重置已保存 CDK。', 'warn', 2200);
    renderUpiRedeemCdkeyStatusList(latestState, redeemChannel);
    return;
  }
  const usage = getStoredCdkUsage(latestState, redeemChannel);
  const currentEntry = getUpiRedeemCdkeyUsageEntry(usage, normalizedCdkey);
  const nextUsage = {
    ...usage,
    [normalizedCdkey]: {
      ...currentEntry,
      usedAt: 0,
      lastError: '',
      remoteStatus: '',
      remoteMessage: '',
      remoteCheckedAt: 0,
      canCancel: false,
      canRetry: false,
      canReuseToken: false,
      hasAccessToken: false,
      retryCount: 0,
      lastRetryAt: 0,
      retrying: false,
      retryError: '',
      subscriptionActive: null,
      subscriptionPlanType: '',
      subscriptionCheckedAt: 0,
      subscriptionReason: '',
    },
  };
  syncLatestState(buildCdkPoolStatePatch(getStoredCdkPoolText(latestState, redeemChannel), nextUsage, redeemChannel));
  renderUpiRedeemCdkeyStatusList(latestState, redeemChannel);
  updateUpiRedeemCdkeyPoolSummary(latestState, { skipRender: true, channel: redeemChannel });
  renderAccountRecords(latestState);
  markSettingsDirty(true);
  saveSettings({ silent: true }).catch(() => { });
}

function deleteUpiRedeemCdkey(cdkey = '', channel = 'upi') {
  const redeemChannel = normalizeRedeemChannel(channel);
  const normalizedCdkey = String(cdkey || '').trim();
  if (!normalizedCdkey) {
    return;
  }
  if (isUpiRedeemCdkeyPoolMutationLocked()) {
    showToast('自动流程运行中只能追加导入 CDK，不能删除已保存 CDK。', 'warn', 2200);
    renderUpiRedeemCdkeyStatusList(latestState, redeemChannel);
    return;
  }
  const currentPoolText = getStoredCdkPoolText(latestState, redeemChannel);
  const nextCdkeys = parseUpiRedeemCdkeyPoolTextValue(currentPoolText)
    .filter((item) => item !== normalizedCdkey);
  const nextPoolText = nextCdkeys.join('\n');
  const nextUsage = getStoredCdkUsage(latestState, redeemChannel);
  delete nextUsage[normalizedCdkey];
  syncLatestState(buildCdkPoolStatePatch(nextPoolText, nextUsage, redeemChannel));
  renderUpiRedeemCdkeyStatusList(latestState, redeemChannel);
  updateUpiRedeemCdkeyPoolSummary(latestState, { skipRender: true, channel: redeemChannel });
  renderAccountRecords(latestState);
  markSettingsDirty(true);
  saveSettings({ silent: true }).catch(() => { });
}

async function deleteAllUpiRedeemCdkeys(channel = 'upi') {
  const redeemChannel = normalizeRedeemChannel(channel);
  const channelLabel = getRedeemChannelLabel(redeemChannel);
  if (isUpiRedeemCdkeyPoolMutationLocked()) {
    showToast('自动流程运行中只能追加导入 CDK，不能删除 CDK 池。', 'warn', 2200);
    updateUpiRedeemCdkeyPoolSummary(latestState, { skipRender: true, channel: redeemChannel });
    return;
  }
  const currentCdkeys = parseUpiRedeemCdkeyPoolTextValue(getStoredCdkPoolText(latestState, redeemChannel));
  if (!currentCdkeys.length) {
    showToast('当前没有已保存的 CDK。', 'info', 1800);
    return;
  }
  const confirmed = await openConfirmModal({
    title: `删除全部 ${channelLabel} CDK`,
    message: `确认删除当前 ${channelLabel} 池全部 ${currentCdkeys.length} 个 CDK 吗？此操作不可撤销。`,
    confirmLabel: '一键删除',
    confirmVariant: 'btn-danger',
  });
  if (!confirmed) {
    return;
  }
  syncLatestState(buildCdkPoolStatePatch('', {}, redeemChannel));
  const input = getCdkPoolInputForChannel(redeemChannel);
  if (input) {
    input.value = '';
  }
  renderUpiRedeemCdkeyStatusList(latestState, redeemChannel);
  updateUpiRedeemCdkeyPoolSummary(latestState, { skipRender: true, channel: redeemChannel });
  renderAccountRecords(latestState);
  renderAccountRecords(latestState);
  markSettingsDirty(true);
  await saveSettings({ silent: true, force: true }).catch((error) => {
    showToast(`CDK 已删除，但保存失败：${error.message}`, 'error');
  });
  showToast(`已删除 ${channelLabel} CDK ${currentCdkeys.length} 个。`, 'success', 1800);
}

function getCurrentUpiRedeemCdkeys(channel = 'upi') {
  return parseUpiRedeemCdkeyPoolTextValue(getStoredCdkPoolText(latestState, channel));
}

async function importCdkPoolFromTextarea(options = {}) {
  const redeemChannel = normalizeRedeemChannel(options.channel || options.redeemChannel);
  const channelLabel = getRedeemChannelLabel(redeemChannel);
  const input = getCdkPoolInputForChannel(redeemChannel);
  const importText = String(input?.value || '');
  const incomingCdks = parseUpiRedeemCdkeyPoolTextValue(importText);
  if (!incomingCdks.length) {
    showToast(`请先粘贴要导入的 ${channelLabel} CDK。`, 'warn');
    input?.focus?.();
    return { imported: 0, skipped: 0 };
  }

  const existingCdks = parseUpiRedeemCdkeyPoolTextValue(getStoredCdkPoolText(latestState, redeemChannel));
  const seen = new Set(existingCdks.map((cdk) => cdk.toLowerCase()));
  const nextCdks = [...existingCdks];
  const nextUsage = getStoredCdkUsage(latestState, redeemChannel);
  let imported = 0;
  let skipped = 0;

  incomingCdks.forEach((cdk) => {
    const key = cdk.toLowerCase();
    if (!cdk || seen.has(key)) {
      skipped += 1;
      return;
    }
    seen.add(key);
    nextCdks.push(cdk);
    if (!nextUsage[cdk]) {
      nextUsage[cdk] = {
        ...getDefaultUpiRedeemCdkeyUsageEntry(),
        enabled: true,
      };
    }
    imported += 1;
  });

  if (!imported) {
    showToast(`没有新增 CDK，已跳过重复 ${skipped} 条。`, 'info');
    if (input) {
      input.value = '';
    }
    return { imported: 0, skipped };
  }

  syncLatestState(buildCdkPoolStatePatch(nextCdks.join('\n'), nextUsage, redeemChannel));
  if (input) {
    input.value = '';
  }
  renderUpiRedeemCdkeyStatusList(latestState, redeemChannel);
  updateUpiRedeemCdkeyPoolSummary(latestState, { skipRender: true, channel: redeemChannel });
  renderAccountRecords(latestState);
  markSettingsDirty(true);
  await saveSettings({ silent: true, force: true }).catch((error) => {
    showToast(`CDK 已导入，但保存失败：${error.message}`, 'error');
  });
  scheduleUpiRedeemCdkeyStatusAutoRefresh({ immediate: true });
  showToast(`已导入 CDK ${imported} 条${skipped ? `，跳过重复 ${skipped} 条` : ''}。`, 'success');

  if (options.autoResume === true) {
    accountRecordsManager?.resumeFreeRedeemAfterCdkImport?.({
      source: 'cdk-import-resume',
      channel: redeemChannel,
    });
  }
  return { imported, skipped };
}

function getCurrentUpiRedeemExternalApiKey() {
  return String(
    inputUpiRedeemExternalApiKey?.value
    || latestState?.upiRedeemExternalApiKey
    || latestState?.pixRedeemExternalApiKey
    || ''
  ).trim();
}

function getCurrentUpiRedeemClientId() {
  return String(
    inputUpiRedeemClientId?.value
    || latestState?.upiRedeemClientId
    || latestState?.pixRedeemClientId
    || ''
  ).trim();
}

function isDocumentVisibleForUpiRedeemCdkeyAutoRefresh() {
  if (typeof document !== 'undefined' && document.hidden) {
    return false;
  }
  return true;
}

function isUpiRedeemCdkeyStatusAutoRefreshVisible() {
  if (!isDocumentVisibleForUpiRedeemCdkeyAutoRefresh()) {
    return false;
  }
  const selectedUpiPayment = Boolean(inputPlusModeEnabled?.checked)
    && getSelectedPlusPaymentMethod() === PLUS_PAYMENT_METHOD_UPI;
  const cdkeyRowVisible = Boolean(
    rowUpiRedeemCdkeyPool
    && rowUpiRedeemCdkeyPool.style
    && rowUpiRedeemCdkeyPool.style.display !== 'none'
  );
  return selectedUpiPayment && cdkeyRowVisible;
}

function hasPendingUpiRedeemMembershipStatusRefresh(state = latestState) {
  const items = Array.isArray(state?.upiCredentialMembershipCheckResults?.items)
    ? state.upiCredentialMembershipCheckResults.items
    : [];
  return items.some((item) => {
    if (!item || typeof item !== 'object') {
      return false;
    }
    const cdkey = String(item.upiRedeemCdkey || item.cdkey || '').trim();
    if (!cdkey) {
      return false;
    }
    return isUpiRedeemRemoteActiveStatus(item.redeemStatus)
      || isUpiRedeemRemoteActiveStatus(item.remoteStatus)
      || isUpiRedeemRemoteActiveStatus(item.redeemReason);
  });
}

function shouldAutoRefreshUpiRedeemCdkeyStatuses() {
  const refreshVisible = isUpiRedeemCdkeyStatusAutoRefreshVisible();
  const pendingMembershipRefresh = isDocumentVisibleForUpiRedeemCdkeyAutoRefresh()
    && hasPendingUpiRedeemMembershipStatusRefresh(latestState);
  return Boolean(
    (refreshVisible || pendingMembershipRefresh)
    && (
      getCurrentUpiRedeemCdkeys('upi').length
      || getCurrentUpiRedeemCdkeys('ideal').length
    )
    && getCurrentUpiRedeemExternalApiKey()
  );
}

function clearUpiRedeemCdkeyStatusAutoRefresh() {
  if (!upiRedeemCdkeyStatusAutoRefreshTimer) {
    return;
  }
  clearInterval(upiRedeemCdkeyStatusAutoRefreshTimer);
  upiRedeemCdkeyStatusAutoRefreshTimer = null;
}

function triggerUpiRedeemCdkeyStatusAutoRefresh() {
  if (!shouldAutoRefreshUpiRedeemCdkeyStatuses()) {
    clearUpiRedeemCdkeyStatusAutoRefresh();
    return;
  }
  refreshAllUpiRedeemCdkeyStatuses({ silent: true, autoRefresh: true }).catch(() => { });
}

function scheduleUpiRedeemCdkeyStatusAutoRefresh(options = {}) {
  if (!shouldAutoRefreshUpiRedeemCdkeyStatuses()) {
    clearUpiRedeemCdkeyStatusAutoRefresh();
    return;
  }
  if (!upiRedeemCdkeyStatusAutoRefreshTimer) {
    upiRedeemCdkeyStatusAutoRefreshTimer = setInterval(
      triggerUpiRedeemCdkeyStatusAutoRefresh,
      UPI_REDEEM_CDKEY_STATUS_AUTO_REFRESH_MS
    );
  }
  if (options.immediate) {
    triggerUpiRedeemCdkeyStatusAutoRefresh();
  }
}

async function refreshUpiRedeemCdkeyStatuses(options = {}) {
  const redeemChannel = normalizeRedeemChannel(options.channel || options.redeemChannel);
  const silent = Boolean(options.silent);
  const cdkeys = Array.isArray(options.cdkeys)
    ? parseUpiRedeemCdkeyPoolTextValue(options.cdkeys.join('\n'))
    : getCurrentUpiRedeemCdkeys(redeemChannel);
  if (!cdkeys.length) {
    if (!silent) {
      showToast('请先导入 CDK。', 'warn');
    }
    return { skipped: true, reason: 'empty-cdkeys' };
  }
  const upiRedeemExternalApiKey = getCurrentUpiRedeemExternalApiKey();
  const upiRedeemClientId = getCurrentUpiRedeemClientId();
  if (!upiRedeemExternalApiKey) {
    if (!silent) {
      showToast('请先填写 UPI External API Key。', 'warn');
    }
    return { skipped: true, reason: 'missing-external-api-key' };
  }
  if (upiRedeemCdkeyStatusRefreshInFlight) {
    if (!silent) {
      showToast('CDK 状态正在刷新，请稍候。', 'info');
    }
    return { skipped: true, reason: 'in-flight' };
  }

  let shouldResumeAutoRefresh = !options.autoRefresh;
  upiRedeemCdkeyStatusRefreshInFlight = true;
  if (!silent && btnUpiRedeemCdkeyStatusRefresh) {
    btnUpiRedeemCdkeyStatusRefresh.disabled = true;
    btnUpiRedeemCdkeyStatusRefresh.textContent = '刷新中';
  }
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'REFRESH_UPI_REDEEM_CDKEY_STATUSES',
      source: 'sidepanel',
      payload: {
        cdkeys,
        channel: redeemChannel,
        upiRedeemExternalApiKey,
        upiRedeemClientId,
        upiRedeemFailedAccountRetryLimit: normalizeUpiRedeemFailedAccountRetryLimit(
          inputUpiRedeemFailedAccountRetryLimit?.value,
          latestState?.upiRedeemFailedAccountRetryLimit
        ),
        autoRefresh: Boolean(options.autoRefresh),
        skipAutoRetry: options.allowAutoRetry === true
          ? Boolean(options.skipAutoRetry)
          : true,
        cdkPoolText: getStoredCdkPoolText(latestState, 'upi'),
        upiRedeemCdkPoolText: getStoredCdkPoolText(latestState, 'upi'),
        upiRedeemCdkeyPoolText: getStoredCdkPoolText(latestState, 'upi'),
        pixRedeemCdkeyPoolText: getStoredCdkPoolText(latestState, 'upi'),
        idealRedeemCdkeyPoolText: getStoredCdkPoolText(latestState, 'ideal'),
      },
    });
    if (response?.error) {
      throw new Error(response.error);
    }
    if (response?.updates) {
      syncLatestState(response.updates);
    }
    renderUpiRedeemCdkeyStatusList(latestState, redeemChannel);
    updateUpiRedeemCdkeyPoolSummary(latestState, { skipRender: true, channel: redeemChannel });
    renderAccountRecords(latestState);
    if (!silent) {
      const backendRetrySubmitted = Math.max(0, Math.floor(Number(response?.autoRetry?.backendJobRetry?.submitted) || 0));
      const localRetrySubmitted = Math.max(0, Math.floor(Number(response?.autoRetry?.localRetry?.submitted) || 0));
      const localRetryAttempted = Math.max(0, Math.floor(Number(response?.autoRetry?.localRetry?.attempted) || 0));
      const autoRetryParts = options.allowAutoRetry === true ? [
        backendRetrySubmitted ? `后端重试重新入列 ${backendRetrySubmitted} 个` : '',
        localRetrySubmitted || localRetryAttempted ? `换卡续兑 ${localRetrySubmitted || localRetryAttempted} 个` : '',
      ].filter(Boolean) : [];
      const autoRetryText = autoRetryParts.length ? `${autoRetryParts.join('，')}。` : '';
      showToast(`${getRedeemChannelLabel(redeemChannel)} CDK 状态已刷新：${response?.checkedCount || cdkeys.length} 条。${autoRetryText}`, 'success');
    }
    return response || {};
  } catch (error) {
    const rawMessage = error?.message || '刷新 CDK 状态失败。';
    const authError = isUpiRedeemApiAuthErrorMessage(rawMessage);
    const message = authError
      ? getUpiRedeemApiAuthErrorDisplayMessage(rawMessage)
      : rawMessage;
    if (authError) {
      clearUpiRedeemCdkeyStatusAutoRefresh();
      shouldResumeAutoRefresh = false;
    }
    if (!silent) {
      showToast(message, 'error');
    }
    return { error: message, authError };
  } finally {
    upiRedeemCdkeyStatusRefreshInFlight = false;
    if (!silent && btnUpiRedeemCdkeyStatusRefresh) {
      btnUpiRedeemCdkeyStatusRefresh.disabled = false;
      btnUpiRedeemCdkeyStatusRefresh.textContent = '刷新全部状态';
    }
    if (shouldResumeAutoRefresh) {
      scheduleUpiRedeemCdkeyStatusAutoRefresh();
    }
  }
}

async function refreshAllUpiRedeemCdkeyStatuses(options = {}) {
  const channels = ['upi', 'ideal'].filter((channel) => getCurrentUpiRedeemCdkeys(channel).length);
  if (!channels.length) {
    return refreshUpiRedeemCdkeyStatuses({ ...options, channel: 'upi' });
  }
  let latestResponse = {};
  for (const [index, channel] of channels.entries()) {
    const response = await refreshUpiRedeemCdkeyStatuses({
      ...options,
      channel,
      silent: Boolean(options.silent || index > 0),
    });
    latestResponse = response || {};
    if (latestResponse.authError) {
      break;
    }
  }
  return latestResponse;
}

function getUpiRedeemCdkeyJobOperationResultItem(response = {}, cdkey = '') {
  const normalizedCdkey = String(cdkey || '').trim().toLowerCase();
  return (Array.isArray(response?.items) ? response.items : [])
    .find((item) => String(item?.cdkey || item?.cdk || '').trim().toLowerCase() === normalizedCdkey)
    || null;
}

async function operateUpiRedeemCdkeyJob(cdkey = '', action = '', channel = 'upi') {
  const redeemChannel = normalizeRedeemChannel(channel);
  const normalizedCdkey = String(cdkey || '').trim();
  const normalizedAction = String(action || '').trim().toLowerCase();
  if (!normalizedCdkey || !['cancel', 'retry'].includes(normalizedAction)) {
    return;
  }
  if (isUpiRedeemCdkeyPoolMutationLocked() && normalizedAction !== 'cancel') {
    showToast('自动流程运行中不能手动重试 CDK 任务。', 'warn', 2200);
    renderUpiRedeemCdkeyStatusList(latestState, redeemChannel);
    return;
  }

  const response = await chrome.runtime.sendMessage({
    type: normalizedAction === 'cancel'
      ? 'CANCEL_UPI_REDEEM_CDKEY_JOBS'
      : 'RETRY_UPI_REDEEM_CDKEY_JOBS',
    source: 'sidepanel',
    payload: {
      cdkeys: [normalizedCdkey],
      channel: redeemChannel,
      upiRedeemExternalApiKey: getCurrentUpiRedeemExternalApiKey(),
      upiRedeemClientId: getCurrentUpiRedeemClientId(),
      cdkPoolText: getStoredCdkPoolText(latestState, 'upi'),
      upiRedeemCdkPoolText: getStoredCdkPoolText(latestState, 'upi'),
      upiRedeemCdkeyPoolText: getStoredCdkPoolText(latestState, 'upi'),
      pixRedeemCdkeyPoolText: getStoredCdkPoolText(latestState, 'upi'),
      idealRedeemCdkeyPoolText: getStoredCdkPoolText(latestState, 'ideal'),
    },
  });
  if (response?.error) {
    throw new Error(response.error);
  }
  if (response?.updates) {
    syncLatestState(response.updates);
  }
  renderUpiRedeemCdkeyStatusList(latestState, redeemChannel);
  updateUpiRedeemCdkeyPoolSummary(latestState, { skipRender: true, channel: redeemChannel });

  const resultItem = getUpiRedeemCdkeyJobOperationResultItem(response, normalizedCdkey);
  const succeeded = normalizedAction === 'cancel'
    ? resultItem?.cancelled === true
    : resultItem?.retried === true;
  const reason = String(resultItem?.reason || '').trim();
  if (succeeded) {
    showToast(
      normalizedAction === 'cancel'
        ? `CDK ${normalizedCdkey} 已提交取消。`
        : `CDK ${normalizedCdkey} 已复用后端 access_token 重新入列。`,
      'success'
    );
  } else {
    showToast(
      `${normalizedAction === 'cancel' ? '取消' : '重试'}未完成：${reason || '后端未返回成功结果。'}`,
      'warn'
    );
  }

  await refreshUpiRedeemCdkeyStatuses({
    cdkeys: [normalizedCdkey],
    silent: true,
    skipAutoRetry: true,
    channel: redeemChannel,
  });
  scheduleUpiRedeemCdkeyStatusAutoRefresh();
}

function restoreScrollTopAfterRender(node, scrollTop = 0) {
  if (!node || scrollTop <= 0) {
    return;
  }
  const restore = () => {
    const maxScrollTop = Math.max(0, node.scrollHeight - node.clientHeight);
    node.scrollTop = Math.min(scrollTop, maxScrollTop);
  };
  restore();
  if (typeof window.requestAnimationFrame === 'function') {
    window.requestAnimationFrame(restore);
  }
}

function renderUpiRedeemCdkeyStatusList(state = latestState, channel = 'upi') {
  const redeemChannel = normalizeRedeemChannel(channel);
  const statusList = getCdkStatusListForChannel(redeemChannel);
  if (!statusList) {
    return;
  }
  const poolText = getStoredCdkPoolText(state, redeemChannel);
  const cdkeys = parseUpiRedeemCdkeyPoolTextValue(poolText);
  const usage = getStoredCdkUsage(state, redeemChannel);
  const mutationLocked = isUpiRedeemCdkeyPoolMutationLocked();
  const previousScrollTop = statusList.scrollTop || 0;
  statusList.textContent = '';
  if (!cdkeys.length) {
    const empty = document.createElement('div');
    empty.className = 'icloud-empty';
    empty.textContent = `导入 ${getRedeemChannelLabel(redeemChannel)} CDK 后显示启用和已用状态`;
    statusList.appendChild(empty);
    restoreScrollTopAfterRender(statusList, previousScrollTop);
    return;
  }
  cdkeys.forEach((cdkey) => {
    const entry = mergeCurrentUpiRedeemSubscriptionState(
      getUpiRedeemCdkeyUsageEntry(usage, cdkey),
      cdkey,
      state
    );
    const used = Number(entry.usedAt) > 0;
    const enabled = entry.enabled !== false;
    const remoteStatus = String(entry.remoteStatus || '').trim().toLowerCase();
    const remoteLabel = getUpiRedeemRemoteStatusLabel(remoteStatus);
    const subscriptionDisplay = getUpiRedeemCdkeySubscriptionDisplay(entry);
    const duplicateCdkeyStatusDisplay = (
      isUpiRedeemDuplicateCdkeyMessage(remoteStatus)
      || isUpiRedeemDuplicateCdkeyMessage(entry.remoteMessage)
      || isUpiRedeemDuplicateCdkeyMessage(entry.lastError)
    ) ? {
      label: '已占用',
      className: 'pending',
      title: entry.remoteMessage || entry.lastError || '后端提示 CDK 重复提交，已禁止再次派发',
    } : null;
    const statusSubscriptionDisplay = remoteStatus ? null : subscriptionDisplay;
    const remoteStatusTitle = [
      remoteLabel || '',
      entry.remoteMessage || '',
      subscriptionDisplay?.title || '',
    ].map((text) => String(text || '').trim()).filter(Boolean).join('；');
    const item = document.createElement('div');
    item.className = 'upi-redeem-cdkey-status-item';

    const label = document.createElement('label');
    label.className = 'toggle-switch upi-redeem-cdkey-enabled-toggle';
    label.title = mutationLocked
      ? '自动流程运行中不能修改已保存 CDK 状态'
      : '控制该 CDK 是否参与自动兑换；已兑换或处理中 CDK 不会再次提交';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = enabled;
    checkbox.disabled = mutationLocked;
    checkbox.setAttribute('aria-label', `启用 CDK ${cdkey}`);
    const track = document.createElement('span');
    track.className = 'toggle-switch-track';
    const thumb = document.createElement('span');
    thumb.className = 'toggle-switch-thumb';
    track.appendChild(thumb);
    label.appendChild(checkbox);
    label.appendChild(track);

    const cdkeyText = document.createElement('span');
    cdkeyText.className = 'upi-redeem-cdkey-text mono';
    cdkeyText.textContent = cdkey;

    const status = document.createElement(used ? 'button' : 'span');
    status.className = `icloud-tag ${duplicateCdkeyStatusDisplay?.className || statusSubscriptionDisplay?.className || getUpiRedeemRemoteStatusClass(remoteStatus, used, enabled)}${used ? ' upi-redeem-cdkey-status-action' : ''}`;
    status.textContent = duplicateCdkeyStatusDisplay?.label
      || statusSubscriptionDisplay?.label
      || remoteLabel
      || (used ? '已使用' : enabled ? '启用' : '停用');
    status.title = duplicateCdkeyStatusDisplay?.title
      || statusSubscriptionDisplay?.title
      || remoteStatusTitle
      || (used ? '点击清除旧的已用标记；已确认兑换的 CDK 不会再次提交' : '远端状态');
    if (used) {
      status.type = 'button';
      status.disabled = mutationLocked;
      status.setAttribute('aria-label', `将 CDK ${cdkey} 设为未用`);
      status.addEventListener('click', () => {
        markUpiRedeemCdkeyUnused(cdkey, redeemChannel);
      });
    }

    const actionCell = document.createElement('div');
    actionCell.className = 'upi-redeem-cdkey-actions';
    if (canCancelUpiRedeemCdkeyJob(entry, used)) {
      const cancelButton = document.createElement('button');
      cancelButton.type = 'button';
      cancelButton.className = 'btn btn-ghost btn-xs upi-redeem-cdkey-job-action';
      cancelButton.textContent = '取消';
      cancelButton.title = '调用后端 cdkey-jobs/cancel 取消该 CDK 任务';
      cancelButton.setAttribute('aria-label', `取消 CDK 任务 ${cdkey}`);
      cancelButton.addEventListener('click', () => {
        cancelButton.disabled = true;
        operateUpiRedeemCdkeyJob(cdkey, 'cancel', redeemChannel).catch((error) => {
          showToast(`取消 CDK 任务失败：${error.message}`, 'error');
        }).finally(() => {
          if (cancelButton.isConnected) {
            cancelButton.disabled = false;
          }
        });
      });
      actionCell.appendChild(cancelButton);
    }
    if (!mutationLocked && canRetryUpiRedeemCdkeyJob(entry, used)) {
      const retryButton = document.createElement('button');
      retryButton.type = 'button';
      retryButton.className = 'btn btn-primary btn-xs upi-redeem-cdkey-job-action';
      retryButton.textContent = '重试';
      retryButton.title = '调用后端 cdkey-jobs/retry，复用已绑定的 access_token 重新入列';
      retryButton.setAttribute('aria-label', `重试 CDK 任务 ${cdkey}`);
      retryButton.addEventListener('click', () => {
        retryButton.disabled = true;
        operateUpiRedeemCdkeyJob(cdkey, 'retry', redeemChannel).catch((error) => {
          showToast(`重试 CDK 任务失败：${error.message}`, 'error');
        }).finally(() => {
          if (retryButton.isConnected) {
            retryButton.disabled = false;
          }
        });
      });
      actionCell.appendChild(retryButton);
    }

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'btn btn-danger btn-xs upi-redeem-cdkey-delete-action';
    deleteButton.textContent = '删除';
    deleteButton.disabled = mutationLocked;
    deleteButton.title = mutationLocked ? '自动流程运行中不能删除已保存 CDK' : '点击删除该 CDK';
    deleteButton.setAttribute('aria-label', `删除 CDK ${cdkey}`);
    deleteButton.addEventListener('click', () => {
      deleteUpiRedeemCdkey(cdkey, redeemChannel);
    });

    checkbox.addEventListener('change', () => {
      updateUpiRedeemCdkeyEnabled(cdkey, checkbox.checked, redeemChannel);
    });

    item.appendChild(label);
    item.appendChild(cdkeyText);
    item.appendChild(status);
    actionCell.appendChild(deleteButton);
    item.appendChild(actionCell);
    statusList.appendChild(item);
  });
  restoreScrollTopAfterRender(statusList, previousScrollTop);
}

function updateUpiRedeemCdkeyPoolSummary(state = latestState, options = {}) {
  const redeemChannel = normalizeRedeemChannel(options.channel || options.redeemChannel);
  const summary = getCdkPoolSummaryForChannel(redeemChannel);
  if (!summary) {
    return;
  }
  const poolText = getStoredCdkPoolText(state, redeemChannel);
  const cdkeys = parseUpiRedeemCdkeyPoolTextValue(poolText);
  const usage = getStoredCdkUsage(state, redeemChannel);
  const enabledCount = cdkeys.filter((cdkey) => getUpiRedeemCdkeyUsageEntry(usage, cdkey).enabled !== false).length;
  const availableCount = cdkeys.filter((cdkey) => {
    const entry = mergeCurrentUpiRedeemSubscriptionState(
      getUpiRedeemCdkeyUsageEntry(usage, cdkey),
      cdkey,
      state
    );
    return isUpiRedeemCdkeySelectableForRedeem(entry);
  }).length;
  summary.textContent = `总数 ${cdkeys.length} / 启用 ${enabledCount} / 可用 ${availableCount}`;
  const mutationLocked = isUpiRedeemCdkeyPoolMutationLocked();
  const input = getCdkPoolInputForChannel(redeemChannel);
  const importButton = getImportCdkButtonForChannel(redeemChannel);
  const deleteAllButton = getDeleteAllCdkButtonForChannel(redeemChannel);
  if (input) {
    input.disabled = false;
    input.title = mutationLocked
      ? '自动流程运行中允许追加导入新的 CDK'
      : '';
  }
  if (importButton) {
    importButton.disabled = false;
    importButton.title = mutationLocked
      ? '自动流程运行中允许追加导入新的 CDK'
      : '';
  }
  if (deleteAllButton) {
    deleteAllButton.disabled = mutationLocked || cdkeys.length === 0;
    deleteAllButton.title = mutationLocked ? '自动流程运行中不能删除 CDK 池' : '';
  }
  if (!options.skipRender) {
    renderUpiRedeemCdkeyStatusList(state, redeemChannel);
  }
}

function updateAllUpiRedeemCdkeyPoolSummaries(state = latestState, options = {}) {
  ['upi', 'ideal'].forEach((channel) => {
    updateUpiRedeemCdkeyPoolSummary(state, {
      ...options,
      channel,
    });
  });
}

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
  });
}


function normalizeChatgptSessionReaderModeValue(value = '') {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized === CHATGPT_SESSION_READER_MODE_JP_PP
    ? CHATGPT_SESSION_READER_MODE_JP_PP
    : DEFAULT_CHATGPT_SESSION_READER_MODE;
}

function buildDefaultChatgptSessionReaderProfile() {
  return {
    removedContactVerificationUrl: '',
    removedContactCardDeclinedRetryEnabled: true,
    removedContactFirstDirectResendEnabled: false,
    removedContactFirstResendWaitSeconds: 20,
    removedContactSubsequentResendWaitSeconds: 25,
    removedContactVerificationResendMaxAttempts: 1,
    removedContactVerificationPollAttempts: 6,
    removedContactVerificationPollIntervalSeconds: 5,
  };
}

function buildDefaultRemovedPaymentWorkerSettings() {
  return {
    removedPaymentWorkerEnabled: true,
    removedPaymentWorkerBrowserBackend: 'local',
    removedPaymentWorkerAdsPowerApiBase: 'http://127.0.0.1:50325',
    removedPaymentWorkerAdsPowerApiKey: '',
    removedPaymentWorkerAdsPowerProfileId: '',
    removedPaymentWorkerRoxyBrowserApiBase: 'http://127.0.0.1:50000',
    removedPaymentWorkerRoxyBrowserApiKey: '',
    removedPaymentWorkerRoxyBrowserProfileId: '',
    removedPaymentWorkerStripePublishableKey: '',
    removedPaymentWorkerDeviceId: '',
    removedPaymentWorkerUserAgent: '',
    removedPaymentWorkerMaxAttempts: REMOVED_PAYMENT_WORKER_DEFAULT_MAX_ATTEMPTS,
    removedPaymentWorkerPaymentLocale: 'en',
    removedPaymentWorkerCheckoutRebuildMaxAttempts: 3,
    removedPaymentWorkerDefaultProxy: '',
    removedPaymentWorkerProviderProxy: '',
  };
}

function normalizeRemovedPaymentWorkerMaxAttemptsValue(value, fallback = REMOVED_PAYMENT_WORKER_DEFAULT_MAX_ATTEMPTS) {
  const numeric = Number.parseInt(String(value ?? '').trim(), 10);
  if (!Number.isFinite(numeric)) {
    return Math.max(1, Math.min(REMOVED_PAYMENT_WORKER_MAX_ATTEMPTS_LIMIT, Number(fallback) || REMOVED_PAYMENT_WORKER_DEFAULT_MAX_ATTEMPTS));
  }
  return Math.max(1, Math.min(REMOVED_PAYMENT_WORKER_MAX_ATTEMPTS_LIMIT, numeric));
}

function normalizeRemovedPaymentWorkerPaymentLocaleValue(value = '') {
  const normalized = String(value || '').trim();
  return REMOVED_PAYMENT_WORKER_ALLOWED_PAYMENT_LOCALES.has(normalized) ? normalized : 'en';
}

function normalizeRemovedPaymentWorkerBrowserBackendValue(value = '') {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'adspower') return 'adspower';
  if (normalized === 'roxybrowser') return 'roxybrowser';
  return 'local';
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

function normalizeRemovedPaymentWorkerAdsPowerApiBaseValue(value = '') {
  const raw = String(value || '').trim();
  if (!raw) {
    return '';
  }
  return /:\/\//.test(raw) ? raw.replace(/\/+$/, '') : `http://${raw.replace(/\/+$/, '')}`;
}

function normalizeRemovedPaymentWorkerRoxyBrowserApiBaseValue(value = '') {
  const raw = String(value || '').trim();
  if (!raw) {
    return '';
  }
  return /:\/\//.test(raw) ? raw.replace(/\/+$/, '') : `http://${raw.replace(/\/+$/, '')}`;
}

function normalizeRemovedPaymentWorkerCheckoutRebuildMaxAttemptsValue(value, fallback = 3) {
  const numeric = Number.parseInt(String(value ?? '').trim(), 10);
  if (!Number.isFinite(numeric)) {
    return Math.max(1, Math.min(10, Number(fallback) || 3));
  }
  return Math.max(1, Math.min(10, numeric));
}

function normalizeRemovedPaymentWorkerSettingsValue(state = {}) {
  const defaults = buildDefaultRemovedPaymentWorkerSettings();
  const legacyProxy = String(state?.removedPaymentWorkerProxy || '').trim();
  const hasRoxyBrowserProfileId = Object.prototype.hasOwnProperty.call(
    state && typeof state === 'object' ? state : {},
    'removedPaymentWorkerRoxyBrowserProfileId',
  );
  const legacyProfileId = String(state?.removedPaymentWorkerAdsPowerProfileId || '').trim();
  const roxyBrowserProfileId = hasRoxyBrowserProfileId
    ? String(state?.removedPaymentWorkerRoxyBrowserProfileId || '').trim()
    : (normalizeRemovedPaymentWorkerBrowserBackendValue(state?.removedPaymentWorkerBrowserBackend) === 'roxybrowser' ? legacyProfileId : '');
  const hasAdsPowerApiBase = Object.prototype.hasOwnProperty.call(
    state && typeof state === 'object' ? state : {},
    'removedPaymentWorkerAdsPowerApiBase',
  );
  const hasRoxyBrowserApiBase = Object.prototype.hasOwnProperty.call(
    state && typeof state === 'object' ? state : {},
    'removedPaymentWorkerRoxyBrowserApiBase',
  );
  return {
    removedPaymentWorkerEnabled: Boolean(state?.removedPaymentWorkerEnabled),
    removedPaymentWorkerBrowserBackend: normalizeRemovedPaymentWorkerBrowserBackendValue(state?.removedPaymentWorkerBrowserBackend || defaults.removedPaymentWorkerBrowserBackend),
    removedPaymentWorkerAdsPowerApiBase: normalizeRemovedPaymentWorkerAdsPowerApiBaseValue(hasAdsPowerApiBase ? state?.removedPaymentWorkerAdsPowerApiBase : defaults.removedPaymentWorkerAdsPowerApiBase),
    removedPaymentWorkerAdsPowerApiKey: String(state?.removedPaymentWorkerAdsPowerApiKey || defaults.removedPaymentWorkerAdsPowerApiKey || '').trim(),
    removedPaymentWorkerAdsPowerProfileId: legacyProfileId,
    removedPaymentWorkerRoxyBrowserApiBase: normalizeRemovedPaymentWorkerRoxyBrowserApiBaseValue(hasRoxyBrowserApiBase ? state?.removedPaymentWorkerRoxyBrowserApiBase : defaults.removedPaymentWorkerRoxyBrowserApiBase),
    removedPaymentWorkerRoxyBrowserApiKey: String(state?.removedPaymentWorkerRoxyBrowserApiKey || defaults.removedPaymentWorkerRoxyBrowserApiKey || '').trim(),
    removedPaymentWorkerRoxyBrowserProfileId: roxyBrowserProfileId,
    removedPaymentWorkerStripePublishableKey: String(state?.removedPaymentWorkerStripePublishableKey || '').trim(),
    removedPaymentWorkerDeviceId: String(state?.removedPaymentWorkerDeviceId || '').trim(),
    removedPaymentWorkerUserAgent: String(state?.removedPaymentWorkerUserAgent || '').trim(),
    removedPaymentWorkerMaxAttempts: normalizeRemovedPaymentWorkerMaxAttemptsValue(state?.removedPaymentWorkerMaxAttempts, defaults.removedPaymentWorkerMaxAttempts),
    removedPaymentWorkerPaymentLocale: normalizeRemovedPaymentWorkerPaymentLocaleValue(state?.removedPaymentWorkerPaymentLocale || defaults.removedPaymentWorkerPaymentLocale),
    removedPaymentWorkerCheckoutRebuildMaxAttempts: normalizeRemovedPaymentWorkerCheckoutRebuildMaxAttemptsValue(
      state?.removedPaymentWorkerCheckoutRebuildMaxAttempts,
      defaults.removedPaymentWorkerCheckoutRebuildMaxAttempts,
    ),
    removedPaymentWorkerDefaultProxy: String(state?.removedPaymentWorkerDefaultProxy || legacyProxy).trim(),
    removedPaymentWorkerProviderProxy: String(state?.removedPaymentWorkerProviderProxy || '').trim(),
  };
}

function normalizeChatgptSessionReaderProfileValue(profile = {}, fallback = null) {
  const rawProfile = profile && typeof profile === 'object' && !Array.isArray(profile)
    ? profile
    : {};
  const baseProfile = fallback && typeof fallback === 'object' && !Array.isArray(fallback)
    ? fallback
    : buildDefaultChatgptSessionReaderProfile();
  return {
    plusRemovedContactOauthDelaySeconds: normalizePlusRemovedContactOauthDelaySeconds(
      rawProfile.plusRemovedContactOauthDelaySeconds ?? baseProfile.plusRemovedContactOauthDelaySeconds
    ),
    chatgptSessionReaderCloudConversionEnabled: Boolean(
      rawProfile.chatgptSessionReaderCloudConversionEnabled ?? baseProfile.chatgptSessionReaderCloudConversionEnabled
    ),
    chatgptSessionReaderCloudConversionApiUrl: normalizeChatgptSessionReaderCloudConversionApiUrlValue(
      rawProfile.chatgptSessionReaderCloudConversionApiUrl ?? baseProfile.chatgptSessionReaderCloudConversionApiUrl
    ),
    chatgptSessionReaderCloudConversionApiKey: normalizeChatgptSessionReaderCloudConversionApiKeyValue(
      rawProfile.chatgptSessionReaderCloudConversionApiKey ?? baseProfile.chatgptSessionReaderCloudConversionApiKey
    ),
    chatgptSessionReaderConversionProxyUrl: normalizeChatgptSessionReaderConversionProxyUrlValue(
      rawProfile.chatgptSessionReaderConversionProxyUrl ?? baseProfile.chatgptSessionReaderConversionProxyUrl
    ),
    removedContactVerificationUrl: normalizeRemovedContactVerificationUrlValue(
      rawProfile.removedContactVerificationUrl ?? baseProfile.removedContactVerificationUrl
    ),
    removedContactCardDeclinedRetryEnabled: Boolean(
      rawProfile.removedContactCardDeclinedRetryEnabled ?? baseProfile.removedContactCardDeclinedRetryEnabled
    ),
    removedContactFirstDirectResendEnabled: Boolean(
      rawProfile.removedContactFirstDirectResendEnabled ?? baseProfile.removedContactFirstDirectResendEnabled
    ),
    removedContactFirstResendWaitSeconds: normalizeRemovedContactResendWaitSeconds(
      rawProfile.removedContactFirstResendWaitSeconds ?? baseProfile.removedContactFirstResendWaitSeconds,
      20
    ),
    removedContactSubsequentResendWaitSeconds: normalizeRemovedContactResendWaitSeconds(
      rawProfile.removedContactSubsequentResendWaitSeconds ?? baseProfile.removedContactSubsequentResendWaitSeconds,
      25
    ),
    removedContactVerificationResendMaxAttempts: normalizeRemovedContactVerificationResendMaxAttempts(
      rawProfile.removedContactVerificationResendMaxAttempts ?? baseProfile.removedContactVerificationResendMaxAttempts,
      1
    ),
    removedContactVerificationPollAttempts: normalizeRemovedContactVerificationPollAttempts(
      rawProfile.removedContactVerificationPollAttempts ?? baseProfile.removedContactVerificationPollAttempts,
      6
    ),
    removedContactVerificationPollIntervalSeconds: normalizeRemovedContactVerificationPollIntervalSeconds(
      rawProfile.removedContactVerificationPollIntervalSeconds ?? baseProfile.removedContactVerificationPollIntervalSeconds,
      5
    ),
  };
}

function buildLegacyChatgptSessionReaderProfileFromState(state = {}) {
  return normalizeChatgptSessionReaderProfileValue({
    plusRemovedContactOauthDelaySeconds: state?.plusRemovedContactOauthDelaySeconds,
    chatgptSessionReaderCloudConversionEnabled: state?.chatgptSessionReaderCloudConversionEnabled,
    chatgptSessionReaderCloudConversionApiUrl: state?.chatgptSessionReaderCloudConversionApiUrl,
    chatgptSessionReaderCloudConversionApiKey: state?.chatgptSessionReaderCloudConversionApiKey,
    chatgptSessionReaderConversionProxyUrl: state?.chatgptSessionReaderConversionProxyUrl,
    removedContactVerificationUrl: state?.removedContactVerificationUrl,
    removedContactCardDeclinedRetryEnabled: state?.removedContactCardDeclinedRetryEnabled,
    removedContactFirstDirectResendEnabled: state?.removedContactFirstDirectResendEnabled,
    removedContactFirstResendWaitSeconds: state?.removedContactFirstResendWaitSeconds,
    removedContactSubsequentResendWaitSeconds: state?.removedContactSubsequentResendWaitSeconds,
    removedContactVerificationResendMaxAttempts: state?.removedContactVerificationResendMaxAttempts,
    removedContactVerificationPollAttempts: state?.removedContactVerificationPollAttempts,
    removedContactVerificationPollIntervalSeconds: state?.removedContactVerificationPollIntervalSeconds,
  });
}

function normalizeChatgptSessionReaderProfilesValue(value = {}, fallbackState = {}) {
  const rawProfiles = value && typeof value === 'object' && !Array.isArray(value)
    ? value
    : {};
  const legacyProfile = buildLegacyChatgptSessionReaderProfileFromState(fallbackState);
  const hasUsProfile = Object.prototype.hasOwnProperty.call(rawProfiles, CHATGPT_SESSION_READER_MODE_US_PP);
  const hasJpProfile = Object.prototype.hasOwnProperty.call(rawProfiles, CHATGPT_SESSION_READER_MODE_JP_PP);
  const usProfile = hasUsProfile
    ? normalizeChatgptSessionReaderProfileValue(rawProfiles[CHATGPT_SESSION_READER_MODE_US_PP])
    : normalizeChatgptSessionReaderProfileValue(legacyProfile);
  const jpProfile = hasJpProfile
    ? normalizeChatgptSessionReaderProfileValue(rawProfiles[CHATGPT_SESSION_READER_MODE_JP_PP])
    : normalizeChatgptSessionReaderProfileValue(hasUsProfile ? usProfile : legacyProfile);
  return {
    [CHATGPT_SESSION_READER_MODE_US_PP]: usProfile,
    [CHATGPT_SESSION_READER_MODE_JP_PP]: jpProfile,
  };
}

function buildChatgptSessionReaderLegacyPatchFromProfile(profile = {}) {
  const normalizedProfile = normalizeChatgptSessionReaderProfileValue(profile);
  return Object.fromEntries(
    CHATGPT_SESSION_READER_PROFILE_SETTING_KEYS.map((key) => [key, normalizedProfile[key]])
  );
}

function normalizeChatgptSessionReaderStateForUi(state = {}, options = {}) {
  const mode = normalizeChatgptSessionReaderModeValue(state?.chatgptSessionReaderMode);
  const profiles = normalizeChatgptSessionReaderProfilesValue(state?.chatgptSessionReaderProfiles || {}, state);
  const legacyOverrideSource = options?.legacyOverrideSource && typeof options.legacyOverrideSource === 'object'
    ? options.legacyOverrideSource
    : null;
  const hasExplicitLegacyOverrides = Boolean(legacyOverrideSource) && CHATGPT_SESSION_READER_PROFILE_SETTING_KEYS.some((key) => (
    Object.prototype.hasOwnProperty.call(legacyOverrideSource, key)
  ));
  const activeProfile = hasExplicitLegacyOverrides
    ? normalizeChatgptSessionReaderProfileValue({
      ...(profiles[mode] || {}),
      ...buildLegacyChatgptSessionReaderProfileFromState({
        ...state,
        ...legacyOverrideSource,
      }),
    }, profiles[mode])
    : (profiles[mode] || buildLegacyChatgptSessionReaderProfileFromState(state));
  return {
    ...(state || {}),
    chatgptSessionReaderMode: mode,
    chatgptSessionReaderProfiles: {
      ...profiles,
      [mode]: activeProfile,
    },
    ...buildChatgptSessionReaderLegacyPatchFromProfile(activeProfile),
  };
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

function normalizeUpiInfoHelperPhoneModeValue(value = '') {
  const rootScope = typeof window !== 'undefined' ? window : globalThis;
  if (rootScope.LegacyPayUtils?.normalizeUpiInfoHelperPhoneMode) {
    return rootScope.LegacyPayUtils.normalizeUpiInfoHelperPhoneMode(value);
  }
  const normalized = String(value || '').trim().toLowerCase();
  return normalized === UPI_INFO_HELPER_PHONE_MODE_AUTO || normalized === 'builtin'
    ? UPI_INFO_HELPER_PHONE_MODE_AUTO
    : UPI_INFO_HELPER_PHONE_MODE_MANUAL;
}

function getUpiInfoHelperAutoModeEnabled(state = latestState) {
  return Boolean(state?.legacyPayHelperAutoModeEnabled);
}

function normalizeUpiInfoAutoModePermissionValue(value) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
  }
  const normalized = String(value ?? '').trim().toLowerCase();
  if (!normalized) {
    return null;
  }
  if (['true', '1', 'yes', 'y', 'on', 'enabled', 'enable'].includes(normalized)) {
    return true;
  }
  if (['false', '0', 'no', 'n', 'off', 'disabled', 'disable'].includes(normalized)) {
    return false;
  }
  return null;
}

function getUpiInfoAutoModePermissionFromPayload(payload = {}) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return null;
  }
  for (const key of ['auto_mode_enabled', 'autoModeEnabled', 'auto_enabled', 'autoEnabled']) {
    if (payload[key] !== undefined) {
      return normalizeUpiInfoAutoModePermissionValue(payload[key]);
    }
  }
  if (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
    return getUpiInfoAutoModePermissionFromPayload(payload.data);
  }
  return null;
}

function shouldPreserveSelectedUpiInfoAutoMode(state = latestState) {
  const payloadPermission = getUpiInfoAutoModePermissionFromPayload(state?.legacyPayHelperBalancePayload);
  return normalizeUpiInfoHelperPhoneModeValue(state?.legacyPayHelperPhoneMode) === UPI_INFO_HELPER_PHONE_MODE_AUTO
    && (Boolean(state?.legacyPayHelperAutoModeEnabled) || payloadPermission === true);
}

function hasUpiInfoAutoModePermissionField(payload = {}) {
  return getUpiInfoAutoModePermissionFromPayload(payload) !== null;
}

function isUpiInfoAutoModePermissionDenied(state = latestState) {
  const payloadPermission = getUpiInfoAutoModePermissionFromPayload(state?.legacyPayHelperBalancePayload);
  return payloadPermission === false;
}

function normalizeUpiInfoRemainingUsesValue(value) {
  const rootScope = typeof window !== 'undefined' ? window : globalThis;
  if (rootScope.LegacyPayUtils?.normalizeUpiInfoRemainingUses) {
    return rootScope.LegacyPayUtils.normalizeUpiInfoRemainingUses(value);
  }
  if (value === undefined || value === null || String(value).trim() === '') {
    return null;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(0, Math.floor(numeric)) : null;
}

function getUpiInfoBalanceRemainingUsesFromResponse(response = {}) {
  const rootScope = typeof window !== 'undefined' ? window : globalThis;
  if (rootScope.LegacyPayUtils?.getUpiInfoBalanceRemainingUses) {
    const remaining = rootScope.LegacyPayUtils.getUpiInfoBalanceRemainingUses(response?.data || response?.payload || response);
    if (remaining !== null && remaining !== undefined) {
      return remaining;
    }
  }
  return normalizeUpiInfoRemainingUsesValue(
    response?.remainingUses
    ?? response?.data?.remaining_uses
    ?? response?.data?.remainingUses
    ?? response?.payload?.data?.remaining_uses
    ?? response?.payload?.remaining_uses
    ?? response?.payload?.remainingUses
  );
}

function getUpiInfoAutoModeEnabledFromResponse(response = {}) {
  if (typeof response?.autoModeEnabled === 'boolean') {
    return response.autoModeEnabled;
  }
  const rootScope = typeof window !== 'undefined' ? window : globalThis;
  if (rootScope.LegacyPayUtils?.isUpiInfoAutoModeEnabled) {
    return rootScope.LegacyPayUtils.isUpiInfoAutoModeEnabled(response?.data || response?.payload || response);
  }
  return Boolean(
    response?.data?.auto_mode_enabled
    ?? response?.data?.autoModeEnabled
    ?? response?.payload?.data?.auto_mode_enabled
    ?? response?.payload?.auto_mode_enabled
    ?? response?.payload?.autoModeEnabled
  );
}

function normalizeUpiInfoOtpChannelValue(value = '') {
  const rootScope = typeof window !== 'undefined' ? window : globalThis;
  if (rootScope.LegacyPayUtils?.normalizeUpiInfoOtpChannel) {
    return rootScope.LegacyPayUtils.normalizeUpiInfoOtpChannel(value);
  }
  return String(value || '').trim().toLowerCase() === 'sms' ? 'sms' : 'whatsapp';
}

function normalizeUpiInfoLocalSmsHelperBaseUrlValue(value = '') {
  const fallback = 'http://127.0.0.1:18767';
  const rawValue = String(value || fallback).trim();
  try {
    const parsed = new URL(rawValue);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return fallback;
    }
    const endpointPath = parsed.pathname.replace(/\/+$/g, '') || '/';
    if (['/otp', '/latest-otp', '/health'].includes(endpointPath)) {
      parsed.pathname = '';
      parsed.search = '';
      parsed.hash = '';
    }
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return fallback;
  }
}

function hasOwnStateValue(source, key) {
  return Object.prototype.hasOwnProperty.call(source, key);
}

function readAutoRunStateValue(source, keys, fallback) {
  for (const key of keys) {
    if (hasOwnStateValue(source, key)) {
      return source[key];
    }
  }
  return fallback;
}

function normalizePendingAutoRunStartRunCount(value) {
  const numeric = Math.floor(Number(value) || 0);
  return numeric > 0 ? numeric : 0;
}

function registerPendingAutoRunStartRunCount(totalRuns) {
  pendingAutoRunStartTotalRuns = normalizePendingAutoRunStartRunCount(totalRuns);
  pendingAutoRunStartExpiresAt = pendingAutoRunStartTotalRuns > 0
    ? Date.now() + 30000
    : 0;
}

function clearPendingAutoRunStartRunCount() {
  pendingAutoRunStartTotalRuns = 0;
  pendingAutoRunStartExpiresAt = 0;
}

function getPendingAutoRunStartRunCount() {
  if (pendingAutoRunStartTotalRuns > 0 && pendingAutoRunStartExpiresAt > 0 && Date.now() > pendingAutoRunStartExpiresAt) {
    clearPendingAutoRunStartRunCount();
  }
  return pendingAutoRunStartTotalRuns;
}

function getAutoRunSourceTotalRuns(source = {}) {
  return normalizePendingAutoRunStartRunCount(readAutoRunStateValue(source, ['autoRunTotalRuns', 'totalRuns'], 0));
}

function syncAutoRunState(source = {}) {
  const phase = source.autoRunPhase ?? source.phase ?? currentAutoRun.phase;
  const autoRunning = source.autoRunning !== undefined
    ? Boolean(source.autoRunning)
    : (source.autoRunPhase !== undefined || source.phase !== undefined
      ? ['scheduled', 'running', 'waiting_step', 'waiting_email', 'retrying', 'waiting_interval'].includes(phase)
      : currentAutoRun.autoRunning);

  currentAutoRun = {
    autoRunning,
    phase,
    currentRun: readAutoRunStateValue(source, ['autoRunCurrentRun', 'currentRun'], currentAutoRun.currentRun),
    totalRuns: readAutoRunStateValue(source, ['autoRunTotalRuns', 'totalRuns'], currentAutoRun.totalRuns),
    attemptRun: readAutoRunStateValue(source, ['autoRunAttemptRun', 'attemptRun'], currentAutoRun.attemptRun),
    scheduledAt: readAutoRunStateValue(source, ['scheduledAutoRunAt', 'scheduledAt'], currentAutoRun.scheduledAt),
    countdownAt: readAutoRunStateValue(source, ['autoRunCountdownAt', 'countdownAt'], currentAutoRun.countdownAt),
    countdownTitle: readAutoRunStateValue(source, ['autoRunCountdownTitle', 'countdownTitle'], currentAutoRun.countdownTitle),
    countdownNote: readAutoRunStateValue(source, ['autoRunCountdownNote', 'countdownNote'], currentAutoRun.countdownNote),
  };
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
  return currentAutoRun.phase === 'running'
    || currentAutoRun.phase === 'waiting_step'
    || currentAutoRun.phase === 'retrying'
    || currentAutoRun.phase === 'waiting_interval';
}

function isAutoRunPausedPhase() {
  return currentAutoRun.phase === 'waiting_email';
}

function isAutoRunWaitingStepPhase() {
  return currentAutoRun.phase === 'waiting_step';
}

function isAutoRunScheduledPhase() {
  return currentAutoRun.phase === 'scheduled';
}

function isAutoRunSourceSyncPhase(phase) {
  return ['scheduled', 'running', 'waiting_step', 'waiting_email', 'retrying', 'waiting_interval'].includes(phase);
}

function shouldSyncRunCountFromAutoRunSource(source = {}) {
  const phase = source.autoRunPhase ?? source.phase ?? currentAutoRun.phase;
  const autoRunning = source.autoRunning !== undefined
    ? Boolean(source.autoRunning)
    : isAutoRunSourceSyncPhase(phase);
  const shouldSync = autoRunning || isAutoRunSourceSyncPhase(phase);
  if (!shouldSync) {
    return false;
  }

  const pendingTotalRuns = getPendingAutoRunStartRunCount();
  if (pendingTotalRuns > 0) {
    const sourceTotalRuns = getAutoRunSourceTotalRuns(source);
    if (sourceTotalRuns > 0 && sourceTotalRuns !== pendingTotalRuns) {
      return false;
    }
    if (sourceTotalRuns === pendingTotalRuns) {
      clearPendingAutoRunStartRunCount();
    }
  }
  return true;
}

function getAutoRunLabel(payload = currentAutoRun) {
  if ((payload.phase ?? currentAutoRun.phase) === 'scheduled') {
    return (payload.totalRuns || 1) > 1 ? ` (${payload.totalRuns}轮)` : '';
  }
  const attemptLabel = payload.attemptRun ? ` · 尝试${payload.attemptRun}` : '';
  if ((payload.totalRuns || 1) > 1) {
    return ` (${payload.currentRun}/${payload.totalRuns}${attemptLabel})`;
  }
  return attemptLabel ? ` (${attemptLabel.slice(3)})` : '';
}

function normalizeAutoDelayMinutes(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return AUTO_DELAY_DEFAULT_MINUTES;
  }
  return Math.min(AUTO_DELAY_MAX_MINUTES, Math.max(AUTO_DELAY_MIN_MINUTES, Math.floor(numeric)));
}

function normalizeAutoRunThreadIntervalMinutes(value) {
  const rawValue = String(value ?? '').trim();
  if (!rawValue) {
    return AUTO_FALLBACK_THREAD_INTERVAL_DEFAULT_MINUTES;
  }

  const numeric = Number(rawValue);
  if (!Number.isFinite(numeric)) {
    return AUTO_FALLBACK_THREAD_INTERVAL_DEFAULT_MINUTES;
  }

  return Math.min(
    AUTO_FALLBACK_THREAD_INTERVAL_MAX_MINUTES,
    Math.max(AUTO_FALLBACK_THREAD_INTERVAL_MIN_MINUTES, Math.floor(numeric))
  );
}

function normalizeAutoStepDelaySeconds(value) {
  const rawValue = String(value ?? '').trim();
  if (!rawValue) {
    return AUTO_STEP_DELAY_DEFAULT_SECONDS;
  }

  const numeric = Number(rawValue);
  if (!Number.isFinite(numeric)) {
    return AUTO_STEP_DELAY_DEFAULT_SECONDS;
  }

  return Math.min(AUTO_STEP_DELAY_MAX_SECONDS, Math.max(AUTO_STEP_DELAY_MIN_SECONDS, Math.floor(numeric)));
}

function normalizePlusRemovedContactOauthDelaySeconds(value) {
  const rawValue = String(value ?? '').trim();
  if (!rawValue) {
    return 10;
  }

  const numeric = Number(rawValue);
  if (!Number.isFinite(numeric)) {
    return 10;
  }

  return Math.min(3600, Math.max(0, Math.floor(numeric)));
}

function normalizeRemovedContactResendWaitSeconds(value, fallback = 20) {
  const rawValue = String(value ?? '').trim();
  const fallbackValue = Math.min(300, Math.max(0, Math.floor(Number(fallback) || 0)));
  if (!rawValue) {
    return fallbackValue;
  }

  const numeric = Number(rawValue);
  if (!Number.isFinite(numeric)) {
    return fallbackValue;
  }

  return Math.min(300, Math.max(0, Math.floor(numeric)));
}

function normalizeRemovedContactVerificationResendMaxAttempts(value, fallback = 1) {
  const rawValue = String(value ?? '').trim();
  const fallbackValue = Math.min(10, Math.max(0, Math.floor(Number(fallback) || 0)));
  if (!rawValue) {
    return fallbackValue;
  }

  const numeric = Number(rawValue);
  if (!Number.isFinite(numeric)) {
    return fallbackValue;
  }

  return Math.min(10, Math.max(0, Math.floor(numeric)));
}

function normalizeRemovedContactVerificationPollAttempts(value, fallback = 6) {
  const rawValue = String(value ?? '').trim();
  const fallbackValue = Math.min(60, Math.max(1, Math.floor(Number(fallback) || 6)));
  if (!rawValue) {
    return fallbackValue;
  }

  const numeric = Number(rawValue);
  if (!Number.isFinite(numeric)) {
    return fallbackValue;
  }

  return Math.min(60, Math.max(1, Math.floor(numeric)));
}

function normalizeRemovedContactVerificationPollIntervalSeconds(value, fallback = 5) {
  const rawValue = String(value ?? '').trim();
  const fallbackValue = Math.min(60, Math.max(1, Math.floor(Number(fallback) || 5)));
  if (!rawValue) {
    return fallbackValue;
  }

  const numeric = Number(rawValue);
  if (!Number.isFinite(numeric)) {
    return fallbackValue;
  }

  return Math.min(60, Math.max(1, Math.floor(numeric)));
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

function normalizeVerificationResendCount(value, fallback) {
  const rawValue = String(value ?? '').trim();
  if (!rawValue) {
    return fallback;
  }

  const numeric = Number(rawValue);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  return Math.min(
    VERIFICATION_RESEND_COUNT_MAX,
    Math.max(VERIFICATION_RESEND_COUNT_MIN, Math.floor(numeric))
  );
}

function formatAutoStepDelayInputValue(value) {
  const normalized = normalizeAutoStepDelaySeconds(value);
  return String(normalized);
}

function splitCustomEmailPoolEntrySource(value = '') {
  const source = Array.isArray(value)
    ? value
    : String(value || '').split(/[\r\n,，;；]+/);

  return source;
}

function normalizeCustomEmailPoolEntries(value = '') {
  const source = splitCustomEmailPoolEntrySource(value);

  return source
    .map((item) => parseCustomEmailPoolEntryValueForSidepanel(item).email)
    .filter((item) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item));
}

function normalizeCustomEmailPoolEntryEmail(value = '') {
  return String(value || '').trim().toLowerCase();
}

function createCustomEmailPoolEntryId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `custom-pool-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeCustomEmailPoolEntryObjects(value = []) {
  const source = splitCustomEmailPoolEntrySource(value);
  const seenEmails = new Set();
  const entries = [];

  for (const rawEntry of source) {
    const asObject = rawEntry && typeof rawEntry === 'object'
      ? rawEntry
      : { email: rawEntry };
    const parsedEntry = parseCustomEmailPoolEntryValueForSidepanel(asObject.credential || asObject.email || '');
    const email = normalizeCustomEmailPoolEntryEmail(parsedEntry.email || '');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      continue;
    }
    if (seenEmails.has(email)) {
      continue;
    }
    seenEmails.add(email);
    entries.push({
      id: String(asObject.id || createCustomEmailPoolEntryId()),
      email,
      credential: parsedEntry.verificationUrl ? '' : (parsedEntry.credential || String(asObject.credential || '').trim()),
      verificationUrl: normalizeCustomEmailVerificationUrlValue(asObject.verificationUrl || asObject.url || parsedEntry.verificationUrl || ''),
      enabled: asObject.enabled !== undefined ? Boolean(asObject.enabled) : true,
      used: Boolean(asObject.used),
      note: String(asObject.note || '').trim(),
      lastUsedAt: Number.isFinite(Number(asObject.lastUsedAt)) ? Number(asObject.lastUsedAt) : 0,
    });
  }

  return entries;
}

function formatCustomEmailPoolEntryValue(entry = {}) {
  const asObject = entry && typeof entry === 'object'
    ? entry
    : { email: entry };
  const parsedEntry = parseCustomEmailPoolEntryValueForSidepanel(asObject.credential || asObject.email || '');
  const email = normalizeCustomEmailPoolEntryEmail(parsedEntry.email || asObject.email || '');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return '';
  }
  const verificationUrl = normalizeCustomEmailVerificationUrlValue(
    asObject.verificationUrl || asObject.url || parsedEntry.verificationUrl || ''
  );
  if (verificationUrl) {
    return `${email}----${verificationUrl}`;
  }
  const credential = parsedEntry.credential || String(asObject.credential || '').trim();
  return credential || email;
}

function normalizeCustomEmailPoolEntryValues(value = []) {
  return normalizeCustomEmailPoolEntryObjects(value)
    .map((entry) => formatCustomEmailPoolEntryValue(entry))
    .filter(Boolean);
}

function getNormalizedCustomEmailPoolEntriesState() {
  const entries = (typeof customEmailPoolEntriesState !== 'undefined' && Array.isArray(customEmailPoolEntriesState))
    ? customEmailPoolEntriesState
    : [];
  return normalizeCustomEmailPoolEntryObjects(entries);
}

function getActiveCustomEmailPoolEmails(entries = getNormalizedCustomEmailPoolEntriesState()) {
  return normalizeCustomEmailPoolEntryObjects(entries)
    .filter((entry) => entry.enabled && !entry.used)
    .map((entry) => entry.email);
}

function setCustomEmailPoolEntriesState(entries = [], options = {}) {
  const { syncInput = true } = options;
  customEmailPoolEntriesState = normalizeCustomEmailPoolEntryObjects(entries);
  if (syncInput && inputCustomEmailPool) {
    inputCustomEmailPool.value = normalizeCustomEmailPoolEntryValues(
      customEmailPoolEntriesState.filter((entry) => entry.enabled && !entry.used)
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
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatScheduleTime(timestamp) {
  return new Date(timestamp).toLocaleString('zh-CN', {
    hour12: false,
    timeZone: DISPLAY_TIMEZONE,
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function stopScheduledCountdownTicker() {
  clearInterval(scheduledCountdownTimer);
  scheduledCountdownTimer = null;
}

function getActiveAutoRunCountdown() {
  if (isAutoRunScheduledPhase() && Number.isFinite(currentAutoRun.scheduledAt)) {
    return {
      at: currentAutoRun.scheduledAt,
      title: '已计划自动运行',
      note: `计划于 ${formatScheduleTime(currentAutoRun.scheduledAt)} 开始`,
      tone: 'scheduled',
    };
  }

  if (currentAutoRun.phase !== 'waiting_interval') {
    return null;
  }

  if (!Number.isFinite(currentAutoRun.countdownAt)) {
    return null;
  }

  return {
    at: currentAutoRun.countdownAt,
    title: currentAutoRun.countdownTitle || '等待中',
    note: currentAutoRun.countdownNote || '',
    tone: 'running',
  };
}

function renderScheduledAutoRunInfo() {
  if (!autoScheduleBar) {
    return;
  }

  const countdown = getActiveAutoRunCountdown();
  if (!countdown) {
    autoScheduleBar.style.display = 'none';
    return;
  }

  const remainingMs = countdown.at - Date.now();
  autoScheduleBar.style.display = 'flex';
  if (btnAutoRunNow) {
    btnAutoRunNow.hidden = false;
    btnAutoRunNow.textContent = currentAutoRun.phase === 'waiting_interval' ? '立即继续' : '立即开始';
  }
  if (btnAutoCancelSchedule) {
    btnAutoCancelSchedule.hidden = true;
  }
  autoScheduleTitle.textContent = countdown.title;
  autoScheduleMeta.textContent = remainingMs > 0
    ? `${countdown.note ? `${countdown.note}，` : ''}剩余 ${formatCountdown(remainingMs)}`
    : '倒计时即将结束，正在准备继续...';
  return;
}

function syncScheduledCountdownTicker() {
  renderScheduledAutoRunInfo();
  if (getActiveAutoRunCountdown()) {
    if (scheduledCountdownTimer) {
      return;
    }

    scheduledCountdownTimer = setInterval(() => {
      renderScheduledAutoRunInfo();
      updateStatusDisplay(latestState);
    }, 1000);
    return;
  }

  stopScheduledCountdownTicker();
  return;
}

function setDefaultAutoRunButton() {
  btnAutoRun.disabled = false;
  inputRunCount.disabled = false;
  btnAutoRun.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> 自动';
}

function normalizeCloudflareDomainValue(value = '') {
  let normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return '';
  normalized = normalized.replace(/^@+/, '');
  normalized = normalized.replace(/^https?:\/\//, '');
  normalized = normalized.replace(/\/.*$/, '');
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(normalized)) {
    return '';
  }
  return normalized;
}

function normalizeCloudflareDomains(values = []) {
  const seen = new Set();
  const domains = [];
  for (const value of Array.isArray(values) ? values : []) {
    const normalized = normalizeCloudflareDomainValue(value);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    domains.push(normalized);
  }
  return domains;
}

function normalizeCloudflareTempEmailBaseUrlValue(value = '') {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const candidate = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(raw) ? raw : `https://${raw}`;
  try {
    const parsed = new URL(candidate);
    parsed.hash = '';
    parsed.search = '';
    const pathname = parsed.pathname === '/' ? '' : parsed.pathname.replace(/\/+$/, '');
    return `${parsed.origin}${pathname}`;
  } catch {
    return '';
  }
}

function normalizeCloudflareTempEmailReceiveMailboxValue(value = '') {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return '';
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? normalized : '';
}

function normalizeCloudflareTempEmailDomainValue(value = '') {
  return normalizeCloudflareDomainValue(value);
}

function normalizeCloudflareTempEmailDomains(values = []) {
  const seen = new Set();
  const domains = [];
  for (const value of Array.isArray(values) ? values : []) {
    const normalized = normalizeCloudflareTempEmailDomainValue(value);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    domains.push(normalized);
  }
  return domains;
}

function normalizeCloudMailBaseUrlValue(value = '') {
  return normalizeCloudflareTempEmailBaseUrlValue(value);
}

function normalizeCloudMailReceiveMailboxValue(value = '') {
  return normalizeCloudflareTempEmailReceiveMailboxValue(value);
}

function normalizeCloudMailDomainValue(value = '') {
  return normalizeCloudflareDomainValue(value);
}

function normalizeMoemailBaseUrlValue(value = '') {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const candidate = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(raw) ? raw : `https://${raw}`;
  try {
    const parsed = new URL(candidate);
    parsed.hash = '';
    parsed.search = '';
    const pathname = parsed.pathname === '/' ? '' : parsed.pathname.replace(/\/+$/, '');
    return `${parsed.origin}${pathname}`;
  } catch {
    return '';
  }
}

function normalizeMoemailDomainValue(value = '') {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^@+/, '')
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '');
}

function normalizeYydsMailBaseUrlValue(value = '') {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const candidate = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(raw) ? raw : `https://${raw}`;
  try {
    const parsed = new URL(candidate);
    parsed.hash = '';
    parsed.search = '';
    const pathname = parsed.pathname === '/' ? '' : parsed.pathname.replace(/\/+$/, '');
    return `${parsed.origin}${pathname}`;
  } catch {
    return '';
  }
}

function normalizeYydsMailDomainValue(value = '') {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^@+/, '')
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '');
}

function normalizeFreemailBaseUrlValue(value = '') {
  return normalizeCloudflareTempEmailBaseUrlValue(value);
}

function normalizeFreemailDomainValue(value = '') {
  return normalizeCloudflareDomainValue(value);
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
      return String(value || '').trim().toLowerCase() === 'sms' ? 'sms' : 'whatsapp';
    });
  const normalizeUpiInfoLocalSmsHelperBaseUrlSafe = typeof normalizeUpiInfoLocalSmsHelperBaseUrlValue === 'function'
    ? normalizeUpiInfoLocalSmsHelperBaseUrlValue
    : ((value = '') => {
      const fallback = 'http://127.0.0.1:18767';
      const rawValue = String(value || fallback).trim();
      try {
        const parsed = new URL(rawValue);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          return fallback;
        }
        const endpointPath = parsed.pathname.replace(/\/+$/g, '') || '/';
        if (['/otp', '/latest-otp', '/health'].includes(endpointPath)) {
          parsed.pathname = '';
          parsed.search = '';
          parsed.hash = '';
        }
        return parsed.toString().replace(/\/$/, '');
      } catch {
        return fallback;
      }
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
  const rawAuthVerificationEnabled = Boolean(inputAuthVerificationEnabled?.checked);
  const capabilityState = typeof resolveCurrentSidepanelCapabilities === 'function'
    ? resolveCurrentSidepanelCapabilities({
      panelMode: rawPanelMode,
      signupMethod: selectedSignupMethod,
      state: {
        ...(latestState || {}),
        panelMode: rawPanelMode,
        plusAccountAccessStrategy: rawPlusAccountAccessStrategy,
        plusModeEnabled: rawPlusModeEnabled,
        authVerificationEnabled: rawAuthVerificationEnabled,
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
            authVerificationEnabled: rawAuthVerificationEnabled,
            signupMethod: selectedSignupMethod,
          },
        })
        : null;
    })();
  const effectivePanelMode = capabilityState?.effectivePanelMode || capabilityState?.panelMode || rawPanelMode;
  const effectivePlusModeEnabled = capabilityState
    ? Boolean(capabilityState.runtimeLocks?.plusModeEnabled)
    : rawPlusModeEnabled;
  const effectiveAuthVerificationEnabled = capabilityState
    ? Boolean(capabilityState.runtimeLocks?.authVerificationEnabled)
    : rawAuthVerificationEnabled;
  const effectiveSignupMethod = capabilityState?.effectiveSignupMethod || selectedSignupMethod;
  const effectivePlusAccountAccessStrategy = capabilityState?.effectivePlusAccountAccessStrategy
    || rawPlusAccountAccessStrategy;
  const plusPaymentMethod = getSelectedPlusPaymentMethod();
  const normalizeUpiInfoHelperPhoneModeSafe = typeof normalizeUpiInfoHelperPhoneModeValue === 'function'
    ? normalizeUpiInfoHelperPhoneModeValue
    : ((value = '') => String(value || '').trim().toLowerCase() === 'auto' || String(value || '').trim().toLowerCase() === 'builtin' ? 'auto' : 'manual');
  const selectedUpiInfoPhoneMode = normalizeUpiInfoHelperPhoneModeSafe(
    typeof selectUpiInfoHelperPhoneMode !== 'undefined' && selectUpiInfoHelperPhoneMode
      ? selectUpiInfoHelperPhoneMode.value
      : (latestState?.legacyPayHelperPhoneMode || 'manual')
  );
  const effectiveUpiInfoPhoneMode = selectedUpiInfoPhoneMode;
  const selectedUpiInfoOtpChannel = normalizeUpiInfoOtpChannelSafe(
    typeof selectUpiInfoHelperOtpChannel !== 'undefined' && selectUpiInfoHelperOtpChannel
      ? selectUpiInfoHelperOtpChannel.value
      : (latestState?.legacyPayHelperOtpChannel || 'whatsapp')
  );
  const selectedUpiInfoLocalSmsHelperEnabled = effectiveUpiInfoPhoneMode === 'auto' ? false : Boolean(
    typeof inputUpiInfoHelperLocalSmsEnabled !== 'undefined' && inputUpiInfoHelperLocalSmsEnabled
      ? inputUpiInfoHelperLocalSmsEnabled.checked
      : latestState?.legacyPayHelperLocalSmsHelperEnabled
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
    legacyPayPhone: window.LegacyPayUtils?.normalizeLegacyPayPhone
      ? window.LegacyPayUtils.normalizeLegacyPayPhone(typeof inputLegacyPayPhone !== 'undefined' && inputLegacyPayPhone ? inputLegacyPayPhone.value : latestState?.legacyPayPhone)
      : (typeof inputLegacyPayPhone !== 'undefined' && inputLegacyPayPhone
        ? String(inputLegacyPayPhone.value || '').trim()
        : String(latestState?.legacyPayPhone || '').trim()),
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
    legacyPayHelperPhoneMode: effectiveUpiInfoPhoneMode,
    legacyPayHelperCountryCode: window.LegacyPayUtils?.normalizeLegacyPayCountryCode
      ? window.LegacyPayUtils.normalizeLegacyPayCountryCode(typeof selectUpiInfoHelperCountryCode !== 'undefined' && selectUpiInfoHelperCountryCode ? selectUpiInfoHelperCountryCode.value : latestState?.legacyPayHelperCountryCode)
      : (typeof selectUpiInfoHelperCountryCode !== 'undefined' && selectUpiInfoHelperCountryCode
        ? String(selectUpiInfoHelperCountryCode.value || '+86').trim()
        : String(latestState?.legacyPayHelperCountryCode || '+86').trim()),
    legacyPayHelperPhoneNumber: window.LegacyPayUtils?.normalizeLegacyPayPhone
      ? window.LegacyPayUtils.normalizeLegacyPayPhone(typeof inputUpiInfoHelperPhone !== 'undefined' && inputUpiInfoHelperPhone ? inputUpiInfoHelperPhone.value : latestState?.legacyPayHelperPhoneNumber)
      : (typeof inputUpiInfoHelperPhone !== 'undefined' && inputUpiInfoHelperPhone
        ? String(inputUpiInfoHelperPhone.value || '').trim()
        : String(latestState?.legacyPayHelperPhoneNumber || '').trim()),
    legacyPayHelperPin: window.LegacyPayUtils?.normalizeLegacyPayPin
      ? window.LegacyPayUtils.normalizeLegacyPayPin(typeof inputUpiInfoHelperPin !== 'undefined' && inputUpiInfoHelperPin ? inputUpiInfoHelperPin.value : latestState?.legacyPayHelperPin)
      : (typeof inputUpiInfoHelperPin !== 'undefined' && inputUpiInfoHelperPin
        ? String(inputUpiInfoHelperPin.value || '')
        : String(latestState?.legacyPayHelperPin || '')),
    legacyPayHelperOtpChannel: selectedUpiInfoOtpChannel,
    legacyPayHelperLocalSmsHelperEnabled: selectedUpiInfoLocalSmsHelperEnabled,
    legacyPayHelperLocalSmsHelperUrl: normalizeUpiInfoLocalSmsHelperBaseUrlSafe(
      typeof inputUpiInfoHelperLocalSmsUrl !== 'undefined' && inputUpiInfoHelperLocalSmsUrl
        ? inputUpiInfoHelperLocalSmsUrl.value
        : (latestState?.legacyPayHelperLocalSmsHelperUrl || '')
    ),
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
    authVerificationEnabled: effectiveAuthVerificationEnabled,
    signupMethod: effectiveSignupMethod,
    verificationResendCount: normalizeVerificationResendCount(
      inputVerificationResendCount?.value,
      DEFAULT_VERIFICATION_RESEND_COUNT
    ),
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

let flowCapabilityRegistry = null;

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

function updateAuthVerificationSettingsUI() {
  updateSignupMethodUI();
  [
    typeof rowAuthVerificationEnabled !== 'undefined' ? rowAuthVerificationEnabled : null,
    typeof rowAuthVerificationFold !== 'undefined' ? rowAuthVerificationFold : null,
    typeof rowSignupMethod !== 'undefined' ? rowSignupMethod : null,
  ].forEach((row) => {
    if (row) row.style.display = 'none';
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
  const upiInfoPhoneMode = normalizeUpiInfoHelperPhoneModeValue(
    typeof selectUpiInfoHelperPhoneMode !== 'undefined' && selectUpiInfoHelperPhoneMode
      ? selectUpiInfoHelperPhoneMode.value
      : (latestState?.legacyPayHelperPhoneMode || 'manual')
  );
  const upiInfoAutoModeDenied = isUpiInfoAutoModePermissionDenied(latestState);
  const isUpiInfoAutoMode = upiInfoPhoneMode === UPI_INFO_HELPER_PHONE_MODE_AUTO;
  const upiInfoAutoModeBlocked = isUpiInfoAutoMode && upiInfoAutoModeDenied;
  const upiInfoOtpChannel = normalizeUpiInfoOtpChannelValue(
    typeof selectUpiInfoHelperOtpChannel !== 'undefined' && selectUpiInfoHelperOtpChannel
      ? selectUpiInfoHelperOtpChannel.value
      : (latestState?.legacyPayHelperOtpChannel || 'whatsapp')
  );
  const localSmsEnabled = Boolean(
    typeof inputUpiInfoHelperLocalSmsEnabled !== 'undefined' && inputUpiInfoHelperLocalSmsEnabled
      ? inputUpiInfoHelperLocalSmsEnabled.checked
      : latestState?.legacyPayHelperLocalSmsHelperEnabled
  );
  const selectedMethod = method;
  const upiInfoRowsVisible = enabled && selectedMethod === upiInfoValue;
  const upiRowsVisible = enabled && selectedMethod === upiValue;
  const canShowUpiInfoModeSelector = upiInfoRowsVisible;
  const localSmsControlsVisible = upiInfoRowsVisible && !isUpiInfoAutoMode;
  const effectiveLocalSmsEnabled = !isUpiInfoAutoMode && localSmsEnabled;
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
      ? `UPI_INFO ${isUpiInfoAutoMode ? '自动' : '手动'}订阅链路`
      : selectedMethod === upiValue
      ? 'UPI 资格检测与手动 CDK 兑换链路'
      : selectedMethod === legacyPayValue
      ? 'LegacyPay 印尼订阅链路'
      : 'LegacyWallet 订阅链路';
  }
  if (upiInfoAutoModeBlocked && typeof plusPaymentMethodCaption !== 'undefined' && plusPaymentMethodCaption) {
    plusPaymentMethodCaption.textContent = 'UPI_INFO 自动订阅链路（需手动切换）';
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
  if (typeof rowUpiInfoHelperPhoneMode !== 'undefined' && rowUpiInfoHelperPhoneMode) {
    rowUpiInfoHelperPhoneMode.style.display = canShowUpiInfoModeSelector ? '' : 'none';
  }
  if (typeof selectUpiInfoHelperPhoneMode !== 'undefined' && selectUpiInfoHelperPhoneMode) {
    selectUpiInfoHelperPhoneMode.value = upiInfoPhoneMode;
  }
  [
    typeof rowUpiInfoHelperCountryCode !== 'undefined' ? rowUpiInfoHelperCountryCode : null,
    typeof rowUpiInfoHelperPhone !== 'undefined' ? rowUpiInfoHelperPhone : null,
    typeof rowUpiInfoHelperOtpChannel !== 'undefined' ? rowUpiInfoHelperOtpChannel : null,
    typeof rowUpiInfoHelperPin !== 'undefined' ? rowUpiInfoHelperPin : null,
  ].forEach((row) => {
    if (!row) {
      return;
    }
    row.style.display = upiInfoRowsVisible && !isUpiInfoAutoMode ? '' : 'none';
  });
  if (typeof selectUpiInfoHelperOtpChannel !== 'undefined' && selectUpiInfoHelperOtpChannel) {
    selectUpiInfoHelperOtpChannel.value = upiInfoOtpChannel;
  }
  if (typeof inputUpiInfoHelperLocalSmsEnabled !== 'undefined' && inputUpiInfoHelperLocalSmsEnabled) {
    inputUpiInfoHelperLocalSmsEnabled.checked = effectiveLocalSmsEnabled;
  }
  if (typeof rowUpiInfoHelperLocalSmsEnabled !== 'undefined' && rowUpiInfoHelperLocalSmsEnabled) {
    rowUpiInfoHelperLocalSmsEnabled.style.display = localSmsControlsVisible ? '' : 'none';
  }
  if (typeof rowUpiInfoHelperLocalSmsUrl !== 'undefined' && rowUpiInfoHelperLocalSmsUrl) {
    rowUpiInfoHelperLocalSmsUrl.style.display = localSmsControlsVisible && effectiveLocalSmsEnabled ? '' : 'none';
  }
  if (typeof btnUpiInfoCardKeyPurchase !== 'undefined' && btnUpiInfoCardKeyPurchase) {
    btnUpiInfoCardKeyPurchase.style.display = upiInfoRowsVisible ? '' : 'none';
  }
  [
    typeof rowLegacyPayCountryCode !== 'undefined' ? rowLegacyPayCountryCode : null,
    typeof rowLegacyPayPhone !== 'undefined' ? rowLegacyPayPhone : null,
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

function getSelectedUpiInfoHelperPhoneMode() {
  return normalizeUpiInfoHelperPhoneModeValue(
    typeof selectUpiInfoHelperPhoneMode !== 'undefined' && selectUpiInfoHelperPhoneMode
      ? selectUpiInfoHelperPhoneMode.value
      : (latestState?.legacyPayHelperPhoneMode || UPI_INFO_HELPER_PHONE_MODE_MANUAL)
  );
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
  const selectedMode = getSelectedUpiInfoHelperPhoneMode();
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

  if (selectedMode === UPI_INFO_HELPER_PHONE_MODE_AUTO && isUpiInfoAutoModePermissionDenied(balanceState)) {
    await showUpiInfoStartBlockedDialog('当前 UPI_INFO API Key 未开通自动模式，已保留你的当前选择。如需继续，请由你手动切换到手动模式后再开启任务。');
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

function markSettingsDirty(isDirty = true) {
  settingsDirty = isDirty;
  if (isDirty) {
    settingsSaveRevision += 1;
  }
  updateSaveButtonState();
}

function updateSaveButtonState() {
  btnSaveSettings.disabled = settingsSaveInFlight || !settingsDirty;
  updateConfigMenuControls();
  btnSaveSettings.textContent = settingsSaveInFlight ? '保存中' : '保存';
}

function scheduleSettingsAutoSave() {
  clearTimeout(settingsAutoSaveTimer);
  settingsAutoSaveTimer = setTimeout(() => {
    saveSettings({ silent: true }).catch(() => { });
  }, 500);
}

function shouldUseSettingsCardAutosave(target) {
  if (!target || typeof target.matches !== 'function') {
    return false;
  }
  if (!target.matches('input, select, textarea')) {
    return false;
  }
  const type = String(target.type || '').trim().toLowerCase();
  if (['button', 'submit', 'reset', 'file', 'hidden'].includes(type)) {
    return false;
  }
  return ![
    'input-custom-email-pool-search',
    'select-custom-email-pool-filter',
    'checkbox-custom-email-pool-select-all',
    'input-upi-redeem-cdkey-pool',
    'input-ideal-redeem-cdkey-pool',
  ].includes(String(target.id || '').trim());
}

function queueSettingsCardAutosaveFromEvent(event) {
  const target = event?.target;
  if (!shouldUseSettingsCardAutosave(target)) {
    return;
  }
  markSettingsDirty(true);
  scheduleSettingsAutoSave();
}

function flushDirtySettingsBeforePanelUnload() {
  clearTimeout(settingsAutoSaveTimer);
  if (!settingsDirty || settingsSaveInFlight) {
    return;
  }
  saveSettings({ silent: true }).catch(() => { });
}

async function sendRuntimeMessageWithTimeout(message, timeoutMs = 20000, timeoutLabel = '请求') {
  const effectiveTimeoutMs = Math.max(1000, Number(timeoutMs) || 20000);
  let timer = null;
  try {
    return await Promise.race([
      chrome.runtime.sendMessage(message),
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`${timeoutLabel}超时（>${Math.round(effectiveTimeoutMs / 1000)} 秒）`));
        }, effectiveTimeoutMs);
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

async function saveSettings(options = {}) {
  const { silent = false, force = false } = options;
  clearTimeout(settingsAutoSaveTimer);

  if (!force && !settingsDirty && !settingsSaveInFlight && silent) {
    return;
  }

  const payload = collectSettingsPayload();
  const saveRevision = settingsSaveRevision;
  settingsSaveInFlight = true;
  updateSaveButtonState();

  try {
    const response = await sendRuntimeMessageWithTimeout({
      type: 'SAVE_SETTING',
      source: 'sidepanel',
      payload,
    }, 15000, '保存配置');

    if (response?.error) {
      throw new Error(response.error);
    }

    if (saveRevision !== settingsSaveRevision) {
      return;
    }

    if (response?.state) {
      applySettingsState(preserveHotmailAccountsForSettingsSaveResponse(response.state, payload));
    } else {
      syncLatestState(payload);
      markSettingsDirty(false);
      updatePanelModeUI();
      updateMailProviderUI();
      updateButtonStates();
    }
    if (!silent) {
      showToast('配置已保存', 'success', 1800);
    }
  } catch (err) {
    markSettingsDirty(true);
    if (!silent) {
      showToast(`保存失败：${err.message}`, 'error');
    }
    throw err;
  } finally {
    settingsSaveInFlight = false;
    updateSaveButtonState();
  }
}

function buildCustomEmailPoolSettingsPayload(extraPayload = {}) {
  const entries = typeof getNormalizedCustomEmailPoolEntriesState === 'function'
    ? getNormalizedCustomEmailPoolEntriesState()
    : [];
  const activeEmails = typeof getActiveCustomEmailPoolEmails === 'function'
    ? getActiveCustomEmailPoolEmails(entries)
    : [];
  const payload = {
    customEmailPoolEntries: entries,
    customEmailPool: activeEmails,
    selectedCustomEmailPoolEmail: String(
      extraPayload.selectedCustomEmailPoolEmail ?? latestState?.selectedCustomEmailPoolEmail ?? ''
    ).trim().toLowerCase(),
  };
  if (Object.prototype.hasOwnProperty.call(extraPayload, 'email')) {
    payload.email = String(extraPayload.email || '').trim().toLowerCase();
  }
  return payload;
}

async function persistCustomEmailPoolSettings(extraPayload = {}) {
  const payload = buildCustomEmailPoolSettingsPayload(extraPayload);
  const response = await sendRuntimeMessageWithTimeout({
    type: 'SAVE_SETTING',
    source: 'sidepanel',
    payload,
  }, 15000, '保存自定义邮箱池');

  if (response?.error) {
    throw new Error(response.error);
  }

  syncLatestState({
    customEmailPoolEntries: response?.state?.customEmailPoolEntries ?? payload.customEmailPoolEntries,
    customEmailPool: response?.state?.customEmailPool ?? payload.customEmailPool,
    selectedCustomEmailPoolEmail: response?.state?.selectedCustomEmailPoolEmail ?? payload.selectedCustomEmailPoolEmail,
    ...(Object.prototype.hasOwnProperty.call(payload, 'email')
      ? { email: response?.state?.email ?? payload.email }
      : {}),
  });
  return response;
}

async function persistCustomPasswordInput(options = {}) {
  const { silent = true } = options;
  const customPassword = inputPassword.value;
  const saveRevision = customPasswordSaveRevision + 1;
  customPasswordSaveRevision = saveRevision;
  syncLatestState({ customPassword });

  try {
    const response = await sendRuntimeMessageWithTimeout({
      type: 'SAVE_SETTING',
      source: 'sidepanel',
      payload: { customPassword },
    }, 8000, '保存账户密码');

    if (response?.error) {
      throw new Error(response.error);
    }
    if (saveRevision === customPasswordSaveRevision) {
      syncLatestState({ customPassword });
    }
  } catch (err) {
    markSettingsDirty(true);
    if (!silent) {
      showToast(`账户密码保存失败：${err.message}`, 'error');
    } else {
      console.warn('账户密码保存失败：', err);
    }
  }
}

async function persistCurrentSettingsForAction() {
  clearTimeout(settingsAutoSaveTimer);
  await waitForSettingsSaveIdle();
  await saveSettings({ silent: true, force: true });
}

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

inputVpsUrl.addEventListener('input', () => {
  markSettingsDirty(true);
  scheduleSettingsAutoSave();
});
inputVpsUrl.addEventListener('blur', () => {
  saveSettings({ silent: true }).catch(() => { });
});

inputVpsPassword.addEventListener('input', () => {
  markSettingsDirty(true);
  scheduleSettingsAutoSave();
});
inputVpsPassword.addEventListener('blur', () => {
  saveSettings({ silent: true }).catch(() => { });
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

inputPassword.addEventListener('input', () => {
  syncLatestState({ customPassword: inputPassword.value });
  markSettingsDirty(true);
  updateButtonStates();
  persistCustomPasswordInput({ silent: true }).catch(() => { });
  scheduleSettingsAutoSave();
});
inputPassword.addEventListener('blur', () => {
  persistCustomPasswordInput({ silent: true }).catch(() => { });
  saveSettings({ silent: true }).catch(() => { });
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
        legacyPayHelperCountryCode: selectUpiInfoHelperCountryCode?.value || '+86',
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
    const selectedModeBeforeBalanceState = getSelectedUpiInfoHelperPhoneMode();
    syncLatestState(nextState);
    if (nextAutoModeDenied && selectedModeBeforeBalanceState === UPI_INFO_HELPER_PHONE_MODE_AUTO) {
      showToast('当前 API Key 未开通自动模式，已保留当前选择；如需继续请手动切换到手动模式。', 'warn');
    } else if (nextAutoModeDenied) {
      showToast('UPI_INFO 余额已更新，当前 API Key 只能使用手动模式。', 'success');
    } else if (nextAutoModeConfirmed) {
      showToast('UPI_INFO 余额已更新，自动模式可用。', 'success');
    } else {
      showToast('UPI_INFO 余额已更新，当前接口未返回自动模式权限，已保留所选模式。', 'success');
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
  selectUpiInfoHelperPhoneMode,
  selectUpiInfoHelperCountryCode,
  inputUpiInfoHelperPhone,
  selectUpiInfoHelperOtpChannel,
  inputUpiInfoHelperLocalSmsEnabled,
  inputUpiInfoHelperLocalSmsUrl,
  inputUpiInfoHelperPin,
  inputUpiSubscriptionApiBaseUrl,
  inputUpiRedeemExternalApiKey,
  inputUpiRedeemClientId,
  inputUpiRedeemFailedAccountRetryLimit,
  inputTotpMfaAfterProfileEnabled,
  inputSetGptPasswordVerificationWaitSeconds,
  inputUpiCredentialMembershipTotpApiBaseUrl,
  inputUpiCredentialMembershipTotpLookupKey,
  selectUpiRedeemAfterMode,
  inputUpiRedeemStopAfterRedeem,
  selectLegacyPayCountryCode,
  inputLegacyPayPhone,
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
    if (input === selectUpiInfoHelperPhoneMode || input === selectUpiInfoHelperOtpChannel || input === inputUpiInfoHelperLocalSmsEnabled) {
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
    updateAuthVerificationSettingsUI();
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

inputEmailPrefix.addEventListener('input', () => {
  maybeClearGeneratedAliasAfterEmailPrefixChange().catch(() => { });
  syncManagedAliasBaseEmailDraftFromInput();
  markSettingsDirty(true);
  scheduleSettingsAutoSave();
});
inputEmailPrefix.addEventListener('blur', () => {
  maybeClearGeneratedAliasAfterEmailPrefixChange().catch(() => { });
  syncManagedAliasBaseEmailDraftFromInput();
  saveSettings({ silent: true }).catch(() => { });
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

inputInbucketMailbox.addEventListener('input', () => {
  markSettingsDirty(true);
  scheduleSettingsAutoSave();
});
inputInbucketMailbox.addEventListener('blur', () => {
  saveSettings({ silent: true }).catch(() => { });
});

inputInbucketHost.addEventListener('input', () => {
  markSettingsDirty(true);
  scheduleSettingsAutoSave();
});
inputInbucketHost.addEventListener('blur', () => {
  saveSettings({ silent: true }).catch(() => { });
});

inputRunCount.addEventListener('input', () => {
  clearPendingAutoRunStartRunCount();
  updateFallbackThreadIntervalInputState();
});
inputRunCount.addEventListener('blur', () => {
  inputRunCount.value = String(getRunCountValue());
  updateFallbackThreadIntervalInputState();
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



inputAuthVerificationEnabled?.addEventListener('change', () => {
  setSignupMethod(SIGNUP_METHOD_EMAIL);
  updateAuthVerificationSettingsUI();
  markSettingsDirty(true);
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

inputAutoStepDelaySeconds.addEventListener('input', () => {
  markSettingsDirty(true);
  scheduleSettingsAutoSave();
});
inputAutoStepDelaySeconds.addEventListener('blur', () => {
  syncAutoStepDelayInputs();
  saveSettings({ silent: true }).catch(() => { });
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

inputVerificationResendCount?.addEventListener('input', () => {
  markSettingsDirty(true);
  scheduleSettingsAutoSave();
});
inputVerificationResendCount?.addEventListener('blur', () => {
  inputVerificationResendCount.value = String(
    normalizeVerificationResendCount(
      inputVerificationResendCount.value,
      DEFAULT_VERIFICATION_RESEND_COUNT
    )
  );
  saveSettings({ silent: true }).catch(() => { });
});

// ============================================================
// Listen for Background broadcasts// ============================================================
// Listen for Background broadcasts
// ============================================================

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.type) {
    case 'REQUEST_CUSTOM_VERIFICATION_BYPASS_CONFIRMATION': {
      (async () => {
        const step = Number(message.payload?.step);
        const result = await openCustomVerificationConfirmDialog(step);
        sendResponse(result || { confirmed: false, addPhoneDetected: false });
      })().catch((err) => {
        sendResponse({ error: err.message });
      });
      return true;
    }

    case 'REQUEST_LEGACY_PAY_OTP_INPUT': {
      (async () => {
        const result = await openLegacyPayOtpInputDialog(message.payload || {});
        sendResponse(result || { cancelled: true, code: '' });
      })().catch((err) => {
        sendResponse({ error: err.message });
      });
      return true;
    }

    case 'SECURITY_BLOCKED_ALERT': {
      openConfirmModal({
        title: message.payload?.title || '流程已完全停止',
        message: message.payload?.message || '检测到安全风控，当前流程已完全停止。',
        alert: message.payload?.alert || { text: '检测到 Cloudflare 风控，请暂停当前操作。', tone: 'danger' },
        confirmLabel: '我知道了',
        confirmVariant: 'btn-danger',
      }).catch(() => { });
      break;
    }

    case 'LOG_ENTRY':
      appendLog(message.payload);
      if (message.payload.level === 'error') {
        showToast(message.payload.message, 'error');
        if (isLocalHelperStartupErrorMessage(message.payload.message)) {
          showLocalHelperStartupAlert(message.payload.message);
        }
        scheduleAccountRunHistoryRefresh();
      }
      break;

    case 'NODE_STATUS_CHANGED': {
      const { nodeId, status } = message.payload;
      updateNodeUI(nodeId, status);
      chrome.runtime.sendMessage({ type: 'GET_STATE', source: 'sidepanel' }).then(state => {
        syncLatestState(state);
        syncAutoRunState(state);
        updateStatusDisplay(latestState);
        updateButtonStates();
        if (status === 'completed' || status === 'manual_completed' || status === 'skipped') {
          syncPasswordField(state);
          if (state.oauthUrl) {
            displayOauthUrl.textContent = state.oauthUrl;
            displayOauthUrl.classList.add('has-value');
          }
          setOauthLoginCodeDisplay(state.lastLoginCode || '');
          if (state.localhostUrl) {
            displayLocalhostUrl.textContent = state.localhostUrl;
            displayLocalhostUrl.classList.add('has-value');
          }
        }
      }
      ).catch(() => { });
      break;
    }

    case 'AUTO_RUN_RESET': {
      // Full UI reset for next run
      syncLatestState({
        oauthUrl: null,
        lastLoginCode: null,
        localhostUrl: null,
        email: null,
        password: null,
        removedPaymentWorkerJobId: '',
        removedPaymentWorkerJobStatus: '',
        removedPaymentWorkerCurrentAttempt: 0,
        removedPaymentWorkerPauseRequested: false,
        removedPaymentWorkerLastLogIndex: 0,
        nodeStatuses: NODE_DEFAULT_STATUSES,
        logs: [],
        scheduledAutoRunAt: null,
        autoRunCountdownAt: null,
        autoRunCountdownTitle: '',
        autoRunCountdownNote: '',
      });
      displayOauthUrl.textContent = '等待中...';
      displayOauthUrl.classList.remove('has-value');
      setOauthLoginCodeDisplay('');
      displayLocalhostUrl.textContent = '等待中...';
      displayLocalhostUrl.classList.remove('has-value');
      inputEmail.value = '';
      displayStatus.textContent = '就绪';
      statusBar.className = 'status-bar';
      logArea.innerHTML = '';
      resetIcloudManager();
      resetLuckmailManager();
      resetCustomEmailPoolManager();
      document.querySelectorAll('.step-row').forEach(row => row.className = 'step-row');
      document.querySelectorAll('.step-status').forEach(el => el.textContent = '');
      syncAutoRunState({
        autoRunning: false,
        autoRunPhase: 'idle',
        autoRunCurrentRun: 0,
        autoRunTotalRuns: 1,
        autoRunAttemptRun: 0,
        scheduledAutoRunAt: null,
        autoRunCountdownAt: null,
        autoRunCountdownTitle: '',
        autoRunCountdownNote: '',
      });
      applyAutoRunStatus(currentAutoRun);
      updateProgressCounter();
      updateButtonStates();
      renderLegacyWalletAccounts();
      renderHotmailAccounts();
      renderMail2925Accounts();
      updateRemovedPaymentWorkerUi(latestState);
      if (isLuckmailProvider()) {
        queueLuckmailPurchaseRefresh();
      }
      break;
    }

    case 'DATA_UPDATED': {
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
        if (message.payload.upiAccountCredentialBackups !== undefined) {
          accountRecordsManager?.reloadUpiCredentialMembershipAfterRuntimeImport?.({ silent: true }).catch(() => null);
        }
      }
      if (message.payload.operationDelayEnabled !== undefined && typeof applyOperationDelayState === 'function') {
        applyOperationDelayState(message.payload);
      }
      if (message.payload.email !== undefined) {
        inputEmail.value = message.payload.email || '';
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
      if (message.payload.legacyPayHelperPhoneMode !== undefined && selectUpiInfoHelperPhoneMode) {
        selectUpiInfoHelperPhoneMode.value = normalizeUpiInfoHelperPhoneModeValue(message.payload.legacyPayHelperPhoneMode);
      }
      if (message.payload.legacyPayHelperOtpChannel !== undefined && selectUpiInfoHelperOtpChannel) {
        selectUpiInfoHelperOtpChannel.value = normalizeUpiInfoOtpChannelValue(message.payload.legacyPayHelperOtpChannel);
      }
      if (message.payload.legacyPayHelperLocalSmsHelperEnabled !== undefined && inputUpiInfoHelperLocalSmsEnabled) {
        inputUpiInfoHelperLocalSmsEnabled.checked = Boolean(message.payload.legacyPayHelperLocalSmsHelperEnabled);
      }
      if (message.payload.legacyPayHelperLocalSmsHelperUrl !== undefined && inputUpiInfoHelperLocalSmsUrl) {
        inputUpiInfoHelperLocalSmsUrl.value = normalizeUpiInfoLocalSmsHelperBaseUrlValue(message.payload.legacyPayHelperLocalSmsHelperUrl);
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
        || message.payload.pixRedeemStopAfterRedeem !== undefined
        || message.payload.pixRedeemContinueAfterRedeem !== undefined
        || message.payload.legacyPayHelperPhoneMode !== undefined
        || message.payload.legacyPayHelperAutoModeEnabled !== undefined
        || message.payload.legacyPayHelperOtpChannel !== undefined
        || message.payload.legacyPayHelperLocalSmsHelperEnabled !== undefined
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
      if (message.payload.customEmailPoolEntries !== undefined || message.payload.customEmailPool !== undefined) {
        setCustomEmailPoolEntriesState(restoreCustomEmailPoolEntriesFromState({
          ...latestState,
          ...message.payload,
        }));
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
      if (
        (
          message.payload.verificationResendCount !== undefined
          || message.payload.signupVerificationResendCount !== undefined
          || message.payload.loginVerificationResendCount !== undefined
        )
        && inputVerificationResendCount
      ) {
        const nextVerificationResendCount = message.payload.verificationResendCount !== undefined
          ? message.payload.verificationResendCount
          : (message.payload.signupVerificationResendCount ?? message.payload.loginVerificationResendCount);
        inputVerificationResendCount.value = String(
          normalizeVerificationResendCount(
            nextVerificationResendCount,
            DEFAULT_VERIFICATION_RESEND_COUNT
          )
        );
      }
      if (message.payload.authVerificationEnabled !== undefined && inputAuthVerificationEnabled) {
        inputAuthVerificationEnabled.checked = Boolean(message.payload.authVerificationEnabled);
      }
      if (message.payload.signupMethod !== undefined) {
        setSignupMethod(message.payload.signupMethod);
      }
      if (message.payload.authVerificationEnabled !== undefined || message.payload.signupMethod !== undefined) {
        updateAuthVerificationSettingsUI();
      }
      updateAccountRunHistorySettingsUI();
      renderContributionMode();
      void syncPlusManualConfirmationDialog();
      break;
    }

    case 'ICLOUD_LOGIN_REQUIRED': {
      const loginMessage = '需要登录 iCloud，我已经为你打开登录页。';
      showToast(loginMessage, 'warn', 5000);
      if (icloudSummary) {
        icloudSummary.textContent = loginMessage;
      }
      showIcloudLoginHelp(message.payload || {});
      break;
    }

    case 'ICLOUD_ALIASES_CHANGED': {
      queueIcloudAliasRefresh();
      break;
    }

    case 'AUTO_RUN_STATUS': {
      syncLatestState({
        autoRunning: ['scheduled', 'running', 'waiting_step', 'waiting_email', 'retrying', 'waiting_interval'].includes(message.payload.phase),
        autoRunPhase: message.payload.phase,
        autoRunCurrentRun: message.payload.currentRun,
        autoRunTotalRuns: message.payload.totalRuns,
        autoRunAttemptRun: message.payload.attemptRun,
        scheduledAutoRunAt: message.payload.scheduledAt ?? null,
        autoRunCountdownAt: message.payload.countdownAt ?? null,
        autoRunCountdownTitle: message.payload.countdownTitle ?? '',
        autoRunCountdownNote: message.payload.countdownNote ?? '',
      });
      applyAutoRunStatus(message.payload);
      updateStatusDisplay(latestState);
      updateButtonStates();
      if (!['scheduled', 'running', 'waiting_step', 'waiting_email', 'retrying', 'waiting_interval'].includes(message.payload.phase)) {
        scheduleAccountRunHistoryRefresh();
      }
      break;
    }
  }
});

document.addEventListener('click', (event) => {
  const clickedInsideConfigMenu = Boolean(configMenuShell?.contains(event.target));
  const clickedInsideEditableListPicker = isClickInsideEditableListPicker(event.target);

  if (configMenuOpen && !clickedInsideConfigMenu) {
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
  if (configMenuOpen) {
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

initializeManualStepActions();
bindPasswordVisibilityToggles();
initHotmailListExpandedState();
initMail2925ListExpandedState();
if (typeof initAuthVerificationSectionExpandedState === 'function') {
  initAuthVerificationSectionExpandedState();
}
updateSaveButtonState();
updateConfigMenuControls();
setLocalCpaStep9Mode(DEFAULT_LOCAL_CPA_STEP9_MODE);
setMail2925Mode(DEFAULT_MAIL_2925_MODE);
setCloudflareTempEmailLookupMode(DEFAULT_CLOUDFLARE_TEMP_EMAIL_LOOKUP_MODE);
updatePanelModeUI();
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
