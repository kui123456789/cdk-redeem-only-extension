// content/signup-page.js — Content script for ChatGPT signup entry + OpenAI auth pages
// Injected on: auth0.openai.com, auth.openai.com, accounts.openai.com
// Dynamically injected on: chatgpt.com

console.log('[MultiPage:signup-page] Content script loaded on', location.href);

const SIGNUP_PAGE_LISTENER_SENTINEL = 'data-multipage-signup-page-listener';
const CHATGPT_SESSION_API_URL = 'https://chatgpt.com/api/auth/session';

function getOperationDelayRunner() {
  const rootScope = typeof window !== 'undefined' ? window : globalThis;
  const gate = rootScope?.CodexOperationDelay?.performOperationWithDelay;
  return typeof gate === 'function'
    ? gate
    : async (_metadata, operation) => operation();
}

function getAuthPageDetectors() {
  const rootScope = typeof self !== 'undefined' ? self : window;
  return rootScope.MultiPageAuthPageDetectors || {};
}

if (document.documentElement.getAttribute(SIGNUP_PAGE_LISTENER_SENTINEL) !== '1') {
  document.documentElement.setAttribute(SIGNUP_PAGE_LISTENER_SENTINEL, '1');

  // Listen for commands from Background
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (
      message.type === 'EXECUTE_NODE'
      || message.type === 'FILL_CODE'
      || message.type === 'STEP8_FIND_AND_CLICK'
      || message.type === 'STEP8_GET_STATE'
      || message.type === 'STEP8_TRIGGER_CONTINUE'
      || message.type === 'GET_LOGIN_AUTH_STATE'
      || message.type === 'SUBMIT_ADD_EMAIL'
      || message.type === 'GET_STEP5_SUBMIT_STATE'
      || message.type === 'GET_SIGNUP_VERIFICATION_POST_SUBMIT_STATE'
      || message.type === 'SKIP_CREATE_ACCOUNT_ENROLL_PASSKEY'
      || message.type === 'PREPARE_SIGNUP_VERIFICATION'
      || message.type === 'RECOVER_AUTH_RETRY_PAGE'
      || message.type === 'RECOVER_STEP5_SUBMIT_RETRY_PAGE'
      || message.type === 'TRIGGER_STEP5_PROFILE_SUBMIT'
      || message.type === 'RESEND_VERIFICATION_CODE'
      || message.type === 'ENSURE_SIGNUP_ENTRY_READY'
      || message.type === 'ENSURE_SIGNUP_PASSWORD_PAGE_READY'
      || message.type === 'START_SET_GPT_PASSWORD_RESET'
      || message.type === 'PREPARE_SET_GPT_PASSWORD'
      || message.type === 'SUBMIT_SET_GPT_PASSWORD_CODE'
      || message.type === 'SET_GPT_PASSWORD'
      || message.type === 'GET_SET_GPT_PASSWORD_STATE'
      || message.type === 'RECOVER_SET_GPT_PASSWORD_AUTH_RETRY_PAGE'
      || message.type === 'READ_CHATGPT_SESSION_EXPORT_DATA'
    ) {
      resetStopState();
      const membershipAuthCommand = isMembershipCheckAuthPayload(message.payload);
      const reportedStep = membershipAuthCommand ? null : (Number(message.payload?.visibleStep) || message.step);
      const reportedNodeId = resolveCommandNodeId(message);
      if (message.type === 'EXECUTE_NODE' && reportedNodeId === 'fill-profile') {
        Promise.resolve()
          .then(() => handleCommand(message))
          .then((result) => {
            if (result?.skipProfileStep || result?.prefilled) {
              reportComplete(reportedNodeId || reportedStep, result);
            }
          })
          .catch((err) => {
            if (isStopError(err)) {
              if (reportedStep) {
                log(`步骤 ${reportedStep || 5}：已被用户停止。`, 'warn');
              }
              reportError(reportedNodeId || reportedStep, err.message);
              return;
            }
            reportError(reportedNodeId || reportedStep, err.message);
          });
        sendResponse({ ok: true, accepted: true, asyncCompletion: true, nodeId: reportedNodeId });
        return;
      }
      handleCommand(message).then((result) => {
        sendResponse({ ok: true, ...(result || {}) });
      }).catch(err => {
        if (isStopError(err)) {
          if (reportedStep) {
            log(`步骤 ${reportedStep || 8}：已被用户停止。`, 'warn');
          }
          sendResponse({ stopped: true, error: err.message });
          return;
        }

        if (message.type === 'STEP8_FIND_AND_CLICK') {
          log(err.message, 'error', { step: reportedStep || 9, stepKey: 'confirm-oauth' });
          sendResponse({ error: err.message });
          return;
        }

        if (reportedStep) {
          reportError(reportedNodeId || reportedStep, err.message);
        }
        sendResponse({ error: err.message });
      });
      return true;
    }
  });
} else {
  console.log('[MultiPage:signup-page] 消息监听已存在，跳过重复注册');
}

const SIGNUP_PAGE_NODE_HANDLERS = Object.freeze({
  'submit-signup-email': (payload) => step2_clickRegister(payload),
  'fill-password': (payload) => step3_fillEmailPassword(payload),
  'fill-profile': (payload) => step5_fillNameBirthday(payload),
  'oauth-login': (payload) => step6_login(payload),
  'confirm-oauth': (_payload) => step8_findAndClick(),
});

let signupPageOrchestrator = null;

function getSignupPageOrchestrator() {
  if (signupPageOrchestrator) {
    return signupPageOrchestrator;
  }
  const rootScope = typeof self !== 'undefined' ? self : window;
  const createSignupPageOrchestrator = rootScope.MultiPageSignupPageOrchestrator?.createSignupPageOrchestrator
    || rootScope.SignupPageOrchestrator?.createSignupPageOrchestrator
    || rootScope.SignupPageOrchestrator?.create;
  if (typeof createSignupPageOrchestrator !== 'function') {
    throw new Error('signup-page-orchestrator.js 未加载，无法处理认证页命令。');
  }
  signupPageOrchestrator = createSignupPageOrchestrator({
    nodeHandlers: SIGNUP_PAGE_NODE_HANDLERS,
    fillVerificationCode,
    serializeLoginAuthState,
    inspectLoginAuthState,
    submitAddEmailAndContinue,
    getStep5SubmitState,
    getSignupVerificationPostSubmitState,
    skipCreateAccountEnrollPasskey,
    prepareSignupVerificationFlow,
    recoverCurrentAuthRetryPage,
    recoverStep5SubmitRetryPage,
    triggerStep5ProfileSubmit,
    resendVerificationCode,
    ensureSignupEntryReady,
    ensureSignupPasswordPageReady,
    startSetGptPasswordResetFlow,
    prepareSetGptPasswordFlow,
    submitSetGptPasswordVerificationCode,
    setGptPasswordOnResetPage,
    getSetGptPasswordPageState,
    recoverSetGptPasswordAuthRetryPage,
    readChatGptSessionExportData,
    step8FindAndClick: step8_findAndClick,
    getStep8State,
    step8TriggerContinue: step8_triggerContinue,
    log,
  });
  return signupPageOrchestrator;
}

function resolveCommandNodeId(message = {}) {
  return getSignupPageOrchestrator().resolveCommandNodeId(message);
}

async function handleCommand(message) {
  return await getSignupPageOrchestrator().handleCommand(message);
}

function resolveVisibleStep(payload = {}, fallback = 0) {
  return getSignupPageOrchestrator().resolveVisibleStep(payload, fallback);
}

function stepLog(step, message, level = 'info', stepKey = '') {
  return getSignupPageOrchestrator().stepLog(step, message, level, stepKey);
}

function isMembershipCheckAuthPayload(payload = {}) {
  return getSignupPageOrchestrator().isMembershipCheckAuthPayload(payload);
}

function getMembershipAuthLogLabel(payload = {}) {
  return getSignupPageOrchestrator().getMembershipAuthLogLabel(payload);
}

function formatMembershipAuthLogMessage(payload = {}, message = '') {
  return getSignupPageOrchestrator().formatMembershipAuthLogMessage(payload, message);
}

function getOAuthLoginLogOptions(payload = {}, visibleStep = 7) {
  return getSignupPageOrchestrator().getOAuthLoginLogOptions(payload, visibleStep);
}

function logOAuthLogin(payload = {}, visibleStep = 7, message = '', level = 'info') {
  return getSignupPageOrchestrator().logOAuthLogin(payload, visibleStep, message, level);
}

function logVerificationCode(step, payload = {}, message = '', level = 'info') {
  return getSignupPageOrchestrator().logVerificationCode(step, payload, message, level);
}

function requireSignupPageDetectorModule() {
  const rootScope = typeof self !== 'undefined' ? self : window;
  const detectorModule = rootScope.MultiPageSignupPageDetector || rootScope.SignupPageDetector;
  if (!detectorModule?.createSignupPageDetector) {
    throw new Error('signup-page-detector.js 未加载，无法识别认证页状态。');
  }
  return detectorModule;
}

const SIGNUP_PAGE_DETECTOR_CONSTANTS = requireSignupPageDetectorModule().constants;
const VERIFICATION_CODE_INPUT_SELECTOR = SIGNUP_PAGE_DETECTOR_CONSTANTS.VERIFICATION_CODE_INPUT_SELECTOR;
const ONE_TIME_CODE_LOGIN_PATTERN = SIGNUP_PAGE_DETECTOR_CONSTANTS.ONE_TIME_CODE_LOGIN_PATTERN;
const HINDI_LOGIN_ENTRY_PATTERN = SIGNUP_PAGE_DETECTOR_CONSTANTS.HINDI_LOGIN_ENTRY_PATTERN;
const LOGIN_ENTRY_ACTION_PATTERN = SIGNUP_PAGE_DETECTOR_CONSTANTS.LOGIN_ENTRY_ACTION_PATTERN;
const LOGIN_MORE_OPTIONS_PATTERN = SIGNUP_PAGE_DETECTOR_CONSTANTS.LOGIN_MORE_OPTIONS_PATTERN;
const LOGIN_EXTERNAL_IDP_PATTERN = SIGNUP_PAGE_DETECTOR_CONSTANTS.LOGIN_EXTERNAL_IDP_PATTERN;
const LOGIN_CODE_ONLY_ACTION_PATTERN = SIGNUP_PAGE_DETECTOR_CONSTANTS.LOGIN_CODE_ONLY_ACTION_PATTERN;
const LOGIN_TOTP_VERIFICATION_PATTERN = SIGNUP_PAGE_DETECTOR_CONSTANTS.LOGIN_TOTP_VERIFICATION_PATTERN;
const LOGIN_EMAIL_VERIFICATION_PATTERN = SIGNUP_PAGE_DETECTOR_CONSTANTS.LOGIN_EMAIL_VERIFICATION_PATTERN;
const RESEND_VERIFICATION_CODE_PATTERN = SIGNUP_PAGE_DETECTOR_CONSTANTS.RESEND_VERIFICATION_CODE_PATTERN;
const INVALID_VERIFICATION_CODE_PATTERN = SIGNUP_PAGE_DETECTOR_CONSTANTS.INVALID_VERIFICATION_CODE_PATTERN;
const EMAIL_ALREADY_VERIFIED_PATTERN = SIGNUP_PAGE_DETECTOR_CONSTANTS.EMAIL_ALREADY_VERIFIED_PATTERN;
const VERIFICATION_PAGE_PATTERN = SIGNUP_PAGE_DETECTOR_CONSTANTS.VERIFICATION_PAGE_PATTERN;
const OAUTH_CONSENT_PAGE_PATTERN = SIGNUP_PAGE_DETECTOR_CONSTANTS.OAUTH_CONSENT_PAGE_PATTERN;
const OAUTH_CONSENT_FORM_SELECTOR = SIGNUP_PAGE_DETECTOR_CONSTANTS.OAUTH_CONSENT_FORM_SELECTOR;
const CONTINUE_ACTION_PATTERN = SIGNUP_PAGE_DETECTOR_CONSTANTS.CONTINUE_ACTION_PATTERN;
const ADD_EMAIL_PAGE_PATTERN = SIGNUP_PAGE_DETECTOR_CONSTANTS.ADD_EMAIL_PAGE_PATTERN;
const STEP6_PASSWORD_SUBMIT_TRANSITION_TIMEOUT_MS = 30000;

function getSignupDomUtils() {
  const rootScope = typeof self !== 'undefined' ? self : window;
  return rootScope.MultiPageSignupDomUtils || {};
}

let signupVerificationPageHelpers = null;

function getSignupVerificationPageHelpers() {
  if (signupVerificationPageHelpers) {
    return signupVerificationPageHelpers;
  }
  const rootScope = typeof self !== 'undefined' ? self : window;
  signupVerificationPageHelpers = rootScope.MultiPageSignupVerificationPage?.createSignupVerificationPage?.({
    documentRef: document,
    locationRef: location,
    verificationCodeInputSelector: VERIFICATION_CODE_INPUT_SELECTOR,
    loginTotpVerificationPattern: LOGIN_TOTP_VERIFICATION_PATTERN,
    oneTimeCodeLoginPattern: ONE_TIME_CODE_LOGIN_PATTERN,
    resendVerificationCodePattern: RESEND_VERIFICATION_CODE_PATTERN,
    invalidVerificationCodePattern: INVALID_VERIFICATION_CODE_PATTERN,
    isVisibleElement,
    isActionEnabled,
    getActionText,
    getAssociatedInputText,
    getPageTextSnapshot,
  }) || {};
  return signupVerificationPageHelpers;
}

let signupPageDetector = null;

function getSignupPageDetector() {
  if (signupPageDetector) {
    return signupPageDetector;
  }
  signupPageDetector = requireSignupPageDetectorModule().createSignupPageDetector({
    documentRef: document,
    locationRef: location,
    getSignupDomUtils,
    getSignupVerificationPageHelpers,
  });
  return signupPageDetector;
}

function isVisibleElement(el) {
  return getSignupPageDetector().isVisibleElement(el);
}

function getVisibleSplitVerificationInputs() {
  return getSignupPageDetector().getVisibleSplitVerificationInputs();
}

function getAssociatedInputText(input) {
  return getSignupPageDetector().getAssociatedInputText(input);
}

function getFallbackVerificationCodeInput() {
  return getSignupPageDetector().getFallbackVerificationCodeInput();
}

function getVerificationCodeTarget() {
  return getSignupPageDetector().getVerificationCodeTarget();
}

function getLoginVerificationKind() {
  return getSignupPageDetector().getLoginVerificationKind();
}

function getActionText(el) {
  return getSignupPageDetector().getActionText(el);
}

function isActionEnabled(el) {
  return getSignupPageDetector().isActionEnabled(el);
}

function findOneTimeCodeLoginTrigger() {
  return getSignupPageDetector().findOneTimeCodeLoginTrigger();
}

function findResendVerificationCodeTrigger({ allowDisabled = false } = {}) {
  return getSignupPageDetector().findResendVerificationCodeTrigger({ allowDisabled });
}

function isEmailVerificationPage() {
  return getSignupPageDetector().isEmailVerificationPage();
}

function getContactVerificationServerErrorText() {
  return getSignupPageDetector().getContactVerificationServerErrorText();
}

function throwIfContactVerificationServerError() {
  return getSignupPageDetector().throwIfContactVerificationServerError();
}

async function resendVerificationCode(step, timeout = 45000, options = {}) {
  const performOperationWithDelay = typeof getOperationDelayRunner === 'function'
    ? getOperationDelayRunner()
    : async (metadata, operation) => {
        const rootScope = typeof window !== 'undefined' ? window : globalThis;
        const gate = rootScope?.CodexOperationDelay?.performOperationWithDelay;
        return typeof gate === 'function' ? gate(metadata, operation) : operation();
      };
  if (step === 6 || options?.nodeId === 'set-gpt-password') {
    const snapshot = await waitForSetGptPasswordInteractiveReady(
      step,
      `步骤 ${step}：设置 GPT 密码邮箱验证码页`,
      15000,
      ['email_verification_page', 'new_password_page', 'email_already_verified_page']
    );
    if (snapshot.state === 'new_password_page') {
      return {
        resent: false,
        codeStageComplete: true,
        alreadyOnNewPasswordPage: true,
        url: snapshot.url || location.href,
      };
    }
    if (snapshot.state === 'email_already_verified_page') {
      return {
        resent: false,
        codeStageComplete: true,
        emailAlreadyVerified: true,
        requiresNewPasswordNavigation: true,
        url: snapshot.url || location.href,
      };
    }
  } else if (step === 8) {
    await waitForLoginVerificationPageReady(10000, step);
  }

  const start = Date.now();
  let action = null;
  let loggedWaiting = false;

  while (Date.now() - start < timeout) {
    throwIfStopped();
    throwIfContactVerificationServerError();

    // Check for 405 error page and recover by clicking "Try again"
    if (is405MethodNotAllowedPage()) {
      await handle405ResendError(step, timeout - (Date.now() - start));
      // After recovery, loop back to find the resend button again
      loggedWaiting = false;
      continue;
    }

    action = findResendVerificationCodeTrigger({ allowDisabled: true });

    if (action && isActionEnabled(action)) {
      log(`步骤 ${step}：重新发送验证码按钮已可用。`);
      await humanPause(350, 900);
      const stepKey = step === 6
        ? 'set-gpt-password'
        : (step === 8 ? 'oauth-login' : 'fetch-signup-code');
      await performOperationWithDelay({ stepKey, kind: 'click', label: 'resend-verification-code' }, async () => {
        simulateClick(action);
      });
      await sleep(1200);

      // After clicking resend, check if 405 error appeared
      if (is405MethodNotAllowedPage()) {
        log(`步骤 ${step}：点击重新发送后出现 405 错误，正在恢复...`, 'warn');
        await handle405ResendError(step, timeout - (Date.now() - start));
        loggedWaiting = false;
        continue;
      }
      throwIfContactVerificationServerError();

      return {
        resent: true,
        buttonText: getActionText(action),
      };
    }

    if (action && !loggedWaiting) {
      loggedWaiting = true;
      log(`步骤 ${step}：正在等待重新发送验证码按钮变为可点击...`);
    }

    await sleep(250);
  }

  throwIfContactVerificationServerError();
  throw new Error('无法点击重新发送验证码按钮。URL: ' + location.href);
}

async function readChatGptSessionExportData() {
  const helper = getSignupSessionPageHelpers().readChatGptSessionExportData;
  if (typeof helper === 'function') {
    return await helper();
  }

  const sessionResponse = await fetch(CHATGPT_SESSION_API_URL, {
    credentials: 'include',
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
  });
  if (!sessionResponse.ok) {
    throw new Error(`读取 ChatGPT 会话失败（HTTP ${sessionResponse.status}）。`);
  }

  const session = await sessionResponse.json().catch(() => ({}));
  const accessToken = String(session?.accessToken || session?.access_token || '').trim();
  if (!session || typeof session !== 'object' || Array.isArray(session) || !Object.keys(session).length) {
    throw new Error('当前页面未返回可用 ChatGPT session，无法导出登录态。');
  }

  return {
    session,
    accessToken,
    email: String(session?.user?.email || '').trim(),
    expiresAt: session?.expires || '',
  };
}

function is405MethodNotAllowedPage() {
  const pageText = document.body?.textContent || '';
  return AUTH_ROUTE_ERROR_PATTERN.test(pageText);
}

function getStep405RecoveryStateKey(step) {
  return `__MULTIPAGE_STEP_${Number(step) || '?'}_405_RECOVERY_COUNT__`;
}

function getStep405StorageScope() {
  if (typeof window !== 'undefined' && window) {
    return window;
  }
  if (typeof globalThis !== 'undefined' && globalThis) {
    return globalThis;
  }
  return {};
}

function getStep405RecoveryLimit(step) {
  if (Number(step) !== 4) {
    return 0;
  }
  return typeof STEP4_405_RECOVERY_LIMIT !== 'undefined'
    ? STEP4_405_RECOVERY_LIMIT
    : 3;
}

function getStep405RecoveryErrorPrefix(step) {
  if (Number(step) !== 4) {
    return '';
  }
  return typeof STEP4_405_RECOVERY_ERROR_PREFIX !== 'undefined'
    ? STEP4_405_RECOVERY_ERROR_PREFIX
    : 'STEP4_405_RECOVERY_LIMIT::';
}

function getStep405RecoveryCount(step) {
  const key = getStep405RecoveryStateKey(step);
  let value = '';
  try {
    if (typeof sessionStorage !== 'undefined' && sessionStorage?.getItem) {
      value = sessionStorage.getItem(key) || '';
    }
  } catch {}
  if (!value) {
    value = getStep405StorageScope()[key];
  }
  return Math.max(0, Math.floor(Number(value) || 0));
}

function setStep405RecoveryCount(step, count) {
  const key = getStep405RecoveryStateKey(step);
  const value = String(Math.max(0, Math.floor(Number(count) || 0)));
  try {
    if (typeof sessionStorage !== 'undefined' && sessionStorage?.setItem) {
      sessionStorage.setItem(key, value);
    }
  } catch {}
  getStep405StorageScope()[key] = value;
}

function clearStep405RecoveryCount(step) {
  const key = getStep405RecoveryStateKey(step);
  try {
    if (typeof sessionStorage !== 'undefined' && sessionStorage?.removeItem) {
      sessionStorage.removeItem(key);
    }
  } catch {}
  try {
    delete getStep405StorageScope()[key];
  } catch {}
}

function createStep405RecoveryLimitError(step, count) {
  const normalizedStep = Number(step) || step || '?';
  const limit = getStep405RecoveryLimit(normalizedStep) || count;
  const message = `步骤 ${normalizedStep}：检测到 405 错误页面，已连续点击“重试”恢复 ${count}/${limit} 次仍未恢复，当前轮将结束并进入下一轮。URL: ${location.href}`;
  return new Error(`${getStep405RecoveryErrorPrefix(normalizedStep)}${message}`);
}

async function handle405ResendError(step, remainingTimeout = 30000, payload = {}) {
  const currentCount = getStep405RecoveryCount(step);
  if (Number(step) === 4 && currentCount >= getStep405RecoveryLimit(step)) {
    throw createStep405RecoveryLimitError(step, currentCount);
  }

  const nextCount = currentCount + 1;
  setStep405RecoveryCount(step, nextCount);
  const maxClickAttempts = Number(step) === 4 ? 1 : 5;
  const membershipAuthLog = Number(step) === 8 && isMembershipCheckAuthPayload(payload);
  await recoverCurrentAuthRetryPage({
    logLabel: membershipAuthLog
      ? formatMembershipAuthLogMessage(payload, '检测到 405 错误页面，正在点击“重试”恢复')
      : (
          Number(step) === 4
            ? `步骤 ${step}：检测到 405 错误页面，正在点击“重试”恢复（总计 ${nextCount}/${getStep405RecoveryLimit(step)}）`
            : `步骤 ${step}：检测到 405 错误页面，正在点击“重试”恢复`
        ),
    maxClickAttempts,
    pathPatterns: [],
    step: membershipAuthLog ? null : step,
    timeoutMs: Math.max(1000, remainingTimeout),
  });
  if (is405MethodNotAllowedPage()) {
    throw createStep405RecoveryLimitError(step, nextCount);
  }
  if (typeof clearStep405RecoveryCount === 'function') clearStep405RecoveryCount(step);
  logVerificationCode(step, payload, `步骤 ${step}：405 错误已恢复，页面已返回验证码页面。`);
}

// ============================================================
// Signup Entry Helpers
// ============================================================

let signupEntryPageHelpers = null;

function getSignupEntryPageHelpers() {
  if (signupEntryPageHelpers) {
    return signupEntryPageHelpers;
  }
  const rootScope = typeof self !== 'undefined' ? self : window;
  signupEntryPageHelpers = rootScope.MultiPageSignupEntryPage?.createSignupEntryPage?.({
    documentRef: document,
    windowRef: window,
    isVisibleElement,
    isActionEnabled,
    getActionText,
    getPageTextSnapshot,
  }) || {};
  return signupEntryPageHelpers;
}

function getSignupEmailInput() {
  return getSignupEntryPageHelpers().getSignupEmailInput?.() || null;
}

function findSignupUseEmailTrigger() {
  return getSignupEntryPageHelpers().findSignupUseEmailTrigger?.() || null;
}

function findSignupMoreOptionsTrigger() {
  return getSignupEntryPageHelpers().findSignupMoreOptionsTrigger?.() || null;
}

function getSignupEmailContinueButton({ allowDisabled = false } = {}) {
  return getSignupEntryPageHelpers().getSignupEmailContinueButton?.({ allowDisabled }) || null;
}

function isExcludedSignupEntryActionText(text = '') {
  const detector = getAuthPageDetectors().isExcludedSignupEntryText;
  if (typeof detector === 'function') {
    return Boolean(detector(text));
  }
  return Boolean(getSignupEntryPageHelpers().isExcludedSignupEntryActionText?.(text));
}

function isSignupEntryTriggerText(text = '') {
  const detector = getAuthPageDetectors().isSignupEntryText;
  if (typeof detector === 'function') {
    return Boolean(detector(text));
  }
  return Boolean(getSignupEntryPageHelpers().isSignupEntryTriggerText?.(text));
}

function isSignupAuthEntryTriggerText(text = '') {
  const detectors = getAuthPageDetectors();
  if (typeof detectors.isSignupEntryText === 'function' || typeof detectors.isLoginEntryText === 'function') {
    return Boolean(detectors.isSignupEntryText?.(text) || detectors.isLoginEntryText?.(text));
  }
  return Boolean(getSignupEntryPageHelpers().isSignupAuthEntryTriggerText?.(text));
}

function isHindiLoginEntryText(text = '') {
  const detector = getAuthPageDetectors().isHindiLoginEntryText || getAuthPageDetectors().isLoginEntryText;
  if (typeof detector === 'function') {
    return Boolean(detector(text));
  }
  return Boolean(getSignupEntryPageHelpers().isHindiLoginEntryText?.(text));
}

function findSignupEntryTrigger(options = {}) {
  return getSignupEntryPageHelpers().findSignupEntryTrigger?.(options) || null;
}

let signupPasswordPageHelpers = null;

function getSignupPasswordPageHelpers() {
  if (signupPasswordPageHelpers) {
    return signupPasswordPageHelpers;
  }
  const rootScope = typeof self !== 'undefined' ? self : window;
  signupPasswordPageHelpers = rootScope.MultiPageSignupPasswordPage?.createSignupPasswordPage?.({
    documentRef: document,
    locationRef: location,
    windowRef: window,
    isVisibleElement,
    isActionEnabled,
    getActionText,
    getVisibleFieldErrorText,
    inspectSignupEntryState,
    logSignupPasswordDiagnostics,
    findOneTimeCodeLoginTrigger,
    waitForElementByText,
    fillInput,
    getOperationDelayRunner,
    humanPause,
    simulateClick,
    sleep,
    throwIfStopped,
    isStopError,
    log,
  }) || {};
  return signupPasswordPageHelpers;
}

let signupProfilePageHelpers = null;

function getSignupProfilePageHelpers() {
  if (signupProfilePageHelpers) {
    return signupProfilePageHelpers;
  }
  const rootScope = typeof self !== 'undefined' ? self : window;
  signupProfilePageHelpers = rootScope.MultiPageSignupProfilePage?.createSignupProfilePage?.({
    documentRef: document,
    locationRef: location,
    windowRef: window,
    step5SubmitErrorPattern: STEP5_SUBMIT_ERROR_PATTERN,
    isVisibleElement,
    isActionEnabled,
    getActionText,
    getStep5AuthRetryPageState,
    isAuthMaxCheckAttemptsPage,
    getStep5PostSubmitSuccessState,
    getCreateAccountEnrollPasskeyPageState,
    fillProfileNameAndBirthday: fillStep5NameBirthdayLocally,
    humanPause,
    simulateClick,
    sleep,
    throwIfStopped,
    log,
  }) || {};
  return signupProfilePageHelpers;
}

let signupSessionPageHelpers = null;

function getSignupSessionPageHelpers() {
  if (signupSessionPageHelpers) {
    return signupSessionPageHelpers;
  }
  const rootScope = typeof self !== 'undefined' ? self : window;
  signupSessionPageHelpers = rootScope.MultiPageSignupSessionPage?.createSignupSessionPage?.({
    documentRef: document,
    locationRef: location,
    fetchRef: typeof fetch === 'function' ? fetch.bind(rootScope) : null,
    sessionApiUrl: CHATGPT_SESSION_API_URL,
    findSignupEntryTrigger,
    getActionText,
    isVisibleElement,
    isActionEnabled,
  }) || {};
  return signupSessionPageHelpers;
}

function getSignupPasswordDisplayedEmail() {
  const helper = getSignupPasswordPageHelpers().getSignupPasswordDisplayedEmail;
  if (typeof helper === 'function') {
    return helper();
  }

  const text = (document.body?.innerText || document.body?.textContent || '')
    .replace(/\s+/g, ' ')
    .trim();
  const matches = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/ig);
  return matches?.[0] ? String(matches[0]).trim().toLowerCase() : '';
}

function inspectSignupEntryState() {
  const passwordInput = getSignupPasswordInput();
  if (isSignupPasswordPage() && passwordInput) {
    return {
      state: 'password_page',
      passwordInput,
      submitButton: getSignupPasswordSubmitButton({ allowDisabled: true }),
      displayedEmail: getSignupPasswordDisplayedEmail(),
      passwordErrorText: getSignupPasswordFieldErrorText(),
      url: location.href,
    };
  }

  const emailInput = getSignupEmailInput();
  if (emailInput) {
    return {
      state: 'email_entry',
      emailInput,
      continueButton: getSignupEmailContinueButton({ allowDisabled: true }),
      url: location.href,
    };
  }

  const postVerificationState = typeof getStep4PostVerificationState === 'function'
    ? getStep4PostVerificationState()
    : null;
  if (postVerificationState?.state === 'step5') {
    return {
      state: 'profile_page',
      url: postVerificationState.url || location.href,
    };
  }

  if (postVerificationState?.state === 'logged_in_home') {
    return {
      state: 'logged_in_home',
      skipProfileStep: true,
      url: postVerificationState.url || location.href,
    };
  }

  if (typeof isVerificationPageStillVisible === 'function' && isVerificationPageStillVisible()) {
    return {
      state: 'verification_page',
      verificationTarget: typeof getVerificationCodeTarget === 'function' ? getVerificationCodeTarget() : null,
      url: location.href,
    };
  }

  const signupTrigger = findSignupEntryTrigger();
  if (signupTrigger) {
    return {
      state: 'entry_home',
      signupTrigger,
      url: location.href,
    };
  }

  const switchToEmailTrigger = findSignupUseEmailTrigger();
  if (switchToEmailTrigger) {
    return {
      state: 'email_choice_entry',
      switchToEmailTrigger,
      url: location.href,
    };
  }

  return {
    state: 'unknown',
    url: location.href,
  };
}

function getSignupEntryStateSummary(snapshot = inspectSignupEntryState()) {
  const summary = {
    state: snapshot?.state || 'unknown',
    url: snapshot?.url || location.href,
    hasEmailInput: Boolean(snapshot?.emailInput || getSignupEmailInput()),
    hasPasswordInput: Boolean(snapshot?.passwordInput || getSignupPasswordInput()),
  };

  if (snapshot?.displayedEmail) {
    summary.displayedEmail = snapshot.displayedEmail;
  }
  if (snapshot?.signupTrigger) {
    summary.signupTrigger = {
      tag: (snapshot.signupTrigger.tagName || '').toLowerCase(),
      text: getActionText(snapshot.signupTrigger).slice(0, 80),
      visible: isVisibleElement(snapshot.signupTrigger),
    };
  }

  if (snapshot?.continueButton) {
    summary.continueButton = {
      tag: (snapshot.continueButton.tagName || '').toLowerCase(),
      text: getActionText(snapshot.continueButton).slice(0, 80),
      enabled: isActionEnabled(snapshot.continueButton),
    };
  }

  if (snapshot?.switchToEmailTrigger) {
    summary.switchToEmailTrigger = {
      tag: (snapshot.switchToEmailTrigger.tagName || '').toLowerCase(),
      text: getActionText(snapshot.switchToEmailTrigger).slice(0, 80),
      enabled: isActionEnabled(snapshot.switchToEmailTrigger),
    };
  }

  return summary;
}

