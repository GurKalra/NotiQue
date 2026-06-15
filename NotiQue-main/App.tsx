import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';

import OnboardingNavigator from './src/navigation/OnboardingNavigator';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider, useAuth, ONBOARDING_KEY } from './src/context/AuthContext';
import { SettingsProvider } from './src/context/SettingsContext';

// Keep splash screen visible while fonts load
SplashScreen.preventAutoHideAsync();

// Inner component has access to AuthContext
function RootNavigator(): React.JSX.Element {
  const { hasCompletedOnboarding } = useAuth();
  return (
    <NavigationContainer>
      {hasCompletedOnboarding ? <AppNavigator /> : <OnboardingNavigator />}
    </NavigationContainer>
  );
}

export default function App(): React.JSX.Element | null {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [isAppReady, setIsAppReady] = useState(false);
  const [initialDone, setInitialDone] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Check for FULL onboarding completion (Google + WhatsApp both done)
        const done = await AsyncStorage.getItem(ONBOARDING_KEY);
        setInitialDone(done === 'true');
      } catch (e) {
        console.warn(e);
      }
    }
    prepare();
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
      setIsAppReady(true);
    }
  }, [fontsLoaded]);

  if (!isAppReady) return null;

  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <AuthProvider initialHasCompletedOnboarding={initialDone}>
          <RootNavigator />
        </AuthProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
