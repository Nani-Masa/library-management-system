const router = require('express').Router();
const { createReview, getBookReviews } = require('../controllers/reviewsController');
const { authenticate } = require('../middleware/auth');
router.post('/', authenticate, createReview);
router.get('/book/:bookId', getBookReviews);
module.exports = router;