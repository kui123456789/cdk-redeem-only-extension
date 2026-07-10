(function attachSidepanelAccountRecordsRenderer(globalScope) {
  function createAccountRecordsRenderer(context = {}) {
    const dom = context.dom || {};
    const state = context.state || {};
    const pageSize = Math.max(1, Math.floor(Number(context.pageSize) || 10));
    const displayTimeZone = context.displayTimeZone || 'Asia/Shanghai';
    const redeemChannelFailureLimit = Math.max(1, Math.floor(Number(context.redeemChannelFailureLimit) || 3));
    const escapeHtml = typeof context.escapeHtml === 'function' ? context.escapeHtml : fallbackEscapeHtml;
    const getAccountRunRecords = typeof context.getAccountRunRecords === 'function'
      ? context.getAccountRunRecords
      : () => [];
    const getFilteredRecords = typeof context.getFilteredRecords === 'function'
      ? context.getFilteredRecords
      : (records = []) => records;
    const summarizeAccountRunHistory = typeof context.summarizeAccountRunHistory === 'function'
      ? context.summarizeAccountRunHistory
      : () => ({ total: 0, running: 0, success: 0, failed: 0, stopped: 0, retryTotal: 0 });
    const getRecordDisplayStatus = typeof context.getRecordDisplayStatus === 'function'
      ? context.getRecordDisplayStatus
      : () => '';
    const getConfirmedUpiSubscriptionLabel = typeof context.getConfirmedUpiSubscriptionLabel === 'function'
      ? context.getConfirmedUpiSubscriptionLabel
      : () => '';
    const getRecordTitle = typeof context.getRecordTitle === 'function'
      ? context.getRecordTitle
      : () => '';
    const normalizeRetryCount = typeof context.normalizeRetryCount === 'function'
      ? context.normalizeRetryCount
      : (value) => Math.max(0, Math.floor(Number(value) || 0));
    const getFilterConfig = typeof context.getFilterConfig === 'function'
      ? context.getFilterConfig
      : () => ({ label: '', className: '', metaLabel: '全部' });
    const getCurrentPage = typeof context.getCurrentPage === 'function'
      ? context.getCurrentPage
      : () => 1;
    const getActiveFilter = typeof context.getActiveFilter === 'function'
      ? context.getActiveFilter
      : () => 'all';
    const getSelectionMode = typeof context.getSelectionMode === 'function'
      ? context.getSelectionMode
      : () => false;
    const getSelectedRecordCount = typeof context.getSelectedRecordCount === 'function'
      ? context.getSelectedRecordCount
      : () => 0;
    const isRecordSelected = typeof context.isRecordSelected === 'function'
      ? context.isRecordSelected
      : () => false;
    const setNodeText = typeof context.setNodeText === 'function' ? context.setNodeText : fallbackSetNodeText;
    const setNodeDisabled = typeof context.setNodeDisabled === 'function' ? context.setNodeDisabled : fallbackSetNodeDisabled;
    const setNodeHidden = typeof context.setNodeHidden === 'function' ? context.setNodeHidden : fallbackSetNodeHidden;
    const toggleNodeClass = typeof context.toggleNodeClass === 'function' ? context.toggleNodeClass : fallbackToggleNodeClass;
    const setNodeAttr = typeof context.setNodeAttr === 'function' ? context.setNodeAttr : fallbackSetNodeAttr;
    const buildUpiRedeemSuccessEmailExportRows = typeof context.buildUpiRedeemSuccessEmailExportRows === 'function'
      ? context.buildUpiRedeemSuccessEmailExportRows
      : () => [];
    const getUpiCredentialBackupPreviewVisible = typeof context.getUpiCredentialBackupPreviewVisible === 'function'
      ? context.getUpiCredentialBackupPreviewVisible
      : () => false;
    const ensureValidCurrentPage = typeof context.ensureValidCurrentPage === 'function'
      ? context.ensureValidCurrentPage
      : (totalRecords) => totalRecords > 0 ? 1 : 0;
    const buildRecordId = typeof context.buildRecordId === 'function'
      ? context.buildRecordId
      : () => '';
    const getRecordPrimaryIdentifier = typeof context.getRecordPrimaryIdentifier === 'function'
      ? context.getRecordPrimaryIdentifier
      : () => '';
    const getRecordSecondaryIdentifier = typeof context.getRecordSecondaryIdentifier === 'function'
      ? context.getRecordSecondaryIdentifier
      : () => '';
    const setExportButtonsBusy = typeof context.setExportButtonsBusy === 'function'
      ? context.setExportButtonsBusy
      : () => {};
    const membershipResultsRendererApi = globalScope.SidepanelAccountRecordsMembershipResultsRenderer;
    if (!membershipResultsRendererApi?.createAccountRecordsMembershipResultsRenderer) {
      throw new Error('Account records membership results renderer module is not loaded.');
    }

    function formatAccountRecordTime(value) {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        return '--:--';
      }

      const now = new Date();
      const sameYear = date.getFullYear() === now.getFullYear();
      const sameDay = date.toDateString() === now.toDateString();

      if (sameDay) {
        return date.toLocaleTimeString('zh-CN', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          timeZone: displayTimeZone,
        });
      }

      return date.toLocaleString('zh-CN', {
        hour12: false,
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        ...(sameYear ? {} : { year: '2-digit' }),
        timeZone: displayTimeZone,
      }).replace(/\//g, '-');
    }

    function getStatusMeta(record = {}) {
      const status = getRecordDisplayStatus(record);
      if (status === 'success') {
        return { kind: 'success', label: getConfirmedUpiSubscriptionLabel(record) || '成功' };
      }
      if (status === 'running') {
        return { kind: 'running', label: '正在运行' };
      }
      if (status === 'stopped') {
        return { kind: 'stopped', label: '停止' };
      }
      return { kind: 'failed', label: '失败' };
    }

    function getRecordSummaryText(record = {}) {
      const status = getRecordDisplayStatus(record);
      if (record.displaySummary) {
        return String(record.displaySummary || '').trim();
      }
      if (status === 'success') {
        return getConfirmedUpiSubscriptionLabel(record) || '流程完成';
      }
      if (status === 'running') {
        return '正在运行';
      }

      return String(record.failureDetail || record.reason || '').trim()
        || String(record.failureLabel || '').trim()
        || '流程失败';
    }

    function getRecordTooltipText(record = {}) {
      const recordTitle = getRecordTitle(record);
      const status = getRecordDisplayStatus(record);
      const detail = String(record.displaySummary || record.failureDetail || record.reason || '').trim();
      if (status === 'success' || status === 'running' || !detail || detail === recordTitle) {
        return recordTitle;
      }
      return `${recordTitle}\n${detail}`;
    }

    function createStatChip(filterKey, value) {
      const filterConfig = getFilterConfig(filterKey);
      const activeFilter = getActiveFilter();
      const classNames = [
        'account-records-stat',
        filterConfig.className,
        activeFilter === filterKey ? 'is-active' : '',
      ].filter(Boolean).join(' ');

      return `
        <button
          type="button"
          class="${classNames}"
          data-account-record-filter="${escapeHtml(filterKey)}"
          aria-pressed="${activeFilter === filterKey ? 'true' : 'false'}"
        >
          <strong>${escapeHtml(String(value))}</strong>${escapeHtml(filterConfig.label)}
        </button>
      `;
    }

    function updateHeader(allRecords = [], filteredRecords = []) {
      if (!dom.accountRecordsMeta) {
        return;
      }

      if (!allRecords.length) {
        dom.accountRecordsMeta.textContent = '暂无账号记录';
        return;
      }

      const latestTime = formatAccountRecordTime(allRecords[0]?.finishedAt);
      const activeFilter = getActiveFilter();
      let metaText = `共 ${allRecords.length} 条，最近更新于 ${latestTime}`;

      if (activeFilter !== 'all') {
        metaText = `共 ${allRecords.length} 条，当前筛选 ${getFilterConfig(activeFilter).metaLabel} ${filteredRecords.length} 条，最近更新于 ${latestTime}`;
      }

      if (getSelectionMode()) {
        metaText += `，已选 ${getSelectedRecordCount()} 条`;
      }

      dom.accountRecordsMeta.textContent = metaText;
    }

    function updateStats(allRecords = []) {
      if (!dom.accountRecordsStats) {
        return;
      }

      const summary = summarizeAccountRunHistory(allRecords);
      dom.accountRecordsStats.innerHTML = [
        createStatChip('all', summary.total),
        createStatChip('running', summary.running),
        createStatChip('success', summary.success),
        createStatChip('failed', summary.failed),
        createStatChip('stopped', summary.stopped),
        createStatChip('retry', summary.retryTotal),
      ].join('');
    }

    function updateToolbarState(allRecords = []) {
      const totalRecords = allRecords.length;
      const exportRows = buildUpiRedeemSuccessEmailExportRows(allRecords);
      const selectionMode = getSelectionMode();
      const selectedCount = getSelectedRecordCount();

      setNodeDisabled(dom.btnClearAccountRecords, totalRecords === 0);
      setNodeDisabled(dom.btnExportSuccessAccountRecords, exportRows.length === 0);
      setNodeDisabled(dom.btnShowUpiCredentialBackups, false);
      setNodeDisabled(dom.btnExportUpiCredentialBackups, false);
      setNodeDisabled(dom.btnExportUpiRedeemSuccessRecords, exportRows.length === 0);
      setNodeDisabled(dom.btnToggleAccountRecordsSelection, totalRecords === 0);
      setNodeHidden(dom.btnClearAccountRecords, selectionMode);
      setNodeHidden(dom.btnExportSuccessAccountRecords, selectionMode);
      setNodeHidden(dom.btnShowUpiCredentialBackups, selectionMode);
      setNodeHidden(dom.btnExportUpiCredentialBackups, selectionMode);
      setNodeHidden(dom.upiCredentialBackupPreviewWrap, selectionMode || !getUpiCredentialBackupPreviewVisible());
      toggleNodeClass(dom.btnToggleAccountRecordsSelection, 'is-active', selectionMode);
      setNodeAttr(dom.btnToggleAccountRecordsSelection, 'aria-pressed', selectionMode ? 'true' : 'false');
      setNodeText(dom.btnToggleAccountRecordsSelection, selectionMode ? '取消多选' : '多选');

      setNodeHidden(dom.btnDeleteSelectedAccountRecords, !selectionMode);
      setNodeDisabled(dom.btnDeleteSelectedAccountRecords, selectedCount === 0);
      setNodeText(
        dom.btnDeleteSelectedAccountRecords,
        selectedCount > 0 ? `删除选中(${selectedCount})` : '删除选中'
      );
    }

    function updatePagination(totalRecords) {
      const totalPages = ensureValidCurrentPage(totalRecords);
      const currentPage = getCurrentPage();

      setNodeText(dom.accountRecordsPageLabel, totalPages > 0 ? `${currentPage} / ${totalPages}` : '0 / 0');
      setNodeDisabled(dom.btnAccountRecordsPrev, totalPages <= 1 || currentPage <= 1);
      setNodeDisabled(dom.btnAccountRecordsNext, totalPages <= 1 || currentPage >= totalPages);
    }

    function renderEmptyState(allRecords = []) {
      if (!dom.accountRecordsList) {
        return;
      }

      const activeFilter = getActiveFilter();
      const message = allRecords.length
        ? `当前筛选“${getFilterConfig(activeFilter).metaLabel}”下暂无记录`
        : '暂无账号记录';
      dom.accountRecordsList.innerHTML = `<div class="account-records-empty">${escapeHtml(message)}</div>`;
    }

    function renderRecordList(allRecords = [], filteredRecords = []) {
      if (!dom.accountRecordsList) {
        return;
      }

      updatePagination(filteredRecords.length);
      if (!filteredRecords.length) {
        renderEmptyState(allRecords);
        return;
      }

      const currentPage = getCurrentPage();
      const selectionMode = getSelectionMode();
      const startIndex = (currentPage - 1) * pageSize;
      const visibleRecords = filteredRecords.slice(startIndex, startIndex + pageSize);

      dom.accountRecordsList.innerHTML = visibleRecords.map((record) => {
        const recordId = buildRecordId(record);
        const primaryIdentifier = getRecordPrimaryIdentifier(record) || '(空账号)';
        const secondaryIdentifier = getRecordSecondaryIdentifier(record);
        const statusMeta = getStatusMeta(record);
        const summaryText = getRecordSummaryText(record);
        const recordTitle = getRecordTooltipText(record);
        const retryCount = normalizeRetryCount(record.retryCount);
        const isSelected = isRecordSelected(recordId);
        const itemClassNames = [
          'account-record-item',
          `is-${statusMeta.kind}`,
          selectionMode ? 'is-selectable' : '',
          isSelected ? 'is-selected' : '',
        ].filter(Boolean).join(' ');
        const selectionMarkup = selectionMode
          ? `
              <label class="account-record-item-check" data-account-record-toggle="${escapeHtml(recordId)}">
                <input
                  type="checkbox"
                  data-account-record-checkbox="${escapeHtml(recordId)}"
                  ${isSelected ? 'checked' : ''}
                />
              </label>
            `
          : '';

        return `
          <div
            class="${itemClassNames}"
            data-account-record-id="${escapeHtml(recordId)}"
            title="${escapeHtml(recordTitle)}"
          >
            <div class="account-record-item-top">
              <div class="account-record-item-email-row">
                ${selectionMarkup}
                <div class="account-record-item-identity">
                  <div class="account-record-item-email mono">${escapeHtml(primaryIdentifier)}</div>
                  ${secondaryIdentifier ? `<div class="account-record-item-secondary mono">${escapeHtml(secondaryIdentifier)}</div>` : ''}
                </div>
              </div>
              <div class="account-record-item-side">
                <span class="account-record-item-status">${escapeHtml(statusMeta.label)}</span>
                <span class="account-record-item-time mono">${escapeHtml(formatAccountRecordTime(record.finishedAt))}</span>
              </div>
            </div>
            <div class="account-record-item-bottom">
              <div class="account-record-item-summary">${escapeHtml(summaryText)}</div>
              <span class="account-record-item-retry mono">重试 ${escapeHtml(String(retryCount))}</span>
            </div>
          </div>
        `;
      }).join('');
    }

    function restoreScrollTopAfterRender(node, scrollTop = 0) {
      if (!node || scrollTop <= 0) {
        return;
      }
      const restore = () => {
        const maxScrollTop = Math.max(0, node.scrollHeight - node.clientHeight);
        node.scrollTop = Math.min(scrollTop, maxScrollTop);
      };
      restore();
      if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(restore);
      }
    }

    const { renderUpiCredentialMembershipCheckResults } = membershipResultsRendererApi.createAccountRecordsMembershipResultsRenderer({
      dom,
      state,
      redeemChannelFailureLimit,
      escapeHtml,
      formatAccountRecordTime,
      setNodeHidden,
      restoreScrollTopAfterRender,
      getUpiCredentialMembershipCheckResults: context.getUpiCredentialMembershipCheckResults,
      buildUpiCredentialMembershipDisplayRows: context.buildUpiCredentialMembershipDisplayRows,
      normalizeUpiCredentialMembershipEmail: context.normalizeUpiCredentialMembershipEmail,
      normalizeUpiCredentialMembershipText: context.normalizeUpiCredentialMembershipText,
      isActiveUpiCredentialMembershipRedeemRow: context.isActiveUpiCredentialMembershipRedeemRow,
      isAutoRunRecordDisplayRunning: context.isAutoRunRecordDisplayRunning,
      summarizeMembershipViewModelRows: context.summarizeMembershipViewModelRows,
      getUpiCredentialMembershipUiGroup: context.getUpiCredentialMembershipUiGroup,
      getFreeExportIncludeVerificationUrl: context.getFreeExportIncludeVerificationUrl,
      getChannelFailureLimitBlockedFreeRows: context.getChannelFailureLimitBlockedFreeRows,
      isRedeemChannelDailyLimitBlocked: context.isRedeemChannelDailyLimitBlocked,
      isUpiCredentialMembershipRedeemLocked: context.isUpiCredentialMembershipRedeemLocked,
      hasUpiCredentialMembershipLoginMaterial: context.hasUpiCredentialMembershipLoginMaterial,
      getUpiCredentialMembershipRowStatusMeta: context.getUpiCredentialMembershipRowStatusMeta,
      getUpiCredentialMembershipRedeemCancelControl: context.getUpiCredentialMembershipRedeemCancelControl,
      getUpiCredentialMembershipRedeemProgressMeta: context.getUpiCredentialMembershipRedeemProgressMeta,
      renderUpiCredentialMembershipRedeemProgress: context.renderUpiCredentialMembershipRedeemProgress,
      getAvailableUpiRedeemCdkeyCount: context.getAvailableUpiRedeemCdkeyCount,
      isRedeemableFreeUpiCredentialMembershipRow: context.isRedeemableFreeUpiCredentialMembershipRow,
      isRedeemableFreeUpiCredentialMembershipRowForChannel: context.isRedeemableFreeUpiCredentialMembershipRowForChannel,
      getRedeemChannelLabel: context.getRedeemChannelLabel,
      renderUpiCredentialMembershipFlow: context.renderUpiCredentialMembershipFlow,
      getUpiCredentialMembershipFlowTitle: context.getUpiCredentialMembershipFlowTitle,
      getUpiCredentialMembershipCheckBusy: context.getUpiCredentialMembershipCheckBusy,
      getUpiCredentialMembershipRedeemBusy: context.getUpiCredentialMembershipRedeemBusy,
      getUpiCredentialMembershipAllRedeemBusy: context.getUpiCredentialMembershipAllRedeemBusy,
      getUpiCredentialMembershipCheckingEmail: context.getUpiCredentialMembershipCheckingEmail,
      getUpiCredentialMembershipLoginEmail: context.getUpiCredentialMembershipLoginEmail,
    });

    function renderAccountRecordsPanel(currentState = state.getLatestState?.() || {}) {
      const allRecords = getAccountRunRecords(currentState);
      const filteredRecords = getFilteredRecords(allRecords);
      updateHeader(allRecords, filteredRecords);
      updateStats(allRecords);
      updateToolbarState(allRecords);
      renderRecordList(allRecords, filteredRecords);
      setExportButtonsBusy(false);
      renderUpiCredentialMembershipCheckResults();
    }

    return {
      renderAccountRecordsPanel,
      renderUpiCredentialMembershipCheckResults,
      updateHeader,
      updatePagination,
      updateStats,
    };
  }

  function fallbackEscapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function fallbackSetNodeText(node, value) {
    if (node) {
      node.textContent = String(value || '');
    }
  }

  function fallbackSetNodeDisabled(node, disabled) {
    if (node) {
      node.disabled = Boolean(disabled);
    }
  }

  function fallbackSetNodeHidden(node, hidden) {
    if (node) {
      node.hidden = Boolean(hidden);
    }
  }

  function fallbackToggleNodeClass(node, className, enabled) {
    if (node?.classList && typeof node.classList.toggle === 'function') {
      node.classList.toggle(className, Boolean(enabled));
    }
  }

  function fallbackSetNodeAttr(node, name, value) {
    if (!node || !name) {
      return;
    }
    if (typeof node.setAttribute === 'function') {
      node.setAttribute(name, String(value));
      return;
    }
    node[name] = value;
  }

  const api = { createAccountRecordsRenderer };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  globalScope.SidepanelAccountRecordsRenderer = api;
})(typeof window !== 'undefined' ? window : globalThis);
