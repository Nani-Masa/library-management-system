const router = require('express').Router();
const { getNotifications, markRead, markAllRead } = require('../controllers/notificationsController');
const { authenticate } = require('../middleware/auth');
router.get('/', authenticate, getNotifications);
router.put('/read-all', authenticate, markAllRead);
router.put('/:id/read', authenticate, markRead);
module.exports = router;