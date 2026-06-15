import React from 'react';
import { TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../config/colors';
import { TAB_BAR_HEIGHT } from '../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<any>;

const FLOAT_GAP = 12; // must match AppNavigator

export default function RobotFAB() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();

  // Sit exactly 12px above the top of the floating tab bar pill
  const fabBottom = insets.bottom + FLOAT_GAP + TAB_BAR_HEIGHT + 12;

  return (
    <TouchableOpacity
      style={[styles.fab, { bottom: fabBottom }]}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('Chat')}
    >
      <Image
        source={require('../../assets/cutie-bot.png')}
        style={styles.icon}
        resizeMode="contain"
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.bgCard,
    borderWidth: 1.5,
    borderColor: colors.accentOrange,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accentOrange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 12,
    zIndex: 999,
  },
  icon: {
    width: 42,
    height: 42,
  },
});
