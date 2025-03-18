import express from 'express';
import { PersonalScheduleController } from '../controllers/personalSchedule';
import { asyncHandler } from '../middlewares/errorHandler';
import { teamLeaderMiddleware } from '../middlewares';

const routerPersonalSchedule = express.Router();

routerPersonalSchedule.route('/request-change')
    .get(asyncHandler(PersonalScheduleController.getAllRequestedChangePersonalSchedule))
    .post(asyncHandler(PersonalScheduleController.requestChangePersonalSchedule));

routerPersonalSchedule.route('/request-change/:id')
    .get(teamLeaderMiddleware, asyncHandler(PersonalScheduleController.getRequestedChangePersonalSchedule))
    .put(teamLeaderMiddleware, asyncHandler(PersonalScheduleController.updateRequestedChangePersonalSchedule))
    .delete(teamLeaderMiddleware, asyncHandler(PersonalScheduleController.deleteRequestedChangePersonalSchedule));

routerPersonalSchedule.route('/request-change/:id/apply')
    .post(asyncHandler(PersonalScheduleController.applyRequestedChangePersonalSchedule));

routerPersonalSchedule.route('/')
    .get(asyncHandler(PersonalScheduleController.getAllPersonalSchedules))
    .post(asyncHandler(PersonalScheduleController.createPersonalSchedule));

routerPersonalSchedule.route('/:id')
    .get(teamLeaderMiddleware, asyncHandler(PersonalScheduleController.getPersonalScheduleById))
    .put(teamLeaderMiddleware, asyncHandler(PersonalScheduleController.updatePersonalSchedule))
    .delete(teamLeaderMiddleware, asyncHandler(PersonalScheduleController.deletePersonalSchedule));

export default routerPersonalSchedule;