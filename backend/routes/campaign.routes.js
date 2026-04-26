const router = require('express').Router();
const ctrl   = require('../controllers/campaign.controller');
const { protect, authorize }   = require('../middlewares/auth.middleware');
const { validateCampaign }     = require('../middlewares/validate.middleware');

// NOTE: /trending and /my MUST be declared before /:slug
router.get( '/trending',                                          ctrl.getTrending);
router.get( '/my',        protect,                               ctrl.getMine);
router.get( '/',                                                  ctrl.getAll);
router.get( '/:slug',                                             ctrl.getBySlug);
router.post('/',          protect, authorize('creator','admin'), validateCampaign, ctrl.create);
router.put( '/:id',       protect, authorize('creator','admin'), ctrl.update);
router.delete('/:id',     protect, authorize('creator','admin'), ctrl.remove);

module.exports = router;
