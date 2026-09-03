import { useEffect, useState } from "react";
import { PayPalButtons, PayPalScriptProvider, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import toast from "react-hot-toast";
import { fetchPaypalClientId, createPaypalOrder, capturePaypalOrder } from "../../api/payments";
import { ApiError } from "../../api/client";
import type { TicketDto } from "../../api/types";
import Spinner from "../ui/Spinner";
import "./PayPalCheckoutButtons.css";

// Fetched once per page load and shared by every button instance on the
// page (My tickets can render one per still-unpaid reservation batch).
let clientIdPromise: Promise<string> | null = null;
function getClientId(): Promise<string> {
  if (!clientIdPromise) {
    clientIdPromise = fetchPaypalClientId().then((res) => res.clientId);
  }
  return clientIdPromise;
}

interface PayPalCheckoutButtonsProps {
  ticketIds: number[];
  onSuccess: (tickets: TicketDto[]) => void;
  className?: string;
}

/**
 * Renders PayPal's own Smart Payment Buttons in place — "PayPal" and
 * "Debit or Credit Card" stacked — so a buyer without a PayPal account can
 * still pay by card, approved via an in-page popup instead of a full
 * redirect away to paypal.com and back.
 */
export default function PayPalCheckoutButtons({ ticketIds, onSuccess, className }: PayPalCheckoutButtonsProps) {
  const [clientId, setClientId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getClientId()
      .then((id) => {
        if (!cancelled) setClientId(id);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={["paypal-checkout", className].filter(Boolean).join(" ")}>
      {loadError && <p className="paypal-checkout__error">Payment isn't available right now.</p>}
      {!loadError && !clientId && <Spinner label="Loading payment options…" />}
      {!loadError && clientId && (
        <PayPalScriptProvider options={{ clientId, currency: "USD", intent: "capture" }}>
          <PayPalButtonsInner ticketIds={ticketIds} onSuccess={onSuccess} />
        </PayPalScriptProvider>
      )}
    </div>
  );
}

/** Split out because usePayPalScriptReducer only works inside PayPalScriptProvider. */
function PayPalButtonsInner({ ticketIds, onSuccess }: PayPalCheckoutButtonsProps) {
  const [{ isPending, isRejected }] = usePayPalScriptReducer();

  // The SDK script itself takes a beat to load and render the buttons —
  // without this, the checkout area just sits empty for a moment.
  if (isPending) return <Spinner label="Loading PayPal…" />;
  if (isRejected) return <p className="paypal-checkout__error">Couldn't load PayPal. Please try again.</p>;

  return (
    <PayPalButtons
      style={{ layout: "vertical", shape: "pill", height: 40 }}
      createOrder={async () => {
        try {
          const order = await createPaypalOrder(ticketIds);
          return order.id;
        } catch (err) {
          toast.error(err instanceof ApiError ? err.message : "Couldn't start payment.");
          throw err;
        }
      }}
      onApprove={async (data) => {
        try {
          const result = await capturePaypalOrder(data.orderID, ticketIds);
          onSuccess(result.tickets);
        } catch (err) {
          toast.error(err instanceof ApiError ? err.message : "Couldn't confirm payment.");
        }
      }}
      onError={(err) => {
        console.error("PayPal checkout error:", err);
      }}
    />
  );
}
