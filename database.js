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
import toposort from "toposort";
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
let currStanding = function (credits) {
  switch (true) {
    case (credits < 45):
      return "freshman";
    case (credits < 90):
      return "sophomore";
    case (credits < 135):
      return "junior";
    case (credits > 134):
      return "senior";
    default:
      return null;
  }
};
let points_grade = function (letter_grade) {
  if (isNaN(letter_grade)) {
    switch (letter_grade) {
      case "A":
        return 4.0;
      case "A-":
        return 3.7;
      case "B+":
        return 3.3;
      case "B":
        return 3.0;
      case "B-":
        return 2.7;
      case "C+":
        return 2.3;
      case "C":
        return 2.0;
      case "C-":
        return 1.7;
      case "D+":
        return 1.3;
      case "D":
        return 1.0;
      case "E":
        return 0.0;
      default:
        return null;
    }
  }
  else {
    return letter_grade;
  }
};

let quarter_increment = function (quarter, year) {
  switch(quarter) {
    case "winter":
      return ("spring", year);
    case "spring":
      return ("autumn", year);
    case "summer":
      return ("autumn", year);
    case "autumn":
      return ("winter", year + 1);
  };
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
  }
  catch (error) {
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
          SELECT student_field_id, name, type, year, quarter, requirements
          FROM student_field
          WHERE student_id = ?
      `,
      [user.student_id]
    );

    user.fields = fields;

    return user;
  }
  catch (error) {
    console.log(error);
    return null;
  }
}

// add enrollments for a student
// accepts student_id, enrollment_year, enrollment_quarter, graduation_year, graduation_quarter, and enrollments parameters
// enrollments is an array of objects with course_id, year, quarter, grade, and credits properties
// returns -1 if no enrollments were added, otherwise returns an array of failed enrollments
export async function addEnrollments(student_id, enrollment_year, enrollment_quarter, graduation_year, graduation_quarter, counselor_name, enrollments) {
  try {
    await pool.query(
      `
      DELETE FROM enrollment
      WHERE student_id = ?
      `,
      [student_id]
    );

    await pool.query(
      `
      UPDATE student
      SET enrollment_year = ?, enrollment_quarter = ?, graduation_year = ?, graduation_quarter = ?, counselor_id = (
        SELECT counselor_id
        FROM counselor
        WHERE name LIKE ?
        LIMIT 1
      )
      WHERE student_id = ?
      `,
      [
        enrollment_year, 
        typeof enrollment_quarter === "string" ? enrollment_quarter.toLowerCase() : null, 
        graduation_year, 
        typeof graduation_quarter === "string" ? graduation_quarter.toLowerCase() : null, 
        counselor_name, 
        student_id
      ]
    );
  }
  catch (error) {
    console.log(error);
  }

  let failedEnrollments = [];

  for (let enrollment of enrollments) {
    try {
      await pool.query(
        `
            INSERT INTO enrollment (student_id, course_id, year, quarter, grade, credits)
            VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          student_id, 
          enrollment.course_id, 
          enrollment.year, 
          typeof enrollment.quarter === "string" ? enrollment.quarter.toLowerCase() : null, 
          enrollment.grade, 
          enrollment.credits
        ]
      );
    }
    catch (error) {
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
  let past, current, future, completed_credits;
  try {
    [future] = await pool.query(
      `
      SELECT enrollment.course_id AS course_id, name, description, enrollment.credits AS credits, attributes, year, quarter
      FROM enrollment
      INNER JOIN course ON enrollment.course_id = course.course_id
      WHERE enrollment.student_id = ? AND (year > ${currentYear} OR (year = ${currentYear} AND quarter > "${currentQuarter()}"))
      `,
      [student_id]
    );
    [current] = await pool.query(
      `
      SELECT enrollment.course_id AS course_id, name, description, enrollment.credits AS credits, attributes, year, quarter
      FROM enrollment
      INNER JOIN course ON enrollment.course_id = course.course_id
      WHERE enrollment.student_id = ? AND year = ${currentYear} AND quarter = "${currentQuarter()}"
      `,
      [student_id]
    );

    [past] = await pool.query(
      `
      SELECT enrollment.course_id AS course_id, name, description, enrollment.credits AS credits, attributes, year, quarter, grade
      FROM enrollment
      INNER JOIN course ON enrollment.course_id = course.course_id
      WHERE enrollment.student_id = ? AND (year < ${currentYear} OR (year = ${currentYear} AND quarter < "${currentQuarter()}"))
      `,
      [student_id]
    );

    completed_credits = await pool.query(
      `
      SELECT SUM(credits) AS completed_credits
      FROM enrollment
      WHERE student_id = ? AND (year < ${currentYear} OR (year = ${currentYear} AND quarter < "${currentQuarter()}"))
      `,
      [student_id]
    )[0][0].completed_credits;
  }
  catch (error) {
    console.log(error);
    return -1;
  }

  let courseGrade = new Map();

  for  (let course of past) {
    if (courseGrade.has(course.course_id)) {
      courseGrade.set(course.course_id, {credits: course.credits, grade: Math.max(courseGrade.get(course.course_id).grade, points_grade(course.grade))});
    }
    else {
      courseGrade.set(course.course_id, {credits: course.credits, grade: points_grade(course.grade)});
    }
  }

  let qualityPoints = 0.0;
  let totalCredits = 0;

  for (let course of courseGrade.values()) {
    if (!isNaN(course.grade) && !isNaN(course.credits)) {
      let credits = parseInt(course.credits);
      let grade = parseFloat(course.grade);
      totalCredits += credits;
      qualityPoints += (grade * credits);
    }
  }
  
  let gpa = 0;

  if (totalCredits != 0) {
    gpa = qualityPoints / totalCredits;
  }

  return {current: current, past: past, future: future, gpa: gpa, completed_credits: completed_credits};
}

