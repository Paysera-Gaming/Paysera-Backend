import { Request, Response } from 'express';
import { prisma } from '../config/database';

const getAnnouncements = async (req: Request, res: Response) => {
    const announcements = await prisma.announcement.findMany();

    return res.status(200).send(announcements);
};

const getAnnouncementById = async (req: Request, res: Response) => {
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

const createAnnouncement = async (req: Request, res: Response) => {
    const { title, body } = req.body;

    // Check if title and body are provided
    if (!title || !body) {
        return res.status(400).send('Please provide a title and body');
    }

    const newAnnouncement = await prisma.announcement.create({
        data: { title, body },
    });

    return res.status(201).send(newAnnouncement);
};

const updateAnnouncement = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, body } = req.body;

    if (!Number(id)) {
        return res.status(400).send('Please provide an id');
    }

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

const deleteAnnouncement = async (req: Request, res: Response) => {
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

// const getDepartmentAnnouncements = async (req: Request, res: Response) => {
//     const departmentAnnouncements = await prisma.departmentAnnouncement.findMany();
//     if (!departmentAnnouncements.length) {
//         return res.status(404).send('Department announcements not found');
//     }

//     return res.send(departmentAnnouncements);
// };

// const getDepartmentAnnouncementById = async (req: Request, res: Response) => {
//     const { id } = req.params;

//     const departmentAnnouncement = await prisma.departmentAnnouncement.findUnique({
//         where: { id: Number(id) },
//     });

//     if (departmentAnnouncement) {
//         return res.send(departmentAnnouncement);
//     } else {
//         return res.status(404).send('Department announcement not found');
//     }
// }

// const createDepartmentAnnouncement = async (req: Request, res: Response) => {
//     const { title, body, departmentId } = req.body;
//     if (!Number(departmentId)) {
//         return res.status(400).send('Please provide a departmentId');
//     }

//     if (!title || !body) {
//         return res.status(400).send('Please provide a title and body');
//     }

//     const newDepartmentAnnouncement = await prisma.departmentAnnouncement.create({
//         data: { title, body, Department: { connect: { id: Number(departmentId) } } },
//     });

//     return res.status(201).send(newDepartmentAnnouncement);
// };

// const updateDepartmentAnnouncement = async (req: Request, res: Response) => {
//     const { id } = req.params;
//     const { title, body, departmentId } = req.body;

//     if (!Number(id)) {
//         return res.status(400).send('Please provide an id');
//     }

//     if (!title || !body || !Number(id)) {
//         return res.status(400).send('Please provide a title and body');
//     }

//     const departmentAnnouncement = await prisma.departmentAnnouncement.findUnique({
//         where: { id: Number(id) },
//     });

//     if (!departmentAnnouncement) {
//         return res.status(404).send('Department announcement not found');
//     }

//     const updatedDepartmentAnnouncement = await prisma.departmentAnnouncement.update({
//         where: { id: Number(id) },
//         data: { title, body, departmentId: Number(departmentId) },
//     });

//     return res.send(updatedDepartmentAnnouncement);
// };

// const deleteDepartmentAnnouncement = async (req: Request, res: Response) => {
//     const { id } = req.params;
//     if (!Number(id)) {
//         return res.status(400).send('Please provide an id');
//     }

//     const departmentAnnouncement = await prisma.departmentAnnouncement.findUnique({
//         where: { id: Number(id) },
//     });

//     if (!departmentAnnouncement) {
//         return res.status(404).send('Department announcement not found');
//     }

//     await prisma.departmentAnnouncement.delete({
//         where: { id: Number(id) },
//     });
//     return res.status(204).send("Department announcement deleted successfully");
// }

export default {
    getAnnouncements,
    getAnnouncementById,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    // getDepartmentAnnouncements,
    // getDepartmentAnnouncementById,
    // createDepartmentAnnouncement,
    // updateDepartmentAnnouncement,
    // deleteDepartmentAnnouncement,
};