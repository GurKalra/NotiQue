const { Client, LocalAuth } = require('whatsapp-web.js');
const axios = require('axios');
const express = require('express');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'https://dxn479xqd0.execute-api.us-east-1.amazonaws.com/prod';
const USER_ID = 'cd9aeda6-be77-413c-97ed-5fe678b612f3';
const EXPRESS_PORT = 3001;

let TRACKED_GROUPS = [];
let isConnected = false;
let pairingCode = null;

let client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    protocolTimeout: 60000
  }
});

function attachClientListeners(c) {
  c.on('qr', () => {
    console.log('QR received — use pairing code instead');
  });
  c.on('ready', () => {
    isConnected = true;
    console.log('WhatsApp connected!');
  });
  c.on('disconnected', () => {
    isConnected = false;
    console.log('WhatsApp disconnected');
  });
  c.on('message', async (msg) => {
    if (!msg.from.includes('@g.us')) return;
    const chat = await msg.getChat();
    const groupName = chat.name;
    if (!TRACKED_GROUPS.includes(groupName)) return;
    const contact = await msg.getContact();
    const sender = contact.pushname || contact.number;
    try {
      await axios.post(`${API_BASE_URL}/ingest`, {
        source: 'whatsapp', groupName, senderName: sender,
        messageText: msg.body, messageId: msg.id.id,
        timestamp: new Date().toISOString()
      }, { headers: { 'x-user-id': USER_ID } });
      console.log('Forwarded from', groupName);
    } catch (err) {
      console.error('Ingest error:', err.message);
    }
  });
}

attachClientListeners(client);
client.initialize();

const app = express();
app.use(express.json());

async function resetAndRequestCode(phoneNumber) {
  console.log('=== Destroying old client ===');
  try {
    await Promise.race([
      client.destroy(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('destroy timeout')), 5000))
    ]);
    console.log('=== Old client destroyed ===');
  } catch (e) {
    console.log('Destroy error (ignored):', e.message);
  }

  console.log('=== Removing old session data ===');
  try {
    fs.rmSync(path.join(__dirname, '.wwebjs_auth'), { recursive: true, force: true });
    console.log('=== Session data removed ===');
  } catch (e) {
    console.log('Session removal error (ignored):', e.message);
  }

  console.log('=== Creating new client ===');
  client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      protocolTimeout: 60000
    }
  });
  isConnected = false;
  attachClientListeners(client);

  console.log('=== Initializing new client ===');
  await client.initialize();
  console.log('=== Client initialized, waiting 3s ===');
  await new Promise(r => setTimeout(r, 3000));

  console.log('=== Requesting pairing code ===');
  const code = await client.requestPairingCode(phoneNumber.replace(/[^0-9]/g, ''));
  pairingCode = code;
  console.log('New pairing code:', code);
  return code;
}

app.post('/pair', async (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) return res.status(400).json({ error: 'phoneNumber required' });

  try {
    const code = await resetAndRequestCode(phoneNumber);
    res.json({ pairingCode: code, expiresIn: 60 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/status', (req, res) => {
  res.json({ connected: isConnected, phoneNumber: client.info?.wid?.user || null });
});

app.get('/groups', async (req, res) => {
  try {
    const chats = await client.getChats();
    const groups = chats
      .filter(c => c.isGroup)
      .map(c => ({
        id: c.id._serialized,
        name: c.name,
        participants: c.participants?.length || 0
      }));
    res.json({ groups });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/bridge/reset-session', async (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) return res.status(400).json({ error: 'phoneNumber required' });

  pairingCode = null;
  res.json({ status: 'processing' });
  console.log('=== RESEND STARTED ===');

  (async () => {
    try {
      await resetAndRequestCode(phoneNumber);
    } catch (err) {
      console.error('Resend error:', err.message);
      pairingCode = 'ERROR';
    }
  })();
});

app.get('/bridge/pairing-code', (req, res) => {
  if (pairingCode === null) return res.json({ ready: false });
  if (pairingCode === 'ERROR') return res.json({ ready: true, error: 'Failed to generate code' });
  res.json({ ready: true, pairingCode, expiresIn: 60 });
});

app.listen(EXPRESS_PORT, () => {
  console.log(`Express running on port ${EXPRESS_PORT}`);
});

async function refreshSettings() {
  try {
    const res = await axios.get(`${API_BASE_URL}/settings`, { headers: { 'x-user-id': USER_ID } });
    TRACKED_GROUPS = res.data.trackedGroups || [];
    console.log('Groups:', TRACKED_GROUPS);
  } catch (e) {
    console.error('Settings poll failed:', e.message);
  }
}
refreshSettings();
setInterval(refreshSettings, 5 * 60 * 1000);