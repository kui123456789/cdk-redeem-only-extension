(function attachSidepanelSettingsTransferManager(globalScope) {
  function createSettingsTransferManager(context = {}) {
    const {
      controls = {},
      helpers = {},
      runtime = {},
    } = context;

    function setActionInFlight(value) {
      controls.setConfigActionInFlight?.(Boolean(value));
      controls.updateConfigMenuControls?.();
    }

    async function exportSettingsFile() {
      const saveTarget = await helpers.requestTextFileSaveTarget?.(
        `multipage-settings-${helpers.buildDownloadFileTimestamp?.()}.json`,
        'application/json;charset=utf-8'
      );
      if (saveTarget?.cancelled) {
        helpers.showToast?.('已取消导出配置。', 'info', 1800);
        return;
      }
      if (saveTarget?.error) {
        helpers.showToast?.('导出配置失败：' + (saveTarget.error?.message || '无法打开保存窗口。'), 'error');
        return;
      }

      helpers.closeConfigMenu?.();
      setActionInFlight(true);

      try {
        await helpers.flushPendingSettingsBeforeExport?.();
        await helpers.persistCustomEmailPoolBeforeExport?.();
        const response = await runtime.sendMessage?.({
          type: 'EXPORT_SETTINGS',
          source: 'sidepanel',
          payload: {},
        });

        if (response?.error) {
          throw new Error(response.error);
        }
        if (!response?.fileContent || !response?.fileName) {
          throw new Error('未生成可下载的配置文件。');
        }

        const downloadResult = await helpers.downloadTextFile?.(
          response.fileContent,
          response.fileName,
          'application/json;charset=utf-8',
          { saveTarget }
        );
        if (downloadResult?.cancelled) {
          helpers.showToast?.('已取消导出配置。', 'info', 1800);
          return;
        }
        helpers.showToast?.('配置已导出：' + (downloadResult?.fileName || response.fileName), 'success', 2200);
      } catch (error) {
        helpers.showToast?.('导出配置失败：' + (error?.message || error), 'error');
      } finally {
        setActionInFlight(false);
      }
    }

    async function importSettingsFromFile(file) {
      if (!file) {
        return;
      }

      setActionInFlight(true);
      helpers.closeConfigMenu?.();

      try {
        await helpers.settlePendingSettingsBeforeImport?.();
        const rawText = await file.text();

        let parsedConfig = null;
        try {
          parsedConfig = JSON.parse(rawText);
        } catch {
          throw new Error('配置文件不是有效的 JSON。');
        }

        const confirmed = await helpers.openConfirmModal?.({
          title: '导入配置',
          message: '确认导入配置文件 "' + file.name + '" 吗？导入后会覆盖当前配置。',
          confirmLabel: '确认覆盖导入',
          confirmVariant: 'btn-danger',
        });
        if (!confirmed) {
          return;
        }

        const response = await runtime.sendMessage?.({
          type: 'IMPORT_SETTINGS',
          source: 'sidepanel',
          payload: {
            config: parsedConfig,
          },
        });

        if (response?.error) {
          throw new Error(response.error);
        }
        if (!response?.state) {
          throw new Error('导入后未返回最新配置状态。');
        }

        helpers.applySettingsState?.(response.state);
        await helpers.reloadUpiCredentialMembershipAfterRuntimeImport?.();
        helpers.updateStatusDisplay?.();
        helpers.showToast?.('配置已导入，当前配置已覆盖。', 'success', 2200);
      } catch (error) {
        helpers.showToast?.('导入配置失败：' + (error?.message || error), 'error');
      } finally {
        setActionInFlight(false);
        controls.resetImportSettingsFile?.();
      }
    }

    return {
      exportSettingsFile,
      importSettingsFromFile,
    };
  }

  globalScope.SidepanelSettingsTransferManager = {
    createSettingsTransferManager,
  };
})(window);
