(function attachSidepanelActionModalService(globalScope) {
  function createActionModalService(context = {}) {
    const { dom = {} } = context;
    const {
      modal,
      title,
      message,
      alert,
      optionRow,
      optionInput,
      optionText,
      cancelButton,
      restartButton,
      continueButton,
      closeButton,
    } = dom;

    let modalChoiceResolver = null;
    let currentModalActions = [];
    let modalResultBuilder = null;

    function resetActionModalOption() {
      if (!optionRow || !optionInput || !optionText) {
        return;
      }

      optionRow.hidden = true;
      optionInput.checked = false;
      optionInput.disabled = false;
      optionText.textContent = '不再提示';
    }

    function resetActionModalAlert() {
      if (!alert) {
        return;
      }

      alert.hidden = true;
      alert.textContent = '';
      alert.className = 'modal-alert';
    }

    function setActionModalMessageContent({ text = '', html = '' } = {}) {
      if (!message) {
        return;
      }

      if (html) {
        message.innerHTML = html;
        return;
      }

      message.textContent = text;
    }

    function resetActionModalButtons() {
      const buttons = [cancelButton, restartButton, continueButton];
      buttons.forEach((button) => {
        if (!button) return;
        button.hidden = true;
        button.disabled = false;
        button.title = '';
        button.onclick = null;
      });
      currentModalActions = [];
    }

    function resetActionModalCloseButton() {
      if (!closeButton) return;
      closeButton.disabled = false;
      closeButton.onclick = null;
    }

    function configureActionModalButton(button, action) {
      if (!button) return;
      if (!action) {
        button.hidden = true;
        button.onclick = null;
        return;
      }

      button.hidden = false;
      button.disabled = Boolean(action.disabled);
      button.textContent = action.label;
      button.title = action.title || '';
      button.className = `btn ${action.variant || 'btn-outline'} btn-sm`;
      button.onclick = button.disabled ? null : () => resolveModalChoice(action.id);
    }

    function configureActionModalCloseButton() {
      if (!closeButton) return;
      closeButton.disabled = false;
      closeButton.onclick = () => resolveModalChoice(null);
    }

    function configureActionModalOption(option) {
      if (!optionRow || !optionInput || !optionText) {
        return;
      }

      if (!option) {
        resetActionModalOption();
        return;
      }

      optionRow.hidden = false;
      optionInput.checked = Boolean(option.checked);
      optionInput.disabled = Boolean(option.disabled);
      optionText.textContent = option.label || '不再提示';
    }

    function configureActionModalAlert(alertConfig) {
      if (!alert) {
        return;
      }

      if (!alertConfig?.text) {
        resetActionModalAlert();
        return;
      }

      alert.hidden = false;
      alert.textContent = alertConfig.text;
      alert.className = `modal-alert${alertConfig.tone === 'danger' ? ' is-danger' : ''}`;
    }

    function resolveModalChoice(choice) {
      const optionChecked = Boolean(optionInput?.checked);
      const result = typeof modalResultBuilder === 'function'
        ? modalResultBuilder(choice, { optionChecked })
        : choice;
      if (modalChoiceResolver) {
        modalChoiceResolver(result);
        modalChoiceResolver = null;
      }
      modalResultBuilder = null;
      resetActionModalButtons();
      resetActionModalCloseButton();
      resetActionModalAlert();
      resetActionModalOption();
      if (modal) {
        modal.hidden = true;
      }
    }

    function openActionModal({ title: modalTitle, message: modalMessage, messageHtml, actions, option, alert: alertConfig, buildResult }) {
      if (!modal) {
        return Promise.resolve(null);
      }

      if (modalChoiceResolver) {
        resolveModalChoice(null);
      }

      resetActionModalButtons();
      if (title) {
        title.textContent = modalTitle;
      }
      setActionModalMessageContent({ text: modalMessage, html: messageHtml });
      currentModalActions = actions || [];
      modalResultBuilder = typeof buildResult === 'function' ? buildResult : null;
      const buttonSlots = currentModalActions.length <= 2
        ? [cancelButton, continueButton]
        : [cancelButton, restartButton, continueButton];
      buttonSlots.forEach((button, index) => {
        configureActionModalButton(button, currentModalActions[index]);
      });
      configureActionModalCloseButton();
      configureActionModalAlert(alertConfig);
      configureActionModalOption(option);
      modal.hidden = false;

      return new Promise((resolve) => {
        modalChoiceResolver = resolve;
      });
    }

    function openAutoStartChoiceDialog(startStep, options = {}) {
      const runningStep = Number.isInteger(options.runningStep) ? options.runningStep : null;
      const continueMessage = runningStep
        ? `继续当前会先等待步骤 ${runningStep} 完成，再按最新进度自动执行。`
        : `继续当前会从步骤 ${startStep} 开始自动执行。`;
      return openActionModal({
        title: '启动自动',
        message: `检测到当前已有流程进度。${continueMessage}重新开始会清空当前流程进度并从步骤 1 新开一轮。`,
        actions: [
          { id: null, label: '取消', variant: 'btn-ghost' },
          { id: 'restart', label: '重新开始', variant: 'btn-outline' },
          { id: 'continue', label: '继续当前', variant: 'btn-primary' },
        ],
      });
    }

    function openRedeemChannelChoiceDialog(options = {}) {
      const channelOptions = ['upi', 'ideal', 'pix'].map((channel) => {
        const channelOption = options[channel] || {};
        const candidateCount = Math.max(0, Math.floor(Number(channelOption.candidateCount) || 0));
        const cdkeyCount = Math.max(0, Math.floor(Number(channelOption.cdkeyCount) || 0));
        const redeemCount = Math.max(
          0,
          Math.floor(Number.isFinite(Number(channelOption.redeemCount))
            ? Number(channelOption.redeemCount)
            : Math.min(candidateCount, cdkeyCount))
        );
        const label = channel.toUpperCase();
        return {
          id: channel,
          label: `${label} (${redeemCount})`,
          title: `${label} 候选 ${candidateCount} 个，可用 CDK ${cdkeyCount} 个，本次可兑换 ${redeemCount} 个`,
          variant: 'btn-outline',
          disabled: redeemCount <= 0,
        };
      });
      return openActionModal({
        title: '选择兑换卡密池',
        message: '请选择本次“全部兑换”要使用的卡密池。只会执行所选渠道，不会自动切换到其他渠道。',
        actions: channelOptions,
      });
    }

    async function openConfirmModal({ title: modalTitle, message: modalMessage, confirmLabel = '确认', confirmVariant = 'btn-primary', alert: alertConfig = null }) {
      const choice = await openActionModal({
        title: modalTitle,
        message: modalMessage,
        alert: alertConfig,
        actions: [
          { id: null, label: '取消', variant: 'btn-ghost' },
          { id: 'confirm', label: confirmLabel, variant: confirmVariant },
        ],
      });
      return choice === 'confirm';
    }

    async function openConfirmModalWithOption({
      title: modalTitle,
      message: modalMessage,
      messageHtml = '',
      confirmLabel = '确认',
      confirmVariant = 'btn-primary',
      alert: alertConfig = null,
      optionLabel = '不再提示',
      optionChecked = false,
      optionDisabled = false,
    }) {
      const result = await openActionModal({
        title: modalTitle,
        message: modalMessage,
        messageHtml,
        alert: alertConfig,
        actions: [
          { id: null, label: '取消', variant: 'btn-ghost' },
          { id: 'confirm', label: confirmLabel, variant: confirmVariant },
        ],
        option: {
          label: optionLabel,
          checked: optionChecked,
          disabled: optionDisabled,
        },
        buildResult: (choice, meta) => ({
          choice,
          optionChecked: Boolean(meta?.optionChecked),
        }),
      });

      return {
        confirmed: result?.choice === 'confirm',
        optionChecked: Boolean(result?.optionChecked),
      };
    }

    return {
      resolveModalChoice,
      openActionModal,
      openAutoStartChoiceDialog,
      openRedeemChannelChoiceDialog,
      openConfirmModal,
      openConfirmModalWithOption,
    };
  }

  globalScope.SidepanelActionModalService = {
    createActionModalService,
  };
})(window);
