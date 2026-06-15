const state = {
  bootstrap: null,
  segment: null,
  audience: [],
  message: '',
  channel: 'WhatsApp',
  campaign: null,
  metrics: null,
  funnel: [],
  insights: [],
  events: []
};

const api = {
  bootstrap: '/api/bootstrap',
  segment: '/api/segment/preview',
  message: '/api/message/generate',
  channel: '/api/channel/recommend',
  campaigns: '/api/campaigns',
  send: '/api/campaign/send',
  metrics: '/api/metrics',
  insights: '/api/insights',
  events: '/api/events',
  customersImport: '/api/import/customers',
  ordersImport: '/api/import/orders'
};

const els = {
  headlineStatus: document.getElementById('headlineStatus'),
  headlineStatusCopy: document.getElementById('headlineStatusCopy'),
  railAudienceCount: document.getElementById('railAudienceCount'),
  railChannel: document.getElementById('railChannel'),
  railFunnel: document.getElementById('railFunnel'),
  heroMetrics: document.getElementById('heroMetrics'),
  segmentPrompt: document.getElementById('segmentPrompt'),
  analyzeSegmentBtn: document.getElementById('analyzeSegmentBtn'),
  analyzeHeroBtn: document.getElementById('analyzeHeroBtn'),
  loadExampleBtn: document.getElementById('loadExampleBtn'),
  segmentRules: document.getElementById('segmentRules'),
  audienceCount: document.getElementById('audienceCount'),
  audienceSummary: document.getElementById('audienceSummary'),
  audiencePreview: document.getElementById('audiencePreview'),
  recommendedChannel: document.getElementById('recommendedChannel'),
  channelScore: document.getElementById('channelScore'),
  channelReason: document.getElementById('channelReason'),
  messagePrompt: document.getElementById('messagePrompt'),
  generateMessageBtn: document.getElementById('generateMessageBtn'),
  regenerateMessageBtn: document.getElementById('regenerateMessageBtn'),
  messageBox: document.getElementById('messageBox'),
  messageChars: document.getElementById('messageChars'),
  campaignName: document.getElementById('campaignName'),
  channelPicker: document.getElementById('channelPicker'),
  saveCampaignBtn: document.getElementById('saveCampaignBtn'),
  launchCampaignBtn: document.getElementById('launchCampaignBtn'),
  launchHeroBtn: document.getElementById('launchHeroBtn'),
  campaignId: document.getElementById('campaignId'),
  campaignStatus: document.getElementById('campaignStatus'),
  customersCsv: document.getElementById('customersCsv'),
  ordersCsv: document.getElementById('ordersCsv'),
  importCustomersBtn: document.getElementById('importCustomersBtn'),
  importOrdersBtn: document.getElementById('importOrdersBtn'),
  importSummary: document.getElementById('importSummary'),
  metricsGrid: document.getElementById('metricsGrid'),
  funnelChart: document.getElementById('funnelChart'),
  insightsCard: document.getElementById('insightsCard'),
  insightsBtn: document.getElementById('insightsBtn'),
  eventFeed: document.getElementById('eventFeed'),
  toasts: document.getElementById('toasts')
};

const nf = new Intl.NumberFormat('en-IN');

