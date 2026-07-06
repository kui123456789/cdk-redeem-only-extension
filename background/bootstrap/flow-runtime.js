(function attachBackgroundFlowRuntime(globalScope) {
  function normalizeStepIds(definitions = []) {
    return definitions
      .map((definition) => Number(definition?.id))
      .filter(Number.isFinite)
      .sort((left, right) => left - right);
  }

  function create({ defaultActiveFlowId = 'openai', ...deps } = {}) {
    const DEFAULT_ACTIVE_FLOW_ID = defaultActiveFlowId;
    const PLUS_ACCOUNT_ACCESS_STRATEGY_OAUTH = 'oauth';
    const NORMAL_STEP_DEFINITIONS = globalScope.MultiPageStepDefinitions?.getSteps?.({
      activeFlowId: DEFAULT_ACTIVE_FLOW_ID,
      plusModeEnabled: false,
    }) || [];
    const PLUS_UPI_STEP_DEFINITIONS = globalScope.MultiPageStepDefinitions?.getSteps?.({
      activeFlowId: DEFAULT_ACTIVE_FLOW_ID,
      plusModeEnabled: true,
      plusPaymentMethod: 'upi',
    }) || NORMAL_STEP_DEFINITIONS;
    const NO_2FA_FREE_STEP_DEFINITIONS = globalScope.MultiPageStepDefinitions?.getSteps?.({
      activeFlowId: DEFAULT_ACTIVE_FLOW_ID,
      plusModeEnabled: true,
      plusPaymentMethod: 'upi',
      registrationFreeRoute: 'no-2fa-free',
    }) || PLUS_UPI_STEP_DEFINITIONS;
    const PASSKEY_FREE_STEP_DEFINITIONS = globalScope.MultiPageStepDefinitions?.getSteps?.({
      activeFlowId: DEFAULT_ACTIVE_FLOW_ID,
      plusModeEnabled: true,
      plusPaymentMethod: 'upi',
      registrationFreeRoute: 'passkey-free',
    }) || PLUS_UPI_STEP_DEFINITIONS;
    const PLUS_UPI_REDEEM_ONLY_STEP_DEFINITIONS = globalScope.MultiPageStepDefinitions?.getSteps?.({
      activeFlowId: DEFAULT_ACTIVE_FLOW_ID,
      plusModeEnabled: true,
      plusPaymentMethod: 'upi',
      upiRedeemStopAfterRedeem: true,
    }) || PLUS_UPI_STEP_DEFINITIONS.slice(0, 7);
    const LOCAL_CPA_JSON_NO_RT_STEP_DEFINITIONS = globalScope.MultiPageStepDefinitions?.getSteps?.({
      activeFlowId: DEFAULT_ACTIVE_FLOW_ID,
      panelMode: 'local-cpa-json-no-rt',
      plusModeEnabled: true,
    }) || PLUS_UPI_STEP_DEFINITIONS.slice(0, 6);
    const PLUS_STEP_DEFINITIONS = PLUS_UPI_STEP_DEFINITIONS;
    const ALL_STEP_DEFINITIONS = globalScope.MultiPageStepDefinitions?.getAllSteps?.({
      activeFlowId: DEFAULT_ACTIVE_FLOW_ID,
    }) || [
      ...NORMAL_STEP_DEFINITIONS,
      ...PLUS_UPI_STEP_DEFINITIONS,
    ];
    const STEP_IDS = Array.from(new Set(normalizeStepIds(ALL_STEP_DEFINITIONS)));
    const DEFAULT_STEP_STATUSES = Object.fromEntries(STEP_IDS.map((stepId) => [stepId, 'pending']));
    const DEFAULT_NODE_IDS = Array.from(new Set(ALL_STEP_DEFINITIONS
      .map((definition) => String(definition?.key || '').trim())
      .filter(Boolean)));
    const DEFAULT_NODE_STATUSES = Object.fromEntries(DEFAULT_NODE_IDS.map((nodeId) => [nodeId, 'pending']));
    const NORMAL_STEP_IDS = normalizeStepIds(NORMAL_STEP_DEFINITIONS);
    const PLUS_UPI_STEP_IDS = normalizeStepIds(PLUS_UPI_STEP_DEFINITIONS);
    const PLUS_STEP_IDS = PLUS_UPI_STEP_IDS;
    const LAST_STEP_ID = Math.max(
      NORMAL_STEP_IDS[NORMAL_STEP_IDS.length - 1] || 10,
      PLUS_UPI_STEP_IDS[PLUS_UPI_STEP_IDS.length - 1] || 10
    );
    const FINAL_OAUTH_CHAIN_START_STEP = 7;
    const flowDefinitionResolver = globalScope.MultiPageFlowDefinitionResolver?.createFlowDefinitionResolver?.({
      defaultActiveFlowId: DEFAULT_ACTIVE_FLOW_ID,
      finalOauthChainStartStep: FINAL_OAUTH_CHAIN_START_STEP,
      getPanelMode: deps.getPanelMode,
      getRootScope: deps.getRootScope || (() => globalScope),
      getWorkflowEngine: deps.getWorkflowEngine,
      isPlusModeState: deps.isPlusModeState,
      normalStepDefinitions: NORMAL_STEP_DEFINITIONS,
      normalStepIds: NORMAL_STEP_IDS,
      normalizePlusAccountAccessStrategyForState: deps.normalizePlusAccountAccessStrategyForState,
      normalizePlusPaymentMethod: deps.normalizePlusPaymentMethod,
      plusStepDefinitions: PLUS_UPI_STEP_DEFINITIONS,
      plusStepIds: PLUS_UPI_STEP_IDS,
      plusUpiRedeemOnlyStepDefinitions: PLUS_UPI_REDEEM_ONLY_STEP_DEFINITIONS,
      signupMethodEmail: deps.signupMethodEmail,
    });

    function requireFlowDefinitionResolver() {
      if (!flowDefinitionResolver) {
        throw new Error('流程定义解析模块未加载。');
      }
      return flowDefinitionResolver;
    }

    function getSignupMethodForStepDefinitions(state = {}) {
      return requireFlowDefinitionResolver().getSignupMethodForStepDefinitions(state);
    }

    function getStepDefinitionsForState(state = {}) {
      return requireFlowDefinitionResolver().getStepDefinitionsForState(state);
    }

    function getStepIdsForState(state = {}) {
      return requireFlowDefinitionResolver().getStepIdsForState(state);
    }

    function getLastStepIdForState(state = {}) {
      return requireFlowDefinitionResolver().getLastStepIdForState(state);
    }

    function getAuthChainStartStepId(state = {}) {
      return requireFlowDefinitionResolver().getAuthChainStartStepId(state);
    }

    function getStepDefinitionForState(step, state = {}) {
      return requireFlowDefinitionResolver().getStepDefinitionForState(step, state);
    }

    function getStepIdByKeyForState(stepKey, state = {}) {
      return requireFlowDefinitionResolver().getStepIdByKeyForState(stepKey, state);
    }

    function getNodeDefinitionsForState(state = {}) {
      return requireFlowDefinitionResolver().getNodeDefinitionsForState(state);
    }

    function getNodeIdsForState(state = {}) {
      return requireFlowDefinitionResolver().getNodeIdsForState(state);
    }

    function getNodeDefinitionForState(nodeId, state = {}) {
      return requireFlowDefinitionResolver().getNodeDefinitionForState(nodeId, state);
    }

    function getLastNodeIdForState(state = {}) {
      return requireFlowDefinitionResolver().getLastNodeIdForState(state);
    }

    function getNodeIdByStepForState(step, state = {}) {
      return requireFlowDefinitionResolver().getNodeIdByStepForState(step, state);
    }

    function getStepIdByNodeIdForState(nodeId, state = {}) {
      return requireFlowDefinitionResolver().getStepIdByNodeIdForState(nodeId, state);
    }

    function getNodeTitleForState(nodeId, state = {}) {
      return requireFlowDefinitionResolver().getNodeTitleForState(nodeId, state);
    }

    return {
      DEFAULT_ACTIVE_FLOW_ID,
      PLUS_ACCOUNT_ACCESS_STRATEGY_OAUTH,
      NORMAL_STEP_DEFINITIONS,
      PLUS_UPI_STEP_DEFINITIONS,
      NO_2FA_FREE_STEP_DEFINITIONS,
      PASSKEY_FREE_STEP_DEFINITIONS,
      PLUS_UPI_REDEEM_ONLY_STEP_DEFINITIONS,
      LOCAL_CPA_JSON_NO_RT_STEP_DEFINITIONS,
      PLUS_STEP_DEFINITIONS,
      ALL_STEP_DEFINITIONS,
      STEP_IDS,
      DEFAULT_STEP_STATUSES,
      DEFAULT_NODE_IDS,
      DEFAULT_NODE_STATUSES,
      NORMAL_STEP_IDS,
      PLUS_UPI_STEP_IDS,
      PLUS_STEP_IDS,
      LAST_STEP_ID,
      FINAL_OAUTH_CHAIN_START_STEP,
      flowDefinitionResolver,
      requireFlowDefinitionResolver,
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

  globalScope.MultiPageBackgroundFlowRuntime = {
    create,
  };
})(self);
