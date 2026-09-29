// Import Express.js
const express = require('express');

// Create an Express app
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Set port and verify_token
const port = process.env.PORT || 3000;
const verifyToken = process.env.VERIFY_TOKEN;

// Route for GET requests
app.get('/', (req, res) => {
  const { 'hub.mode': mode, 'hub.challenge': challenge, 'hub.verify_token': token } = req.query;

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('WEBHOOK VERIFIED');
    res.status(200).send(challenge);
  } else {
    res.status(403).end();
  }
});

// Route for POST requests
app.post('/', (req, res) => {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  console.log(`\n\nWebhook received ${timestamp}\n`);
  console.log(JSON.stringify(req.body, null, 2));
  res.status(200).end();
});

const APP_SECRET = process.env.FB_APP_SECRET; // never in the browser
const GRAPH_VERSION = 'v25.0';

app.post('/api/whatsapp/exchange-code', async (req, res) => {
  const { code, wabaId, phoneNumberId } = req.body;

  // 1. Exchange the code for a business token (server-side only - needs app secret)
  const tokenRes = await axios.get(`https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token`, {
    params: { client_id: '1392638573074553', client_secret: APP_SECRET, code }
  });
  const businessToken = tokenRes.data.access_token;
  // TODO: store businessToken keyed by wabaId - this is what replaces her having to log in again

  // 2. Subscribe your app to webhooks on HER waba (not your test waba)
  await axios.post(`https://graph.facebook.com/${GRAPH_VERSION}/${wabaId}/subscribed_apps`, {}, {
    headers: { Authorization: `Bearer ${businessToken}` }
  });

  // 3. Do NOT call /register - for coexistence the number is already registered

  // 4. One-time syncs (each can only be called once per onboarding)
  for (const sync_type of ['smb_app_state_sync', 'history']) {
    await axios.post(`https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/smb_app_data`,
      { messaging_product: 'whatsapp', sync_type },
      { headers: { Authorization: `Bearer ${businessToken}` } });
  }

  res.json({ ok: true });
});

// Start the server
app.listen(port, () => {
  console.log(`\nListening on port ${port}\n`);
});
