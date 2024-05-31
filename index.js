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
import { OpenAI } from "openai";

dotenv.config();

export const openAIClient = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"],
});

/*
const schedule = await openAIClient.chat.completions.create({
  model: "gpt-3.5-turbo",
  response_format: { type: "json_object" },
  temperature: 0.1,
  messages: [
    {
      role: "user",
      content: `

      Schedule these classes for me by quarter and time in an array and return the schedule in JSON format.

      It should look like this:

      schedule: [
        { Quarter: 'Fall', Classes: [Array] },
        { Quarter: 'Winter', Classes: [Array] },
        { Quarter: 'Spring', Classes: [Array] },
        { Quarter: 'Summer', Classes: [Array] }
      ]

      Each Class should be an object with the following properties:
      - Name: String
      - Course Code: String
      - Time: String
      - Credits: String
      - Days of the Week: String [ex: (M-W-F or Tu-Th), not an array)]

      Take into account the prerequisites for each class and the maximum credits per quarter.
      If a course is a requirement for another course, it should not be taken in the same quarter.

      Classes:
      CSC 1230 - 5 Credits - Requirements: []
      CSC 2431 - 5 Credits - Requirements: [CSC 2430]
      CSC 2430 - 5 Credits - Requirements: [CSC 1230]
      CSC 3011 - 3 Credits - Requirements: []
      CSC 3150 - 5 Credits - Requirements: [CSC 2431]
      CSC 3220 - 4 Credits - Requirements: [CSC1230, CSC 2430]
      CSC 3310 - 4 Credits - Requirements: [CSC 2431, CSC 3150]
      CSC 3430 - 4 Credits - Requirements: [CSC 3150, CSC 2431, CSC 3310]
      CSC 3750 - 5 Credits - Requirements: [CSC 2431, CSC 3150, CSC 3310]
      CSC 4410 - 5 Credits - Requirements: [CSC 2431, CSC 3150]
      MAT 1720 - 5 Credits - Requirements: []

      Max Credits Per Quarter: 15
      ,
      `,
    },
  ],
});

console.log(schedule);
const data = JSON.parse(schedule.choices[0].message.content);
console.log(data.schedule.map((quarter) => quarter.Classes));
*/
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
