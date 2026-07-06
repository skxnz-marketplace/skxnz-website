// SKXNZ support-ticket input layer (V1 backend foundation).
//
// Mirrors the DRAFT migration supabase/migrations/0005_commerce_layer.sql
// (support_tickets + support_ticket_messages). Pure types + validation only —
// nothing here writes to the database. buyer_id is always derived from the
// authenticated session server-side, never accepted from the client.

export const supportTicketCategories = [
  "ORDER",
  "RETURN",
  "PAYMENT",
  "DELIVERY",
  "PRODUCT",
  "ACCOUNT",
  "OTHER",
] as const;

export type SupportTicketCategory = (typeof supportTicketCategories)[number];

export const supportTicketStatuses = [
  "OPEN",
  "WAITING_FOR_CUSTOMER",
  "IN_REVIEW",
  "RESOLVED",
  "CLOSED",
] as const;

export type SupportTicketStatus = (typeof supportTicketStatuses)[number];

export type CreateSupportTicketInput = {
  category: SupportTicketCategory;
  subject: string;
  /** First buyer message; becomes the opening support_ticket_messages row. */
  message: string;
  /** Real DB order id when the ticket is about an order; null otherwise. */
  orderId: string | null;
};

const maxSubjectLength = 160;
const maxMessageLength = 4000;

/** Empty result object means valid. */
export function validateSupportTicketInput(
  input: CreateSupportTicketInput,
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!supportTicketCategories.includes(input.category)) {
    errors.category = "Choose a valid support category.";
  }

  if (!input.subject.trim()) {
    errors.subject = "Subject is required.";
  } else if (input.subject.trim().length > maxSubjectLength) {
    errors.subject = `Subject must be ${maxSubjectLength} characters or fewer.`;
  }

  if (!input.message.trim()) {
    errors.message = "Message is required.";
  } else if (input.message.trim().length > maxMessageLength) {
    errors.message = `Message must be ${maxMessageLength} characters or fewer.`;
  }

  return errors;
}
