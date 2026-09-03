import type { Request, Response } from "express";
import SETTING from "src/config/system";
import { TicketStatus } from "@eventhub/shared";
import TicketService from "@services/ticket.services";
import TicketTypeService from "@services/ticketType.services";

export default class PaymentController {
  static async paypalCreateOrder(req: Request, res: Response): Promise<Response> {
    const { ticketId, origin } = req.body;

    if (!ticketId || isNaN(Number(ticketId)))
      return res.status(400).json({ error: "ticketId must be numeric" });
    if (!origin)
      return res.status(400).json({ error: "origin is required" });

    try {
      const ticket = await TicketService.findById(Number(ticketId));
      if (!ticket)
        return res.status(404).json({ error: "Ticket not found" });
      if (ticket.UserId !== req.user?.id)
        return res.status(403).json({ error: "This ticket doesn't belong to you" });

      if (ticket.Status !== TicketStatus.Reserved)
        return res.status(400).json({ error: "Ticket is not in a reserved state" });
      if (ticket.isExpired())
        return res.status(400).json({ error: "The reservation has expired" });

      const ticketType = await TicketTypeService.findById(ticket.TicketTypeId);
      if (!ticketType)
        return res.status(404).json({ error: "Ticket type not found" });

      const orderPayload = {
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: String(ticket.Id),
            custom_id: String(ticket.Id),
            amount: {
              currency_code: "USD",
              value: ticketType.Price.toFixed(2),
            },
          },
        ],
        payment_source: {
          paypal: {
            experience_context: {
              payment_method_preference: "IMMEDIATE_PAYMENT_REQUIRED",
              brand_name: "EventHub",
              locale: "es-UY",
              landing_page: "LOGIN",
              shipping_preference: "NO_SHIPPING",
              user_action: "PAY_NOW",
              return_url: `${origin}/paypal/success`,
              cancel_url: `${origin}/paypal/cancel`,
            },
          },
        },
      };

      const token = await PaymentController.getPaypalToken();
      const response = await fetch(
        `${SETTING.PAYPAL_BASE_URL}/v2/checkout/orders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(orderPayload),
        }
      );

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`PayPal order creation failed (${response.status}): ${errorBody}`);
      }

      const data = await response.json();
      return res.status(201).json(data);
    } catch (err) {
      return res.status(400).json({ error: (err as Error).message });
    }
  }

  static async paypalCaptureOrder(req: Request, res: Response): Promise<Response> {
    const { orderId } = req.params;
    const { ticketId } = req.body;

    if (!orderId)
      return res.status(400).json({ error: "orderId is required" });
    if (!ticketId || isNaN(Number(ticketId)))
      return res.status(400).json({ error: "ticketId must be numeric" });

    try {
      const ticket = await TicketService.findById(Number(ticketId));
      if (!ticket)
        return res.status(404).json({ error: "Ticket not found" });
      if (ticket.UserId !== req.user?.id)
        return res.status(403).json({ error: "This ticket doesn't belong to you" });

      const token = await PaymentController.getPaypalToken();
      const response = await fetch(
        `${SETTING.PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`PayPal order capture failed (${response.status}): ${errorBody}`);
      }

      const data = await response.json() as any;

      if (data.status !== "COMPLETED")
        return res.status(400).json({ error: `Payment not completed (status: ${data.status})` });

      const confirmedTicket = await TicketService.confirm(Number(ticketId));

      return res.status(200).json({ ticket: confirmedTicket, capture: data });
    } catch (err) {
      return res.status(400).json({ error: (err as Error).message });
    }
  }

  private static async getPaypalToken(): Promise<string> {
    try {
      const auth = Buffer.from(
        `${SETTING.PAYPAL_CLIENT_ID}:${SETTING.PAYPAL_SECRET}`
      ).toString("base64");

      const response = await fetch(
        `${SETTING.PAYPAL_BASE_URL}/v1/oauth2/token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": `Basic ${auth}`,
          },
          body: "grant_type=client_credentials",
        }
      );

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`PayPal auth failed (${response.status}): ${errorBody}`);
      }

      const data = await response.json() as any;
      return data.access_token;
    } catch (err) {
      throw new Error(err as any);
    }
  }
}
