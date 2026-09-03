import type { Request, Response } from "express";
import SETTING from "src/config/system";
import { TicketStatus } from "@eventhub/shared";
import Ticket from "@core/entities/ticket";
import TicketType from "@core/entities/ticketType";
import TicketService, { MAX_RESERVE_QUANTITY } from "@services/ticket.services";
import TicketTypeService from "@services/ticketType.services";
import EventService from "@services/event.services";
import PaymentService from "@services/payment.services";

function parseTicketIds(raw: unknown): number[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_RESERVE_QUANTITY) return null;
  if (raw.some((id) => isNaN(Number(id)))) return null;
  return [...new Set(raw.map(Number))];
}

export default class PaymentController {
  /**
   * The PayPal client id is meant to be public (it's embedded in the
   * page's own script tag by design), so this needs no auth — it just
   * saves the client from having to duplicate an env var across builds.
   */
  static clientId(_req: Request, res: Response): Response {
    if (!SETTING.PAYPAL_CLIENT_ID)
      return res.status(503).json({ error: "PayPal is not configured" });
    return res.status(200).json({ clientId: SETTING.PAYPAL_CLIENT_ID });
  }

  static async paypalCreateOrder(req: Request, res: Response): Promise<Response> {
    const ids = parseTicketIds(req.body.ticketIds);

    if (!ids)
      return res.status(400).json({ error: `ticketIds must be a non-empty array of up to ${MAX_RESERVE_QUANTITY} numeric ids` });

    try {
      const tickets: Ticket[] = [];
      const ticketTypes = new Map<number, TicketType>();
      let total = 0;

      for (const id of ids) {
        const ticket = await TicketService.findById(id);
        if (!ticket)
          return res.status(404).json({ error: `Ticket ${id} not found` });
        if (ticket.UserId !== req.user?.id)
          return res.status(403).json({ error: "One of these tickets doesn't belong to you" });
        if (ticket.Status !== TicketStatus.Reserved)
          return res.status(400).json({ error: `Ticket ${id} is not in a reserved state` });
        if (ticket.isExpired())
          return res.status(400).json({ error: `The reservation for ticket ${id} has expired` });

        let ticketType = ticketTypes.get(ticket.TicketTypeId);
        if (!ticketType) {
          const found = await TicketTypeService.findById(ticket.TicketTypeId);
          if (!found)
            return res.status(404).json({ error: "Ticket type not found" });
          ticketType = found;
          ticketTypes.set(ticket.TicketTypeId, ticketType);
        }

        tickets.push(ticket);
        total += ticketType.Price;
      }

      const [firstTicketType] = ticketTypes.values();
      const event = firstTicketType ? await EventService.findById(firstTicketType.EventId) : null;
      const description = (
        ids.length === 1
          ? `1 ticket - ${event?.Title ?? "EventHub"}`
          : `${ids.length} tickets - ${event?.Title ?? "EventHub"}`
      ).slice(0, 127);

      // No payment_source/experience_context here on purpose: this order is
      // approved through the JS SDK's own Smart Payment Buttons (rendered
      // in-page, no redirect), which presents the PayPal-account and
      // guest debit/credit card options itself.
      const orderPayload = {
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: ids.join(","),
            custom_id: ids.join(","),
            description,
            amount: {
              currency_code: "USD",
              value: total.toFixed(2),
            },
          },
        ],
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
    const ids = parseTicketIds(req.body.ticketIds);

    if (!orderId)
      return res.status(400).json({ error: "orderId is required" });
    if (!ids)
      return res.status(400).json({ error: `ticketIds must be a non-empty array of up to ${MAX_RESERVE_QUANTITY} numeric ids` });

    try {
      for (const id of ids) {
        const ticket = await TicketService.findById(id);
        if (!ticket)
          return res.status(404).json({ error: `Ticket ${id} not found` });
        if (ticket.UserId !== req.user?.id)
          return res.status(403).json({ error: "One of these tickets doesn't belong to you" });
      }

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

      const confirmedTickets = await TicketService.confirmMany(ids);

      // Capture id is what a future refund call needs — it only ever appears
      // in this response, so it has to be saved now or it's gone for good.
      // Runs after the tickets are already confirmed and kept non-fatal: the
      // money is taken and the tickets are valid either way, so a failure
      // here (only ever affecting a later refund's paper trail) shouldn't
      // turn into an error response for a purchase that actually succeeded.
      const capture = data.purchase_units?.[0]?.payments?.captures?.[0];
      if (capture?.id) {
        try {
          await PaymentService.record(
            req.user!.id,
            String(orderId),
            capture.id,
            Number(capture.amount?.value ?? 0),
            capture.amount?.currency_code ?? "USD",
            ids,
          );
        } catch (recordErr) {
          console.error("Failed to record PayPal payment (tickets are still confirmed):", recordErr);
        }
      }

      return res.status(200).json({ tickets: confirmedTickets, capture: data });
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
