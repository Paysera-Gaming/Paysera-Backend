import { initializeHourTimeZone } from '../utils/date';
import { raiseHttpError } from '../middlewares/errorHandler';
import { validateCreatePersonalSchedule, validateRequestChangePersonalSchedule } from '../validation/schedule.validation';
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
    async deletePersonalSchedule(req: Request, res: Response) {
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
    },

    async getAllRequestedChangePersonalSchedule(req: Request, res: Response) {
        const requestedChangePersonalSchedule = await PersonalScheduleService.getAllRequestChangeSchedule();
        res.status(200).send(requestedChangePersonalSchedule);
    },

    async getRequestedChangePersonalSchedule(req: Request, res: Response) {
        const requestId = Number(req.params.id);
        if (!requestId) {
            throw raiseHttpError(400, "Invalid request ID");
        }
        const requestedChangePersonalSchedule = await PersonalScheduleService.getRequestChangeScheduleById(requestId);

        if (!requestedChangePersonalSchedule) {
            throw raiseHttpError(404, "Requested change personal schedule not found");
        }
        res.status(200).send(requestedChangePersonalSchedule);
    },

    // REQUEST CHANGE OF PERSONAL SCHEDULE
    async requestChangePersonalSchedule(req: Request, res: Response) {
        const employeeId = Number(req.body.employeeId);
        if (!employeeId) {
            throw raiseHttpError(400, "Invalid employee ID");
        }

        const employee = await EmployeeService.getEmployeeById(employeeId);
        if (!employee) {
            throw raiseHttpError(404, "Employee not found");
        }

        const existingEmployeePersonalSchedule = await PersonalScheduleService.findPersonalScheduleByEmployeeId(employeeId);
        if (!existingEmployeePersonalSchedule) {
            throw raiseHttpError(404, "Employee does not have a personal schedule");
        }

        const body = {
            employeeId: Number(req.body.employeeId),
            scheduleType: req.body.scheduleType,
            day: req.body.day,
            startTime: initializeHourTimeZone(req.body.startTime), endTime: initializeHourTimeZone(req.body.endTime),
            isAllowedOvertime: req.body.isAllowedOvertime,
            reason: req.body.reason,
            limitOvertime: req.body.limitOvertime,
            status: req.body.status || '',
            ...(req.body.startTimeLimit && {
                startTimeLimit: initializeHourTimeZone(req.body.startTimeLimit)
            }),
        };

        validateRequestChangePersonalSchedule(body);
        await PersonalScheduleService.requestChangeSchedule(employeeId, {
            ...body,
            status: 'PENDING'
        });

        io.emit('/personal-schedule/request-change');
        return res.status(200).send(`Change requested for employee ID: ${employeeId} to update personal schedule successfully`);
    },

    async updateRequestedChangePersonalSchedule(req: Request, res: Response) {
        const requestId = Number(req.params.id);
        if (!requestId) {
            throw raiseHttpError(400, "Invalid request ID");
        }

        const existingRequest = await PersonalScheduleService.getRequestChangeScheduleById(requestId);
        if (!existingRequest) {
            throw raiseHttpError(404, "Requested change personal schedule not found");
        }

        const body = {
            employeeId: Number(existingRequest.employeeId),
            scheduleType: existingRequest.scheduleType,
            day: existingRequest.day,
            startTime: initializeHourTimeZone(existingRequest.startTime),
            endTime: initializeHourTimeZone(existingRequest.endTime),
            isAllowedOvertime: existingRequest.isAllowedOvertime,
            reason: existingRequest.reason,
            limitOvertime: existingRequest.limitOvertime,
            status: existingRequest.status,
            ...(req.body.startTimeLimit && {
                startTimeLimit: initializeHourTimeZone(req.body.startTimeLimit)
            }),
            ...(existingRequest.startTimeLimit && {
                startTimeLimit: initializeHourTimeZone(existingRequest.startTimeLimit)
            }),
        };

        const dataUpdate = await PersonalScheduleService.updateRequestChangeSchedule(requestId, { ...existingRequest, ...body });
        console.log(dataUpdate, "sample request change");


        io.emit('/personal-schedule/request-change');
        return res.status(200).send(`Requested change personal schedule has been updated`);
    },

    // apply request change personal schedule to update personal schedule
    async applyRequestedChangePersonalSchedule(req: Request, res: Response) {
        const requestId = Number(req.params.id);
        if (!requestId) {
            throw raiseHttpError(400, "Invalid request ID");
        }

        const existingRequest = await PersonalScheduleService.getRequestChangeScheduleById(requestId);
        if (!existingRequest) {
            throw raiseHttpError(404, "Requested change personal schedule not found");
        }

        const employeeId = Number(existingRequest.employeeId);
        const existingEmployeePersonalSchedule = await PersonalScheduleService.findPersonalScheduleByEmployeeId(employeeId);
        if (!existingEmployeePersonalSchedule) {
            throw raiseHttpError(404, "Employee does not have a personal schedule");
        }

        const body = {
            employeeId: Number(existingRequest.employeeId),
            name: existingEmployeePersonalSchedule.name,
            scheduleType: existingRequest.scheduleType,
            startTime: initializeHourTimeZone(existingRequest.startTime),
            endTime: initializeHourTimeZone(existingRequest.endTime),
            day: existingRequest.day,
            isAllowedOvertime: existingRequest.isAllowedOvertime,
            reason: existingRequest.reason,
            limitOvertime: existingRequest.limitOvertime,
            status: existingRequest.status,
            ...(existingRequest.startTimeLimit && {
                startTimeLimit: initializeHourTimeZone(existingRequest.startTimeLimit)
            }),
            ...(req.body.startTimeLimit && {
                startTimeLimit: initializeHourTimeZone(req.body.startTimeLimit)
            }),
        };

        validateCreatePersonalSchedule(body);
        await PersonalScheduleService.updatePersonalScheduleByEmployeeId(employeeId, { ...body });
        await PersonalScheduleService.deleteRequestChangeSchedule(requestId);
        io.emit('personal-schedule');
        return res.status(200).send(`Personal schedule of employee ID: ${employeeId} has been updated`);
    },

    async deleteRequestedChangePersonalSchedule(req: Request, res: Response) {
        const requestId = Number(req.params.id);
        if (!requestId) {
            throw raiseHttpError(400, "Invalid request ID");
        }

        const existingRequest = await PersonalScheduleService.getRequestChangeScheduleById(requestId);
        if (!existingRequest) {
            throw raiseHttpError(404, "Requested change personal schedule not found");
        }

        await PersonalScheduleService.deleteRequestChangeSchedule(requestId);
        io.emit('/personal-schedule/request-change');
        return res.status(200).send(`Requested change personal schedule has been deleted`);
    }
};

