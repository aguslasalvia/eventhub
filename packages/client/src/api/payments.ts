import { request } from "./client";
import type { PaypalCaptureDto, PaypalOrderDto } from "./types";

/** GET /api/payment/paypal/client-id — the PayPal client id (public by design, safe to expose). */
export function fetchPaypalClientId(): Promise<{ clientId: string }> {
  return request<{ clientId: string }>("/payment/paypal/client-id");
}

/** POST /api/payment/paypal/create-order — creates a single PayPal order covering all the given reserved tickets. */
export function createPaypalOrder(ticketIds: number[]): Promise<PaypalOrderDto> {
  return request<PaypalOrderDto>("/payment/paypal/create-order", {
    method: "POST",
    body: { ticketIds },
  });
}

/** POST /api/payment/paypal/capture-order/:orderId — captures the payment and confirms every ticket it covers. */
export function capturePaypalOrder(orderId: string, ticketIds: number[]): Promise<PaypalCaptureDto> {
  return request<PaypalCaptureDto>(`/payment/paypal/capture-order/${orderId}`, {
    method: "POST",
    body: { ticketIds },
  });
}
