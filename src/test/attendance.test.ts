import request from 'supertest';
import app from '..';
import { Attendance } from '@prisma/client';
import { prisma } from '../config/database';

describe('Attendance Routes', () => {
    let attendance: Attendance[];
    it('should return a list of Attendance', async () => {
        const response = await request(app).get('/api/attendance').expect(200);
        expect(response.body.length).toBeGreaterThanOrEqual(1);
        attendance = response.body;
    });

    it('should return a attendance by id', async () => {
        const response = await request(app).get(`/api/attendance/${attendance[0].id}`).expect(200);

        expect(response.body).toHaveProperty('id');
    });

    it('should create a new attendance record', async () => {
        const employee = await prisma.employee.findFirst();

        const newAttendance = {
            employeeId: employee?.id,
            date: new Date(),
            status: 'DONE',
            scheduleType: 'FIXED',
            timeIn: new Date(2021, 0, 1, 8, 0, 0),
            timeOut: new Date(2021, 0, 1, 17, 0, 0),
            timeHoursWorked: 8,
            overTimeTotal: 0,
            timeTotal: 8,
            lunchTimeTotal: 1,
        };

        await request(app)
            .post('/api/attendance')
            .send(newAttendance)
            .expect(201);
    });

    it('should update an attendance record', async () => {
        const employee = await prisma.employee.findFirst();

        const newAttendance = {
            employeeId: employee?.id,
            date: new Date(2021, 0, 1, 8, 0, 0),
            status: 'DONE',
            scheduleType: 'FIXED',
            timeIn: new Date(2021, 0, 1, 8, 0, 0),
            timeOut: new Date(2021, 0, 1, 17, 0, 0),
            timeHoursWorked: 8,
            overTimeTotal: 0,
            timeTotal: 8,
            lunchTimeTotal: 1,
        };

        const attendance = await prisma.attendance.findFirst();

        const updatedAttendance = {
            ...newAttendance,
            status: 'DONE'
        };

        await request(app)
            .put(`/api/attendance/${attendance?.id}`)
            .send(updatedAttendance)
            .expect(200);
    });

    it('should delete an attendance record', async () => {
        let attendance = await prisma.attendance.findFirst();

        await request(app)
            .delete(`/api/attendance/${attendance?.id}`)
            .expect(200);

        attendance = await prisma.attendance.findFirst({
            where: {
                id: attendance?.id
            }
        });

        expect(attendance).toBeNull();
    });

    it('should return 404 if attendance record not found', async () => {
        await request(app)
            .get('/api/attendance/99999')
            .expect(404);
    });

    it('should return 404 when trying to delete a non-existing attendance record', async () => {
        await request(app)
            .delete('/api/attendance/99999')
            .expect(404);
    });
});