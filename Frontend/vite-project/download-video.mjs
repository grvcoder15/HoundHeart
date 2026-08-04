import crypto from 'crypto';
import fs from 'fs';
import https from 'https';

const ACCESS_KEY    = 'tid_TBBoFazwKxHMFDrXtiipeOChMVJvKnCbEfLWaIoKChoqbbUJJw';
const SECRET_KEY    = 'tsec_AjBQCHaIc4KNW+FgHEAKyHkB1XcjbiW0rz_k0iNs5Elff4NsfRa+b9y71maQ_U_3i4JbQu';
const BUCKET        = 'reserved-drum-6yjidedugw9';
const ENDPOINT_HOST = 't3.storageapi.dev';
const REGION        = 'auto';
const OBJECT_KEY    = 'marketing-video/HoundHeart-Video.mp4';

function hmac(key, data) {
  return crypto.createHmac('sha256', key).update(data).digest();
}

function getSignatureKey(secretKey, dateStamp, region, service) {
  const kDate    = hmac('AWS4' + secretKey, dateStamp);
  const kRegion  = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, 'aws4_request');
}

function sha256Hex(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

async function downloadFile() {
  const now = new Date();
  const amzDate  = now.toISOString().replace(/[:-]|\.\d{3}/g, '').slice(0, 15) + 'Z';
  const dateStamp = amzDate.slice(0, 8);

  const method      = 'GET';
  const canonicalUri = `/${BUCKET}/${OBJECT_KEY}`;
  const queryString  = '';
  const host         = ENDPOINT_HOST;
  const payloadHash  = sha256Hex('');

  const canonicalHeaders =
    `host:${host}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`;

  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';

  const canonicalRequest = [
    method,
    canonicalUri,
    queryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join('\n');

  const credentialScope = `${dateStamp}/${REGION}/s3/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest)
  ].join('\n');

  const signingKey = getSignatureKey(SECRET_KEY, dateStamp, REGION, 's3');
  const signature  = hmac(signingKey, stringToSign).toString('hex');

  const authHeader =
    `AWS4-HMAC-SHA256 Credential=${ACCESS_KEY}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const url = `https://${host}/${BUCKET}/${OBJECT_KEY}`;
  console.log(`Downloading from ${url}...`);

  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: 'GET',
      headers: {
        'Host': host,
        'x-amz-content-sha256': payloadHash,
        'x-amz-date': amzDate,
        'Authorization': authHeader
      }
    }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to download: ${res.statusCode} ${res.statusMessage}`));
        return;
      }
      const file = fs.createWriteStream('public/houndheart-video.mp4');
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log('Download complete!');
        resolve();
      });
    });
    req.on('error', reject);
    req.end();
  });
}

downloadFile().catch(console.error);
