const { readJSON, writeJSON } = require('../lib/s3');

module.exports = async (event) => {
  const userId = event.headers['x-user-id'];
  const { cardId, reason } = JSON.parse(event.body);
  const key = `users/${userId}/corrections/log.json`;
  const log = await readJSON(key) || [];
  log.push({ cardId, reason, timestamp: new Date().toISOString() });
  await writeJSON(key, log);
  const feedKey = `users/${userId}/feed/active.json`;
  const cards   = await readJSON(feedKey) || [];
  await writeJSON(feedKey, cards.filter(c => c.id !== cardId));
  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ ok: true })
  };
};