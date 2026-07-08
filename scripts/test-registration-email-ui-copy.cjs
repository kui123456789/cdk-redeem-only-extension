const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createRegistrationEmailUiCopy,
} = require('../sidepanel/registration-email-ui-copy.js');

function createCopy(overrides = {}) {
  const state = {
    provider: overrides.provider || 'icloud',
    generator: overrides.generator || 'custom-pool',
  };
  return createRegistrationEmailUiCopy({
    constants: {
      CLOUD_MAIL_PROVIDER: 'cloudmail',
      CLOUDFLARE_TEMP_EMAIL_PROVIDER: 'cloudflare-temp-email',
      CUSTOM_EMAIL_POOL_GENERATOR: 'custom-pool',
      FREEMAIL_PROVIDER: 'freemail',
      GMAIL_ALIAS_GENERATOR: 'gmail-alias',
      ICLOUD_PROVIDER: 'icloud',
      MOEMAIL_GENERATOR: 'moemail',
      OUTLOOK_EMAIL_PLUS_GENERATOR: 'outlook-email-plus',
      YYDSMAIL_GENERATOR: 'yydsmail',
    },
    getters: {
      getLatestState: () => ({ mailProvider: state.provider }),
      getSelectedEmailGenerator: () => state.generator,
      getSelectedMailProvider: () => state.provider,
    },
    helpers: {
      getManagedAliasProviderUiCopy: () => ({
        buttonLabel: '生成',
        placeholder: '别名邮箱提示',
        successVerb: '生成',
        label: '别名邮箱',
      }),
      isCustomMailProvider: () => state.provider === 'custom',
      usesCustomMailProviderPool: () => false,
      usesGeneratedAliasMailProvider: () => false,
    },
  });
}

test('icloud provider with custom pool generator shows custom pool registration copy', () => {
  const manager = createCopy({
    provider: 'icloud',
    generator: 'custom-pool',
  });
  const copy = manager.getCurrentRegistrationEmailUiCopy();
  const dom = {
    inputEmail: { placeholder: '' },
    btnFetchEmail: { textContent: '', title: '' },
  };
  manager.updateRegistrationEmailUiCopy(dom);

  assert.equal(copy.label, '自定义邮箱池');
  assert.equal(copy.buttonLabel, '取下一个');
  assert.match(copy.placeholder, /邮箱池/);
  assert.match(dom.inputEmail.placeholder, /邮箱池/);
  assert.equal(dom.btnFetchEmail.textContent, '取下一个');
});

test('hotmail provider keeps Microsoft account pool registration copy', () => {
  const copy = createCopy({
    provider: 'hotmail-api',
    generator: 'custom-pool',
  }).getCurrentRegistrationEmailUiCopy();

  assert.equal(copy.label, '微软邮箱账户池');
  assert.equal(copy.buttonLabel, '获取');
  assert.match(copy.placeholder, /微软邮箱账户池/);
});
