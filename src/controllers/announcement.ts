import { Request, Response } from 'express';
import { prisma } from '../config/database';

export const getAnnouncements = async (req: Request, res: Response) => {
    const announcements = await prisma.announcement.findFirst();

    if (announcements) {
        return res.send(announcements);
    }

    return res.status(404).send('Announcements not found');
};

export const getAnnouncementById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const announcement = await prisma.announcement.findUnique({
        where: { id: Number(id) },
    });
    if (announcement) {
        return res.send(announcement);
    } else {
        return res.status(404).send('Announcement not found');
    }
};

export const createAnnouncement = async (req: Request, res: Response) => {
    const { title, body } = req.body;

    // Check if title and body are provided
    if (!title || !body) {
        return res.status(400).send('Please provide a title and body');
    }

    const newAnnouncement = await prisma.announcement.create({
        data: { title, body },
    });

    return res.send(201).send(newAnnouncement);
};

export const updateAnnouncement = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, body } = req.body;

    if (!title || !body) {
        return res.status(400).send('Please provide a title and body');
    }

    const announcement = await prisma.announcement.findUnique({
        where: { id: Number(id) },
    });

    if (!announcement) {
        return res.status(404).send('Announcement not found');
    }


    const updatedAnnouncement = await prisma.announcement.update({
        where: { id: Number(id) },
        data: { title, body },
    });
    return res.send(updatedAnnouncement);
};

export const deleteAnnouncement = async (req: Request, res: Response) => {
    const { id } = req.params;

    const announcement = await prisma.announcement.findUnique({
        where: { id: Number(id) },
    });

    if (!announcement) {
        return res.status(404).send('Announcement not found');
    }

    await prisma.announcement.delete({
        where: { id: Number(id) },
    });
    return res.status(204).send("Announcement deleted successfully");
};

export const getDepartmentAnnouncements = async (req: Request, res: Response) => {
    const departmentAnnouncements = await prisma.departmentAnnouncement.findMany();
    if (!departmentAnnouncements.length) {
        return res.status(404).send('Department announcements not found');
    }

    return res.send(departmentAnnouncements);

};

export const getDepartmentAnnouncementById = async (req: Request, res: Response) => {
    const { id } = req.params;

    const departmentAnnouncement = await prisma.departmentAnnouncement.findUnique({
        where: { id: Number(id) },
    });
    if (departmentAnnouncement) {
        res.send(departmentAnnouncement);
    } else {
        res.status(404).send('Department announcement not found');
    }
}

export const createDepartmentAnnouncement = async (req: Request, res: Response) => {
    const { title, body, departmentId } = req.body;
    if (!title || !body || !departmentId) {
        return res.status(400).send('Please provide a title, body and departmentId');
    }

    const newDepartmentAnnouncement = await prisma.departmentAnnouncement.create({
        data: { title, body, departmentId },
    });

    return res.status(201).send(newDepartmentAnnouncement);
};

export const updateDepartmentAnnouncement = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, body, departmentId } = req.body;
    if (!title || !body || !Number(id) || !departmentId) {
        return res.status(400).send('Please provide a title, body and departmentId');
    }

    const departmentAnnouncement = await prisma.departmentAnnouncement.findUnique({
        where: { id: Number(id) },
    });

    if (!departmentAnnouncement) {
        return res.status(404).send('Department announcement not found');
    }

    const updatedDepartmentAnnouncement = await prisma.departmentAnnouncement.update({
        where: { id: Number(id) },
        data: { title, body, departmentId },
    });

    return res.send(updatedDepartmentAnnouncement);
};

export const deleteDepartmentAnnouncement = async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!Number(id)) {
        return res.status(400).send('Please provide an id');
    }

    const departmentAnnouncement = await prisma.departmentAnnouncement.findUnique({
        where: { id: Number(id) },
    });

    if (!departmentAnnouncement) {
        return res.status(404).send('Department announcement not found');
    }

    await prisma.departmentAnnouncement.delete({
        where: { id: Number(id) },
    });
    return res.status(204).send("Department announcement deleted successfully");
}