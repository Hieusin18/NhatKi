const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const ctrl = require('../controllers/diaryController');

/**
 * @swagger
 * /diary:
 *   post:
 *     summary: Tạo nhật ký mới
 *     tags: [Diary]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, content, entryDate]
 *             properties:
 *               title:
 *                 type: string
 *                 example: Ngày đẹp trời
 *               content:
 *                 type: string
 *                 example: Hôm nay mình đi chơi
 *               mood:
 *                 type: string
 *                 example: happy
 *               entryDate:
 *                 type: string
 *                 example: "2024-06-01"
 *               visibility:
 *                 type: string
 *                 enum: [private, public, group]
 *                 example: private
 *     responses:
 *       201:
 *         description: Tạo nhật ký thành công
 *       401:
 *         description: Chưa đăng nhập
 */
router.post('/', auth, ctrl.create);

/**
 * @swagger
 * /diary/timeline:
 *   get:
 *     summary: Lấy danh sách nhật ký theo timeline
 *     tags: [Diary]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *     responses:
 *       200:
 *         description: Danh sách nhật ký
 *       401:
 *         description: Chưa đăng nhập
 */
router.get('/timeline', auth, ctrl.getTimeline);

/**
 * @swagger
 * /diary/search:
 *   get:
 *     summary: Tìm kiếm nhật ký theo tag
 *     tags: [Diary]
 *     parameters:
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *           example: gia dinh
 *     responses:
 *       200:
 *         description: Danh sách nhật ký theo tag
 *       401:
 *         description: Chưa đăng nhập
 */
router.get('/search', auth, ctrl.searchByTag);

/**
 * @swagger
 * /diary/{id}:
 *   get:
 *     summary: Lấy chi tiết nhật ký
 *     tags: [Diary]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Chi tiết nhật ký
 *       401:
 *         description: Chưa đăng nhập
 */
router.get('/:id', auth, ctrl.getOne);

/**
 * @swagger
 * /diary/{id}/visibility:
 *   patch:
 *     summary: Cập nhật visibility của nhật ký
 *     tags: [Diary]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               visibility:
 *                 type: string
 *                 enum: [private, public, group]
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       401:
 *         description: Chưa đăng nhập
 */
router.patch('/:id/visibility', auth, ctrl.updateVisibility);

router.post('/:id/tags', auth, ctrl.attachTag);
router.delete('/:id/tags/:tagId', auth, ctrl.detachTag);

module.exports = router;