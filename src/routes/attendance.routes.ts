import express from "express";
import attendance from '../controllers/attendance';
import { asyncHandler } from "../middlewares/errorHandler";
import { acceptOvertimeRequest, getAttendanceOfEmployeeToday, requestOverTimeRequest, timeIn, timeOut } from "../controllers/clock";
import { adminMiddleware } from "../middlewares";


const routerAttendance = express.Router();

routerAttendance
    .route('/')
    .get(asyncHandler(attendance.getAllAttendance))
    .post(asyncHandler(attendance.createAttendance));

routerAttendance
    .route('/:id')
    .get(asyncHandler(attendance.getAttendanceById))
    .put(adminMiddleware, asyncHandler(attendance.updateAttendance))
    .delete(adminMiddleware, asyncHandler(attendance.deleteAttendance));

routerAttendance
    .route('/employee/:id')
    .get(asyncHandler(attendance.getAttendanceByEmployeeId))
    .put(adminMiddleware, asyncHandler(attendance.updateAttendanceByEmployeeId));

routerAttendance.get('/today/:id', asyncHandler(getAttendanceOfEmployeeToday));

routerAttendance.post('/time-in', asyncHandler(timeIn));
routerAttendance.post('/time-out', asyncHandler(timeOut));
// routerAttendance.post('/lunch-in', asyncHandler(lunchIn));
// routerAttendance.post('/lunch-out', asyncHandler(lunchOut));
routerAttendance.post('/request-overtime', asyncHandler(requestOverTimeRequest));
routerAttendance.post('/accept-overtime', asyncHandler(acceptOvertimeRequest));

export default routerAttendance;
