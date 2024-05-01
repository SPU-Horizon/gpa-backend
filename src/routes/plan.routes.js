import express from "express";
import * as plan from "../controllers/plan.controller.js";

const router = express.Router();

//Course Routes
router.post("/getSchedule", plan.createPlan);
router.get("/getPlans", plan.getPlan);
router.post("/savePlan", plan.savePlan);


export default router;
