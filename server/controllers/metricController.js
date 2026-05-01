const BodyMetric = require('../models/BodyMetric');
const Client = require('../models/Client');
const { getAuthorizedClient, getClientProfileByUserId } = require('../utils/accessHelpers');

function normalizeDateInput(value) {
  const date = value ? new Date(value) : new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function nullableNumber(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

exports.upsertBodyMetric = async (req, res) => {
  try {
    const clientProfile = await getClientProfileByUserId(req.user.id);

    if (!clientProfile) {
      return res.status(404).json({ message: 'Client profile not found' });
    }

    const payload = {
      clientId: clientProfile._id,
      date: normalizeDateInput(req.body.date),
      weight: nullableNumber(req.body.weight),
      bodyFatPercent: nullableNumber(req.body.bodyFatPercent),
      waistCm: nullableNumber(req.body.waistCm),
      chestCm: nullableNumber(req.body.chestCm),
      armCm: nullableNumber(req.body.armCm),
      legCm: nullableNumber(req.body.legCm),
      progressPhotoUrl: req.body.progressPhotoUrl || '',
      energyLevel: nullableNumber(req.body.energyLevel),
      sleepHours: nullableNumber(req.body.sleepHours),
      notes: req.body.notes || '',
    };

    const metric = await BodyMetric.findOneAndUpdate(
      { clientId: clientProfile._id, date: payload.date },
      payload,
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    if (payload.weight !== null) {
      await Client.findByIdAndUpdate(clientProfile._id, {
        $set: { currentWeight: payload.weight },
      });
    }

    return res.status(200).json({
      message: 'Body metric saved successfully',
      metric,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to save body metric',
      error: error.message,
    });
  }
};

exports.getClientMetrics = async (req, res) => {
  try {
    const { client, error } = await getAuthorizedClient(req, req.params.clientId);

    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    const metrics = await BodyMetric.find({ clientId: client._id }).sort({ date: -1, createdAt: -1 });

    return res.status(200).json({ metrics });
  } catch (requestError) {
    return res.status(500).json({
      message: 'Failed to load body metrics',
      error: requestError.message,
    });
  }
};

