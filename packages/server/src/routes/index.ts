import { Router } from "express";
import EventRoutes from "@routes/event.routes"
import TicketRoutes from "@routes/ticket.routes"
import UserRoutes from "@routes/users.routes"


const router = Router();

router
  .use("/events", EventRoutes)
  .use("/tickets", TicketRoutes)
  .use("/users", UserRoutes)

export default router;
