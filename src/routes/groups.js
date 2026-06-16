const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const ctrl = require('../controllers/groupController');

// Create group
router.post('/', auth, ctrl.create);

// Get my groups
router.get('/', auth, ctrl.getMyGroups);

// Join group with invite code
router.post('/join', auth, ctrl.join);

// Get group detail
router.get('/:id', auth, ctrl.getOne);

// Regenerate invite code
router.post('/:id/regenerate-code', auth, ctrl.regenerateCode);

// Group history API (GET /api/groups/:groupId/history)
router.get('/:groupId/history', auth, ctrl.getGroupHistory);

// Group media search API (GET /api/groups/:groupId/media/search)
router.get('/:groupId/media/search', auth, ctrl.searchGroupMedia);

module.exports = router;