function getSignupEntryDiagnostics() {
  const view = typeof window !== 'undefined' ? window : globalThis;
  const safeGetComputedStyle = (el) => {
    if (!el || typeof view?.getComputedStyle !== 'function') {
      return null;
    }
    try {
      return view.getComputedStyle(el);
    } catch {
      return null;
    }
  };
  const buildRectSummary = (el) => {
    const rect = typeof el?.getBoundingClientRect === 'function'
      ? el.getBoundingClientRect()
      : null;
    return rect
      ? {
          width: Math.round(rect.width || 0),
          height: Math.round(rect.height || 0),
        }
      : null;
  };
  const buildVisibilityMeta = (el) => {
    const style = safeGetComputedStyle(el);
    return {
      className: String(el?.className || '').slice(0, 200),
      hidden: Boolean(el?.hidden),
      ariaHidden: el?.getAttribute?.('aria-hidden') || '',
      inert: typeof el?.hasAttribute === 'function' ? el.hasAttribute('inert') : false,
      display: style?.display || '',
      visibility: style?.visibility || '',
      opacity: style?.opacity || '',
      pointerEvents: style?.pointerEvents || '',
    };
  };
  const findBlockingAncestor = (el) => {
    let current = el?.parentElement || null;
    while (current) {
      const style = safeGetComputedStyle(current);
      const rect = buildRectSummary(current);
      const hidden = Boolean(current.hidden);
      const ariaHidden = current.getAttribute?.('aria-hidden') || '';
      const inert = typeof current.hasAttribute === 'function' ? current.hasAttribute('inert') : false;
      const blockedByStyle = Boolean(
        style
        && (
          style.display === 'none'
          || style.visibility === 'hidden'
          || style.opacity === '0'
          || style.pointerEvents === 'none'
        )
      );
      const blockedByRect = Boolean(rect && (rect.width === 0 || rect.height === 0));
      if (hidden || ariaHidden === 'true' || inert || blockedByStyle || blockedByRect) {
        return {
          tag: (current.tagName || '').toLowerCase(),
          id: current.id || '',
          className: String(current.className || '').slice(0, 200),
          hidden,
          ariaHidden,
          inert,
          display: style?.display || '',
          visibility: style?.visibility || '',
          opacity: style?.opacity || '',
          pointerEvents: style?.pointerEvents || '',
          rect,
        };
      }
      current = current.parentElement;
    }
    return null;
  };
  const actionCandidates = document.querySelectorAll(
    'a, button, [role="button"], [role="link"], input[type="button"], input[type="submit"]'
  );
  const allActions = Array.from(actionCandidates).map((el) => {
    const text = getActionText(el);
    return {
      tag: (el.tagName || '').toLowerCase(),
      type: el.getAttribute?.('type') || '',
      text: text.slice(0, 80),
      visible: isVisibleElement(el),
      enabled: isActionEnabled(el),
      rect: buildRectSummary(el),
    };
  });
  const visibleActions = Array.from(actionCandidates)
    .filter(isVisibleElement)
    .slice(0, 12)
    .map((el) => ({
      tag: (el.tagName || '').toLowerCase(),
      type: el.getAttribute?.('type') || '',
      text: getActionText(el).slice(0, 80),
      enabled: isActionEnabled(el),
    }))
    .filter((item) => item.text);
  const signupLikeActions = Array.from(actionCandidates)
    .map((el) => {
      const text = getActionText(el);
      return {
        tag: (el.tagName || '').toLowerCase(),
        type: el.getAttribute?.('type') || '',
        text: text.slice(0, 80),
        visible: isVisibleElement(el),
        enabled: isActionEnabled(el),
        rect: buildRectSummary(el),
        ...buildVisibilityMeta(el),
        blockingAncestor: findBlockingAncestor(el),
      };
    })
    .filter((item) => item.text && isSignupAuthEntryTriggerText(item.text))
    .slice(0, 12);

  return {
    url: location.href,
    title: document.title || '',
    readyState: document.readyState || '',
    viewport: {
      innerWidth: Math.round(Number(view?.innerWidth) || 0),
      innerHeight: Math.round(Number(view?.innerHeight) || 0),
      outerWidth: Math.round(Number(view?.outerWidth) || 0),
      outerHeight: Math.round(Number(view?.outerHeight) || 0),
      devicePixelRatio: Number(view?.devicePixelRatio) || 0,
    },
    hasEmailInput: Boolean(getSignupEmailInput()),
    hasPasswordInput: Boolean(getSignupPasswordInput()),
    hasSwitchToEmailAction: Boolean(findSignupUseEmailTrigger()),
    bodyContainsSignupText: isSignupAuthEntryTriggerText(getPageTextSnapshot()),
    signupLikeActionCounts: {
      total: signupLikeActions.length,
      visible: signupLikeActions.filter((item) => item.visible).length,
      hidden: signupLikeActions.filter((item) => !item.visible).length,
    },
    signupLikeActions,
    visibleActions,
    bodyTextPreview: getPageTextSnapshot().slice(0, 240),
  };
}

function getSignupPasswordDiagnostics() {
  const view = typeof window !== 'undefined' ? window : globalThis;
  const safeGetComputedStyle = (el) => {
    if (!el || typeof view?.getComputedStyle !== 'function') {
      return null;
    }
    try {
      return view.getComputedStyle(el);
    } catch {
      return null;
    }
  };
  const buildRectSummary = (el) => {
    const rect = typeof el?.getBoundingClientRect === 'function'
      ? el.getBoundingClientRect()
      : null;
    return rect
      ? {
          width: Math.round(rect.width || 0),
          height: Math.round(rect.height || 0),
        }
      : null;
  };
  const buildInputSummary = (el) => {
    const style = safeGetComputedStyle(el);
    return {
      tag: (el?.tagName || '').toLowerCase(),
      type: el?.getAttribute?.('type') || el?.type || '',
      name: el?.getAttribute?.('name') || el?.name || '',
      id: el?.id || '',
      autocomplete: el?.getAttribute?.('autocomplete') || '',
      placeholder: String(el?.getAttribute?.('placeholder') || '').slice(0, 80),
      visible: isVisibleElement(el),
      enabled: isActionEnabled(el),
      valueLength: String(el?.value || '').length,
      rect: buildRectSummary(el),
      className: String(el?.className || '').slice(0, 200),
      display: style?.display || '',
      visibility: style?.visibility || '',
      opacity: style?.opacity || '',
      pointerEvents: style?.pointerEvents || '',
      formAction: el?.form?.action || '',
    };
  };
  const buildActionSummary = (el) => {
    const style = safeGetComputedStyle(el);
    return {
      tag: (el?.tagName || '').toLowerCase(),
      type: el?.getAttribute?.('type') || el?.type || '',
      role: el?.getAttribute?.('role') || '',
      text: getActionText(el).slice(0, 120),
      visible: isVisibleElement(el),
      enabled: isActionEnabled(el),
      rect: buildRectSummary(el),
      className: String(el?.className || '').slice(0, 200),
      display: style?.display || '',
      visibility: style?.visibility || '',
      opacity: style?.opacity || '',
      pointerEvents: style?.pointerEvents || '',
      dataDdActionName: el?.getAttribute?.('data-dd-action-name') || '',
      formAction: el?.form?.action || '',
    };
  };
  const passwordInputs = Array.from(document.querySelectorAll(
    'input[type="password"], input[name*="password" i], input[autocomplete="new-password"], input[autocomplete="current-password"]'
  ))
    .map(buildInputSummary)
    .slice(0, 8);
  const actionCandidates = Array.from(document.querySelectorAll(
    'button, a, [role="button"], [role="link"], input[type="button"], input[type="submit"]'
  ))
    .map(buildActionSummary)
    .filter((item) => item.text)
    .slice(0, 16);
  const visibleActions = actionCandidates.filter((item) => item.visible).slice(0, 12);
  const submitButton = getSignupPasswordSubmitButton({ allowDisabled: true });
  const oneTimeCodeTrigger = findOneTimeCodeLoginTrigger();
  const retryState = getSignupPasswordTimeoutErrorPageState();

  return {
    url: location.href,
    title: document.title || '',
    readyState: document.readyState || '',
    displayedEmail: getSignupPasswordDisplayedEmail(),
    passwordErrorText: getSignupPasswordFieldErrorText(),
    hasVisiblePasswordInput: Boolean(getSignupPasswordInput()),
    passwordInputCount: passwordInputs.length,
    visiblePasswordInputCount: passwordInputs.filter((item) => item.visible).length,
    passwordInputs,
    submitButton: submitButton ? buildActionSummary(submitButton) : null,
    oneTimeCodeTrigger: oneTimeCodeTrigger ? buildActionSummary(oneTimeCodeTrigger) : null,
    retryPage: Boolean(retryState),
    retryEnabled: Boolean(retryState?.retryEnabled),
    userAlreadyExistsBlocked: Boolean(retryState?.userAlreadyExistsBlocked),
    visibleActions,
    bodyTextPreview: getPageTextSnapshot().slice(0, 240),
  };
}

function logSignupPasswordDiagnostics(context, level = 'warn') {
  try {
    log(`${context}：密码页诊断快照：${JSON.stringify(getSignupPasswordDiagnostics())}`, level);
  } catch (error) {
    console.warn('[MultiPage:signup-page] failed to build signup password diagnostics:', error?.message || error);
  }
}

async function waitForSignupEntryState(options = {}) {
  const performOperationWithDelay = typeof getOperationDelayRunner === 'function'
    ? getOperationDelayRunner()
    : async (metadata, operation) => {
        const rootScope = typeof window !== 'undefined' ? window : globalThis;
        const gate = rootScope?.CodexOperationDelay?.performOperationWithDelay;
        return typeof gate === 'function' ? gate(metadata, operation) : operation();
      };
  const {
    timeout = 15000,
    autoOpenEntry = false,
    step = 2,
    logDiagnostics = false,
  } = options;
  const start = Date.now();
  const maxSignupEntryClickRetries = 5;
  const maxSignupEntryClickAttempts = maxSignupEntryClickRetries + 1;
  let lastTriggerClickAt = 0;
  let clickAttempts = 0;
  let lastState = '';
  let slowSnapshotLogged = false;
  let lastSwitchToEmailAt = 0;
  let loggedMissingSwitchToEmail = false;

  while (Date.now() - start < timeout) {
    throwIfStopped();
    const snapshot = inspectSignupEntryState();

    if (logDiagnostics && snapshot.state !== lastState) {
      lastState = snapshot.state;
      log(`步骤 ${step}：注册入口状态切换为 ${snapshot.state}，状态快照：${JSON.stringify(getSignupEntryStateSummary(snapshot))}`);
    }

    if (snapshot.state === 'password_page' || snapshot.state === 'email_entry') {
      return snapshot;
    }

    if (snapshot.state === 'email_choice_entry') {
      if (!autoOpenEntry) {
        return snapshot;
      }

      if (snapshot.switchToEmailTrigger && Date.now() - lastSwitchToEmailAt >= 1500) {
        lastSwitchToEmailAt = Date.now();
        loggedMissingSwitchToEmail = false;
        if (logDiagnostics) {
          log(`步骤 ${step}：检测到组合认证入口，准备点击邮箱入口："${getActionText(snapshot.switchToEmailTrigger).slice(0, 80)}"`);
        }
        log('步骤 2：检测到组合认证入口，正在打开邮箱输入模式...');
        await humanPause(350, 900);
        await performOperationWithDelay({ stepKey: 'signup-entry', kind: 'click', label: 'switch-to-signup-email' }, async () => {
          simulateClick(snapshot.switchToEmailTrigger);
        });
      } else if (!snapshot.switchToEmailTrigger && !loggedMissingSwitchToEmail) {
        loggedMissingSwitchToEmail = true;
        log('步骤 2：检测到组合认证入口，但暂未识别到“继续使用邮箱”按钮，继续等待界面稳定...', 'warn');
      }

      if (logDiagnostics && !slowSnapshotLogged && Date.now() - start >= 5000) {
        slowSnapshotLogged = true;
        log(`步骤 ${step}：等待邮箱入口切换超过 5 秒，页面诊断快照：${JSON.stringify(getSignupEntryDiagnostics())}`, 'warn');
      }

      await sleep(250);
      continue;
    }

    if (snapshot.state === 'entry_home') {
      if (!autoOpenEntry) {
        return snapshot;
      }

      if (Date.now() - lastTriggerClickAt >= 1500) {
        if (clickAttempts >= maxSignupEntryClickAttempts) {
          log(`步骤 ${step}：官网注册入口已完成 ${maxSignupEntryClickRetries} 次重试，页面仍未进入邮箱输入页，停止重试。`, 'warn');
          return snapshot;
        }
        lastTriggerClickAt = Date.now();
        clickAttempts += 1;
        const retryAttempt = clickAttempts - 1;
        const triggerText = getActionText(snapshot.signupTrigger).slice(0, 80);
        const hindiLoginEntry = isHindiLoginEntryText(triggerText);
        if (logDiagnostics) {
          log(hindiLoginEntry
            ? `步骤 ${step}：检测到 Hindi 登录入口，正在进入认证页（第 ${clickAttempts}/${maxSignupEntryClickAttempts} 次）："${triggerText}"`
            : `步骤 ${step}：正在点击官网注册入口（第 ${clickAttempts}/${maxSignupEntryClickAttempts} 次）："${triggerText}"`);
        }
        log(hindiLoginEntry
          ? (retryAttempt > 0
              ? `步骤 ${step}：Hindi 登录入口点击后仍未进入邮箱输入页，准备重试进入认证页（重试 ${retryAttempt}/${maxSignupEntryClickRetries}）...`
              : `步骤 ${step}：已找到 Hindi 登录入口，正在进入认证页...`)
          : (retryAttempt > 0
              ? `步骤 ${step}：上次点击后仍未进入邮箱输入页，准备重试点击官网注册入口（重试 ${retryAttempt}/${maxSignupEntryClickRetries}）...`
              : `步骤 ${step}：已找到官网注册入口，准备点击...`));
        await sleep(300);
        throwIfStopped();
        const clickTarget = findSignupEntryTrigger({ allowHiddenFallback: false }) || snapshot.signupTrigger;
        if (!isVisibleElement(clickTarget)) {
          log(`步骤 ${step}：注册入口仍处于不可见状态，继续按入口重试节奏尝试恢复点击...`, 'warn');
        }
        await humanPause(150, 450);
        await performOperationWithDelay({ stepKey: 'signup-entry', kind: 'click', label: 'open-signup-entry' }, async () => {
          simulateClick(clickTarget);
        });
      }
    }

    if (logDiagnostics && !slowSnapshotLogged && Date.now() - start >= 5000) {
      slowSnapshotLogged = true;
      log(`步骤 ${step}：等待注册入口超过 5 秒，页面诊断快照：${JSON.stringify(getSignupEntryDiagnostics())}`, 'warn');
    }

    await sleep(250);
  }

  const finalSnapshot = inspectSignupEntryState();
  if (logDiagnostics) {
    log(`步骤 ${step}：等待注册入口状态超时，最终状态快照：${JSON.stringify(getSignupEntryStateSummary(finalSnapshot))}`, 'warn');
  }
  return finalSnapshot;
}

