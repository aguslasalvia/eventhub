import type { ReactNode } from "react";
import { LockKeyhole } from "lucide-react";
import Button from "../ui/Button";
import { useAuth } from "../../hooks/useAuth";
import { isOrganizer } from "../../lib/roles";
import "../../pages/AuthPage.css";

/** Gates a page behind "logged in" + "organizer account", with an explanatory screen otherwise. */
export default function RequireOrganizer({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  if (!user) {
    return (
      <section className="container section auth-page">
        <div className="auth-card">
          <div className="auth-card__icon">
            <LockKeyhole size={20} />
          </div>
          <h1>Log in to continue</h1>
          <p className="auth-card__subtitle">You need an organizer account for this page.</p>
          <Button to="/login" variant="primary" fullWidth>
            Log in
          </Button>
        </div>
      </section>
    );
  }

  if (!isOrganizer(user)) {
    return (
      <section className="container section auth-page">
        <div className="auth-card">
          <div className="auth-card__icon">
            <LockKeyhole size={20} />
          </div>
          <h1>Organizers only</h1>
          <p className="auth-card__subtitle">Your account is registered as an attendee, so it can't access this page.</p>
          <Button to="/" variant="secondary" fullWidth>
            Back to home
          </Button>
        </div>
      </section>
    );
  }

  return <>{children}</>;
}
