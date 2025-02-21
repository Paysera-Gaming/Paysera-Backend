import { Request, Response } from "express";
import DepartmentService from "../services/department.service";
import { io } from "..";
import { validateCreateDepartment, validateDepartmentAssignEmployee, validateDepartmentAssignLeader, validateDepartmentRemoveEmployee, validateUpdateDepartment } from "../validation/department.validation";
import { raiseHttpError } from '../middlewares/errorHandler';
import EmployeeService from "../services/employee.service";
import { AccessLevel } from "@prisma/client";

export const departmentController = {
    getAllDepartments: async (req: Request, res: Response) => {
        const allDepartments = await DepartmentService.getAllDepartments();
        res.status(200).send(allDepartments);
    },

    getDepartmentEmployees: async (req: Request, res: Response) => {
        const departmentId = Number(req.params.id);
        if (!departmentId) {
            return raiseHttpError(400, "Invalid department ID");
        }

        const employees = await DepartmentService.getDepartmentEmployees(departmentId);
        res.status(200).send(employees);
    },

    getDepartmentLeader: async (req: Request, res: Response) => {
        const departmentId = Number(req.params.id);
        if (!departmentId) {
            return raiseHttpError(400, "Invalid department ID");
        }

        const department = await DepartmentService.getDepartmentById(departmentId);

        if (!department) {
            throw raiseHttpError(404, "Department not found");
        }

        res.status(200).send(department.Leader || "No leader assigned");
    },

    getDepartmentById: async (req: Request, res: Response) => {
        const departmentId = Number(req.params.id);
        if (!departmentId) {
            throw raiseHttpError(400, "Invalid department ID");
        }

        const department = await DepartmentService.getDepartmentById(departmentId);
        if (!department) {
            throw raiseHttpError(404, "Department not found");
        }

        res.status(200).send(department);
    },

    createDepartment: async (req: Request, res: Response) => {
        validateCreateDepartment(req.body);

        const teamLead = await EmployeeService.getEmployeeById(req.body.leaderId);
        if (!teamLead) {
            throw raiseHttpError(404, "Leader not found");
        } if (teamLead.accessLevel === "EMPLOYEE") {
            throw raiseHttpError(400, "Employee is not an admin or team leader");
        }

        const updatedData = { ...req.body, leaderId: req.body.leaderId };
        const department = await DepartmentService.createDepartment(updatedData);

        io.emit("department");
        res.status(201).send(department);

    },

    updateDepartmentById: async (req: Request, res: Response) => {
        const departmentId = Number(req.params.id);
        if (!departmentId) {
            return raiseHttpError(400, "Invalid department ID");
        }

        validateUpdateDepartment(req.body);


        const existingDepartment = await DepartmentService.getDepartmentById(departmentId);
        if (!existingDepartment) {
            throw raiseHttpError(400, "Department already exists");
        }


        let teamLead;
        if (req.body.leaderId) {
            teamLead = await EmployeeService.getEmployeeById(req.body.leaderId);
            if (!teamLead) {
                throw raiseHttpError(404, "Leader not found");
            } if (!teamLead) {
                throw raiseHttpError(404, "Leader not found");
            } else if (teamLead.accessLevel === "EMPLOYEE") {
                throw raiseHttpError(400, "Employee is not an admin or team leader");
            }

        }

        const updatedData = { ...existingDepartment, ...req.body };
        const message = await DepartmentService.updateDepartmentById(departmentId, updatedData);

        io.emit("department");
        res.status(200).send(message);

    },

    deleteDepartmentById: async (req: Request, res: Response) => {
        const departmentId = Number(req.params.id);
        if (!departmentId) {
            return raiseHttpError(404, "Invalid department ID");
        }

        const existingDepartment = await DepartmentService.getDepartmentById(departmentId);
        if (!existingDepartment) {
            throw raiseHttpError(404, "Department not found");
        }

        await DepartmentService.deleteDepartmentById(departmentId);

        io.emit("department");
        res.status(200).send(`The department of ${existingDepartment.name} is deleted successfully`);
    },

    getDepartmentSchedules: async (req: Request, res: Response) => {
        const departmentId = Number(req.params.id);
        if (!departmentId) {
            return raiseHttpError(404, "Invalid department ID");
        }

        const schedules = await DepartmentService.getDepartmentSchedules(departmentId);
        res.status(200).send(schedules);
    },

    getDepartmentSchedulesToday: async (req: Request, res: Response) => {
        const departmentId = Number(req.params.id);
        if (!departmentId) {
            return raiseHttpError(404, "Invalid department ID");
        }

        const schedules = await DepartmentService.getDepartmentSchedulesToday(departmentId);
        res.status(200).send(schedules);
    },

    getDepartmentAttendance: async (req: Request, res: Response) => {
        const departmentId = Number(req.params.id);
        if (!departmentId) {
            return raiseHttpError(400, "Invalid department ID");
        }

        const existingDepartment = await DepartmentService.getDepartmentById(departmentId);
        if (!existingDepartment) {
            throw raiseHttpError(404, "Department not found");
        }

        const attendance = await DepartmentService.getDepartmentAttendance(departmentId);
        res.status(200).send(attendance);
    },

    getDepartmentAttendanceToday: async (req: Request, res: Response) => {
        const departmentId = Number(req.params.id);
        if (!departmentId) {
            return raiseHttpError(400, "Invalid department ID");
        }

        const existingDepartment = await DepartmentService.getDepartmentById(departmentId);
        if (!existingDepartment) {
            throw raiseHttpError(404, "Department not found");
        }

        const attendance = await DepartmentService.getDepartmentAttendanceToday(departmentId);
        res.status(200).send(attendance);
    },

    updateDepartmentAssignEmployee: async (req: Request, res: Response) => {
        const { departmentId, role, username } = {
            departmentId: Number(req.params.id),
            role: req.body.role,
            username: req.body.username
        };

        validateDepartmentAssignEmployee({ departmentId, role, username });
        const existingDepartment = await DepartmentService.getDepartmentById(departmentId);
        if (!existingDepartment) {
            throw raiseHttpError(404, "Department not found");
        }

        const employee = await EmployeeService.getEmployeeByUsername(username);
        if (!employee) {
            throw raiseHttpError(404, "Employee not found");
        }

        await DepartmentService.updateDepartmentAssignEmployee(departmentId, role, employee.id);


        io.emit('department');
        res.status(200).send(`Employee ${username} assigned to department ${existingDepartment.name} as ${role}`);

    },

    updateDepartmentRemoveEmployee: async (req: Request, res: Response) => {
        const departmentId = Number(req.params.id);
        const { employeeId } = req.body;

        validateDepartmentRemoveEmployee({ departmentId, employeeId });
        const [department, employee] = await Promise.all([
            DepartmentService.getDepartmentById(departmentId),
            EmployeeService.getEmployeeById(employeeId)
        ]);

        if (!department) {
            throw raiseHttpError(404, "Department not found");
        } if (!employee) {
            throw raiseHttpError(404, "Employee not found");
        }

        await DepartmentService.updateDepartmentRemoveEmployee(employeeId);

        io.emit('department');
        res.status(200).send(`Employee ${employee.lastName} removed from department ${department.name} successfully`);

    },

    updateDepartmentAssignLeader: async (req: Request, res: Response) => {
        const departmentId = Number(req.params.id);
        const { leaderId } = {
            leaderId: Number(req.body.leaderId)
        };

        validateDepartmentAssignLeader({ departmentId, leaderId });
        const [department, employee] = await Promise.all([
            DepartmentService.getDepartmentById(departmentId),
            EmployeeService.getEmployeeById(leaderId)
        ]);

        if (!department) {
            throw raiseHttpError(404, "Department not found");
        } if (!employee) {
            throw raiseHttpError(404, "Employee not found");
        } if (employee.accessLevel !== AccessLevel.TEAM_LEADER) {
            throw raiseHttpError(400, "Employee is not a team leader");
        }

        await DepartmentService.updateDepartmentAssignLeader(departmentId, leaderId);

        io.emit('department');
        res.status(200).send(`Employee ${employee.lastName} assigned as leader of department ${department.name} successfully`);
    },

    updateDepartmentRemoveLeader: async (req: Request, res: Response) => {
        const departmentId = Number(req.params.id);
        if (!departmentId) {
            return raiseHttpError(400, "Invalid department ID");
        }

        const existingDepartment = await DepartmentService.getDepartmentById(departmentId);
        if (!existingDepartment) {
            throw raiseHttpError(404, "Department not found");
        }

        const leader = existingDepartment.Leader;
        if (!leader) {
            throw raiseHttpError(404, "Department has no leader");
        }

        await DepartmentService.updateDepartmentRemoveLeader(leader.id);

        io.emit('department');
        res.status(200).send(`Leader removed from department ${existingDepartment.name} successfully`);
    }
};