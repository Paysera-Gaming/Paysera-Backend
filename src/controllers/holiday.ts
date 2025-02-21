import { Request, Response } from 'express';
import holidayService from '../services/holiday.service';

// Create a new holiday
export const createHoliday = async (req: Request, res: Response) => {
    const holiday = await holidayService.createHoliday(req.body);
    res.status(201).json(holiday);
};

// Get all holidays
export const getHolidays = async (req: Request, res: Response) => {
    const holidays = await holidayService.getHolidays();
    res.status(200).json(holidays);
};

// Get a holiday by ID
export const getHolidayById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const holiday = await holidayService.getHolidayById(Number(id));
    res.status(200).json(holiday);
};

// Get a holiday by month and day
export const getHolidayByMonthDay = async (req: Request, res: Response) => {
    const { month, day } = req.params;
    const holiday = await holidayService.getHolidayByMonthDay(month.toUpperCase() as any, Number(day));
    res.status(200).json(holiday);
};

// Update a holiday by ID
export const updateHoliday = async (req: Request, res: Response) => {
    const { id } = req.params;
    const holiday = await holidayService.updateHoliday(Number(id), req.body);
    res.status(200).json(holiday);
};

// Delete a holiday by ID
export const deleteHoliday = async (req: Request, res: Response) => {
    const { id } = req.params;
    const message = await holidayService.deleteHoliday(Number(id));
    res.status(200).send(message);

};

export default {
    createHoliday,
    getHolidays,
    getHolidayById,
    getHolidayByMonthDay,
    updateHoliday,
    deleteHoliday,
};