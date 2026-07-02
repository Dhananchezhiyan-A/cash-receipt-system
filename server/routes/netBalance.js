const express = require('express');
const { addBalance, getTotalBalance, getLogs, getCount, recalculate } = require('../controllers/netBalance.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/add', protect, addBalance);
router.get('/total', protect, getTotalBalance);
router.get('/logs', protect, getLogs);
router.get('/count', protect, getCount);
router.post('/recalculate', protect, recalculate);

module.exports = router;