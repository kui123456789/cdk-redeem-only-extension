(function attachEmailPoolRoutes(root, factory) {
  const api = factory();
  root.MultiPageEmailPoolRoutes = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof self !== 'undefined' ? self : globalThis, function createEmailPoolRoutesModule() {
  function requireHandler(handler, name) {
    if (typeof handler !== 'function') {
      throw new Error(`Missing email pool route handler: ${name}`);
    }
    return handler;
  }

  function createEmailPoolRoutes(deps = {}) {
    const {
      checkIcloudSession,
      clearStopRequest,
      deleteIcloudAlias,
      deleteUsedIcloudAliases,
      fetchGeneratedEmail,
      getState,
      isAutoRunLockedState,
      listIcloudAliases,
      resumeAutoRun,
      setEmailState,
      setEmailStateSilently,
      setIcloudAliasPreservedState,
      setIcloudAliasUsedState,
    } = deps;

    async function ensureManualEmailChangeAllowed(errorMessage) {
      const state = await requireHandler(getState, 'getState')();
      if (requireHandler(isAutoRunLockedState, 'isAutoRunLockedState')(state)) {
        throw new Error(errorMessage);
      }
      return state;
    }

    async function fetchGeneratedEmailRoute(payload = {}) {
      requireHandler(clearStopRequest, 'clearStopRequest')();
      const state = await ensureManualEmailChangeAllowed('自动流程运行中，当前不能手动获取邮箱。');
      const email = await requireHandler(fetchGeneratedEmail, 'fetchGeneratedEmail')(state, payload || {});
      await requireHandler(resumeAutoRun, 'resumeAutoRun')();
      return { ok: true, email };
    }

    async function fetchDuckEmailRoute(payload = {}) {
      requireHandler(clearStopRequest, 'clearStopRequest')();
      const state = await ensureManualEmailChangeAllowed('自动流程运行中，当前不能手动获取邮箱。');
      const email = await requireHandler(fetchGeneratedEmail, 'fetchGeneratedEmail')(state, { ...(payload || {}), generator: 'duck' });
      await requireHandler(resumeAutoRun, 'resumeAutoRun')();
      return { ok: true, email };
    }

    async function setEmailStateRoute(payload = {}) {
      await ensureManualEmailChangeAllowed('自动流程运行中，当前不能手动修改邮箱。');
      const email = String(payload?.email || '').trim() || null;
      await requireHandler(setEmailStateSilently, 'setEmailStateSilently')(email, { source: 'manual' });
      return { ok: true, email };
    }

    async function saveEmailRoute(payload = {}) {
      await ensureManualEmailChangeAllowed('自动流程运行中，当前不能手动修改邮箱。');
      await requireHandler(setEmailState, 'setEmailState')(payload.email, { source: 'manual' });
      await requireHandler(resumeAutoRun, 'resumeAutoRun')();
      return { ok: true, email: payload.email };
    }

    async function checkIcloudSessionRoute() {
      requireHandler(clearStopRequest, 'clearStopRequest')();
      return await requireHandler(checkIcloudSession, 'checkIcloudSession')();
    }

    async function listIcloudAliasesRoute() {
      requireHandler(clearStopRequest, 'clearStopRequest')();
      const aliases = await requireHandler(listIcloudAliases, 'listIcloudAliases')();
      return { ok: true, aliases };
    }

    async function setIcloudAliasUsedStateRoute(payload = {}) {
      requireHandler(clearStopRequest, 'clearStopRequest')();
      const result = await requireHandler(setIcloudAliasUsedState, 'setIcloudAliasUsedState')(payload || {});
      return { ok: true, ...result };
    }

    async function setIcloudAliasPreservedStateRoute(payload = {}) {
      requireHandler(clearStopRequest, 'clearStopRequest')();
      const result = await requireHandler(setIcloudAliasPreservedState, 'setIcloudAliasPreservedState')(payload || {});
      return { ok: true, ...result };
    }

    async function deleteIcloudAliasRoute(payload = {}) {
      requireHandler(clearStopRequest, 'clearStopRequest')();
      const result = await requireHandler(deleteIcloudAlias, 'deleteIcloudAlias')(payload || {});
      return { ok: true, ...result };
    }

    async function deleteUsedIcloudAliasesRoute() {
      requireHandler(clearStopRequest, 'clearStopRequest')();
      const result = await requireHandler(deleteUsedIcloudAliases, 'deleteUsedIcloudAliases')();
      return { ok: true, ...result };
    }

    return {
      FETCH_GENERATED_EMAIL: fetchGeneratedEmailRoute,
      FETCH_DUCK_EMAIL: fetchDuckEmailRoute,
      SET_EMAIL_STATE: setEmailStateRoute,
      SAVE_EMAIL: saveEmailRoute,
      CHECK_ICLOUD_SESSION: checkIcloudSessionRoute,
      LIST_ICLOUD_ALIASES: listIcloudAliasesRoute,
      SET_ICLOUD_ALIAS_USED_STATE: setIcloudAliasUsedStateRoute,
      SET_ICLOUD_ALIAS_PRESERVED_STATE: setIcloudAliasPreservedStateRoute,
      DELETE_ICLOUD_ALIAS: deleteIcloudAliasRoute,
      DELETE_USED_ICLOUD_ALIASES: deleteUsedIcloudAliasesRoute,
    };
  }

  return {
    createEmailPoolRoutes,
  };
});
