import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { colors } from '../config/colors';

interface OrangeButtonProps {
  label: string;
  onPress: () => void;
  backgroundColor?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function OrangeButton({
  label,
  onPress,
  backgroundColor,
  style,
  textStyle,
}: OrangeButtonProps): React.JSX.Element {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.button,
        backgroundColor ? { backgroundColor } : undefined,
        style,
      ]}
    >
      <Text style={[styles.label, textStyle]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.accentOrange,
    borderRadius: 10,
    height: 52,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: colors.textPrimary,
  },
});
