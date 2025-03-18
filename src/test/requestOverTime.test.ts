import request from 'supertest';
import app from '..';
import { prisma } from '../config/database';
import { Employee } from '@prisma/client';
import { printDate } from '../utils/date';

describe('REQUEST OVERTIME', () => {
    let employeeId: number;
    let departmentId: number;
    let departmentScheduleId: number;
    let fixedSchedule: any;
    let employeeOvertime: Employee;

    beforeAll(async () => {
        // Create a department
        const department = await prisma.department.create({
            data: {
                name: 'Overtime Department',
            },
        });

        departmentId = department.id;
        employeeOvertime = await prisma.employee.create({
            data: {
                email: "randomOverTime@gmail.com",
                role: 'Programmer',
                departmentId: department.id,
                username: 'OvertimeRequest',
                passwordCredentials: 'password',
                firstName: 'OvertimeRequest',
                lastName: 'OvertimeRequest',
                middleName: 'OvertimeRequest',
                accessLevel: 'EMPLOYEE',
            },
        });

        // Create a department schedule
        fixedSchedule = await prisma.schedule.create({
            data: {
                scheduleType: 'FIXED',
                startTime: new Date(2020, 8, 15, 8, 0, 0),  // 8:00 AM
                endTime: new Date(2020, 8, 15, 17, 0, 0),   // 5:00 PM
                DepartmentSchedule: {
                    create: {
                        departmentId,
                        role: 'Programmer',
                    },
                },
            },
        });

        departmentScheduleId = fixedSchedule.id;

        // Create an employee and set a time-in record to use in tests
        const employee = await prisma.employee.create({
            data: {
                email: "random11@gmail.com",
                role: 'Programmer',
                departmentId,
                username: 'FixedClock',
                passwordCredentials: 'password',
                firstName: 'FixedClock',
                lastName: 'FixedClock',
                middleName: 'FixedClock',
                accessLevel: 'EMPLOYEE',
            },
        });

        employeeId = employee.id;

    });

    describe('For overtime request', () => {
        const timeInOverTime = new Date(2025, 8, 15, 8, 0, 0);  // get the current time 8:00 AM
        it('should clock in 8am', async () => {

            const res = await request(app)
                .post('/api/attendance/time-in')
                .send({
                    employeeId: employeeOvertime.id,
                    timeStamp: timeInOverTime,
                });

            console.log(res.body, "over time in request");

            expect(res.status).toBe(200);
        });

        it('should return 400 if overtime request is less than 8 hours', async () => {
            const overtimeRequest = new Date(2025, 8, 15, 13, 0, 0); // 4:00 PM

            const res = await request(app)
                .get('/api/attendance/request-overtime')
                .send({
                    employeeId: employeeOvertime.id,
                    timeStamp: overtimeRequest,
                    limitOvertime: 3,
                });

            expect(res.status).toBe(400);
        });

        it('should return 400 if limit overtime request is exceed than 4 ', async () => {
            const tempTime = new Date(2025, 8, 15, 17, 30, 0); // 5:30 PM

            const res = await request(app)
                .post('/api/attendance/request-overtime')
                .send({
                    employeeId: employeeOvertime.id,
                    timeStamp: tempTime,
                    limitOvertime: 5,
                });

            console.log(res.body, "res test 4");


            expect(res.status).toBe(400);
        });


        it('should request overtime 9 1/2 hours after time in', async () => {
            const overtimeRequest = new Date(2025, 8, 15, 17, 30, 0); // 5:30 PM

            const res = await request(app)
                .post('/api/attendance/accept-overtime')
                .send({
                    employeeId: employeeOvertime.id,
                    timeStamp: overtimeRequest,
                    limitOvertime: 4,
                    RequestOverTimeStatus: 'PENDING',
                });

            expect(res.status).toBe(200);
        });

        it('should time out calculate the right hour based on the request overtime', async () => {
            const timeOutOverTime = new Date(2025, 8, 15, 19, 0, 0); // 9:00 PM        

            const res = await request(app)
                .post('/api/attendance/time-out')
                .send({
                    employeeId: employeeOvertime.id,
                    timeStamp: timeOutOverTime,
                });

            printDate(timeInOverTime);
            printDate(timeOutOverTime);
            console.log(res.body, "res test done");
            expect(res.status).toBe(200);
        });
    });
})
