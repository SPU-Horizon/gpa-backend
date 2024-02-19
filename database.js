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

export async function getEnrollments(email) {
    const [rows]  = await pool.query(`
        SELECT student.student_id AS student_id, enrollment.course_id AS course_id, name, description, credits, attributes, year, quarter, grade
        FROM student
        INNER JOIN enrollment ON student.student_id = enrollment.student_id
        INNER JOIN course ON enrollment.course_id = course.course_id
        WHERE email = ?
        `, [email]);

        return rows;
}

export async function addStudent({first_name, last_name, email, avatar}) {
    const [result] = await pool.query(`
        INSERT INTO student (first_name, last_name, email, avatar)
        VALUES (?, ?, ?, ?)
        `, [first_name, last_name, email, avatar]);

        return result.insertId;
}

export async function addEnrollments({student_id, enrollment_year, enrollment_quarter, graduation_year, graduation_quarter, field_requirements, enrollments}) {
    const [result] = await pool.query(`
        UPDATE student
        SET enrollment_year = ?, enrollment_quarter = ?, graduation_year = ?, graduation_quarter = ?
        WHERE student_id = ?
        `, [enrollment_year, enrollment_quarter, graduation_year, graduation_quarter, student_id]);

        for (enrollment of enrollments) {
            await pool.query(`
                INSERT INTO enrollment (student_id, course_id, year, quarter, grade)
                VALUES (?, ?, ?, ?, ?)
                `, [student_id, enrollment.course_id, enrollment.year, enrollment.quarter, enrollment.grade]);
        }

        return result.insertId;
}