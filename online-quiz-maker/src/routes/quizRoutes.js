const router = require('express').Router();
const controller = require('../controllers/quizController');
const { requireAuth } = require('../middleware/auth');
router.get('/', controller.list);
router.get('/:id/take', controller.getForTaking);
router.post('/', requireAuth, controller.create);
router.post('/:id/submit', requireAuth, controller.submit);
module.exports = router;
