const Client = require('../models/Client');
const WorkoutPlan = require('../models/WorkoutPlan');
const { getAuthorizedClient } = require('../utils/accessHelpers');
const { ensureCoachProfile } = require('../utils/profileHelpers');

exports.createWorkoutPlan = async (req, res) => {
  try {
    const coach = await ensureCoachProfile(req.user.id);
    const { clientId, name, splitType, templateId = null, weekStartDate, days, isActive = true } = req.body;

    if (!clientId || !name || !weekStartDate || !Array.isArray(days) || days.length === 0) {
      return res.status(400).json({
        message: 'clientId, name, weekStartDate, and at least one day are required',
      });
    }

    const client = await Client.findOne({ _id: clientId, coachId: coach._id });

    if (!client) {
      return res.status(404).json({ message: 'Client not found for this coach' });
    }

    if (isActive) {
      await WorkoutPlan.updateMany(
        { clientId: client._id, coachId: coach._id, isActive: true },
        { $set: { isActive: false } }
      );
    }

    const workoutPlan = await WorkoutPlan.create({
      coachId: coach._id,
      clientId: client._id,
      name,
      splitType,
      templateId,
      weekStartDate,
      days,
      isActive,
    });

    return res.status(201).json({
      message: 'Workout plan created successfully',
      plan: workoutPlan,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to create workout plan',
      error: error.message,
    });
  }
};

exports.getClientPlans = async (req, res) => {
  try {
    const { client, error } = await getAuthorizedClient(req, req.params.clientId);

    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    const plans = await WorkoutPlan.find({ clientId: client._id }).sort({ createdAt: -1 });

    return res.status(200).json({ plans });
  } catch (requestError) {
    return res.status(500).json({
      message: 'Failed to load workout plans',
      error: requestError.message,
    });
  }
};

exports.getActivePlan = async (req, res) => {
  try {
    const { client, error } = await getAuthorizedClient(req, req.params.clientId);

    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    const plan = await WorkoutPlan.findOne({
      clientId: client._id,
      isActive: true,
    }).sort({ createdAt: -1 });

    if (!plan) {
      return res.status(404).json({ message: 'No active workout plan found' });
    }

    return res.status(200).json({ plan });
  } catch (requestError) {
    return res.status(500).json({
      message: 'Failed to load active workout plan',
      error: requestError.message,
    });
  }
};

exports.updateWorkoutPlan = async (req, res) => {
  try {
    const coach = await ensureCoachProfile(req.user.id);
    const plan = await WorkoutPlan.findOne({
      _id: req.params.planId,
      coachId: coach._id,
    });

    if (!plan) {
      return res.status(404).json({ message: 'Workout plan not found' });
    }

    const allowedFields = ['name', 'splitType', 'templateId', 'weekStartDate', 'days', 'isActive'];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        plan[field] = req.body[field];
      }
    });

    if (plan.isActive) {
      await WorkoutPlan.updateMany(
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
      message: 'Workout plan updated successfully',
      plan,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to update workout plan',
      error: error.message,
    });
  }
};

exports.deleteWorkoutPlan = async (req, res) => {
  try {
    const coach = await ensureCoachProfile(req.user.id);
    const deletedPlan = await WorkoutPlan.findOneAndDelete({
      _id: req.params.planId,
      coachId: coach._id,
    });

    if (!deletedPlan) {
      return res.status(404).json({ message: 'Workout plan not found' });
    }

    return res.status(200).json({
      message: 'Workout plan deleted successfully',
      planId: deletedPlan._id,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to delete workout plan',
      error: error.message,
    });
  }
};
