import EventController from "controllers/event.controller";
import { Router } from "express";
const router = Router();

router
  .post("/", EventController.create)
  .get("/", EventController.findAll)
  .post("/:id/publish", EventController.publish)
  .post("/:id/cancel", EventController.cancel)
  .delete("/:id", EventController.delete)


export default router;