import { apiClient } from "./client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SavingsTarget, SavingsTargetSummary } from "../types/models";

export interface SavingsTargetPayload {
  name: string;
  target_amount: number;
  saved_amount: number;
  funding_mode?: "MANUAL" | "WALLET";
  target_date?: string | null;
}

export async function getSavingsTargets(): Promise<SavingsTarget[]> {
  const response = await apiClient.get<SavingsTarget[]>("/savings-targets");
  const remoteTargets = response.data;
  const legacyData = await AsyncStorage.getItem("expense-tracker-savings-goals");
  if (!legacyData) return remoteTargets;

  try {
    const parsed = JSON.parse(legacyData);
    const legacyGoals = Array.isArray(parsed?.state?.goals) ? parsed.state.goals : [];
    let changedRemote = false;
    for (const goal of legacyGoals) {
      const targetAmount = Number(goal.target);
      const savedAmount = Number(goal.saved) || 0;
      const alreadyExists = remoteTargets.some((target) =>
        target.name === goal.name
        && Number(target.target_amount) === targetAmount
        && Number(target.saved_amount) === savedAmount,
      );
      if (goal.name && Number.isFinite(targetAmount) && targetAmount > 0 && savedAmount >= 0 && !alreadyExists) {
        await createSavingsTarget({ name: goal.name, target_amount: targetAmount, saved_amount: savedAmount });
        changedRemote = true;
      }
    }
    await AsyncStorage.removeItem("expense-tracker-savings-goals");
    if (changedRemote) {
      const updated = await apiClient.get<SavingsTarget[]>("/savings-targets");
      return updated.data;
    }
  } catch {
    // Keep the legacy value if the migration request fails, so it can retry later.
    return remoteTargets;
  }
  return remoteTargets;
}

export async function createSavingsTarget(payload: SavingsTargetPayload): Promise<SavingsTarget> {
  const response = await apiClient.post<SavingsTarget>("/savings-targets", payload);
  return response.data;
}

export async function getSavingsTargetSummary(): Promise<SavingsTargetSummary> {
  const response = await apiClient.get<SavingsTargetSummary>("/savings-targets/summary");
  return response.data;
}

export async function addManualContribution(
  id: string,
  amount: number,
  note?: string,
): Promise<SavingsTarget> {
  const response = await apiClient.post<SavingsTarget>(`/savings-targets/${id}/contributions`, {
    amount,
    note,
  });
  return response.data;
}

export async function updateSavingsTarget(
  id: string,
  payload: Partial<SavingsTargetPayload>,
): Promise<SavingsTarget> {
  const response = await apiClient.patch<SavingsTarget>(`/savings-targets/${id}`, payload);
  return response.data;
}

export async function deleteSavingsTarget(id: string): Promise<void> {
  await apiClient.delete(`/savings-targets/${id}`);
}
