import { differenceInMinutes, format, getHours, getMinutes, isAfter, isBefore, isWithinInterval, parseISO, set } from 'date-fns';
import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { raiseHttpError } from '../middlewares/errorHandler';
import { initializeDateTimeZone, initializeHourTimeZone, printDate, returnFormatDate } from '../utils/date';
import { Day, Month, Schedule } from '@prisma/client';
import { TZDate } from '@date-fns/tz';
import { formatDate } from '../utils/time';

const timeZone = 'Asia/Manila';
const DEFAULT_OVERTIME_LIMIT = 4;

// POST /api / attendance / time-in
async function timeIn(req: Request, res: Response) {
    if (!req.body.employeeId) {
        return raiseHttpError(400, 'Employee ID is required');
    }

    if (!req.body.timeStamp) {
        return raiseHttpError(400, 'Time stamp is required');
    }

    const body = {
        employeeId: Number(req.body.employeeId),
        timeIn: initializeDateTimeZone(req.body.timeStamp),
    };

    // Validate input
    if (!body.employeeId || isNaN(body.timeIn.getTime())) {
        return raiseHttpError(400, 'Invalid time in');
    }

    // Check if the employee exists
    const currentEmployee = await prisma.employee.findUnique({
        where: { id: body.employeeId },
        include: {
            PersonalSchedule: {
                include: {
                    Schedule: true,
                },
            },
        },
    });

    // Check if the employee has already clocked in today
    const currentAttendance = await prisma.attendance.findFirst({
        where: {
            employeeId: body.employeeId,
            date: formatDate(body.timeIn),
        },
    });

    if (!currentEmployee) {
        return raiseHttpError(404, 'Employee not found');
    } else if ((!currentEmployee.role || !currentEmployee.departmentId) && currentEmployee.accessLevel !== "ADMIN") {
        return raiseHttpError(400, 'Employee is not assigned to a department');
    } else if (currentAttendance) {
        // Update the existing attendance record if it is still ongoing
        if (currentAttendance.status === 'ONGOING') {
            return raiseHttpError(400, 'Time currently ongoing');
        }

        await prisma.attendance.update({
            where: { id: currentAttendance.id },
            data: {
                status: 'ONGOING',
                timeOut: null,
                timeHoursWorked: 0,
                overTimeTotal: 0,
                timeTotal: 0,
            },
        });

        return res.status(200).send('Attendance record updated clock in again');
        // return customThrowError(400, 'Already clocked in');
    } else if (currentEmployee.accessLevel === "ADMIN") {
        // Create a new attendance record with the formatted date
        await prisma.attendance.create({
            data: {
                employeeId: body.employeeId,
                date: formatDate(body.timeIn), // Format date for the record
                status: 'ONGOING',
                scheduleType: "SUPER_FLEXI",
                timeIn: body.timeIn,
            },
        });

        // Update the employee's active status
        await prisma.employee.update({
            where: { id: body.employeeId },
            data: { isActive: true },
        });

        return res.status(200).send('Attendance record successfully created' + format(body.timeIn, 'MMMM d, yyyy'));
    }

    // Retrieve the employee's schedule based on role and department
    const currentDepartmentSchedule = await prisma.departmentSchedule.findFirst({
        where: {
            role: currentEmployee.role || undefined,
            departmentId: currentEmployee.departmentId || undefined,
        },
        select: {
            Schedule: true,
        },
    });

    // Get the schedule of the employee checking if it is a department schedule or personal schedule
    const currentSchedule = currentEmployee.PersonalSchedule?.Schedule || currentDepartmentSchedule?.Schedule;
    const isDepartmentSchedule = !currentEmployee.PersonalSchedule?.Schedule && currentDepartmentSchedule?.Schedule;

    if (!currentSchedule) {
        return raiseHttpError(400, 'Employee schedule not found');
    }

    //Check if the current day is holiday
    const month = format(body.timeIn, 'MMMM');
    const day = format(body.timeIn, 'd');
    let holiday = await prisma.holiday.findFirst({
        where: {
            month: month.toUpperCase() as Month,
            day: Number(day),
        },
    });

    if (holiday) {
        return raiseHttpError(400, 'Time in on a holiday is not allowed');
    }

    // if weekend don't allow time in in department schedule unless environment is testing
    const currentDay = format(initializeDateTimeZone(body.timeIn), 'EEEE').toUpperCase();
    if (isDepartmentSchedule && (currentDay === 'SATURDAY' || currentDay === 'SUNDAY')) {
        return raiseHttpError(400, 'Weekend not allowed to time in');
    } else {
        // Check if the day is included in the employee's personal schedule
        const listOfDays = currentEmployee.PersonalSchedule?.day as Day[];
        if (listOfDays) {
            if (!listOfDays.includes(currentDay as Day)) {
                return raiseHttpError(400, 'Day not allowed to time in');
            }
        }
    }

    const timeIn = initializeHourTimeZone(body.timeIn);
    const scheduledEndTime = initializeHourTimeZone(currentSchedule.endTime);
    const scheduledStartTime = initializeHourTimeZone(currentSchedule.startTime);

    // Check if fixed schedule and time in exceeds the schedule end time
    if (currentSchedule.scheduleType === 'FIXED' && isAfter(timeIn, scheduledEndTime)) {
        return raiseHttpError(400, 'Time in exceeds the schedule end time');
    }

    // Check if fixed schedule and time in is earlier than the scheduled start time
    if (currentSchedule.scheduleType === 'FIXED' && isBefore(timeIn, scheduledStartTime)) {
        return raiseHttpError(400, 'Time in is earlier than the scheduled start time');
    } else if (currentSchedule.scheduleType === 'FLEXI' && isBefore(timeIn, scheduledStartTime)) {
        return raiseHttpError(400, 'Time in is earlier than the allowed start time for flexible schedule');
    }

    // Check if department schedule is flexible and time in is within the allowed time in range
    if (currentSchedule.scheduleType === 'FLEXI') {
        // Default allowed time in range is 6:00 AM to 10:00 AM
        const startAllowed = currentSchedule.startTime
            ? initializeHourTimeZone(currentSchedule.startTime, timeZone)
            : initializeHourTimeZone(parseISO('1970-01-01T06:00:00'), timeZone);

        const endAllowed = currentSchedule.startTimeLimit
            ? initializeHourTimeZone(currentSchedule.startTimeLimit, timeZone)
            : initializeHourTimeZone(parseISO('1970-01-01T10:00:00'), timeZone);

        // Check if time in is within the allowed time in range
        if (!isWithinInterval(timeIn, { start: startAllowed, end: endAllowed })) {
            return raiseHttpError(400, 'Time in is not within the allowed time in range');
        }
    }

    let effectiveTimeIn = timeIn;


    // If the schedule is fixed and the time in is earlier than the scheduled start time, use the scheduled start time
    if (currentSchedule.scheduleType === 'FIXED' && isBefore(timeIn, scheduledStartTime)) {
        effectiveTimeIn = scheduledStartTime;
    }

    // Create a new attendance record with the formatted date
    await prisma.attendance.create({
        data: {
            employeeId: body.employeeId,
            date: formatDate(body.timeIn), // Format date for the record
            status: 'ONGOING',
            scheduleType: currentSchedule.scheduleType,
            timeIn: effectiveTimeIn,
            isAllowedOvertime: true,
        },
    });

    // Update the employee's active status
    await prisma.employee.update({
        where: { id: body.employeeId },
        data: { isActive: true },
    });

    return res.status(200).send('Attendance record successfully created' + format(effectiveTimeIn, 'MMMM d, yyyy'));

}

