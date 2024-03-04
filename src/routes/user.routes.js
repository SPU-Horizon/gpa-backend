import express from "express";
import { registerUser, getInfo } from "../controllers/user.controller.js";

export const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.get("/getUserInfo", getInfo);

export default userRouter;
