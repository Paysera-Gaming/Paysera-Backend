import { Month } from '@prisma/client';
import { customThrowError } from '../middlewares/errorHandler';
import { createHolidaySchema, updateHolidaySchema } from '../validation/holiday.validation';
import { prisma } from '../config/database';

interface HolidayData {
    name: string;
    month: Month;
    day: number;
}

export class HolidayService {
    // No need for a constructor or private prisma property

    // Create a new holiday
    async createHoliday(data: HolidayData) {
        // Validate input data
        const validatedData = createHolidaySchema.parse(data);

        // Check if holiday already exists
        const existingHoliday = await prisma.holiday.findFirst({
            where: {
                month: validatedData.month,
                day: validatedData.day,
            },
        });

        if (existingHoliday) {
            throw customThrowError(400, 'Holiday already exists');
        }

        // Create the holiday
        return await prisma.holiday.create({
            data: validatedData,
        });
    }

    // Get all holidays
    async getHolidays() {
        const holidays = await prisma.holiday.findMany({
            orderBy: [{ month: 'desc' }, { day: 'desc' }],
        });

        if (!holidays.length) {
            throw customThrowError(404, 'No holidays found');
        }

        return holidays;
    }

    // Get a holiday by ID
    async getHolidayById(id: number) {
        const holiday = await prisma.holiday.findUnique({
            where: { id },
        });

        if (!holiday) {
            throw customThrowError(404, 'Holiday not found');
        }

        return holiday;
    }

    // Get a holiday by month and day
    async getHolidayByMonthDay(month: Month, day: number) {
        const holiday = await prisma.holiday.findFirst({
            where: { month, day },
        });

        if (!holiday) {
            throw customThrowError(404, 'Holiday not found');
        }

        return holiday;
    }

    // Update a holiday by ID
    async updateHoliday(id: number, data: Partial<HolidayData>) {
        // Validate input data
        const validatedData = updateHolidaySchema.parse(data);

        // Check if holiday exists
        const existingHoliday = await prisma.holiday.findUnique({
            where: { id },
        });

        if (!existingHoliday) {
            throw customThrowError(404, 'Holiday not found');
        }

        // Update the holiday
        return await prisma.holiday.update({
            where: { id },
            data: validatedData,
        });
    }

    // Delete a holiday by ID
    async deleteHoliday(id: number) {
        const existingHoliday = await prisma.holiday.findUnique({
            where: { id },
        });

        if (!existingHoliday) {
            throw customThrowError(404, 'Holiday not found');
        }

        await prisma.holiday.delete({
            where: { id },
        });

        return 'Holiday deleted successfully';
    }
}

// Export an instance of the service
export default new HolidayService();