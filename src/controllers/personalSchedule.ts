import { initializeHourTimeZone } from '../utils/date';
import { raiseHttpError } from '../middlewares/errorHandler';
import { validateCreatePersonalSchedule } from '../validation/schedule.validation';
import { Request, Response } from 'express';
import { isAfter } from 'date-fns';
import { validateUpdatePersonalSchedule } from '../validation/scheduleUpdate.validation';
import PersonalScheduleService from '../services/personalSchedule.service';
import EmployeeService from '../services/employee.service';
import { io } from '..';

export const PersonalScheduleController = {
    // GET /personal-schedule
    async getAllPersonalSchedules(req: Request, res: Response) {
        const personalSchedules = await PersonalScheduleService.getAllPersonalSchedules();
        res.status(200).send(personalSchedules);
    },

    // GET /personal-schedule/:id
    async getPersonalScheduleById(req: Request, res: Response) {
        const personalScheduleId = Number(req.params.id);
        if (!personalScheduleId) {
            throw raiseHttpError(400, "Invalid personal schedule ID");
        }

        const existingPersonalSchedule = await PersonalScheduleService.findPersonalScheduleById(personalScheduleId);

        if (!existingPersonalSchedule) {
            throw raiseHttpError(404, "Personal schedule not found");
        }

        return res.status(200).send(existingPersonalSchedule);
    },

    // POST /personal-schedule
    async createPersonalSchedule(req: Request, res: Response) {
        const employeeId = Number(req.body.employeeId);
        if (!employeeId) {
            throw raiseHttpError(400, "Invalid employee ID");
        }

        const employee = await EmployeeService.getEmployeeById(employeeId);

        if (!employee) {
            throw raiseHttpError(404, "Employee not found");
        }

        const existingPersonalSchedule = await PersonalScheduleService.findPersonalScheduleByEmployeeId(employeeId);
        if (existingPersonalSchedule) {
            throw raiseHttpError(400, "Employee already has a personal schedule");
        }

        const startTime = initializeHourTimeZone(req.body.startTime);
        const endTime = initializeHourTimeZone(req.body.endTime);

        // validate schedule
        if (isAfter(startTime, endTime)) {
            throw raiseHttpError(400, "Start time must be before end time");
        }

        const body = {
            employeeId: Number(req.body.employeeId),
            name: req.body.name,
            scheduleType: req.body.scheduleType,
            startTime: startTime,
            endTime: endTime,
            day: req.body.day,
        };

        validateCreatePersonalSchedule(body);

        const existingEmployee = await EmployeeService.getEmployeeById(body.employeeId);
        if (!existingEmployee) {
            throw raiseHttpError(404, "Employee not found");
        }

        // validate request body of days
        if (!Array.isArray(req.body.day)) {
            throw raiseHttpError(400, "Invalid list of days");
        }

        if (req.body.day.length === 0) {
            throw raiseHttpError(400, "List of days is empty");
        }

        const days = body.day;
        const daysOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
        for (const day of days) {
            if (!daysOfWeek.includes(day)) {
                throw raiseHttpError(400, "Invalid day in days array");
            }
        }

        const personalSchedule = await PersonalScheduleService.createPersonalSchedule({ ...body });
        io.emit('personal-schedule');
        res.status(201).send(personalSchedule);
    },

    // PUT /personal-schedule/:id
    async updatePersonalSchedule(req: Request, res: Response) {
        const personalScheduleId = Number(req.params.id);
        if (!personalScheduleId) {
            throw raiseHttpError(400, "Invalid personal schedule ID");
        }

        const existingPersonalSchedule = await PersonalScheduleService.findPersonalScheduleById(personalScheduleId);
        if (!existingPersonalSchedule) {
            return raiseHttpError(404, "Personal schedule not found");
        }

        const startTime = initializeHourTimeZone(req.body.startTime);
        const endTime = initializeHourTimeZone(req.body.endTime);
        // validate schedule
        if (startTime >= endTime) {
            throw raiseHttpError(400, "Start time must be before end time");
        }

        const body = {
            employeeId: Number(req.body.employeeId),
            name: req.body.name,
            scheduleType: req.body.scheduleType,
            startTime: startTime,
            endTime: endTime,
            day: req.body.day,
        };

        validateUpdatePersonalSchedule(body);
        const existingEmployee = await EmployeeService.getEmployeeById(body.employeeId);
        if (!existingEmployee) {
            throw raiseHttpError(404, "Employee not found");
        }


        if (!Array.isArray(body.day)) {
            throw raiseHttpError(400, "Days must be an array");
        }

        if (body.day.length === 0) {
            throw raiseHttpError(400, "Days must not be empty");
        }

        const days = body.day;
        const daysOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
        const invalidDays = days.filter(day => !daysOfWeek.includes(day));
        if (invalidDays.length > 0) {
            throw raiseHttpError(400, `Invalid days found: ${invalidDays.join(', ')}`);
        }


        const updatedData = { ...existingPersonalSchedule, ...body };
        await PersonalScheduleService.updatePersonalSchedule(personalScheduleId, updatedData);
        return res.status(201).send(`Personal schedule of ${updatedData.name} has been updated`);
    },

    // DELETE /personal-schedule/:id
    async removePersonalSchedule(req: Request, res: Response) {
        const personalScheduleId = Number(req.params.id);
        if (!personalScheduleId) {
            throw raiseHttpError(400, "Invalid personal schedule ID");
        }

        const existingPersonalSchedule = await PersonalScheduleService.findPersonalScheduleById(personalScheduleId);
        if (!existingPersonalSchedule) {
            throw raiseHttpError(404, "Personal schedule not found");
        }

        const schedule = await PersonalScheduleService.findPersonalScheduleById(personalScheduleId);

        if (!schedule) {
            throw raiseHttpError(404, "Schedule not found");
        }

        await PersonalScheduleService.deleteSchedule(personalScheduleId);
        io.emit('personal-schedule');
        return res.status(200).send(`Personal schedule of ${schedule.name} has been deleted`);
    }
};

