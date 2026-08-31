import TicketController from "@controllers/ticket.controller";
import { Router } from "express";
import authMiddleware from "@middlewares/auth.middleware";

const router = Router();

router
  .get("/:id", authMiddleware, TicketController.findById)
  .get("/user/:userId", authMiddleware, TicketController.findByUser)
  .get("/ticket-type/:ticketTypeId", authMiddleware, TicketController.findByTicketType)
  .post("/", authMiddleware, TicketController.reserve)
  .post("/:id/confirm", authMiddleware, TicketController.confirm)
// .post("/:id/cancel",TicketController.cancel)


export default router;
