/*
 *     Title: The Graduation Planning App (GPA)
 *     Purpose: GPA is designed to assist students in planning and tracking their
 *              academic progress towards graduation. It aims to simplify course
 *              selection, monitor academic milestones, and provide personalized
 *              recommendations for a smooth academic journey.
 *      Author: Team Horizon
 */

import mysql from "mysql2/promise"; // mysql2/promise is a MySQL client for Node.js that is written in JavaScript and does not require a compiler. It is a wrapper for mysql2 that uses ES6 promises.
import dotenv from "dotenv"; // dotenv is a zero-dependency module that loads environment variables from a .env file into process.env. Storing configuration in the environment separate from code is based on The Twelve-Factor App methodology.
dotenv.config(); // Load environment variables from a .env file into process.env

// Create a connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const currentYear = new Date().getFullYear();
const currentQuarter = function () {
  switch (Math.floor(new Date().getMonth() / 3) + 1) {
    case 1:
      return "winter";
    case 2:
      return "spring";
    case 3:
      return "summer";
    case 4:
      return "autumn";
    default:
      return null;
  }
};

// check if a user exists
// accepts an email as parameter
// returns a boolean indicating whether the user exists
export async function userExists(email) {
  const [rows] = await pool.query(
    `
        SELECT * FROM student
        WHERE email = ?
    `,
    [email]
  );

  return rows.length > 0;
}

// register a new user
// accepts first_name, last_name, and email parameters
// returns the student_id of the newly registered user, otherwise returns null
export async function registerUser(first_name, last_name, email) {
  try {
    const [result] = await pool.query(
      `
          INSERT INTO student (first_name, last_name, email)
          VALUES (?, ?, ?)
      `,
      [first_name, last_name, email]
    );

    return result.insertId;
  } catch (error) {
    console.log(error);
    return null;
  }
}

// get a user's information
// accepts an email as parameter
// returns an object with properties student_id, first_name, last_name, enrollment_year, enrollment_quarter, graduation_year, graduation_quarter,
// counselor_id, counselor_name, counselor_email, counselor_phone, and fields
// Retuns null if the user does not exist
export async function getUser(email) {
  try {
    let [[user]] = await pool.query(
      `
          SELECT student_id, first_name, last_name, enrollment_year, enrollment_quarter, graduation_year, graduation_quarter,
          student.counselor_id AS counselor_id, name AS counselor_name, title AS counselor_title, counselor.email AS counselor_email, phone AS counselor_phone, last_names_served AS counselor_last_names_served, meeting_link AS counselor_meeting_link
          FROM student
          LEFT JOIN counselor ON student.counselor_id = counselor.counselor_id
          WHERE student.email = ?
      `,
      [email]
    );

    let [fields] = await pool.query(
      `
          SELECT name, type, year, quarter
          FROM student_field
          WHERE student_id = ?
      `,
      [user.student_id]
    );

    user.fields = fields;

    return user;
  } catch (error) {
    console.log(error);
    return null;
  }
}

