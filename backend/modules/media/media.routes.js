const { Router } = require('express');
const { uploadMediaController } = require('./media.controller');

const mediaRouter = Router();
mediaRouter.post('/upload', uploadMediaController);

module.exports = mediaRouter;
