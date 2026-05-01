const express = require('express');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const {
  getDashboard,
  getClients,
  getClientDetail,
  resetClientPassword,
  deleteClient,
  inviteClient,
} = require('../controllers/coachController');

const router = express.Router();

router.use(auth, roleCheck('coach'));

router.get('/dashboard', getDashboard);
router.get('/clients', getClients);
router.get('/clients/:clientId', getClientDetail);
router.put('/clients/:clientId/password', resetClientPassword);
router.delete('/clients/:clientId', deleteClient);
router.post('/clients/invite', inviteClient);

module.exports = router;
