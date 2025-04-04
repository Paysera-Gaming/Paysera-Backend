import { configEnv } from '../config/dotenv';
import { NextFunction, Request, Response } from 'express';
import pino from 'pino';
import pinoHttp from 'pino-http';

const isDevelopment = configEnv.NODE_ENV === 'development' || configEnv.NODE_ENV === 'test';

const logger = pino({
    level: isDevelopment ? 'debug' : 'info',
    ...(isDevelopment && {
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true, // --colorize
                colorizeObjects: true, //--colorizeObjects
                levelFirst: true, // Show the log level at the start of the log line
                translateTime: 'time', // Format the timestamp
                ignore: 'pid,hostname', // Optionally ignore certain fields
                singleLine: false, // --singleLine
            },
        },
    }),
});

const customHttpLoggerMiddleware = () => {
    return (req: Request, res: Response, next: NextFunction) => {
        const start = process.hrtime();

        res.on('finish', () => {
            const [seconds, nanoseconds] = process.hrtime(start);
            const duration = (seconds * 1000) + (nanoseconds / 1e6);

            logger.info({
                message: 'Request completed',
                duration: `${duration.toFixed(2)}ms`,
                status: res.statusCode,
                method: req.method,
                url: req.originalUrl,
                origin: req.headers.origin,
                body: req.body,
                response: res.json,
            });
        });

        next();
    };
};


const httpLoggerMiddleware = isDevelopment ? customHttpLoggerMiddleware() : pinoHttp({ logger });

export { logger, httpLoggerMiddleware };
