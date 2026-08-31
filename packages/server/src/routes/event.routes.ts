import EventController from "@controllers/event.controller";
import authMiddleware from "@middlewares/auth.middleware";

import { Router } from "express";

const router = Router();

router
  .post("/", authMiddleware, EventController.create)
  .get("/", authMiddleware, EventController.findAll)
  .get("/organizer/:organizerId", authMiddleware, EventController.findByOrganizer)
  .put("/:id", authMiddleware, EventController.update)
  .post("/:id/publish", authMiddleware, EventController.publish)
  .post("/:id/cancel", authMiddleware, EventController.cancel)
  .delete("/:id", authMiddleware, EventController.delete)


export default router;