const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:     { type:String, required:true, trim:true, maxlength:100 },
  username: { type:String, required:true, unique:true, lowercase:true, trim:true,
              match:[/^[a-z0-9_]{3,30}$/,'Username: 3-30 chars, a-z 0-9 _'] },
  email:    { type:String, required:true, unique:true, lowercase:true, trim:true,
              match:[/^\S+@\S+\.\S+$/,'Invalid email'] },
  contactEmail: { type:String, lowercase:true, trim:true, default:'' },
  password: { type:String, required:true, minlength:8, select:false },
  role:     { type:String, enum:['guest','donor','creator','admin'], default:'donor' },
  avatar:   { type:String, default:null },
  bio:      { type:String, maxlength:500, default:'' },
  socialLinks: {
    twitter:  { type:String, default:'' },
    instagram:{ type:String, default:'' },
    linkedin: { type:String, default:'' },
    website:  { type:String, default:'' },
  },
  verified:        { type:Boolean, default:false },
  isActive:        { type:Boolean, default:true  },
  isEmailVerified: { type:Boolean, default:false },
  stats: {
    totalRaised:     { type:Number, default:0 },
    activeCampaigns: { type:Number, default:0 },
    totalDonors:     { type:Number, default:0 },
    campaignsBacked: { type:Number, default:0 },
  },
  refreshTokens: [{ tokenHash:String, expiresAt:Date, createdAt:{ type:Date, default:Date.now } }],
}, {
  timestamps:true,
  toJSON:{ transform(_doc, ret){
    ret.id = ret._id; delete ret._id; delete ret.__v;
    delete ret.password; delete ret.refreshTokens;
  }},
});

userSchema.index({ email:1 });
userSchema.index({ username:1 });

userSchema.pre('save', async function(next){
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function(candidate){
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
