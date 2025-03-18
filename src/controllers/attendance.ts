import { Request, Response } from 'express';
import { validateCreateAttendance, validateUpdateAttendance } from '../validation/attendance.validation';
import { raiseHttpError } from '../middlewares/errorHandler';
import { format, differenceInMinutes, set, getHours, getMinutes, getSeconds } from 'date-fns';
import { initializeDateTimeZone, initializeHourTimeZone } from '../utils/date';
import { io } from '../index';
import { AttendanceService } from '../services/attendance.service';
import { Attendance } from '@prisma/client';
import { formatDate } from '../utils/time';
import EmployeeService from '../services/employee.service';

export const AttendanceController = {
    async getAllAttendance(req: Request, res: Response) {
        const allAttendance = await AttendanceService.getAllAttendance();
        res.status(200).send(allAttendance);
    },

    async getAttendanceById(req: Request, res: Response) {
        const attendanceId = Number(req.params.id);
        if (isNaN(attendanceId)) {
            throw raiseHttpError(400, "Invalid employee ID");
        }

        const existingAttendance = await AttendanceService.getAttendanceById(attendanceId);
        if (!existingAttendance) {
            throw raiseHttpError(404, "Attendance record not found");
        }

        res.status(200).send(existingAttendance);
    },

    async getAttendanceByEmployeeId(req: Request, res: Response) {
        const employeeId = Number(req.params.id);
        if (isNaN(employeeId)) {
            throw raiseHttpError(400, "Invalid employee ID");
        }

        const employeeAttendance = await AttendanceService.getAttendanceByEmployeeId(employeeId);
        res.status(200).send(employeeAttendance);
    },

    async createAttendance(req: Request, res: Response) {
        const timeZone = 'Asia/Manila';

        const body = {
            employeeId: req.body.employeeId,
            date: initializeDateTimeZone(req.body.date, timeZone),
            status: req.body.status,
            scheduleType: req.body.scheduleType || 'FIXED',
            timeIn: initializeHourTimeZone(req.body.timeIn, timeZone),
            timeOut: initializeHourTimeZone(req.body.timeOut, timeZone),
            overtimeTotal: req.body.overtimeTotal,
            isLate: req.body.isLate === "true" ? true : false,
            requestOverTimeRequest: req.body.requestOverTimeRequest || 'NO_REQUEST',
            RequestLeaveStatus: req.body.RequestLeaveStatus || 'NO_REQUEST',
        };

        validateCreateAttendance(body);
        const existingEmployee = await EmployeeService.getEmployeeById(body.employeeId);
        if (!existingEmployee) {
            throw raiseHttpError(404, "Employee not found");
        }

        console.log(existingEmployee, body.employeeId, "existingEmployee");

        const existingAttendance = await AttendanceService.getAttendanceByDateAndEmployeeId(formatDate(body.date), body.employeeId);
        if (existingAttendance) {
            console.log(existingAttendance, "existingAttendance");

            throw raiseHttpError(400, "Attendance record already exists");
        }

        const createData: Partial<Attendance> = {
            employeeId: body.employeeId,
            date: formatDate(body.date),
            status: body.status,
            scheduleType: body.scheduleType,
            timeIn: body.timeIn,
            timeOut: body.timeOut,
            timeHoursWorked: 0,
            timeTotal: 0,
            lunchTimeTotal: 1,
            isLate: body.isLate,
            RequestLeaveStatus: body.RequestLeaveStatus || 'NO_REQUEST',
            RequestOverTimeStatus: 'NO_REQUEST',
        };

        if (body.status === "PAID_LEAVE") {
            createData.timeTotal = 9;
            createData.timeHoursWorked = 8;
        }

        const data = await AttendanceService.createAttendance(createData);

        io.emit('attendance');
        res.status(201).send(data);

    },
    async updateAttendance(req: Request, res: Response) {
        const attendanceId = Number(req.params.id);
        if (isNaN(attendanceId)) {
            throw raiseHttpError(400, "Invalid attendance ID");
        }

        const existingAttendance = await AttendanceService.getAttendanceById(attendanceId);
        if (!existingAttendance) {
            throw raiseHttpError(404, "Attendance record not found");
        }

        const body = {
            employeeId: req.body.employeeId || existingAttendance.employeeId,
            date: initializeDateTimeZone(req.body.date || existingAttendance.date),
            status: req.body.status || existingAttendance.status,
            timeIn: initializeHourTimeZone(req.body.timeIn || existingAttendance.timeIn),
            timeOut: initializeHourTimeZone(req.body.timeOut || existingAttendance.timeOut!),
            overtimeTotal: req.body.overtimeTotal || existingAttendance.overTimeTotal || 0,
            isLate: req.body.isLate === "true",
            lunchTimeTotal: req.body.lunchTimeTotal || existingAttendance.lunchTimeTotal || 1,
            RequestLeaveStatus: req.body.RequestLeaveStatus || existingAttendance.RequestLeaveStatus,
            RequestOverTimeStatus: req.body.RequestOverTimeStatus || existingAttendance.RequestOverTimeStatus,
        }

        validateUpdateAttendance(body);

        let totalHours = differenceInMinutes(body.timeOut, body.timeIn);
        let totalHoursWorked = totalHours / 60;
        let overtimeTotal = 0;

        if (totalHoursWorked > 8) {
            const timeAfterEightHours = set(body.timeIn, {
                hours: getHours(body.timeIn) + 8,
                minutes: getMinutes(body.timeIn),
                seconds: getSeconds(body.timeIn),
                milliseconds: 0,
            });

            const overtimeMinutes = differenceInMinutes(body.timeOut, timeAfterEightHours);
            overtimeTotal = overtimeMinutes / 60;
            totalHoursWorked = 8;
        }

        const updateData = {
            date: formatDate(body.date),
            status: body.status,
            timeOut: body.timeOut,
            timeIn: body.timeIn,
            timeTotal: totalHoursWorked,
            overtimeTotal: overtimeTotal,
            timeHoursWorked: totalHoursWorked,
            isLate: req.body.isLate || false,
            lunchTimeTotal: body.lunchTimeTotal,
            RequestLeaveStatus: body.RequestLeaveStatus || 'NO_REQUEST',
            RequestOverTimeStatus: body.RequestOverTimeStatus || 'NO_REQUEST',
        };

        const data = await AttendanceService.updateAttendance(attendanceId, updateData);

        io.emit('attendance');
        res.status(200).send(data);
    },

    async updateAttendanceByEmployeeId(req: Request, res: Response) {
        const employeeId = Number(req.params.id);
        if (isNaN(employeeId)) {
            throw raiseHttpError(400, "Invalid employee ID");
        }

        const existingEmployee = await AttendanceService.getAttendanceByEmployeeId(employeeId);
        if (!existingEmployee) {
            throw raiseHttpError(404, "Employee not found");
        }

        const attendanceId = Number(req.params.id);
        if (isNaN(attendanceId)) {
            throw raiseHttpError(400, "Invalid attendance ID");
        }

        const existingAttendance = await AttendanceService.getAttendanceById(attendanceId);
        if (!existingAttendance) {
            throw raiseHttpError(404, "Attendance record not found");
        }


        const body = {
            employeeId: req.body.employeeId || existingAttendance.employeeId,
            date: initializeDateTimeZone(req.body.date || existingAttendance.date),
            status: req.body.status || existingAttendance.status,
            timeIn: initializeDateTimeZone(req.body.timeIn) || initializeDateTimeZone(existingAttendance.timeIn),
            timeOut: initializeDateTimeZone(req.body.timeOut) || initializeDateTimeZone(existingAttendance.timeOut!),
            overtimeTotal: req.body.overTimeTotal || existingAttendance.overTimeTotal || 0,
            isLate: req.body.isLate === "true",
            lunchTimeTotal: req.body.lunchTimeTotal || existingAttendance.lunchTimeTotal || 1,
            RequestLeaveStatus: req.body.RequestLeaveStatus || existingAttendance.RequestLeaveStatus,
            RequestOverTimeStatus: req.body.RequestOverTimeStatus || existingAttendance.RequestOverTimeStatus,
        }

        validateUpdateAttendance(body);

        let totalHours = differenceInMinutes(body.timeOut, body.timeIn);
        let totalHoursWorked = totalHours / 60;
        let overtimeTotal = 0;

        if (totalHoursWorked > 8) {
            const timeAfterEightHours = set(body.timeIn, {
                hours: getHours(body.timeIn) + 8,
                minutes: getMinutes(body.timeIn),
                seconds: getSeconds(body.timeIn),
                milliseconds: 0,
            });

            const overtimeMinutes = differenceInMinutes(body.timeOut, timeAfterEightHours);
            overtimeTotal = overtimeMinutes / 60;
            totalHoursWorked = 8;
        }

        const data = {
            date: format(body.date, 'yyyy-MM-dd'),
            status: body.status,
            timeOut: body.timeOut,
            timeIn: body.timeIn,
            timeTotal: totalHoursWorked,
            overtimeTotal: overtimeTotal,
            timeHoursWorked: totalHoursWorked,
            isLate: req.body.isLate || false,
            lunchTimeTotal: body.lunchTimeTotal || 1,
            RequestLeaveStatus: body.RequestLeaveStatus || 'NO_REQUEST',
            RequestOverTimeStatus: body.RequestOverTimeStatus || 'NO_REQUEST',
        };

        await AttendanceService.updateAttendance(attendanceId, data);
        io.emit('attendance');
        res.status(200).send("Attendance record updated successfully");
    },

    async deleteAttendance(req: Request, res: Response) {
        const attendanceId = Number(req.params.id);

        if (isNaN(attendanceId)) {
            throw raiseHttpError(400, "Invalid attendance ID");
        }

        const existingAttendance = await AttendanceService.getAttendanceById(attendanceId);
        if (!existingAttendance) {
            throw raiseHttpError(404, "Attendance record not found");
        }

        await AttendanceService.deleteAttendance(attendanceId);

        io.emit('attendance');
        res.status(200).send("Attendance record deleted successfully");
    },
};

