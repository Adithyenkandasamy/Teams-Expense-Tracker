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

const CACHE_KEY = "expense-tracker-cached-targets-v1";
const LEGACY_KEY = "expense-tracker-savings-goals";

async function getLocalTargets(): Promise<SavingsTarget[]> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Failed reading cached savings targets:", err);
  }

  // Fallback to legacy goals key from previous Zustand store
  try {
    const legacyRaw = await AsyncStorage.getItem(LEGACY_KEY);
    if (legacyRaw) {
      const parsed = JSON.parse(legacyRaw);
      const legacyGoals = Array.isArray(parsed?.state?.goals) ? parsed.state.goals : [];
      if (legacyGoals.length > 0) {
        const converted: SavingsTarget[] = legacyGoals.map((g: any, index: number) => ({
          id: g.id ? String(g.id) : `local-${Date.now()}-${index}`,
          name: String(g.name || "Goal"),
          target_amount: Number(g.target) || 0,
          saved_amount: Number(g.saved) || 0,
          funding_mode: "MANUAL",
          target_date: null,
          status: (Number(g.saved) || 0) >= (Number(g.target) || 0) ? "COMPLETED" : "ACTIVE",
          created_at: g.createdAt || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(converted));
        return converted;
      }
    }
  } catch (err) {
    console.warn("Failed reading legacy goals:", err);
  }

  return [];
}

async function saveLocalTargets(targets: SavingsTarget[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(targets));
    // Keep legacy store synchronized so old components don't desync
    const legacyShape = {
      state: {
        goals: targets.map((t) => ({
          id: t.id,
          name: t.name,
          target: Number(t.target_amount) || 0,
          saved: Number(t.saved_amount) || 0,
          createdAt: t.created_at,
        })),
      },
      version: 0,
    };
    await AsyncStorage.setItem(LEGACY_KEY, JSON.stringify(legacyShape));
  } catch (err) {
    console.warn("Failed saving targets locally:", err);
  }
}

export function computeSummaryFromTargets(targets: SavingsTarget[]): SavingsTargetSummary {
  const active = targets.filter(
    (t) => t.status !== "COMPLETED" && Number(t.saved_amount) < Number(t.target_amount)
  );
  const completed = targets.filter(
    (t) => t.status === "COMPLETED" || Number(t.saved_amount) >= Number(t.target_amount)
  );
  const total_saved = targets.reduce((sum, t) => sum + (Number(t.saved_amount) || 0), 0);
  const total_remaining = active.reduce(
    (sum, t) => sum + Math.max((Number(t.target_amount) || 0) - (Number(t.saved_amount) || 0), 0),
    0
  );

  return {
    total_saved,
    active_targets: active.length,
    completed_targets: completed.length,
    total_remaining,
  };
}

export async function getSavingsTargets(): Promise<SavingsTarget[]> {
  const localTargets = await getLocalTargets();

  try {
    const response = await apiClient.get<SavingsTarget[]>("/savings-targets");
    const remoteTargets = Array.isArray(response.data) ? response.data : [];

    // Push any targets created purely offline to remote if reachable
    const newOfflineTargets = localTargets.filter(
      (lt) =>
        !remoteTargets.some(
          (rt) =>
            rt.id === lt.id ||
            (rt.name === lt.name && Number(rt.target_amount) === Number(lt.target_amount))
        )
    );

    if (newOfflineTargets.length > 0) {
      for (const offTarget of newOfflineTargets) {
        try {
          await apiClient.post("/savings-targets", {
            name: offTarget.name,
            target_amount: Number(offTarget.target_amount),
            saved_amount: Number(offTarget.saved_amount),
            funding_mode: offTarget.funding_mode || "MANUAL",
            target_date: offTarget.target_date,
          });
        } catch {
          // Keep in local cache even if remote sync fails
        }
      }

      try {
        const recheck = await apiClient.get<SavingsTarget[]>("/savings-targets");
        if (Array.isArray(recheck.data) && recheck.data.length > 0) {
          await saveLocalTargets(recheck.data);
          return recheck.data;
        }
      } catch {
        // Fall back to local
      }
    }

    if (remoteTargets.length > 0 || localTargets.length === 0) {
      await saveLocalTargets(remoteTargets);
      return remoteTargets;
    }

    return localTargets;
  } catch (error) {
    // Graceful offline fallback: Never throw and break the UI
    console.warn("Savings targets API unavailable, falling back to local storage:", error);
    return localTargets;
  }
}

