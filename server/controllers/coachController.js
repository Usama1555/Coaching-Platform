const crypto = require('crypto');
const AIConversation = require('../models/AIConversation');
const BodyMetric = require('../models/BodyMetric');
const Coach = require('../models/Coach');
const Client = require('../models/Client');
const MealPlan = require('../models/MealPlan');
const NutritionLog = require('../models/NutritionLog');
const SessionLog = require('../models/SessionLog');
const User = require('../models/User');
const WorkoutPlan = require('../models/WorkoutPlan');
const {
  ensureCoachProfile,
  ensureClientProfile,
  assignClientToCoach,
} = require('../utils/profileHelpers');

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function getMostRecentDate(dates) {
  const timestamps = dates
    .filter(Boolean)
    .map((value) => new Date(value).getTime())
    .filter((value) => !Number.isNaN(value));

  if (!timestamps.length) {
    return null;
  }

  return new Date(Math.max(...timestamps));
}

function getDaysSince(value) {
  if (!value) {
    return null;
  }

  return Math.floor((Date.now() - new Date(value).getTime()) / DAY_IN_MS);
}

function buildClientStatus({ client, activePlan, latestSession, latestNutrition, latestMetric }) {
  const latestSessionAt = latestSession?.date || null;
  const latestNutritionAt = latestNutrition?.date || null;
  const latestMetricAt = latestMetric?.date || null;
  const lastActiveAt = getMostRecentDate([latestSessionAt, latestNutritionAt, latestMetricAt]);
  const joinedDaysAgo = getDaysSince(client.joinedAt);
  const inactivityDays = getDaysSince(lastActiveAt);
  const hasAnyActivity = Boolean(lastActiveAt);

  if (!hasAnyActivity) {
    if (joinedDaysAgo !== null && joinedDaysAgo > 7) {
      return {
        status: 'inactive',
        statusReason: 'No training, nutrition, or check-in activity has been logged yet.',
        lastActiveAt: null,
        latestSessionAt,
        latestNutritionAt,
        latestMetricAt,
      };
    }

    if (!activePlan) {
      return {
        status: 'needs_attention',
        statusReason: 'No active plan or client activity is in place yet.',
        lastActiveAt: null,
        latestSessionAt,
        latestNutritionAt,
        latestMetricAt,
      };
    }

    return {
      status: 'needs_attention',
      statusReason: 'Waiting for the first workout, nutrition log, or body-metric check-in.',
      lastActiveAt: null,
      latestSessionAt,
      latestNutritionAt,
      latestMetricAt,
    };
  }

  if (inactivityDays !== null && inactivityDays > 10) {
    return {
      status: 'inactive',
      statusReason: `No client activity has been logged for ${inactivityDays} days.`,
      lastActiveAt,
      latestSessionAt,
      latestNutritionAt,
      latestMetricAt,
    };
  }

  if (!activePlan) {
    return {
      status: 'needs_attention',
      statusReason: 'Client is active, but no workout plan is currently assigned.',
      lastActiveAt,
      latestSessionAt,
      latestNutritionAt,
      latestMetricAt,
    };
  }

  if (!latestSessionAt || getDaysSince(latestSessionAt) > 7) {
    return {
      status: 'needs_attention',
      statusReason: 'Workout logging is not current for the last 7 days.',
      lastActiveAt,
      latestSessionAt,
      latestNutritionAt,
      latestMetricAt,
    };
  }

  if (!latestNutritionAt || getDaysSince(latestNutritionAt) > 3) {
    return {
      status: 'needs_attention',
      statusReason: 'Nutrition tracking is falling behind.',
      lastActiveAt,
      latestSessionAt,
      latestNutritionAt,
      latestMetricAt,
    };
  }

  if (!latestMetricAt || getDaysSince(latestMetricAt) > 14) {
    return {
      status: 'needs_attention',
      statusReason: 'Body-metric check-in is overdue.',
      lastActiveAt,
      latestSessionAt,
      latestNutritionAt,
      latestMetricAt,
    };
  }

  return {
    status: 'on_track',
    statusReason: 'Training, nutrition, and check-in habits are all current.',
    lastActiveAt,
    latestSessionAt,
    latestNutritionAt,
    latestMetricAt,
  };
}

function serializeClient(client, activePlan, statusSnapshot = null) {
  return {
    id: client._id,
    user: client.userId,
    goal: client.goal,
    currentWeight: client.currentWeight,
    targetWeight: client.targetWeight,
    height: client.height,
    maintenanceCalories: client.maintenanceCalories,
    targetCalories: client.targetCalories,
    targetProtein: client.targetProtein,
    injuries: client.injuries,
    experience: client.experience,
    joinedAt: client.joinedAt,
    status: statusSnapshot?.status || 'needs_attention',
    statusReason: statusSnapshot?.statusReason || 'Status not calculated',
    lastActiveAt: statusSnapshot?.lastActiveAt || null,
    latestSessionAt: statusSnapshot?.latestSessionAt || null,
    latestNutritionAt: statusSnapshot?.latestNutritionAt || null,
    latestMetricAt: statusSnapshot?.latestMetricAt || null,
    activePlan: activePlan
      ? {
          id: activePlan._id,
          name: activePlan.name,
          splitType: activePlan.splitType,
          weekStartDate: activePlan.weekStartDate,
          createdAt: activePlan.createdAt,
        }
      : null,
  };
}

