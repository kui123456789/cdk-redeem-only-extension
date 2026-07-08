(function attachSidepanelCustomEmailPoolManager(globalScope) {
  function createCustomEmailPoolManager(context = {}) {
    const {
      dom,
      helpers,
      state,
      actions,
      constants = {},
    } = context;

    const copyIcon = constants.copyIcon || '';

    let renderedEntries = [];
    let selectedEntryIds = new Set();
    let searchTerm = '';
    let filterMode = 'all';
    let refreshQueued = false;
    let loading = false;

    function normalizeEmail(value = '') {
      return String(value || '').trim().toLowerCase();
    }

    function normalizeVerificationUrl(value = '') {
      const utilsNormalizer = globalScope.MailProviderUtils?.normalizeCustomEmailVerificationUrl;
      if (typeof utilsNormalizer === 'function') {
        return utilsNormalizer(value);
      }
      const raw = String(value || '').trim();
      if (!/^https?:\/\//i.test(raw)) {
        return '';
      }
      try {
        const parsed = new URL(raw);
        return /^https?:$/i.test(parsed.protocol) ? parsed.toString() : '';
      } catch {
        return '';
      }
    }

    function parseEntryValue(value = '') {
      const utilsParser = globalScope.MailProviderUtils?.parseCustomEmailPoolEntryValue;
      if (typeof utilsParser === 'function') {
        return utilsParser(value);
      }
      const raw = String(value || '').trim();
      const parts = raw.split(/-{3,}/).map((part) => part.trim());
      const hasSeparator = parts.length > 1;
      const emailSource = hasSeparator ? parts[0] : raw;
      const verificationUrl = (hasSeparator ? parts.slice(1) : [raw])
        .map((part) => normalizeVerificationUrl(part))
        .find(Boolean) || '';
      let urlEmail = '';
      if (verificationUrl) {
        try {
          const parsed = new URL(verificationUrl);
          urlEmail = String(parsed.searchParams.get('mail') || parsed.searchParams.get('email') || '').trim().toLowerCase();
        } catch { }
      }
      const normalizedEmail = normalizeEmail(emailSource);
      return {
        email: isValidEmail(normalizedEmail) ? normalizedEmail : urlEmail,
        credential: hasSeparator && !verificationUrl ? raw : '',
        verificationUrl,
      };
    }

    function isValidEmail(value = '') {
      return /^[^\s@:/?#]+@[^\s@:/?#]+\.[^\s@:/?#]+$/.test(normalizeEmail(value));
    }

    function createEntryId() {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
      }
      return `custom-pool-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    }

    function normalizeTrialEligibilityStatus(value = '') {
      const normalized = String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
      if (['ineligible', 'not_eligible', 'no_trial', 'trial_ineligible', 'rejected'].includes(normalized)) {
        return 'ineligible';
      }
      if (['eligible', 'trial_eligible', 'ok', 'passed'].includes(normalized)) {
        return 'eligible';
      }
      if (['failed', 'error', 'unknown'].includes(normalized)) {
        return 'failed';
      }
      return '';
    }

    function maskAccessToken(token = '') {
      const raw = String(token || '').trim();
      if (!raw) {
        return '';
      }
      if (raw.length <= 16) {
        return `${raw.slice(0, 4)}****${raw.slice(-4)}`;
      }
      return `${raw.slice(0, 8)}****${raw.slice(-6)}`;
    }

    function getEntryAccessToken(entry = {}) {
      const storedCredential = state.getCredentialForEmail?.(entry.email) || {};
      return String(
        entry.accessToken
        || entry.token
        || entry.access_token
        || entry.upiRedeemAccessToken
        || storedCredential.accessToken
        || storedCredential.token
        || storedCredential.access_token
        || storedCredential.upiRedeemAccessToken
        || ''
      ).trim();
    }

    function getStoredCredentialForEntry(entry = {}) {
      const storedCredential = state.getCredentialForEmail?.(entry.email) || {};
      return storedCredential && typeof storedCredential === 'object' && !Array.isArray(storedCredential)
        ? storedCredential
        : {};
    }

    function getTrialEligibilityBadgeHtml(entry = {}) {
      const status = normalizeTrialEligibilityStatus(entry.trialEligibilityStatus);
      if (status === 'eligible') {
        return '<span class="luckmail-status-badge status-active">有试用资格</span>';
      }
      if (status === 'ineligible') {
        return '<span class="luckmail-status-badge status-warning">无试用资格</span>';
      }
      if (status === 'failed') {
        return '<span class="luckmail-status-badge status-warning">资格待重试</span>';
      }
      return '';
    }

    function isTrialIneligibleEntry(entry = {}) {
      return normalizeTrialEligibilityStatus(entry.trialEligibilityStatus) === 'ineligible';
    }

    function isAvailableEntry(entry = {}) {
      return Boolean(entry.enabled) && !entry.used && !isTrialIneligibleEntry(entry);
    }

    function normalizeEntry(rawEntry = {}) {
      const parsedEntry = parseEntryValue(rawEntry?.credential || rawEntry?.email || '');
      const email = normalizeEmail(parsedEntry.email || rawEntry?.email || '');
      if (!isValidEmail(email)) {
        return null;
      }
      const verificationUrl = normalizeVerificationUrl(
        rawEntry?.verificationUrl || rawEntry?.url || parsedEntry.verificationUrl || ''
      );
      const accessToken = String(rawEntry?.accessToken || rawEntry?.access_token || rawEntry?.upiRedeemAccessToken || '').trim();
      const accessTokenMasked = String(rawEntry?.accessTokenMasked || '').trim()
        || maskAccessToken(accessToken);

      return {
        id: String(rawEntry?.id || createEntryId()),
        email,
        credential: parsedEntry.verificationUrl ? '' : (parsedEntry.credential || String(rawEntry?.credential || '').trim()),
        verificationUrl,
        enabled: rawEntry?.enabled !== undefined ? Boolean(rawEntry.enabled) : true,
        used: Boolean(rawEntry?.used),
        note: String(rawEntry?.note || '').trim(),
        lastUsedAt: Number.isFinite(Number(rawEntry?.lastUsedAt)) ? Number(rawEntry.lastUsedAt) : 0,
        accessToken,
        accessTokenMasked,
        accessTokenUpdatedAt: String(rawEntry?.accessTokenUpdatedAt || rawEntry?.tokenUpdatedAt || rawEntry?.checkedAt || '').trim(),
        trialEligibilityStatus: normalizeTrialEligibilityStatus(rawEntry?.trialEligibilityStatus),
        trialEligibilityReason: String(rawEntry?.trialEligibilityReason || '').trim(),
        trialEligibilityReasonCode: String(rawEntry?.trialEligibilityReasonCode || '').trim(),
        trialEligibilityCheckedAt: String(rawEntry?.trialEligibilityCheckedAt || '').trim(),
        trialEligibilityRetryable: rawEntry?.trialEligibilityRetryable === true,
        trialEligibilityTransientFailure: rawEntry?.trialEligibilityTransientFailure === true,
        trialEligibilityLastError: String(rawEntry?.trialEligibilityLastError || '').trim(),
      };
    }

    function normalizeEntries(entries = []) {
      if (!Array.isArray(entries)) {
        return [];
      }

      const seenEmails = new Set();
      const normalized = [];
      for (const entry of entries) {
        const item = normalizeEntry(entry);
        if (!item) continue;
        if (seenEmails.has(item.email)) continue;
        seenEmails.add(item.email);
        normalized.push(item);
      }
      return normalized;
    }

    function enrichEntryFromStoredCredential(entry = {}) {
      const storedCredential = state.getCredentialForEmail?.(entry.email) || {};
      const storedStatus = normalizeTrialEligibilityStatus(storedCredential.trialEligibilityStatus);
      if (storedStatus !== 'eligible') {
        return entry;
      }
      const accessToken = String(
        entry.accessToken
        || storedCredential.accessToken
        || storedCredential.token
        || storedCredential.access_token
        || storedCredential.upiRedeemAccessToken
        || ''
      ).trim();
      return {
        ...entry,
        used: true,
        lastUsedAt: entry.lastUsedAt || Number(storedCredential.lastUsedAt || storedCredential.updatedAt || 0) || Date.now(),
        accessToken,
        accessTokenMasked: entry.accessTokenMasked || storedCredential.accessTokenMasked || maskAccessToken(accessToken),
        accessTokenUpdatedAt: entry.accessTokenUpdatedAt || storedCredential.accessTokenUpdatedAt || storedCredential.trialEligibilityCheckedAt || '',
        trialEligibilityStatus: 'eligible',
        trialEligibilityReason: entry.trialEligibilityReason || storedCredential.trialEligibilityReason || '账号有试用资格。',
        trialEligibilityReasonCode: entry.trialEligibilityReasonCode || storedCredential.trialEligibilityReasonCode || '',
        trialEligibilityCheckedAt: entry.trialEligibilityCheckedAt || storedCredential.trialEligibilityCheckedAt || '',
        trialEligibilityRetryable: false,
        trialEligibilityTransientFailure: false,
        trialEligibilityLastError: '',
      };
    }

    function withCurrentFlag(entries = renderedEntries) {
      const currentEmail = normalizeEmail(state.getCurrentEmail?.());
      const enrichedEntries = normalizeEntries(entries).map((entry) => enrichEntryFromStoredCredential(entry));
      const autoRunning = Boolean(state.isAutoRunning?.());
      const currentEntry = currentEmail
        ? enrichedEntries.find((entry) => entry.email === currentEmail)
        : null;
      const currentMatches = Boolean(currentEntry) && (!autoRunning || isAvailableEntry(currentEntry));
      const fallbackCurrentEmail = !currentMatches && autoRunning
        ? normalizeEmail(enrichedEntries.find(isAvailableEntry)?.email)
        : '';
      const effectiveCurrentEmail = currentMatches ? currentEmail : fallbackCurrentEmail;
      return enrichedEntries.map((enrichedEntry) => {
        return {
          ...enrichedEntry,
          current: Boolean(effectiveCurrentEmail) && enrichedEntry.email === effectiveCurrentEmail,
        };
      });
    }

    function normalizeSearchText(value = '') {
      return String(value || '').trim().toLowerCase();
    }

    function getFilteredEntries(entries = renderedEntries) {
      const normalizedSearchTerm = normalizeSearchText(searchTerm);
      return withCurrentFlag(entries).filter((entry) => {
        const matchesFilter = (() => {
          switch (filterMode) {
            case 'enabled': return Boolean(entry.enabled);
            case 'disabled': return !entry.enabled;
            case 'used': return Boolean(entry.used);
            case 'unused': return isAvailableEntry(entry);
            case 'ineligible': return isTrialIneligibleEntry(entry);
            case 'current': return Boolean(entry.current);
            default: return true;
          }
        })();

        if (!matchesFilter) return false;
        if (!normalizedSearchTerm) return true;

        const haystack = [
          entry.email,
          entry.verificationUrl,
          entry.note,
          entry.enabled ? 'enabled 启用' : 'disabled 停用',
          entry.used ? 'used 已用' : 'unused 未用',
          normalizeTrialEligibilityStatus(entry.trialEligibilityStatus),
          isTrialIneligibleEntry(entry) ? 'ineligible no trial no_trial 无试用资格 无资格' : '',
          entry.accessTokenMasked,
          entry.trialEligibilityReason,
          entry.trialEligibilityCheckedAt,
          entry.current ? 'current 当前' : '',
        ].join(' ').toLowerCase();

        return haystack.includes(normalizedSearchTerm);
      });
    }

    function pruneSelection(entries = renderedEntries) {
      const existingIds = new Set(withCurrentFlag(entries).map((entry) => String(entry.id)));
      selectedEntryIds = new Set([...selectedEntryIds].filter((id) => existingIds.has(id)));
    }

    function updateBulkUi(visibleEntries = getFilteredEntries()) {
      if (!dom.checkboxCustomEmailPoolSelectAll || !dom.customEmailPoolSelectionSummary) {
        return;
      }

      const visibleIds = visibleEntries.map((entry) => String(entry.id));
      const selectedVisibleCount = visibleIds.filter((id) => selectedEntryIds.has(id)).length;
      const hasVisible = visibleIds.length > 0;
      const hasSelection = selectedEntryIds.size > 0;

      dom.checkboxCustomEmailPoolSelectAll.checked = hasVisible && selectedVisibleCount === visibleIds.length;
      dom.checkboxCustomEmailPoolSelectAll.indeterminate = selectedVisibleCount > 0 && selectedVisibleCount < visibleIds.length;
      dom.checkboxCustomEmailPoolSelectAll.disabled = loading || !hasVisible;
      dom.customEmailPoolSelectionSummary.textContent = `已选 ${selectedEntryIds.size} 个（当前显示 ${visibleIds.length} 个）`;

      if (dom.btnCustomEmailPoolBulkUsed) dom.btnCustomEmailPoolBulkUsed.disabled = loading || !hasSelection;
      if (dom.btnCustomEmailPoolBulkUnused) dom.btnCustomEmailPoolBulkUnused.disabled = loading || !hasSelection;
      if (dom.btnCustomEmailPoolBulkEnable) dom.btnCustomEmailPoolBulkEnable.disabled = loading || !hasSelection;
      if (dom.btnCustomEmailPoolBulkDisable) dom.btnCustomEmailPoolBulkDisable.disabled = loading || !hasSelection;
      if (dom.btnCustomEmailPoolBulkDelete) dom.btnCustomEmailPoolBulkDelete.disabled = loading || !hasSelection;
    }

    function setLoadingState(nextLoading, summary = '') {
      loading = Boolean(nextLoading);
      if (dom.btnCustomEmailPoolImport) dom.btnCustomEmailPoolImport.disabled = loading;
      if (dom.btnCustomEmailPoolRefresh) dom.btnCustomEmailPoolRefresh.disabled = loading;
      if (dom.btnCustomEmailPoolClearUsed) dom.btnCustomEmailPoolClearUsed.disabled = loading;
      if (dom.btnCustomEmailPoolDeleteAll) dom.btnCustomEmailPoolDeleteAll.disabled = loading;
      if (dom.inputCustomEmailPoolImport) dom.inputCustomEmailPoolImport.disabled = loading;

      if (summary && dom.customEmailPoolSummary) {
        dom.customEmailPoolSummary.textContent = summary;
      }

      updateBulkUi(getFilteredEntries());
    }

    function renderEmptyCustomEmailPoolList() {
      if (dom.customEmailPoolList) {
        dom.customEmailPoolList.innerHTML = '<div class="luckmail-empty">还没有自定义邮箱，先导入一批邮箱再开始。</div>';
      }
    }

    function renderCustomEmailPoolEntries(entries = state.getEntries?.()) {
      if (!dom.customEmailPoolList || !dom.customEmailPoolSummary) {
        return;
      }

      renderedEntries = normalizeEntries(entries);
      pruneSelection(renderedEntries);
      dom.customEmailPoolList.innerHTML = '';

      if (!renderedEntries.length) {
        selectedEntryIds.clear();
        renderEmptyCustomEmailPoolList();
        dom.customEmailPoolSummary.textContent = '导入你提前准备好的注册邮箱，每行一个邮箱地址，或 邮箱----取码URL/查询码。';
        if (dom.btnCustomEmailPoolClearUsed) dom.btnCustomEmailPoolClearUsed.disabled = true;
        if (dom.btnCustomEmailPoolDeleteAll) dom.btnCustomEmailPoolDeleteAll.disabled = true;
        updateBulkUi([]);
        return;
      }

      const entriesWithCurrent = withCurrentFlag(renderedEntries);
      const usedCount = entriesWithCurrent.filter((entry) => entry.used).length;
      const ineligibleCount = entriesWithCurrent.filter(isTrialIneligibleEntry).length;
      const enabledCount = entriesWithCurrent.filter((entry) => entry.enabled).length;
      const availableCount = entriesWithCurrent.filter(isAvailableEntry).length;
      dom.customEmailPoolSummary.textContent = `已加载 ${entriesWithCurrent.length} 个邮箱，其中 ${availableCount} 个可用，${enabledCount} 个启用，${usedCount} 个已用，${ineligibleCount} 个无试用资格。`;
      if (dom.btnCustomEmailPoolClearUsed) dom.btnCustomEmailPoolClearUsed.disabled = loading || usedCount === 0;
      if (dom.btnCustomEmailPoolDeleteAll) dom.btnCustomEmailPoolDeleteAll.disabled = loading || entriesWithCurrent.length === 0;

      const visibleEntries = getFilteredEntries(entriesWithCurrent);
      if (!visibleEntries.length) {
        dom.customEmailPoolList.innerHTML = '<div class="luckmail-empty">没有匹配当前筛选条件的邮箱。</div>';
        updateBulkUi([]);
        return;
      }

      for (const entry of visibleEntries) {
        const entryId = String(entry.id);
        const accessToken = getEntryAccessToken(entry);
        const accessTokenBadge = entry.accessTokenMasked || maskAccessToken(accessToken);
        const trialStatus = normalizeTrialEligibilityStatus(entry.trialEligibilityStatus);
        const trialDetail = String(entry.trialEligibilityReason || entry.trialEligibilityLastError || '').trim();
        const item = document.createElement('div');
        item.className = `luckmail-item${entry.current ? ' is-current' : ''}`;
        item.innerHTML = `
          <input class="luckmail-item-check" type="checkbox" data-action="select" ${selectedEntryIds.has(entryId) ? 'checked' : ''} />
          <div class="luckmail-item-main">
            <div class="luckmail-item-email-row">
              <div class="luckmail-item-email">${helpers.escapeHtml(entry.email || '(未知邮箱)')}</div>
              ${getTrialEligibilityBadgeHtml(entry)}
              ${accessToken ? `
                <span class="luckmail-status-badge status-active">AT ${helpers.escapeHtml(accessTokenBadge || '已保存')}</span>
                <button
                  class="hotmail-copy-btn"
                  type="button"
                  data-action="copy-at"
                  title="复制 AT"
                  aria-label="复制 ${helpers.escapeHtml(entry.email || '')} 的 AT"
                >${copyIcon}</button>
              ` : ''}
              ${entry.used ? '<span class="luckmail-status-badge status-used">已用</span>' : ''}
              <button
                class="hotmail-copy-btn"
                type="button"
                data-action="copy-email"
                title="复制邮箱"
                aria-label="复制邮箱 ${helpers.escapeHtml(entry.email || '')}"
              >${copyIcon}</button>
            </div>
            <div class="luckmail-item-meta">
              ${entry.current ? '<span class="luckmail-tag current">当前</span>' : ''}
              ${entry.used ? '<span class="luckmail-tag used">已用</span>' : '<span class="luckmail-tag active">未用</span>'}
              ${entry.enabled ? '<span class="luckmail-tag active">启用</span>' : '<span class="luckmail-tag disabled">停用</span>'}
              ${entry.verificationUrl ? '<span class="luckmail-tag active">取码URL</span>' : ''}
              ${entry.trialEligibilityCheckedAt ? `<span class="luckmail-tag">资格 ${helpers.escapeHtml(entry.trialEligibilityCheckedAt)}</span>` : ''}
              ${entry.note ? `<span class="luckmail-tag">${helpers.escapeHtml(entry.note)}</span>` : ''}
            </div>
            ${trialStatus === 'ineligible' ? `<div class="luckmail-item-details status-warning-text">${helpers.escapeHtml(trialDetail || '账号无试用资格，不会再被主流程选中。')}</div>` : ''}
            ${trialStatus === 'failed' ? `<div class="luckmail-item-details status-warning-text">${helpers.escapeHtml(trialDetail || '资格检查失败，可稍后重试。')}</div>` : ''}
            ${entry.verificationUrl ? `<div class="luckmail-item-details mono">${helpers.escapeHtml(entry.verificationUrl)}</div>` : ''}
          </div>
          <div class="luckmail-item-actions">
            <button class="btn btn-outline btn-xs" type="button" data-action="check-trial" title="${accessToken ? '使用已保存 AT 检查试用资格' : '缺少 AT，点击查看原因'}">检查资格</button>
            <button class="btn btn-outline btn-xs" type="button" data-action="use" ${isTrialIneligibleEntry(entry) ? 'disabled title="该邮箱无试用资格，不会被主流程选中"' : ''}>使用此邮箱</button>
            <button class="btn btn-outline btn-xs" type="button" data-action="toggle-used">${helpers.escapeHtml(entry.used ? '标记未用' : '标记已用')}</button>
            <button class="btn btn-outline btn-xs" type="button" data-action="toggle-enabled">${helpers.escapeHtml(entry.enabled ? '停用' : '启用')}</button>
            ${isTrialIneligibleEntry(entry) ? '<button class="btn btn-outline btn-xs" type="button" data-action="clear-trial-status">清除无资格</button>' : ''}
            <button class="btn btn-outline btn-xs" type="button" data-action="delete">删除</button>
          </div>
        `;

        item.querySelector('[data-action="select"]').addEventListener('change', (event) => {
          if (event.target.checked) {
            selectedEntryIds.add(entryId);
          } else {
            selectedEntryIds.delete(entryId);
          }
          updateBulkUi(visibleEntries);
        });

        item.querySelector('[data-action="copy-email"]').addEventListener('click', async () => {
          await helpers.copyTextToClipboard(entry.email || '');
          helpers.showToast('邮箱已复制', 'success', 1600);
        });

        item.querySelector('[data-action="copy-at"]')?.addEventListener('click', async () => {
          const token = getEntryAccessToken(entry);
          if (!token) {
            helpers.showToast('该邮箱没有可复制的 AT', 'warn', 1600);
            return;
          }
          await helpers.copyTextToClipboard(token);
          helpers.showToast('AT 已复制', 'success', 1600);
        });

        item.querySelector('[data-action="check-trial"]')?.addEventListener('click', async () => {
          const storedCredential = getStoredCredentialForEntry(entry);
          const token = getEntryAccessToken(entry);
          if (!token) {
            helpers.showToast(`邮箱 ${entry.email} 缺少 AT，注册完成后保存 AT 才能检查试用资格。`, 'warn', 2600);
            return;
          }
          try {
            setLoadingState(true, `正在检查 ${entry.email} 的试用资格...`);
            const response = await actions.checkTrialEligibility?.({
              ...storedCredential,
              ...entry,
              accessToken: token,
            });
            const statusText = response?.eligible?.length
              ? '有试用资格，已进入 Free'
              : response?.ineligible?.length
                ? '无试用资格，已标记在邮箱池'
                : response?.retryable?.length
                  ? '网络/后端波动，可稍后重试'
                  : response?.skipped?.length
                    ? '已跳过'
                    : '检查失败';
            helpers.showToast(`邮箱 ${entry.email} 资格检查完成：${statusText}`, response?.eligible?.length ? 'success' : 'warn', 2800);
            queueCustomEmailPoolRefresh();
          } catch (error) {
            helpers.showToast(`检查 ${entry.email} 试用资格失败：${error.message}`, 'error');
          } finally {
            setLoadingState(false);
          }
        });

        item.querySelector('[data-action="use"]').addEventListener('click', async () => {
          try {
            setLoadingState(true, '正在切换当前邮箱...');
            await actions.setRuntimeEmail?.(entry.email);
            helpers.showToast(`已切换到 ${entry.email}`, 'success', 1800);
            queueCustomEmailPoolRefresh();
          } catch (error) {
            helpers.showToast(`切换邮箱失败：${error.message}`, 'error');
          } finally {
            setLoadingState(false);
          }
        });

        item.querySelector('[data-action="toggle-used"]').addEventListener('click', async () => {
          await patchEntries((entriesList) => entriesList.map((candidate) => (
            String(candidate.id) === entryId
              ? {
                  ...candidate,
                  used: !entry.used,
                  lastUsedAt: !entry.used ? Date.now() : candidate.lastUsedAt,
                }
              : candidate
          )));
        });

        item.querySelector('[data-action="toggle-enabled"]').addEventListener('click', async () => {
          await patchEntries((entriesList) => entriesList.map((candidate) => (
            String(candidate.id) === entryId
              ? { ...candidate, enabled: !entry.enabled }
              : candidate
          )));
        });

        item.querySelector('[data-action="clear-trial-status"]')?.addEventListener('click', async () => {
          await patchEntries((entriesList) => entriesList.map((candidate) => (
            String(candidate.id) === entryId
              ? {
                  ...candidate,
                  trialEligibilityStatus: '',
                  trialEligibilityReason: '',
                  trialEligibilityCheckedAt: '',
                  note: candidate.note === '无试用资格' ? '' : candidate.note,
                }
              : candidate
          )));
        });

        item.querySelector('[data-action="delete"]').addEventListener('click', async () => {
          await deleteEntries({
            ids: [entry.id],
          }, `确认删除 ${entry.email} 吗？此操作不可撤销。`);
        });

        dom.customEmailPoolList.appendChild(item);
      }

      updateBulkUi(visibleEntries);
    }

    async function patchEntries(mutator) {
      const previousEntries = normalizeEntries(state.getEntries?.() || []);
      const nextEntries = normalizeEntries(mutator(previousEntries.map((entry) => ({ ...entry }))));

      setLoadingState(true, '正在更新自定义邮箱池...');
      state.setEntries?.(nextEntries, { persistBackup: false });
      renderCustomEmailPoolEntries(nextEntries);

      try {
        await actions.persistEntries?.();
        state.setEntries?.(nextEntries, { clearBackup: nextEntries.length === 0 });
      } catch (error) {
        state.setEntries?.(previousEntries);
        renderCustomEmailPoolEntries(previousEntries);
        helpers.showToast(`更新自定义邮箱池失败：${error.message}`, 'error');
      } finally {
        setLoadingState(false);
      }
    }

    async function deleteEntries(payload = {}, confirmMessage = '') {
      const confirmed = await helpers.openConfirmModal({
        title: '删除邮箱',
        message: confirmMessage || '确认删除选中的邮箱吗？此操作不可撤销。',
        confirmLabel: '确认删除',
        confirmVariant: 'btn-danger',
      });
      if (!confirmed) {
        return;
      }

      const ids = Array.isArray(payload.ids)
        ? payload.ids.map((id) => String(id || '').trim()).filter(Boolean)
        : [];
      const mode = String(payload.mode || '').trim().toLowerCase();

      await patchEntries((entriesList) => {
        if (mode === 'all') {
          selectedEntryIds.clear();
          return [];
        }
        if (mode === 'used') {
          const usedIds = new Set(entriesList.filter((entry) => entry.used).map((entry) => String(entry.id)));
          usedIds.forEach((id) => selectedEntryIds.delete(id));
          return entriesList.filter((entry) => !entry.used);
        }

        const targetIds = new Set(ids);
        ids.forEach((id) => selectedEntryIds.delete(id));
        return entriesList.filter((entry) => !targetIds.has(String(entry.id)));
      });
    }

    async function importEntriesFromTextarea() {
      const text = String(dom.inputCustomEmailPoolImport?.value || '');
      if (!text.trim()) {
        helpers.showToast('请先粘贴邮箱列表，每行一个邮箱，或 邮箱----取码URL/查询码。', 'warn');
        return;
      }

      const previousEntries = normalizeEntries(state.getEntries?.() || []);
      const knownEmails = new Set(previousEntries.map((entry) => entry.email));
      const importedEntries = [];
      let skippedCount = 0;

      for (const line of String(text || '').split(/\r?\n/)) {
        const parsedEntry = parseEntryValue(line);
        if (!parsedEntry.email && !parsedEntry.verificationUrl) {
          continue;
        }
        const email = normalizeEmail(parsedEntry.email);
        if (!isValidEmail(email) || knownEmails.has(email)) {
          skippedCount += 1;
          continue;
        }

        knownEmails.add(email);
        importedEntries.push({
          id: createEntryId(),
          email,
          credential: parsedEntry.credential || '',
          verificationUrl: parsedEntry.verificationUrl || '',
          enabled: true,
          used: false,
          note: '',
          lastUsedAt: 0,
        });
      }

      if (!importedEntries.length && skippedCount > 0) {
        helpers.showToast('没有可导入的新邮箱（可能都重复或无效）。', 'warn');
        return;
      }

      const nextEntries = normalizeEntries([...previousEntries, ...importedEntries]);
      setLoadingState(true, '正在导入邮箱...');
      state.setEntries?.(nextEntries, { persistBackup: false });
      renderCustomEmailPoolEntries(nextEntries);

      try {
        await actions.persistEntries?.();
        state.setEntries?.(nextEntries);
        if (dom.inputCustomEmailPoolImport) {
          dom.inputCustomEmailPoolImport.value = '';
        }
        helpers.showToast(
          skippedCount > 0
            ? `已导入 ${importedEntries.length} 个邮箱，跳过 ${skippedCount} 条无效或重复数据。`
            : `已导入 ${importedEntries.length} 个邮箱。`,
          importedEntries.length > 0 ? 'success' : 'warn',
          2400
        );
      } catch (error) {
        state.setEntries?.(previousEntries);
        renderCustomEmailPoolEntries(previousEntries);
        helpers.showToast(`导入邮箱失败：${error.message}`, 'error');
      } finally {
        setLoadingState(false);
      }
    }

    async function refreshCustomEmailPoolEntries(options = {}) {
      const { silent = false } = options;
      if (state.isVisible && !state.isVisible()) {
        return;
      }

      if (!silent) {
        setLoadingState(true, '正在刷新自定义邮箱池...');
      }
      const currentEntries = normalizeEntries(state.getEntries?.() || []);
      let nextEntries = currentEntries;
      try {
        const reloadedEntries = normalizeEntries(await actions.reloadEntries?.() || []);
        if (reloadedEntries.length > 0 || currentEntries.length === 0) {
          nextEntries = reloadedEntries;
        }
      } catch (error) {
        if (!silent) {
          helpers.showToast(`刷新自定义邮箱池失败：${error.message}`, 'error');
        }
      }
      renderCustomEmailPoolEntries(nextEntries);
      if (!silent && nextEntries.length > 0) {
        helpers.showToast(`已刷新自定义邮箱池：${nextEntries.length} 个邮箱。`, 'success', 1600);
      }
      if (!silent) {
        setLoadingState(false);
      }
    }

    function queueCustomEmailPoolRefresh() {
      if (refreshQueued) return;
      refreshQueued = true;
      setTimeout(() => {
        refreshQueued = false;
        refreshCustomEmailPoolEntries({ silent: true });
      }, 120);
    }

    function reset() {
      selectedEntryIds.clear();
      searchTerm = '';
      filterMode = 'all';
      if (dom.inputCustomEmailPoolSearch) dom.inputCustomEmailPoolSearch.value = '';
      if (dom.selectCustomEmailPoolFilter) dom.selectCustomEmailPoolFilter.value = 'all';
      renderCustomEmailPoolEntries(state.getEntries?.());
    }

    function bindEvents() {
      dom.btnCustomEmailPoolRefresh?.addEventListener('click', async () => {
        await refreshCustomEmailPoolEntries();
      });

      dom.btnCustomEmailPoolImport?.addEventListener('click', async () => {
        await importEntriesFromTextarea();
      });

      dom.inputCustomEmailPoolImport?.addEventListener('keydown', async (event) => {
        if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
          event.preventDefault();
          await importEntriesFromTextarea();
        }
      });

      dom.inputCustomEmailPoolSearch?.addEventListener('input', (event) => {
        searchTerm = normalizeSearchText(event.target.value);
        renderCustomEmailPoolEntries(renderedEntries);
      });

      dom.selectCustomEmailPoolFilter?.addEventListener('change', (event) => {
        filterMode = String(event.target.value || 'all');
        renderCustomEmailPoolEntries(renderedEntries);
      });

      dom.checkboxCustomEmailPoolSelectAll?.addEventListener('change', (event) => {
        const visibleEntries = getFilteredEntries(renderedEntries);
        const visibleIds = visibleEntries.map((entry) => String(entry.id));
        if (event.target.checked) {
          visibleIds.forEach((id) => selectedEntryIds.add(id));
        } else {
          visibleIds.forEach((id) => selectedEntryIds.delete(id));
        }
        renderCustomEmailPoolEntries(renderedEntries);
      });

      dom.btnCustomEmailPoolBulkUsed?.addEventListener('click', async () => {
        const targetIds = new Set([...selectedEntryIds]);
        await patchEntries((entriesList) => entriesList.map((entry) => (
          targetIds.has(String(entry.id))
            ? { ...entry, used: true, lastUsedAt: entry.lastUsedAt || Date.now() }
            : entry
        )));
      });

      dom.btnCustomEmailPoolBulkUnused?.addEventListener('click', async () => {
        const targetIds = new Set([...selectedEntryIds]);
        await patchEntries((entriesList) => entriesList.map((entry) => (
          targetIds.has(String(entry.id))
            ? { ...entry, used: false }
            : entry
        )));
      });

      dom.btnCustomEmailPoolBulkEnable?.addEventListener('click', async () => {
        const targetIds = new Set([...selectedEntryIds]);
        await patchEntries((entriesList) => entriesList.map((entry) => (
          targetIds.has(String(entry.id))
            ? { ...entry, enabled: true }
            : entry
        )));
      });

      dom.btnCustomEmailPoolBulkDisable?.addEventListener('click', async () => {
        const targetIds = new Set([...selectedEntryIds]);
        await patchEntries((entriesList) => entriesList.map((entry) => (
          targetIds.has(String(entry.id))
            ? { ...entry, enabled: false }
            : entry
        )));
      });

      dom.btnCustomEmailPoolBulkDelete?.addEventListener('click', async () => {
        await deleteEntries({
          ids: [...selectedEntryIds],
        }, `确认删除当前选中的 ${selectedEntryIds.size} 个邮箱吗？此操作不可撤销。`);
      });

      dom.btnCustomEmailPoolClearUsed?.addEventListener('click', async () => {
        await deleteEntries({
          mode: 'used',
        }, '确认删除当前所有已用邮箱吗？此操作不可撤销。');
      });

      dom.btnCustomEmailPoolDeleteAll?.addEventListener('click', async () => {
        await deleteEntries({
          mode: 'all',
        }, '确认删除当前全部邮箱吗？此操作不可撤销。');
      });
    }

    return {
      bindEvents,
      queueCustomEmailPoolRefresh,
      refreshCustomEmailPoolEntries,
      renderCustomEmailPoolEntries,
      reset,
    };
  }

  globalScope.SidepanelCustomEmailPoolManager = {
    createCustomEmailPoolManager,
  };
})(typeof window !== 'undefined' ? window : globalThis);