// add a new field for a student with its requirements in JSON format
// accepts student_id, name, type, year, quarter, ud_credits, total_credits, and requirements as parameters
// returns true if the field was added successfully
export async function addStudentField(student_id, name, type, year, quarter, ud_credits, total_credits, requirements) {
  let courses_set = new Set();
  let duplicate_fields, all_courses_details;

  for (let group of requirements) {
    for (let option of group) {
      for (let course of option.courses) {
        courses_set.add(course);
      }
    }
  }

  try {
    [all_courses_details] = await pool.query(
      `
        SELECT course_id, name, credits
        FROM course
        WHERE course_id IN ?
      `,
      courses_set.values());
  }
  catch (error) {
    console.log(error);
    return -1;
  }
  
  let course_details = new Map();

  for (let course of all_courses_details) {
    course_details.set(course.course_id, course);
  }

  for (let group of requirements) {
    for (let option of group) {
      for (let course of option.courses) {
        course = course_details.get(course);
      }
    }
  }

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
        requirements
      ]
    );
    [duplicate_fields] = await pool.query(
      `
      SELECT student_field_id, name, type, year, quarter
      FROM student_field
      WHERE student_id = ? AND name = ? AND type = ?
      `,
      [student_id, name, type]
    );      
  }
  catch (error) {
    console.log(error);
    return [];
  }
  return duplicate_fields;
}

// delete a field for a student
// accepts student_id, name, type, year, and quarter as parameters
// returns true if the field was deleted successfully
export async function deleteStudentField(student_field_id) {
  try {
    await pool.query(
      `
        DELETE FROM student_field
        WHERE student_field_id = ?
      `,
      [student_field_id]
    );
  }
  catch (error) {
    console.log(error);
    return false;
  }
  return true;
}

