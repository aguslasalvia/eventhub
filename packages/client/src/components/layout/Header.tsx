import { useState } from "react";
import { NavLink } from "react-router";
import { Menu, Ticket, X } from "lucide-react";
import Button from "../ui/Button";
import { useAuth } from "../../hooks/useAuth";
import { isOrganizer } from "../../lib/roles";
import "./Header.css";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `header__link ${isActive ? "header__link--active" : ""}`;

interface NavItem {
  to: string;
  label: string;
  end?: boolean;
}

function AuthActions({ onNavigate, stacked }: { onNavigate: () => void; stacked?: boolean }) {
  const { user, logout } = useAuth();
  const secondaryVariant = stacked ? "secondary" : "ghost";

  if (user) {
    return (
      <>
        <span className="header__user">Hi, {user.name.split(" ")[0]}</span>
        <Button
          variant={secondaryVariant}
          fullWidth={stacked}
          onClick={() => {
            logout();
            onNavigate();
          }}
        >
          Log out
        </Button>
      </>
    );
  }

  return (
    <>
      <Button to="/login" variant={secondaryVariant} fullWidth={stacked} onClick={onNavigate}>
        Log in
      </Button>
      <Button to="/register" variant="primary" fullWidth={stacked} onClick={onNavigate}>
        Sign up
      </Button>
    </>
  );
}

export default function Header() {
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems: NavItem[] = [
    { to: "/", label: "Home", end: true },
    { to: "/events", label: "Events" },
    ...(user && isOrganizer(user) ? [{ to: "/dashboard", label: "Dashboard" }] : []),
    ...(user && !isOrganizer(user) ? [{ to: "/my-tickets", label: "My tickets" }] : []),
  ];

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="header">
      <div className="container header__bar">
        <NavLink to="/" className="header__brand" onClick={closeMenu}>
          <Ticket size={22} strokeWidth={2.25} />
          <span>EventHub</span>
        </NavLink>

        <nav className="header__nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="header__actions">
          <AuthActions onNavigate={closeMenu} />
        </div>

        <button
          type="button"
          className="header__menu-toggle"
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {isMenuOpen && (
        <div className="header__mobile-panel">
          <nav className="header__mobile-nav" aria-label="Main navigation">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClass} onClick={closeMenu}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="header__mobile-actions">
            <AuthActions onNavigate={closeMenu} stacked />
          </div>
        </div>
      )}
    </header>
  );
}
