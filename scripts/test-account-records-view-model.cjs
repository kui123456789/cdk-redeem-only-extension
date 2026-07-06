const test = require('node:test');
const assert = require('node:assert/strict');

delete globalThis.SidepanelAccountRecordsViewModel;
const viewModel = require('../sidepanel/account-records-view-model.js');

test('buildRecordId prefers recordId and falls back to email then accountIdentifier', () => {
  assert.equal(viewModel.buildRecordId({ recordId: ' Record-01 ', email: 'user@example.com' }), 'record-01');
  assert.equal(viewModel.buildRecordId({ email: ' User@Example.COM ' }), 'user@example.com');
  assert.equal(viewModel.buildRecordId({ accountIdentifier: ' Fallback@Example.COM ' }), 'fallback@example.com');
  assert.equal(viewModel.buildRecordId({}), '');
});

test('email helpers normalize email text while getRecordEmail preserves display casing', () => {
  assert.equal(viewModel.normalizeEmail(' User@Example.COM '), 'user@example.com');
  assert.equal(viewModel.getRecordEmail({ email: ' User@Example.COM ' }), 'User@Example.COM');
  assert.equal(viewModel.getRecordEmail({ accountIdentifier: ' Alias@Example.COM ' }), 'Alias@Example.COM');
});

test('summarizeAccountRunHistory counts statuses and retry totals', () => {
  const records = [
    { displayStatus: ' Success ', retryCount: 0 },
    { finalStatus: 'running', retryCount: 2 },
    { displayStatus: 'failed', retryCount: '3' },
    { finalStatus: 'stopped', retryCount: -1 },
    { displayStatus: 'unknown', retryCount: 'bad' },
  ];

  assert.deepEqual(viewModel.summarizeAccountRunHistory(records), {
    total: 5,
    success: 1,
    running: 1,
    failed: 1,
    stopped: 1,
    retryRecordCount: 2,
    retryTotal: 5,
  });
});

test('filterRecords applies account record status and retry filter semantics', () => {
  const records = [
    { id: 'success', displayStatus: 'success' },
    { id: 'running', displayStatus: 'running', retryCount: 1 },
    { id: 'failed', finalStatus: 'failed' },
    { id: 'stopped', displayStatus: 'stopped', retryCount: 2 },
  ];

  assert.deepEqual(viewModel.filterRecords(records, 'all').map((record) => record.id), [
    'success',
    'running',
    'failed',
    'stopped',
  ]);
  assert.deepEqual(viewModel.filterRecords(records, 'success').map((record) => record.id), ['success']);
  assert.deepEqual(viewModel.filterRecords(records, 'running').map((record) => record.id), ['running']);
  assert.deepEqual(viewModel.filterRecords(records, 'failed').map((record) => record.id), ['failed']);
  assert.deepEqual(viewModel.filterRecords(records, 'stopped').map((record) => record.id), ['stopped']);
  assert.deepEqual(viewModel.filterRecords(records, 'retry').map((record) => record.id), ['running', 'stopped']);
  assert.deepEqual(viewModel.filterRecords(records, 'unknown').map((record) => record.id), [
    'success',
    'running',
    'failed',
    'stopped',
  ]);
});
