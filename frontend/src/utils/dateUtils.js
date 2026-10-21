/**
 * Common date formatting utilities for BookLeaf
 * Enforces standardized dd/mm/yyyy across author and admin portals.
 */

/**
 * Formats any date input (ISO string, timestamp, YYYY-MM-DD, or Date instance) into dd/mm/yyyy.
 * @param {string|number|Date} dateInput
 * @returns {string} Formatted date as DD/MM/YYYY
 */
export function formatDate(dateInput) {
  if (!dateInput) return "";

  // Handle YYYY-MM-DD string directly to avoid timezone offsets
  if (typeof dateInput === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    const [year, month, day] = dateInput.split("-");
    return `${day}/${month}/${year}`;
  }

  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
}

/**
 * Formats date into dd/mm/yyyy with time e.g. "21/10/2026 at 09:30 PM"
 * @param {string|number|Date} dateInput
 * @returns {string}
 */
export function formatDateTime(dateInput) {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return formatDate(dateInput);

  const datePart = formatDate(d);
  const timePart = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return `${datePart} at ${timePart}`;
}
