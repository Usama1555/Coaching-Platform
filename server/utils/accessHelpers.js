const Client = require('../models/Client');
const Coach = require('../models/Coach');
const { ensureCoachProfile } = require('./profileHelpers');

async function getAuthorizedClient(req, clientId) {
  const client = await Client.findById(clientId);

  if (!client) {
    return { error: { status: 404, message: 'Client not found' } };
  }

  if (req.user.role === 'coach') {
    const coach = await ensureCoachProfile(req.user.id);

    if (!client.coachId || String(client.coachId) !== String(coach._id)) {
      return { error: { status: 403, message: 'You do not have access to this client' } };
    }

    return { client, coach };
  }

  if (req.user.role === 'client') {
    if (String(client.userId) !== String(req.user.id)) {
      return { error: { status: 403, message: 'You do not have access to this client' } };
    }

    const coach = client.coachId ? await Coach.findById(client.coachId) : null;
    return { client, coach };
  }

  return { error: { status: 403, message: 'Unsupported role for this action' } };
}

async function getClientProfileByUserId(userId) {
  return Client.findOne({ userId });
}

module.exports = {
  getAuthorizedClient,
  getClientProfileByUserId,
};

