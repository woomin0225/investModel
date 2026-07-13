import { createHmac, timingSafeEqual } from 'node:crypto';

export type WebhookSignatureFailureReason =
  | 'missing_secret'
  | 'missing_payload'
  | 'missing_signature'
  | 'malformed_header'
  | 'timestamp_outside_tolerance'
  | 'signature_mismatch';

export type WebhookSignatureVerificationResult =
  | {
      ok: true;
      provider: 'generic_hmac_sha256' | 'stripe_style_hmac_sha256';
      matchedSignature: string;
      timestamp?: number;
    }
  | {
      ok: false;
      provider: 'generic_hmac_sha256' | 'stripe_style_hmac_sha256';
      reason: WebhookSignatureFailureReason;
      timestamp?: number;
    };

export interface GenericWebhookSignatureInput {
  payload: string | Buffer;
  secret: string;
  signatureHeader: string | null | undefined;
  signaturePrefix?: string;
}

export interface StripeStyleWebhookSignatureInput {
  payload: string | Buffer;
  secret: string;
  signatureHeader: string | null | undefined;
  toleranceSeconds?: number;
  nowSeconds?: number;
}

const defaultSignaturePrefix = 'sha256=';
const defaultToleranceSeconds = 300;

export function createWebhookHmacSha256Signature({
  payload,
  secret,
  signedPayloadPrefix
}: {
  payload: string | Buffer;
  secret: string;
  signedPayloadPrefix?: string;
}): string {
  return createHmac('sha256', secret)
    .update(toSignedPayloadBuffer(payload, signedPayloadPrefix))
    .digest('hex');
}

export function verifyGenericWebhookSignature({
  payload,
  secret,
  signatureHeader,
  signaturePrefix = defaultSignaturePrefix
}: GenericWebhookSignatureInput): WebhookSignatureVerificationResult {
  if (!secret) {
    return { ok: false, provider: 'generic_hmac_sha256', reason: 'missing_secret' };
  }

  if (!hasPayload(payload)) {
    return { ok: false, provider: 'generic_hmac_sha256', reason: 'missing_payload' };
  }

  if (!signatureHeader) {
    return { ok: false, provider: 'generic_hmac_sha256', reason: 'missing_signature' };
  }

  const receivedSignature = stripSignaturePrefix(signatureHeader, signaturePrefix);
  const expectedSignature = createWebhookHmacSha256Signature({ payload, secret });

  if (constantTimeHexEqual(receivedSignature, expectedSignature)) {
    return {
      ok: true,
      provider: 'generic_hmac_sha256',
      matchedSignature: receivedSignature
    };
  }

  return {
    ok: false,
    provider: 'generic_hmac_sha256',
    reason: 'signature_mismatch'
  };
}

export function verifyStripeStyleWebhookSignature({
  payload,
  secret,
  signatureHeader,
  toleranceSeconds = defaultToleranceSeconds,
  nowSeconds = Math.floor(Date.now() / 1000)
}: StripeStyleWebhookSignatureInput): WebhookSignatureVerificationResult {
  if (!secret) {
    return {
      ok: false,
      provider: 'stripe_style_hmac_sha256',
      reason: 'missing_secret'
    };
  }

  if (!hasPayload(payload)) {
    return {
      ok: false,
      provider: 'stripe_style_hmac_sha256',
      reason: 'missing_payload'
    };
  }

  if (!signatureHeader) {
    return {
      ok: false,
      provider: 'stripe_style_hmac_sha256',
      reason: 'missing_signature'
    };
  }

  const parsedHeader = parseStripeStyleSignatureHeader(signatureHeader);

  if (!parsedHeader) {
    return {
      ok: false,
      provider: 'stripe_style_hmac_sha256',
      reason: 'malformed_header'
    };
  }

  const timestampAge = Math.abs(nowSeconds - parsedHeader.timestamp);

  if (timestampAge > toleranceSeconds) {
    return {
      ok: false,
      provider: 'stripe_style_hmac_sha256',
      reason: 'timestamp_outside_tolerance',
      timestamp: parsedHeader.timestamp
    };
  }

  const expectedSignature = createWebhookHmacSha256Signature({
    payload,
    secret,
    signedPayloadPrefix: `${parsedHeader.timestamp}.`
  });

  const matchedSignature = parsedHeader.signatures.find((signature) =>
    constantTimeHexEqual(signature, expectedSignature)
  );

  if (!matchedSignature) {
    return {
      ok: false,
      provider: 'stripe_style_hmac_sha256',
      reason: 'signature_mismatch',
      timestamp: parsedHeader.timestamp
    };
  }

  return {
    ok: true,
    provider: 'stripe_style_hmac_sha256',
    matchedSignature,
    timestamp: parsedHeader.timestamp
  };
}

export function buildStripeStyleSignatureHeader({
  payload,
  secret,
  timestamp
}: {
  payload: string | Buffer;
  secret: string;
  timestamp: number;
}): string {
  const signature = createWebhookHmacSha256Signature({
    payload,
    secret,
    signedPayloadPrefix: `${timestamp}.`
  });

  return `t=${timestamp},v1=${signature}`;
}

function parseStripeStyleSignatureHeader(
  signatureHeader: string
): { timestamp: number; signatures: string[] } | null {
  const parts = signatureHeader.split(',').map((part) => part.trim());
  const timestampPart = parts.find((part) => part.startsWith('t='));
  const signatureParts = parts.filter((part) => part.startsWith('v1='));

  if (!timestampPart || signatureParts.length === 0) {
    return null;
  }

  const timestamp = Number(timestampPart.slice(2));

  if (!Number.isInteger(timestamp) || timestamp <= 0) {
    return null;
  }

  return {
    timestamp,
    signatures: signatureParts.map((part) => part.slice(3))
  };
}

function stripSignaturePrefix(signatureHeader: string, signaturePrefix: string): string {
  const trimmedHeader = signatureHeader.trim();

  return trimmedHeader.startsWith(signaturePrefix)
    ? trimmedHeader.slice(signaturePrefix.length)
    : trimmedHeader;
}

function constantTimeHexEqual(receivedSignature: string, expectedSignature: string): boolean {
  if (!isHex(receivedSignature) || !isHex(expectedSignature)) {
    return false;
  }

  const received = Buffer.from(receivedSignature, 'hex');
  const expected = Buffer.from(expectedSignature, 'hex');

  if (received.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(received, expected);
}

function toSignedPayloadBuffer(payload: string | Buffer, signedPayloadPrefix?: string): Buffer {
  const payloadBuffer = Buffer.isBuffer(payload) ? payload : Buffer.from(payload, 'utf8');

  if (!signedPayloadPrefix) {
    return payloadBuffer;
  }

  return Buffer.concat([Buffer.from(signedPayloadPrefix, 'utf8'), payloadBuffer]);
}

function hasPayload(payload: string | Buffer): boolean {
  return Buffer.isBuffer(payload) ? payload.length > 0 : payload.length > 0;
}

function isHex(value: string): boolean {
  return value.length % 2 === 0 && /^[a-fA-F0-9]+$/.test(value);
}
