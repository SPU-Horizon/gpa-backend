import express from "express";
import {
  registerUserFunction,
  uploadProfilePhoto,
} from "../controllers/user.controller.js";

export const userRouter = express.Router();

userRouter.post("/register", registerUserFunction);
userRouter.post("/upload-profile-photo", uploadProfilePhoto);

export default userRouter;
