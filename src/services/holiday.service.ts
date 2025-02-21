import { Month } from '@prisma/client';
import { prisma } from '../config/database';

interface HolidayData {
    name: string;
    month: Month;
    day: number;
}

export class HolidayService {
    // Create a new holiday
    static async createHoliday(data: HolidayData) {
        return await prisma.holiday.create({
            data: {
                name: data.name,
                month: data.month,
                day: data.day,
            },
        });
    }

    // Get all holidays
    static async getHolidays() {
        return await prisma.holiday.findMany({
            orderBy: [{ month: 'desc' }, { day: 'desc' }],
        });
    }

    // Get a holiday by ID
    static async getHolidayById(id: number) {
        return await prisma.holiday.findUnique({
            where: { id },
        });
    }

    // Get a holiday by month and day
    static async getHolidayByMonthDay(month: Month, day: number) {
        return await prisma.holiday.findFirst({
            where: { month, day },
        });
    }

    // Update a holiday by ID
    static async updateHoliday(id: number, data: Partial<HolidayData>) {
        return await prisma.holiday.update({
            where: { id },
            data,
        });
    }

    // Delete a holiday by ID
    static async deleteHoliday(id: number) {
        await prisma.holiday.delete({
            where: { id },
        });

        return 'Holiday deleted successfully';
    }
}
