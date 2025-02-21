import express from "express";
import { asyncHandler } from "../middlewares/errorHandler";
import { HolidayController } from "../controllers/holiday";

const routerHoliday = express.Router();

routerHoliday.route("/")
    .get(asyncHandler(HolidayController.getHolidays))
    .post(asyncHandler(HolidayController.createHoliday));

routerHoliday.route("/:id")
    .get(asyncHandler(HolidayController.getHolidayById))
    .put(asyncHandler(HolidayController.updateHoliday))
    .delete(asyncHandler(HolidayController.deleteHoliday));


routerHoliday.route("/month/:month/day/:day").get(asyncHandler(HolidayController.getHolidayByMonthDay));

export default routerHoliday;