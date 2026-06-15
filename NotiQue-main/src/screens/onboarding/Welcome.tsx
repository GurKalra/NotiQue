import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../../config/colors';
import OrangeButton from '../../components/OrangeButton';
import type { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';

type WelcomeScreenNavigationProp = NativeStackNavigationProp<
  OnboardingStackParamList,
  'Welcome'
>;

interface WelcomeScreenProps {
  navigation: WelcomeScreenNavigationProp;
}

export default function Welcome({
  navigation,
}: WelcomeScreenProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Top section — logo + branding */}
      <View style={styles.topSection}>
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>NQ</Text>
        </View>
        <Text style={styles.appName}>NotiQue</Text>
        <Text style={styles.tagline}>
          The operating system for{'\n'}student life
        </Text>
      </View>

      {/* Middle section — graduation cap icon */}
      <View style={styles.middleSection}>
        <Image
          source={require('../../../assets/grad-cap.png')}
          style={styles.gradCapImage}
          resizeMode="contain"
        />
      </View>

      {/* Bottom section — CTA */}
      <View style={styles.bottomSection}>
        <OrangeButton
          label="Get Started"
          onPress={() => navigation.navigate('ConnectGoogle')}
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
  topSection: {
    flex: 1.2,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 16,
  },
  logoBox: {
    width: 120,
    height: 120,
    backgroundColor: colors.accentOrange,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  logoText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 50,
    color: colors.textPrimary,
  },
  appName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  tagline: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: colors.accentOrange,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 24,
  },
  middleSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradCapImage: {
    width: 100,
    height: 100,
  },
  bottomSection: {
    paddingBottom: 52,
    alignItems: 'center',
  },
});
