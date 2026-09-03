import { Router } from "express";

import authMiddleware from "@middlewares/auth.middleware";
import UserController from "@controllers/user.controller";


const router = Router();

router
  .post("/", UserController.create) // Create user
  .post("/login", UserController.authenticate)
  .post("/refresh-token", UserController.refresh)
  .post("/logout", UserController.logout)
  .get("/:id", authMiddleware, UserController.findById) // get user by ID


export default router;
