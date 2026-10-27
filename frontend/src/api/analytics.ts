import { apiClient } from "./client";
import { MonthlySpendingResponse } from "../types/models";

export async function getMonthlySpending(months = 6) {
  const response = await apiClient.get<MonthlySpendingResponse>("/analytics/monthly", {
    params: { months },
  });
  return response.data;
}
