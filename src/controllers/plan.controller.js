import { createStudentPlan, saveStudentPlan } from "../../database.js";

export async function createPlan(req, res) {

  const { max_credits, final_courses, completed_courses, completed_credits } = req.body.params;

  const plan = await createStudentPlan(
    max_credits,
    final_courses,
    completed_courses,
    completed_credits
  );
  res.send(plan);
  return;
}

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
