import { create } from "zustand";

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  login: (token, user) => {
    localStorage.setItem("carboniq_token", token);
    localStorage.setItem("carboniq_user", JSON.stringify(user));
    set({ user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem("carboniq_token");
    localStorage.removeItem("carboniq_user");
    set({ user: null, isAuthenticated: false });
  },

  hydrate: () => {
    const token = localStorage.getItem("carboniq_token");
    const userStr = localStorage.getItem("carboniq_user");
    if (token && userStr) {
      set({ user: JSON.parse(userStr), isAuthenticated: true });
    }
  },
}));
