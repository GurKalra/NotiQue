const { readJSON } = require('../lib/s3');
const { S3Client, ListObjectsV2Command, DeleteObjectsCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({ region: process.env.AWS_REGION_NAME });
const BUCKET = process.env.S3_BUCKET;

module.exports = async (event) => {
  const userId = event.headers['x-user-id'];
  const method = event.httpMethod;

  if (method === 'GET') {
    const profile = await readJSON(`users/${userId}/profile.json`);
    if (!profile)
      return { statusCode: 404, body: JSON.stringify({ error: 'Profile not found' }) };
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        name:    profile.name,
        email:   profile.email,
        sources: profile.sources
      })
    };
  }

  if (method === 'DELETE') {
    if (!userId) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'x-user-id header required' })
      };
    }

    const prefix = `users/${userId}/`;

    try {
      let continuationToken;
      do {
        const listed = await s3.send(new ListObjectsV2Command({
          Bucket: BUCKET,
          Prefix: prefix,
          ContinuationToken: continuationToken
        }));

        const objects = (listed.Contents || []).map(obj => ({ Key: obj.Key }));

        if (objects.length > 0) {
          await s3.send(new DeleteObjectsCommand({
            Bucket: BUCKET,
            Delete: { Objects: objects }
          }));
        }

        continuationToken = listed.IsTruncated ? listed.NextContinuationToken : undefined;
      } while (continuationToken);

      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ ok: true })
      };
    } catch (err) {
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: err.message })
      };
    }
  }

  return {
    statusCode: 405,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ error: 'Method not allowed' })
  };
};