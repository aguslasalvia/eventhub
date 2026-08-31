import { Router } from "express";

import authMiddleware from "@middlewares/auth.middleware";
import UserController from "@controllers/user.controller";


const router = Router();

router
  .post("/", UserController.create) // Create user
  .post("/login", UserController.authenticate)
  .get("/:id", authMiddleware, (req, res) => { res.send({ message: "hello" }) }) // get user by ID
  .get("/:email", authMiddleware, (req, res) => { res.send({ message: "hello" }) }) // get user by email


export default router;
