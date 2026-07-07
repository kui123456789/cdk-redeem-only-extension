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
    const getUpiCredentialMembershipCheckResults = typeof context.getUpiCredentialMembershipCheckResults === 'function'
      ? context.getUpiCredentialMembershipCheckResults
      : () => ({ items: [] });
    const buildUpiCredentialMembershipDisplayRows = typeof context.buildUpiCredentialMembershipDisplayRows === 'function'
      ? context.buildUpiCredentialMembershipDisplayRows
      : () => [];
    const normalizeUpiCredentialMembershipEmail = typeof context.normalizeUpiCredentialMembershipEmail === 'function'
      ? context.normalizeUpiCredentialMembershipEmail
      : (value = '') => String(value || '').trim().toLowerCase();
    const normalizeUpiCredentialMembershipText = typeof context.normalizeUpiCredentialMembershipText === 'function'
      ? context.normalizeUpiCredentialMembershipText
      : (value = '') => String(value || '').trim();
    const isActiveUpiCredentialMembershipRedeemRow = typeof context.isActiveUpiCredentialMembershipRedeemRow === 'function'
      ? context.isActiveUpiCredentialMembershipRedeemRow
      : () => false;
    const isAutoRunRecordDisplayRunning = typeof context.isAutoRunRecordDisplayRunning === 'function'
      ? context.isAutoRunRecordDisplayRunning
      : () => false;
    const summarizeMembershipViewModelRows = typeof context.summarizeMembershipViewModelRows === 'function'
      ? context.summarizeMembershipViewModelRows
      : () => ({ free: 0, 'upi-plus': 0, 'ideal-plus': 0 });
    const getUpiCredentialMembershipUiGroup = typeof context.getUpiCredentialMembershipUiGroup === 'function'
      ? context.getUpiCredentialMembershipUiGroup
      : () => 'free';
    const getChannelFailureLimitBlockedFreeRows = typeof context.getChannelFailureLimitBlockedFreeRows === 'function'
      ? context.getChannelFailureLimitBlockedFreeRows
      : () => [];
    const isRedeemChannelDailyLimitBlocked = typeof context.isRedeemChannelDailyLimitBlocked === 'function'
      ? context.isRedeemChannelDailyLimitBlocked
      : () => false;
    const isUpiCredentialMembershipRedeemLocked = typeof context.isUpiCredentialMembershipRedeemLocked === 'function'
      ? context.isUpiCredentialMembershipRedeemLocked
      : () => false;
    const hasUpiCredentialMembershipLoginMaterial = typeof context.hasUpiCredentialMembershipLoginMaterial === 'function'
      ? context.hasUpiCredentialMembershipLoginMaterial
      : () => false;
    const getUpiCredentialMembershipRowStatusMeta = typeof context.getUpiCredentialMembershipRowStatusMeta === 'function'
      ? context.getUpiCredentialMembershipRowStatusMeta
      : () => ({ className: '', label: '', detail: '' });
    const getUpiCredentialMembershipRedeemCancelControl = typeof context.getUpiCredentialMembershipRedeemCancelControl === 'function'
      ? context.getUpiCredentialMembershipRedeemCancelControl
      : () => ({ visible: false, cdkey: '', channel: '', canCancel: false, disabled: true, title: '' });
    const getUpiCredentialMembershipRedeemProgressMeta = typeof context.getUpiCredentialMembershipRedeemProgressMeta === 'function'
      ? context.getUpiCredentialMembershipRedeemProgressMeta
      : () => ({});
    const renderUpiCredentialMembershipRedeemProgress = typeof context.renderUpiCredentialMembershipRedeemProgress === 'function'
      ? context.renderUpiCredentialMembershipRedeemProgress
      : () => '';
    const getAvailableUpiRedeemCdkeyCount = typeof context.getAvailableUpiRedeemCdkeyCount === 'function'
      ? context.getAvailableUpiRedeemCdkeyCount
      : () => 0;
    const isRedeemableFreeUpiCredentialMembershipRow = typeof context.isRedeemableFreeUpiCredentialMembershipRow === 'function'
      ? context.isRedeemableFreeUpiCredentialMembershipRow
      : () => false;
    const isRedeemableFreeUpiCredentialMembershipRowForChannel = typeof context.isRedeemableFreeUpiCredentialMembershipRowForChannel === 'function'
      ? context.isRedeemableFreeUpiCredentialMembershipRowForChannel
      : () => false;
    const getRedeemChannelLabel = typeof context.getRedeemChannelLabel === 'function'
      ? context.getRedeemChannelLabel
      : (value = '') => String(value || '').trim().toUpperCase() || 'UPI';
    const renderUpiCredentialMembershipFlow = typeof context.renderUpiCredentialMembershipFlow === 'function'
      ? context.renderUpiCredentialMembershipFlow
      : () => '';
    const getUpiCredentialMembershipFlowTitle = typeof context.getUpiCredentialMembershipFlowTitle === 'function'
      ? context.getUpiCredentialMembershipFlowTitle
      : () => '处理中';
    const getUpiCredentialMembershipCheckBusy = typeof context.getUpiCredentialMembershipCheckBusy === 'function'
      ? context.getUpiCredentialMembershipCheckBusy
      : () => false;
    const getUpiCredentialMembershipRedeemBusy = typeof context.getUpiCredentialMembershipRedeemBusy === 'function'
      ? context.getUpiCredentialMembershipRedeemBusy
      : () => false;
    const getUpiCredentialMembershipAllRedeemBusy = typeof context.getUpiCredentialMembershipAllRedeemBusy === 'function'
      ? context.getUpiCredentialMembershipAllRedeemBusy
      : () => false;
    const getUpiCredentialMembershipCheckingEmail = typeof context.getUpiCredentialMembershipCheckingEmail === 'function'
      ? context.getUpiCredentialMembershipCheckingEmail
      : () => '';
    const getUpiCredentialMembershipLoginEmail = typeof context.getUpiCredentialMembershipLoginEmail === 'function'
      ? context.getUpiCredentialMembershipLoginEmail
      : () => '';
    const setExportButtonsBusy = typeof context.setExportButtonsBusy === 'function'
      ? context.setExportButtonsBusy
      : () => {};

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

    function renderUpiCredentialMembershipCheckResults() {
      const container = dom.upiCredentialMembershipCheckResults;
      if (!container) return;
      const results = getUpiCredentialMembershipCheckResults();
      const rows = buildUpiCredentialMembershipDisplayRows(results);
      const hasItems = rows.length > 0;
      const hasActivity = hasItems || results.running || results.redeeming || results.stoppedAt || results.redeemStoppedAt;
      setNodeHidden(container, false);
      const progress = results.running
        ? `核验中 ${results.completed}/${results.total || results.completed}`
        : results.redeeming
          ? `兑换中 ${results.redeemCompleted}/${results.redeemTotal || results.redeemCompleted}`
          : results.redeemStoppedAt
            ? `兑换已停止 ${results.redeemCompleted}/${results.redeemTotal || results.redeemCompleted}`
            : results.stoppedAt
              ? `核验已停止 ${results.completed}/${results.total || results.completed}`
              : `已核验 ${results.completed || results.items.length}/${results.total || results.items.length}`;
      const currentFlowEmail = normalizeUpiCredentialMembershipEmail(results.flowStageEmail);
      const currentFlowTitle = getUpiCredentialMembershipFlowTitle(results.flowStage, results);
      const currentFlowText = currentFlowEmail
        ? ` · 当前 ${currentFlowEmail}${currentFlowTitle ? ` · ${currentFlowTitle}` : ''}`
        : '';
      const enabledCount = rows.filter((row) => row.enabled !== false).length;
      const membershipBusy = results.running
        || results.redeeming
        || getUpiCredentialMembershipCheckBusy()
        || getUpiCredentialMembershipRedeemBusy()
        || getUpiCredentialMembershipAllRedeemBusy();
      const autoRunBusy = isAutoRunRecordDisplayRunning(state.getLatestState?.() || {});
      const mutatingBusy = membershipBusy || autoRunBusy;
      const redeemActionBusy = membershipBusy;
      const importActionBusy = membershipBusy;
      const deleteActionBusy = membershipBusy;
      const membershipSummary = summarizeMembershipViewModelRows(rows);
      const freeSectionRows = rows.filter((row) => getUpiCredentialMembershipUiGroup(row) === 'free');
      const paidRows = rows.filter((row) => getUpiCredentialMembershipUiGroup(row) !== 'free');
      const upiPaidRows = rows.filter((row) => getUpiCredentialMembershipUiGroup(row) === 'paid-upi');
      const idealPaidRows = rows.filter((row) => getUpiCredentialMembershipUiGroup(row) === 'paid-ideal');
      const deletableFreeRows = freeSectionRows.filter((row) => !isActiveUpiCredentialMembershipRedeemRow(row, results));
      const deletableUpiPaidRows = upiPaidRows.filter((row) => !isActiveUpiCredentialMembershipRedeemRow(row, results));
      const deletableIdealPaidRows = idealPaidRows.filter((row) => !isActiveUpiCredentialMembershipRedeemRow(row, results));
      const blockedFreeDeleteCount = Math.max(0, freeSectionRows.length - deletableFreeRows.length);
      const blockedUpiPaidDeleteCount = Math.max(0, upiPaidRows.length - deletableUpiPaidRows.length);
      const blockedIdealPaidDeleteCount = Math.max(0, idealPaidRows.length - deletableIdealPaidRows.length);
      const allFreeRows = freeSectionRows.filter((row) => String(row.status || '').trim().toLowerCase() === 'free');
      const failedRows = freeSectionRows.filter((row) => {
        const status = String(row.status || '').trim().toLowerCase();
        const redeemStatus = String(row.redeemStatus || '').trim().toLowerCase();
        return status === 'failed' || redeemStatus === 'failed';
      });
      const freeRows = allFreeRows.filter((row) => String(row.redeemStatus || '').trim().toLowerCase() !== 'failed');
      const paidCount = membershipSummary['upi-plus'] + membershipSummary['ideal-plus'];
      const freeCount = freeRows.length;
      const failedCount = failedRows.length;
      const freeSectionCount = membershipSummary.free;
      const missingAtCount = freeSectionRows.filter((row) => row.enabled !== false && !normalizeUpiCredentialMembershipText(row.accessToken)).length;
      const identifyPlusCount = freeSectionRows.filter((row) => row.enabled !== false && normalizeUpiCredentialMembershipText(row.accessToken)).length;
      const redeemableFreeRows = allFreeRows.filter(isRedeemableFreeUpiCredentialMembershipRow);
      const redeemableUpiFreeRows = allFreeRows.filter((row) => isRedeemableFreeUpiCredentialMembershipRowForChannel(row, 'upi'));
      const redeemableIdealFreeRows = allFreeRows.filter((row) => isRedeemableFreeUpiCredentialMembershipRowForChannel(row, 'ideal'));
      const redeemableFreeCount = redeemableFreeRows.length;
      const redeemableUpiFreeCount = redeemableUpiFreeRows.length;
      const redeemableIdealFreeCount = redeemableIdealFreeRows.length;
      const idealFailureBlockedFreeCount = getChannelFailureLimitBlockedFreeRows(allFreeRows, 'ideal').length;
      const upiDailyLimitBlockedFreeCount = allFreeRows.filter((row) => isRedeemChannelDailyLimitBlocked(row, 'upi')).length;
      const lockedRedeemCount = allFreeRows.filter(isUpiCredentialMembershipRedeemLocked).length;
      const deletableFailedFreeCount = deletableFreeRows.filter((row) => {
        const status = String(row.status || '').trim().toLowerCase();
        const redeemStatus = String(row.redeemStatus || '').trim().toLowerCase();
        return status === 'failed' || redeemStatus === 'failed';
      }).length;
      const deletableLockedFreeCount = deletableFreeRows.filter((row) => (
        String(row.status || '').trim().toLowerCase() === 'free' && isUpiCredentialMembershipRedeemLocked(row)
      )).length;
      const deletableFreeTitle = [
        `删除 Free/失败组中非兑换中的账号 ${deletableFreeRows.length} 条`,
        `可兑换账号 ${redeemableFreeCount} 条`,
        deletableLockedFreeCount ? `含封存账号 ${deletableLockedFreeCount} 条` : '',
        deletableFailedFreeCount ? `含失败账号 ${deletableFailedFreeCount} 条` : '',
        blockedFreeDeleteCount ? `将跳过 ${blockedFreeDeleteCount} 条正在兑换或等待远端结果的账号` : '',
      ].filter(Boolean).join('；');
      const availableUpiCdkeyCount = getAvailableUpiRedeemCdkeyCount(state.getLatestState?.() || {}, 'upi');
      const availableIdealCdkeyCount = getAvailableUpiRedeemCdkeyCount(state.getLatestState?.() || {}, 'ideal');
      const redeemUpiNowCount = Math.min(redeemableUpiFreeCount, availableUpiCdkeyCount);
      const redeemIdealNowCount = Math.min(redeemableIdealFreeCount, availableIdealCdkeyCount);
      const redeemAllUpiEmailSet = new Set(redeemableUpiFreeRows
        .slice(0, redeemUpiNowCount)
        .map((row) => normalizeUpiCredentialMembershipEmail(row.email))
        .filter(Boolean));
      const redeemAllIdealRemainingCount = redeemableIdealFreeRows
        .filter((row) => !redeemAllUpiEmailSet.has(normalizeUpiCredentialMembershipEmail(row.email)))
        .length;
      const redeemAllIdealNowCount = Math.min(redeemAllIdealRemainingCount, availableIdealCdkeyCount);
      const redeemAllNowCount = redeemUpiNowCount + redeemAllIdealNowCount;
      const redeemUpiTitle = `UPI 可用 CDK ${availableUpiCdkeyCount}；UPI 候选 ${redeemableUpiFreeCount}；总可兑换 ${redeemableFreeCount}；普通 UPI 失败不会禁用 UPI${upiDailyLimitBlockedFreeCount ? `；${upiDailyLimitBlockedFreeCount} 个账号明确返回今日提交次数上限，已转 IDEAL 候选` : ''}`;
      const redeemIdealTitle = `IDEAL 可用 CDK ${availableIdealCdkeyCount}；IDEAL 候选 ${redeemableIdealFreeCount}；总可兑换 ${redeemableFreeCount}${idealFailureBlockedFreeCount ? `；${idealFailureBlockedFreeCount} 个账号 IDEAL 已失败满 ${redeemChannelFailureLimit} 次或已封存` : ''}`;
      const redeemAllTitle = `先兑换 UPI ${redeemUpiNowCount}/${redeemableFreeCount}，完成后再兑换剩余 IDEAL ${redeemAllIdealNowCount}/${redeemableFreeCount}；只有明确返回今日提交次数上限的账号会跳过 UPI 并进入 IDEAL 候选`;
      const verifyPlusCount = paidRows.filter((row) => row.enabled !== false && normalizeUpiCredentialMembershipText(row.accessToken)).length;
      const verifyPlusTotalCount = paidRows.filter((row) => row.enabled !== false).length;
      const verifyPlusMissingAtCount = Math.max(0, verifyPlusTotalCount - verifyPlusCount);
      const verifyPlusButtonText = verifyPlusMissingAtCount
        ? `一键验证全部 Plus(${verifyPlusCount}/${verifyPlusTotalCount})`
        : `一键验证全部 Plus(${verifyPlusCount})`;
      const verifyPlusTitle = verifyPlusMissingAtCount
        ? `当前可验证 ${verifyPlusCount}/${verifyPlusTotalCount} 个 Plus；${verifyPlusMissingAtCount} 个缺少 AT，需要先补 AT 或重新登录后才能验证。`
        : '一键验证全部 Plus';
      const refreshEmailStatusCount = identifyPlusCount;
      const refreshEmailStatusTitle = missingAtCount
        ? `按已保存 AT 检测 Free/失败组邮箱会员状态；当前可刷新 ${refreshEmailStatusCount} 个，${missingAtCount} 个缺少 AT。`
        : '按已保存 AT 检测 Free/失败组邮箱会员状态';
      const previousFreeScrollTop = container.querySelector('.upi-membership-check-list[data-upi-membership-list="free"]')?.scrollTop || 0;
      const previousUpiPaidScrollTop = container.querySelector('.upi-membership-check-list[data-upi-membership-list="paid-upi"]')?.scrollTop || 0;
      const previousIdealPaidScrollTop = container.querySelector('.upi-membership-check-list[data-upi-membership-list="paid-ideal"]')?.scrollTop || 0;
      const renderRows = (groupRows = [], group = 'free') => `
        <div class="upi-membership-check-status-header">
          <span>启用</span>
          <span>邮箱</span>
          <span>状态</span>
          <span>登录</span>
          <span>移动</span>
          <span>兑换</span>
          <span>删除</span>
        </div>
        <div class="upi-membership-check-list" data-upi-membership-list="${escapeHtml(group)}">
          ${groupRows.length ? groupRows.map((row) => {
            const meta = getUpiCredentialMembershipRowStatusMeta(row, results);
            const email = normalizeUpiCredentialMembershipEmail(row.email);
            const isRowChecking = normalizeUpiCredentialMembershipEmail(getUpiCredentialMembershipCheckingEmail()) === email;
            const isRowLoggingIn = normalizeUpiCredentialMembershipEmail(getUpiCredentialMembershipLoginEmail()) === email;
            const disableLogin = mutatingBusy || isRowLoggingIn || row.enabled === false || !hasUpiCredentialMembershipLoginMaterial(row);
            const isFreeGroup = group === 'free';
            const deleteChannel = group === 'paid-ideal'
              ? 'ideal'
              : group === 'paid-upi'
                ? 'upi'
                : normalizeUpiCredentialMembershipText(row.redeemChannel || row.channel);
            const targetMoveStatus = isFreeGroup ? 'paid' : 'free';
            const moveLabel = isFreeGroup ? '移到 Plus' : '移到 Free';
            const deleteLockedByRedeem = isActiveUpiCredentialMembershipRedeemRow(row, results);
            const disableDelete = deleteActionBusy || deleteLockedByRedeem;
            const deleteTitle = deleteLockedByRedeem
              ? '正在兑换或等待远端结果，不能删除；请先取消对应 CDK 任务。'
              : '删除';
            const cancelRedeemControl = getUpiCredentialMembershipRedeemCancelControl(row, results);
            const redeemProgress = getUpiCredentialMembershipRedeemProgressMeta(row, results);
            const singleCheckDataAttribute = 'data-upi-membership-check-one';
            const disableSingleCheck = mutatingBusy || isRowChecking || row.enabled === false;
            const singleActionTitle = '点击检测该账号是否已开通 Plus/Pro/Team';
            const singleActionAria = `检测 ${email} 是否有 Plus`;
            const titleParts = [
              email,
              meta.detail,
              row.accessTokenMasked ? `AT ${row.accessTokenMasked}` : '',
              row.checkedAt ? formatAccountRecordTime(row.checkedAt) : '',
            ].filter(Boolean);
            return `
              <div class="upi-membership-check-item" data-upi-membership-email="${escapeHtml(email)}" title="${escapeHtml(titleParts.join('\n'))}">
                <label class="toggle-switch upi-membership-check-enabled-toggle">
                  <input type="checkbox" data-upi-membership-toggle="${escapeHtml(email)}" ${row.enabled === false ? '' : 'checked'} ${mutatingBusy ? 'disabled' : ''} aria-label="启用核验 ${escapeHtml(email)}" />
                  <span class="toggle-switch-track"><span class="toggle-switch-thumb"></span></span>
                </label>
                <button class="upi-membership-check-email upi-membership-check-email-action mono" type="button" ${singleCheckDataAttribute}="${escapeHtml(email)}" ${disableSingleCheck ? 'disabled' : ''} title="${escapeHtml(singleActionTitle)}">${escapeHtml(email)}</button>
                <button class="icloud-tag upi-membership-check-status-action ${escapeHtml(meta.className)}" type="button" ${singleCheckDataAttribute}="${escapeHtml(email)}" ${disableSingleCheck ? 'disabled' : ''} aria-label="${escapeHtml(singleActionAria)}" title="${escapeHtml(singleActionTitle)}">${escapeHtml(meta.label)}</button>
                <button class="icloud-tag upi-membership-check-login-action" type="button" data-upi-membership-login="${escapeHtml(email)}" ${disableLogin ? 'disabled' : ''} title="登录">登录</button>
                <button class="icloud-tag upi-membership-check-move-action" type="button" data-upi-membership-move-group="${escapeHtml(email)}" data-upi-membership-move-target="${escapeHtml(targetMoveStatus)}" ${mutatingBusy ? 'disabled' : ''}>${escapeHtml(moveLabel)}</button>
                ${renderUpiCredentialMembershipRedeemProgress(row, redeemProgress, cancelRedeemControl)}
                <button class="icloud-tag danger upi-membership-check-delete-action" type="button" data-upi-membership-delete="${escapeHtml(email)}" data-upi-membership-delete-channel="${escapeHtml(deleteChannel)}" ${disableDelete ? 'disabled' : ''} title="${escapeHtml(deleteTitle)}">删除</button>
              </div>
            `;
          }).join('') : `<div class="upi-membership-check-empty">${escapeHtml(`${group === 'free' ? 'Free' : getRedeemChannelLabel(group === 'paid-ideal' ? 'ideal' : 'upi') + ' Plus'} 分组暂无账号`)}</div>`}
        </div>
      `;
      container.innerHTML = `
        <div class="upi-membership-check-head">
          <span>${escapeHtml(`${progress}${currentFlowText}`)} · 启用 ${escapeHtml(String(enabledCount))} / 有会员 ${escapeHtml(String(paidCount))} / 无会员 ${escapeHtml(String(freeCount))} / 失败 ${escapeHtml(String(failedCount))}</span>
          ${results.updatedAt ? `<span class="mono">${escapeHtml(formatAccountRecordTime(results.updatedAt))}</span>` : ''}
        </div>
        ${hasActivity ? renderUpiCredentialMembershipFlow(results, rows) : ''}
        <div class="upi-membership-check-detail">提示：点击账号邮箱或状态标签，可以单独检测该账号是否是 Plus/Pro/Team 会员。</div>
        <div class="upi-membership-check-section" data-upi-membership-section="paid-all-actions">
          <div class="upi-membership-check-head upi-membership-section-head">
            <span class="upi-membership-section-title">全部 Plus 操作</span>
            <span class="upi-membership-section-meta">${escapeHtml(String(paidRows.length))} 个账号</span>
          </div>
          <div class="upi-membership-check-actions">
            <button class="btn btn-ghost btn-xs" type="button" data-upi-membership-export="paid-all"${paidRows.length || autoRunBusy ? '' : ' disabled'}>导出全部 Plus(${escapeHtml(String(paidRows.length))})</button>
            <button class="btn btn-primary btn-xs" type="button" data-upi-membership-verify-plus ${verifyPlusCount && !mutatingBusy ? '' : 'disabled'} title="${escapeHtml(verifyPlusTitle)}">${escapeHtml(verifyPlusButtonText)}</button>
          </div>
        </div>
        <div class="upi-membership-check-section" data-upi-membership-section="free">
          <div class="upi-membership-check-head upi-membership-section-head">
            <span class="upi-membership-section-title">Free 组</span>
            <span class="upi-membership-section-meta">${escapeHtml(String(freeSectionCount))} 个账号 · 待兑换 ${escapeHtml(String(freeCount))} · 可兑换 ${escapeHtml(String(redeemableFreeCount))} · UPI候选 ${escapeHtml(String(redeemableUpiFreeCount))} · IDEAL候选 ${escapeHtml(String(redeemableIdealFreeCount))}${upiDailyLimitBlockedFreeCount ? ` · UPI日限 ${escapeHtml(String(upiDailyLimitBlockedFreeCount))}` : ''} · 失败 ${escapeHtml(String(failedCount))} · 封存 ${escapeHtml(String(lockedRedeemCount))} · 缺 AT ${escapeHtml(String(missingAtCount))}</span>
          </div>
          ${autoRunBusy ? '<div class="upi-membership-check-detail">自动注册中，允许导入 Free、删除安全行和一键兑换 CDK；补 AT、识别、登录、移动仍锁定。</div>' : ''}
          <div class="upi-membership-check-actions">
            <button class="btn btn-ghost btn-xs" type="button" data-upi-membership-import-free ${importActionBusy ? 'disabled' : ''}>导入 Free</button>
            <button class="btn btn-ghost btn-xs" type="button" data-upi-membership-export="free"${freeSectionRows.length || autoRunBusy ? '' : ' disabled'}>导出 Free(${escapeHtml(String(freeSectionRows.length))})</button>
            <button class="btn btn-ghost btn-xs" type="button" data-upi-membership-delete-group="free" ${deletableFreeRows.length && !deleteActionBusy ? '' : 'disabled'} title="${escapeHtml(deletableFreeTitle)}">删除 Free/失败(${escapeHtml(String(deletableFreeRows.length))})</button>
            <button class="btn btn-ghost btn-xs" type="button" data-upi-membership-fill-free-at ${missingAtCount && !mutatingBusy ? '' : 'disabled'}>一键补充 AT(${escapeHtml(String(missingAtCount))})</button>
            <button class="btn btn-primary btn-xs" type="button" data-upi-membership-identify-free-plus ${identifyPlusCount && !mutatingBusy ? '' : 'disabled'}>一键识别 Plus(${escapeHtml(String(identifyPlusCount))})</button>
            <button class="btn btn-ghost btn-xs" type="button" data-upi-membership-refresh-all-email-statuses ${refreshEmailStatusCount && !membershipBusy ? '' : 'disabled'} title="${escapeHtml(refreshEmailStatusTitle)}">一键刷新所有邮箱状态(${escapeHtml(String(refreshEmailStatusCount))})</button>
            <button class="btn btn-ghost btn-xs" type="button" data-upi-membership-redeem-free data-upi-membership-redeem-channel="upi" ${redeemUpiNowCount && !redeemActionBusy ? '' : 'disabled'} title="${escapeHtml(redeemUpiTitle)}">一键兑换 UPI(${escapeHtml(String(redeemUpiNowCount))}/${escapeHtml(String(redeemableUpiFreeCount))})</button>
            <button class="btn btn-ghost btn-xs" type="button" data-upi-membership-redeem-free data-upi-membership-redeem-channel="ideal" ${redeemIdealNowCount && !redeemActionBusy ? '' : 'disabled'} title="${escapeHtml(redeemIdealTitle)}">一键兑换 IDEAL(${escapeHtml(String(redeemIdealNowCount))}/${escapeHtml(String(redeemableIdealFreeCount))})</button>
            <button class="btn btn-primary btn-xs" type="button" data-upi-membership-redeem-all ${redeemAllNowCount && !redeemActionBusy ? '' : 'disabled'} title="${escapeHtml(redeemAllTitle)}">一键兑换全部(${escapeHtml(String(redeemAllNowCount))}/${escapeHtml(String(redeemableFreeCount))})</button>
            ${results.running ? '<button class="btn btn-ghost btn-xs" type="button" data-upi-membership-stop-check>停止补 AT/核验</button>' : '<button class="btn btn-ghost btn-xs" type="button" data-upi-membership-stop-check hidden>停止补 AT/核验</button>'}
            ${results.redeeming ? '<button class="btn btn-ghost btn-xs" type="button" data-upi-membership-stop-redeem>停止兑换</button>' : '<button class="btn btn-ghost btn-xs" type="button" data-upi-membership-stop-redeem hidden>停止兑换</button>'}
          </div>
          ${renderRows(freeSectionRows, 'free')}
        </div>
        <div class="upi-membership-check-section" data-upi-membership-section="paid-upi">
          <div class="upi-membership-check-head upi-membership-section-head">
            <span class="upi-membership-section-title">UPI Plus 组</span>
            <span class="upi-membership-section-meta">${escapeHtml(String(upiPaidRows.length))} 个账号</span>
          </div>
          <div class="upi-membership-check-actions">
            <button class="btn btn-ghost btn-xs" type="button" data-upi-membership-export="paid-upi"${upiPaidRows.length || autoRunBusy ? '' : ' disabled'}>导出 UPI Plus(${escapeHtml(String(upiPaidRows.length))})</button>
            <button class="btn btn-ghost btn-xs" type="button" data-upi-membership-delete-group="paid-upi" ${deletableUpiPaidRows.length && !deleteActionBusy ? '' : 'disabled'} title="${blockedUpiPaidDeleteCount ? escapeHtml(`将跳过 ${blockedUpiPaidDeleteCount} 条正在兑换或等待远端结果的账号`) : '删除 UPI Plus'}">删除 UPI Plus(${escapeHtml(String(deletableUpiPaidRows.length))})</button>
          </div>
          ${renderRows(upiPaidRows, 'paid-upi')}
        </div>
        <div class="upi-membership-check-section" data-upi-membership-section="paid-ideal">
          <div class="upi-membership-check-head upi-membership-section-head">
            <span class="upi-membership-section-title">IDEAL Plus 组</span>
            <span class="upi-membership-section-meta">${escapeHtml(String(idealPaidRows.length))} 个账号</span>
          </div>
          <div class="upi-membership-check-actions">
            <button class="btn btn-ghost btn-xs" type="button" data-upi-membership-export="paid-ideal"${idealPaidRows.length || autoRunBusy ? '' : ' disabled'}>导出 IDEAL Plus(${escapeHtml(String(idealPaidRows.length))})</button>
            <button class="btn btn-ghost btn-xs" type="button" data-upi-membership-delete-group="paid-ideal" ${deletableIdealPaidRows.length && !deleteActionBusy ? '' : 'disabled'} title="${blockedIdealPaidDeleteCount ? escapeHtml(`将跳过 ${blockedIdealPaidDeleteCount} 条正在兑换或等待远端结果的账号`) : '删除 IDEAL Plus'}">删除 IDEAL Plus(${escapeHtml(String(deletableIdealPaidRows.length))})</button>
          </div>
          ${renderRows(idealPaidRows, 'paid-ideal')}
        </div>
      `;
      restoreScrollTopAfterRender(
        container.querySelector('.upi-membership-check-list[data-upi-membership-list="free"]'),
        previousFreeScrollTop
      );
      restoreScrollTopAfterRender(
        container.querySelector('.upi-membership-check-list[data-upi-membership-list="paid-upi"]'),
        previousUpiPaidScrollTop
      );
      restoreScrollTopAfterRender(
        container.querySelector('.upi-membership-check-list[data-upi-membership-list="paid-ideal"]'),
        previousIdealPaidScrollTop
      );
    }

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
