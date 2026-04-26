const router = require('express').Router();
const ctrl   = require('../controllers/donation.controller');
const { protect, optionalAuth } = require('../middlewares/auth.middleware');
const { validateDonation }      = require('../middlewares/validate.middleware');

// NOTE: /my must be before /:campaignId
router.post('/',              optionalAuth, validateDonation, ctrl.create);
router.get( '/my',            protect,                        ctrl.getMine);
router.get( '/:campaignId',                                   ctrl.getByCampaign);

module.exports = router;
