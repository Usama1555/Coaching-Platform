function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function getOwnerEmails() {
  return String(process.env.OWNER_EMAILS || '')
    .split(',')
    .map((email) => normalizeEmail(email))
    .filter(Boolean);
}

function isOwnerEmail(email) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return false;
  }

  return getOwnerEmails().includes(normalizedEmail);
}

module.exports = {
  getOwnerEmails,
  isOwnerEmail,
  normalizeEmail,
};
