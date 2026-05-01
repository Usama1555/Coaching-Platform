const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    muscleGroup: {
      type: String,
      default: '',
      trim: true,
    },
    targetSets: {
      type: Number,
      required: true,
      min: 1,
    },
    targetRepsMin: {
      type: Number,
      required: true,
      min: 1,
    },
    targetRepsMax: {
      type: Number,
      required: true,
      min: 1,
    },
    targetWeight: {
      type: Number,
      default: 0,
      min: 0,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { _id: false }
);

const cardioSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      default: '',
      trim: true,
    },
    durationMins: {
      type: Number,
      default: 0,
      min: 0,
    },
    speed: {
      type: Number,
      default: 0,
      min: 0,
    },
    incline: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const daySchema = new mongoose.Schema(
  {
    dayNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 7,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    isRest: {
      type: Boolean,
      default: false,
    },
    exercises: {
      type: [exerciseSchema],
      default: [],
    },
    cardio: {
      type: cardioSchema,
      default: () => ({}),
    },
  },
  { _id: false }
);

const workoutPlanSchema = new mongoose.Schema(
  {
    coachId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coach',
      required: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    splitType: {
      type: String,
      default: 'custom',
      trim: true,
    },
    weekStartDate: {
      type: Date,
      required: true,
    },
    days: {
      type: [daySchema],
      default: [],
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

const WorkoutPlan = mongoose.model('WorkoutPlan', workoutPlanSchema);

module.exports = WorkoutPlan;

