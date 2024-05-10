import { createStudentPlan, saveStudentPlan } from "../../database.js";

// export async function createPlan(req, res) {
//   // console.log("What is this?????", req.body);

//   const { maxCredits, completedCredits, completedCourses, finalCourses } =
//     req.body;

//   const newCompletedCourses = new Set(completedCourses);
//   const mandatoryCourses = new Set(finalCourses);

//   const plan = await createStudentPlan(
//     maxCredits,
//     mandatoryCourses,
//     newCompletedCourses,
//     completedCredits
//   );
//   res.send(plan);
//   return;
// }

export async function createPlan(req, res) {
  // Extracting values correctly from the nested structure
  const {
    maxCredits,
    completedCredits,
    completedCourses,
    options_selected,
  } = req.body.params;

  console.log('Request body:', req.body);

  // Convert arrays from the request into Set for better handling in the createStudentPlan function
  const newCompletedCourses = new Set(completedCourses);
  const mandatoryCourses = new Set(options_selected);

  try {
    // Generate the student plan
    const plan = await createStudentPlan(
      maxCredits,
      mandatoryCourses,
      newCompletedCourses,
      completedCredits
    );
    
    // Check if the plan was successfully created
    if (plan) {
      // Send successful response back to client
      res.status(200).send({
        status: "success",
        message: "Plan created successfully",
        data: plan
      });
    } else {
      // Handle scenario when plan is not created (e.g., returns null or false)
      res.status(500).send({
        status: "error",
        message: "Failed to create plan"
      });
    }
  } catch (error) {
    console.error("Error creating plan:", error);
    // Send error response back to client
    res.status(500).send({
      status: "error",
      message: "Internal server error while creating plan"
    });
  }
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

