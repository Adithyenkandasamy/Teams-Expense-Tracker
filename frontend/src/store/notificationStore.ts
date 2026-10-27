import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createJSONStorage, persist } from "zustand/middleware";
import { NotificationItem } from "../types/models";

export interface ToastData {
  id: string;
  title: string;
  body: string;
  type?: string;
  route?: string;
}

interface NotificationState {
  toast: ToastData | null;
  notifications: NotificationItem[];
  showToast: (data: Omit<ToastData, "id">) => void;
  dismissToast: () => void;
  addNotification: (item: Omit<NotificationItem, "id" | "timestamp" | "read"> & { id?: string }) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

let toastTimeout: any = null;

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      toast: null,
      notifications: [],

      showToast: (data) => {
        const id = Date.now().toString();
        if (toastTimeout) clearTimeout(toastTimeout);
        set({ toast: { ...data, id } });
        toastTimeout = setTimeout(() => set({ toast: null }), 4500);
      },

      dismissToast: () => {
        if (toastTimeout) clearTimeout(toastTimeout);
        set({ toast: null });
      },

      addNotification: (item) => {
        const newNotif: NotificationItem = {
          id: item.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          title: item.title,
          body: item.body,
          type: item.type,
          timestamp: new Date().toISOString(),
          read: false,
          route: item.route,
          data: item.data,
        };
        set((state) => {
          if (state.notifications.some((notification) => notification.id === newNotif.id)) return state;
          return { notifications: [newNotif, ...state.notifications].slice(0, 100) };
        });
      },

      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) => n.id === id ? { ...n, read: true } : n),
        }));
      },

      markAllAsRead: () => {
        set((state) => ({ notifications: state.notifications.map((n) => ({ ...n, read: true })) }));
      },
    }),
    {
      name: "expense-tracker-notifications",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ notifications: state.notifications }),
    }
  )
);
