import bcrypt from 'bcryptjs';
import { prisma } from "../config/database";
import { validateCreateOneEmployee, validateUpdateEmployee } from "../validation/employee.validation";
import { customThrowError } from '../middlewares/errorHandler';

class EmployeeService {
    async getAllEmployees(departmentId?: number, role?: string) {
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

    async getAllTeamLeaders() {
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

    async getAllOnlyEmployee(role?: string) {
        if (role && !["EMPLOYEE", "TEAM_LEADER", "ADMIN"].includes(role)) {
            throw customThrowError(400, "Invalid role");
        }

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

    async getAllAdmin() {
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

    async getEmployeeById(employeeId: number) {
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

        if (!employee) {
            throw customThrowError(404, "Employee not found");
        }

        return employee;
    }

    async createEmployee(data: any) {
        validateCreateOneEmployee(data);

        const existingEmployeeUsername = await prisma.employee.findFirst({
            where: {
                username: data.username,
            },
        });

        if (existingEmployeeUsername) {
            throw customThrowError(400, "Username already exists");
        }

        const existingEmployeeEmail = await prisma.employee.findFirst({
            where: {
                email: data.email,
            },
        });

        if (existingEmployeeEmail) {
            customThrowError(400, "Email already used");
        }

        const hashedPassword = await bcrypt.hash(data.passwordCredentials, 10);

        await prisma.employee.create({
            data: {
                email: data.email,
                username: data.username,
                firstName: data.firstName,
                lastName: data.lastName,
                middleName: data.middleName,
                accessLevel: data.accessLevel,
                isActive: data.isActive,
                passwordCredentials: hashedPassword,
                role: data.role,
            },
        });
    }

    async updateEmployee(employeeId: number, data: any) {
        validateUpdateEmployee(data);

        const existingEmployee = await prisma.employee.findUnique({
            where: { id: employeeId },
        });

        if (!existingEmployee) {
            throw customThrowError(404, "Employee not found");
        }

        await prisma.employee.update({
            where: { id: employeeId },
            data: {
                email: data.email ?? existingEmployee.email,
                username: data.username ?? existingEmployee.username,
                firstName: data.firstName ?? existingEmployee.firstName,
                lastName: data.lastName ?? existingEmployee.lastName,
                middleName: data.middleName ?? existingEmployee.middleName,
                accessLevel: data.accessLevel ?? existingEmployee.accessLevel,
                isActive: data.isActive ?? existingEmployee.isActive,
                departmentId: data.departmentId ?? existingEmployee.departmentId,
                role: data.role ?? existingEmployee.role,
                passwordCredentials: data.password ? await bcrypt.hash(data.password, 10) : existingEmployee.passwordCredentials,
            },
        });
    }

    async deleteEmployeeById(employeeId: number, currentUserId: number) {
        if (currentUserId === employeeId) {
            throw customThrowError(400, "You can't delete yourself");
        }

        const existingEmployee = await prisma.employee.findUnique({
            where: { id: employeeId },
        });

        if (!existingEmployee) {
            throw customThrowError(404, "Employee not found");
        }

        await prisma.employee.delete({
            where: { id: employeeId },
        });
    }
}

export default new EmployeeService();