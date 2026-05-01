const express = require('express');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const {
  createSession,
  getClientSessions,
  getSessionDetail,
  addCoachComment,
  getCoachRecentSessions,
} = require('../controllers/sessionController');

const router = express.Router();

router.post('/', auth, roleCheck('client'), createSession);
router.get('/coach/recent', auth, roleCheck('coach'), getCoachRecentSessions);
router.get('/client/:clientId', auth, getClientSessions);
router.get('/:sessionId', auth, getSessionDetail);
router.put('/:sessionId/comment', auth, roleCheck('coach'), addCoachComment);

module.exports = router;
