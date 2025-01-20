import { Request, Response } from 'express';
import { prisma } from '../config/database';

import { customThrowError } from '../middlewares/errorHandler';
import { Month } from '@prisma/client';

// Create a new holiday
export const createHoliday = async (req: Request, res: Response) => {
    const { name, month, day } = req.body;

    if (!name || !month || !Number(day)) {
        return customThrowError(400, 'Please provide a date and name');
    }

    const holiday = await prisma.holiday.create({
        data: {
            name,
            day,
            month,
        },
    });

    return res.status(201).send(holiday);
};

// Get all holidays
export const getHolidays = async (req: Request, res: Response) => {
    const holidays = await prisma.holiday.findMany({
        orderBy: [{ month: 'desc' }, { day: 'desc' }],
    });

    if (!holidays.length) {
        return customThrowError(404, 'No holidays found');
    }

    return res.status(200).send(holidays);
};

// Get a single holiday by ID
export const getHolidayById = async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!Number(id)) {
        return customThrowError(400, 'Invalid ID');
    }

    const holiday = await prisma.holiday.findUnique({
        where: { id: Number(id) },
    });

    if (!holiday) {
        return customThrowError(404, 'Holiday not found');
    }

    return res.status(200).send(holiday);
};

// Get a holiday by month and day
export const getHolidayByMonthDay = async (req: Request, res: Response) => {
    const { month, day } = req.params;

    if (!Number(day)) {
        return customThrowError(400, 'Invalid day');
    }

    if (!month || !['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'].includes(month.toUpperCase())) {
        return customThrowError(400, 'Invalid month');
    }

    const holiday = await prisma.holiday.findFirst({
        where: { month: month.toUpperCase() as Month, day: Number(day) },
    });

    if (!holiday) {
        return customThrowError(404, 'Holiday not found');
    }

    return res.status(200).send(holiday);
};

// Update a holiday by ID
export const updateHoliday = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, month, day } = req.body;

    if (!name) {
        return customThrowError(400, 'Please provide a name');
    }

    if (!Number(day)) {
        return customThrowError(400, 'Invalid day');
    }

    if (!month || !['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'].includes(month.toUpperCase())) {
        return customThrowError(400, 'Invalid month');
    }

    const findHoliday = await prisma.holiday.findUnique({
        where: { id: Number(id) },
    });

    if (!findHoliday) {
        return customThrowError(404, 'Holiday not found');
    }

    const holiday = await prisma.holiday.update({
        where: { id: Number(id) },
        data: {
            name,
            day,
            month,
        },
    });

    return res.status(200).json(holiday);
}

// delete a holiday by ID
export const deleteHoliday = async (req: Request, res: Response) => {
    const { id } = req.params;

    const findHoliday = await prisma.holiday.findUnique({
        where: { id: Number(id) },
    });

    if (!findHoliday) {
        return customThrowError(404, 'Holiday not found');
    }

    const holiday = await prisma.holiday.delete({
        where: { id: Number(id) },
    });

    return res.status(200).send("Holiday deleted successfully");
}

export default {
    updateHoliday,
    getHolidayById,
    getHolidays,
    createHoliday,
    deleteHoliday,
    getHolidayByMonthDay,
};  