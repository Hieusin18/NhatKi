const { Router } = require('express');
const { registerController, loginController } = require('./auth.controller');

const authRouter = Router();

authRouter.post('/register', registerController);
authRouter.post('/login', loginController);

module.exports = authRouter;
