const User = require('../models/User');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken,
        hashToken, setRefreshCookie, clearRefreshCookie } = require('../utils/jwt.utils');
const { AppError } = require('../middlewares/error.middleware');

const makeUsername = (name) =>
  `${name.toLowerCase().replace(/[^a-z0-9]/g,'_').replace(/_+/g,'_').slice(0,20)}_${Date.now().toString(36)}`;

const _storeRefresh = (user, token) => {
  user.refreshTokens = user.refreshTokens.filter(t => t.expiresAt > new Date()); // prune expired
  user.refreshTokens.push({ tokenHash: hashToken(token), expiresAt: new Date(Date.now()+7*24*60*60*1000) });
};

exports.signup = async (body, res) => {
  const { name, email, password, role='donor' } = body;
  if (await User.exists({ email: email.toLowerCase() }))
    throw new AppError('Email already registered', 409, { email:['Email already in use'] });

  const user = await User.create({ name:name.trim(), email:email.toLowerCase(), password, username:makeUsername(name), role });
  const accessToken  = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  _storeRefresh(user, refreshToken);
  await user.save({ validateBeforeSave:false });
  setRefreshCookie(res, refreshToken);
  return { user:user.toJSON(), accessToken };
};

exports.login = async ({ email, password }, res) => {
  const user = await User.findOne({ email:email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password)))
    throw new AppError('Invalid email or password', 401);
  if (!user.isActive) throw new AppError('Account deactivated. Contact support.', 403);

  const accessToken  = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  _storeRefresh(user, refreshToken);
  await user.save({ validateBeforeSave:false });
  setRefreshCookie(res, refreshToken);
  return { user:user.toJSON(), accessToken };
};

exports.refresh = async (req, res) => {
  const token = req.cookies?.fb_refresh_token;
  if (!token) throw new AppError('Refresh token missing', 401);

  let decoded;
  try { decoded = verifyRefreshToken(token); }
  catch { throw new AppError('Invalid or expired refresh token', 401); }

  const user = await User.findById(decoded.id);
  if (!user) throw new AppError('User not found', 401);

  const hashed = hashToken(token);
  const stored = user.refreshTokens.find(t => t.tokenHash===hashed && t.expiresAt>new Date());
  if (!stored) throw new AppError('Refresh token revoked', 401);

  // Rotate
  user.refreshTokens = user.refreshTokens.filter(t => t.tokenHash!==hashed);
  const newRefresh = generateRefreshToken(user._id);
  _storeRefresh(user, newRefresh);
  await user.save({ validateBeforeSave:false });
  setRefreshCookie(res, newRefresh);
  return { accessToken: generateAccessToken(user._id) };
};

exports.logout = async (req, res) => {
  const token = req.cookies?.fb_refresh_token;
  if (token && req.user) {
    const hashed = hashToken(token);
    await User.findByIdAndUpdate(req.user._id,
      { $pull: { refreshTokens: { tokenHash: hashed } } });
  }
  clearRefreshCookie(res);
};

exports.getMe = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  return user.toJSON();
};
