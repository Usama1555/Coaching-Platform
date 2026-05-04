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

module.exports = {
  exerciseSchema,
  cardioSchema,
  daySchema,
};
