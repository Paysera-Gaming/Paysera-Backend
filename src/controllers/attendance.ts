import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { validateCreateAttendance, validateUpdateAttendance } from '../validate/attendance.validation';
import { customThrowError } from '../middlewares/errorHandler';
import { parseISO, format, differenceInMinutes, isAfter, set, getHours, getMinutes, getSeconds } from 'date-fns';
import { initializeDateTimeZone } from '../utils/date';
import { io } from '../index';

const DEFAULT_OVERTIME_LIMIT = 4;

async function getAllAttendance(req: Request, res: Response) {
    const allAttendance = await prisma.attendance.findMany({
        orderBy: {
            createdAt: 'asc'
        },
        include: {
            employee: {
                select: {
                    id: true,
                    username: true,
                    firstName: true,
                    lastName: true,
                    middleName: true,
                    role: true,
                    accessLevel: true,
                    isActive: true,
                }
            }
        }
    });

    res.status(200).send(allAttendance);
}


async function getAttendanceById(req: Request, res: Response) {
    const attendanceId = Number(req.params.id);
    if (isNaN(attendanceId)) {
        customThrowError(400, "Invalid employee ID");
    }

    const attendance = await prisma.attendance.findUnique({
        where: { id: attendanceId },
        include: {
            employee: {
                select: {
                    id: true,
                    username: true,
                    firstName: true,
                    lastName: true,
                    middleName: true,
                    role: true,
                    accessLevel: true,
                    isActive: true,
                }
            }
        }
    });

    res.status(200).send(attendance);
}

async function getAttendanceByEmployeeId(req: Request, res: Response) {
    const employeeId = Number(req.params.id);
    if (isNaN(employeeId)) {
        customThrowError(400, "Invalid employee ID");
    }

    const employeeExists = await prisma.employee.findUnique({
        where: { id: employeeId },
    });

    if (!employeeExists) {
        customThrowError(404, "Employee not found");
    }

    const employeeAttendance = await prisma.attendance.findMany({
        where: { employeeId: employeeId },
        orderBy: {
            date: 'asc',
        },
    });

    res.status(200).send(employeeAttendance);
}

async function createAttendance(req: Request, res: Response) {
    const timeZone = 'Asia/Manila';

    const body = {
        employeeId: req.body.employeeId,
        date: initializeDateTimeZone(parseISO(req.body.date), timeZone),
        status: req.body.status,
        scheduleType: req.body.scheduleType,
        timeIn: initializeDateTimeZone(parseISO(req.body.timeIn), timeZone),
        timeOut: initializeDateTimeZone(parseISO(req.body.timeOut), timeZone),
        // lunchTimeIn: toZonedTime(parseISO(req.body.lunchTimeIn), timeZone),
        // lunchTimeOut: toZonedTime(parseISO(req.body.lunchTimeOut), timeZone),
        overtimeTotal: req.body.overtimeTotal,
    };

    validateCreateAttendance(body);

    const employeeExists = await prisma.employee.findUnique({
        where: { id: body.employeeId },
    });

    if (!employeeExists) {
        customThrowError(404, 'Employee not found');
    }

    const currentAttendance = await prisma.attendance.findFirst({
        where: {
            employeeId: body.employeeId,
            date: format(body.date, 'yyyy-MM-dd'), // Adjust date format as needed
        },
    });

    if (currentAttendance) {
        customThrowError(400, 'Attendance for that day already exists');
    }

    let totalHours = 0;
    let totalHoursWorked = 0;
    let totalLunchHours = 1;

    if (body.status === "PAID_LEAVE") {
        totalHours = 9;
        totalHoursWorked = 8;
    }

    await prisma.attendance.create({
        data: {
            employeeId: body.employeeId,
            date: format(body.date, 'yyyy-MM-dd'), // Adjust date format as needed
            status: body.status,
            scheduleType: body.scheduleType,
            timeIn: body.timeIn,
            timeOut: body.timeOut,
            // lunchTimeIn: body.lunchTimeIn,
            // lunchTimeOut: body.lunchTimeOut,
            overTimeTotal: body.overtimeTotal,
            timeHoursWorked: totalHoursWorked,
            timeTotal: totalHours,
            lunchTimeTotal: totalLunchHours,
        },
    });

    io.emit('attendance');
    res.status(201).send("Attendance record created successfully");
}

