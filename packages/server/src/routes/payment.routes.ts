import { Router } from "express";
import PaymentController from "@controllers/payment.controller";
import authMiddleware from "@middlewares/auth.middleware";

const router = Router();

router
  .post("/paypal/create-order", authMiddleware, PaymentController.paypalCreateOrder)
  .post("/paypal/capture-order/:orderId", authMiddleware, PaymentController.paypalCaptureOrder)

export default router;
