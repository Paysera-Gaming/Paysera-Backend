import { asyncHandler } from '../middlewares/errorHandler';
import express, { Request, Response } from 'express';
import os from 'os';
import { configEnv } from '../config/dotenv';

const sampleRouter = express.Router();

import { differenceInMinutes, format, getHours, getMinutes, isAfter, isBefore, parseISO, set } from 'date-fns';
import { UAParser } from 'ua-parser-js';
import { TZDate } from '@date-fns/tz';


sampleRouter.get('/sample', (req: Request, res: Response) => {
    // if weekend don't allow time in in depth schedule
    const currentDay = format(new Date('2024-12-1'), 'EEEE');
    if (currentDay === 'Saturday' || currentDay === 'Sunday') {
        res.send('Weekend not allowed to time in');
    }
    res.send("Weekdays allowed to time in");
});

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
    const currentTime = new TZDate(new Date(), timeZone)
    const device = req.headers['user-agent'];
    const parse = new UAParser(device);

    const ua = req.headers["sec-ch-ua"];
    const mobile = req.headers["sec-ch-ua-mobile"];
    const platform = req.headers["sec-ch-ua-platform"];


    res.send({
        message: "Hello World",
        env: configEnv.NODE_ENV,
        currentTime: currentTime.getHours() + ':' + currentTime.getMinutes() + ':' + currentTime.getSeconds(),
        date: new Date(),
        isoDate: parseISO(new Date().toISOString()),
        uaClient: parse.getResult(),
        ua,
        mobile,
        platform
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