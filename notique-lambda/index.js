const register             = require('./handlers/register');
const ingest               = require('./handlers/ingest');
const feed                 = require('./handlers/feed');
const todos                = require('./handlers/todos');
const todosDone            = require('./handlers/todosDone');
const chat                 = require('./handlers/chat');
const feedback             = require('./handlers/feedback');
const sync                 = require('./handlers/sync');
const profile              = require('./handlers/profile');
const whatsappPair         = require('./handlers/whatsappPair');
const whatsappStatus       = require('./handlers/whatsappStatus');
const whatsappGroups       = require('./handlers/whatsappGroups');
const whatsappResend       = require('./handlers/whatsappResend');
const settings             = require('./handlers/settings');
const mockSync             = require('./handlers/mockSync');
const googleToken          = require('./handlers/googleToken');

exports.handler = async (event) => {
  if (event.source === 'eventbridge') return await sync(event);

  const method = event.httpMethod;
  const path   = event.path;

  try {
    if (method === 'POST'   && path === '/register')          return await register(event);
    if (method === 'POST'   && path === '/ingest')            return await ingest(event);
    if (method === 'GET'    && path === '/feed')              return await feed(event);
    if (method === 'GET'    && path === '/todos')             return await todos(event);
    if (method === 'POST'   && path === '/todos')             return await todos(event);
    if (method === 'POST'   && path === '/todos/done')        return await todosDone(event);
    if (method === 'POST'   && path === '/chat')              return await chat(event);
    if (method === 'POST'   && path === '/feedback')          return await feedback(event);
    if (method === 'GET'    && path === '/sync')              return await sync(event);
    if (method === 'GET'    && path === '/profile')           return await profile(event);
    if (method === 'DELETE' && path === '/profile')           return await profile(event);
    if (method === 'POST'   && path === '/whatsapp/pair')     return await whatsappPair(event);
    if (method === 'POST'   && path === '/whatsapp/status')   return await whatsappStatus(event);
    if (method === 'GET'    && path === '/whatsapp/groups')   return await whatsappGroups(event);
    if (method === 'POST'   && path === '/whatsapp/resend')   return await whatsappResend(event);
    if (method === 'GET'    && path === '/settings')          return await settings(event);
    if (method === 'POST'   && path === '/settings')          return await settings(event);
    if (method === 'POST'   && path === '/sync-demo')         return await mockSync(event);
    if (method === 'POST'   && path === '/google/token')      return await googleToken(event);
    if (method === 'OPTIONS') return cors();
    return { statusCode: 404, body: JSON.stringify({ error: 'Route not found' }) };
  } catch (err) {
    console.error('Unhandled error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

function cors() {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,x-user-id',
      'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS'
    },
    body: ''
  };
}