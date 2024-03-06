import { getEnrollments, addEnrollments } from "../../database.js";
import courseParse from "../GPA HTML Parsing/course_parser.js";
import reqsParse from "../GPA HTML Parsing/reqs_parser.js";
import fs from "fs/promises";

//This will get all classes a student has taken, what year/quarter it was taken, and what grade was recieved
//It requires the student's email to be passed in the body of the request
export async function getClasses(req, res) {
  const enrollments = await getEnrollments(req.query.email);
  res.send(enrollments);
  return;
}

// This will parse the courses from the html file and return
export async function parseAndUpload(req, res) {
  // Access the file through req.file
  const file = req.file;

  let parsedCourses = courseParse(file.path);
  let parsedRequirements = reqsParse(file.path);

  // Currently, we need to pass in a student_id, graduation_year, and graduation_quarter that are not being parsed correctly
  parsedCourses.student_id = req.body.student_id;

  try {
    await fs.unlink(file.path);
    console.log("File removed successfully.");
  } catch (error) {
    console.error("Error removing file:", error);
  }

  try {
    await addEnrollments(parsedCourses);
  } catch (error) {
    let response = {};
    response.msg = "Error adding enrollments";
    res.status(500);
  }

  // Respond to the client
  const response = {};
  let majorRequirements = parsedRequirements.requirements;
  response.msg = "Courses parsed successfully";
  response.data = { parsedCourses, majorRequirements };
  res.status(200).send(response);
}
