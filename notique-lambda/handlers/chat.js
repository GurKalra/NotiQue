const { readJSON }    = require('../lib/s3');
const { invokeModel } = require('../lib/groq');

module.exports = async (event) => {
  const userId      = event.headers['x-user-id'];
  const { message } = JSON.parse(event.body);

  const [feed, todos, archive] = await Promise.all([
    readJSON(`users/${userId}/feed/active.json`),
    readJSON(`users/${userId}/todos/active.json`),
    readJSON(`users/${userId}/feed/archive.json`),
  ]);

  const systemPrompt = `
You are Campus Flow, a student assistant. Answer based ONLY on the data below.
If the answer is not in the data, say 'I don't see that in your current updates.'
Be concise. Use bullet points for lists. Never make up information.
For deadlines, be specific: say 'tonight at 11 PM' not 'soon'.
If asked about overdue items, check ACTION cards with deadlines in the past.

CURRENT FEED CARDS: ${JSON.stringify(feed || [], null, 2)}
ACTIVE TODOS: ${JSON.stringify(todos || [], null, 2)}
RECENT ARCHIVE (last 7 days): ${JSON.stringify(archive || [], null, 2)}
  `;

  const answer = await invokeModel(systemPrompt, message);
  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ answer })
  };
};