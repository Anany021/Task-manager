const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const { cookieOptions } = require('../utils/cookie');

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// POST /api/auth/signup
async function signup(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Allow caller to pick role on signup. In real production you'd lock this down.
    const safeRole = role === 'admin' ? 'admin' : 'member';

    const user = await User.create({ name, email, password, role: safeRole });
    const token = signToken(user._id);

    res
      .cookie('token', token, cookieOptions())
      .status(201)
      .json({ user, token });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const ok = await user.comparePassword(password);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken(user._id);
    res
      .cookie('token', token, cookieOptions())
      .json({ user, token });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/logout
function logout(req, res) {
  res
    .clearCookie('token', { ...cookieOptions(), maxAge: 0 })
    .json({ message: 'Logged out' });
}

// GET /api/auth/me
function me(req, res) {
  res.json({ user: req.user });
}

module.exports = { signup, login, logout, me };
