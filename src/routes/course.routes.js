import express from 'express';
import * as course from '../controllers/course.controller.js';

const router = express.Router();

//Course Routes
router.get('/getCourses', course.getClasses);




export default router;


