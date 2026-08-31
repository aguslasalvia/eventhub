import { EventCategory, EventState, TicketCategories, TicketStatus, UserType } from "@eventhub/shared";

export type BadgeTone = "success" | "neutral" | "danger";

export const eventStateLabel: Record<EventState, string> = {
  [EventState.Draft]: "Draft",
  [EventState.Published]: "Published",
  [EventState.Cancelled]: "Cancelled",
};

export const eventStateTone: Record<EventState, BadgeTone> = {
  [EventState.Draft]: "neutral",
  [EventState.Published]: "success",
  [EventState.Cancelled]: "danger",
};

export const eventCategoryLabel: Record<EventCategory, string> = {
  [EventCategory.Technology]: "Technology",
  [EventCategory.Music]: "Music",
  [EventCategory.Sports]: "Sports",
  [EventCategory.Art]: "Art",
  [EventCategory.Food]: "Food",
  [EventCategory.Business]: "Business",
  [EventCategory.Education]: "Education",
  [EventCategory.Health]: "Health",
  [EventCategory.Community]: "Community",
  [EventCategory.Other]: "Other",
};

export const ticketCategoryLabel: Record<TicketCategories, string> = {
  [TicketCategories.Economic]: "Economic",
  [TicketCategories.Midium]: "Medium",
  [TicketCategories.Premium]: "Premium",
  [TicketCategories.VIP]: "VIP",
  [TicketCategories.Press]: "Press",
  [TicketCategories.Student]: "Student",
};

export const ticketStatusLabel: Record<TicketStatus, string> = {
  [TicketStatus.Reserved]: "Reserved",
  [TicketStatus.Confirmed]: "Confirmed",
  [TicketStatus.Cancelled]: "Cancelled",
};

export const ticketStatusTone: Record<TicketStatus, BadgeTone> = {
  [TicketStatus.Reserved]: "neutral",
  [TicketStatus.Confirmed]: "success",
  [TicketStatus.Cancelled]: "danger",
};

export const userTypeLabel: Record<UserType, string> = {
  [UserType.Visitor]: "Visitor",
  [UserType.Asisstant]: "Attendee",
  [UserType.Planner]: "Organizer",
  [UserType.Administrator]: "Administrator",
};