// POST /api/attendance/time-out
async function timeOut(req: Request, res: Response) {
    if (!req.body.employeeId) {
        return raiseHttpError(400, 'Employee ID is required');
    }
    if (!req.body.timeStamp) {
        return raiseHttpError(400, 'Time stamp is required');
    }

    const body = {
        employeeId: Number(req.body.employeeId),
        timeOut: initializeDateTimeZone(req.body.timeStamp),
    };

    if (isNaN(body.timeOut.getTime())) {
        return raiseHttpError(400, 'Invalid time out');
    }

    // Check if employee exists
    const currentEmployee = await prisma.employee.findUnique({
        where: { id: body.employeeId },
        include: {
            PersonalSchedule: {
                include: {
                    Schedule: true,
                },
            },
        },
    });

    if (!currentEmployee) {
        return raiseHttpError(404, 'Employee not found');
    } else if ((!currentEmployee.role || !currentEmployee.departmentId) && currentEmployee.accessLevel !== "ADMIN") {
        return raiseHttpError(400, 'Employee is not assigned to a department');
    }

    // Get employee's schedule
    const currentDepartmentSchedule = await prisma.departmentSchedule.findFirst({
        where: {
            role: currentEmployee.role || undefined,
            departmentId: currentEmployee.departmentId || undefined,
        },
        select: { Schedule: true },
    });


    // Get the schedule of the employee checking if it is a department schedule or personal schedule
    let currentSchedule = currentEmployee.PersonalSchedule?.Schedule || currentDepartmentSchedule?.Schedule;
    const isDepartmentSchedule = !currentEmployee.PersonalSchedule?.Schedule && currentDepartmentSchedule?.Schedule;

    if (currentEmployee.accessLevel === "ADMIN") {
        const defaultSchedule: Schedule = {
            createdAt: new Date(),
            updatedAt: new Date(),
            id: 0,
            scheduleType: "SUPER_FLEXI",
            startTime: set(new Date(), { hours: 6, minutes: 0, seconds: 0, milliseconds: 0 }), // 6:00 AM
            endTime: set(new Date(), { hours: 23, minutes: 0, seconds: 0, milliseconds: 0 }), // 11:00 PM
            startTimeLimit: null,
            limitOvertime: null,
            limitWorkHoursDay: null,
            allowedOvertime: null
        };

        currentSchedule = defaultSchedule;
    } else if (!currentSchedule) {
        return raiseHttpError(400, 'Employee schedule not found');
    }

    // if weekend don't allow time in in department schedule
    const currentDay = format(initializeDateTimeZone(body.timeOut), 'EEEE');

    if (isDepartmentSchedule && (currentDay === 'Saturday' || currentDay === 'Sunday')) {
        return raiseHttpError(400, 'Weekend not allowed to time out');
    }

    // Fetch current attendance record
    const currentAttendance = await prisma.attendance.findFirst({
        where: {
            employeeId: body.employeeId,
            date: format(body.timeOut, 'MMMM d, yyyy'),
        },
    });

    if (!currentAttendance) {
        return raiseHttpError(400, 'Attendance record not found');
    } else if (currentAttendance.timeOut) {
        return raiseHttpError(400, 'Already clocked out');
    } else if (!currentAttendance.timeIn) {
        return raiseHttpError(400, 'Time in is required');
    } else if (currentAttendance.status === 'BREAK') {
        return raiseHttpError(400, 'Time currently on break');
    }

    // Use only time components for calculations
    const timeInFixed = initializeHourTimeZone(currentAttendance.timeIn, timeZone);
    let timeOutFixed = initializeHourTimeZone(body.timeOut, timeZone);
    // Calculate total minutes worked
    const minutesWorkedTotal = differenceInMinutes(timeOutFixed, timeInFixed);

    // Subtract lunch time from total working hours
    let totalMinutesWithLunch = minutesWorkedTotal;
    if (totalMinutesWithLunch > 60) {
        totalMinutesWithLunch -= 60;
        currentAttendance.lunchTimeTotal = 1;
    } else {
        // return customThrowError(400, 'Total hours worked must be greater than 1 hour');
    }

    let totalHoursWorked = totalMinutesWithLunch / 60;

    // Reset the schedule end time to only compare the time (hour and minute)
    const scheduledStartTime = initializeHourTimeZone(currentSchedule.startTime, timeZone);
    let overtimeTotal = 0;

    // validate if time out is earlier than the scheduled start time for fixed schedule
    if (currentSchedule.scheduleType === 'FIXED' && isAfter(scheduledStartTime, timeOutFixed)) {
        return raiseHttpError(400, 'Time out is earlier than the scheduled start time ' + format(scheduledStartTime, 'hh:mm a'));
    }

    if (totalHoursWorked > 8) {
        const timeAfterWorkHours = set(timeInFixed, {
            hours: getHours(timeInFixed) + 9,
            minutes: getMinutes(timeInFixed),
            seconds: 0,
            milliseconds: 0,
        });

        const overtimeMinutes = differenceInMinutes(timeOutFixed, timeAfterWorkHours);
        overtimeTotal = overtimeMinutes / 60;

        if (currentAttendance.isAllowedOvertime) {
            overtimeTotal = Math.min(overtimeTotal, currentAttendance.limitOvertime || DEFAULT_OVERTIME_LIMIT); // Overtime limit is 4 hours or the set limit
            totalHoursWorked = 8 + overtimeTotal;
        } else {
            totalHoursWorked = 8;
        }
    }

    // Update attendance record with correct total hours and overtime
    await prisma.attendance.update({
        where: { id: currentAttendance.id },
        data: {
            timeOut: initializeDateTimeZone(body.timeOut),
            timeHoursWorked: Math.round(totalHoursWorked * 100) / 100,  // Regular hours worked, rounded to 2 decimal places
            overTimeTotal: Math.round(overtimeTotal * 100) / 100,       // Overtime worked, rounded to 2 decimal places
            timeTotal: Math.round((minutesWorkedTotal / 60) * 100) / 100, // Total time worked before lunch deduction, rounded to 2 decimal places
            status: 'DONE',
            lunchTimeTotal: currentAttendance.lunchTimeTotal
        },
    });

    // Update the employee's active status
    await prisma.employee.update({
        where: { id: body.employeeId },
        data: { isActive: false },
    });

    res.status(200).send({
        timeIn: returnFormatDate(currentAttendance.timeIn),
        timeOut: returnFormatDate(timeOutFixed),
        timeHoursWorked: totalHoursWorked,  // Regular hours worked
        overTimeTotal: overtimeTotal,       // Overtime worked (if any)
        timeTotal: (minutesWorkedTotal / 60).toFixed(3),      // Total time worked before lunch deduction
        totalHoursWorked: totalHoursWorked,
        status: 'DONE',
        date: currentAttendance.date,
        overTimeLimit: currentAttendance.limitOvertime
    });
}

