const { readJSON, writeJSON } = require('../lib/s3');
const { v4: uuidv4 }         = require('uuid');

module.exports = async (event) => {
  const { name, email, deviceToken } = JSON.parse(event.body);
  const userId = uuidv4();
  const profile = {
    userId, name, email, deviceToken,
    createdAt: new Date().toISOString(),
    sources: { whatsapp: false, gmail: false, classroom: false }
  };
  await writeJSON(`users/${userId}/profile.json`, profile);
  await writeJSON(`users/${userId}/feed/active.json`, []);
  await writeJSON(`users/${userId}/feed/archive.json`, []);
  await writeJSON(`users/${userId}/todos/active.json`, []);
  await writeJSON(`users/${userId}/todos/completed.json`, []);
  await writeJSON(`users/${userId}/corrections/log.json`, []);
  await writeJSON(`users/${userId}/processed-ids.json`, { ids: [] });
  await writeJSON(`users/${userId}/settings.json`, {
    trackedGroups: [],
    notifications: { high: true, medium: true, low: false },
    sources: { whatsapp: false, gmail: false, classroom: false }
  });
  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ userId, ok: true })
  };
};