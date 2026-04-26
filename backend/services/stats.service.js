const mongoose = require('mongoose');
const Campaign = require('../models/Campaign');
const Donation = require('../models/Donation');

exports.getDashboardStats = async (userId) => {
  const oid = new mongoose.Types.ObjectId(userId);

  const [campaigns, aggResult, weeklyRaw] = await Promise.all([
    Campaign.find({ creator:userId }).lean(),

    Donation.aggregate([
      { $lookup:{ from:'campaigns', localField:'campaign', foreignField:'_id', as:'c' } },
      { $unwind:'$c' },
      { $match:{ 'c.creator':oid, status:'completed' } },
      { $group:{ _id:null, totalRaised:{ $sum:'$amount' }, totalDonors:{ $sum:1 }, avgDonation:{ $avg:'$amount' } } },
    ]),

    Donation.aggregate([
      { $lookup:{ from:'campaigns', localField:'campaign', foreignField:'_id', as:'c' } },
      { $unwind:'$c' },
      { $match:{ 'c.creator':oid, status:'completed', createdAt:{ $gte:new Date(Date.now()-7*86400000) } } },
      { $group:{ _id:{ $dayOfWeek:'$createdAt' }, amount:{ $sum:'$amount' }, count:{ $sum:1 } } },
      { $sort:{ _id:1 } },
    ]),
  ]);

  const agg = aggResult[0] || { totalRaised:0, totalDonors:0, avgDonation:0 };

  // Recent donations for the creator's campaigns
  const recentDocs = await Donation.find()
    .populate({ path:'campaign', match:{ creator:userId }, select:'title slug' })
    .populate('donor','name avatar')
    .sort({ createdAt:-1 }).limit(20).lean();

  const recentDonations = recentDocs
    .filter(d => d.campaign)
    .slice(0, 5)
    .map(d => ({
      id:           d._id.toString(),
      campaignTitle:d.campaign?.title || '',
      donorName:    d.anonymous ? 'Anonymous' : d.donor?.name || 'Donor',
      donorAvatar:  d.anonymous ? null : d.donor?.avatar || null,
      amount:       d.amount,
      message:      d.message || '',
      createdAt:    d.createdAt,
    }));

  const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const weeklyChart = DAYS.map((day, i) => {
    const found = weeklyRaw.find(r => r._id === i+1);
    return { day, amount: found?.amount||0, donations: found?.count||0 };
  });

  return {
    totalRaised:     Math.round(agg.totalRaised),
    totalDonors:     agg.totalDonors,
    avgDonation:     Math.round(agg.avgDonation),
    activeCampaigns: campaigns.filter(c => c.status==='active').length,
    fundedCampaigns: campaigns.filter(c => c.status==='funded').length,
    totalCampaigns:  campaigns.length,
    weeklyChart,
    recentDonations,
  };
};
