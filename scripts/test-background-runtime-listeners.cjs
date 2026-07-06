const test = require('node:test');
const assert = require('node:assert/strict');
const moduleApi = require('../background/bootstrap/runtime-listeners.js');

function createEventSink() {
  const listeners = [];
  return { listeners, addListener: (listener) => listeners.push(listener) };
}

test('registers runtime, alarm, tab, startup, and installed listeners', () => {
  const events = {
    onMessage: createEventSink(),
    onAlarm: createEventSink(),
    onUpdated: createEventSink(),
    onStartup: createEventSink(),
    onInstalled: createEventSink(),
  };
  const chromeApi = {
    runtime: { onMessage: events.onMessage, onStartup: events.onStartup, onInstalled: events.onInstalled },
    alarms: { onAlarm: events.onAlarm },
    tabs: { onUpdated: events.onUpdated },
  };
  const registrar = moduleApi.createRuntimeListenerRegistrar({
    chromeApi,
    handleMessage: () => true,
    handleAlarm: () => {},
    handleTabUpdated: () => {},
    handleStartup: () => {},
    handleInstalled: () => {},
  });

  registrar.registerRuntimeListeners();

  assert.equal(events.onMessage.listeners.length, 1);
  assert.equal(events.onAlarm.listeners.length, 1);
  assert.equal(events.onUpdated.listeners.length, 1);
  assert.equal(events.onStartup.listeners.length, 1);
  assert.equal(events.onInstalled.listeners.length, 1);
});
