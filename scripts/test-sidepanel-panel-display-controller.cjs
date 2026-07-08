const test = require('node:test');
const assert = require('node:assert/strict');

require('../sidepanel/panel-display-controller.js');

function createElement() {
  return {
    style: { display: '' },
    disabled: false,
  };
}

test('hotmail provider does not show custom email pool from stale generator value', () => {
  const rowCustomEmailPool = createElement();
  let resetCount = 0;
  let refreshCount = 0;
  const controller = globalThis.SidepanelPanelDisplayController.createPanelDisplayController({
    constants: {
      CUSTOM_EMAIL_POOL_GENERATOR: 'custom-pool',
      LUCKMAIL_PROVIDER: 'luckmail-api',
      ICLOUD_PROVIDER: 'icloud',
      ICLOUD_API_PROVIDER: 'icloud-api',
      CLOUDFLARE_TEMP_EMAIL_PROVIDER: 'cloudflare-temp-email',
      CLOUD_MAIL_PROVIDER: 'cloudmail',
      FREEMAIL_PROVIDER: 'freemail',
    },
    dom: {
      selectMailProvider: { value: 'hotmail-api' },
      selectEmailGenerator: { value: 'custom-pool', disabled: false },
      rowCustomMailProviderPool: createElement(),
      rowMail2925Mode: createElement(),
      rowMail2925PoolSettings: createElement(),
      rowCustomEmailPool,
      icloudSection: createElement(),
      luckmailSection: createElement(),
      cloudflareTempEmailSection: createElement(),
      cloudMailSection: createElement(),
      freemailSection: createElement(),
      rowEmailGenerator: createElement(),
      inputIcloudApiBaseUrl: createElement(),
      inputIcloudApiAdminKey: createElement(),
    },
    getters: {
      getLatestState: () => ({}),
    },
    helpers: {
      queueCustomEmailPoolRefresh: () => { refreshCount += 1; },
      resetCustomEmailPoolManager: () => { resetCount += 1; },
    },
  });

  controller.updateMailProviderUI();

  assert.equal(rowCustomEmailPool.style.display, 'none');
  assert.equal(refreshCount, 0);
  assert.equal(resetCount, 1);
});

