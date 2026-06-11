const jwt      = require('jsonwebtoken');
const { User } = require('../models/index');

const makeToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, {
  expiresIn: process.env.JWT_EXPIRES_IN || '7d'
});

// POST /auth/register
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

// POST /auth/login
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