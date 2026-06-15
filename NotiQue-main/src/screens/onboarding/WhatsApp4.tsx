import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle, Path } from 'react-native-svg';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../../config/colors';
import OrangeButton from '../../components/OrangeButton';
import type { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';

type WhatsApp4NavigationProp = NativeStackNavigationProp<
  OnboardingStackParamList,
  'WhatsApp4'
>;

interface WhatsApp4Props {
  navigation: WhatsApp4NavigationProp;
}

function LargeCheckCircle(): React.JSX.Element {
  return (
    <Svg width={100} height={100} viewBox="0 0 24 24" fill="none">
      <Circle
        cx={12}
        cy={12}
        r={10}
        stroke={colors.success}
        strokeWidth={1.5}
      />
      <Path
        d="M9 12l2 2 4-4"
        stroke={colors.success}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LargeArrowCircle(): React.JSX.Element {
  return (
    <Svg width={120} height={120} viewBox="0 0 24 24" fill="none">
      <Circle
        cx={12}
        cy={12}
        r={10}
        stroke={colors.accentOrange}
        strokeWidth={1.2}
      />
      <Path
        d="M12 8l4 4-4 4"
        stroke={colors.accentOrange}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8 12h8"
        stroke={colors.accentOrange}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export default function WhatsApp4({
  navigation,
}: WhatsApp4Props): React.JSX.Element {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Top bar */}
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

      {/* Center content */}
      <View style={styles.centerSection}>
        <LargeArrowCircle />
        <Text style={styles.heading}>Whatsapp connected!</Text>
      </View>

      {/* Bottom */}
      <View style={styles.bottomSection}>
        <View style={{ height: 24 }} />
        <OrangeButton
          label="Choose Groups →"
          onPress={() => navigation.navigate('SelectGroups')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    paddingHorizontal: 24,
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
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  heading: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  bottomSection: {
    paddingBottom: 52,
    alignItems: 'center',
  },
});
