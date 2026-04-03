import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { User } from "@/types/user";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  token: null,
};


const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string | null }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.isLoading = false;
    },
    setUser: (state, action: PayloadAction<{ user: User; token?: string }>) => {
      state.user = action.payload.user;
      if (action.payload.token) state.token = action.payload.token;
      state.isAuthenticated = true;
    },
    logoutAction: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setCredentials, setUser, logoutAction, setLoading } =
  authSlice.actions;
export default authSlice.reducer;
