/*
 *     Title: The Graduation Planning App (GPA)
 *     Purpose: GPA is designed to assist students in planning and tracking their 
 *              academic progress towards graduation. It aims to simplify course 
 *              selection, monitor academic milestones, and provide personalized 
 *              recommendations for a smooth academic journey.
 *      Author: Team Horizon
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});
