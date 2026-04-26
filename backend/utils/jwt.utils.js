const jwt    = require('jsonwebtoken');
const crypto = require('crypto');

const ACCESS_SECRET  = () => process.env.JWT_ACCESS_SECRET  || 'access_secret_change_me';
const REFRESH_SECRET = () => process.env.JWT_REFRESH_SECRET || 'refresh_secret_change_me';

const generateAccessToken  = (id) => jwt.sign({ id }, ACCESS_SECRET(),  { expiresIn: process.env.JWT_ACCESS_EXPIRES  || '15m' });
const generateRefreshToken = (id) => jwt.sign({ id }, REFRESH_SECRET(), { expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d'  });
const verifyRefreshToken   = (t)  => jwt.verify(t, REFRESH_SECRET());
const hashToken            = (t)  => crypto.createHash('sha256').update(t).digest('hex');

const setRefreshCookie = (res, token) => {
  const prod = process.env.NODE_ENV === 'production';
  res.cookie('fb_refresh_token', token, {
    httpOnly: true, secure: prod, sameSite: prod ? 'strict' : 'lax',
    maxAge: 7*24*60*60*1000, path: '/api/v1/auth',
  });
};
const clearRefreshCookie = (res) => res.clearCookie('fb_refresh_token', { path:'/api/v1/auth' });

module.exports = { generateAccessToken, generateRefreshToken, verifyRefreshToken, hashToken, setRefreshCookie, clearRefreshCookie };
