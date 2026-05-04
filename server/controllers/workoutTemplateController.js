const WorkoutTemplate = require('../models/WorkoutTemplate');
const { ensureCoachProfile } = require('../utils/profileHelpers');

function validateTemplatePayload({ name, days }) {
  if (!name || !String(name).trim()) {
    return 'Template name is required';
  }

  if (!Array.isArray(days) || !days.length) {
    return 'At least one template day is required';
  }

  return '';
}

exports.createWorkoutTemplate = async (req, res) => {
  try {
    const coach = await ensureCoachProfile(req.user.id);
    const validationMessage = validateTemplatePayload(req.body);

    if (validationMessage) {
      return res.status(400).json({ message: validationMessage });
    }

    const workoutTemplate = await WorkoutTemplate.create({
      coachId: coach._id,
      name: req.body.name,
      days: req.body.days,
    });

    return res.status(201).json({
      message: 'Workout template created successfully',
      template: workoutTemplate,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to create workout template',
      error: error.message,
    });
  }
};

exports.getWorkoutTemplates = async (req, res) => {
  try {
    const coach = await ensureCoachProfile(req.user.id);
    const templates = await WorkoutTemplate.find({ coachId: coach._id }).sort({ createdAt: -1 });

    return res.status(200).json({ templates });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to load workout templates',
      error: error.message,
    });
  }
};

exports.getWorkoutTemplate = async (req, res) => {
  try {
    const coach = await ensureCoachProfile(req.user.id);
    const template = await WorkoutTemplate.findOne({
      _id: req.params.templateId,
      coachId: coach._id,
    });

    if (!template) {
      return res.status(404).json({ message: 'Workout template not found' });
    }

    return res.status(200).json({ template });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to load workout template',
      error: error.message,
    });
  }
};

exports.updateWorkoutTemplate = async (req, res) => {
  try {
    const coach = await ensureCoachProfile(req.user.id);
    const template = await WorkoutTemplate.findOne({
      _id: req.params.templateId,
      coachId: coach._id,
    });

    if (!template) {
      return res.status(404).json({ message: 'Workout template not found' });
    }

    const nextName = req.body.name !== undefined ? req.body.name : template.name;
    const nextDays = req.body.days !== undefined ? req.body.days : template.days;
    const validationMessage = validateTemplatePayload({ name: nextName, days: nextDays });

    if (validationMessage) {
      return res.status(400).json({ message: validationMessage });
    }

    template.name = nextName;
    template.days = nextDays;
    await template.save();

    return res.status(200).json({
      message: 'Workout template updated successfully',
      template,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to update workout template',
      error: error.message,
    });
  }
};

exports.deleteWorkoutTemplate = async (req, res) => {
  try {
    const coach = await ensureCoachProfile(req.user.id);
    const deletedTemplate = await WorkoutTemplate.findOneAndDelete({
      _id: req.params.templateId,
      coachId: coach._id,
    });

    if (!deletedTemplate) {
      return res.status(404).json({ message: 'Workout template not found' });
    }

    return res.status(200).json({
      message: 'Workout template deleted successfully',
      templateId: deletedTemplate._id,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to delete workout template',
      error: error.message,
    });
  }
};
