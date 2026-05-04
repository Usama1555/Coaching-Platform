const Client = require('../models/Client');
const MealPlan = require('../models/MealPlan');
const { getAuthorizedClient } = require('../utils/accessHelpers');
const { ensureCoachProfile } = require('../utils/profileHelpers');

function normalizeNumber(value) {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function normalizeFood(food = {}) {
  return {
    name: String(food.name || '').trim(),
    weightGrams: normalizeNumber(food.weightGrams),
    calories: normalizeNumber(food.calories),
    protein: normalizeNumber(food.protein),
    carbs: normalizeNumber(food.carbs),
    fat: normalizeNumber(food.fat),
    notes: String(food.notes || '').trim(),
  };
}

function normalizeMeals(meals) {
  if (!Array.isArray(meals)) {
    return [];
  }

  return meals
    .map((meal) => {
      const foods = Array.isArray(meal.foods)
        ? meal.foods.map(normalizeFood).filter((food) => food.name)
        : [];

      return {
        name: String(meal.name || '').trim(),
        targetTime: String(meal.targetTime || '').trim(),
        foods,
        mealCalories: foods.reduce((sum, food) => sum + food.calories, 0),
        mealProtein: foods.reduce((sum, food) => sum + food.protein, 0),
      };
    })
    .filter((meal) => meal.name);
}

exports.createMealPlan = async (req, res) => {
  try {
    const coach = await ensureCoachProfile(req.user.id);
    const { clientId, name, weekStartDate, isActive = true } = req.body;

    if (!clientId || !name || !weekStartDate) {
      return res.status(400).json({
        message: 'clientId, name, and weekStartDate are required',
      });
    }

    const client = await Client.findOne({ _id: clientId, coachId: coach._id });

    if (!client) {
      return res.status(404).json({ message: 'Client not found for this coach' });
    }

    if (isActive) {
      await MealPlan.updateMany(
        { clientId: client._id, coachId: coach._id, isActive: true },
        { $set: { isActive: false } }
      );
    }

    const mealPlan = await MealPlan.create({
      coachId: coach._id,
      clientId: client._id,
      name: String(name).trim(),
      weekStartDate,
      dailyCalorieTarget: normalizeNumber(req.body.dailyCalorieTarget),
      dailyProteinTarget: normalizeNumber(req.body.dailyProteinTarget),
      dailyCarbTarget: normalizeNumber(req.body.dailyCarbTarget),
      dailyFatTarget: normalizeNumber(req.body.dailyFatTarget),
      meals: normalizeMeals(req.body.meals),
      cheatMealDay: String(req.body.cheatMealDay || '').trim().toLowerCase(),
      cheatMealRules: String(req.body.cheatMealRules || '').trim(),
      resetDayRules: String(req.body.resetDayRules || '').trim(),
      notes: String(req.body.notes || '').trim(),
      isActive: Boolean(isActive),
    });

    return res.status(201).json({
      message: 'Meal plan created successfully',
      plan: mealPlan,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to create meal plan',
      error: error.message,
    });
  }
};

exports.getClientMealPlans = async (req, res) => {
  try {
    const { client, error } = await getAuthorizedClient(req, req.params.clientId);

    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    const plans = await MealPlan.find({ clientId: client._id }).sort({ createdAt: -1 });

    return res.status(200).json({ plans });
  } catch (requestError) {
    return res.status(500).json({
      message: 'Failed to load meal plans',
      error: requestError.message,
    });
  }
};

exports.getActiveMealPlan = async (req, res) => {
  try {
    const { client, error } = await getAuthorizedClient(req, req.params.clientId);

    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    const plan = await MealPlan.findOne({
      clientId: client._id,
      isActive: true,
    }).sort({ createdAt: -1 });

    if (!plan) {
      return res.status(404).json({ message: 'No active meal plan found' });
    }

    return res.status(200).json({ plan });
  } catch (requestError) {
    return res.status(500).json({
      message: 'Failed to load active meal plan',
      error: requestError.message,
    });
  }
};

exports.updateMealPlan = async (req, res) => {
  try {
    const coach = await ensureCoachProfile(req.user.id);
    const plan = await MealPlan.findOne({
      _id: req.params.planId,
      coachId: coach._id,
    });

    if (!plan) {
      return res.status(404).json({ message: 'Meal plan not found' });
    }

    const allowedFields = [
      'name',
      'weekStartDate',
      'dailyCalorieTarget',
      'dailyProteinTarget',
      'dailyCarbTarget',
      'dailyFatTarget',
      'cheatMealDay',
      'cheatMealRules',
      'resetDayRules',
      'notes',
      'isActive',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field.includes('Target')) {
          plan[field] = normalizeNumber(req.body[field]);
        } else if (field === 'cheatMealDay') {
          plan[field] = String(req.body[field] || '').trim().toLowerCase();
        } else if (['cheatMealRules', 'resetDayRules', 'notes', 'name'].includes(field)) {
          plan[field] = String(req.body[field] || '').trim();
        } else {
          plan[field] = req.body[field];
        }
      }
    });

    if (req.body.meals !== undefined) {
      plan.meals = normalizeMeals(req.body.meals);
    }

    if (plan.isActive) {
      await MealPlan.updateMany(
        {
          clientId: plan.clientId,
          coachId: coach._id,
          isActive: true,
          _id: { $ne: plan._id },
        },
        { $set: { isActive: false } }
      );
    }

    await plan.save();

    return res.status(200).json({
      message: 'Meal plan updated successfully',
      plan,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to update meal plan',
      error: error.message,
    });
  }
};

exports.deleteMealPlan = async (req, res) => {
  try {
    const coach = await ensureCoachProfile(req.user.id);
    const deletedPlan = await MealPlan.findOneAndDelete({
      _id: req.params.planId,
      coachId: coach._id,
    });

    if (!deletedPlan) {
      return res.status(404).json({ message: 'Meal plan not found' });
    }

    return res.status(200).json({
      message: 'Meal plan deleted successfully',
      planId: deletedPlan._id,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to delete meal plan',
      error: error.message,
    });
  }
};
