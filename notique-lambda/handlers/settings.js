const { readJSON, writeJSON } = require('../lib/s3');

module.exports = async (event) => {
  const userId = event.headers['x-user-id'];
  const method = event.httpMethod;

  if (method === 'GET') {
    const settings = await readJSON(`users/${userId}/settings.json`);
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(settings || {
        trackedGroups: [],
        notifications: { high: true, medium: true, low: false },
        sources: { whatsapp: false, gmail: false, classroom: false }
      })
    };
  }

  if (method === 'POST') {
    const body = JSON.parse(event.body);
    const existing = await readJSON(`users/${userId}/settings.json`) || {};
    const updated = { ...existing, ...body };
    await writeJSON(`users/${userId}/settings.json`, updated);
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: true })
    };
  }
};