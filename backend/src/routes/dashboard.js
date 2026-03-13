const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/auth');

router.get('/stats', authenticateToken, dashboardController.getStats);

// Analytics endpoint — only add if controller exports it
if (typeof dashboardController.getAnalytics === 'function') {
  router.get('/analytics', authenticateToken, dashboardController.getAnalytics);
} else {
  router.get('/analytics', authenticateToken, (req, res) => {
    res.json({ monthlyTrend: [], topProducts: [] });
  });
}

// Quick-stats alias (some pages call this endpoint)
router.get('/quick-stats', authenticateToken, dashboardController.getStats);

module.exports = router;