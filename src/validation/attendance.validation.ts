import { Attendance } from "@prisma/client";
import { isAfter } from "date-fns";
import { z } from "zod";

function validateAttendance(attendance: Attendance) {
    const attendanceSchema = z.object({
        id: z.number(),
        employeeId: z.number(),
        date: z.date(),
        status: z.enum([" BREAK", "DONE", "UNPAID_LEAVE", "PAID_LEAVE"]),
        scheduleType: z.enum(["FIXED", "SUPER_FLEXI", "FLEXI"]),
        timeIn: z.date(),
        timeOut: z.date().optional(),
        timeHoursWorked: z.number().optional(),
        overTimeTotal: z.number().optional(),
        timeTotal: z.number().optional(),
        isLate: z.boolean().optional(),
        // lunchTimeIn: z.date(),
        // lunchTimeOut: z.date().optional(),
        lunchTimeTotal: z.number().optional(),
        RequestLeaveStatus: z.enum(["NO_REQUEST", "PENDING", "APPROVED_BY_ADMIN",
            "REJECT_BY_ADMIN", "REJECT_BY_TEAM_LEADER"]).optional(),
        RequestOverTimeStatus: z.enum(["NO_REQUEST", "PENDING", "APPROVED_BY_ADMIN",
            "REJECT_BY_ADMIN", "REJECT_BY_TEAM_LEADER"]).optional(),

        createdAt: z.date().optional(),
        updatedAt: z.date().optional(),
    });

    attendanceSchema.parse(attendance);
}

function validateCreateAttendance(attendance: any) {
    const attendanceSchema = z.object({
        employeeId: z.number(),
        date: z.date(),
        status: z.enum([" BREAK", "DONE", "UNPAID_LEAVE", "PAID_LEAVE"]),
        scheduleType: z.enum(["FIXED", "SUPER_FLEXI", "FLEXI"]),
        timeIn: z.date(),
        timeOut: z.date().optional(),
        timeHoursWorked: z.number().optional(),
        overTimeTotal: z.number().optional(),
        timeTotal: z.number().optional(),
        isLate: z.boolean().optional(),
        // lunchTimeIn: z.date().optional(),
        // lunchTimeOut: z.date().optional(),
        lunchTimeTotal: z.number().optional(),

        RequestLeaveStatus: z.enum(["NO_REQUEST", "PENDING", "APPROVED_BY_ADMIN",
            "REJECT_BY_ADMIN", "REJECT_BY_TEAM_LEADER"]).optional(),
        RequestOverTimeStatus: z.enum(["NO_REQUEST", "PENDING", "APPROVED_BY_ADMIN",
            "REJECT_BY_ADMIN", "REJECT_BY_TEAM_LEADER"]).optional(),

        createdAt: z.date().optional(),
        updatedAt: z.date().optional(),
    }).refine(data => {
        if (data.timeOut && isAfter(data.timeIn, data.timeOut)) {
            return false;
        }
        // if (data.lunchTimeOut && data.lunchTimeIn && data.lunchTimeIn > data.lunchTimeOut) {
        //     return false;
        // }
        return true;
    }, {
        message: "Invalid time: Ensure timeIn is before timeOut.",
    });

    attendanceSchema.parse(attendance);
}

function validateUpdateAttendance(attendance: any) {
    const attendanceSchema = z.object({
        id: z.number().optional(),
        employeeId: z.number().optional(),
        date: z.date().optional(),
        status: z.string().optional(),
        timeIn: z.date(),
        timeOut: z.date().optional(),
        timeHoursWorked: z.number().optional(),
        overTimeTotal: z.number().optional(),
        timeTotal: z.number().optional(),
        // lunchTimeIn: z.date(),
        // lunchTimeOut: z.date().optional(),
        lunchTimeTotal: z.number().optional(),

        RequestLeaveStatus: z.enum(["NO_REQUEST", "PENDING", "APPROVED_BY_ADMIN",
            "REJECT_BY_ADMIN", "REJECT_BY_TEAM_LEADER"]).optional(),
        RequestOverTimeStatus: z.enum(["NO_REQUEST", "PENDING", "APPROVED_BY_ADMIN",
            "REJECT_BY_ADMIN", "REJECT_BY_TEAM_LEADER"]).optional(),

        createdAt: z.date().optional(),
        updatedAt: z.date().optional(),
    }).refine(data => {
        if (data.timeOut && isAfter(data.timeIn, data.timeOut)) {
            return false;
        }
        // if (data.lunchTimeOut && data.lunchTimeIn && data.lunchTimeIn > data.lunchTimeOut) {
        //     return false;
        // }
        return true;
    }, {
        message: "Invalid time: Ensure timeIn is before timeOut.",
    });

    const result = attendanceSchema.parse(attendance);
    return result;
}


export { validateAttendance, validateUpdateAttendance, validateCreateAttendance };