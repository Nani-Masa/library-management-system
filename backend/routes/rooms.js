const router = require('express').Router();
const { getAvailability, bookRoom, myBookings } = require('../controllers/roomsController');
const { authenticate } = require('../middleware/auth');
router.get('/availability', authenticate, getAvailability);
router.post('/', authenticate, bookRoom);
router.get('/my', authenticate, myBookings);
module.exports = router;