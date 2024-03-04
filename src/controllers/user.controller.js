import { addStudent, getUser } from "../../database.js";

export async function registerUser(req, res) {
  const studentId = await addStudent(req.body);

  if (studentId === -1) {
    res
      .status(500)
      .json({ message: "An error occurred while adding the student." });
  } else {
    res.status(201).json({ studentId });
  }
}

export async function getInfo(req, res) {
  const studentInfo = await getUser(req.query.email);
  res.send(studentInfo);
  return;
}