import {
  createStudentPlan,
  saveStudentPlan,
  getCourseAggregation,
} from "../../database.js";

import { openAIClient } from "../../index.js";

export async function createPlan(req, res) {
  // console.log("What is this?????", req.body);

  const { maxCredits, completedCredits, completedCourses, finalCourses } =
    req.body;

  const newCompletedCourses = new Set(completedCourses);
  const mandatoryCourses = new Set(finalCourses);

  const plan = await createStudentPlan(
    maxCredits,
    mandatoryCourses,
    newCompletedCourses,
    completedCredits
  );
  res.send(plan);
  return;
}

export async function createAIPlan(req, res) {
  const courses = await getCourseAggregation(req.classes);

  const courseString = stringBuilder(courses);
  console.log(courseString);
  /*
  const schedule = await openAIClient.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    temperature: 0.01,
    messages: [
      {
        role: "user",
        content: `

        Schedule these classes for me by quarter and time in an array and return the schedule in JSON format.
        
        Each Class should be an object with the following properties:
        - Name: String
        - Course Code: String
        - Time: String
        - Credits: String
        - Days of the Week: String [ex: (M-W-F or Tu-Th), not an array)]
                 
        The output should be as follows:
        schedule: [
          { Quarter: 'Fall', Classes: [Array] },
          { Quarter: 'Winter', Classes: [Array] },
          { Quarter: 'Spring', Classes: [Array] }
        ]
        
        The maximum credits I want scheduled in a quarter is ${req.maxCredits}.
        The minimum credits I want scheduled in a quarter is 12.
        `,
      },
      {
        role: "user",
        content: `
        If a course is included in the prereq array for another course, it should not be taken in the same quarter.
        If a course is a requirement for another course, it should not be taken in the same quarter. 
        If a course is a requirement for another course, it should not be taken in the same quarter.
        Here are the courses to schedule: ${courseString}
        `,
      },
    ],
  });
  */

  console.log(schedule);
  console.log(schedule.choices[0].message.content);
}

const stringBuilder = (courses) => {
  let str = "";

  for (const course of courses) {
    console.log(course);
    let reqBuilder = [];
    if (course.prerequisites) {
      accessNestedArrays(course.prerequisites, reqBuilder);
    }

    str += `${course.course_id}: ${course.name} - ${course.credits} Credits - prereqs: [${reqBuilder}] - coreqs: ${course.corequisites}\n`;
  }

  return str;
};

function accessNestedArrays(arr, reqBuilder) {
  if (Array.isArray(arr)) {
    for (let i = 0; i < arr.length; i++) {
      accessNestedArrays(arr[i], reqBuilder);
    }
  } else {
    reqBuilder.push(arr.course_id);
  }
}

const test = {
  classes: [
    "CSC 1230",
    "CSC 2431",
    "CSC 2430",
    "CSC 3011",
    "CSC 3150",
    "CSC 3220",
    "CSC 3310",
    "CSC 3430",
    "CSC 3750",
    "CSC 4410",
    "MAT 1720",
  ],
  maxCredits: 15,
};

createAIPlan(test);

export async function savePlan(req, res) {
  console.log(req.body);

  //const plan = await saveStudentPlan(req.body);
  res.send(1);
  return;
}

export async function getPlan(req, res) {
  const planId = req.params.id;
  try {
    const plan = await someDatabaseFunctionToGetPlanById(planId);
    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }
    res.json(plan);
  } catch (error) {
    console.error("Error fetching plan:", error);
    res.status(500).json({ message: "Server error" });
  }
}
