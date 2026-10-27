import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createJSONStorage, persist } from "zustand/middleware";

export interface SavingsGoal {
  id: string;
  name: string;
  target: number;
  saved: number;
  createdAt: string;
}

interface GoalState {
  goals: SavingsGoal[];
  addGoal: (name: string, target: number, saved: number) => void;
  removeGoal: (id: string) => void;
}

export const useGoalStore = create<GoalState>()(persist((set) => ({
  goals: [],
  addGoal: (name, target, saved) => set((state) => ({
    goals: [{ id: `${Date.now()}`, name: name.trim(), target, saved, createdAt: new Date().toISOString() }, ...state.goals],
  })),
  removeGoal: (id) => set((state) => ({ goals: state.goals.filter((goal) => goal.id !== id) })),
}), {
  name: "expense-tracker-savings-goals",
  storage: createJSONStorage(() => AsyncStorage),
}));
