import TicketController from "@controllers/ticket.controller";
import { Router } from "express";

const router = Router();

router
  .get("/:id", TicketController.findById)
  .get("/user/:userId", TicketController.findByUser)
  .get("/ticket-type/:ticketTypeId", TicketController.findByTicketType)
  .post("/", TicketController.reserve)
  .post("/:id/confirm", TicketController.confirm)
// .post("/:id/cancel",TicketController.cancel)


export default router;
