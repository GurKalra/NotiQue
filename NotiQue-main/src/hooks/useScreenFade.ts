import { useRef, useCallback } from 'react';
import { Animated } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

/**
 * Returns an animated opacity value that fades in (0 → 1) every time
 * the screen receives focus, and resets to 0 when it loses focus.
 * Attach to your root <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
 */
export function useScreenFade(durationMs = 280) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      // Fade in when the screen gains focus
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: durationMs,
        useNativeDriver: true,
      }).start();

      // Reset immediately when losing focus so the next focus sees a fresh fade-in
      return () => {
        fadeAnim.setValue(0);
      };
    }, [fadeAnim, durationMs])
  );

  return fadeAnim;
}
