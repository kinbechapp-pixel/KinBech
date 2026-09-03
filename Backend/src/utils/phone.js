function normalizePhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('977') && digits.length >= 13) return `+${digits}`;
  if (digits.length === 10) return `+977${digits}`;
  return `+${digits}`;
}

module.exports = { normalizePhone };
