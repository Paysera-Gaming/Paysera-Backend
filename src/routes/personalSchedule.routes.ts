import express from 'express';
import personalScheduleController from '../controllers/personalSchedule';
import { asyncHandler } from '../middlewares/errorHandler';
import { teamLeaderMiddleware } from '../middlewares';

const routerPersonalSchedule = express.Router();

routerPersonalSchedule.route('/')
    .get(asyncHandler(personalScheduleController.getAllPersonalSchedules))
    .post(asyncHandler(personalScheduleController.createPersonalSchedule));

routerPersonalSchedule.route('/:id')
    .put(teamLeaderMiddleware, asyncHandler(personalScheduleController.updatePersonalSchedule))
    .get(teamLeaderMiddleware, asyncHandler(personalScheduleController.getPersonalScheduleById))
    .delete(teamLeaderMiddleware, asyncHandler(personalScheduleController.removePersonalSchedule));

export default routerPersonalSchedule;