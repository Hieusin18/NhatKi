const { Router } = require('express');
const multer = require('multer');
const { authenticate } = require('../auth/auth.middleware');
const { uploadMediaController, searchMediaController } = require('./media.controller');

const mediaRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

mediaRouter.get('/search', authenticate, searchMediaController);
mediaRouter.post('/upload', authenticate, upload.single('file'), uploadMediaController);

module.exports = mediaRouter;