async function getCoachOwnedClient(coachUserId, clientId) {
  const coach = await ensureCoachProfile(coachUserId);
  const client = await Client.findOne({
    _id: clientId,
    coachId: coach._id,
  }).populate('userId', 'name email avatar createdAt updatedAt role');

  return { coach, client };
}

exports.getDashboard = async (req, res) => {
  try {
    const coach = await ensureCoachProfile(req.user.id);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    const [totalClients, totalPlans, activePlans, recentClients, activePlanRows, sessionsToday, pendingComments, recentSessions] =
      await Promise.all([
        Client.countDocuments({ coachId: coach._id }),
        WorkoutPlan.countDocuments({ coachId: coach._id }),
        WorkoutPlan.countDocuments({ coachId: coach._id, isActive: true }),
        Client.find({ coachId: coach._id })
          .populate('userId', 'name email avatar')
          .sort({ joinedAt: -1 })
          .limit(5),
        WorkoutPlan.find({ coachId: coach._id, isActive: true }).select('clientId'),
        SessionLog.countDocuments({
          coachId: coach._id,
          date: { $gte: startOfToday, $lt: endOfToday },
        }),
        SessionLog.countDocuments({
          coachId: coach._id,
          $or: [{ coachComment: '' }, { coachComment: { $exists: false } }],
        }),
        SessionLog.find({ coachId: coach._id })
          .sort({ date: -1, createdAt: -1 })
          .limit(5)
          .populate({
            path: 'clientId',
            populate: {
              path: 'userId',
              select: 'name email',
            },
          }),
      ]);

    const clientsWithActivePlans = new Set(
      activePlanRows.map((plan) => String(plan.clientId))
    ).size;

    return res.status(200).json({
      coach: {
        id: coach._id,
        userId: coach.userId,
        bio: coach.bio,
        speciality: coach.speciality,
        plan: coach.plan,
        isActive: coach.isActive,
        createdAt: coach.createdAt,
      },
      stats: {
        totalClients,
        totalPlans,
        activePlans,
        clientsWithoutActivePlan: Math.max(totalClients - clientsWithActivePlans, 0),
        sessionsToday,
        pendingComments,
      },
      recentClients: recentClients.map((client) => ({
        id: client._id,
        user: client.userId,
        goal: client.goal,
        joinedAt: client.joinedAt,
      })),
      recentSessions: recentSessions.map((session) => ({
        id: session._id,
        clientId: session.clientId?._id,
        clientName: session.clientId?.userId?.name || 'Client',
        dayLabel: session.dayLabel,
        date: session.date,
        coachComment: session.coachComment,
      })),
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to load coach dashboard',
      error: error.message,
    });
  }
};

exports.getClients = async (req, res) => {
  try {
    const coach = await ensureCoachProfile(req.user.id);
    const [clients, activePlans] = await Promise.all([
      Client.find({ coachId: coach._id })
        .populate('userId', 'name email avatar createdAt')
        .sort({ joinedAt: -1 }),
      WorkoutPlan.find({ coachId: coach._id, isActive: true }).select(
        'clientId name splitType weekStartDate createdAt'
      ),
    ]);

    const activePlanMap = new Map(
      activePlans.map((plan) => [String(plan.clientId), plan])
    );

    const clientsWithStatus = await Promise.all(
      clients.map(async (client) => {
        const [latestSession, latestNutrition, latestMetric] = await Promise.all([
          SessionLog.findOne({ clientId: client._id }).sort({ date: -1, createdAt: -1 }).select('date'),
          NutritionLog.findOne({ clientId: client._id }).sort({ date: -1, createdAt: -1 }).select('date'),
          BodyMetric.findOne({ clientId: client._id }).sort({ date: -1, createdAt: -1 }).select('date'),
        ]);

        const activePlan = activePlanMap.get(String(client._id));
        const statusSnapshot = buildClientStatus({
          client,
          activePlan,
          latestSession,
          latestNutrition,
          latestMetric,
        });

        return serializeClient(client, activePlan, statusSnapshot);
      })
    );

    return res.status(200).json({ clients: clientsWithStatus });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to load coach clients',
      error: error.message,
    });
  }
};

