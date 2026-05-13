const router = require('express').Router();
const { dashboard, readingStats } = require('../controllers/analyticsController');
const { authenticate, authorize } = require('../middleware/auth');
router.get('/dashboard', authenticate, authorize('admin','librarian'), dashboard);
router.get('/reading-stats', authenticate, readingStats);
module.exports = router;