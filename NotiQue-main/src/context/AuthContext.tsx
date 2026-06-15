/**
 * AuthContext
 *
 * Manages whether the user has completed the FULL onboarding:
 *   1. Google OAuth (userId obtained)
 *   2. WhatsApp pairing + group selection
 *
 * Only after BOTH steps does completeOnboarding() fire,
 * switching the root navigator from OnboardingNavigator → AppNavigator.
 *
 * Storage key: 'onboardingComplete' (not just 'userId') so a partial
 * onboarding (Google done, WhatsApp not done) restarts from WhatsApp1.
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Storage keys ─────────────────────────────────────────────────────────

/** Set only after Google OAuth + WhatsApp pairing + group selection all done. */
export const ONBOARDING_KEY = 'onboardingComplete';
/** Set when Google OAuth returns — used inside onboarding to skip ConnectGoogle. */
export const USER_ID_KEY = 'userId';

// ─── Types ────────────────────────────────────────────────────────────────

interface AuthContextValue {
  /** true = show AppNavigator, false = show OnboardingNavigator */
  hasCompletedOnboarding: boolean;
  /**
   * Called ONLY from SelectGroups after WhatsApp groups are chosen.
   * Marks full onboarding as done. Accepts an optional real userId.
   */
  completeOnboarding: (userId?: string) => Promise<void>;
  /** Clears all auth — used by Sign Out and Delete All My Data */
  signOut: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue>({
  hasCompletedOnboarding: false,
  completeOnboarding: async () => {},
  signOut: async () => {},
});

export function AuthProvider({
  children,
  initialHasCompletedOnboarding,
}: {
  children: React.ReactNode;
  initialHasCompletedOnboarding: boolean;
}) {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(
    initialHasCompletedOnboarding
  );

  const completeOnboarding = useCallback(
    async (userId: string = 'mock-user-123') => {
      // Store BOTH the userId and the completion flag
      await Promise.all([
        AsyncStorage.setItem(USER_ID_KEY, userId),
        AsyncStorage.setItem(ONBOARDING_KEY, 'true'),
      ]);
      setHasCompletedOnboarding(true);
    },
    []
  );

  const signOut = useCallback(async () => {
    // Clear everything — user goes back to full onboarding
    await Promise.all([
      AsyncStorage.removeItem(ONBOARDING_KEY),
      AsyncStorage.removeItem(USER_ID_KEY),
    ]);
    setHasCompletedOnboarding(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{ hasCompletedOnboarding, completeOnboarding, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
