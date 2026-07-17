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

test('redeem channel chooser disables unavailable pools while enabled PIX resolves', async () => {
  const { dom, service } = createActionModalService();

  const choicePromise = service.openRedeemChannelChoiceDialog({
    upi: { candidateCount: 2, cdkeyCount: 0, redeemCount: 0 },
    ideal: { candidateCount: 0, cdkeyCount: 2, redeemCount: 0 },
    pix: { candidateCount: 3, cdkeyCount: 1, redeemCount: 1 },
  });

  assert.equal(dom.cancelButton.disabled, true);
  assert.equal(dom.cancelButton.onclick, null);
  assert.equal(dom.restartButton.disabled, true);
  assert.equal(dom.restartButton.onclick, null);
  assert.equal(dom.continueButton.disabled, false);
  assert.equal(typeof dom.continueButton.onclick, 'function');
  assert.equal(dom.continueButton.textContent, 'PIX (1)');

  dom.continueButton.onclick();

  assert.equal(await choicePromise, 'pix');
});
