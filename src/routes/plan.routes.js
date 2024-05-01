import express from "express";
import * as plan from "../controllers/plan.controller.js";

const router = express.Router();

//Course Routes
router.get("/getSchedule", course.getClasses);



export default router;
