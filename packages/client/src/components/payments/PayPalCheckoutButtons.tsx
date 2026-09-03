import { useEffect, useState } from "react";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import toast from "react-hot-toast";
import { fetchPaypalClientId, createPaypalOrder, capturePaypalOrder } from "../../api/payments";
import { ApiError } from "../../api/client";
import type { TicketDto } from "../../api/types";
import Spinner from "../ui/Spinner";

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
}

/**
 * Renders PayPal's own Smart Payment Buttons in place — "PayPal" and
 * "Debit or Credit Card" side by side — so a buyer without a PayPal
 * account can still pay by card, approved via an in-page popup instead
 * of a full redirect away to paypal.com and back.
 */
export default function PayPalCheckoutButtons({ ticketIds, onSuccess }: PayPalCheckoutButtonsProps) {
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

  if (loadError) return <p className="paypal-checkout__error">Payment isn't available right now.</p>;
  if (!clientId) return <Spinner label="Loading payment options…" />;

  return (
    <PayPalScriptProvider options={{ clientId, currency: "USD", intent: "capture" }}>
      <PayPalButtons
        style={{ layout: "horizontal", height: 40 }}
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
    </PayPalScriptProvider>
  );
}
