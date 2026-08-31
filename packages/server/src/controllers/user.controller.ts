import { numberFieldValidator, stringFieldValidator } from "@utils/field-validators";

import UserService from "@services/user.services";

import type { Request, Response } from "express"
import { foundResponse } from "@utils/find-reponse";


export default class UserController {
  static async create(req: Request, res: Response): Promise<Response> {
    const { name, email, password, userType } = req.body;

    if (!stringFieldValidator([name, email, password]) || !numberFieldValidator([userType]))
      return res.status(400).json({ error: "Check input fields" });

    const user = await UserService.create(name, email, password, userType);
    if (!user)
      return res.status(400).send();

    return res.status(201).json(user);
  }


  static async authenticate(req: Request, res: Response): Promise<Response> {
    const { email, password } = req.body;

    if (!stringFieldValidator([email, password]))
      return res.status(400).json({ error: "Check input fields" });

    const user = await UserService.authenticate(email, password);
    return foundResponse(res, user, "User Not Found");
  }
}