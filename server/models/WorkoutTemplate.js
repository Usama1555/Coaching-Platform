const mongoose = require('mongoose');
const { daySchema } = require('./workoutStructureSchemas');

const workoutTemplateSchema = new mongoose.Schema(
  {
    coachId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coach',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    days: {
      type: [daySchema],
      default: [],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  }
);

workoutTemplateSchema.index({ coachId: 1, createdAt: -1 });

const WorkoutTemplate = mongoose.model('WorkoutTemplate', workoutTemplateSchema);

module.exports = WorkoutTemplate;
