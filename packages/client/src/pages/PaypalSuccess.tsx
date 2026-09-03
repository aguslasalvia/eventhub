import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { CircleCheck, CircleAlert } from "lucide-react";
import Spinner from "../components/ui/Spinner";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import { capturePaypalOrder, clearPendingPayment, getPendingPayment } from "../api/payments";
import { ApiError } from "../api/client";
import "./AuthPage.css";

type Status = "capturing" | "success" | "error";

/**
 * Landing page for PayPal's return_url. PayPal appends the order id as
 * `?token=`; the ticket it belongs to was stashed in sessionStorage right
 * before the redirect (see MyTickets.handlePay).
 */
const MISMATCH_ERROR = "We couldn't match this payment to a reservation. Please try again from My tickets.";

export default function PaypalSuccess() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("token");
  const pending = getPendingPayment();
  const isValid = Boolean(orderId && pending && pending.orderId === orderId);
  const ticketCount = pending?.ticketIds.length ?? 1;

  const [status, setStatus] = useState<Status>(isValid ? "capturing" : "error");
  const [error, setError] = useState<string | null>(isValid ? null : MISMATCH_ERROR);

  useEffect(() => {
    if (!isValid || !orderId || !pending) return;

    capturePaypalOrder(orderId, pending.ticketIds)
      .then(() => {
        clearPendingPayment();
        setStatus("success");
      })
      .catch((err) => {
        setStatus("error");
        setError(err instanceof ApiError ? err.message : "The payment couldn't be confirmed.");
      });
    // Only ever needs to run once, against the order id this page loaded with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="container section auth-page">
      <div className="auth-card">
        {status === "capturing" && (
          <>
            <h1>Confirming your payment…</h1>
            <p className="auth-card__subtitle">Hang on while we confirm this with PayPal.</p>
            <Spinner label="Confirming payment…" />
          </>
        )}

        {status === "success" && (
          <>
            <div className="auth-card__icon">
              <CircleCheck size={20} />
            </div>
            <h1>Payment confirmed</h1>
            <Alert tone="success">
              {ticketCount === 1
                ? "Your ticket is now confirmed. See you at the event!"
                : `Your ${ticketCount} tickets are now confirmed. See you at the event!`}
            </Alert>
            <Button to="/my-tickets" variant="primary" fullWidth className="auth-card__cta">
              Go to my tickets
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="auth-card__icon">
              <CircleAlert size={20} />
            </div>
            <h1>Something went wrong</h1>
            <Alert tone="danger">{error}</Alert>
            <Button to="/my-tickets" variant="primary" fullWidth className="auth-card__cta">
              Back to my tickets
            </Button>
          </>
        )}
      </div>
    </section>
  );
}