function currency(value) {
  return `₹${nf.format(value)}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function toast(title, message) {
  const node = document.createElement('div');
  node.className = 'toast';
  node.innerHTML = `<strong>${escapeHtml(title)}</strong><p>${escapeHtml(message)}</p>`;
  els.toasts.appendChild(node);
  setTimeout(() => node.remove(), 3600);
}

function parseCSV(text) {
  const rows = [];
  const lines = String(text || '').trim().split(/\r?\n/).filter(Boolean);
  if (!lines.length) return rows;
  const headers = splitCSVLine(lines[0]).map((header) => header.trim());
  for (const line of lines.slice(1)) {
    const values = splitCSVLine(line);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = (values[index] || '').trim();
    });
    rows.push(row);
  }
  return rows;
}

function splitCSVLine(line) {
  const cells = [];
  let buffer = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && quoted && next === '"') {
      buffer += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (char === ',' && !quoted) {
      cells.push(buffer);
      buffer = '';
      continue;
    }
    buffer += char;
  }

  cells.push(buffer);
  return cells;
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `Request failed: ${response.status}`);
  }
  return response.json();
}

function renderHeroMetrics() {
  const metrics = state.metrics || { sent: 0, delivered: 0, failed: 0, opened: 0, clicked: 0, converted: 0 };
  const funnel = state.funnel || [];
  const rate = metrics.sent ? Math.round((metrics.delivered / metrics.sent) * 100) : 0;
  const openRate = metrics.delivered ? Math.round((metrics.opened / metrics.delivered) * 100) : 0;

  els.heroMetrics.innerHTML = [
    { label: 'Delivery rate', value: `${rate}%` },
    { label: 'Open rate', value: `${openRate}%` },
    { label: 'Audience size', value: nf.format(state.audience.length || state.bootstrap?.summary?.count || 0) },
    { label: 'Last funnel step', value: funnel[funnel.length - 1]?.label || 'Converted' }
  ]
    .map((item) => `<div class="hero-stat"><span>${escapeHtml(item.label)}</span><strong>${escapeHtml(item.value)}</strong></div>`)
    .join('');
}

function renderSegment() {
  const segment = state.segment;
  if (!segment) {
    els.segmentRules.innerHTML = '<div class="rule-pill">Waiting for a prompt.</div>';
    els.audienceCount.textContent = '0';
    els.audienceSummary.textContent = 'Describe the audience in plain English to see the AI parse it into filters.';
    els.audiencePreview.innerHTML = '';
    return;
  }

  els.segmentRules.innerHTML = segment.rules.map((rule) => `<div class="rule-pill">${escapeHtml(rule)}</div>`).join('');
  els.audienceCount.textContent = nf.format(state.audience.length);
  els.audienceSummary.textContent = `${segment.audienceLabel} • ${state.bootstrap ? `${currency(state.bootstrap.summary.avgSpent)} avg spend` : ''}`;
  els.audiencePreview.innerHTML = state.audience
    .map((customer) => `
      <tr>
        <td>${escapeHtml(customer.name)}</td>
        <td>${escapeHtml(customer.city)}</td>
        <td>${currency(customer.totalSpent)}</td>
        <td>${escapeHtml(customer.lastOrderDate)}</td>
      </tr>
    `)
    .join('') || '<tr><td colspan="4">No matching audience. Try a broader prompt.</td></tr>';
}

function renderMessage() {
  els.messageBox.value = state.message;
  els.messageChars.textContent = nf.format(state.message.length);
  els.recommendedChannel.textContent = state.channel;
}

function renderChannel(meta = null) {
  if (meta) {
    state.channel = meta.channel;
    els.channelScore.textContent = `${meta.score} score`;
    els.channelReason.textContent = meta.reason;
    els.recommendedChannel.textContent = meta.channel;
    els.channelPicker.value = meta.channel;
    els.railChannel.textContent = meta.channel;
  }
}

function renderCampaign() {
  if (!state.campaign) {
    els.campaignId.textContent = 'New draft';
    els.campaignStatus.textContent = 'draft';
    return;
  }
  els.campaignId.textContent = state.campaign.id;
  els.campaignStatus.textContent = state.campaign.status;
  els.headlineStatus.textContent = `${state.campaign.name} is ${state.campaign.status}`;
  els.headlineStatusCopy.textContent = `${state.campaign.audienceCount} people matched the segment and the simulator is ready to emit receipts.`;
}

function renderMetrics() {
  const metrics = state.metrics || { sent: 0, delivered: 0, failed: 0, opened: 0, clicked: 0, converted: 0 };
  const cards = [
    ['Total sent', metrics.sent],
    ['Delivered', metrics.delivered],
    ['Failed', metrics.failed],
    ['Opened', metrics.opened],
    ['Clicked', metrics.clicked],
    ['Converted', metrics.converted]
  ];

  els.metricsGrid.innerHTML = cards
    .map(([label, value]) => `
      <div class="metric">
        <span>${escapeHtml(label)}</span>
        <strong>${nf.format(value)}</strong>
      </div>
    `)
    .join('');

  els.funnelChart.innerHTML = (state.funnel || []).map((step) => `
    <div class="funnel-row">
      <strong>${escapeHtml(step.label)}</strong>
      <div class="funnel-track"><div class="funnel-fill" style="width:${Math.max(step.ratio, 4)}%"></div></div>
      <span>${nf.format(step.value)}</span>
    </div>
  `).join('');

  const funnelRatio = metrics.sent ? Math.round((metrics.converted / metrics.sent) * 100) : 0;
  els.railFunnel.textContent = `${funnelRatio}%`;
}

function renderInsights() {
  const insights = state.insights?.length ? state.insights : ['Generate insights to see the AI summary card populate.'];
  els.insightsCard.innerHTML = insights.map((line) => `<div class="insight-line">${escapeHtml(line)}</div>`).join('');
}

function renderFeed() {
  const feed = state.events?.length ? state.events.slice(0, 8) : [];
  els.eventFeed.innerHTML = feed.length
    ? feed.map((event) => `
        <div class="event-item">
          <strong>${escapeHtml(event.message)}</strong>
          <span>${escapeHtml(event.type)} • ${escapeHtml(new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))}</span>
        </div>
      `).join('')
    : '<div class="event-item"><strong>No events yet.</strong><span>Launch a campaign to wake up the simulator feed.</span></div>';
}

function renderAll() {
  renderHeroMetrics();
  renderSegment();
  renderMessage();
  renderCampaign();
  renderMetrics();
  renderInsights();
  renderFeed();
  renderChannel();
}

async function analyzeSegment(prompt = els.segmentPrompt.value) {
  const data = await request(api.segment, {
    method: 'POST',
    body: JSON.stringify({ prompt })
  });
  state.segment = data;
  state.audience = data.audience || [];
  state.channel = 'WhatsApp';
  renderSegment();
  renderHeroMetrics();
  toast('Segment ready', `${data.audienceCount} customers matched the prompt.`);

  const [channelMeta, messageMeta] = await Promise.all([
    request(api.channel, { method: 'POST', body: JSON.stringify({ segmentPrompt: prompt, audience: state.audience }) }),
    request(api.message, { method: 'POST', body: JSON.stringify({ segmentPrompt: prompt, audience: state.audience, tone: 'warm' }) })
  ]);

  renderChannel(channelMeta);
  state.message = messageMeta.message;
  renderMessage();
  updateCampaignDraft();
}

function updateCampaignDraft() {
  if (!state.segment) return;
  const campaignName = els.campaignName.value.trim() || 'Campaign Copilot Draft';
  state.campaign = {
    id: state.campaign?.id || 'New draft',
    name: campaignName,
    segment: state.segment.audienceLabel,
    message: state.message,
    channel: state.channel,
    status: state.campaign?.status || 'draft',
    audienceCount: state.audience.length,
    filters: state.segment.filters || {}
  };
  renderCampaign();
}

async function generateMessage() {
  const data = await request(api.message, {
    method: 'POST',
    body: JSON.stringify({
      segmentPrompt: els.messagePrompt.value,
      audience: state.audience,
      tone: 'warm'
    })
  });
  state.message = data.message;
  els.messageBox.value = data.message;
  els.messageChars.textContent = nf.format(data.characterCount);
  updateCampaignDraft();
  toast('Message generated', `The draft is ${data.characterCount} characters long.`);
}

async function saveCampaign() {
  if (!state.segment || !state.message) {
    toast('Need one more step', 'Generate a segment and message first.');
    return;
  }

  const payload = {
    name: els.campaignName.value.trim() || 'Premium Reactivation Sprint',
    segment: state.segment.audienceLabel,
    message: state.message,
    channel: els.channelPicker.value,
    audienceCount: state.audience.length,
    filters: state.segment.filters || {}
  };

  const campaign = await request(api.campaigns, {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  state.campaign = campaign;
  state.channel = campaign.channel;
  renderCampaign();
  renderChannel({ channel: campaign.channel, score: 92, reason: `Saved as a ${campaign.channel} campaign and ready for launch.` });
  toast('Campaign saved', `${campaign.name} is now a draft in the backend.`);
  await syncDashboard();
}

async function launchCampaign() {
  if (!state.campaign || state.campaign.id === 'New draft') {
    await saveCampaign();
  }
  if (!state.campaign || state.campaign.id === 'New draft') return;

  const response = await request(api.send, {
    method: 'POST',
    body: JSON.stringify({ campaignId: state.campaign.id })
  });

  state.campaign.status = 'launching';
  renderCampaign();
  toast('Launch started', `${response.audienceCount} audience members sent to the simulator.`);
  await syncDashboard();
}

async function importCSV(kind) {
  const input = kind === 'customers' ? els.customersCsv : els.ordersCsv;
  const file = input.files?.[0];
  if (!file) {
    toast('Pick a file first', `Choose a ${kind} CSV file to import.`);
    return;
  }

  const text = await file.text();
  const rows = parseCSV(text);
  const payload = { rows };
  const endpoint = kind === 'customers' ? api.customersImport : api.ordersImport;
  const result = await request(endpoint, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  els.importSummary.textContent = `Imported ${result.created} ${kind}.`;
  toast('Import complete', `${result.created} ${kind} rows accepted.`);
  await syncDashboard();
}

async function generateInsights() {
  const data = await request(api.insights);
  state.insights = data.insights || [];
  renderInsights();
  toast('Insights refreshed', 'The summary card has been updated.');
}

async function syncDashboard() {
  const [bootstrap, metrics, events] = await Promise.all([
    request(api.bootstrap),
    request(api.metrics),
    request(api.events)
  ]);

  state.bootstrap = bootstrap;
  state.metrics = metrics.metrics;
  state.funnel = metrics.funnel;
  state.events = events;
  state.insights = bootstrap.insights;
  if (!state.segment) {
    state.audience = bootstrap.customers.slice(0, 4);
  }
  if (!state.campaign && bootstrap.campaigns?.length) {
    state.campaign = bootstrap.campaigns[0];
    state.channel = state.campaign.channel;
  }
  renderAll();
}

function wireEvents() {
  els.analyzeSegmentBtn.addEventListener('click', () => analyzeSegment().catch(handleError));
  els.analyzeHeroBtn.addEventListener('click', () => analyzeSegment().catch(handleError));
  els.loadExampleBtn.addEventListener('click', () => {
    els.segmentPrompt.value = "Show customers who spent more than ₹5000 but haven't ordered in 30 days and send them a discount offer.";
    analyzeSegment().catch(handleError);
  });
  els.generateMessageBtn.addEventListener('click', () => generateMessage().catch(handleError));
  els.regenerateMessageBtn.addEventListener('click', () => generateMessage().catch(handleError));
  els.saveCampaignBtn.addEventListener('click', () => saveCampaign().catch(handleError));
  els.launchCampaignBtn.addEventListener('click', () => launchCampaign().catch(handleError));
  els.launchHeroBtn.addEventListener('click', () => launchCampaign().catch(handleError));
  els.importCustomersBtn.addEventListener('click', () => importCSV('customers').catch(handleError));
  els.importOrdersBtn.addEventListener('click', () => importCSV('orders').catch(handleError));
  els.insightsBtn.addEventListener('click', () => generateInsights().catch(handleError));
  els.campaignName.addEventListener('input', updateCampaignDraft);
  els.channelPicker.addEventListener('change', updateCampaignDraft);
  els.messageBox.addEventListener('input', () => {
    state.message = els.messageBox.value;
    els.messageChars.textContent = nf.format(state.message.length);
    updateCampaignDraft();
  });
}

function handleError(error) {
  console.error(error);
  toast('Something needed a retry', error.message || 'Please try again.');
}

async function refreshLoop() {
  try {
    const events = await request(api.events);
    state.events = events;
    const metrics = await request(api.metrics);
    state.metrics = metrics.metrics;
    state.funnel = metrics.funnel;
    renderMetrics();
    renderFeed();
    renderHeroMetrics();
  } catch (error) {
    console.warn('refresh failed', error);
  }
}

async function start() {
  wireEvents();
  await syncDashboard();
  await analyzeSegment(els.segmentPrompt.value).catch(handleError);
  await generateInsights().catch(handleError);
  setInterval(refreshLoop, 2800);
}

start().catch(handleError);
