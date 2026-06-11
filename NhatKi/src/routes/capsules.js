const express = require('express');
const router  = express.Router();
const auth    = require('../middlewares/auth');
const ctrl    = require('../controllers/capsuleController');

// GET  /capsules/received — capsule được gửi cho mình
router.get('/received',    auth, ctrl.getReceived);

// GET  /capsules — danh sách capsule của mình
router.get('/',            auth, ctrl.getAll);

// POST /capsules — tạo capsule mới
router.post('/',           auth, ctrl.create);

// GET  /capsules/:id — xem chi tiết
router.get('/:id',         auth, ctrl.getOne);

// POST /capsules/:id/open — mở hộp
router.post('/:id/open',   auth, ctrl.open);

// POST /capsules/:id/media — thêm ảnh/lời chúc
router.post('/:id/media',  auth, ctrl.addMedia);

module.exports = router;