import express from 'express';
import departmentScheduleController from '../controllers/departmentSchedule';
import { asyncHandler } from '../middlewares/errorHandler';
import { teamLeaderMiddleware } from '../middlewares';

const routerDepartmentSchedule = express.Router();

routerDepartmentSchedule.route('/')
    .get(asyncHandler(departmentScheduleController.getAllDepartmentSchedules))
    .post(asyncHandler(departmentScheduleController.createDepartmentSchedule));

routerDepartmentSchedule.route('/:id')
    .put(teamLeaderMiddleware, asyncHandler(departmentScheduleController.updateDepartmentSchedule))
    .get(teamLeaderMiddleware, asyncHandler(departmentScheduleController.getDepartmentScheduleById))
    .delete(teamLeaderMiddleware, asyncHandler(departmentScheduleController.removeScheduleFromDepartment));

export default routerDepartmentSchedule;