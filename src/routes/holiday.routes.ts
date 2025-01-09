import express from "express";
import { asyncHandler } from "../middlewares/errorHandler";
import holiday from "../controllers/holiday";

const routerHoliday = express.Router();

routerHoliday.route("/")
    .get(asyncHandler(holiday.getHolidays))
    .post(asyncHandler(holiday.createHoliday));

routerHoliday.route("/:id")
    .get(asyncHandler(holiday.getHolidayById))
    .put(asyncHandler(holiday.updateHoliday))
    .delete(asyncHandler(holiday.deleteHoliday));

export default routerHoliday;