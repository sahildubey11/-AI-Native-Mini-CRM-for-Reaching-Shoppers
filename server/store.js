// In-memory data store (demo only)
const customers = [
  { id: 'C1', name: 'Sarah Khan', email: 'sarah@mail.com', phone: '+91 9876543210', city: 'Delhi', spent: 8200, lastOrder: '2026-04-09' },
  { id: 'C2', name: 'Rohit Mehta', email: 'rohit@mail.com', phone: '+91 9876543211', city: 'Mumbai', spent: 4200, lastOrder: '2026-06-04' },
  { id: 'C3', name: 'Ananya Rao', email: 'ananya@mail.com', phone: '+91 9876543212', city: 'Bengaluru', spent: 12600, lastOrder: '2026-03-31' },
  { id: 'C4', name: 'Kabir Singh', email: 'kabir@mail.com', phone: '+91 9876543213', city: 'Delhi', spent: 6100, lastOrder: '2026-04-14' },
  { id: 'C5', name: 'Meera Iyer', email: 'meera@mail.com', phone: '+91 9876543214', city: 'Chennai', spent: 2500, lastOrder: '2026-06-08' },
  { id: 'C6', name: 'Aman Verma', email: 'aman@mail.com', phone: '+91 9876543215', city: 'Pune', spent: 9100, lastOrder: '2026-02-26' },
  { id: 'C7', name: 'Nadia Hussain', email: 'nadia@mail.com', phone: '+91 9876543216', city: 'Hyderabad', spent: 5300, lastOrder: '2026-05-25' },
  { id: 'C8', name: 'Ishita Bose', email: 'ishita@mail.com', phone: '+91 9876543217', city: 'Kolkata', spent: 3700, lastOrder: '2026-03-22' }
];

let campaigns = [];
let communications = [];
let events = [];
let nextCampaignId = 1;
let nextComId = 1;
let nextEventId = 1;

function daysSince(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  return Math.floor((now - date) / (1000 * 60 * 60 * 24));
}

function filterAudience(minSpent = 0, inactiveDays = 30) {
  return customers.filter(c => c.spent > minSpent && daysSince(c.lastOrder) > inactiveDays);
}

function createCampaign(name, segment, message, channel) {
  const campaign = {
    id: `CMP${nextCampaignId++}`,
    name,
    segment,
    message,
    channel,
    status: 'draft',
    metrics: { sent: 0, delivered: 0, opened: 0, clicked: 0, converted: 0 }
  };
  campaigns.unshift(campaign);
  return campaign;
}

function recordEvent(customerId, campaignId, eventType) {
  const campaign = campaigns.find(c => c.id === campaignId);
  if (campaign && campaign.metrics[eventType] !== undefined) {
    campaign.metrics[eventType]++;
  }

  communications.push({
    id: `COM${nextComId++}`,
    customerId,
    campaignId,
    status: eventType,
    timestamp: new Date().toISOString()
  });

  const customer = customers.find(c => c.id === customerId);
  const message = `${customer?.name || 'Customer'} ${eventType}`;

  events.unshift({
    id: `EVT${nextEventId++}`,
    type: eventType,
    campaignId,
    customerName: customer?.name || 'Unknown',
    message,
    timestamp: new Date().toISOString()
  });

  if (events.length > 50) events.pop();
}

function getMetrics() {
  const totals = { sent: 0, delivered: 0, opened: 0, clicked: 0, converted: 0 };
  campaigns.forEach(c => {
    Object.keys(totals).forEach(key => {
      totals[key] += (c.metrics[key] || 0);
    });
  });
  return totals;
}

function getFunnel() {
  const m = getMetrics();
  const sent = Math.max(m.sent, 1);
  return [
    { label: 'Sent', value: m.sent, ratio: 100 },
    { label: 'Delivered', value: m.delivered, ratio: Math.round((m.delivered / sent) * 100) },
    { label: 'Opened', value: m.opened, ratio: Math.round((m.opened / sent) * 100) },
    { label: 'Clicked', value: m.clicked, ratio: Math.round((m.clicked / sent) * 100) },
    { label: 'Converted', value: m.converted, ratio: Math.round((m.converted / sent) * 100) }
  ];
}

module.exports = {
  customers,
  campaigns,
  communications,
  events,
  filterAudience,
  createCampaign,
  recordEvent,
  getMetrics,
  getFunnel,
  daysSince
};
