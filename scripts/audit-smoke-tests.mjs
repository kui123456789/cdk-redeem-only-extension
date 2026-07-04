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

function assertFileLineCountAtMost(relativePath, maxLines, label) {
  const text = readText(relativePath);
  if (!text) return;
  const lines = text.split(/\r?\n/).length;
  if (lines > maxLines) {
    fail(`${label}: ${relativePath} has ${lines} lines, expected <= ${maxLines}`);
  }
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
}

function checkCoreFiles() {
  [
    'background.js',
    'background/message-router.js',
    'background/settings-normalizers.js',
    'background/flow-definition-resolver.js',
    'background/redeem/redeem-channel-state.js',
    'background/redeem/redeem-cdkey-usage.js',
    'background/steps/upi-redeem.js',
    'background/upi-credential-membership-checker.js',
    'background/verification-flow.js',
    'content/signup-dom-utils.js',
    'content/signup-entry-page.js',
    'content/signup-phone-page.js',
    'content/signup-verification-page.js',
    'content/signup-page.js',
    'sidepanel/sidepanel.html',
    'sidepanel/styles/settings.css',
    'sidepanel/styles/cdk-pools.css',
    'sidepanel/styles/account-records.css',
    'sidepanel/sidepanel-ui-helpers.js',
    'sidepanel/action-modal-service.js',
    'sidepanel/download-service.js',
    'sidepanel/settings-transfer-manager.js',
    'sidepanel/cdk-pool-manager.js',
    'sidepanel/sidepanel.js',
    'sidepanel/account-records-manager.js',
    'sidepanel/custom-email-pool-manager.js',
    'shared/session-to-json-converter.js',
  ].forEach((relativePath) => readText(relativePath));
}

