// tests/attendance.test.ts
import request from 'supertest';
import app from '..'; // Adjust the path to your Express app
import { prisma } from '../config/database';
import { differenceInMinutes, formatDate } from 'date-fns';
import { initializeHourTimeZone, printDate } from '../utils/date';
import { Employee } from '@prisma/client';

describe('Attendance Routes', () => {
    let employeeId: number;
    let departmentId: number;
    let departmentScheduleId: number;
    let timeIn: Date;
    let fixedSchedule: any;

    beforeAll(async () => {
        // Create a department
        const department = await prisma.department.create({
            data: {
                name: 'IT Department',
            },
        });

        departmentId = department.id;

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

    describe('POST /api/attendance/time-in', () => {
        it('should record time in successfully', async () => {
            timeIn = initializeHourTimeZone(new Date(2025, 8, 15, 8, 1, 0));  // get the current time 8:00 AM

            // get timeIn AM and PM format
            const res = await request(app)
                .post('/api/attendance/time-in')
                .send({
                    employeeId,
                    timeStamp: timeIn,
                });

            const attendance = await prisma.attendance.findFirst({
                where: { employeeId },
            });



            expect(res.status).toBe(200);
            expect(attendance?.date).toBe(formatDate(timeIn, 'MMMM d, yyyy'));
            // compare hours and minutes only using date-fns
            expect(formatDate(attendance?.timeIn!, 'hh:mm a')).toBe(formatDate(timeIn, 'hh:mm a'));
        });

        it('should return 400 because already time-in', async () => {
            const res = await request(app)
                .post('/api/attendance/time-in')
                .send({
                    employeeId,
                    timeStamp: timeIn,
                });

            expect(res.status).toBe(400);
        });

        it('should return 400 if timeIn is missing', async () => {
            const res = await request(app)
                .post('/api/attendance/time-in')
                .send({
                    employeeId,
                });

            expect(res.status).toBe(400);
        });

        it('should return 400 if timeIn is not align to schedule', async () => {
            const res = await request(app)
                .post('/api/attendance/time-in')
                .send({
                    employeeId,
                    timeStamp: new Date(2024, 8, 12, 23, 59, 59),
                }).expect(400);
        });


        it('should return 400 if timeIn is on holiday', async () => {

            // Create a holiday
            const holiday = await prisma.holiday.create({
                data: {
                    name: 'New Year',
                    day: 1,
                    month: "JANUARY",
                },
            });

            const res = await request(app)
                .post('/api/attendance/time-in')
                .send({
                    employeeId,
                    timeStamp: new Date(2025, 0, 1, 9, 0, 0), // January 1, 2025
                }).expect(400);
        });
    });

    describe('POST /api/attendance/time-out', () => {
        it('should record time out successfully', async () => {
            const timeOut = initializeHourTimeZone(new Date(2025, 8, 15, 17, 0, 0)); // 5:00 PM
            const res = await request(app)
                .post('/api/attendance/time-out')
                .send({
                    employeeId,
                    timeStamp: timeOut,
                });

            console.log(res.body, "res test 1");

            expect(res.status).toBe(200)

            const attendance = res.body;
            const totalHoursWorked = differenceInMinutes(initializeHourTimeZone(timeOut), initializeHourTimeZone(timeIn));

            expect(attendance?.status).toBe('DONE');
            expect(formatDate(attendance?.timeOut, 'MMMM d, yyyy')).toBe(formatDate(timeOut, 'MMMM d, yyyy'));
            expect(attendance?.timeHoursWorked).toBeLessThanOrEqual(8);
            expect(attendance?.timeTotal).toBe((totalHoursWorked / 60).toFixed(3));
            expect(attendance?.timeTotal).toBe((differenceInMinutes(initializeHourTimeZone(timeOut), initializeHourTimeZone(timeIn)) / 60).toFixed(3));
        });

        it('should return 400 already timeout', async () => {
            const res = await request(app)
                .post('/api/attendance/time-out')
                .send({
                    employeeId,
                    timeStamp: new Date(timeIn.getFullYear(), timeIn.getMonth(), timeIn.getDate(), 19, 10, 0),
                });

            expect(res.status).toBe(400);
        });

        it('should return 400 if timeOut is missing', async () => {
            const res = await request(app)
                .post('/api/attendance/time-out')
                .send({
                    employeeId,
                });

            expect(res.status).toBe(400);
        });
    });

});
