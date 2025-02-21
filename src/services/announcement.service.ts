import { prisma } from '../config/database';

export class AnnouncementService {
    static async getAnnouncements() {
        return await prisma.announcement.findMany();
    }

    static async getAnnouncementById(id: number) {
        return await prisma.announcement.findUnique({
            where: { id },
        });
    }

    static async createAnnouncement(title: string, body: string) {
        const newAnnouncement = await prisma.announcement.create({
            data: { title, body },
        });

        return newAnnouncement;
    }

    static async updateAnnouncement(id: number, title: string, body: string) {
        const updatedAnnouncement = await prisma.announcement.update({
            where: { id },
            data: { title, body },
        });

        return updatedAnnouncement;
    }

    static async deleteAnnouncement(id: number) {
        return await prisma.announcement.delete({
            where: { id },
        });

    }
}

export default AnnouncementService;