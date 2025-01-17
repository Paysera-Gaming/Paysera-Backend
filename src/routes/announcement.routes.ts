import { Router } from "express";
import announcement from '../controllers/announcement';

const routerAnnouncement = Router();
routerAnnouncement.route('/')
    .get(announcement.getAnnouncements)
    .post(announcement.createAnnouncement);

routerAnnouncement.route('/:id')
    .get(announcement.getAnnouncementById)
    .put(announcement.updateAnnouncement)
    .delete(announcement.deleteAnnouncement);

// routerAnnouncement.route('/department-announcements')
//     .get(announcement.getDepartmentAnnouncements)
//     .post(announcement.createDepartmentAnnouncement);

// routerAnnouncement.route('/department-announcements/:id')
//     .get(announcement.getDepartmentAnnouncementById)
//     .put(announcement.updateDepartmentAnnouncement)
//     .delete(announcement.deleteDepartmentAnnouncement);

export default routerAnnouncement;