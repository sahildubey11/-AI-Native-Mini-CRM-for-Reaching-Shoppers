// Simple AI helpers for segment parsing and message generation

function parseSegment(prompt = '') {
  const text = prompt.toLowerCase();
  const rules = [];
  let minSpent = 0;
  let inactiveDays = 30;

  // Extract spend requirement
  const spendMatch = text.match(/spent?\s+(?:more than|over|>)\s*₹?\s*(\d+)/i);
  if (spendMatch) {
    minSpent = parseInt(spendMatch[1], 10);
    rules.push(`Spent > ₹${minSpent}`);
  }

  // Extract inactivity requirement
  const inactiveMatch = text.match(/(?:no order|haven't ordered)\s+in\s+(\d+)\s+days/i);
  if (inactiveMatch) {
    inactiveDays = parseInt(inactiveMatch[1], 10);
    rules.push(`No order in ${inactiveDays} days`);
  }

  if (rules.length === 0) rules.push('All customers');

  return { minSpent, inactiveDays, rules, label: rules.join(' • ') };
}

function generateMessage(audience = []) {
  const firstName = audience[0]?.name?.split(' ')[0] || 'there';
  const message = `Hey ${firstName} 👋\n\nWe missed you! Here's a 15% discount waiting for you.\n\nTap the link below to claim it before midnight.`;
  return { message, charCount: message.length };
}

function recommendChannel(audience = []) {
  const highValue = audience.some(c => c.spent >= 5000);
  const channel = highValue ? 'WhatsApp' : 'Email';
  const reason = highValue 
    ? 'WhatsApp works best for premium segments with quick, personal offers.'
    : 'Email gives more space for storytelling with this audience.';
  return { channel, reason, score: highValue ? 92 : 78 };
}

module.exports = { parseSegment, generateMessage, recommendChannel };