export async function getSavingsTargetSummary(): Promise<SavingsTargetSummary> {
  try {
    const response = await apiClient.get<SavingsTargetSummary>("/savings-targets/summary");
    if (response.data && typeof response.data.active_targets === "number") {
      return response.data;
    }
  } catch (error) {
    console.warn("Savings target summary API unavailable, calculating from local targets:", error);
  }

  const targets = await getLocalTargets();
  return computeSummaryFromTargets(targets);
}

export async function createSavingsTarget(payload: SavingsTargetPayload): Promise<SavingsTarget> {
  const localTarget: SavingsTarget = {
    id: `target-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: payload.name.trim(),
    target_amount: payload.target_amount,
    saved_amount: payload.saved_amount,
    funding_mode: payload.funding_mode || "MANUAL",
    target_date: payload.target_date || null,
    status: payload.saved_amount >= payload.target_amount ? "COMPLETED" : "ACTIVE",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const current = await getLocalTargets();
  const updated = [localTarget, ...current];
  await saveLocalTargets(updated);

  try {
    const response = await apiClient.post<SavingsTarget>("/savings-targets", payload);
    if (response.data && response.data.id) {
      const reconciled = updated.map((t) => (t.id === localTarget.id ? response.data : t));
      await saveLocalTargets(reconciled);
      return response.data;
    }
  } catch (err) {
    console.warn("Target saved locally; remote sync deferred:", err);
  }

  return localTarget;
}

export async function updateSavingsTarget(
  id: string,
  payload: Partial<SavingsTargetPayload>
): Promise<SavingsTarget> {
  const current = await getLocalTargets();
  let updatedTarget: SavingsTarget | undefined;

  const updated = current.map((t) => {
    if (t.id === id) {
      const newSaved =
        payload.saved_amount !== undefined ? Number(payload.saved_amount) : Number(t.saved_amount);
      const newTargetAmount =
        payload.target_amount !== undefined
          ? Number(payload.target_amount)
          : Number(t.target_amount);
      const newName = payload.name !== undefined ? payload.name.trim() : t.name;
      updatedTarget = {
        ...t,
        name: newName,
        target_amount: newTargetAmount,
        saved_amount: newSaved,
        status: newSaved >= newTargetAmount ? "COMPLETED" : "ACTIVE",
        updated_at: new Date().toISOString(),
      };
      return updatedTarget;
    }
    return t;
  });

  if (!updatedTarget) {
    updatedTarget = {
      id,
      name: payload.name || "Target",
      target_amount: payload.target_amount || 0,
      saved_amount: payload.saved_amount || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    updated.unshift(updatedTarget);
  }

  await saveLocalTargets(updated);

  try {
    const response = await apiClient.patch<SavingsTarget>(`/savings-targets/${id}`, payload);
    if (response.data) {
      const reconciled = updated.map((t) => (t.id === id ? response.data : t));
      await saveLocalTargets(reconciled);
      return response.data;
    }
  } catch (err) {
    console.warn("Target updated locally; remote sync deferred:", err);
  }

  return updatedTarget;
}

export async function addManualContribution(
  id: string,
  amount: number,
  note?: string
): Promise<SavingsTarget> {
  const current = await getLocalTargets();
  let updatedTarget: SavingsTarget | undefined;

  const updated = current.map((t) => {
    if (t.id === id) {
      const newSaved = (Number(t.saved_amount) || 0) + Number(amount);
      const targetAmt = Number(t.target_amount) || 0;
      updatedTarget = {
        ...t,
        saved_amount: newSaved,
        status: newSaved >= targetAmt ? "COMPLETED" : "ACTIVE",
        updated_at: new Date().toISOString(),
      };
      return updatedTarget;
    }
    return t;
  });

  if (updatedTarget) {
    await saveLocalTargets(updated);
  }

  try {
    const response = await apiClient.post<SavingsTarget>(`/savings-targets/${id}/contributions`, {
      amount,
      note,
    });
    if (response.data) {
      const reconciled = updated.map((t) => (t.id === id ? response.data : t));
      await saveLocalTargets(reconciled);
      return response.data;
    }
  } catch (err) {
    console.warn("Contribution added locally; remote sync deferred:", err);
  }

  return updatedTarget || (await updateSavingsTarget(id, { saved_amount: amount }));
}

export async function deleteSavingsTarget(id: string): Promise<void> {
  const current = await getLocalTargets();
  const updated = current.filter((t) => t.id !== id);
  await saveLocalTargets(updated);

  try {
    await apiClient.delete(`/savings-targets/${id}`);
  } catch (err) {
    console.warn("Target deletion performed locally; remote sync deferred:", err);
  }
}
