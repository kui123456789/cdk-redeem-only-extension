const test = require('node:test');
const assert = require('node:assert/strict');

require('../background/generated-email-helpers.js');

const { createGeneratedEmailHelpers } = globalThis.MultiPageGeneratedEmailHelpers;

test('custom email pool generated email persists selected pool email', async () => {
  const persisted = [];
  const helpers = createGeneratedEmailHelpers({
    addLog: async () => {},
    getCustomEmailPoolEmail: () => 'selected@example.com',
    persistRegistrationEmailState: async (state, email, options) => {
      persisted.push({ state, email, options });
    },
    throwIfStopped: () => {},
  });

  const email = await helpers.fetchCustomEmailPoolEmail({
    customEmailPoolEntries: [{
      id: 'entry-1',
      email: 'selected@example.com',
      enabled: true,
      used: false,
    }],
  });

  assert.equal(email, 'selected@example.com');
  assert.equal(persisted.length, 1);
  assert.equal(persisted[0].email, 'selected@example.com');
  assert.equal(persisted[0].options.source, 'generated:custom-pool');
  assert.equal(persisted[0].options.selectedCustomEmailPoolEmail, 'selected@example.com');
});
