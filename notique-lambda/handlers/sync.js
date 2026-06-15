const { readJSON, writeJSON } = require('../lib/s3');

async function refreshGoogleToken(settings, userId) {
  const { classroom } = settings;
  const expiresAt = new Date(classroom.expiresAt).getTime();
  if (expiresAt - Date.now() > 5 * 60000) return classroom.accessToken;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: classroom.refreshToken,
      grant_type:    'refresh_token'
    })
  });
  const data = await res.json();
  settings.classroom.accessToken = data.access_token;
  settings.classroom.expiresAt   = new Date(Date.now() + data.expires_in * 1000).toISOString();
  await writeJSON(`users/${userId}/settings.json`, settings);
  return data.access_token;
}

module.exports = async (event) => {
  const userId = event.detail?.userId;
  if (!userId) return { statusCode: 200, body: 'No userId in event' };
  const settings = await readJSON(`users/${userId}/settings.json`);
  if (!settings?.classroom?.accessToken)
    return { statusCode: 200, body: 'No GCR token' };

  const accessToken = await refreshGoogleToken(settings, userId);
  const coursesRes  = await fetch(
    'https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const { courses } = await coursesRes.json();
  return {
    statusCode: 200,
    body: JSON.stringify({ synced: courses?.length || 0 })
  };
};