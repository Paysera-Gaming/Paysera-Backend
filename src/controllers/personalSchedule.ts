import { prisma } from '../config/database';
import { customThrowError } from '../middlewares/errorHandler';
import { validateCreatePersonalSchedule } from '../validate/schedule.validation';
import { validateUpdateRoleSchedule } from '../validate/scheduleUpdate.validation';
import { Request, Response } from 'express';
import { toZonedTime } from 'date-fns-tz';


// TODO: Implement the validation of the personal schedule
// GET /personal-schedule
async function getAllPersonalSchedules(req: Request, res: Response) {
    const employeeId = Number(req.query.employeeId);

    let personalSchedules;
    if (employeeId) {
        if (isNaN(employeeId)) {
            return customThrowError(400, 'Employee ID is invalid');
        }
        personalSchedules = await prisma.personalSchedule.findMany({
            where: { employeeId: employeeId },
            include: { Schedule: true }
        });
    } else {
        personalSchedules = await prisma.personalSchedule.findMany({
            include: { Schedule: true }
        });
    }

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

    const employee = await prisma.employee.findFirst({
        where: { id: employeeId },
    });

    if (!employee) {
        return customThrowError(404, "Employee not found");
    }

    const timeZone = 'Asia/Manila';
    const startTime = toZonedTime(req.body.startTime, timeZone);
    const endTime = toZonedTime(req.body.endTime, timeZone);

    validateCreatePersonalSchedule({
        employeeId: employeeId,
        name: req.body.name,
        scheduleType: req.body.scheduleType,
        startTime: startTime,
        startTimeLimit: req.body.startTimeLimit,
        endTime: endTime,
        limitWorkHoursDay: req.body.limitWorkHoursDay,
        allowedOvertime: req.body.allowedOvertime,
    });

    // validate schedule
    if (startTime >= endTime) {
        customThrowError(400, "Start time must be before end time");
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
            name: req.body.name,
            employeeId: employeeId,
            scheduleId: schedule.id,
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

    const timeZone = 'Asia/Manila';
    const startTime = toZonedTime(req.body.startTime ?? personalSchedule.Schedule.startTime, timeZone);
    const endTime = toZonedTime(req.body.endTime ?? personalSchedule.Schedule.endTime, timeZone);


    const body = {
        employeeId: req.body.employeeId ?? personalSchedule.employeeId,
        name: req.body.name ?? personalSchedule.name,
        scheduleType: req.body.scheduleType ?? personalSchedule.Schedule.scheduleType,
        startTime: toZonedTime(req.body.startTime, timeZone),
        startTimeLimit: toZonedTime(req.body.startTimeLimit, timeZone),
        endTime: toZonedTime(req.body.endTime, timeZone),
        limitWorkHoursDay: req.body.limitWorkHoursDay,
        allowedOvertime: req.body.allowedOvertime,
    };

    validateCreatePersonalSchedule(body);

    // validate schedule
    if (startTime >= endTime) {
        customThrowError(400, "Start time must be before end time");
    }

    await prisma.personalSchedule.update({
        where: { id: personalScheduleId },
        data: {
            name: body.name ?? personalSchedule.name,

            Schedule: {
                update: {
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
