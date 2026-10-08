/**
 * UPI deep link generator and launcher for Indian payment apps.
 */

import { Linking, Platform } from "react-native";

interface UpiPaymentParams {
  upiId: string;
  payeeName: string;
  amount: string | number;
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
  transactionNote = "Expense payment",
}: UpiPaymentParams): string {
  const formattedAmount = typeof amount === "number" ? amount.toFixed(2) : amount;
  const encodedName = encodeURIComponent(payeeName || "Expense Leader");
  const encodedNote = encodeURIComponent(transactionNote);

  return `upi://pay?pa=${encodeURIComponent(
    upiId
  )}&pn=${encodedName}&am=${formattedAmount}&cu=INR&tn=${encodedNote}`;
}

/**
 * Attempts to launch the device's UPI payment application (GPay, PhonePe, Paytm, etc.).
 * Note: Launching UPI does NOT confirm payment. User must still submit confirmation to the backend.
 */
export async function launchUpiPayment(params: UpiPaymentParams): Promise<boolean> {
  const url = buildUpiUrl(params);

  try {
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
