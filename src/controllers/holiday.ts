import { Request, Response } from 'express';
import { createHolidaySchema } from '../validation/holiday.validation';
import { raiseHttpError } from '../middlewares/errorHandler';
import { HolidayService } from '../services/holiday.service';

export const HolidayController = {
    // Create a new holiday
    createHoliday: async (req: Request, res: Response) => {
        // validate request body
        const validatedData = createHolidaySchema.parse(req.body);

        // check if holiday already exists
        const holidayExists = await HolidayService.getHolidayByMonthDay(validatedData.month, validatedData.day);
        if (holidayExists) {
            throw raiseHttpError(400, 'Holiday already exists');
        }

        const holiday = await HolidayService.createHoliday(validatedData);
        res.status(201).json(holiday);
    },

    // Get all holidays
    getHolidays: async (req: Request, res: Response) => {
        const holidays = await HolidayService.getHolidays();
        res.status(200).json(holidays);
    },

    // Get a holiday by ID
    getHolidayById: async (req: Request, res: Response) => {
        const { id } = req.params;

        if (isNaN(Number(id))) {
            throw raiseHttpError(400, 'Invalid ID');
        }

        const holiday = await HolidayService.getHolidayById(Number(id));
        if (!holiday) {
            throw raiseHttpError(404, 'Holiday not found');
        }

        res.status(200).json(holiday);
    },

    // Get a holiday by month and day
    getHolidayByMonthDay: async (req: Request, res: Response) => {
        const { month, day } = req.params;
        const holiday = await HolidayService.getHolidayByMonthDay(month.toUpperCase() as any, Number(day));
        if (!holiday) {
            throw raiseHttpError(404, 'Holiday not found');
        }

        res.status(200).json(holiday);
    },

    // Update a holiday by ID
    updateHoliday: async (req: Request, res: Response) => {
        const { id } = req.params;

        if (isNaN(Number(id))) {
            throw raiseHttpError(400, 'Invalid ID');
        }

        const existingHoliday = await HolidayService.getHolidayById(Number(id));
        if (!existingHoliday) {
            throw raiseHttpError(404, 'Holiday not found');
        }

        const updatedHoliday = await HolidayService.updateHoliday(Number(id), req.body);
        res.status(200).json(updatedHoliday);
    },

    // Delete a holiday by ID
    deleteHoliday: async (req: Request, res: Response) => {
        const { id } = req.params;

        if (isNaN(Number(id))) {
            throw raiseHttpError(400, 'Invalid ID');
        }

        if (!await HolidayService.getHolidayById(Number(id))) {
            throw raiseHttpError(404, 'Holiday not found');
        }

        const message = await HolidayService.deleteHoliday(Number(id));
        res.status(200).send(message);
    }
};