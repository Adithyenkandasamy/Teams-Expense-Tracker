import { create } from "zustand";
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
  addNotification: (item: Omit<NotificationItem, "id" | "timestamp" | "read"> & { route?: string }) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "init-1",
    title: "Welcome to Expense Tracker",
    body: "Your notifications and expense alerts will appear here in real time.",
    type: "SYSTEM",
    timestamp: new Date().toISOString(),
    read: false,
  },
];

let toastTimeout: any = null;

export const useNotificationStore = create<NotificationState>((set) => ({
  toast: null,
  notifications: INITIAL_NOTIFICATIONS,

  showToast: (data) => {
    const id = Date.now().toString();
    if (toastTimeout) {
      clearTimeout(toastTimeout);
    }
    set({ toast: { ...data, id } });
    toastTimeout = setTimeout(() => {
      set({ toast: null });
    }, 4500);
  },

  dismissToast: () => {
    if (toastTimeout) {
      clearTimeout(toastTimeout);
    }
    set({ toast: null });
  },

  addNotification: (item) => {
    const newNotif: NotificationItem = {
      id: Date.now().toString(),
      title: item.title,
      body: item.body,
      type: item.type as any,
      timestamp: new Date().toISOString(),
      read: false,
    };
    set((state) => ({
      notifications: [newNotif, ...state.notifications],
    }));
  },

  markAsRead: (id: string) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));
  },
}));
