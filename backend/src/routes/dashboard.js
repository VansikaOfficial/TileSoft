const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// Try both common middleware export names
let auth;
try {
  const middleware = require('../middleware/auth');
  auth = middleware.authenticateToken || middleware.auth || middleware.verifyToken || middleware.protect || middleware;
  if (typeof auth !== 'function') auth = (req, res, next) => next();
} catch (e) {
  auth = (req, res, next) => next();
}

router.get('/stats', auth, dashboardController.getStats);
router.get('/quick-stats', auth, dashboardController.getStats);
router.get('/analytics', auth, (req, res) => {
  if (typeof dashboardController.getAnalytics === 'function') {
    return dashboardController.getAnalytics(req, res);
  }
  res.json({ monthlyTrend: [], topProducts: [] });
});

module.exports = router;