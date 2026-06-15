import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../config/colors';

type Importance = 'high' | 'medium' | 'low';

interface ImportanceTagProps {
  importance: Importance;
}

const config: Record<Importance, { label: string; bg: string; text: string; border: string }> = {
  high: {
    label: 'High',
    bg: 'rgba(255, 68, 68, 0.15)',
    text: colors.high,
    border: colors.high,
  },
  medium: {
    label: 'Medium',
    bg: 'rgba(255, 107, 43, 0.15)',
    text: colors.accentOrange,
    border: colors.accentOrange,
  },
  low: {
    label: 'Low',
    bg: 'transparent',
    text: colors.textSecondary,
    border: colors.low,
  },
};

export default function ImportanceTag({ importance }: ImportanceTagProps): React.JSX.Element {
  const safeImportance: Importance =
    importance === 'high' || importance === 'medium' || importance === 'low'
      ? importance
      : 'medium';

  const { label, bg, text, border } = config[safeImportance];
  return (
    <View style={[styles.tag, { backgroundColor: bg, borderColor: border }]}>
      <Text style={[styles.label, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
  },
});