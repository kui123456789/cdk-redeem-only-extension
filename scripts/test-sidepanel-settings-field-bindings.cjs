const test = require('node:test');
const assert = require('node:assert/strict');
const moduleApi = require('../sidepanel/settings-field-bindings.js');

function fakeInput(value = '') {
  const listeners = {};
  return {
    value,
    addEventListener(type, listener) { listeners[type] = listener; },
    dispatch(type) { listeners[type]?.({ target: this }); },
    listeners,
  };
}

test('bindInput normalizes value and schedules save', () => {
  const input = fakeInput('  abc  ');
  const calls = [];
  const binder = moduleApi.createSettingsFieldBindings({
    scheduleSettingsSave: (patch) => calls.push(patch),
  });
  binder.bindInput(input, {
    key: 'sampleKey',
    normalize: (value) => String(value).trim(),
  });
  input.dispatch('input');
  assert.deepEqual(calls, [{ sampleKey: 'abc' }]);
});

test('bindBlur applies optional afterBlur callback', () => {
  const input = fakeInput('7');
  let afterBlurValue = '';
  const binder = moduleApi.createSettingsFieldBindings({ scheduleSettingsSave: () => {} });
  binder.bindBlur(input, {
    normalize: (value) => String(Number(value) + 1),
    afterBlur: (value) => { afterBlurValue = value; },
  });
  input.dispatch('blur');
  assert.equal(afterBlurValue, '8');
});
