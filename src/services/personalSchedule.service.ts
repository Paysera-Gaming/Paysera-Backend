import { Day, RequestStatus, ScheduleType } from '@prisma/client';
import { prisma } from '../config/database';

interface PersonalSchedule {
    employeeId: number;
    scheduleType: ScheduleType;
    startTime: Date;
    endTime: Date;
    name: string;
    day: Day[];
}

interface RequestChangePersonalSchedule {
    scheduleType: ScheduleType;
    day: Day[];
    startTime: Date;
    startTimeLimit?: Date;
    endTime: Date;
    isAllowedOvertime: boolean;
    reason: string;
    limitOvertime: number;
    status: RequestStatus;
}


export class PersonalScheduleService {
    static async getAllPersonalSchedules() {
        return await prisma.personalSchedule.findMany({
            include: { Schedule: true, Employee: true }
        });
    }

    static async getPersonalScheduleById(personalScheduleId: number) {
        return await prisma.personalSchedule.findFirst({
            where: { id: personalScheduleId },
            include: { Schedule: true }
        });
    }

    static async findEmployeeById(employeeId: number) {
        return await prisma.employee.findUnique({
            where: { id: employeeId },
            include: { PersonalSchedule: true }
        });
    }

    static async findPersonalScheduleByEmployeeId(employeeId: number) {
        return await prisma.personalSchedule.findUnique({
            where: { employeeId: employeeId },
            include: {
                Employee: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                        middleName: true,
                        accessLevel: true,
                        isActive: true,
                        departmentId: true,
                        role: true,
                        email: true,
                        isAllowedRequestOvertime: true,
                        createdAt: true,
                        updatedAt: true,
                    }
                }
            }
        });
    }

    static async createPersonalSchedule(data: PersonalSchedule) {
        const schedule = await prisma.schedule.create({
            data: {
                scheduleType: data.scheduleType,
                startTime: data.startTime,
                endTime: data.endTime,
            },
        });

        const personalSchedule = await prisma.personalSchedule.create({
            data: {
                employeeId: data.employeeId,
                scheduleId: schedule.id,
                name: data.name,
                day: [...data.day],
            },
        });
        return personalSchedule;
    }

    static async updatePersonalSchedule(personalScheduleId: number, data: PersonalSchedule) {
        const personalSchedule = await prisma.personalSchedule.update({
            where: { id: personalScheduleId },
            data: {
                name: data.name,
                day: [...data.day],
                Schedule: {
                    update: {
                        scheduleType: data.scheduleType,
                        startTime: data.startTime,
                        endTime: data.endTime,

                    }
                }
            },
        });

        return personalSchedule;
    }

    static async findPersonalScheduleById(personalScheduleId: number) {
        return await prisma.personalSchedule.findFirst({
            where: { id: personalScheduleId },
            include: { Schedule: true, Employee: true }
        });
    }


    static async deleteSchedule(scheduleId: number) {
        const personalSchedule = await prisma.personalSchedule.delete({
            where: { id: scheduleId },
        });

        await prisma.schedule.delete({
            where: { id: personalSchedule.scheduleId },
        });

        return personalSchedule;
    }

    static async findPersonalScheduleByUniqueId(personalScheduleId: number) {
        return await prisma.personalSchedule.findUnique({
            where: { id: personalScheduleId },
        });
    }

    static async requestChangeSchedule(employeeId: number, data: RequestChangePersonalSchedule) {
        const requestChangeSchedule = await prisma.requestChangePersonalSchedule.create({
            data: {
                scheduleType: data.scheduleType,
                day: [...data.day],
                startTime: data.startTime,
                startTimeLimit: data.startTimeLimit,
                endTime: data.endTime,
                isAllowedOvertime: data.isAllowedOvertime,
                reason: data.reason,
                limitOvertime: data.limitOvertime,
                status: data.status,
                employeeId: employeeId,
            },
        });

        return requestChangeSchedule;
    }

    static async getAllRequestChangeSchedule() {
        return await prisma.requestChangePersonalSchedule.findMany({
            include: {
                Employee: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                        middleName: true,
                        accessLevel: true,
                        isActive: true,
                        departmentId: true,
                        role: true,
                        email: true,
                        isAllowedRequestOvertime: true,
                        createdAt: true,
                        updatedAt: true,
                    }
                }
            }
        });
    }

    static async getRequestChangeScheduleById(requestChangeScheduleId: number) {
        return await prisma.requestChangePersonalSchedule.findFirst({
            where: { id: requestChangeScheduleId },
            include: {
                Employee: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                        middleName: true,
                        accessLevel: true,
                        isActive: true,
                        departmentId: true,
                        role: true,
                        email: true,
                        isAllowedRequestOvertime: true,
                        createdAt: true,
                        updatedAt: true,
                    }
                }
            }
        });
    }

    static async getRequestChangeScheduleByEmployeeId(employeeId: number) {
        return await prisma.requestChangePersonalSchedule.findFirst({
            where: { employeeId: employeeId }
        });
    }

    static async updateRequestChangeSchedule(requestChangeScheduleId: number, data: RequestChangePersonalSchedule) {
        const updatedRequest = await prisma.requestChangePersonalSchedule.update({
            where: { id: requestChangeScheduleId },
            data: {
                scheduleType: data.scheduleType,
                day: [...data.day],
                startTime: data.startTime,
                startTimeLimit: data.startTimeLimit,
                endTime: data.endTime,
                isAllowedOvertime: data.isAllowedOvertime,
                reason: data.reason,
                limitOvertime: data.limitOvertime,
                status: data.status,
            }
        });

        return updatedRequest;
    }

    static async deleteRequestChangeSchedule(requestChangeScheduleId: number) {
        const deletedRequest = await prisma.requestChangePersonalSchedule.delete({
            where: { id: requestChangeScheduleId }
        });

        return deletedRequest;
    }
}
export default PersonalScheduleService;