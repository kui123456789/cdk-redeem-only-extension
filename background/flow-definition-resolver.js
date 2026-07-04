(function attachFlowDefinitionResolver(globalScope) {
  function normalizeString(value = '') {
    return String(value || '').trim();
  }

  function createFlowDefinitionResolver(deps = {}) {
    const {
      defaultActiveFlowId = 'openai',
      finalOauthChainStartStep = 7,
      getPanelMode = null,
      getRootScope = () => globalScope,
      getWorkflowEngine = () => null,
      isPlusModeState = () => false,
      normalStepDefinitions = [],
      normalStepIds = [],
      normalizePlusAccountAccessStrategyForState = () => '',
      normalizePlusPaymentMethod = () => 'upi',
      plusAccountAccessStrategyCpaSession = 'cpa_codex_session',
      plusAccountAccessStrategySub2ApiSession = 'sub2api_codex_session',
      plusStepDefinitions = [],
      plusStepIds = [],
      plusUpiCpaSessionStepDefinitions = [],
      plusUpiRedeemOnlyStepDefinitions = [],
      plusUpiSub2ApiSessionStepDefinitions = [],
      signupMethodEmail = 'email',
    } = deps;

    function getSignupMethodForStepDefinitions(state = {}) {
      return signupMethodEmail;
    }

    function getStepDefinitionsForState(state = {}) {
      const rootScope = getRootScope() || globalScope;
      if (rootScope.MultiPageStepDefinitions?.getSteps) {
        const activeFlowId = normalizeString(state?.activeFlowId).toLowerCase() || defaultActiveFlowId;
        const panelMode = typeof getPanelMode === 'function'
          ? getPanelMode(state)
          : normalizeString(state?.panelMode).toLowerCase() || 'cpa';
        const definitions = rootScope.MultiPageStepDefinitions.getSteps({
          activeFlowId,
          panelMode,
          plusModeEnabled: isPlusModeState(state),
          plusPaymentMethod: normalizePlusPaymentMethod(state?.plusPaymentMethod),
          plusAccountAccessStrategy: normalizePlusAccountAccessStrategyForState(state),
          signupMethod: signupMethodEmail,
          upiRedeemStopAfterRedeem: Boolean(state?.upiRedeemStopAfterRedeem ?? state?.pixRedeemStopAfterRedeem),
          upiRedeemContinueAfterRedeem: Boolean(state?.upiRedeemContinueAfterRedeem ?? state?.pixRedeemContinueAfterRedeem),
          totpMfaAfterProfileEnabled: state?.totpMfaAfterProfileEnabled !== false,
        });
        if (Array.isArray(definitions)) {
          return definitions;
        }
      }

      const activeFlowId = normalizeString(state?.activeFlowId).toLowerCase();
      if (activeFlowId && activeFlowId !== defaultActiveFlowId) {
        return [];
      }
      if (!isPlusModeState(state)) {
        return normalStepDefinitions;
      }
      const plusAccountAccessStrategy = normalizePlusAccountAccessStrategyForState(state);
      if ((state?.upiRedeemContinueAfterRedeem ?? state?.pixRedeemContinueAfterRedeem) !== true) {
        return plusUpiRedeemOnlyStepDefinitions;
      }
      if (plusAccountAccessStrategy === plusAccountAccessStrategySub2ApiSession) {
        return plusUpiSub2ApiSessionStepDefinitions;
      }
      if (plusAccountAccessStrategy === plusAccountAccessStrategyCpaSession) {
        return plusUpiCpaSessionStepDefinitions;
      }
      return plusStepDefinitions;
    }

    function getStepIdsForState(state = {}) {
      const definitions = getStepDefinitionsForState(state);
      if (Array.isArray(definitions) && definitions.length) {
        return definitions
          .map((definition) => Number(definition?.id))
          .filter(Number.isFinite)
          .sort((left, right) => left - right);
      }
      if (!isPlusModeState(state)) {
        return normalStepIds;
      }
      return plusStepIds;
    }

    function getLastStepIdForState(state = {}) {
      const ids = getStepIdsForState(state);
      if (ids.length) {
        return ids[ids.length - 1];
      }
      return normalizeString(state?.activeFlowId).toLowerCase() === defaultActiveFlowId ? 10 : 0;
    }

    function getAuthChainStartStepId(state = {}) {
      const authStepId = getStepIdByKeyForState('oauth-login', state);
      if (Number.isInteger(authStepId) && authStepId > 0) {
        return authStepId;
      }
      return isPlusModeState(state) ? 10 : finalOauthChainStartStep;
    }

    function getStepDefinitionForState(step, state = {}) {
      const numericStep = Number(step);
      return getStepDefinitionsForState(state).find((definition) => Number(definition.id) === numericStep) || null;
    }

    function getStepIdByKeyForState(stepKey, state = {}) {
      const normalizedKey = normalizeString(stepKey);
      if (!normalizedKey) return null;
      const ids = getStepIdsForState(state);
      for (const id of ids) {
        if (normalizeString(getStepDefinitionForState(id, state)?.key) === normalizedKey) {
          return Number(id);
        }
      }
      return null;
    }

    function getNodeDefinitionsForState(state = {}) {
      const workflowEngine = getWorkflowEngine();
      if (workflowEngine?.getNodesForState) {
        return workflowEngine.getNodesForState(state);
      }
      const rootScope = getRootScope() || globalScope;
      if (rootScope.MultiPageStepDefinitions?.getNodes) {
        return rootScope.MultiPageStepDefinitions.getNodes({
          ...state,
          activeFlowId: state?.activeFlowId || state?.flowId || defaultActiveFlowId,
          flowId: state?.flowId || state?.activeFlowId || defaultActiveFlowId,
        });
      }
      return getStepDefinitionsForState(state)
        .map((definition) => ({
          legacyStepId: Number(definition?.id),
          nodeId: normalizeString(definition?.key),
          displayOrder: Number.isFinite(Number(definition?.order)) ? Number(definition.order) : Number(definition?.id),
          title: normalizeString(definition?.title),
          executeKey: normalizeString(definition?.key),
        }))
        .filter((definition) => definition.nodeId);
    }

    function getNodeIdsForState(state = {}) {
      const workflowEngine = getWorkflowEngine();
      if (workflowEngine?.getNodeIdsForState) {
        return workflowEngine.getNodeIdsForState(state);
      }
      return getNodeDefinitionsForState(state).map((definition) => definition.nodeId).filter(Boolean);
    }

    function getNodeDefinitionForState(nodeId, state = {}) {
      const normalizedNodeId = normalizeString(nodeId);
      if (!normalizedNodeId) return null;
      const workflowEngine = getWorkflowEngine();
      if (workflowEngine?.getNodeById) {
        return workflowEngine.getNodeById(normalizedNodeId, state);
      }
      return getNodeDefinitionsForState(state).find((definition) => definition.nodeId === normalizedNodeId) || null;
    }

    function getLastNodeIdForState(state = {}) {
      const nodeIds = getNodeIdsForState(state);
      return nodeIds[nodeIds.length - 1] || '';
    }

    function getNodeIdByStepForState(step, state = {}) {
      const definition = getStepDefinitionForState(step, state);
      return normalizeString(definition?.key);
    }

    function getStepIdByNodeIdForState(nodeId, state = {}) {
      const normalizedNodeId = normalizeString(nodeId);
      if (!normalizedNodeId) return null;
      const node = getNodeDefinitionForState(normalizedNodeId, state);
      const legacyStepId = Number(node?.legacyStepId);
      if (Number.isInteger(legacyStepId) && legacyStepId > 0) {
        return legacyStepId;
      }
      return getStepIdByKeyForState(normalizedNodeId, state);
    }

    function getNodeTitleForState(nodeId, state = {}) {
      const normalizedNodeId = normalizeString(nodeId);
      if (!normalizedNodeId) return '';
      const workflowEngine = getWorkflowEngine();
      if (workflowEngine?.getNodeTitle) {
        return workflowEngine.getNodeTitle(normalizedNodeId, state);
      }
      return getNodeDefinitionForState(normalizedNodeId, state)?.title || normalizedNodeId;
    }

    return {
      getAuthChainStartStepId,
      getLastNodeIdForState,
      getLastStepIdForState,
      getNodeDefinitionForState,
      getNodeDefinitionsForState,
      getNodeIdByStepForState,
      getNodeIdsForState,
      getNodeTitleForState,
      getSignupMethodForStepDefinitions,
      getStepDefinitionForState,
      getStepDefinitionsForState,
      getStepIdByKeyForState,
      getStepIdByNodeIdForState,
      getStepIdsForState,
    };
  }

  globalScope.MultiPageFlowDefinitionResolver = {
    createFlowDefinitionResolver,
  };
})(self);
