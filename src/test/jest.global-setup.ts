import { formatDate } from "../utils/time";
import { prisma } from "../../src/config/database";
import request from 'supertest';
import app from '../../src/';
import bcrypt from 'bcryptjs';
import { configEnv } from "../config/dotenv";

export default async () => {
    console.log('Global Test Teardown');
    // Seed the database
    try {
        const auditor = await prisma.employee.create({
            data: {
                email: "auditor1@gmail.com",
                username: 'AUDITOR12345',
                accessLevel: 'AUDITOR',
                passwordCredentials: await bcrypt.hash('AUDITOR12345', configEnv.SALT_ROUNDS),
                firstName: 'Auditor',
                lastName: 'One',
                middleName: 'A',
                role: 'AUDITOR',
            },
        });

        // Create Departments
        const department1 = await prisma.department.create({
            data: {
                name: 'department1',
                Auditor: {
                    connect: {
                        id: auditor.id,
                    },
                },
                Employees: {
                    connect: {
                        id: auditor.id,
                    },
                },
            },
        });
        const department2 = await prisma.department.create({
            data: {
                name: 'department2',
            },
        });

        const hashPasswordA = await bcrypt.hash('ADMIN12345', configEnv.SALT_ROUNDS);
        const admin1 = await prisma.employee.create({
            data: {
                email: "sample22@gmail.com",
                username: 'ADMIN12345',
                accessLevel: 'ADMIN',
                passwordCredentials: hashPasswordA,
                firstName: 'Ervin',
                lastName: 'Pangilinan',
                middleName: 'Capili',
                role: 'DEVELOPER',
            },
        });

        const hashPasswordL = await bcrypt.hash('TEAM_LEADER12345', configEnv.SALT_ROUNDS);

        const leader1 = await prisma.employee.create({
            data: {
                email: "FIRST@gmail.com",
                username: 'FIRST_TEAMLEAD',
                accessLevel: 'TEAM_LEADER',
                passwordCredentials: hashPasswordL,
                firstName: 'Leader1',
                lastName: 'Leader1',
                middleName: 'Leader1',
                role: 'HR MANAGER',
                departmentId: department1.id,
                LeadsDepartment: {
                    connect: {
                        id: department1.id,
                    },
                },
            },
        });

        const leader2 = await prisma.employee.create({
            data: {
                email: "sample123@gmail.com",
                username: 'leader2',
                accessLevel: 'TEAM_LEADER',
                passwordCredentials: 'hashed_password',
                firstName: 'leader2',
                lastName: 'leader2',
                middleName: 'leader2',
                role: 'HR MANAGER',
                Department: {
                    connect: {
                        id: department2.id,
                    },
                },
                LeadsDepartment: {
                    connect: {
                        id: department2.id,
                    },
                },
            },
        });

        const leader3 = await prisma.employee.create({
            data: {
                email: "sample12@gmail.com",
                username: 'TEAM_LEADER12345',
                accessLevel: 'TEAM_LEADER',
                passwordCredentials: hashPasswordL,
                firstName: 'Leader1',
                lastName: 'Leader1',
                middleName: 'Leader1',
                role: 'HR MANAGER',
                departmentId: department1.id,

            },
        });


        const hashPasswordE = await bcrypt.hash('EMPLOYEE12345', configEnv.SALT_ROUNDS);
        // Create Employees
        const employee1 = await prisma.employee.create({
            data: {
                email: "sample1234@gmail.com",
                username: 'EMPLOYEE12345',
                accessLevel: 'EMPLOYEE',
                passwordCredentials: hashPasswordE,
                firstName: 'employee1 ',
                lastName: 'employee1 ',
                middleName: 'employee1 ',
                role: 'ENGINEER',
                departmentId: department1.id,
                Attendance: {
                    create: {
                        date: formatDate(new Date()),
                        status: 'DONE',
                        scheduleType: 'FIXED',
                        timeIn: new Date(new Date().setHours(8, 0, 0, 0)),
                        timeOut: new Date(new Date().setHours(17, 0, 0, 0)),
                        timeTotal: 9,
                        timeHoursWorked: 8,
                    },
                },
                PersonalSchedule: {
                    create: {
                        day: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
                        Schedule: {
                            create: {
                                scheduleType: 'FIXED',
                                startTime: new Date(new Date().setHours(8, 0, 0, 0)),
                                endTime: new Date(new Date().setHours(17, 0, 0, 0)),
                            },
                        }
                    },
                },
            },
        });

        const employee2 = await prisma.employee.create({
            data: {
                email: "sample12345@gmail.com",
                username: 'employee2',
                accessLevel: 'EMPLOYEE',
                passwordCredentials: 'hashed_password',
                firstName: 'employee2',
                lastName: 'employee2',
                middleName: 'employee2',
                role: 'DESIGNER',
                Attendance: {
                    create: {
                        date: formatDate(new Date()),
                        status: 'DONE',
                        scheduleType: 'FIXED',
                        timeIn: new Date(new Date().setHours(8, 0, 0, 0)),
                        timeOut: new Date(new Date().setHours(17, 0, 0, 0)),
                        timeTotal: 9,
                        timeHoursWorked: 8,
                    },
                },
                Department: {
                    connect: {
                        id: department2.id,
                    },
                },
            },
        });

        const employee3 = await prisma.employee.create({
            data: {
                email: "sample12456@gmail.com",
                username: 'employee3',
                accessLevel: 'EMPLOYEE',
                passwordCredentials: 'hashed_password',
                firstName: 'employee3',
                lastName: 'employee3',
                middleName: 'employee3',
                role: 'DESIGNER',
                Attendance: {
                    create: {
                        date: formatDate(new Date()),
                        status: 'DONE',
                        scheduleType: 'FIXED',
                        timeIn: new Date(new Date().setHours(8, 0, 0, 0)),
                        timeOut: new Date(new Date().setHours(17, 0, 0, 0)),
                        timeTotal: 9,
                        timeHoursWorked: 8,
                    },
                },
                Department: {
                    connect: {
                        id: department2.id,
                    },
                },
            },
        });



        const employee4 = await prisma.employee.create({
            data: {
                email: "sample4@gmail.com",
                username: 'employee4',
                accessLevel: 'EMPLOYEE',
                passwordCredentials: 'hashed_password',
                firstName: 'employee4',
                lastName: 'employee4',
                middleName: 'employee4',
                role: 'DESIGNER',
                Attendance: {
                    create: {
                        date: formatDate(new Date()),
                        status: 'DONE',
                        scheduleType: 'FIXED',
                        timeIn: new Date(new Date().setHours(8, 0, 0, 0)),
                        timeOut: new Date(new Date().setHours(17, 0, 0, 0)),
                        timeTotal: 9,
                        timeHoursWorked: 8,
                    },
                },
                Department: {
                    connect: {
                        id: department2.id,
                    },
                },
            },
        });

        const employee5 = await prisma.employee.create({
            data: {
                email: "sample5@gmail.com",
                username: 'employee5',
                accessLevel: 'EMPLOYEE',
                passwordCredentials: 'hashed_password',
                firstName: 'employee5',
                lastName: 'employee5',
                middleName: 'employee5',
                role: 'ENGINE',
                departmentId: department1.id,
                Attendance: {
                    create: {
                        date: formatDate(new Date()),
                        status: 'DONE',
                        scheduleType: 'FIXED',
                        timeIn: new Date(new Date().setHours(8, 0, 0, 0)),
                        timeOut: new Date(new Date().setHours(17, 0, 0, 0)),
                        timeTotal: 9,
                        timeHoursWorked: 8,
                    },
                },
            },
        });

        const employee6 = await prisma.employee.create({
            data: {
                email: "sample6@gmail.com",
                username: 'employee6',
                accessLevel: 'EMPLOYEE',
                passwordCredentials: 'hashed_password',
                firstName: 'employee6',
                lastName: 'employee6',
                middleName: 'employee6',
                role: 'Designer',
                Department: {
                    connect: {
                        id: department2.id,
                    },
                },
                Attendance: {
                    create: {
                        date: formatDate(new Date()),
                        status: 'DONE',
                        scheduleType: 'FIXED',
                        timeIn: new Date(new Date().setHours(8, 0, 0, 0)),
                        timeOut: new Date(new Date().setHours(17, 0, 0, 0)),
                        timeTotal: 9,
                        timeHoursWorked: 8,
                    },
                },
            },
        });

        const employee7 = await prisma.employee.create({
            data: {
                email: "sample7@gmail.com",
                username: 'employee7',
                accessLevel: 'EMPLOYEE',
                passwordCredentials: 'hashed_password',
                firstName: 'employee7',
                lastName: 'employee7',
                middleName: 'employee7',
                role: 'ENGINE',
                departmentId: department1.id,
                Attendance: {
                    create: {
                        date: formatDate(new Date()),
                        status: 'DONE',
                        scheduleType: 'FIXED',
                        timeIn: new Date(new Date().setHours(8, 0, 0, 0)),
                        timeOut: new Date(new Date().setHours(17, 0, 0, 0)),
                        timeTotal: 9,
                        timeHoursWorked: 8,
                    },
                },
            },
        });

        const employee8 = await prisma.employee.create({
            data: {
                email: "sample8@gmail.com",
                username: 'employee8',
                accessLevel: 'EMPLOYEE',
                passwordCredentials: 'hashed_password',
                firstName: 'employee8',
                lastName: 'employee8',
                middleName: 'employee8',
                role: 'Designer',
                Department: {
                    connect: {
                        id: department2.id,
                    },
                },
            },
        });

        // Create Schedules
        const schedule1 = await prisma.schedule.create({
            data: {
                scheduleType: 'FIXED',
                startTime: (new Date('2024-08-01T08:00:00Z')),
                endTime: (new Date('2024-08-01T17:00:00Z')),
            },
        });

        const schedule2 = await prisma.schedule.create({
            data: {
                scheduleType: 'FLEXI',
                startTime: (new Date('2024-08-01T08:00:00Z')),
                startTimeLimit: (new Date('2024-08-01T10:00:00Z')),
                endTime: (new Date('2024-08-01T16:00:00Z')),
            },
        });


        // Create Department Schedules
        await prisma.departmentSchedule.create({
            data: {
                name: 'FIXED ENGINEER Schedule',
                departmentId: department1.id,
                scheduleId: schedule1.id,
                role: 'ENGINEER',
            },
        });

        await prisma.departmentSchedule.create({
            data: {
                name: 'FLEXI DESIGNER Schedule',
                departmentId: department2.id,
                scheduleId: schedule2.id,
                role: 'DESIGNER',
            },
        });

        // Create Attendance Records
        await prisma.attendance.create({
            data: {
                employeeId: employee1.id,
                date: formatDate(new Date()),
                status: 'DONE',
                scheduleType: 'FLEXI',
                timeIn: new Date(new Date().setHours(8, 0, 0, 0)),
                timeOut: new Date(new Date().setHours(17, 0, 0, 0)),
                timeTotal: 8,
            },
        });

        // Create Attendance Records
        await prisma.attendance.create({
            data: {
                employeeId: employee1.id,
                date: formatDate(new Date()),
                status: 'DONE',
                scheduleType: 'FIXED',
                timeIn: new Date(new Date().setHours(8, 0, 0, 0)),
                timeOut: new Date(new Date().setHours(17, 0, 0, 0)),
                timeTotal: 8,
            },
        });

        await prisma.attendance.create({
            data: {
                employeeId: employee1.id,
                date: formatDate(new Date()),
                status: 'DONE',
                scheduleType: 'FIXED',
                timeIn: new Date(2025, 0, 26, 8, 0, 0),
                timeOut: new Date(2025, 0, 26, 18, 0, 0),
                timeTotal: 10,
                timeHoursWorked: 8,
                overTimeTotal: 1,

            },
        });

        await prisma.attendance.create({
            data: {
                employeeId: employee1.id,
                date: formatDate(new Date()),
                status: 'DONE',
                scheduleType: 'FIXED',
                timeIn: new Date(2025, 0, 25, 8, 0, 0),
                timeOut: new Date(2025, 0, 25, 18, 0, 0),
                timeTotal: 10,
                timeHoursWorked: 8,
                overTimeTotal: 1,
            },
        });

        await prisma.attendance.create({
            data: {
                employeeId: employee2.id,
                date: formatDate(new Date()),
                status: 'PAID_LEAVE',
                scheduleType: 'FIXED',
                timeIn: new Date(new Date().setHours(10, 0, 0, 0)),
                timeOut: new Date(new Date().setHours(18, 0, 0, 0)),
                timeTotal: 8,
            },
        });

        // // Time in for the day
        // const res = await request('http://localhost:8080').post('/api/attendance/time-in').send({
        //     employeeId: employee1.id,
        //     timeStamp: (new Date(2025, 0, 28, 8, 0, 0))
        // });

        // const res1 = await request('http://localhost:8080').post('/api/attendance/time-out').send({
        //     employeeId: employee1.id,
        //     timeStamp: (new Date(2025, 0, 28, 17, 0, 0))
        // });

        // console.log(res.body, res1.body);


        // // Holiday seeds
        // await request('http://localhost:8080').post('/api/holiday').send({
        //     name: 'Christmas',
        //     month: 'DECEMBER',
        //     day: 25,
        // });

        // await request('http://localhost:8080').post('/api/holiday').send({
        //     name: 'New Year',
        //     month: 'JANUARY',
        //     day: 1,
        // });
        // Create Holidays
        await prisma.holiday.create({
            data: {
                name: 'Christmas',
                month: 'DECEMBER',
                day: 25,
            },
        });

        await prisma.holiday.create({
            data: {
                name: 'New Year',
                month: 'JANUARY',
                day: 1,
            },
        });

        console.log('Data seeded successfully');

    } catch (error) {
        console.error('Error seeding data:', error);
    }
};

