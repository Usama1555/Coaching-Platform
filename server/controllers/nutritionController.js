const NutritionLog = require('../models/NutritionLog');
const { getAuthorizedClient, getClientProfileByUserId } = require('../utils/accessHelpers');

function normalizeDateInput(value) {
  const date = value ? new Date(value) : new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

exports.upsertNutritionLog = async (req, res) => {
  try {
    const clientProfile = await getClientProfileByUserId(req.user.id);

    if (!clientProfile) {
      return res.status(404).json({ message: 'Client profile not found' });
    }

    const payload = {
      clientId: clientProfile._id,
      date: normalizeDateInput(req.body.date),
      totalCalories: Number(req.body.totalCalories) || 0,
      totalProtein: Number(req.body.totalProtein) || 0,
      totalCarbs: Number(req.body.totalCarbs) || 0,
      totalFat: Number(req.body.totalFat) || 0,
      meals: Array.isArray(req.body.meals) ? req.body.meals : [],
      waterLitres: Number(req.body.waterLitres) || 0,
      notes: req.body.notes || '',
    };

    const nutritionLog = await NutritionLog.findOneAndUpdate(
      { clientId: clientProfile._id, date: payload.date },
      payload,
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.status(200).json({
      message: 'Nutrition log saved successfully',
      nutritionLog,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to save nutrition log',
      error: error.message,
    });
  }
};

exports.getClientNutritionHistory = async (req, res) => {
  try {
    const { client, error } = await getAuthorizedClient(req, req.params.clientId);

    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    const logs = await NutritionLog.find({ clientId: client._id }).sort({ date: -1, createdAt: -1 });

    return res.status(200).json({ logs });
  } catch (requestError) {
    return res.status(500).json({
      message: 'Failed to load nutrition history',
      error: requestError.message,
    });
  }
};

exports.getTodayNutrition = async (req, res) => {
  try {
    const { client, error } = await getAuthorizedClient(req, req.params.clientId);

    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    const today = normalizeDateInput();
    const log = await NutritionLog.findOne({ clientId: client._id, date: today });

    if (!log) {
      return res.status(404).json({ message: 'No nutrition log found for today' });
    }

    return res.status(200).json({ log });
  } catch (requestError) {
    return res.status(500).json({
      message: 'Failed to load today nutrition log',
      error: requestError.message,
    });
  }
};

