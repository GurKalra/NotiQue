const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const s3     = new S3Client({ region: process.env.AWS_REGION_NAME });
const BUCKET = process.env.S3_BUCKET;

async function withRetry(fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try { return await fn(); }
    catch (e) {
      if (i === retries - 1) { console.error('S3 failed after retries:', e); throw e; }
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }
}

async function readJSON(key) {
  return withRetry(async () => {
    try {
      const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
      return JSON.parse(await res.Body.transformToString());
    } catch (e) {
      if (e.name === 'NoSuchKey') return null;
      throw e;
    }
  });
}

async function writeJSON(key, data) {
  return withRetry(() => s3.send(new PutObjectCommand({
    Bucket: BUCKET, Key: key,
    Body: JSON.stringify(data, null, 2),
    ContentType: 'application/json'
  })));
}

module.exports = { readJSON, writeJSON };