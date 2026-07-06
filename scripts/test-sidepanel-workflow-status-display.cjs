const test = require('node:test');
const assert = require('node:assert/strict');

delete globalThis.SidepanelWorkflowStatusDisplay;
const workflowStatusDisplay = require('../sidepanel/workflow-status-display.js');

function createManager() {
  return workflowStatusDisplay.createWorkflowStatusDisplayManager({
    isDoneStatus: (status) => status === 'completed' || status === 'manual_completed' || status === 'skipped',
    formatCountdown: (remainingMs) => `${Math.ceil(remainingMs / 1000)}秒`,
  });
}

const nodeIds = ['open-chatgpt', 'submit-email', 'fetch-code'];

test('active countdown produces remaining text and scheduled tone', () => {
  const manager = createManager();

  assert.deepEqual(manager.getStatusDisplayState({
    countdown: {
      at: 16000,
      title: '等待下一轮',
      tone: 'scheduled',
    },
    now: 10000,
  }), {
    text: '等待下一轮，剩余 6秒',
    tone: 'scheduled',
  });

  assert.deepEqual(manager.getStatusDisplayState({
    countdown: {
      at: 9000,
      title: '步骤等待',
      tone: 'running',
    },
    now: 10000,
  }), {
    text: '步骤等待，即将结束...',
    tone: 'running',
  });
});

test('paused and locked auto-run states use auto labels and running node hints', () => {
  const manager = createManager();

  assert.deepEqual(manager.getStatusDisplayState({
    autoPaused: true,
    autoRunLabel: ' (2/5)',
  }), {
    text: '自动已暂停 (2/5)，等待继续',
    tone: 'paused',
  });

  assert.deepEqual(manager.getStatusDisplayState({
    autoLocked: true,
    autoRunPhase: 'retrying',
    autoRunLabel: ' (尝试2)',
  }), {
    text: '自动重试中 (尝试2)',
    tone: 'running',
  });

  assert.deepEqual(manager.getStatusDisplayState({
    autoLocked: true,
    runningNodes: ['fetch-code'],
  }), {
    text: '节点 fetch-code 运行中...',
    tone: 'running',
  });
});

test('running failed and stopped node statuses map to expected display states', () => {
  const manager = createManager();

  assert.deepEqual(manager.getStatusDisplayState({
    nodeStatuses: { 'submit-email': 'running' },
  }), {
    text: '节点 submit-email 运行中...',
    tone: 'running',
  });

  assert.deepEqual(manager.getStatusDisplayState({
    nodeStatuses: { 'submit-email': 'failed' },
  }), {
    text: '节点 submit-email 失败',
    tone: 'failed',
  });

  assert.deepEqual(manager.getStatusDisplayState({
    nodeStatuses: { 'submit-email': 'stopped' },
  }), {
    text: '节点 submit-email 已停止',
    tone: 'stopped',
  });
});

test('completed and ready states match existing status bar text', () => {
  const manager = createManager();

  assert.deepEqual(manager.getStatusDisplayState({
    nodeIds,
    nodeStatuses: {
      'open-chatgpt': 'completed',
      'submit-email': 'manual_completed',
      'fetch-code': 'skipped',
    },
  }), {
    text: '全部节点已完成',
    tone: 'completed',
  });

  assert.deepEqual(manager.getStatusDisplayState({
    nodeIds,
    nodeStatuses: {
      'open-chatgpt': 'completed',
      'submit-email': 'pending',
      'fetch-code': 'pending',
    },
  }), {
    text: '节点 open-chatgpt 已完成',
    tone: '',
  });

  assert.deepEqual(manager.getStatusDisplayState({
    nodeIds,
    nodeStatuses: {},
  }), {
    text: '就绪',
    tone: '',
  });
});
