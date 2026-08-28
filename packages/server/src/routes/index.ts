import { Router } from "express";
import eventRoutes from "@routes/event.routes"


const router = Router();

router
  .use("/events", eventRoutes)

export default router;
