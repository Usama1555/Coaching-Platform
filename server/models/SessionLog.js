const mongoose = require('mongoose');
const setLogSchema = require('./SetLog');

const sessionLogSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
    },
    coachId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coach',
      required: true,
    },
    workoutPlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkoutPlan',
      required: true,
    },
    dayNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 7,
    },
    dayLabel: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    sets: {
      type: [setLogSchema],
      default: [],
    },
    cardioCompleted: {
      type: Boolean,
      default: false,
    },
    cardioDurationMins: {
      type: Number,
      default: 0,
      min: 0,
    },
    sessionNotes: {
      type: String,
      default: '',
      trim: true,
    },
    coachComment: {
      type: String,
      default: '',
      trim: true,
    },
    coachCommentAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

const SessionLog = mongoose.model('SessionLog', sessionLogSchema);

module.exports = SessionLog;

