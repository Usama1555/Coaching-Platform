const express = require('express');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { chat, getHistory } = require('../controllers/aiController');

const router = express.Router();

router.post('/chat', auth, roleCheck('client'), chat);
router.get('/history/:clientId', auth, roleCheck('client'), getHistory);

module.exports = router;
