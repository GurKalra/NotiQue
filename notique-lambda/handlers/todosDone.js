const { readJSON, writeJSON } = require('../lib/s3');

module.exports = async (event) => {
  const userId  = event.headers['x-user-id'];
  const { todoId } = JSON.parse(event.body);
  const key    = `users/${userId}/todos/active.json`;
  const active = await readJSON(key) || [];
  const todo   = active.find(t => t.id === todoId);
  if (!todo) return { statusCode: 404, body: JSON.stringify({ error: 'Todo not found' }) };

  const doneKey   = `users/${userId}/todos/completed.json`;
  let   completed = await readJSON(doneKey) || [];
  const cutoff30  = Date.now() - 30 * 24 * 3600000;
  completed = completed.filter(t => new Date(t.completedAt || t.createdAt) > cutoff30);
  completed.unshift({ ...todo, completedAt: new Date().toISOString() });
  await writeJSON(doneKey, completed.slice(0, 100));
  await writeJSON(key, active.filter(t => t.id !== todoId));
  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ ok: true })
  };
};