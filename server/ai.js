function normalizePrompt(prompt = '') {
  return String(prompt).trim();
}

function extractNumber(pattern, prompt) {
  const match = prompt.match(pattern);
  if (!match) return null;
  return Number(String(match[1]).replace(/,/g, ''));
}

function parseSegmentPrompt(prompt = '') {
  const text = normalizePrompt(prompt);
  const lower = text.toLowerCase();
  const filters = {};
  const rules = [];

  const totalSpentGt = extractNumber(/spent\s*(?:more than|over|above|>)\s*₹?\s*([\d,]+)/i, text) ?? extractNumber(/total spent\s*(?:more than|over|above|>)\s*₹?\s*([\d,]+)/i, text);
  if (totalSpentGt !== null) {
    filters.totalSpentGt = totalSpentGt;
    rules.push(`Spent more than ₹${totalSpentGt.toLocaleString('en-IN')}`);
  }

  const lastOrderDaysGt = extractNumber(/(?:no order in|haven't ordered in|not ordered in|inactive for|no purchase in)\s*(\d+)\s*days?/i, text);
  if (lastOrderDaysGt !== null) {
    filters.lastOrderDaysGt = lastOrderDaysGt;
    rules.push(`No order in ${lastOrderDaysGt} days`);
  }

  if (lower.includes('premium')) {
    filters.totalSpentGt = Math.max(filters.totalSpentGt || 0, 5000);
    filters.lifecycle = 'premium';
    rules.push('Premium shoppers');
  }

  if (lower.includes('inactive')) {
    filters.lastOrderDaysGt = Math.max(filters.lastOrderDaysGt || 0, 30);
    filters.lifecycle = 'inactive';
    rules.push('Inactive shoppers');
  }

  const cityMatch = text.match(/(?:in|from|for)\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)/);
  if (cityMatch) {
    filters.city = cityMatch[1].trim();
    rules.push(`City = ${filters.city}`);
  }

  if (!rules.length) {
    rules.push('Broad reactivation audience');
  }

  const audienceLabel = [
    filters.totalSpentGt ? `High value over ₹${filters.totalSpentGt.toLocaleString('en-IN')}` : null,
    filters.lastOrderDaysGt ? `inactive for ${filters.lastOrderDaysGt}+ days` : null,
    filters.city ? filters.city : null
  ]
    .filter(Boolean)
    .join(' • ') || 'Broad audience';

  return {
    rawPrompt: text,
    filters,
    rules,
    audienceLabel
  };
}

function generateCampaignMessage({ segmentPrompt = '', audience = [], tone = 'warm' } = {}) {
  const prompt = normalizePrompt(segmentPrompt).toLowerCase();
  const firstName = audience[0]?.name?.split(' ')[0] || 'there';
  const discount = prompt.includes('15%') ? '15% off' : prompt.includes('20%') ? '20% off' : 'an exclusive offer';
  const opener = tone === 'direct' ? 'Quick note' : 'Hey';
  const body = prompt.includes('whatsapp') ? 'We picked WhatsApp because it is the fastest way to re-engage this audience.' : 'We kept the message short so it feels personal and easy to act on.';

  const lines = [
    `${opener} ${firstName} 👋`,
    '',
    `We missed you. Here is ${discount} waiting for you today.`,
    'Tap back to grab it before midnight and we will keep your cart-ready picks at the top.',
    '',
    body,
    '',
    '— Team Copilot'
  ];

  return {
    message: lines.join('\n'),
    firstName,
    characterCount: lines.join('\n').length
  };
}

function recommendChannel({ segmentPrompt = '', audience = [] } = {}) {
  const prompt = normalizePrompt(segmentPrompt).toLowerCase();
  const highValue = audience.some((customer) => customer.totalSpent >= 5000);
  const inactive = audience.some((customer) => prompt.includes('inactive') || prompt.includes('no order'));
  const whatsappScore = highValue || inactive || prompt.includes('discount') ? 92 : 68;

  if (prompt.includes('urgent') || prompt.includes('otp') || prompt.includes('reminder')) {
    return {
      channel: 'SMS',
      reason: 'Best for urgent, short-form messages that should land instantly.',
      score: 88
    };
  }

  if (prompt.includes('long-form') || prompt.includes('report') || prompt.includes('weekly')) {
    return {
      channel: 'Email',
      reason: 'Longer storytelling works better when the audience has time to read it.',
      score: 85
    };
  }

  return {
    channel: 'WhatsApp',
    reason: highValue ? 'This audience tends to open quick, personal offers faster on WhatsApp.' : 'Short reactivation offers perform well on WhatsApp for this audience.',
    score: whatsappScore
  };
}

function summarizeInsights(metrics, campaigns) {
  const totalCampaigns = campaigns.length;
  const topCampaign = campaigns[0];
  return [
    `Campaign delivery is stable across ${totalCampaigns} active launches, which keeps the demo feeling real without introducing provider risk.`,
    metrics.opened > 0
      ? `Open behaviour is healthy at ${Math.round((metrics.opened / Math.max(metrics.delivered, 1)) * 100)}%, so the offer framing is doing its job.`
      : 'Open rate is currently flat, which suggests the hook or channel should be adjusted.',
    topCampaign
      ? `The current leader is "${topCampaign.name}" on ${topCampaign.channel}, a strong signal that premium reactivation still wins.`
      : 'No campaigns have been launched yet, so the dashboard is ready for the first move.'
  ];
}

module.exports = {
  parseSegmentPrompt,
  generateCampaignMessage,
  recommendChannel,
  summarizeInsights
};
