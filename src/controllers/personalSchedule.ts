import { initializeHourTimeZone } from '../utils/date';
import { prisma } from '../config/database';
import { customThrowError } from '../middlewares/errorHandler';
import { validateCreatePersonalSchedule } from '../validate/schedule.validation';
import { Request, Response } from 'express';
import { isAfter } from 'date-fns';
import { validateUpdatePersonalSchedule } from '../validate/scheduleUpdate.validation';


// TODO: Implement the validation of the personal schedule
// GET /personal-schedule
async function getAllPersonalSchedules(req: Request, res: Response) {
    const personalSchedules = await prisma.personalSchedule.findMany({
        include: { Schedule: true, Employee: true }
    });


    res.status(200).send(personalSchedules);
}

// GET /personal-schedule/:id
async function getPersonalScheduleById(req: Request, res: Response) {
    const personalScheduleId = Number(req.params.id);
    if (!personalScheduleId) {
        customThrowError(400, "Invalid personal schedule ID");
    }

    const existingPersonalSchedule = await prisma.personalSchedule.findFirst({
        where: { id: personalScheduleId },
        include: { Schedule: true }
    });

    if (!existingPersonalSchedule) {
        return customThrowError(404, "Personal schedule not found");
    }

    return res.status(200).send(existingPersonalSchedule);
}

// POST /personal-schedule
async function createPersonalSchedule(req: Request, res: Response) {
    const employeeId = Number(req.body.employeeId);
    if (!employeeId) {
        return customThrowError(400, "Invalid employee ID");
    }

    const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
        include: { PersonalSchedule: true }
    });

    if (!employee) {
        return customThrowError(404, "Employee not found");
    }

    const existingPersonalSchedule = await prisma.personalSchedule.findUnique({
        where: { employeeId: employee.id },
        include: { Employee: true }
    });

    if (existingPersonalSchedule) {
        return customThrowError(400, "Employee already has a personal schedule");
    }

    const startTime = initializeHourTimeZone(req.body.startTime);
    const endTime = initializeHourTimeZone(req.body.endTime);
    console.log(req.body.startTime, req.body.endTime, startTime, endTime, "hello boi");

    // validate schedule
    if (isAfter(startTime, endTime)) {
        customThrowError(400, "Start time must be before end time");
    }

    validateCreatePersonalSchedule({
        employeeId: Number(req.body.employeeId),
        name: req.body.name,
        startTime: startTime,
        endTime: endTime,
        scheduleType: req.body.scheduleType,
        // startTimeLimit: req.body.startTimeLimit,
        limitWorkHoursDay: req.body.limitWorkHoursDay,
        allowedOvertime: req.body.allowedOvertime,
    });

    // validate request body of days
    if (req.body.day) {
        if (!Array.isArray(req.body.day)) {
            customThrowError(400, "Invalid list of days");
        }

        if (req.body.day.length === 0) {
            customThrowError(400, "List of days is empty");
        }

        const days = req.body.day;
        const daysOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
        for (const day of days) {
            if (!daysOfWeek.includes(day)) {
                customThrowError(400, "Invalid day in days array");
            }
        }
    }

    const schedule = await prisma.schedule.create({
        data: {
            scheduleType: req.body.scheduleType,
            startTime: startTime,
            endTime: endTime,
            limitWorkHoursDay: req.body.limitWorkHoursDay,
            allowedOvertime: req.body.allowedOvertime,
        },
    });

    const personalSchedule = await prisma.personalSchedule.create({
        data: {
            employeeId: employee.id,
            scheduleId: schedule.id,
            name: req.body.name,
            day: [...req.body.day],
        },
    });

    res.status(201).send(personalSchedule);
}

// PUT /personal-schedule/:id
async function updatePersonalSchedule(req: Request, res: Response) {
    const personalScheduleId = Number(req.params.id);
    if (!personalScheduleId) {
        customThrowError(400, "Invalid personal schedule ID");
    }

    // TODO: Implement the validation CHANGE EMPLOYEE ID
    const personalSchedule = await prisma.personalSchedule.findFirst({
        where: { id: personalScheduleId },
        include: { Schedule: true }
    });

    if (!personalSchedule) {
        return customThrowError(404, "Personal schedule not found");
    }

    const employee = await prisma.employee.findFirst({
        where: { id: personalSchedule.employeeId },
    });

    if (!employee) {
        return customThrowError(404, "No employee found for this personal schedule");
    }

    // validate request body of days
    if (req.body.day) {
        if (!Array.isArray(req.body.day)) {
            customThrowError(400, "Days must be an array");
        }

        if (req.body.day.length === 0) {
            customThrowError(400, "Days must not be empty");
        }

        const days = req.body.day;
        const daysOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
        for (const day of days) {
            if (!daysOfWeek.includes(day)) {
                customThrowError(400, "Invalid day in days array");
            }
        }
    }

    const startTime = initializeHourTimeZone(req.body.startTime);
    const endTime = initializeHourTimeZone(req.body.endTime);
    // validate schedule
    if (startTime >= endTime) {
        customThrowError(400, "Start time must be before end time");
    }

    const body = {
        employeeId: Number(req.body.employeeId),
        name: req.body.name ?? personalSchedule.name,
        scheduleType: req.body.scheduleType ?? personalSchedule.Schedule.scheduleType,
        startTime: startTime,
        endTime: endTime,
        limitWorkHoursDay: req.body.limitWorkHoursDay,
        allowedOvertime: req.body.allowedOvertime,
    };

    validateUpdatePersonalSchedule(body);

    // validate schedule
    if (startTime >= endTime) {
        customThrowError(400, "Start time must be before end time");
    }

    await prisma.personalSchedule.update({
        where: { id: personalScheduleId },
        data: {
            name: body.name ?? personalSchedule.name,
            day: req.body.day ?? personalSchedule.day,
            Schedule: {
                update: {
                    id: body.employeeId ?? personalSchedule.Schedule.id,
                    scheduleType: body.scheduleType ?? personalSchedule.Schedule.scheduleType,
                    startTime: body.startTime ?? personalSchedule.Schedule.startTime,
                    endTime: body.endTime ?? personalSchedule.Schedule.endTime,
                    limitWorkHoursDay: body.limitWorkHoursDay ?? personalSchedule.Schedule.limitWorkHoursDay,
                    allowedOvertime: body.allowedOvertime ?? personalSchedule.Schedule.allowedOvertime,
                },
            },
        },
    });

    return res.status(201).send("Schedule updated successfully");
}

// DELETE /personal-schedule/:id
async function removePersonalSchedule(req: Request, res: Response) {
    const personalScheduleId = Number(req.params.id);
    if (!personalScheduleId) {
        customThrowError(400, "Invalid personal schedule ID");
    }

    const existingPersonalSchedule = await prisma.personalSchedule.findUnique({
        where: { id: personalScheduleId },
    });

    if (!existingPersonalSchedule) {
        return customThrowError(404, "Personal schedule not found");
    }

    const schedule = await prisma.schedule.findFirst({
        where: { id: existingPersonalSchedule.scheduleId }
    });

    if (!schedule) {
        return customThrowError(404, "Schedule not found");
    }

    // delete schedule
    await prisma.schedule.delete({
        where: { id: schedule.id },
    });

    return res.status(200).send("Personal schedule removed successfully");
}

export default {
    getAllPersonalSchedules,
    getPersonalScheduleById,
    createPersonalSchedule,
    updatePersonalSchedule,
    removePersonalSchedule,
};
