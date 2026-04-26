const crypto   = require('crypto');
const Donation = require('../models/Donation');
const Campaign = require('../models/Campaign');
const User     = require('../models/User');
const { Transaction, Notification } = require('../models/Transaction');
const { AppError }         = require('../middlewares/error.middleware');
const { updateTrendScore } = require('./campaign.service');

// ── Razorpay: create order ─────────────────────────────────────────────────
exports.createRazorpayOrder = async ({ amount, currency='INR', campaignId, donorId }) => {
  if (!process.env.RAZORPAY_KEY_ID) throw new AppError('Razorpay not configured', 503);
  const Razorpay = require('razorpay');
  const rz = new Razorpay({ key_id:process.env.RAZORPAY_KEY_ID, key_secret:process.env.RAZORPAY_KEY_SECRET });

  const order = await rz.orders.create({
    amount: Math.round(Number(amount)*100), currency,
    notes:  { campaignId, donorId: donorId||'guest' },
  });
  const donation = await Donation.create({
    campaign:campaignId, donor:donorId||null,
    amount:Number(amount), currency, gateway:'razorpay',
    gatewayOrderId:order.id, status:'pending',
  });
  return { orderId:order.id, donationId:donation._id.toString(), amount, currency };
};

// ── Razorpay: verify signature ─────────────────────────────────────────────
exports.verifyRazorpay = async ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) throw new AppError('Razorpay not configured', 503);
  const expected = crypto.createHmac('sha256', secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
  if (expected !== razorpay_signature) throw new AppError('Payment signature verification failed', 400);

  const donation = await Donation.findOneAndUpdate(
    { gatewayOrderId:razorpay_order_id },
    { status:'completed', gatewayPaymentId:razorpay_payment_id },
    { new:true }
  );
  if (!donation) throw new AppError('Donation record not found', 404);
  await _postSuccess(donation);
  return donation;
};

// ── Razorpay: webhook ──────────────────────────────────────────────────────
exports.handleRazorpayWebhook = async (req) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (secret) {
    const sig    = req.headers['x-razorpay-signature'];
    const digest = crypto.createHmac('sha256', secret).update(JSON.stringify(req.body)).digest('hex');
    if (digest !== sig) throw new AppError('Invalid webhook signature', 400);
  }
  const { event, payload } = req.body;
  const evtId = payload?.payment?.entity?.id;
  if (await Transaction.exists({ gatewayEventId:evtId })) return { alreadyProcessed:true };

  if (event === 'payment.captured') {
    const orderId  = payload?.payment?.entity?.order_id;
    const donation = await Donation.findOneAndUpdate(
      { gatewayOrderId:orderId, status:'pending' },
      { status:'completed', gatewayPaymentId:evtId }, { new:true }
    );
    if (donation) await _postSuccess(donation);
  }
  if (event === 'payment.failed') {
    const orderId = payload?.payment?.entity?.order_id;
    await Donation.findOneAndUpdate({ gatewayOrderId:orderId }, { status:'failed' });
  }
  await Transaction.create({ event, gateway:'razorpay', gatewayEventId:evtId, payload:req.body });
  return { received:true };
};

// ── Stripe: webhook ────────────────────────────────────────────────────────
exports.handleStripeWebhook = async (req) => {
  if (!process.env.STRIPE_WEBHOOK_SECRET) throw new AppError('Stripe webhook secret not configured', 503);
  let event;
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) { throw new AppError(`Stripe webhook error: ${err.message}`, 400); }

  if (await Transaction.exists({ gatewayEventId:event.id })) return { alreadyProcessed:true };

  if (event.type === 'payment_intent.succeeded') {
    const intent   = event.data.object;
    const donation = await Donation.findOneAndUpdate(
      { gatewayOrderId:intent.id, status:'pending' },
      { status:'completed', gatewayPaymentId:intent.id }, { new:true }
    );
    if (donation) await _postSuccess(donation);
  }
  await Transaction.create({ event:event.type, gateway:'stripe', gatewayEventId:event.id, payload:event.data.object });
  return { received:true };
};

// ── Shared post-payment hook ───────────────────────────────────────────────
async function _postSuccess(donation) {
  const updated = await Campaign.findByIdAndUpdate(
    donation.campaign,
    { $inc:{ raisedAmount:donation.amount, donorCount:1 } },
    { new:true }
  );
  if (!updated) return;
  if (updated.raisedAmount >= updated.goalAmount && updated.status==='active') {
    await Campaign.findByIdAndUpdate(donation.campaign, { status:'funded' });
    await Notification.create({
      user:updated.creator, type:'campaign_funded',
      title:'🏆 Campaign Fully Funded!',
      message:`Your campaign "${updated.title}" has reached its goal!`,
      metadata:{ campaignId:updated._id.toString() },
    });
  }
  if (donation.donor) await User.findByIdAndUpdate(donation.donor, { $inc:{ 'stats.campaignsBacked':1 } });
  await User.findByIdAndUpdate(updated.creator, { $inc:{ 'stats.totalRaised':donation.amount, 'stats.totalDonors':1 } });
  await updateTrendScore(donation.campaign);
  await Notification.create({
    user:updated.creator, type:'donation_received',
    title:'New Donation Received! 🎉',
    message:`₹${donation.amount.toLocaleString('en-IN')} donated to "${updated.title}"`,
    metadata:{ campaignId:updated._id.toString(), donationId:donation._id.toString(), amount:donation.amount },
  });
}
