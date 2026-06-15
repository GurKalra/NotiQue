import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Welcome from '../screens/onboarding/Welcome';
import ConnectGoogle from '../screens/onboarding/ConnectGoogle';
import WhatsApp1 from '../screens/onboarding/WhatsApp1';
import WhatsApp2 from '../screens/onboarding/WhatsApp2';
import WhatsApp3 from '../screens/onboarding/WhatsApp3';
import WhatsApp4 from '../screens/onboarding/WhatsApp4';
import SelectGroups from '../screens/onboarding/SelectGroups';

export type OnboardingStackParamList = {
  Welcome: undefined;
  ConnectGoogle: undefined;
  WhatsApp1: undefined;
  WhatsApp2: undefined;
  WhatsApp3: { pairingCode: string; phoneNumber: string; expiresIn?: number };
  WhatsApp4: undefined;
  SelectGroups: undefined;
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export default function OnboardingNavigator(): React.JSX.Element {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerShown: false,
        animation: 'fade_from_bottom',
        animationDuration: 350,
      }}
    >
      <Stack.Screen name="Welcome" component={Welcome} />
      <Stack.Screen name="ConnectGoogle" component={ConnectGoogle} />
      <Stack.Screen name="WhatsApp1" component={WhatsApp1} />
      <Stack.Screen name="WhatsApp2" component={WhatsApp2} />
      <Stack.Screen name="WhatsApp3" component={WhatsApp3} />
      <Stack.Screen name="WhatsApp4" component={WhatsApp4} />
      <Stack.Screen name="SelectGroups" component={SelectGroups} />
    </Stack.Navigator>
  );
}