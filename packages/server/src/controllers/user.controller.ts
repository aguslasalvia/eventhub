import { numberFieldValidator, stringFieldValidator } from "@utils/field-validators";

import UserService from "@services/user.services";
import RefreshTokenService from "@services/refreshToken.services";
import { signToken } from "@utils/jwt";

import type { Request, Response } from "express"
import { foundResponse } from "@utils/find-reponse";


export default class UserController {
  static async create(req: Request, res: Response): Promise<Response> {
    const { name, email, password, userType } = req.body;

    if (!stringFieldValidator([name, email, password]) || !numberFieldValidator([userType]))
      return res.status(400).json({ error: "Check input fields" });

    try {
      const user = await UserService.create(name, email, password, userType);
      return res.status(201).json(user);
    } catch (err) {
      return res.status(400).json({ error: (err as Error).message });
    }
  }


  static async authenticate(req: Request, res: Response): Promise<Response> {
    const { email, password } = req.body;

    if (!stringFieldValidator([email, password]))
      return res.status(400).json({ error: "Check input fields" });

    try {
      const user = await UserService.authenticate(email, password);
      const token = signToken({ id: user.Id as number, userType: user.UserType });
      const refreshToken = await RefreshTokenService.issue(user.Id as number);
      return res.status(200).json({ user, token, refreshToken });
    } catch (err) {
      return res.status(401).json({ error: (err as Error).message });
    }
  }

  static async refresh(req: Request, res: Response): Promise<Response> {
    const { refreshToken } = req.body;

    if (!stringFieldValidator([refreshToken]))
      return res.status(400).json({ error: "Check input fields" });

    try {
      const { userId, token: newRefreshToken } = await RefreshTokenService.rotate(refreshToken);
      const user = await UserService.findById(userId);

      if (!user)
        return res.status(401).json({ error: "Invalid refresh token" });

      const token = signToken({ id: user.Id as number, userType: user.UserType });
      return res.status(200).json({ user, token, refreshToken: newRefreshToken });
    } catch (err) {
      return res.status(401).json({ error: (err as Error).message });
    }
  }

  static async logout(req: Request, res: Response): Promise<Response> {
    const { refreshToken } = req.body;

    if (stringFieldValidator([refreshToken]))
      await RefreshTokenService.revoke(refreshToken);

    return res.status(204).send();
  }

  static async findById(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    if (!id || isNaN(Number(id)))
      return res.status(400).json({ error: "ID must be numeric" });

    try {
      const user = await UserService.findById(Number(id));
      return foundResponse(res, user, "User Not Found");
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message });
    }
  }
}
