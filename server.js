const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const CASHFREE_BASE_URL = process.env.CASHFREE_BASE_URL || 'https://sandbox.cashfree.com/pg/orders';
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());
app.use(express.static(__dirname));

let story = 'Once upon a time... ';
let contributions = [];
let leaderboard = {};

try {
  const data = fs.readFileSync('story.json');
  const saved = JSON.parse(data);
  story = saved.story;
  contributions = saved.contributions;
  leaderboard = saved.leaderboard;
} catch {}

function saveStory() {
  fs.writeFileSync('story.json', JSON.stringify({ story, contributions, leaderboard }));
}

app.get('/story', (req, res) => {
  const lbArray = Object.entries(leaderboard).map(([username, chars]) => ({ username, chars })).sort((a, b) => b.chars - a.chars);
  const recent = contributions.slice(-5).reverse();
  res.json({ story, leaderboard: lbArray, recent });
});

app.post('/create-order', async (req, res) => {
  const { text, username } = req.body;
  const chars = text.length;
  const amount = chars * 10;

  const orderId = `story_${Date.now()}`;
  const data = {
    order_id: orderId,
    order_amount: amount,
    order_currency: 'INR',
    customer_details: {
      customer_id: username,
      customer_email: 'test@example.com',
      customer_phone: '9999999999'
    }
  };

  const response = await axios.post(CASHFREE_BASE_URL, data, {
  headers: {
    'Content-Type': 'application/json',
    'x-client-id': CASHFREE_APP_ID,
    'x-client-secret': CASHFREE_SECRET_KEY,
    'x-api-version': '2022-09-01'
  }
});

  contributions.push({ orderId, text, username, chars, status: 'pending' });
  saveStory();

  res.json({ paymentLink: response.data.payment_link });
});

app.post('/cashfree-webhook', (req, res) => {
  const { order, payment } = req.body;
  const orderId = order.order_id;

  const pending = contributions.find(c => c.orderId === orderId);
  if (pending && payment.payment_status === 'SUCCESS') {
    story += ' ' + pending.text;
    leaderboard[pending.username] = (leaderboard[pending.username] || 0) + pending.chars;
    pending.status = 'completed';
    saveStory();
  }

  res.sendStatus(200);
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
