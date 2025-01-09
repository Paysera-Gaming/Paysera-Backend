import { prisma } from '../config/database';
import { customThrowError } from '../middlewares/errorHandler';
import { validateCreateRoleSchedule } from '../validate/schedule.validation';
import { validateUpdateRoleSchedule } from '../validate/scheduleUpdate.validation';
import { Request, Response } from 'express';
import { toZonedTime } from 'date-fns-tz';

// GET /department-schedule
async function getAllDepartmentSchedules(req: Request, res: Response) {
    const departmentId = Number(req.query.departmentId);

    let departmentSchedules;
    if (departmentId) {
        if (isNaN(departmentId)) {
            return customThrowError(400, 'Department ID is invalid');
        }
        departmentSchedules = await prisma.departmentSchedule.findMany({
            where: { departmentId: departmentId },
            include: { Schedule: true }
        });
    } else {
        departmentSchedules = await prisma.departmentSchedule.findMany({
            include: { Schedule: true }
        });
    }

    res.status(200).send(departmentSchedules);
}

// GET /department-schedule/:id
async function getDepartmentScheduleById(req: Request, res: Response) {
    const departmentScheduleId = Number(req.params.id);
    if (!departmentScheduleId) {
        customThrowError(400, "Invalid department attendance ID");
    }

    const existingDepartmentSchedule = await prisma.departmentSchedule.findFirst({
        where: { id: departmentScheduleId },
        include: { Schedule: true }
    });

    if (!existingDepartmentSchedule) {
        customThrowError(404, "Solo schedule not found");
        return;
    }

    res.status(200).send(existingDepartmentSchedule);
}

// POST /department-schedule
async function createDepartmentSchedule(req: Request, res: Response) {
    const departmentId = Number(req.body.departmentId) || -1;
    const department = await prisma.department.findFirst({
        where: { id: departmentId },
    });

    if (!department) {
        customThrowError(404, "Department not found");
    }

    const timeZone = 'Asia/Manila';
    const startTime = toZonedTime(req.body.startTime, timeZone);
    const endTime = toZonedTime(req.body.endTime, timeZone);
    // const lunchStartTime = toZonedTime(req.body.lunchStartTime, timeZone);
    // const lunchEndTime = toZonedTime(req.body.lunchEndTime, timeZone);

    validateCreateRoleSchedule({
        departmentId: departmentId,
        role: req.body.role,
        name: req.body.name,
        scheduleType: req.body.scheduleType,
        startTime: startTime,
        endTime: endTime,
        limitWorkHoursDay: req.body.limitWorkHoursDay,
        allowedOvertime: req.body.allowedOvertime,
        // lunchStartTime: lunchStartTime,
        // lunchEndTime: lunchEndTime,
    })


    // validate schedule
    if (startTime >= endTime) {
        customThrowError(400, "Start time must be before end time");
    }
    //  else if (lunchStartTime <= startTime || lunchStartTime >= endTime) {
    //     customThrowError(400, "Lunch start time must be between start time and end time");
    // } else if (lunchEndTime <= lunchStartTime || lunchEndTime >= endTime) {
    //     customThrowError(400, "Lunch end time must be between lunch start time and end time");
    // }

    const schedule = await prisma.schedule.create({
        data: {
            scheduleType: req.body.scheduleType,
            startTime: startTime,
            endTime: endTime,
            limitWorkHoursDay: req.body.limitWorkHoursDay,
            allowedOvertime: req.body.allowedOvertime,
            // lunchStartTime: lunchStartTime,
            // lunchEndTime: lunchEndTime,
        },
    });

    const departmentSchedule = await prisma.departmentSchedule.create({
        data: {
            name: req.body.name,
            departmentId: departmentId,
            scheduleId: schedule.id,
            role: String(req.body.role).toUpperCase(),
        },
    });

    res.status(201).send(departmentSchedule);
}

