import { createStudentPlan, saveStudentPlan, getStudentPlan } from "../../database.js";

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

export async function savePlan(req, res) {
  console.log(req.body);

  const {planName,planJson,studentID, max, selectedFields} = req.body.params;

  const plan = await saveStudentPlan(studentID, planName, selectedFields, max, planJson);
  res.send(1);
  return;
}

export async function getPlan(req, res) {
  const studentID = req.params.id;
  try {
    const plan = await getStudentPlan(studentID);
    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }
    res.json(plan);
  } catch (error) {
    console.error("Error fetching plan:", error);
    res.status(500).json({ message: "Server error" });
  }
}
