import { prisma } from '../config/database';

export class DepartmentScheduleService {
    static async findManyDepartmentSchedules(departmentId?: number) {
        if (departmentId) {
            return await prisma.departmentSchedule.findMany({
                where: { departmentId: departmentId },
                include: { Schedule: true }
            });
        } else {
            return await prisma.departmentSchedule.findMany({
                include: { Schedule: true }
            });
        }
    }

    static async findDepartmentScheduleById(departmentScheduleId: number) {
        return await prisma.departmentSchedule.findFirst({
            where: { id: departmentScheduleId },
            include: { Schedule: true }
        });
    }

    static async findDepartmentById(departmentId: number) {
        return await prisma.department.findFirst({
            where: { id: departmentId },
        });
    }

    static async createSchedule(data: any) {
        return await prisma.schedule.create({
            data: {
                scheduleType: data.scheduleType,
                startTime: data.startTime,
                endTime: data.endTime,
            },
        });
    }

    static async createDepartmentSchedule(data: any) {
        return await prisma.departmentSchedule.create({
            data: {
                name: data.name,
                departmentId: data.departmentId,
                scheduleId: data.scheduleId,
                role: data.role,
            },
        });
    }

    static async findUniqueDepartmentSchedule(departmentScheduleId: number) {
        return await prisma.departmentSchedule.findUnique({
            where: { id: departmentScheduleId },
        });
    }

    static async findUniqueSchedule(scheduleId: number) {
        return await prisma.schedule.findUnique({
            where: { id: scheduleId },
        });
    }

    static async updateDepartmentSchedule(departmentScheduleId: number, data: any) {
        const existingDepartmentSchedule = await prisma.departmentSchedule.findUnique({
            where: { id: departmentScheduleId },
            include: { Schedule: true },
        });

        return await prisma.departmentSchedule.update({
            where: { id: departmentScheduleId },
            data: {
                role: data.role || existingDepartmentSchedule?.role,
                name: data.name || existingDepartmentSchedule?.name,
                Schedule: {
                    update: {
                        scheduleType: data.scheduleType || existingDepartmentSchedule?.Schedule?.scheduleType,
                        startTime: data.startTime || existingDepartmentSchedule?.Schedule?.startTime,
                        endTime: data.endTime || existingDepartmentSchedule?.Schedule?.endTime,
                    },
                },
            },
        });
    }

    static async deleteSchedule(scheduleId: number) {
        return await prisma.schedule.delete({
            where: { id: scheduleId },
        });
    }
}

export default DepartmentScheduleService;
