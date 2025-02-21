import { Request, Response } from "express";
import EmployeeService from "../services/employee.service";
import { io } from "..";

async function getAllEmployees(req: Request, res: Response) {
    const departmentId = req.query.department ? Number(req.query.department) : undefined;
    const role = req.query.role ? String(req.query.role).toUpperCase() : undefined;

    const allEmployees = await EmployeeService.getAllEmployees(departmentId, role);
    res.status(200).send(allEmployees);
}

async function getAllTeamLeaders(req: Request, res: Response) {
    const allTeamLeaders = await EmployeeService.getAllTeamLeaders();
    res.status(200).send(allTeamLeaders);
}

async function getAllOnlyEmployee(req: Request, res: Response) {
    const { role } = req.query;
    const allTeamMembers = await EmployeeService.getAllOnlyEmployee(role ? String(role) : undefined);
    res.status(200).send(allTeamMembers);
}

async function getAllAdmin(req: Request, res: Response) {
    const allAdmins = await EmployeeService.getAllAdmin();
    res.status(200).send(allAdmins);
}

async function getEmployeeById(req: Request, res: Response) {
    const employeeId = Number(req.params.id) || -1;
    const employee = await EmployeeService.getEmployeeById(employeeId);
    res.status(200).send(employee);
}

async function createEmployee(req: Request, res: Response) {
    await EmployeeService.createEmployee(req.body);

    io.emit("employee");
    res.status(201).send();
}

async function updateEmployee(req: Request, res: Response) {
    const employeeId = Number(req.params.id) || -1;
    await EmployeeService.updateEmployee(employeeId, req.body);

    io.emit("employee");
    res.status(200).send("Employee updated successfully");
}

async function deleteEmployeeById(req: Request, res: Response) {
    const employeeId = Number(req.params.id) || -1;
    const currentUserId = req.body.info.id;
    await EmployeeService.deleteEmployeeById(employeeId, currentUserId);

    io.emit("employee");
    res.status(200).send("Employee deleted successfully");
}

export default {
    getAllEmployees,
    getAllTeamLeaders,
    getAllOnlyEmployee,
    getAllAdmin,
    getEmployeeById,
    createEmployee,
    updateEmployee,
    deleteEmployeeById
};
