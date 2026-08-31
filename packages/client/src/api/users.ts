import { request } from "./client";
import type { LoginPayload, RegisterPayload } from "./types";

export interface UserDto {
  id: number;
  name: string;
  email: string;
  userType: number;
}

/** POST /api/users — account creation. Backend auth wiring is still in progress. */
export function registerUser(payload: RegisterPayload): Promise<UserDto> {
  return request<UserDto>("/users", { method: "POST", body: payload });
}

export function login(payload: LoginPayload): Promise<UserDto> {
  return request<UserDto>("/users/login", { method: "POST", body: payload })
}
