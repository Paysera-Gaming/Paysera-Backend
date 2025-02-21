import { Request, Response } from 'express';
import { validateCreateAttendance, validateUpdateAttendance } from '../validation/attendance.validation';
import { raiseHttpError } from '../middlewares/errorHandler';
import { parseISO, format, differenceInMinutes, isAfter, set, getHours, getMinutes, getSeconds } from 'date-fns';
import { initializeDateTimeZone } from '../utils/date';
import { io } from '../index';
import { AttendanceService } from '../services/attendance.service';

const DEFAULT_OVERTIME_LIMIT = 4;

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

        const attendance = await AttendanceService.getAttendanceById(attendanceId);
        res.status(200).send(attendance);
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
            date: initializeDateTimeZone(parseISO(req.body.date), timeZone),
            status: req.body.status,
            scheduleType: req.body.scheduleType,
            timeIn: initializeDateTimeZone(parseISO(req.body.timeIn), timeZone),
            timeOut: initializeDateTimeZone(parseISO(req.body.timeOut), timeZone),
            overtimeTotal: req.body.overtimeTotal,
        };

        validateCreateAttendance(body);

        const data = {
            employeeId: body.employeeId,
            date: format(body.date, 'yyyy-MM-dd'),
            status: body.status,
            scheduleType: body.scheduleType,
            timeIn: body.timeIn,
            timeOut: body.timeOut,
            overtimeTotal: body.overtimeTotal,
            timeHoursWorked: 0,
            timeTotal: 0,
            lunchTimeTotal: 1,
        };

        if (body.status === "PAID_LEAVE") {
            data.timeTotal = 9;
            data.timeHoursWorked = 8;
        }

        await AttendanceService.createAttendance(data);

        io.emit('attendance');
        res.status(201).send("Attendance record created successfully");
    },

    async updateAttendance(req: Request, res: Response) {
        const attendanceId = Number(req.params.id);
        if (isNaN(attendanceId)) {
            throw raiseHttpError(400, "Invalid attendance ID");
        }

        const body = {
            employeeId: req.body.employeeId,
            date: initializeDateTimeZone(req.body.date),
            status: req.body.status,
            timeIn: initializeDateTimeZone(req.body.timeIn),
            timeOut: initializeDateTimeZone(req.body.timeOut),
            overtimeTotal: req.body.overTimeTotal,
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
        };

        await AttendanceService.updateAttendance(attendanceId, data);

        io.emit('attendance');
        res.status(200).send("Attendance record updated successfully");
    },

    async updateAttendanceByEmployeeId(req: Request, res: Response) {
        const employeeId = Number(req.params.id);
        if (isNaN(employeeId)) {
            throw raiseHttpError(400, "Invalid employee ID");
        }

        const isValid = validateUpdateAttendance(req.body);

        if (!isValid) {
            throw raiseHttpError(400, "Invalid input");
        }

        let totalHours = 0;
        let totalHoursWorked = 0;
        let totalLunchHours = 1;

        if (req.body.timeOut && req.body.lunchTimeOut) {
            totalHours = (req.body.timeOut.getTime() - req.body.timeIn.getTime()) / 1000 / 60 / 60;
            totalLunchHours = (req.body.lunchTimeOut.getTime() - req.body.lunchTimeIn.getTime()) / 1000 / 60 / 60;
            totalHoursWorked = totalHours - totalLunchHours;
        }

        const data = {
            status: req.body.status,
            timeOut: req.body.timeOut,
            timeHoursWorked: totalHours,
            overtimeTotal: req.body.overTimeTotal,
            timeTotal: totalHours,
        };

        await AttendanceService.updateAttendanceByEmployeeId(employeeId, data);

        io.emit('attendance');
        res.status(200).send("Attendance record updated successfully");
    },

    async deleteAttendance(req: Request, res: Response) {
        const attendanceId = Number(req.params.id);

        if (isNaN(attendanceId)) {
            throw raiseHttpError(400, "Invalid attendance ID");
        }

        await AttendanceService.deleteAttendance(attendanceId);

        io.emit('attendance');
        res.status(200).send("Attendance record deleted successfully");
    }
};

