// Import Express.js
const express = require('express');
const cors = require('cors');
const axios = require('axios');

// Create an Express app
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

app.use(cors({
  origin: ['https://byship.in', 'https://series-drizzle-undress.ngrok-free.dev'],
}));

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
const APP_ID = 1392638573074553;
const GRAPH_VERSION = 'v25.0';



app.post('/api/whatsapp/exchange-code', async (req, res) => {
  const { code, wabaId, phoneNumberId } = req.body;
  console.log('Received from client:', { code, wabaId, phoneNumberId });

  const params = new URLSearchParams({
    client_id: APP_ID,
    client_secret: APP_SECRET,
    code,
    redirect_uri: ''
  });
  try {
    const tokenRes = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token?client_id=${APP_ID}&client_secret=${APP_SECRET}&code=${code}&redirect_uri=''`
    );
    const tokenData = await tokenRes.json();
    console.log('Meta token response:', JSON.stringify(tokenData, null, 2));

    if (!tokenRes.ok) {
      return res.status(500).json({ ok: false, error: tokenData });
    }

    res.json({ ok: true, tokenData });
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ ok: false });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`\nListening on port ${port}\n`);
});
