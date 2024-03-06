import express from "express";

import { registerUserFunction, getInfo, uploadProfilePhoto } from "../controllers/user.controller.js";

export const userRouter = express.Router();

userRouter.post("/register", registerUserFunction);

userRouter.get("/getUserInfo", getInfo);

userRouter.post("/upload-profile-photo", uploadProfilePhoto);

export default userRouter;
