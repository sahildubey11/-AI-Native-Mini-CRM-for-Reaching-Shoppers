const express = require('express');

const app = express();
app.use(express.json());

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pickEventSequence() {
  const roll = Math.random();
  if (roll < 0.08) return ['sent', 'failed'];
  if (roll < 0.48) return ['sent', 'delivered'];
  if (roll < 0.78) return ['sent', 'delivered', 'opened'];
  if (roll < 0.93) return ['sent', 'delivered', 'opened', 'clicked'];
  return ['sent', 'delivered', 'opened', 'clicked', 'converted'];
}

async function postReceipt(callbackUrl, payload, attempt = 1) {
  const response = await fetch(callbackUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok && attempt < 3) {
    await wait(250 * attempt);
    return postReceipt(callbackUrl, payload, attempt + 1);
  }
  return response.ok;
}

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'channel-simulator' });
});

app.post('/simulate', async (req, res) => {
  const { campaignId, channel = 'WhatsApp', audience = [], callbackUrl = 'http://localhost:4000/receipt' } = req.body;
  const receivedAt = new Date().toISOString();
  res.json({ ok: true, campaignId, acceptedAt: receivedAt, scheduled: audience.length });

  for (const person of audience) {
    const sequence = pickEventSequence();
    for (let index = 0; index < sequence.length; index += 1) {
      await wait(180 + Math.round(Math.random() * 320));
      await postReceipt(callbackUrl, {
        campaignId,
        customerId: person.id,
        customerName: person.name,
        channel,
        status: sequence[index]
      });
    }
  }
});

const PORT = process.env.PORT || 4100;
app.listen(PORT, () => console.log(`Channel simulator running on port ${PORT}`));