function isUnifiedAuthLoginEntryPage() {
  return /\/auth\/login(?:[/?#]|$)/i.test(location.pathname || '');
}

function normalizeSignupEntryReadyResult(snapshot) {
  if (snapshot.state === 'entry_home' || snapshot.state === 'email_choice_entry' || snapshot.state === 'email_entry' || snapshot.state === 'password_page') {
    return {
      ready: true,
      state: snapshot.state,
      url: snapshot.url || location.href,
    };
  }
  return null;
}

async function ensureSignupEntryReady(timeout = 25000) {
  let snapshot = await waitForSignupEntryState({ timeout, autoOpenEntry: false });
  let normalizedReadyResult = normalizeSignupEntryReadyResult(snapshot);
  if (normalizedReadyResult) {
    return normalizedReadyResult;
  }

  // ChatGPT /auth/login can finish hydrating the email form shortly after the
  // initial route paint. Give that route one extra focused pass before failing.
  if (isUnifiedAuthLoginEntryPage()) {
    await sleep(1200);
    snapshot = inspectSignupEntryState();
    normalizedReadyResult = normalizeSignupEntryReadyResult(snapshot);
    if (normalizedReadyResult) {
      return normalizedReadyResult;
    }

    snapshot = await waitForSignupEntryState({
      timeout: Math.max(4000, Math.min(10000, Math.floor(timeout / 2))),
      autoOpenEntry: false,
      step: 2,
      logDiagnostics: true,
    });
    normalizedReadyResult = normalizeSignupEntryReadyResult(snapshot);
    if (normalizedReadyResult) {
      return normalizedReadyResult;
    }
  }

  log(`注册入口识别失败，诊断快照：${JSON.stringify(getSignupEntryDiagnostics())}`, 'warn');
  throw new Error('当前页面没有可用的注册入口，也不在邮箱/密码页。URL: ' + location.href);
}

async function ensureSignupPasswordPageReady(timeout = 20000) {
  const helper = getSignupPasswordPageHelpers().ensureSignupPasswordPageReady;
  if (typeof helper === 'function') {
    return await helper(timeout);
  }

  const start = Date.now();

  while (Date.now() - start < timeout) {
    throwIfStopped();
    const passwordInput = getSignupPasswordInput();
    if (isSignupPasswordPage() && passwordInput) {
      return {
        ready: true,
        state: 'password_page',
        url: location.href,
      };
    }
    await sleep(200);
  }

  throw new Error('等待进入密码页超时。URL: ' + location.href);
}

async function fillSignupEmailAndContinue(email, step) {
  const performOperationWithDelay = typeof getOperationDelayRunner === 'function'
    ? getOperationDelayRunner()
    : async (metadata, operation) => {
        const rootScope = typeof window !== 'undefined' ? window : globalThis;
        const gate = rootScope?.CodexOperationDelay?.performOperationWithDelay;
        return typeof gate === 'function' ? gate(metadata, operation) : operation();
      };
  if (!email) throw new Error(`未提供邮箱地址，步骤 ${step} 无法继续。`);
  const normalizedEmail = String(email || '').trim().toLowerCase();

  const snapshot = await waitForSignupEntryState({
    timeout: step === 2 && isUnifiedAuthLoginEntryPage() ? 30000 : 20000,
    autoOpenEntry: true,
    step,
    logDiagnostics: step === 2,
  });

  if (snapshot.state === 'password_page') {
    if (snapshot.displayedEmail && snapshot.displayedEmail !== normalizedEmail) {
      throw new Error(`步骤 ${step}：当前密码页邮箱为 ${snapshot.displayedEmail}，与目标邮箱 ${email} 不一致，请先回到步骤 1 重新开始。`);
    }
    log(`步骤 ${step}：当前已在密码页，无需重复提交邮箱。`);
    return {
      alreadyOnPasswordPage: true,
      url: snapshot.url || location.href,
    };
  }

  if (snapshot.state !== 'email_entry' || !snapshot.emailInput) {
    if (step === 2) {
      log(`步骤 ${step}：未进入邮箱输入页，最终页面诊断快照：${JSON.stringify(getSignupEntryDiagnostics())}`, 'warn');
    }
    throw new Error(`步骤 ${step}：未找到可用的邮箱输入入口。URL: ${location.href}`);
  }

  log(`步骤 ${step}：正在填写邮箱：${email}`);
  await humanPause(500, 1400);
  await performOperationWithDelay({ stepKey: step === 2 ? 'signup-entry' : 'fill-password', kind: 'fill', label: 'signup-email' }, async () => {
    fillInput(snapshot.emailInput, email);
  });
  log(`步骤 ${step}：邮箱已填写`);

  const continueButton = snapshot.continueButton || getSignupEmailContinueButton({ allowDisabled: true });
  if (!continueButton || !isActionEnabled(continueButton)) {
    throw new Error(`步骤 ${step}：未找到可点击的“继续”按钮。URL: ${location.href}`);
  }

  log(`步骤 ${step}：邮箱已准备提交，正在前往密码页...`);
  window.setTimeout(async () => {
    try {
      throwIfStopped();
      await performOperationWithDelay({ stepKey: step === 2 ? 'signup-entry' : 'fill-password', kind: 'submit', label: 'submit-signup-email' }, async () => {
        simulateClick(continueButton);
      });
    } catch (error) {
      if (!isStopError(error)) {
        console.error('[MultiPage:signup-page] deferred signup email submit failed:', error?.message || error);
      }
    }
  }, 120);

  return {
    submitted: true,
    email,
    url: location.href,
  };
}

// ============================================================
// Step 2: Click Register, fill email, then continue to password page
// ============================================================

async function step2_clickRegister(payload = {}) {
  const { email } = payload;
  return fillSignupEmailAndContinue(email, 2);
}

// ============================================================
// Step 3: Fill Password
// ============================================================

async function fillSignupPasswordPageAndSubmit(snapshot, password, options = {}) {
  const helper = getSignupPasswordPageHelpers().fillSignupPasswordPageAndSubmit;
  if (typeof helper === 'function') {
    return await helper(snapshot, password, options);
  }

  const {
    contextLabel = '步骤 3',
    deferredSubmit = true,
    requireSubmitButton = false,
    fillLabel = 'signup-password',
    submitLabel = 'submit-signup-password',
    submitDelayMs = 120,
    submitInitialSleepMs = 500,
  } = options;
  const performOperationWithDelay = typeof getOperationDelayRunner === 'function'
    ? getOperationDelayRunner()
    : async (metadata, operation) => {
        const rootScope = typeof window !== 'undefined' ? window : globalThis;
        const gate = rootScope?.CodexOperationDelay?.performOperationWithDelay;
        return typeof gate === 'function' ? gate(metadata, operation) : operation();
      };
  const activeSnapshot = snapshot || inspectSignupEntryState();

  if (!password) {
    throw new Error(`${contextLabel}：缺少可用密码，无法自动填写密码页。`);
  }
  if (activeSnapshot.state !== 'password_page' || !activeSnapshot.passwordInput) {
    logSignupPasswordDiagnostics(`${contextLabel}：未能识别可填写的密码输入框`);
    throw new Error(`在密码页未找到密码输入框。URL: ${location.href}`);
  }

  await humanPause(600, 1500);
  await performOperationWithDelay({ stepKey: 'fill-password', kind: 'fill', label: fillLabel }, async () => {
    fillInput(activeSnapshot.passwordInput, password);
  });
  log(`${contextLabel}：密码已填写`);

  const submitBtn = activeSnapshot.submitButton
    || getSignupPasswordSubmitButton({ allowDisabled: true })
    || await waitForElementByText('button', /continue|sign\s*up|submit|注册|创建|create|続行|登録|作成|जारी\s+रखें|आगे|सबमिट|साइन\s*अप|बनाएं|बनाएँ/i, 5000).catch(() => null);

  if (!submitBtn) {
    logSignupPasswordDiagnostics(`${contextLabel}：未找到可提交的密码页按钮`);
    if (requireSubmitButton) {
      throw new Error(`${contextLabel}：未找到可提交的密码页按钮。URL: ${location.href}`);
    }
  } else if (typeof findOneTimeCodeLoginTrigger === 'function' && findOneTimeCodeLoginTrigger()) {
    logSignupPasswordDiagnostics(`${contextLabel}：当前密码页同时存在一次性验证码入口`, 'info');
  }

  const submitPassword = async () => {
    throwIfStopped();
    if (submitInitialSleepMs > 0) {
      await sleep(submitInitialSleepMs);
    }
    await humanPause(500, 1300);
    await performOperationWithDelay({ stepKey: 'fill-password', kind: 'submit', label: submitLabel }, async () => {
      simulateClick(submitBtn);
    });
    log(`${contextLabel}：表单已提交`);
  };

  const signupVerificationRequestedAt = submitBtn ? Date.now() : null;
  if (submitBtn) {
    if (deferredSubmit) {
      window.setTimeout(async () => {
        try {
          await submitPassword();
        } catch (error) {
          if (!isStopError(error)) {
            console.error('[MultiPage:signup-page] deferred signup password submit failed:', error?.message || error);
          }
        }
      }, submitDelayMs);
    } else {
      await submitPassword();
    }
  }

  return {
    submitButtonFound: Boolean(submitBtn),
    signupVerificationRequestedAt,
    deferredSubmit: Boolean(submitBtn && deferredSubmit),
  };
}

async function step3_fillEmailPassword(payload) {
  const { email, password } = payload;
  if (!password) throw new Error('未提供密码，步骤 3 需要可用密码。');
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const accountIdentifierType = 'email';
  const accountIdentifier = String(payload?.accountIdentifier || email || '').trim();

  let snapshot = inspectSignupEntryState();
  if (snapshot.state === 'entry_home') {
    throw new Error('当前仍停留在 ChatGPT 官网首页，请先完成步骤 2。');
  }

  if (
    snapshot.state === 'verification_page'
    || snapshot.state === 'profile_page'
    || snapshot.state === 'logged_in_home'
  ) {
    const completionPayload = {
      email: email || '',
      accountIdentifierType,
      accountIdentifier,
      signupVerificationRequestedAt: snapshot.state === 'verification_page' ? Date.now() : null,
      skippedPasswordPage: true,
      deferredSubmit: false,
      ...(snapshot.skipProfileStep ? { skipProfileStep: true } : {}),
    };
    log('步骤 3：当前页面已进入验证码或后续阶段，密码页按已跳过处理。', 'warn');
    reportComplete(3, completionPayload);
    return completionPayload;
  }

  if (snapshot.state === 'email_entry') {
    const transition = await fillSignupEmailAndContinue(email, 3);
    if (!transition.alreadyOnPasswordPage) {
      await sleep(1200);
      await ensureSignupPasswordPageReady();
    }
    snapshot = inspectSignupEntryState();
  }

  if (snapshot.state !== 'password_page' || !snapshot.passwordInput) {
    await ensureSignupPasswordPageReady();
    snapshot = inspectSignupEntryState();
  }

  if (normalizedEmail && snapshot.displayedEmail && snapshot.displayedEmail !== normalizedEmail) {
    throw new Error(`当前密码页邮箱为 ${snapshot.displayedEmail}，与目标邮箱 ${email} 不一致，请先回到步骤 1 重新开始。`);
  }

  const passwordSubmitResult = await fillSignupPasswordPageAndSubmit(snapshot, password, {
    contextLabel: '步骤 3',
    deferredSubmit: true,
  });

  const completionPayload = {
    email,
    accountIdentifierType,
    accountIdentifier,
    signupVerificationRequestedAt: passwordSubmitResult.signupVerificationRequestedAt,
    deferredSubmit: passwordSubmitResult.deferredSubmit,
  };

  reportComplete(3, completionPayload);
  return completionPayload;
}

// ============================================================
// Fill Verification Code (used by step 4 and step 7)
// ============================================================

const STEP5_SUBMIT_ERROR_PATTERN = /无法根据该信息创建帐户|请重试|アカウントを作成できません|作成できません|やり直してください|もう一度お試しください|エラーが発生しました|生年月日|誕生日|年齢|unable\s+to\s+create\s+(?:your\s+)?account|couldn'?t\s+create\s+(?:your\s+)?account|something\s+went\s+wrong|invalid\s+(?:birthday|birth|date)|生日|出生日期|जन्म(?:दिन|तिथि)|उम्र|आयु|कुछ\s+गलत\s+हो\s+गया/i;
const AUTH_TIMEOUT_ERROR_TITLE_PATTERN = /糟糕，出错了|エラーが発生しました|問題が発生しました|something\s+went\s+wrong|oops|कुछ\s+गलत\s+हो\s+गया|समस्या\s+हुई/i;
const AUTH_TIMEOUT_ERROR_DETAIL_PATTERN = /operation\s+timed\s+out|timed\s+out|タイムアウト|時間切れ|请求超时|操作超时|failed\s+to\s+fetch|network\s+error|fetch\s+failed|invalid\s+authorization\s+step|invalid_auth_step/i;
const AUTH_MAX_CHECK_ATTEMPTS_PATTERN = /max_check_attempts|試行回数が多すぎ|数分待ってからもう一度|too\s+many\s+(?:attempts|checks|tries)|try\s+again\s+in\s+(?:a\s+)?few\s+minutes|बहुत\s+(?:ज़्यादा|ज्यादा)\s+(?:प्रयास|कोशिश)|कुछ\s+मिनट\s+बाद/i;
const AUTH_ROUTE_ERROR_PATTERN = /405\s+method\s+not\s+allowed|route\s+error.*405|did\s+not\s+provide\s+an?\s+[`'"]?action|post\s+request\s+to\s+["']?\/email-verification/i;
const STEP4_405_RECOVERY_ERROR_PREFIX = 'STEP4_405_RECOVERY_LIMIT::';
const STEP4_405_RECOVERY_LIMIT = 3;
const SIGNUP_USER_ALREADY_EXISTS_ERROR_PREFIX = 'SIGNUP_USER_ALREADY_EXISTS::';
const STEP8_EMAIL_IN_USE_ERROR_PREFIX = 'STEP8_EMAIL_IN_USE::';
const SIGNUP_EMAIL_EXISTS_PATTERN = /与此电子邮件地址相关联的帐户已存在|account\s+associated\s+with\s+this\s+email\s+address\s+already\s+exists|email\s+address.*already\s+exists/i;

const authPageRecovery = self.MultiPageAuthPageRecovery?.createAuthPageRecovery?.({
  detailPattern: AUTH_TIMEOUT_ERROR_DETAIL_PATTERN,
  getActionText,
  getPageTextSnapshot,
  humanPause,
  isActionEnabled,
  isVisibleElement,
  log,
  routeErrorPattern: AUTH_ROUTE_ERROR_PATTERN,
  simulateClick,
  sleep,
  throwIfStopped,
  titlePattern: AUTH_TIMEOUT_ERROR_TITLE_PATTERN,
}) || null;

function getVerificationErrorText() {
  return getSignupPageDetector().getVerificationErrorText();
}

function isEmailAlreadyVerifiedPage() {
  if (!isEmailVerificationPage()) {
    return false;
  }
  const pageText = getPageTextSnapshot();
  return EMAIL_ALREADY_VERIFIED_PATTERN.test(pageText);
}

function createEmailAlreadyVerifiedOutcome() {
  return {
    success: true,
    assumed: true,
    emailAlreadyVerified: true,
    alreadyAdvanced: true,
    url: location.href,
  };
}

function createSignupUserAlreadyExistsError(message = '') {
  const detail = String(message || '').trim()
    || '步骤 4：检测到 user_already_exists，说明当前用户已存在，当前轮将直接停止。';
  return new Error(
    `${SIGNUP_USER_ALREADY_EXISTS_ERROR_PREFIX}${detail}`
  );
}

function createAuthMaxCheckAttemptsError() {
  return new Error('CF_SECURITY_BLOCKED::您已触发 OpenAI 认证页试行次数限制（max_check_attempts / 試行回数が多すぎます），已完全停止流程；请等待 15-30 分钟后再继续，不要反复点击“重试”。');
}

function isAuthMaxCheckAttemptsPage() {
  const text = getPageTextSnapshot();
  const title = typeof document !== 'undefined' ? String(document.title || '') : '';
  return AUTH_MAX_CHECK_ATTEMPTS_PATTERN.test(text) || AUTH_MAX_CHECK_ATTEMPTS_PATTERN.test(title);
}

function createStep8EmailInUseError() {
  return new Error(`${STEP8_EMAIL_IN_USE_ERROR_PREFIX}email_in_use on add-email verification page; choose a different email.`);
}

function getVisibleFieldErrorText() {
  const selectors = [
    '.react-aria-FieldError',
    '[slot="errorMessage"]',
    '[id$="-error"]',
    '[data-invalid="true"] + *',
    '[aria-invalid="true"] + *',
    '[class*="error"]',
    '[role="alert"]',
  ];

  for (const selector of selectors) {
    const match = Array.from(document.querySelectorAll(selector)).find((el) => {
      if (!isVisibleElement(el)) return false;
      const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
      return Boolean(text);
    });
    if (match) {
      return (match.textContent || '').replace(/\s+/g, ' ').trim();
    }
  }

  return '';
}

function getSignupPasswordFieldErrorText() {
  const helper = getSignupPasswordPageHelpers().getSignupPasswordFieldErrorText;
  if (typeof helper === 'function') {
    return helper();
  }

  return getVisibleFieldErrorText();
}

function isStep5Ready() {
  const helper = getSignupProfilePageHelpers().isStep5Ready;
  if (typeof helper === 'function') {
    return Boolean(helper());
  }

  return Boolean(
    document.querySelector([
      'input[name="name"]',
      'input[autocomplete="name"]',
      'input[name="birthday"]',
      'input[name="age"]',
      'input[placeholder*="氏名"]',
      'input[placeholder*="名前"]',
      'input[placeholder*="年齢"]',
      'input[placeholder*="नाम"]',
      'input[placeholder*="पूरा नाम"]',
      'input[placeholder*="उम्र"]',
      'input[placeholder*="आयु"]',
      'input[aria-label*="氏名"]',
      'input[aria-label*="名前"]',
      'input[aria-label*="年齢"]',
      'input[aria-label*="नाम"]',
      'input[aria-label*="पूरा नाम"]',
      'input[aria-label*="उम्र"]',
      'input[aria-label*="आयु"]',
      '[role="spinbutton"][data-type="year"]',
    ].join(', '))
  );
}

function isSignupProfilePageUrl(rawUrl = location.href) {
  const detector = getAuthPageDetectors().isSignupProfileUrl || getAuthPageDetectors().isAboutYouUrl;
  if (typeof detector === 'function') {
    return Boolean(detector(rawUrl));
  }
  const helper = getSignupProfilePageHelpers().detectProfilePage;
  if (typeof helper === 'function') {
    return Boolean(helper(rawUrl));
  }

  const url = String(rawUrl || '').trim();
  if (!url) {
    return false;
  }

  try {
    const parsed = new URL(url);
    const host = String(parsed.hostname || '').toLowerCase();
    if (!['auth.openai.com', 'auth0.openai.com', 'accounts.openai.com'].includes(host)) {
      return false;
    }
    return /\/(?:create-account\/profile|u\/signup\/profile|signup\/profile|about-you)(?:[/?#]|$)/i.test(String(parsed.pathname || ''));
  } catch {
    return false;
  }
}

function isPasskeyEnrollmentPageUrl(rawUrl = location.href) {
  const url = String(rawUrl || '').trim();
  if (!url) {
    return false;
  }

  try {
    const parsed = new URL(url);
    const host = String(parsed.hostname || '').toLowerCase();
    if (!['auth.openai.com', 'auth0.openai.com', 'accounts.openai.com'].includes(host)) {
      return false;
    }
    return /\/create-account-enroll-passkey(?:[/?#]|$)/i.test(String(parsed.pathname || ''));
  } catch {
    return false;
  }
}

function isPasskeyEnrollmentPage() {
  if (isPasskeyEnrollmentPageUrl()) {
    return true;
  }

  const pageText = getPageTextSnapshot();
  if (!pageText || !/(?:通行密钥|passkey)/i.test(pageText)) {
    return false;
  }

  try {
    const parsed = new URL(String(location.href || '').trim());
    const host = String(parsed.hostname || '').toLowerCase();
    return ['auth.openai.com', 'auth0.openai.com', 'accounts.openai.com'].includes(host);
  } catch {
    return false;
  }
}

function isLikelyLoggedInChatgptHomeUrl(rawUrl = location.href) {
  const detector = getAuthPageDetectors().isChatGptHomeUrl;
  if (typeof detector === 'function' && !detector(rawUrl)) {
    return false;
  }
  if (typeof detector !== 'function') {
    const url = String(rawUrl || '').trim();
    if (!url) {
      return false;
    }

    try {
      const parsed = new URL(url);
      const host = String(parsed.hostname || '').toLowerCase();
      if (!['chatgpt.com', 'www.chatgpt.com', 'chat.openai.com'].includes(host)) {
        return false;
      }

      const path = String(parsed.pathname || '');
      if (/^\/(?:auth\/|create-account\/|email-verification|log-in)(?:[/?#]|$)/i.test(path)) {
        return false;
      }
    } catch {
      return false;
    }
  }

  const signupTrigger = typeof findSignupEntryTrigger === 'function'
    ? findSignupEntryTrigger()
    : null;
  if (signupTrigger) {
    return false;
  }

  if (typeof document !== 'undefined' && document && typeof document.querySelectorAll === 'function') {
    const loginActionPattern = /登录|log\s*in|sign\s*in/i;
    const candidates = document.querySelectorAll(
      'a, button, [role="button"], [role="link"], input[type="button"], input[type="submit"]'
    );

    for (const el of candidates) {
      const text = typeof getActionText === 'function'
        ? getActionText(el)
        : [
          el?.textContent,
          el?.value,
          el?.getAttribute?.('aria-label'),
          el?.getAttribute?.('title'),
        ]
          .filter(Boolean)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
      if (!text || !loginActionPattern.test(text)) {
        continue;
      }

      const visible = typeof isVisibleElement === 'function'
        ? isVisibleElement(el)
        : true;
      if (!visible) {
        continue;
      }

      const enabled = typeof isActionEnabled === 'function'
        ? isActionEnabled(el)
        : (Boolean(el) && !el.disabled && el?.getAttribute?.('aria-disabled') !== 'true');
      if (enabled) {
        return false;
      }
    }
  }

  return true;
}

function getStep4PostVerificationState(options = {}) {
  const { ignoreVerificationVisibility = false } = options;
  // Newer auth flows can briefly render profile fields before the email-verification
  // form fully exits. Do not advance to Step 5 while verification UI is still present.
  if (!ignoreVerificationVisibility && isVerificationPageStillVisible()) {
    return null;
  }

  if (isStep5Ready() || isSignupProfilePageUrl()) {
    return {
      state: 'step5',
      url: location.href,
    };
  }

  if (isPasskeyEnrollmentPage()) {
    return {
      state: 'passkey_enrollment',
      passkeyEnrollmentRequired: true,
      url: location.href,
    };
  }

  if (getSignupEmailInput() || getSignupPasswordInput()) {
    return null;
  }

  if (isLikelyLoggedInChatgptHomeUrl()) {
    return {
      state: 'logged_in_home',
      skipProfileStep: true,
      url: location.href,
    };
  }

  return null;
}

function getSignupVerificationPostSubmitState() {
  const retryState = getCurrentAuthRetryPageState('signup');
  const maxCheckAttemptsBlocked = Boolean(retryState?.maxCheckAttemptsBlocked || isAuthMaxCheckAttemptsPage());
  const invalidCodeText = getVerificationErrorText();
  const postVerificationState = getStep4PostVerificationState();
  return {
    url: location.href,
    retryPage: Boolean(retryState || maxCheckAttemptsBlocked),
    retryEnabled: Boolean(retryState?.retryEnabled),
    maxCheckAttemptsBlocked,
    userAlreadyExistsBlocked: Boolean(retryState?.userAlreadyExistsBlocked),
    invalidCode: Boolean(invalidCodeText),
    errorText: invalidCodeText,
    verificationVisible: isVerificationPageStillVisible(),
    successState: postVerificationState?.state || '',
    skipProfileStep: Boolean(postVerificationState?.skipProfileStep),
    passkeyEnrollmentRequired: Boolean(postVerificationState?.passkeyEnrollmentRequired),
  };
}

function getPageTextSnapshot() {
  const snapshot = getSignupPageDetector().getPageTextSnapshot();
  const normalizePageText = getAuthPageDetectors().normalizePageText;
  return typeof normalizePageText === 'function' ? normalizePageText(snapshot) : snapshot;
}

function getLoginVerificationDisplayedEmail() {
  return getSignupPageDetector().getLoginVerificationDisplayedEmail();
}

function getOAuthConsentForm() {
  return document.querySelector(OAUTH_CONSENT_FORM_SELECTOR);
}

function getPrimaryContinueButton() {
  const consentForm = getOAuthConsentForm();
  if (consentForm) {
    const formButtons = Array.from(
      consentForm.querySelectorAll('button[type="submit"], input[type="submit"], [role="button"]')
    );

    const formContinueButton = formButtons.find((el) => {
      if (!isVisibleElement(el)) return false;

      const ddActionName = el.getAttribute?.('data-dd-action-name') || '';
      return ddActionName === 'Continue' || CONTINUE_ACTION_PATTERN.test(getActionText(el));
    });
    if (formContinueButton) {
      return formContinueButton;
    }

    const firstVisibleSubmit = formButtons.find(isVisibleElement);
    if (firstVisibleSubmit) {
      return firstVisibleSubmit;
    }
  }

  const continueBtn = document.querySelector(
    `${OAUTH_CONSENT_FORM_SELECTOR} button[type="submit"], button[type="submit"][data-dd-action-name="Continue"], button[type="submit"]._primary_3rdp0_107`
  );
  if (continueBtn && isVisibleElement(continueBtn)) {
    return continueBtn;
  }

  const buttons = document.querySelectorAll('button, [role="button"]');
  return Array.from(buttons).find((el) => {
    if (!isVisibleElement(el)) return false;

    const ddActionName = el.getAttribute?.('data-dd-action-name') || '';
    return ddActionName === 'Continue' || CONTINUE_ACTION_PATTERN.test(getActionText(el));
  }) || null;
}

function isOAuthConsentPage() {
  const pageText = getPageTextSnapshot();
  if (OAUTH_CONSENT_PAGE_PATTERN.test(pageText)) {
    return true;
  }

  if (getOAuthConsentForm()) {
    return true;
  }

  return /\bcodex\b/i.test(pageText) && /\bchatgpt\b/i.test(pageText) && Boolean(getPrimaryContinueButton());
}

function isVerificationPageStillVisible() {
  if (getCurrentAuthRetryPageState('signup_password') || getCurrentAuthRetryPageState('login')) {
    return false;
  }
  if (isEmailAlreadyVerifiedPage()) {
    return false;
  }
  if (getVerificationCodeTarget()) return true;
  if (findResendVerificationCodeTrigger({ allowDisabled: true })) return true;
  if (document.querySelector('form[action*="email-verification" i]')) return true;

  if (!isEmailVerificationPage()) {
    return false;
  }

  return VERIFICATION_PAGE_PATTERN.test(getPageTextSnapshot());
}

function isAddEmailPageReady() {
  const path = `${location.pathname || ''} ${location.href || ''}`;
  if (/\/add-email(?:[/?#]|$)/i.test(path)) {
    return true;
  }

  const emailInput = getLoginEmailInput();
  if (!emailInput) {
    return false;
  }

  const form = emailInput.form || emailInput.closest?.('form') || null;
  const formAction = String(form?.getAttribute?.('action') || form?.action || '');
  if (/\/add-email(?:[/?#]|$)/i.test(formAction)) {
    return true;
  }

  const pageText = getPageTextSnapshot();
  return ADD_EMAIL_PAGE_PATTERN.test(pageText)
    && !/继续使用(?:电子邮件地址|邮箱)登录|continue\s+using\s+(?:an?\s+)?email(?:\s+address)?\s+(?:to\s+)?(?:log\s*in|sign\s*in)|continue\s+with\s+email/i.test(pageText);
}

const CREATE_ACCOUNT_ENROLL_PASSKEY_PATH_PATTERN = /\/create-account-enroll-passkey(?:[/?#]|$)/i;
const CREATE_ACCOUNT_ENROLL_PASSKEY_HEADING_PATTERN = /create\s+your\s+account\s+with\s+a?\s*passkey|sign\s+in\s+faster\s+and\s+more\s+safely.*without\s+a\s+password|使用通行密钥.*创建账户|下次登录时.*无需密码.*更快更安全|通行密钥/i;
const CREATE_ACCOUNT_ENROLL_PASSKEY_SKIP_PATTERN = /(?:^|\b)(?:skip|跳过)(?:\b|$)/i;
const CREATE_ACCOUNT_ENROLL_PASSKEY_PRIMARY_PATTERN = /add\s+passkey|添加通行密钥|创建账户.*通行密钥|create\s+your\s+account\s+with\s+a?\s*passkey/i;

function findCreateAccountEnrollPasskeyButton(matcher, { allowDisabled = false } = {}) {
  const candidates = document.querySelectorAll(
    'button, a, [role="button"], [role="link"], input[type="button"], input[type="submit"]'
  );

  for (const el of candidates) {
    if (!isVisibleElement(el)) continue;
    if (!allowDisabled && !isActionEnabled(el)) continue;

    const ddActionName = String(el.getAttribute?.('data-dd-action-name') || '').trim().toLowerCase();
    const text = getActionText(el);
    if (matcher({ ddActionName, text, element: el })) {
      return el;
    }
  }

  return null;
}

function getCreateAccountEnrollPasskeyPageState() {
  const path = `${location.pathname || ''} ${location.href || ''}`;
  const pageText = getPageTextSnapshot();
  const skipButton = findCreateAccountEnrollPasskeyButton(({ ddActionName, text }) => (
    ddActionName === 'skip create account enroll passkey'
    || CREATE_ACCOUNT_ENROLL_PASSKEY_SKIP_PATTERN.test(text)
  ));
  const primaryButton = findCreateAccountEnrollPasskeyButton(({ ddActionName, text }) => (
    ddActionName === 'create account enroll passkey'
    || CREATE_ACCOUNT_ENROLL_PASSKEY_PRIMARY_PATTERN.test(text)
  ), { allowDisabled: true });
  const headingMatched = CREATE_ACCOUNT_ENROLL_PASSKEY_HEADING_PATTERN.test(pageText);
  const pathMatched = CREATE_ACCOUNT_ENROLL_PASSKEY_PATH_PATTERN.test(path);
  const dataActionMatched = Boolean(
    document.querySelector('[data-dd-action-name="skip create account enroll passkey"], [data-dd-action-name="create account enroll passkey"]')
  );

  if (!pathMatched && !headingMatched && !dataActionMatched && !skipButton && !primaryButton) {
    return null;
  }

  return {
    url: location.href,
    pathMatched,
    headingMatched,
    dataActionMatched,
    skipButtonFound: Boolean(skipButton),
    skipEnabled: Boolean(skipButton && isActionEnabled(skipButton)),
    primaryButtonFound: Boolean(primaryButton),
  };
}

async function skipCreateAccountEnrollPasskey(options = {}) {
  const {
    timeoutMs = 15000,
    settleMs = 1000,
  } = options;
  const start = Date.now();
  let clickCount = 0;

  while (Date.now() - start < timeoutMs) {
    throwIfStopped();

    const pageState = getCreateAccountEnrollPasskeyPageState();
    if (!pageState) {
      return {
        skipped: clickCount > 0,
        url: location.href,
      };
    }

    const skipButton = findCreateAccountEnrollPasskeyButton(({ ddActionName, text }) => (
      ddActionName === 'skip create account enroll passkey'
      || CREATE_ACCOUNT_ENROLL_PASSKEY_SKIP_PATTERN.test(text)
    ));

    if (skipButton && isActionEnabled(skipButton)) {
      clickCount += 1;
      await humanPause(350, 900);
      simulateClick(skipButton);
      await sleep(settleMs);
      continue;
    }

    await sleep(200);
  }

  throw new Error(`步骤 5：已进入通行密钥页，但未能自动点击“跳过”。URL: ${location.href}`);
}

function getDocumentReadyStateSnapshot() {
  const readyState = typeof document !== 'undefined' && document
    ? String(document.readyState || '').trim().toLowerCase()
    : '';
  return readyState || 'complete';
}

function isDocumentLoadComplete() {
  return getDocumentReadyStateSnapshot() === 'complete';
}

async function waitForDocumentLoadComplete(timeout = 15000, label = '页面') {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    throwIfStopped();
    if (isDocumentLoadComplete()) {
      return true;
    }
    await sleep(150);
  }

  throw new Error(`${label}长时间未完成加载，当前 readyState=${getDocumentReadyStateSnapshot()}。URL: ${location.href}`);
}

function isSignupVerificationPageInteractiveReady(snapshot = null) {
  if (!isDocumentLoadComplete()) {
    return false;
  }

  const resolvedSnapshot = snapshot || inspectSignupVerificationState();
  if (resolvedSnapshot?.state !== 'verification') {
    return false;
  }

  return Boolean(getVerificationCodeTarget());
}

function isStep8Ready() {
  const continueBtn = getPrimaryContinueButton();
  if (!continueBtn) return false;
  if (isVerificationPageStillVisible()) return false;
  if (isAddEmailPageReady()) return false;

  return isOAuthConsentPage();
}

function normalizeInlineText(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

function isStep5AllConsentText(text) {
  const normalizedText = normalizeInlineText(text).toLowerCase();
  if (!normalizedText) return false;

  return /i\s+agree\s+to\s+all\s+of\s+the\s+following/i.test(normalizedText)
    || normalizedText.includes('\u6211\u540c\u610f\u4ee5\u4e0b\u6240\u6709\u5404\u9879')
    || normalizedText.includes('\u540c\u610f\u4ee5\u4e0b\u6240\u6709\u5404\u9879')
    || normalizedText.includes('\u6211\u540c\u610f\u6240\u6709')
    || normalizedText.includes('\u5168\u90e8\u540c\u610f');
}

function findStep5AllConsentCheckbox() {
  const namedCandidates = Array.from(document.querySelectorAll('input[name="allCheckboxes"][type="checkbox"]'))
    .filter((el) => {
      const checkboxLabel = el.closest?.('label') || null;
      return isVisibleElement(el) || (checkboxLabel && isVisibleElement(checkboxLabel));
    });

  const namedMatch = namedCandidates.find((el) => {
    const checkboxLabel = el.closest?.('label') || null;
    const checkboxText = normalizeInlineText([
      checkboxLabel?.textContent || '',
      el.getAttribute?.('aria-label') || '',
      el.getAttribute?.('title') || '',
      el.getAttribute?.('name') || '',
    ].filter(Boolean).join(' '));
    return isStep5AllConsentText(checkboxText);
  });
  if (namedMatch) {
    return namedMatch;
  }
  if (namedCandidates.length > 0) {
    return namedCandidates[0];
  }

  return Array.from(document.querySelectorAll('input[type="checkbox"]'))
    .find((el) => {
      const checkboxLabel = el.closest?.('label') || null;
      if (!isVisibleElement(el) && !(checkboxLabel && isVisibleElement(checkboxLabel))) {
        return false;
      }
      const checkboxText = normalizeInlineText([
        checkboxLabel?.textContent || '',
        el.getAttribute?.('aria-label') || '',
        el.getAttribute?.('title') || '',
        el.getAttribute?.('name') || '',
      ].filter(Boolean).join(' '));
      return isStep5AllConsentText(checkboxText);
    }) || null;
}

function isStep5CheckboxChecked(checkbox) {
  if (!checkbox) return false;
  if (checkbox.checked === true) return true;

  const ariaChecked = String(
    checkbox.getAttribute?.('aria-checked')
    || checkbox.closest?.('[role="checkbox"]')?.getAttribute?.('aria-checked')
    || ''
  ).toLowerCase();
  return ariaChecked === 'true';
}

function findBirthdayReactAriaSelect(labelText) {
  const normalizedLabel = normalizeInlineText(labelText);
  const roots = document.querySelectorAll('.react-aria-Select');

  for (const root of roots) {
    const labelEl = Array.from(root.querySelectorAll('span')).find((el) => normalizeInlineText(el.textContent) === normalizedLabel);
    if (!labelEl) continue;

    const item = root.closest('[class*="selectItem"], ._selectItem_ppsls_113') || root.parentElement;
    const nativeSelect = item?.querySelector('[data-testid="hidden-select-container"] select') || null;
    const button = root.querySelector('button[aria-haspopup="listbox"]') || null;
    const valueEl = root.querySelector('.react-aria-SelectValue') || null;

    return { root, item, labelEl, nativeSelect, button, valueEl };
  }

  return null;
}

function findBirthdayReactAriaSelectByLabels(labels = []) {
  for (const label of labels) {
    const control = findBirthdayReactAriaSelect(label);
    if (control) {
      return control;
    }
  }
  return null;
}

async function setReactAriaBirthdaySelect(control, value) {
  if (!control?.nativeSelect) {
    throw new Error('未找到可写入的生日下拉框。');
  }

  const desiredValue = String(value);
  const option = Array.from(control.nativeSelect.options).find((item) => item.value === desiredValue);
  if (!option) {
    throw new Error(`生日下拉框中不存在值 ${desiredValue}。`);
  }

  control.nativeSelect.value = desiredValue;
  option.selected = true;
  control.nativeSelect.dispatchEvent(new Event('input', { bubbles: true }));
  control.nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
  await sleep(120);
}

function getStep5ErrorText() {
  const helper = getSignupProfilePageHelpers().getStep5ErrorText;
  if (typeof helper === 'function') {
    return helper();
  }

  const messages = [];
  const selectors = [
    '.react-aria-FieldError',
    '[slot="errorMessage"]',
    '[id$="-error"]',
    '[id$="-errors"]',
    '[role="alert"]',
    '[aria-live="assertive"]',
    '[aria-live="polite"]',
    '[class*="error"]',
  ];

  for (const selector of selectors) {
    document.querySelectorAll(selector).forEach((el) => {
      if (!isVisibleElement(el)) return;
      const text = normalizeInlineText(el.textContent);
      if (text) {
        messages.push(text);
      }
    });
  }

  const invalidField = Array.from(document.querySelectorAll('[aria-invalid="true"], [data-invalid="true"]'))
    .find((el) => isVisibleElement(el));
  if (invalidField) {
    const wrapper = invalidField.closest('form, fieldset, [data-rac], div');
    if (wrapper) {
      const text = normalizeInlineText(wrapper.textContent);
      if (text) {
        messages.push(text);
      }
    }
  }

  return messages.find((text) => STEP5_SUBMIT_ERROR_PATTERN.test(text)) || '';
}


function isSignupPasswordPage() {
  const detector = getAuthPageDetectors().isPasswordPageUrl;
  if (typeof detector === 'function') {
    return Boolean(detector(location.href));
  }
  const helper = getSignupPasswordPageHelpers().detectPasswordPage;
  if (typeof helper === 'function') {
    return Boolean(helper());
  }

  return /\/(?:create-account|log-in)\/password(?:[/?#]|$)/i.test(location.pathname || '');
}

function getSignupPasswordInput() {
  const helper = getSignupPasswordPageHelpers().getSignupPasswordInput;
  if (typeof helper === 'function') {
    return helper();
  }

  const input = document.querySelector('input[type="password"]');
  return input && isVisibleElement(input) ? input : null;
}

function getSignupPasswordSubmitButton({ allowDisabled = false } = {}) {
  const helper = getSignupPasswordPageHelpers().getSignupPasswordSubmitButton;
  if (typeof helper === 'function') {
    return helper({ allowDisabled });
  }

  const direct = document.querySelector('button[type="submit"]');
  if (direct && isVisibleElement(direct) && (allowDisabled || isActionEnabled(direct))) {
    return direct;
  }

  const candidates = document.querySelectorAll('button, [role="button"]');
  return Array.from(candidates).find((el) => {
    if (!isVisibleElement(el) || (!allowDisabled && !isActionEnabled(el))) return false;
    const text = getActionText(el);
    return /继续|続行|続ける|登録|作成|完了|continue|submit|创建|create|जारी\s+रखें|आगे|सबमिट|बनाएं|बनाएँ|खाता\s+बनाएं|अकाउंट\s+बनाएं/i.test(text);
  }) || null;
}

function getAuthRetryButton({ allowDisabled = false } = {}) {
  if (authPageRecovery?.getAuthRetryButton) {
    return authPageRecovery.getAuthRetryButton({ allowDisabled });
  }

  const direct = document.querySelector('button[data-dd-action-name="Try again"]');
  if (direct && isVisibleElement(direct) && (allowDisabled || isActionEnabled(direct))) {
    return direct;
  }

  const candidates = document.querySelectorAll('button, [role="button"]');
  return Array.from(candidates).find((el) => {
    if (!isVisibleElement(el) || (!allowDisabled && !isActionEnabled(el))) return false;
    const text = getActionText(el);
    return /重试|再试|もう一度試す|再試行|やり直す|try\s+again|फिर\s+से\s+कोशिश\s+करें|दोबारा\s+कोशिश\s+करें|पुनः\s+प्रयास/i.test(text);
  }) || null;
}

function getAuthTimeoutErrorPageState(options = {}) {
  const { pathPatterns = [] } = options;
  const path = location.pathname || '';
  if (pathPatterns.length && !pathPatterns.some((pattern) => pattern.test(path))) {
    return null;
  }

  if (authPageRecovery?.getAuthTimeoutErrorPageState) {
    const recoveryState = authPageRecovery.getAuthTimeoutErrorPageState(options);
    if (recoveryState || !isAuthMaxCheckAttemptsPage()) {
      return recoveryState;
    }
  }

  const text = getPageTextSnapshot();
  const titleMatched = AUTH_TIMEOUT_ERROR_TITLE_PATTERN.test(text)
    || AUTH_TIMEOUT_ERROR_TITLE_PATTERN.test(document.title || '');
  const detailMatched = AUTH_TIMEOUT_ERROR_DETAIL_PATTERN.test(text);
  const routeErrorMatched = AUTH_ROUTE_ERROR_PATTERN.test(text);
  const fetchFailedMatched = /failed\s+to\s+fetch|network\s+error|fetch\s+failed/i.test(text);
  const httpErrorPage = /this\s+page\s+isn'?t\s+working|currently\s+unable\s+to\s+handle\s+this\s+request|HTTP\s+ERROR\s+5\d\d|ERR_HTTP_RESPONSE_CODE_FAILURE/i.test(`${document.title || ''} ${text}`);
  const maxCheckAttemptsBlocked = isAuthMaxCheckAttemptsPage();
  const emailInUseBlocked = /email_in_use/i.test(text);
  const userAlreadyExistsBlocked = /user_already_exists/i.test(text);
  const retryButton = getAuthRetryButton({ allowDisabled: true });

  if (!titleMatched && !detailMatched && !routeErrorMatched && !fetchFailedMatched && !httpErrorPage && !maxCheckAttemptsBlocked && !emailInUseBlocked && !userAlreadyExistsBlocked) {
    return null;
  }
  if (!retryButton && !httpErrorPage && !maxCheckAttemptsBlocked && !emailInUseBlocked && !userAlreadyExistsBlocked) {
    return null;
  }

  return {
    path,
    url: location.href,
    retryButton,
    retryEnabled: Boolean(retryButton && isActionEnabled(retryButton)),
    titleMatched,
    detailMatched,
    routeErrorMatched,
    fetchFailedMatched,
    httpErrorPage,
    maxCheckAttemptsBlocked,
    emailInUseBlocked,
    userAlreadyExistsBlocked,
  };
}

function getSignupAuthRetryPathPatterns() {
  return [
    /\/create-account\/password(?:[/?#]|$)/i,
    /\/email-verification(?:[/?#]|$)/i,
  ];
}

function getLoginAuthRetryPathPatterns() {
  return [
    /^\/(?:[?#]|$)/i,
    /\/auth\/(?:login|authorize)(?:[/?#]|$)/i,
    /\/authorize(?:[/?#]|$)/i,
    /\/oauth\/authorize(?:[/?#]|$)/i,
    /\/sign-in-with-chatgpt(?:[/?#]|$)/i,
    /\/u\/login(?:[/?#]|$)/i,
    /\/login(?:[/?#]|$)/i,
    /\/log-in(?:[/?#]|$)/i,
    /\/email-verification(?:[/?#]|$)/i,
  ];
}

function getAuthRetryPathPatternsForFlow(flow = 'auth') {
  switch (flow) {
    case 'signup':
    case 'signup_password':
      return getSignupAuthRetryPathPatterns();
    case 'login':
      return getLoginAuthRetryPathPatterns();
    default:
      return [];
  }
}

function getCurrentAuthRetryPageState(flow = 'auth') {
  return getAuthTimeoutErrorPageState({
    pathPatterns: getAuthRetryPathPatternsForFlow(flow),
  });
}

async function recoverCurrentAuthRetryPage(payload = {}) {
  const performOperationWithDelay = typeof getOperationDelayRunner === 'function'
    ? getOperationDelayRunner()
    : async (metadata, operation) => {
        const rootScope = typeof window !== 'undefined' ? window : globalThis;
        const gate = rootScope?.CodexOperationDelay?.performOperationWithDelay;
        return typeof gate === 'function' ? gate(metadata, operation) : operation();
      };
  const {
    flow = 'auth',
    isRecovered = null,
    logLabel = '',
    maxClickAttempts = 5,
    pathPatterns = null,
    stepKey = '',
    step = null,
    timeoutMs = 12000,
    waitAfterClickMs = 3000,
  } = payload;
  const operationStepKey = stepKey || (step === 8 || flow === 'login' ? 'oauth-login' : 'fetch-signup-code');
  const resolvedPathPatterns = Array.isArray(pathPatterns)
    ? pathPatterns
    : getAuthRetryPathPatternsForFlow(flow);
  async function getCustomRecoverySnapshot() {
    if (typeof isRecovered !== 'function') {
      return null;
    }
    try {
      const result = await isRecovered();
      if (!result) {
        return null;
      }
      return typeof result === 'object' ? result : { recovered: true };
    } catch {
      return null;
    }
  }
  if (authPageRecovery?.recoverAuthRetryPage) {
    return authPageRecovery.recoverAuthRetryPage({
      isRecovered,
      logLabel,
      maxClickAttempts,
      pathPatterns: resolvedPathPatterns,
      step,
      stepKey: operationStepKey,
      timeoutMs,
      waitAfterClickMs,
    });
  }

  const maxIdlePolls = timeoutMs > 0
    ? Math.max(1, Math.ceil(timeoutMs / Math.max(1, 250)))
    : Number.POSITIVE_INFINITY;
  let clickCount = 0;
  let idlePollCount = 0;
  while (clickCount < maxClickAttempts) {
    throwIfStopped();
    const customRecovery = await getCustomRecoverySnapshot();
    if (customRecovery) {
      return {
        ...customRecovery,
        recovered: true,
        clickCount,
        customRecovered: true,
        url: customRecovery.url || location.href,
      };
    }

    const retryState = getAuthTimeoutErrorPageState({ pathPatterns: resolvedPathPatterns });
    if (!retryState) {
      return {
        recovered: clickCount > 0,
        clickCount,
        url: location.href,
      };
    }

    if (retryState.maxCheckAttemptsBlocked) {
      throw new Error('CF_SECURITY_BLOCKED::您已触发Cloudflare 安全防护系统，已完全停止流程，请不要短时间内多次进行重新发送验证码，连续刷新、反复点击重试会加重风控；请先关闭页面等待 15-30 分钟，让系统的临时限制自动解除。或者更换浏览器');
    }
    if (retryState.userAlreadyExistsBlocked) {
      throw createSignupUserAlreadyExistsError();
    }
    if (retryState.retryButton && retryState.retryEnabled) {
      idlePollCount = 0;
      clickCount += 1;
      log(`${logLabel || `步骤 ${step || '?'}：检测到重试页，正在点击“重试”恢复`}（第 ${clickCount} 次）...`, 'warn');
      await humanPause(300, 800);
      await performOperationWithDelay({ stepKey: operationStepKey, kind: 'click', label: 'auth-retry-click' }, async () => {
        simulateClick(retryState.retryButton);
      });
      const settleStart = Date.now();
      while (Date.now() - settleStart < waitAfterClickMs) {
        throwIfStopped();
        const settledRecovery = await getCustomRecoverySnapshot();
        if (settledRecovery) {
          return {
            ...settledRecovery,
            recovered: true,
            clickCount,
            customRecovered: true,
            url: settledRecovery.url || location.href,
          };
        }
        if (!getAuthTimeoutErrorPageState({ pathPatterns: resolvedPathPatterns })) {
          return {
            recovered: true,
            clickCount,
            url: location.href,
          };
        }
        await sleep(250);
      }
      continue;
    }

    idlePollCount += 1;
    if (idlePollCount >= maxIdlePolls) {
      throw new Error(`${logLabel || `步骤 ${step || '?'}：重试页恢复`}超时：重试按钮长时间不可点击。URL: ${location.href}`);
    }

    await sleep(250);
  }

  const finalRetryState = getAuthTimeoutErrorPageState({ pathPatterns: resolvedPathPatterns });
  const customRecovery = await getCustomRecoverySnapshot();
  if (customRecovery) {
    return {
      ...customRecovery,
      recovered: true,
      clickCount,
      customRecovered: true,
      url: customRecovery.url || location.href,
    };
  }
  if (!finalRetryState) {
    return {
      recovered: clickCount > 0,
      clickCount,
      url: location.href,
    };
  }
  if (finalRetryState.maxCheckAttemptsBlocked) {
    throw new Error('CF_SECURITY_BLOCKED::您已触发Cloudflare 安全防护系统，已完全停止流程，请不要短时间内多次进行重新发送验证码，连续刷新、反复点击重试会加重风控；请先关闭页面等待 15-30 分钟，让系统的临时限制自动解除。或者更换浏览器');
  }
  if (finalRetryState.userAlreadyExistsBlocked) {
    throw createSignupUserAlreadyExistsError();
  }

  throw new Error(`${logLabel || `步骤 ${step || '?'}：重试页恢复`}失败：已连续点击“重试” ${maxClickAttempts} 次，页面仍未恢复。URL: ${location.href}`);
}

function getSignupPasswordTimeoutErrorPageState() {
  return getAuthTimeoutErrorPageState({
    pathPatterns: getSignupAuthRetryPathPatterns(),
  });
}

function getLoginTimeoutErrorPageState() {
  return getAuthTimeoutErrorPageState({
    pathPatterns: getLoginAuthRetryPathPatterns(),
  });
}

function getLoginInputAttributeText(input) {
  return {
    type: String(input?.getAttribute?.('type') || input?.type || '').trim().toLowerCase(),
    autocomplete: String(input?.getAttribute?.('autocomplete') || '').trim().toLowerCase(),
    name: String(input?.getAttribute?.('name') || input?.name || '').trim(),
    id: String(input?.getAttribute?.('id') || input?.id || '').trim(),
    placeholder: String(input?.getAttribute?.('placeholder') || '').trim(),
    ariaLabel: String(input?.getAttribute?.('aria-label') || '').trim(),
  };
}

function isLoginEmailLikeInput(input) {
  const summary = getLoginInputAttributeText(input);
  const nameId = `${summary.name} ${summary.id}`;
  const labelText = `${summary.placeholder} ${summary.ariaLabel}`;
  return summary.type === 'email'
    || summary.autocomplete === 'email'
    || /email/i.test(nameId)
    || /email|电子邮件|邮箱/i.test(labelText);
}

function getLoginEmailInput() {
  const input = Array.from(document.querySelectorAll([
    'input[type="email"]',
    'input[autocomplete="email"]',
    'input[name="email"]',
    'input[name="username"]',
    'input[autocomplete="username"]',
    'input[id*="email" i]',
    'input[placeholder*="email" i]',
    'input[placeholder*="Email"]',
    'input[placeholder*="电子邮件"]',
    'input[placeholder*="邮箱"]',
    'input[aria-label*="email" i]',
    'input[aria-label*="电子邮件"]',
    'input[aria-label*="邮箱"]',
  ].join(', '))).find((candidate) => isVisibleElement(candidate)) || null;
  if (!input) {
    return null;
  }
  return input;
}

function getLoginPasswordInput() {
  const input = document.querySelector('input[type="password"]');
  return input && isVisibleElement(input) ? input : null;
}

function getLoginSubmitButton({ allowDisabled = false } = {}) {
  const direct = document.querySelector('button[type="submit"], input[type="submit"]');
  if (direct && isVisibleElement(direct) && (allowDisabled || isActionEnabled(direct))) {
    return direct;
  }

  const candidates = document.querySelectorAll(
    'button, a, [role="button"], [role="link"], input[type="button"], input[type="submit"]'
  );
  return Array.from(candidates).find((el) => {
    if (!isVisibleElement(el) || (!allowDisabled && !isActionEnabled(el))) return false;
    const text = getActionText(el);
    if (!text || ONE_TIME_CODE_LOGIN_PATTERN.test(text)) return false;
    return /continue|next|submit|sign\s*in|log\s*in|继续|下一步|登录/i.test(text);
  }) || null;
}

function findLoginEntryTrigger() {
  const candidates = Array.from(document.querySelectorAll(
    'button, a, [role="button"], [role="link"], input[type="button"], input[type="submit"]'
  )).filter((el) => isVisibleElement(el) && isActionEnabled(el));

  const preferred = candidates.find((el) => {
    const text = getActionText(el);
    if (!text || LOGIN_CODE_ONLY_ACTION_PATTERN.test(text) || LOGIN_EXTERNAL_IDP_PATTERN.test(text)) return false;
    return /continue\s+(?:with|using)\s+email|use\s+(?:an?\s+)?email|email\s+address|邮箱|电子邮件/i.test(text);
  });
  if (preferred) return preferred;

  return candidates.find((el) => {
    const text = getActionText(el);
    if (!text || LOGIN_CODE_ONLY_ACTION_PATTERN.test(text) || LOGIN_EXTERNAL_IDP_PATTERN.test(text)) return false;
    return LOGIN_ENTRY_ACTION_PATTERN.test(text);
  }) || null;
}

function findLoginMoreOptionsTrigger() {
  const candidates = Array.from(document.querySelectorAll(
    'button, a, [role="button"], [role="link"], input[type="button"], input[type="submit"]'
  )).filter((el) => isVisibleElement(el) && isActionEnabled(el));

  return candidates.find((el) => {
    const text = getActionText(el);
    if (!text || LOGIN_EXTERNAL_IDP_PATTERN.test(text)) return false;
    return LOGIN_MORE_OPTIONS_PATTERN.test(text);
  }) || null;
}

function findChooseAccountExistingSessionButton({ allowDisabled = false } = {}) {
  const candidates = Array.from(document.querySelectorAll(
    'button[name="session_id"], button[data-dd-action-name], button'
  ));
  return candidates.find((el) => {
    if (!isVisibleElement(el)) return false;
    if (!allowDisabled && !isActionEnabled(el)) return false;
    const ddActionName = String(el.getAttribute?.('data-dd-action-name') || '').trim().toLowerCase();
    const name = String(el.getAttribute?.('name') || '').trim().toLowerCase();
    const value = String(el.getAttribute?.('value') || '').trim();
    const text = getActionText(el);
    return (
      ddActionName === 'select existing session'
      || (name === 'session_id' && Boolean(value))
      || (/选择帐户|选择账户|select\s+account|欢迎回来|welcome\s+back/i.test(text) && Boolean(value))
    );
  }) || null;
}

function isChooseAccountPageReady() {
  const path = `${location.pathname || ''} ${location.href || ''}`;
  const pageText = getPageTextSnapshot();
  if (/\/choose-an-account(?:[/?#]|$)/i.test(path) && findChooseAccountExistingSessionButton({ allowDisabled: true })) {
    return true;
  }
  return /欢迎回来|welcome\s+back|选择一个帐户以继续|选择一个账户以继续|choose\s+an?\s+account\s+to\s+continue/i.test(pageText)
    && Boolean(findChooseAccountExistingSessionButton({ allowDisabled: true }));
}

function inspectLoginAuthState() {
  const retryState = getLoginTimeoutErrorPageState();
  const verificationTarget = getVerificationCodeTarget();
  const passwordInput = getLoginPasswordInput();
  const emailInput = getLoginEmailInput();
  const existingSessionButton = findChooseAccountExistingSessionButton({ allowDisabled: true });
  const switchTrigger = findOneTimeCodeLoginTrigger();
  const loginEntryTrigger = findLoginEntryTrigger();
  const moreOptionsTrigger = findLoginMoreOptionsTrigger();
  const submitButton = getLoginSubmitButton({ allowDisabled: true });
  const verificationVisible = isVerificationPageStillVisible();
  const addEmailPage = isAddEmailPageReady();
  const consentReady = isStep8Ready();
  const oauthConsentPage = isOAuthConsentPage();
  const verificationKind = verificationTarget || verificationVisible
    ? getLoginVerificationKind()
    : '';
  const baseState = {
    state: 'unknown',
    url: location.href,
    path: location.pathname || '',
    displayedEmail: getLoginVerificationDisplayedEmail(),
    verificationKind,
    retryButton: retryState?.retryButton || null,
    retryEnabled: Boolean(retryState?.retryEnabled),
    titleMatched: Boolean(retryState?.titleMatched),
    detailMatched: Boolean(retryState?.detailMatched),
    authHttpErrorPage: Boolean(retryState?.httpErrorPage),
    maxCheckAttemptsBlocked: Boolean(retryState?.maxCheckAttemptsBlocked),
    emailInUseBlocked: Boolean(retryState?.emailInUseBlocked),
    verificationTarget,
    passwordInput,
    emailInput,
    existingSessionButton,
    submitButton,
    switchTrigger,
    loginEntryTrigger,
    moreOptionsTrigger,
    verificationVisible,
    addEmailPage,
    oauthConsentPage,
    consentReady,
  };

  if (retryState?.httpErrorPage) {
    return {
      ...baseState,
      state: 'auth_http_error_page',
    };
  }

  if (retryState) {
    return {
      ...baseState,
      state: 'login_timeout_error_page',
    };
  }

  if (verificationTarget) {
    return {
      ...baseState,
      state: 'verification_page',
    };
  }

  if (addEmailPage) {
    return {
      ...baseState,
      state: 'add_email_page',
    };
  }

  if (isChooseAccountPageReady()) {
    return {
      ...baseState,
      state: 'choose_account_page',
    };
  }

  if (passwordInput || switchTrigger) {
    return {
      ...baseState,
      state: 'password_page',
    };
  }

  if (emailInput) {
    return {
      ...baseState,
      state: 'email_page',
    };
  }

  if (verificationVisible) {
    return {
      ...baseState,
      state: 'verification_page',
    };
  }

  if (consentReady) {
    return {
      ...baseState,
      state: 'oauth_consent_page',
    };
  }

  if (loginEntryTrigger) {
    return {
      ...baseState,
      state: 'entry_page',
    };
  }

  return baseState;
}

function isRegisteredLoginTotpVerificationState(snapshot = null) {
  const stateName = String(snapshot?.state || '').trim().toLowerCase();
  const verificationKind = String(snapshot?.verificationKind || '').trim().toLowerCase();
  if (verificationKind !== 'totp') {
    return false;
  }
  return stateName === 'verification_page'
    || Boolean(snapshot?.verificationTarget)
    || Boolean(snapshot?.verificationVisible)
    || Boolean(snapshot?.hasVerificationTarget);
}

function serializeLoginAuthState(snapshot) {
  return {
    state: snapshot?.state || 'unknown',
    url: snapshot?.url || location.href,
    path: snapshot?.path || location.pathname || '',
    displayedEmail: snapshot?.displayedEmail || '',
    verificationKind: String(snapshot?.verificationKind || '').trim(),
    verificationErrorText: getVerificationErrorText(),
    retryEnabled: Boolean(snapshot?.retryEnabled),
    titleMatched: Boolean(snapshot?.titleMatched),
    detailMatched: Boolean(snapshot?.detailMatched),
    maxCheckAttemptsBlocked: Boolean(snapshot?.maxCheckAttemptsBlocked),
    emailInUseBlocked: Boolean(snapshot?.emailInUseBlocked),
    authHttpErrorPage: Boolean(snapshot?.authHttpErrorPage),
    hasVerificationTarget: Boolean(snapshot?.verificationTarget),
    hasPasswordInput: Boolean(snapshot?.passwordInput),
    hasEmailInput: Boolean(snapshot?.emailInput),
    hasExistingSessionButton: Boolean(snapshot?.existingSessionButton),
    hasSubmitButton: Boolean(snapshot?.submitButton),
    hasSwitchTrigger: Boolean(snapshot?.switchTrigger),
    hasLoginEntryTrigger: Boolean(snapshot?.loginEntryTrigger),
    hasMoreOptionsTrigger: Boolean(snapshot?.moreOptionsTrigger),
    verificationVisible: Boolean(snapshot?.verificationVisible),
    addEmailPage: Boolean(snapshot?.addEmailPage),
    oauthConsentPage: Boolean(snapshot?.oauthConsentPage),
    consentReady: Boolean(snapshot?.consentReady),
  };
}

function getLoginAuthStateLabel(snapshot) {
  const state = snapshot?.state;
  switch (state) {
    case 'verification_page':
      return '登录验证码页';
    case 'password_page':
      return '密码页';
    case 'email_page':
      return '邮箱输入页';
    case 'login_timeout_error_page':
      return '登录超时报错页';
    case 'auth_http_error_page':
      return '认证服务 HTTP 500 错误页';
    case 'oauth_consent_page':
      return 'OAuth 授权页';
    case 'entry_page':
      return '登录入口页';
    case 'add_email_page':
      return '添加邮箱页';
    case 'choose_account_page':
      return '已有账号选择页';
    default:
      return '未知页面';
  }
}

async function waitForKnownLoginAuthState(timeout = 15000) {
  const start = Date.now();
  let snapshot = normalizeStep6Snapshot(inspectLoginAuthState());

  while (Date.now() - start < timeout) {
    throwIfStopped();
    snapshot = normalizeStep6Snapshot(inspectLoginAuthState());
    if (snapshot.state !== 'unknown') {
      return snapshot;
    }
    await sleep(200);
  }

  return snapshot;
}

function getAuthLoginStepForLoginCodeStep(step = 8) {
  return Number(step) >= 11 ? 10 : 7;
}

async function waitForLoginVerificationPageReady(timeout = 10000, visibleStep = 8, options = {}) {
  const start = Date.now();
  let snapshot = inspectLoginAuthState();
  const authPayload = options?.authPayload || {};

  while (Date.now() - start < timeout) {
    throwIfStopped();
    snapshot = inspectLoginAuthState();
    if (snapshot.state === 'verification_page') {
      return snapshot;
    }
    if (snapshot.state !== 'unknown') {
      break;
    }
    await sleep(200);
  }

  const retryHint = isMembershipCheckAuthPayload(authPayload)
    ? '请重新执行获取/确认 AT。'
    : `请先重新完成步骤 ${Number(visibleStep) >= 11 ? 10 : 7}。`;
  throw new Error(
    `当前未进入登录验证码页面，${retryHint}当前状态：${getLoginAuthStateLabel(snapshot)}。URL: ${snapshot?.url || location.href}`
  );
}

function createStep6SuccessResult(snapshot, options = {}) {
  const result = {
    step6Outcome: 'success',
    state: snapshot?.state || 'verification_page',
    url: snapshot?.url || location.href,
    via: options.via || '',
    loginVerificationRequestedAt: options.loginVerificationRequestedAt || null,
    verificationKind: options.verificationKind || snapshot?.verificationKind || '',
    displayedEmail: snapshot?.displayedEmail || '',
  };

  if (options.skipLoginVerificationStep) {
    result.skipLoginVerificationStep = true;
  }
  if (options.directOAuthConsentPage) {
    result.directOAuthConsentPage = true;
  }

  return result;
}

function createStep6OAuthConsentSuccessResult(snapshot, options = {}) {
  return createStep6SuccessResult(snapshot, {
    ...options,
    via: options.via || 'oauth_consent_page',
    loginVerificationRequestedAt: null,
    skipLoginVerificationStep: true,
    directOAuthConsentPage: true,
  });
}

function createStep6AddEmailSuccessResult(snapshot, options = {}) {
  return {
    ...createStep6SuccessResult(snapshot, {
      ...options,
      via: options.via || 'add_email_page',
      loginVerificationRequestedAt: null,
    }),
    addEmailPage: true,
  };
}

function createStep6RecoverableResult(reason, snapshot, options = {}) {
  return {
    step6Outcome: 'recoverable',
    reason,
    state: snapshot?.state || 'unknown',
    url: snapshot?.url || location.href,
    message: options.message || '',
    loginVerificationRequestedAt: options.loginVerificationRequestedAt || null,
  };
}

async function createStep6LoginTimeoutRecoveryTransition(reason, snapshot, message, options = {}) {
  const {
    loginVerificationRequestedAt = null,
    visibleStep = 7,
    via = 'login_timeout_recovered',
    authPayload = {},
  } = options;
  let resolvedSnapshot = normalizeStep6Snapshot(snapshot || inspectLoginAuthState());
  let recovered = false;
  if (resolvedSnapshot?.state === 'login_timeout_error_page') {
    try {
      const recoveryResult = await recoverCurrentAuthRetryPage({
        flow: 'login',
        logLabel: isMembershipCheckAuthPayload(authPayload)
          ? formatMembershipAuthLogMessage(authPayload, '检测到登录超时报错，正在点击“重试”恢复当前页面')
          : `步骤 ${visibleStep}：检测到登录超时报错，正在点击“重试”恢复当前页面`,
        step: isMembershipCheckAuthPayload(authPayload) ? null : visibleStep,
        timeoutMs: 12000,
      });
      recovered = Boolean(recoveryResult?.recovered);
      if (recovered) {
        logOAuthLogin(authPayload, visibleStep, '登录超时报错页已点击“重试”，正在按恢复后的页面状态继续当前流程。', 'warn');
      }
    } catch (error) {
      if (/CF_SECURITY_BLOCKED::/i.test(String(error?.message || error || ''))) {
        throw error;
      }
      logOAuthLogin(authPayload, visibleStep, `登录超时报错页自动点击“重试”失败：${error.message}`, 'warn');
    }
  }

  resolvedSnapshot = recovered
    ? normalizeStep6Snapshot(await waitForKnownLoginAuthState(4000))
    : normalizeStep6Snapshot(inspectLoginAuthState());

  if (resolvedSnapshot.state === 'verification_page') {
    return {
      action: 'done',
      result: createStep6SuccessResult(resolvedSnapshot, {
        via,
        loginVerificationRequestedAt,
      }),
    };
  }

  if (resolvedSnapshot.state === 'oauth_consent_page') {
    return {
      action: 'done',
      result: createStep6OAuthConsentSuccessResult(resolvedSnapshot, {
        via,
      }),
    };
  }

  if (resolvedSnapshot.state === 'add_email_page') {
    return {
      action: 'done',
      result: createStep6AddEmailSuccessResult(resolvedSnapshot, {
        via: `${via}_add_email`,
      }),
    };
  }

  if (resolvedSnapshot.state === 'password_page') {
    logOAuthLogin(authPayload, visibleStep, '登录超时报错页恢复后已进入密码页，继续当前登录流程。', 'warn');
    return { action: 'password', snapshot: resolvedSnapshot };
  }

  if (resolvedSnapshot.state === 'email_page') {
    logOAuthLogin(authPayload, visibleStep, '登录超时报错页恢复后已回到邮箱输入页，继续当前登录流程。', 'warn');
    return { action: 'email', snapshot: resolvedSnapshot };
  }

  return {
    action: 'recoverable',
    result: createStep6RecoverableResult(reason, resolvedSnapshot, {
      message,
      loginVerificationRequestedAt,
    }),
  };
}

async function createStep6LoginTimeoutRecoverableResult(reason, snapshot, message, options = {}) {
  const transition = await createStep6LoginTimeoutRecoveryTransition(reason, snapshot, message, options);
  if (transition?.action === 'done' || transition?.action === 'recoverable') {
    return transition.result;
  }

  return createStep6RecoverableResult(reason, transition?.snapshot || normalizeStep6Snapshot(inspectLoginAuthState()), {
    message,
  });
}

async function finalizeStep6VerificationReady(options = {}) {
  const {
    visibleStep = 7,
    logLabel = `步骤 ${visibleStep} 收尾`,
    loginVerificationRequestedAt = null,
    timeout = 12000,
    via = 'verification_page_ready',
    authPayload = {},
  } = options;
  const start = Date.now();
  const settleDelayMs = 800;
  const maxRounds = Math.max(3, Math.ceil(timeout / settleDelayMs));
  let round = 0;

  while (Date.now() - start < timeout && round < maxRounds) {
    throwIfStopped();
    round += 1;
    logOAuthLogin(authPayload, visibleStep, `确认页面是否稳定停留在登录验证码阶段（第 ${round}/${maxRounds} 轮，短暂确认）...`, 'info');
    await sleep(settleDelayMs);

    const rawSnapshot = inspectLoginAuthState();
    const snapshot = normalizeStep6Snapshot(rawSnapshot);

    if (snapshot.state === 'verification_page') {
      logOAuthLogin(
        authPayload,
        visibleStep,
        '登录验证码页面已稳定就绪。',
        'ok'
      );
      return createStep6SuccessResult(snapshot, {
        via,
        loginVerificationRequestedAt,
      });
    }

    if (snapshot.state === 'oauth_consent_page') {
      logOAuthLogin(authPayload, visibleStep, '认证页已直接进入 OAuth 授权页，跳过登录验证码步骤。', 'ok');
      return createStep6OAuthConsentSuccessResult(snapshot, {
        via: `${via}_oauth_consent`,
      });
    }

    if (snapshot.state === 'add_email_page') {
      logOAuthLogin(authPayload, visibleStep, '认证页已进入添加邮箱页，登录阶段完成。', 'ok');
      return createStep6AddEmailSuccessResult(snapshot, {
        via: `${via}_add_email`,
      });
    }

    if (snapshot.state === 'login_timeout_error_page') {
      logOAuthLogin(authPayload, visibleStep, `页面进入登录超时报错页，准备自动恢复后重试步骤 ${visibleStep}。`, 'warn');
      return createStep6LoginTimeoutRecoverableResult(
        'login_timeout_error_page',
        snapshot,
        '登录验证码页面准备就绪前进入登录超时报错页。',
        { visibleStep, authPayload }
      );
    }

    if (snapshot.state === 'password_page' || snapshot.state === 'email_page') {
      return createStep6RecoverableResult('verification_page_unstable', snapshot, {
        message: `页面曾进入登录验证码阶段，但又回到了${getLoginAuthStateLabel(snapshot)}，准备重新执行步骤 ${visibleStep}。`,
        loginVerificationRequestedAt,
      });
    }

  }

  const rawSnapshot = inspectLoginAuthState();
  const snapshot = normalizeStep6Snapshot(rawSnapshot);
  if (snapshot.state === 'verification_page') {
    logOAuthLogin(
      authPayload,
      visibleStep,
      '登录验证码页面已稳定就绪。',
      'ok'
    );
    return createStep6SuccessResult(snapshot, {
      via,
      loginVerificationRequestedAt,
    });
  }
  if (snapshot.state === 'oauth_consent_page') {
    logOAuthLogin(authPayload, visibleStep, '认证页已直接进入 OAuth 授权页，跳过登录验证码步骤。', 'ok');
    return createStep6OAuthConsentSuccessResult(snapshot, {
      via: `${via}_oauth_consent`,
    });
  }
  if (snapshot.state === 'add_email_page') {
    logOAuthLogin(authPayload, visibleStep, '认证页已进入添加邮箱页，登录阶段完成。', 'ok');
    return createStep6AddEmailSuccessResult(snapshot, {
      via: `${via}_add_email`,
    });
  }
  if (snapshot.state === 'login_timeout_error_page') {
    logOAuthLogin(authPayload, visibleStep, `页面进入登录超时报错页，准备自动恢复后重试步骤 ${visibleStep}。`, 'warn');
    return createStep6LoginTimeoutRecoverableResult(
      'login_timeout_error_page',
      snapshot,
      '登录验证码页面准备就绪前进入登录超时报错页。',
      { visibleStep, authPayload }
    );
  }
  if (snapshot.state === 'password_page' || snapshot.state === 'email_page') {
    return createStep6RecoverableResult('verification_page_unstable', snapshot, {
      message: `页面曾进入登录验证码阶段，但又回到了${getLoginAuthStateLabel(snapshot)}，准备重新执行步骤 ${visibleStep}。`,
      loginVerificationRequestedAt,
    });
  }

  return createStep6RecoverableResult('verification_page_finalize_unknown', snapshot, {
    message: `登录验证码页面状态在收尾确认阶段未稳定，准备重新执行步骤 ${visibleStep}。`,
    loginVerificationRequestedAt,
  });
}

function normalizeStep6Snapshot(snapshot) {
  return snapshot;
}

function throwForStep6FatalState(snapshot, visibleStep = 7) {
  snapshot = normalizeStep6Snapshot(snapshot);
  switch (snapshot?.state) {
    case 'oauth_consent_page':
      return;
    case 'unknown':
      throw new Error(`无法识别当前登录页面状态。URL: ${snapshot?.url || location.href}`);
    default:
      return;
  }
}

async function triggerLoginSubmitAction(button, fallbackField) {
  const form = button?.form || fallbackField?.form || button?.closest?.('form') || fallbackField?.closest?.('form') || null;
  const performOperationWithDelay = typeof getOperationDelayRunner === 'function'
    ? getOperationDelayRunner()
    : async (metadata, operation) => {
        const rootScope = typeof window !== 'undefined' ? window : globalThis;
        const gate = rootScope?.CodexOperationDelay?.performOperationWithDelay;
        return typeof gate === 'function' ? gate(metadata, operation) : operation();
      };

  await humanPause(400, 1100);
  await performOperationWithDelay({ stepKey: 'oauth-login', kind: 'submit', label: 'login-submit' }, async () => {
    if (button && isActionEnabled(button)) {
      simulateClick(button);
      return;
    }

    if (form && typeof form.requestSubmit === 'function') {
      if (button && button.form === form) {
        form.requestSubmit(button);
      } else {
        form.requestSubmit();
      }
      return;
    }

    if (button && typeof button.click === 'function') {
      button.click();
      return;
    }

    throw new Error('未找到可用的登录提交按钮。URL: ' + location.href);
  });
}

function isSignupPasswordErrorPage() {
  return Boolean(getSignupPasswordTimeoutErrorPageState());
}

function isSignupEmailAlreadyExistsPage() {
  return isSignupPasswordPage() && SIGNUP_EMAIL_EXISTS_PATTERN.test(getPageTextSnapshot());
}

function inspectSignupVerificationState() {
  const postVerificationState = getStep4PostVerificationState();
  if (postVerificationState?.state === 'step5') {
    return { state: 'step5' };
  }

  if (postVerificationState?.state === 'logged_in_home') {
    return {
      state: 'logged_in_home',
      skipProfileStep: true,
      url: postVerificationState.url || location.href,
    };
  }

  if (postVerificationState?.state === 'passkey_enrollment') {
    return {
      state: 'passkey_enrollment',
      passkeyEnrollmentRequired: true,
      url: postVerificationState.url || location.href,
    };
  }

  const loginAuthState = inspectLoginAuthState();
  if (isRegisteredLoginTotpVerificationState(loginAuthState)) {
    return {
      state: 'registered_login_verification',
      loginAuthState,
    };
  }

  if (isSignupPasswordErrorPage()) {
    const timeoutPage = getSignupPasswordTimeoutErrorPageState();
    return {
      state: 'error',
      retryButton: timeoutPage?.retryButton || null,
      userAlreadyExistsBlocked: Boolean(timeoutPage?.userAlreadyExistsBlocked),
    };
  }

  if (isVerificationPageStillVisible()) {
    return { state: 'verification' };
  }

  if (isSignupEmailAlreadyExistsPage()) {
    return { state: 'email_exists' };
  }

  const passwordInput = getSignupPasswordInput();
  if (passwordInput) {
    return {
      state: 'password',
      passwordInput,
      submitButton: getSignupPasswordSubmitButton({ allowDisabled: true }),
      passwordErrorText: getSignupPasswordFieldErrorText(),
    };
  }

  return { state: 'unknown' };
}

async function waitForSignupVerificationTransition(timeout = 5000) {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    throwIfStopped();

    const snapshot = inspectSignupVerificationState();
    if (snapshot.state === 'verification' && !isSignupVerificationPageInteractiveReady(snapshot)) {
      await sleep(200);
      continue;
    }
    if (
      snapshot.state === 'step5'
      || snapshot.state === 'logged_in_home'
      || snapshot.state === 'passkey_enrollment'
      || snapshot.state === 'verification'
      || snapshot.state === 'error'
      || snapshot.state === 'email_exists'
      || snapshot.state === 'registered_login_verification'
    ) {
      return snapshot;
    }

    await sleep(200);
  }

  return inspectSignupVerificationState();
}

async function prepareSignupVerificationFlow(payload = {}, timeout = 30000) {
  const performOperationWithDelay = typeof getOperationDelayRunner === 'function'
    ? getOperationDelayRunner()
    : async (metadata, operation) => {
        const rootScope = typeof window !== 'undefined' ? window : globalThis;
        const gate = rootScope?.CodexOperationDelay?.performOperationWithDelay;
        return typeof gate === 'function' ? gate(metadata, operation) : operation();
      };
  const { password } = payload;
  const prepareSource = String(payload?.prepareSource || '').trim() || 'step4_execute';
  const prepareLogLabel = String(payload?.prepareLogLabel || '').trim()
    || (prepareSource === 'step3_finalize' ? '步骤 3 收尾' : '步骤 4 执行');
  const effectiveTimeout = Math.max(
    5000,
    Math.floor(Number(payload?.timeoutMs ?? timeout) || timeout)
  );
  const start = Date.now();
  let recoveryRound = 0;
  const maxRecoveryRounds = 3;
  let passwordPageDiagnosticsLogged = false;
  const isPasswordSubmitButtonReadyForRetry = (button) => {
    if (!button || !isActionEnabled(button)) {
      return false;
    }

    const ariaBusy = String(button.getAttribute?.('aria-busy') || '').trim().toLowerCase();
    if (ariaBusy === 'true') {
      return false;
    }

    const pendingAttr = [
      button.getAttribute?.('data-loading'),
      button.getAttribute?.('data-pending'),
      button.getAttribute?.('data-submitting'),
      button.getAttribute?.('data-state'),
    ]
      .map((value) => String(value || '').trim().toLowerCase())
      .filter(Boolean)
      .join(' ');
    if (/\b(?:true|loading|pending|submitting|busy)\b/.test(pendingAttr)) {
      return false;
    }

    let style = null;
    try {
      style = typeof window !== 'undefined' && window.getComputedStyle
        ? window.getComputedStyle(button)
        : null;
    } catch {
      style = null;
    }

    if (style?.pointerEvents === 'none') {
      return false;
    }

    const opacity = Number.parseFloat(style?.opacity || '');
    if (Number.isFinite(opacity) && opacity < 0.8) {
      return false;
    }

    return true;
  };

  while (Date.now() - start < effectiveTimeout && recoveryRound < maxRecoveryRounds) {
    throwIfStopped();

    const roundNo = recoveryRound + 1;
    log(`${prepareLogLabel}：正在等待页面进入验证码阶段（第 ${roundNo}/${maxRecoveryRounds} 轮，短轮询）...`, 'info');
    const snapshot = await waitForSignupVerificationTransition(2500);

    if (snapshot.state === 'step5') {
      log(`${prepareLogLabel}：页面已进入验证码后的下一阶段，本步骤按已完成处理。`, 'ok');
      return { ready: true, alreadyVerified: true, retried: recoveryRound, prepareSource };
    }

    if (snapshot.state === 'logged_in_home') {
      log(`${prepareLogLabel}：页面已直接进入 ChatGPT 已登录态，本步骤按已完成处理，并将跳过步骤 5。`, 'ok');
      return {
        ready: true,
        alreadyVerified: true,
        skipProfileStep: true,
        retried: recoveryRound,
        prepareSource,
      };
    }

    if (snapshot.state === 'passkey_enrollment') {
      log(`${prepareLogLabel}：页面已进入通行密钥创建页，本步骤按已完成处理，后续由步骤 5 自动点击“跳过”。`, 'ok');
      return {
        ready: true,
        alreadyVerified: true,
        passkeyEnrollmentRequired: true,
        retried: recoveryRound,
        prepareSource,
      };
    }

    if (snapshot.state === 'verification') {
      await waitForDocumentLoadComplete(15000, `${prepareLogLabel}：注册验证码页面`);
      await waitForVerificationCodeTarget(15000);
      log(`${prepareLogLabel}：验证码页面已完成加载并就绪${recoveryRound ? `（期间自动恢复 ${recoveryRound} 次）` : ''}。`, 'ok');
      return { ready: true, retried: recoveryRound, prepareSource };
    }

    if (snapshot.state === 'email_exists') {
      throw new Error('当前邮箱已存在，需要重新开始新一轮。');
    }

    if (snapshot.state === 'registered_login_verification') {
      const authState = snapshot.loginAuthState || {};
      throw createSignupUserAlreadyExistsError(
        `步骤 4：注册流程进入登录 TOTP 二次验证页（${authState.url || location.href}），说明当前邮箱已注册并启用 2FA，当前邮箱将标记为已用并切换下一个。`
      );
    }

    if (snapshot.state === 'error') {
      if (snapshot.userAlreadyExistsBlocked) {
        throw createSignupUserAlreadyExistsError();
      }
      recoveryRound += 1;
      await recoverCurrentAuthRetryPage({
        flow: 'signup',
        logLabel: `${prepareLogLabel}：检测到注册认证重试页，正在点击“重试”恢复（第 ${recoveryRound}/${maxRecoveryRounds} 次）`,
        step: 4,
        timeoutMs: 12000,
      });
      continue;
    }

    if (snapshot.state === 'password') {
      if (snapshot.passwordErrorText) {
        log(`${prepareLogLabel}：检测到密码页报错“${snapshot.passwordErrorText}”，当前轮将回到步骤 1 重新开始。`, 'warn');
        throw new Error(`步骤 3：密码页返回错误，当前轮需要重新开始。页面提示：${snapshot.passwordErrorText}`);
      }
      if (!passwordPageDiagnosticsLogged) {
        passwordPageDiagnosticsLogged = true;
        logSignupPasswordDiagnostics(`${prepareLogLabel}：页面仍停留在密码页`);
      }
      if (!password) {
        throw new Error('当前回到了密码页，但没有可用密码，无法自动重新提交。');
      }

      if ((snapshot.passwordInput.value || '') !== password) {
        log(`${prepareLogLabel}：页面仍停留在密码页，正在重新填写密码...`, 'warn');
        await humanPause(450, 1100);
        await performOperationWithDelay({ stepKey: 'fill-password', kind: 'fill', label: 'retry-signup-password' }, async () => {
          fillInput(snapshot.passwordInput, password);
        });
      }

      if (snapshot.submitButton && isPasswordSubmitButtonReadyForRetry(snapshot.submitButton)) {
        recoveryRound += 1;
        log(`${prepareLogLabel}：页面仍停留在密码页，正在重新点击“继续”（第 ${recoveryRound}/${maxRecoveryRounds} 次）...`, 'warn');
        await humanPause(350, 900);
        await performOperationWithDelay({ stepKey: 'fill-password', kind: 'submit', label: 'retry-submit-signup-password' }, async () => {
          simulateClick(snapshot.submitButton);
        });
        await sleep(1200);
        continue;
      }

      log(`${prepareLogLabel}：页面仍停留在密码页，但“继续”按钮暂不可用，准备继续等待（${recoveryRound}/${maxRecoveryRounds}）...`, 'warn');
      continue;
    }

    log(`${prepareLogLabel}：页面仍在切换中，准备继续等待（${recoveryRound}/${maxRecoveryRounds}）...`, 'warn');
  }

  throw new Error(`等待注册验证码页面就绪超时或自动恢复失败（已尝试 ${recoveryRound}/${maxRecoveryRounds} 轮）。URL: ${location.href}`);
}


async function waitForPostVerificationPasswordSubmitOutcome(step, options = {}) {
  const timeout = Math.max(5000, Number(options?.passwordSubmitOutcomeTimeoutMs) || 30000);
  const purpose = options?.purpose || '';
  const start = Date.now();

  while (Date.now() - start < timeout) {
    throwIfStopped();

    const retryState = getCurrentAuthRetryPageState('signup');
    if (retryState?.userAlreadyExistsBlocked) {
      throw createSignupUserAlreadyExistsError();
    }
    if (retryState) {
      throw new Error(`步骤 ${step}：密码提交后进入认证重试页，无法确认注册是否完成。URL: ${location.href}`);
    }

    const postVerificationState = getStep4PostVerificationState({ ignoreVerificationVisibility: true });
    if (postVerificationState?.state === 'logged_in_home') {
      return {
        success: true,
        skipProfileStep: true,
        url: postVerificationState.url || location.href,
      };
    }
    if (postVerificationState?.state === 'step5') {
      return { success: true };
    }
    if (postVerificationState?.state === 'passkey_enrollment') {
      return {
        success: true,
        passkeyEnrollmentRequired: true,
        url: postVerificationState.url || location.href,
      };
    }
    if (purpose === 'signup' && isEmailVerificationPage()) {
      return {
        success: true,
        emailVerificationRequired: true,
        emailVerificationPage: true,
        url: location.href,
      };
    }

    const snapshot = inspectSignupEntryState();
    if (snapshot.state === 'password_page') {
      if (snapshot.passwordErrorText) {
        throw new Error(`步骤 ${step}：密码提交后仍停留在密码页。页面提示：${snapshot.passwordErrorText}`);
      }
      await sleep(200);
      continue;
    }

    if (isVerificationPageStillVisible()) {
      return {
        invalidCode: true,
        errorText: getVerificationErrorText() || '密码提交后仍停留在验证码页面，准备重新发送验证码。',
      };
    }

    await sleep(200);
  }

  throw new Error(`步骤 ${step}：验证码后密码页已提交，但未能进入资料页、通行密钥页或已登录态。URL: ${location.href}`);
}

async function submitPasswordPageAfterVerificationIfNeeded(step, options = {}) {
  if (step !== 4) {
    return null;
  }

  const snapshot = inspectSignupEntryState();
  if (snapshot.state !== 'password_page' || !snapshot.passwordInput) {
    return null;
  }
  if (snapshot.passwordErrorText) {
    throw new Error(`步骤 4：验证码后密码页返回错误。页面提示：${snapshot.passwordErrorText}`);
  }

  const password = options?.password || '';
  if (!password) {
    throw new Error('步骤 4：验证码提交后进入密码页，但没有可用 GPT 密码，无法自动设置密码。');
  }

  log('步骤 4：验证码提交后进入密码页，正在自动设置 GPT 密码...', 'warn');
  await fillSignupPasswordPageAndSubmit(snapshot, password, {
    contextLabel: '步骤 4：验证码后密码页',
    deferredSubmit: false,
    requireSubmitButton: true,
    fillLabel: 'post-verification-signup-password',
    submitLabel: 'post-verification-submit-signup-password',
    submitInitialSleepMs: 300,
  });

  const outcome = await waitForPostVerificationPasswordSubmitOutcome(step, options);
  return {
    ...(outcome || {}),
    passwordSubmittedAfterVerification: true,
  };
}

async function waitForVerificationSubmitOutcome(step, timeout, options = {}) {
  const resolvedTimeout = timeout ?? (step === 8 ? 30000 : 12000);
  const purpose = options?.purpose || '';
  const start = Date.now();
  let recoveryCount = 0;
  const maxRecoveryCount = 2;

  while (Date.now() - start < resolvedTimeout) {
    throwIfStopped();

    const retryFlow = step === 4 ? 'signup' : 'login';
    const retryState = getCurrentAuthRetryPageState(retryFlow);
    if (retryState?.userAlreadyExistsBlocked) {
      throw createSignupUserAlreadyExistsError();
    }
    if (step === 4 && retryState?.maxCheckAttemptsBlocked) {
      throw createAuthMaxCheckAttemptsError();
    }
    if (step === 8 && retryState?.emailInUseBlocked) {
      throw createStep8EmailInUseError();
    }
    if (step === 8 && retryState?.maxCheckAttemptsBlocked) {
      throw createAuthMaxCheckAttemptsError();
    }
    if (retryState) {
      if (recoveryCount >= maxRecoveryCount) {
        throw new Error(`步骤 ${step}：验证码提交后连续进入认证重试页 ${maxRecoveryCount} 次，页面仍未恢复。URL: ${location.href}`);
      }
      recoveryCount += 1;
      log(`步骤 ${step}：验证码提交后进入认证重试页，正在自动恢复（${recoveryCount}/${maxRecoveryCount}）...`, 'warn');
      await recoverCurrentAuthRetryPage({
        flow: retryFlow,
        logLabel: `步骤 ${step}：验证码提交后检测到认证重试页，正在点击“重试”恢复`,
        step,
        timeoutMs: 12000,
      });
      continue;
    }

    if (step === 4) {
      if (isEmailAlreadyVerifiedPage()) {
        return createEmailAlreadyVerifiedOutcome();
      }
      const passwordOutcome = await submitPasswordPageAfterVerificationIfNeeded(step, options);
      if (passwordOutcome) {
        return passwordOutcome;
      }

      const postVerificationState = getStep4PostVerificationState({ ignoreVerificationVisibility: true });
      if (postVerificationState?.state === 'logged_in_home') {
        return {
          success: true,
          skipProfileStep: true,
          url: postVerificationState.url || location.href,
        };
      }
      if (postVerificationState?.state === 'step5') {
        return { success: true };
      }
      if (postVerificationState?.state === 'passkey_enrollment') {
        return {
          success: true,
          passkeyEnrollmentRequired: true,
          url: postVerificationState.url || location.href,
        };
      }
      if (purpose === 'signup' && isEmailVerificationPage()) {
        return {
          success: true,
          emailVerificationRequired: true,
          emailVerificationPage: true,
          url: location.href,
        };
      }
    }

    const errorText = getVerificationErrorText();
    if (errorText) {
      return { invalidCode: true, errorText };
    }

    if (step === 8 && isStep8Ready()) {
      return { success: true };
    }

    await sleep(150);
  }

  if (step === 4) {
    const signupRetryState = getCurrentAuthRetryPageState('signup');
    if (signupRetryState?.userAlreadyExistsBlocked) {
      throw createSignupUserAlreadyExistsError();
    }
    if (signupRetryState?.maxCheckAttemptsBlocked) {
      throw createAuthMaxCheckAttemptsError();
    }
    if (signupRetryState) {
      return {
        invalidCode: true,
        errorText: '验证码提交后仍停留在认证重试页，准备重新取码或停止当前流程。',
        url: location.href,
      };
    }

    if (isEmailAlreadyVerifiedPage()) {
      return createEmailAlreadyVerifiedOutcome();
    }

    const passwordOutcome = await submitPasswordPageAfterVerificationIfNeeded(step, options);
    if (passwordOutcome) {
      return passwordOutcome;
    }

    const postVerificationState = getStep4PostVerificationState({ ignoreVerificationVisibility: true });
    if (postVerificationState?.state === 'logged_in_home') {
      return {
        success: true,
        skipProfileStep: true,
        url: postVerificationState.url || location.href,
      };
    }
    if (postVerificationState?.state === 'step5') {
      return { success: true };
    }
    if (postVerificationState?.state === 'passkey_enrollment') {
      return {
        success: true,
        passkeyEnrollmentRequired: true,
        url: postVerificationState.url || location.href,
      };
    }
    if (purpose === 'signup' && isEmailVerificationPage()) {
      return {
        success: true,
        emailVerificationRequired: true,
        emailVerificationPage: true,
        url: location.href,
      };
    }
  }

  if (isVerificationPageStillVisible()) {
    return {
      invalidCode: true,
      errorText: getVerificationErrorText() || '提交后仍停留在验证码页面，准备重新发送验证码。',
    };
  }

  if (step === 4 && isEmailVerificationPage()) {
    return {
      invalidCode: true,
      errorText: getVerificationErrorText() || '验证码提交后仍停留在邮箱验证页，未确认进入资料页。',
      url: location.href,
    };
  }

  return { success: true, assumed: true };
}

function getVerificationSubmitButtonForTarget(codeInput, options = {}) {
  const { allowDisabled = false } = options;
  const form = codeInput?.form || codeInput?.closest?.('form') || null;
  const isUsableAction = (element) => {
    if (!element || !isVisibleElement(element)) return false;
    return allowDisabled || isActionEnabled(element);
  };

  const findSubmitInRoot = (root) => {
    if (!root?.querySelectorAll) return null;

    const directCandidates = root.querySelectorAll('button[type="submit"], input[type="submit"]');
    for (const element of directCandidates) {
      if (isUsableAction(element)) {
        return element;
      }
    }

    const textCandidates = root.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"]');
    return Array.from(textCandidates).find((element) => {
      if (!isUsableAction(element)) return false;
      const text = getActionText(element);
      return /verify|confirm|submit|continue|确认|验证|继续|続行|確認|認証|送信/i.test(text);
    }) || null;
  };

  return findSubmitInRoot(form) || findSubmitInRoot(document);
}

async function waitForVerificationSubmitButton(codeInput, timeout = 5000) {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    throwIfStopped();
    if (is405MethodNotAllowedPage()) {
      throw new Error('当前页面处于 405 错误恢复流程中，暂时无法定位验证码提交按钮。');
    }

    const button = getVerificationSubmitButtonForTarget(codeInput, { allowDisabled: false });
    if (button) {
      return button;
    }

    await sleep(150);
  }

  return null;
}

async function waitForVerificationCodeTarget(timeout = 10000) {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    throwIfStopped();
    if (is405MethodNotAllowedPage()) {
      throw new Error('当前页面处于 405 错误恢复流程中，暂时无法定位验证码输入框。');
    }

    const target = getVerificationCodeTarget();
    if (target) {
      return target;
    }

    await sleep(150);
  }

  throw new Error('未找到验证码输入框。URL: ' + location.href);
}

function isResetPasswordNewPasswordPage() {
  return /\/reset-password\/new-password(?:[/?#]|$)/i.test(location.pathname || '');
}

function getSetGptPasswordAuthRetryPathPatterns() {
  return [
    /\/reset-password\/new-password(?:[/?#]|$)/i,
    /\/email-verification(?:[/?#]|$)/i,
  ];
}

function getSetGptPasswordAuthRetryPageState() {
  return getAuthTimeoutErrorPageState({
    pathPatterns: getSetGptPasswordAuthRetryPathPatterns(),
  });
}

function isSetGptPasswordEmailVerificationPage() {
  if (isEmailVerificationPage()) {
    return true;
  }
  const pageText = getPageTextSnapshot();
  return /check\s+your\s+inbox|enter\s+the\s+code|we\s+just\s+sent|email\s+verification|resend|检查您的收件箱|输入我们刚刚向|重新发送|验证码|受信箱を確認|受信トレイ|お送りした検証コード|検証コードを入力|認証コード|確認コード|メールを再送信|इनबॉक्स\s+देखें|कोड\s+दर्ज\s+करें|(?:सत्यापन|वेरिफिकेशन)\s+कोड|(?:ई-?मेल|कोड)\s+(?:फिर\s+से|दोबारा|पुनः)\s+भेजें/i.test(pageText);
}

function getSetGptPasswordRecoveredAuthRetrySnapshot() {
  if (!isResetPasswordNewPasswordPage()) {
    return null;
  }
  const resetInputs = getResetPasswordInputs();
  if (!resetInputs.passwordInput || !resetInputs.confirmInput) {
    return null;
  }
  return {
    state: 'new_password_page',
    url: location.href,
    passwordInputCount: resetInputs.inputs.length,
  };
}

async function recoverSetGptPasswordAuthRetryPage(visibleStep = 6, contextLabel = '设置 GPT 密码') {
  return recoverCurrentAuthRetryPage({
    flow: 'set_gpt_password',
    isRecovered: getSetGptPasswordRecoveredAuthRetrySnapshot,
    logLabel: `步骤 ${visibleStep}：${contextLabel}检测到认证超时页，正在点击“重试”恢复`,
    maxClickAttempts: 3,
    pathPatterns: getSetGptPasswordAuthRetryPathPatterns(),
    step: visibleStep,
    stepKey: 'set-gpt-password',
    timeoutMs: 15000,
    waitAfterClickMs: 3000,
  });
}

function getResetPasswordInputCandidates() {
  return Array.from(document.querySelectorAll(
    'input[type="password"], input[name*="password" i], input[autocomplete="new-password"]'
  )).filter((input) => isVisibleElement(input) && !input.disabled && !input.readOnly);
}

function getResetPasswordInputs() {
  const inputs = getResetPasswordInputCandidates();
  if (inputs.length < 2) {
    return {
      passwordInput: inputs[0] || null,
      confirmInput: inputs[1] || null,
      inputs,
    };
  }

  const newPasswordInput = inputs.find((input) => {
    const text = [
      input.name,
      input.id,
      input.getAttribute?.('autocomplete'),
      input.getAttribute?.('placeholder'),
      input.getAttribute?.('aria-label'),
    ].join(' ');
    return /new\s*password|password|密码|新しいパスワード|パスワードを設定|パスワード|नया\s+पासवर्ड|पासवर्ड\s+सेट|पासवर्ड/i.test(text);
  }) || inputs[0];
  const confirmInput = inputs.find((input) => input !== newPasswordInput && /re-?enter|confirm|again|确认|重复|再次|確認|再入力|もう一度|पुष्टि|कन्फर्म|दोबारा|फिर\s+से|पुनः/i.test([
    input.name,
    input.id,
    input.getAttribute?.('placeholder'),
    input.getAttribute?.('aria-label'),
  ].join(' '))) || inputs.find((input) => input !== newPasswordInput) || inputs[1];

  return {
    passwordInput: newPasswordInput,
    confirmInput,
    inputs,
  };
}

function getResetPasswordSubmitButton({ allowDisabled = false } = {}) {
  const { passwordInput } = getResetPasswordInputs();
  const form = passwordInput?.form || document.querySelector('form') || document;
  const isUsableAction = (element) => (
    element
    && isVisibleElement(element)
    && (allowDisabled || isActionEnabled(element))
  );

  const direct = form?.querySelector?.('button[type="submit"], input[type="submit"]');
  if (isUsableAction(direct)) {
    return direct;
  }

  const candidates = document.querySelectorAll(
    'button, [role="button"], input[type="button"], input[type="submit"]'
  );
  return Array.from(candidates).find((element) => {
    if (!isUsableAction(element)) return false;
    const text = getActionText(element);
    return /continue|submit|save|set\s*password|reset\s*password|继续|提交|保存|设置密码|続行|送信|保存|設定|更新|パスワードを設定|जारी\s+रखें|आगे|सबमिट|सहेजें|पासवर्ड\s+(?:सेट|रीसेट)\s+करें|अपडेट/i.test(text);
  }) || null;
}

function getResetPasswordFieldErrorText() {
  const pattern = /password.*(?:match|weak|short|required|invalid|same|reuse|reused)|(?:match|weak|short|required|invalid|same|reuse|reused).*password|密码.*(?:不一致|太短|太弱|无效|必填|重复|用过)|(?:不一致|太短|太弱|无效|必填|重复|用过).*密码|パスワード.*(?:一致しません|短すぎ|弱い|無効|必須|再利用|使用済み|同じパスワード)|(?:一致しません|短すぎ|弱い|無効|必須|再利用|使用済み|同じパスワード).*パスワード|पासवर्ड.*(?:(?:मेल|मिलान).{0,24}(?:नहीं|नही)|कमज़ोर|कमजोर|बहुत\s+छोटा|ज़रूरी|जरूरी|आवश्यक|अमान्य|गलत|(?:पहले|दोबारा)\s+(?:इस्तेमाल|उपयोग)|पुराना|समान)|(?:(?:मेल|मिलान).{0,24}(?:नहीं|नही)|कमज़ोर|कमजोर|बहुत\s+छोटा|ज़रूरी|जरूरी|आवश्यक|अमान्य|गलत|(?:पहले|दोबारा)\s+(?:इस्तेमाल|उपयोग)|पुराना|समान).{0,120}पासवर्ड/i;
  const candidates = Array.from(document.querySelectorAll(
    '[role="alert"], [aria-live], [data-error], .error, .text-error, .text-danger, p, div'
  ));
  for (const element of candidates) {
    if (!isVisibleElement(element)) continue;
    const text = String(element.textContent || '').replace(/\s+/g, ' ').trim();
    if (text && text.length <= 300 && pattern.test(text)) {
      return text;
    }
  }
  const pageText = getPageTextSnapshot();
  return pattern.test(pageText) ? pageText.slice(0, 300) : '';
}

function isResetPasswordReuseErrorText(value = '') {
  return /password.*(?:must\s+not\s+be\s+)?re(?:use|used)|re(?:use|used).*password|密码.*(?:重复|用过|不能.*相同)|(?:重复|用过|不能.*相同).*密码|パスワード.*(?:再利用|使用済み|同じパスワード)|(?:再利用|使用済み|同じパスワード).*パスワード|पासवर्ड.*(?:(?:पहले|दोबारा)\s+(?:इस्तेमाल|उपयोग)|पुराना|समान)|(?:(?:पहले|दोबारा)\s+(?:इस्तेमाल|उपयोग)|पुराना|समान).*पासवर्ड/i.test(String(value || ''));
}

function getSetGptPasswordPageState() {
  const resetInputs = getResetPasswordInputs();
  if (isResetPasswordNewPasswordPage()) {
    if (resetInputs.passwordInput && resetInputs.confirmInput) {
      return {
        state: 'new_password_page',
        url: location.href,
        passwordInputCount: resetInputs.inputs.length,
        errorText: getResetPasswordFieldErrorText(),
      };
    }
    const retryState = getSetGptPasswordAuthRetryPageState();
    if (retryState) {
      if (retryState.httpErrorPage) {
        return {
          state: 'auth_http_error_page',
          url: retryState.url || location.href,
          retryEnabled: false,
          maxCheckAttemptsBlocked: false,
          userAlreadyExistsBlocked: false,
        };
      }
      return {
        state: 'auth_retry_page',
        url: retryState.url || location.href,
        retryEnabled: Boolean(retryState.retryEnabled),
        maxCheckAttemptsBlocked: Boolean(retryState.maxCheckAttemptsBlocked),
        userAlreadyExistsBlocked: Boolean(retryState.userAlreadyExistsBlocked),
      };
    }
    return {
      state: 'new_password_loading',
      url: location.href,
      passwordInputCount: resetInputs.inputs.length,
      errorText: getResetPasswordFieldErrorText(),
    };
  }
  const retryState = getSetGptPasswordAuthRetryPageState();
  if (retryState) {
    if (retryState.httpErrorPage) {
      return {
        state: 'auth_http_error_page',
        url: retryState.url || location.href,
        retryEnabled: false,
        maxCheckAttemptsBlocked: false,
        userAlreadyExistsBlocked: false,
      };
    }
    return {
      state: 'auth_retry_page',
      url: retryState.url || location.href,
      retryEnabled: Boolean(retryState.retryEnabled),
      maxCheckAttemptsBlocked: Boolean(retryState.maxCheckAttemptsBlocked),
      userAlreadyExistsBlocked: Boolean(retryState.userAlreadyExistsBlocked),
    };
  }
  if (isEmailAlreadyVerifiedPage()) {
    return {
      state: 'email_already_verified_page',
      url: location.href,
      emailAlreadyVerified: true,
    };
  }
  if (isSetGptPasswordEmailVerificationPage()) {
    return {
      state: getVerificationCodeTarget() ? 'email_verification_page' : 'email_verification_loading',
      url: location.href,
      verificationErrorText: getVerificationErrorText(),
    };
  }
  return {
    state: 'unknown',
    url: location.href,
  };
}

function normalizeSetGptPasswordPrepareWaitMs(value, fallback = 15000) {
  const numeric = Math.floor(Number(value) || 0);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return fallback;
  }
  return Math.max(2000, Math.min(45000, numeric));
}

async function waitForSetGptPasswordPageState(predicate, timeout = 15000) {
  const start = Date.now();
  let snapshot = getSetGptPasswordPageState();
  while (Date.now() - start < timeout) {
    throwIfStopped();
    snapshot = getSetGptPasswordPageState();
    if (predicate(snapshot)) {
      return snapshot;
    }
    await sleep(200);
  }
  return snapshot;
}

async function waitForSetGptPasswordInteractiveReady(visibleStep, label, timeout = 15000, acceptedStates = []) {
  const accepted = new Set(Array.isArray(acceptedStates) ? acceptedStates : []);
  const start = Date.now();
  let snapshot = getSetGptPasswordPageState();

  while (Date.now() - start < timeout) {
    throwIfStopped();
    snapshot = getSetGptPasswordPageState();
    if (snapshot.state === 'auth_retry_page') {
      await recoverSetGptPasswordAuthRetryPage(visibleStep, label);
      continue;
    }
    if (accepted.has(snapshot.state)) {
      if (!isDocumentLoadComplete()) {
        log(
          `${label}当前 readyState=${getDocumentReadyStateSnapshot()}，但页面关键控件已就绪，继续执行。`,
          'warn',
          { step: visibleStep, stepKey: 'set-gpt-password' }
        );
      }
      return snapshot;
    }
    if (isDocumentLoadComplete()) {
      return snapshot;
    }
    await sleep(150);
  }

  throw new Error(`${label}长时间未完成加载，当前 readyState=${getDocumentReadyStateSnapshot()}，页面状态 ${snapshot.state}。URL: ${snapshot.url || location.href}`);
}

function isChatGptHostForSettings() {
  return /^(?:www\.)?chatgpt\.com$/i.test(location.hostname || '')
    || /^chat\.openai\.com$/i.test(location.hostname || '');
}

const CHATGPT_SETTINGS_PASSWORD_ACTION_PATTERN = /密码|パスワード|पासवर्ड|(?:^|[\s_-])pass(?:word|wd)(?:[\s_-]|$)|change\s+password|set\s+(?:a\s+)?password|add\s+(?:a\s+)?password|manage\s+password/i;
const CHATGPT_SETTINGS_PASSWORD_REJECT_PATTERN = /安全密钥|通行密钥|セキュリティキー|パスキー|passkey|security\s+key|authenticator|authentication\s+app|mfa|2fa|two[-\s]*factor|one[-\s]*time\s+(?:password|passcode|code)|otp|text\s+message|sms|session|会话|高级|advanced|सुरक्षा\s+कुंजी|पासकी|प्रमाणक|ऑथेंटिकेटर|सत्र|उन्नत|एक\s+बार\s+(?:का\s+)?(?:पासवर्ड|कोड)/i;
const CHATGPT_SETTINGS_SECURITY_NAV_PATTERN = /账户安全与登录|账号安全与登录|account\s+security|security\s+and\s+login|login\s+and\s+security|セキュリティ|アカウントのセキュリティ|セキュリティとログイン|ログインとセキュリティ|सुरक्षा|खाता\s+सुरक्षा|(?:लॉग\s*इन|लॉगिन)\s+और\s+सुरक्षा|सुरक्षा\s+और\s+(?:लॉग\s*इन|लॉगिन)/i;

function getChatGptSettingsActionText(element) {
  return normalizeInlineText([
    getActionText(element),
    element?.textContent || '',
    element?.getAttribute?.('aria-label') || '',
    element?.getAttribute?.('title') || '',
    element?.getAttribute?.('data-testid') || '',
    element?.id || '',
  ].filter(Boolean).join(' '));
}

function isChatGptSettingsPasswordActionText(text = '') {
  const normalized = normalizeInlineText(text);
  if (!normalized || !CHATGPT_SETTINGS_PASSWORD_ACTION_PATTERN.test(normalized)) {
    return false;
  }
  return !CHATGPT_SETTINGS_PASSWORD_REJECT_PATTERN.test(normalized);
}

function getChatGptSettingsPasswordDiagnostics() {
  const actionCandidates = Array.from(document.querySelectorAll(
    'button, a, [role="button"], [role="link"], [tabindex], div, li'
  ));
  const visibleActions = actionCandidates
    .filter((element) => isVisibleElement(element))
    .map((element) => {
      const text = getChatGptSettingsActionText(element);
      return {
        tag: (element.tagName || '').toLowerCase(),
        role: element.getAttribute?.('role') || '',
        testId: element.getAttribute?.('data-testid') || '',
        text: text.slice(0, 120),
        enabled: isActionEnabled(element),
        passwordLike: isChatGptSettingsPasswordActionText(text),
        securityLike: CHATGPT_SETTINGS_SECURITY_NAV_PATTERN.test(text),
      };
    })
    .filter((item) => item.text)
    .slice(0, 18);

  return {
    url: location.href,
    title: document.title || '',
    readyState: document.readyState || '',
    hash: location.hash || '',
    hasPasswordAction: Boolean(getChatGptSettingsPasswordAction()),
    hasSecurityNavAction: Boolean(getChatGptSecuritySettingsNavAction()),
    visibleActions,
    bodyTextPreview: getPageTextSnapshot().slice(0, 260),
  };
}

function getChatGptSettingsPasswordAction() {
  if (!isChatGptHostForSettings()) {
    return null;
  }
  const candidates = Array.from(document.querySelectorAll(
    'button, a, [role="button"], [role="link"], [tabindex], div, li'
  ));
  const scored = [];

  for (const element of candidates) {
    if (!isVisibleElement(element)) continue;
    const text = getChatGptSettingsActionText(element);
    if (!text || text.length > 320) continue;
    if (!isChatGptSettingsPasswordActionText(text)) continue;
    const clickable = element.closest?.('button, a, [role="button"], [role="link"], [tabindex]') || element;
    if (!clickable || !isVisibleElement(clickable) || !isActionEnabled(clickable)) continue;
    const score = (
      (/[*•]{2,}|••|›|>|chevron|arrow/i.test(text) ? 4 : 0)
      + (/^(?:密码|password|パスワード|पासवर्ड)/i.test(text) ? 3 : 0)
      + (/(?:change|set|add|manage)\s+(?:a\s+)?password|पासवर्ड\s+(?:बदलें|सेट|जोड़ें)|(?:पासवर्ड\s+)?(?:बदलें|सेट|जोड़ें)/i.test(text) ? 2 : 0)
      + (clickable.matches?.('button, a, [role="button"], [role="link"]') ? 2 : 0)
      - Math.floor(text.length / 40)
    );
    scored.push({ element: clickable, score, text });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.element || null;
}

function getChatGptSecuritySettingsNavAction() {
  if (!isChatGptHostForSettings()) {
    return null;
  }
  const candidates = Array.from(document.querySelectorAll(
    'button, a, [role="button"], [role="link"], [tabindex], div, li'
  ));
  return candidates.find((element) => {
    if (!isVisibleElement(element) || !isActionEnabled(element)) return false;
    const text = getChatGptSettingsActionText(element);
    if (!text || text.length > 120) return false;
    return CHATGPT_SETTINGS_SECURITY_NAV_PATTERN.test(text);
  }) || null;
}

async function waitForChatGptSettingsPasswordAction(timeout = 20000) {
  const start = Date.now();
  let clickedSecurityNav = false;
  while (Date.now() - start < timeout) {
    throwIfStopped();
    const action = getChatGptSettingsPasswordAction();
    if (action) {
      return action;
    }
    if (!clickedSecurityNav) {
      const navAction = getChatGptSecuritySettingsNavAction();
      if (navAction) {
        clickedSecurityNav = true;
        await humanPause(250, 700);
        simulateClick(navAction);
      }
    }
    await sleep(250);
  }
  return null;
}

async function startSetGptPasswordResetFlow(payload = {}) {
  const visibleStep = resolveVisibleStep(payload, 6);
  await waitForDocumentLoadComplete(30000, `步骤 ${visibleStep}：ChatGPT 安全设置页`);

  const existingAuthState = getSetGptPasswordPageState();
  if (
    existingAuthState.state === 'email_verification_page'
    || existingAuthState.state === 'new_password_page'
    || existingAuthState.state === 'email_already_verified_page'
  ) {
    return prepareSetGptPasswordFlow(payload);
  }

  const passwordAction = await waitForChatGptSettingsPasswordAction(25000);
  if (!passwordAction) {
    throw new Error(`步骤 ${visibleStep}：未在 ChatGPT 安全设置页找到“密码”入口。诊断快照：${JSON.stringify(getChatGptSettingsPasswordDiagnostics())}`);
  }

  const performOperationWithDelay = typeof getOperationDelayRunner === 'function'
    ? getOperationDelayRunner()
    : async (_metadata, operation) => operation();
  await humanPause(350, 900);
  await performOperationWithDelay({ stepKey: 'set-gpt-password', kind: 'click', label: 'open-chatgpt-password-settings' }, async () => {
    simulateClick(passwordAction);
  });
  log(`步骤 ${visibleStep}：已点击 ChatGPT 安全设置里的“密码”入口，等待进入邮箱验证码页。`, 'info', { step: visibleStep, stepKey: 'set-gpt-password' });

  return {
    ready: false,
    resetTriggered: true,
    url: location.href,
  };
}

async function prepareSetGptPasswordFlow(payload = {}) {
  const visibleStep = resolveVisibleStep(payload, 6);
  const waitTimeoutMs = normalizeSetGptPasswordPrepareWaitMs(payload.waitTimeoutMs, 15000);
  const fallbackWaitTimeoutMs = normalizeSetGptPasswordPrepareWaitMs(
    payload.fallbackWaitTimeoutMs,
    waitTimeoutMs
  );
  const readySnapshot = await waitForSetGptPasswordInteractiveReady(
    visibleStep,
    `步骤 ${visibleStep}：设置 GPT 密码页`,
    waitTimeoutMs,
    ['email_verification_page', 'new_password_page', 'email_already_verified_page']
  );
  const snapshot = ['email_verification_page', 'new_password_page', 'email_already_verified_page'].includes(readySnapshot.state)
    ? readySnapshot
    : await waitForSetGptPasswordPageState(
        (state) => state.state === 'email_verification_page'
          || state.state === 'new_password_page'
          || state.state === 'email_already_verified_page',
        fallbackWaitTimeoutMs
      );

  if (snapshot.state === 'new_password_page') {
    log(`步骤 ${visibleStep}：已在设置新密码页，准备直接填写 GPT 密码。`, 'info', { step: visibleStep, stepKey: 'set-gpt-password' });
    return {
      ready: true,
      alreadyOnNewPasswordPage: true,
      url: snapshot.url,
    };
  }
  if (snapshot.state === 'email_already_verified_page') {
    log(`步骤 ${visibleStep}：设置 GPT 密码邮箱已验证，准备直接进入新密码页。`, 'ok', { step: visibleStep, stepKey: 'set-gpt-password' });
    return {
      ready: true,
      emailAlreadyVerified: true,
      requiresNewPasswordNavigation: true,
      url: snapshot.url,
    };
  }
  if (snapshot.state === 'email_verification_page') {
    log(`步骤 ${visibleStep}：设置 GPT 密码邮箱验证码页已就绪。`, 'info', { step: visibleStep, stepKey: 'set-gpt-password' });
    return {
      ready: true,
      emailVerificationPage: true,
      url: snapshot.url,
    };
  }

  throw new Error(`步骤 ${visibleStep}：未进入 OpenAI 设置密码邮箱验证页或新密码页，当前状态 ${snapshot.state}。URL: ${snapshot.url}`);
}

async function waitForSetGptPasswordCodeSubmitOutcome(visibleStep, timeout = 30000) {
  const start = Date.now();
  let lastSnapshot = getSetGptPasswordPageState();
  while (Date.now() - start < timeout) {
    throwIfStopped();
    lastSnapshot = getSetGptPasswordPageState();
    if (lastSnapshot.state === 'auth_retry_page') {
      await recoverSetGptPasswordAuthRetryPage(visibleStep, '设置 GPT 密码验证码提交后');
      continue;
    }
    if (lastSnapshot.state === 'new_password_page') {
      return {
        success: true,
        newPasswordPage: true,
        url: lastSnapshot.url,
      };
    }
    if (lastSnapshot.state === 'email_already_verified_page') {
      return {
        success: true,
        emailAlreadyVerified: true,
        requiresNewPasswordNavigation: true,
        url: lastSnapshot.url,
      };
    }
    if (lastSnapshot.verificationErrorText) {
      return {
        invalidCode: true,
        errorText: lastSnapshot.verificationErrorText,
        url: lastSnapshot.url,
      };
    }
    if (lastSnapshot.state === 'unknown' && !isEmailVerificationPage()) {
      return {
        success: false,
        unexpectedUrl: true,
        url: lastSnapshot.url,
      };
    }
    await sleep(200);
  }

  return {
    invalidCode: true,
    errorText: getVerificationErrorText() || `验证码提交后未进入设置新密码页，当前状态 ${lastSnapshot.state}。`,
    url: lastSnapshot.url || location.href,
  };
}

async function submitSetGptPasswordVerificationCode(payload = {}) {
  const visibleStep = resolveVisibleStep(payload, 6);
  const code = String(payload.code || '').trim();
  if (!code) {
    throw new Error(`步骤 ${visibleStep}：未提供设置 GPT 密码验证码。`);
  }
  if (isResetPasswordNewPasswordPage()) {
    return {
      success: true,
      alreadyOnNewPasswordPage: true,
      url: location.href,
    };
  }

  const readySnapshot = await waitForSetGptPasswordInteractiveReady(
    visibleStep,
    `步骤 ${visibleStep}：设置 GPT 密码邮箱验证码页`,
    15000,
    ['email_verification_page', 'new_password_page', 'email_already_verified_page']
  );
  if (readySnapshot.state === 'new_password_page') {
    return {
      success: true,
      alreadyOnNewPasswordPage: true,
      url: readySnapshot.url || location.href,
    };
  }
  if (readySnapshot.state === 'email_already_verified_page') {
    return {
      success: true,
      emailAlreadyVerified: true,
      requiresNewPasswordNavigation: true,
      url: readySnapshot.url || location.href,
    };
  }
  const performOperationWithDelay = typeof getOperationDelayRunner === 'function'
    ? getOperationDelayRunner()
    : async (_metadata, operation) => operation();
  const verificationTarget = await waitForVerificationCodeTarget(15000);

  log(`步骤 ${visibleStep}：正在填写设置 GPT 密码验证码：${code}`, 'info', { step: visibleStep, stepKey: 'set-gpt-password' });
  if (verificationTarget.type === 'split') {
    const splitInputs = verificationTarget.elements || [];
    await performOperationWithDelay({ stepKey: 'set-gpt-password', kind: 'grouped-code', label: 'set-gpt-password-split-code' }, async () => {
      for (let index = 0; index < 6 && index < splitInputs.length; index += 1) {
        const targetInput = splitInputs[index];
        try {
          targetInput.focus?.();
        } catch {}
        fillInput(targetInput, code[index]);
        try {
          targetInput.dispatchEvent(new KeyboardEvent('keyup', { key: code[index], bubbles: true }));
        } catch {}
      }
    });
    await waitForSplitVerificationInputsFilled(splitInputs, code, 2500);
    const submitButton = await waitForVerificationSubmitButton(splitInputs[0], 4000).catch(() => null);
    if (submitButton) {
      await humanPause(150, 450);
      await performOperationWithDelay({ stepKey: 'set-gpt-password', kind: 'submit', label: 'submit-set-gpt-password-code' }, async () => {
        simulateClick(submitButton);
      });
    }
  } else {
    await performOperationWithDelay({ stepKey: 'set-gpt-password', kind: 'fill', label: 'set-gpt-password-code' }, async () => {
      fillInput(verificationTarget.element, code);
    });
    const submitButton = await waitForVerificationSubmitButton(verificationTarget.element, 5000).catch(() => null);
    if (submitButton) {
      await humanPause(150, 450);
      await performOperationWithDelay({ stepKey: 'set-gpt-password', kind: 'submit', label: 'submit-set-gpt-password-code' }, async () => {
        simulateClick(submitButton);
      });
    }
  }

  const outcome = await waitForSetGptPasswordCodeSubmitOutcome(visibleStep);
  if (outcome.invalidCode) {
    log(`步骤 ${visibleStep}：设置 GPT 密码验证码被拒绝：${outcome.errorText}`, 'warn', { step: visibleStep, stepKey: 'set-gpt-password' });
  } else if (outcome.newPasswordPage) {
    log(`步骤 ${visibleStep}：设置 GPT 密码验证码已通过，进入新密码页。`, 'ok', { step: visibleStep, stepKey: 'set-gpt-password' });
  }
  return outcome;
}

async function waitForResetPasswordSubmitButton(timeout = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    throwIfStopped();
    const button = getResetPasswordSubmitButton({ allowDisabled: false });
    if (button) {
      return button;
    }
    await sleep(150);
  }
  return null;
}

function fillResetPasswordInputsWithPassword(password) {
  const { passwordInput, confirmInput } = getResetPasswordInputs();
  if (!passwordInput || !confirmInput) {
    return false;
  }
  fillInput(passwordInput, password);
  fillInput(confirmInput, password);
  return true;
}

async function waitForSetGptPasswordSubmitOutcome(visibleStep, timeout = 30000, options = {}) {
  const password = String(options.password || '').trim();
  const maxAuthRetryRecoveries = Math.max(1, Math.floor(Number(options.maxAuthRetryRecoveries) || 3));
  const maxSubmitClicks = Math.max(1, Math.floor(Number(options.maxSubmitClicks) || 3));
  const retryClickIntervalMs = Math.max(1000, Math.floor(Number(options.retryClickIntervalMs) || 3500));
  const start = Date.now();
  let lastUrl = location.href;
  let authRetryRecoveryCount = 0;
  let submitClickCount = 1;
  let lastSubmitClickAt = Date.now();

  while (Date.now() - start < timeout) {
    throwIfStopped();
    lastUrl = location.href;
    const snapshot = getSetGptPasswordPageState();

    if (snapshot.state === 'auth_retry_page') {
      if (authRetryRecoveryCount >= maxAuthRetryRecoveries) {
        throw new Error(`步骤 ${visibleStep}：GPT 密码提交后连续进入认证超时页 ${maxAuthRetryRecoveries} 次，页面仍未恢复。URL: ${snapshot.url || lastUrl}`);
      }
      authRetryRecoveryCount += 1;
      await recoverSetGptPasswordAuthRetryPage(visibleStep, 'GPT 密码提交后');
      lastSubmitClickAt = Date.now() - retryClickIntervalMs;
      await sleep(500);
      continue;
    }

    if (!isResetPasswordNewPasswordPage()) {
      return {
        success: true,
        gptPasswordSet: true,
        url: lastUrl,
        authRetryRecoveredCount: authRetryRecoveryCount,
        submitClickCount,
      };
    }

    if (
      snapshot.state === 'new_password_page'
      && submitClickCount < maxSubmitClicks
      && Date.now() - lastSubmitClickAt >= retryClickIntervalMs
    ) {
      const submitButton = getResetPasswordSubmitButton({ allowDisabled: false });
      if (submitButton) {
        submitClickCount += 1;
        if (password) {
          fillResetPasswordInputsWithPassword(password);
        }
        log(`步骤 ${visibleStep}：GPT 密码提交后仍停留在新密码页，正在重新提交（第 ${submitClickCount}/${maxSubmitClicks} 次）...`, 'warn', {
          step: visibleStep,
          stepKey: 'set-gpt-password',
        });
        await humanPause(350, 900);
        simulateClick(submitButton);
        lastSubmitClickAt = Date.now();
        await sleep(1000);
        continue;
      }
    }

    const errorText = snapshot.errorText || getResetPasswordFieldErrorText();
    if (errorText) {
      if (isResetPasswordReuseErrorText(errorText)) {
        return {
          success: false,
          passwordReused: true,
          errorText,
          url: lastUrl,
          authRetryRecoveredCount: authRetryRecoveryCount,
          submitClickCount,
        };
      }
      throw new Error(`步骤 ${visibleStep}：设置 GPT 密码失败：${errorText}`);
    }
    await sleep(250);
  }
  const finalSnapshot = getSetGptPasswordPageState();
  throw new Error(`步骤 ${visibleStep}：GPT 密码提交后仍停留在设置密码页（状态 ${finalSnapshot.state}，已恢复超时页 ${authRetryRecoveryCount}/${maxAuthRetryRecoveries} 次，已提交 ${submitClickCount}/${maxSubmitClicks} 次）。URL: ${finalSnapshot.url || lastUrl || location.href}`);
}

async function setGptPasswordOnResetPage(payload = {}) {
  const visibleStep = resolveVisibleStep(payload, 6);
  const password = String(payload.password || '').trim();
  if (!password) {
    throw new Error(`步骤 ${visibleStep}：缺少 GPT 密码，无法设置 OpenAI 登录密码。`);
  }

  const readySnapshot = await waitForSetGptPasswordInteractiveReady(
    visibleStep,
    `步骤 ${visibleStep}：OpenAI 新密码页`,
    15000,
    ['new_password_page']
  );
  const snapshot = readySnapshot.state === 'new_password_page'
    ? readySnapshot
    : await waitForSetGptPasswordPageState((state) => state.state === 'new_password_page', 15000);
  if (snapshot.state !== 'new_password_page') {
    throw new Error(`步骤 ${visibleStep}：未进入 /reset-password/new-password 设置密码页，当前状态 ${snapshot.state}。URL: ${snapshot.url}`);
  }

  const { passwordInput, confirmInput } = getResetPasswordInputs();
  if (!passwordInput || !confirmInput) {
    throw new Error(`步骤 ${visibleStep}：设置密码页未找到两个密码输入框。URL: ${location.href}`);
  }

  const performOperationWithDelay = typeof getOperationDelayRunner === 'function'
    ? getOperationDelayRunner()
    : async (_metadata, operation) => operation();
  await humanPause(150, 450);
  await performOperationWithDelay({ stepKey: 'set-gpt-password', kind: 'fill', label: 'set-gpt-password-new-password' }, async () => {
    fillInput(passwordInput, password);
    fillInput(confirmInput, password);
  });
  log(`步骤 ${visibleStep}：GPT 密码已填写到两个密码框。`, 'info', { step: visibleStep, stepKey: 'set-gpt-password' });

  const submitButton = await waitForResetPasswordSubmitButton(7000);
  if (!submitButton) {
    throw new Error(`步骤 ${visibleStep}：设置密码页未找到可点击的 Continue 按钮。URL: ${location.href}`);
  }

  await humanPause(150, 450);
  await performOperationWithDelay({ stepKey: 'set-gpt-password', kind: 'submit', label: 'submit-set-gpt-password' }, async () => {
    simulateClick(submitButton);
  });
  const waitForOutcome = payload.waitForOutcome !== false;
  log(
    waitForOutcome
      ? `步骤 ${visibleStep}：GPT 密码已提交，等待页面跳转确认。`
      : `步骤 ${visibleStep}：GPT 密码已提交，后台将轮询页面状态。`,
    'info',
    { step: visibleStep, stepKey: 'set-gpt-password' }
  );
  if (!waitForOutcome) {
    const submittedSnapshot = getSetGptPasswordPageState();
    return {
      submitted: true,
      pageState: submittedSnapshot.state || 'unknown',
      url: submittedSnapshot.url || location.href,
      errorText: submittedSnapshot.errorText || submittedSnapshot.verificationErrorText || '',
    };
  }
  return waitForSetGptPasswordSubmitOutcome(visibleStep, 30000, { password });
}

async function waitForSplitVerificationInputsFilled(inputs, code, timeout = 2500) {
  const expected = String(code || '').slice(0, 6);
  const start = Date.now();

  while (Date.now() - start < timeout) {
    throwIfStopped();
    const current = Array.from(inputs || [])
      .slice(0, expected.length)
      .map((input) => String(input?.value || '').trim())
      .join('');

    if (current === expected) {
      return true;
    }

    await sleep(100);
  }

  return false;
}

async function fillVerificationCode(step, payload) {
  const { code, signupProfile } = payload;
  if (!code) throw new Error('未提供验证码。');
  const performOperationWithDelay = typeof getOperationDelayRunner === 'function'
    ? getOperationDelayRunner()
    : async (metadata, operation) => {
        const rootScope = typeof window !== 'undefined' ? window : globalThis;
        const gate = rootScope?.CodexOperationDelay?.performOperationWithDelay;
        return typeof gate === 'function' ? gate(metadata, operation) : operation();
      };

  if (step === 4) {
    if (isEmailAlreadyVerifiedPage()) {
      if (typeof clearStep405RecoveryCount === 'function') clearStep405RecoveryCount(step);
      logVerificationCode(step, payload, `步骤 ${step}：检测到邮箱已完成验证，本次验证码提交按成功处理。`, 'ok');
      return createEmailAlreadyVerifiedOutcome();
    }

    const postVerificationState = getStep4PostVerificationState();
    if (postVerificationState?.state === 'logged_in_home') {
      if (typeof clearStep405RecoveryCount === 'function') clearStep405RecoveryCount(step);
      logVerificationCode(step, payload, `步骤 ${step}：检测到页面已进入 ChatGPT 已登录态，本次验证码提交按成功处理。`, 'ok');
      return {
        success: true,
        assumed: true,
        alreadyAdvanced: true,
        skipProfileStep: true,
        url: postVerificationState.url || location.href,
      };
    }
    if (postVerificationState?.state === 'step5') {
      if (typeof clearStep405RecoveryCount === 'function') clearStep405RecoveryCount(step);
      logVerificationCode(step, payload, `步骤 ${step}：检测到页面已进入下一阶段，本次验证码提交按成功处理。`, 'ok');
      return { success: true, assumed: true, alreadyAdvanced: true };
    }
  }
  if (step === 8) {
    if (isStep8Ready()) {
      logVerificationCode(step, payload, `步骤 ${step}：检测到页面已进入 OAuth 同意页，本次验证码提交按成功处理。`, 'ok');
      return { success: true, assumed: true, alreadyAdvanced: true };
    }
  }

  logVerificationCode(step, payload, `步骤 ${step}：正在填写验证码：${code}`);

  if (step === 8) {
    await waitForLoginVerificationPageReady(10000, step, {
      authPayload: payload,
    });
  }
  if (step === 4) {
    await waitForDocumentLoadComplete(15000, `步骤 ${step}：注册验证码页面`);
  }

  const combinedSignupProfilePage = step === 4
    && await waitForCombinedSignupVerificationProfilePage();
  if (combinedSignupProfilePage) {
    if (!signupProfile || !signupProfile.firstName || !signupProfile.lastName) {
      throw new Error('当前注册验证码页面要求同时填写资料，但未提供姓名或生日数据。');
    }
    await step5_fillNameBirthday({
      ...signupProfile,
      prefillOnly: true,
    });
  }

  // Find code input — could be a single input or multiple separate inputs
  // Retry with 405 error recovery if needed
  const maxRetries = 3;
  let codeInput = null;
  let splitInputs = null;

  for (let retry = 0; retry <= maxRetries; retry++) {
    throwIfStopped();

    // Before looking for input, check if page is in 405 error state
    if (is405MethodNotAllowedPage()) {
      logVerificationCode(step, payload, `步骤 ${step}：检测到 405 错误页面，正在恢复...`, 'warn');
      await handle405ResendError(step, 30000, payload);
      continue;
    }

    try {
      const verificationTarget = await waitForVerificationCodeTarget(10000);
      if (verificationTarget.type === 'split') {
        splitInputs = verificationTarget.elements;
      } else {
        codeInput = verificationTarget.element;
      }
      break; // Found it
    } catch {
      // No input found — check if it's a 405 error and can be recovered
      if (is405MethodNotAllowedPage() && retry < maxRetries) {
        logVerificationCode(step, payload, `步骤 ${step}：未找到验证码输入框且页面出现 405 错误，正在恢复...`, 'warn');
        await handle405ResendError(step, 30000, payload);
        continue;
      }

      throw new Error('未找到验证码输入框。URL: ' + location.href);
    }
  }

  if (splitInputs?.length >= 6) {
    logVerificationCode(step, payload, `步骤 ${step}：发现分开的单字符验证码输入框，正在逐个填写...`);
    await performOperationWithDelay({ stepKey: 'fetch-signup-code', kind: 'grouped-code', label: 'split-code' }, async () => {
      for (let i = 0; i < 6 && i < splitInputs.length; i++) {
        const targetInput = splitInputs[i];
        try {
          targetInput.focus?.();
        } catch {}
        fillInput(splitInputs[i], code[i]);
        try {
          targetInput.dispatchEvent(new KeyboardEvent('keyup', { key: code[i], bubbles: true }));
        } catch {}
      }
    });
    const filled = await waitForSplitVerificationInputsFilled(splitInputs, code, 2500);
    if (!filled) {
      const current = Array.from(splitInputs)
        .slice(0, 6)
        .map((input) => String(input?.value || '').trim() || '_')
        .join('');
      logVerificationCode(step, payload, `步骤 ${step}：分格验证码输入框未稳定呈现目标值，当前页面值为 ${current}，准备继续观察提交流程。`, 'warn');
    } else {
      logVerificationCode(step, payload, `步骤 ${step}：分格验证码输入框已稳定显示 ${code}。`, 'info');
    }

    await sleep(250);
    const splitSubmitBtn = await waitForVerificationSubmitButton(splitInputs[0], 2000).catch(() => null);
    if (splitSubmitBtn) {
      await humanPause(150, 450);
      await performOperationWithDelay({ stepKey: 'fetch-signup-code', kind: 'submit', label: 'submit-code' }, async () => {
        simulateClick(splitSubmitBtn);
      });
      logVerificationCode(step, payload, `步骤 ${step}：分格验证码已提交`);
    } else {
      logVerificationCode(step, payload, `步骤 ${step}：分格验证码页面未找到可点击提交按钮，继续等待页面自动推进。`, 'info');
    }

    const outcome = await waitForVerificationSubmitOutcome(step, undefined, payload);
    if (outcome.invalidCode) {
      logVerificationCode(step, payload, `步骤 ${step}：验证码被拒绝：${outcome.errorText}`, 'warn');
    } else if (outcome.emailAlreadyVerified) {
      logVerificationCode(step, payload, `步骤 ${step}：邮箱已验证，按成功继续。`, 'ok');
    } else if (outcome.emailVerificationRequired) {
      logVerificationCode(step, payload, `步骤 ${step}：验证码已通过，页面进入邮箱验证码验证。`, 'ok');
    } else {
      if (typeof clearStep405RecoveryCount === 'function') clearStep405RecoveryCount(step);
      logVerificationCode(step, payload, `步骤 ${step}：验证码已通过${outcome.assumed ? '（按成功推定）' : ''}。`, 'ok');
    }
    if (combinedSignupProfilePage && !outcome.invalidCode) {
      outcome.skipProfileStep = true;
      outcome.skipProfileStepReason = 'combined_verification_profile';
    }
    return outcome;
  }

  if (!codeInput) {
    throw new Error('未找到验证码输入框。URL: ' + location.href);
  }

  await performOperationWithDelay({ stepKey: step === 8 ? 'oauth-login' : 'fetch-signup-code', kind: 'fill', label: 'verification-code' }, async () => {
    fillInput(codeInput, code);
  });
  logVerificationCode(step, payload, `步骤 ${step}：验证码已填写`);

  // Submit
  await sleep(250);
  const submitBtn = await waitForVerificationSubmitButton(codeInput, 5000).catch(() => null);

  if (submitBtn) {
    await humanPause(150, 450);
    await performOperationWithDelay({ stepKey: step === 8 ? 'oauth-login' : 'fetch-signup-code', kind: 'submit', label: 'submit-code' }, async () => {
      simulateClick(submitBtn);
    });
    logVerificationCode(step, payload, `步骤 ${step}：验证码已提交`);
  } else {
    logVerificationCode(step, payload, `步骤 ${step}：未找到可提交的验证码按钮，先等待页面自动推进或反馈结果。`, 'warn');
  }

  const outcome = await waitForVerificationSubmitOutcome(step, undefined, payload);
  if (outcome.invalidCode) {
    logVerificationCode(step, payload, `步骤 ${step}：验证码被拒绝：${outcome.errorText}`, 'warn');
  } else if (outcome.emailAlreadyVerified) {
    logVerificationCode(step, payload, `步骤 ${step}：邮箱已验证，按成功继续。`, 'ok');
  } else if (outcome.emailVerificationRequired) {
    logVerificationCode(step, payload, `步骤 ${step}：验证码已通过，页面进入邮箱验证码验证。`, 'ok');
  } else {
    if (typeof clearStep405RecoveryCount === 'function') clearStep405RecoveryCount(step);
    logVerificationCode(step, payload, `步骤 ${step}：验证码已通过${outcome.assumed ? '（按成功推定）' : ''}。`, 'ok');
  }

  if (combinedSignupProfilePage && !outcome.invalidCode) {
    outcome.skipProfileStep = true;
    outcome.skipProfileStepReason = 'combined_verification_profile';
  }

  return outcome;
}

// ============================================================
// Step 7: Login with registered account (on OAuth auth page)
// ============================================================

function getStep6OptionMessage(value, snapshot) {
  return typeof value === 'function' ? value(snapshot) : String(value || '');
}

async function resolveStep6PostSubmitSnapshot(snapshot, options = {}) {
  const normalizedSnapshot = normalizeStep6Snapshot(snapshot || inspectLoginAuthState());
  const {
    via = 'post_submit',
    loginVerificationRequestedAt = null,
    oauthConsentVia = `${via}_oauth_consent`,
    timeoutRecoveryReason = 'login_timeout_error_page',
    timeoutRecoveryMessage = '登录提交后进入登录超时报错页。',
    timeoutRecoveryVia = `${via}_timeout_recovered`,
    allowPasswordAction = false,
    allowEmailAction = false,
    allowFinalPasswordAction = false,
    allowFinalEmailAction = false,
    allowFinalSwitchAction = false,
    visibleStep = 7,
    authPayload = {},
    final = false,
  } = options;

  if (normalizedSnapshot.state === 'verification_page') {
    return {
      action: 'done',
      result: createStep6SuccessResult(normalizedSnapshot, {
        via,
        loginVerificationRequestedAt,
      }),
    };
  }

  if (normalizedSnapshot.state === 'oauth_consent_page') {
    return {
      action: 'done',
      result: createStep6OAuthConsentSuccessResult(normalizedSnapshot, {
        via: oauthConsentVia,
      }),
    };
  }

  if (normalizedSnapshot.state === 'add_email_page') {
    return {
      action: 'done',
      result: createStep6AddEmailSuccessResult(normalizedSnapshot, {
        via: `${via}_add_email`,
      }),
    };
  }

  if (normalizedSnapshot.state === 'login_timeout_error_page') {
    const transition = await createStep6LoginTimeoutRecoveryTransition(
      timeoutRecoveryReason,
      normalizedSnapshot,
      timeoutRecoveryMessage,
      {
        visibleStep,
        authPayload,
        loginVerificationRequestedAt,
        via: timeoutRecoveryVia,
      }
    );
    if (transition.action === 'done') {
      return {
        action: 'done',
        result: transition.result,
      };
    }
    if (transition.action === 'password') {
      return { action: 'password', snapshot: transition.snapshot };
    }
    if (transition.action === 'email') {
      return { action: 'email', snapshot: transition.snapshot };
    }
    return {
      action: 'recoverable',
      result: transition.result,
    };
  }

  if (normalizedSnapshot.state === 'password_page') {
    if (allowPasswordAction || (final && allowFinalPasswordAction)) {
      return { action: 'password', snapshot: normalizedSnapshot };
    }
    if (final && allowFinalSwitchAction && normalizedSnapshot.switchTrigger) {
      return { action: 'switch', snapshot: normalizedSnapshot };
    }
  }

  if (normalizedSnapshot.state === 'email_page' && (allowEmailAction || (final && allowFinalEmailAction))) {
    return { action: 'email', snapshot: normalizedSnapshot };
  }

  return null;
}

async function waitForStep6PostSubmitTransition(options = {}) {
  const {
    timeout = 10000,
    stalledReason = 'post_submit_stalled',
    stalledMessage = '登录提交后未进入可识别的下一页。',
  } = options;
  const start = Date.now();
  let snapshot = normalizeStep6Snapshot(inspectLoginAuthState());

  while (Date.now() - start < timeout) {
    throwIfStopped();
    snapshot = normalizeStep6Snapshot(inspectLoginAuthState());
    const transition = await resolveStep6PostSubmitSnapshot(snapshot, {
      ...options,
      final: false,
    });
    if (transition) {
      return transition;
    }
    await sleep(250);
  }

  snapshot = normalizeStep6Snapshot(inspectLoginAuthState());
  const transition = await resolveStep6PostSubmitSnapshot(snapshot, {
    ...options,
    final: true,
  });
  if (transition) {
    return transition;
  }

  return {
    action: 'recoverable',
    result: createStep6RecoverableResult(stalledReason, snapshot, {
      message: stalledMessage,
      loginVerificationRequestedAt: options.loginVerificationRequestedAt || null,
    }),
  };
}

async function waitForStep6EmailSubmitTransition(emailSubmittedAt, timeout = 12000, options = {}) {
  return waitForStep6PostSubmitTransition({
    timeout,
    visibleStep: Math.floor(Number(options?.visibleStep) || 0) || 7,
    authPayload: options?.authPayload || {},
    via: 'email_submit',
    oauthConsentVia: 'email_submit_oauth_consent',
    loginVerificationRequestedAt: emailSubmittedAt,
    timeoutRecoveryMessage: '提交邮箱后进入登录超时报错页。',
    timeoutRecoveryVia: 'email_submit_timeout_recovered',
    allowPasswordAction: true,
    stalledReason: 'email_submit_stalled',
    stalledMessage: '提交邮箱后长时间未进入密码页或登录验证码页。',
  });
}

async function waitForStep6PasswordSubmitTransition(passwordSubmittedAt, timeout = 10000, options = {}) {
  return waitForStep6PostSubmitTransition({
    timeout,
    visibleStep: Math.floor(Number(options?.visibleStep) || 0) || 7,
    authPayload: options?.authPayload || {},
    via: 'password_submit',
    oauthConsentVia: 'password_submit_oauth_consent',
    loginVerificationRequestedAt: passwordSubmittedAt,
    timeoutRecoveryMessage: '提交密码后进入登录超时报错页。',
    timeoutRecoveryVia: 'password_submit_timeout_recovered',
    allowFinalSwitchAction: true,
    stalledReason: 'password_submit_stalled',
    stalledMessage: '提交密码后仍未进入登录验证码页。',
  });
}

async function waitForStep6SwitchTransition(loginVerificationRequestedAt, timeout = 10000, options = {}) {
  const transition = await waitForStep6PostSubmitTransition({
    timeout,
    visibleStep: Math.floor(Number(options?.visibleStep) || 0) || 7,
    authPayload: options?.authPayload || {},
    via: 'switch_to_one_time_code_login',
    oauthConsentVia: 'switch_to_one_time_code_oauth_consent',
    loginVerificationRequestedAt,
    timeoutRecoveryMessage: '切换到一次性验证码登录后进入登录超时报错页。',
    timeoutRecoveryVia: 'switch_to_one_time_code_timeout_recovered',
    stalledReason: 'one_time_code_switch_stalled',
    stalledMessage: '点击一次性验证码登录后仍未进入登录验证码页。',
  });

  if (transition.action === 'done' || transition.action === 'recoverable') {
    return transition.result;
  }
  return transition;
}

async function waitForLoginEntryOpenTransition(timeout = 10000) {
  const start = Date.now();
  let snapshot = normalizeStep6Snapshot(inspectLoginAuthState());

  while (Date.now() - start < timeout) {
    throwIfStopped();
    snapshot = normalizeStep6Snapshot(inspectLoginAuthState());
    if (snapshot.state !== 'unknown' && snapshot.state !== 'entry_page') {
      return snapshot;
    }
    await sleep(250);
  }

  return snapshot;
}

async function waitForChooseAccountTransition(timeout = 12000) {
  const start = Date.now();
  let snapshot = normalizeStep6Snapshot(inspectLoginAuthState());

  while (Date.now() - start < timeout) {
    throwIfStopped();
    snapshot = normalizeStep6Snapshot(inspectLoginAuthState());
    if (snapshot.state !== 'unknown' && snapshot.state !== 'choose_account_page') {
      return snapshot;
    }
    await sleep(250);
  }

  return snapshot;
}

async function step6ChooseExistingAccount(payload, snapshot) {
  const performOperationWithDelay = typeof getOperationDelayRunner === 'function'
    ? getOperationDelayRunner()
    : async (metadata, operation) => {
        const rootScope = typeof window !== 'undefined' ? window : globalThis;
        const gate = rootScope?.CodexOperationDelay?.performOperationWithDelay;
        return typeof gate === 'function' ? gate(metadata, operation) : operation();
      };
  const visibleStep = Math.floor(Number(payload?.visibleStep) || 0) || 7;
  const currentSnapshot = normalizeStep6Snapshot(snapshot || inspectLoginAuthState());
  const existingSessionButton = currentSnapshot.existingSessionButton || findChooseAccountExistingSessionButton();
  if (!existingSessionButton || !isActionEnabled(existingSessionButton)) {
    return createStep6RecoverableResult('missing_existing_session_button', currentSnapshot, {
      message: '当前已有账号选择页没有可点击的账号按钮。',
    });
  }

  logOAuthLogin(payload, visibleStep, '检测到已有账号选择页，优先点击已有账号继续登录。', 'info');
  await humanPause(350, 900);
  await performOperationWithDelay({ stepKey: 'oauth-login', kind: 'click', label: 'select-existing-session' }, async () => {
    simulateClick(existingSessionButton);
  });

  const nextSnapshot = normalizeStep6Snapshot(await waitForChooseAccountTransition(15000));
  if (nextSnapshot.state === 'verification_page') {
    return finalizeStep6VerificationReady({
      visibleStep,
      authPayload: payload,
      loginVerificationRequestedAt: null,
      via: 'choose_account_verification_page',
    });
  }
  if (nextSnapshot.state === 'oauth_consent_page') {
    return createStep6OAuthConsentSuccessResult(nextSnapshot, {
      via: 'choose_account_oauth_consent_page',
    });
  }
  if (nextSnapshot.state === 'add_email_page') {
    return createStep6AddEmailSuccessResult(nextSnapshot, {
      via: 'choose_account_add_email_page',
    });
  }
  if (nextSnapshot.state === 'login_timeout_error_page') {
    const transition = await createStep6LoginTimeoutRecoveryTransition(
      'choose_account_login_timeout',
      nextSnapshot,
      '点击已有账号后进入登录超时报错页。',
      { visibleStep, authPayload: payload, loginVerificationRequestedAt: null }
    );
    if (transition.action === 'done') return transition.result;
    if (transition.action === 'email') return step6LoginFromEmailPage(payload, transition.snapshot);
    if (transition.action === 'password') return step6LoginFromPasswordPage(payload, transition.snapshot);
    return transition.result;
  }
  if (nextSnapshot.state === 'email_page') {
    return step6LoginFromEmailPage(payload, nextSnapshot);
  }
  if (nextSnapshot.state === 'password_page') {
    return step6LoginFromPasswordPage(payload, nextSnapshot);
  }
  if (nextSnapshot.state === 'entry_page') {
    return step6OpenLoginEntry(payload, nextSnapshot);
  }
  return createStep6RecoverableResult('choose_account_stalled', nextSnapshot, {
    message: '点击已有账号后仍未进入验证码页、绑定邮箱页或 OAuth 授权页。',
  });
}

async function step6OpenLoginEntry(payload, snapshot) {
  const performOperationWithDelay = typeof getOperationDelayRunner === 'function'
    ? getOperationDelayRunner()
    : async (metadata, operation) => {
        const rootScope = typeof window !== 'undefined' ? window : globalThis;
        const gate = rootScope?.CodexOperationDelay?.performOperationWithDelay;
        return typeof gate === 'function' ? gate(metadata, operation) : operation();
      };
  const visibleStep = Math.floor(Number(payload?.visibleStep) || 0) || 7;
  const currentSnapshot = normalizeStep6Snapshot(snapshot || inspectLoginAuthState());
  const genericEntryTrigger = currentSnapshot.loginEntryTrigger || findLoginEntryTrigger();
  const trigger = genericEntryTrigger;
  if (!trigger || !isActionEnabled(trigger)) {
    return createStep6RecoverableResult('missing_login_entry_trigger', currentSnapshot, {
      message: '当前登录入口页没有可点击的邮箱登录入口。',
    });
  }

  logOAuthLogin(payload, visibleStep, `检测到登录入口页，正在点击 "${getActionText(trigger).slice(0, 80)}"...`, 'info');
  await humanPause(350, 900);
  await performOperationWithDelay({ stepKey: 'oauth-login', kind: 'click', label: 'open-login-entry' }, async () => {
    simulateClick(trigger);
  });
  const nextSnapshot = await waitForLoginEntryOpenTransition();

  if (nextSnapshot.state === 'email_page') {
    return step6LoginFromEmailPage(payload, nextSnapshot);
  }
  if (nextSnapshot.state === 'password_page') {
    return step6LoginFromPasswordPage(payload, nextSnapshot);
  }
  if (nextSnapshot.state === 'verification_page') {
    return finalizeStep6VerificationReady({
      visibleStep,
      authPayload: payload,
      loginVerificationRequestedAt: null,
      via: 'entry_open_verification_page',
    });
  }
  if (nextSnapshot.state === 'oauth_consent_page') {
    return createStep6OAuthConsentSuccessResult(nextSnapshot, {
      via: 'entry_open_oauth_consent_page',
    });
  }
  if (nextSnapshot.state === 'add_email_page') {
    return createStep6AddEmailSuccessResult(nextSnapshot, {
      via: 'entry_open_add_email_page',
    });
  }
  if (nextSnapshot.state === 'login_timeout_error_page') {
    const transition = await createStep6LoginTimeoutRecoveryTransition(
      'login_timeout_after_entry_open',
      nextSnapshot,
      '点击登录入口后进入登录超时报错页。',
      { visibleStep, authPayload: payload }
    );
    if (transition.action === 'done') return transition.result;
    if (transition.action === 'email') return step6LoginFromEmailPage(payload, transition.snapshot);
    if (transition.action === 'password') return step6LoginFromPasswordPage(payload, transition.snapshot);
    return transition.result;
  }

  return createStep6RecoverableResult('login_entry_open_stalled', nextSnapshot, {
    message: '点击登录入口后仍未进入邮箱/密码/验证码页。',
  });
}

async function step6SwitchToOneTimeCodeLogin(payload, snapshot) {
  const performOperationWithDelay = typeof getOperationDelayRunner === 'function'
    ? getOperationDelayRunner()
    : async (metadata, operation) => {
        const rootScope = typeof window !== 'undefined' ? window : globalThis;
        const gate = rootScope?.CodexOperationDelay?.performOperationWithDelay;
        return typeof gate === 'function' ? gate(metadata, operation) : operation();
      };
  const visibleStep = Math.floor(Number(payload?.visibleStep) || 0) || 7;
  const switchTrigger = snapshot?.switchTrigger || findOneTimeCodeLoginTrigger();
  if (!switchTrigger || !isActionEnabled(switchTrigger)) {
    return createStep6RecoverableResult('missing_one_time_code_trigger', normalizeStep6Snapshot(inspectLoginAuthState()), {
      message: '当前登录页没有可用的一次性验证码登录入口。',
    });
  }

  logOAuthLogin(payload, visibleStep, '已检测到一次性验证码登录入口，准备切换...', 'info');
  const loginVerificationRequestedAt = Date.now();
  await humanPause(350, 900);
  await performOperationWithDelay({ stepKey: 'oauth-login', kind: 'click', label: 'switch-one-time-code-login' }, async () => {
    simulateClick(switchTrigger);
  });
  logOAuthLogin(payload, visibleStep, '已点击一次性验证码登录', 'info');
  await sleep(1200);
  const result = await waitForStep6SwitchTransition(loginVerificationRequestedAt, 10000, {
    visibleStep,
    authPayload: payload,
  });
  if (result?.step6Outcome === 'success') {
    if (result.skipLoginVerificationStep || result.addEmailPage) {
      return result;
    }
    return finalizeStep6VerificationReady({
      visibleStep,
      authPayload: payload,
      loginVerificationRequestedAt: result.loginVerificationRequestedAt || loginVerificationRequestedAt,
      via: result.via || 'switch_to_one_time_code_login',
    });
  }
  if (result?.action === 'password') {
    return step6LoginFromPasswordPage(payload, result.snapshot);
  }
  if (result?.action === 'email') {
    return step6LoginFromEmailPage(payload, result.snapshot);
  }
  return result;
}

async function step6LoginFromPasswordPage(payload, snapshot) {
  const performOperationWithDelay = typeof getOperationDelayRunner === 'function'
    ? getOperationDelayRunner()
    : async (metadata, operation) => {
        const rootScope = typeof window !== 'undefined' ? window : globalThis;
        const gate = rootScope?.CodexOperationDelay?.performOperationWithDelay;
        return typeof gate === 'function' ? gate(metadata, operation) : operation();
      };
  const visibleStep = Math.floor(Number(payload?.visibleStep) || 0) || 7;
  const currentSnapshot = normalizeStep6Snapshot(snapshot || inspectLoginAuthState());
  const hasPassword = Boolean(String(payload?.password || '').trim());

  if (currentSnapshot.passwordInput) {
    if (!hasPassword) {
      if (currentSnapshot.switchTrigger) {
        logOAuthLogin(payload, visibleStep, '当前未提供密码，改走一次性验证码登录。', 'warn');
        return step6SwitchToOneTimeCodeLogin(payload, currentSnapshot);
      }

      return createStep6RecoverableResult('missing_password_and_one_time_code_trigger', currentSnapshot, {
        message: '登录时未提供密码，且当前页面没有可用的一次性验证码登录入口。',
      });
    }

    logOAuthLogin(payload, visibleStep, '已进入密码页，准备填写密码...', 'info');
    await humanPause(550, 1450);
    await performOperationWithDelay({ stepKey: 'oauth-login', kind: 'fill', label: 'login-password' }, async () => {
      fillInput(currentSnapshot.passwordInput, payload.password);
    });
    logOAuthLogin(payload, visibleStep, '已填写密码', 'info');

    await sleep(500);
    const passwordSubmittedAt = Date.now();
    await triggerLoginSubmitAction(currentSnapshot.submitButton, currentSnapshot.passwordInput);
    logOAuthLogin(payload, visibleStep, '已提交密码', 'info');

    const transition = await waitForStep6PasswordSubmitTransition(passwordSubmittedAt, STEP6_PASSWORD_SUBMIT_TRANSITION_TIMEOUT_MS, {
      visibleStep,
      authPayload: payload,
    });
    if (transition.action === 'done') {
      if (transition.result?.skipLoginVerificationStep || transition.result?.addEmailPage) {
        return transition.result;
      }
      return finalizeStep6VerificationReady({
        visibleStep,
        authPayload: payload,
        loginVerificationRequestedAt: transition.result.loginVerificationRequestedAt || passwordSubmittedAt,
        via: transition.result.via || 'password_submit',
      });
    }
    if (transition.action === 'recoverable') {
      logOAuthLogin(payload, visibleStep, transition.result.message || `提交密码后仍未进入登录验证码页面，准备重新执行步骤 ${visibleStep}。`, 'warn');
      return transition.result;
    }
    if (transition.action === 'password') {
      return step6LoginFromPasswordPage(payload, transition.snapshot);
    }
    if (transition.action === 'email') {
      return step6LoginFromEmailPage(payload, transition.snapshot);
    }
    if (transition.action === 'switch') {
      return step6SwitchToOneTimeCodeLogin(payload, transition.snapshot);
    }

    return createStep6RecoverableResult('password_submit_unknown', normalizeStep6Snapshot(inspectLoginAuthState()), {
      message: '提交密码后未得到可用的下一步状态。',
    });
  }

  if (currentSnapshot.switchTrigger) {
    return step6SwitchToOneTimeCodeLogin(payload, currentSnapshot);
  }

  return createStep6RecoverableResult('password_page_unactionable', currentSnapshot, {
    message: '当前停留在登录页，但没有可提交密码的输入框，也没有一次性验证码登录入口。',
  });
}

async function step6LoginFromEmailPage(payload, snapshot) {
  const performOperationWithDelay = typeof getOperationDelayRunner === 'function'
    ? getOperationDelayRunner()
    : async (metadata, operation) => {
        const rootScope = typeof window !== 'undefined' ? window : globalThis;
        const gate = rootScope?.CodexOperationDelay?.performOperationWithDelay;
        return typeof gate === 'function' ? gate(metadata, operation) : operation();
      };
  const visibleStep = Math.floor(Number(payload?.visibleStep) || 0) || 7;
  const currentSnapshot = normalizeStep6Snapshot(snapshot || inspectLoginAuthState());
  const emailInput = currentSnapshot.emailInput || getLoginEmailInput();
  if (!emailInput) {
    throw new Error('在登录页未找到邮箱输入框。URL: ' + location.href);
  }

  if ((emailInput.value || '').trim() !== payload.email) {
    await humanPause(500, 1400);
    await performOperationWithDelay({ stepKey: 'oauth-login', kind: 'fill', label: 'login-email' }, async () => {
      fillInput(emailInput, payload.email);
    });
    logOAuthLogin(payload, visibleStep, '已填写邮箱', 'info');
  } else {
    logOAuthLogin(payload, visibleStep, '邮箱已在输入框中，准备提交...', 'info');
  }

  await sleep(500);
  const emailSubmittedAt = Date.now();
  await triggerLoginSubmitAction(currentSnapshot.submitButton, emailInput);
  logOAuthLogin(payload, visibleStep, '已提交邮箱', 'info');

  const transition = await waitForStep6EmailSubmitTransition(emailSubmittedAt, 12000, {
    visibleStep,
    authPayload: payload,
  });
  if (transition.action === 'done') {
    if (transition.result?.skipLoginVerificationStep || transition.result?.addEmailPage) {
      return transition.result;
    }
    return finalizeStep6VerificationReady({
      visibleStep,
      authPayload: payload,
      loginVerificationRequestedAt: transition.result.loginVerificationRequestedAt || emailSubmittedAt,
      via: transition.result.via || 'email_submit',
    });
  }
  if (transition.action === 'recoverable') {
    logOAuthLogin(payload, visibleStep, transition.result.message || `提交邮箱后仍未进入目标页面，准备重新执行步骤 ${visibleStep}。`, 'warn');
    return transition.result;
  }
  if (transition.action === 'email') {
    return step6LoginFromEmailPage(payload, transition.snapshot);
  }
  if (transition.action === 'password') {
    return step6LoginFromPasswordPage(payload, transition.snapshot);
  }
  return createStep6RecoverableResult('email_submit_unknown', normalizeStep6Snapshot(inspectLoginAuthState()), {
    message: '提交邮箱后未得到可用的下一步状态。',
  });
}

async function step6_login(payload) {
  const visibleStep = Math.floor(Number(payload?.visibleStep) || 0) || 7;
  const { email } = payload;
  const hasLoginIdentifier = Boolean(email);
  const throwMissingLoginIdentifier = () => {
    throw new Error('登录时缺少邮箱地址。当前 OAuth 页面需要重新登录，请先完成步骤 2，或在侧栏“注册邮箱”中填写账号。');
  };

  const snapshot = normalizeStep6Snapshot(await waitForKnownLoginAuthState(15000));

  if (snapshot.state === 'verification_page') {
    if (!hasLoginIdentifier) {
      throwMissingLoginIdentifier();
    }
    logOAuthLogin(payload, visibleStep, '认证页已在登录验证码页，开始确认页面是否稳定。', 'info');
    return finalizeStep6VerificationReady({
      visibleStep,
      authPayload: payload,
      loginVerificationRequestedAt: null,
      via: 'already_on_verification_page',
    });
  }

  if (snapshot.state === 'oauth_consent_page') {
    logOAuthLogin(payload, visibleStep, '认证页已直接进入 OAuth 授权页，跳过登录验证码步骤。', 'ok');
    return createStep6OAuthConsentSuccessResult(snapshot, {
      via: 'already_on_oauth_consent_page',
    });
  }

  if (snapshot.state === 'add_email_page') {
    logOAuthLogin(payload, visibleStep, '认证页已在添加邮箱页，登录阶段完成。', 'ok');
    return createStep6AddEmailSuccessResult(snapshot, {
      via: 'already_on_add_email_page',
    });
  }

  if (snapshot.state === 'login_timeout_error_page') {
    if (!hasLoginIdentifier) {
      throwMissingLoginIdentifier();
    }
    logOAuthLogin(payload, visibleStep, '检测到登录超时报错页，先尝试恢复当前页面。', 'warn');
    const transition = await createStep6LoginTimeoutRecoveryTransition(
      'login_timeout_error_page',
      snapshot,
      '当前页面处于登录超时报错页。',
      {
        visibleStep,
        authPayload: payload,
        loginVerificationRequestedAt: null,
        via: 'login_timeout_initial_recovered',
      }
    );
    if (transition.action === 'done') {
      if (transition.result?.skipLoginVerificationStep || transition.result?.addEmailPage) {
        return transition.result;
      }
      return finalizeStep6VerificationReady({
        visibleStep,
        authPayload: payload,
        loginVerificationRequestedAt: transition.result.loginVerificationRequestedAt || null,
        via: transition.result.via || 'login_timeout_initial_recovered',
      });
    }
    if (transition.action === 'email') {
      return step6LoginFromEmailPage(payload, transition.snapshot);
    }
    if (transition.action === 'password') {
      return step6LoginFromPasswordPage(payload, transition.snapshot);
    }
    return transition.result;
  }

  if (snapshot.state === 'email_page') {
    if (!hasLoginIdentifier) {
      throwMissingLoginIdentifier();
    }
    logOAuthLogin(payload, visibleStep, `正在使用 ${email} 登录...`, 'info');
    return step6LoginFromEmailPage(payload, snapshot);
  }

  if (snapshot.state === 'password_page') {
    if (!hasLoginIdentifier) {
      throwMissingLoginIdentifier();
    }
    logOAuthLogin(payload, visibleStep, '认证页已在密码页，继续当前登录流程。', 'info');
    return step6LoginFromPasswordPage(payload, snapshot);
  }

  if (snapshot.state === 'entry_page') {
    if (!hasLoginIdentifier) {
      throwMissingLoginIdentifier();
    }
    return step6OpenLoginEntry(payload, snapshot);
  }

  if (snapshot.state === 'choose_account_page') {
    return step6ChooseExistingAccount(payload, snapshot);
  }

  throwForStep6FatalState(snapshot, visibleStep);
  throw new Error(`无法识别当前登录页面状态。URL: ${snapshot?.url || location.href}`);
}

async function waitForAddEmailPageReady(timeout = 15000) {
  const start = Date.now();
  let sawAddEmailPage = false;
  while (Date.now() - start < timeout) {
    throwIfStopped();
    if (isAddEmailPageReady()) {
      sawAddEmailPage = true;
      const snapshot = inspectLoginAuthState();
      if (snapshot.emailInput || getLoginEmailInput()) {
        return snapshot;
      }
    }
    await sleep(200);
  }
  if (sawAddEmailPage) {
    throw new Error('等待添加邮箱页面输入框就绪超时。URL: ' + location.href);
  }
  throw new Error('等待添加邮箱页面就绪超时。URL: ' + location.href);
}

async function waitForAddEmailSubmitOutcome(timeout = 45000) {
  const start = Date.now();
  let lastState = inspectLoginAuthState();

  while (Date.now() - start < timeout) {
    throwIfStopped();
    lastState = inspectLoginAuthState();

    if (lastState.state === 'verification_page') {
      return {
        success: true,
        verificationPage: true,
        displayedEmail: getLoginVerificationDisplayedEmail(),
        url: location.href,
      };
    }
    if (lastState.state === 'oauth_consent_page') {
      return {
        success: true,
        directOAuthConsentPage: true,
        url: location.href,
      };
    }
    if (lastState.state === 'login_timeout_error_page') {
      return {
        retryPage: true,
        maxCheckAttempts: Boolean(lastState.maxCheckAttemptsBlocked),
        emailInUse: Boolean(lastState.emailInUseBlocked),
        url: location.href,
      };
    }

    const errorText = getVerificationErrorText();
    if (errorText) {
      return {
        errorText,
        url: location.href,
      };
    }

    const addEmailErrorText = isAddEmailPageReady() ? getVisibleFieldErrorText() : '';
    if (addEmailErrorText) {
      return {
        errorText: addEmailErrorText,
        url: location.href,
      };
    }

    await sleep(200);
  }

  throw new Error(`提交邮箱后未进入验证码页。当前状态：${getLoginAuthStateLabel(lastState)}。URL: ${lastState?.url || location.href}`);
}

async function submitAddEmailAndContinue(payload = {}) {
  const performOperationWithDelay = typeof getOperationDelayRunner === 'function'
    ? getOperationDelayRunner()
    : async (metadata, operation) => {
        const rootScope = typeof window !== 'undefined' ? window : globalThis;
        const gate = rootScope?.CodexOperationDelay?.performOperationWithDelay;
        return typeof gate === 'function' ? gate(metadata, operation) : operation();
      };
  const email = String(payload.email || '').trim().toLowerCase();
  if (!email) {
    throw new Error('未提供邮箱地址，无法添加邮箱。');
  }

  const snapshot = await waitForAddEmailPageReady();
  const emailInput = snapshot.emailInput || getLoginEmailInput();
  if (!emailInput) {
    throw new Error('添加邮箱页未找到邮箱输入框。URL: ' + location.href);
  }

  await humanPause(500, 1400);
  await performOperationWithDelay({ stepKey: 'oauth-login', kind: 'fill', label: 'add-email' }, async () => {
    fillInput(emailInput, email);
  });
  log(`步骤 8：已填写邮箱：${email}`);

  await sleep(500);
  const submitButton = snapshot.submitButton || getLoginSubmitButton({ allowDisabled: true });
  if (!submitButton || !isActionEnabled(submitButton)) {
    throw new Error('添加邮箱页未找到可点击的继续按钮。URL: ' + location.href);
  }

  await triggerLoginSubmitAction(submitButton, emailInput);
  log('步骤 8：已提交邮箱，正在等待邮箱验证码页...');

  const outcome = await waitForAddEmailSubmitOutcome();
  if (outcome.errorText && (SIGNUP_EMAIL_EXISTS_PATTERN.test(outcome.errorText) || /email_in_use/i.test(outcome.errorText))) {
    throw createStep8EmailInUseError();
  }
  if (outcome.errorText) {
    throw new Error(`添加邮箱失败：${outcome.errorText}`);
  }
  if (outcome.emailInUse) {
    throw createStep8EmailInUseError();
  }
  if (outcome.maxCheckAttempts) {
    throw createAuthMaxCheckAttemptsError();
  }
  if (outcome.retryPage) {
    throw new Error(`添加邮箱后进入认证重试页，请重新执行步骤 8。URL: ${outcome.url}`);
  }

  return {
    submitted: true,
    email,
    ...outcome,
  };
}

// ============================================================
// Step 9: Find "继续" on OAuth consent page for debugger click
// ============================================================
// After login + verification, page shows:
// "使用 ChatGPT 登录到 Codex" with a "继续" submit button.
// Background performs the actual click through the debugger Input API.

async function step8_findAndClick(payload = {}) {
  const visibleStep = Math.floor(Number(payload?.visibleStep) || 0) || 9;
  log('正在查找 OAuth 同意页的“继续”按钮...', 'info', { step: visibleStep, stepKey: 'confirm-oauth' });

  let continueBtn = null;
  try {
    continueBtn = await prepareStep8ContinueButton();
  } catch (error) {
    const pageState = getStep8State();
    if (pageState?.verificationPage || pageState?.addEmailPage || pageState?.retryPage) {
      return {
        recoverableAuthFallback: true,
        pageState,
        error: error?.message || String(error || 'OAuth 同意页已回流'),
        url: location.href,
      };
    }
    throw error;
  }

  const rect = getSerializableRect(continueBtn);
  log('已找到“继续”按钮并准备好调试器点击坐标。', 'info', { step: visibleStep, stepKey: 'confirm-oauth' });
  return {
    rect,
    buttonText: (continueBtn.textContent || '').trim(),
    url: location.href,
  };
}

function getStep8State() {
  const authSnapshot = inspectLoginAuthState();
  const continueBtn = getPrimaryContinueButton();
  const retryState = getCurrentAuthRetryPageState('auth');
  const state = {
    state: String(authSnapshot?.state || 'unknown').trim() || 'unknown',
    url: location.href,
    consentPage: isOAuthConsentPage(),
    consentReady: isStep8Ready(),
    verificationPage: isVerificationPageStillVisible(),
    displayedEmail: String(authSnapshot?.displayedEmail || '').trim(),
    verificationTarget: authSnapshot?.verificationTarget || null,
    addEmailPage: isAddEmailPageReady(),
    retryPage: Boolean(retryState),
    retryEnabled: Boolean(retryState?.retryEnabled),
    retryTitleMatched: Boolean(retryState?.titleMatched),
    retryDetailMatched: Boolean(retryState?.detailMatched),
    maxCheckAttemptsBlocked: Boolean(retryState?.maxCheckAttemptsBlocked),
    buttonFound: Boolean(continueBtn),
    buttonEnabled: isButtonEnabled(continueBtn),
    buttonText: continueBtn ? getActionText(continueBtn) : '',
  };

  if (continueBtn) {
    try {
      state.rect = getSerializableRect(continueBtn);
    } catch {
      state.rect = null;
    }
  }

  return state;
}

async function step8_triggerContinue(payload = {}) {
  const visibleStep = Math.floor(Number(payload?.visibleStep) || 0) || 9;
  const strategy = payload?.strategy || 'requestSubmit';
  let continueBtn = null;
  try {
    continueBtn = await prepareStep8ContinueButton({
      findTimeoutMs: payload?.findTimeoutMs,
      enabledTimeoutMs: payload?.enabledTimeoutMs,
    });
  } catch (error) {
    const pageState = getStep8State();
    if (pageState?.verificationPage || pageState?.addEmailPage || pageState?.retryPage) {
      return {
        recoverableAuthFallback: true,
        pageState,
        error: error?.message || String(error || 'OAuth 同意页已回流'),
        url: location.href,
      };
    }
    throw error;
  }
  const form = continueBtn.form || continueBtn.closest('form');

  switch (strategy) {
    case 'requestSubmit':
      if (!form || typeof form.requestSubmit !== 'function') {
        throw new Error('“继续”按钮当前不在可提交的 form 中，无法使用 requestSubmit。URL: ' + location.href);
      }
      form.requestSubmit(continueBtn);
      break;
    case 'nativeClick':
      continueBtn.click();
      break;
    case 'dispatchClick':
      simulateClick(continueBtn);
      break;
    default:
      throw new Error(`未知的 Step ${visibleStep} 触发策略：${strategy}`);
  }

  log(`continue button triggered via ${strategy}.`, 'info', { step: visibleStep, stepKey: 'confirm-oauth' });
  return {
    strategy,
    ...getStep8State(),
  };
}

async function prepareStep8ContinueButton(options = {}) {
  const {
    findTimeoutMs = 10000,
    enabledTimeoutMs = 8000,
  } = options;

  const continueBtn = await findContinueButton(findTimeoutMs);
  await waitForButtonEnabled(continueBtn, enabledTimeoutMs);

  await humanPause(250, 700);
  continueBtn.scrollIntoView({ behavior: 'auto', block: 'center' });
  continueBtn.focus();
  await waitForStableButtonRect(continueBtn);
  return continueBtn;
}

async function findContinueButton(timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    throwIfStopped();
    if (isAddEmailPageReady()) {
      throw new Error('当前页面已进入添加邮箱页面，不是 OAuth 授权同意页。URL: ' + location.href);
    }
    const button = getPrimaryContinueButton();
    if (button && isStep8Ready()) {
      return button;
    }
    await sleep(150);
  }

  throw new Error('在 OAuth 同意页未找到“继续”按钮，或页面尚未进入授权同意状态。URL: ' + location.href);
}

async function waitForButtonEnabled(button, timeout = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    throwIfStopped();
    if (isButtonEnabled(button)) return;
    await sleep(150);
  }
  throw new Error('“继续”按钮长时间不可点击。URL: ' + location.href);
}

function isButtonEnabled(button) {
  return Boolean(button)
    && !button.disabled
    && button.getAttribute('aria-disabled') !== 'true';
}

async function waitForStableButtonRect(button, timeout = 1500) {
  let previous = null;
  let stableSamples = 0;
  const start = Date.now();

  while (Date.now() - start < timeout) {
    throwIfStopped();
    const rect = button?.getBoundingClientRect?.();
    if (rect && rect.width > 0 && rect.height > 0) {
      const snapshot = {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      };

      if (
        previous
        && Math.abs(snapshot.left - previous.left) < 1
        && Math.abs(snapshot.top - previous.top) < 1
        && Math.abs(snapshot.width - previous.width) < 1
        && Math.abs(snapshot.height - previous.height) < 1
      ) {
        stableSamples += 1;
        if (stableSamples >= 2) {
          return;
        }
      } else {
        stableSamples = 0;
      }

      previous = snapshot;
    }

    await sleep(80);
  }
}

function getSerializableRect(el) {
  const rect = el.getBoundingClientRect();
  if (!rect.width || !rect.height) {
    throw new Error('滚动后“继续”按钮没有可点击尺寸。URL: ' + location.href);
  }

  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
    centerX: rect.left + (rect.width / 2),
    centerY: rect.top + (rect.height / 2),
  };
}

// ============================================================
// Step 5: Fill Name & Birthday / Age
// ============================================================

function getStep5DirectCompletionPayload({ isAgeMode = false, navigationStarted = false, outcome = null } = {}) {
  const payload = {
    profileSubmitted: true,
    postSubmitChecked: true,
  };
  if (isAgeMode) {
    payload.ageMode = true;
  }
  if (navigationStarted) {
    payload.navigationStarted = true;
  }
  if (outcome?.state) {
    payload.outcome = outcome.state;
  }
  if (outcome?.url) {
    payload.url = outcome.url;
  }
  return payload;
}

function isCombinedSignupVerificationProfilePage() {
  if (!isEmailVerificationPage() || !isVerificationPageStillVisible()) {
    return false;
  }

  if (!document.querySelector('form[action*="email-verification/register" i]')) {
    return false;
  }

  const nameInput = document.querySelector('input[name="name"], input[autocomplete="name"]');
  if (!nameInput || !isVisibleElement(nameInput)) {
    return false;
  }

  const ageInput = document.querySelector('input[name="age"]');
  if (ageInput && isVisibleElement(ageInput)) {
    return true;
  }

  const yearSpinner = document.querySelector('[role="spinbutton"][data-type="year"]');
  const monthSpinner = document.querySelector('[role="spinbutton"][data-type="month"]');
  const daySpinner = document.querySelector('[role="spinbutton"][data-type="day"]');
  return Boolean(
    yearSpinner
    && monthSpinner
    && daySpinner
    && isVisibleElement(yearSpinner)
    && isVisibleElement(monthSpinner)
    && isVisibleElement(daySpinner)
  );
}

async function waitForCombinedSignupVerificationProfilePage(timeout = 2500) {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    if (isCombinedSignupVerificationProfilePage()) {
      return true;
    }
    await sleep(100);
  }

  return isCombinedSignupVerificationProfilePage();
}

function getStep5ProfilePathPatterns() {
  const helper = getSignupProfilePageHelpers().getStep5ProfilePathPatterns;
  if (typeof helper === 'function') {
    return helper();
  }

  return [
    /\/create-account\/profile(?:[/?#]|$)/i,
    /\/u\/signup\/profile(?:[/?#]|$)/i,
    /\/signup\/profile(?:[/?#]|$)/i,
    /\/about-you(?:[/?#]|$)/i,
  ];
}

function getStep5AuthRetryPathPatterns() {
  const signupPatterns = typeof getSignupAuthRetryPathPatterns === 'function'
    ? getSignupAuthRetryPathPatterns()
    : [];
  return [
    ...signupPatterns,
    ...getStep5ProfilePathPatterns(),
  ];
}

function isStep5ProfilePageUrl(rawUrl = location.href) {
  const helper = getSignupProfilePageHelpers().isStep5ProfilePageUrl;
  if (typeof helper === 'function') {
    return Boolean(helper(rawUrl));
  }

  return isSignupProfilePageUrl(rawUrl);
}

function getStep5AuthRetryPageState() {
  if (typeof getAuthTimeoutErrorPageState === 'function') {
    return getAuthTimeoutErrorPageState({
      pathPatterns: getStep5AuthRetryPathPatterns(),
    });
  }

  if (typeof getCurrentAuthRetryPageState === 'function') {
    return getCurrentAuthRetryPageState('signup');
  }

  return null;
}

function getStep5SubmitButton() {
  const helper = getSignupProfilePageHelpers().getStep5SubmitButton;
  if (typeof helper === 'function') {
    return helper();
  }

  const direct = document.querySelector('button[type="submit"], input[type="submit"]');
  if (direct && isVisibleElement(direct)) {
    return direct;
  }

  const candidates = document.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"]');
  return Array.from(candidates).find((el) => {
    if (!isVisibleElement(el)) return false;
    const text = typeof getActionText === 'function'
      ? getActionText(el)
      : [
        el?.textContent,
        el?.value,
        el?.getAttribute?.('aria-label'),
        el?.getAttribute?.('title'),
      ]
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
    return /完成|创建|アカウントの作成を完了する|アカウントを作成|作成を完了|完了|作成|続行|同意|create|continue|finish|done|agree|जारी\s+रखें|पूरा\s+करें|खाता\s+बनाएं|अकाउंट\s+बनाएं|बनाएं|बनाएँ|सहमत/i.test(text);
  }) || null;
}

async function waitForStep5SubmitButton(timeout = 5000) {
  const helper = getSignupProfilePageHelpers().waitForStep5SubmitButton;
  if (typeof helper === 'function') {
    return await helper(timeout);
  }

  const start = Date.now();

  while (Date.now() - start < timeout) {
    throwIfStopped();
    const button = getStep5SubmitButton();
    if (button) {
      return button;
    }
    await sleep(150);
  }

  return null;
}

function isStep5SubmitButtonClickable(button) {
  const helper = getSignupProfilePageHelpers().isStep5SubmitButtonClickable;
  if (typeof helper === 'function') {
    return Boolean(helper(button));
  }

  if (
    !button
    || !isVisibleElement(button)
    || button.disabled
    || button.getAttribute?.('aria-disabled') === 'true'
  ) {
    return false;
  }

  const ariaBusy = String(button.getAttribute?.('aria-busy') || '').trim().toLowerCase();
  if (ariaBusy === 'true') {
    return false;
  }

  const pendingAttr = [
    button.getAttribute?.('data-loading'),
    button.getAttribute?.('data-pending'),
    button.getAttribute?.('data-submitting'),
    button.getAttribute?.('data-state'),
  ]
    .map((value) => String(value || '').trim().toLowerCase())
    .filter(Boolean)
    .join(' ');
  if (/\b(?:true|loading|pending|submitting|busy)\b/.test(pendingAttr)) {
    return false;
  }

  const pendingAncestor = button.closest?.([
    '[aria-busy="true"]',
    '[data-loading="true"]',
    '[data-pending="true"]',
    '[data-submitting="true"]',
    '[data-state="loading"]',
    '[data-state="pending"]',
    '[data-state="submitting"]',
  ].join(', '));
  if (pendingAncestor) {
    return false;
  }

  let style = null;
  try {
    style = typeof window !== 'undefined' && window.getComputedStyle
      ? window.getComputedStyle(button)
      : null;
  } catch {
    style = null;
  }

  if (style?.pointerEvents === 'none') {
    return false;
  }

  const opacity = Number.parseFloat(style?.opacity || '');
  if (Number.isFinite(opacity) && opacity < 0.8) {
    return false;
  }

  return true;
}

function isStep5ProfileStillVisible() {
  const helper = getSignupProfilePageHelpers().isStep5ProfileStillVisible;
  if (typeof helper === 'function') {
    return Boolean(helper());
  }

  if (isStep5ProfilePageUrl()) {
    return true;
  }

  return typeof isStep5Ready === 'function' ? isStep5Ready() : false;
}

function getStep5PostSubmitSuccessState() {
  if (getStep5AuthRetryPageState()) {
    return null;
  }

  if (getCreateAccountEnrollPasskeyPageState()) {
    return null;
  }

  if (isLikelyLoggedInChatgptHomeUrl()) {
    return {
      state: 'logged_in_home',
      url: location.href,
    };
  }

  if (typeof isOAuthConsentPage === 'function' && isOAuthConsentPage()) {
    return {
      state: 'oauth_consent',
      url: location.href,
    };
  }

  if (!isStep5ProfileStillVisible()) {
    try {
      const parsed = new URL(String(location.href || '').trim());
      const host = String(parsed.hostname || '').toLowerCase();
      if (['auth.openai.com', 'auth0.openai.com', 'accounts.openai.com'].includes(host)) {
        return null;
      }
    } catch {
      // Fall through to the generic "left_profile" success state.
    }
    return {
      state: 'left_profile',
      url: location.href,
    };
  }

  return null;
}

function getStep5SubmitState() {
  const helper = getSignupProfilePageHelpers().getStep5SubmitState;
  if (typeof helper === 'function') {
    return helper();
  }

  const retryState = getStep5AuthRetryPageState();
  const maxCheckAttemptsBlocked = Boolean(retryState?.maxCheckAttemptsBlocked || isAuthMaxCheckAttemptsPage());
  const successState = getStep5PostSubmitSuccessState();
  const passkeyState = getCreateAccountEnrollPasskeyPageState();
  const submitButton = getStep5SubmitButton();
  const errorText = typeof getStep5ErrorText === 'function' ? getStep5ErrorText() : '';
  let signupAuthHost = false;
  try {
    const parsed = new URL(String(location.href || '').trim());
    signupAuthHost = ['auth.openai.com', 'auth0.openai.com', 'accounts.openai.com']
      .includes(String(parsed.hostname || '').toLowerCase());
  } catch {
    signupAuthHost = false;
  }

  return {
    url: location.href,
    retryPage: Boolean(retryState || maxCheckAttemptsBlocked),
    retryEnabled: Boolean(retryState?.retryEnabled),
    maxCheckAttemptsBlocked,
    userAlreadyExistsBlocked: Boolean(retryState?.userAlreadyExistsBlocked),
    successState: successState?.state || '',
    passkeyEnrollPage: Boolean(passkeyState),
    passkeySkipEnabled: Boolean(passkeyState?.skipEnabled),
    profileVisible: isStep5ProfileStillVisible(),
    submitButtonVisible: Boolean(submitButton),
    submitButtonClickable: isStep5SubmitButtonClickable(submitButton),
    errorText,
    unknownAuthPage: Boolean(
      signupAuthHost
      && !retryState
      && !maxCheckAttemptsBlocked
      && !successState
      && !passkeyState
      && !isStep5ProfileStillVisible()
    ),
  };
}

async function triggerStep5ProfileSubmit(payload = {}) {
  const helper = getSignupProfilePageHelpers().submitProfilePage;
  if (typeof helper === 'function') {
    return await helper(payload);
  }

  const state = getStep5SubmitState();
  if (!state.profileVisible) {
    return {
      ...state,
      clicked: false,
      reason: state.successState ? 'already_left_profile' : 'profile_not_visible',
    };
  }

  if (state.errorText) {
    return {
      ...state,
      clicked: false,
      reason: 'profile_error_visible',
    };
  }

  const submitButton = getStep5SubmitButton();
  if (!submitButton) {
    return {
      ...state,
      clicked: false,
      reason: 'submit_button_missing',
    };
  }

  if (!isStep5SubmitButtonClickable(submitButton)) {
    return {
      ...state,
      clicked: false,
      reason: 'submit_button_not_clickable',
      submitButtonVisible: true,
      submitButtonClickable: false,
    };
  }

  const attempt = Math.max(1, Math.floor(Number(payload?.attempt) || 1));
  log(`步骤 5：检测到资料页仍停留，正在重新点击“完成帐户创建”（恢复 ${attempt}）。`, 'warn', {
    step: 5,
    stepKey: 'fill-profile',
  });
  await humanPause(250, 700);
  simulateClick(submitButton);
  await sleep(500);

  return {
    ...getStep5SubmitState(),
    clicked: true,
    reason: 'submit_clicked',
    attempt,
  };
}

async function recoverStep5SubmitRetryPage(payload = {}) {
  return recoverCurrentAuthRetryPage({
    ...payload,
    flow: 'signup',
    logLabel: payload?.logLabel || '步骤 5：资料提交后检测到认证重试页，正在点击“重试”恢复',
    maxClickAttempts: payload?.maxClickAttempts ?? 2,
    pathPatterns: Array.isArray(payload?.pathPatterns) ? payload.pathPatterns : getStep5AuthRetryPathPatterns(),
    step: 5,
    timeoutMs: payload?.timeoutMs ?? 12000,
  });
}

function installStep5NavigationCompletionReporter(completeOnce) {
  if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') {
    return () => {};
  }

  const onNavigationStarted = () => {
    completeOnce({
      navigationStarted: true,
      outcome: {
        state: 'navigation_started',
        url: location.href,
      },
    });
  };

  window.addEventListener('pagehide', onNavigationStarted, { once: true });
  window.addEventListener('beforeunload', onNavigationStarted, { once: true });

  return () => {
    window.removeEventListener('pagehide', onNavigationStarted);
    window.removeEventListener('beforeunload', onNavigationStarted);
  };
}

async function waitForStep5SubmitOutcome(options = {}) {
  const {
    timeoutMs = 120000,
    maxAuthRetryRecoveries = 2,
    maxPasskeySkipAttempts = 2,
    maxSubmitClicks = 3,
    retryClickIntervalMs = 3500,
  } = options;
  const start = Date.now();
  let authRetryRecoveryCount = 0;
  let passkeySkipCount = 0;
  let submitClickCount = 1;
  let lastSubmitClickAt = Date.now();
  let lastStep5Error = '';

  while (Date.now() - start < timeoutMs) {
    throwIfStopped();

    const retryState = getStep5AuthRetryPageState();
    if (retryState?.userAlreadyExistsBlocked) {
      throw createSignupUserAlreadyExistsError();
    }
    if (retryState?.maxCheckAttemptsBlocked) {
      throw createAuthMaxCheckAttemptsError();
    }
    if (retryState) {
      if (authRetryRecoveryCount >= maxAuthRetryRecoveries) {
        throw new Error(`步骤 5：资料提交后连续进入认证重试页 ${maxAuthRetryRecoveries} 次，页面仍未恢复。URL: ${location.href}`);
      }
      authRetryRecoveryCount += 1;
      log(`步骤 5：资料提交后进入认证重试页，正在自动恢复（${authRetryRecoveryCount}/${maxAuthRetryRecoveries}）...`, 'warn');
      await recoverCurrentAuthRetryPage({
        flow: 'signup',
        logLabel: '步骤 5：资料提交后检测到认证重试页，正在点击“重试”恢复',
        maxClickAttempts: 2,
        pathPatterns: getStep5AuthRetryPathPatterns(),
        step: 5,
        timeoutMs: 12000,
      });
      lastSubmitClickAt = Date.now();
      continue;
    }

    const passkeyState = getCreateAccountEnrollPasskeyPageState();
    if (passkeyState) {
      if (passkeySkipCount >= maxPasskeySkipAttempts) {
        throw new Error(`步骤 5：资料提交后连续进入通行密钥页 ${maxPasskeySkipAttempts} 次，页面仍未继续。URL: ${location.href}`);
      }
      passkeySkipCount += 1;
      log(`步骤 5：资料提交后进入通行密钥页，正在自动点击“跳过”（${passkeySkipCount}/${maxPasskeySkipAttempts}）...`, 'warn');
      await skipCreateAccountEnrollPasskey({
        timeoutMs: 15000,
        settleMs: 1200,
      });
      lastSubmitClickAt = Date.now();
      continue;
    }

    const successState = getStep5PostSubmitSuccessState();
    if (successState) {
      return successState;
    }

    const step5Error = typeof getStep5ErrorText === 'function' ? getStep5ErrorText() : '';
    if (step5Error) {
      lastStep5Error = step5Error;
    }

    if (
      isStep5ProfileStillVisible()
      && submitClickCount < maxSubmitClicks
      && Date.now() - lastSubmitClickAt >= retryClickIntervalMs
    ) {
      const submitButton = getStep5SubmitButton();
      if (isStep5SubmitButtonClickable(submitButton)) {
        submitClickCount += 1;
        log(`步骤 5：资料提交后仍停留在资料页，正在重新点击“完成帐户创建”（第 ${submitClickCount}/${maxSubmitClicks} 次）...`, 'warn');
        await humanPause(350, 900);
        simulateClick(submitButton);
        lastSubmitClickAt = Date.now();
        await sleep(1000);
        continue;
      }
    }

    await sleep(250);
  }

  const finalRetryState = getStep5AuthRetryPageState();
  if (finalRetryState?.userAlreadyExistsBlocked) {
    throw createSignupUserAlreadyExistsError();
  }
  if (finalRetryState?.maxCheckAttemptsBlocked) {
    throw createAuthMaxCheckAttemptsError();
  }
  if (finalRetryState) {
    throw new Error(`步骤 5：资料提交后仍停留在认证重试页，自动恢复未完成。URL: ${location.href}`);
  }

  const finalSuccessState = getStep5PostSubmitSuccessState();
  if (finalSuccessState) {
    return finalSuccessState;
  }

  const finalStep5Error = (typeof getStep5ErrorText === 'function' ? getStep5ErrorText() : '') || lastStep5Error;
  if (finalStep5Error) {
    throw new Error(`步骤 5：资料提交后页面返回错误：${finalStep5Error}。URL: ${location.href}`);
  }

  throw new Error(`步骤 5：资料提交后未检测到页面跳转或恢复成功（已点击提交 ${submitClickCount}/${maxSubmitClicks} 次）。URL: ${location.href}`);
}

function findPasskeyEnrollmentSkipAction() {
  const skipPattern = /跳过|稍后|不用|不保存|取消|关闭|skip|not now|not\s*now|maybe\s*later|do\s*this\s*later|cancel|close|छोड़ें|अभी\s+नहीं|बाद\s+में|रद्द|बंद/i;
  const candidates = document.querySelectorAll(
    'button, a, [role="button"], [role="link"], input[type="button"], input[type="submit"], input[type="reset"]'
  );

  return Array.from(candidates).find((el) => {
    if (!isVisibleElement(el) || !isActionEnabled(el)) {
      return false;
    }
    const text = typeof getActionText === 'function'
      ? getActionText(el)
      : [
        el?.textContent,
        el?.value,
        el?.getAttribute?.('aria-label'),
        el?.getAttribute?.('title'),
      ].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
    return Boolean(text && skipPattern.test(text));
  }) || null;
}

function getPasskeyEnrollmentStepState() {
  if (isStep5Ready() || isSignupProfilePageUrl()) {
    return {
      state: 'step5',
      profilePage: true,
      url: location.href,
    };
  }

  if (isLikelyLoggedInChatgptHomeUrl()) {
    return {
      state: 'logged_in_home',
      skipProfileStep: true,
      url: location.href,
    };
  }

  if (isPasskeyEnrollmentPage()) {
    return {
      state: 'passkey_enrollment',
      skipAction: findPasskeyEnrollmentSkipAction(),
      url: location.href,
    };
  }

  return {
    state: 'unknown',
    url: location.href,
  };
}

async function waitForPasskeyEnrollmentStepState(timeout = 30000, options = {}) {
  const desiredStates = Array.isArray(options.desiredStates) && options.desiredStates.length
    ? new Set(options.desiredStates)
    : new Set(['step5', 'logged_in_home', 'passkey_enrollment']);
  const start = Date.now();
  let lastState = getPasskeyEnrollmentStepState();

  while (Date.now() - start < timeout) {
    throwIfStopped();
    lastState = getPasskeyEnrollmentStepState();
    if (desiredStates.has(lastState.state)) {
      return lastState;
    }
    await sleep(200);
  }

  return lastState;
}

async function waitForStep5ProfileReadyBeforeFill(timeout = 60000) {
  const resolvedTimeout = Math.max(5000, Number(timeout) || 60000);
  const start = Date.now();
  let lastUrl = location.href;
  let lastState = 'unknown';

  while (Date.now() - start < resolvedTimeout) {
    throwIfStopped();
    lastUrl = location.href;

    if (isAuthMaxCheckAttemptsPage()) {
      throw createAuthMaxCheckAttemptsError();
    }

    const retryState = getCurrentAuthRetryPageState('signup');
    if (retryState?.maxCheckAttemptsBlocked) {
      throw createAuthMaxCheckAttemptsError();
    }
    if (retryState?.userAlreadyExistsBlocked) {
      throw createSignupUserAlreadyExistsError();
    }
    if (retryState) {
      lastState = 'auth_retry_page';
      await sleep(500);
      continue;
    }

    if (isLikelyLoggedInChatgptHomeUrl()) {
      return { state: 'logged_in_home', url: lastUrl };
    }
    if (isPasskeyEnrollmentPage()) {
      return { state: 'passkey_enrollment', url: lastUrl };
    }
    if (isStep5ProfilePageUrl() || isStep5Ready()) {
      return { state: 'step5', url: lastUrl };
    }
    if (isEmailVerificationPage() || isVerificationPageStillVisible()) {
      lastState = 'email_verification_page';
      await sleep(500);
      continue;
    }

    lastState = 'unknown';
    await sleep(500);
  }

  if (lastState === 'email_verification_page') {
    throw new Error(`步骤 5：前置页面未就绪，当前仍在邮箱验证码页，未确认进入资料页。URL: ${lastUrl}`);
  }
  if (lastState === 'auth_retry_page') {
    throw new Error(`步骤 5：前置页面未就绪，当前仍在认证重试页。URL: ${lastUrl}`);
  }
  throw new Error(`步骤 5：前置页面未就绪，未检测到资料页字段。页面状态 ${lastState}。URL: ${lastUrl}`);
}

async function step5_fillNameBirthday(payload) {
  const helper = getSignupProfilePageHelpers().fillProfileNameAndBirthday;
  if (typeof helper === 'function') {
    return await helper(payload);
  }

  return await fillStep5NameBirthdayLocally(payload);
}

async function fillStep5NameBirthdayLocally(payload) {
  const readyState = await waitForStep5ProfileReadyBeforeFill(60000);
  if (readyState.state === 'logged_in_home') {
    return {
      skipProfileStep: true,
      skipProfileStepReason: 'profile_already_logged_in_home',
      url: readyState.url || location.href,
    };
  }

  if (isPasskeyEnrollmentPage()) {
    log('步骤 5：检测到通行密钥页，正在自动点击“跳过”。', 'warn');
    await skipCreateAccountEnrollPasskey({
      timeoutMs: 15000,
      settleMs: 1200,
    });
    const outcome = await waitForPasskeyEnrollmentStepState(30000, {
      desiredStates: ['step5', 'logged_in_home'],
    });
    if (outcome.state === 'logged_in_home') {
      return {
        skipProfileStep: true,
        skipProfileStepReason: 'passkey_skip_logged_in_home',
        url: outcome.url || location.href,
      };
    }
    if (outcome.state !== 'step5') {
      throw new Error(`步骤 5：点击“跳过”后未进入资料页。URL: ${outcome.url || location.href}`);
    }
  }

  const { firstName, lastName, age, year, month, day, prefillOnly = false } = payload;
  if (!firstName || !lastName) throw new Error('未提供姓名数据。');
  const performOperationWithDelay = typeof getOperationDelayRunner === 'function'
    ? getOperationDelayRunner()
    : async (metadata, operation) => {
        const rootScope = typeof window !== 'undefined' ? window : globalThis;
        const gate = rootScope?.CodexOperationDelay?.performOperationWithDelay;
        return typeof gate === 'function' ? gate(metadata, operation) : operation();
      };

  const resolvedAge = age ?? (year ? new Date().getFullYear() - Number(year) : null);
  const hasBirthdayData = [year, month, day].every(value => value != null && !Number.isNaN(Number(value)));
  if (!hasBirthdayData && (resolvedAge == null || Number.isNaN(Number(resolvedAge)))) {
    throw new Error('未提供生日或年龄数据。');
  }

  const fullName = `${firstName} ${lastName}`;
  log(`步骤 5：正在填写姓名：${fullName}`);

  // Actual DOM structure:
  // - Full name: <input name="name" placeholder="全名" type="text">
  // - Birthday: React Aria DateField or hidden input[name="birthday"]
  // - Age: <input name="age" type="text|number">

  // --- Full Name (single field, not first+last) ---
  let nameInput = null;
  try {
    nameInput = await waitForElement(
      [
        'input[name="name"]',
        'input[placeholder*="全名"]',
        'input[placeholder*="氏名"]',
        'input[placeholder*="名前"]',
        'input[placeholder*="पूरा नाम"]',
        'input[placeholder*="नाम"]',
        'input[aria-label*="全名"]',
        'input[aria-label*="氏名"]',
        'input[aria-label*="名前"]',
        'input[aria-label*="पूरा नाम"]',
        'input[aria-label*="नाम"]',
        'input[autocomplete="name"]',
      ].join(', '),
      10000
    );
  } catch {
    throw new Error('未找到姓名输入框。URL: ' + location.href);
  }
  await humanPause(500, 1300);
  await performOperationWithDelay({ stepKey: 'fill-profile', kind: 'fill', label: 'fill-name' }, async () => {
    fillInput(nameInput, fullName);
  });
  log(`步骤 5：姓名已填写：${fullName}`);

  let birthdayMode = false;
  let ageInput = null;
  let yearSpinner = null;
  let monthSpinner = null;
  let daySpinner = null;
  let hiddenBirthday = null;
  let yearReactSelect = null;
  let monthReactSelect = null;
  let dayReactSelect = null;
  let visibleAgeInput = false;
  let visibleBirthdaySpinners = false;
  let visibleBirthdaySelects = false;

  for (let i = 0; i < 100; i++) {
    yearSpinner = document.querySelector('[role="spinbutton"][data-type="year"]');
    monthSpinner = document.querySelector('[role="spinbutton"][data-type="month"]');
    daySpinner = document.querySelector('[role="spinbutton"][data-type="day"]');
    hiddenBirthday = document.querySelector('input[name="birthday"]');
    ageInput = document.querySelector([
      'input[name="age"]',
      'input[placeholder*="年龄"]',
      'input[placeholder*="年齡"]',
      'input[placeholder*="年齢"]',
      'input[placeholder*="उम्र"]',
      'input[placeholder*="आयु"]',
      'input[aria-label*="年龄"]',
      'input[aria-label*="年齡"]',
      'input[aria-label*="年齢"]',
      'input[aria-label*="उम्र"]',
      'input[aria-label*="आयु"]',
    ].join(', '));
    yearReactSelect = findBirthdayReactAriaSelectByLabels(['年', 'Year', 'वर्ष', 'साल']);
    monthReactSelect = findBirthdayReactAriaSelectByLabels(['月', 'Month', 'महीना', 'माह']);
    dayReactSelect = findBirthdayReactAriaSelectByLabels(['天', 'Day', 'दिन']);

    visibleAgeInput = Boolean(ageInput && isVisibleElement(ageInput));
    visibleBirthdaySpinners = Boolean(
      yearSpinner
      && monthSpinner
      && daySpinner
      && isVisibleElement(yearSpinner)
      && isVisibleElement(monthSpinner)
      && isVisibleElement(daySpinner)
    );
    visibleBirthdaySelects = Boolean(
      yearReactSelect?.button
      && monthReactSelect?.button
      && dayReactSelect?.button
      && isVisibleElement(yearReactSelect.button)
      && isVisibleElement(monthReactSelect.button)
      && isVisibleElement(dayReactSelect.button)
    );

    if (visibleAgeInput) break;
    if (visibleBirthdaySpinners || visibleBirthdaySelects) {
      birthdayMode = true;
      break;
    }
    await sleep(100);
  }

  if (birthdayMode) {
    if (!hasBirthdayData) {
      throw new Error('检测到生日字段，但未提供生日数据。');
    }

    const yearSpinner = document.querySelector('[role="spinbutton"][data-type="year"]');
    const monthSpinner = document.querySelector('[role="spinbutton"][data-type="month"]');
    const daySpinner = document.querySelector('[role="spinbutton"][data-type="day"]');
    const yearReactSelect = findBirthdayReactAriaSelectByLabels(['年', 'Year', 'वर्ष', 'साल']);
    const monthReactSelect = findBirthdayReactAriaSelectByLabels(['月', 'Month', 'महीना', 'माह']);
    const dayReactSelect = findBirthdayReactAriaSelectByLabels(['天', 'Day', 'दिन']);

    if (yearReactSelect?.nativeSelect && monthReactSelect?.nativeSelect && dayReactSelect?.nativeSelect) {
      const desiredDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const hiddenBirthday = document.querySelector('input[name="birthday"]');

      log('步骤 5：检测到 React Aria 下拉生日字段，正在填写生日...');
      await humanPause(450, 1100);
      await performOperationWithDelay({ stepKey: 'fill-profile', kind: 'select', label: 'select-birthday-year' }, async () => {
        await setReactAriaBirthdaySelect(yearReactSelect, year);
      });
      await humanPause(250, 650);
      await performOperationWithDelay({ stepKey: 'fill-profile', kind: 'select', label: 'select-birthday-month' }, async () => {
        await setReactAriaBirthdaySelect(monthReactSelect, month);
      });
      await humanPause(250, 650);
      await performOperationWithDelay({ stepKey: 'fill-profile', kind: 'select', label: 'select-birthday-day' }, async () => {
        await setReactAriaBirthdaySelect(dayReactSelect, day);
      });

      if (hiddenBirthday) {
        const start = Date.now();
        while (Date.now() - start < 2000) {
          if ((hiddenBirthday.value || '') === desiredDate) break;
          await sleep(100);
        }

        if ((hiddenBirthday.value || '') !== desiredDate) {
          throw new Error(`生日值未成功写入页面。期望 ${desiredDate}，实际 ${(hiddenBirthday.value || '空')}。`);
        }
      }

      log(`步骤 5：React Aria 生日已填写：${desiredDate}`);
    }

    if (yearSpinner && monthSpinner && daySpinner) {
      log('步骤 5：检测到生日字段，正在填写生日...');

      async function setSpinButton(el, value) {
        el.focus();
        await sleep(100);
        document.execCommand('selectAll', false, null);
        await sleep(50);

        const valueStr = String(value);
        for (const char of valueStr) {
          el.dispatchEvent(new KeyboardEvent('keydown', { key: char, code: `Digit${char}`, bubbles: true }));
          el.dispatchEvent(new KeyboardEvent('keypress', { key: char, code: `Digit${char}`, bubbles: true }));
          el.dispatchEvent(new InputEvent('beforeinput', { inputType: 'insertText', data: char, bubbles: true }));
          el.dispatchEvent(new InputEvent('input', { inputType: 'insertText', data: char, bubbles: true }));
          await sleep(50);
        }

        el.dispatchEvent(new KeyboardEvent('keyup', { key: 'Tab', code: 'Tab', bubbles: true }));
        el.blur();
        await sleep(100);
      }

      await humanPause(450, 1100);
      await performOperationWithDelay({ stepKey: 'fill-profile', kind: 'fill', label: 'fill-birthday-year' }, async () => {
        await setSpinButton(yearSpinner, year);
      });
      await humanPause(250, 650);
      await performOperationWithDelay({ stepKey: 'fill-profile', kind: 'fill', label: 'fill-birthday-month' }, async () => {
        await setSpinButton(monthSpinner, String(month).padStart(2, '0'));
      });
      await humanPause(250, 650);
      await performOperationWithDelay({ stepKey: 'fill-profile', kind: 'fill', label: 'fill-birthday-day' }, async () => {
        await setSpinButton(daySpinner, String(day).padStart(2, '0'));
      });
      log(`步骤 5：生日已填写：${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
    }

    const hiddenBirthday = document.querySelector('input[name="birthday"]');
    if (hiddenBirthday) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      await performOperationWithDelay({ stepKey: 'fill-profile', kind: 'hidden-sync', label: 'profile-dom-sync' }, async () => {
        hiddenBirthday.value = dateStr;
        hiddenBirthday.dispatchEvent(new Event('input', { bubbles: true }));
        hiddenBirthday.dispatchEvent(new Event('change', { bubbles: true }));
      });
      log(`步骤 5：已设置隐藏生日输入框：${dateStr}`);
    }
  } else if (ageInput) {
    if (resolvedAge == null || Number.isNaN(Number(resolvedAge))) {
      throw new Error('检测到年龄字段，但未提供年龄数据。');
    }
    await humanPause(500, 1300);
    await performOperationWithDelay({ stepKey: 'fill-profile', kind: 'fill', label: 'fill-birthday' }, async () => {
      fillInput(ageInput, String(resolvedAge));
    });
    log(`步骤 5：年龄已填写：${resolvedAge}`);
  } else {
    throw new Error('未找到生日或年龄输入项。URL: ' + location.href);
  }
  // 韩国IP判断勾选框""I agree"
  const allConsentCheckbox = findStep5AllConsentCheckbox();

  if (allConsentCheckbox) {
    if (!isStep5CheckboxChecked(allConsentCheckbox)) {
      const checkboxLabel = allConsentCheckbox.closest('label');
      await humanPause(500, 1500);
      await performOperationWithDelay({ stepKey: 'fill-profile', kind: 'click', label: 'accept-profile-consent' }, async () => {
        if (checkboxLabel && isVisibleElement(checkboxLabel)) {
          simulateClick(checkboxLabel);
        } else {
          simulateClick(allConsentCheckbox);
        }
      });
      await sleep(250);

      if (!isStep5CheckboxChecked(allConsentCheckbox)) {
        await performOperationWithDelay({ stepKey: 'fill-profile', kind: 'click', label: 'accept-profile-consent-fallback' }, async () => {
          allConsentCheckbox.click();
        });
        await sleep(250);
      }

      if (!isStep5CheckboxChecked(allConsentCheckbox)) {
        throw new Error('未能勾选 “I agree to all of the following” 复选框。');
      }

      log('步骤 5：已勾选 “I agree to all of the following”。');
    } else {
      log('步骤 5：“I agree to all of the following” 已勾选，跳过。');
    }
  }


  if (prefillOnly) {
    log('步骤 4：混合注册页资料已预填，继续填写验证码。', 'info');
    return { prefilled: true };
  }

  // Click "完成帐户创建" button
  await sleep(500);
  const completeBtn = await waitForStep5SubmitButton(5000)
    || await waitForElementByText('button', /完成|アカウントの作成を完了する|アカウントを作成|作成を完了|完了|作成|続行|同意|create|continue|finish|done|agree|जारी\s+रखें|पूरा\s+करें|खाता\s+बनाएं|अकाउंट\s+बनाएं|बनाएं|बनाएँ|सहमत/i, 5000).catch(() => null);
  if (!completeBtn) {
    throw new Error('未找到“完成帐户创建”按钮。URL: ' + location.href);
  }

  const isAgeMode = !birthdayMode && Boolean(ageInput);
  if (isAgeMode) {
    log('步骤 5：当前为年龄输入模式，点击“完成帐户创建”后将等待页面结果。', 'info');
  }

  let reportedCompletionPayload = null;
  function completeStep5Once(extra = {}) {
    if (reportedCompletionPayload) {
      return reportedCompletionPayload;
    }

    const completionPayload = getStep5DirectCompletionPayload({
      isAgeMode,
      navigationStarted: Boolean(extra.navigationStarted),
      outcome: extra.outcome || null,
    });
    reportedCompletionPayload = completionPayload;
    reportComplete(5, completionPayload);
    return completionPayload;
  }

  const cleanupNavigationReporter = installStep5NavigationCompletionReporter(completeStep5Once);

  await humanPause(500, 1300);
  await performOperationWithDelay({ stepKey: 'fill-profile', kind: 'submit', label: 'submit-profile' }, async () => {
    simulateClick(completeBtn);
  });
  log('步骤 5：已点击“完成帐户创建”，正在等待页面跳转、重试页或提交结果。');

  try {
    const outcome = await waitForStep5SubmitOutcome();
    cleanupNavigationReporter();

    const completionPayload = completeStep5Once({ outcome });
    log(`步骤 5：资料提交结果已确认（${outcome.state || 'success'}），准备继续后续步骤。`, 'ok');
    return completionPayload;
  } catch (error) {
    cleanupNavigationReporter();
    throw error;
  }
}
