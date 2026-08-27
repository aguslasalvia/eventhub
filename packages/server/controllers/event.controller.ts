import EventService from "@services/event.services";
import type { Request, Response } from "express";

export default class EventController {

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