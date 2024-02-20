/*
 *     Title: The Graduation Planning App (GPA)
 *     Purpose: GPA is designed to assist students in planning and tracking their 
 *              academic progress towards graduation. It aims to simplify course 
 *              selection, monitor academic milestones, and provide personalized 
 *              recommendations for a smooth academic journey.
 *      Author: Team Horizon
 */

import mysql from 'mysql2/promise'; // mysql2/promise is a MySQL client for Node.js that is written in JavaScript and does not require a compiler. It is a wrapper for mysql2 that uses ES6 promises.
import dotenv from 'dotenv'; // dotenv is a zero-dependency module that loads environment variables from a .env file into process.env. Storing configuration in the environment separate from code is based on The Twelve-Factor App methodology.
dotenv.config(); // Load environment variables from a .env file into process.env

// Create a connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

currentYear = new Date().getFullYear();
currentQuarter = Math.floor(new Date().getMonth() / 3) + 1;

// get all enrollments for a student
// accepts email as parameter
// returns an object with three properties: current, past, and gpa
// current is an array of courses the student is currently enrolled in
// past is an array of courses the student has completed
// gpa is the student's 4.0 grade point average
export async function getEnrollments(email) {
    const [current] = await pool.query(`
        SELECT enrollment.course_id AS course_id, name, description, credits, attributes
        FROM student
        INNER JOIN enrollment ON student.student_id = enrollment.student_id
        INNER JOIN course ON enrollment.course_id = course.course_id
        WHERE email = ? AND year = ${currentYear} AND quarter = ${currentQuarter}
        `, [email]);

    const [past]  = await pool.query(`
        SELECT enrollment.course_id AS course_id, name, description, credits, attributes, year, quarter, grade
        FROM student
        INNER JOIN enrollment ON student.student_id = enrollment.student_id
        INNER JOIN course ON enrollment.course_id = course.course_id
        WHERE email = ? AND (year < ${currentYear} OR (year = ${currentYear} AND quarter < ${currentQuarter}))
        `, [email]);
    
    let qualityPoints = 0;
    let totalCredits = 0;

    for (course of past) {
        if (course.grade != null && course.credits != null) {
            totalCredits += course.credits;
            qualityPoints += course.grade * course.credits;
        }
    }

    return {'current': current, 'past': past, 'gpa': qualityPoints / totalCredits};
}

// register a new user
// accepts an object with first_name, last_name, email, and avatar properties
// returns the student_id of the newly registered user
export async function registerUser({first_name, last_name, email, avatar}) {
    const [result] = await pool.query(`
        INSERT INTO student (first_name, last_name, email, avatar)
        VALUES (?, ?, ?, ?)
        `, [first_name, last_name, email, avatar]);

        return result.insertId;
}

// check if a user exists
// accepts an email as parameter
// returns a boolean indicating whether the user exists
export async function userExists(email) {
    const [rows] = await pool.query(`
        SELECT * FROM student
        WHERE email = ?
        `, [email]);

        return rows.length > 0;
}

// add enrollments for a student
// accepts an object with student_id, enrollment_year, enrollment_quarter, graduation_year, graduation_quarter, and enrollments properties
// enrollments is an array of objects with course_id, year, quarter, and grade properties
// returns the student_id of the student whose enrollments were added
export async function addEnrollments({student_id, enrollment_year, enrollment_quarter, graduation_year, graduation_quarter, enrollments}) {
    const [result] = await pool.query(`
        UPDATE student
        SET enrollment_year = ?, enrollment_quarter = ?, graduation_year = ?, graduation_quarter = ?
        WHERE student_id = ?
        `, [enrollment_year, enrollment_quarter, graduation_year, graduation_quarter, student_id]);

        for (enrollment of enrollments) {
            if (isNaN(enrollment.grade)) {
                switch (enrollment.grade) {
                    case 'A':
                        enrollment.grade = 4.0;
                        break;
                    case 'A-':
                        enrollment.grade = 3.7;
                        break;
                    case 'B+':
                        enrollment.grade = 3.3;
                        break;
                    case 'B':
                        enrollment.grade = 3.0;
                        break;
                    case 'B-':
                        enrollment.grade = 2.7;
                        break;
                    case 'C+':
                        enrollment.grade = 2.3;
                        break;
                    case 'C':
                        enrollment.grade = 2.0;
                        break;
                    case 'C-':
                        enrollment.grade = 1.7;
                        break;
                    case 'D+':
                        enrollment.grade = 1.3;
                        break;
                    case 'D':
                        enrollment.grade = 1.0;
                        break;
                    case 'E':
                        enrollment.grade = 0.0;
                        break;
                    case 'P':
                        enrollment.grade = 0.0;
                        break;
                    case 'NC':
                        enrollment.grade = 0.0;
                        break;
                    case 'AU':
                        enrollment.grade = 0.0;
                        break;
                    default:
                        enrollment.grade = null;
                        break;
                }
            }
            
            await pool.query(`
                INSERT INTO enrollment (student_id, course_id, year, quarter, grade)
                VALUES (?, ?, ?, ?, ?)
                `, [student_id, enrollment.course_id, enrollment.year, enrollment.quarter, enrollment.grade]);
        }

        return result.insertId;
}

// get user information
// accepts an email as parameter
// returns an object with student_id, first_name, last_name, email, avatar, graduation_year, and graduation_quarter properties
export async function getUser(email) {
    const [[rows]] = await pool.query(`
        SELECT student_id, first_name, last_name, email, avatar, graduation_year, graduation_quarter
        FROM student
        WHERE email = ?
        `, [email]);

        return rows;
}
