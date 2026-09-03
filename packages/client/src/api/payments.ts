import { request } from "./client";
import type { PaypalCaptureDto, PaypalOrderDto } from "./types";

/** POST /api/payment/paypal/create-order — creates a single PayPal order covering all the given reserved tickets. */
export function createPaypalOrder(ticketIds: number[], origin: string): Promise<PaypalOrderDto> {
  return request<PaypalOrderDto>("/payment/paypal/create-order", {
    method: "POST",
    body: { ticketIds, origin },
  });
}

/** POST /api/payment/paypal/capture-order/:orderId — captures the payment and confirms every ticket it covers. */
export function capturePaypalOrder(orderId: string, ticketIds: number[]): Promise<PaypalCaptureDto> {
  return request<PaypalCaptureDto>(`/payment/paypal/capture-order/${orderId}`, {
    method: "POST",
    body: { ticketIds },
  });
}

/** The PayPal-hosted URL the buyer should be redirected to in order to approve the order. */
export function getPaypalApprovalLink(order: PaypalOrderDto): string | null {
  const link = order.links.find((l) => l.rel === "payer-action" || l.rel === "approve");
  return link?.href ?? null;
}

const PENDING_PAYMENT_KEY = "eventhub.pendingPayment";

interface PendingPayment {
  ticketIds: number[];
  orderId: string;
}

/**
 * PayPal's return_url only carries the order id (as `?token=`), so the
 * ticket(s) being paid for are stashed here before redirecting and read back
 * on /paypal/success once the buyer returns from PayPal.
 */
export function setPendingPayment(payment: PendingPayment) {
  sessionStorage.setItem(PENDING_PAYMENT_KEY, JSON.stringify(payment));
}

export function getPendingPayment(): PendingPayment | null {
  try {
    const raw = sessionStorage.getItem(PENDING_PAYMENT_KEY);
    return raw ? (JSON.parse(raw) as PendingPayment) : null;
  } catch {
    return null;
  }
}

export function clearPendingPayment() {
  sessionStorage.removeItem(PENDING_PAYMENT_KEY);
}
