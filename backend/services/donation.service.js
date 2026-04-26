const Donation  = require('../models/Donation');
const Campaign  = require('../models/Campaign');
const User      = require('../models/User');
const { Notification } = require('../models/Transaction');
const { AppError }          = require('../middlewares/error.middleware');
const { paginatedResponse } = require('../utils/response.utils');
const { updateTrendScore }  = require('./campaign.service');

exports.create = async (body, userId) => {
  const { campaignId, amount, message, anonymous, paymentMethod='card', idempotencyKey } = body;

  // Idempotency guard
  if (idempotencyKey) {
    const existing = await Donation.findOne({ idempotencyKey });
    if (existing) return _fmt(existing);
  }

  const campaign = await Campaign.findById(campaignId);
  if (!campaign) throw new AppError('Campaign not found', 404);
  if (campaign.status !== 'active') throw new AppError('Campaign is not accepting donations', 400);

  const donation = await Donation.create({
    campaign: campaignId,
    donor:    userId || null,
    amount:   Number(amount),
    currency: campaign.currency || 'INR',
    message:  message || '',
    anonymous:!!anonymous,
    paymentMethod,
    gateway: 'manual',
    status:  'completed',
    idempotencyKey: idempotencyKey || undefined,
  });

  // Atomically increment campaign counters
  const updated = await Campaign.findByIdAndUpdate(
    campaignId,
    { $inc:{ raisedAmount: Number(amount), donorCount: 1 } },
    { new:true }
  );
  if (updated.raisedAmount >= updated.goalAmount && updated.status === 'active')
    await Campaign.findByIdAndUpdate(campaignId, { status:'funded' });

  if (userId) await User.findByIdAndUpdate(userId, { $inc:{ 'stats.campaignsBacked':1 } });
  await User.findByIdAndUpdate(updated.creator, {
    $inc:{ 'stats.totalRaised': Number(amount), 'stats.totalDonors': 1 },
  });
  await updateTrendScore(campaignId);

  await Notification.create({
    user:    updated.creator,
    type:    'donation_received',
    title:   'New Donation Received! 🎉',
    message: `${anonymous ? 'An anonymous donor' : 'A donor'} contributed ₹${Number(amount).toLocaleString('en-IN')} to "${updated.title}"`,
    metadata:{ campaignId: campaignId.toString(), donationId: donation._id.toString(), amount },
  });

  return _fmt(donation, updated);
};

exports.getByCampaign = async (campaignId, q) => {
  const page  = Math.max(1, parseInt(q.page  ||1));
  const limit = Math.min(50, parseInt(q.limit ||10));
  const [list, total] = await Promise.all([
    Donation.find({ campaign:campaignId, status:'completed' })
      .populate('donor','name username avatar')
      .sort({ createdAt:-1 }).skip((page-1)*limit).limit(limit).lean(),
    Donation.countDocuments({ campaign:campaignId, status:'completed' }),
  ]);
  const data = list.map(d => ({
    id:          d._id.toString(),
    campaignId:  d.campaign.toString(),
    donorId:     d.anonymous ? null : d.donor?._id?.toString(),
    donorName:   d.anonymous ? 'Anonymous' : d.donor?.name || 'Donor',
    donorAvatar: d.anonymous ? null : d.donor?.avatar || null,
    amount: d.amount, message: d.message || '',
    anonymous: d.anonymous, paymentMethod: d.paymentMethod,
    status: d.status, createdAt: d.createdAt,
  }));
  return paginatedResponse(data, total, page, limit);
};

exports.getMine = async (userId, q) => {
  const page  = Math.max(1, parseInt(q.page  ||1));
  const limit = Math.min(50, parseInt(q.limit ||10));
  const [list, total] = await Promise.all([
    Donation.find({ donor:userId })
      .populate('campaign','title slug coverImage status')
      .sort({ createdAt:-1 }).skip((page-1)*limit).limit(limit).lean(),
    Donation.countDocuments({ donor:userId }),
  ]);
  const data = list.map(d => ({
    id:            d._id.toString(),
    campaignId:    d.campaign?._id?.toString(),
    campaignTitle: d.campaign?.title || '',
    campaignSlug:  d.campaign?.slug  || '',
    campaignImage: d.campaign?.coverImage || '',
    amount: d.amount, message: d.message || '',
    anonymous: d.anonymous, paymentMethod: d.paymentMethod,
    status: d.status, createdAt: d.createdAt,
  }));
  return paginatedResponse(data, total, page, limit);
};

const _fmt = (d, campaign) => ({
  id:            d._id.toString(),
  campaignId:    d.campaign.toString(),
  campaignTitle: campaign?.title || '',
  amount: d.amount, message: d.message || '',
  anonymous: d.anonymous, paymentMethod: d.paymentMethod,
  status: d.status, createdAt: d.createdAt,
});
