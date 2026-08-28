import EventService from "@services/event.services";
import type { Request, Response } from "express";
import { foundResponse } from "@utils/find-reponse";


export default class EventController {

  static async create(req: Request, res: Response): Promise<Response> {
    const { title, description, location, date, maxCapacity, category, status, organizerId } = req.body;

    try {
      const event = await EventService.create(title, description, maxCapacity, organizerId, location, date, category);
      return res.send(201).json(event);
    }
    catch (err) {
      return res.status(400).json({ "error": (err as Error).message })
    }
  }

  static async findAll(req: Request, res: Response): Promise<Response> {
    try {
      const events = await EventService.findAll();
      return res.status(200).json(events);

    } catch (err) {
      return res.status(500).json({ error: (err as Error).message })
    }
  }


  static async findPublished(req: Request, res: Response): Promise<Response> {
    try {
      const published = await EventService.findPublished();
      return foundResponse(res,published,"No Event Found")
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message });
    }
  }

  static async publish(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    if (isNaN(Number(id))) {
      return res.status(400).json({ error: "The ID must be numeric" });
    }

    try {

      const event = await EventService.publish(Number(id));
      return foundResponse(res, event, "Event Not Found");

    } catch (err) {
      return res.status(400).json({ error: (err as Error).message });
    }
  }

  static async cancel(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    if (isNaN(Number(id))) {
      return res.status(400).json({ error: "The ID must be numeric" });
    }

    try {
      const event = await EventService.cancel(Number(id));
      return foundResponse(res, event, "Event Not Found")
    } catch (err) {
      return res.status(400).json({ error: (err as Error).message });
    }
  }


  static async delete(req: Request, res: Response): Promise<Response> {
    const { id } = req.params

    if (isNaN(Number(id))) {
      return res.status(400).json({ error: "The ID must be numeric" });
    }

    try {
      await EventService.cancel(Number(id));
      return res.status(204).send();
    } catch (err) {
      return res.status(400).json({ error: (err as Error).message });
    }
  }

  static async getById(req: Request, res: Response): Promise<Response> {
    try {
      const id = Number(req.params.id);

      if (isNaN(id))
        return res.status(400).json({ error: "Invalid ID" });


      const event = await EventService.findById(id);

      if (event)
        return res.status(200).json(event)

      return res.status(404).json("Not Found")

    } catch (err) {
      return res.status(500);
    }
  }
}