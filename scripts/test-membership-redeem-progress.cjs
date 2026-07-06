const test = require('node:test');
const assert = require('node:assert/strict');

const redeemProgress = require('../sidepanel/membership-redeem-progress.js');

test('clamps redeem progress percent into the progressbar range', () => {
  assert.equal(redeemProgress.clampRedeemProgressPercent(-10), 0);
  assert.equal(redeemProgress.clampRedeemProgressPercent('45.9'), 45);
  assert.equal(redeemProgress.clampRedeemProgressPercent(120), 100);
  assert.equal(redeemProgress.clampRedeemProgressPercent('bad'), 0);
});

test('submitted and pending rows render active progress', () => {
  const submitted = redeemProgress.getUpiCredentialMembershipRedeemProgressMeta({
    email: 'ready@example.com',
    status: 'free',
    redeemStatus: 'submitted',
    accessToken: 'at-token',
  });
  const pending = redeemProgress.getUpiCredentialMembershipRedeemProgressMeta({
    email: 'pending@example.com',
    status: 'free',
    redeemStatus: 'pending',
    accessToken: 'at-token',
  });

  assert.equal(submitted.percent, 68);
  assert.equal(submitted.label, '68%');
  assert.equal(submitted.className, 'is-running');
  assert.equal(submitted.running, true);
  assert.equal(pending.percent, 24);
  assert.equal(pending.label, '24%');
  assert.equal(pending.running, true);

  const html = redeemProgress.renderUpiCredentialMembershipRedeemProgress(
    { email: 'Ready@Example.com' },
    submitted
  );
  assert.match(html, /class="upi-membership-redeem-progress is-running is-running"/);
  assert.match(html, /style="--redeem-progress:68%;"/);
  assert.match(html, /role="progressbar"/);
  assert.match(html, /aria-valuenow="68"/);
  assert.match(html, />68%<\/span>/);
});

test('terminal success and failure states render expected labels and status classes', () => {
  const success = redeemProgress.getUpiCredentialMembershipRedeemProgressMeta({
    email: 'plus@example.com',
    status: 'paid',
    redeemChannel: 'ideal',
    accessToken: 'at-token',
  });
  const failure = redeemProgress.getUpiCredentialMembershipRedeemProgressMeta({
    email: 'failed@example.com',
    status: 'free',
    redeemStatus: 'failed',
    redeemReason: 'CDK rejected',
    accessToken: 'at-token',
  });

  assert.deepEqual(success, {
    percent: 100,
    label: '100%',
    className: 'is-success',
    title: 'IDEAL 兑换已完成。',
  });
  assert.deepEqual(failure, {
    percent: 100,
    label: '失败',
    className: 'is-failed',
    title: 'CDK rejected',
  });

  assert.match(
    redeemProgress.renderUpiCredentialMembershipRedeemProgress({ email: 'plus@example.com' }, success),
    /class="upi-membership-redeem-progress is-success"/
  );
  assert.match(
    redeemProgress.renderUpiCredentialMembershipRedeemProgress({ email: 'failed@example.com' }, failure),
    />失败<\/span>/
  );
});

test('unknown and free rows keep the existing idle or missing-AT fallback behavior', () => {
  const missingAccessToken = redeemProgress.getUpiCredentialMembershipRedeemProgressMeta({
    email: 'free@example.com',
    status: 'free',
    accessToken: '',
  });
  const idle = redeemProgress.getUpiCredentialMembershipRedeemProgressMeta({
    email: 'idle@example.com',
    status: 'free',
    redeemStatus: 'unknown-status',
    accessToken: 'at-token',
  });

  assert.deepEqual(missingAccessToken, {
    percent: 0,
    label: '缺AT',
    className: 'is-muted',
    title: '缺少 AT，无法兑换。',
  });
  assert.deepEqual(idle, {
    percent: 0,
    label: '0%',
    className: 'is-idle',
    title: 'UPI 待兑换。',
  });

  const html = redeemProgress.renderUpiCredentialMembershipRedeemProgress(
    { email: 'idle@example.com' },
    idle
  );
  assert.match(html, /class="upi-membership-redeem-progress is-idle"/);
  assert.match(html, /aria-valuenow="0"/);
  assert.doesNotMatch(html, /is-running is-running/);
});

test('cancel progress button escapes row and cancel-control attributes', () => {
  const html = redeemProgress.renderUpiCredentialMembershipRedeemProgress(
    { email: 'Victim@Example.com" onclick="alert(1)' },
    {
      percent: 150,
      label: '<done>',
      className: 'is-running" data-pwn="1',
      running: true,
      title: '<progress>',
    },
    {
      visible: true,
      title: 'Cancel "redeem" <now>',
      cdkey: 'CDK-"<script>&',
      channel: 'upi" autofocus="autofocus',
      disabled: true,
    }
  );

  assert.match(html, /^<button /);
  assert.match(html, /disabled aria-label="Cancel &quot;redeem&quot; &lt;now&gt;"/);
  assert.match(html, /style="--redeem-progress:100%;"/);
  assert.match(html, /class="upi-membership-redeem-progress is-running&quot; data-pwn=&quot;1 is-running"/);
  assert.match(html, /data-upi-membership-cancel-redeem="victim@example.com&quot; onclick=&quot;alert\(1\)"/);
  assert.match(html, /data-upi-membership-cancel-cdkey="CDK-&quot;&lt;script&gt;&amp;"/);
  assert.match(html, /data-upi-membership-cancel-channel="upi&quot; autofocus=&quot;autofocus"/);
  assert.match(html, />&lt;done&gt;<\/span>/);
  assert.doesNotMatch(html, /onclick="alert\(1\)"/);
  assert.doesNotMatch(html, /<script>/);
});
