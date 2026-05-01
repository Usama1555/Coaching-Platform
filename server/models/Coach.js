const mongoose = require('mongoose');

const coachSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    bio: {
      type: String,
      default: '',
      trim: true,
    },
    speciality: {
      type: String,
      default: '',
      trim: true,
    },
    clients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
      },
    ],
    plan: {
      type: String,
      enum: ['starter', 'pro', 'business', 'elite'],
      default: 'starter',
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    approvedByEmail: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },
    stripeCustomerId: {
      type: String,
      default: '',
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

coachSchema.index({ approvalStatus: 1, createdAt: -1 });

const Coach = mongoose.model('Coach', coachSchema);

module.exports = Coach;
