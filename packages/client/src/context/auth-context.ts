import { createContext } from "react";
import type { UserDto } from "../api/users";

export interface AuthContextValue {
  user: UserDto | null;
  isAuthenticating: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
