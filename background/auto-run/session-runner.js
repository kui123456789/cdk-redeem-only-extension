(function attachBackgroundAutoRunSessionRunner(root, factory) {
  const api = factory();
  if (root) {
    root.MultiPageBackgroundAutoRunSessionRunner = api;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof self !== 'undefined' ? self : globalThis, function createBackgroundAutoRunSessionRunnerModule() {
  function createAutoRunSessionRunner(deps = {}) {
    const {
      addLog,
      appendAccountRunRecord,
      AUTO_RUN_MAX_RETRIES_PER_ROUND,
      AUTO_RUN_RETRY_DELAY_MS,
      AUTO_RUN_TIMER_KIND_BEFORE_RETRY,
      AUTO_RUN_TIMER_KIND_BETWEEN_ROUNDS,
      broadcastAutoRunStatus,
      broadcastStopToContentScripts,
      cancelPendingCommands,
      clearStopRequest,
      createAutoRunRoundLogSnapshotMarker,
      createAutoRunSessionId,
      buildAutoRunRoundSummaries,
      ensureHotmailMailboxReadyForAutoRunRound,
      evaluateAttemptFailure,
      getAutoRunRoundSnapshotReason,
      getAutoRunRoundSnapshotStatus,
      getAutoRunStatusPayload,
      getErrorMessage,
      getFirstUnfinishedNodeId,
      getMaxAttemptsForRound,
      getPendingAutoRunTimerPlan,
      getRunningNodeIds,
      getState,
      getStopRequested = () => false,
      hasSavedNodeProgress,
      isStopError,
      launchAutoRunTimerPlan,
      logAutoRunFinalSummary,
      markCurrentRegistrationAccountRegistrationBlocked = null,
      normalizeAutoRunFallbackThreadIntervalMinutes,
      persistAutoRunTimerPlan,
      replayPreviousSuccessfulAutoRunRoundLogSnapshot,
      resetState,
      resolveAutoRunAccountRecordStatus,
      runAutoSequenceFromNode,
      runtime,
      saveAutoRunRoundLogSnapshot,
      selectFailureAction,
      serializeAutoRunRoundSummaries,
      setState,
      sleepWithStop,
      throwIfAutoRunSessionStopped,
      waitForRunningNodesToFinish,
      chrome,
    } = deps;

    function getRunningWorkflowNodes(state = {}) {
      if (typeof getRunningNodeIds === 'function') {
        return getRunningNodeIds(state.nodeStatuses || {}, state);
      }
      return [];
    }

    function getFirstUnfinishedWorkflowNode(state = {}) {
      if (typeof getFirstUnfinishedNodeId === 'function') {
        return getFirstUnfinishedNodeId(state.nodeStatuses || {}, state);
      }
      return null;
    }

    function hasSavedWorkflowProgress(state = {}) {
      if (typeof hasSavedNodeProgress === 'function') {
        return hasSavedNodeProgress(state.nodeStatuses || {}, state);
      }
      return false;
    }

    async function waitForRunningWorkflowNodesToFinish(payload = {}) {
      if (typeof waitForRunningNodesToFinish === 'function') {
        return waitForRunningNodesToFinish(payload);
      }
      return getState();
    }

    async function runAutoSequenceFromWorkflowNode(startNodeId, context = {}) {
      if (typeof runAutoSequenceFromNode === 'function') {
        return runAutoSequenceFromNode(startNodeId, context);
      }
      throw new Error('自动运行节点执行器未接入。');
    }

    async function waitBetweenAutoRunRounds(targetRun, totalRuns, roundSummary, options = {}) {
      const {
        autoRunSkipFailures = false,
        autoRunRetryNonFreeTrial = false,
        autoRunRetryLegacyWalletCallback = false,
        roundSummaries = [],
      } = options;
      if (totalRuns <= 1 || targetRun >= totalRuns) {
        return false;
      }

      const fallbackThreadIntervalMinutes = normalizeAutoRunFallbackThreadIntervalMinutes(
        (await getState()).autoRunFallbackThreadIntervalMinutes
      );
      if (fallbackThreadIntervalMinutes <= 0) {
        return false;
      }

      const currentRuntime = runtime.get();
      const statusLabel = roundSummary?.status === 'failed' ? '失败' : '完成';
      await addLog(
        `线程间隔：第 ${targetRun}/${totalRuns} 轮已${statusLabel}，等待 ${fallbackThreadIntervalMinutes} 分钟后开始下一轮。`,
        'info'
      );
      await persistAutoRunTimerPlan({
        kind: AUTO_RUN_TIMER_KIND_BETWEEN_ROUNDS,
        fireAt: Date.now() + fallbackThreadIntervalMinutes * 60 * 1000,
        currentRun: targetRun,
        totalRuns,
        attemptRun: 1,
        autoRunSessionId: currentRuntime.autoRunSessionId,
        autoRunSkipFailures,
        autoRunRetryNonFreeTrial,
        autoRunRetryLegacyWalletCallback,
        roundSummaries,
        countdownTitle: '线程间隔中',
        countdownNote: `第 ${Math.min(targetRun + 1, totalRuns)}/${totalRuns} 轮即将开始`,
      }, {
        autoRunSkipFailures,
        autoRunRetryNonFreeTrial,
        autoRunRetryLegacyWalletCallback,
        autoRunRoundSummaries: serializeAutoRunRoundSummaries(totalRuns, roundSummaries),
      });
      runtime.set({ autoRunActive: false });
      return true;
    }

    async function waitBeforeAutoRunRetry(targetRun, totalRuns, nextAttemptRun, options = {}) {
      const {
        autoRunSkipFailures = false,
        autoRunRetryNonFreeTrial = false,
        autoRunRetryLegacyWalletCallback = false,
        roundSummaries = [],
      } = options;
      const fallbackThreadIntervalMinutes = normalizeAutoRunFallbackThreadIntervalMinutes(
        (await getState()).autoRunFallbackThreadIntervalMinutes
      );
      if (fallbackThreadIntervalMinutes <= 0) {
        return false;
      }

      await addLog(
        `线程间隔：等待 ${fallbackThreadIntervalMinutes} 分钟后开始第 ${targetRun}/${totalRuns} 轮第 ${nextAttemptRun} 次尝试。`,
        'info'
      );
      await persistAutoRunTimerPlan({
        kind: AUTO_RUN_TIMER_KIND_BEFORE_RETRY,
        fireAt: Date.now() + fallbackThreadIntervalMinutes * 60 * 1000,
        currentRun: targetRun,
        totalRuns,
        attemptRun: nextAttemptRun,
        autoRunSessionId: runtime.get().autoRunSessionId,
        autoRunSkipFailures,
        autoRunRetryNonFreeTrial,
        autoRunRetryLegacyWalletCallback,
        roundSummaries,
        countdownTitle: '线程间隔中',
        countdownNote: `第 ${targetRun}/${totalRuns} 轮第 ${nextAttemptRun} 次尝试即将开始`,
      }, {
        autoRunSkipFailures,
        autoRunRetryNonFreeTrial,
        autoRunRetryLegacyWalletCallback,
        autoRunRoundSummaries: serializeAutoRunRoundSummaries(totalRuns, roundSummaries),
      });
      runtime.set({ autoRunActive: false });
      return true;
    }

    async function autoRunLoop(totalRuns, options = {}) {
      let currentRuntime = runtime.get();
      if (currentRuntime.autoRunActive) {
        await addLog('自动运行已在进行中', 'warn');
        return;
      }

      let sessionId = Number.isInteger(options.autoRunSessionId) && options.autoRunSessionId > 0
        ? options.autoRunSessionId
        : 0;
      if (sessionId) {
        throwIfAutoRunSessionStopped(sessionId);
      } else {
        sessionId = createAutoRunSessionId();
      }

      clearStopRequest();
      runtime.set({
        autoRunActive: true,
        autoRunTotalRuns: totalRuns,
        autoRunCurrentRun: 0,
        autoRunAttemptRun: 0,
        autoRunSessionId: sessionId,
      });
      currentRuntime = runtime.get();

      const autoRunSkipFailures = true;
      const autoRunRetryNonFreeTrial = Boolean(options.autoRunRetryNonFreeTrial);
      const autoRunRetryLegacyWalletCallback = Boolean(options.autoRunRetryLegacyWalletCallback);
      const initialMode = options.mode === 'continue' ? 'continue' : 'restart';
      let resumeCurrentRun = Number.isInteger(options.resumeCurrentRun) && options.resumeCurrentRun > 0
        ? Math.min(totalRuns, options.resumeCurrentRun)
        : 1;
      let resumeAttemptRun = Number.isInteger(options.resumeAttemptRun) && options.resumeAttemptRun > 0
        ? Math.min(AUTO_RUN_MAX_RETRIES_PER_ROUND + 1, options.resumeAttemptRun)
        : 1;
      let continueCurrentOnFirstAttempt = initialMode === 'continue';
      let forceFreshTabsNextRun = false;
      let stoppedEarly = false;
      let parkedByTimer = false;
      const roundSummaries = buildAutoRunRoundSummaries(totalRuns, options.resumeRoundSummaries);
      if (resumeCurrentRun > 1 && resumeAttemptRun > 1) {
        const currentSummary = roundSummaries[resumeCurrentRun - 1];
        const previousSummary = roundSummaries[resumeCurrentRun - 2];
        const currentHasAttemptHistory = currentSummary?.status !== 'pending'
          || Math.max(0, Math.floor(Number(currentSummary?.attempts) || 0)) > 0
          || (Array.isArray(currentSummary?.failureReasons) && currentSummary.failureReasons.length > 0);
        const previousHasRetryHistory = previousSummary?.status === 'pending' && (
          Math.max(0, Math.floor(Number(previousSummary?.attempts) || 0)) > 0
          || (Array.isArray(previousSummary?.failureReasons) && previousSummary.failureReasons.length > 0)
        );
        if (!currentHasAttemptHistory && previousHasRetryHistory) {
          resumeCurrentRun -= 1;
        }
      }

      if (continueCurrentOnFirstAttempt && resumeCurrentRun > 1) {
        for (let round = 1; round < resumeCurrentRun; round += 1) {
          const summary = roundSummaries[round - 1];
          if (summary.status === 'pending') {
            summary.status = 'success';
            if (!summary.attempts) {
              summary.attempts = 1;
            }
          }
        }
      }

      let successfulRuns = roundSummaries.filter((item) => item.status === 'success').length;
      const initialState = await getState();
      const initialPhase = continueCurrentOnFirstAttempt && getRunningWorkflowNodes(initialState).length
        ? 'waiting_step'
        : 'running';
      const showResumePosition = continueCurrentOnFirstAttempt || resumeCurrentRun > 1 || resumeAttemptRun > 1;

      await setState({
        autoRunSessionId: sessionId,
        autoRunSkipFailures,
        autoRunRetryNonFreeTrial,
        autoRunRetryLegacyWalletCallback,
        autoRunRoundSummaries: serializeAutoRunRoundSummaries(totalRuns, roundSummaries),
        ...getAutoRunStatusPayload(initialPhase, {
          currentRun: showResumePosition ? resumeCurrentRun : 0,
          totalRuns,
          attemptRun: showResumePosition ? resumeAttemptRun : 0,
          sessionId,
        }),
      });

      for (let targetRun = resumeCurrentRun; targetRun <= totalRuns; targetRun += 1) {
        const roundSummary = roundSummaries[targetRun - 1];
        let roundRecordAppended = false;
        let roundLogSnapshotMarker = null;
        let roundLogSnapshotSaved = false;
        const resumingCurrentRound = continueCurrentOnFirstAttempt && targetRun === resumeCurrentRun;
        let attemptRun = resumingCurrentRound ? resumeAttemptRun : 1;
        let reuseExistingProgress = resumingCurrentRound;
        const maxAttemptsForRound = getMaxAttemptsForRound({
          attemptRun,
          autoRunSkipFailures,
          autoRunRetryNonFreeTrial,
          autoRunRetryLegacyWalletCallback,
        });

        const persistRoundSummaries = async () => {
          await setState({
            autoRunRoundSummaries: serializeAutoRunRoundSummaries(totalRuns, roundSummaries),
          });
        };

        const saveRoundLogSnapshotIfNeeded = async (flags = {}) => {
          if (roundLogSnapshotSaved || !roundLogSnapshotMarker) {
            return null;
          }
          const status = getAutoRunRoundSnapshotStatus(roundSummary, flags);
          const reason = getAutoRunRoundSnapshotReason(status, roundSummary);
          try {
            const snapshot = await saveAutoRunRoundLogSnapshot({
              sessionId,
              round: targetRun,
              totalRuns,
              attemptRun,
              status,
              reason,
              marker: roundLogSnapshotMarker,
            });
            roundLogSnapshotSaved = Boolean(snapshot);
            if (snapshot) {
              await addLog(
                `自动运行：已保存第 ${targetRun}/${totalRuns} 轮日志快照（${snapshot.logCount}${snapshot.truncated ? `/${snapshot.originalLogCount}` : ''} 条）。`,
                'info'
              );
            }
            return snapshot;
          } catch (snapshotError) {
            roundLogSnapshotSaved = true;
            await addLog(
              `自动运行：保存第 ${targetRun}/${totalRuns} 轮日志快照失败：${getErrorMessage(snapshotError) || snapshotError?.message || '未知错误'}`,
              'warn'
            );
            return null;
          }
        };

        while (attemptRun <= maxAttemptsForRound) {
          runtime.set({
            autoRunCurrentRun: targetRun,
            autoRunAttemptRun: attemptRun,
          });
          roundSummary.attempts = attemptRun;
          const defaultStartNodeId = typeof runAutoSequenceFromNode === 'function' ? 'open-chatgpt' : 1;
          let startNodeId = defaultStartNodeId;
          let useExistingProgress = false;

          if (reuseExistingProgress) {
            let currentState = await getState();
            if (getRunningWorkflowNodes(currentState).length) {
              currentState = await waitForRunningWorkflowNodesToFinish({
                currentRun: targetRun,
                totalRuns,
                attemptRun,
              });
            }
            const resumeNodeId = getFirstUnfinishedWorkflowNode(currentState);
            if (resumeNodeId && hasSavedWorkflowProgress(currentState)) {
              startNodeId = resumeNodeId;
              useExistingProgress = true;
            } else if (hasSavedWorkflowProgress(currentState)) {
              await addLog('检测到当前流程已处理完成，本轮将改为从首个节点重新开始。', 'info');
            }
          }

          if (!useExistingProgress) {
            const prevState = await getState();
            const keepSettings = {
              vpsUrl: prevState.vpsUrl,
              vpsPassword: prevState.vpsPassword,
              customPassword: prevState.customPassword,
              plusModeEnabled: prevState.plusModeEnabled,
              plusPaymentMethod: prevState.plusPaymentMethod,
              plusAccountAccessStrategy: prevState.plusAccountAccessStrategy,
              chatgptSessionReaderMode: prevState.chatgptSessionReaderMode,
              chatgptSessionReaderProfiles: prevState.chatgptSessionReaderProfiles,
              plusHostedCheckoutOauthDelaySeconds: prevState.plusHostedCheckoutOauthDelaySeconds,
              hostedCheckoutVerificationPopupDelaySeconds: prevState.hostedCheckoutVerificationPopupDelaySeconds,
              hostedCheckoutVerificationUrl: prevState.hostedCheckoutVerificationUrl,
              hostedCheckoutFirstDirectResendEnabled: prevState.hostedCheckoutFirstDirectResendEnabled,
              hostedCheckoutFirstResendWaitSeconds: prevState.hostedCheckoutFirstResendWaitSeconds,
              hostedCheckoutSubsequentResendWaitSeconds: prevState.hostedCheckoutSubsequentResendWaitSeconds,
              hostedCheckoutVerificationResendMaxAttempts: prevState.hostedCheckoutVerificationResendMaxAttempts,
              hostedCheckoutVerificationPollAttempts: prevState.hostedCheckoutVerificationPollAttempts,
              hostedCheckoutVerificationPollIntervalSeconds: prevState.hostedCheckoutVerificationPollIntervalSeconds,
              upiRedeemExternalApiKey: prevState.upiRedeemExternalApiKey,
              upiRedeemClientId: prevState.upiRedeemClientId,
              upiRedeemStopAfterRedeem: prevState.upiRedeemStopAfterRedeem,
              upiRedeemContinueAfterRedeem: prevState.upiRedeemContinueAfterRedeem,
              cdkPoolText: prevState.cdkPoolText,
              upiRedeemCdkPoolText: prevState.upiRedeemCdkPoolText,
              upiRedeemCdkeyPoolText: prevState.upiRedeemCdkeyPoolText,
              cdkUsage: prevState.cdkUsage,
              upiRedeemCdkUsage: prevState.upiRedeemCdkUsage,
              upiRedeemCdkeyUsage: prevState.upiRedeemCdkeyUsage,
              legacyWalletEmail: prevState.legacyWalletEmail,
              legacyWalletPassword: prevState.legacyWalletPassword,
              legacyWalletAccounts: prevState.legacyWalletAccounts,
              currentLegacyWalletAccountId: prevState.currentLegacyWalletAccountId,
              autoRunSkipFailures: prevState.autoRunSkipFailures,
              autoRunRetryNonFreeTrial: prevState.autoRunRetryNonFreeTrial,
              autoRunRetryLegacyWalletCallback: prevState.autoRunRetryLegacyWalletCallback,
              autoRunFallbackThreadIntervalMinutes: prevState.autoRunFallbackThreadIntervalMinutes,
              autoRunDelayEnabled: prevState.autoRunDelayEnabled,
              autoRunDelayMinutes: prevState.autoRunDelayMinutes,
              autoStepDelaySeconds: prevState.autoStepDelaySeconds,
              signupMethod: prevState.signupMethod,
              mailProvider: prevState.mailProvider,
              emailGenerator: prevState.emailGenerator,
              gmailBaseEmail: prevState.gmailBaseEmail,
              mail2925BaseEmail: prevState.mail2925BaseEmail,
              currentMail2925AccountId: prevState.currentMail2925AccountId,
              emailPrefix: prevState.emailPrefix,
              outlookAliasMaxPerAccount: prevState.outlookAliasMaxPerAccount,
              hotmailAliasUsage: prevState.hotmailAliasUsage,
              inbucketHost: prevState.inbucketHost,
              inbucketMailbox: prevState.inbucketMailbox,
              cloudflareDomain: prevState.cloudflareDomain,
              cloudflareDomains: prevState.cloudflareDomains,
              customEmailPoolEntries: prevState.customEmailPoolEntries,
              customEmailPool: prevState.customEmailPool,
              customMailProviderPool: prevState.customMailProviderPool,
              selectedCustomEmailPoolEmail: prevState.selectedCustomEmailPoolEmail,
              autoRunRoundSummaries: serializeAutoRunRoundSummaries(totalRuns, roundSummaries),
              autoRunSessionId: sessionId,
              tabRegistry: {},
              sourceLastUrls: {},
              ...getAutoRunStatusPayload('running', { currentRun: targetRun, totalRuns, attemptRun, sessionId }),
            };
            await resetState();
            await setState(keepSettings);
            chrome.runtime.sendMessage({ type: 'AUTO_RUN_RESET' }).catch(() => {});
            await sleepWithStop(500);
          } else {
            await setState({
              autoRunSessionId: sessionId,
              autoRunSkipFailures,
              autoRunRetryNonFreeTrial,
              autoRunRetryLegacyWalletCallback,
              autoRunRoundSummaries: serializeAutoRunRoundSummaries(totalRuns, roundSummaries),
              ...getAutoRunStatusPayload('running', { currentRun: targetRun, totalRuns, attemptRun, sessionId }),
            });
          }

          if (!roundLogSnapshotMarker) {
            roundLogSnapshotMarker = createAutoRunRoundLogSnapshotMarker(await getState());
          }

          if (forceFreshTabsNextRun) {
            await addLog(
              attemptRun > 1
                ? `上一次尝试已放弃，当前继续第 ${targetRun}/${totalRuns} 轮第 ${attemptRun} 次尝试。`
                : `上一轮已结束，当前开始第 ${targetRun}/${totalRuns} 轮第 ${attemptRun} 次尝试。`,
              'warn'
            );
            forceFreshTabsNextRun = false;
          }

          const appendRoundRecordIfNeeded = async (status, reason = '', errorLike = null) => {
            if (roundRecordAppended || typeof appendAccountRunRecord !== 'function') {
              return;
            }
            const recordState = await getState();
            const recordStatus = resolveAutoRunAccountRecordStatus(status, recordState, errorLike);
            const record = await appendAccountRunRecord(recordStatus, recordState, reason);
            if (record) {
              roundRecordAppended = true;
            }
          };

          const handleStopForCurrentAttempt = async (errorLike) => {
            stoppedEarly = true;
            await appendRoundRecordIfNeeded('stopped', getErrorMessage(errorLike), errorLike);
            await addLog(`第 ${targetRun}/${totalRuns} 轮已被用户停止`, 'warn');
            await broadcastAutoRunStatus('stopped', {
              currentRun: targetRun,
              totalRuns,
              attemptRun,
              sessionId: 0,
            });
          };

          const markRoundFailed = async (reason, errorLike) => {
            roundSummary.status = 'failed';
            roundSummary.finalFailureReason = reason;
            await persistRoundSummaries();
            await appendRoundRecordIfNeeded('failed', reason, errorLike);
          };

          const performRetryWait = async (retryDelayMessage, cancelMessage) => {
            cancelPendingCommands(cancelMessage);
            await broadcastStopToContentScripts();
            await broadcastAutoRunStatus('retrying', {
              currentRun: targetRun,
              totalRuns,
              attemptRun,
              sessionId,
            });
            forceFreshTabsNextRun = true;
            await addLog(retryDelayMessage, 'warn');
            try {
              await sleepWithStop(AUTO_RUN_RETRY_DELAY_MS);
            } catch (sleepError) {
              if (isStopError(sleepError)) {
                await handleStopForCurrentAttempt(sleepError);
                return 'stopped';
              }
              throw sleepError;
            }
            try {
              const parkedForRetry = await waitBeforeAutoRunRetry(targetRun, totalRuns, attemptRun + 1, {
                autoRunSkipFailures,
                autoRunRetryNonFreeTrial,
                autoRunRetryLegacyWalletCallback,
                roundSummaries,
              });
              if (parkedForRetry) {
                parkedByTimer = true;
                return 'parked';
              }
            } catch (sleepError) {
              if (isStopError(sleepError)) {
                await handleStopForCurrentAttempt(sleepError);
                return 'stopped';
              }
              throw sleepError;
            }
            attemptRun += 1;
            reuseExistingProgress = false;
            return 'retry';
          };

          try {
            throwIfAutoRunSessionStopped(sessionId);
            await broadcastAutoRunStatus('running', {
              currentRun: targetRun,
              totalRuns,
              attemptRun,
              sessionId,
            });

            if (!useExistingProgress && startNodeId === defaultStartNodeId && typeof ensureHotmailMailboxReadyForAutoRunRound === 'function') {
              await ensureHotmailMailboxReadyForAutoRunRound({
                targetRun,
                totalRuns,
                attemptRun,
                sessionId,
              });
            }

            await runAutoSequenceFromWorkflowNode(startNodeId, {
              targetRun,
              totalRuns,
              attemptRuns: attemptRun,
              continued: useExistingProgress,
            });

            roundSummary.status = 'success';
            roundSummary.finalFailureReason = '';
            successfulRuns += 1;
            await persistRoundSummaries();
            await addLog(`=== 第 ${targetRun}/${totalRuns} 轮完成（第 ${attemptRun} 次尝试成功）===`, 'ok');
            break;
          } catch (error) {
            if (isStopError(error)) {
              await handleStopForCurrentAttempt(error);
              break;
            }

            const failureResult = evaluateAttemptFailure({
              error,
              attemptRun,
              autoRunSkipFailures,
              autoRunRetryNonFreeTrial,
              autoRunRetryLegacyWalletCallback,
              maxAttemptsForRound,
            });
            const failureAction = selectFailureAction(failureResult);
            const reason = failureResult.reason;
            roundSummary.failureReasons.push(reason);
            await persistRoundSummaries();

            if (failureAction.code === 'fail_custom_email_pool_empty') {
              await markRoundFailed(reason, error);
              cancelPendingCommands('自定义邮箱池没有可用邮箱。');
              await broadcastStopToContentScripts();
              await addLog(`自定义邮箱池没有可用邮箱，自动运行已停止：${reason}`, 'error');
              stoppedEarly = true;
              await broadcastAutoRunStatus('stopped', {
                currentRun: targetRun,
                totalRuns,
                attemptRun,
                sessionId: 0,
              });
              break;
            }

            if (failureAction.code === 'retry_plus_non_free_trial') {
              const retryIndex = attemptRun;
              await addLog(`第 ${targetRun}/${totalRuns} 轮第 ${attemptRun} 次尝试没有 Plus 免费试用资格：${reason}`, 'warn');
              const retryResult = await performRetryWait(
                `无试用套餐自动重试：${Math.round(AUTO_RUN_RETRY_DELAY_MS / 1000)} 秒后换新邮箱，开始第 ${targetRun}/${totalRuns} 轮第 ${attemptRun + 1} 次尝试（第 ${retryIndex}/${AUTO_RUN_MAX_RETRIES_PER_ROUND} 次重试）。`,
                '当前尝试因无免费试用资格已放弃。'
              );
              if (retryResult === 'retry') {
                continue;
              }
              break;
            }

            if (failureAction.code === 'retry_upi_redeem_backend_failure') {
              const retryIndex = attemptRun;
              await addLog(`第 ${targetRun}/${totalRuns} 轮第 ${attemptRun} 次尝试 UPI 后端返回 CDK 兑换失败：${reason}`, 'warn');
              const retryResult = await performRetryWait(
                `UPI 兑换失败自动重试：${Math.round(AUTO_RUN_RETRY_DELAY_MS / 1000)} 秒后换新邮箱，开始第 ${targetRun}/${totalRuns} 轮第 ${attemptRun + 1} 次尝试（第 ${retryIndex}/${AUTO_RUN_MAX_RETRIES_PER_ROUND} 次重试）。`,
                '当前尝试因 CDK 兑换失败已放弃。'
              );
              if (retryResult === 'retry') {
                continue;
              }
              break;
            }

            if (failureAction.code === 'retry_upi_redeem_network_failure') {
              const retryIndex = attemptRun;
              await addLog(`第 ${targetRun}/${totalRuns} 轮第 ${attemptRun} 次尝试 UPI 接口网络异常：${reason}`, 'warn');
              const retryResult = await performRetryWait(
                `UPI 接口网络异常自动重试：${Math.round(AUTO_RUN_RETRY_DELAY_MS / 1000)} 秒后重开当前轮，开始第 ${targetRun}/${totalRuns} 轮第 ${attemptRun + 1} 次尝试（第 ${retryIndex}/${AUTO_RUN_MAX_RETRIES_PER_ROUND} 次重试）。`,
                '当前尝试因 UPI 接口网络异常已放弃。'
              );
              if (retryResult === 'retry') {
                continue;
              }
              break;
            }

            if (failureAction.code === 'retry_hosted_checkout_generic_error') {
              const retryIndex = attemptRun;
              await addLog(`第 ${targetRun}/${totalRuns} 轮第 ${attemptRun} 次尝试遇到 LegacyWallet Checkout 异常：${reason}`, 'warn');
              const retryResult = await performRetryWait(
                `LegacyWallet Checkout 异常自动重试：${Math.round(AUTO_RUN_RETRY_DELAY_MS / 1000)} 秒后换新邮箱，开始第 ${targetRun}/${totalRuns} 轮第 ${attemptRun + 1} 次尝试（第 ${retryIndex}/${AUTO_RUN_MAX_RETRIES_PER_ROUND} 次重试）。`,
                '当前尝试因 LegacyWallet Checkout 异常已放弃。'
              );
              if (retryResult === 'retry') {
                continue;
              }
              break;
            }

            if (failureAction.code === 'retry_hosted_checkout_card_fallback') {
              const retryIndex = attemptRun;
              await addLog(`第 ${targetRun}/${totalRuns} 轮第 ${attemptRun} 次尝试落到银行卡分支：${reason}`, 'warn');
              const retryResult = await performRetryWait(
                `hosted checkout 银行卡分支默认自动重试：${Math.round(AUTO_RUN_RETRY_DELAY_MS / 1000)} 秒后换新邮箱，开始第 ${targetRun}/${totalRuns} 轮第 ${attemptRun + 1} 次尝试（第 ${retryIndex}/${AUTO_RUN_MAX_RETRIES_PER_ROUND} 次重试）。`,
                '当前尝试因 hosted checkout 落到银行卡分支已放弃。'
              );
              if (retryResult === 'retry') {
                continue;
              }
              break;
            }

            if (failureAction.code === 'fail_upi_account_ineligible') {
              await markRoundFailed(reason, error);
              cancelPendingCommands('当前轮因 UPI 账号无资格已终止。');
              await broadcastStopToContentScripts();
              await addLog(`第 ${targetRun}/${totalRuns} 轮 UPI 账号无资格：${reason}`, 'warn');
              await addLog(
                targetRun < totalRuns
                  ? `第 ${targetRun}/${totalRuns} 轮因 UPI 账号无资格提前结束，自动切换下一个账号。`
                  : `第 ${targetRun}/${totalRuns} 轮因 UPI 账号无资格提前结束，已无后续账号，本次自动运行结束。`,
                'warn'
              );
              forceFreshTabsNextRun = true;
              break;
            }

            if (failureAction.code === 'fail_plus_non_free_trial') {
              await markRoundFailed(reason, error);
              cancelPendingCommands('当前轮因 Plus 免费试用资格不可用已终止。');
              await broadcastStopToContentScripts();
              if (!autoRunSkipFailures) {
                await addLog(
                  autoRunRetryNonFreeTrial
                    ? `第 ${targetRun}/${totalRuns} 轮检测到 Plus 今日应付金额非 0，已达到无试用套餐自动重试上限，当前自动运行将停止。`
                    : `第 ${targetRun}/${totalRuns} 轮检测到 Plus 今日应付金额非 0，自动重试未开启，当前自动运行将停止。`,
                  'warn'
                );
                stoppedEarly = true;
                await broadcastAutoRunStatus('stopped', {
                  currentRun: targetRun,
                  totalRuns,
                  attemptRun,
                  sessionId: 0,
                });
                break;
              }
              await addLog(`第 ${targetRun}/${totalRuns} 轮没有 Plus 免费试用资格，本轮将直接失败并跳过剩余重试。`, 'warn');
              await addLog(
                targetRun < totalRuns
                  ? `第 ${targetRun}/${totalRuns} 轮因 Plus 今日应付金额非 0 提前结束，自动流程将继续下一轮。`
                  : `第 ${targetRun}/${totalRuns} 轮因 Plus 今日应付金额非 0 提前结束，已无后续轮次，本次自动运行结束。`,
                'warn'
              );
              forceFreshTabsNextRun = true;
              break;
            }

            if (failureAction.code === 'fail_upi_redeem_backend_failure') {
              await markRoundFailed(reason, error);
              cancelPendingCommands('当前轮因 CDK 兑换失败已终止。');
              await broadcastStopToContentScripts();
              if (!autoRunSkipFailures) {
                await addLog(
                  `第 ${targetRun}/${totalRuns} 轮 UPI 后端返回 CDK 兑换失败，已达到自动重试上限，当前自动运行将停止。`,
                  'warn'
                );
                stoppedEarly = true;
                await broadcastAutoRunStatus('stopped', {
                  currentRun: targetRun,
                  totalRuns,
                  attemptRun,
                  sessionId: 0,
                });
                break;
              }
              await addLog(`第 ${targetRun}/${totalRuns} 轮 UPI 后端返回 CDK 兑换失败，本轮将直接失败并跳过剩余重试。`, 'warn');
              await addLog(
                targetRun < totalRuns
                  ? `第 ${targetRun}/${totalRuns} 轮因 CDK 兑换失败提前结束，自动流程将继续下一轮。`
                  : `第 ${targetRun}/${totalRuns} 轮因 CDK 兑换失败提前结束，已无后续轮次，本次自动运行结束。`,
                'warn'
              );
              forceFreshTabsNextRun = true;
              break;
            }

            if (failureAction.code === 'fail_upi_redeem_network_failure') {
              await markRoundFailed(reason, error);
              cancelPendingCommands('当前轮因 UPI 接口网络异常已达到重试上限。');
              await broadcastStopToContentScripts();
              await addLog(`第 ${targetRun}/${totalRuns} 轮 UPI 接口网络异常已重试 ${AUTO_RUN_MAX_RETRIES_PER_ROUND} 次仍失败，本轮将切换下一轮：${reason}`, 'warn');
              await addLog(
                targetRun < totalRuns
                  ? `第 ${targetRun}/${totalRuns} 轮因 UPI 接口网络异常提前结束，自动流程将继续下一轮。`
                  : `第 ${targetRun}/${totalRuns} 轮因 UPI 接口网络异常提前结束，已无后续轮次，本次自动运行结束。`,
                'warn'
              );
              forceFreshTabsNextRun = true;
              break;
            }

            if (failureAction.code === 'fail_card_helper_task_ended') {
              await markRoundFailed(reason, error);
              cancelPendingCommands('当前轮因 CARD_HELPER 任务已结束。');
              await broadcastStopToContentScripts();
              if (!autoRunSkipFailures) {
                await addLog(
                  `第 ${targetRun}/${totalRuns} 轮 CARD_HELPER 任务已结束，自动重试未开启，当前自动运行将停止。`,
                  'warn'
                );
                stoppedEarly = true;
                await broadcastAutoRunStatus('stopped', {
                  currentRun: targetRun,
                  totalRuns,
                  attemptRun,
                  sessionId: 0,
                });
                break;
              }
              await addLog(`第 ${targetRun}/${totalRuns} 轮 CARD_HELPER 任务已结束，本轮将直接失败并跳过剩余重试。`, 'warn');
              await addLog(
                targetRun < totalRuns
                  ? `第 ${targetRun}/${totalRuns} 轮因 CARD_HELPER 任务结束提前结束，自动流程将继续下一轮。`
                  : `第 ${targetRun}/${totalRuns} 轮因 CARD_HELPER 任务结束提前结束，已无后续轮次，本次自动运行结束。`,
                'warn'
              );
              forceFreshTabsNextRun = true;
              break;
            }

            if (failureAction.code === 'fail_hosted_checkout_generic_error') {
              await markRoundFailed(reason, error);
              cancelPendingCommands(
                autoRunRetryLegacyWalletCallback
                  ? '当前轮因 LegacyWallet Checkout genericError 已达到自动重试上限。'
                  : '当前轮因 LegacyWallet Checkout genericError 已终止，等待用户选择检查或重试。'
              );
              await broadcastStopToContentScripts();
              if (autoRunSkipFailures) {
                await addLog(`第 ${targetRun}/${totalRuns} 轮检测到 LegacyWallet Checkout genericError，本轮将直接失败并继续下一邮箱。`, 'warn');
                forceFreshTabsNextRun = true;
                break;
              }
              await addLog(
                autoRunRetryLegacyWalletCallback
                  ? `第 ${targetRun}/${totalRuns} 轮检测到 LegacyWallet Checkout genericError，已达到 LEGACY_WALLET回调自动重试上限，当前自动运行将停止。`
                  : `第 ${targetRun}/${totalRuns} 轮检测到 LegacyWallet Checkout genericError，当前自动运行已停止，请在弹窗中选择“检查”或“重试”。`,
                'warn'
              );
              stoppedEarly = true;
              await broadcastAutoRunStatus('stopped', {
                currentRun: targetRun,
                totalRuns,
                attemptRun,
                sessionId: 0,
              });
              break;
            }

            if (failureAction.code === 'fail_hosted_checkout_card_fallback') {
              await markRoundFailed(reason, error);
              cancelPendingCommands('当前轮因 hosted checkout 连续落到银行卡分支已终止。');
              await broadcastStopToContentScripts();
              if (autoRunSkipFailures) {
                await addLog(`第 ${targetRun}/${totalRuns} 轮检测到 hosted checkout 连续落到银行卡分支，本轮将直接失败并继续下一邮箱。`, 'warn');
                forceFreshTabsNextRun = true;
                break;
              }
              await addLog(
                `第 ${targetRun}/${totalRuns} 轮检测到 hosted checkout 连续落到银行卡分支，已达到默认自动重试上限，当前自动运行将停止。`,
                'warn'
              );
              stoppedEarly = true;
              await broadcastAutoRunStatus('stopped', {
                currentRun: targetRun,
                totalRuns,
                attemptRun,
                sessionId: 0,
              });
              break;
            }

            if (failureAction.code === 'fail_hosted_checkout_verification_resend_limit') {
              await markRoundFailed(reason, error);
              cancelPendingCommands('当前轮因 LegacyWallet 验证码自动 Resend 达到上限已终止。');
              await broadcastStopToContentScripts();
              if (autoRunSkipFailures) {
                await addLog(`第 ${targetRun}/${totalRuns} 轮 LegacyWallet 验证码自动 Resend 已达到上限，本轮将直接失败并继续下一邮箱。`, 'warn');
                forceFreshTabsNextRun = true;
                break;
              }
              await addLog(
                `第 ${targetRun}/${totalRuns} 轮 LegacyWallet 验证码自动 Resend 已达到上限，当前自动运行已停止；请尝试在页面手动获取验证码并填入。`,
                'warn'
              );
              stoppedEarly = true;
              await broadcastAutoRunStatus('stopped', {
                currentRun: targetRun,
                totalRuns,
                attemptRun,
                sessionId: 0,
              });
              break;
            }

            if (failureAction.code === 'fail_cloud_checkout_already_paid') {
              await markRoundFailed(reason, error);
              cancelPendingCommands('当前轮因云端确认账号已开通 Plus，已停止自动重试。');
              await broadcastStopToContentScripts();
              if (autoRunSkipFailures) {
                await addLog(`第 ${targetRun}/${totalRuns} 轮云端返回 User is already paid，本轮将直接失败并继续下一邮箱。`, 'warn');
                forceFreshTabsNextRun = true;
                break;
              }
              await addLog(
                `第 ${targetRun}/${totalRuns} 轮云端返回 User is already paid，当前自动运行已停止，请检查 PLUS 是否已经开通。`,
                'warn'
              );
              stoppedEarly = true;
              await broadcastAutoRunStatus('stopped', {
                currentRun: targetRun,
                totalRuns,
                attemptRun,
                sessionId: 0,
              });
              break;
            }

            if (failureAction.code === 'fail_signup_user_already_exists') {
              if (typeof markCurrentRegistrationAccountRegistrationBlocked === 'function') {
                const latestState = await getState();
                await markCurrentRegistrationAccountRegistrationBlocked(latestState, {
                  reason,
                  reasonCode: 'user_already_exists',
                  logPrefix: '自动运行 user_already_exists',
                  level: 'warn',
                });
              }
              await markRoundFailed(reason, error);
              cancelPendingCommands('当前轮因 user_already_exists 已终止。');
              await broadcastStopToContentScripts();
              if (!autoRunSkipFailures) {
                await addLog(
                  `第 ${targetRun}/${totalRuns} 轮触发 user_already_exists/用户已存在，自动重试未开启，当前自动运行将停止。`,
                  'warn'
                );
                stoppedEarly = true;
                await broadcastAutoRunStatus('stopped', {
                  currentRun: targetRun,
                  totalRuns,
                  attemptRun,
                  sessionId: 0,
                });
                break;
              }
              await addLog(`第 ${targetRun}/${totalRuns} 轮触发 user_already_exists/用户已存在，本轮将直接失败并跳过剩余重试。`, 'warn');
              await addLog(
                targetRun < totalRuns
                  ? `第 ${targetRun}/${totalRuns} 轮因 user_already_exists/用户已存在提前结束，自动流程将继续下一轮。`
                  : `第 ${targetRun}/${totalRuns} 轮因 user_already_exists/用户已存在提前结束，已无后续轮次，本次自动运行结束。`,
                'warn'
              );
              forceFreshTabsNextRun = true;
              break;
            }

            if (failureAction.code === 'fail_step4_route405') {
              await markRoundFailed(reason, error);
              cancelPendingCommands('当前轮因步骤 4 连续 405 错误已终止。');
              await broadcastStopToContentScripts();
              if (!autoRunSkipFailures) {
                await addLog(
                  `第 ${targetRun}/${totalRuns} 轮步骤 4 连续 405 恢复失败，自动重试未开启，当前自动运行将停止。`,
                  'warn'
                );
                stoppedEarly = true;
                await broadcastAutoRunStatus('stopped', {
                  currentRun: targetRun,
                  totalRuns,
                  attemptRun,
                  sessionId: 0,
                });
                break;
              }
              await addLog(`第 ${targetRun}/${totalRuns} 轮步骤 4 连续 405 恢复失败，本轮将直接失败并跳过剩余重试。`, 'warn');
              await addLog(
                targetRun < totalRuns
                  ? `第 ${targetRun}/${totalRuns} 轮因步骤 4 连续 405 提前结束，自动流程将继续下一轮。`
                  : `第 ${targetRun}/${totalRuns} 轮因步骤 4 连续 405 提前结束，已无后续轮次，本次自动运行结束。`,
                'warn'
              );
              forceFreshTabsNextRun = true;
              break;
            }

            if (failureAction.code === 'retry_generic') {
              const retryIndex = attemptRun;
              if (failureResult.restartCurrentAttempt) {
                await addLog(`第 ${targetRun}/${totalRuns} 轮第 ${attemptRun} 次尝试需要整轮重开：${reason}`, 'warn');
              } else {
                await addLog(`第 ${targetRun}/${totalRuns} 轮第 ${attemptRun} 次尝试失败：${reason}`, 'error');
              }
              const retryResult = await performRetryWait(
                `自动重试：${Math.round(AUTO_RUN_RETRY_DELAY_MS / 1000)} 秒后开始第 ${targetRun}/${totalRuns} 轮第 ${attemptRun + 1} 次尝试（第 ${retryIndex}/${AUTO_RUN_MAX_RETRIES_PER_ROUND} 次重试）。`,
                '当前尝试已放弃。'
              );
              if (retryResult === 'retry') {
                continue;
              }
              break;
            }

            await markRoundFailed(reason, error);
            if (!autoRunSkipFailures) {
              cancelPendingCommands('当前轮执行失败。');
              await broadcastStopToContentScripts();
              await addLog('当前轮执行失败，自动运行将在当前失败后停止。', 'warn');
              stoppedEarly = true;
              await broadcastAutoRunStatus('stopped', {
                currentRun: targetRun,
                totalRuns,
                attemptRun,
                sessionId: 0,
              });
              break;
            }
            await addLog(`第 ${targetRun}/${totalRuns} 轮最终失败：${reason}`, 'error');
            await addLog(
              targetRun < totalRuns
                ? `第 ${targetRun}/${totalRuns} 轮已达到 ${AUTO_RUN_MAX_RETRIES_PER_ROUND} 次重试上限，继续下一轮。`
                : `第 ${targetRun}/${totalRuns} 轮已达到 ${AUTO_RUN_MAX_RETRIES_PER_ROUND} 次重试上限，本次自动运行结束。`,
              'warn'
            );
            cancelPendingCommands('当前轮已达到重试上限。');
            await broadcastStopToContentScripts();
            forceFreshTabsNextRun = true;
            break;
          } finally {
            reuseExistingProgress = false;
            continueCurrentOnFirstAttempt = false;
          }
        }

        await saveRoundLogSnapshotIfNeeded({ stoppedEarly, parkedByTimer });

        if (stoppedEarly || parkedByTimer) {
          break;
        }

        try {
          const parkedForNextRound = await waitBetweenAutoRunRounds(targetRun, totalRuns, roundSummary, {
            autoRunSkipFailures,
            autoRunRetryNonFreeTrial,
            autoRunRetryLegacyWalletCallback,
            roundSummaries,
          });
          if (parkedForNextRound) {
            parkedByTimer = true;
            break;
          }
        } catch (sleepError) {
          if (isStopError(sleepError)) {
            stoppedEarly = true;
            await addLog(`第 ${targetRun}/${totalRuns} 轮已被用户停止`, 'warn');
            await broadcastAutoRunStatus('stopped', {
              currentRun: targetRun,
              totalRuns,
              attemptRun: runtime.get().autoRunAttemptRun,
              sessionId: 0,
            });
            break;
          }
          throw sleepError;
        }
      }

      if (parkedByTimer) {
        runtime.set({ autoRunActive: false });
        clearStopRequest();
        return;
      }

      await setState({
        autoRunRoundSummaries: serializeAutoRunRoundSummaries(totalRuns, roundSummaries),
      });
      await logAutoRunFinalSummary(totalRuns, roundSummaries);

      const finalRuntime = runtime.get();
      if (getStopRequested() || stoppedEarly) {
        await replayPreviousSuccessfulAutoRunRoundLogSnapshot(sessionId, finalRuntime.autoRunCurrentRun);
        await addLog(`=== 已停止，完成 ${successfulRuns}/${finalRuntime.autoRunTotalRuns} 轮 ===`, 'warn');
        await broadcastAutoRunStatus('stopped', {
          currentRun: finalRuntime.autoRunCurrentRun,
          totalRuns: finalRuntime.autoRunTotalRuns,
          attemptRun: finalRuntime.autoRunAttemptRun,
          sessionId: 0,
        });
      } else {
        await addLog(`=== 全部 ${finalRuntime.autoRunTotalRuns} 轮已执行完成，成功 ${successfulRuns} 轮 ===`, 'ok');
        await broadcastAutoRunStatus('complete', {
          currentRun: finalRuntime.autoRunTotalRuns,
          totalRuns: finalRuntime.autoRunTotalRuns,
          attemptRun: finalRuntime.autoRunAttemptRun,
          sessionId: 0,
        });
      }
      runtime.set({ autoRunActive: false, autoRunSessionId: 0 });
      const afterRuntime = runtime.get();
      await setState({
        autoRunSessionId: 0,
        autoRunRoundSummaries: serializeAutoRunRoundSummaries(totalRuns, roundSummaries),
        autoRunTimerPlan: null,
        scheduledAutoRunPlan: null,
        ...getAutoRunStatusPayload(getStopRequested() || stoppedEarly ? 'stopped' : 'complete', {
          currentRun: getStopRequested() || stoppedEarly ? afterRuntime.autoRunCurrentRun : afterRuntime.autoRunTotalRuns,
          totalRuns: afterRuntime.autoRunTotalRuns,
          attemptRun: afterRuntime.autoRunAttemptRun,
          sessionId: 0,
        }),
      });
      if (!(getStopRequested() || stoppedEarly)) {
        clearStopRequest();
      }
    }

    return {
      autoRunLoop,
      waitBeforeAutoRunRetry,
      waitBetweenAutoRunRounds,
    };
  }

  return {
    createAutoRunSessionRunner,
  };
});
