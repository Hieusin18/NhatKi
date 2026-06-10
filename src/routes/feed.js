const express  = require('express');
const router   = express.Router();
const auth     = require('../middlewares/auth');
const feedCtrl = require('../controllers/feedController');

router.get('/timeline',       auth, feedCtrl.getTimeline);
router.get('/group/:groupId', auth, feedCtrl.getGroupFeed);

module.exports = router;