// Accepting overtime request and calculating the total hours worked with overtime
async function requestOverTimeRequest(req: Request, res: Response) {
    if (!req.body.employeeId) {
        return raiseHttpError(400, 'Employee ID is required');
    }
    if (!req.body.timeStamp) {
        return raiseHttpError(400, 'Time stamp is required');
    }

    const body = {
        employeeId: Number(req.body.employeeId),
        timeStamp: initializeDateTimeZone(req.body.timeStamp),
        requestTotalOvertime: Number(req.body.limitOvertime),
    };

    if (isNaN(body.timeStamp.getTime())) {
        return raiseHttpError(400, 'Invalid time out');
    } else if (body.requestTotalOvertime < 0) {
        return raiseHttpError(400, "Overtime request must be greater than 0");
    } else if (body.requestTotalOvertime > 4) {
        return raiseHttpError(400, "Overtime request must not exceed 5 hours");
    }

    // Check if employee exists
    const currentEmployee = await prisma.employee.findUnique({
        where: { id: body.employeeId },
        include: {
            PersonalSchedule: {
                include: {
                    Schedule: true,
                },
            },
        },
    });

    if (!currentEmployee) {
        return raiseHttpError(404, 'Employee not found');
    } else if (!currentEmployee.role || !currentEmployee.departmentId) {
        return raiseHttpError(400, 'Employee is not assigned to a department');
    }

    // Get employee's schedule
    const currentDepartmentSchedule = await prisma.departmentSchedule.findFirst({
        where: {
            role: currentEmployee.role,
            departmentId: currentEmployee.departmentId,
        },
        select: { Schedule: true },
    });


    // Get the schedule of the employee checking if it is a department schedule or personal schedule
    const schedule = currentEmployee.PersonalSchedule?.Schedule || currentDepartmentSchedule?.Schedule;
    // const isDepartmentSchedule = !currentEmployee.PersonalSchedule?.Schedule && currentDepartmentSchedule?.Schedule;

    if (!schedule) {
        return raiseHttpError(400, 'Employee schedule not found');
    }

    // Fetch current attendance record
    const currentAttendance = await prisma.attendance.findFirst({
        where: {
            employeeId: body.employeeId,
            date: format(body.timeStamp, 'MMMM d, yyyy'),
        },
    });

    if (!currentAttendance) {
        return raiseHttpError(400, 'Attendance record not found');
    }

    const timeInFixed = initializeHourTimeZone(currentAttendance.timeIn, timeZone);
    const timeOutFixed = initializeHourTimeZone(body.timeStamp, timeZone);
    const totalMinutesWorked = differenceInMinutes(timeOutFixed, timeInFixed);
    const totalHoursWorked = totalMinutesWorked / 60;

    // Check overtime if total hours worked exceeds 8 hours
    if (totalHoursWorked < 8) {
        return res.status(400).send("Total hours worked must be greater than 8 hours");
    }

    // Update attendance record with correct total hours and overtime
    await prisma.attendance.update({
        where: { id: currentAttendance.id },
        data: {
            limitOvertime: Number(body.requestTotalOvertime),
            isRequestingOvertime: true
        },
    });

    const timeOutAllowed = set(schedule.startTime, {
        hours: getHours(schedule.startTime) + 9 + body.requestTotalOvertime,
        minutes: getMinutes(schedule.startTime),
        seconds: 0,
        milliseconds: 0,
    });

    return res.status(200).send({
        date: currentAttendance.date,
        allowedOvertime: true,
        limitOvertime: Number(body.requestTotalOvertime),
        totalHoursWorked,
        timeOutAllowed: returnFormatDate(timeOutAllowed)
    });
}


