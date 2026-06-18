const { Router } = require('express');
const { authenticate } = require('../auth/auth.middleware');
const { getGroupActivitiesController } = require('./group.controller');

const groupRouter = Router();

groupRouter.get('/:groupId/activities', authenticate, getGroupActivitiesController);

module.exports = groupRouter;
