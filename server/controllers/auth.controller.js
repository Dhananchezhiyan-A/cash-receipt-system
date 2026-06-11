const jwt = require('jsonwebtoken');
const User = require('../models/User');

const sign = (id, secret, exp) => jwt.sign({ id }, secret, { expiresIn: exp });
const tokens = (user) => ({
  accessToken: sign(user._id, process.env.JWT_SECRET, process.env.JWT_EXPIRES_IN || '1d'),
  refreshToken: sign(user._id, process.env.JWT_REFRESH_SECRET, process.env.JWT_REFRESH_EXPIRES_IN || '7d'),
});

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: (email||'').toLowerCase(), deleted: { $ne: true } });
  if (!user || !user.active) return res.status(401).json({ message: 'Invalid credentials' });
  const ok = await user.matchPassword(password || '');
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
  const t = tokens(user);
  res.json({ ...t, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
};

exports.refresh = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ message: 'No refresh token' });
  try {
    const d = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findOne({ _id: d.id, active: true, deleted: { $ne: true } });
    if (!user) return res.status(401).json({ message: 'Refresh invalid' });
    const accessToken = sign(user._id, process.env.JWT_SECRET, process.env.JWT_EXPIRES_IN || '1d');
    res.json({ accessToken });
  } catch { res.status(401).json({ message: 'Refresh invalid' }); }
};

exports.profile = (req, res) => res.json(req.user);

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);
  if (!(await user.matchPassword(currentPassword || ''))) return res.status(400).json({ message: 'Current password incorrect' });
  if (!newPassword || newPassword.length < 8) return res.status(400).json({ message: 'New password must be at least 8 characters' });
  user.password = newPassword;
  await user.save();
  res.json({ message: 'Password updated' });
};

exports.logout = (_, res) => res.json({ message: 'Logged out' });
