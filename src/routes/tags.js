const express = require('express');
const router  = express.Router();
const auth    = require('../middlewares/auth');
const ctrl    = require('../controllers/tagController');

router.get('/', auth, ctrl.getAll);

module.exports = router;