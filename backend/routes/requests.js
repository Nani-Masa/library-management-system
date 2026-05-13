const router = require('express').Router();
const {
  createRequest, getRequests, approveRequest,
  rejectRequest, cancelRequest, getStats,
} = require('../controllers/requestsController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/',            authenticate, createRequest);
router.get('/',             authenticate, getRequests);
router.get('/stats',        authenticate, authorize('librarian'), getStats);
router.put('/:id/approve',  authenticate, authorize('librarian'), approveRequest);
router.put('/:id/reject',   authenticate, authorize('librarian'), rejectRequest);
router.put('/:id/cancel',   authenticate, cancelRequest);

module.exports = router;
