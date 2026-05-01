const express = require('express');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const {
  upsertNutritionLog,
  getClientNutritionHistory,
  getTodayNutrition,
} = require('../controllers/nutritionController');

const router = express.Router();

router.post('/', auth, roleCheck('client'), upsertNutritionLog);
router.get('/client/:clientId', auth, getClientNutritionHistory);
router.get('/today/:clientId', auth, getTodayNutrition);

module.exports = router;

