import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import HomeFeed from '../screens/main/HomeFeed';
import Todo from '../screens/main/Todo';
import Info from '../screens/main/Info';
import Account from '../screens/main/Account';
import Chat from '../screens/main/Chat';
import ManageGroups from '../screens/main/ManageGroups';
import { colors } from '../config/colors';

export type MainTabParamList = {
  HomeFeed: undefined;
  Todo: undefined;
  Info: undefined;
  Account: undefined;
};

export type AppStackParamList = {
  MainTabs: undefined;
  Chat: undefined;
  ManageGroups: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<AppStackParamList>();

// How tall the floating pill is
export const TAB_BAR_HEIGHT = 72;

function MainTabs() {
  const insets = useSafeAreaInsets();

  // The pill floats 12px above the home indicator / gesture bar
  const floatGap = 12;
  const tabBarBottom = insets.bottom + floatGap;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        // ── The floating pill style ──────────────────────────────────────
        tabBarStyle: {
          position: 'absolute',
          bottom: tabBarBottom,
          left: 20,
          right: 20,
          height: TAB_BAR_HEIGHT,
          borderRadius: 24,
          backgroundColor: colors.bgCard,
          borderTopWidth: 0,            // removes the default RN top border
          borderWidth: 1,
          borderColor: colors.bgBorder,
          // Natural shadow — not too heavy
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.25,
          shadowRadius: 14,
          elevation: 14,
          // Vertical padding: balanced top/bottom so icons sit centrally
          paddingTop: 12,
          paddingBottom: Platform.OS === 'ios' ? 10 : 12,
        },
        tabBarActiveTintColor: colors.accentOrange,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontFamily: 'Inter_400Regular',
          fontSize: 10,
          marginTop: 0,
        },
      }}
    >
      <Tab.Screen
        name="HomeFeed"
        component={HomeFeed}
        options={{
          tabBarLabel: 'Feed',
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Todo"
        component={Todo}
        options={{
          tabBarLabel: 'Todo',
          tabBarIcon: ({ color, size }) => (
            <Feather name="check-square" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Info"
        component={Info}
        options={{
          tabBarLabel: 'Info',
          tabBarIcon: ({ color, size }) => (
            <Feather name="info" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Account"
        component={Account}
        options={{
          tabBarLabel: 'Your Account',
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'fade_from_bottom',
        animationDuration: 280,
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} />
      {/* Chat slides up from bottom, taking the full screen over the tabs */}
      <Stack.Screen
        name="Chat"
        component={Chat}
        options={{ animation: 'slide_from_bottom' }}
      />
      {/* ManageGroups: opened from Account, has back button */}
      <Stack.Screen
        name="ManageGroups"
        component={ManageGroups}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({});
