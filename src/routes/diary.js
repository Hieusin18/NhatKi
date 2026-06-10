const express      = require('express');
const router       = express.Router();
const auth         = require('../middlewares/auth');
const diaryCtrl    = require('../controllers/diaryController');
const tagCtrl      = require('../controllers/tagController');
const reactionCtrl = require('../controllers/reactionController');

// Diary CRUD
router.get('/timeline',         auth, diaryCtrl.getTimeline);
router.get('/search',           auth, tagCtrl.searchByTag);
router.post('/',                auth, diaryCtrl.create);
router.get('/:id',              auth, diaryCtrl.getOne);
router.put('/:id',              auth, diaryCtrl.update);
router.delete('/:id',           auth, diaryCtrl.remove);
router.patch('/:id/visibility', auth, diaryCtrl.updateVisibility);

// Tags
router.post('/:diaryId/tags',          auth, tagCtrl.attachTag);
router.delete('/:diaryId/tags/:tagId', auth, tagCtrl.detachTag);

// Reactions
router.post('/:diaryId/reactions',   auth, reactionCtrl.addReaction);
router.delete('/:diaryId/reactions', auth, reactionCtrl.removeReaction);
router.get('/:diaryId/reactions',    auth, reactionCtrl.getReactions);

// Comments
router.post('/:diaryId/comments',              auth, reactionCtrl.addComment);
router.get('/:diaryId/comments',               auth, reactionCtrl.getComments);
router.delete('/:diaryId/comments/:commentId', auth, reactionCtrl.deleteComment);

module.exports = router;