const router = require('express').Router();
const ctrl   = require('../controllers/user.controller');
const { protect } = require('../middlewares/auth.middleware');

// NOTE: /me and /me/stats before /:id
router.put( '/me',       protect, ctrl.updateMe);
router.get( '/me/stats', protect, ctrl.getMyStats);
router.get( '/:id',               ctrl.getProfile);

module.exports = router;