// create a plan for a student
// accepts max_credits_per_quarter, mandatory_courses, completed_courses, and completed_credits as parameters
// returns a plan for the student in the type of an array of objects with properties year, quarter, credits, and classes
export async function createPlan(max_credits_per_quarter, mandatory_courses, completed_courses, completed_credits) {
  let course_details = new Map();
  ['WRI 1000', 'WRI 1100', 'UCOR 2000', 'UCOR 3000', 'UFDN 1000', 'UFDN 2000', 'UFDN 3100']. forEach(course => {if (!completed_courses.has(course)) {mandatory_courses.add(course)}});
  let curr_prerequisites = new Set(mandatory_courses.values());
  let prerequisites_tuples = [];
  let current_year, current_quarter, curr_standing, available_sections;
  (current_quarter, current_year) = quarter_increment(currentQuarter(), currentYear);
  let course_planned_quarter = new Map();
  let course_prerequisites = new Map();
  let final_plan = [{
    year: current_year,
    quarter: current_quarter,
    credits: 0,
    classes: []
  }];

  try {
    [available_sections] = await pool.query(
      `
      SELECT section_id, course_id, year, quarter, classes, location, instructor
      FROM section
      WHERE year > ${currentYear} OR (year = ${currentYear} AND quarter > "${currentQuarter()}")
      `
    );
  }
  catch (error) {
    console.log(error);
    return -1;
  }

  while (curr_prerequisites.size > 0) {
    let courses;
    try {
      [courses] = await pool.query(
        `
        SELECT course_id, name, credits, attributes, standing, prerequisites, corequisites
        FROM course
        WHERE course_id IN ?
        `,
        curr_prerequisites.values()
      );
    }
    catch (error) {
      console.log(error);
      return -1;
    }

    curr_prerequisites.clear();

    for (let course of courses) {
      let prerequisite_options = [];
      let prerequisites_met = false;
      let min_credits_remaining =  Number.MAX_SAFE_INTEGER;
      let min_courses_remaining = Number.MAX_SAFE_INTEGER;
      let index_of_min = 0;

      course_details.set(course.course_id, course);

      for (let i = 0; i < course.prerequisites.length; i++) {
        let credits_remaining = 0;
        let courses_remaining = 0;
        let prerequisite_tuples = [];
        let incomplete_prerequisites = [];

        for (let prerequisite_course of course.prerequisites[i]) {
          if (!completed_courses.has(prerequisite_course.course_id)) {
            courses_remaining++;
            credits_remaining += parseInt(prerequisite_course.credits);
            prerequisite_tuples.push([prerequisite_course.course_id, course.course_id]);
            incomplete_prerequisites.push(prerequisite_course.course_id);
          }
        }

        if (courses_remaining == 0) {
          prerequisites_met = true;
          break;
        }
        else {
          prerequisite_options.push({courses_remaining: courses_remaining, credits_remaining: credits_remaining, prerequisite_tuples: prerequisite_tuples, incomplete_prerequisites: incomplete_prerequisites});
        }
      }

      if (prerequisites_met) {
        continue
      }

      for (let i = 0; i < prerequisite_options.length; i++) {
        if (prerequisite_options[i].credits_remaining < min_credits_remaining || (prerequisite_options[i].credits_remaining == min_credits_remaining && prerequisite_options[i].courses_remaining < min_courses_remaining)) {
          min_credits_remaining = prerequisite_options[i].credits_remaining;
          min_courses_remaining = prerequisite_options[i].courses_remaining;
          index_of_min = i;
        }
      }

      prerequisite_options[index_of_min].incomplete_prerequisites.forEach(prerequisite => {curr_prerequisites.add(prerequisite)});
      prerequisite_options[index_of_min].prerequisite_tuples.forEach(tuple => {prerequisites_tuples.push(tuple)});
    }
  }

  prerequisites_tuples.forEach(tuple => {
    if (course_prerequisites.has(tuple[1])) {
      course_prerequisites.set(tuple[1], course_prerequisites.get(tuple[1]).push(tuple[0]));
    }
    else {
      course_prerequisites.set(tuple[1], [tuple[0]]);
    }
  });

  let sorted_courses = toposort(prerequisites_tuples);

  let future_completed_credits = [];
  future_completed_credits.push(completed_credits);

  for (let course of sorted_courses) {
    let curr_course = course_details.get(course);
    (current_quarter, current_year) = quarter_increment(currentQuarter(), currentYear);
    let earliest_quarter = 0;

    for (let prerequisite of course_prerequisites.get(course)) {
      if (course_planned_quarter.get(prerequisite) >= earliest_quarter) {
        for (let prerequisiteObj of curr_course.prerequisites.flat()) {
          if (prerequisiteObj.course_id == prerequisite) {
            earliest_quarter = prerequisiteObj.concurrent_available ? course_planned_quarter.get(prerequisite) : course_planned_quarter.get(prerequisite) + 1;
            break;
          }
        }
      }
    }

    for (let index = earliest_quarter; true; index++) {
      if (final_plan.length < index + 1) {
        (current_quarter, current_year) = quarter_increment(final_plan[index - 1].quarter, final_plan[index - 1].year);
        final_plan.push({
          year: current_year,
          quarter: current_quarter,
          credits: 0,
          classes: []
        });
        future_completed_credits.push(future_completed_credits[index - 1]);
      }

      curr_standing = currStanding(future_completed_credits[index]);

      if (course_details.get(course).standing.contains(curr_standing)
      && final_plan[index].credits + curr_course.credits <= max_credits_per_quarter
      && available_sections.find(section => section.course_id == course && section.year == final_plan[index].year && section.quarter == final_plan[index].quarter)) {
        for (let courseCode of curr_course.corequisites.append(course)) {
          final_plan[index].credits += course_details.get(courseCode).credits;
          final_plan[index].classes.push(courseCode); // Add section information
          course_planned_quarter.set(courseCode, index);
          for (let i = index + 1; i < future_completed_credits.length - index - 1; i++) {
            future_completed_credits[i] += course_details.get(courseCode).credits;
          }
        }
      }
    }
  }
  return final_plan;
}
