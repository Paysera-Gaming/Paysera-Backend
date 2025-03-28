
import request from 'supertest';
import { server } from '..';
import { Employee, Prisma } from '@prisma/client';


describe('Employee Routes', () => {
    let listEmployee: Employee[];

    describe('GET Employee', () => {
        it('should return a list of employees', async () => {
            const response = await request(server).get('/api/employee').expect(200);
            listEmployee = response.body;
            console.log(listEmployee, "list of employees");

            expect(response.body.length).toBeGreaterThan(0);
        });
    });

    describe('GET employee by ID', () => {
        it('should return a single employee', async () => {
            const response = await request(server).get(`/api/employee/${listEmployee[0].id}`).expect(200);

            expect(response.body).toHaveProperty('id');
            expect(response.body.id).toBe(listEmployee[0].id);
            expect(response.body.firstName).toBe(listEmployee[0].firstName);
        });

        it('should return a 404', async () => {
            await request(server).get('/api/employee/-1').expect(404);
        });
    });

    describe('POST employee', () => {
        it('should create a new employee', async () => {
            const employee: Prisma.EmployeeCreateInput = {
                email: 'randomCreate@gmail.com',
                firstName: 'SampleCreate',
                lastName: 'SampleCreate',
                middleName: 'SampleCreate',
                username: 'SampleCreate',
                accessLevel: 'ADMIN',
                isActive: true,
                role: 'ADMIN',
                passwordCredentials: '123456789',
            };

            await request(server)
                .post('/api/employee')
                .send(employee)
                .expect(201);
        });

        it('should return a 404', async () => {
            await request(server).post('/api/employee/0').expect(404);
        });
    });

    describe('PUT employee', () => {
        const employeeUpdateSample = {
            email: "emailPut@gmail.com",
            username: 'SampleUpdate',
            firstName: 'SampleUpdate',
            lastName: 'SampleUpdate',
            middleName: 'SampleUpdate',
            accessLevel: 'ADMIN',
            isActive: true,
        };

        it('should update an employee', async () => {
            await request(server)
                .put(`/api/employee/${listEmployee[0].id}`)
                .send(employeeUpdateSample)
                .expect(200);
        });

        it('should return a 404', async () => {
            await request(server).put('/api/employee/-1').send(employeeUpdateSample).expect(404);
        });
    });

    describe('DELETE employee', () => {
        it('should delete an employee', async () => {
            await request(server).delete(`/api/employee/${listEmployee[0].id}`).expect(200);

            await request(server).get(`/api/employee/${listEmployee[0].id}`).expect(404);
        });

        it('should return a 404', async () => {
            await request(server).delete('/api/employee/-1').expect(404);
        });
    });
});