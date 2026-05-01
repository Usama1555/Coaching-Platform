const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  coachId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coach',
    default: null,
  },
  goal: {
    type: String,
    enum: ['fat_loss', 'muscle_gain', 'recomp', ''],
    default: '',
  },
  currentWeight: {
    type: Number,
    default: null,
  },
  targetWeight: {
    type: Number,
    default: null,
  },
  height: {
    type: Number,
    default: null,
  },
  maintenanceCalories: {
    type: Number,
    default: null,
  },
  targetCalories: {
    type: Number,
    default: null,
  },
  targetProtein: {
    type: Number,
    default: null,
  },
  injuries: {
    type: String,
    default: '',
    trim: true,
  },
  experience: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', ''],
    default: '',
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
});

clientSchema.index({ coachId: 1, joinedAt: -1 });

const Client = mongoose.model('Client', clientSchema);

module.exports = Client;
