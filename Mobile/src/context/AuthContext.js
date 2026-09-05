import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, setAuthToken } from '../services/api';

const TOKEN_KEY = 'kinbech_token';
const USER_KEY = 'kinbech_user';
const ONBOARD_KEY = 'kinbech_onboarded';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [onboarded, setOnboarded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [[, storedToken], [, storedUser], [, storedOnboard]] =
          await AsyncStorage.multiGet([TOKEN_KEY, USER_KEY, ONBOARD_KEY]);

        if (cancelled) return;

        setOnboarded(storedOnboard === '1');

        if (storedToken) {
          setAuthToken(storedToken);
          setToken(storedToken);
          if (storedUser) {
            try {
              setUser(JSON.parse(storedUser));
            } catch (_error) {
              // ignore
            }
          }

          const { data, error } = await api.me();
          if (cancelled) return;
          if (data?.user) {
            setUser(data.user);
            await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
          } else if (error) {
            setAuthToken(null);
            setToken(null);
            setUser(null);
            await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
          }
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      ready,
      onboarded,
      isLoggedIn: Boolean(token),
      async saveSession(nextToken, nextUser) {
        setAuthToken(nextToken);
        setToken(nextToken);
        setUser(nextUser);
        await AsyncStorage.multiSet([
          [TOKEN_KEY, nextToken],
          [USER_KEY, JSON.stringify(nextUser)],
        ]);
      },
      async refreshUser() {
        const { data, error } = await api.me();
        if (data?.user && !error) {
          setUser(data.user);
          await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
          return { user: data.user, error: null };
        }
        return { user: null, error };
      },
      async logout() {
        setAuthToken(null);
        setToken(null);
        setUser(null);
        await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
      },
      async completeOnboarding() {
        setOnboarded(true);
        await AsyncStorage.setItem(ONBOARD_KEY, '1');
      },
    }),
    [token, user, ready, onboarded]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
