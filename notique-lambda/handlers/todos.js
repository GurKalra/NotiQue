const { readJSON, writeJSON } = require('../lib/s3');
const crypto = require('crypto');

module.exports = async (event) => {
  const userId = event.headers['x-user-id'];
  const method = event.httpMethod;

  if (method === 'GET') {
    const todos = await readJSON(`users/${userId}/todos/active.json`) || [];
    todos.sort((a, b) => {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline) - new Date(b.deadline);
    });
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ todos })
    };
  }

  if (method === 'POST') {
    const body = JSON.parse(event.body || '{}');

    if (!body.title) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'title is required' })
      };
    }

    const todos = await readJSON(`users/${userId}/todos/active.json`) || [];

    const newTodo = {
      id: crypto.randomUUID(),
      title: body.title,
      description: body.description || '',
      subject: body.subject || 'Personal',
      deadline: body.deadline || null,
      importance: body.importance || 'medium',
      source: 'manual',
      sourceGroup: body.sourceGroup || '',
      autoTrackable: false,
      classroomCourseId: null,
      classroomAssignmentId: null,
      reminderCount: 0,
      completedAt: null,
      userAdded: true,
      createdAt: new Date().toISOString()
    };

    todos.unshift(newTodo);
    await writeJSON(`users/${userId}/todos/active.json`, todos);

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ todo: newTodo })
    };
  }

  return {
    statusCode: 405,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ error: 'Method not allowed' })
  };
};