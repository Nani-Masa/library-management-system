const router = require('express').Router();
const {
  getAllFines, getOverdue, getMyFines,
  imposeFine, markFinePaid, waiveFine,
} = require('../controllers/finesController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/',                    authenticate, authorize('admin'), getAllFines);
router.get('/overdue',             authenticate, authorize('admin'), getOverdue);
router.get('/my',                  authenticate, getMyFines);
router.post('/impose/:transaction_id', authenticate, authorize('admin'), imposeFine);
router.put('/pay/:transaction_id',     authenticate, authorize('admin'), markFinePaid);
router.put('/waive/:transaction_id',   authenticate, authorize('admin'), waiveFine);

module.exports = router;
