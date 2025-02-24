import { prisma } from "../config/database";
import { raiseHttpError } from '../middlewares/errorHandler';
import { Employee } from '@prisma/client';

export class EmployeeService {
    static async getAllEmployees(departmentId?: number, role?: string) {
        const allEmployees = await prisma.employee.findMany({
            where: {
                departmentId,
                role,
            },
            select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                middleName: true,
                accessLevel: true,
                isActive: true,
                departmentId: true,
                role: true,
            },
            orderBy: {
                updatedAt: "desc",
            },
        });

        return allEmployees;
    }

    static async getAllTeamLeaders() {
        const allTeamLeaders = await prisma.employee.findMany({
            where: {
                accessLevel: "TEAM_LEADER",
            },
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
            },
        });

        return allTeamLeaders;
    }

    static async getAllOnlyEmployee() {
        const allTeamMembers = await prisma.employee.findMany({
            where: {
                accessLevel: "EMPLOYEE",
            },
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
            },
        });

        return allTeamMembers;
    }

    static async getAllAdmin() {
        const allAdmins = await prisma.employee.findMany({
            where: {
                accessLevel: "ADMIN",
            },
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
            },
        });

        return allAdmins;
    }

    static async getEmployeeById(employeeId: number) {
        const employee = await prisma.employee.findFirst({
            where: {
                id: employeeId,
            },
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
            },
        });

        return employee;
    }

    static async getEmployeeByUsername(username: string) {
        const employee = await prisma.employee.findFirst({
            where: {
                username,
            },
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
            },
        });

        return employee;
    }

    static async getEmployeeByEmail(email: string) {
        const employee = await prisma.employee.findFirst({
            where: {
                email,
            },
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
            },
        });

        return employee;
    }

    static async getEmployeeByUserNameAuth(username: string) {
        const employee = await prisma.employee.findFirst({
            where: {
                username,
            },

        });

        return employee;
    }
    static async createEmployee(data: Employee) {
        await prisma.employee.create({
            data: {
                email: data.email,
                username: data.username,
                firstName: data.firstName,
                lastName: data.lastName,
                middleName: data.middleName,
                accessLevel: data.accessLevel,
                isActive: data.isActive,
                passwordCredentials: data.passwordCredentials,
                role: data.role,
            },
        });
    }

    static async updateEmployee(employeeId: number, data: any) {
        const existingEmployee = await prisma.employee.findFirst({
            where: {
                id: employeeId,
            },
        });

        await prisma.employee.update({
            where: { id: employeeId },
            data: {
                email: data.email || existingEmployee?.email,
                username: data.username || existingEmployee?.username,
                firstName: data.firstName || existingEmployee?.firstName,
                lastName: data.lastName || existingEmployee?.lastName,
                middleName: data.middleName || existingEmployee?.middleName,
                accessLevel: data.accessLevel || existingEmployee?.accessLevel,
                isActive: data.isActive !== undefined ? data.isActive : existingEmployee?.isActive,
                departmentId: data.departmentId || existingEmployee?.departmentId,
                role: data.role || existingEmployee?.role,
                passwordCredentials: data.password || existingEmployee?.passwordCredentials,
                isAllowedRequestOvertime: data.isAllowedRequestOvertime || existingEmployee?.isAllowedRequestOvertime,
            },
        });
    }

    static async deleteEmployeeById(employeeId: number,) {
        await prisma.employee.delete({
            where: { id: employeeId },
        });
    }
}

export default EmployeeService;