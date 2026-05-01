function parseUrlList(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function getAllowedClientOrigins() {
  const configuredOrigins = parseUrlList(process.env.CLIENT_URL);

  if (configuredOrigins.length) {
    return configuredOrigins;
  }

  return ['http://localhost:5173'];
}

function getPrimaryClientUrl() {
  return process.env.APP_URL?.trim() || getAllowedClientOrigins()[0] || 'http://localhost:5173';
}

module.exports = {
  getAllowedClientOrigins,
  getPrimaryClientUrl,
};
