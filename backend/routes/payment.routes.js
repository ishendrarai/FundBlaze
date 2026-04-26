const router = require('express').Router();
const ctrl   = require('../controllers/payment.controller');
const { optionalAuth } = require('../middlewares/auth.middleware');

// Stripe webhook uses raw body (configured in app.js)
router.post('/razorpay/order',   optionalAuth, ctrl.createOrder);
router.post('/razorpay/verify',  optionalAuth, ctrl.verifyRazorpay);
router.post('/razorpay/webhook',               ctrl.razorpayWebhook);
router.post('/stripe/webhook',                 ctrl.stripeWebhook);

module.exports = router;
