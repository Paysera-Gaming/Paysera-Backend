import { Day, ScheduleType } from '@prisma/client';
import { prisma } from '../config/database';

interface PersonalSchedule {
    employeeId: number;
    scheduleType: ScheduleType;
    startTime: Date;
    endTime: Date;
    name: string;
    day: Day[];
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
            include: { Employee: true }
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
}

export default PersonalScheduleService;