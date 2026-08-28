import { Router } from "express";
import eventRoutes from "@routes/event.routes"
import TicketRotues from "@routes/ticket.routes"


const router = Router();

router
  .use("/events", eventRoutes)
  .use("/tickets", TicketRotues)

export default router;
