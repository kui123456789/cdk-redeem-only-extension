const test = require('node:test');
const assert = require('node:assert/strict');

require('../sidepanel/custom-email-pool-manager.js');

function createElementStub() {
  return {
    innerHTML: '',
    textContent: '',
    value: '',
    checked: false,
    indeterminate: false,
    disabled: false,
  };
}

function createListElementStub() {
  const element = createElementStub();
  element.children = [];
  element.appendChild = (child) => {
    element.children.push(child);
    element.innerHTML += `<div class="${child.className || ''}">${child.innerHTML || ''}</div>`;
  };
  return element;
}

function createRenderedItemStub() {
  return {
    className: '',
    innerHTML: '',
    querySelector: () => ({
      addEventListener: () => {},
    }),
  };
}

function createManager(entries = [], overrides = {}) {
  const dom = {
    customEmailPoolList: createListElementStub(),
    customEmailPoolSummary: createElementStub(),
    checkboxCustomEmailPoolSelectAll: createElementStub(),
    customEmailPoolSelectionSummary: createElementStub(),
    btnCustomEmailPoolClearUsed: createElementStub(),
    btnCustomEmailPoolDeleteAll: createElementStub(),
    inputCustomEmailPoolSearch: createElementStub(),
    selectCustomEmailPoolFilter: createElementStub(),
  };
  const manager = globalThis.SidepanelCustomEmailPoolManager.createCustomEmailPoolManager({
    dom,
    helpers: {
      escapeHtml: (value) => String(value || ''),
      showToast: () => {},
      copyTextToClipboard: async () => {},
      openConfirmModal: async () => false,
    },
    state: {
      getEntries: () => entries,
      getCredentialForEmail: () => ({}),
      getCurrentEmail: () => '',
      isVisible: () => true,
      ...(overrides.state || {}),
    },
    actions: overrides.actions || {},
  });
  return { dom, manager };
}

test('custom email pool reset keeps the visible empty-state frame', () => {
  const { dom, manager } = createManager();
  dom.customEmailPoolList.innerHTML = '<div>stale row</div>';
  dom.inputCustomEmailPoolSearch.value = 'abc';
  dom.selectCustomEmailPoolFilter.value = 'used';

  manager.reset();

  assert.match(dom.customEmailPoolList.innerHTML, /luckmail-empty/);
  assert.match(dom.customEmailPoolList.innerHTML, /还没有自定义邮箱/);
  assert.equal(dom.inputCustomEmailPoolSearch.value, '');
  assert.equal(dom.selectCustomEmailPoolFilter.value, 'all');
  assert.equal(dom.customEmailPoolSelectionSummary.textContent, '已选 0 个（当前显示 0 个）');
});

test('custom email pool empty render uses the same visible empty-state frame', () => {
  const { dom, manager } = createManager([]);

  manager.renderCustomEmailPoolEntries();

  assert.match(dom.customEmailPoolList.innerHTML, /luckmail-empty/);
  assert.match(dom.customEmailPoolList.innerHTML, /还没有自定义邮箱/);
  assert.equal(dom.btnCustomEmailPoolClearUsed.disabled, true);
  assert.equal(dom.btnCustomEmailPoolDeleteAll.disabled, true);
});

test('custom email pool refresh asks background reload before rendering', async () => {
  let reloadCalled = false;
  const { dom, manager } = createManager([], {
    actions: {
      reloadEntries: async () => {
        reloadCalled = true;
        return [];
      },
    },
  });

  await manager.refreshCustomEmailPoolEntries();

  assert.equal(reloadCalled, true);
  assert.match(dom.customEmailPoolList.innerHTML, /luckmail-empty/);
});

test('custom email pool marks first available entry current while auto-running without a matching current email', () => {
  const previousDocument = globalThis.document;
  globalThis.document = { createElement: () => createRenderedItemStub() };
  try {
    const { dom, manager } = createManager([
      { id: 'used', email: 'used@example.com', enabled: true, used: true },
      { id: 'next', email: 'next@example.com', enabled: true, used: false },
    ], {
      state: {
        getCurrentEmail: () => 'used@example.com',
        isAutoRunning: () => true,
      },
    });

    manager.renderCustomEmailPoolEntries();

    assert.equal(dom.customEmailPoolList.children.length, 2);
    assert.equal(dom.customEmailPoolList.children[0].className, 'luckmail-item');
    assert.equal(dom.customEmailPoolList.children[1].className, 'luckmail-item is-current');
    assert.match(dom.customEmailPoolList.children[1].innerHTML, /当前/);
  } finally {
    globalThis.document = previousDocument;
  }
});

test('custom email pool renders saved Free credential as used and eligible', () => {
  const previousDocument = globalThis.document;
  globalThis.document = { createElement: () => createRenderedItemStub() };
  try {
    const { dom, manager } = createManager([
      { id: 'entry', email: 'saved-free@example.com', enabled: true, used: false },
    ], {
      state: {
        getCredentialForEmail: () => ({
          email: 'saved-free@example.com',
          status: 'free',
          accessToken: 'at-test-token',
          checkedAt: '2026-07-09T11:14:06.000Z',
          reason: '账号有试用资格。',
        }),
      },
    });

    manager.renderCustomEmailPoolEntries();

    const html = dom.customEmailPoolList.children[0].innerHTML;
    assert.match(html, /有试用资格/);
    assert.match(html, /luckmail-tag used\">已用/);
    assert.doesNotMatch(html, /luckmail-tag active\">未用/);
  } finally {
    globalThis.document = previousDocument;
  }
});
