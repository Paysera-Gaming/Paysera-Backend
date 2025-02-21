import { z } from 'zod';

// Schema for creating a holiday
export const createHolidaySchema = z.object({
    name: z.string().min(1, 'Name is required'),
    month: z.enum([
        'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
        'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
    ]),
    day: z.number().int().min(1).max(31),
});

// Schema for updating a holiday
export const updateHolidaySchema = z.object({
    name: z.string().min(1, 'Name is required').optional(),
    month: z.enum([
        'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
        'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
    ]).optional(),
    day: z.number().int().min(1).max(31).optional(),
});

// Schema for getting a holiday by month and day
export const getHolidayByMonthDaySchema = z.object({
    month: z.enum([
        'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
        'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
    ]),
    day: z.number().int().min(1).max(31),
});