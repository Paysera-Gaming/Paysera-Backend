import EmployeeService from "../services/employee.service";
import PersonalScheduleService from "../services/personalSchedule.service";
import { initializeHourTimeZone } from "../utils/date";
import request from 'supertest';
import { server } from "..";
import { Employee, RequestChangePersonalSchedule } from "@prisma/client";

describe('Request Personal Schedule', () => {
    let employee: Employee;
    let teamLeader;
    let admin;
    let personalSchedule;
    let requestedChangePersonalSchedule: RequestChangePersonalSchedule;

    beforeAll(async () => {
        teamLeader = await EmployeeService.createEmployee({
            email: 'teamLeaderRPS@example.com',
            username: "teamLeaderRPS",
            accessLevel: "TEAM_LEADER",
            passwordCredentials: "teamLeaderRPS",
            firstName: "teamLeaderRPS",
            lastName: "teamLeaderRPS",
            middleName: "teamLeaderRPS",
            role: "TEAM_LEADER",
            isAllowedRequestOvertime: true
        });

        admin = await EmployeeService.createEmployee({
            email: 'adminRPS@example.com',
            username: "adminRPS",
            accessLevel: "ADMIN",
            passwordCredentials: "adminRPS",
            firstName: "adminRPS",
            lastName: "adminRPS",
            middleName: "adminRPS",
            role: "ADMIN",
            isAllowedRequestOvertime: false,
            isActive: true
        });

        employee = await EmployeeService.createEmployee({
            email: 'employeeRPS@example.com',
            username: "employeeRPS",
            accessLevel: "EMPLOYEE",
            passwordCredentials: "employeeRPS",
            firstName: "employeeRPS",
            lastName: "employeeRPS",
            middleName: "employeeRPS",
            role: "EMPLOYEE",
            isAllowedRequestOvertime: false
        });

    });

    it('GET /api/personal-schedule should return all personal schedules', async () => {
        // create personal schedule for employee
        personalSchedule = await PersonalScheduleService.createPersonalSchedule({
            day: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
            startTime: new Date(2025, 0, 1, 8, 0, 0),
            endTime: new Date(2025, 0, 1, 17, 0, 0),
            name: 'Regular Schedule',
            scheduleType: 'FIXED',
            employeeId: employee.id
        });

        const personalSchedules = await request(server).get('/api/personal-schedule').expect(200);
        const body = personalSchedules.body;
        expect(body.length).toBeGreaterThanOrEqual(1);
    });


    it('POST /api/personal-schedule/request-change should request change personal schedule', async () => {
        await request(server).post('/api/personal-schedule/request-change').send({
            employeeId: employee.id,
            day: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
            startTime: new Date(initializeHourTimeZone(new Date(2025, 0, 1, 8, 0, 0))),
            endTime: new Date(initializeHourTimeZone(new Date(2025, 0, 1, 17, 0, 0))),
            name: 'Regular Schedule',
            scheduleType: 'FIXED',
            status: 'SUBMITTED'
        }).expect(200);
    });

    it('POST /api/personal-schedule/request-change should return error because wrong values', async () => {
        const newRequest = {
            employeeId: employee.id,
            day: [false],
            startTime: false,
            endTime: false,
            name: 'Regular Schedule',
            scheduleType: 'false',
            status: 'false'
        };

        request(server)
            .post(`/api/personal-schedule/request-change`)
            .send(newRequest)
            .expect(400);
    });

    it('GET /api/personal-schedule/request-change should return all requested change personal schedules', async () => {
        const personalSchedules = await request(server).get('/api/personal-schedule/request-change').expect(200);
        const body = personalSchedules.body;
        expect(body.length).toBeGreaterThanOrEqual(1);
        requestedChangePersonalSchedule = body[0];
    });

    it('GET /api/personal-schedule/request-change/:id should return requested change personal schedule', async () => {
        const personalSchedule = await request(server).
            get(`/api/personal-schedule/request-change/${requestedChangePersonalSchedule.id}`)
            .expect(200);
        const body = personalSchedule.body;
        expect(body.day).toEqual(requestedChangePersonalSchedule.day);
        expect(body.startTime).toEqual(requestedChangePersonalSchedule.startTime);
        expect(body.endTime).toEqual(requestedChangePersonalSchedule.endTime);
        expect(body.scheduleType).toBe(requestedChangePersonalSchedule.scheduleType);
    });

    it('PUT /api/personal-schedule/request-change should update requested change personal schedule', async () => {
        const updatedSchedule = {
            employeeId: employee.id,
            day: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
            startTime: initializeHourTimeZone(new Date(2025, 0, 1, 9, 0, 0)),
            endTime: initializeHourTimeZone(new Date(2025, 0, 1, 18, 0, 0)),
            name: 'Regular Schedule',
            scheduleType: 'FIXED',
            status: 'APPROVED_BY_TEAM_LEADER'
        };

        await request(server)
            .put(`/api/personal-schedule/request-change/${requestedChangePersonalSchedule.id}`)
            .send(updatedSchedule)
            .expect(200);
    });


    it('DELETE /api/personal-schedule/request-change should delete requested change personal schedule', async () => {
        await request(server)
            .delete(`/api/personal-schedule/request-change/${requestedChangePersonalSchedule.id}`)
            .expect(200);
        await request(server).get(`/api/personal-schedule/request-change/${requestedChangePersonalSchedule.id}`).expect(404);

        await request(server)
            .put(`/api/personal-schedule/request-change/${requestedChangePersonalSchedule.id}`)
            .send({})
            .expect(404);
    });

});