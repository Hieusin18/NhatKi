const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const ctrl = require('../controllers/groupController');

/**
 * @swagger
 * /groups:
 *   post:
 *     summary: Tạo nhóm mới
 *     tags: [Groups]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Nhóm gia đình
 *               description:
 *                 type: string
 *                 example: Nhóm chia sẻ ký ức gia đình
 *     responses:
 *       201:
 *         description: Tạo nhóm thành công
 *       401:
 *         description: Chưa đăng nhập
 */
router.post('/', auth, ctrl.create);

/**
 * @swagger
 * /groups:
 *   get:
 *     summary: Lấy danh sách nhóm của user
 *     tags: [Groups]
 *     responses:
 *       200:
 *         description: Danh sách nhóm
 *       401:
 *         description: Chưa đăng nhập
 */
router.get('/', auth, ctrl.getMyGroups);

/**
 * @swagger
 * /groups/join:
 *   post:
 *     summary: Tham gia nhóm bằng invite code
 *     tags: [Groups]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [inviteCode]
 *             properties:
 *               inviteCode:
 *                 type: string
 *                 example: ABC123
 *     responses:
 *       200:
 *         description: Tham gia nhóm thành công
 *       404:
 *         description: Invite code không hợp lệ
 *       401:
 *         description: Chưa đăng nhập
 */
router.post('/join', auth, ctrl.join);

/**
 * @swagger
 * /groups/{id}:
 *   get:
 *     summary: Lấy chi tiết nhóm
 *     tags: [Groups]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Chi tiết nhóm và danh sách thành viên
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Không tìm thấy nhóm
 */
router.get('/:id', auth, ctrl.getOne);

/**
 * @swagger
 * /groups/{id}/regenerate-code:
 *   post:
 *     summary: Tạo invite code mới cho nhóm
 *     tags: [Groups]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Invite code mới
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền
 */
router.post('/:id/regenerate-code', auth, ctrl.regenerateCode);

module.exports = router;