async function acceptOvertimeRequest(req: Request, res: Response) {
    let DONE_ATTENDANCE = false;
    if (!req.body.employeeId) {
        return raiseHttpError(400, 'Employee ID is required');
    }
    if (!req.body.timeStamp) {
        DONE_ATTENDANCE = true;
    }

    if (req.body.isAllowedOvertime === undefined) {
        return raiseHttpError(400, 'isAllowedOvertime overtime is required');
    }

    if (req.body.isRejectedOvertime === undefined) {
        return raiseHttpError(400, 'isRejectedOvertime overtime is required');
    }


    const body = {
        employeeId: Number(req.body.employeeId),
        timeStamp: initializeDateTimeZone(req.body.timeStamp || new Date()),
        requestTotalOvertime: Number(req.body.limitOvertime),
        isAllowedOvertime: req.body.isAllowedOvertime,
        isRejectedOvertime: req.body.isRejectedOvertime
    };

    const currentEmployee = await prisma.employee.findUnique({
        where: { id: body.employeeId },
        include: {
            PersonalSchedule: {
                include: {
                    Schedule: true,
                },
            },
        },
    });

    if (!currentEmployee) {
        return raiseHttpError(404, 'Employee not found');
    } else if (!currentEmployee.role || !currentEmployee.departmentId) {
        return raiseHttpError(400, 'Employee is not assigned to a department');
    }

    const currentDate = DONE_ATTENDANCE ? new Date() : body.timeStamp;

    // Fetch current attendance record
    const currentAttendance = await prisma.attendance.findFirst({
        where: {
            employeeId: body.employeeId,
            date: formatDate(currentDate),
        },
    });

    if (!currentAttendance) {
        return raiseHttpError(400, 'Attendance record not found');
    }

    body.timeStamp = initializeHourTimeZone(currentAttendance.timeOut || body.timeStamp)

    if (isNaN(body.timeStamp.getTime())) {
        return raiseHttpError(400, 'Invalid time out');
    } else if (body.requestTotalOvertime < 0) {
        return res.status(400).send("Overtime request must be greater than 0");
    } else if (body.requestTotalOvertime > 4) {
        return res.status(400).send("Overtime request must not exceed 5 hours");
    }

    // Get employee's schedule
    const currentDepartmentSchedule = await prisma.departmentSchedule.findFirst({
        where: {
            role: currentEmployee.role,
            departmentId: currentEmployee.departmentId,
        },
        select: { Schedule: true },
    });

    // Get the schedule of the employee checking if it is a department schedule or personal schedule
    const schedule = currentEmployee.PersonalSchedule?.Schedule || currentDepartmentSchedule?.Schedule;
    // const isDepartmentSchedule = !currentEmployee.PersonalSchedule?.Schedule && currentDepartmentSchedule?.Schedule;

    if (!schedule) {
        return raiseHttpError(400, 'Employee schedule not found');
    }


    if (!currentAttendance) {
        return raiseHttpError(400, 'Attendance record not found');
    }

    const timeInFixed = initializeHourTimeZone(currentAttendance.timeIn, timeZone);
    const timeOutFixed = initializeHourTimeZone(body.timeStamp, timeZone);
    const totalMinutesWorked = differenceInMinutes(timeOutFixed, timeInFixed);
    const totalHoursWorked = totalMinutesWorked / 60;

    // Check overtime if total hours worked exceeds 8 hours
    if (totalHoursWorked < 8) {
        return res.status(400).send("Total hours worked must be greater than 8 hours");
    }

    // Update attendance record with correct total hours and overtime
    await prisma.attendance.update({
        where: { id: currentAttendance.id },
        data: {
            limitOvertime: Number(body.requestTotalOvertime),
            isAllowedOvertime: Boolean(body.isAllowedOvertime),
            isRejectedOvertime: Boolean(body.isRejectedOvertime),
            isRequestingOvertime: false
        },
    });

    const timeOutAllowed = set(schedule.startTime, {
        hours: getHours(schedule.startTime) + 9 + body.requestTotalOvertime,
        minutes: getMinutes(schedule.startTime),
        seconds: 0,
        milliseconds: 0,
    });

    return res.status(200).send({
        totalHoursWorked,
        date: currentAttendance.date,
        allowedOvertime: true,
        limitOvertime: Number(body.requestTotalOvertime),
        timeOutAllowed: returnFormatDate(timeOutAllowed)
    });
}

// GET /api/attendance/today/:id
async function getAttendanceOfEmployeeToday(req: Request, res: Response) {
    const employeeId = Number(req.params.id);

    if (isNaN(employeeId)) {
        return raiseHttpError(400, 'Employee ID is required');
    }

    const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
    });

    if (!employee) {
        return raiseHttpError(404, 'Employee not found');
    }

    // Get today's date in Asia/Manila time zone
    const today = new TZDate(new Date(), 'Asia/Manila');
    const formattedDate = formatDate(today);

    // Fetch the attendance record of the employee for today
    const attendance = await prisma.attendance.findFirst({
        where: {
            employeeId: employee.id,
            date: formattedDate,
        },
    });

    res.status(200).send(attendance);
}

export { timeIn, timeOut, getAttendanceOfEmployeeToday, requestOverTimeRequest, acceptOvertimeRequest };