(function attachSidepanelAccountRecordsMembershipResultsRenderer(globalScope) {
  function createAccountRecordsMembershipResultsRenderer(context = {}) {
    const dom = context.dom || {};
    const state = context.state || {};
    const escapeHtml = typeof context.escapeHtml === 'function' ? context.escapeHtml : fallbackEscapeHtml;
    const formatAccountRecordTime = typeof context.formatAccountRecordTime === 'function' ? context.formatAccountRecordTime : () => '--:--';
    const setNodeHidden = typeof context.setNodeHidden === 'function' ? context.setNodeHidden : fallbackSetNodeHidden;
    const restoreScrollTopAfterRender = typeof context.restoreScrollTopAfterRender === 'function' ? context.restoreScrollTopAfterRender : () => {};
    const getMembershipResults = typeof context.getUpiCredentialMembershipCheckResults === 'function' ? context.getUpiCredentialMembershipCheckResults : () => ({ items: [] });
    const buildRows = typeof context.buildUpiCredentialMembershipDisplayRows === 'function' ? context.buildUpiCredentialMembershipDisplayRows : () => [];
    const normalizeEmail = typeof context.normalizeUpiCredentialMembershipEmail === 'function' ? context.normalizeUpiCredentialMembershipEmail : (value = '') => String(value || '').trim().toLowerCase();
    const normalizeText = typeof context.normalizeUpiCredentialMembershipText === 'function' ? context.normalizeUpiCredentialMembershipText : (value = '') => String(value || '').trim();
    const isActiveRedeemRow = typeof context.isActiveUpiCredentialMembershipRedeemRow === 'function' ? context.isActiveUpiCredentialMembershipRedeemRow : () => false;
    const isAutoRunBusy = typeof context.isAutoRunRecordDisplayRunning === 'function' ? context.isAutoRunRecordDisplayRunning : () => false;
    const summarizeRows = typeof context.summarizeMembershipViewModelRows === 'function' ? context.summarizeMembershipViewModelRows : () => ({ free: 0, 'upi-plus': 0, 'ideal-plus': 0, 'pix-plus': 0 });
    const getUiGroup = typeof context.getUpiCredentialMembershipUiGroup === 'function' ? context.getUpiCredentialMembershipUiGroup : () => 'free';
    const getFreeExportIncludeVerificationUrl = typeof context.getFreeExportIncludeVerificationUrl === 'function' ? context.getFreeExportIncludeVerificationUrl : () => true;
    const getFailureBlockedRows = typeof context.getChannelFailureLimitBlockedFreeRows === 'function' ? context.getChannelFailureLimitBlockedFreeRows : () => [];
    const isDailyLimitBlocked = typeof context.isRedeemChannelDailyLimitBlocked === 'function' ? context.isRedeemChannelDailyLimitBlocked : () => false;
    const isRedeemLocked = typeof context.isUpiCredentialMembershipRedeemLocked === 'function' ? context.isUpiCredentialMembershipRedeemLocked : () => false;
    const hasLoginMaterial = typeof context.hasUpiCredentialMembershipLoginMaterial === 'function' ? context.hasUpiCredentialMembershipLoginMaterial : () => false;
    const getRowStatusMeta = typeof context.getUpiCredentialMembershipRowStatusMeta === 'function' ? context.getUpiCredentialMembershipRowStatusMeta : () => ({ className: '', label: '', detail: '' });
    const getCancelControl = typeof context.getUpiCredentialMembershipRedeemCancelControl === 'function' ? context.getUpiCredentialMembershipRedeemCancelControl : () => ({});
    const getRedeemProgressMeta = typeof context.getUpiCredentialMembershipRedeemProgressMeta === 'function' ? context.getUpiCredentialMembershipRedeemProgressMeta : () => ({});
    const renderRedeemProgress = typeof context.renderUpiCredentialMembershipRedeemProgress === 'function' ? context.renderUpiCredentialMembershipRedeemProgress : () => '';
    const getAvailableCdkeyCount = typeof context.getAvailableUpiRedeemCdkeyCount === 'function' ? context.getAvailableUpiRedeemCdkeyCount : () => 0;
    const isRedeemableFreeRow = typeof context.isRedeemableFreeUpiCredentialMembershipRow === 'function' ? context.isRedeemableFreeUpiCredentialMembershipRow : () => false;
    const isRedeemableForChannel = typeof context.isRedeemableFreeUpiCredentialMembershipRowForChannel === 'function' ? context.isRedeemableFreeUpiCredentialMembershipRowForChannel : () => false;
    const getRedeemChannelLabel = typeof context.getRedeemChannelLabel === 'function' ? context.getRedeemChannelLabel : (value = '') => String(value || '').trim().toUpperCase() || 'UPI';
    const renderMembershipFlow = typeof context.renderUpiCredentialMembershipFlow === 'function' ? context.renderUpiCredentialMembershipFlow : () => '';
    const getFlowTitle = typeof context.getUpiCredentialMembershipFlowTitle === 'function' ? context.getUpiCredentialMembershipFlowTitle : () => '处理中';
    const getCheckBusy = typeof context.getUpiCredentialMembershipCheckBusy === 'function' ? context.getUpiCredentialMembershipCheckBusy : () => false;
    const getRedeemBusy = typeof context.getUpiCredentialMembershipRedeemBusy === 'function' ? context.getUpiCredentialMembershipRedeemBusy : () => false;
    const getRedeemAllBusy = typeof context.getUpiCredentialMembershipAllRedeemBusy === 'function' ? context.getUpiCredentialMembershipAllRedeemBusy : () => false;
    const getCheckingEmail = typeof context.getUpiCredentialMembershipCheckingEmail === 'function' ? context.getUpiCredentialMembershipCheckingEmail : () => '';
    const getLoginEmail = typeof context.getUpiCredentialMembershipLoginEmail === 'function' ? context.getUpiCredentialMembershipLoginEmail : () => '';
    const redeemChannelFailureLimit = Math.max(1, Math.floor(Number(context.redeemChannelFailureLimit) || 3));

    function getProgressText(results) {
      if (results.running) return `核验中 ${results.completed}/${results.total || results.completed}`;
      if (results.redeeming) return `兑换中 ${results.redeemCompleted}/${results.redeemTotal || results.redeemCompleted}`;
      if (results.redeemStoppedAt) return `兑换已停止 ${results.redeemCompleted}/${results.redeemTotal || results.redeemCompleted}`;
      if (results.stoppedAt) return `核验已停止 ${results.completed}/${results.total || results.completed}`;
      return `已核验 ${results.completed || results.items.length}/${results.total || results.items.length}`;
    }

    function getPaidGroupChannel(group = '') {
      if (group === 'paid-ideal') return 'ideal';
      if (group === 'paid-pix') return 'pix';
      return 'upi';
    }

    function renderRows(groupRows, group, results, flags) {
      return `
        <div class="upi-membership-check-status-header"><span>启用</span><span>邮箱</span><span>状态</span><span>登录</span><span>移动</span><span>兑换</span><span>删除</span></div>
        <div class="upi-membership-check-list" data-upi-membership-list="${escapeHtml(group)}">
          ${groupRows.length ? groupRows.map((row) => {
            const meta = getRowStatusMeta(row, results);
            const email = normalizeEmail(row.email);
            const isRowChecking = normalizeEmail(getCheckingEmail()) === email;
            const isRowLoggingIn = normalizeEmail(getLoginEmail()) === email;
            const isFreeGroup = group === 'free';
            const deleteLockedByRedeem = isActiveRedeemRow(row, results);
            const deleteChannel = group === 'free' ? normalizeText(row.redeemChannel || row.channel) : getPaidGroupChannel(group);
            const titleParts = [email, meta.detail, row.accessTokenMasked ? `AT ${row.accessTokenMasked}` : '', row.checkedAt ? formatAccountRecordTime(row.checkedAt) : ''].filter(Boolean);
            return `
              <div class="upi-membership-check-item" data-upi-membership-email="${escapeHtml(email)}" title="${escapeHtml(titleParts.join('\n'))}">
                <label class="toggle-switch upi-membership-check-enabled-toggle">
                  <input type="checkbox" data-upi-membership-toggle="${escapeHtml(email)}" ${row.enabled === false ? '' : 'checked'} ${flags.mutatingBusy ? 'disabled' : ''} aria-label="启用核验 ${escapeHtml(email)}" />
                  <span class="toggle-switch-track"><span class="toggle-switch-thumb"></span></span>
                </label>
                <button class="upi-membership-check-email upi-membership-check-email-action mono" type="button" data-upi-membership-check-one="${escapeHtml(email)}" ${flags.mutatingBusy || isRowChecking || row.enabled === false ? 'disabled' : ''} title="点击检测该账号是否已开通 Plus/Pro/Team">${escapeHtml(email)}</button>
                <button class="icloud-tag upi-membership-check-status-action ${escapeHtml(meta.className)}" type="button" data-upi-membership-check-one="${escapeHtml(email)}" ${flags.mutatingBusy || isRowChecking || row.enabled === false ? 'disabled' : ''} aria-label="${escapeHtml(`检测 ${email} 是否有 Plus`)}" title="点击检测该账号是否已开通 Plus/Pro/Team">${escapeHtml(meta.label)}</button>
                <button class="icloud-tag upi-membership-check-login-action" type="button" data-upi-membership-login="${escapeHtml(email)}" ${flags.mutatingBusy || isRowLoggingIn || row.enabled === false || !hasLoginMaterial(row) ? 'disabled' : ''} title="登录">登录</button>
                <button class="icloud-tag upi-membership-check-move-action" type="button" data-upi-membership-move-group="${escapeHtml(email)}" data-upi-membership-move-target="${isFreeGroup ? 'paid' : 'free'}" ${flags.mutatingBusy ? 'disabled' : ''}>${escapeHtml(isFreeGroup ? '移到 Plus' : '移到 Free')}</button>
                ${renderRedeemProgress(row, getRedeemProgressMeta(row, results), getCancelControl(row, results))}
                <button class="icloud-tag danger upi-membership-check-delete-action" type="button" data-upi-membership-delete="${escapeHtml(email)}" data-upi-membership-delete-channel="${escapeHtml(deleteChannel)}" ${flags.deleteActionBusy || deleteLockedByRedeem ? 'disabled' : ''} title="${escapeHtml(deleteLockedByRedeem ? '正在兑换或等待远端结果，不能删除；请先取消对应 CDK 任务。' : '删除')}">删除</button>
              </div>
            `;
          }).join('') : `<div class="upi-membership-check-empty">${escapeHtml(`${group === 'free' ? 'Free' : `${getRedeemChannelLabel(getPaidGroupChannel(group))} Plus`} 分组暂无账号`)}</div>`}
        </div>
      `;
    }

    function renderUpiCredentialMembershipCheckResults() {
      const container = dom.upiCredentialMembershipCheckResults;
      if (!container) return;
      const results = getMembershipResults();
      const rows = buildRows(results);
      const hasActivity = rows.length > 0 || results.running || results.redeeming || results.stoppedAt || results.redeemStoppedAt;
      const currentFlowEmail = normalizeEmail(results.flowStageEmail);
      const currentFlowTitle = getFlowTitle(results.flowStage, results);
      const membershipBusy = results.running || results.redeeming || getCheckBusy() || getRedeemBusy() || getRedeemAllBusy();
      const autoRunBusy = isAutoRunBusy(state.getLatestState?.() || {});
      const flags = { mutatingBusy: membershipBusy || autoRunBusy, deleteActionBusy: membershipBusy };
      const summary = summarizeRows(rows);
      const freeSectionRows = rows.filter((row) => getUiGroup(row) === 'free');
      const paidRows = rows.filter((row) => getUiGroup(row) !== 'free');
      const upiPaidRows = rows.filter((row) => getUiGroup(row) === 'paid-upi');
      const idealPaidRows = rows.filter((row) => getUiGroup(row) === 'paid-ideal');
      const pixPaidRows = rows.filter((row) => getUiGroup(row) === 'paid-pix');
      const deletableFreeRows = freeSectionRows.filter((row) => !isActiveRedeemRow(row, results));
      const deletableUpiPaidRows = upiPaidRows.filter((row) => !isActiveRedeemRow(row, results));
      const deletableIdealPaidRows = idealPaidRows.filter((row) => !isActiveRedeemRow(row, results));
      const deletablePixPaidRows = pixPaidRows.filter((row) => !isActiveRedeemRow(row, results));
      const allFreeRows = freeSectionRows.filter((row) => normalizeText(row.status).toLowerCase() === 'free');
      const failedRows = freeSectionRows.filter((row) => ['failed'].includes(normalizeText(row.status).toLowerCase()) || ['failed'].includes(normalizeText(row.redeemStatus).toLowerCase()));
      const freeRows = allFreeRows.filter((row) => normalizeText(row.redeemStatus).toLowerCase() !== 'failed');
      const missingAtCount = freeSectionRows.filter((row) => row.enabled !== false && !normalizeText(row.accessToken)).length;
      const identifyPlusCount = freeSectionRows.filter((row) => row.enabled !== false && normalizeText(row.accessToken)).length;
      const redeemableFreeRows = allFreeRows.filter(isRedeemableFreeRow);
      const redeemableUpiFreeRows = allFreeRows.filter((row) => isRedeemableForChannel(row, 'upi'));
      const redeemableIdealFreeRows = allFreeRows.filter((row) => isRedeemableForChannel(row, 'ideal'));
      const redeemablePixFreeRows = allFreeRows.filter((row) => isRedeemableForChannel(row, 'pix'));
      const idealFailureBlockedFreeCount = getFailureBlockedRows(allFreeRows, 'ideal').length;
      const upiDailyLimitBlockedFreeCount = allFreeRows.filter((row) => isDailyLimitBlocked(row, 'upi')).length;
      const lockedRedeemCount = allFreeRows.filter(isRedeemLocked).length;
      const deletableFailedFreeCount = deletableFreeRows.filter((row) => ['failed'].includes(normalizeText(row.status).toLowerCase()) || ['failed'].includes(normalizeText(row.redeemStatus).toLowerCase())).length;
      const deletableLockedFreeCount = deletableFreeRows.filter((row) => normalizeText(row.status).toLowerCase() === 'free' && isRedeemLocked(row)).length;
      const availableUpiCdkeyCount = getAvailableCdkeyCount(state.getLatestState?.() || {}, 'upi');
      const availableIdealCdkeyCount = getAvailableCdkeyCount(state.getLatestState?.() || {}, 'ideal');
      const availablePixCdkeyCount = getAvailableCdkeyCount(state.getLatestState?.() || {}, 'pix');
      const redeemUpiNowCount = Math.min(redeemableUpiFreeRows.length, availableUpiCdkeyCount);
      const redeemIdealNowCount = Math.min(redeemableIdealFreeRows.length, availableIdealCdkeyCount);
      const redeemPixNowCount = Math.min(redeemablePixFreeRows.length, availablePixCdkeyCount);
      const redeemAllNowCount = Math.max(redeemUpiNowCount, redeemIdealNowCount, redeemPixNowCount);
      const verifyPlusCount = paidRows.filter((row) => row.enabled !== false && normalizeText(row.accessToken)).length;
      const verifyPlusTotalCount = paidRows.filter((row) => row.enabled !== false).length;
      const verifyPlusMissingAtCount = Math.max(0, verifyPlusTotalCount - verifyPlusCount);
      const previousScrollTop = {
        free: container.querySelector('.upi-membership-check-list[data-upi-membership-list="free"]')?.scrollTop || 0,
        upi: container.querySelector('.upi-membership-check-list[data-upi-membership-list="paid-upi"]')?.scrollTop || 0,
        ideal: container.querySelector('.upi-membership-check-list[data-upi-membership-list="paid-ideal"]')?.scrollTop || 0,
        pix: container.querySelector('.upi-membership-check-list[data-upi-membership-list="paid-pix"]')?.scrollTop || 0,
      };
      setNodeHidden(container, false);
      const includeVerificationUrl = getFreeExportIncludeVerificationUrl();
      const verificationUrlToggle = `<button
        class="btn btn-ghost btn-xs${includeVerificationUrl ? ' is-active' : ''}"
        type="button"
        data-upi-membership-toggle-export-verification-url
        aria-pressed="${includeVerificationUrl ? 'true' : 'false'}"
        title="控制 Free TXT 导出是否包含邮箱取件地址"
      >取件地址：${includeVerificationUrl ? '开' : '关'}</button>`;
      container.innerHTML = `
        <div class="upi-membership-check-head">
          <span>${escapeHtml(`${getProgressText(results)}${currentFlowEmail ? ` · 当前 ${currentFlowEmail}${currentFlowTitle ? ` · ${currentFlowTitle}` : ''}` : ''}`)} · 启用 ${escapeHtml(String(rows.filter((row) => row.enabled !== false).length))} / 有会员 ${escapeHtml(String((summary['upi-plus'] || 0) + (summary['ideal-plus'] || 0) + (summary['pix-plus'] || 0)))} / 无会员 ${escapeHtml(String(freeRows.length))} / 失败 ${escapeHtml(String(failedRows.length))}</span>
          ${results.updatedAt ? `<span class="mono">${escapeHtml(formatAccountRecordTime(results.updatedAt))}</span>` : ''}
        </div>
        ${hasActivity ? renderMembershipFlow(results, rows) : ''}
        <div class="upi-membership-check-detail">提示：点击账号邮箱或状态标签，可以单独检测该账号是否是 Plus/Pro/Team 会员。</div>
        <div class="upi-membership-check-section" data-upi-membership-section="paid-all-actions">
          <div class="upi-membership-check-head upi-membership-section-head"><span class="upi-membership-section-title">全部 Plus 操作</span><span class="upi-membership-section-meta">${escapeHtml(String(paidRows.length))} 个账号</span></div>
          <div class="upi-membership-check-actions"><button class="btn btn-ghost btn-xs" type="button" data-upi-membership-export="paid-all"${paidRows.length || autoRunBusy ? '' : ' disabled'}>导出全部 Plus(${escapeHtml(String(paidRows.length))})</button><button class="btn btn-primary btn-xs" type="button" data-upi-membership-verify-plus ${verifyPlusCount && !flags.mutatingBusy ? '' : 'disabled'} title="${escapeHtml(verifyPlusMissingAtCount ? `当前可验证 ${verifyPlusCount}/${verifyPlusTotalCount} 个 Plus；${verifyPlusMissingAtCount} 个缺少 AT，需要先补 AT 或重新登录后才能验证。` : '一键验证全部 Plus')}">${escapeHtml(verifyPlusMissingAtCount ? `一键验证全部 Plus(${verifyPlusCount}/${verifyPlusTotalCount})` : `一键验证全部 Plus(${verifyPlusCount})`)}</button></div>
        </div>
        <div class="upi-membership-check-section" data-upi-membership-section="free">
          <div class="upi-membership-check-head upi-membership-section-head"><span class="upi-membership-section-title">Free 组</span><span class="upi-membership-section-meta">${escapeHtml(String(summary.free))} 个账号 · 待兑换 ${escapeHtml(String(freeRows.length))} · 可兑换 ${escapeHtml(String(redeemableFreeRows.length))} · UPI候选 ${escapeHtml(String(redeemableUpiFreeRows.length))} · IDEAL候选 ${escapeHtml(String(redeemableIdealFreeRows.length))} · PIX候选 ${escapeHtml(String(redeemablePixFreeRows.length))}${upiDailyLimitBlockedFreeCount ? ` · UPI日限 ${escapeHtml(String(upiDailyLimitBlockedFreeCount))}` : ''} · 失败 ${escapeHtml(String(failedRows.length))} · 封存 ${escapeHtml(String(lockedRedeemCount))} · 缺 AT ${escapeHtml(String(missingAtCount))}</span></div>
          ${autoRunBusy ? '<div class="upi-membership-check-detail">自动注册中，允许导入 Free、删除安全行和一键兑换 CDK；补 AT、识别、登录、移动仍锁定。</div>' : ''}
          <div class="upi-membership-check-actions">
            <button class="btn btn-ghost btn-xs" type="button" data-upi-membership-import-free ${membershipBusy ? 'disabled' : ''}>导入 Free</button><button class="btn btn-ghost btn-xs" type="button" data-upi-membership-export="free"${freeSectionRows.length || autoRunBusy ? '' : ' disabled'}>导出 Free(${escapeHtml(String(freeSectionRows.length))})</button>${verificationUrlToggle}<button class="btn btn-ghost btn-xs" type="button" data-upi-membership-delete-group="free" ${deletableFreeRows.length && !membershipBusy ? '' : 'disabled'} title="${escapeHtml([`删除 Free/失败组中非兑换中的账号 ${deletableFreeRows.length} 条`, `可兑换账号 ${redeemableFreeRows.length} 条`, deletableLockedFreeCount ? `含封存账号 ${deletableLockedFreeCount} 条` : '', deletableFailedFreeCount ? `含失败账号 ${deletableFailedFreeCount} 条` : '', freeSectionRows.length - deletableFreeRows.length ? `将跳过 ${freeSectionRows.length - deletableFreeRows.length} 条正在兑换或等待远端结果的账号` : ''].filter(Boolean).join('；'))}">删除 Free/失败(${escapeHtml(String(deletableFreeRows.length))})</button>
            <button class="btn btn-ghost btn-xs" type="button" data-upi-membership-fill-free-at ${missingAtCount && !flags.mutatingBusy ? '' : 'disabled'}>一键补充 AT(${escapeHtml(String(missingAtCount))})</button><button class="btn btn-primary btn-xs" type="button" data-upi-membership-identify-free-plus ${identifyPlusCount && !flags.mutatingBusy ? '' : 'disabled'}>一键识别 Plus(${escapeHtml(String(identifyPlusCount))})</button><button class="btn btn-ghost btn-xs" type="button" data-upi-membership-refresh-all-email-statuses ${identifyPlusCount && !membershipBusy ? '' : 'disabled'} title="${escapeHtml(missingAtCount ? `按已保存 AT 检测 Free/失败组邮箱会员状态；当前可刷新 ${identifyPlusCount} 个，${missingAtCount} 个缺少 AT。` : '按已保存 AT 检测 Free/失败组邮箱会员状态')}">一键刷新所有邮箱状态(${escapeHtml(String(identifyPlusCount))})</button>
            <button class="btn btn-ghost btn-xs" type="button" data-upi-membership-redeem-free data-upi-membership-redeem-channel="upi" ${redeemUpiNowCount && !membershipBusy ? '' : 'disabled'} title="${escapeHtml(`UPI 可用 CDK ${availableUpiCdkeyCount}；UPI 候选 ${redeemableUpiFreeRows.length}；总可兑换 ${redeemableFreeRows.length}；普通 UPI 失败不会禁用 UPI${upiDailyLimitBlockedFreeCount ? `；${upiDailyLimitBlockedFreeCount} 个账号明确返回今日提交次数上限，已转 IDEAL 候选` : ''}`)}">一键兑换 UPI(${escapeHtml(String(redeemUpiNowCount))}/${escapeHtml(String(redeemableUpiFreeRows.length))})</button><button class="btn btn-ghost btn-xs" type="button" data-upi-membership-redeem-free data-upi-membership-redeem-channel="ideal" ${redeemIdealNowCount && !membershipBusy ? '' : 'disabled'} title="${escapeHtml(`IDEAL 可用 CDK ${availableIdealCdkeyCount}；IDEAL 候选 ${redeemableIdealFreeRows.length}；总可兑换 ${redeemableFreeRows.length}${idealFailureBlockedFreeCount ? `；${idealFailureBlockedFreeCount} 个账号 IDEAL 已失败满 ${redeemChannelFailureLimit} 次或已封存` : ''}`)}">一键兑换 IDEAL(${escapeHtml(String(redeemIdealNowCount))}/${escapeHtml(String(redeemableIdealFreeRows.length))})</button><button class="btn btn-ghost btn-xs" type="button" data-upi-membership-redeem-free data-upi-membership-redeem-channel="pix" ${redeemPixNowCount && !membershipBusy ? '' : 'disabled'} title="${escapeHtml(`PIX 可用 CDK ${availablePixCdkeyCount}；PIX 候选 ${redeemablePixFreeRows.length}；总可兑换 ${redeemableFreeRows.length}`)}">一键兑换 PIX(${escapeHtml(String(redeemPixNowCount))}/${escapeHtml(String(redeemablePixFreeRows.length))})</button><button class="btn btn-primary btn-xs" type="button" data-upi-membership-redeem-all data-upi-membership-redeem-upi-candidates="${escapeHtml(String(redeemableUpiFreeRows.length))}" data-upi-membership-redeem-upi-cdkeys="${escapeHtml(String(availableUpiCdkeyCount))}" data-upi-membership-redeem-upi-count="${escapeHtml(String(redeemUpiNowCount))}" data-upi-membership-redeem-ideal-candidates="${escapeHtml(String(redeemableIdealFreeRows.length))}" data-upi-membership-redeem-ideal-cdkeys="${escapeHtml(String(availableIdealCdkeyCount))}" data-upi-membership-redeem-ideal-count="${escapeHtml(String(redeemIdealNowCount))}" data-upi-membership-redeem-pix-candidates="${escapeHtml(String(redeemablePixFreeRows.length))}" data-upi-membership-redeem-pix-cdkeys="${escapeHtml(String(availablePixCdkeyCount))}" data-upi-membership-redeem-pix-count="${escapeHtml(String(redeemPixNowCount))}" ${redeemAllNowCount && !membershipBusy ? '' : 'disabled'} title="${escapeHtml(`点击后选择要使用的卡密池；UPI 可兑换 ${redeemUpiNowCount}，IDEAL 可兑换 ${redeemIdealNowCount}，PIX 可兑换 ${redeemPixNowCount}。只执行所选渠道。`)}">一键兑换全部(${escapeHtml(String(redeemAllNowCount))}/${escapeHtml(String(redeemableFreeRows.length))})</button>
            ${results.running ? '<button class="btn btn-ghost btn-xs" type="button" data-upi-membership-stop-check>停止补 AT/核验</button>' : '<button class="btn btn-ghost btn-xs" type="button" data-upi-membership-stop-check hidden>停止补 AT/核验</button>'}${results.redeeming ? '<button class="btn btn-ghost btn-xs" type="button" data-upi-membership-stop-redeem>停止兑换</button>' : '<button class="btn btn-ghost btn-xs" type="button" data-upi-membership-stop-redeem hidden>停止兑换</button>'}
          </div>
          ${renderRows(freeSectionRows, 'free', results, flags)}
        </div>
        <div class="upi-membership-check-section" data-upi-membership-section="paid-upi"><div class="upi-membership-check-head upi-membership-section-head"><span class="upi-membership-section-title">UPI Plus 组</span><span class="upi-membership-section-meta">${escapeHtml(String(upiPaidRows.length))} 个账号</span></div><div class="upi-membership-check-actions"><button class="btn btn-ghost btn-xs" type="button" data-upi-membership-export="paid-upi"${upiPaidRows.length || autoRunBusy ? '' : ' disabled'}>导出 UPI Plus(${escapeHtml(String(upiPaidRows.length))})</button><button class="btn btn-ghost btn-xs" type="button" data-upi-membership-delete-group="paid-upi" ${deletableUpiPaidRows.length && !membershipBusy ? '' : 'disabled'} title="${(upiPaidRows.length - deletableUpiPaidRows.length) ? escapeHtml(`将跳过 ${upiPaidRows.length - deletableUpiPaidRows.length} 条正在兑换或等待远端结果的账号`) : '删除 UPI Plus'}">删除 UPI Plus(${escapeHtml(String(deletableUpiPaidRows.length))})</button></div>${renderRows(upiPaidRows, 'paid-upi', results, flags)}</div>
        <div class="upi-membership-check-section" data-upi-membership-section="paid-ideal"><div class="upi-membership-check-head upi-membership-section-head"><span class="upi-membership-section-title">IDEAL Plus 组</span><span class="upi-membership-section-meta">${escapeHtml(String(idealPaidRows.length))} 个账号</span></div><div class="upi-membership-check-actions"><button class="btn btn-ghost btn-xs" type="button" data-upi-membership-export="paid-ideal"${idealPaidRows.length || autoRunBusy ? '' : ' disabled'}>导出 IDEAL Plus(${escapeHtml(String(idealPaidRows.length))})</button><button class="btn btn-ghost btn-xs" type="button" data-upi-membership-delete-group="paid-ideal" ${deletableIdealPaidRows.length && !membershipBusy ? '' : 'disabled'} title="${(idealPaidRows.length - deletableIdealPaidRows.length) ? escapeHtml(`将跳过 ${idealPaidRows.length - deletableIdealPaidRows.length} 条正在兑换或等待远端结果的账号`) : '删除 IDEAL Plus'}">删除 IDEAL Plus(${escapeHtml(String(deletableIdealPaidRows.length))})</button></div>${renderRows(idealPaidRows, 'paid-ideal', results, flags)}</div>
        <div class="upi-membership-check-section" data-upi-membership-section="paid-pix"><div class="upi-membership-check-head upi-membership-section-head"><span class="upi-membership-section-title">PIX Plus 组</span><span class="upi-membership-section-meta">${escapeHtml(String(pixPaidRows.length))} 个账号</span></div><div class="upi-membership-check-actions"><button class="btn btn-ghost btn-xs" type="button" data-upi-membership-export="paid-pix"${pixPaidRows.length || autoRunBusy ? '' : ' disabled'}>导出 PIX Plus(${escapeHtml(String(pixPaidRows.length))})</button><button class="btn btn-ghost btn-xs" type="button" data-upi-membership-delete-group="paid-pix" ${deletablePixPaidRows.length && !membershipBusy ? '' : 'disabled'} title="${(pixPaidRows.length - deletablePixPaidRows.length) ? escapeHtml(`将跳过 ${pixPaidRows.length - deletablePixPaidRows.length} 条正在兑换或等待远端结果的账号`) : '删除 PIX Plus'}">删除 PIX Plus(${escapeHtml(String(deletablePixPaidRows.length))})</button></div>${renderRows(pixPaidRows, 'paid-pix', results, flags)}</div>
      `;
      restoreScrollTopAfterRender(container.querySelector('.upi-membership-check-list[data-upi-membership-list="free"]'), previousScrollTop.free);
      restoreScrollTopAfterRender(container.querySelector('.upi-membership-check-list[data-upi-membership-list="paid-upi"]'), previousScrollTop.upi);
      restoreScrollTopAfterRender(container.querySelector('.upi-membership-check-list[data-upi-membership-list="paid-ideal"]'), previousScrollTop.ideal);
      restoreScrollTopAfterRender(container.querySelector('.upi-membership-check-list[data-upi-membership-list="paid-pix"]'), previousScrollTop.pix);
    }

    return { renderUpiCredentialMembershipCheckResults };
  }

  function fallbackEscapeHtml(value) {
    return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function fallbackSetNodeHidden(node, hidden) {
    if (node) node.hidden = Boolean(hidden);
  }

  const api = { createAccountRecordsMembershipResultsRenderer };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  globalScope.SidepanelAccountRecordsMembershipResultsRenderer = api;
})(typeof window !== 'undefined' ? window : globalThis);
