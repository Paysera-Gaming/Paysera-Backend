import { Router } from "express";
import { AnnouncementController } from '../controllers/announcement';

const routerAnnouncement = Router();
routerAnnouncement.route('/')
    .get(AnnouncementController.getAnnouncements)
    .post(AnnouncementController.createAnnouncement);

routerAnnouncement.route('/:id')
    .get(AnnouncementController.getAnnouncementById)
    .put(AnnouncementController.updateAnnouncement)
    .delete(AnnouncementController.deleteAnnouncement);

// routerAnnouncement.route('/department-announcements')
//     .get(AnnouncementController.getDepartmentAnnouncements)
//     .post(AnnouncementController.createDepartmentAnnouncement);

// routerAnnouncement.route('/department-announcements/:id')
//     .get(AnnouncementController.getDepartmentAnnouncementById)
//     .put(AnnouncementController.updateDepartmentAnnouncement)
//     .delete(AnnouncementController.deleteDepartmentAnnouncement);

export default routerAnnouncement;