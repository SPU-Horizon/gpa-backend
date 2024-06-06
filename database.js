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
      return [2, "winter"];
    case 2:
      return [3, "spring"];
    case 3:
      return [4, "summer"];
    case 4:
      return [1, "autumn"];
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
      return ["spring", year];
    case "spring":
      return ["autumn", year];
    case "summer":
      return ["autumn", year];
    case "autumn":
      return ["winter", year + 1];
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

// get array of student fields not found in the database
// accepts student_id and parsedFields as parameters
// returns an array of student fields that are not found in the database
export async function getMissingFields (student_id, parsed_fields) {
  let missing_fields = [];

  try {
    let [student_fields] = await pool.query(
      `
      SELECT name
      FROM student_field
      WHERE student_id = ?
      `,
      [student_id]
    );
    
    // map the fields to their names
    student_fields = student_fields.map((field) => field.name);
    
    for (let parsed_field of parsed_fields) {
      let is_stored = false;
      for (let stored_field of student_fields) {
        if (stored_field.includes(parsed_field)) {
          is_stored = true;
          break;
        }
      }
      if (!is_stored) {
        missing_fields.push(parsed_field)
      }
    }
    return missing_fields;
  }
  catch (error) {
    console.log(error);
    return [];
  }
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
          SELECT student_field_id, name, type, year, quarter, ud_credits, total_credits, requirements
          FROM student_field
          WHERE student_id = ?
      `,
      [user.student_id]
    );

    let [[credits_row]] = await pool.query(
      `
      SELECT SUM(credits) AS earned_credits
      FROM enrollment
      WHERE enrollment.student_id = ? 
      AND (year < ${currentYear} OR (year = ${currentYear} AND quarter < ${currentQuarter()[0]}))
      `,
      [user.student_id]
    );

    user.fields = fields;
    user.standing = currStanding(parseInt(credits_row.earned_credits));

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
  } catch (error) {
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
  let past, current, future, completed_credits = 0;
  try {
    [future] = await pool.query(
      `
      SELECT enrollment.course_id AS course_id, name, description, enrollment.credits AS credits, attributes, year, quarter
      FROM enrollment
      LEFT JOIN course ON enrollment.course_id = course.course_id
      WHERE enrollment.student_id = ? AND (year > ${currentYear} OR (year = ${currentYear} AND quarter > ${currentQuarter()[0]}))
      `,
      [student_id]
    );

    [current] = await pool.query(
      `
      SELECT enrollment.course_id AS course_id, name, description, enrollment.credits AS credits, attributes, year, quarter
      FROM enrollment
      LEFT JOIN course ON enrollment.course_id = course.course_id
      WHERE enrollment.student_id = ? AND year = ${currentYear} AND quarter = ${currentQuarter()[0]}
      `,
      [student_id]
    );

    [past] = await pool.query(
      `
      SELECT enrollment.course_id AS course_id, name, description, enrollment.credits AS credits, attributes, year, quarter, grade
      FROM enrollment
      LEFT JOIN course ON enrollment.course_id = course.course_id
      WHERE enrollment.student_id = ? AND (year < ${currentYear} OR (year = ${currentYear} AND quarter < ${currentQuarter()[0]}))
      `,
      [student_id]
    );

    for (let course of future) {
      if (course.name == null) {
        course.name = "Legacy or transfer course"
        course.description = "The description of this course is not available at this time."
      }
    }
    for (let course of current) {
      if (course.name == null) {
        course.name = "Legacy or transfer course"
        course.description = "The description of this course is not available at this time."
      }
    }
    for (let course of past) {
      if (course.name == null) {
        course.name = "Legacy or transfer course"
        course.description = "The description of this course is not available at this time."
      }
    }
  }
  catch (error) {
    console.log(error);
    return -1;
  }

  let courseGrade = new Map();

  for (let course of past) {
    course.credits == null ? pass : completed_credits += parseFloat(course.credits);
    if (courseGrade.has(course.course_id)) {
      courseGrade.set(course.course_id, {credits: course.credits, grade: Math.max(courseGrade.get(course.course_id).grade, points_grade(course.grade))});
    }
    else {
      courseGrade.set(course.course_id, {credits: course.credits, grade: points_grade(course.grade)});
    }
  }

  let qualityPoints = 0;
  let totalCredits = 0;

  for (let course of courseGrade.values()) {
    if (course.grade != null && course.credits != null) {
      let credits = parseFloat(course.credits);
      let grade = parseFloat(course.grade);
      totalCredits += credits;
      qualityPoints += grade * credits;
    }
  }
  
  let gpa;

  totalCredits == 0 ? gpa = 0 : gpa = Math.round(100 * qualityPoints / totalCredits) / 100;
  
  return {current: current, past: past, future: future, gpa: gpa, completed_credits: completed_credits};
}

// add a new field for a student with its requirements in JSON format
// accepts student_id, name, type, year, quarter, ud_credits, total_credits, and requirements as parameters
// returns an array with status code and string message
export async function addStudentField(student_id, name, type, year, quarter, ud_credits, total_credits, requirements) {
  try {
    let [rows] = await pool.query(
      `
      SELECT student_field_id
      FROM student_field
      WHERE student_id = ? AND name = ? AND type = ? AND year = ? AND quarter = ?
      `,
      [
        student_id,
        name,
        type.toLowerCase(),
        year,
        quarter.toLowerCase()
      ]
    );

    if (rows.length > 0) {
      return [1, "The uploaded field already exists."];
    }
    else {
      let all_courses = new Set();
      let course_details = new Map();

      for (let requirement of requirements) {
        for (let option of requirement) {
          for (let course of option.courses) {
            all_courses.add(course);
          }
        }
      }

      let [rows] = await pool.query(
        `
        SELECT course_id, name, credits
        FROM course
        WHERE course_id IN (?)
        `,
        [Array.from(all_courses)]
      );

      for (let course of rows) {
        course_details.set(course.course_id, course);
      }

      for (let groupIndex = 0; groupIndex < requirements.length; groupIndex++) {
        for (let optionIndex = 0; optionIndex < requirements[groupIndex].length; optionIndex++) {
          for (let courseIndex = 0; courseIndex < requirements[groupIndex][optionIndex].courses.length; courseIndex++) {
            let curr_course = requirements[groupIndex][optionIndex].courses[courseIndex];

            if (course_details.get(curr_course) != undefined) {
              requirements[groupIndex][optionIndex].courses[courseIndex] = {
                course_id: curr_course,
                name: course_details.get(curr_course).name,
                credits: course_details.get(curr_course).credits
              };
             }
             else {
              requirements[groupIndex][optionIndex].courses[courseIndex] = {
                course_id: curr_course,
                name: "Legacy or transfer course",
                credits: 0
              };
            }
          }
        }
      }

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
          quarter.toLowerCase(),
          ud_credits,
          total_credits,
          JSON.stringify(requirements),
        ]
      );

      let [similar_fields] = await pool.query(
        `
        SELECT student_field_id
        FROM student_field
        WHERE student_id = ? AND name = ? AND type = ?
        `,
        [
          student_id,
          name,
          type.toLowerCase()
        ]
      );

      return similar_fields.length > 1 ?
        [1, "The uploaded field was saved succesfully, but there are other saved fields with the same name and type. The graduation requirements for the same field may have been uploaded for a different admit term."] :
        [0, "The uploaded field was saved successfully."];
    }
  }
  catch (error) {
    console.log(error);
    return [-1, "The operation could not be completed. Please try again later."];
  }
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
  } catch (error) {
    console.log(error);
    return false;
  }
  return true;
}

// create a plan for a student
// accepts max_credits_per_quarter, mandatory_courses, completed_courses, and completed_credits as parameters
// returns a plan for the student in the type of an array of objects with properties year, quarter, credits, and classes
export async function createStudentPlan(max_credits_per_quarter, mandatory_courses, completed_courses, completed_credits) {
  try {
    // add general education courses to list of mandatory courses to take if not completed
    ['WRI 1000', 'WRI 1100', 'UCOR 2000', 'UCOR 3000', 'UFDN 1000', 'UFDN 2000', 'UFDN 3100'].forEach(course => {
      if (!completed_courses.includes(course)) {
        mandatory_courses.push(course)
      }
    });

    // declare variables
    let course_details = new Map();
    let curr_prerequisites = new Set(mandatory_courses);
    let incomplete_courses = new Set();
    let prerequisites_tuples = [];
    let current_year, current_quarter;
    [current_quarter, current_year] = quarter_increment(currentQuarter()[1], currentYear);
    let course_planned_quarter = new Map();
    let course_prerequisites = new Map();
    let final_plan = [{
      year: current_year,
      quarter: current_quarter,
      credits: 0,
      classes: []
    }];

    // new_course is an array of section objects from the course_available_sections array
    // existing_courses is an array of arrays of sections objects from the course_available_sections array
    let class_schedule = function(new_course, existsing_courses) {
      if (existsing_courses.length > 1) {
        let final_schedule = [];
        // viable_schedule is an array of arrays of section objects
        let viable_schedules = class_schedule(existsing_courses[0], existsing_courses[1]);

        if (viable_schedules == false) {
          return false;
        }
        else {
          for (let new_course_section of new_course) {
            for (let schedule of viable_schedules) {
              let classes = [];
              classes.push(new_course_section.classes);

              for (let scheduled_section of schedule) {
                classes.push(scheduled_section.classes);
              }

              if (!time_conflict(classes)) {
                let temp = schedule;
                temp.push(new_course_section);
                final_schedule.push(temp);
              }
            }
          }
        }
      }
      else {
        for (let new_course_section of new_course) {
          for (let existsing_course_section of existsing_courses[0]) {
            let classes = [];
            classes.push(new_course_section.classes);
            classes.push(existsing_course_section.classes);

            if (!time_conflict(classes)) {
              let temp = schedule;
              temp.push(new_course_section);
              final_schedule.push(temp);
            }
          }
        }
      }
      if (final_schedule.length == 0) {
        return false;
      }
      else {
        return final_schedule;
      }
    }

    // classes is an array of arrays -> each inner array contains class objects for one class
    let time_conflict = function(classes) {
      for (let i = 0; i < classes.length; i++) {
        for (let j = i + 1; j < classes.length; j++) {
          for (let class_i of classes[i]) {
            for (let class_j of classes[j]) {
              if (class_i.weekday != class_j.weekday || parse_time(class_i.start_time) > parse_time(class_j.end_time) || parse_time(class_i.end_time) < parse_time(class_j.start_time)) {
                continue;
              }
              else {
                // return true if there is a time conflict
                return true;
              }
            }
          }
        }
      }
      return false;
    }

    let parse_time = function(time) {
      let date_time = Date.now();
      let time_split = time.split(":");
      if (time_split[1].includes("PM")) {
        date_time.setHours(parseInt(time_split[0]) + 12);
        date_time.setMinutes(parseInt(time_split[1].slice(0, 2)));
      }
      else {
        date_time.setHours(parseInt(time_split[0]));
        date_time.setMinutes(parseInt(time_split[1].slice(0, 2)));
      }
      return date_time;
    }

    let course_available_sections = async function(course_id, year, quarter) {
      let course_available_sections;
      // get all available sections
      try {
        [course_available_sections] = await pool.query(
        `
        SELECT section_id, course_id, year, quarter, classes, location, instructor
        FROM section
        WHERE course_id = ? AND (year > ${currentYear} OR (year = ${currentYear} AND quarter > ${currentQuarter()[0]}))
        `,
        [course_id]
        );
      }
      catch (error) {
        console.log(error);
        return false;
      }

      if (course_available_sections.length == 0) {
        // return false if no sections are available
        return false;
      }
      else {
        return course_available_sections.filter(section => section.year == year && section.quarter == quarter);
      }
    }

    // get all course prerequisites of each mandatory incomplete course iteratively
    while (curr_prerequisites.size > 0) {
      // get course details
      let courses;
      try {
        [courses] = await pool.query(
          `
          SELECT course_id, name, credits, attributes, standing, prerequisites, corequisites
          FROM course
          WHERE course_id IN (?)
          `,
          [Array.from(curr_prerequisites)]
        );
      }
      catch (error) {
        console.log(error);
        return -1;
      }

      for (let incomplete_course of Array.from(curr_prerequisites)) {
        incomplete_courses.add(incomplete_course);
      }

      curr_prerequisites.clear();

      // iterate through each course to select the best prerequisite option
      for (let course of courses) {
        let prerequisite_options = [];
        let prerequisites_met = false;
        let min_credits_remaining =  Number.MAX_SAFE_INTEGER;
        let min_courses_remaining = Number.MAX_SAFE_INTEGER;
        let index_of_min = 0;

        course_details.set(course.course_id, course);

        if (course.corequisites == null) {
          course.corequisites = [];
        }

        for (let corequisite of course.corequisites) {
          curr_prerequisites.add(corequisite);
        }

        if (course.prerequisites == null) {
          course.prerequisites = [];
        }

        course.prerequisites = course.prerequisites.length == 0 ? [] : course.prerequisites[0];

        // iterate through each set of prerequisites for the course
        for (let i = 0; i < course.prerequisites.length; i++) {
          let credits_remaining = 0;
          let courses_remaining = 0;
          let prerequisite_tuples = [];
          let incomplete_prerequisites = [];

          for (let prerequisite_course of course.prerequisites[i]) {
            if (!completed_courses.includes(prerequisite_course.course_id)) {
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
        else {
          // select the best prerequisite option based on credits remaining and courses remaining
          for (let i = 0; i < prerequisite_options.length; i++) {
            if (prerequisite_options[i].credits_remaining < min_credits_remaining || (prerequisite_options[i].credits_remaining == min_credits_remaining && prerequisite_options[i].courses_remaining < min_courses_remaining)) {
              min_credits_remaining = prerequisite_options[i].credits_remaining;
              min_courses_remaining = prerequisite_options[i].courses_remaining;
              index_of_min = i;
            }
          }
    
          if (prerequisite_options.length > 0) {
            prerequisite_options[index_of_min].incomplete_prerequisites.forEach(prerequisite => {curr_prerequisites.add(prerequisite)});
            prerequisite_options[index_of_min].prerequisite_tuples.forEach(tuple => {prerequisites_tuples.push(tuple)});
          }
        }
      }
    }

    // map course id to array of selected prerequisites
    prerequisites_tuples.forEach(tuple => {
      if (course_prerequisites.has(tuple[1])) {
        course_prerequisites.set(tuple[1], course_prerequisites.get(tuple[1]).push(tuple[0]));
      }
      else {
        course_prerequisites.set(tuple[1], [tuple[0]]);
      }
    });

    // sort courses topologically by prerequisites
    let sorted_courses = toposort.array(Array.from(incomplete_courses), prerequisites_tuples);

    // keep track of completed credits for each future quarter based on generated plan
    let future_completed_credits = [];
    future_completed_credits.push(completed_credits);

    for (let course of sorted_courses) {
      if (course_planned_quarter.has(course)) {
        continue;
      }

      let curr_course = course_details.get(course);
      [current_quarter, current_year] = quarter_increment(currentQuarter()[1], currentYear);
      let earliest_quarter = 0;

      if (course_prerequisites.get(course) == undefined) {
        course_prerequisites.set(course, []);
      }

      // set the earliest quarter a course can be taken based on when its prerequisites are scheduled
      for (let prerequisite of Array.from(course_prerequisites.get(course))) {
        if (course_planned_quarter.get(prerequisite) >= earliest_quarter) {
          for (let prerequisiteObj of curr_course.prerequisites.flat()) {
            if (prerequisiteObj.course_id == prerequisite) {
              earliest_quarter = prerequisiteObj.concurrent_available ? course_planned_quarter.get(prerequisite) : course_planned_quarter.get(prerequisite) + 1;
              break;
            }
          }
        }
      }

      // schedule the course in the earliest quarter it can be taken based on section availability
      for (let index = earliest_quarter; index < 24; index++) {
        // add a new quarter to the plan if the current quarter has not been created yet
        if (final_plan.length == index) {
          [current_quarter, current_year] = quarter_increment(final_plan[index - 1].quarter, final_plan[index - 1].year);
          final_plan.push({
            year: current_year,
            quarter: current_quarter,
            credits: 0,
            classes: []
          });
          future_completed_credits.push(future_completed_credits[index - 1]);
        }

        let standing_met = course_details.get(course).standing.includes(currStanding(future_completed_credits[index]));
        let all_course_credits = curr_course.credits;
        for (let corequisite of curr_course.corequisites) {
          let corequisite_credits = course_details.get(corequisite).credits;
          if (corequisite_credits == null) {
            corequisite_credits = 0;
          }
          all_course_credits += corequisite_credits;
        }
        let max_credits_met = all_course_credits + final_plan[index].credits <= max_credits_per_quarter;
        let available_sections = await course_available_sections(course, final_plan[index].year, final_plan[index].quarter);

        if (standing_met && max_credits_met && (available_sections === false || available_sections.length > 0)) {
          let course_and_corequisites = [course];
          for (let corequisite of curr_course.corequisites) {
            course_and_corequisites.push(corequisite);
          }

          if (available_sections === false) {
            for (let course_code of course_and_corequisites) {
              final_plan[index].classes.push(course_details.get(course_code));
              final_plan[index].credits += course_details.get(course_code).credits == null ? 0 : parseInt(course_details.get(course_code).credits);
              course_planned_quarter.set(course_code, index);
              for (let i = index + 1; i < future_completed_credits.length - index - 1; i++) {
                future_completed_credits[i] += course_details.get(course_code).credits;
              }
            }
            break;
          }
          else {
            let curr_courses_sections = [[available_sections]];
            for (let corequisite of curr_course.corequisites) {
              curr_courses_sections.push(await course_available_sections(corequisite, final_plan[index].year, final_plan[index].quarter));
            }
            for (let existing_courses of final_plan[index].classes) {
              curr_courses_sections.push(await course_available_sections(existing_courses.course_id, final_plan[index].year, final_plan[index].quarter));
            }

            let final_schedule = class_schedule(curr_courses_sections[0], curr_courses_sections.slice(1));

            if (final_schedule != false) {
              for (let course_code of course_and_corequisites) {
                final_plan[index].classes.push(course_details.get(course_code));
                final_plan[index].credits += course_details.get(course_code).credits == null ? 0 : parseInt(course_details.get(course_code).credits);
                course_planned_quarter.set(course_code, index);
                for (let i = index + 1; i < future_completed_credits.length - index - 1; i++) {
                  future_completed_credits[i] += course_details.get(course_code).credits;
                }
              }
              for (let section of final_schedule) {
                for (let scheduled_course of final_plan[index].classes) {
                  if (scheduled_course.course_id == section.course_id) {
                    scheduled_course.section = section.section_id;
                    scheduled_course.location = section.location;
                    scheduled_course.instructor = section.instructor;
                    scheduled_course.classes = section.classes;
                  }
                }
              }
              break;
            }
          }
        }
      }
    }
    return final_plan;
  }
  catch (error) {
    console.log(error);
    return -1;
  }
}

// get a student's plan
// accepts student_id as parameter
// returns an array of objects with properties plan_id, plan_name, selected_fields, max_credits, plan, and date_created
// returns -1 if there was an error retrieving the student's plans
export  async function getStudentPlan(student_id) {
  try {
    let [plans] = await pool.query(
      `
      SELECT plan_id, plan_name, selected_fields, max_credits, plan, date_created
      FROM student_plan
      WHERE student_id = ?
      `,
      [student_id]
    );
  }
  catch (error) {
    console.log(error);
    return -1;
  }

  return plans;
}

// save a student's plan
// accepts student_id, plan_name, selected_fields, max_credits, and plan parameters
// returns 0 if the plan was saved successfully, otherwise returns -1
export async function saveStudentPlan (student_id, plan_name, selected_fields, max_credits, plan) {
  try {
    await pool.query(
      `
      INSERT INTO plan (student_id, plan_name, selected_fields, max_credits, plan)
      VALUES (?, ?, ?, ?, ?)
      `,
      [student_id, plan_name, selected_fields, max_credits, plan]
    );
  }
  catch (error) {
    console.log(error);
    return -1;
  }
  return 0;
}

let max_credits_per_quarter = 15;
let mandatory_courses = ['WRI 1000', 'WRI 1100', 'UCOR 2000', 'UCOR 3000', 'UFDN 1000', 'UFDN 2000', 'UFDN 3100'];
let completed_courses = [];
let completed_credits = 0;
let result = await createStudentPlan(max_credits_per_quarter, mandatory_courses, completed_courses, completed_credits);
console.log(result);