(function attachSettingsTransfer(root, factory) {
  const api = factory();
  root.MultiPageBackgroundSettingsTransfer = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof self !== 'undefined' ? self : globalThis, function createSettingsTransferModule() {
  function createSettingsTransfer(context = {}) {
    const {
      chromeApi,
      settingsExportFilenamePrefix = 'multipage-settings',
      settingsExportSchemaVersion = 1,
      defaultLocalCpaJsonRelativeAuthDir = '.cli-proxy-api',
      storageKeys = {},
      persistentAliasStateKeys = [],
      defaultState = {},
      defaultRegistrationEmailState = {
        current: '',
        previous: '',
        source: '',
        updatedAt: 0,
      },
      accountRunHistoryHelpers = null,
      normalizeBooleanMap = (value = {}) => value && typeof value === 'object' && !Array.isArray(value) ? value : {},
      normalizeIcloudAliasCacheList = (value = []) => Array.isArray(value) ? value : [],
      toNormalizedEmailSet = (value = {}) => new Set(Object.keys(value || {}).map((email) => String(email || '').trim().toLowerCase()).filter(Boolean)),
      getPersistedSettings = async () => ({}),
      getPersistedAliasState = async () => ({}),
      buildPersistentSettingsPayload = (value = {}) => ({ ...value }),
      validateModeSwitchState = () => ({}),
      resolveSignupMethod = (state = {}) => String(state?.signupMethod || '').trim(),
      setPersistentSettings = async () => {},
      setState = async () => {},
      broadcastDataUpdate = () => {},
      ensureManualInteractionAllowed = async () => ({}),
      getState = async () => ({}),
    } = context;

    const membershipResultsStorageKey = storageKeys.membershipResults || 'upiCredentialMembershipCheckResults';
    const credentialBackupsStorageKey = storageKeys.credentialBackups || 'upiAccountCredentialBackups';
    const accountRunHistoryStorageKey = storageKeys.accountRunHistory || 'accountRunHistory';

    function normalizeLocalCpaJsonPluginDir(rawValue = '') {
      return String(rawValue || '').trim();
    }

    function normalizeLocalCpaJsonRelativeAuthDir(rawValue = '') {
      return String(rawValue || '').trim() || defaultLocalCpaJsonRelativeAuthDir;
    }

    function buildSettingsExportFilename(date = new Date()) {
      const pad = (value) => String(value).padStart(2, '0');
      return `${settingsExportFilenamePrefix}-${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}.json`;
    }

    function normalizeSettingsRuntimeObject(value, fallback = {}) {
      return value && typeof value === 'object' && !Array.isArray(value) ? value : fallback;
    }

    function normalizeSettingsRuntimeEmail(value = '') {
      return String(value || '').trim().toLowerCase();
    }

    function normalizeSettingsRuntimeMembershipResults(value = null) {
      const source = normalizeSettingsRuntimeObject(value, null);
      if (!source) {
        return null;
      }
      const items = (Array.isArray(source.items) ? source.items : [])
        .filter((item) => item && typeof item === 'object' && !Array.isArray(item))
        .map((item) => ({ ...item }));
      const paidCount = items.filter((item) => String(item?.status || '').trim().toLowerCase() === 'paid').length;
      const freeCount = items.filter((item) => String(item?.status || '').trim().toLowerCase() === 'free').length;
      const failedCount = items.filter((item) => String(item?.status || '').trim().toLowerCase() === 'failed').length;
      return {
        ...source,
        items,
        running: false,
        redeeming: false,
        flowStage: '',
        flowStageEmail: '',
        flowMode: '',
        total: Math.max(items.length, Math.floor(Number(source.total) || 0)),
        completed: Math.max(items.length, Math.floor(Number(source.completed) || 0)),
        paidCount,
        freeCount,
        failedCount,
        updatedAt: String(source.updatedAt || '') || new Date().toISOString(),
      };
    }

    function normalizeSettingsRuntimeCredentialBackups(value = null) {
      const source = normalizeSettingsRuntimeObject(value, null);
      if (!source) {
        return null;
      }
      return Object.fromEntries(Object.entries(source)
        .map(([rawKey, rawRecord]) => {
          const record = normalizeSettingsRuntimeObject(rawRecord, null);
          if (!record) {
            return null;
          }
          const email = normalizeSettingsRuntimeEmail(record.email || rawKey);
          if (!email) {
            return null;
          }
          return [email, {
            ...record,
            email,
          }];
        })
        .filter(Boolean));
    }

    function normalizeSettingsRuntimeAccountRunHistory(value = null) {
      if (!Array.isArray(value)) {
        return null;
      }
      if (accountRunHistoryHelpers?.normalizeAccountRunHistory) {
        return accountRunHistoryHelpers.normalizeAccountRunHistory(value);
      }
      return value
        .filter((item) => item && typeof item === 'object' && !Array.isArray(item))
        .map((item) => ({ ...item }));
    }

    function normalizeSettingsRuntimeAliasState(value = null) {
      const source = normalizeSettingsRuntimeObject(value, null);
      if (!source) {
        return null;
      }
      const manualAliasUsage = normalizeBooleanMap(source.manualAliasUsage);
      const preservedAliases = normalizeBooleanMap(source.preservedAliases);
      return {
        manualAliasUsage,
        preservedAliases,
        icloudAliasCache: normalizeIcloudAliasCacheList(source.icloudAliasCache, {
          usedEmails: toNormalizedEmailSet(manualAliasUsage),
          preservedEmails: toNormalizedEmailSet(preservedAliases),
        }),
        icloudAliasCacheAt: Math.max(0, Number(source.icloudAliasCacheAt) || 0),
      };
    }

    async function getSettingsRuntimeDataForExport() {
      const [stored, accountRunHistory, aliasState] = await Promise.all([
        chromeApi.storage.local.get([
          credentialBackupsStorageKey,
          membershipResultsStorageKey,
        ]).catch(() => ({})),
        accountRunHistoryHelpers?.getPersistedAccountRunHistory?.() || [],
        getPersistedAliasState(),
      ]);
      const normalizedAliasState = normalizeSettingsRuntimeAliasState(aliasState) || {
        manualAliasUsage: {},
        preservedAliases: {},
        icloudAliasCache: [],
        icloudAliasCacheAt: 0,
      };
      return {
        upiCredentialMembershipCheckResults: normalizeSettingsRuntimeMembershipResults(
          stored?.[membershipResultsStorageKey]
        ) || defaultState.upiCredentialMembershipCheckResults,
        upiAccountCredentialBackups: normalizeSettingsRuntimeCredentialBackups(
          stored?.[credentialBackupsStorageKey]
        ) || {},
        accountRunHistory: normalizeSettingsRuntimeAccountRunHistory(accountRunHistory) || [],
        aliasState: normalizedAliasState,
        manualAliasUsage: normalizedAliasState.manualAliasUsage,
        preservedAliases: normalizedAliasState.preservedAliases,
        icloudAliasCache: normalizedAliasState.icloudAliasCache,
        icloudAliasCacheAt: normalizedAliasState.icloudAliasCacheAt,
      };
    }

    function buildSettingsRuntimeDataImportUpdates(configBundle = {}) {
      const runtimeData = normalizeSettingsRuntimeObject(configBundle.runtimeData, {});
      const membershipResults = normalizeSettingsRuntimeMembershipResults(
        runtimeData.upiCredentialMembershipCheckResults
        || configBundle.upiCredentialMembershipCheckResults
      );
      const credentialBackups = normalizeSettingsRuntimeCredentialBackups(
        runtimeData.upiAccountCredentialBackups
        || configBundle.upiAccountCredentialBackups
      );
      const accountRunHistory = normalizeSettingsRuntimeAccountRunHistory(
        runtimeData.accountRunHistory
        || configBundle.accountRunHistory
      );
      const aliasState = normalizeSettingsRuntimeAliasState(
        runtimeData.aliasState
        || (
          Object.prototype.hasOwnProperty.call(runtimeData, 'manualAliasUsage')
          || Object.prototype.hasOwnProperty.call(runtimeData, 'preservedAliases')
          || Object.prototype.hasOwnProperty.call(runtimeData, 'icloudAliasCache')
          || Object.prototype.hasOwnProperty.call(runtimeData, 'icloudAliasCacheAt')
            ? runtimeData
            : null
        )
        || (
          Object.prototype.hasOwnProperty.call(configBundle, 'manualAliasUsage')
          || Object.prototype.hasOwnProperty.call(configBundle, 'preservedAliases')
          || Object.prototype.hasOwnProperty.call(configBundle, 'icloudAliasCache')
          || Object.prototype.hasOwnProperty.call(configBundle, 'icloudAliasCacheAt')
            ? configBundle
            : null
        )
      );
      const updates = {};
      if (membershipResults) {
        updates[membershipResultsStorageKey] = membershipResults;
      }
      if (credentialBackups) {
        updates[credentialBackupsStorageKey] = credentialBackups;
      }
      if (accountRunHistory) {
        updates[accountRunHistoryStorageKey] = accountRunHistory;
      }
      if (aliasState) {
        updates.manualAliasUsage = aliasState.manualAliasUsage;
        updates.preservedAliases = aliasState.preservedAliases;
        updates.icloudAliasCache = aliasState.icloudAliasCache;
        updates.icloudAliasCacheAt = aliasState.icloudAliasCacheAt;
      }
      return updates;
    }

    async function exportSettingsBundle() {
      const [settings, runtimeData] = await Promise.all([
        getPersistedSettings(),
        getSettingsRuntimeDataForExport(),
      ]);
      const bundle = {
        schemaVersion: settingsExportSchemaVersion,
        exportedAt: new Date().toISOString(),
        extensionVersion: chromeApi.runtime.getManifest().version,
        containsSensitiveRuntimeData: true,
        settings,
        runtimeData,
      };

      return {
        fileName: buildSettingsExportFilename(),
        fileContent: JSON.stringify(bundle, null, 2),
      };
    }

    async function importSettingsBundle(configBundle) {
      const state = await ensureManualInteractionAllowed('导入配置');
      if (Object.values(state.nodeStatuses || {}).some((status) => status === 'running')) {
        throw new Error('当前有步骤正在执行，无法导入配置。');
      }
      if (!configBundle || typeof configBundle !== 'object' || Array.isArray(configBundle)) {
        throw new Error('配置文件内容无效。');
      }

      const schemaVersion = Number(configBundle.schemaVersion);
      if (schemaVersion !== settingsExportSchemaVersion) {
        throw new Error(`仅支持导入 schemaVersion=${settingsExportSchemaVersion} 的配置文件。`);
      }
      if (!configBundle.settings || typeof configBundle.settings !== 'object' || Array.isArray(configBundle.settings)) {
        throw new Error('配置文件缺少 settings 配置段。');
      }

      const importedSettings = buildPersistentSettingsPayload(configBundle.settings, {
        fillDefaults: false,
        requireKnownKeys: true,
      });
      const importModeValidation = validateModeSwitchState({
        ...state,
        ...importedSettings,
        resolvedSignupMethod: null,
      }, {
        changedKeys: Object.keys(importedSettings),
      });
      if (importModeValidation?.normalizedUpdates && Object.keys(importModeValidation.normalizedUpdates).length > 0) {
        Object.assign(importedSettings, importModeValidation.normalizedUpdates);
      }
      if (
        Object.prototype.hasOwnProperty.call(importedSettings, 'plusModeEnabled')
        || Object.prototype.hasOwnProperty.call(importedSettings, 'signupMethod')
        || Object.prototype.hasOwnProperty.call(importedSettings, 'panelMode')
        || Object.prototype.hasOwnProperty.call(importedSettings, 'activeFlowId')
        || Object.prototype.hasOwnProperty.call(importedSettings, 'contributionMode')
      ) {
        importedSettings.signupMethod = resolveSignupMethod({
          ...state,
          ...importedSettings,
          resolvedSignupMethod: null,
        });
      }

      await setPersistentSettings(importedSettings);
      const runtimeDataUpdates = buildSettingsRuntimeDataImportUpdates(configBundle);
      if (Object.keys(runtimeDataUpdates).length > 0) {
        await chromeApi.storage.local.set(runtimeDataUpdates);
      }

      const runtimeSessionUpdates = {};
      if (Object.prototype.hasOwnProperty.call(runtimeDataUpdates, membershipResultsStorageKey)) {
        runtimeSessionUpdates.upiCredentialMembershipCheckResults = runtimeDataUpdates[membershipResultsStorageKey];
      }
      if (Object.prototype.hasOwnProperty.call(runtimeDataUpdates, accountRunHistoryStorageKey)) {
        runtimeSessionUpdates.accountRunHistory = runtimeDataUpdates[accountRunHistoryStorageKey];
      }
      for (const key of persistentAliasStateKeys) {
        if (Object.prototype.hasOwnProperty.call(runtimeDataUpdates, key)) {
          runtimeSessionUpdates[key] = runtimeDataUpdates[key];
        }
      }

      const sessionUpdates = {
        ...importedSettings,
        ...runtimeSessionUpdates,
        currentHotmailAccountId: null,
        email: null,
        registrationEmailState: { ...defaultRegistrationEmailState },
      };

      await setState(sessionUpdates);
      broadcastDataUpdate({
        ...importedSettings,
        ...runtimeDataUpdates,
        currentHotmailAccountId: null,
        ...(sessionUpdates.email !== undefined ? { email: sessionUpdates.email } : {}),
        registrationEmailState: sessionUpdates.registrationEmailState,
      });

      return getState();
    }

    return {
      normalizeLocalCpaJsonPluginDir,
      normalizeLocalCpaJsonRelativeAuthDir,
      buildSettingsExportFilename,
      normalizeSettingsRuntimeObject,
      normalizeSettingsRuntimeEmail,
      normalizeSettingsRuntimeMembershipResults,
      normalizeSettingsRuntimeCredentialBackups,
      normalizeSettingsRuntimeAccountRunHistory,
      normalizeSettingsRuntimeAliasState,
      getSettingsRuntimeDataForExport,
      buildSettingsRuntimeDataImportUpdates,
      exportSettingsBundle,
      importSettingsBundle,
    };
  }

  return { createSettingsTransfer };
});
