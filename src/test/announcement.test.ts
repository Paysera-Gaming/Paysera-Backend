import request from 'supertest';
import { prisma } from '../config/database';
import { server } from '..';

describe('Announcement Controller', () => {
    let departmentAnnouncement: any;
    let announcement: any;
    let department: any;

    beforeAll(async () => {
        department = await prisma.department.create({
            data: {
                name: 'Test Department Announcements',
            },
        });

        announcement = await prisma.announcement.create({
            data: { title: 'Test Announcement', body: 'This is a test announcement' },
        });

        departmentAnnouncement = await prisma.departmentAnnouncement.create({
            data: { title: 'Test Department Announcement', body: 'This is a test department announcement', Department: { connect: { id: department.id } } },
        });
    });

    describe('GET /announcements', () => {
        it('should return all announcements', async () => {
            const res = await request(server).get('/api/announcements');
            expect(res.status).toBe(200);
        });
    });

    describe('GET /announcements/:id', () => {
        it('should return a single announcement by id', async () => {
            const announcement = await prisma.announcement.create({
                data: { title: 'Test Announcement', body: 'This is a test announcement' },
            });
            const res = await request(server).get(`/api/announcements/${announcement.id}`);
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('id', announcement.id);
        });

        it('should return 404 if announcement not found', async () => {
            const res = await request(server).get('/api/announcements/9999');
            expect(res.status).toBe(404);
        });
    });

    describe('POST /announcements', () => {
        it('should create a new announcement', async () => {
            const res = await request(server)
                .post('/api/announcements')
                .send({ title: 'New Announcement', body: 'This is a new announcement' });
            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('id');
        });

        it('should return 400 if title or body is missing', async () => {
            const res = await request(server).post('/api/announcements').send({ title: 'Incomplete Announcement' });
            expect(res.status).toBe(400);
        });
    });

    describe('PUT /announcements/:id', () => {
        it('should update an existing announcement', async () => {
            const announcement = await prisma.announcement.create({
                data: { title: 'Update Test', body: 'This is an update test' },
            });
            const res = await request(server)
                .put(`/api/announcements/${announcement.id}`)
                .send({ title: 'Updated Title', body: 'Updated body' });
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('title', 'Updated Title');
        });

        it('should return 404 if announcement not found', async () => {
            const res = await request(server)
                .put('/api/announcements/9999')
                .send({ title: 'Updated Title', body: 'Updated body' });
            expect(res.status).toBe(404);
        });
    });

    describe('DELETE /announcements/:id', () => {
        it('should delete an existing announcement', async () => {
            const announcement = await prisma.announcement.create({
                data: { title: 'Delete Test', body: 'This is a delete test' },
            });
            const res = await request(server).delete(`/api/announcements/${announcement.id}`);
            expect(res.status).toBe(204);
        });

        it('should return 404 if announcement not found', async () => {
            const res = await request(server).delete('/api/announcements/9999');
            expect(res.status).toBe(404);
        });
    });

    // describe('GET /department-announcements', () => {
    //     it('should return all department announcements', async () => {
    //         const res = await request(server).get('/api/department-announcements');
    //         expect(res.status).toBe(200);
    //     });
    // });

    // describe('GET /department-announcements/:id', () => {
    //     it('should return a single department announcement by id', async () => {
    //         const res = await request(server).get(`/api/department-announcements/${departmentAnnouncement.id}`);
    //         expect(res.status).toBe(200);
    //         expect(res.body).toHaveProperty('id', departmentAnnouncement.id);
    //     });

    //     it('should return 404 if department announcement not found', async () => {
    //         const res = await request(server).get('/api/department-announcements/9999');
    //         expect(res.status).toBe(404);
    //     });
    // });

    // describe('POST /department-announcements', () => {
    //     it('should create a new department announcement', async () => {
    //         const res = await request(server)
    //             .post('/api/department-announcements')
    //             .send({ title: 'New Department Announcement', body: 'This is a new department announcement', departmentId: department.id });
    //         expect(res.status).toBe(201);
    //     });

    //     it('should return 400 if title, body or departmentId is missing', async () => {
    //         const res = await request(server).post('/api/department-announcements').send({ title: 'Incomplete Department Announcement' });
    //         expect(res.status).toBe(400);
    //     });
    // });

    // describe('PUT /department-announcements/:id', () => {
    //     it('should update an existing department announcement', async () => {

    //         const res = await request(server)
    //             .put(`/api/department-announcements/${departmentAnnouncement.id}`)
    //             .send({ title: 'Updated Title', body: 'Updated body', departmentId: department.id });
    //         expect(res.status).toBe(200);
    //         expect(res.body).toHaveProperty('title', 'Updated Title');
    //     });

    //     it('should return 404 if department announcement not found', async () => {
    //         const res = await request(server)
    //             .put('/api/department-announcements/9999')
    //             .send({ title: 'Updated Title', body: 'Updated body', departmentId: department.id });
    //         expect(res.status).toBe(404);
    //     });
    // });

    // describe('DELETE /department-announcements/:id', () => {
    //     it('should delete an existing department announcement', async () => {
    //         const res = await request(server).delete(`/api/department-announcements/${departmentAnnouncement.id}`);
    //         expect(res.status).toBe(204);
    //     });

    //     it('should return 404 if department announcement not found', async () => {
    //         const res = await request(server).delete('/api/department-announcements/9999');
    //         expect(res.status).toBe(404);
    //     });
    // });
});