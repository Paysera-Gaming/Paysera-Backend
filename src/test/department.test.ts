import request from 'supertest';
import app from '..';
import { Department, Employee } from '@prisma/client';
import EmployeeService from '../services/employee.service';

describe('Department Routes Test', () => {
    let departmentList: Department[];
    let departmentIdDelete: number;

    describe('GET Department', () => {
        it('should return a list of departments', async () => {
            const response = await request(app).get('/api/department').expect(200);
            expect(response.body.length).toBeGreaterThanOrEqual(1);
            departmentList = response.body;
        });

        it('should return a single department', async () => {
            const response = await request(app).get(`/api/department/${departmentList[0].id}`).expect(200);
            expect(response.body).toHaveProperty('id');
            expect(response.body.id).toBe(departmentList[0].id);
            expect(response.body.name).toBe(departmentList[0].name);
        });

        it('should return a 404', async () => {
            await request(app).get('/api/department/-1').expect(404);
        });
    });

    describe('POST Department', () => {
        it('should create a new department', async () => {
            const body = {
                name: 'Department POST',
                leaderId: departmentList[0].leaderId,

            };

            const response = await request(app)
                .post('/api/department')
                .send(body)

            console.log(response.body, 'response.body');
            expect(response.status).toBe(201);

        });

        it('should return 404 for non-existent leader', async () => {
            const newDepartment = {
                name: 'Department 2',
                leaderId: 100
            };

            await request(app)
                .post('/api/department')
                .send(newDepartment)
                .expect(404);
        });
    });

    describe('PUT Department', () => {
        it('should update a department', async () => {
            const response = await request(app)
                .put(`/api/department/${departmentList[0].id}`)
                .send({
                    name: 'Department PUT', leaderId: departmentList[0].leaderId,
                    auditorId: departmentList[0].auditorId
                })
                .expect(200);
        });
    });

    describe('Department Leader', () => {
        let departmentId: Number;

        it('should return a department leader', async () => {
            const deptResponse = await request(app).get(`/api/department/${departmentList[0].id}`).expect(200);
            departmentId = deptResponse.body.id;
            expect(deptResponse.body).toHaveProperty('leaderId');

            await request(app).get('/api/employee/team-leader').expect(200);
        });

        it('should assign a leader to a department', async () => {
            const getEmployeeResponse = await request(app).get('/api/employee/team-leader').expect(200);
            await request(app)
                .put(`/api/department/${departmentId}/leader`)
                .send({
                    departmentId: departmentId,
                    leaderId: getEmployeeResponse.body[0].id,
                }).expect(200);

            // Check if leader is assigned to department
            const departmentResponse = await request(app).get(`/api/department/${departmentId}`).expect(200);
            expect(departmentResponse.body.leaderId).toBe(getEmployeeResponse.body[0].id);

            // Check if employee is assigned to department
            const employeeResponse = await request(app).get(`/api/employee/${getEmployeeResponse.body[0].id}`).expect(200);
            expect(employeeResponse.body.departmentId).toBe(departmentId);
        });

        it('should return 400 error assign a employee as leader to a department', async () => {
            const createEmployee = await EmployeeService.createEmployee({
                username: 'employee',
                passwordCredentials: 'password',
                email: 'employee@example.com',
                firstName: 's',
                lastName: 's',
                middleName: 's',
                role: 's',
                isAllowedRequestOvertime: false,
                accessLevel: 'EMPLOYEE'
            });

            await request(app)
                .put(`/api/department/${departmentId}/leader`)
                .send({
                    departmentId: departmentId,
                    leaderId: createEmployee.id,
                }).expect(400);
        });

        it('should remove a leader from a department', async () => {
            const currentDepartment = await request(app).get(`/api/department/${departmentId}`).expect(200);

            await request(app)
                .delete(`/api/department/${departmentId}/leader`)
                .send({
                    leaderId: currentDepartment.body.leaderId,
                }).expect(200);

            // Check if leader is removed from department
            const departmentResponse = await request(app).get(`/api/department/${currentDepartment.body.id}`).expect(200);
            expect(departmentResponse.body.leaderId).toBe(null);

            // Check if employee is removed from department
            const employeeResponse = await request(app).get(`/api/employee/${currentDepartment.body.leaderId}`).expect(200);
            expect(employeeResponse.body.departmentId).toBe(null);
        });
    });

    describe('Department Employee', () => {
        let curEmployee: Employee;

        it('should return all employee', async () => {
            const response = await request(app)
                .get(`/api/department/${departmentList[0].id}/employee`).expect(200);

            expect(response.body).toBeInstanceOf(Array);
            expect(response.body.length).toBeGreaterThanOrEqual(0);
        });

        it('should assign employee to department ', async () => {
            const getEmployeeResponse = await request(app).get('/api/employee/only-employee').expect(200);
            curEmployee = getEmployeeResponse.body[0];

            await request(app)
                .put(`/api/department/${departmentList[0].id}/employee`)
                .send({
                    departmentId: departmentList[0].id,
                    username: curEmployee.username,
                    role: 'staff'
                }).expect(200);

            const deptEmployee = await request(app).get(`/api/department/${departmentList[0].id}/employee`).expect(200);

            // Check if employee is assigned to 
            expect(deptEmployee.body).toContainEqual(expect.objectContaining({
                id: curEmployee.id,
                role: 'STAFF'
            }));
        });

        it('should remove employee from department', async () => {
            const deptEmployee = await request(app).get(`/api/department/${departmentList[0].id}/employee`).expect(200);
            const currentEmployee = deptEmployee.body[0];
            const req = await request(app)
                .delete(`/api/department/${currentEmployee.departmentId}/employee`)
                .send({
                    departmentId: currentEmployee.departmentId,
                    employeeId: currentEmployee.id,
                }).expect(200);

            console.log(req.body, 'req.bodys');

            const employeeResponse = await request(app).get(`/api/employee/${currentEmployee.id}`).expect(200);
            expect(employeeResponse.body.departmentId).toBe(null);
        });
    });

    describe('DELETE Department', () => {
        it('should delete a department', async () => {
            departmentIdDelete = departmentList[0].id;
            const response = await request(app).get(`/api/department/${departmentIdDelete}`).expect(200);

            await request(app)
                .delete(`/api/department/${response.body.id}`).expect(200);

            await request(app).get(`/api/department/${response.body.id}`).expect(404);
        });

        it('should return a 404', async () => {
            const res = await request(app).delete('/api/department/0').expect(404);

            console.log(res.body, 'res.body 404');
        });
    });
});