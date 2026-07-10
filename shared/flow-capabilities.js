(function attachMultiPageFlowCapabilities(root, factory) {
  root.MultiPageFlowCapabilities = factory();
})(typeof self !== 'undefined' ? self : globalThis, function createFlowCapabilitiesModule() {
  const DEFAULT_FLOW_ID = 'openai';
  const DEFAULT_PANEL_MODE = 'local-cpa-json';
  const LOCAL_CPA_JSON_NO_RT_PANEL_MODE = 'local-cpa-json-no-rt';
  const SIGNUP_METHOD_EMAIL = 'email';
  const PLUS_ACCOUNT_ACCESS_STRATEGY_OAUTH = 'oauth';
  const VALID_PANEL_MODES = Object.freeze(['local-cpa-json', LOCAL_CPA_JSON_NO_RT_PANEL_MODE, 'codex2api']);

  const DEFAULT_FLOW_CAPABILITIES = Object.freeze({
    supportsEmailSignup: true,
    supportsPlusMode: false,
    supportsContributionMode: false,
    supportsPlatformBinding: [],
    supportsLuckmail: false,
    supportsOauthTimeoutBudget: false,
    canSwitchFlow: false,
    stepDefinitionMode: 'default',
  });

  const FLOW_CAPABILITIES = Object.freeze({
    openai: Object.freeze({
      ...DEFAULT_FLOW_CAPABILITIES,
      supportsPlusMode: true,
      supportsContributionMode: true,
      supportsPlatformBinding: ['local-cpa-json', LOCAL_CPA_JSON_NO_RT_PANEL_MODE, 'codex2api'],
      supportsLuckmail: true,
      supportsOauthTimeoutBudget: true,
      stepDefinitionMode: 'openai-dynamic',
    }),
  });

  const DEFAULT_PANEL_CAPABILITIES = Object.freeze({
    supportedPlusAccountAccessStrategies: Object.freeze([PLUS_ACCOUNT_ACCESS_STRATEGY_OAUTH]),
  });
  const MODE_SWITCH_RELEVANT_KEYS = Object.freeze([
    'activeFlowId',
    'contributionMode',
    'panelMode',
    'plusAccountAccessStrategy',
    'plusModeEnabled',
    'signupMethod',
  ]);

  const PANEL_CAPABILITIES = Object.freeze({
    'local-cpa-json': Object.freeze({
      supportedPlusAccountAccessStrategies: Object.freeze([
        PLUS_ACCOUNT_ACCESS_STRATEGY_OAUTH,
      ]),
    }),
    [LOCAL_CPA_JSON_NO_RT_PANEL_MODE]: Object.freeze({
      supportedPlusAccountAccessStrategies: Object.freeze([
        PLUS_ACCOUNT_ACCESS_STRATEGY_OAUTH,
      ]),
    }),
    codex2api: Object.freeze({}),
  });

  function normalizeFlowId(value = '', fallback = DEFAULT_FLOW_ID) {
    const normalized = String(value || '').trim().toLowerCase();
    if (normalized) {
      return normalized;
    }
    const fallbackValue = String(fallback || '').trim().toLowerCase();
    return fallbackValue || DEFAULT_FLOW_ID;
  }

  function normalizePanelMode(value = '', fallback = DEFAULT_PANEL_MODE) {
    const normalized = String(value || '').trim().toLowerCase();
    if (VALID_PANEL_MODES.includes(normalized)) {
      return normalized;
    }
    const fallbackValue = String(fallback || '').trim().toLowerCase();
    return VALID_PANEL_MODES.includes(fallbackValue) ? fallbackValue : DEFAULT_PANEL_MODE;
  }

  function normalizeSignupMethod(value = '') {
    return SIGNUP_METHOD_EMAIL;
  }

  function normalizePlusAccountAccessStrategy(value = '') {
    return PLUS_ACCOUNT_ACCESS_STRATEGY_OAUTH;
  }

  function getPlusAccountSessionStrategyForPanel(panelMode = '') {
    return PLUS_ACCOUNT_ACCESS_STRATEGY_OAUTH;
  }

  function normalizePlusAccountAccessStrategyForPanel(value = '', panelMode = '') {
    return normalizePlusAccountAccessStrategy(value);
  }

  function normalizePanelModeList(values = []) {
    if (!Array.isArray(values)) {
      return [];
    }
    const seen = new Set();
    const normalized = [];
    values.forEach((value) => {
      const mode = normalizePanelMode(value, '');
      if (!mode || seen.has(mode)) {
        return;
      }
      seen.add(mode);
      normalized.push(mode);
    });
    return normalized;
  }

  function getPanelModeLabel(panelMode = '') {
    const normalized = normalizePanelMode(panelMode);
    if (normalized === 'local-cpa-json') {
      return '本地CPA JSON 有RT';
    }
    if (normalized === LOCAL_CPA_JSON_NO_RT_PANEL_MODE) {
      return '本地CPA JSON 无RT';
    }
    if (normalized === 'codex2api') {
      return 'Codex2API';
    }
    return '本地CPA JSON 有RT';
  }

  function isCustomEmailPoolGenerator(value = '') {
    const normalized = String(value || '').trim().toLowerCase();
    return ['custom-pool', 'custom-email-pool', 'custom_email_pool'].includes(normalized);
  }

  function getCustomEmailPoolAvailableCount(state = {}) {
    const structuredEntries = Array.isArray(state?.customEmailPoolEntries)
      ? state.customEmailPoolEntries
      : [];
    if (structuredEntries.length > 0) {
      return structuredEntries.filter((entry) => {
        const source = entry && typeof entry === 'object' ? entry : { email: entry };
        const email = String(source.email || source.credential || '').split('----')[0].trim().toLowerCase();
        const eligibilityStatus = String(source.trialEligibilityStatus || '')
          .trim()
          .toLowerCase()
          .replace(/[\s-]+/g, '_');
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
          && source.enabled !== false
          && source.used !== true
          && source.registrationBlocked !== true
          && !['ineligible', 'not_eligible', 'no_trial', 'trial_ineligible', 'rejected'].includes(eligibilityStatus);
      }).length;
    }

    const legacyPool = Array.isArray(state?.customEmailPool)
      ? state.customEmailPool
      : String(state?.customEmailPool || '').split(/[\r\n,，;；]+/);
    return new Set(legacyPool
      .map((entry) => String(entry && typeof entry === 'object' ? entry.email || entry.credential || '' : entry || '')
        .split('----')[0]
        .trim()
        .toLowerCase())
      .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))
      .size;
  }

  function createFlowCapabilityRegistry(deps = {}) {
    const {
      defaultFlowCapabilities = DEFAULT_FLOW_CAPABILITIES,
      defaultFlowId = DEFAULT_FLOW_ID,
      defaultPanelCapabilities = DEFAULT_PANEL_CAPABILITIES,
      flowCapabilities = FLOW_CAPABILITIES,
      panelCapabilities = PANEL_CAPABILITIES,
    } = deps;

    function getFlowCapabilities(flowId) {
      const normalizedFlowId = normalizeFlowId(flowId, defaultFlowId);
      const entry = flowCapabilities[normalizedFlowId] || null;
      return {
        ...defaultFlowCapabilities,
        ...(entry || {}),
        supportsPlatformBinding: normalizePanelModeList(entry?.supportsPlatformBinding || defaultFlowCapabilities.supportsPlatformBinding),
      };
    }

    function getPanelCapabilities(panelMode) {
      const normalizedPanelMode = normalizePanelMode(panelMode);
      return {
        ...defaultPanelCapabilities,
        ...(panelCapabilities[normalizedPanelMode] || {}),
      };
    }

    function normalizeChangedKeys(values = []) {
      const list = Array.isArray(values) ? values : [];
      const seen = new Set();
      const normalized = [];
      list.forEach((value) => {
        const key = String(value || '').trim();
        if (!key || seen.has(key)) {
          return;
        }
        seen.add(key);
        normalized.push(key);
      });
      return normalized;
    }

    function resolveSidepanelCapabilities(options = {}) {
      const state = options?.state || {};
      const activeFlowId = normalizeFlowId(
        options?.activeFlowId ?? state?.activeFlowId,
        defaultFlowId
      );
      const flowState = getFlowCapabilities(activeFlowId);
      const requestedPanelMode = normalizePanelMode(
        options?.panelMode ?? state?.panelMode,
        DEFAULT_PANEL_MODE
      );
      const supportedPanelModes = normalizePanelModeList(flowState.supportsPlatformBinding);
      const panelModeSupported = supportedPanelModes.length === 0
        ? true
        : supportedPanelModes.includes(requestedPanelMode);
      const effectivePanelMode = panelModeSupported
        ? requestedPanelMode
        : supportedPanelModes[0];
      const panelState = getPanelCapabilities(effectivePanelMode);
      const runtimeLocks = {
        autoRunLocked: Boolean(options?.autoRunLocked ?? state?.autoRunLocked),
        contributionMode: flowState.supportsContributionMode && Boolean(state?.contributionMode),
        plusModeEnabled: flowState.supportsPlusMode && Boolean(state?.plusModeEnabled),
        settingsMenuLocked: Boolean(options?.settingsMenuLocked ?? state?.settingsMenuLocked),
      };
      const requestedPlusAccountAccessStrategy = normalizePlusAccountAccessStrategyForPanel(
        options?.plusAccountAccessStrategy ?? state?.plusAccountAccessStrategy,
        effectivePanelMode
      );
      const panelPlusAccountAccessStrategies = (Array.isArray(panelState.supportedPlusAccountAccessStrategies)
        && panelState.supportedPlusAccountAccessStrategies.length > 0
        ? panelState.supportedPlusAccountAccessStrategies
        : [PLUS_ACCOUNT_ACCESS_STRATEGY_OAUTH])
        .map(normalizePlusAccountAccessStrategy)
        .filter((strategy, index, strategies) => strategy && strategies.indexOf(strategy) === index);
      const effectiveSignupMethods = [SIGNUP_METHOD_EMAIL];
      const requestedSignupMethod = normalizeSignupMethod(
        options?.signupMethod ?? state?.signupMethod
      );
      const effectiveSignupMethod = SIGNUP_METHOD_EMAIL;
      const availablePlusAccountAccessStrategies = activeFlowId === 'openai'
        && Boolean(flowState.supportsPlusMode)
        && Boolean(runtimeLocks.plusModeEnabled)
        ? panelPlusAccountAccessStrategies
        : [PLUS_ACCOUNT_ACCESS_STRATEGY_OAUTH];
      const effectivePlusAccountAccessStrategy = availablePlusAccountAccessStrategies.includes(requestedPlusAccountAccessStrategy)
        ? requestedPlusAccountAccessStrategy
        : PLUS_ACCOUNT_ACCESS_STRATEGY_OAUTH;
      const canEditPlusAccountAccessStrategy = activeFlowId === 'openai'
        && Boolean(flowState.supportsPlusMode)
        && Boolean(runtimeLocks.plusModeEnabled)
        && availablePlusAccountAccessStrategies.length > 1;

      return {
        activeFlowId,
        canShowContributionMode: Boolean(flowState.supportsContributionMode),
        canShowLuckmail: Boolean(flowState.supportsLuckmail),
        canShowPlusSettings: Boolean(flowState.supportsPlusMode),
        canSwitchFlow: Boolean(flowState.canSwitchFlow),
        canEditPlusAccountAccessStrategy,
        canUseSelectedPanelMode: panelModeSupported,
        effectivePlusAccountAccessStrategy,
        effectivePanelMode,
        effectiveSignupMethod,
        effectiveSignupMethods,
        flowCapabilities: flowState,
        panelCapabilities: panelState,
        panelMode: effectivePanelMode,
        requestedPanelMode,
        requestedPlusAccountAccessStrategy,
        requestedSignupMethod,
        runtimeLocks,
        stepDefinitionOptions: {
          activeFlowId,
          panelMode: effectivePanelMode,
          plusAccountAccessStrategy: effectivePlusAccountAccessStrategy,
          plusModeEnabled: runtimeLocks.plusModeEnabled,
          signupMethod: effectiveSignupMethod,
        },
        availablePlusAccountAccessStrategies,
        supportedPanelModes,
      };
    }

    function validateAutoRunStart(options = {}) {
      const state = options?.state || {};
      const capabilityState = resolveSidepanelCapabilities(options);
      const errors = [];
      const totalRuns = Math.max(1, Math.floor(Number(options?.totalRuns) || 1));

      if (
        Array.isArray(capabilityState.supportedPanelModes)
        && capabilityState.supportedPanelModes.length > 0
        && capabilityState.canUseSelectedPanelMode === false
      ) {
        errors.push({
          code: 'panel_mode_unsupported',
          message: `当前 flow 不支持 ${getPanelModeLabel(capabilityState.requestedPanelMode)} 面板模式。`,
        });
      }

      if (Boolean(state?.plusModeEnabled) && !capabilityState.flowCapabilities?.supportsPlusMode) {
        errors.push({
          code: 'plus_mode_unsupported',
          message: '当前 flow 不支持 Plus 模式。',
        });
      }

      if (Boolean(state?.contributionMode) && !capabilityState.flowCapabilities?.supportsContributionMode) {
        errors.push({
          code: 'contribution_mode_unsupported',
          message: '当前 flow 不支持贡献模式。',
        });
      }

      if (isCustomEmailPoolGenerator(state?.emailGenerator)) {
        const availableEmailCount = getCustomEmailPoolAvailableCount(state);
        if (availableEmailCount === 0) {
          errors.push({
            code: 'custom_email_pool_empty',
            message: '自定义邮箱池没有可用邮箱，无法启动自动运行。请先导入或启用至少 1 个未使用邮箱。',
          });
        } else if (totalRuns > availableEmailCount) {
          errors.push({
            code: 'custom_email_pool_insufficient',
            message: `自定义邮箱池只有 ${availableEmailCount} 个可用邮箱，不能启动 ${totalRuns} 轮自动运行。`,
          });
        }
      }

      return {
        ok: errors.length === 0,
        errors,
        capabilityState,
      };
    }

    function validateModeSwitch(options = {}) {
      const state = options?.state || {};
      const changedKeys = normalizeChangedKeys(
        options?.changedKeys !== undefined
          ? options.changedKeys
          : Object.keys(state || {})
      );
      const changedKeySet = new Set(changedKeys);
      const capabilityState = resolveSidepanelCapabilities(options);
      const errors = [];
      const normalizedUpdates = {};
      const flowState = capabilityState.flowCapabilities || {};

      if (
        changedKeySet.has('panelMode')
        && Array.isArray(capabilityState.supportedPanelModes)
        && capabilityState.supportedPanelModes.length > 0
        && capabilityState.canUseSelectedPanelMode === false
      ) {
        normalizedUpdates.panelMode = capabilityState.effectivePanelMode;
        errors.push({
          code: 'panel_mode_unsupported',
          message: `当前 flow 不支持 ${getPanelModeLabel(capabilityState.requestedPanelMode)} 面板模式。`,
        });
      }

      if (changedKeySet.has('plusModeEnabled') && Boolean(state?.plusModeEnabled) && !flowState.supportsPlusMode) {
        normalizedUpdates.plusModeEnabled = false;
        errors.push({
          code: 'plus_mode_unsupported',
          message: '当前 flow 不支持 Plus 模式。',
        });
      }

      if (changedKeySet.has('contributionMode') && Boolean(state?.contributionMode) && !flowState.supportsContributionMode) {
        normalizedUpdates.contributionMode = false;
        errors.push({
          code: 'contribution_mode_unsupported',
          message: '当前 flow 不支持贡献模式。',
        });
      }

      if (changedKeySet.has('signupMethod') && String(state?.signupMethod || '').trim() !== SIGNUP_METHOD_EMAIL) {
        normalizedUpdates.signupMethod = SIGNUP_METHOD_EMAIL;
      }

      if (
        changedKeySet.has('plusAccountAccessStrategy')
        && capabilityState.requestedPlusAccountAccessStrategy !== capabilityState.effectivePlusAccountAccessStrategy
      ) {
        normalizedUpdates.plusAccountAccessStrategy = capabilityState.effectivePlusAccountAccessStrategy;
      }

      return {
        ok: errors.length === 0,
        changedKeys,
        capabilityState,
        errors,
        normalizedUpdates,
      };
    }

    function resolveSignupMethod(state = {}, signupMethod = undefined) {
      return resolveSidepanelCapabilities({
        signupMethod,
        state,
      }).effectiveSignupMethod;
    }

    return {
      getFlowCapabilities,
      getPanelCapabilities,
      normalizeFlowId,
      normalizePanelMode,
      normalizeSignupMethod,
      resolveSidepanelCapabilities,
      resolveSignupMethod,
      validateAutoRunStart,
      validateModeSwitch,
    };
  }

  return {
    createFlowCapabilityRegistry,
    DEFAULT_FLOW_CAPABILITIES,
    DEFAULT_FLOW_ID,
    DEFAULT_PANEL_CAPABILITIES,
    DEFAULT_PANEL_MODE,
    FLOW_CAPABILITIES,
    PANEL_CAPABILITIES,
    PLUS_ACCOUNT_ACCESS_STRATEGY_OAUTH,
    SIGNUP_METHOD_EMAIL,
    normalizeFlowId,
    normalizePanelMode,
    normalizePlusAccountAccessStrategy,
    normalizeSignupMethod,
  };
});