// PUT /department-schedule/:id
async function updateDepartmentSchedule(req: Request, res: Response) {

    const departmentScheduleId = Number(req.params.id);
    if (!departmentScheduleId) {
        customThrowError(400, "Invalid department schedule ID");
    }

    const timeZone = 'Asia/Manila';
    const body = {
        role: req.body.role,
        name: req.body.name,
        scheduleType: req.body.scheduleType,
        startTime: toZonedTime(req.body.startTime, timeZone),
        endTime: toZonedTime(req.body.endTime, timeZone),
        limitWorkHoursDay: req.body.limitWorkHoursDay,
        allowedOvertime: req.body.allowedOvertime,
        // lunchStartTime: toZonedTime(req.body.lunchStartTime, timeZone),
        // lunchEndTime: toZonedTime(req.body.lunchEndTime, timeZone),
    };

    validateUpdateRoleSchedule(body);

    const deptSchedule = await prisma.departmentSchedule.findUnique({
        where: { id: departmentScheduleId },
    });

    if (!deptSchedule || !deptSchedule.scheduleId) {
        return customThrowError(404, "Schedule not found");
    }

    const schedule = await prisma.schedule.findUnique({
        where: { id: deptSchedule.scheduleId },
    });

    if (!schedule) {
        return customThrowError(404, "Schedule not found");
    }

    const startTime = toZonedTime(req.body.startTime, timeZone);
    const endTime = toZonedTime(req.body.endTime, timeZone);
    const lunchStartTime = toZonedTime(req.body.lunchStartTime, timeZone);
    const lunchEndTime = toZonedTime(req.body.lunchEndTime, timeZone);

    // validate schedule
    if (startTime >= endTime) {
        customThrowError(400, "Start time must be before end time");
    } else if (lunchStartTime <= startTime || lunchStartTime >= endTime) {
        customThrowError(400, "Lunch start time must be between start time and end time");
    } else if (lunchEndTime <= lunchStartTime || lunchEndTime >= endTime) {
        customThrowError(400, "Lunch end time must be between lunch start time and end time");
    }

    await prisma.departmentSchedule.update({
        where: { id: departmentScheduleId },
        data: {
            role: String(body.role).toUpperCase() ?? deptSchedule.role,
            name: body.name ?? deptSchedule.name,
            Schedule: {
                update: {
                    scheduleType: body.scheduleType ?? schedule.scheduleType,
                    startTime: body.startTime ?? schedule.startTime,
                    endTime: body.endTime ?? schedule.endTime,
                    limitWorkHoursDay: body.limitWorkHoursDay ?? schedule.limitWorkHoursDay,
                    allowedOvertime: body.allowedOvertime ?? schedule.allowedOvertime,
                    // lunchStartTime: body.lunchStartTime ?? schedule.lunchStartTime,
                    // lunchEndTime: body.lunchEndTime ?? schedule.lunchEndTime,
                },
            },
        },
    });

    res.status(201).send("Schedule updated successfully");
}


// DELETE /department-schedule/:id
async function removeScheduleFromDepartment(req: Request, res: Response) {
    const departmentScheduleId = Number(req.params.id);
    if (!departmentScheduleId) {
        customThrowError(400, "Invalid department schedule ID");
    }

    const existingDepartmentSchedule = await prisma.departmentSchedule.findUnique({
        where: { id: departmentScheduleId },
    });

    if (!existingDepartmentSchedule) {
        return customThrowError(404, "Department schedule not found");
    }

    const schedule = await prisma.schedule.findFirst({
        where: { id: existingDepartmentSchedule.scheduleId }
    });

    if (!schedule) {
        return customThrowError(404, "Schedule not found");
    }

    // delete schedule
    await prisma.schedule.delete({
        where: { id: schedule.id },
    });

    res.status(200).send("Department schedule removed successfully");
}

export default {
    getAllDepartmentSchedules,
    getDepartmentScheduleById,
    createDepartmentSchedule,
    updateDepartmentSchedule,
    removeScheduleFromDepartment,
};

