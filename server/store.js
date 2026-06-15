const today = new Date();

function daysAgo(days) {
  const date = new Date(today);
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createSeedCustomers() {
  return [
    { id: 'C001', name: 'Sarah Khan', email: 'sarah@delta.in', phone: '+91 98765 10001', city: 'Delhi', totalSpent: 8200, lastOrderDate: daysAgo(38) },
    { id: 'C002', name: 'Rohit Mehta', email: 'rohit@north.in', phone: '+91 98765 10002', city: 'Mumbai', totalSpent: 4200, lastOrderDate: daysAgo(12) },
    { id: 'C003', name: 'Ananya Rao', email: 'ananya@flare.in', phone: '+91 98765 10003', city: 'Bengaluru', totalSpent: 12600, lastOrderDate: daysAgo(47) },
    { id: 'C004', name: 'Kabir Singh', email: 'kabir@prime.in', phone: '+91 98765 10004', city: 'Delhi', totalSpent: 6100, lastOrderDate: daysAgo(33) },
    { id: 'C005', name: 'Meera Iyer', email: 'meera@zen.in', phone: '+91 98765 10005', city: 'Chennai', totalSpent: 2500, lastOrderDate: daysAgo(8) },
    { id: 'C006', name: 'Aman Verma', email: 'aman@pulse.in', phone: '+91 98765 10006', city: 'Pune', totalSpent: 9100, lastOrderDate: daysAgo(61) },
    { id: 'C007', name: 'Nadia Hussain', email: 'nadia@glow.in', phone: '+91 98765 10007', city: 'Hyderabad', totalSpent: 5300, lastOrderDate: daysAgo(22) },
    { id: 'C008', name: 'Ishita Bose', email: 'ishita@nova.in', phone: '+91 98765 10008', city: 'Kolkata', totalSpent: 3700, lastOrderDate: daysAgo(55) },
    { id: 'C009', name: 'Arjun Nair', email: 'arjun@orbit.in', phone: '+91 98765 10009', city: 'Mumbai', totalSpent: 14800, lastOrderDate: daysAgo(16) },
    { id: 'C010', name: 'Tanya Kapoor', email: 'tanya@lumen.in', phone: '+91 98765 10010', city: 'Delhi', totalSpent: 7200, lastOrderDate: daysAgo(29) },
    { id: 'C011', name: 'Dev Patel', email: 'dev@craft.in', phone: '+91 98765 10011', city: 'Ahmedabad', totalSpent: 1800, lastOrderDate: daysAgo(70) },
    { id: 'C012', name: 'Priya Joseph', email: 'priya@beam.in', phone: '+91 98765 10012', city: 'Bengaluru', totalSpent: 6800, lastOrderDate: daysAgo(41) }
  ];
}

function createSeedOrders(customers) {
  return customers.flatMap((customer, index) => {
    const count = index % 3 === 0 ? 3 : 2;
    return Array.from({ length: count }, (_, position) => ({
      id: `O${String(index + 1).padStart(3, '0')}${position + 1}`,
      customerId: customer.id,
      amount: Math.round(customer.totalSpent / (position + 2)),
      date: daysAgo(6 + index * 2 + position)
    }));
  });
}

function createState() {
  const customers = createSeedCustomers();
  return {
    customers,
    orders: createSeedOrders(customers),
    campaigns: [
      {
        id: 'CMP-1001',
        name: 'Delhi Premium Re-activation',
        segment: 'Customers who spent more than ₹5000 and have not ordered in 30 days',
        message: 'Hey Sarah 👋 We saved you a personal 15% discount for your next order. Want to come back this week?',
        channel: 'WhatsApp',
        status: 'running',
        audienceCount: 4,
        metrics: { sent: 4, delivered: 4, failed: 0, opened: 3, clicked: 2, converted: 1 },
        createdAt: daysAgo(2)
      }
    ],
    communications: [
      { id: 'COM-1001', campaignId: 'CMP-1001', customerId: 'C001', status: 'delivered', channel: 'WhatsApp', timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString() },
      { id: 'COM-1002', campaignId: 'CMP-1001', customerId: 'C004', status: 'opened', channel: 'WhatsApp', timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString() },
      { id: 'COM-1003', campaignId: 'CMP-1001', customerId: 'C010', status: 'clicked', channel: 'WhatsApp', timestamp: new Date(Date.now() - 1000 * 60 * 75).toISOString() }
    ],
    events: [
      { id: 'EVT-1001', type: 'delivered', campaignId: 'CMP-1001', customerName: 'Sarah Khan', message: 'WhatsApp delivered to Sarah Khan', timestamp: new Date(Date.now() - 1000 * 60 * 118).toISOString() },
      { id: 'EVT-1002', type: 'opened', campaignId: 'CMP-1001', customerName: 'Kabir Singh', message: 'Kabir opened the offer', timestamp: new Date(Date.now() - 1000 * 60 * 91).toISOString() },
      { id: 'EVT-1003', type: 'clicked', campaignId: 'CMP-1001', customerName: 'Tanya Kapoor', message: 'Tanya clicked through to the campaign', timestamp: new Date(Date.now() - 1000 * 60 * 76).toISOString() }
    ],
    counters: {
      campaign: 1002,
      communication: 1004,
      event: 1004,
      customer: 13,
      order: 100
    }
  };
}

const state = createState();

function nextId(prefix, counterKey) {
  const value = state.counters[counterKey];
  state.counters[counterKey] += 1;
  return `${prefix}${String(value).padStart(4, '0')}`;
}

function daysSince(dateString) {
  const then = new Date(dateString).getTime();
  const now = Date.now();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

function audienceForFilters(filters = {}) {
  return state.customers.filter((customer) => {
    if (typeof filters.totalSpentGt === 'number' && customer.totalSpent <= filters.totalSpentGt) return false;
    if (typeof filters.lastOrderDaysGt === 'number' && daysSince(customer.lastOrderDate) <= filters.lastOrderDaysGt) return false;
    if (filters.city && customer.city.toLowerCase() !== String(filters.city).toLowerCase()) return false;
    if (filters.lifecycle === 'premium' && customer.totalSpent < 5000) return false;
    if (filters.lifecycle === 'inactive' && daysSince(customer.lastOrderDate) <= 30) return false;
    return true;
  });
}

function summarizeAudience(audience) {
  const totalSpent = audience.reduce((sum, customer) => sum + customer.totalSpent, 0);
  const avgSpent = audience.length ? Math.round(totalSpent / audience.length) : 0;
  const cities = Array.from(new Set(audience.map((customer) => customer.city))).slice(0, 3);
  return {
    count: audience.length,
    totalSpent,
    avgSpent,
    cities
  };
}

function createCampaign(input) {
  const campaign = {
    id: nextId('CMP-', 'campaign'),
    name: input.name,
    segment: input.segment,
    message: input.message,
    channel: input.channel,
    status: 'draft',
    filters: input.filters || {},
    audienceCount: input.audienceCount || 0,
    createdAt: new Date().toISOString(),
    metrics: { sent: 0, delivered: 0, failed: 0, opened: 0, clicked: 0, converted: 0 }
  };
  state.campaigns.unshift(campaign);
  addEvent('campaign.created', campaign.id, campaign.name, `Campaign "${campaign.name}" is ready to launch`);
  return campaign;
}

function updateCampaign(campaignId, updater) {
  const campaign = state.campaigns.find((item) => item.id === campaignId);
  if (!campaign) return null;
  updater(campaign);
  return campaign;
}

function addEvent(type, campaignId, customerName, message, meta = {}) {
  const event = {
    id: nextId('EVT-', 'event'),
    type,
    campaignId,
    customerName,
    message,
    meta,
    timestamp: new Date().toISOString()
  };
  state.events.unshift(event);
  state.events = state.events.slice(0, 40);
  return event;
}

function recordReceipt(payload) {
  const { campaignId, customerId, customerName, status, channel } = payload;
  const campaign = state.campaigns.find((item) => item.id === campaignId);
  if (!campaign) return null;

  const communication = {
    id: nextId('COM-', 'communication'),
    campaignId,
    customerId,
    status,
    channel: channel || campaign.channel,
    timestamp: new Date().toISOString()
  };
  state.communications.unshift(communication);

  if (campaign.metrics[status] !== undefined) {
    campaign.metrics[status] += 1;
  }
  if (status === 'failed') {
    campaign.status = 'needs-attention';
  } else if (status === 'converted') {
    campaign.status = 'winning';
  } else if (status === 'clicked' || status === 'opened') {
    campaign.status = 'live';
  } else if (status === 'delivered' && campaign.status === 'launching') {
    campaign.status = 'live';
  }

  addEvent(status, campaignId, customerName, `${customerName} ${status}`, { customerId, channel: communication.channel });
  return communication;
}

function getMetrics() {
  return state.campaigns.reduce(
    (accumulator, campaign) => {
      accumulator.sent += campaign.metrics.sent;
      accumulator.delivered += campaign.metrics.delivered;
      accumulator.failed += campaign.metrics.failed;
      accumulator.opened += campaign.metrics.opened;
      accumulator.clicked += campaign.metrics.clicked;
      accumulator.converted += campaign.metrics.converted;
      return accumulator;
    },
    { sent: 0, delivered: 0, failed: 0, opened: 0, clicked: 0, converted: 0 }
  );
}

function getFunnel() {
  const metrics = getMetrics();
  const base = Math.max(metrics.sent, 1);
  return [
    { label: 'Sent', value: metrics.sent, ratio: 100 },
    { label: 'Delivered', value: metrics.delivered, ratio: Math.round((metrics.delivered / base) * 100) },
    { label: 'Opened', value: metrics.opened, ratio: Math.round((metrics.opened / base) * 100) },
    { label: 'Clicked', value: metrics.clicked, ratio: Math.round((metrics.clicked / base) * 100) },
    { label: 'Converted', value: metrics.converted, ratio: Math.round((metrics.converted / base) * 100) }
  ];
}

function getInsights() {
  const metrics = getMetrics();
  const premiumAudience = state.customers.filter((customer) => customer.totalSpent >= 5000);
  const delhiAudience = state.customers.filter((customer) => customer.city === 'Delhi');
  return [
    `Premium customers now make up ${premiumAudience.length} of ${state.customers.length} seeded shoppers, which keeps WhatsApp as the strongest conversion channel.`,
    `Delhi and Mumbai are over-indexing on reactivation response, so geo-specific offers should stay in the launch mix.`,
    metrics.clicked > metrics.opened / 2
      ? 'The message is getting attention and the CTA is strong enough to keep the click-through rate healthy.'
      : 'The creative needs a sharper offer or a clearer CTA to turn opens into clicks.',
    metrics.failed > 0
      ? 'A few delivery failures show why a fallback channel or retry path matters in production.'
      : 'Delivery is stable, so the channel simulator is doing a good job for the demo.'
  ];
}

function importCustomers(rows) {
  const created = [];
  rows.forEach((row) => {
    if (!row.name || !row.email) return;
    const customer = {
      id: nextId('C', 'customer'),
      name: row.name,
      email: row.email,
      phone: row.phone || '',
      city: row.city || 'Unknown',
      totalSpent: Number(row.totalSpent || 0),
      lastOrderDate: row.lastOrderDate || daysAgo(0)
    };
    state.customers.unshift(customer);
    created.push(customer);
  });
  if (created.length) addEvent('import.customers', 'system', 'Upload', `Imported ${created.length} customers`, { created: created.length });
  return created;
}

function importOrders(rows) {
  const created = [];
  rows.forEach((row) => {
    if (!row.customerId || !row.amount) return;
    const order = {
      id: nextId('O', 'order'),
      customerId: row.customerId,
      amount: Number(row.amount),
      date: row.date || daysAgo(0)
    };
    state.orders.unshift(order);
    created.push(order);
    const customer = state.customers.find((item) => item.id === row.customerId);
    if (customer) {
      customer.totalSpent += Number(row.amount);
      customer.lastOrderDate = row.date || daysAgo(0);
    }
  });
  if (created.length) addEvent('import.orders', 'system', 'Upload', `Imported ${created.length} orders`, { created: created.length });
  return created;
}

function serializeBootstrap() {
  return {
    customers: clone(state.customers),
    campaigns: clone(state.campaigns),
    events: clone(state.events),
    metrics: getMetrics(),
    funnel: getFunnel(),
    insights: getInsights(),
    summary: summarizeAudience(state.customers)
  };
}

function launchCampaign(campaignId) {
  return updateCampaign(campaignId, (campaign) => {
    campaign.status = 'launching';
  });
}

module.exports = {
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
  addEvent,
  daysSince
};
