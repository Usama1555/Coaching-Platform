const mongoose = require('mongoose');

const bodyMetricSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
    },
    weight: {
      type: Number,
      default: null,
      min: 0,
    },
    bodyFatPercent: {
      type: Number,
      default: null,
      min: 0,
    },
    waistCm: {
      type: Number,
      default: null,
      min: 0,
    },
    chestCm: {
      type: Number,
      default: null,
      min: 0,
    },
    armCm: {
      type: Number,
      default: null,
      min: 0,
    },
    legCm: {
      type: Number,
      default: null,
      min: 0,
    },
    progressPhotoUrl: {
      type: String,
      default: '',
      trim: true,
    },
    energyLevel: {
      type: Number,
      default: null,
      min: 1,
      max: 10,
    },
    sleepHours: {
      type: Number,
      default: null,
      min: 0,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

bodyMetricSchema.index({ clientId: 1, date: 1 }, { unique: true });

const BodyMetric = mongoose.model('BodyMetric', bodyMetricSchema);

module.exports = BodyMetric;

