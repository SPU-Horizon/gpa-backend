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

require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

async function getEnrollments(email) {
    const [rows]  = await pool.query(`
        SELECT student.student_id AS student_id, course_id, year, quarter, grade
        FROM student
        INNER JOIN enrollment ON student.student_id = enrollment.student_id
        WHERE email = ?
        `, [email]);

        return rows;
}

module.exports = {getEnrollments};
