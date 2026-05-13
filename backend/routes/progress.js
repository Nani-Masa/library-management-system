const router = require('express').Router();
const { getProgress, upsertProgress } = require('../controllers/progressController');
const { authenticate } = require('../middleware/auth');
router.get('/', authenticate, getProgress);
router.post('/', authenticate, upsertProgress);
module.exports = router;