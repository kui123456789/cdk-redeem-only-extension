const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function createElementStub() {
  return {
    className: '',
    disabled: false,
    hidden: true,
    onclick: null,
    textContent: '',
  };
}

function createActionModalService() {
  const window = {};
  const source = fs.readFileSync(path.join(__dirname, '../sidepanel/action-modal-service.js'), 'utf8');
  vm.runInNewContext(source, { window });
  const dom = {
    modal: createElementStub(),
    title: createElementStub(),
    message: createElementStub(),
    alert: createElementStub(),
    optionRow: createElementStub(),
    optionInput: createElementStub(),
    optionText: createElementStub(),
    cancelButton: createElementStub(),
    restartButton: createElementStub(),
    continueButton: createElementStub(),
    closeButton: createElementStub(),
  };
  const service = window.SidepanelActionModalService.createActionModalService({ dom });
  return { dom, service };
}

test('auto start dialog close button cancels and hides modal', async () => {
  const { dom, service } = createActionModalService();

  const choicePromise = service.openAutoStartChoiceDialog(2);

  assert.equal(dom.modal.hidden, false);
  assert.equal(typeof dom.closeButton.onclick, 'function');

  dom.closeButton.onclick();

  assert.equal(await choicePromise, null);
  assert.equal(dom.modal.hidden, true);
  assert.equal(dom.closeButton.onclick, null);
});
