import { differenceInMinutes, format, getHours, getMinutes, isAfter, isBefore, isWithinInterval, parseISO, set } from 'date-fns';
import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { customThrowError } from '../middlewares/errorHandler';
import { initializeDateTimeZone, initializeHourTimeZone, printDate, returnFormatDate } from '../utils/date';
import { Day, Month } from '@prisma/client';
import { TZDate } from '@date-fns/tz';

const timeZone = 'Asia/Manila';


// POST /api / attendance / time-in
async function timeIn(req: Request, res: Response) {
    if (!req.body.employeeId || !req.body.timeStamp) {
        return customThrowError(400, 'Employee ID and time in are required');
    }

    const body = {
        employeeId: Number(req.body.employeeId),
        timeIn: initializeDateTimeZone(req.body.timeStamp),
    };

    // Validate input
    if (!body.employeeId || isNaN(body.timeIn.getTime())) {
        return customThrowError(400, 'Invalid time in');
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

    if (!currentEmployee) {
        return customThrowError(404, 'Employee not found');
    } else if (!currentEmployee.role || !currentEmployee.departmentId) {
        return customThrowError(400, 'Employee is not assigned to a department');
    }

    // Retrieve the employee's schedule based on role and department
    const currentDepartmentSchedule = await prisma.departmentSchedule.findFirst({
        where: {
            role: currentEmployee.role,
            departmentId: currentEmployee.departmentId,
        },
        select: {
            Schedule: true,
        },
    });

    // Get the schedule of the employee checking if it is a department schedule or personal schedule
    const currentSchedule = currentEmployee.PersonalSchedule?.Schedule || currentDepartmentSchedule?.Schedule;
    const isDepartmentSchedule = !currentEmployee.PersonalSchedule?.Schedule && currentDepartmentSchedule?.Schedule;

    if (!currentSchedule) {
        return customThrowError(400, 'Employee schedule not found');
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
        return customThrowError(400, 'Time in on a holiday is not allowed');
    }

    // if weekend don't allow time in in department schedule unless environment is testing
    const currentDay = format(initializeDateTimeZone(body.timeIn), 'EEEE');
    if (isDepartmentSchedule && (currentDay === 'Saturday' || currentDay === 'Sunday')) {
        return customThrowError(400, 'Weekend not allowed to time in');
    } else {
        // Check if the day is included in the employee's personal schedule
        const listOfDays = currentEmployee.PersonalSchedule?.day as Day[];
        if (listOfDays) {
            if (!listOfDays.includes(currentDay as Day)) {
                return customThrowError(400, 'Day not allowed to time in');
            }
        }
    }

    // Check if the employee has already clocked in today
    const currentAttendance = await prisma.attendance.findFirst({
        where: {
            employeeId: body.employeeId,
            date: format(body.timeIn, 'MMMM d, yyyy'),
        },
    });

    const timeIn = initializeHourTimeZone(body.timeIn, "Asia/Manila");
    const scheduledEndTime = initializeHourTimeZone(currentSchedule.endTime);

    // Check if the time in exceeds the schedule end time
    if (currentSchedule.scheduleType === 'FIXED' && isAfter(timeIn, scheduledEndTime)) {
        return customThrowError(400, 'Time in exceeds the schedule end time');
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
            return customThrowError(400, 'Time in is not within the allowed time in range');
        }
    }

    if (currentAttendance) {
        // Update the existing attendance record if it is still ongoing
        if (currentAttendance.status === 'ONGOING') {
            return customThrowError(400, 'Time currently ongoing');
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
    } else {
        let effectiveTimeIn = timeIn;

        const scheduledStartTime = initializeHourTimeZone(currentSchedule.startTime, timeZone);

        // If the schedule is fixed and the time in is earlier than the scheduled start time, use the scheduled start time
        if (currentSchedule.scheduleType === 'FIXED' && isBefore(timeIn, scheduledStartTime)) {
            effectiveTimeIn = scheduledStartTime;
        }

        // Create a new attendance record with the formatted date
        await prisma.attendance.create({
            data: {
                employeeId: body.employeeId,
                date: format(initializeDateTimeZone(body.timeIn, timeZone), 'MMMM d, yyyy'), // Format date for the record
                status: 'ONGOING',
                scheduleType: currentSchedule.scheduleType,
                timeIn: effectiveTimeIn,
            },
        });

        // Update the employee's active status
        await prisma.employee.update({
            where: { id: body.employeeId },
            data: { isActive: true },
        });

        return res.status(200).send('Attendance record successfully created' + format(effectiveTimeIn, 'MMMM d, yyyy'));
    }
}

// POST /api/attendance/time-out
async function timeOut(req: Request, res: Response) {
    if (!req.body.employeeId) {
        return customThrowError(400, 'Employee ID is required');
    }
    if (!req.body.timeStamp) {
        return customThrowError(400, 'Time stamp is required');
    }

    const body = {
        employeeId: Number(req.body.employeeId),
        timeOut: initializeHourTimeZone(req.body.timeStamp),
    };

    if (isNaN(body.timeOut.getTime())) {
        return customThrowError(400, 'Invalid time out');
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
        return customThrowError(404, 'Employee not found');
    } else if (!currentEmployee.role || !currentEmployee.departmentId) {
        return customThrowError(400, 'Employee is not assigned to a department');
    }

    // Get employee's schedule
    const currentDepartmentSchedule = await prisma.departmentSchedule.findFirst({
        where: {
            role: currentEmployee.role,
            departmentId: currentEmployee.departmentId,
        },
        select: { Schedule: true },
    });

    const timeOut = initializeHourTimeZone(body.timeOut, timeZone);

    // Get the schedule of the employee checking if it is a department schedule or personal schedule
    const schedule = currentEmployee.PersonalSchedule?.Schedule || currentDepartmentSchedule?.Schedule;
    const isDepartmentSchedule = !currentEmployee.PersonalSchedule?.Schedule && currentDepartmentSchedule?.Schedule;

    if (!schedule) {
        return customThrowError(400, 'Employee schedule not found');
    }

    // if weekend don't allow time in in department schedule
    const currentDay = format(initializeDateTimeZone(body.timeOut), 'EEEE');

    if (isDepartmentSchedule && (currentDay === 'Saturday' || currentDay === 'Sunday')) {
        return customThrowError(400, 'Weekend not allowed to time out');
    }

    // Fetch current attendance record
    const currentAttendance = await prisma.attendance.findFirst({
        where: {
            employeeId: body.employeeId,
            date: format(timeOut, 'MMMM d, yyyy'),
        },
    });

    if (!currentAttendance) {
        return customThrowError(400, 'Attendance record not found or already clocked out');
    } else if (currentAttendance.timeOut) {
        return customThrowError(400, 'Already clocked out');
    } else if (!currentAttendance.timeIn) {
        return customThrowError(400, 'Time in is required');
    } else if (currentAttendance.status === 'BREAK') {
        return customThrowError(400, 'Time currently on break');
    }

    // Use only time components for calculations
    const timeInFixed = currentAttendance.timeIn;
    const timeOutFixed = initializeHourTimeZone(body.timeOut, timeZone);
    // Calculate total minutes worked
    const minutesWorkedTotal = differenceInMinutes(timeOutFixed, timeInFixed);

    // Subtract lunch time from total working hours
    let totalMinutesWithLunch = minutesWorkedTotal;
    if (totalMinutesWithLunch > 60) {
        totalMinutesWithLunch -= 60;
    } else {
        // ? Discuss with the team if this is need to be implemented
        // return customThrowError(400, 'Total hours worked must be greater than 1 hour');
    }

    let totalHoursWorked = totalMinutesWithLunch / 60;

    // Reset the schedule end time to only compare the time (hour and minute)
    const scheduledStartTime = initializeHourTimeZone(schedule.startTime, timeZone);
    const scheduleEndTime = initializeHourTimeZone(schedule.endTime, timeZone);
    let overtimeTotal = 0;

    // validate if time out is earlier than the scheduled start time    
    if (schedule.scheduleType === 'FIXED') {
        if (isAfter(scheduledStartTime, timeOutFixed,)) {
            return customThrowError(400, 'Time out is earlier than the scheduled start time ' + format(scheduledStartTime, 'hh:mm a'));
        }
    }

    // // Fixed schedule: Adjust total hours and prevent overtime if not allowed
    // if (schedule.scheduleType === 'FIXED') {
    //     if (isAfter(timeOutFixed, scheduleEndTime)) {
    //         if (schedule.allowedOvertime) {
    //             const overtimeMinutes = differenceInMinutes(timeOutFixed, scheduleEndTime);
    //             overtimeTotal = overtimeMinutes / 60;
    //         } else {
    //             body.timeOut = scheduleEndTime;
    //             totalHoursWorked = 8;
    //         }
    //     }
    // }

    // Flexi AND Super-Flexi schedule: Calculate overtime if total hours worked exceeds 8 hours
    // if (schedule.scheduleType === 'FLEXI' || schedule.scheduleType === 'SUPER_FLEXI') {
    if (totalHoursWorked > 8) {
        const timeAfterEightHours = set(timeInFixed, {
            hours: getHours(timeInFixed) + 8,
            minutes: getMinutes(timeInFixed),
            seconds: 0,
            milliseconds: 0,
        });

        const overtimeMinutes = differenceInMinutes(timeOutFixed, timeAfterEightHours);
        overtimeTotal = overtimeMinutes / 60;
        totalHoursWorked = 8;
    }
    // }

    console.log(returnFormatDate(currentAttendance.timeIn), returnFormatDate(timeInFixed));
    console.log(returnFormatDate(timeOutFixed), returnFormatDate(body.timeOut));

    console.log(totalHoursWorked, "total hours worked", minutesWorkedTotal, differenceInMinutes(timeOutFixed, timeInFixed) / 60, "total minutes worked");

    // Update attendance record with correct total hours and overtime
    await prisma.attendance.update({
        where: { id: currentAttendance.id },
        data: {
            timeOut: initializeDateTimeZone(body.timeOut),
            timeHoursWorked: totalHoursWorked,  // Regular hours worked
            overTimeTotal: overtimeTotal,
            timeTotal: minutesWorkedTotal / 60,      // Total time worked before lunch deduction
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
        status: 'DONE',
        date: currentAttendance.date,
    });
}

// // POST /api/attendance/lunch-in
// async function lunchIn(req: Request, res: Response) {

//     if (!req.body.employeeId || !req.body.timeStamp) {
//         return customThrowError(400, 'Employee ID and time in are required');
//     }

//     const timeZone = 'Asia/Manila';
//     const body = {
//         employeeId: req.body.employeeId,
//         lunchTimeIn: toZonedTime(parseISO(req.body.timeStamp), timeZone),
//     };

//     if (body.lunchTimeIn.toString() === 'Invalid Date') {
//         return customThrowError(400, 'Invalid lunch time in');
//     }

//     // Validate input
//     if (!body.employeeId || !body.lunchTimeIn) {
//         return customThrowError(400, 'Employee ID and lunch time in are required');
//     }

//     // Check if employee exists
//     const employee = await prisma.employee.findUnique({
//         where: { id: body.employeeId },
//     });

//     if (!employee) {
//         return customThrowError(404, 'Employee not found');
//     } else if (!employee.role || !employee.departmentId) {
//         return customThrowError(400, 'Employee is not assigned to a department');
//     }

//     // Fetch current attendance record
//     const currentAttendance = await prisma.attendance.findFirst({
//         where: {
//             employeeId: body.employeeId,
//             date: format(body.lunchTimeIn, 'MMMM d, yyyy'), // format date for comparison
//         },
//     });

//     if (!currentAttendance) {
//         return customThrowError(400, 'Attendance record not found');
//     } else if (currentAttendance.timeOut) {
//         return customThrowError(400, 'Already clocked out');
//     } else if (currentAttendance.status === 'BREAK') {
//         return customThrowError(400, 'Time currently on break');
//     }

//     const currentSchedule = await prisma.departmentSchedule.findFirst({
//         where: {
//             role: employee.role,
//             departmentId: employee.departmentId,
//         },
//         select: { Schedule: true },
//     });

//     const schedule = currentSchedule?.Schedule;

//     if (!schedule) {
//         return customThrowError(400, 'Employee schedule not found');
//     }

//     // Use date-fns to compare only hours and minutes
//     const lunchStartTime = set(toZonedTime(new Date(), timeZone), {
//         hours: getHours(schedule.lunchStartTime!),
//         minutes: getMinutes(schedule.lunchStartTime!),
//         seconds: 0,
//         milliseconds: 0,
//     });

//     const lunchEndTime = set(toZonedTime(new Date(), timeZone), {
//         hours: getHours(schedule.lunchEndTime!),
//         minutes: getMinutes(schedule.lunchEndTime!),
//         seconds: 0,
//         milliseconds: 0,
//     });

//     const lunchTimeIn = set(toZonedTime(new Date(), timeZone), {
//         hours: getHours(body.lunchTimeIn),
//         minutes: getMinutes(body.lunchTimeIn),
//         seconds: 0,
//         milliseconds: 0,
//     });

//     // Validate if lunch time in is within the scheduled time
//     if (schedule.scheduleType === 'FIXED') {
//         if (isBefore(lunchTimeIn, lunchStartTime) || isAfter(lunchTimeIn, lunchEndTime)) {
//             return customThrowError(400, 'Lunch time in is not within the scheduled lunch time');
//         }
//     }

//     // If lunch has already started, just resume
//     body.lunchTimeIn = currentAttendance.lunchTimeIn || body.lunchTimeIn;

//     // Update attendance record with lunchTimeIn
//     await prisma.attendance.update({
//         where: { id: currentAttendance.id },
//         data: {
//             lunchTimeIn: body.lunchTimeIn,
//             lunchTimeOut: null,
//             lunchTimeTotal: 0,
//             status: 'BREAK',
//         },
//     });

//     res.status(200).send('Lunch time in recorded');
// }


// // POST /api/attendance/lunch-out
// async function lunchOut(req: Request, res: Response) {

//     if (!req.body.employeeId || !req.body.timeStamp) {
//         return customThrowError(400, 'Employee ID and time in are required');
//     }

//     const timeZone = 'Asia/Manila';
//     const body = {
//         employeeId: Number(req.body.employeeId),
//         lunchTimeOut: toZonedTime(parseISO(req.body.timeStamp), timeZone),
//     };

//     if (body.lunchTimeOut.toString() === 'Invalid Date') {
//         return customThrowError(400, 'Invalid lunch time out');
//     }

//     // Validate input
//     if (!body.employeeId || !body.lunchTimeOut) {
//         return customThrowError(400, 'Employee ID and lunch time out are required');
//     }

//     // Check if employee exists
//     const employee = await prisma.employee.findUnique({
//         where: { id: body.employeeId },
//     });

//     if (!employee) {
//         return customThrowError(404, 'Employee not found');
//     } else if (!employee.role || !employee.departmentId) {
//         return customThrowError(400, 'Employee is not assigned to a department');
//     }

//     // Fetch current attendance record
//     const currentAttendance = await prisma.attendance.findFirst({
//         where: {
//             employeeId: body.employeeId,
//             date: format(body.lunchTimeOut, 'MMMM d, yyyy'),
//         },
//     });

//     if (!currentAttendance || !currentAttendance.lunchTimeIn) {
//         return customThrowError(400, 'Lunch has not been started');
//     } else if (currentAttendance.lunchTimeOut) {
//         return customThrowError(400, 'Lunch has already ended');
//     } else if (currentAttendance.timeOut) {
//         return customThrowError(400, 'Already clocked out');
//     }

//     // Get current schedule
//     const employeeSchedule = await prisma.departmentSchedule.findFirst({
//         where: {
//             role: employee.role,
//             departmentId: employee.departmentId,
//         },
//         select: { Schedule: true },
//     });

//     // Validate lunch time out if it is within the scheduled time
//     const schedule = employeeSchedule?.Schedule;
//     if (!schedule) {
//         return customThrowError(400, 'Employee schedule not found');
//     }

//     // Use date-fns to compare only hours and minutes for scheduled lunch out in Manila time zone
//     const scheduleLunchEndTime = set(toZonedTime(new Date(), timeZone), {
//         hours: getHours(schedule.lunchEndTime!),
//         minutes: getMinutes(schedule.lunchEndTime!),
//         seconds: 0,
//         milliseconds: 0,
//     });

//     // Use date-fns to compare only hours and minutes for lunch time out in Manila time zone
//     const scheduledLunchTimeout = set(toZonedTime(new Date(), timeZone), {
//         hours: getHours(body.lunchTimeOut),
//         minutes: getMinutes(body.lunchTimeOut),
//         seconds: 0,
//         milliseconds: 0,
//     });

//     // If lunch time out is later than the scheduled time, set the lunch time out to the scheduled time
//     if (schedule.scheduleType === 'FIXED' && isAfter(scheduledLunchTimeout, scheduleLunchEndTime)) {
//         body.lunchTimeOut = scheduleLunchEndTime;
//     }

//     // Use date-fns to compare only hours and minutes for lunch time in
//     const currentLunchTimeIn = set(toZonedTime(new Date(currentAttendance.lunchTimeIn), timeZone), {
//         hours: getHours(currentAttendance.lunchTimeIn),
//         minutes: getMinutes(currentAttendance.lunchTimeIn),
//         seconds: 0,
//         milliseconds: 0,
//     });

//     // Calculate the total lunch duration in minutes
//     const totalLunchMinutes = differenceInMinutes(scheduledLunchTimeout, currentLunchTimeIn);
//     const totalLunchHours = totalLunchMinutes / 60;

//     // Update attendance record with lunchTimeOut and lunchTimeTotal
//     await prisma.attendance.update({
//         where: { id: currentAttendance.id },
//         data: {
//             lunchTimeOut: body.lunchTimeOut,
//             lunchTimeTotal: totalLunchHours, // Total lunch break duration in hours
//             status: 'ONGOING',
//         },
//     });

//     res.status(200).send('Lunch time out recorded');
// }
// GET /api/attendance/today/:id
async function getAttendanceOfEmployeeToday(req: Request, res: Response) {
    const employeeId = Number(req.params.id);

    if (isNaN(employeeId)) {
        return customThrowError(400, 'Employee ID is required');
    }

    const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
    });

    if (!employee) {
        return customThrowError(404, 'Employee not found');
    }

    // Get today's date in Asia/Manila time zone
    const today = new TZDate(new Date(), 'Asia/Manila');
    const formattedDate = format(today, 'MMMM d, yyyy');

    // Fetch the attendance record of the employee for today
    const attendance = await prisma.attendance.findFirst({
        where: {
            employeeId: employee.id,
            date: formattedDate,
        },
    });

    res.status(200).send(attendance);
}

export { timeIn, timeOut, getAttendanceOfEmployeeToday };