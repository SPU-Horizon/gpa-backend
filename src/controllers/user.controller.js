import { registerUser, getUser } from "../../database.js";


export async function registerUserFunction(req, res) {
  const studentId = await registerUser(req.body);

  if (studentId === -1) {
    res
      .status(500)
      .json({ message: "An error occurred while adding the student." });
  } else {
    res.status(201).json({ studentId });
  }
}

export async function uploadProfilePhoto(req, res) {
  const file = req.file;
  console.log("Received file:", file);

  // Handle the file as needed
  console.log("Received file:", file);

  try {
    await fs.unlink(file.path);
    console.log("File removed successfully.");
  } catch (error) {
    console.error("Error removing file:", error);
  }

  res.status(200).json({ message: "Profile photo uploaded successfully." });
}



export async function getInfo(req, res) {
  const studentInfo = await getUser(req.query.email);
  res.send(studentInfo);
  return;
}




