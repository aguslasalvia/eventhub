import { Router } from "express";

import authMiddleware from "@middlewares/auth.middleware";
import UserController from "@controllers/user.controller";


const router = Router();

router
  .post("/", UserController.create) // Create user
  .post("/login", UserController.authenticate)
  .get("/:id", authMiddleware, UserController.findById) // get user by ID


export default router;