exports.getClientDetail = async (req, res) => {
  try {
    const { coach, client } = await getCoachOwnedClient(req.user.id, req.params.clientId);

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    const [activePlan, plans, activeMealPlan, recentMealPlans, latestMetric, recentMetrics, latestNutrition, recentNutritionLogs] = await Promise.all([
      WorkoutPlan.findOne({
        coachId: coach._id,
        clientId: client._id,
        isActive: true,
      }).sort({ createdAt: -1 }),
      WorkoutPlan.find({
        coachId: coach._id,
        clientId: client._id,
      })
        .sort({ createdAt: -1 })
        .limit(5),
      MealPlan.findOne({
        coachId: coach._id,
        clientId: client._id,
        isActive: true,
      }).sort({ createdAt: -1 }),
      MealPlan.find({
        coachId: coach._id,
        clientId: client._id,
      })
        .sort({ createdAt: -1 })
        .limit(5),
      BodyMetric.findOne({ clientId: client._id }).sort({ date: -1, createdAt: -1 }),
      BodyMetric.find({ clientId: client._id }).sort({ date: -1, createdAt: -1 }).limit(4),
      NutritionLog.findOne({ clientId: client._id }).sort({ date: -1, createdAt: -1 }),
      NutritionLog.find({ clientId: client._id }).sort({ date: -1, createdAt: -1 }).limit(7),
    ]);

    return res.status(200).json({
      client: serializeClient(client, activePlan),
      plans,
      activeMealPlan,
      recentMealPlans,
      latestMetric,
      recentMetrics,
      latestNutrition,
      recentNutritionLogs,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to load client detail',
      error: error.message,
    });
  }
};

exports.resetClientPassword = async (req, res) => {
  try {
    const { client } = await getCoachOwnedClient(req.user.id, req.params.clientId);
    const nextPassword = String(req.body.password || '').trim();

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    if (nextPassword.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters long',
      });
    }

    const user = await User.findById(client.userId).select('+password');

    if (!user || user.role !== 'client') {
      return res.status(404).json({ message: 'Client login account not found' });
    }

    user.password = nextPassword;
    await user.save();

    return res.status(200).json({
      message: 'Client password updated successfully',
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to update client password',
      error: error.message,
    });
  }
};

exports.deleteClient = async (req, res) => {
  try {
    const { coach, client } = await getCoachOwnedClient(req.user.id, req.params.clientId);

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    const clientUserId = client.userId?._id || client.userId;

    await Promise.all([
      Coach.findByIdAndUpdate(coach._id, {
        $pull: { clients: client._id },
      }),
      MealPlan.deleteMany({ clientId: client._id }),
      WorkoutPlan.deleteMany({ clientId: client._id }),
      SessionLog.deleteMany({ clientId: client._id }),
      NutritionLog.deleteMany({ clientId: client._id }),
      BodyMetric.deleteMany({ clientId: client._id }),
      AIConversation.deleteOne({ clientId: client._id }),
    ]);

    await Client.deleteOne({ _id: client._id });

    if (clientUserId) {
      await User.deleteOne({ _id: clientUserId, role: 'client' });
    }

    return res.status(200).json({
      message: 'Client deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to delete client',
      error: error.message,
    });
  }
};

exports.inviteClient = async (req, res) => {
  try {
    const coach = await ensureCoachProfile(req.user.id);
    const {
      name,
      email,
      password,
      goal,
      currentWeight,
      targetWeight,
      height,
      maintenanceCalories,
      targetCalories,
      targetProtein,
      injuries,
      experience,
    } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: normalizedEmail });
    let createdNewUser = false;
    let temporaryPassword = null;

    if (!user) {
      if (!name) {
        return res.status(400).json({ message: 'Name is required for a new client invite' });
      }

      temporaryPassword =
        password || `Client${crypto.randomInt(100000, 999999)}!`;

      user = await User.create({
        name,
        email: normalizedEmail,
        password: temporaryPassword,
        role: 'client',
      });
      createdNewUser = true;
    }

    if (user.role !== 'client') {
      return res.status(400).json({
        message: 'That email belongs to a coach account and cannot be invited as a client',
      });
    }

    let client = await ensureClientProfile(user._id, {
      goal,
      currentWeight,
      targetWeight,
      height,
      maintenanceCalories,
      targetCalories,
      targetProtein,
      injuries,
      experience,
    });

    if (client.coachId && String(client.coachId) !== String(coach._id)) {
      return res.status(409).json({
        message: 'This client is already assigned to another coach',
      });
    }

    const incomingProfile = {
      goal,
      currentWeight,
      targetWeight,
      height,
      maintenanceCalories,
      targetCalories,
      targetProtein,
      injuries,
      experience,
    };

    Object.entries(incomingProfile).forEach(([key, value]) => {
      if (value !== undefined) {
        client[key] = value;
      }
    });

    client = await assignClientToCoach(client, coach._id);
    await client.populate('userId', 'name email avatar createdAt');

    return res.status(createdNewUser ? 201 : 200).json({
      message: createdNewUser
        ? 'Client invited and account created'
        : 'Existing client linked to coach successfully',
      client: serializeClient(client, null),
      temporaryPassword,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to invite client',
      error: error.message,
    });
  }
};
