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

export async function getMyExpenses(): Promise<Expense[]> {
  const response = await apiClient.get<Expense[]>("/expenses");
  return response.data;
}

export async function getUserExpenses(groups?: { id: string }[]): Promise<Expense[]> {
  try {
    const response = await apiClient.get<Expense[]>("/expenses");
    return response.data;
  } catch (err: any) {
    // Graceful fallback for backwards compatibility if /expenses is unavailable
    if (groups && groups.length > 0) {
      const promises = groups.map((g) =>
        getGroupExpenses(g.id).catch(() => [] as Expense[])
      );
      const res = await Promise.all(promises);
      return res.flat();
    }
    return [];
  }
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

import { Platform } from "react-native";

export async function uploadReceipt(
  expenseId: string,
  fileUri: string,
  fileName?: string
): Promise<Expense> {
  const formData = new FormData();

  if (Platform.OS === "web") {
    const res = await fetch(fileUri);
    const blob = await res.blob();
    formData.append("file", blob, fileName || "receipt.jpg");
  } else {
    formData.append("file", {
      uri: fileUri,
      name: fileName || "receipt.jpg",
      type: "image/jpeg",
    } as any);
  }

  const response = await apiClient.post<Expense>(
    `/expenses/${expenseId}/receipt`,
    formData,
    Platform.OS === "web"
      ? undefined
      : {
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
