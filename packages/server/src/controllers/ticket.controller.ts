import TicketService, { MAX_RESERVE_QUANTITY } from "@services/ticket.services";
import type { Request, Response } from "express";
import { foundResponse } from "@utils/find-reponse";

export default class TicketController {
  static async reserve(req: Request, res: Response): Promise<Response> {
    const { ticketTypeId, userId, quantity = 1 } = req.body;

    if (!ticketTypeId || isNaN(Number(ticketTypeId))) {
      return res.status(400).json({ error: "ticketTypeId must be numeric" });
    }
    if (!userId || isNaN(Number(userId))) {
      return res.status(400).json({ error: "userId must be numeric" });
    }
    if (!Number.isInteger(Number(quantity)) || Number(quantity) < 1 || Number(quantity) > MAX_RESERVE_QUANTITY) {
      return res.status(400).json({ error: `quantity must be an integer between 1 and ${MAX_RESERVE_QUANTITY}` });
    }
    try {
      const tickets = await TicketService.reserve(Number(ticketTypeId), Number(userId), Number(quantity));
      return res.status(201).json(tickets);
    } catch (err) {
      return res.status(400).json({ error: (err as Error).message })
    }
  };

  static async findById(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    if (!id || isNaN(Number(id)))
      return res.status(400).json({ error: "ID must be numeric" });

    try {
      const ticket = await TicketService.findById(Number(id));
      return foundResponse(res, ticket, "Ticket Not Found");

    } catch (err) {
      return res.status(400).json({ error: (err as Error).message });
    }
  }

  static async findByUser(req: Request, res: Response): Promise<Response> {
    const { userId } = req.params;

    if (!userId || isNaN(Number(userId)))
      return res.status(400).json({ error: "ID must be numeric" });

    try {
      const tickets = await TicketService.findByUserDetailed(Number(userId));
      return res.status(200).json(tickets);

    } catch (err) {
      return res.status(400).json({ error: (err as Error).message });
    }
  }

  static async findByTicketType(req: Request, res: Response): Promise<Response> {
    const { ticketTypeId } = req.params;

    if (!ticketTypeId || isNaN(Number(ticketTypeId)))
      return res.status(400).json({ error: "ID must be numeric" });

    try {
      const ticket = await TicketService.findByTicketType(Number(ticketTypeId));
      return foundResponse(res, ticket, "Ticket Not Found")
    } catch (err) {
      return res.status(400).json({ error: (err as Error).message });
    }

  }

  static async confirm(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    if (!id || isNaN(Number(id)))
      return res.status(400).json({ error: "ID must be numeric" });
    try {

      const ticket = await TicketService.confirm(Number(id));
      return foundResponse(res, ticket, "Ticket Not Found")

    } catch (err) {
      return res.status(400).json({ error: (err as Error).message })
    }
  }

  // static async cancel(req: Request, res: Response): Promise<Response>;
}