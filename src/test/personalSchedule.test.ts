import { server } from '..';
import request from 'supertest';
import { Employee, PersonalSchedule, Prisma } from '@prisma/client';
import { prisma } from '../config/database';

describe('Personal Schedule API', () => {

    let employee: Employee;
    let personalSchedule: PersonalSchedule;

    it('should create a new personal schedule', async () => {
        const employeeRest = await request(server).get('/api/employee');
        employee = employeeRest.body[0];
        console.log(employee.firstName, "employee1st");


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


        let employee2 = employeeRest.body[2];
        const res = await request(server).post('/api/personal-schedule').send({
            employeeId: employee2.id,
            name: 'Test Schedule',
            scheduleType: "FIXED",
            startTime: new Date(2024, 8, 1, 9, 0, 0),
            endTime: new Date(2024, 8, 1, 17, 0, 0),
            limitWorkHoursDay: 8,
            allowedOvertime: false,
            day: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY"],
        });

        expect(res.status).toBe(201);
    });

    it('should return error because a employee have a schedule', async () => {
        let temp = employee
        const res = await request(server).post('/api/personal-schedule').send({
            employeeId: temp.id,
            name: 'Test Schedule',
            scheduleType: "FIXED",
            startTime: new Date(2024, 8, 1, 9, 0, 0),
            endTime: new Date(2024, 8, 1, 17, 0, 0),
            limitWorkHoursDay: 8,
            allowedOvertime: false,
            day: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY"],
        });

        console.log(res.body, "wewewe", temp.firstName);
        const data = await prisma.personalSchedule.findFirst({
            where: {
                employeeId: temp.id
            }, include: {
                Employee: true
            }
        });

        console.log(data, "data");

        expect(res.status).toBe(400);
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
                name: 'Test Schedule',
                scheduleType: "FIXED",
                startTime: new Date(2024, 8, 1, 9, 0, 0),
                endTime: new Date(2024, 8, 1, 17, 0, 0),
                limitWorkHoursDay: 8,
                allowedOvertime: false,
            });
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
                limitWorkHoursDay: 8,
                allowedOvertime: false,
            });
        expect(res.status).toBe(400);
    });

    it('should delete a personal schedule', async () => {
        const res = await request(server).delete(`/api/personal-schedule/${personalSchedule.id}`);
        expect(res.status).toBe(200);
    });
});