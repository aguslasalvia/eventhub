import { Router } from "express";

import authMiddleware from "@middlewares/auth.middleware";


const router = Router();

router
  .post("/",()=>{}) // Create user
  .get("/:id", authMiddleware, (req, res) => { res.send({ message: "hello" }) }) // get user by ID
  .get("/:email", authMiddleware, (req, res) => { res.send({ message: "hello" }) }) // get user by email


export default router;
