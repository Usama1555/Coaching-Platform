const { isOwnerEmail } = require('../utils/ownerHelpers');

module.exports = (req, res, next) => {
  if (!isOwnerEmail(req.user?.email)) {
    return res.status(403).json({ message: 'Owner access required' });
  }

  next();
};
