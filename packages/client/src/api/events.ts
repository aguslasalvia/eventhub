import { request } from "./client";
import type { CreateEventPayload, EventDto, UpdateEventPayload } from "./types";

/** GET /api/events — all non-draft events (published + cancelled). */
export function fetchEvents(): Promise<EventDto[]> {
  return request<EventDto[]>("/events");
}

/** GET /api/events/organizer/:organizerId — every event owned by one organizer, any status. */
export function fetchOrganizerEvents(organizerId: number): Promise<EventDto[]> {
  return request<EventDto[]>(`/events/organizer/${organizerId}`);
}

/** POST /api/events — creates a draft event. */
export function createEvent(payload: CreateEventPayload): Promise<EventDto> {
  return request<EventDto>("/events", { method: "POST", body: payload });
}

/** PUT /api/events/:id — updates an event's editable fields. */
export function updateEvent(id: number, payload: UpdateEventPayload): Promise<EventDto> {
  return request<EventDto>(`/events/${id}`, { method: "PUT", body: payload });
}

/** POST /api/events/:id/publish — requires the event to already have a date and location. */
export function publishEvent(id: number): Promise<EventDto> {
  return request<EventDto>(`/events/${id}/publish`, { method: "POST" });
}

/**
 * POST /api/events/:id/cancel — despite the route name, the server sets the
 * event back to Draft (Event.unpublish()), not a distinct "cancelled" state.
 * Exposed here as "unpublish" to match what it actually does.
 */
export function unpublishEvent(id: number): Promise<EventDto> {
  return request<EventDto>(`/events/${id}/cancel`, { method: "POST" });
}
