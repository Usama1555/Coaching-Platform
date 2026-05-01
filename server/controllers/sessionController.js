const Client = require('../models/Client');
const Coach = require('../models/Coach');
const SessionLog = require('../models/SessionLog');
const WorkoutPlan = require('../models/WorkoutPlan');
const { getAuthorizedClient, getClientProfileByUserId } = require('../utils/accessHelpers');
const { ensureCoachProfile } = require('../utils/profileHelpers');
const { buildOverloadSummary } = require('../utils/overload');

function normalizeSetPayload(sets) {
  return sets.map((set, index) => ({
    exerciseName: set.exerciseName,
    muscleGroup: set.muscleGroup || '',
    setNumber: Number(set.setNumber) || index + 1,
    repsCompleted: Number(set.repsCompleted) || 0,
    weightUsed: Number(set.weightUsed) || 0,
    hitFailure: Boolean(set.hitFailure),
  }));
}

async function getAuthorizedSession(req, sessionId) {
  const session = await SessionLog.findById(sessionId)
    .populate('clientId', 'userId goal currentWeight targetWeight targetCalories targetProtein experience')
    .populate('workoutPlanId', 'name splitType weekStartDate');

  if (!session) {
    return { error: { status: 404, message: 'Session not found' } };
  }

  if (req.user.role === 'coach') {
    const coach = await ensureCoachProfile(req.user.id);

    if (String(session.coachId) !== String(coach._id)) {
      return { error: { status: 403, message: 'You do not have access to this session' } };
    }

    return { session, coach };
  }

  if (req.user.role === 'client') {
    const clientProfile = await getClientProfileByUserId(req.user.id);

    if (!clientProfile || String(session.clientId._id) !== String(clientProfile._id)) {
      return { error: { status: 403, message: 'You do not have access to this session' } };
    }

    return { session, client: clientProfile };
  }

  return { error: { status: 403, message: 'Unsupported role for this action' } };
}

exports.createSession = async (req, res) => {
  try {
    const clientProfile = await getClientProfileByUserId(req.user.id);

    if (!clientProfile) {
      return res.status(404).json({ message: 'Client profile not found' });
    }

    const {
      workoutPlanId,
      dayNumber,
      dayLabel,
      sets = [],
      cardioCompleted = false,
      cardioDurationMins = 0,
      sessionNotes = '',
      date,
    } = req.body;

    if (!workoutPlanId || !Array.isArray(sets) || sets.length === 0) {
      return res.status(400).json({
        message: 'workoutPlanId and at least one logged set are required',
      });
    }

    const workoutPlan = await WorkoutPlan.findOne({
      _id: workoutPlanId,
      clientId: clientProfile._id,
    });

    if (!workoutPlan) {
      return res.status(404).json({ message: 'Workout plan not found for this client' });
    }

    const resolvedDay =
      workoutPlan.days.find((day) => Number(day.dayNumber) === Number(dayNumber)) ||
      workoutPlan.days.find((day) => day.label === dayLabel);

    if (!resolvedDay) {
      return res.status(400).json({ message: 'The selected workout day is not part of this plan' });
    }

    const normalizedSets = normalizeSetPayload(sets);
    const overloadSummary = buildOverloadSummary(normalizedSets);

    const session = await SessionLog.create({
      clientId: clientProfile._id,
      coachId: workoutPlan.coachId,
      workoutPlanId: workoutPlan._id,
      dayNumber: resolvedDay.dayNumber,
      dayLabel: resolvedDay.label,
      date: date || new Date(),
      sets: overloadSummary.sets,
      cardioCompleted,
      cardioDurationMins: Number(cardioDurationMins) || 0,
      sessionNotes,
    });

    return res.status(201).json({
      message: 'Session logged successfully',
      session,
      alerts: overloadSummary.alerts,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to log session',
      error: error.message,
    });
  }
};

exports.getClientSessions = async (req, res) => {
  try {
    const { client, error } = await getAuthorizedClient(req, req.params.clientId);

    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    const sessions = await SessionLog.find({ clientId: client._id })
      .sort({ date: -1, createdAt: -1 })
      .populate('workoutPlanId', 'name splitType weekStartDate');

    return res.status(200).json({ sessions });
  } catch (requestError) {
    return res.status(500).json({
      message: 'Failed to load sessions',
      error: requestError.message,
    });
  }
};

exports.getSessionDetail = async (req, res) => {
  try {
    const { session, error } = await getAuthorizedSession(req, req.params.sessionId);

    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    return res.status(200).json({ session });
  } catch (requestError) {
    return res.status(500).json({
      message: 'Failed to load session detail',
      error: requestError.message,
    });
  }
};

exports.addCoachComment = async (req, res) => {
  try {
    const coach = await ensureCoachProfile(req.user.id);
    const coachComment = req.body.coachComment || req.body.text;

    if (!coachComment || !coachComment.trim()) {
      return res.status(400).json({ message: 'A comment is required' });
    }

    const session = await SessionLog.findOne({
      _id: req.params.sessionId,
      coachId: coach._id,
    });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    session.coachComment = coachComment.trim();
    session.coachCommentAt = new Date();
    await session.save();

    return res.status(200).json({
      message: 'Coach comment saved successfully',
      session,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to save coach comment',
      error: error.message,
    });
  }
};

exports.getCoachRecentSessions = async (req, res) => {
  try {
    const coach = await ensureCoachProfile(req.user.id);
    const sessions = await SessionLog.find({ coachId: coach._id })
      .sort({ date: -1, createdAt: -1 })
      .limit(10)
      .populate({
        path: 'clientId',
        populate: {
          path: 'userId',
          select: 'name email',
        },
      })
      .populate('workoutPlanId', 'name');

    return res.status(200).json({ sessions });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to load recent coach sessions',
      error: error.message,
    });
  }
};

