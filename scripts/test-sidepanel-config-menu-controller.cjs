const test = require('node:test');
const assert = require('node:assert/strict');
const moduleApi = require('../sidepanel/config-menu-controller.js');

function fakeButton() {
  const listeners = {};
  return {
    classList: { values: new Set(), toggle(name, enabled) { enabled ? this.values.add(name) : this.values.delete(name); } },
    addEventListener(type, listener) { listeners[type] = listener; },
    click() { listeners.click?.({ preventDefault() {}, stopPropagation() {} }); },
    listeners,
  };
}

test('config menu toggles open state and calls update callback', () => {
  const button = fakeButton();
  const menu = fakeButton();
  let updated = 0;
  const controller = moduleApi.createConfigMenuController({
    dom: { btnConfigMenu: button, configMenu: menu },
    onUpdate: () => { updated += 1; },
  });
  controller.bind();
  button.click();
  assert.equal(controller.isOpen(), true);
  assert.equal(updated, 1);
});
