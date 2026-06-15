const { readJSON, writeJSON } = require('../lib/s3');

module.exports = async (event) => {
  const userId = event.headers['x-user-id'];
  const cards  = await readJSON(`users/${userId}/feed/active.json`) || [];

  const now    = new Date();
  const active = cards.filter(c => {
    if (c.type === 'INFO') return !c.expiresAt || new Date(c.expiresAt) > now;
    return true;
  });

  const expired = cards.filter(c => c.type === 'INFO' && c.expiresAt && new Date(c.expiresAt) <= now);
  if (expired.length) {
    const archKey = `users/${userId}/feed/archive.json`;
    let   archive = await readJSON(archKey) || [];
    const cutoff7 = Date.now() - 7 * 24 * 3600000;
    archive = archive.filter(c => new Date(c.createdAt) > cutoff7);
    archive = [...expired, ...archive];
    await writeJSON(archKey, archive.slice(0, 200));
    await writeJSON(`users/${userId}/feed/active.json`, active);
  }

  const order = { high: 0, medium: 1, low: 2 };
  active.sort((a, b) => {
    if (order[a.importance] !== order[b.importance])
      return order[a.importance] - order[b.importance];
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ cards: active, count: active.length })
  };
};