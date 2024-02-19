import express from "express";
import { registerUser } from "../controllers/user.controller.js";

export const userRouter = express.Router();

userRouter.post("/register", registerUser);

export default userRouter;
