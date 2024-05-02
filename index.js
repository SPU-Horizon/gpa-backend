/*
 *     Title: The Graduation Planning App (GPA)
 *     Purpose: GPA is designed to assist students in planning and tracking their
 *              academic progress towards graduation. It aims to simplify course
 *              selection, monitor academic milestones, and provide personalized
 *              recommendations for a smooth academic journey.
 *      Author: Team Horizon
 */

import express from "express";
import cors from "cors";
import { userRouter } from "./src/routes/user.routes.js";
import courseRoute from "./src/routes/course.routes.js";
import planRoute from "./src/routes/plan.routes.js";
import dotenv from "dotenv";
dotenv.config();

const app = express();

app.use(express.json());

// Enable CORS for all routes
app.use(cors());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", true);
  next();
});

app.use("/user", userRouter);
app.use("/course", courseRoute);
app.use("/plan", planRoute);

// Start the server
const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`The server is running on port ${PORT}.`));