function checkSyntax() {
  const files = gitLines(['ls-files', '*.js', '*.mjs']);
  for (const file of files) {
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
  const redeemChannelState = readText('background/redeem/redeem-channel-state.js');
  const redeemCdkeyUsage = readText('background/redeem/redeem-cdkey-usage.js');
  const sidepanel = readText('sidepanel/sidepanel.js');
  const sidepanelHtml = readText('sidepanel/sidepanel.html');
  const downloadService = readText('sidepanel/download-service.js');
  const settingsTransferManager = readText('sidepanel/settings-transfer-manager.js');
  const cdkPoolManager = readText('sidepanel/cdk-pool-manager.js');
  const accountRecords = readText('sidepanel/account-records-manager.js');
  const router = readText('background/message-router.js');
  const upiRedeem = readText('background/steps/upi-redeem.js');
  const checker = readText('background/upi-credential-membership-checker.js');
  const signupDomUtils = readText('content/signup-dom-utils.js');
  const signupEntryPage = readText('content/signup-entry-page.js');
  const signupPhonePage = readText('content/signup-phone-page.js');
  const signupVerificationPage = readText('content/signup-verification-page.js');
  const gitignore = readText('.gitignore');

  assertMatch(background, /autoStepDelaySeconds:\s*10\b/, 'background default settings');
  assertIncludes(sidepanel, 'const AUTO_STEP_DELAY_DEFAULT_SECONDS = 10;', 'sidepanel step delay default');
  assertIncludes(sidepanel, 'requestTextFileSaveTarget', 'sidepanel export picker support');
  assertIncludes(sidepanelHtml, 'src="download-service.js"', 'download service script load');
  assertIncludes(sidepanelHtml, 'src="settings-transfer-manager.js"', 'settings transfer manager script load');
  assertIncludes(sidepanelHtml, 'src="cdk-pool-manager.js"', 'CDK pool manager script load');
  assertIncludes(sidepanelHtml, 'href="styles/settings.css"', 'settings stylesheet load');
  assertIncludes(sidepanelHtml, 'href="styles/cdk-pools.css"', 'CDK pools stylesheet load');
  assertIncludes(sidepanelHtml, 'href="styles/account-records.css"', 'account records stylesheet load');
  assertIncludes(sidepanelHtml, 'src="sidepanel-ui-helpers.js"', 'sidepanel UI helpers script load');
  assertIncludes(sidepanelHtml, 'src="action-modal-service.js"', 'action modal service script load');
  assertIncludes(readText('sidepanel/sidepanel-ui-helpers.js'), 'createSidepanelUiHelpers', 'sidepanel UI helpers factory');
  assertIncludes(readText('sidepanel/action-modal-service.js'), 'createActionModalService', 'action modal service factory');
  assertIncludes(downloadService, 'createDownloadService', 'download service factory');
  assertIncludes(downloadService, 'chromeApi.downloads.download', 'download service browser API fallback');
  assertIncludes(settingsTransferManager, 'createSettingsTransferManager', 'settings transfer manager factory');
  assertIncludes(settingsTransferManager, "type: 'EXPORT_SETTINGS'", 'settings export route lives in transfer manager');
  assertIncludes(settingsTransferManager, "type: 'IMPORT_SETTINGS'", 'settings import route lives in transfer manager');
  assertIncludes(cdkPoolManager, 'createCdkPoolManager', 'CDK pool manager factory');
  assertIncludes(settingsTransferManager, 'multipage-settings-', 'settings export filename');
  assertIncludes(background, 'containsSensitiveRuntimeData: true', 'settings export sensitive data marker');
  assertIncludes(background, "'background/settings-normalizers.js'", 'background settings normalizers script load');
  assertIncludes(background, 'requireSettingsNormalizers()', 'background settings normalizer compatibility wrappers');
  assertIncludes(settingsNormalizers, 'createSettingsNormalizers', 'settings normalizers factory');
  assertIncludes(settingsNormalizers, 'normalizeAutoStepDelaySeconds', 'settings normalizer step delay');
  assertIncludes(settingsNormalizers, 'normalizeLocalHttpBaseUrl', 'settings normalizer URL cleanup');
  assertIncludes(background, "'background/flow-definition-resolver.js'", 'background flow resolver script load');
  assertIncludes(background, 'requireFlowDefinitionResolver()', 'background flow resolver compatibility wrappers');
  assertIncludes(flowDefinitionResolver, 'createFlowDefinitionResolver', 'flow resolver factory');
  assertIncludes(flowDefinitionResolver, 'getStepDefinitionsForState', 'flow resolver step definitions');
  assertIncludes(flowDefinitionResolver, 'getNodeDefinitionsForState', 'flow resolver node definitions');
  assertIncludes(background, "'background/redeem/redeem-channel-state.js'", 'background redeem channel state script load');
  assertIncludes(background, "'background/redeem/redeem-cdkey-usage.js'", 'background redeem CDK usage script load');
  assertIncludes(redeemChannelState, 'createRedeemChannelState', 'redeem channel state factory');
  assertIncludes(redeemChannelState, 'getRedeemChannelFailureField', 'redeem channel failure field helper');
  assertIncludes(redeemChannelState, 'isRedeemChannelDailyLimitReason', 'redeem daily-limit helper');
  assertIncludes(redeemCdkeyUsage, 'createRedeemCdkeyUsage', 'redeem CDK usage factory');
  assertIncludes(redeemCdkeyUsage, 'getUpiRedeemStateValue', 'redeem CDK legacy alias helper');
  assertIncludes(redeemCdkeyUsage, 'buildRedeemChannelUsageUpdates', 'redeem CDK usage update helper');
  assertIncludes(upiRedeem, 'getRedeemChannelStateHelpers()', 'UPI redeem channel state wrapper');
  assertIncludes(upiRedeem, 'getRedeemCdkeyUsageHelpers()', 'UPI redeem CDK usage wrapper');
  assertIncludes(checker, 'getRedeemChannelStateHelpers()', 'membership checker channel state wrapper');
  assertIncludes(checker, 'getRedeemCdkeyUsageHelpers()', 'membership checker CDK usage wrapper');
  assertIncludes(router, 'getRedeemChannelStateHelpers()', 'router channel state wrapper');
  assertIncludes(router, 'getRedeemCdkeyUsageHelpers()', 'router CDK usage wrapper');
  assertIncludes(background, "'content/signup-dom-utils.js'", 'background signup DOM utils injection');
  assertIncludes(background, "'content/signup-entry-page.js'", 'background signup entry page injection');
  assertIncludes(background, "'content/signup-phone-page.js'", 'background signup phone page injection');
  assertIncludes(background, "'content/signup-verification-page.js'", 'background signup verification page injection');
  assertIncludes(JSON.stringify(readJson('manifest.json')), 'content/signup-dom-utils.js', 'manifest signup DOM utils load');
  assertIncludes(JSON.stringify(readJson('manifest.json')), 'content/signup-entry-page.js', 'manifest signup entry page load');
  assertIncludes(JSON.stringify(readJson('manifest.json')), 'content/signup-phone-page.js', 'manifest signup phone page load');
  assertIncludes(JSON.stringify(readJson('manifest.json')), 'content/signup-verification-page.js', 'manifest signup verification page load');
  assertIncludes(signupDomUtils, 'MultiPageSignupDomUtils', 'signup DOM utils global');
  assertIncludes(signupDomUtils, 'getAssociatedInputText', 'signup DOM associated input helper');
  assertIncludes(signupEntryPage, 'MultiPageSignupEntryPage', 'signup entry page global');
  assertIncludes(signupEntryPage, 'findSignupEntryTrigger', 'signup entry trigger helper');
  assertIncludes(signupEntryPage, 'प्लान्स?', 'signup entry excludes Hindi plans/pricing');
  assertIncludes(signupPhonePage, 'MultiPageSignupPhonePage', 'signup phone page global');
  assertIncludes(signupPhonePage, 'normalizePhoneDigits', 'signup phone digit helper');
  assertIncludes(signupPhonePage, 'getSignupCountryLabelAliases', 'signup phone country alias helper');
  assertIncludes(signupVerificationPage, 'MultiPageSignupVerificationPage', 'signup verification page global');
  assertIncludes(signupVerificationPage, 'getVerificationCodeTarget', 'signup verification target helper');
  assertIncludes(signupVerificationPage, 'findResendVerificationCodeTrigger', 'signup verification resend helper');

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
  assertIncludes(
    accountRecords,
    "if (deleteStatus === 'free') {\n            setUpiCredentialMembershipPoolRows",
    'single Plus delete must not remove local backup pool rows'
  );
  assertNotMatch(
    accountRecords,
    /const credentials = getEnabledFreeUpiCredentialMembershipRows\(\);\s+if \(!credentials\.length\)/,
    'CDK import resume must not use merged UPI/IDEAL candidates'
  );
  assertIncludes(router, "case 'REFRESH_UPI_REDEEM_CDKEY_STATUSES'", 'remote CDK status refresh route');
  assertIncludes(router, 'skipAutoRetry', 'remote refresh skip-auto-retry flag');

  assertIncludes(upiRedeem, 'UPI_AUTO_REDEEM_REMOTE_REFRESH_INTERVAL_MS = 5000', 'auto redeem remote refresh interval');
  assertIncludes(upiRedeem, 'autoRedeemQueuedFreeCredentialsForChannel', 'main flow queued Free auto redeem');
  assertIncludes(checker, 'REDEEM_GROUP_CONTINUATION_IDLE_WAIT_MS = 5000', 'group continuation CDK refresh interval');
  assertIncludes(checker, 'disableGroupContinuation', 'controlled group continuation flag');

  assertIncludes(gitignore, 'used-*-email-password-2fa*.txt', 'sensitive used-email exports ignore rule');
  assertIncludes(gitignore, '/config.json', 'local config ignore rule');
}

function checkModuleSizeGuard() {
  readText('scripts/module-size-report.mjs');
  assertFileLineCountAtMost('sidepanel/sidepanel.js', 26000, 'sidepanel composition root growth guard');
  assertFileLineCountAtMost('sidepanel/sidepanel.css', 2500, 'sidepanel base stylesheet growth guard');
  assertFileLineCountAtMost('sidepanel/styles/settings.css', 1800, 'settings stylesheet size guard');
  assertFileLineCountAtMost('sidepanel/styles/cdk-pools.css', 500, 'CDK pools stylesheet size guard');
  assertFileLineCountAtMost('sidepanel/styles/account-records.css', 1200, 'account records stylesheet size guard');
  assertFileLineCountAtMost('sidepanel/sidepanel-ui-helpers.js', 200, 'sidepanel UI helpers size guard');
  assertFileLineCountAtMost('sidepanel/action-modal-service.js', 300, 'action modal service size guard');
  assertFileLineCountAtMost('sidepanel/download-service.js', 500, 'download service size guard');
  assertFileLineCountAtMost('sidepanel/settings-transfer-manager.js', 500, 'settings transfer manager size guard');
  assertFileLineCountAtMost('sidepanel/cdk-pool-manager.js', 700, 'CDK pool manager size guard');
  assertFileLineCountAtMost('background.js', 20000, 'background service worker growth guard');
  assertFileLineCountAtMost('background/settings-normalizers.js', 500, 'settings normalizers size guard');
  assertFileLineCountAtMost('background/flow-definition-resolver.js', 500, 'flow definition resolver size guard');
  assertFileLineCountAtMost('background/redeem/redeem-channel-state.js', 300, 'redeem channel state size guard');
  assertFileLineCountAtMost('background/redeem/redeem-cdkey-usage.js', 400, 'redeem CDK usage size guard');
  assertFileLineCountAtMost('content/signup-dom-utils.js', 300, 'signup DOM utils size guard');
  assertFileLineCountAtMost('content/signup-entry-page.js', 400, 'signup entry page size guard');
  assertFileLineCountAtMost('content/signup-phone-page.js', 400, 'signup phone page size guard');
  assertFileLineCountAtMost('content/signup-verification-page.js', 300, 'signup verification page size guard');
  assertFileLineCountAtMost('content/signup-page.js', 10000, 'signup content script growth guard');
  assertFileLineCountAtMost('background/upi-credential-membership-checker.js', 7000, 'membership checker growth guard');
  assertFileLineCountAtMost('sidepanel/account-records-manager.js', 5600, 'account records manager growth guard');
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
checkSensitiveTrackedFiles();
checkLegacyNetworkAudit();
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
