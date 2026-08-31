import { Ticket } from "lucide-react";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__bar">
        <span className="footer__brand">
          <Ticket size={16} />
          EventHub
        </span>
        <p className="footer__note">Discover events and reserve your spot in a few clicks.</p>
        <span className="footer__copy">© {new Date().getFullYear()} EventHub</span>
      </div>
    </footer>
  );
}
