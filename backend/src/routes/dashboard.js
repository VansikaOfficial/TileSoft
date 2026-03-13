const express = require('express');
const router = express.Router();
const { getStats, getAnalytics } = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/auth');

router.get('/stats', authenticateToken, getStats);
router.get('/analytics', authenticateToken, getAnalytics);

module.exports = router;