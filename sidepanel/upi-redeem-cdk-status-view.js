(function attachSidepanelUpiRedeemCdkStatusView(root, factory) {
  const api = factory();
  root.SidepanelUpiRedeemCdkStatusView = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis, function createSidepanelUpiRedeemCdkStatusViewModule() {
  function createUpiRedeemCdkStatusView(deps = {}) {
    const { cdkPoolStateHelpers = {}, dom = {}, helpers = {} } = deps;
    const {
      parseUpiRedeemCdkeyPoolTextValue = () => [],
      normalizeRedeemChannel = (value) => ['ideal', 'pix'].includes(String(value || '').trim().toLowerCase()) ? String(value || '').trim().toLowerCase() : 'upi',
      getRedeemChannelLabel = (value) => String(value || 'upi').trim().toUpperCase(),
      getStoredCdkPoolText = () => '',
      getStoredCdkUsage = () => ({}),
      getUpiRedeemRemoteStatusLabel = () => '',
      isUpiRedeemDuplicateCdkeyMessage = () => false,
      isUpiRedeemCdkeySelectableForRedeem = () => false,
      getUpiRedeemRemoteStatusClass = () => '',
      canCancelUpiRedeemCdkeyJob = () => false,
      canRetryUpiRedeemCdkeyJob = () => false,
    } = cdkPoolStateHelpers;
    const {
      document: documentRef = typeof document !== 'undefined' ? document : null,
      window: windowRef = typeof window !== 'undefined' ? window : null,
      upiRedeemCdkeyPoolSummary = null,
      idealRedeemCdkeyPoolSummary = null,
      pixRedeemCdkeyPoolSummary = null,
      upiRedeemCdkeyStatusList = null,
      idealRedeemCdkeyStatusList = null,
      pixRedeemCdkeyStatusList = null,
    } = dom;
    const {
      getLatestState = () => ({}),
      isUpiRedeemCdkeyPoolMutationLocked = () => false,
      getUpiRedeemCdkeyUsageEntry = () => ({}),
      mergeCurrentUpiRedeemSubscriptionState = (entry) => entry,
      getUpiRedeemCdkeySubscriptionDisplay = () => null,
      markUpiRedeemCdkeyUnused = () => {},
      operateUpiRedeemCdkeyJob = () => Promise.resolve(),
      deleteUpiRedeemCdkey = () => {},
      updateUpiRedeemCdkeyEnabled = () => {},
      showToast = () => {},
      getCdkPoolInputForChannel = () => null,
      getImportCdkButtonForChannel = () => null,
      getDeleteAllCdkButtonForChannel = () => null,
    } = helpers;
    function restoreScrollTopAfterRender(node, scrollTop = 0) {
      if (!node || scrollTop <= 0) {
        return;
      }
      const restore = () => {
        const maxScrollTop = Math.max(0, node.scrollHeight - node.clientHeight);
        node.scrollTop = Math.min(scrollTop, maxScrollTop);
      };
      restore();
      if (typeof windowRef?.requestAnimationFrame === 'function') {
        windowRef.requestAnimationFrame(restore);
      }
    }
    function renderUpiRedeemCdkeyStatusList(stateValue = getLatestState(), channel = 'upi') {
      const redeemChannel = normalizeRedeemChannel(channel);
      const statusList = { upi: upiRedeemCdkeyStatusList, ideal: idealRedeemCdkeyStatusList, pix: pixRedeemCdkeyStatusList }[redeemChannel];
      if (!statusList || !documentRef) {
        return;
      }
      const poolText = getStoredCdkPoolText(stateValue, redeemChannel);
      const cdkeys = parseUpiRedeemCdkeyPoolTextValue(poolText);
      const usage = getStoredCdkUsage(stateValue, redeemChannel);
      const mutationLocked = isUpiRedeemCdkeyPoolMutationLocked();
      const previousScrollTop = statusList.scrollTop || 0;
      statusList.textContent = '';
      if (!cdkeys.length) {
        const empty = documentRef.createElement('div');
        empty.className = 'icloud-empty';
        empty.textContent = `导入 ${getRedeemChannelLabel(redeemChannel)} CDK 后显示启用和已用状态`;
        statusList.appendChild(empty);
        restoreScrollTopAfterRender(statusList, previousScrollTop);
        return;
      }
      cdkeys.forEach((cdkey) => {
        const entry = mergeCurrentUpiRedeemSubscriptionState(
          getUpiRedeemCdkeyUsageEntry(usage, cdkey),
          cdkey,
          stateValue
        );
        const used = Number(entry.usedAt) > 0;
        const enabled = entry.enabled !== false;
        const remoteStatus = String(entry.remoteStatus || '').trim().toLowerCase();
        const remoteLabel = getUpiRedeemRemoteStatusLabel(remoteStatus);
        const subscriptionDisplay = getUpiRedeemCdkeySubscriptionDisplay(entry);
        const duplicateCdkeyStatusDisplay = (
          isUpiRedeemDuplicateCdkeyMessage(remoteStatus)
          || isUpiRedeemDuplicateCdkeyMessage(entry.remoteMessage)
          || isUpiRedeemDuplicateCdkeyMessage(entry.lastError)
        ) ? {
          label: '已占用',
          className: 'pending',
          title: entry.remoteMessage || entry.lastError || '后端提示 CDK 重复提交，已禁止再次派发',
        } : null;
        const statusSubscriptionDisplay = remoteStatus ? null : subscriptionDisplay;
        const remoteStatusTitle = [
          remoteLabel || '',
          entry.remoteMessage || '',
          subscriptionDisplay?.title || '',
        ].map((text) => String(text || '').trim()).filter(Boolean).join('；');
        const item = documentRef.createElement('div');
        item.className = 'upi-redeem-cdkey-status-item';
        const label = documentRef.createElement('label');
        label.className = 'toggle-switch upi-redeem-cdkey-enabled-toggle';
        label.title = mutationLocked
          ? '自动流程运行中不能修改已保存 CDK 状态'
          : '控制该 CDK 是否参与自动兑换；已兑换或处理中 CDK 不会再次提交';
        const checkbox = documentRef.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = enabled;
        checkbox.disabled = mutationLocked;
        checkbox.setAttribute('aria-label', `启用 CDK ${cdkey}`);
        const track = documentRef.createElement('span');
        track.className = 'toggle-switch-track';
        const thumb = documentRef.createElement('span');
        thumb.className = 'toggle-switch-thumb';
        track.appendChild(thumb);
        label.appendChild(checkbox);
        label.appendChild(track);
        const cdkeyText = documentRef.createElement('span');
        cdkeyText.className = 'upi-redeem-cdkey-text mono';
        cdkeyText.textContent = cdkey;
        const status = documentRef.createElement(used ? 'button' : 'span');
        status.className = `icloud-tag ${duplicateCdkeyStatusDisplay?.className || statusSubscriptionDisplay?.className || getUpiRedeemRemoteStatusClass(remoteStatus, used, enabled)}${used ? ' upi-redeem-cdkey-status-action' : ''}`;
        status.textContent = duplicateCdkeyStatusDisplay?.label
          || statusSubscriptionDisplay?.label
          || remoteLabel
          || (used ? '已使用' : enabled ? '启用' : '停用');
        status.title = duplicateCdkeyStatusDisplay?.title
          || statusSubscriptionDisplay?.title
          || remoteStatusTitle
          || (used ? '点击清除旧的已用标记；已确认兑换的 CDK 不会再次提交' : '远端状态');
        if (used) {
          status.type = 'button';
          status.disabled = mutationLocked;
          status.setAttribute('aria-label', `将 CDK ${cdkey} 设为未用`);
          status.addEventListener('click', () => {
            markUpiRedeemCdkeyUnused(cdkey, redeemChannel);
          });
        }
        const actionCell = documentRef.createElement('div');
        actionCell.className = 'upi-redeem-cdkey-actions';
        if (canCancelUpiRedeemCdkeyJob(entry, used)) {
          const cancelButton = documentRef.createElement('button');
          cancelButton.type = 'button';
          cancelButton.className = 'btn btn-ghost btn-xs upi-redeem-cdkey-job-action';
          cancelButton.textContent = '取消';
          cancelButton.title = '调用后端 cdkey-jobs/cancel 取消该 CDK 任务';
          cancelButton.setAttribute('aria-label', `取消 CDK 任务 ${cdkey}`);
          cancelButton.addEventListener('click', () => {
            cancelButton.disabled = true;
            operateUpiRedeemCdkeyJob(cdkey, 'cancel', redeemChannel).catch((error) => {
              showToast(`取消 CDK 任务失败：${error.message}`, 'error');
            }).finally(() => {
              if (cancelButton.isConnected) {
                cancelButton.disabled = false;
              }
            });
          });
          actionCell.appendChild(cancelButton);
        }
        if (!mutationLocked && canRetryUpiRedeemCdkeyJob(entry, used)) {
          const retryButton = documentRef.createElement('button');
          retryButton.type = 'button';
          retryButton.className = 'btn btn-primary btn-xs upi-redeem-cdkey-job-action';
          retryButton.textContent = '重试';
          retryButton.title = '调用后端 cdkey-jobs/retry，复用已绑定的 access_token 重新入列';
          retryButton.setAttribute('aria-label', `重试 CDK 任务 ${cdkey}`);
          retryButton.addEventListener('click', () => {
            retryButton.disabled = true;
            operateUpiRedeemCdkeyJob(cdkey, 'retry', redeemChannel).catch((error) => {
              showToast(`重试 CDK 任务失败：${error.message}`, 'error');
            }).finally(() => {
              if (retryButton.isConnected) {
                retryButton.disabled = false;
              }
            });
          });
          actionCell.appendChild(retryButton);
        }
        const deleteButton = documentRef.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'btn btn-danger btn-xs upi-redeem-cdkey-delete-action';
        deleteButton.textContent = '删除';
        deleteButton.disabled = mutationLocked;
        deleteButton.title = mutationLocked ? '自动流程运行中不能删除已保存 CDK' : '点击删除该 CDK';
        deleteButton.setAttribute('aria-label', `删除 CDK ${cdkey}`);
        deleteButton.addEventListener('click', () => {
          deleteUpiRedeemCdkey(cdkey, redeemChannel);
        });
        checkbox.addEventListener('change', () => {
          updateUpiRedeemCdkeyEnabled(cdkey, checkbox.checked, redeemChannel);
        });
        item.appendChild(label);
        item.appendChild(cdkeyText);
        item.appendChild(status);
        actionCell.appendChild(deleteButton);
        item.appendChild(actionCell);
        statusList.appendChild(item);
      });
      restoreScrollTopAfterRender(statusList, previousScrollTop);
    }
    function updateUpiRedeemCdkeyPoolSummary(stateValue = getLatestState(), options = {}) {
      const redeemChannel = normalizeRedeemChannel(options.channel || options.redeemChannel);
      const summary = { upi: upiRedeemCdkeyPoolSummary, ideal: idealRedeemCdkeyPoolSummary, pix: pixRedeemCdkeyPoolSummary }[redeemChannel];
      if (!summary) {
        return;
      }
      const poolText = getStoredCdkPoolText(stateValue, redeemChannel);
      const cdkeys = parseUpiRedeemCdkeyPoolTextValue(poolText);
      const usage = getStoredCdkUsage(stateValue, redeemChannel);
      const enabledCount = cdkeys.filter((cdkey) => getUpiRedeemCdkeyUsageEntry(usage, cdkey).enabled !== false).length;
      const availableCount = cdkeys.filter((cdkey) => {
        const entry = mergeCurrentUpiRedeemSubscriptionState(
          getUpiRedeemCdkeyUsageEntry(usage, cdkey),
          cdkey,
          stateValue
        );
        return isUpiRedeemCdkeySelectableForRedeem(entry);
      }).length;
      summary.textContent = `总数 ${cdkeys.length} / 启用 ${enabledCount} / 可用 ${availableCount}`;
      const mutationLocked = isUpiRedeemCdkeyPoolMutationLocked();
      const input = getCdkPoolInputForChannel(redeemChannel);
      const importButton = getImportCdkButtonForChannel(redeemChannel);
      const deleteAllButton = getDeleteAllCdkButtonForChannel(redeemChannel);
      if (input) {
        input.disabled = false;
        input.title = mutationLocked ? '自动流程运行中允许追加导入新的 CDK' : '';
      }
      if (importButton) {
        importButton.disabled = false;
        importButton.title = mutationLocked ? '自动流程运行中允许追加导入新的 CDK' : '';
      }
      if (deleteAllButton) {
        deleteAllButton.disabled = mutationLocked || cdkeys.length === 0;
        deleteAllButton.title = mutationLocked ? '自动流程运行中不能删除 CDK 池' : '';
      }
      if (!options.skipRender) {
        renderUpiRedeemCdkeyStatusList(stateValue, redeemChannel);
      }
    }
    return { renderUpiRedeemCdkeyStatusList, updateUpiRedeemCdkeyPoolSummary };
  }
  return { createUpiRedeemCdkStatusView };
});
