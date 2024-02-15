/**
 *     Title: GPA- Graduation Planning App Project
 *     Purpose: The Graduation Planning App (GPA) is designed to assist students in 
 *              planning and tracking their academic progress towards graduation. It 
 *              aims to simplify course selection, monitor academic milestones, and 
 *              provide personalized recommendations for a smooth academic journey.
 *     Class: Software Engineering I, II, and Senior Capstone
 *     Academic Year: 2023 - 2024
 *     Author: Team Horizon
 */

const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();

app.use(express.json());

const userRoute = require('./src/routes/user.routes');
const courseRoute = require('./src/routes/course.routes');
app.use('/user', userRoute);
app.use('/course', courseRoute);

// Start the server
const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
