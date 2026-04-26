const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  campaign:        { type:mongoose.Schema.Types.ObjectId, ref:'Campaign', required:true },
  donor:           { type:mongoose.Schema.Types.ObjectId, ref:'User',     default:null },
  amount:          { type:Number, required:true, min:1 },
  currency:        { type:String, default:'INR' },
  gateway:         { type:String, enum:['razorpay','stripe','manual'], default:'manual' },
  gatewayOrderId:  { type:String, default:null },
  gatewayPaymentId:{ type:String, default:null },
  status:          { type:String, enum:['pending','completed','failed','refunded'], default:'pending' },
  anonymous:       { type:Boolean, default:false },
  message:         { type:String, maxlength:500, default:'' },
  paymentMethod:   { type:String, enum:['card','upi','netbanking','manual'], default:'card' },
  idempotencyKey:  { type:String, unique:true, sparse:true },
}, {
  timestamps:true,
  toJSON:{ virtuals:true, transform(_doc,ret){ ret.id=ret._id; delete ret._id; delete ret.__v; }},
});

donationSchema.index({ campaign:1, createdAt:-1 });
donationSchema.index({ donor:1, createdAt:-1 });
donationSchema.index({ idempotencyKey:1 }, { sparse:true });

module.exports = mongoose.model('Donation', donationSchema);
