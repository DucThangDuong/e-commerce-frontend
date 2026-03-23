import { create } from "zustand";
import type { UserProfilePrivate } from "../interfaces/customer";

interface StoreState {
  // trạng thái đăng nhập
  isLogin: boolean;
  setIsLogin: (isLogin: boolean) => void;
  user: UserProfilePrivate | null;
  setUser: (user: UserProfilePrivate | null) => void;
  //signalR ID connection
  signalRConnectionId: string | null;
  setSignalRConnectionId: (connectionId: string | null) => void;
  // thông báo toàn cục
  notification: { message: string; visible: boolean; type: "success" | "error" } | null;
  showNotification: (message: string, type?: "success" | "error") => void;
  hideNotification: () => void;
}

export const useStore = create<StoreState>((set) => ({
  isLogin: false,
  setIsLogin: (isLoginn) => set({ isLogin: isLoginn }),
  signalRConnectionId: null,
  setSignalRConnectionId: (connectionId) =>
    set({ signalRConnectionId: connectionId }),
  user: null,
  setUser: (user) => set({ user }),
  notification: null,
  showNotification: (message, type = "success") => {
    set({ notification: { message, visible: true, type } });
    setTimeout(() => {
      set((state) =>
        state.notification?.message === message
          ? { notification: { ...state.notification, visible: false } }
          : state
      );
    }, 2000); // Tự động ẩn sau 2 giây
  },
  hideNotification: () =>
    set((state) =>
      state.notification
        ? { notification: { ...state.notification, visible: false } }
        : state
    ),
}));
