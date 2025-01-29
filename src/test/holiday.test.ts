import { prisma } from '../config/database';
import { server } from '..';
import request from 'supertest';

describe('Holiday API', () => {
    let holidayId: number;


    it('should create a new holiday', async () => {
        const res = await request(server)
            .post('/api/holiday')
            .send({ name: 'Christmas EVE', month: 'DECEMBER', day: 24 });

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body.name).toBe('Christmas EVE');
        expect(res.body.month).toBe('DECEMBER');
        expect(res.body.day).toBe(24);
        holidayId = res.body.id;
    });

    it('should get all holidays', async () => {
        const res = await request(server).get('/api/holiday');

        expect(res.statusCode).toEqual(200);
        expect(res.body).toBeInstanceOf(Array);
        expect(res.body.length).toBeGreaterThan(0);
    });

    it('should get a holiday by ID', async () => {
        const res = await request(server).get(`/api/holiday/${holidayId}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('id', holidayId);
    });

    it('should update a holiday by ID', async () => {
        const res = await request(server)
            .put(`/api/holiday/${holidayId}`)
            .send({ name: 'New Year\'s Eve', month: 'DECEMBER', day: 31 });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('id', holidayId);
        expect(res.body.name).toBe('New Year\'s Eve');
        expect(res.body.month).toBe('DECEMBER');
        expect(res.body.day).toBe(31);
    });

    it('should delete a holiday by ID', async () => {
        const res = await request(server).delete(`/api/holiday/${holidayId}`);

        expect(res.statusCode).toEqual(200);
        expect(res.text).toBe('Holiday deleted successfully');
    });

    it('should return 404 for a non-existent holiday', async () => {
        const res = await request(server).get(`/api/holiday/9999`);

        expect(res.statusCode).toEqual(404);
        expect(res.body.message).toBe('Holiday not found');
    });
});