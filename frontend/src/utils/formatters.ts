/**
 * Financial, date, and status formatters.
 */

import { ExpenseStatus, PaymentStatus } from "../types/models";
import { colors } from "../theme/colors";

/**
 * Format an amount in INR currency with comma grouping.
 * Never outputs floating-point artifacts.
 */
export function formatINR(amount: string | number | undefined | null): string {
  if (amount === undefined || amount === null || amount === "") {
    return "₹0.00";
  }

  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "₹0.00";

  // Format with 2 decimal places and Indian numbering grouping
  const isNegative = num < 0;
  const absNum = Math.abs(num);
  const parts = absNum.toFixed(2).split(".");
  let intPart = parts[0];
  const decPart = parts[1];

  // Indian number formatting: last 3 digits, then groups of 2
  const lastThree = intPart.substring(intPart.length - 3);
  const otherNumbers = intPart.substring(0, intPart.length - 3);
  if (otherNumbers !== "") {
    intPart = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree;
  }

  const formatted = `₹${intPart}.${decPart}`;
  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Human-friendly date formatting.
 */
export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

/**
 * Human-friendly date and time.
 */
export function formatDateTime(dateString: string | undefined | null): string {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
}

/**
 * Remaining time or overdue indicator for deadlines.
 */
export function formatDeadlineStatus(deadlineString: string | undefined | null): {
  label: string;
  isOverdue: boolean;
} {
  if (!deadlineString) return { label: "No deadline", isOverdue: false };

  try {
    const now = new Date();
    const deadline = new Date(deadlineString);
    const diffMs = deadline.getTime() - now.getTime();

    if (diffMs < 0) {
      const hoursAgo = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60));
      if (hoursAgo < 24) {
        return { label: `Overdue by ${hoursAgo}h (Auto-extended)`, isOverdue: true };
      }
      const daysAgo = Math.floor(hoursAgo / 24);
      return { label: `Overdue by ${daysAgo}d (Auto-extended)`, isOverdue: true };
    }

    const hoursLeft = Math.floor(diffMs / (1000 * 60 * 60));
    if (hoursLeft < 24) {
      return { label: `Due in ${hoursLeft}h`, isOverdue: false };
    }
    const daysLeft = Math.floor(hoursLeft / 24);
    return { label: `Due in ${daysLeft} days`, isOverdue: false };
  } catch {
    return { label: formatDate(deadlineString), isOverdue: false };
  }
}

/**
 * Returns badge styling for payment split status.
 */
export function getPaymentStatusBadge(status: PaymentStatus) {
  switch (status) {
    case "PAID":
      return { label: "Paid", color: colors.status.paid, bg: colors.status.paidBg };
    case "PAYMENT_SUBMITTED":
      return { label: "Review Pending", color: colors.status.submitted, bg: colors.status.submittedBg };
    case "REJECTED":
      return { label: "Rejected", color: colors.status.rejected, bg: colors.status.rejectedBg };
    case "PENDING":
    default:
      return { label: "Pending", color: colors.status.pending, bg: colors.status.pendingBg };
  }
}

/**
 * Returns badge styling for expense status.
 */
export function getExpenseStatusBadge(status: ExpenseStatus) {
  switch (status) {
    case "CLOSED":
      return { label: "Closed", color: colors.status.closed, bg: colors.status.closedBg };
    case "READY_TO_CLOSE":
      return { label: "Ready to Close", color: colors.status.readyToClose, bg: colors.status.readyToCloseBg };
    case "ACTIVE":
    default:
      return { label: "Active", color: colors.status.active, bg: colors.status.submittedBg };
  }
}
