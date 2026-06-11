const User = require('../models/User');

const ROLES = new Set(['admin', 'manager', 'user']);
const SORT_FIELDS = new Set(['name', 'email', 'role', 'active', 'createdAt', 'updatedAt']);
const clean = (value) => typeof value === 'string' ? value.trim() : '';

const publicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  active: user.active,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const validateBase = ({ name, email, role }, { requireRole = true } = {}) => {
  const errors = [];
  if (!clean(name)) errors.push('Name is required');
  if (clean(name).length > 100) errors.push('Name must be 100 characters or fewer');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean(email).toLowerCase())) errors.push('A valid email is required');
  if (requireRole && !ROLES.has(role)) errors.push('A valid role is required');
  return errors;
};

exports.list = async (req, res) => {
  const {
    q = '',
    role,
    status,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = req.query;

  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const filter = { deleted: { $ne: true } };

  if (q) {
    const escaped = clean(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [{ name: new RegExp(escaped, 'i') }, { email: new RegExp(escaped, 'i') }];
  }
  if (ROLES.has(role)) filter.role = role;
  if (status === 'active') filter.active = true;
  if (status === 'inactive') filter.active = false;

  const safeSortBy = SORT_FIELDS.has(sortBy) ? sortBy : 'createdAt';
  const sort = { [safeSortBy]: sortOrder === 'asc' ? 1 : -1 };
  const [items, total] = await Promise.all([
    User.find(filter).select('-password').sort(sort).skip((safePage - 1) * safeLimit).limit(safeLimit),
    User.countDocuments(filter),
  ]);

  res.json({ items, total, page: safePage, pages: Math.max(Math.ceil(total / safeLimit), 1), limit: safeLimit });
};

exports.get = async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, deleted: { $ne: true } }).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
};

exports.create = async (req, res) => {
  const name = clean(req.body.name);
  const email = clean(req.body.email).toLowerCase();
  const password = req.body.password || '';
  const role = req.body.role;
  const errors = validateBase({ name, email, role });
  if (password.length < 8) errors.push('Password must be at least 8 characters');
  if (errors.length) return res.status(400).json({ message: errors[0], errors });

  if (await User.exists({ email })) return res.status(409).json({ message: 'Email already exists' });
  const user = await User.create({ name, email, password, role, active: req.body.active !== false });
  res.status(201).json(publicUser(user));
};

exports.update = async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, deleted: { $ne: true } });
  if (!user) return res.status(404).json({ message: 'User not found' });

  const name = clean(req.body.name);
  const email = clean(req.body.email).toLowerCase();
  const role = req.body.role;
  const errors = validateBase({ name, email, role });
  if (errors.length) return res.status(400).json({ message: errors[0], errors });
  if (String(user._id) === String(req.user._id) && req.body.active === false) {
    return res.status(400).json({ message: 'You cannot deactivate your own account' });
  }
  if (String(user._id) === String(req.user._id) && role !== 'admin') {
    return res.status(400).json({ message: 'You cannot remove your own admin role' });
  }
  if (await User.exists({ email, _id: { $ne: user._id } })) {
    return res.status(409).json({ message: 'Email already exists' });
  }

  user.name = name;
  user.email = email;
  user.role = role;
  user.active = req.body.active !== false;
  await user.save();
  res.json(publicUser(user));
};

exports.setStatus = async (req, res) => {
  if (typeof req.body.active !== 'boolean') return res.status(400).json({ message: 'Active status must be true or false' });
  if (String(req.params.id) === String(req.user._id) && !req.body.active) {
    return res.status(400).json({ message: 'You cannot deactivate your own account' });
  }
  const user = await User.findOneAndUpdate(
    { _id: req.params.id, deleted: { $ne: true } },
    { active: req.body.active },
    { new: true, runValidators: true },
  ).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
};

exports.resetPassword = async (req, res) => {
  const password = req.body.password || '';
  if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters' });
  const user = await User.findOne({ _id: req.params.id, deleted: { $ne: true } });
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.password = password;
  await user.save();
  res.json({ message: 'Password reset successfully' });
};

exports.remove = async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) return res.status(400).json({ message: 'You cannot delete your own account' });
  const user = await User.findOneAndUpdate(
    { _id: req.params.id, deleted: { $ne: true } },
    { deleted: true, deletedAt: new Date(), active: false },
    { new: true },
  );
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ message: 'User deleted successfully' });
};
