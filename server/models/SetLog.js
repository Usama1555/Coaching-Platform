const mongoose = require('mongoose');

const setLogSchema = new mongoose.Schema(
  {
    exerciseName: {
      type: String,
      required: true,
      trim: true,
    },
    muscleGroup: {
      type: String,
      default: '',
      trim: true,
    },
    setNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    repsCompleted: {
      type: Number,
      required: true,
      min: 0,
    },
    weightUsed: {
      type: Number,
      required: true,
      min: 0,
    },
    hitFailure: {
      type: Boolean,
      default: false,
    },
    overloadAlert: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

module.exports = setLogSchema;

