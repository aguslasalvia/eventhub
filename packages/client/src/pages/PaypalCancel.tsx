import { useEffect } from "react";
import { CircleOff } from "lucide-react";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import { clearPendingPayment } from "../api/payments";
import "./AuthPage.css";

/** Landing page for PayPal's cancel_url — the buyer backed out before approving. */
export default function PaypalCancel() {
  useEffect(() => {
    clearPendingPayment();
  }, []);

  return (
    <section className="container section auth-page">
      <div className="auth-card">
        <div className="auth-card__icon">
          <CircleOff size={20} />
        </div>
        <h1>Payment cancelled</h1>
        <Alert tone="info">You cancelled the PayPal checkout. Your reservation is still held until it expires.</Alert>
        <Button to="/my-tickets" variant="primary" fullWidth className="auth-card__cta">
          Back to my tickets
        </Button>
      </div>
    </section>
  );
}
