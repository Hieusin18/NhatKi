import { Router } from 'express';
import { uploadMediaController } from './media.controller';

const mediaRouter = Router();
mediaRouter.post('/upload', uploadMediaController);

export default mediaRouter;
