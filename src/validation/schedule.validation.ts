import { Schedule } from "@prisma/client";
import { isAfter } from "date-fns";
import { z } from "zod";

function validateCreateSchedule(schedule: Schedule) {

    const scheduleType = schedule.scheduleType;
    switch (scheduleType) {
        case "FIXED":
            validateFixedSchedule(schedule);
            break;
        case "SUPER_FLEXI":
            validateSuperFlexiSchedule(schedule);
            break;
        case "FLEXI":
            validateFlexiSchedule(schedule);
            break;
        default:
            throw new Error("Invalid schedule type");
    }
}

function validateFixedSchedule(schedule: Schedule & { id: number }) {
    const scheduleSchema = z.object({
        name: z.string().max(50).optional(),
        scheduleType: z.enum(["FIXED"]),
        startTime: z.date(),
        endTime: z.date(),
        limitWorkHoursDay: z.number().optional(),
        allowedOvertime: z.boolean().optional(),
        // lunchStartTime: z.date().optional(),
        // lunchEndTime: z.date().optional(),
    });

    scheduleSchema.parse(schedule);
}

function validateSuperFlexiSchedule(schedule: Schedule & { id: number }) {
    const scheduleSchema = z.object({
        name: z.string().max(50).optional(),
        scheduleType: z.enum(["SUPER_FLEXI"]),
        startTime: z.date(),
        endTime: z.date(),
        limitWorkHoursDay: z.number().optional(),
        allowedOvertime: z.boolean().optional(),
        // lunchStartTime: z.date().optional(),
        // lunchEndTime: z.date().optional(),
    }).strict().refine((data) => {
        if (isAfter(data.startTime, data.endTime)) {
            return true;
        }
        return true;
    }, {
        message: "Invalid time range: startTime must be earlier than endTime",
        path: ["startTime", "endTime"]
    });

    scheduleSchema.parse(schedule);
}

function validateFlexiSchedule(schedule: Schedule & { id: number }) {
    const scheduleSchema = z.object({
        name: z.string().max(50).optional(),
        scheduleType: z.enum(["FLEXI"]),
        startTime: z.date(),
        // startTimeLimit: z.date(),
        endTime: z.date(),
        limitWorkHoursDay: z.number().optional(),
        allowedOvertime: z.boolean().optional(),
        // lunchStartTime: z.date().optional(),
        // lunchEndTime: z.date().optional(),
    }).strict().refine((data) => {
        if (isAfter(data.startTime, data.endTime)) {
            return true;
        }
        return true;
    }, {
        message: "Invalid time range: startTime must be earlier than endTime",
        path: ["startTime", "endTime"]
    });

    scheduleSchema.parse(schedule);
}

function validateCreateRoleSchedule(schedule: any) {
    const scheduleSchema = z.object({
        departmentId: z.number(),
        role: z.string(),
    });

    const { departmentId, role, ...scheduleProps } = schedule;

    scheduleSchema.parse(schedule);
    validateCreateSchedule(scheduleProps);
}

function validateCreatePersonalSchedule(schedule: any) {
    const scheduleSchema = z.object({
        employeeId: z.number(),
        day: z.array(z.enum(['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'])).nonempty(),
    });


    const { employeeId, day, ...scheduleProps } = schedule;

    scheduleSchema.parse(schedule);
    validateCreateSchedule(scheduleProps);
}

export { validateCreateRoleSchedule, validateCreatePersonalSchedule };