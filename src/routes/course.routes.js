import express from "express";
import * as course from "../controllers/course.controller.js";
import { upload } from "../GPA HTML Parsing/parse_middle_ware.js";

const router = express.Router();

//Course Routes
router.get("/getCourses", course.getClasses);

// Parse Course Routes
router.post("/parseBanner", upload.single("file"), course.parseBanner);

router.delete("/drop-field", course.dropField);

export default router;
