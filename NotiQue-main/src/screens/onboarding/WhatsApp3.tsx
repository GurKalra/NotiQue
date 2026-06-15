import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { colors } from '../../config/colors';
import { API } from '../../config/api';
import type { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';

type WhatsApp3NavigationProp = NativeStackNavigationProp<
  OnboardingStackParamList,
  'WhatsApp3'
>;

type WhatsApp3RouteProp = RouteProp<OnboardingStackParamList, 'WhatsApp3'>;

interface WhatsApp3Props {
  navigation: WhatsApp3NavigationProp;
  route: WhatsApp3RouteProp;
}

// ---------- Step indicator icons (matching the mockup exactly) ----------

function LinkIcon(): React.JSX.Element {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"
        stroke={colors.accentOrange}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"
        stroke={colors.accentOrange}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PhoneIcon(): React.JSX.Element {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Rect
        x={7}
        y={2}
        width={10}
        height={20}
        rx={2}
        stroke={colors.accentOrange}
        strokeWidth={2}
      />
      <Path
        d="M12 18h.01"
        stroke={colors.accentOrange}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function CodeIcon(): React.JSX.Element {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Rect
        x={3}
        y={3}
        width={18}
        height={18}
        rx={2}
        stroke={colors.accentOrange}
        strokeWidth={2}
      />
      <Rect
        x={7}
        y={7}
        width={4}
        height={4}
        fill={colors.accentOrange}
      />
      <Rect
        x={13}
        y={7}
        width={4}
        height={4}
        fill={colors.accentOrange}
      />
      <Rect
        x={7}
        y={13}
        width={4}
        height={4}
        fill={colors.accentOrange}
      />
      <Rect
        x={13}
        y={13}
        width={4}
        height={2}
        fill={colors.accentOrange}
      />
    </Svg>
  );
}

function CheckCircleIcon(): React.JSX.Element {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle
        cx={12}
        cy={12}
        r={10}
        stroke={colors.accentOrange}
        strokeWidth={2}
      />
      <Path
        d="M9 12l2 2 4-4"
        stroke={colors.accentOrange}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CopyIcon(): React.JSX.Element {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Rect
        x={9}
        y={9}
        width={13}
        height={13}
        rx={2}
        stroke={colors.accentOrange}
        strokeWidth={2}
      />
      <Path
        d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"
        stroke={colors.accentOrange}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ---------- Step indicator arrow ----------

function ArrowRight(): React.JSX.Element {
  return <Text style={styles.arrow}>→</Text>;
}

// ---------- Constants ----------

const INITIAL_SECONDS = 60;
const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 10; // ~20 seconds total

// ---------- Main component ----------

export default function WhatsApp3({
  navigation,
  route,
}: WhatsApp3Props): React.JSX.Element {
  const { pairingCode: initialCode, phoneNumber, expiresIn } = route.params;
  const [code, setCode] = useState(initialCode);
  const [secondsLeft, setSecondsLeft] = useState(expiresIn ?? INITIAL_SECONDS);
  const [copied, setCopied] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  // Resend is disabled while countdown is running; enabled when it hits 0
  const canResend = secondsLeft === 0 && !resendLoading;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback((seconds: number = INITIAL_SECONDS) => {
    setSecondsLeft(seconds);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    startTimer(expiresIn ?? INITIAL_SECONDS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startTimer, expiresIn]);

  const handleCopyCode = useCallback(async () => {
    await Clipboard.setStringAsync(code.replace('-', ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  const handleResendCode = useCallback(async (): Promise<void> => {
    if (!canResend) return;
    setResendLoading(true);
    try {
      // Step 1: trigger resend — bridge starts resetting the session
      const res = await fetch(API.whatsappResend, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });

      if (!res.ok) {
        throw new Error('Resend request failed');
      }

      // Step 2: poll for the new pairing code
      let attempts = 0;
      let newCode: string | null = null;
      let pollError = false;

      while (attempts < MAX_POLL_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
        const statusRes = await fetch(API.whatsappPairingStatus);
        const statusData = await statusRes.json();

        if (statusData.ready) {
          if (statusData.error) {
            pollError = true;
          } else {
            newCode = statusData.pairingCode;
          }
          break;
        }
        attempts++;
      }

      if (newCode) {
        setCode(newCode);
        startTimer(INITIAL_SECONDS);
      } else if (pollError) {
        throw new Error('Failed to generate new code');
      } else {
        throw new Error('Timed out waiting for new code');
      }
    } catch {
      Alert.alert("Couldn't generate new code", 'Please try again.');
      // Button stays tappable (don't reset timer), user can retry
    } finally {
      setResendLoading(false);
    }
  }, [canResend, phoneNumber, startTimer]);

  const handleCodeEntered = async (): Promise<void> => {
    setCheckingStatus(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      const res = await fetch(API.whatsappStatus, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId ?? '',
        },
      });
      const data = await res.json();

      if (data.connected) {
        navigation.navigate('WhatsApp4');
      } else {
        Alert.alert(
          'Not connected yet',
          'Please make sure you entered the code in WhatsApp.'
        );
      }
    } catch {
      Alert.alert(
        'Something went wrong',
        'Could not verify connection status. Please try again.'
      );
    } finally {
      setCheckingStatus(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      bounces={false}
    >
      <StatusBar style="light" />

      {/* Top bar — small logo left, grad cap right */}
      <View style={styles.topBar}>
        <View style={styles.topLogoBox}>
          <Text style={styles.topLogoText}>NQ</Text>
        </View>
        <Image
          source={require('../../../assets/grad-cap.png')}
          style={styles.topGradCap}
          resizeMode="contain"
        />
      </View>

      {/* Title section */}
      <View style={styles.titleSection}>
        <Text style={styles.heading}>Link Your Device</Text>
        <Text style={styles.subtitle}>
          Connect your whatsapp to{'\n'}get started
        </Text>
      </View>

      {/* Step indicators */}
      <View style={styles.stepsContainer}>
        <View style={styles.stepsRow}>
          <View style={styles.stepItem}>
            <View style={styles.stepIconCircle}>
              <LinkIcon />
            </View>
            <Text style={styles.stepLabel}>Go to Linked{'\n'}Devices</Text>
          </View>

          <ArrowRight />

          <View style={styles.stepItem}>
            <View style={styles.stepIconCircle}>
              <PhoneIcon />
            </View>
            <Text style={styles.stepLabel}>Link with{'\n'}phone number</Text>
          </View>

          <ArrowRight />

          <View style={styles.stepItem}>
            <View style={styles.stepIconCircle}>
              <CodeIcon />
            </View>
            <Text style={styles.stepLabel}>Enter this{'\n'}code</Text>
          </View>

          <ArrowRight />

          <View style={styles.stepItem}>
            <View style={[styles.stepIconCircle, styles.stepIconActive]}>
              <CheckCircleIcon />
            </View>
            <Text style={[styles.stepLabel, styles.stepLabelActive]}>
              Add a Linked{'\n'}Device
            </Text>
          </View>
        </View>
      </View>

      {/* Pairing code display box */}
      <View style={styles.codeBox}>
        <Text style={styles.codeText}>{code}</Text>
        <Text
          style={[
            styles.expiryText,
            secondsLeft <= 10 && styles.expiryTextUrgent,
          ]}
        >
          {secondsLeft > 0
            ? `Code expires in ${secondsLeft} seconds`
            : 'Code expired'}
        </Text>

        {/* Copy code button */}
        <TouchableOpacity
          style={styles.copyButton}
          activeOpacity={0.7}
          onPress={handleCopyCode}
        >
          <CopyIcon />
          <Text style={styles.copyButtonText}>
            {copied ? 'Copied!' : 'Copy Code'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Resend Code — greyed while countdown running, orange when timer hits 0 */}
      <TouchableOpacity
        activeOpacity={canResend ? 0.7 : 1}
        onPress={handleResendCode}
        style={[styles.resendButton, !canResend && styles.resendButtonDisabled]}
        disabled={!canResend}
      >
        {resendLoading ? (
          <ActivityIndicator size="small" color={colors.accentOrange} />
        ) : (
          <Text style={[styles.resendText, !canResend && styles.resendTextDisabled]}>
            Resend Code
          </Text>
        )}
      </TouchableOpacity>

      {/* Bottom — I have entered the code */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleCodeEntered}
          style={styles.confirmButton}
          disabled={checkingStatus}
        >
          {checkingStatus ? (
            <ActivityIndicator size="small" color={colors.accentOrange} />
          ) : (
            <Text style={styles.confirmButtonText}>I have entered the code</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 52,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 12,
  },
  topLogoBox: {
    width: 48,
    height: 48,
    backgroundColor: colors.accentOrange,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topLogoText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: colors.textPrimary,
  },
  topGradCap: {
    width: 56,
    height: 56,
  },
  titleSection: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  heading: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: colors.accentOrange,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
  },
  // Step indicators
  stepsContainer: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.bgBorder,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginBottom: 24,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  stepItem: {
    alignItems: 'center',
    width: 68,
  },
  stepIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: colors.bgBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepIconActive: {
    borderColor: colors.accentOrange,
  },
  stepLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 14,
  },
  stepLabelActive: {
    color: colors.accentOrange,
    fontFamily: 'Inter_600SemiBold',
  },
  arrow: {
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: 10,
    marginHorizontal: 2,
  },
  // Code box
  codeBox: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.bgBorder,
    borderRadius: 12,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  codeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 36,
    color: colors.textPrimary,
    letterSpacing: 4,
    marginBottom: 12,
  },
  expiryText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.accentOrange,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  expiryTextUrgent: {
    color: colors.high,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.bgBorder,
    borderRadius: 8,
  },
  copyButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: colors.accentOrange,
  },
  // Resend
  resendButton: {
    alignSelf: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.accentOrange,
  },
  resendButtonDisabled: {
    borderColor: colors.bgBorder,
    opacity: 0.5,
  },
  resendText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: colors.accentOrange,
  },
  resendTextDisabled: {
    color: colors.textSecondary,
  },
  // Bottom
  bottomSection: {
    alignItems: 'center',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.bgBorder,
    borderRadius: 10,
    height: 52,
    width: '100%',
  },
  confirmButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: colors.accentOrange,
  },
});