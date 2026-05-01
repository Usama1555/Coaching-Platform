const Coach = require('../models/Coach');
const Client = require('../models/Client');

async function ensureCoachProfile(userId) {
  let coach = await Coach.findOne({ userId });

  if (!coach) {
    coach = await Coach.create({ userId });
  }

  return coach;
}

async function ensureClientProfile(userId, initialValues = {}) {
  let client = await Client.findOne({ userId });

  if (!client) {
    client = await Client.create({
      userId,
      ...initialValues,
    });
  }

  return client;
}

async function assignClientToCoach(client, coachId) {
  const previousCoachId = client.coachId ? String(client.coachId) : null;
  const nextCoachId = String(coachId);

  if (previousCoachId && previousCoachId !== nextCoachId) {
    await Coach.findByIdAndUpdate(previousCoachId, {
      $pull: { clients: client._id },
    });
  }

  client.coachId = coachId;
  await client.save();

  await Coach.findByIdAndUpdate(coachId, {
    $addToSet: { clients: client._id },
  });

  return client;
}

module.exports = {
  ensureCoachProfile,
  ensureClientProfile,
  assignClientToCoach,
};

