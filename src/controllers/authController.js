const jwt      = require('jsonwebtoken');
const { User } = require('../models/index');

/**
 * Sign a JWT for the given user id.
 * @param {number} id - User primary key
 * @returns {string} Signed JWT
 */
const makeToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, {
  expiresIn: process.env.JWT_EXPIRES_IN || '7d'
});

/**
 * POST /auth/register
 * Create a new user account and return a JWT.
 * @param {import('express').Request}  req - body: { username, email, password }
 * @param {import('express').Response} res - 201 { token, user } | 400 | 409 | 500
 */
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ message: 'Missing username, email or password.' });

    const user  = await User.create({ username, email, password });
    const token = makeToken(user.id);
    res.status(201).json({ message: 'Register successful!', token, user });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError')
      return res.status(409).json({ message: 'Email or username already exists.' });
    res.status(500).json({ message: err.message });
  }
};

/**
 * POST /auth/login
 * Authenticate user credentials and return a JWT.
 * @param {import('express').Request}  req - body: { email, password }
 * @param {import('express').Response} res - 200 { token, user } | 400 | 401 | 500
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Missing email or password.' });

    const user = await User.findOne({ where: { email } });
    if (!user || !(await user.checkPassword(password)))
      return res.status(401).json({ message: 'Invalid email or password.' });

    res.json({ message: 'Login successful!', token: makeToken(user.id), user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /auth/me
exports.getMe = (req, res) => res.json({ user: req.user });