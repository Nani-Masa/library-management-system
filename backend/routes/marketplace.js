const router = require('express').Router();
const { list, create, claim } = require('../controllers/marketplaceController');
const { authenticate } = require('../middleware/auth');
router.get('/', list);
router.post('/', authenticate, create);
router.put('/:id/claim', authenticate, claim);
module.exports = router;