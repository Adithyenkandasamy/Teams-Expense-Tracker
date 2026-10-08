/**
 * Expenses API module.
 */

import { apiClient } from "./client";
import { Expense } from "../types/models";
import { CreateExpensePayload } from "../types/api";

export async function getGroupExpenses(groupId: string): Promise<Expense[]> {
  const response = await apiClient.get<Expense[]>(`/groups/${groupId}/expenses`);
  return response.data;
}

export async function getExpenseDetail(expenseId: string): Promise<Expense> {
  const response = await apiClient.get<Expense>(`/expenses/${expenseId}`);
  return response.data;
}

export async function createExpense(
  groupId: string,
  data: CreateExpensePayload
): Promise<Expense> {
  const response = await apiClient.post<Expense>(`/groups/${groupId}/expenses`, data);
  return response.data;
}

export async function uploadReceipt(
  expenseId: string,
  fileUri: string,
  fileName?: string
): Promise<Expense> {
  const formData = new FormData();
  formData.append("file", {
    uri: fileUri,
    name: fileName || "receipt.jpg",
    type: "image/jpeg",
  } as any);

  const response = await apiClient.post<Expense>(
    `/expenses/${expenseId}/receipt`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
}

export async function closeExpense(expenseId: string): Promise<Expense> {
  const response = await apiClient.post<Expense>(`/expenses/${expenseId}/close`);
  return response.data;
}
