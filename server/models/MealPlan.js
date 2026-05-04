const mongoose = require('mongoose');

const mealPlanFoodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    weightGrams: {
      type: Number,
      default: 0,
      min: 0,
    },
    calories: {
      type: Number,
      default: 0,
      min: 0,
    },
    protein: {
      type: Number,
      default: 0,
      min: 0,
    },
    carbs: {
      type: Number,
      default: 0,
      min: 0,
    },
    fat: {
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

const mealPlanMealSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    targetTime: {
      type: String,
      default: '',
      trim: true,
    },
    foods: {
      type: [mealPlanFoodSchema],
      default: [],
    },
    mealCalories: {
      type: Number,
      default: 0,
      min: 0,
    },
    mealProtein: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const mealPlanSchema = new mongoose.Schema(
  {
    coachId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coach',
      required: true,
      index: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    weekStartDate: {
      type: Date,
      required: true,
    },
    dailyCalorieTarget: {
      type: Number,
      default: 0,
      min: 0,
    },
    dailyProteinTarget: {
      type: Number,
      default: 0,
      min: 0,
    },
    dailyCarbTarget: {
      type: Number,
      default: 0,
      min: 0,
    },
    dailyFatTarget: {
      type: Number,
      default: 0,
      min: 0,
    },
    meals: {
      type: [mealPlanMealSchema],
      default: [],
    },
    cheatMealDay: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },
    cheatMealRules: {
      type: String,
      default: '',
      trim: true,
    },
    resetDayRules: {
      type: String,
      default: '',
      trim: true,
    },
    notes: {
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
    timestamps: true,
  }
);

mealPlanSchema.index({ clientId: 1, createdAt: -1 });

const MealPlan = mongoose.model('MealPlan', mealPlanSchema);

module.exports = MealPlan;
