const express = require('express');
const cors = require('cors');
const path = require('path');

const {
  state,
  audienceForFilters,
  summarizeAudience,
  createCampaign,
  recordReceipt,
  getMetrics,
  getFunnel,
  getInsights,
  importCustomers,
  importOrders,
  serializeBootstrap,
  launchCampaign,
  addEvent
} = require('./store');
const { parseSegmentPrompt, generateCampaignMessage, recommendChannel, summarizeInsights } = require('./ai');

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const clientDir = path.join(__dirname, '..', 'client');
app.use(express.static(clientDir));

function countByStatus(audience, status) {
  return audience.filter((customer) => status(customer)).length;
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'crm-backend' });
});

app.get('/api/bootstrap', (req, res) => {
  res.json(serializeBootstrap());
});

app.get('/api/customers', (req, res) => {
  res.json(state.customers);
});

app.get('/api/campaigns', (req, res) => {
  res.json(state.campaigns);
});

app.get('/api/events', (req, res) => {
  res.json(state.events);
});

app.get('/api/metrics', (req, res) => {
  res.json({ metrics: getMetrics(), funnel: getFunnel() });
});

app.get('/api/insights', (req, res) => {
  res.json({ insights: summarizeInsights(getMetrics(), state.campaigns) });
});

app.post('/api/segment/preview', (req, res) => {
  const { prompt = '' } = req.body;
  const parsed = parseSegmentPrompt(prompt);
  const audience = audienceForFilters(parsed.filters);
  res.json({
    ...parsed,
    audienceCount: audience.length,
    audienceSummary: summarizeAudience(audience),
    audience: audience.slice(0, 6)
  });
});

app.post('/api/message/generate', (req, res) => {
  const { segmentPrompt = '', audience = [], tone = 'warm' } = req.body;
  res.json(generateCampaignMessage({ segmentPrompt, audience, tone }));
});

app.post('/api/channel/recommend', (req, res) => {
  const { segmentPrompt = '', audience = [] } = req.body;
  res.json(recommendChannel({ segmentPrompt, audience }));
});

app.post('/api/campaigns', (req, res) => {
  const { name, segment, message, channel, audienceCount = 0, filters = {} } = req.body;
  if (!name || !segment || !message || !channel) {
    return res.status(400).json({ error: 'name, segment, message, and channel are required' });
  }
  const campaign = createCampaign({ name, segment, message, channel, audienceCount, filters });
  res.status(201).json(campaign);
});

app.post('/api/campaign/send', async (req, res) => {
  const { campaignId } = req.body;
  const campaign = state.campaigns.find((item) => item.id === campaignId);
  if (!campaign) {
    return res.status(404).json({ error: 'campaign not found' });
  }

  const audience = audienceForFilters(campaign.filters);
  campaign.audienceCount = audience.length;
  launchCampaign(campaignId);
  addEvent('campaign.launching', campaignId, 'system', `Launching ${campaign.name}`);

  const simulatorUrl = process.env.SIMULATOR_URL || 'http://localhost:4100/simulate';
  try {
    const response = await fetch(simulatorUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaignId,
        channel: campaign.channel,
        audience,
        callbackUrl: process.env.CRM_CALLBACK_URL || 'http://localhost:4000/receipt'
      })
    });
    const payload = await response.json();
    return res.json({ ok: true, campaignId, audienceCount: audience.length, simulator: payload });
  } catch (error) {
    campaign.status = 'launch-failed';
    addEvent('campaign.error', campaignId, 'system', 'Simulator unreachable, launch paused', { error: error.message });
    return res.status(502).json({ error: 'simulator unavailable', details: error.message });
  }
});

app.post('/receipt', (req, res) => {
  const receipt = recordReceipt(req.body);
  if (!receipt) {
    return res.status(404).json({ error: 'campaign not found' });
  }
  res.json({ ok: true, receipt });
});

app.post('/api/import/customers', (req, res) => {
  const rows = Array.isArray(req.body.rows) ? req.body.rows : [];
  const created = importCustomers(rows);
  res.json({ created: created.length, rows: created });
});

app.post('/api/import/orders', (req, res) => {
  const rows = Array.isArray(req.body.rows) ? req.body.rows : [];
  const created = importOrders(rows);
  res.json({ created: created.length, rows: created });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(clientDir, 'index.html'));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`CRM backend running on port ${PORT}`));
