import { prisma } from "../config/database";
import { initializeHourTimeZone } from "../utils/date";
import { Department } from "@prisma/client";

export class DepartmentService {
    static async getAllDepartments() {
        return await prisma.department.findMany({
            orderBy: {
                createdAt: 'asc'
            },
            include: {
                Employees: {
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
                },
                Leader: {
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

    static async getDepartmentEmployees(departmentId: number) {
        const department = await prisma.department.findFirst({
            where: { id: departmentId },
            include: {
                Employees: {
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
                },
                Leader: {
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

        return department ? department.Employees || [] : [];
    }

    static async getDepartmentById(departmentId: number) {
        const department = await prisma.department.findUnique({
            where: { id: departmentId },
            include: {
                DepartmentSchedule: true,
                Employees: {
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
                },
                Leader: {
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
            },
        });

        return department;
    }

    static async createDepartment(body: any) {
        return await prisma.department.create({
            data: {
                name: body.name.trim() || "Department Name",
                Leader: {
                    connect: {
                        id: body.leaderId
                    }
                },
                Employees: {
                    connect: {
                        id: body.leaderId
                    }
                }
            },
        });

    }

    static async updateDepartmentById(departmentId: number, body: Partial<Department>) {
        const { name, leaderId } = body;
        return await prisma.department.update({
            where: { id: departmentId },
            data: {
                name: name?.trim(),
                Leader: leaderId ? { connect: { id: leaderId } } : undefined,
            },
        });
    }

    static async deleteDepartmentById(departmentId: number) {
        const departmentSchedule = await prisma.departmentSchedule.findMany({
            where: { departmentId: departmentId }
        });

        // Get all schedule IDs for the department schedules
        // Cascade delete department schedules
        // Delete the schedules 
        const departmentsScheduleIds = departmentSchedule.map(schedule => schedule.scheduleId);
        await prisma.$transaction([
            prisma.schedule.deleteMany({
                where: {
                    id: {
                        in: departmentsScheduleIds
                    }
                }
            }),
            prisma.department.delete({
                where: { id: departmentId },
            })
        ]);
    }

    static async getDepartmentSchedules(departmentId: number) {
        return await prisma.departmentSchedule.findMany({
            where: { departmentId: departmentId },
            include: {
                Schedule: true
            },
            orderBy: {
                Schedule: {
                    startTime: 'asc'
                }
            },
        });
    }

    static async getDepartmentSchedulesToday(departmentId: number) {
        const timeZone = 'Asia/Manila';
        const startOfDay = initializeHourTimeZone(new Date(new Date().setHours(0, 0, 0, 0)), timeZone);
        const endOfDay = initializeHourTimeZone(new Date(new Date().setHours(23, 59, 59, 999)), timeZone);

        return await prisma.departmentSchedule.findMany({
            where: {
                departmentId: departmentId,
                Schedule: {
                    startTime: {
                        gte: startOfDay,
                        lt: endOfDay
                    }
                }
            },
            include: {
                Schedule: true
            },
            orderBy: {
                Schedule: {
                    startTime: 'asc'
                }
            },
        });
    }

    static async getDepartmentAttendance(departmentId: number) {
        const employee = await prisma.employee.findMany({
            where: { Department: { id: departmentId } }
        });

        // Get all employee IDs for the department attendance
        const employeeIds = employee.map(emp => emp.id);

        return await prisma.attendance.findMany({
            where: {
                employeeId: {
                    in: employeeIds
                },
            },
            include: {
                employee: true
            },
        });
    }

    static async getDepartmentAttendanceToday(departmentId: number) {
        const employee = await prisma.employee.findMany({
            where: { Department: { id: departmentId } }
        });

        // Get all employee IDs for the department attendance
        const employeeIds = employee.map(emp => emp.id);

        const timeZone = 'Asia/Manila';
        const startOfDay = initializeHourTimeZone(new Date(new Date().setHours(0, 0, 0, 0)), timeZone);
        const endOfDay = initializeHourTimeZone(new Date(new Date().setHours(23, 59, 59, 999)), timeZone);

        return await prisma.attendance.findMany({
            where: {
                employeeId: {
                    in: employeeIds
                },
                createdAt: {
                    gte: startOfDay,
                    lt: endOfDay
                },
            },
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                employee: true
            },
        });
    }

    static async updateDepartmentAssignEmployee(departmentId: number, role: string, employeeId: number) {
        return await prisma.employee.update({
            where: { id: employeeId },
            data: {
                role: role.toLocaleUpperCase().trim(),
                Department: {
                    connect: {
                        id: departmentId
                    }
                }
            }
        });
    }

    static async updateDepartmentRemoveEmployee(employeeId: number) {
        return prisma.employee.update({
            where: { id: employeeId },
            data: {
                role: null,
                Department: {
                    disconnect: true
                }
            }
        });
    }

    static async updateDepartmentAssignLeader(departmentId: number, leaderId: number) {
        return await prisma.employee.update({
            where: { id: leaderId },
            data: {
                role: "TEAM LEADER",
                LeadsDepartment: {
                    connect: {
                        id: departmentId
                    }
                },
                Department: {
                    connect: {
                        id: departmentId
                    }
                },
            }
        });


    }

    static async updateDepartmentRemoveLeader(leaderId: number) {
        return await prisma.employee.update({
            where: { id: leaderId },
            data: {
                role: null,
                LeadsDepartment: {
                    disconnect: true
                },
                Department: {
                    disconnect: true
                }
            }
        });
    }
}

export default DepartmentService;
