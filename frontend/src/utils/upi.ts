/**
 * UPI deep link generator and launcher for Indian payment apps.
 */

import { Linking, Platform } from "react-native";

interface UpiPaymentParams {
  upiId: string;
  payeeName: string;
  amount: string | number;
  transactionReference?: string;
  transactionNote?: string;
}

/**
 * Builds standard UPI URI:
 * upi://pay?pa=<upi_id>&pn=<payee_name>&am=<amount>&cu=INR&tn=<note>
 */
export function buildUpiUrl({
  upiId,
  payeeName,
  amount,
  transactionReference,
  transactionNote = "Expense payment",
}: UpiPaymentParams): string {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error("Enter a valid payment amount.");
  }

  const normalizedUpiId = upiId.trim();
  if (!/^[^\s@]+@[^\s@]+$/.test(normalizedUpiId)) {
    throw new Error("The recipient UPI ID is invalid.");
  }

  const formattedAmount = numericAmount.toFixed(2);
  const encodedName = encodeURIComponent(payeeName || "Expense Leader");
  const encodedNote = encodeURIComponent(transactionNote.slice(0, 80));
  const reference = transactionReference
    ? `&tr=${encodeURIComponent(transactionReference)}`
    : "";

  return `upi://pay?pa=${encodeURIComponent(normalizedUpiId)}&pn=${encodedName}&am=${formattedAmount}&cu=INR&tn=${encodedNote}${reference}`;
}

/**
 * Attempts to launch the device's UPI payment application (GPay, PhonePe, Paytm, etc.).
 * Note: Launching UPI does NOT confirm payment. User must still submit confirmation to the backend.
 */
export async function launchUpiPayment(params: UpiPaymentParams): Promise<boolean> {
  try {
    const url = buildUpiUrl(params);
    const supported = await Linking.canOpenURL(url);
    if (supported || Platform.OS === "android") {
      await Linking.openURL(url);
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.warn("Could not open UPI app:", error);
    return false;
  }
}
