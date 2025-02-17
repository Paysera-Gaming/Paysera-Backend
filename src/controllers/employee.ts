import bcrypt from 'bcryptjs';
import e, { Request, Response } from "express";
import { prisma } from "../config/database";
import { validateCreateOneEmployee, validateEmployee, validateUpdateEmployee } from "../validate/employee.validation";
import { customThrowError } from '../middlewares/errorHandler';
import { io } from '../index';

async function getAllEmployees(req: Request, res: Response) {
    const departmentId = req.query.department ? Number(req.query.department) : undefined;
    const role = req.query.role ? String(req.query.role).toUpperCase() : undefined;

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

    io.emit("update-employee")

    res.status(200).send(allEmployees);
}

async function getAllTeamLeaders(req: Request, res: Response) {
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

    res.status(200).send(allTeamLeaders);
}

async function getAllOnlyEmployee(req: Request, res: Response) {
    const { role } = req.query;

    if (role && !["EMPLOYEE", "TEAM_LEADER", "ADMIN"].includes(String(role))) {
        return customThrowError(400, "Invalid role");
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

    res.status(200).send(allTeamMembers);
}



async function getAllAdmin(req: Request, res: Response) {
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

    res.status(200).send(allAdmins);
}

async function getEmployeeById(req: Request, res: Response) {
    const employeeId = Number(req.params.id) || -1;

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
        customThrowError(404, "Employee not found");
    }

    res.status(200).send(employee);
}

const createEmployee = async (req: Request, res: Response) => {

    validateCreateOneEmployee(req.body);

    const body = {
        email: req.body.email,
        username: req.body.username,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        middleName: req.body.middleName,
        accessLevel: req.body.accessLevel,
        isActive: req.body.isActive,
        passwordCredentials: req.body.passwordCredentials,
        role: req.body.role,
    }


    const existingEmployeeUsername = await prisma.employee.findFirst({
        where: {
            username: req.body.username,
        },
    });

    if (existingEmployeeUsername) {
        customThrowError(400, "Username already exists");
    }

    const existingEmployeeEmail = await prisma.employee.findFirst({
        where: {
            email: req.body.email,
        },
    });

    if (existingEmployeeEmail) {
        customThrowError(400, "Email already used");
    }

    const hashedPassword = await bcrypt.hash(req.body.passwordCredentials, 10);

    // Create employee
    await prisma.employee.create({
        data: {
            email: body.email,
            username: body.username,
            firstName: body.firstName,
            lastName: body.lastName,
            middleName: body.middleName,
            accessLevel: body.accessLevel,
            isActive: body.isActive,
            passwordCredentials: hashedPassword,
            role: body.role,
        },
    });

    res.status(201).send();
};

const updateEmployee = async (req: Request, res: Response) => {
    const employeeId = Number(req.params.id) || -1;

    validateUpdateEmployee(req.body);
    const body = {
        email: req.body.email ? req.body.email : undefined,
        username: req.body.username ? req.body.username : undefined,
        firstName: req.body.firstName ? req.body.firstName : undefined,
        lastName: req.body.lastName ? req.body.lastName : undefined,
        middleName: req.body.middleName ? req.body.middleName : undefined,
        accessLevel: req.body.accessLevel,
        isActive: req.body.isActive,
        role: req.body.role,
        password: req.body.password ? req.body.password : undefined,
    }

    const existingEmployee = await prisma.employee.findUnique({
        where: { id: employeeId },
    });

    if (!existingEmployee) {
        return customThrowError(404, "Employee not found");
    }

    // Update employee
    await prisma.employee.update({
        where: { id: Number(req.params.id) },
        data: {
            email: body.email ?? existingEmployee.email,
            username: body.username ?? existingEmployee.username,
            firstName: body.firstName ?? existingEmployee.firstName,
            lastName: body.lastName ?? existingEmployee.lastName,
            middleName: body.middleName ?? existingEmployee.middleName,
            accessLevel: req.body.accessLevel ?? existingEmployee.accessLevel,
            isActive: req.body.isActive ?? existingEmployee.isActive,
            departmentId: req.body.departmentId ?? existingEmployee.departmentId,
            role: req.body.role ?? existingEmployee.role,
            passwordCredentials: body.password ? await bcrypt.hash(body.password, 10) : existingEmployee.passwordCredentials,
        },
    });

    res.status(200).send("Employee updated successfully");
};


const deleteEmployeeById = async (req: Request, res: Response) => {
    const employeeId = Number(req.params.id) || -1;

    if (req.body.info && req.body.info.id === employeeId) {
        return customThrowError(400, "You can't delete yourself");
    }

    const existingEmployee = await prisma.employee.findUnique({
        where: { id: employeeId },
    });

    if (!existingEmployee) {
        customThrowError(404, "Employee not found");
    }

    // Delete employee
    await prisma.employee.delete({
        where: { id: employeeId },
    });

    res.status(200).send("Employee deleted successfully");
};


export default {
    getAllEmployees,
    getAllTeamLeaders,
    getAllOnlyEmployee,
    getAllAdmin,
    getEmployeeById,
    createEmployee,
    updateEmployee,
    deleteEmployeeById,
};
