const express = require('express');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const {
  upsertBodyMetric,
  getClientMetrics,
} = require('../controllers/metricController');

const router = express.Router();

router.post('/', auth, roleCheck('client'), upsertBodyMetric);
router.get('/client/:clientId', auth, getClientMetrics);

module.exports = router;

