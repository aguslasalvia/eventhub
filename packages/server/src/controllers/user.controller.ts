import { numberFieldValidator, stringFieldValidator } from "@utils/field-validators";

import UserService from "@services/user.services";

import type { Request, Response } from "express"


export default class UserController {
  static async create(req: Request, res: Response) {
    const { name, email, password, userType } = req.body;

    if (!stringFieldValidator([name, email, password]) || !numberFieldValidator([userType]))
      return res.status(400).json({ error: "Check input fields" });

    const user = await UserService.create()

  }
}