async function updateAttendance(req: Request, res: Response) {
    const attendanceId = Number(req.params.id);
    if (isNaN(attendanceId)) {
        customThrowError(400, "Invalid attendance ID");
    }

    const body = {
        employeeId: req.body.employeeId,
        date: initializeDateTimeZone(req.body.date),
        status: req.body.status,
        timeIn: initializeDateTimeZone(req.body.timeIn),
        timeOut: initializeDateTimeZone(req.body.timeOut),
        overTimeTotal: req.body.overTimeTotal,
    }

    validateUpdateAttendance(body);

    const currentAttendance = await prisma.attendance.findUnique({
        where: { id: attendanceId },
    });

    if (!currentAttendance) {
        return customThrowError(404, 'Attendance record not found');
    }

    // calculate total hours worked
    let totalHours = differenceInMinutes(body.timeOut, body.timeIn);
    let totalHoursWorked = totalHours / 60;
    let overtimeTotal = 0;

    // calculate overtime
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

    if (currentAttendance.isAllowedOvertime) {
        const totalMinutesWorked = differenceInMinutes(body.timeOut, body.timeIn);
        const totalMinutesWithLunchMinus = totalMinutesWorked > 60 ? totalMinutesWorked - 60 : totalMinutesWorked;
        totalHoursWorked = totalMinutesWithLunchMinus / 60;

        // calculate overtime
        overtimeTotal = totalHoursWorked > 8 ? totalHoursWorked - 8 : 0;

        // limit overtime to 4 hours
        overtimeTotal = Math.min(overtimeTotal, currentAttendance.limitOvertime || DEFAULT_OVERTIME_LIMIT);
    }

    await prisma.attendance.update({
        where: { id: attendanceId },
        data: {
            date: format(body.date, 'yyyy-MM-dd'), // Adjust date format as needed
            status: body.status ?? currentAttendance.status,
            timeOut: body.timeOut ?? currentAttendance.timeOut,
            timeIn: body.timeIn ?? currentAttendance.timeIn,
            timeTotal: totalHoursWorked || currentAttendance.timeTotal,
            overTimeTotal: overtimeTotal ?? currentAttendance.overTimeTotal,
            timeHoursWorked: totalHoursWorked || currentAttendance.timeHoursWorked,
            // lunchTimeIn: body.lunchTimeIn ?? existingAttendance.lunchTimeIn,
            // lunchTimeOut: body.lunchTimeOut ?? existingAttendance.lunchTimeOut,
        },
    });

    io.emit('attendance');
    res.status(200).send("Attendance record updated successfully");
}

async function updateAttendanceByEmployeeId(req: Request, res: Response) {
    const employeeId = Number(req.params.id);
    if (isNaN(employeeId)) {
        customThrowError(400, "Invalid employee ID");
    }

    const isValid = validateUpdateAttendance(req.body);

    if (!isValid) {
        customThrowError(400, "Invalid input");
    }

    const existingAttendance = await prisma.attendance.findFirst({
        where: { employeeId: employeeId },
    });

    if (!existingAttendance) {
        customThrowError(404, "Attendance record not found for this employee");
        return;
    }

    let totalHours = 0;
    let totalHoursWorked = 0;
    let totalLunchHours = 1;

    if (req.body.timeOut && req.body.lunchTimeOut) {
        totalHours = (req.body.timeOut.getTime() - req.body.timeIn.getTime()) / 1000 / 60 / 60;
        totalLunchHours = (req.body.lunchTimeOut.getTime() - req.body.lunchTimeIn.getTime()) / 1000 / 60 / 60;
        totalHoursWorked = totalHours - totalLunchHours;
    }

    await prisma.attendance.update({
        where: {
            id: existingAttendance.id,
            employeeId: employeeId,
        },
        data: {
            status: req.body.status ?? existingAttendance.status,
            timeOut: req.body.timeOut ?? existingAttendance.timeOut,
            timeHoursWorked: totalHours ?? existingAttendance.timeHoursWorked,
            overTimeTotal: req.body.overTimeTotal ?? existingAttendance.overTimeTotal,
            timeTotal: totalHours ?? existingAttendance.timeTotal,
            // lunchTimeOut: req.body.lunchTimeOut ?? existingAttendance.lunchTimeOut,
            // lunchTimeTotal: totalHoursWorked ?? existingAttendance.lunchTimeTotal,
        },
    });

    io.emit('attendance');
    res.status(200).send("Attendance record updated successfully");
}

async function deleteAttendance(req: Request, res: Response) {
    const attendanceId = Number(req.params.id);

    if (isNaN(attendanceId)) {
        customThrowError(400, "Invalid attendance ID");
    }

    const existingAttendance = await prisma.attendance.findUnique({
        where: { id: attendanceId },
    });

    if (!existingAttendance) {
        customThrowError(404, "Attendance record not found");
    }

    await prisma.attendance.delete({
        where: { id: attendanceId },
    });

    io.emit('attendance');
    res.status(200).send("Attendance record deleted successfully");
}

export default {
    getAllAttendance,
    getAttendanceById,
    getAttendanceByEmployeeId,
    createAttendance,
    updateAttendance,
    updateAttendanceByEmployeeId,
    deleteAttendance,
};