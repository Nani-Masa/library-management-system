const router = require('express').Router();
const { getRecommendations, chatbot } = require('../controllers/chatbotController');
const { authenticate } = require('../middleware/auth');
router.get('/recommendations', authenticate, getRecommendations);
router.post('/', authenticate, chatbot);
module.exports = router;