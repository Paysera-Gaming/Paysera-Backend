import { server } from '..';
import request from 'supertest';
import { Employee, PersonalSchedule, Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { before } from 'node:test';

describe('Personal Schedule API', () => {

    let employee: Employee;
    let personalSchedule: PersonalSchedule;
    before(async () => {
        const employeeRest = await request(server).get('/api/employee');
        employee = employeeRest.body[0];
        const schedule = await prisma.schedule.create({
            data: {
                scheduleType: "FIXED",
                startTime: new Date(2024, 8, 1, 9, 0, 0),
                endTime: new Date(2024, 8, 1, 17, 0, 0),
            },
        });

        personalSchedule = await prisma.personalSchedule.create({
            data: {
                name: 'Test Schedule',
                employeeId: employee.id,
                scheduleId: schedule.id,
                day: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY",],
            },
        });
    });

    it('should create a new personal schedule', async () => {
        const employeeRest = await request(server).get('/api/employee');
        employee = employeeRest.body[0];
        const employee2 = employeeRest.body[2];
        const res = await request(server).post('/api/personal-schedule').send({
            employeeId: employee2.id,
            name: 'Test Schedule',
            scheduleType: "FIXED",
            startTime: new Date(2024, 8, 1, 9, 0, 0),
            endTime: new Date(2024, 8, 1, 17, 0, 0),
            day: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY"],
        });

        expect(res.status).toBe(201);
    });

    it('should return error because employee id not exist', async () => {
        const nonExistentId = 9999;
        const res = await request(server).post('/api/personal-schedule').send({
            employeeId: nonExistentId,
            name: 'Test Schedule',
            scheduleType: "FIXED",
            startTime: new Date(2024, 8, 1, 9, 0, 0),
            endTime: new Date(2024, 8, 1, 17, 0, 0),
            limitWorkHoursDay: 8,
            allowedOvertime: false,
            day: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY"],
        });


        expect(res.status).toBe(404);
    });

    it('should get all personal schedules', async () => {
        const res = await request(server).get('/api/personal-schedule');
        expect(res.status).toBe(200);
        expect(res.body.length).toBeGreaterThan(0);
        console.log(res.body, "all personal schedules");

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
                name: 'Updated Test Schedule',
                scheduleType: "FIXED",
                startTime: new Date(2024, 8, 1, 9, 0, 0),
                endTime: new Date(2024, 8, 1, 17, 0, 0),
                day: ["SATURDAY"]
            });

        console.log(res.body, "wew");

        expect(res.status).toBe(201);
    });


    it('should return error if start time is after end time', async () => {
        const res = await request(server)
            .put(`/api/personal-schedule/${personalSchedule.id}`)
            .send({
                employeeId: employee.id,
                name: 'Test Schedule',
                scheduleType: "FIXED",
                startTime: new Date(2024, 8, 1, 9, 0, 0),
                endTime: new Date(2024, 8, 1, 2, 0, 0),
                day: ["SATURDAY"]

            });
        expect(res.status).toBe(400);
    });

    it('should delete a personal schedule', async () => {
        const res = await request(server).delete(`/api/personal-schedule/${personalSchedule.id}`);
        expect(res.status).toBe(200);
    });
});