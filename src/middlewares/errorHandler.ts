import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from './logger';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

// Custom Error Interface
interface CustomError extends Error {
    status?: number;
}

const globalErrorHandler = (
    error: CustomError,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    // Check if the response has already been sent
    if (res.headersSent) {
        return next(error);
    }

    logger.error({
        method: req.method,
        statusCode: error.status || (error instanceof ZodError ? 400 : 500),
        url: req.originalUrl,
        message: error instanceof ZodError ? error.errors[0] : error.message || error,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        error: error,
        body: req.body,
    });

    if (error instanceof ZodError) {
        const zodError = error as ZodError;
        res.status(400).send(zodError.errors[0]?.message + " in path " + zodError.errors[0]?.path[0] || 'Bad Request');
        return;
    }

    if (error instanceof PrismaClientKnownRequestError) {
        res.status(404).send("Not Found credentials");
        return;
    }

    const statusCode = error.status || 500;
    res.status(statusCode).send({
        statusCode: statusCode,
        message: error.message || "Internal Server Error",
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });

    return;
};

export function asyncHandler(handler: Function) {
    return async function (req: Request, res: Response, next: NextFunction) {
        try {
            await handler(req, res, next);
        } catch (error) {
            next(error);
        }
    };
}

export const raiseHttpError = (status: number, message: string): never => {
    const error: CustomError = new Error(message);
    error.status = status;
    throw error;
};

export default globalErrorHandler;
