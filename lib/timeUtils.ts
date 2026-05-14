/**
 * Reusable utility functions for working hours formatting,
 * delivery/pickup cutoff time calculation, and time range validation.
 */

/**
 * Formats working hours as "12:00-22:00".
 */
export function formatWorkingHours(openingHour: number, closingHour: number): string {
  return `${openingHour}:00-${closingHour}:00`;
}

/**
 * Returns the ASAP order cutoff time (30 min before closing).
 * Example: closingHour=22 → { hour: 21, minute: 30 }
 */
export function getDeliveryCutoff(closingHour: number): { hour: number; minute: number } {
  return { hour: closingHour - 1, minute: 30 };
}

/**
 * Formats the ASAP cutoff as a string like "21:30".
 */
export function formatDeliveryCutoff(closingHour: number): string {
  const { hour, minute } = getDeliveryCutoff(closingHour);
  return `${hour}:${minute.toString().padStart(2, "0")}`;
}

/**
 * Returns the earliest selectable hour for scheduled delivery.
 * Delivery earliest = opening_hour + 1 (e.g. 13:00 when opening at 12).
 */
export function getScheduledDeliveryStartHour(openingHour: number): number {
  return openingHour + 1;
}

/**
 * Checks if the current client time allows ASAP orders (delivery or pickup).
 * Accepted from openingHour:00 until 30 minutes before closingHour:00.
 */
export function isWithinAsapDeliveryHours(openingHour: number, closingHour: number): boolean {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const openingMinutes = openingHour * 60;
  const { hour: cutoffHour, minute: cutoffMinute } = getDeliveryCutoff(closingHour);
  const cutoffMinutes = cutoffHour * 60 + cutoffMinute;
  return currentMinutes >= openingMinutes && currentMinutes < cutoffMinutes;
}

/** Alias for readability — same validation rules apply to pickup. */
export const isWithinAsapPickupHours = isWithinAsapDeliveryHours;

/**
 * Generates the ASAP delivery validation error message.
 * Example: "Заказы на доставку принимаются с 12:00 до 21:30"
 */
export function getAsapDeliveryErrorMessage(openingHour: number, closingHour: number): string {
  return `Заказы на доставку принимаются с ${openingHour}:00 до ${formatDeliveryCutoff(closingHour)}`;
}

/**
 * Generates the ASAP pickup validation error message.
 * Example: "Заказы на самовывоз принимаются с 12:00 до 21:30"
 */
export function getAsapPickupErrorMessage(openingHour: number, closingHour: number): string {
  return `Заказы на самовывоз принимаются с ${openingHour}:00 до ${formatDeliveryCutoff(closingHour)}`;
}
