const fail = (res, errors) =>
  res.status(400).json({ success:false, message:'Validation failed', errors });

const validateSignup = (req, res, next) => {
  const { name, email, password, confirmPassword, role } = req.body;
  const e = {};
  if (!name  || name.trim().length < 2)        e.name            = ['Name must be at least 2 characters'];
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) e.email           = ['Valid email is required'];
  if (!password || password.length < 8)         e.password        = ['Password must be at least 8 characters'];
  if (password !== confirmPassword)             e.confirmPassword = ['Passwords do not match'];
  if (role && !['donor','creator'].includes(role)) e.role         = ['Role must be donor or creator'];
  return Object.keys(e).length ? fail(res, e) : next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const e = {};
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) e.email    = ['Valid email is required'];
  if (!password)                                e.password = ['Password is required'];
  return Object.keys(e).length ? fail(res, e) : next();
};

const validateCampaign = (req, res, next) => {
  const { title, shortDescription, story, category, goalAmount, deadline } = req.body;
  const CATS = ['Technology','Medical','Education','Environment','Arts','Community'];
  const e = {};
  if (!title || title.trim().length < 5)             e.title            = ['Title must be at least 5 characters'];
  if (!shortDescription || shortDescription.trim().length < 20)
                                                     e.shortDescription = ['Short description must be at least 20 characters'];
  if (!story || story.trim().length < 50)            e.story            = ['Story must be at least 50 characters'];
  if (!category || !CATS.includes(category))         e.category         = [`Must be one of: ${CATS.join(', ')}`];
  if (!goalAmount || Number(goalAmount) < 1)         e.goalAmount       = ['Goal amount must be at least 1'];
  if (!deadline || new Date(deadline) <= new Date()) e.deadline         = ['Deadline must be in the future'];
  return Object.keys(e).length ? fail(res, e) : next();
};

const validateDonation = (req, res, next) => {
  const { campaignId, amount } = req.body;
  const e = {};
  if (!campaignId)                    e.campaignId = ['Campaign ID is required'];
  if (!amount || Number(amount) < 1)  e.amount     = ['Donation amount must be at least 1'];
  return Object.keys(e).length ? fail(res, e) : next();
};

module.exports = { validateSignup, validateLogin, validateCampaign, validateDonation };
