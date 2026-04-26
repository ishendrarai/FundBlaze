const router = require('express').Router();
const ctrl   = require('../controllers/auth.controller');
const { protect }                                        = require('../middlewares/auth.middleware');
const { validateSignup, validateLogin }                  = require('../middlewares/validate.middleware');

router.post('/signup',  validateSignup, ctrl.signup);
router.post('/login',   validateLogin,  ctrl.login);
router.post('/refresh',                 ctrl.refresh);
router.post('/logout',  protect,        ctrl.logout);
router.get( '/me',      protect,        ctrl.getMe);

module.exports = router;
