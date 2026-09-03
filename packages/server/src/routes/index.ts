import { Router } from "express";
import EventRoutes from "@routes/event.routes"
import TicketRoutes from "@routes/ticket.routes"
import TicketTypeRoutes from "@routes/ticket-type.routes"
import UserRoutes from "@routes/users.routes"
import PaymentRoutes from "@routes/payment.routes"

const router = Router();

router
  .use("/events", EventRoutes)
  .use("/tickets", TicketRoutes)
  .use("/ticket-types", TicketTypeRoutes)
  .use("/users", UserRoutes)
  .use("/payment", PaymentRoutes)

export default router;
