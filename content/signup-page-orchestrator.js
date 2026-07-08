// content/signup-page-orchestrator.js - Signup content command/log orchestration helpers.
(function attachSignupPageOrchestrator(root) {
  if (root.MultiPageSignupPageOrchestrator?.createSignupPageOrchestrator) {
    root.SignupPageOrchestrator = root.SignupPageOrchestrator || root.MultiPageSignupPageOrchestrator;
    return;
  }

  function resolveVisibleStep(payload = {}, fallback = 0) {
    const step = Math.floor(Number(payload?.visibleStep) || 0);
    return step > 0 ? step : fallback;
  }

  function isMembershipCheckAuthPayload(payload = {}) {
    return payload?.membershipCheck === true
      || payload?.upiMembershipCheck === true
      || String(payload?.flow || payload?.purpose || '').trim() === 'upi-membership-check';
  }

  function getMembershipAuthLogLabel(payload = {}) {
    return String(payload?.membershipLogLabel || '获取/确认 AT').trim() || '获取/确认 AT';
  }

  function formatMembershipAuthLogMessage(payload = {}, message = '') {
    let text = String(message || '').trim();
    text = text
      .replace(/步骤\s*-?\d+\s*[：:]\s*/g, '')
      .replace(/准备重新执行步骤\s*-?\d+/g, '准备重新执行当前登录')
      .replace(/重试步骤\s*-?\d+/g, '重试当前登录');
    const label = getMembershipAuthLogLabel(payload);
    return text.startsWith(`${label}：`) ? text : `${label}：${text}`;
  }

  function getOAuthLoginLogOptions(payload = {}, visibleStep = 7) {
    return isMembershipCheckAuthPayload(payload)
      ? { stepKey: 'upi-membership-token' }
      : { step: visibleStep, stepKey: 'oauth-login' };
  }

  function resolveCommandNodeId(message = {}) {
    if (isMembershipCheckAuthPayload(message.payload)) {
      return 'upi-membership-token';
    }
    const directNodeId = String(message.nodeId || message.payload?.nodeId || '').trim();
    if (directNodeId) {
      return directNodeId;
    }
    if (
      message.type === 'START_SET_GPT_PASSWORD_RESET'
      || message.type === 'PREPARE_SET_GPT_PASSWORD'
      || message.type === 'SUBMIT_SET_GPT_PASSWORD_CODE'
      || message.type === 'SET_GPT_PASSWORD'
      || message.type === 'GET_SET_GPT_PASSWORD_STATE'
      || message.type === 'RECOVER_SET_GPT_PASSWORD_AUTH_RETRY_PAGE'
      || (
        message.type === 'RESEND_VERIFICATION_CODE'
        && Number(message.payload?.visibleStep || message.step) === 6
      )
    ) {
      return 'set-gpt-password';
    }
    const visibleStep = Number(message.payload?.visibleStep || message.step) || 0;
    if (visibleStep === 4) return 'fetch-signup-code';
    if (visibleStep === 8 || visibleStep === 11) return 'fetch-login-code';
    if (visibleStep === 9 || visibleStep === 12) return 'confirm-oauth';
    if (visibleStep === 10 || visibleStep === 13) return 'confirm-oauth';
    if (visibleStep === 16) return 'confirm-oauth';
    if (visibleStep === 14 || visibleStep === 15 || visibleStep === 17) return 'platform-verify';
    if (visibleStep === 7) return 'oauth-login';
    if (visibleStep === 5) return 'fill-profile';
    if (visibleStep === 3) return 'fill-password';
    if (visibleStep === 2) return 'submit-signup-email';
    return '';
  }

  function createSignupPageOrchestrator(context = {}) {
    const {
      nodeHandlers = {},
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
      step8FindAndClick,
      getStep8State,
      step8TriggerContinue,
      log = () => {},
    } = context;

    async function handleCommand(message) {
      switch (message.type) {
        case 'EXECUTE_NODE': {
          const nodeId = String(message.nodeId || message.payload?.nodeId || '').trim();
          const handler = nodeHandlers[nodeId];
          if (!handler) {
            throw new Error(`signup-page.js 不处理节点 ${nodeId}`);
          }
          return await handler(message.payload || {});
        }
        case 'FILL_CODE':
          return await fillVerificationCode(message.step, message.payload);
        case 'GET_LOGIN_AUTH_STATE':
          return serializeLoginAuthState(inspectLoginAuthState());
        case 'SUBMIT_ADD_EMAIL':
          return await submitAddEmailAndContinue(message.payload);
        case 'GET_STEP5_SUBMIT_STATE':
          return getStep5SubmitState();
        case 'GET_SIGNUP_VERIFICATION_POST_SUBMIT_STATE':
          return getSignupVerificationPostSubmitState();
        case 'SKIP_CREATE_ACCOUNT_ENROLL_PASSKEY':
          return await skipCreateAccountEnrollPasskey(message.payload);
        case 'PREPARE_SIGNUP_VERIFICATION':
          return await prepareSignupVerificationFlow(message.payload);
        case 'RECOVER_AUTH_RETRY_PAGE':
          return await recoverCurrentAuthRetryPage(message.payload);
        case 'RECOVER_STEP5_SUBMIT_RETRY_PAGE':
          return await recoverStep5SubmitRetryPage(message.payload);
        case 'TRIGGER_STEP5_PROFILE_SUBMIT':
          return await triggerStep5ProfileSubmit(message.payload);
        case 'RESEND_VERIFICATION_CODE':
          return await resendVerificationCode(
            Number(message.step || message.payload?.step || message.payload?.visibleStep) || 4,
            Math.max(1000, Math.floor(Number(message.payload?.resendTimeoutMs) || 45000)),
            message.payload || {}
          );
        case 'ENSURE_SIGNUP_ENTRY_READY':
          return await ensureSignupEntryReady();
        case 'ENSURE_SIGNUP_PASSWORD_PAGE_READY':
          return await ensureSignupPasswordPageReady();
        case 'START_SET_GPT_PASSWORD_RESET':
          return await startSetGptPasswordResetFlow(message.payload);
        case 'PREPARE_SET_GPT_PASSWORD':
          return await prepareSetGptPasswordFlow(message.payload);
        case 'SUBMIT_SET_GPT_PASSWORD_CODE':
          return await submitSetGptPasswordVerificationCode(message.payload);
        case 'SET_GPT_PASSWORD':
          return await setGptPasswordOnResetPage(message.payload);
        case 'GET_SET_GPT_PASSWORD_STATE':
          return getSetGptPasswordPageState();
        case 'RECOVER_SET_GPT_PASSWORD_AUTH_RETRY_PAGE':
          return await recoverSetGptPasswordAuthRetryPage(resolveVisibleStep(message.payload, 6), 'GPT 密码提交后');
        case 'READ_CHATGPT_SESSION_EXPORT_DATA':
          return await readChatGptSessionExportData();
        case 'STEP8_FIND_AND_CLICK':
          return await step8FindAndClick(message.payload);
        case 'STEP8_GET_STATE':
          return getStep8State();
        case 'STEP8_TRIGGER_CONTINUE':
          return await step8TriggerContinue(message.payload);
      }
    }

    function stepLog(step, message, level = 'info', stepKey = '') {
      return log(message, level, { step, stepKey });
    }

    function logOAuthLogin(payload = {}, visibleStep = 7, message = '', level = 'info') {
      log(
        isMembershipCheckAuthPayload(payload) ? formatMembershipAuthLogMessage(payload, message) : message,
        level,
        getOAuthLoginLogOptions(payload, visibleStep)
      );
    }

    function logVerificationCode(step, payload = {}, message = '', level = 'info') {
      if (step === 8 && isMembershipCheckAuthPayload(payload)) {
        log(formatMembershipAuthLogMessage(payload, message), level, { stepKey: 'upi-membership-token' });
        return;
      }
      log(message, level);
    }

    return {
      handleCommand,
      resolveCommandNodeId,
      resolveVisibleStep,
      stepLog,
      isMembershipCheckAuthPayload,
      getMembershipAuthLogLabel,
      formatMembershipAuthLogMessage,
      getOAuthLoginLogOptions,
      logOAuthLogin,
      logVerificationCode,
    };
  }

  root.MultiPageSignupPageOrchestrator = {
    createSignupPageOrchestrator,
    resolveCommandNodeId,
    resolveVisibleStep,
    isMembershipCheckAuthPayload,
    getMembershipAuthLogLabel,
    formatMembershipAuthLogMessage,
    getOAuthLoginLogOptions,
  };
  root.SignupPageOrchestrator = root.MultiPageSignupPageOrchestrator;
})(typeof self !== 'undefined' ? self : globalThis);
