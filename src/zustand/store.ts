import { create } from "zustand";


interface StoreState {
  // trạng thái đăng nhập
  isLogin: boolean;
  setIsLogin: (isLogin: boolean) => void;
  //signalR ID connection
  signalRConnectionId: string | null;
  setSignalRConnectionId: (connectionId: string | null) => void;
}

export const useStore = create<StoreState>((set) => ({
  isLogin: false,
  setIsLogin: (isLoginn) => set({ isLogin: isLoginn }),
  signalRConnectionId: null,
  setSignalRConnectionId: (connectionId) =>
    set({ signalRConnectionId: connectionId }),
}));
