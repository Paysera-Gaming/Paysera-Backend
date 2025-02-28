import express from "express";
import { EmployeeController } from "../controllers/employee";
import { asyncHandler } from "../middlewares/errorHandler";
import { teamLeaderMiddleware } from "../middlewares";

const routerEmployee = express.Router();

routerEmployee
    .route("/")
    .get(asyncHandler(EmployeeController.getAllEmployees))
    .post(teamLeaderMiddleware, asyncHandler(EmployeeController.createEmployee));

routerEmployee
    .route("/:id")
    .get(asyncHandler(EmployeeController.getEmployeeById))
    .delete(teamLeaderMiddleware, asyncHandler(EmployeeController.deleteEmployeeById))
    .put(teamLeaderMiddleware, asyncHandler(EmployeeController.updateEmployee));

routerEmployee.route("/team-leader").get(asyncHandler(EmployeeController.getAllTeamLeaders));
routerEmployee.route("/only-employee").get(asyncHandler(EmployeeController.getAllOnlyEmployee));
routerEmployee.route("/admin").get(asyncHandler(EmployeeController.getAllAdmin));

export default routerEmployee;