// add enrollments for a student
// accepts student_id, enrollment_year, enrollment_quarter, graduation_year, graduation_quarter, and enrollments parameters
// enrollments is an array of objects with course_id, year, quarter, grade, and credits properties
// returns -1 if no enrollments were added, otherwise returns an array of failed enrollments
export async function addEnrollments(
  student_id,
  enrollment_year,
  enrollment_quarter,
  graduation_year,
  graduation_quarter,
  enrollments
) {
  try {
    await pool.query(
      `
          UPDATE student
          SET enrollment_year = ?, enrollment_quarter = ?, graduation_year = ?, graduation_quarter = ?
          WHERE student_id = ?
      `,
      [
        enrollment_year,
        typeof enrollment_quarter === "string"
          ? enrollment_quarter.toLowerCase()
          : null,
        graduation_year,
        typeof graduation_quarter === "string"
          ? graduation_quarter.toLowerCase()
          : null,
        student_id,
      ]
    );
  } catch (error) {
    console.log(error);
  }

  let failedEnrollments = [];

  for (let enrollment of enrollments) {
    try {
      if (isNaN(enrollment.grade)) {
        switch (enrollment.grade) {
          case "A":
            enrollment.grade = 4.0;
            break;
          case "A-":
            enrollment.grade = 3.7;
            break;
          case "B+":
            enrollment.grade = 3.3;
            break;
          case "B":
            enrollment.grade = 3.0;
            break;
          case "B-":
            enrollment.grade = 2.7;
            break;
          case "C+":
            enrollment.grade = 2.3;
            break;
          case "C":
            enrollment.grade = 2.0;
            break;
          case "C-":
            enrollment.grade = 1.7;
            break;
          case "D+":
            enrollment.grade = 1.3;
            break;
          case "D":
            enrollment.grade = 1.0;
            break;
          case "E":
            enrollment.grade = 0.0;
            break;
          case "P":
            enrollment.grade = 0.0;
            break;
          case "NC":
            enrollment.grade = 0.0;
            break;
          case "AU":
            enrollment.grade = 0.0;
            break;
          default:
            enrollment.grade = null;
            break;
        }
      }

      await pool.query(
        `
            INSERT INTO enrollment (student_id, course_id, year, quarter, grade, credits)
            VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          student_id,
          enrollment.course_id,
          enrollment.year,
          typeof enrollment.quarter === "string"
            ? enrollment.quarter.toLowerCase()
            : null,
          enrollment.grade,
          enrollment.credits,
        ]
      );
    } catch (error) {
      failedEnrollments.push(enrollment);
    }
  }

  return failedEnrollments;
}

// get all enrollments for a user
// accepts student_id as parameter
// returns an object with properties: current, past, future, and gpa
// current is an array of courses the student is currently enrolled in
// past is an array of courses the student has completed
// future is an array of courses the student is registered to take in a later quarter
// gpa is the student's 4.0 grade point average
export async function getEnrollments(student_id) {
  let past, current, future;
  try {
    [future] = await pool.query(
      `
          SELECT enrollment.course_id AS course_id, name, description, enrollment.credits AS credits, attributes, year, quarter
          FROM student
          INNER JOIN enrollment ON student.student_id = enrollment.student_id
          INNER JOIN course ON enrollment.course_id = course.course_id
          WHERE enrollment.student_id = ? AND (year > ${currentYear} OR (year = ${currentYear} AND quarter > "${currentQuarter()}"))
      `,
      [student_id]
    );
    [current] = await pool.query(
      `
          SELECT enrollment.course_id AS course_id, name, description, enrollment.credits AS credits, attributes, year, quarter
          FROM student
          INNER JOIN enrollment ON student.student_id = enrollment.student_id
          INNER JOIN course ON enrollment.course_id = course.course_id
          WHERE enrollment.student_id = ? AND year = ${currentYear} AND quarter = "${currentQuarter()}"
      `,
      [student_id]
    );

    [past] = await pool.query(
      `
          SELECT enrollment.course_id AS course_id, name, description, enrollment.credits AS credits, attributes, year, quarter, grade
          FROM student
          INNER JOIN enrollment ON student.student_id = enrollment.student_id
          INNER JOIN course ON enrollment.course_id = course.course_id
          WHERE enrollment.student_id = ? AND (year < ${currentYear} OR (year = ${currentYear} AND quarter < "${currentQuarter()}"))
      `,
      [student_id]
    );
  } catch (error) {
    console.log(error);
    return -1;
  }

  let courseGrade = new Map();

  for (let course of past) {
    if (courseGrade.has(course.course_id)) {
      courseGrade.set(course.course_id, {
        credits: course.credits,
        grade: Math.max(courseGrade.get(course.course_id).grade, course.grade),
      });
    } else {
      courseGrade.set(course.course_id, {
        credits: course.credits,
        grade: course.grade,
      });
    }
  }

  let qualityPoints = 0;
  let totalCredits = 0;

  for (let course of courseGrade.values()) {
    let credits = parseInt(course.credits);
    let grade = parseFloat(course.grade);
    if (!isNaN(grade) && !isNaN(credits)) {
      totalCredits += credits;
      qualityPoints += grade * credits;
    }
  }

  const gpa = function () {
    switch (totalCredits) {
      case 0:
        return null;
      default:
        return qualityPoints / totalCredits;
    }
  };

  return { current: current, past: past, future: future, gpa: gpa() };
}

// add a new field for a student with its requirements in JSON format
// accepts student_id, name, type, year, quarter, ud_credits, total_credits, and requirements as parameters
// returns true if the field was added successfully
export async function addStudentField(
  student_id,
  name,
  type,
  year,
  quarter,
  ud_credits,
  total_credits,
  requirements
) {
  try {
    await pool.query(
      `
        INSERT INTO student_field (student_id, name, type, year, quarter, ud_credits, total_credits, requirements)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        student_id,
        name,
        type,
        year,
        typeof quarter === "string" ? quarter.toLowerCase() : null,
        ud_credits,
        total_credits,
        requirements,
      ]
    );
  } catch (error) {
    console.log(error);
    return false;
  }
  return true;
}

// delete a field for a student
// accepts student_id, name, type, year, and quarter as parameters
// returns true if the field was deleted successfully
export async function deleteStudentField(
  student_id,
  name,
  type,
  year,
  quarter
) {
  try {
    await pool.query(
      `
        DELETE FROM student_field
        WHERE student_id = ? AND name = ? AND type = ? AND year = ? AND quarter = ?
      `,
      [
        student_id,
        name,
        type,
        year,
        typeof quarter === "string" ? quarter.toLowerCase() : null,
      ]
    );
  } catch (error) {
    console.log(error);
    return false;
  }
  return true;
}

// NOT FUNCTIONAL DUE TO DATABASE DESIGN CHANGES
export async function getRequiredClasses(student_id) {
  const [past_enrollments] = await pool.query(
    `
        SELECT course_id
        FROM enrollment
        WHERE student_id = ? AND (year < ${currentYear} OR (year = ${currentYear} AND quarter < "${currentQuarter()}")) AND grade >= 2.0
    `,
    [student_id]
  );

  past_enrollments.map((enrollment) => enrollment.course_id);

  const [field_requirements] = await pool.query(
    `
        SELECT field_requirements
        FROM student
        WHERE student_id = ?
    `,
    [student_id]
  );

  let required_classes = new Set();

  for (let field of field_requirements) {
    for (let section of field.requirements) {
      for (let course of section.classes) {
        required_classes.add(course);
      }
    }
  }

  [courses_detail] = await pool.query(
    `
      SELECT course_id, name, credits, attributes, standing, restrictions, prerequisites, corequisites, approval_required, last_offered, recurrence_year, recurrence_quarter, recurrence_classes
      FROM course
      WHERE course_id IN ?
    `,
    [required_classes]
  );

  let course_detail = new Map();

  courses_detail.map((course) => {
    course_detail.set(course.course_id, course);
  });

  for (let field of field_requirements) {
    for (let section of field.requirements) {
      for (let course of section.classes) {
        course = course_detail.get(course);

        if (past_enrollments.includes(course.course_id)) {
          course.completed = true;
        } else {
          course.completed = false;
        }
      }
    }
  }

  return {
    field_requirements: field_requirements,
    past_enrollments: past_enrollments,
  };
}
