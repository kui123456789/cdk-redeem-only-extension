#!/usr/bin/env node
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const failures = [];
const warnings = [];
const trackedSourcePatterns = ['*.js', '*.mjs', '*.html', '*.css'];
const trackedSourceWarningLineLimit = 8000;
const ignoredTrackedSourceTopLevelDirs = new Set([
  '.git',
  '.codegraph',
  '.codex-backups',
  '_metadata',
  'release-artifacts',
]);

function fail(message) {
  failures.push(message);
}

function warn(message) {
  warnings.push(message);
}

function readText(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    fail(`missing file: ${relativePath}`);
    return '';
  }
  return fs.readFileSync(absolutePath, 'utf8');
}

function readJson(relativePath) {
  const text = readText(relativePath);
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    fail(`${relativePath} is not valid JSON: ${error.message}`);
    return null;
  }
}

function assertIncludes(text, needle, label) {
  if (!text.includes(needle)) {
    fail(`${label} does not include expected text: ${needle}`);
  }
}

function assertMatch(text, pattern, label) {
  if (!pattern.test(text)) {
    fail(`${label} does not match ${pattern}`);
  }
}

function assertNotMatch(text, pattern, label) {
  if (pattern.test(text)) {
    fail(`${label} unexpectedly matches ${pattern}`);
  }
}

function assertBefore(text, firstNeedle, secondNeedle, label) {
  const firstIndex = text.indexOf(firstNeedle);
  const secondIndex = text.indexOf(secondNeedle);
  if (firstIndex === -1) {
    fail(`${label} missing first text: ${firstNeedle}`);
    return;
  }
  if (secondIndex === -1) {
    fail(`${label} missing second text: ${secondNeedle}`);
    return;
  }
  if (firstIndex >= secondIndex) {
    fail(`${label} expected ${firstNeedle} before ${secondNeedle}`);
  }
}

function assertFileLineCountAtMost(relativePath, maxLines, label) {
  const text = readText(relativePath);
  if (!text) return;
  const lines = countLines(text);
  if (lines > maxLines) {
    fail(`${label}: ${relativePath} has ${lines} lines, expected <= ${maxLines}`);
  }
}

function countLines(text) {
  if (text.length === 0) return 0;
  const newlineCount = text.match(/\n/g)?.length || 0;
  return newlineCount + (text.endsWith('\n') ? 0 : 1);
}

function gitLines(args) {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8' })
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  } catch (error) {
    fail(`git ${args.join(' ')} failed: ${error.message}`);
    return [];
  }
}

function isTrackedSourceFile(relativePath) {
  const [topLevel] = relativePath.split(/[\\/]/);
  return !ignoredTrackedSourceTopLevelDirs.has(topLevel);
}

function checkManifest() {
  const manifest = readJson('manifest.json');
  if (!manifest) return;
  if (manifest.manifest_version !== 3) {
    fail('manifest.json must remain MV3.');
  }
  if (manifest.background?.service_worker !== 'background.js') {
    fail('manifest background.service_worker must be background.js.');
  }
  if (manifest.side_panel?.default_path !== 'sidepanel/sidepanel.html') {
    fail('manifest side_panel.default_path must be sidepanel/sidepanel.html.');
  }
  for (const permission of ['sidePanel', 'storage', 'tabs', 'scripting', 'downloads']) {
    if (!manifest.permissions?.includes(permission)) {
      fail(`manifest is missing permission: ${permission}`);
    }
  }

  const authContentScript = manifest.content_scripts?.find((script) => (
    Array.isArray(script?.matches)
    && script.matches.some((pattern) => /auth(?:0)?\.openai\.com|accounts\.openai\.com/i.test(pattern))
  ));
  if (!authContentScript) {
    fail('manifest is missing OpenAI auth content script entry.');
    return;
  }

  const expectedSignupOrder = [
    'content/auth-page-detectors.js',
    'content/signup-dom-utils.js',
    'content/signup-entry-page.js',
    'content/signup-verification-page.js',
    'content/signup-password-page.js',
    'content/signup-profile-page.js',
    'content/signup-session-page.js',
    'content/signup-page-detector.js',
    'content/signup-page-orchestrator.js',
    'content/signup-page.js',
  ];
  let previousIndex = -1;
  for (const file of expectedSignupOrder) {
    const index = authContentScript.js?.indexOf(file) ?? -1;
    if (index === -1) {
      fail(`manifest OpenAI auth content script is missing ${file}`);
      continue;
    }
    if (index <= previousIndex) {
      fail(`manifest OpenAI auth content script has ${file} out of signup helper order`);
    }
    previousIndex = index;
  }
}

function checkCoreFiles() {
  [
    'background.js',
    'background/message-router.js',
    'background/settings-normalizers.js',
    'background/flow-definition-resolver.js',
    'background/bootstrap/flow-runtime.js',
    'background/bootstrap/settings-defaults.js',
    'background/bootstrap/state-store.js',
    'background/bootstrap/settings-transfer.js',
    'background/bootstrap/legacy-cleanup.js',
    'background/bootstrap/auto-run-session.js',
    'background/bootstrap/auto-run-timer-plan.js',
    'background/bootstrap/auto-run-status.js',
    'background/bootstrap/state-patch-helpers.js',
    'background/bootstrap/content-script-registry.js',
    'background/bootstrap/runtime-listeners.js',
    'background/bootstrap/signup-executor-registry.js',
    'background/email/provider-registry.js',
    'background/membership/access-token-refresh.js',
    'background/membership/login-session-executor.js',
    'background/membership/redeem-status-sync.js',
    'background/membership/result-state.js',
    'background/routes/membership-routes.js',
    'background/routes/cdkey-routes.js',
    'background/routes/workflow-routes.js',
    'shared/redeem-channel-state.js',
    'shared/membership-credential-format.js',
    'background/redeem/redeem-cdkey-usage.js',
    'background/steps/upi-redeem.js',
    'background/upi-credential-membership-checker.js',
    'background/verification-flow.js',
    'content/auth-page-detectors.js',
    'content/signup-dom-utils.js',
    'content/signup-entry-page.js',
    'content/signup-verification-page.js',
    'content/signup-password-page.js',
    'content/signup-profile-page.js',
    'content/signup-session-page.js',
    'content/signup-page-detector.js',
    'content/signup-page-orchestrator.js',
    'content/signup-page.js',
    'sidepanel/sidepanel.html',
    'sidepanel/styles/settings.css',
    'sidepanel/styles/cdk-pools.css',
    'sidepanel/styles/account-records.css',
    'sidepanel/dom-bindings.js',
    'sidepanel/toast-service.js',
    'sidepanel/log-panel-manager.js',
    'sidepanel/workflow-state-view.js',
    'sidepanel/workflow-button-state.js',
    'sidepanel/workflow-status-display.js',
    'sidepanel/auto-run-normalizers.js',
    'sidepanel/cdk-pool-state.js',
    'sidepanel/settings-normalization.js',
    'sidepanel/chatgpt-session-reader-settings.js',
    'sidepanel/upi-info-helper-state.js',
    'sidepanel/auto-run-countdown-view.js',
    'sidepanel/auto-run-state.js',
    'sidepanel/config-menu-controller.js',
    'sidepanel/workflow-action-bindings.js',
    'sidepanel/settings-field-bindings.js',
    'sidepanel/sidepanel-ui-helpers.js',
    'sidepanel/action-modal-service.js',
    'sidepanel/download-service.js',
    'sidepanel/settings-transfer-manager.js',
    'sidepanel/mail-provider-state.js',
    'sidepanel/sidepanel-runtime-bridge.js',
    'sidepanel/cloudflare-domain-ui.js',
    'sidepanel/cdk-pool-manager.js',
    'sidepanel/membership-row-policy.js',
    'sidepanel/membership-renderer.js',
    'sidepanel/membership-redeem-progress.js',
    'sidepanel/account-records-view-model.js',
    'sidepanel/account-records-export.js',
    'sidepanel/account-records-subscription.js',
    'sidepanel/sidepanel.js',
    'sidepanel/account-records-manager.js',
    'sidepanel/custom-email-pool-manager.js',
    'shared/session-to-json-converter.js',
  ].forEach((relativePath) => readText(relativePath));
}

