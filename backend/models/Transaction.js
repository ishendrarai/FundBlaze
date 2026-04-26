const mongoose = require('mongoose');

// ── Transaction ──────────────────────────────────────────────────────────────
const transactionSchema = new mongoose.Schema({
  donation:      { type:mongoose.Schema.Types.ObjectId, ref:'Donation', default:null },
  event:         { type:String, required:true },
  gateway:       { type:String, enum:['razorpay','stripe','manual'] },
  gatewayEventId:{ type:String, unique:true, sparse:true },
  payload:       { type:mongoose.Schema.Types.Mixed, default:{} },
}, {
  timestamps:true,
  toJSON:{ transform(_doc,ret){ ret.id=ret._id; delete ret._id; delete ret.__v; }},
});
transactionSchema.index({ gatewayEventId:1 }, { sparse:true });

// ── Notification ─────────────────────────────────────────────────────────────
const notificationSchema = new mongoose.Schema({
  user:     { type:mongoose.Schema.Types.ObjectId, ref:'User', required:true },
  type:     { type:String, enum:['donation_received','campaign_funded','campaign_update','general'], required:true },
  title:    { type:String, required:true },
  message:  { type:String, required:true },
  isRead:   { type:Boolean, default:false },
  metadata: { type:mongoose.Schema.Types.Mixed, default:{} },
}, {
  timestamps:true,
  toJSON:{ transform(_doc,ret){ ret.id=ret._id; delete ret._id; delete ret.__v; }},
});
notificationSchema.index({ user:1, isRead:1, createdAt:-1 });

const Transaction  = mongoose.model('Transaction',  transactionSchema);
const Notification = mongoose.model('Notification', notificationSchema);
module.exports = { Transaction, Notification };
