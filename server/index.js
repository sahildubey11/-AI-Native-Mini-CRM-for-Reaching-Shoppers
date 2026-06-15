const express = require('express');
const cors = require('cors');
const path = require('path');

const store = require('./store');
const ai = require('./ai');

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const clientDir = path.join(__dirname, '..', 'client');
app.use(express.static(clientDir));

function buildSummary() {
  const totalSpent = store.customers.reduce((sum, customer) => sum + customer.spent, 0);
  const count = store.customers.length;
  return {
    count,
    totalSpent,
    avgSpent: count ? Math.round(totalSpent / count) : 0
  };
}

function buildInsights() {
  const metrics = store.getMetrics();
  const campaignCount = store.campaigns.length;

  return [
    `There are ${store.customers.length} seeded customers ready for the demo.`,
    campaignCount ? `The dashboard currently has ${campaignCount} campaign${campaignCount === 1 ? '' : 's'} in play.` : 'No campaigns are live yet, so the first launch will populate the funnel.',
    metrics.sent ? `Delivery is tracking at ${Math.round((metrics.delivered / Math.max(metrics.sent, 1)) * 100)}%.` : 'Send a campaign to start generating funnel metrics.',
    metrics.clicked ? 'Click activity is showing up, which means the CTA is doing its job.' : 'The creative still needs a launch before click data can appear.'
  ];
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'crm-backend' });
});

app.get('/api/bootstrap', (req, res) => {
  const metrics = store.getMetrics();
  const funnel = store.getFunnel();
  res.json({
    customers: store.customers,
    campaigns: store.campaigns,
    events: store.events,
    metrics,
    funnel,
    summary: buildSummary(),
    insights: buildInsights()
  });
});

app.get('/api/customers', (req, res) => {
  res.json(store.customers);
});

app.get('/api/campaigns', (req, res) => {
  res.json(store.campaigns);
});

app.get('/api/events', (req, res) => {
  res.json(store.events);
});

app.get('/api/metrics', (req, res) => {
  res.json({ metrics: store.getMetrics(), funnel: store.getFunnel() });
});

app.get('/api/insights', (req, res) => {
  res.json({ insights: buildInsights() });
});

app.post('/api/segment/preview', (req, res) => {
  const { prompt = '' } = req.body;
  const parsed = ai.parseSegment(prompt);
  const audience = store.filterAudience(parsed.minSpent, parsed.inactiveDays);
  
  res.json({
    rules: parsed.rules,
    label: parsed.label,
    audienceCount: audience.length,
    audience: audience.slice(0, 6)
  });
});

app.post('/api/message/generate', (req, res) => {
  const { audience = [] } = req.body;
  res.json(ai.generateMessage(audience));
});

app.post('/api/channel/recommend', (req, res) => {
  const { audience = [] } = req.body;
  res.json(ai.recommendChannel(audience));
});

app.post('/api/campaigns', (req, res) => {
  const { name, segment, message, channel } = req.body;
  if (!name || !segment || !message || !channel) {
    return res.status(400).json({ error: 'name, segment, message, and channel are required' });
  }
  const campaign = store.createCampaign(name, segment, message, channel);
  res.status(201).json(campaign);
});

app.post('/api/campaign/send', async (req, res) => {
  const { campaignId } = req.body;
  const campaign = store.campaigns.find(c => c.id === campaignId);
  if (!campaign) {
    return res.status(404).json({ error: 'campaign not found' });
  }

  campaign.status = 'launching';
  const simulatorUrl = process.env.SIMULATOR_URL || 'http://localhost:4100/simulate';
  
  try {
    const response = await fetch(simulatorUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaignId,
        channel: campaign.channel,
        customers: store.customers,
        callbackUrl: process.env.CRM_CALLBACK_URL || 'http://localhost:4000/receipt'
      })
    });
    const payload = await response.json();
    return res.json({ ok: true, campaignId, simulator: payload });
  } catch (error) {
    campaign.status = 'failed';
    return res.status(502).json({ error: 'simulator unavailable', details: error.message });
  }
});

app.post('/receipt', (req, res) => {
  const { campaignId, customerId, customerName, status } = req.body;
  store.recordEvent(customerId, campaignId, status);
  res.json({ ok: true, received: true });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(clientDir, 'index.html'));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`CRM backend running on port ${PORT}`));
