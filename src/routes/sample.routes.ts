import { asyncHandler } from '../middlewares/errorHandler';
import express, { Request, Response } from 'express';
import os from 'os';
import { configEnv } from '../config/dotenv';
import { toZonedTime } from 'date-fns-tz';
import { parseISO } from 'date-fns';

const sampleRouter = express.Router();



sampleRouter.get('/server', (req: Request, res: Response) => {
    const networkInterfaces = os.networkInterfaces();
    let serverIp = '';

    for (const key in networkInterfaces) {
        const networkInterface = networkInterfaces[key];
        for (const net of networkInterface!) {
            if (net.family === 'IPv4' && !net.internal) {
                serverIp = net.address;
                console.log(serverIp, net);

                break;
            }
        }
        if (serverIp) break;
    }

    res.send(`Server's IP address is: ${serverIp}`);
});



sampleRouter.get('/', (req: Request, res: Response) => {
    const timeZone = "Asia/Manila";
    const currentTime = toZonedTime(new Date(), timeZone)

    res.send({
        message: "Hello World",
        env: configEnv.NODE_ENV,
        currentTime: currentTime.getHours() + ':' + currentTime.getMinutes() + ':' + currentTime.getSeconds(),
        date: new Date(),
        isoDate: parseISO(new Date().toISOString())
    });
});

sampleRouter.get('/api', (req: Request, res: Response) => {
    res.send({ message: "API Paysera timekeeping system" });
});

sampleRouter.get('/error', (req: Request, res: Response) => {
    throw new Error('This is a sample error');
});

sampleRouter.get('/errorAsync', async (req: Request, res: Response) => {
    throw new Error('This is a sample error');
});

sampleRouter.get('/errorPromise', async (req: Request, res: Response) => {
    return new Promise((resolve, reject) => {
        reject(new Error('This is a sample error'));
    });
});

sampleRouter.get('/errorHandle', asyncHandler(async (req: Request, res: Response) => {
    throw new Error('This is a sample error');
}));


export default sampleRouter;