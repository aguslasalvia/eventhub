import { NavLink } from "react-router";
import { Ticket } from "lucide-react";
import Button from "../ui/Button";
import { useAuth } from "../../hooks/useAuth";
import { isOrganizer } from "../../lib/roles";
import "./Header.css";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `header__link ${isActive ? "header__link--active" : ""}`;

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="header">
      <div className="container header__bar">
        <NavLink to="/" className="header__brand">
          <Ticket size={22} strokeWidth={2.25} />
          <span>EventHub</span>
        </NavLink>

        <nav className="header__nav" aria-label="Main navigation">
          <NavLink to="/" end className={navLinkClass}>
            Home
          </NavLink>
          <NavLink to="/events" className={navLinkClass}>
            Events
          </NavLink>
          {user && isOrganizer(user) && (
            <NavLink to="/dashboard" className={navLinkClass}>
              Dashboard
            </NavLink>
          )}
          {user && !isOrganizer(user) && (
            <NavLink to="/my-tickets" className={navLinkClass}>
              My tickets
            </NavLink>
          )}
        </nav>

        <div className="header__actions">
          {user ? (
            <>
              <span className="header__user">Hi, {user.name.split(" ")[0]}</span>
              <Button variant="ghost" onClick={logout}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <Button to="/login" variant="ghost">
                Log in
              </Button>
              <Button to="/register" variant="primary">
                Sign up
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
