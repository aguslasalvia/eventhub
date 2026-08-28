import EventService from "@services/event.services";
import type { Request, Response } from "express";

export default class EventController {

  static async create(req: Request, res: Response) {
    const { title, description, location, date, maxCapacity, category, status, organizerId } = req.body;

    try {
      const event = await EventService.create(title, description, maxCapacity, organizerId, location, date, category);
      res.send(201).json(event);
    }
    catch (err) {
      res.status(400).json({ "error": (err as Error).message })
    }
  }

  static async findAll(req: Request, res: Response) {
    try {
      const events = await EventService.findAll();
      res.status(200).json(events);

    } catch (err) {
      res.status(500).json({ error: (err as Error).message })
    }
  }


  static async findPublished(req: Request, res: Response) {
    try {
      const published = await EventService.findPublished();
      res.status(200).json(published);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  }

  static async publish(req: Request, res: Response) {
    const { id } = req.params;

    if (isNaN(Number(id))) {
      return res.status(400).json({ error: "The ID must be numeric" });
    }

    try {
      const event = await EventService.publish(Number(id));
      res.status(200).json(event);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  }

  static async cancel(req: Request, res: Response) {
    const { id } = req.params;

    if (isNaN(Number(id))) {
      return res.status(400).json({ error: "The ID must be numeric" });
    }

    try {
      const event = await EventService.cancel(Number(id));
      return res.status(200).json(event);
    } catch (err) {
      return res.status(400).json({ error: (err as Error).message });
    }
  }


  static async delete(req: Request, res: Response) {
    const { id } = req.params

    if (isNaN(Number(id))) {
      return res.status(400).json({ error: "The ID must be numeric" });
    }

    try {
      await EventService.cancel(Number(id));
      res.status(204).send();
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);

      if (isNaN(id))
        return res.status(400).json({ error: "Invalid ID" })

      const event = await EventService.findById(id)

      if (event)
        res.status(200).json(event)

      res.status(404).json("Not Found")

    } catch (err) {
      res.status(500);
    }
  }
}