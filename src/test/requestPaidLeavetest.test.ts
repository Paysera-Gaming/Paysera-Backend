import request from 'supertest';
import app from '..'; // Adjust import based on your setup
import EmployeeService from '../services/employee.service';
import { Employee } from '@prisma/client';

describe('REQUEST LEAVE', () => {
    let employee: Employee;
    let attendanceId: number;
    beforeAll(async () => {
        // Add any setup code here
        employee = await EmployeeService.createEmployee({
            email: 'paidLeaveRequest@example.com',
            username: "paidLeaveRequest",
            accessLevel: "EMPLOYEE",
            passwordCredentials: "paidLeaveRequest",
            firstName: "paidLeaveRequest",
            lastName: "paidLeaveRequest",
            middleName: "paidLeaveRequest",
            role: "EMPLOYEE",
            isAllowedRequestOvertime: false
        });

    });

    describe('REQUEST PAID LEAVE', () => {
        it('should create with valid pending request overtime ', async () => {
            const response = await request(app)
                .post('/api/attendance')
                .send({
                    date: new Date(2025, 0, 1),
                    timeIn: new Date(2025, 0, 1, 8, 0, 0),
                    timeOut: new Date(2025, 0, 1, 17, 0, 0),
                    status: 'PAID_LEAVE',
                    RequestLeaveStatus: 'PENDING',
                    employeeId: employee.id,
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('status', 'PAID_LEAVE');
            expect(response.body).toHaveProperty('RequestLeaveStatus', 'PENDING');

            attendanceId = response.body.id;
        });

        it('should return 400 for invalid attendance ID', async () => {
            const response = await request(app)
                .post('/api/attendance')
                .send({});
            expect(response.status).toBe(400);
        });

        it('should return 400 for invalid employee ID', async () => {
            const response = await request(app)
                .post('/api/attendance')
                .send({
                    date: new Date(2025, 0, 1),
                    timeIn: new Date(2025, 0, 1, 8, 0, 0),
                    timeOut: new Date(2025, 0, 1, 17, 0, 0),
                    status: 'PAID_LEAVE',
                    RequestLeaveStatus: 'PENDING',
                    employeeId: employee.id,
                });
            expect(response.status).toBe(400);
        });

        it('should return 400 for invalid employee ID', async () => {
            const response = await request(app)
                .post('/api/attendance')
                .send({
                    date: new Date(2025, 0, 1),
                    timeIn: new Date(2025, 0, 1, 8, 0, 0),
                    timeOut: new Date(2025, 0, 1, 17, 0, 0),
                    status: 'PAID_LEAVE',
                    RequestLeaveStatus: 'PENDING',
                    employeeId: employee.id + 10,
                });
            expect(response.status).toBe(404);
        });

        it('should return 400 for invalid date', async () => {
            const response = await request(app)
                .post('/api/attendance')
                .send({
                    date: 'xyz',
                });
            expect(response.status).toBe(400);
        });
    });

    describe('ACCEPT REQUEST LEAVE', () => {
        it('should accept request leave', async () => {
            const response = await request(app)
                .put(`/api/attendance/${attendanceId}`)
                .send({
                    date: new Date(2025, 0, 1),
                    status: 'PAID_LEAVE',
                    RequestLeaveStatus: 'APPROVED_BY_ADMIN',
                    employeeId: employee.id,
                });
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('status', 'PAID_LEAVE');
            expect(response.body).toHaveProperty('RequestLeaveStatus', 'APPROVED_BY_ADMIN');
        });

        it('should return 400 for invalid attendance ID', async () => {
            const response = await request(app)
                .put(`/api/attendance/${-10}`)
                .send({
                    date: new Date(2025, 0, 1),
                    status: 'PAID_LEAVE',
                    RequestLeaveStatus: 'APPROVED_BY_ADMIN',
                    employeeId: employee.id,
                });
            expect(response.status).toBe(404);
        });
    });
});