const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'nhatki_secret';

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'Missing Authorization header.' });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (!decoded.userId) {
      return res.status(401).json({ success: false, message: 'Invalid token payload.' });
    }

    req.user = {
      id: decoded.userId,
    };

    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

module.exports = {
  authenticate
};
