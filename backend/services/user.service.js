const mongoose = require('mongoose');
const User     = require('../models/User');
const Campaign = require('../models/Campaign');
const Donation = require('../models/Donation');
const { AppError } = require('../middlewares/error.middleware');

exports.getPublicProfile = async (usernameOrId) => {
  const q = /^[a-f\d]{24}$/i.test(usernameOrId)
    ? { _id: usernameOrId }
    : { username: usernameOrId.toLowerCase() };
  const user = await User.findOne(q);
  if (!user) throw new AppError('User not found', 404);

  const oid = new mongoose.Types.ObjectId(user._id);

  // Run all stat queries in parallel
  const [campaigns, donationAgg, campaignsBacked] = await Promise.all([
    // All campaigns by this creator
    Campaign.find({ creator: user._id })
      .select('title slug coverImage raisedAmount goalAmount donorCount status deadline category createdAt')
      .lean(),

    // Aggregate total raised & total distinct donors across this creator's campaigns
    Donation.aggregate([
      { $lookup: { from: 'campaigns', localField: 'campaign', foreignField: '_id', as: 'c' } },
      { $unwind: '$c' },
      { $match: { 'c.creator': oid, status: 'completed' } },
      { $group: { _id: null, totalRaised: { $sum: '$amount' }, uniqueDonors: { $addToSet: '$donor' } } },
      { $project: { totalRaised: 1, totalDonors: { $size: '$uniqueDonors' } } }
    ]),

    // Number of distinct campaigns this user has donated to
    Donation.distinct('campaign', { donor: oid, status: 'completed' }),
  ]);

  const agg = donationAgg[0] || { totalRaised: 0, totalDonors: 0 };

  const profile = user.toJSON();

  // Overwrite stats with live-computed values
  profile.stats = {
    totalRaised:     Math.round(agg.totalRaised),
    totalDonors:     agg.totalDonors,
    activeCampaigns: campaigns.filter(c => c.status === 'active').length,
    totalCampaigns:  campaigns.length,
    campaignsBacked: campaignsBacked.length,
  };

  // Only expose active/funded campaigns on the public profile card grid
  profile.campaigns = campaigns
    .filter(c => ['active', 'funded'].includes(c.status))
    .map(c => ({ ...c, id: c._id.toString() }));

  return profile;
};

exports.updateMe = async (userId, body) => {
  // Strip fields that must not be changed via this endpoint
  const { password, email, role, isActive, verified, refreshTokens, currentPassword } = body;
  ['password','email','role','isActive','verified','refreshTokens','currentPassword'].forEach(k => delete body[k]);

  const user = await User.findByIdAndUpdate(userId, body, { new:true, runValidators:true });
  if (!user) throw new AppError('User not found', 404);
  return user.toJSON();
};
