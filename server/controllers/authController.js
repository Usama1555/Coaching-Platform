const jwt = require('jsonwebtoken');
const Coach = require('../models/Coach');
const Client = require('../models/Client');
const User = require('../models/User');
const { notifyOwnersOfPendingCoachSignup } = require('../utils/ownerNotifications');
const { isOwnerEmail } = require('../utils/ownerHelpers');

function generateToken(user) {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function sanitizeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    isOwner: isOwnerEmail(user.email),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function syncOwnerCoachAccess(user) {
  if (user.role !== 'coach' || !isOwnerEmail(user.email)) {
    return null;
  }

  let coachProfile = await Coach.findOne({ userId: user._id });

  if (!coachProfile) {
    coachProfile = await Coach.create({
      userId: user._id,
      approvalStatus: 'approved',
      approvedAt: new Date(),
      approvedByEmail: String(user.email || '').toLowerCase(),
    });

    return coachProfile;
  }

  if (
    coachProfile.approvalStatus !== 'approved' ||
    !coachProfile.approvedAt ||
    !coachProfile.approvedByEmail
  ) {
    coachProfile.approvalStatus = 'approved';
    coachProfile.approvedAt = coachProfile.approvedAt || new Date();
    coachProfile.approvedByEmail = String(user.email || '').toLowerCase();
    await coachProfile.save();
  }

  return coachProfile;
}

async function enrichUserWithProfile(user) {
  await syncOwnerCoachAccess(user);
  const payload = sanitizeUser(user);

  if (user.role === 'coach') {
    const coachProfile = await Coach.findOne({ userId: user._id }).select(
      '_id approvalStatus approvedAt approvedByEmail'
    );
    payload.coachProfileId = coachProfile?._id || null;
    payload.coachApprovalStatus = coachProfile?.approvalStatus || 'pending';
    payload.coachApprovedAt = coachProfile?.approvedAt || null;
    payload.coachApprovedByEmail = coachProfile?.approvedByEmail || '';
  }

  if (user.role === 'client') {
    const clientProfile = await Client.findOne({ userId: user._id }).select('_id coachId');
    payload.clientProfileId = clientProfile?._id || null;
    payload.coachProfileId = clientProfile?.coachId || null;
  }

  return payload;
}

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, avatar } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: 'Name, email, password, and role are required',
      });
    }

    if (role !== 'coach') {
      return res.status(403).json({
        message: 'Public signup is available for coaches only',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      role,
      avatar,
    });

    const ownerSignup = isOwnerEmail(normalizedEmail);
    const coachProfile = await Coach.create({
      userId: user._id,
      approvalStatus: ownerSignup ? 'approved' : 'pending',
      approvedAt: ownerSignup ? new Date() : null,
      approvedByEmail: ownerSignup ? normalizedEmail : '',
    });

    const token = generateToken(user);

    if (!ownerSignup) {
      try {
        await notifyOwnersOfPendingCoachSignup({
          coachName: user.name,
          coachEmail: user.email,
          coachId: coachProfile._id,
          createdAt: coachProfile.createdAt,
        });
      } catch (notificationError) {
        console.error('Failed to send owner signup notification:', notificationError.message);
      }
    }

    return res.status(201).json({
      message: ownerSignup
        ? 'Owner coach account created successfully'
        : 'Coach signup received and is pending approval',
      token,
      user: await enrichUserWithProfile(user),
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to register user',
      error: error.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const passwordMatches = await user.comparePassword(password);

    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user);

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: await enrichUserWithProfile(user),
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to log in',
      error: error.message,
    });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ user: await enrichUserWithProfile(user) });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to fetch current user',
      error: error.message,
    });
  }
};

exports.updateCurrentUser = async (req, res) => {
  try {
    const nextName = String(req.body.name || '').trim();

    if (!nextName) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = nextName;
    await user.save();

    return res.status(200).json({
      message: 'Profile updated successfully',
      user: await enrichUserWithProfile(user),
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to update profile',
      error: error.message,
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const currentPassword = String(req.body.currentPassword || '');
    const newPassword = String(req.body.newPassword || '').trim();

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: 'Current password and new password are required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: 'New password must be at least 6 characters long',
      });
    }

    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const passwordMatches = await user.comparePassword(currentPassword);

    if (!passwordMatches) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    const isSamePassword = await user.comparePassword(newPassword);

    if (isSamePassword) {
      return res.status(400).json({
        message: 'New password must be different from the current password',
      });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      message: 'Password updated successfully',
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to update password',
      error: error.message,
    });
  }
};
