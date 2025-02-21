import express from 'express';
import { PersonalScheduleController } from '../controllers/personalSchedule';
import { asyncHandler } from '../middlewares/errorHandler';
import { teamLeaderMiddleware } from '../middlewares';

const routerPersonalSchedule = express.Router();

routerPersonalSchedule.route('/')
    .get(asyncHandler(PersonalScheduleController.getAllPersonalSchedules))
    .post(asyncHandler(PersonalScheduleController.createPersonalSchedule));

routerPersonalSchedule.route('/:id')
    .put(teamLeaderMiddleware, asyncHandler(PersonalScheduleController.updatePersonalSchedule))
    .get(teamLeaderMiddleware, asyncHandler(PersonalScheduleController.getPersonalScheduleById))
    .delete(teamLeaderMiddleware, asyncHandler(PersonalScheduleController.removePersonalSchedule));

export default routerPersonalSchedule;