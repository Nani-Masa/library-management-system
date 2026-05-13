const router = require('express').Router();
const { listUsers, getUser } = require('../controllers/usersController');
const { authenticate, authorize } = require('../middleware/auth');
router.get('/', authenticate, authorize('admin','librarian'), listUsers);
router.get('/:id', authenticate, getUser);
module.exports = router;