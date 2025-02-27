import express from 'express';
import { login, logout, getUserInfo, sendForgetPasswordEmail, resetPassword } from '../controllers/auth';
import { asyncHandler } from '../middlewares/errorHandler';
import { adminMiddleware, teamLeaderMiddleware, regularMiddleware } from '../middlewares';

const routerAuth = express.Router();

routerAuth.post('/login', asyncHandler(login)); //user login
routerAuth.post('/logout', asyncHandler(logout)); //user logout
routerAuth.get('/info', asyncHandler(getUserInfo)); //user logout
routerAuth.post('/forget-password', asyncHandler(sendForgetPasswordEmail)); //user logout
routerAuth.post('/reset-password/:id', asyncHandler(resetPassword)); //user logout



routerAuth.get('/protected', regularMiddleware, (req, res) => {
    res.send('success');
});

routerAuth.get('/protected-a', adminMiddleware, (req, res) => {
    res.send('success');
});

routerAuth.get('/protected-tl', teamLeaderMiddleware, (req, res) => {
    res.send('success');
});

export default routerAuth;
