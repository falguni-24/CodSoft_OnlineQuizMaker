const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { getDashboard } = require('../controllers/dashboardController');
router.get('/', requireAuth, getDashboard);
module.exports = router;
