(function attachRouterNodeProtocolService(root, factory) {
  const api = factory(root);
  root.MultiPageRouterNodeProtocolService = api;
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
})(typeof self !== 'undefined' ? self : globalThis, function createRouterNodeProtocolServiceModule(_rootScope) {
  const DEFAULT_OPENAI_NODE_BY_STEP = Object.freeze({
    1: 'open-chatgpt',
    2: 'submit-signup-email',
    3: 'fill-password',
    4: 'fetch-signup-code',
    5: 'fill-profile',
    6: 'wait-registration-success',
    7: 'oauth-login',
    8: 'fetch-login-code',
    9: 'confirm-oauth',
    10: 'confirm-oauth',
    11: 'fetch-login-code',
    12: 'confirm-oauth',
    13: 'confirm-oauth',
    14: 'platform-verify',
    15: 'platform-verify',
    16: 'confirm-oauth',
    17: 'platform-verify',
  });

  function createRouterNodeProtocolService(deps = {}) {
    const {
      addLog = async () => {},
      appendAccountRunRecord = null,
      broadcastDataUpdate = () => {},
      buildLocalhostCleanupPrefix = () => '',
      cleanupPaymentTabsAfterSuccessfulFlow = async () => {},
      clearLuckmailRuntimeState = async () => {},
      closeLocalhostCallbackTabs = async () => {},
      closeTabsByUrlPrefix = async () => {},
      doesNodeUseCompletionSignal = () => false,
      executeNode = async () => {},
      executeNodeViaCompletionSignal = async () => {},
      finalizeIcloudAliasAfterSuccessfulFlow = async () => {},
      getCurrentLuckmailPurchase = () => null,
      getNodeIdsForState = null,
      getState = async () => ({}),
      getStepDefinitionForState = null,
      getStepIdByNodeIdForState = null,
      getStepIdsForState = null,
      getTabId = null,
      isAutoRunLockedState = () => false,
      isHotmailProvider = () => false,
      isLocalhostOAuthCallbackUrl = () => false,
      isLuckmailProvider = () => false,
      isTabAlive = async () => false,
      markCurrentRegistrationAccountUsed = null,
      normalizePlusPaymentMethod = () => 'legacyWallet',
      patchHotmailAccount = async () => {},
      patchMail2925Account = async () => {},
      setEmailState = async () => {},
      setLuckmailPurchaseUsedState = async () => {},
      setNodeStatus = async () => {},
      setState = async () => {},
    } = deps;

    async function appendManualAccountRunRecordIfNeeded(status, stateOverride = null, reason = '') {
      if (typeof appendAccountRunRecord !== 'function') {
        return null;
      }

      const state = stateOverride || await getState();
      if (isAutoRunLockedState(state)) {
        return null;
      }

      return appendAccountRunRecord(status, state, reason);
    }

    function isManualPrerequisiteDoneStatus(status = '') {
      return status === 'completed'
        || status === 'manual_completed'
        || status === 'skipped';
    }

    function getManualNodeSequenceForState(state = {}) {
      if (typeof getNodeIdsForState === 'function') {
        const nodeIds = getNodeIdsForState(state);
        if (Array.isArray(nodeIds) && nodeIds.length) {
          return nodeIds.map((nodeId) => String(nodeId || '').trim()).filter(Boolean);
        }
      }
      return [];
    }

    function getStepKeyForState(step, state = {}) {
      if (typeof getStepDefinitionForState === 'function') {
        return String(getStepDefinitionForState(step, state)?.key || '').trim();
      }
      return DEFAULT_OPENAI_NODE_BY_STEP[Number(step)] || '';
    }

    function findStepByNodeId(nodeId, state = {}) {
      const normalizedNodeId = String(nodeId || '').trim();
      if (normalizedNodeId && typeof getStepIdByNodeIdForState === 'function') {
        const step = getStepIdByNodeIdForState(normalizedNodeId, state);
        if (Number.isInteger(step) && step > 0) {
          return step;
        }
      }
      if (!normalizedNodeId || typeof getStepIdsForState !== 'function') {
        return 0;
      }
      for (const stepId of getStepIdsForState(state)) {
        if (getStepKeyForState(stepId, state) === normalizedNodeId) {
          return Number(stepId) || 0;
        }
      }
      return 0;
    }

    function ensurePreviousNodesReadyForManualExecute(nodeId = '', state = {}) {
      const normalizedNodeId = String(nodeId || '').trim();
      const nodeIds = getManualNodeSequenceForState(state);
      const currentIndex = nodeIds.indexOf(normalizedNodeId);
      if (currentIndex <= 0) {
        return;
      }
      const nodeStatuses = state?.nodeStatuses && typeof state.nodeStatuses === 'object'
        ? state.nodeStatuses
        : {};
      const blockedPreviousNodes = nodeIds.slice(0, currentIndex)
        .filter((prevNodeId) => !isManualPrerequisiteDoneStatus(String(nodeStatuses[prevNodeId] || 'pending').trim()));
      if (!blockedPreviousNodes.length) {
        return;
      }
      const blockedSteps = blockedPreviousNodes
        .map((prevNodeId) => findStepByNodeId(prevNodeId, state))
        .filter((stepId) => Number.isInteger(stepId) && stepId > 0);
      const currentStep = findStepByNodeId(normalizedNodeId, state);
      throw new Error(
        `手动执行${currentStep ? `步骤 ${currentStep}` : `节点 ${normalizedNodeId}`}前，请先完成或跳过前置步骤${blockedSteps.length ? `：${blockedSteps.join('、')}` : ''}。`
      );
    }

    async function ensureManualStepPrerequisites(step, nodeId = '', state = {}) {
      ensurePreviousNodesReadyForManualExecute(nodeId, state);
      if (step !== 4) {
        return;
      }

      const signupTabId = typeof getTabId === 'function'
        ? await getTabId('signup-page')
        : null;
      const signupTabAlive = signupTabId && typeof isTabAlive === 'function'
        ? await isTabAlive('signup-page')
        : Boolean(signupTabId);

      if (!signupTabId || !signupTabAlive) {
        throw new Error('手动执行步骤 4 前，请先执行步骤 1 或步骤 2，确保认证页仍然打开并停留在验证码页。');
      }
    }

    function getNextNodeIdForState(nodeId, state = {}) {
      const normalizedNodeId = String(nodeId || '').trim();
      if (!normalizedNodeId || typeof getNodeIdsForState !== 'function') {
        return '';
      }
      const nodeIds = Array.isArray(getNodeIdsForState(state)) ? getNodeIdsForState(state) : [];
      const currentIndex = nodeIds.indexOf(normalizedNodeId);
      if (currentIndex < 0) {
        return '';
      }
      return String(nodeIds[currentIndex + 1] || '').trim();
    }

    function getLastNodeIdForState(state = {}) {
      if (typeof getNodeIdsForState !== 'function') {
        return '';
      }
      const nodeIds = Array.isArray(getNodeIdsForState(state)) ? getNodeIdsForState(state) : [];
      return String(nodeIds[nodeIds.length - 1] || '').trim();
    }

    function shouldAutoContinueManualNode(nodeId, state = {}) {
      const normalizedNodeId = String(nodeId || '').trim();
      if (normalizedNodeId !== 'chatgpt-session-reader-create') {
        return false;
      }
      return normalizePlusPaymentMethod(state?.plusPaymentMethod) === 'legacyWallet';
    }

    async function executeNodeForManualChain(nodeId) {
      const executionState = await getState();
      if (doesNodeUseCompletionSignal(nodeId, executionState)) {
        await executeNodeViaCompletionSignal(nodeId);
      } else {
        await executeNode(nodeId);
      }
    }

    async function normalizeNodeProtocolMessage(message = {}) {
      const type = String(message?.type || '').trim();
      const nodeProtocolTypes = new Set([
        'EXECUTE_NODE',
        'NODE_COMPLETE',
        'NODE_ERROR',
        'SKIP_NODE',
      ]);
      if (!nodeProtocolTypes.has(type)) {
        return message;
      }

      const nodeId = String(message?.payload?.nodeId || message?.nodeId || '').trim();
      if (!nodeId) {
        throw new Error(`${type} 缺少 nodeId。`);
      }
      const state = await getState();
      const step = findStepByNodeId(nodeId, state);
      if (!step) {
        throw new Error(`当前 flow 中未找到节点：${nodeId}`);
      }

      const payload = {
        ...(message.payload || {}),
        nodeId,
        step,
      };
      return { ...message, nodeId, step, payload };
    }

    function isStaleAutoRunNodeMessage(nodeId, state = {}) {
      const normalizedNodeId = String(nodeId || '').trim();
      if (!normalizedNodeId) {
        return false;
      }
      if (typeof isAutoRunLockedState !== 'function' || !isAutoRunLockedState(state)) {
        return false;
      }
      const currentStatus = String(state?.nodeStatuses?.[normalizedNodeId] || '').trim();
      if (currentStatus === 'running') {
        return false;
      }
      const currentNodeId = String(state?.currentNodeId || '').trim();
      if (currentNodeId && normalizedNodeId !== currentNodeId) {
        return true;
      }
      return ['completed', 'manual_completed', 'skipped', 'failed', 'stopped'].includes(currentStatus);
    }

    function resolveEmailIdentityPayload(payload = {}) {
      const directEmail = String(payload?.email || '').trim();
      if (directEmail) {
        return directEmail;
      }
      return String(payload?.accountIdentifierType || '').trim().toLowerCase() === 'email'
        ? String(payload?.accountIdentifier || '').trim()
        : '';
    }

    async function persistEmailIdentityFromStepPayload(email, payload = {}, source = 'step_payload') {
      if (!email) {
        return;
      }
      await setEmailState(email, { source });
    }

    function normalizeAutomationWindowId(value) {
      if (value === null || value === undefined || value === '') {
        return null;
      }
      const numeric = Number(value);
      return Number.isInteger(numeric) && numeric >= 0 ? numeric : null;
    }

    function resolveAutomationWindowIdFromMessage(message = {}, sender = {}) {
      return normalizeAutomationWindowId(
        message?.payload?.automationWindowId
        ?? message?.payload?.windowId
        ?? message?.automationWindowId
        ?? message?.windowId
        ?? sender?.tab?.windowId
        ?? null
      );
    }

    async function lockAutomationWindowFromMessage(message = {}, sender = {}) {
      const windowId = resolveAutomationWindowIdFromMessage(message, sender);
      if (windowId === null) {
        return null;
      }
      await setState({ automationWindowId: windowId });
      return windowId;
    }

    async function syncStepAccountIdentityFromPayload(payload = {}) {
      const identifierType = String(payload?.accountIdentifierType || '').trim().toLowerCase();
      const email = resolveEmailIdentityPayload(payload);
      if (identifierType === 'email' || email) {
        if (email) {
          await persistEmailIdentityFromStepPayload(email, payload, 'step_identity');
        }
        if (email) {
          return;
        }
        const updates = {
          ...(email ? {
            accountIdentifierType: 'email',
            accountIdentifier: email,
          } : {}),
        };
        if (Object.keys(updates).length) {
          await setState(updates);
          broadcastDataUpdate(updates);
        }
      }
    }

    function isStepProtectedFromAutoSkip(status) {
      return status === 'running'
        || status === 'completed'
        || status === 'manual_completed'
        || status === 'skipped';
    }

    function findStepByKeyAfter(currentOrder, targetKey, state = {}) {
      const activeStepIds = typeof getStepIdsForState === 'function'
        ? getStepIdsForState(state)
        : [];
      const candidates = activeStepIds.length ? activeStepIds : [Number(currentOrder) + 1, 8];
      return candidates.find((stepId) => {
        const numericStep = Number(stepId);
        if (!Number.isFinite(numericStep) || numericStep <= Number(currentOrder)) {
          return false;
        }
        const stepKey = getStepKeyForState(numericStep, state);
        if (stepKey) {
          return stepKey === targetKey;
        }
        return targetKey === 'fetch-login-code' && Number(currentOrder) === 7 && numericStep === 8;
      }) || null;
    }

    function getNodeStatusByStep(step, state = {}) {
      const nodeId = getStepKeyForState(step, state);
      return nodeId ? (state.nodeStatuses?.[nodeId] || 'pending') : 'pending';
    }

    async function setNodeStatusByStep(step, status, state = {}) {
      const nodeId = getStepKeyForState(step, state);
      if (!nodeId) {
        throw new Error(`未找到步骤 ${step} 对应节点。`);
      }
      await setNodeStatus(nodeId, status);
      return nodeId;
    }

    async function handlePlatformVerifyStepData(payload) {
      if (payload.localhostUrl) {
        await closeLocalhostCallbackTabs(payload.localhostUrl);
      }
      await cleanupPaymentTabsAfterSuccessfulFlow();
      const latestState = await getState();
      if (typeof markCurrentRegistrationAccountUsed === 'function') {
        await markCurrentRegistrationAccountUsed(latestState, {
          logPrefix: '流程完成',
          level: 'ok',
        });
      } else if (latestState.currentHotmailAccountId && isHotmailProvider(latestState)) {
        await patchHotmailAccount(latestState.currentHotmailAccountId, {
          used: true,
          lastUsedAt: Date.now(),
        });
        await addLog('当前 Hotmail 账号已自动标记为已用。', 'ok');
      }
      if (typeof markCurrentRegistrationAccountUsed !== 'function' && String(latestState.mailProvider || '').trim().toLowerCase() === '2925' && latestState.currentMail2925AccountId) {
        await patchMail2925Account(latestState.currentMail2925AccountId, {
          lastUsedAt: Date.now(),
          lastError: '',
        });
        await addLog('当前 2925 账号已记录最近使用时间。', 'ok');
      }
      if (typeof markCurrentRegistrationAccountUsed !== 'function' && isLuckmailProvider(latestState)) {
        const currentPurchase = getCurrentLuckmailPurchase(latestState);
        if (currentPurchase?.id) {
          await setLuckmailPurchaseUsedState(currentPurchase.id, true);
          await addLog(`当前 LuckMail 邮箱 ${currentPurchase.email_address} 已在本地标记为已用。`, 'ok');
        }
        await clearLuckmailRuntimeState({ clearEmail: true });
        await addLog('当前 LuckMail 邮箱运行态已清空，下轮将优先复用未用邮箱或重新购买邮箱。', 'ok');
      }
      const localhostPrefix = buildLocalhostCleanupPrefix(payload.localhostUrl);
      if (localhostPrefix) {
        await closeTabsByUrlPrefix(localhostPrefix, {
          excludeUrls: [payload.localhostUrl],
          excludeLocalhostCallbacks: true,
        });
      }
      if (typeof markCurrentRegistrationAccountUsed !== 'function') {
        await finalizeIcloudAliasAfterSuccessfulFlow(latestState);
      }
    }

    async function handleStepData(step, payload) {
      if (step === 1) {
        const updates = {};
        if (payload.oauthUrl) {
          updates.oauthUrl = payload.oauthUrl;
          broadcastDataUpdate({ oauthUrl: payload.oauthUrl });
        }
        if (payload.localCpaJsonOAuthState !== undefined) updates.localCpaJsonOAuthState = payload.localCpaJsonOAuthState || null;
        if (payload.localCpaJsonPkceCodes !== undefined) updates.localCpaJsonPkceCodes = payload.localCpaJsonPkceCodes || null;
        if (payload.sub2apiSessionId !== undefined) updates.sub2apiSessionId = payload.sub2apiSessionId || null;
        if (payload.sub2apiOAuthState !== undefined) updates.sub2apiOAuthState = payload.sub2apiOAuthState || null;
        if (payload.sub2apiGroupId !== undefined) updates.sub2apiGroupId = payload.sub2apiGroupId || null;
        if (payload.sub2apiGroupIds !== undefined) updates.sub2apiGroupIds = Array.isArray(payload.sub2apiGroupIds)
          ? payload.sub2apiGroupIds
          : [];
        if (payload.sub2apiDraftName !== undefined) updates.sub2apiDraftName = payload.sub2apiDraftName || null;
        if (payload.sub2apiProxyId !== undefined) updates.sub2apiProxyId = payload.sub2apiProxyId || null;
        if (payload.cpaOAuthState !== undefined) updates.cpaOAuthState = payload.cpaOAuthState || null;
        if (payload.cpaManagementOrigin !== undefined) updates.cpaManagementOrigin = payload.cpaManagementOrigin || null;
        if (payload.codex2apiSessionId !== undefined) updates.codex2apiSessionId = payload.codex2apiSessionId || null;
        if (payload.codex2apiOAuthState !== undefined) updates.codex2apiOAuthState = payload.codex2apiOAuthState || null;
        if (Object.keys(updates).length) {
          await setState(updates);
        }
        return;
      }

      const stateForStep = await getState();
      const stepKey = getStepKeyForState(step, stateForStep);
      const isLastNode = Boolean(stepKey) && stepKey === getLastNodeIdForState(stateForStep);

      if (stepKey === 'fill-profile') {
        const latestState = await getState();
        if (
          latestState.currentHotmailAccountId
          && isHotmailProvider(latestState)
        ) {
          if (typeof markCurrentRegistrationAccountUsed === 'function') {
            await markCurrentRegistrationAccountUsed(latestState, {
              logPrefix: '步骤 5 完成',
              level: 'ok',
            });
          } else {
            await patchHotmailAccount(latestState.currentHotmailAccountId, {
              used: true,
              lastUsedAt: Date.now(),
            });
            await addLog('步骤 5 完成：当前 Hotmail 账号已标记为已用。', 'ok');
          }
        }
      }

      if (stepKey === 'oauth-login') {
        await syncStepAccountIdentityFromPayload(payload);
        if (payload.skipLoginVerificationStep) {
          await setState({ loginVerificationRequestedAt: null });
          const latestState = await getState();
          const loginCodeStep = findStepByKeyAfter(
            step,
            'fetch-login-code',
            latestState
          );
          if (loginCodeStep) {
            const currentStatus = getNodeStatusByStep(loginCodeStep, latestState);
            if (!isStepProtectedFromAutoSkip(currentStatus)) {
              await setNodeStatusByStep(loginCodeStep, 'skipped', latestState);
              await addLog(`认证页已直接进入 OAuth 授权页，已自动跳过步骤 ${loginCodeStep} 的登录验证码。`, 'warn', {
                step,
                stepKey: 'oauth-login',
              });
            }
          }
        } else if (payload.loginVerificationRequestedAt) {
          await setState({ loginVerificationRequestedAt: payload.loginVerificationRequestedAt });
        }
        return;
      }

      if (stepKey === 'fetch-login-code') {
        await setState({
          lastEmailTimestamp: payload.emailTimestamp || null,
          loginVerificationRequestedAt: null,
        });
        return;
      }

      if (stepKey === 'confirm-oauth') {
        if (payload.localhostUrl) {
          if (!isLocalhostOAuthCallbackUrl(payload.localhostUrl)) {
            throw new Error(`步骤 ${step} 返回了无效的 localhost OAuth 回调地址。`);
          }
          await setState({ localhostUrl: payload.localhostUrl });
          broadcastDataUpdate({ localhostUrl: payload.localhostUrl });
        }
        return;
      }

      if (stepKey === 'platform-verify') {
        await handlePlatformVerifyStepData(payload);
        return;
      }

      if (stepKey === 'chatgpt-session-reader-create') {
        const latestState = await getState();
        if (getLastNodeIdForState(latestState) === 'chatgpt-session-reader-create') {
          await handlePlatformVerifyStepData(payload);
        }
        return;
      }

      if (isLastNode) {
        await cleanupPaymentTabsAfterSuccessfulFlow();
      }

      switch (step) {
        case 1: {
          const updates = {};
          if (payload.oauthUrl) {
            updates.oauthUrl = payload.oauthUrl;
            broadcastDataUpdate({ oauthUrl: payload.oauthUrl });
          }
          if (payload.localCpaJsonOAuthState !== undefined) updates.localCpaJsonOAuthState = payload.localCpaJsonOAuthState || null;
          if (payload.localCpaJsonPkceCodes !== undefined) updates.localCpaJsonPkceCodes = payload.localCpaJsonPkceCodes || null;
          if (payload.sub2apiSessionId !== undefined) updates.sub2apiSessionId = payload.sub2apiSessionId || null;
          if (payload.sub2apiOAuthState !== undefined) updates.sub2apiOAuthState = payload.sub2apiOAuthState || null;
          if (payload.sub2apiGroupId !== undefined) updates.sub2apiGroupId = payload.sub2apiGroupId || null;
          if (payload.sub2apiGroupIds !== undefined) updates.sub2apiGroupIds = Array.isArray(payload.sub2apiGroupIds)
            ? payload.sub2apiGroupIds
            : [];
          if (payload.sub2apiDraftName !== undefined) updates.sub2apiDraftName = payload.sub2apiDraftName || null;
          if (payload.sub2apiProxyId !== undefined) updates.sub2apiProxyId = payload.sub2apiProxyId || null;
          if (payload.cpaOAuthState !== undefined) updates.cpaOAuthState = payload.cpaOAuthState || null;
          if (payload.cpaManagementOrigin !== undefined) updates.cpaManagementOrigin = payload.cpaManagementOrigin || null;
          if (payload.codex2apiSessionId !== undefined) updates.codex2apiSessionId = payload.codex2apiSessionId || null;
          if (payload.codex2apiOAuthState !== undefined) updates.codex2apiOAuthState = payload.codex2apiOAuthState || null;
          if (Object.keys(updates).length) {
            await setState(updates);
          }
          break;
        }
        case 2:
          await syncStepAccountIdentityFromPayload(payload);
          if (payload.skipRegistrationFlow) {
            const latestState = await getState();
            for (const skippedStep of [3, 4, 5]) {
              const status = getNodeStatusByStep(skippedStep, latestState);
              if (status === 'running' || status === 'completed' || status === 'manual_completed') {
                continue;
              }
              await setNodeStatusByStep(skippedStep, 'skipped', latestState);
            }
            await addLog('步骤 2：检测到当前已登录会话，已自动跳过步骤 3/4/5，流程将直接进入步骤 6。', 'warn');
            break;
          }
          if (payload.skippedPasswordStep) {
            const latestState = await getState();
            const step3Status = getNodeStatusByStep(3, latestState);
            if (step3Status !== 'running' && step3Status !== 'completed' && step3Status !== 'manual_completed') {
              await setNodeStatusByStep(3, 'skipped', latestState);
              await addLog('步骤 2：提交邮箱后页面直接进入验证码页，已自动跳过步骤 3。', 'warn');
            }
          }
          break;
        case 3:
          await syncStepAccountIdentityFromPayload(payload);
          if (payload.signupVerificationRequestedAt) {
            await setState({ signupVerificationRequestedAt: payload.signupVerificationRequestedAt });
          }
          if (payload.skipProfileStep) {
            const latestState = await getState();
            const step5Status = getNodeStatusByStep(5, latestState);
            if (step5Status !== 'running' && step5Status !== 'completed' && step5Status !== 'manual_completed') {
              await setNodeStatusByStep(5, 'skipped', latestState);
              if (typeof markCurrentRegistrationAccountUsed === 'function') {
                await markCurrentRegistrationAccountUsed(latestState, {
                  logPrefix: '步骤 3 跳过步骤 5',
                  level: 'ok',
                });
              }
              await addLog('步骤 3：页面已直接进入已登录态，已自动跳过步骤 5。', 'warn');
            }
          }
          if (payload.loginVerificationRequestedAt) {
            await setState({ loginVerificationRequestedAt: payload.loginVerificationRequestedAt });
          }
          break;
        case 4:
          await setState({
            lastEmailTimestamp: payload.emailTimestamp || null,
            signupVerificationRequestedAt: null,
          });
          if (payload.passwordSubmittedAfterVerification) {
            const latestState = await getState();
            const step3Status = getNodeStatusByStep(3, latestState);
            if (step3Status !== 'running' && step3Status !== 'completed' && step3Status !== 'manual_completed') {
              await setNodeStatusByStep(3, 'completed', latestState);
              const currentStepKey = getStepKeyForState(step, latestState);
              if (currentStepKey) {
                await setState({ currentNodeId: currentStepKey });
              }
              await addLog('步骤 4：验证码后已自动设置 GPT 密码，已将步骤 3 标记为完成。', 'ok', {
                step,
                stepKey: 'fetch-signup-code',
              });
            }
          }
          if (payload.skipProfileStep) {
            const latestState = await getState();
            const step5Status = getNodeStatusByStep(5, latestState);
            if (step5Status !== 'running' && step5Status !== 'completed' && step5Status !== 'manual_completed') {
              await setNodeStatusByStep(5, 'skipped', latestState);
              if (typeof markCurrentRegistrationAccountUsed === 'function') {
                await markCurrentRegistrationAccountUsed(latestState, {
                  logPrefix: '步骤 4 跳过步骤 5',
                  level: 'ok',
                });
              }
              if (payload.skipProfileStepReason === 'combined_verification_profile') {
                await addLog('步骤 4：当前验证码页已内嵌完成注册资料提交，已自动跳过步骤 5。', 'warn');
              } else {
                await addLog('步骤 4：检测到账号已直接进入已登录态，已自动跳过步骤 5。', 'warn');
              }
            }
          }
          break;
        case 7:
          await syncStepAccountIdentityFromPayload(payload);
          if (payload.loginVerificationRequestedAt) {
            await setState({
              loginVerificationRequestedAt: payload.loginVerificationRequestedAt,
              lastLoginCode: null,
            });
            broadcastDataUpdate({ lastLoginCode: null });
          }
          break;
        case 8:
          {
            const step8StateUpdates = {
              lastEmailTimestamp: payload.emailTimestamp || null,
              ...(Object.prototype.hasOwnProperty.call(payload, 'code') ? {
                lastLoginCode: payload.code || null,
              } : {}),
              loginVerificationRequestedAt: null,
            };
            await setState(step8StateUpdates);
            if (Object.prototype.hasOwnProperty.call(step8StateUpdates, 'lastLoginCode')) {
              broadcastDataUpdate({ lastLoginCode: step8StateUpdates.lastLoginCode });
            }
          }
          break;
        case 9:
          if (payload.localhostUrl) {
            if (!isLocalhostOAuthCallbackUrl(payload.localhostUrl)) {
              throw new Error('步骤 9 返回了无效的 localhost OAuth 回调地址。');
            }
            await setState({ localhostUrl: payload.localhostUrl });
            broadcastDataUpdate({ localhostUrl: payload.localhostUrl });
          }
          break;
        default:
          break;
      }
    }

    return {
      appendManualAccountRunRecordIfNeeded,
      ensureManualStepPrerequisites,
      executeNodeForManualChain,
      findStepByNodeId,
      getLastNodeIdForState,
      getNextNodeIdForState,
      getStepKeyForState,
      handleStepData,
      isStaleAutoRunNodeMessage,
      lockAutomationWindowFromMessage,
      normalizeNodeProtocolMessage,
      shouldAutoContinueManualNode,
    };
  }

  return {
    createRouterNodeProtocolService,
  };
});
