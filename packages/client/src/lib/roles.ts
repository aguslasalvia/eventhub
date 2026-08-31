import { UserType } from "@eventhub/shared";
import type { UserDto } from "../api/users";

/** Mirrors User.isOrganizer() on the server (Planner or Administrator). */
export function isOrganizer(user: UserDto | null): boolean {
  return user?.userType === UserType.Planner || user?.userType === UserType.Administrator;
}