function checkSyntax() {
  const files = gitLines(['ls-files', '*.js', '*.mjs']);
  for (const file of files) {
    if (!fs.existsSync(path.join(root, file))) {
      continue;
    }
    const result = spawnSync('node', ['--check', file], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    if (result.status !== 0) {
      fail(`node --check failed for ${file}: ${result.stderr || result.stdout}`);
    }
  }
}

function checkStaticContracts() {
  const background = readText('background.js');
  const settingsNormalizers = readText('background/settings-normalizers.js');
  const flowDefinitionResolver = readText('background/flow-definition-resolver.js');
  const flowRuntime = readText('background/bootstrap/flow-runtime.js');
  const settingsDefaults = readText('background/bootstrap/settings-defaults.js');
  const stateStore = readText('background/bootstrap/state-store.js');
  const backgroundSettingsTransfer = readText('background/bootstrap/settings-transfer.js');
  const legacyCleanup = readText('background/bootstrap/legacy-cleanup.js');
  const autoRunSession = readText('background/bootstrap/auto-run-session.js');
  const autoRunTimerPlan = readText('background/bootstrap/auto-run-timer-plan.js');
  const autoRunStatus = readText('background/bootstrap/auto-run-status.js');
  const statePatchHelpers = readText('background/bootstrap/state-patch-helpers.js');
  const contentScriptRegistry = readText('background/bootstrap/content-script-registry.js');
  readText('background/bootstrap/runtime-listeners.js');
  const signupExecutorRegistry = readText('background/bootstrap/signup-executor-registry.js');
  const emailProviderRegistry = readText('background/email/provider-registry.js');
  const membershipAccessTokenRefresh = readText('background/membership/access-token-refresh.js');
  const membershipLoginSessionExecutor = readText('background/membership/login-session-executor.js');
  const membershipRedeemStatusSync = readText('background/membership/redeem-status-sync.js');
  const membershipResultState = readText('background/membership/result-state.js');
  const redeemChannelState = readText('shared/redeem-channel-state.js');
  const membershipCredentialFormat = readText('shared/membership-credential-format.js');
  const redeemCdkeyUsage = readText('background/redeem/redeem-cdkey-usage.js');
  const sidepanel = readText('sidepanel/sidepanel.js');
  const sidepanelHtml = readText('sidepanel/sidepanel.html');
  const domBindings = readText('sidepanel/dom-bindings.js');
  const toastService = readText('sidepanel/toast-service.js');
  const logPanelManager = readText('sidepanel/log-panel-manager.js');
  const workflowStateView = readText('sidepanel/workflow-state-view.js');
  const workflowButtonState = readText('sidepanel/workflow-button-state.js');
  const workflowStatusDisplay = readText('sidepanel/workflow-status-display.js');
  const autoRunNormalizers = readText('sidepanel/auto-run-normalizers.js');
  const sidepanelCdkPoolState = readText('sidepanel/cdk-pool-state.js');
  const sidepanelSettingsNormalization = readText('sidepanel/settings-normalization.js');
  const chatgptSessionReaderSettings = readText('sidepanel/chatgpt-session-reader-settings.js');
  const upiInfoHelperState = readText('sidepanel/upi-info-helper-state.js');
  const autoRunCountdownView = readText('sidepanel/auto-run-countdown-view.js');
  const autoRunState = readText('sidepanel/auto-run-state.js');
  const configMenuController = readText('sidepanel/config-menu-controller.js');
  const workflowActionBindings = readText('sidepanel/workflow-action-bindings.js');
  const downloadService = readText('sidepanel/download-service.js');
  const settingsTransferManager = readText('sidepanel/settings-transfer-manager.js');
  const mailProviderState = readText('sidepanel/mail-provider-state.js');
  const sidepanelRuntimeBridge = readText('sidepanel/sidepanel-runtime-bridge.js');
  const cloudflareDomainUi = readText('sidepanel/cloudflare-domain-ui.js');
  const cdkPoolManager = readText('sidepanel/cdk-pool-manager.js');
  const accountRecordsViewModel = readText('sidepanel/account-records-view-model.js');
  const accountRecordsExport = readText('sidepanel/account-records-export.js');
  const accountRecordsSubscription = readText('sidepanel/account-records-subscription.js');
  const accountRecords = readText('sidepanel/account-records-manager.js');
  const membershipRowPolicy = readText('sidepanel/membership-row-policy.js');
  const membershipRenderer = readText('sidepanel/membership-renderer.js');
  const membershipRedeemProgress = readText('sidepanel/membership-redeem-progress.js');
  const router = readText('background/message-router.js');
  const membershipRoutes = readText('background/routes/membership-routes.js');
  const cdkRoutes = readText('background/routes/cdkey-routes.js');
  const workflowRoutes = readText('background/routes/workflow-routes.js');
  const upiRedeem = readText('background/steps/upi-redeem.js');
  const checker = readText('background/upi-credential-membership-checker.js');
  const authPageDetectors = readText('content/auth-page-detectors.js');
  const signupDomUtils = readText('content/signup-dom-utils.js');
  const signupEntryPage = readText('content/signup-entry-page.js');
  const signupVerificationPage = readText('content/signup-verification-page.js');
  const signupPasswordPage = readText('content/signup-password-page.js');
  const signupProfilePage = readText('content/signup-profile-page.js');
  const signupSessionPage = readText('content/signup-session-page.js');
  const signupPageDetector = readText('content/signup-page-detector.js');
  const signupPageOrchestrator = readText('content/signup-page-orchestrator.js');
  const signupPage = readText('content/signup-page.js');
  const gitignore = readText('.gitignore');

  assertMatch(background, /autoStepDelaySeconds:\s*10\b/, 'background default settings');
  assertIncludes(sidepanel, 'const AUTO_STEP_DELAY_DEFAULT_SECONDS = 10;', 'sidepanel step delay default');
  assertIncludes(sidepanel, 'requestTextFileSaveTarget', 'sidepanel export picker support');
  assertIncludes(sidepanelHtml, 'src="download-service.js"', 'download service script load');
  assertIncludes(sidepanelHtml, 'src="settings-transfer-manager.js"', 'settings transfer manager script load');
  assertIncludes(sidepanelHtml, 'src="mail-provider-state.js"', 'sidepanel mail provider state script load');
  assertIncludes(sidepanelHtml, 'src="sidepanel-runtime-bridge.js"', 'sidepanel runtime bridge script load');
  assertIncludes(sidepanelHtml, 'src="cloudflare-domain-ui.js"', 'sidepanel Cloudflare domain UI script load');
  assertIncludes(sidepanelHtml, 'src="dom-bindings.js"', 'sidepanel DOM bindings script load');
  assertIncludes(sidepanelHtml, 'src="toast-service.js"', 'sidepanel toast service script load');
  assertIncludes(sidepanelHtml, 'src="log-panel-manager.js"', 'sidepanel log panel manager script load');
  assertIncludes(sidepanelHtml, 'src="workflow-state-view.js"', 'sidepanel workflow state view script load');
  assertIncludes(sidepanelHtml, 'src="workflow-button-state.js"', 'sidepanel workflow button state script load');
  assertIncludes(sidepanelHtml, 'src="workflow-status-display.js"', 'sidepanel workflow status display script load');
  assertIncludes(sidepanelHtml, 'src="auto-run-normalizers.js"', 'sidepanel auto-run normalizers script load');
  assertIncludes(sidepanelHtml, 'src="cdk-pool-state.js"', 'sidepanel CDK pool state script load');
  assertIncludes(sidepanelHtml, 'src="settings-normalization.js"', 'sidepanel settings normalization script load');
  assertIncludes(sidepanelHtml, 'src="chatgpt-session-reader-settings.js"', 'sidepanel ChatGPT session reader settings script load');
  assertIncludes(sidepanelHtml, 'src="upi-info-helper-state.js"', 'sidepanel UPI info helper state script load');
  assertIncludes(sidepanelHtml, 'src="auto-run-countdown-view.js"', 'sidepanel auto-run countdown view script load');
  assertIncludes(sidepanelHtml, 'src="auto-run-state.js"', 'sidepanel auto-run state script load');
  assertIncludes(sidepanelHtml, 'src="config-menu-controller.js"', 'sidepanel config menu controller script load');
  assertIncludes(sidepanelHtml, 'src="workflow-action-bindings.js"', 'sidepanel workflow action bindings script load');
  assertIncludes(sidepanelHtml, 'src="settings-field-bindings.js"', 'sidepanel settings field bindings script load');
  assertBefore(sidepanelHtml, 'src="dom-bindings.js"', 'src="sidepanel.js"', 'sidepanel DOM bindings must load before sidepanel.js');
  assertBefore(sidepanelHtml, 'src="toast-service.js"', 'src="sidepanel.js"', 'sidepanel toast service must load before sidepanel.js');
  assertBefore(sidepanelHtml, 'src="log-panel-manager.js"', 'src="sidepanel.js"', 'sidepanel log manager must load before sidepanel.js');
  assertBefore(sidepanelHtml, 'src="workflow-state-view.js"', 'src="sidepanel.js"', 'sidepanel workflow view must load before sidepanel.js');
  assertBefore(sidepanelHtml, 'src="workflow-button-state.js"', 'src="sidepanel.js"', 'sidepanel workflow button state must load before sidepanel.js');
  assertBefore(sidepanelHtml, 'src="workflow-status-display.js"', 'src="sidepanel.js"', 'sidepanel workflow status display must load before sidepanel.js');
  assertBefore(sidepanelHtml, 'src="auto-run-normalizers.js"', 'src="sidepanel.js"', 'sidepanel auto-run normalizers must load before sidepanel.js');
  assertBefore(sidepanelHtml, 'src="cdk-pool-state.js"', 'src="sidepanel.js"', 'sidepanel CDK pool state must load before sidepanel.js');
  assertBefore(sidepanelHtml, 'src="settings-normalization.js"', 'src="sidepanel.js"', 'sidepanel settings normalization must load before sidepanel.js');
  assertBefore(sidepanelHtml, 'src="chatgpt-session-reader-settings.js"', 'src="sidepanel.js"', 'sidepanel ChatGPT session reader settings must load before sidepanel.js');
  assertBefore(sidepanelHtml, 'src="upi-info-helper-state.js"', 'src="sidepanel.js"', 'sidepanel UPI info helper state must load before sidepanel.js');
  assertBefore(sidepanelHtml, 'src="auto-run-countdown-view.js"', 'src="sidepanel.js"', 'sidepanel auto-run countdown view must load before sidepanel.js');
  assertBefore(sidepanelHtml, 'src="auto-run-state.js"', 'src="sidepanel.js"', 'sidepanel auto-run state must load before sidepanel.js');
  assertBefore(sidepanelHtml, 'src="config-menu-controller.js"', 'src="sidepanel.js"', 'sidepanel config menu controller must load before sidepanel.js');
  assertBefore(sidepanelHtml, 'src="workflow-action-bindings.js"', 'src="sidepanel.js"', 'sidepanel workflow action bindings must load before sidepanel.js');
  assertBefore(sidepanelHtml, 'src="settings-field-bindings.js"', 'src="sidepanel.js"', 'sidepanel settings field bindings must load before sidepanel.js');
  assertBefore(sidepanelHtml, 'src="mail-provider-state.js"', 'src="sidepanel.js"', 'sidepanel mail provider state must load before sidepanel.js');
  assertBefore(sidepanelHtml, 'src="sidepanel-runtime-bridge.js"', 'src="sidepanel.js"', 'sidepanel runtime bridge must load before sidepanel.js');
  assertBefore(sidepanelHtml, 'src="cloudflare-domain-ui.js"', 'src="sidepanel.js"', 'sidepanel Cloudflare domain UI must load before sidepanel.js');
  assertIncludes(sidepanelHtml, 'src="../shared/redeem-channel-state.js"', 'sidepanel redeem channel state script load');
  assertIncludes(sidepanelHtml, 'src="../shared/membership-credential-format.js"', 'sidepanel membership credential format script load');
  assertIncludes(membershipCredentialFormat, 'MultiPageMembershipCredentialFormat', 'membership credential format global');
  assertIncludes(membershipCredentialFormat, 'formatFreeCredentialLine', 'membership Free export formatter');
  assertBefore(sidepanelHtml, 'src="../shared/membership-credential-format.js"', 'src="account-records-manager.js"', 'membership credential format must load before account records manager');
  assertIncludes(sidepanelHtml, 'src="cdk-pool-manager.js"', 'CDK pool manager script load');
  assertIncludes(sidepanelHtml, 'src="membership-row-policy.js"', 'membership row policy script load');
  assertIncludes(sidepanelHtml, 'src="membership-renderer.js"', 'membership renderer script load');
  assertIncludes(sidepanelHtml, 'src="membership-redeem-progress.js"', 'membership redeem progress script load');
  assertIncludes(sidepanelHtml, 'src="account-records-view-model.js"', 'account records view model script load');
  assertIncludes(sidepanelHtml, 'src="account-records-export.js"', 'account records export script load');
  assertIncludes(sidepanelHtml, 'src="account-records-subscription.js"', 'account records subscription script load');
  assertIncludes(accountRecordsExport, 'SidepanelAccountRecordsExport', 'account records export global');
  assertIncludes(accountRecordsExport, 'createAccountRecordsExportHelpers', 'account records export helper factory');
  assertIncludes(accountRecordsSubscription, 'SidepanelAccountRecordsSubscription', 'account records subscription global');
  assertIncludes(accountRecordsSubscription, 'createAccountRecordsSubscriptionHelpers', 'account records subscription helper factory');
  assertBefore(sidepanelHtml, 'src="membership-row-policy.js"', 'src="membership-renderer.js"', 'membership row policy must load before renderer');
  assertBefore(sidepanelHtml, 'src="membership-renderer.js"', 'src="membership-redeem-progress.js"', 'membership renderer must load before redeem progress');
  assertBefore(sidepanelHtml, 'src="membership-redeem-progress.js"', 'src="account-records-manager.js"', 'membership redeem progress must load before account records manager');
  assertBefore(sidepanelHtml, 'src="membership-renderer.js"', 'src="account-records-manager.js"', 'membership renderer must load before account records manager');
  assertBefore(sidepanelHtml, 'src="account-records-view-model.js"', 'src="account-records-manager.js"', 'account records view model must load before account records manager');
  assertBefore(sidepanelHtml, 'src="account-records-view-model.js"', 'src="account-records-export.js"', 'account records view model must load before export helpers');
  assertBefore(sidepanelHtml, 'src="account-records-export.js"', 'src="account-records-manager.js"', 'account records export helpers must load before manager');
  assertBefore(sidepanelHtml, 'src="account-records-export.js"', 'src="account-records-subscription.js"', 'account records export helpers must load before subscription helpers');
  assertBefore(sidepanelHtml, 'src="account-records-subscription.js"', 'src="account-records-manager.js"', 'account records subscription helpers must load before manager');
  assertBefore(
    sidepanelHtml,
    'src="../shared/redeem-channel-state.js"',
    'src="cdk-pool-manager.js"',
    'sidepanel redeem channel state must load before CDK pool manager'
  );
  assertIncludes(sidepanelHtml, 'href="styles/settings.css"', 'settings stylesheet load');
  assertIncludes(sidepanelHtml, 'href="styles/cdk-pools.css"', 'CDK pools stylesheet load');
  assertIncludes(sidepanelHtml, 'href="styles/account-records.css"', 'account records stylesheet load');
  assertIncludes(sidepanelHtml, 'src="sidepanel-ui-helpers.js"', 'sidepanel UI helpers script load');
  assertIncludes(sidepanelHtml, 'src="action-modal-service.js"', 'action modal service script load');
  assertIncludes(readText('sidepanel/sidepanel-ui-helpers.js'), 'createSidepanelUiHelpers', 'sidepanel UI helpers factory');
  assertIncludes(readText('sidepanel/action-modal-service.js'), 'createActionModalService', 'action modal service factory');
  assertIncludes(domBindings, 'SidepanelDomBindings', 'sidepanel DOM bindings global');
  assertIncludes(domBindings, 'getBindings', 'sidepanel DOM bindings factory');
  assertIncludes(toastService, 'SidepanelToastService', 'sidepanel toast service global');
  assertIncludes(toastService, 'createToastService', 'sidepanel toast service factory');
  assertIncludes(logPanelManager, 'SidepanelLogPanelManager', 'sidepanel log panel manager global');
  assertIncludes(logPanelManager, 'create', 'sidepanel log panel manager factory');
  assertIncludes(workflowStateView, 'SidepanelWorkflowStateView', 'sidepanel workflow state view global');
  assertIncludes(workflowStateView, 'renderStepStatuses', 'sidepanel workflow state renderer');
  assertIncludes(workflowButtonState, 'SidepanelWorkflowButtonState', 'sidepanel workflow button state global');
  assertIncludes(workflowButtonState, 'createWorkflowButtonStateManager', 'sidepanel workflow button state factory');
  assertIncludes(workflowButtonState, 'getManualSkipButtonState', 'sidepanel workflow skip button state helper');
  assertIncludes(workflowStatusDisplay, 'SidepanelWorkflowStatusDisplay', 'sidepanel workflow status display global');
  assertIncludes(workflowStatusDisplay, 'createWorkflowStatusDisplayManager', 'sidepanel workflow status display factory');
  assertIncludes(workflowStatusDisplay, 'getStatusDisplayState', 'sidepanel workflow status display helper');
  assertIncludes(autoRunNormalizers, 'SidepanelAutoRunNormalizers', 'sidepanel auto-run normalizers global');
  assertIncludes(autoRunNormalizers, 'createAutoRunNormalizers', 'sidepanel auto-run normalizers factory');
  assertIncludes(autoRunNormalizers, 'normalizeAutoStepDelaySeconds', 'sidepanel auto-run step delay normalizer');
  assertIncludes(sidepanelCdkPoolState, 'SidepanelCdkPoolState', 'sidepanel CDK pool state global');
  assertIncludes(sidepanelCdkPoolState, 'createCdkPoolStateHelpers', 'sidepanel CDK pool state factory');
  assertIncludes(sidepanelCdkPoolState, 'isUpiRedeemCdkeySelectableForRedeem', 'sidepanel CDK selectability helper');
  assertIncludes(sidepanelSettingsNormalization, 'SidepanelSettingsNormalization', 'sidepanel settings normalization global');
  assertIncludes(sidepanelSettingsNormalization, 'createSettingsNormalization', 'sidepanel settings normalization factory');
  assertIncludes(sidepanelSettingsNormalization, 'normalizeCustomEmailPoolEntryObjects', 'custom email pool normalizer');
  assertIncludes(chatgptSessionReaderSettings, 'SidepanelChatgptSessionReaderSettings', 'ChatGPT session reader settings global');
  assertIncludes(chatgptSessionReaderSettings, 'createChatgptSessionReaderSettings', 'ChatGPT session reader settings factory');
  assertIncludes(chatgptSessionReaderSettings, 'normalizeChatgptSessionReaderStateForUi', 'ChatGPT session reader state normalizer');
  assertIncludes(upiInfoHelperState, 'SidepanelUpiInfoHelperState', 'UPI info helper state global');
  assertIncludes(upiInfoHelperState, 'createUpiInfoHelperState', 'UPI info helper state factory');
  assertIncludes(upiInfoHelperState, 'getUpiInfoAutoModePermissionFromPayload', 'UPI info auto-mode permission parser');
	  assertIncludes(autoRunCountdownView, 'SidepanelAutoRunCountdownView', 'sidepanel auto-run countdown view global');
  assertIncludes(autoRunCountdownView, 'createAutoRunCountdownView', 'sidepanel auto-run countdown view factory');
  assertIncludes(autoRunCountdownView, 'syncScheduledCountdownTicker', 'sidepanel auto-run countdown ticker');
  assertIncludes(autoRunState, 'SidepanelAutoRunState', 'sidepanel auto-run state global');
  assertIncludes(autoRunState, 'createAutoRunStateModel', 'sidepanel auto-run state factory');
  assertIncludes(autoRunState, 'shouldSyncRunCountFromAutoRunSource', 'sidepanel auto-run source sync gate');
  assertIncludes(configMenuController, 'SidepanelConfigMenuController', 'sidepanel config menu controller global');
  assertIncludes(configMenuController, 'createConfigMenuController', 'sidepanel config menu controller factory');
  assertIncludes(workflowActionBindings, 'SidepanelWorkflowActionBindings', 'sidepanel workflow action bindings global');
  assertIncludes(workflowActionBindings, 'createWorkflowActionBindings', 'sidepanel workflow action bindings factory');
  assertIncludes(sidepanel, 'SidepanelWorkflowActionBindings.createWorkflowActionBindings', 'sidepanel workflow action bindings wiring');
  assertBefore(sidepanel, 'renderStepsList();\ninitializeManualStepActions();', 'bindConfigMenuEvents();', 'sidepanel must render workflow steps before binding init actions');
  assertIncludes(sidepanelHtml, '<span id="steps-progress" class="steps-progress">0 / 0</span>', 'sidepanel workflow progress placeholder must not hard-code stale step count');
  assertIncludes(cloudflareDomainUi, 'normalizeItems: (values) => helpers.normalizeCloudflareDomains?.(values) || []', 'Cloudflare domain picker must delay normalizer lookup until settings normalization is initialized');
  assertIncludes(cloudflareDomainUi, 'normalizeItems: (values) => helpers.normalizeCloudflareTempEmailDomains?.(values) || []', 'Cloudflare temp email domain picker must delay normalizer lookup until settings normalization is initialized');
  assertIncludes(downloadService, 'createDownloadService', 'download service factory');
  assertIncludes(downloadService, 'chromeApi.downloads.download', 'download service browser API fallback');
  assertIncludes(settingsTransferManager, 'createSettingsTransferManager', 'settings transfer manager factory');
  assertIncludes(settingsTransferManager, "type: 'EXPORT_SETTINGS'", 'settings export route lives in transfer manager');
  assertIncludes(settingsTransferManager, "type: 'IMPORT_SETTINGS'", 'settings import route lives in transfer manager');
  assertIncludes(mailProviderState, 'SidepanelMailProviderState', 'sidepanel mail provider state global');
  assertIncludes(mailProviderState, 'createMailProviderState', 'sidepanel mail provider state factory');
  assertIncludes(sidepanel, 'SidepanelMailProviderState.createMailProviderState', 'sidepanel mail provider state wiring');
  assertIncludes(sidepanelRuntimeBridge, 'SidepanelRuntimeBridge', 'sidepanel runtime bridge global');
  assertIncludes(sidepanelRuntimeBridge, 'createSidepanelRuntimeBridge', 'sidepanel runtime bridge factory');
  assertIncludes(sidepanel, 'SidepanelRuntimeBridge.createSidepanelRuntimeBridge', 'sidepanel runtime bridge wiring');
  assertIncludes(cloudflareDomainUi, 'SidepanelCloudflareDomainUi', 'sidepanel Cloudflare domain UI global');
  assertIncludes(cloudflareDomainUi, 'createCloudflareDomainUi', 'sidepanel Cloudflare domain UI factory');
  assertIncludes(sidepanel, 'SidepanelCloudflareDomainUi.createCloudflareDomainUi', 'sidepanel Cloudflare domain UI wiring');
  assertIncludes(cdkPoolManager, 'createCdkPoolManager', 'CDK pool manager factory');
  assertIncludes(membershipRowPolicy, 'SidepanelMembershipRowPolicy', 'membership row policy global');
  assertIncludes(membershipRowPolicy, 'isRedeemableFreeRowForChannel', 'membership row policy candidate helper');
  assertIncludes(membershipRenderer, 'SidepanelMembershipRenderer', 'membership renderer global');
  assertIncludes(membershipRenderer, 'renderFlow', 'membership renderer flow helper');
  assertNotMatch(membershipRenderer, /\brenderRedeemProgress\b/, 'membership renderer should not duplicate redeem progress rendering');
  assertIncludes(membershipRedeemProgress, 'SidepanelMembershipRedeemProgress', 'membership redeem progress global');
  assertIncludes(membershipRedeemProgress, 'getUpiCredentialMembershipRedeemProgressMeta', 'membership redeem progress metadata helper');
  assertIncludes(membershipRedeemProgress, 'renderUpiCredentialMembershipRedeemProgress', 'membership redeem progress renderer');
  assertIncludes(accountRecordsViewModel, 'SidepanelAccountRecordsViewModel', 'account records view model global');
  assertIncludes(accountRecordsViewModel, 'summarizeAccountRunHistory', 'account records view model summary helper');
  assertIncludes(accountRecordsViewModel, 'matchesFilter', 'account records view model filter helper');
  assertIncludes(accountRecords, 'SidepanelAccountRecordsViewModel', 'account records manager view model dependency');
  assertIncludes(accountRecords, 'SidepanelMembershipRedeemProgress', 'account records manager redeem progress dependency');
  assertIncludes(settingsTransferManager, 'multipage-settings-', 'settings export filename');
  assertIncludes(backgroundSettingsTransfer, 'containsSensitiveRuntimeData: true', 'settings export sensitive data marker');
  assertIncludes(background, "'background/settings-normalizers.js'", 'background settings normalizers script load');
  assertIncludes(background, 'requireSettingsNormalizers()', 'background settings normalizer compatibility wrappers');
  assertIncludes(settingsNormalizers, 'createSettingsNormalizers', 'settings normalizers factory');
  assertIncludes(settingsNormalizers, 'normalizeAutoStepDelaySeconds', 'settings normalizer step delay');
  assertIncludes(settingsNormalizers, 'normalizeLocalHttpBaseUrl', 'settings normalizer URL cleanup');
  assertIncludes(background, "'background/flow-definition-resolver.js'", 'background flow resolver script load');
  assertIncludes(background, "'background/bootstrap/flow-runtime.js'", 'background flow runtime script load');
  assertIncludes(background, "'background/bootstrap/settings-defaults.js'", 'background settings defaults script load');
  assertIncludes(background, "'background/bootstrap/state-store.js'", 'background state store script load');
  assertIncludes(background, "'background/bootstrap/settings-transfer.js'", 'background settings transfer script load');
  assertIncludes(background, "'background/bootstrap/legacy-cleanup.js'", 'background legacy cleanup script load');
  assertIncludes(background, "'background/bootstrap/auto-run-session.js'", 'background auto-run session script load');
  assertIncludes(background, "'background/bootstrap/auto-run-timer-plan.js'", 'background auto-run timer plan script load');
  assertIncludes(background, "'background/bootstrap/auto-run-status.js'", 'background auto-run status script load');
  assertIncludes(background, "'background/bootstrap/state-patch-helpers.js'", 'background state patch helpers script load');
  assertIncludes(background, 'background/bootstrap/content-script-registry.js', 'content script registry import');
  assertIncludes(background, 'MultiPageBackgroundSettingsTransfer.createSettingsTransfer', 'background settings transfer wiring');
  assertIncludes(background, 'MultiPageBackgroundStatePatchHelpers.createStatePatchHelpers', 'background state patch helper wiring');
  assertIncludes(background, 'MultiPageBackgroundContentScriptRegistry.createContentScriptRegistry()', 'content script registry wiring');
  assertIncludes(background, 'MultiPageBackgroundRuntimeListeners.createRuntimeListenerRegistrar', 'runtime listener registrar wiring');
  assertIncludes(background, 'background/bootstrap/signup-executor-registry.js', 'signup executor registry import');
  assertIncludes(background, 'MultiPageBackgroundSignupExecutorRegistry.createSignupExecutorRegistry', 'signup executor registry wiring');
  assertIncludes(signupExecutorRegistry, 'createSignupExecutorRegistry', 'signup executor registry factory');
  assertIncludes(signupExecutorRegistry, 'createUpiRedeemExecutor', 'signup executor registry UPI redeem wiring');
  assertIncludes(background, 'requireFlowDefinitionResolver()', 'background flow resolver compatibility wrappers');
  assertIncludes(flowDefinitionResolver, 'createFlowDefinitionResolver', 'flow resolver factory');
  assertIncludes(flowDefinitionResolver, 'getStepDefinitionsForState', 'flow resolver step definitions');
  assertIncludes(flowDefinitionResolver, 'getNodeDefinitionsForState', 'flow resolver node definitions');
  assertIncludes(flowRuntime, 'MultiPageBackgroundFlowRuntime', 'background flow runtime global');
  assertIncludes(flowRuntime, 'create', 'background flow runtime factory');
  assertIncludes(settingsDefaults, 'MultiPageBackgroundSettingsDefaults', 'background settings defaults global');
  assertIncludes(settingsDefaults, 'PERSISTED_SETTING_DEFAULTS', 'background persisted settings defaults');
  assertIncludes(stateStore, 'MultiPageBackgroundStateStore', 'background state store global');
  assertIncludes(stateStore, 'createBackgroundStateStore', 'background state store factory');
  assertIncludes(stateStore, 'initializeSessionStorageAccess', 'background state store session access helper');
  assertIncludes(backgroundSettingsTransfer, 'MultiPageBackgroundSettingsTransfer', 'background settings transfer global');
  assertIncludes(backgroundSettingsTransfer, 'buildSettingsRuntimeDataImportUpdates', 'background settings runtime import helper');
  assertIncludes(statePatchHelpers, 'MultiPageBackgroundStatePatchHelpers', 'background state patch helpers global');
  assertIncludes(statePatchHelpers, 'protectFreshMembershipResultsInStatePatch', 'background stale membership protection helper');
  assertIncludes(legacyCleanup, 'MultiPageBackgroundLegacyCleanup', 'background legacy cleanup global');
  assertIncludes(legacyCleanup, 'createBackgroundLegacyCleanup', 'background legacy cleanup factory');
  assertIncludes(legacyCleanup, 'purgeFormerNetworkResidue', 'background legacy cleanup entrypoint');
  assertIncludes(autoRunSession, 'MultiPageBackgroundAutoRunSession', 'background auto-run session global');
  assertIncludes(autoRunSession, 'createAutoRunSessionManager', 'background auto-run session factory');
  assertIncludes(autoRunSession, 'getCurrentAutoRunSessionId', 'background auto-run session getter');
  assertIncludes(autoRunTimerPlan, 'MultiPageBackgroundAutoRunTimerPlan', 'background auto-run timer plan global');
  assertIncludes(autoRunTimerPlan, 'createAutoRunTimerPlanManager', 'background auto-run timer plan factory');
  assertIncludes(autoRunTimerPlan, 'normalizeAutoRunTimerPlanFromState', 'background auto-run timer plan state normalizer');
  assertIncludes(autoRunStatus, 'MultiPageBackgroundAutoRunStatus', 'background auto-run status global');
  assertIncludes(autoRunStatus, 'createAutoRunStatusManager', 'background auto-run status factory');
  assertIncludes(autoRunStatus, 'isAutoRunLockedState', 'background auto-run status locked predicate');
  assertIncludes(background, "'background/email/provider-registry.js'", 'background email provider registry script load');
  assertIncludes(emailProviderRegistry, 'MultiPageEmailProviderRegistry', 'email provider registry global');
  assertIncludes(emailProviderRegistry, 'normalizeEmailGenerator', 'email provider generator normalizer');
  assertIncludes(background, "'background/membership/redeem-status-sync.js'", 'background redeem status sync script load');
  assertIncludes(background, "'background/membership/access-token-refresh.js'", 'background access token refresh script load');
  assertIncludes(background, "'background/membership/login-session-executor.js'", 'background login session executor script load');
  assertIncludes(background, "'background/membership/result-state.js'", 'background membership result-state script load');
  assertBefore(background, "'background/membership/redeem-status-sync.js'", "'background/message-router.js'", 'redeem status sync must load before message router');
  assertBefore(background, "'background/membership/access-token-refresh.js'", "'background/upi-credential-membership-checker.js'", 'access token refresh helper must load before membership checker');
  assertBefore(background, "'background/membership/login-session-executor.js'", "'background/upi-credential-membership-checker.js'", 'login session executor must load before membership checker');
  assertBefore(background, "'background/membership/result-state.js'", "'background/membership/results-store.js'", 'membership result-state must load before results store');
  assertBefore(background, "'background/membership/result-state.js'", "'background/upi-credential-membership-checker.js'", 'membership result-state must load before membership checker');
  assertIncludes(membershipRedeemStatusSync, 'MultiPageMembershipRedeemStatusSync', 'membership redeem status sync global');
  assertIncludes(membershipRedeemStatusSync, 'buildPendingUpiCredentialMembershipRedeemRefreshTargets', 'membership redeem refresh target helper');
  assertIncludes(membershipAccessTokenRefresh, 'MultiPageMembershipAccessTokenRefresh', 'membership access token refresh global');
  assertIncludes(membershipAccessTokenRefresh, 'isAccessTokenInvalidMembershipError', 'membership access token invalid classifier');
  assertIncludes(membershipLoginSessionExecutor, 'MultiPageMembershipLoginSessionExecutor', 'membership login session executor global');
  assertIncludes(membershipLoginSessionExecutor, 'createMembershipLoginSessionExecutor', 'membership login session executor factory');
  assertIncludes(membershipResultState, 'MultiPageMembershipResultState', 'membership result-state global');
  assertIncludes(membershipResultState, 'normalizeResultsPayload', 'membership result-state payload normalizer');
  assertIncludes(membershipResultState, 'buildResultExportRows', 'membership result-state export rows helper');
  assertIncludes(checker, 'getMembershipResultStateHelper', 'membership checker result-state wrapper');
  assertIncludes(background, "'background/routes/membership-routes.js'", 'background membership routes script load');
  assertIncludes(background, "'background/routes/cdkey-routes.js'", 'background CDK routes script load');
  assertIncludes(background, "'background/routes/workflow-routes.js'", 'background workflow routes script load');
  assertBefore(
    background,
    "'background/routes/membership-routes.js'",
    "'background/message-router.js'",
    'background membership routes must load before message router'
  );
  assertBefore(
    background,
    "'background/routes/cdkey-routes.js'",
    "'background/message-router.js'",
    'background CDK routes must load before message router'
  );
  assertBefore(
    background,
    "'background/routes/workflow-routes.js'",
    "'background/message-router.js'",
    'background workflow routes must load before message router'
  );
  assertIncludes(membershipRoutes, 'createMembershipRoutes', 'membership routes factory');
  assertIncludes(membershipRoutes, 'CHECK_UPI_CREDENTIAL_MEMBERSHIP_TRIAL_ELIGIBILITY_BATCH', 'membership trial batch route');
  assertIncludes(cdkRoutes, 'createCdkeyRoutes', 'CDK routes factory');
  assertIncludes(cdkRoutes, 'REFRESH_UPI_REDEEM_CDKEY_STATUSES', 'remote CDK status refresh route');
  assertIncludes(workflowRoutes, 'createWorkflowRoutes', 'workflow routes factory');
  assertIncludes(workflowRoutes, 'EXECUTE_NODE', 'workflow execute node route');
  assertIncludes(router, 'const routeHandlers = {', 'message router route handler table');
  assertIncludes(router, 'rootScope.MultiPageCdkeyRoutes?.createCdkeyRoutes', 'message router CDK route registration');
  assertIncludes(background, "'shared/redeem-channel-state.js'", 'background redeem channel state script load');
  assertIncludes(background, "'shared/membership-credential-format.js'", 'background membership credential format script load');
  assertBefore(
    background,
    "'shared/membership-credential-format.js'",
    "'background/upi-credential-membership-checker.js'",
    'background membership credential format must load before membership checker'
  );
  assertIncludes(background, "'background/redeem/redeem-cdkey-usage.js'", 'background redeem CDK usage script load');
  assertIncludes(redeemChannelState, 'createRedeemChannelState', 'redeem channel state factory');
  assertIncludes(redeemChannelState, 'getRedeemChannelFailureField', 'redeem channel failure field helper');
  assertIncludes(redeemChannelState, 'getRedeemChannelFailureCount', 'redeem channel failure count helper');
  assertIncludes(redeemChannelState, 'isRedeemChannelDailyLimitReason', 'redeem daily-limit helper');
  assertIncludes(redeemChannelState, 'shouldRedeemItemUseChannel', 'redeem channel use policy helper');
  assertIncludes(redeemCdkeyUsage, 'createRedeemCdkeyUsage', 'redeem CDK usage factory');
  assertIncludes(redeemCdkeyUsage, 'getUpiRedeemStateValue', 'redeem CDK legacy alias helper');
  assertIncludes(redeemCdkeyUsage, 'buildRedeemChannelUsageUpdates', 'redeem CDK usage update helper');
  assertIncludes(upiRedeem, 'getRedeemChannelStateHelpers()', 'UPI redeem channel state wrapper');
  assertIncludes(upiRedeem, 'getRedeemCdkeyUsageHelpers()', 'UPI redeem CDK usage wrapper');
  assertIncludes(checker, 'getRedeemChannelStateHelpers()', 'membership checker channel state wrapper');
  assertIncludes(checker, 'getRedeemCdkeyUsageHelpers()', 'membership checker CDK usage wrapper');
  assertIncludes(router, 'getRedeemChannelStateHelpers()', 'router channel state wrapper');
  assertIncludes(router, 'getRedeemCdkeyUsageHelpers()', 'router CDK usage wrapper');
  assertIncludes(contentScriptRegistry, "'content/auth-page-detectors.js'", 'background auth page detectors injection');
  assertIncludes(contentScriptRegistry, "'content/signup-dom-utils.js'", 'background signup DOM utils injection');
  assertIncludes(contentScriptRegistry, "'content/signup-entry-page.js'", 'background signup entry page injection');
  assertIncludes(contentScriptRegistry, "'content/signup-verification-page.js'", 'background signup verification page injection');
  assertIncludes(contentScriptRegistry, "'content/signup-password-page.js'", 'background signup password page injection');
  assertIncludes(contentScriptRegistry, "'content/signup-profile-page.js'", 'background signup profile page injection');
  assertIncludes(contentScriptRegistry, "'content/signup-session-page.js'", 'background signup session page injection');
  assertIncludes(contentScriptRegistry, "'content/signup-page-detector.js'", 'background signup detector injection');
  assertIncludes(contentScriptRegistry, "'content/signup-page-orchestrator.js'", 'background signup orchestrator injection');
  [
    'content/auth-page-detectors.js',
    'content/signup-dom-utils.js',
    'content/signup-entry-page.js',
    'content/signup-verification-page.js',
    'content/signup-password-page.js',
    'content/signup-profile-page.js',
    'content/signup-session-page.js',
    'content/signup-page-detector.js',
    'content/signup-page-orchestrator.js',
    'content/signup-page.js',
  ].reduce((previousFile, currentFile) => {
    if (previousFile) {
      assertBefore(
        contentScriptRegistry,
        `'${previousFile}'`,
        `'${currentFile}'`,
        'background signup content injection order'
      );
    }
    return currentFile;
  }, '');
  assertIncludes(JSON.stringify(readJson('manifest.json')), 'content/auth-page-detectors.js', 'manifest auth page detectors load');
  assertIncludes(JSON.stringify(readJson('manifest.json')), 'content/signup-dom-utils.js', 'manifest signup DOM utils load');
  assertIncludes(JSON.stringify(readJson('manifest.json')), 'content/signup-entry-page.js', 'manifest signup entry page load');
  assertIncludes(JSON.stringify(readJson('manifest.json')), 'content/signup-verification-page.js', 'manifest signup verification page load');
  assertIncludes(JSON.stringify(readJson('manifest.json')), 'content/signup-password-page.js', 'manifest signup password page load');
  assertIncludes(JSON.stringify(readJson('manifest.json')), 'content/signup-profile-page.js', 'manifest signup profile page load');
  assertIncludes(JSON.stringify(readJson('manifest.json')), 'content/signup-session-page.js', 'manifest signup session page load');
  assertIncludes(JSON.stringify(readJson('manifest.json')), 'content/signup-page-detector.js', 'manifest signup detector load');
  assertIncludes(JSON.stringify(readJson('manifest.json')), 'content/signup-page-orchestrator.js', 'manifest signup orchestrator load');
  assertIncludes(authPageDetectors, 'MultiPageAuthPageDetectors', 'auth page detectors global');
  assertIncludes(authPageDetectors, 'isSignupEntryText', 'auth page signup text detector');
  assertIncludes(authPageDetectors, 'isLoginEntryText', 'auth page login text detector');
  assertIncludes(authPageDetectors, 'isResendEmailText', 'auth page resend detector');
  assertIncludes(authPageDetectors, 'प्लान्स?', 'auth page detectors exclude Hindi plans/pricing');
  assertIncludes(signupPage, 'MultiPageAuthPageDetectors', 'signup page auth detector dependency');
  assertIncludes(signupDomUtils, 'MultiPageSignupDomUtils', 'signup DOM utils global');
  assertIncludes(signupDomUtils, 'getAssociatedInputText', 'signup DOM associated input helper');
  assertIncludes(signupEntryPage, 'MultiPageSignupEntryPage', 'signup entry page global');
  assertIncludes(signupEntryPage, 'findSignupEntryTrigger', 'signup entry trigger helper');
  assertIncludes(signupEntryPage, 'isSignupEntryText', 'signup entry uses shared signup detector');
  assertIncludes(signupEntryPage, 'isLoginEntryText', 'signup entry uses shared login detector');
  assertIncludes(signupVerificationPage, 'MultiPageSignupVerificationPage', 'signup verification page global');
  assertIncludes(signupVerificationPage, 'getVerificationCodeTarget', 'signup verification target helper');
  assertIncludes(signupVerificationPage, 'findResendVerificationCodeTrigger', 'signup verification resend helper');
  assertIncludes(signupPasswordPage, 'MultiPageSignupPasswordPage', 'signup password page global');
  assertIncludes(signupPasswordPage, 'createSignupPasswordPage', 'signup password page factory');
  assertIncludes(signupPasswordPage, 'setPassword', 'signup password set password helper');
  assertIncludes(signupPasswordPage, 'detectPasswordPage', 'signup password page detector');
  assertIncludes(signupProfilePage, 'MultiPageSignupProfilePage', 'signup profile page global');
  assertIncludes(signupProfilePage, 'createSignupProfilePage', 'signup profile page factory');
  assertIncludes(signupProfilePage, 'detectProfilePage', 'signup profile page detector');
  assertIncludes(signupProfilePage, 'fillProfileNameAndBirthday', 'signup profile fill helper');
  assertIncludes(signupProfilePage, 'submitProfilePage', 'signup profile submit helper');
  assertIncludes(signupSessionPage, 'MultiPageSignupSessionPage', 'signup session page global');
  assertIncludes(signupSessionPage, 'createSignupSessionPage', 'signup session page factory');
  assertIncludes(signupSessionPage, 'readChatGptSession', 'signup session reader');
  assertIncludes(signupSessionPage, 'extractAccessToken', 'signup session access token helper');
  assertIncludes(signupSessionPage, 'detectLoggedInHome', 'signup session logged-in home detector');
  assertIncludes(signupPageDetector, 'MultiPageSignupPageDetector', 'signup detector global');
  assertIncludes(signupPageDetector, 'createSignupPageDetector', 'signup detector factory');
  assertIncludes(signupPageDetector, 'createDetectorBackedPattern', 'signup detector shared text detector wrapper');
  assertIncludes(signupPageDetector, 'getLoginVerificationKind', 'signup detector login verification classifier');
  assertIncludes(signupPageDetector, 'findResendVerificationCodeTrigger', 'signup detector resend helper');
  assertIncludes(signupPageOrchestrator, 'MultiPageSignupPageOrchestrator', 'signup orchestrator global');
  assertIncludes(signupPageOrchestrator, 'createSignupPageOrchestrator', 'signup orchestrator factory');
  assertIncludes(signupPageOrchestrator, 'resolveCommandNodeId', 'signup orchestrator command resolver');
  assertIncludes(signupPageOrchestrator, 'formatMembershipAuthLogMessage', 'signup orchestrator membership log formatter');

  [
    'btn-upi-redeem-cdkey-status-refresh',
    'btn-show-upi-credential-backups',
    'btn-export-upi-credential-backups',
    'btn-check-upi-credential-membership-local',
    'btn-import-upi-credential-membership-txt',
    'btn-import-upi-credential-membership-free-txt',
    'btn-stop-upi-credential-membership-check',
    'btn-export-upi-redeem-success-records',
  ].forEach((id) => {
    assertIncludes(sidepanelHtml, `id="${id}"`, `sidepanel HTML DOM contract for ${id}`);
  });

  assertIncludes(accountRecords, 'redeemPlusDeletedEmailsByChannel', 'Plus delete tombstones');
  assertIncludes(accountRecords, "normalizeRedeemChannel(channel) === 'ideal'", 'IDEAL channel UI support');
  assertIncludes(
    accountRecords,
    'const credentials = getEnabledFreeUpiCredentialMembershipRowsForChannel(redeemChannel);',
    'CDK import resume must use channel-specific Free candidates'
  );
  assertIncludes(
    cdkPoolManager,
    "helpers.importCdkPoolFromTextarea?.({ channel: redeemChannel, autoResume: true })",
    'UPI CDK import button must resume queued Free redeem'
  );
  assertIncludes(
    cdkPoolManager,
    "bindImportButton(dom.btnImportIdealCdkPool, 'ideal')",
    'IDEAL CDK import button must resume queued Free redeem'
  );
  assertNotMatch(
    sidepanel,
    /btnImport(?:Ideal)?CdkPool\?\.addEventListener/,
    'CDK import event binding must live in sidepanel/cdk-pool-manager.js'
  );
  assertNotMatch(
    sidepanel,
    /importCdkPoolFromTextarea\(\{\s*channel:\s*['"](upi|ideal)['"]\s*\}\)/,
    'CDK import entrypoints must not skip autoResume'
  );
  assertMatch(
    accountRecords,
    /await helpers\.downloadTextFile\(/,
    'account record exports must await async download helper'
  );
  assertMatch(
    accountRecords,
    /deletedEmails\.forEach\(\(email\) => disabledUpiCredentialMembershipEmails\.delete\(email\)\);\s*if\s*\(deleteStatus === 'free'\)\s*\{[\s\S]*?setUpiCredentialMembershipPoolRows\(/,
    'single Plus delete must not remove local backup pool rows'
  );
  assertNotMatch(
    accountRecords,
    /else if\s*\(deleteStatus === 'paid' && deleteChannel\)\s*\{[^{}]*?setUpiCredentialMembershipPoolRows\(/,
    'single Plus paid delete must not mutate local backup pool rows'
  );
  assertNotMatch(
    accountRecords,
    /const credentials = getEnabledFreeUpiCredentialMembershipRows\(\);\s+if \(!credentials\.length\)/,
    'CDK import resume must not use merged UPI/IDEAL candidates'
  );
  assertIncludes(router, 'skipAutoRetry', 'remote refresh skip-auto-retry flag');
  assertMatch(
    background,
    /if\s*\(status\s*===\s*['"]ineligible['"]\)\s*{\s*nextEntry\.used\s*=\s*true;\s*nextEntry\.lastUsedAt\s*=\s*entry\.lastUsedAt\s*\|\|\s*Date\.now\(\);/s,
    'custom email pool ineligible entries must stay used'
  );
  assertNotMatch(
    background,
    /async function markCurrentCustomEmailPoolEntryTrialIneligible[\s\S]*?if\s*\(!isCustomEmailPoolGenerator\(state\)\)\s*{\s*return\s*{\s*updated:\s*false\s*};\s*}/,
    'custom email pool trial-ineligible marking must not depend on current generator selection'
  );
  assertMatch(
    sidepanel,
    /const restoredCustomEmailPoolEntries\s*=\s*restoreCustomEmailPoolEntriesFromState\(\{[\s\S]*?setCustomEmailPoolEntriesState\(restoredCustomEmailPoolEntries\);\s*renderCustomEmailPoolEntries\(restoredCustomEmailPoolEntries\);/,
    'custom email pool DATA_UPDATED messages must immediately re-render visible entries'
  );

  assertIncludes(upiRedeem, 'UPI_AUTO_REDEEM_REMOTE_REFRESH_INTERVAL_MS = 5000', 'auto redeem remote refresh interval');
  assertIncludes(upiRedeem, 'autoRedeemQueuedFreeCredentialsForChannel', 'main flow queued Free auto redeem');
  assertIncludes(checker, 'REDEEM_GROUP_CONTINUATION_IDLE_WAIT_MS = 5000', 'group continuation CDK refresh interval');
  assertIncludes(checker, 'disableGroupContinuation', 'controlled group continuation flag');

  assertIncludes(gitignore, 'used-*-email-password-2fa*.txt', 'sensitive used-email exports ignore rule');
  assertIncludes(gitignore, '/config.json', 'local config ignore rule');
}

function checkModuleSizeGuard() {
  readText('scripts/module-size-report.mjs');
  assertFileLineCountAtMost('sidepanel/sidepanel.js', 9800, 'sidepanel composition root growth guard');
  assertFileLineCountAtMost('sidepanel/sidepanel.css', 2500, 'sidepanel base stylesheet growth guard');
  assertFileLineCountAtMost('sidepanel/styles/settings.css', 1800, 'settings stylesheet size guard');
  assertFileLineCountAtMost('sidepanel/styles/cdk-pools.css', 500, 'CDK pools stylesheet size guard');
  assertFileLineCountAtMost('sidepanel/styles/account-records.css', 1200, 'account records stylesheet size guard');
  assertFileLineCountAtMost('sidepanel/sidepanel-ui-helpers.js', 200, 'sidepanel UI helpers size guard');
  assertFileLineCountAtMost('sidepanel/action-modal-service.js', 300, 'action modal service size guard');
  assertFileLineCountAtMost('sidepanel/workflow-button-state.js', 220, 'sidepanel workflow button state size guard');
  assertFileLineCountAtMost('sidepanel/workflow-status-display.js', 220, 'sidepanel workflow status display size guard');
	  assertFileLineCountAtMost('sidepanel/auto-run-normalizers.js', 200, 'sidepanel auto-run normalizers size guard');
	  assertFileLineCountAtMost('sidepanel/cdk-pool-state.js', 450, 'sidepanel CDK pool state size guard');
	  assertFileLineCountAtMost('sidepanel/settings-normalization.js', 280, 'sidepanel settings normalization size guard');
  assertFileLineCountAtMost('sidepanel/chatgpt-session-reader-settings.js', 380, 'ChatGPT session reader settings size guard');
  assertFileLineCountAtMost('sidepanel/upi-info-helper-state.js', 180, 'UPI info helper state size guard');
	  assertFileLineCountAtMost('sidepanel/auto-run-countdown-view.js', 250, 'sidepanel auto-run countdown view size guard');
  assertFileLineCountAtMost('sidepanel/auto-run-state.js', 280, 'sidepanel auto-run state size guard');
  assertFileLineCountAtMost('sidepanel/config-menu-controller.js', 220, 'sidepanel config menu controller size guard');
  assertFileLineCountAtMost('sidepanel/workflow-action-bindings.js', 80, 'sidepanel workflow action bindings size guard');
  assertFileLineCountAtMost('sidepanel/settings-field-bindings.js', 120, 'sidepanel settings field bindings size guard');
  assertFileLineCountAtMost('sidepanel/download-service.js', 500, 'download service size guard');
  assertFileLineCountAtMost('sidepanel/settings-transfer-manager.js', 500, 'settings transfer manager size guard');
  assertFileLineCountAtMost('sidepanel/mail-provider-state.js', 260, 'mail provider state size guard');
  assertFileLineCountAtMost('sidepanel/sidepanel-runtime-bridge.js', 140, 'sidepanel runtime bridge size guard');
  assertFileLineCountAtMost('sidepanel/cloudflare-domain-ui.js', 180, 'Cloudflare domain UI size guard');
  assertFileLineCountAtMost('sidepanel/cdk-pool-manager.js', 700, 'CDK pool manager size guard');
  assertFileLineCountAtMost('sidepanel/account-records-export.js', 180, 'account records export helper size guard');
  assertFileLineCountAtMost('sidepanel/account-records-subscription.js', 220, 'account records subscription helper size guard');
  assertFileLineCountAtMost('background.js', 15400, 'background service worker growth guard');
  assertFileLineCountAtMost('background/settings-normalizers.js', 500, 'settings normalizers size guard');
  assertFileLineCountAtMost('background/flow-definition-resolver.js', 500, 'flow definition resolver size guard');
  assertFileLineCountAtMost('background/bootstrap/auto-run-session.js', 250, 'auto-run session size guard');
  assertFileLineCountAtMost('background/bootstrap/auto-run-timer-plan.js', 260, 'auto-run timer plan size guard');
  assertFileLineCountAtMost('background/bootstrap/auto-run-status.js', 220, 'auto-run status size guard');
  assertFileLineCountAtMost('background/bootstrap/state-patch-helpers.js', 240, 'state patch helpers size guard');
  assertFileLineCountAtMost('background/bootstrap/settings-transfer.js', 380, 'settings transfer size guard');
  assertFileLineCountAtMost('background/bootstrap/content-script-registry.js', 120, 'content script registry size guard');
  assertFileLineCountAtMost('background/bootstrap/signup-executor-registry.js', 500, 'signup executor registry size guard');
  assertFileLineCountAtMost('background/bootstrap/runtime-listeners.js', 80, 'runtime listeners size guard');
  assertFileLineCountAtMost('shared/redeem-channel-state.js', 700, 'redeem channel state size guard');
  assertFileLineCountAtMost('shared/membership-credential-format.js', 900, 'membership credential format size guard');
  assertFileLineCountAtMost('background/redeem/redeem-cdkey-usage.js', 400, 'redeem CDK usage size guard');
  assertFileLineCountAtMost('content/auth-page-detectors.js', 250, 'auth page detectors size guard');
  assertFileLineCountAtMost('content/signup-dom-utils.js', 300, 'signup DOM utils size guard');
  assertFileLineCountAtMost('content/signup-entry-page.js', 400, 'signup entry page size guard');
  assertFileLineCountAtMost('content/signup-verification-page.js', 300, 'signup verification page size guard');
  assertFileLineCountAtMost('content/signup-password-page.js', 350, 'signup password page size guard');
  assertFileLineCountAtMost('content/signup-profile-page.js', 550, 'signup profile page size guard');
  assertFileLineCountAtMost('content/signup-session-page.js', 220, 'signup session page size guard');
  assertFileLineCountAtMost('content/signup-page-detector.js', 400, 'signup detector size guard');
  assertFileLineCountAtMost('content/signup-page-orchestrator.js', 300, 'signup orchestrator size guard');
  assertFileLineCountAtMost('content/signup-page.js', 7000, 'signup content script growth guard');
  assertFileLineCountAtMost('background/upi-credential-membership-checker.js', 6700, 'membership checker growth guard');
  assertFileLineCountAtMost('sidepanel/account-records-manager.js', 5600, 'account records manager growth guard');
}

function checkTrackedSourceLineWarnings() {
  const oversized = gitLines(['ls-files', ...trackedSourcePatterns])
    .filter(isTrackedSourceFile)
    .map((relativePath) => {
      const text = readText(relativePath);
      if (!text) return null;
      return {
        relativePath,
        lines: countLines(text),
      };
    })
    .filter((row) => row && row.lines > trackedSourceWarningLineLimit)
    .sort((left, right) => right.lines - left.lines || left.relativePath.localeCompare(right.relativePath));

  for (const row of oversized) {
    warn(`tracked source over ${trackedSourceWarningLineLimit} lines: ${row.relativePath} has ${row.lines} lines`);
  }
}

function checkSensitiveTrackedFiles() {
  const trackedSensitive = gitLines([
    'ls-files',
    'used-*-email-password-2fa*.txt',
    'config.json',
    'data/account-run-history.txt',
    'data/account-run-history.json',
  ]);
  if (trackedSensitive.length) {
    fail(`sensitive runtime files are tracked by git: ${trackedSensitive.join(', ')}`);
  }
}

function checkLegacyNetworkAudit() {
  const auditScript = path.join('scripts', ['audit-no', 'removed', 'network.mjs'].join('-'));
  const result = spawnSync(process.execPath, [auditScript], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.status !== 0) {
    fail(`legacy network audit failed: ${result.stderr || result.stdout}`);
  }
}

function checkPhoneSmsAudit() {
  const auditScript = path.join('scripts', ['audit-no', 'phone', 'sms.mjs'].join('-'));
  const result = spawnSync(process.execPath, [auditScript], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.status !== 0) {
    fail(`phone SMS audit failed: ${result.stderr || result.stdout}`);
  }
}

function checkDocumentationDrift() {
  const readme = readText('README.md');
  const chainDoc = readText('项目完整链路说明.md');
  const hasIdealCode = readText('background/steps/upi-redeem.js').includes("'ideal'");
  const hasAutoRedeemCode = readText('background/steps/upi-redeem.js').includes('自动提交兑换');
  if (hasIdealCode && !/IDEAL/i.test(readme)) {
    warn('README.md does not mention IDEAL, but code contains IDEAL channel support.');
  }
  if (hasAutoRedeemCode && /第 7 步不会自动兑换/.test(readme + chainDoc)) {
    warn('Docs still say step 7 does not auto redeem, but code contains main-flow auto redeem behavior.');
  }
}

checkManifest();
checkCoreFiles();
checkSyntax();
checkStaticContracts();
checkModuleSizeGuard();
checkTrackedSourceLineWarnings();
checkSensitiveTrackedFiles();
checkLegacyNetworkAudit();
checkPhoneSmsAudit();
checkDocumentationDrift();

for (const warning of warnings) {
  console.warn(`WARN ${warning}`);
}

if (failures.length) {
  for (const failure of failures) {
    console.error(`FAIL ${failure}`);
  }
  process.exit(1);
}

console.log(`PASS audit smoke checks completed with ${warnings.length} warning(s).`);
