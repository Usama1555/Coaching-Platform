const express = require('express');
const auth = require('../middleware/auth');
const ownerCheck = require('../middleware/ownerCheck');
const {
  getCoaches,
  updateCoachApprovalStatus,
} = require('../controllers/ownerController');

const router = express.Router();

router.use(auth, ownerCheck);

router.get('/coaches', getCoaches);
router.put('/coaches/:coachId/approval', updateCoachApprovalStatus);

module.exports = router;
