const express = require('express');
const router  = express.Router();
const auth    = require('../middlewares/auth');
const ctrl    = require('../controllers/groupController');

router.get('/',                     auth, ctrl.getMyGroups);
router.post('/',                    auth, ctrl.create);
router.post('/join',                auth, ctrl.join);
router.get('/:id',                  auth, ctrl.getOne);
router.post('/:id/regenerate-code', auth, ctrl.regenerateCode);

module.exports = router;