import TicketTypeService from "@services/ticketType.services";
import type { Request, Response } from "express";
import { foundResponse } from "@utils/find-reponse";

export default class TicketTypeController {
  static async create(req: Request, res: Response): Promise<Response> {
    const { eventId, category, price, totalCapacity } = req.body;

    if (!eventId || isNaN(Number(eventId))) {
      return res.status(400).json({ error: "eventId must be numeric" });
    }

    try {
      const ticketType = await TicketTypeService.create(
        Number(eventId),
        category,
        Number(price),
        Number(totalCapacity),
      );
      return res.status(201).json(ticketType);
    } catch (err) {
      return res.status(400).json({ error: (err as Error).message });
    }
  }

  static async findByEvent(req: Request, res: Response): Promise<Response> {
    const { eventId } = req.params;

    if (!eventId || isNaN(Number(eventId))) {
      return res.status(400).json({ error: "eventId must be numeric" });
    }

    try {
      const ticketTypes = await TicketTypeService.findByEvent(Number(eventId));
      return res.status(200).json(ticketTypes);
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message });
    }
  }

  static async findById(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ error: "ID must be numeric" });
    }

    try {
      const ticketType = await TicketTypeService.findById(Number(id));
      return foundResponse(res, ticketType, "Ticket type not found");
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message });
    }
  }
}
