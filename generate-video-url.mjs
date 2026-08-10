/**
 * Generates a 7-day presigned URL for the marketing video and prints it.
 * Run: node generate-video-url.mjs
 * Then copy the output URL and paste it into HoundHeartLandingPage.jsx
 */
import crypto from 'crypto';

const ACCESS_KEY    = 'tid_TBBoFazwKxHMFDrXtiipeOChMVJvKnCbEfLWaIoKChoqbbUJJw';
const SECRET_KEY    = 'tsec_AjBQCHaIc4KNW+FgHEAKyHkB1XcjbiW0rz_k0iNs5Elff4NsfRa+b9y71maQ_U_3i4JbQu';
const BUCKET        = 'reserved-drum-6yjidedugw9';
const ENDPOINT_HOST = 't3.storageapi.dev';
const REGION        = 'auto';
const OBJECT_KEY    = 'marketing-video/HoundHeart-Video.mp4';
const EXPIRY_SECS   = 604800; // 7 days (max allowed)

function hmac(key, data) {
  return crypto.createHmac('sha256', key).update(data).digest();
}
function getSigningKey(secret, date, region, service) {
  return hmac(hmac(hmac(hmac('AWS4' + secret, date), region), service), 'aws4_request');
}
function sha256Hex(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function generatePresignedUrl() {
  const now = new Date();
  const amzDate  = now.toISOString().replace(/[:-]|\.\d{3}/g, '').slice(0, 15) + 'Z';
  const dateStamp = amzDate.slice(0, 8);

  const credentialScope  = `${dateStamp}/${REGION}/s3/aws4_request`;
  const credential       = `${ACCESS_KEY}/${credentialScope}`;

  const queryParams = new URLSearchParams({
    'X-Amz-Algorithm':   'AWS4-HMAC-SHA256',
    'X-Amz-Credential':  credential,
    'X-Amz-Date':        amzDate,
    'X-Amz-Expires':     String(EXPIRY_SECS),
    'X-Amz-SignedHeaders': 'host',
  });

  // Sort query params alphabetically (required for canonical query string)
  const sortedQuery = Array.from(queryParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  const canonicalRequest = [
    'GET',
    `/${BUCKET}/${OBJECT_KEY}`,
    sortedQuery,
    `host:${ENDPOINT_HOST}\n`,
    'host',
    'UNSIGNED-PAYLOAD',
  ].join('\n');

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join('\n');

  const signingKey = getSigningKey(SECRET_KEY, dateStamp, REGION, 's3');
  const signature  = hmac(signingKey, stringToSign).toString('hex');

  const finalUrl = `https://${ENDPOINT_HOST}/${BUCKET}/${OBJECT_KEY}?${sortedQuery}&X-Amz-Signature=${signature}`;

  const expiresAt = new Date(now.getTime() + EXPIRY_SECS * 1000);
  console.log('\n✅ 7-day Presigned URL generated!');
  console.log(`⏰ Expires: ${expiresAt.toLocaleString()}\n`);
  console.log('📋 URL:\n');
  console.log(finalUrl);
  console.log('\n');

  return finalUrl;
}

generatePresignedUrl();
