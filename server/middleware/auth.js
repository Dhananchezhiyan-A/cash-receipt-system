const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ _id: decoded.id, deleted: { $ne: true } }).select('-password');
    if (!user || !user.active) return res.status(401).json({ message: 'Invalid session' });
    req.user = user;
    next();
  } catch (e) {
    res.status(401).json({ message: 'Token invalid or expired' });
  }
};
