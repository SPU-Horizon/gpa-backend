import { createStudentPlan, saveStudentPlan } from "../../database.js";



export async function createPlan(req, res) {

    console.log(req.body)

  const plan = await createStudentPlan(req.body);
  res.send(plan);
  return;
}


export async function savePlan(req, res) {
    console.log(req.body)

    //const plan = await saveStudentPlan(req.body);
    res.send(1);
    return;
}