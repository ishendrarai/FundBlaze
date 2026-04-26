const Campaign = require('../models/Campaign');
const User     = require('../models/User');
const { AppError }          = require('../middlewares/error.middleware');
const { paginatedResponse } = require('../utils/response.utils');

const CREATOR_SELECT = 'name username avatar bio verified stats createdAt contactEmail';

const _norm = (c) => {
  c.id = (c._id||c.id).toString(); delete c._id;
  if (c.creator) {
    c.creator.id       = (c.creator._id||c.creator.id).toString(); delete c.creator._id;
    c.creator.joinedAt      = c.creator.createdAt;
    c.creator.totalCampaigns= c.creator.stats?.activeCampaigns || 0;
    c.creator.totalRaised   = c.creator.stats?.totalRaised     || 0;
  }
  return c;
};

exports.getCampaigns = async (q) => {
  const page  = Math.max(1, parseInt(q.page  ||1));
  const limit = Math.min(50, Math.max(1, parseInt(q.limit||9)));
  const skip  = (page-1)*limit;

  const filter = {};
  if (q.status)                        filter.status   = q.status;
  else                                 filter.status   = { $in:['active','funded'] };
  if (q.category && q.category!=='all') filter.category = q.category;
  if (q.q)                              filter.$text    = { $search: q.q };

  const sort = {
    newest:     { createdAt:-1 },
    most_funded:{ raisedAmount:-1 },
    ending_soon:{ deadline:1 },
    trending:   { trendScore:-1, donorCount:-1 },
  }[q.sort||'trending'] || { trendScore:-1 };

  const [campaigns, total] = await Promise.all([
    Campaign.find(filter).populate('creator', CREATOR_SELECT).sort(sort).skip(skip).limit(limit).lean(),
    Campaign.countDocuments(filter),
  ]);
  return paginatedResponse(campaigns.map(_norm), total, page, limit);
};

exports.getTrending = async () => {
  const list = await Campaign.find({ status:{$in:['active','funded']} })
    .populate('creator', CREATOR_SELECT).sort({ trendScore:-1 }).limit(6).lean();
  return list.map(_norm);
};

exports.getBySlug = async (slug) => {
  const isId = /^[a-f\d]{24}$/i.test(slug);
  const c = await Campaign.findOne(isId ? { _id:slug } : { slug })
    .populate('creator', CREATOR_SELECT).lean();
  if (!c) throw new AppError('Campaign not found', 404);
  return _norm(c);
};

exports.create = async (body, userId) => {
  const c = await Campaign.create({ ...body, creator:userId });
  await c.populate('creator', CREATOR_SELECT);
  await User.findByIdAndUpdate(userId, { $inc:{ 'stats.activeCampaigns':1 } });
  return _norm(c.toObject());
};

exports.update = async (id, body, userId, role) => {
  const c = await Campaign.findById(id);
  if (!c) throw new AppError('Campaign not found', 404);
  if (c.creator.toString()!==userId.toString() && role!=='admin')
    throw new AppError('Not authorised to update this campaign', 403);
  ['raisedAmount','donorCount','creator','slug'].forEach(k => delete body[k]);
  Object.assign(c, body);
  await c.save();
  await c.populate('creator', CREATOR_SELECT);
  return _norm(c.toObject());
};

exports.remove = async (id, userId, role) => {
  const c = await Campaign.findById(id);
  if (!c) throw new AppError('Campaign not found', 404);
  if (c.creator.toString()!==userId.toString() && role!=='admin')
    throw new AppError('Not authorised to delete this campaign', 403);
  await c.deleteOne();
};

exports.getMine = async (userId) => {
  const list = await Campaign.find({ creator:userId })
    .populate('creator', CREATOR_SELECT).sort({ createdAt:-1 }).lean();
  return list.map(_norm);
};

exports.updateTrendScore = async (campaignId) => {
  const c = await Campaign.findById(campaignId);
  if (!c) return;
  const days = Math.max(1,(Date.now()-c.createdAt)/(1000*60*60*24));
  const ratio = c.goalAmount>0 ? c.raisedAmount/c.goalAmount : 0;
  c.trendScore = c.donorCount*0.4 + ratio*100*0.4 + (1/days)*60*0.2;
  await c.save({ validateBeforeSave:false });
};
