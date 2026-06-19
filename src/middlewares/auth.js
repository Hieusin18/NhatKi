const jwt      = require('jsonwebtoken');
const { User } = require('../models/index');

/**
 * Express middleware — verify Bearer JWT and attach user to req.user.
 * @param {import('express').Request}  req
 * @param {import('express').Response} res  - 401 if token missing/invalid/expired
 * @param {import('express').NextFunction} next
 */
module.exports = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer '))
    return res.status(401).json({ message: 'Not logged in.' });

  try {
    const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    const user    = await User.findByPk(decoded.id);
    if (!user) return res.status(401).json({ message: 'Invalid token.' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Token expired or invalid.' });
  }
};