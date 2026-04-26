const mongoose = require('mongoose');
const slugify  = require('slugify');

const rewardTierSchema = new mongoose.Schema({
  title:        { type:String, required:true },
  amount:       { type:Number, required:true, min:1 },
  description:  { type:String, default:'' },
  maxClaims:    { type:Number, default:null },
  claimedCount: { type:Number, default:0 },
});

const updateSchema = new mongoose.Schema(
  { title:{ type:String, required:true }, content:{ type:String, required:true } },
  { timestamps:true }
);

const campaignSchema = new mongoose.Schema({
  title:            { type:String, required:true, trim:true, maxlength:200 },

  // ✅ FIXED SLUG FIELD (no unique here)
  slug:             { type:String, lowercase:true },

  shortDescription: { type:String, required:true, maxlength:300 },
  story:            { type:String, required:true },
  creator:          { type:mongoose.Schema.Types.ObjectId, ref:'User', required:true },
  category:         { type:String, required:true,
                      enum:['Technology','Medical','Education','Environment','Arts','Community'] },
  tags:             [{ type:String, lowercase:true, trim:true }],
  goalAmount:       { type:Number, required:true, min:1 },
  currency:         { type:String, default:'INR', enum:['INR','USD','EUR','GBP'] },
  raisedAmount:     { type:Number, default:0 },
  donorCount:       { type:Number, default:0 },
  deadline:         { type:Date,   required:true },
  status:           { type:String, enum:['draft','active','ended','funded'], default:'active' },
  coverImage:       { type:String, default:'' },
  videoUrl:         { type:String, default:'' },
  rewardTiers:      [rewardTierSchema],
  updates:          [updateSchema],
  isFeatured:       { type:Boolean, default:false },
  trendScore:       { type:Number,  default:0 },
  location:         { type:String,  default:'' },
  minDonation:      { type:Number,  default:100, min:1 },
}, {
  timestamps:true,
  toJSON:{
    virtuals:true,
    transform(_doc,ret){
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
    }
  },
});


// ✅ FIXED INDEXES (only here, not in field)
campaignSchema.index({ slug:1 }, { unique:true, sparse:true });
campaignSchema.index({ creator:1 });
campaignSchema.index({ status:1, trendScore:-1 });
campaignSchema.index({ title:'text', shortDescription:'text', tags:'text' });


// ✅ AUTO-GENERATE UNIQUE SLUG
campaignSchema.pre('save', async function(next){
  if (!this.isModified('title') && this.slug) return next();

  let base = slugify(this.title, { lower:true, strict:true });
  let slug = base;
  let n = 0;

  while (await mongoose.model('Campaign').exists({ slug, _id:{ $ne:this._id } })) {
    slug = `${base}-${++n}`;
  }

  this.slug = slug;
  next();
});


// ✅ AUTO STATUS UPDATE
campaignSchema.pre('save', function(next){
  if (this.raisedAmount >= this.goalAmount && this.status === 'active') {
    this.status = 'funded';
  }

  if (new Date(this.deadline) < new Date() && this.status === 'active') {
    this.status = 'ended';
  }

  next();
});

module.exports = mongoose.model('Campaign', campaignSchema);