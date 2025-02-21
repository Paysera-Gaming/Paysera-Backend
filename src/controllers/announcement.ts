import { Request, Response } from 'express';
import { io } from '../index';
import { AnnouncementService } from '../services/announcement.service';

export const AnnouncementController = {
    getAnnouncements: async (req: Request, res: Response) => {
        const announcements = await AnnouncementService.getAnnouncements();
        return res.status(200).send(announcements);
    },

    getAnnouncementById: async (req: Request, res: Response) => {
        const { id } = req.params;
        const announcement = await AnnouncementService.getAnnouncementById(Number(id));
        if (announcement) {
            return res.send(announcement);
        } else {
            return res.status(404).send('Announcement not found');
        }
    },

    createAnnouncement: async (req: Request, res: Response) => {
        const { title, body } = req.body;

        if (!title || !body) {
            return res.status(400).send('Please provide a title and body');
        }

        const newAnnouncement = await AnnouncementService.createAnnouncement(title, body);
        io.emit('announcements');
        return res.status(201).send(newAnnouncement);
    },

    updateAnnouncement: async (req: Request, res: Response) => {
        const { id } = req.params;
        const { title, body } = req.body;

        if (!Number(id)) {
            return res.status(400).send('Please provide an id');
        }

        if (!title || !body) {
            return res.status(400).send('Please provide a title and body');
        }

        const announcement = await AnnouncementService.getAnnouncementById(Number(id));
        if (!announcement) {
            return res.status(404).send('Announcement not found');
        }

        const updatedAnnouncement = await AnnouncementService.updateAnnouncement(Number(id), title, body);
        io.emit('announcements');
        return res.send(updatedAnnouncement);
    },

    deleteAnnouncement: async (req: Request, res: Response) => {
        const { id } = req.params;

        const announcement = await AnnouncementService.getAnnouncementById(Number(id));
        if (!announcement) {
            return res.status(404).send('Announcement not found');
        }

        await AnnouncementService.deleteAnnouncement(Number(id));
        io.emit('announcements');

        return res.status(204).send(`Announcement ${announcement.id} deleted successfully`);
    }
};
