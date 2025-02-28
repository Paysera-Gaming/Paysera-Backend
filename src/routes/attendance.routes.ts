import express from "express";
import { AttendanceController } from '../controllers/attendance';
import { asyncHandler } from "../middlewares/errorHandler";
import { acceptOvertimeRequest, getAttendanceOfEmployeeToday, requestOverTimeRequest, timeIn, timeOut } from "../controllers/clock";
import { adminMiddleware } from "../middlewares";


const routerAttendance = express.Router();

routerAttendance
    .route('/')
    .get(asyncHandler(AttendanceController.getAllAttendance))
    .post(asyncHandler(AttendanceController.createAttendance));

routerAttendance
    .route('/:id')
    .get(asyncHandler(AttendanceController.getAttendanceById))
    .put(adminMiddleware, asyncHandler(AttendanceController.updateAttendance))
    .delete(adminMiddleware, asyncHandler(AttendanceController.deleteAttendance));

routerAttendance
    .route('/employee/:id')
    .get(asyncHandler(AttendanceController.getAttendanceByEmployeeId))
    .put(adminMiddleware, asyncHandler(AttendanceController.updateAttendanceByEmployeeId));

routerAttendance.get('/today/:id', asyncHandler(getAttendanceOfEmployeeToday));

routerAttendance.post('/time-in', asyncHandler(timeIn));
routerAttendance.post('/time-out', asyncHandler(timeOut));
routerAttendance.post('/request-overtime', asyncHandler(requestOverTimeRequest));
routerAttendance.post('/accept-overtime', asyncHandler(acceptOvertimeRequest));

export default routerAttendance;
