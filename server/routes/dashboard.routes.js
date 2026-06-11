const r = require('express').Router();
const c = require('../controllers/dashboard.controller');
const { protect } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
r.get('/stats', protect, asyncHandler(c.stats));
r.get('/transactions', protect, asyncHandler(c.transactions));
module.exports = r;
