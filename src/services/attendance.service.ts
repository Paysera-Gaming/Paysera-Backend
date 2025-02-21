import { prisma } from '../config/database';

export class AttendanceService {
    static async getAllAttendance() {
        return await prisma.attendance.findMany({
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
    }

    static async getAttendanceById(attendanceId: number) {
        return await prisma.attendance.findUnique({
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
    }

    static async getAttendanceByEmployeeId(employeeId: number) {
        return await prisma.attendance.findMany({
            where: { employeeId: employeeId },
            orderBy: {
                date: 'asc',
            },
        });
    }

    static async createAttendance(data: any) {
        return await prisma.attendance.create({
            data: {
                employeeId: data.employeeId,
                date: data.date,
                status: data.status,
                scheduleType: data.scheduleType,
                timeIn: data.timeIn,
                timeOut: data.timeOut,
                overTimeTotal: data.overtimeTotal,
                timeHoursWorked: data.timeHoursWorked,
                timeTotal: data.timeTotal,
                lunchTimeTotal: data.lunchTimeTotal,
            },
        });
    }

    static async updateAttendance(attendanceId: number, data: any) {
        return await prisma.attendance.update({
            where: { id: attendanceId },
            data: {
                date: data.date,
                status: data.status,
                timeOut: data.timeOut,
                timeIn: data.timeIn,
                timeTotal: data.timeTotal,
                overTimeTotal: data.overtimeTotal,
                timeHoursWorked: data.timeHoursWorked,
            },
        });
    }

    static async updateAttendanceByEmployeeId(employeeId: number, data: any) {
        return await prisma.attendance.updateMany({
            where: { employeeId: employeeId },
            data: {
                status: data.status,
                timeOut: data.timeOut,
                timeHoursWorked: data.timeHoursWorked,
                overTimeTotal: data.overtimeTotal,
                timeTotal: data.timeTotal,
            },
        });
    }

    static async deleteAttendance(attendanceId: number) {
        return await prisma.attendance.delete({
            where: { id: attendanceId },
        });
    }
}

export default AttendanceService;