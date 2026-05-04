const express = require('express');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const {
  createWorkoutTemplate,
  getWorkoutTemplates,
  getWorkoutTemplate,
  updateWorkoutTemplate,
  deleteWorkoutTemplate,
} = require('../controllers/workoutTemplateController');

const router = express.Router();

router.get('/', auth, roleCheck('coach'), getWorkoutTemplates);
router.get('/:templateId', auth, roleCheck('coach'), getWorkoutTemplate);
router.post('/', auth, roleCheck('coach'), createWorkoutTemplate);
router.put('/:templateId', auth, roleCheck('coach'), updateWorkoutTemplate);
router.delete('/:templateId', auth, roleCheck('coach'), deleteWorkoutTemplate);

module.exports = router;
