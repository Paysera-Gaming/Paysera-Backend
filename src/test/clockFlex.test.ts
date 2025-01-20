import request from 'supertest';
import app from '..'; // Adjust the path to your Express app
import { prisma } from '../config/database';
import { formatDate } from 'date-fns';

describe('Test for flexi', () => {
    let employeeId: number;
    let departmentId: number;
    let departmentScheduleId: number;
    let timeIn: Date;
    let lunchTimeIn: Date;
    let lunchTimeOut: Date;

    beforeAll(async () => {
        // Create a department
        const department = await prisma.department.create({
            data: {
                name: 'Flexi Department',
            },
        });

        departmentId = department.id;

        // Create a department schedule
        const flexiSchedule = await prisma.schedule.create({
            data: {
                scheduleType: 'FLEXI',
                startTime: new Date(2020, 8, 15, 8, 0, 0),  // 8:00 AM
                startTimeLimit: new Date(2020, 8, 15, 10, 0, 0),   // 10:00 AM
                endTime: new Date(2020, 8, 15, 17, 0, 0),   // 5:00 PM
                lunchStartTime: new Date(2020, 8, 15, 12, 0, 0),   // 12:00 PM
                lunchEndTime: new Date(2020, 8, 15, 13, 0, 0),   // 1:00 PM
                limitWorkHoursDay: 9,
                allowedOvertime: false,
                DepartmentSchedule: {
                    create: {
                        departmentId,
                        role: 'Programmer',
                    },
                },
            },
        });

        departmentScheduleId = flexiSchedule.id;

        // Create an employee and set a time-in record to use in tests
        const employee = await prisma.employee.create({
            data: {
                role: 'Programmer',
                departmentId,
                username: 'FlexiClock',
                passwordCredentials: 'FlexiClock',
                firstName: 'FlexiClock',
                lastName: 'FlexiClock',
                middleName: 'FlexiClock',
                accessLevel: 'EMPLOYEE',
            },
        });
        employeeId = employee.id;
    });

    describe('POST /api/attendance/time-in', () => {

        it('should return error because time in is not within allowed time in frame', async () => {
            const now = new Date();

            // too early
            timeIn = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 0, 0);

            const res = await request(app)
                .post('/api/attendance/time-in')
                .send({
                    employeeId,
                    timeStamp: timeIn,
                });

            expect(res.status).toBe(400);


            // too late
            timeIn = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 0, 0);
            const res2 = await request(app)
                .post('/api/attendance/time-in')
                .send({
                    employeeId,
                    timeStamp: timeIn,
                });

            expect(res2.status).toBe(400);

            console.log(res.body, "res", res2.body, "res2");

        });

        it('should record time in successfully', async () => {

            const now = new Date();
            timeIn = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0);

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
    });

    describe('POST /api/attendance/time-out', () => {
        it('should record time out successfully', async () => {
            const timeOut = new Date(timeIn.getTime() + 3600 * 9000); // 9 hours after timeIn

            const res = await request(app)
                .post('/api/attendance/time-out')
                .send({
                    employeeId,
                    timeStamp: timeOut,
                }).expect(200);

            const attendance = await prisma.attendance.findFirst({
                where: {
                    employeeId,
                    date: formatDate(timeIn, 'MMMM d, yyyy')
                },
            });

            expect(attendance?.status).toBe('DONE');
            expect(attendance?.date).toBe(formatDate(timeOut, 'MMMM d, yyyy'));
            expect(attendance?.timeHoursWorked).toBeLessThanOrEqual(8);
            expect(attendance?.timeTotal).toBe(9);
        });

        it('should return 400 already timeout', async () => {
            const res = await request(app)
                .post('/api/attendance/time-out')
                .send({
                    employeeId,
                    date: formatDate(timeIn, 'MMMM d, yyyy')
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
