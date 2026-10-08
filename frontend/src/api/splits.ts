/**
 * Splits and payments API module.
 */

import { apiClient } from "./client";
import { ExpenseSplit } from "../types/models";
import { PaymentActionPayload } from "../types/api";

export async function submitPayment(
  splitId: string,
  proofFileUri?: string
): Promise<ExpenseSplit> {
  if (proofFileUri) {
    const formData = new FormData();
    formData.append("file", {
      uri: proofFileUri,
      name: "payment_proof.jpg",
      type: "image/jpeg",
    } as any);

    const response = await apiClient.post<ExpenseSplit>(
      `/splits/${splitId}/payment`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  }

  // Without proof image
  const response = await apiClient.post<ExpenseSplit>(`/splits/${splitId}/payment`);
  return response.data;
}

export async function approvePayment(
  splitId: string,
  payload?: PaymentActionPayload
): Promise<ExpenseSplit> {
  const response = await apiClient.post<ExpenseSplit>(
    `/splits/${splitId}/approve`,
    payload || {}
  );
  return response.data;
}

export async function rejectPayment(
  splitId: string,
  payload?: PaymentActionPayload
): Promise<ExpenseSplit> {
  const response = await apiClient.post<ExpenseSplit>(
    `/splits/${splitId}/reject`,
    payload || {}
  );
  return response.data;
}
