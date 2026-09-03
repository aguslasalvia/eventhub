import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate, useNavigate } from "react-router";
import { LogIn } from "lucide-react";
import toast from "react-hot-toast";
import { Input } from "../components/ui/Field";
import Button from "../components/ui/Button";
import { ApiError } from "../api/client";
import { useAuth } from "../hooks/useAuth";
import "./AuthPage.css";

export default function Login() {
  const { user, login, isAuthenticating } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (user) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't log in. Please try again.");
    }
  }

  return (
    <section className="container section auth-page">
      <div className="auth-card">
        <div className="auth-card__icon">
          <LogIn size={20} />
        </div>
        <h1>Log in</h1>
        <p className="auth-card__subtitle">Access your account to manage tickets and events.</p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <Input
            label="Email"
            htmlFor="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <Input
            label="Password"
            htmlFor="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          <Button type="submit" fullWidth disabled={isAuthenticating}>
            {isAuthenticating ? "Logging in…" : "Log in"}
          </Button>
        </form>
      </div>
    </section>
  );
}
