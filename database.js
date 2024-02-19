/*
 *     Title: The Graduation Planning App (GPA)
 *     Purpose: GPA is designed to assist students in planning and tracking their
 *              academic progress towards graduation. It aims to simplify course
 *              selection, monitor academic milestones, and provide personalized
 *              recommendations for a smooth academic journey.
 *      Author: Team Horizon
 */

import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// async functions queries to the database written by steven

export async function getEnrollments(email) {
  const [rows] = await pool.query(
    `
        SELECT student.student_id AS student_id, enrollment.course_id AS course_id, name, description, credits, attributes, year, quarter, grade
        FROM student
        INNER JOIN enrollment ON student.student_id = enrollment.student_id
        INNER JOIN course ON enrollment.course_id = course.course_id
        WHERE email = ?
        `,
    [email]
  );

  return rows;
}

export async function addStudent({ first_name, last_name, email, avatar }) {
  const [result, error] = await pool.query(
    `
        INSERT INTO student (first_name, last_name, email, avatar)
        VALUES (?, ?, ?, ?)
        `,
    [first_name, last_name, email, avatar]
  );

  if (error) {
    console.error(error);
    return -1;
  }

  return result.insertId;
}
