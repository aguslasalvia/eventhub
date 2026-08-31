import { Router } from "express";

import authMiddleware from "@middlewares/auth.middleware";


const router = Router();

router
  .post("/") // Create user
  .get("/:id", authMiddleware) // get user by ID
  .get("/:email", authMiddleware) // get user by email


export default router;
