import { z } from "zod";


function validateCreateOneEmployee(employee: any) {
    const employeeSchema = z.object({
        email: z.string().email(),
        username: z.string().min(8).max(50),
        firstName: z.string().min(2).max(50),
        lastName: z.string().min(2).max(50),
        middleName: z.string().min(1).max(50),
        role: z.string().min(2).max(50).optional(),
        accessLevel: z.enum(["ADMIN", "TEAM_LEADER", "EMPLOYEE", "AUDITOR", "SUPER_AUDITOR"]),
        isActive: z.boolean().optional(),
        passwordCredentials: z.string().min(8).max(30),
        departmentId: z.number().optional(),
        createdAt: z.date().optional(),
        updatedAt: z.date().optional(),
        isAllowedRequestOvertime: z.boolean().optional(),
    });

    employeeSchema.parse(employee);
}

function validateUpdateEmployee(employee: any) {
    const updateEmployeeSchema = z.object({
        email: z.string().email().optional(),
        username: z.string().min(8).max(50).optional(),
        firstName: z.string().min(2).max(50).optional(),
        lastName: z.string().min(2).max(50).optional(),
        middleName: z.string().min(1).max(50).optional(),
        role: z.string().min(2).max(50).optional(),
        accessLevel: z.enum(["ADMIN", "TEAM_LEADER", "EMPLOYEE", "AUDITOR", "SUPER_AUDITOR"]).optional(),
        isActive: z.boolean().optional(),
        passwordCredentials: z.string().min(8).max(30).optional(),
        departmentId: z.number().optional(),
        updatedAt: z.date().optional(),
        isAllowedRequestOvertime: z.boolean().optional(),
    });

    updateEmployeeSchema.parse(employee);
}

function validateEmployee(employee: any) {
    const employeeSchema = z.object({
        email: z.string().email(),
        firstName: z.string().min(2).max(50),
        lastName: z.string().min(2).max(50),
        middleName: z.string().min(2).max(50),
        role: z.string().min(2).max(50),
        accessLevel: z.enum(["ADMIN", "TEAM_LEADER", "EMPLOYEE", "AUDITOR", "SUPER_AUDITOR"]),
        isActive: z.boolean().optional(),
        passwordCredentials: z.string().min(8).max(30),
        departmentId: z.number().optional(),
        createdAt: z.date().optional(),
        updatedAt: z.date().optional(),
        isAllowedRequestOvertime: z.boolean().optional()
    });

    employeeSchema.parse(employee);
}


export { validateCreateOneEmployee, validateUpdateEmployee, validateEmployee }; 