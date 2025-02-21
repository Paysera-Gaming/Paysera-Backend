import { prisma } from "../config/database";
import { initializeHourTimeZone } from "../utils/date";
import { Department } from "@prisma/client";

class DepartmentService {
    async getAllDepartments() {
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
                        role: true,
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
                        role: true,
                    }
                }
            }
        });
    }

    async getDepartmentEmployees(departmentId: number) {
        const department = await prisma.department.findFirst({
            where: { id: departmentId },
            include: {
                Employees: true
            }
        });

        return department ? department.Employees || [] : [];
    }

    async getDepartmentById(departmentId: number) {
        const department = await prisma.department.findUnique({
            where: { id: departmentId },
            include: {
                DepartmentSchedule: true,
                Employees: true,
                Leader: true
            },
        });

        return department;
    }

    async createDepartment(body: any) {
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

    async updateDepartmentById(departmentId: number, body: Partial<Department>) {
        const { name, leaderId } = body;
        return await prisma.department.update({
            where: { id: departmentId },
            data: {
                name: name?.trim(),
                Leader: leaderId ? { connect: { id: leaderId } } : undefined,
            },
        });
    }

    async deleteDepartmentById(departmentId: number) {
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

    async getDepartmentSchedules(departmentId: number) {
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

    async getDepartmentSchedulesToday(departmentId: number) {
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

    async getDepartmentAttendance(departmentId: number) {
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

    async getDepartmentAttendanceToday(departmentId: number) {
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

    async updateDepartmentAssignEmployee(departmentId: number, role: string, employeeId: number) {
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

    async updateDepartmentRemoveEmployee(employeeId: number) {
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

    async updateDepartmentAssignLeader(departmentId: number, leaderId: number) {
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

    async updateDepartmentRemoveLeader(leaderId: number) {
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

export default new DepartmentService();
