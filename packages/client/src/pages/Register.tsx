import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate } from "react-router";
import { UserPlus } from "lucide-react";
import { UserType } from "@eventhub/shared";
import { Input } from "../components/ui/Field";
import Button from "../components/ui/Button";
import Alert from "../components/ui/Alert";
import { registerUser } from "../api/users";
import { ApiError } from "../api/client";
import { useAuth } from "../hooks/useAuth";
import "./AuthPage.css";

interface FormState {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  userType: UserType.Asisstant | UserType.Planner;
}

const initialState: FormState = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  userType: UserType.Asisstant,
};

function validate(form: FormState) {
  const errors: Partial<Record<keyof FormState, string>> = {};

  if (form.name.trim().length < 2) errors.name = "Enter your full name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Enter a valid email address.";
  if (form.password.length < 6) errors.password = "Use at least 6 characters.";
  if (form.confirmPassword !== form.password) errors.confirmPassword = "Passwords don't match.";

  return errors;
}

export default function Register() {
  const { user } = useAuth();
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [serverError, setServerError] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setStatus("submitting");
    setServerError(null);
    try {
      await registerUser({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        userType: form.userType,
      });
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setServerError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <section className="container section auth-page">
        <div className="auth-card">
          <Alert tone="success">Your account was created.</Alert>
          <Button to="/login" variant="primary" fullWidth className="auth-card__cta">
            Log in now
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="container section auth-page">
      <div className="auth-card">
        <div className="auth-card__icon">
          <UserPlus size={20} />
        </div>
        <h1>Create your account</h1>
        <p className="auth-card__subtitle">Join EventHub to reserve tickets or start publishing events.</p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-form__role">
            <button
              type="button"
              className={`auth-form__role-option ${form.userType === UserType.Asisstant ? "is-selected" : ""}`}
              onClick={() => update("userType", UserType.Asisstant)}
            >
              I want to attend events
            </button>
            <button
              type="button"
              className={`auth-form__role-option ${form.userType === UserType.Planner ? "is-selected" : ""}`}
              onClick={() => update("userType", UserType.Planner)}
            >
              I want to organize events
            </button>
          </div>

          <Input
            label="Full name"
            htmlFor="name"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            error={errors.name}
            autoComplete="name"
          />
          <Input
            label="Email"
            htmlFor="email"
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            error={errors.email}
            autoComplete="email"
          />
          <Input
            label="Password"
            htmlFor="password"
            type="password"
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            error={errors.password}
            autoComplete="new-password"
          />
          <Input
            label="Confirm password"
            htmlFor="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={(e) => update("confirmPassword", e.target.value)}
            error={errors.confirmPassword}
            autoComplete="new-password"
          />

          {status === "error" && serverError && <Alert tone="danger">{serverError}</Alert>}

          <Button type="submit" fullWidth disabled={status === "submitting"}>
            {status === "submitting" ? "Creating account…" : "Create account"}
          </Button>
        </form>
      </div>
    </section>
  );
}
