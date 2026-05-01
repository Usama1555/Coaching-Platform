const express = require('express');
const auth = require('../middleware/auth');
const {
  register,
  login,
  getCurrentUser,
  updateCurrentUser,
  changePassword,
} = require('../controllers/authController');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, getCurrentUser);
router.put('/me', auth, updateCurrentUser);
router.put('/password', auth, changePassword);

module.exports = router;
