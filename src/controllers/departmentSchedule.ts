import { prisma } from '../config/database';
import { raiseHttpError } from '../middlewares/errorHandler';
import { validateCreateRoleSchedule } from '../validation/schedule.validation';
import { validateUpdateRoleSchedule } from '../validation/scheduleUpdate.validation';
import { Request, Response } from 'express';
import { initializeHourTimeZone } from '../utils/date';
import { isAfter } from 'date-fns';
import { DepartmentScheduleService } from '../services/departmentSchedule.service';
import { io } from '..';

// GET /department-schedule
async function getAllDepartmentSchedules(req: Request, res: Response) {
    const departmentId = Number(req.query.departmentId);

    let departmentSchedules;
    if (departmentId) {
        if (isNaN(departmentId)) {
            return raiseHttpError(400, 'Department ID is invalid');
        }
        departmentSchedules = await DepartmentScheduleService.findManyDepartmentSchedules(departmentId);
    } else {
        departmentSchedules = await DepartmentScheduleService.findManyDepartmentSchedules();
    }

    res.status(200).send(departmentSchedules);
}

// GET /department-schedule/:id
async function getDepartmentScheduleById(req: Request, res: Response) {
    const departmentScheduleId = Number(req.params.id);
    if (!departmentScheduleId) {
        raiseHttpError(400, "Invalid department attendance ID");
    }

    const existingDepartmentSchedule = await DepartmentScheduleService.findDepartmentScheduleById(departmentScheduleId);

    if (!existingDepartmentSchedule) {
        raiseHttpError(404, "Solo schedule not found");
        return;
    }

    res.status(200).send(existingDepartmentSchedule);
}

// POST /department-schedule
async function createDepartmentSchedule(req: Request, res: Response) {
    const departmentId = Number(req.body.departmentId) || -1;
    const department = await DepartmentScheduleService.findDepartmentById(departmentId);

    if (!department) {
        raiseHttpError(404, "Department not found");
    }

    const startTime = initializeHourTimeZone(req.body.startTime);
    const endTime = initializeHourTimeZone(req.body.endTime);

    if (isAfter(startTime, endTime)) {
        raiseHttpError(400, "Start time must be before end time");
    }

    validateCreateRoleSchedule({
        departmentId: departmentId,
        name: req.body.name,
        role: req.body.role,
        scheduleType: req.body.scheduleType,
        startTime: startTime,
        endTime: endTime,
    });

    const schedule = await DepartmentScheduleService.createSchedule({
        scheduleType: req.body.scheduleType,
        startTime: startTime,
        endTime: endTime,
    });

    const departmentSchedule = await DepartmentScheduleService.createDepartmentSchedule({
        name: req.body.name,
        departmentId: departmentId,
        scheduleId: schedule.id,
        role: String(req.body.role).toUpperCase(),
    });

    io.emit('department-schedule');
    res.status(201).send(departmentSchedule);
}

// PUT /department-schedule/:id
async function updateDepartmentSchedule(req: Request, res: Response) {
    const departmentScheduleId = Number(req.params.id);
    if (!departmentScheduleId) {
        raiseHttpError(400, "Invalid department schedule ID");
    }

    const startTime = initializeHourTimeZone(req.body.startTime);
    const endTime = initializeHourTimeZone(req.body.endTime);

    const body = {
        role: String(req.body.role).toUpperCase(),
        name: req.body.name,
        scheduleType: req.body.scheduleType,
        startTime: startTime,
        endTime: endTime,
    };

    validateUpdateRoleSchedule(body);

    const existingDepartmentSchedule = await DepartmentScheduleService.findUniqueDepartmentSchedule(departmentScheduleId);

    if (!existingDepartmentSchedule || !existingDepartmentSchedule.scheduleId) {
        return raiseHttpError(404, "Schedule not found");
    }

    const schedule = await DepartmentScheduleService.findUniqueSchedule(existingDepartmentSchedule.scheduleId);

    if (!schedule) {
        return raiseHttpError(404, "Schedule not found");
    }

    if (startTime >= endTime) {
        raiseHttpError(400, "Start time must be before end time");
    }

    await DepartmentScheduleService.updateDepartmentSchedule(departmentScheduleId, {
        ...existingDepartmentSchedule, ...body,
    });

    io.emit('department-schedule');
    res.status(201).send("Schedule updated successfully");
}

// DELETE /department-schedule/:id
async function removeScheduleFromDepartment(req: Request, res: Response) {
    const departmentScheduleId = Number(req.params.id);
    if (!departmentScheduleId) {
        raiseHttpError(400, "Invalid department schedule ID");
    }

    const existingDepartmentSchedule = await DepartmentScheduleService.findUniqueDepartmentSchedule(departmentScheduleId);

    if (!existingDepartmentSchedule) {
        return raiseHttpError(404, "Department schedule not found");
    }

    const schedule = await DepartmentScheduleService.findUniqueSchedule(existingDepartmentSchedule.scheduleId);

    if (!schedule) {
        return raiseHttpError(404, "Schedule not found");
    }

    await DepartmentScheduleService.deleteSchedule(schedule.id);

    io.emit('department-schedule');
    res.status(200).send("Department schedule removed successfully");
}

export default {
    getAllDepartmentSchedules,
    getDepartmentScheduleById,
    createDepartmentSchedule,
    updateDepartmentSchedule,
    removeScheduleFromDepartment,
};
