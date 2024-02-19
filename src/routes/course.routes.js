import express from "express";
import * as course from "../controllers/course.controller.js";
import { upload } from "../GPA HTML Parsing/parse_middle_ware.js";

const router = express.Router();

//Course Routes
router.get("/getCourses", course.getClasses);

router.post("/parseCourses", upload.single("file"), course.parseCourses);

export default router;
