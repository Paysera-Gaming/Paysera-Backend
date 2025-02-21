import { Request, Response } from "express";
import bcrypt from 'bcryptjs';
import EmployeeService from "../services/employee.service";
import { io } from "..";
import { validateCreateOneEmployee, validateUpdateEmployee } from "../validation/employee.validation";
import { prisma } from "../config/database";
import { raiseHttpError } from "../middlewares/errorHandler";

export const EmployeeController = {
    async getAllEmployees(req: Request, res: Response) {
        const departmentId = req.query.department ? Number(req.query.department) : undefined;
        const role = req.query.role ? String(req.query.role).toUpperCase() : undefined;

        const allEmployees = await EmployeeService.getAllEmployees(departmentId, role);
        res.status(200).send(allEmployees);
    },

    async getAllTeamLeaders(req: Request, res: Response) {
        const allTeamLeaders = await EmployeeService.getAllTeamLeaders();
        res.status(200).send(allTeamLeaders);
    },

    async getAllOnlyEmployee(req: Request, res: Response) {
        const allTeamMembers = await EmployeeService.getAllOnlyEmployee();
        res.status(200).send(allTeamMembers);
    },

    async getAllAdmin(req: Request, res: Response) {
        const allAdmins = await EmployeeService.getAllAdmin();
        res.status(200).send(allAdmins);
    },

    async getEmployeeById(req: Request, res: Response) {
        const employeeId = Number(req.params.id) || -1;
        const employee = await EmployeeService.getEmployeeById(employeeId);
        if (!employee) {
            throw raiseHttpError(404, "Employee not found");
        }
        res.status(200).send(employee);
    },

    async createEmployee(req: Request, res: Response) {
        const data = req.body;
        validateCreateOneEmployee(data);

        const existingEmployeeUsername = await prisma.employee.findFirst({
            where: {
                username: data.username,
            },
        });

        if (existingEmployeeUsername) {
            throw raiseHttpError(400, "Username already used");
        }

        const existingEmployeeEmail = await prisma.employee.findFirst({
            where: {
                email: data.email,
            },
        });

        if (existingEmployeeEmail) {
            throw raiseHttpError(400, "Email already used");
        }

        const hashedPassword = await bcrypt.hash(data.passwordCredentials, 10);
        await EmployeeService.createEmployee({ ...data, passwordCredentials: hashedPassword });

        io.emit("employee");
        res.status(201).send("Employee created successfully");
    },

    async updateEmployee(req: Request, res: Response) {
        const employeeId = Number(req.params.id) || -1;
        const data = req.body;
        validateUpdateEmployee(data);

        const existingEmployee = await prisma.employee.findUnique({
            where: { id: employeeId },
        });

        if (!existingEmployee) {
            throw raiseHttpError(404, "Employee not found");
        }

        const updatedEmployee = {
            ...existingEmployee,
            ...data,
        };

        await EmployeeService.updateEmployee(employeeId, updatedEmployee);

        io.emit("employee");
        res.status(200).send("Employee updated successfully");
    },

    async deleteEmployeeById(req: Request, res: Response) {
        const employeeId = Number(req.params.id) || -1;
        const currentUserId = req.body.info.id;

        if (currentUserId === employeeId) {
            throw raiseHttpError(400, "You can't delete yourself");
        }

        const existingEmployee = await prisma.employee.findUnique({
            where: { id: employeeId },
        });

        if (!existingEmployee) {
            throw raiseHttpError(404, "Employee not found");
        }

        await EmployeeService.deleteEmployeeById(employeeId);

        io.emit("employee");
        res.status(200).send("Employee deleted successfully");
    }
};

export default EmployeeController;
