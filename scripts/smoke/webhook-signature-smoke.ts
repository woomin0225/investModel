import assert from 'node:assert/strict';

import {
  buildStripeStyleSignatureHeader,
  createWebhookHmacSha256Signature,
  verifyGenericWebhookSignature,
  verifyStripeStyleWebhookSignature
} from '../../lib/security/webhook-signature';

const payload = Buffer.from('{"modelVersion":"mv_demo","event":"scan_passed"}', 'utf8');
const testSecret = 'test_webhook_secret_for_hmac_only';

const genericSignature = createWebhookHmacSha256Signature({
  payload,
  secret: testSecret
});

assert.deepEqual(
  verifyGenericWebhookSignature({
    payload,
    secret: testSecret,
    signatureHeader: `sha256=${genericSignature}`
  }),
  {
    ok: true,
    provider: 'generic_hmac_sha256',
    matchedSignature: genericSignature
  }
);

assert.equal(
  verifyGenericWebhookSignature({
    payload,
    secret: testSecret,
    signatureHeader: 'sha256=bad'
  }).ok,
  false
);

const timestamp = 1_800_000_000;
const stripeStyleHeader = buildStripeStyleSignatureHeader({
  payload,
  secret: testSecret,
  timestamp
});

const stripeStyleResult = verifyStripeStyleWebhookSignature({
  payload,
  secret: testSecret,
  signatureHeader: stripeStyleHeader,
  nowSeconds: timestamp + 60
});

assert.equal(stripeStyleResult.ok, true);

if (stripeStyleResult.ok) {
  assert.equal(stripeStyleResult.timestamp, timestamp);
}

assert.deepEqual(
  verifyStripeStyleWebhookSignature({
    payload,
    secret: testSecret,
    signatureHeader: stripeStyleHeader,
    nowSeconds: timestamp + 301
  }),
  {
    ok: false,
    provider: 'stripe_style_hmac_sha256',
    reason: 'timestamp_outside_tolerance',
    timestamp
  }
);

assert.equal(
  verifyStripeStyleWebhookSignature({
    payload: Buffer.from('{"tampered":true}', 'utf8'),
    secret: testSecret,
    signatureHeader: stripeStyleHeader,
    nowSeconds: timestamp + 60
  }).ok,
  false
);

console.log('Webhook signature smoke test passed for generic and Stripe-style HMAC verification.');
