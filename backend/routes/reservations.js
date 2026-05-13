const router = require('express').Router();
const { reserve, myReservations, cancel } = require('../controllers/reservationsController');
const { authenticate } = require('../middleware/auth');
router.post('/', authenticate, reserve);
router.get('/my', authenticate, myReservations);
router.delete('/:id', authenticate, cancel);
module.exports = router;