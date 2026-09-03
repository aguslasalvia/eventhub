import { request } from "./client";
import type { AuthResponseDto, LoginPayload, RegisterPayload } from "./types";

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

/** POST /api/users/login — returns the user plus an access/refresh token pair. */
export function login(payload: LoginPayload): Promise<AuthResponseDto> {
  return request<AuthResponseDto>("/users/login", { method: "POST", body: payload })
}

/** POST /api/users/logout — revokes the given refresh token server-side. */
export function logout(refreshToken: string): Promise<void> {
  return request<void>("/users/logout", { method: "POST", body: { refreshToken } });
}
