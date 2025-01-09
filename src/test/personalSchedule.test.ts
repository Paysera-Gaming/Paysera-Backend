import { server } from '..';
import request from 'supertest';
import { Employee, PersonalSchedule, Prisma } from '@prisma/client';

describe('Personal Schedule API', () => {

    let employee: Employee;
    let personalSchedule: PersonalSchedule;

    it('should create a new personal schedule', async () => {

        const employeeRest = await request(server).get('/api/employee');
        employee = employeeRest.body[0];

        const res = await request(server)
            .post('/api/personal-schedule')
            .send({
                employeeId: employee.id,
                name: 'Test Schedule',
                scheduleType: "FIXED",
                startTime: new Date('2024-08-01T09:00:00Z'),
                endTime: new Date('2024-08-01T17:00:00Z'),
                limitWorkHoursDay: 8,
                allowedOvertime: false,
            });

        expect(res.status).toBe(201);
        personalSchedule = res.body;
    });

    it('should get all personal schedules', async () => {
        const res = await request(server).get('/api/personal-schedule');
        expect(res.status).toBe(200);
    });

    it('should get a personal schedule by id', async () => {
        const res = await request(server).get(`/api/personal-schedule/${personalSchedule.id}`);
        expect(res.status).toBe(200);
    });


    it('should update a personal schedule', async () => {
        const res = await request(server)
            .put(`/api/personal-schedule/${personalSchedule.id}`)
            .send({
                employeeId: employee.id,
                name: 'Test Schedule',
                scheduleType: "FIXED",
                startTime: new Date('2024-08-01T09:00:00Z'),
                endTime: new Date('2024-08-01T17:00:00Z'),
                limitWorkHoursDay: 8,
                allowedOvertime: false,
            });
        expect(res.status).toBe(201);
    });

    it('should delete a personal schedule', async () => {
        const res = await request(server).delete(`/api/personal-schedule/${personalSchedule.id}`);
        expect(res.status).toBe(200);
    });
});