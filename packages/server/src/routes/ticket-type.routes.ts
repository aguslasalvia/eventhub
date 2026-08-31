import { Router } from "express";
import TicketTypeController from "@controllers/ticketType.controller";
import authMiddleware from "@middlewares/auth.middleware";

const router = Router();

router
  .post("/", authMiddleware, TicketTypeController.create)
  .get("/event/:eventId", authMiddleware, TicketTypeController.findByEvent)
  .get("/:id", authMiddleware, TicketTypeController.findById)

export default router;
