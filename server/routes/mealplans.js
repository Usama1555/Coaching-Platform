const express = require('express');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const {
  createMealPlan,
  getClientMealPlans,
  getActiveMealPlan,
  updateMealPlan,
  deleteMealPlan,
} = require('../controllers/mealPlanController');

const router = express.Router();

router.post('/', auth, roleCheck('coach'), createMealPlan);
router.get('/client/:clientId', auth, getClientMealPlans);
router.get('/active/:clientId', auth, getActiveMealPlan);
router.put('/:planId', auth, roleCheck('coach'), updateMealPlan);
router.delete('/:planId', auth, roleCheck('coach'), deleteMealPlan);

module.exports = router;
