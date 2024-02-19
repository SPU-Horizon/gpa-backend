import { getEnrollments } from "../../database.js";
import courseParse from "../GPA HTML Parsing/course_parser.js";
import fs from "fs/promises";

//This will get all classes a student has taken, what year/quarter it was taken, and what grade was recieved
//It requires the student's email to be passed in the body of the request
export async function getClasses(req, res) {
  const enrollments = await getEnrollments(req.query.email);
  res.send(enrollments);
  return;
}

// This will parse the courses from the html file and return
export async function parseCourses(req, res) {
  // Access the file through req.file
  const file = req.file;

  // Handle the file as needed
  // console.log("Received file:", file);

  const parsedCourses = courseParse(file.path);
  // console.log(parsedCourses);

  // Remove the file from the server after parsing
  try {
    await fs.unlink(file.path);
  } catch (error) {
    console.error("Error removing file:", error);
  }

  // Respond to the client
  res.send("File received successfully");
}
