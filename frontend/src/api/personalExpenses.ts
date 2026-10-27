import { apiClient } from "./client";
import { PersonalExpense } from "../types/models";

export interface CreatePersonalExpensePayload {
  amount: string;
  description: string;
  category: string;
}

export async function getPersonalExpenses(year: number, month: number) {
  const response = await apiClient.get<PersonalExpense[]>("/personal-expenses", {
    params: { year, month },
  });
  return response.data;
}

export async function createPersonalExpense(data: CreatePersonalExpensePayload) {
  const response = await apiClient.post<PersonalExpense>("/personal-expenses", data);
  return response.data;
}

export async function deletePersonalExpense(id: string) {
  await apiClient.delete(`/personal-expenses/${id}`);
}
