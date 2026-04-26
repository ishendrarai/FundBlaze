const router = require('express').Router();
const ctrl   = require('../controllers/notification.controller');
const { protect } = require('../middlewares/auth.middleware');

router.get( '/',           protect, ctrl.getAll);
router.put( '/read-all',   protect, ctrl.markAllRead);   // before /:id
router.put( '/:id/read',   protect, ctrl.markRead);

module.exports = router;
