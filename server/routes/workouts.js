const express = require('express');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const {
  createWorkoutPlan,
  getClientPlans,
  getActivePlan,
  updateWorkoutPlan,
  deleteWorkoutPlan,
} = require('../controllers/workoutController');

const router = express.Router();

router.post('/', auth, roleCheck('coach'), createWorkoutPlan);
router.get('/client/:clientId', auth, getClientPlans);
router.get('/active/:clientId', auth, getActivePlan);
router.put('/:planId', auth, roleCheck('coach'), updateWorkoutPlan);
router.delete('/:planId', auth, roleCheck('coach'), deleteWorkoutPlan);

module.exports = router;
