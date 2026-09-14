import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { IUser, IUserLogin, IUserRegistration } from '@packleader/shared';
import { AUTH_TOKEN_KEY } from '../config/api';
import { fetchCurrentUser, loginUser, logoutUser, registerUser } from '../services/auth.api';

interface AuthState {
  user: IUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (user: IUser, token: string) => Promise<void>;
  signIn: (credentials: IUserLogin) => Promise<void>;
  signUp: (payload: IUserRegistration) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: IUser) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authentication context provider.
 * Manages JWT tokens, authenticated user state, and connects to the backend auth API.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Check for existing token on mount and validate with backend
  useEffect(() => {
    const loadToken = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
        if (storedToken) {
          try {
            const user = await fetchCurrentUser();
            setState({
              user,
              token: storedToken,
              isAuthenticated: true,
              isLoading: false,
            });
            return;
          } catch (err) {
            console.warn('[AuthContext] Stored token invalid or expired:', err);
            await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
          }
        }
      } catch (err) {
        console.warn('[AuthContext] Error reading auth token:', err);
      }

      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    };

    loadToken();
  }, []);

  const login = useCallback(async (user: IUser, token: string) => {
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
    setState({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const signIn = useCallback(async (credentials: IUserLogin) => {
    const authResponse = await loginUser(credentials);
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, authResponse.token);
    setState({
      user: authResponse.user,
      token: authResponse.token,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const signUp = useCallback(async (payload: IUserRegistration) => {
    const authResponse = await registerUser(payload);
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, authResponse.token);
    setState({
      user: authResponse.user,
      token: authResponse.token,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch {
      // Ignore network errors when logging out
    }
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const updateUser = useCallback((user: IUser) => {
    setState((prev) => ({ ...prev, user }));
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const user = await fetchCurrentUser();
      setState((prev) => ({ ...prev, user }));
    } catch (err) {
      console.warn('[AuthContext] Failed to refresh user profile:', err);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        signIn,
        signUp,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context.
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
