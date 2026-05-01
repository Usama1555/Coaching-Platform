const Coach = require('../models/Coach');
const Client = require('../models/Client');

function buildCoachSummary(coach, totalClients) {
  return {
    id: coach._id,
    user: coach.userId,
    bio: coach.bio,
    speciality: coach.speciality,
    plan: coach.plan,
    isActive: coach.isActive,
    approvalStatus: coach.approvalStatus,
    approvedAt: coach.approvedAt,
    approvedByEmail: coach.approvedByEmail,
    totalClients,
    createdAt: coach.createdAt,
  };
}

exports.getCoaches = async (req, res) => {
  try {
    const [coaches, clientCounts] = await Promise.all([
      Coach.find({})
        .populate('userId', 'name email avatar createdAt updatedAt role')
        .sort({ createdAt: -1 }),
      Client.aggregate([
        {
          $match: {
            coachId: { $ne: null },
          },
        },
        {
          $group: {
            _id: '$coachId',
            totalClients: { $sum: 1 },
          },
        },
      ]),
    ]);

    const countMap = new Map(
      clientCounts.map((entry) => [String(entry._id), entry.totalClients])
    );

    const serializedCoaches = coaches.map((coach) =>
      buildCoachSummary(coach, countMap.get(String(coach._id)) || 0)
    );

    const summary = serializedCoaches.reduce(
      (accumulator, coach) => {
        accumulator.totalCoaches += 1;
        accumulator.totalClients += coach.totalClients;

        if (coach.approvalStatus === 'approved') {
          accumulator.approved += 1;
        } else if (coach.approvalStatus === 'rejected') {
          accumulator.rejected += 1;
        } else {
          accumulator.pending += 1;
        }

        return accumulator;
      },
      {
        totalCoaches: 0,
        totalClients: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
      }
    );

    return res.status(200).json({
      summary,
      coaches: serializedCoaches,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to load coaches for the owner dashboard',
      error: error.message,
    });
  }
};

exports.updateCoachApprovalStatus = async (req, res) => {
  try {
    const approvalStatus = String(req.body.approvalStatus || '').trim().toLowerCase();

    if (!['approved', 'rejected', 'pending'].includes(approvalStatus)) {
      return res.status(400).json({
        message: 'approvalStatus must be pending, approved, or rejected',
      });
    }

    const coach = await Coach.findById(req.params.coachId).populate(
      'userId',
      'name email avatar createdAt updatedAt role'
    );

    if (!coach) {
      return res.status(404).json({ message: 'Coach not found' });
    }

    coach.approvalStatus = approvalStatus;
    coach.approvedAt = approvalStatus === 'approved' ? new Date() : null;
    coach.approvedByEmail =
      approvalStatus === 'approved' ? String(req.user.email || '').toLowerCase() : '';

    await coach.save();

    const totalClients = await Client.countDocuments({ coachId: coach._id });

    return res.status(200).json({
      message: `Coach marked as ${approvalStatus}`,
      coach: buildCoachSummary(coach, totalClients),
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to update coach approval status',
      error: error.message,
    });
  }
};
