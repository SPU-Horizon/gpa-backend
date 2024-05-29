import {
  getEnrollments,
  addEnrollments,
  addStudentField,
  deleteStudentField,
  getMissingFields
} from "../../database.js";
import courseParse from "../GPA HTML Parsing/course_parser.js";
import reqsParse from "../GPA HTML Parsing/reqs_parser.js";
import fs from "fs/promises";

//This will get all classes a student has taken, what year/quarter it was taken, and what grade was recieved
//It requires the student's email to be passed in the body of the request
export async function getClasses(req, res) {
  const enrollments = await getEnrollments(req.query.id);
  res.send(enrollments);
  return;
}

export async function dropField(req, res) {
  const { student_field_id } = req.body;

  try {
    const data = await deleteStudentField(student_field_id);

    if (data) {
      let data = { display_message: "Field deleted successfully." };
      return res.status(200).send(data);
    } else {
      let data = { display_message: "Field deletion failed - try again." };
      return res.status(500).send(data);
    }
  } catch (error) {
    return res.status(500).send({
      error: "There was an issue deleting the field from the database.",
    });
  }
}

// This will parse the courses from the html file and return
export async function parseBanner(req, res) {
  // Access the file through req.file
  const file = req.file;
  const option = req.query.option;

  let parsedCourses = courseParse(file.path);
  let failedEnrollments = [];
  let missingFields = [];

  // Currently, we need to pass in a student_id, graduation_year, and graduation_quarter that are not being parsed correctly
  parsedCourses.student_id = req.body.student_id;

  // Upload the parsed courses to the database, first destructuring the parsedCourses object
  const {
    student_id,
    enrollment_year,
    enrollment_quarter,
    graduation_year,
    graduation_quarter,
    counselor,
    enrollments,
    field
  } = parsedCourses;

  // Call getMissingFields
  missingFields = await getMissingFields(student_id, field);

  try {
    // once destructured, we can pass the values into the addEnrollments function
    failedEnrollments = await addEnrollments(
      student_id,
      enrollment_year,
      enrollment_quarter,
      graduation_year,
      graduation_quarter,
      counselor,
      enrollments
    );
  } catch (error) {
    return res.status(500).send({
      error: "There was an issue uploading your data to the database.",
    });
  }

  const response = {};


  if(option == "field") { //If this option is selected then we add the students field and requirements along with the courses

    let parsedRequirements = reqsParse(file.path);
    parsedRequirements.student_id = req.body.student_id;

    const { field_name, field_type, year, UD_credits, credits, requirements } =
    parsedRequirements;

    try {
      // once destructured, we can pass the values into the addEnrollments function
      let duplicateFields = await addStudentField(
        student_id,
        field_name,
        field_type,
        2022,
        enrollment_quarter,
        UD_credits,
        credits,
        requirements
      );

      if (duplicateFields[0] < 0) {
        return res.status(500).send({
          error: "There was an error uploading your data to the database.",
        });
      }


      
    let majorRequirements = parsedRequirements.requirements;
    response.msg = "Parsed successfully";
    response.data = { parsedCourses, majorRequirements, failedEnrollments, missingFields, duplicateFields };

    } catch (error) {
      return res.status(500).send({
        error: "There was an issue uploading your data to the database.",
      });
    }

   } else { //option is "courses"
    response.msg = "Parsed successfully";
    response.data = { parsedCourses, failedEnrollments };
   }



  try {
    await fs.unlink(file.path);
    console.log("File removed successfully.");
  } catch (error) {
    console.error("Error removing file:", error);
  }

  res.status(200).send(response);
}