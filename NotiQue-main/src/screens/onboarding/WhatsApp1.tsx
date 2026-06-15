import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../../config/colors';
import type { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';

type WhatsApp1NavigationProp = NativeStackNavigationProp<
  OnboardingStackParamList,
  'WhatsApp1'
>;

interface WhatsApp1Props {
  navigation: WhatsApp1NavigationProp;
}

export default function WhatsApp1({
  navigation,
}: WhatsApp1Props): React.JSX.Element {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header — logo + branding */}
      <View style={styles.headerSection}>
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>NQ</Text>
        </View>
        <Text style={styles.appName}>NotiQue</Text>
        <Text style={styles.tagline}>
          The operating system for{'\n'}student life
        </Text>
      </View>

      {/* Middle — grad cap + prompt */}
      <View style={styles.middleSection}>
        <Image
          source={require('../../../assets/grad-cap.png')}
          style={styles.gradCapImage}
          resizeMode="contain"
        />
        <Text style={styles.connectTitle}>Connect WhatsApp</Text>
      </View>

      {/* Bottom — WhatsApp button (same style as Google button) */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            navigation.navigate('WhatsApp2');
          }}
          style={styles.whatsappButton}
        >
          <Image
            source={require('../../../assets/whatsapp.png')}
            style={styles.whatsappIcon}
            resizeMode="contain"
          />
          <Text style={styles.whatsappButtonText}>Connect with WhatsApp</Text>
        </TouchableOpacity>
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
  headerSection: {
    flex: 1.1,
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
    fontSize: 22,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  tagline: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: colors.accentOrange,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
  },
  middleSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  gradCapImage: {
    width: 72,
    height: 72,
  },
  connectTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  bottomSection: {
    paddingBottom: 52,
    alignItems: 'center',
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.bgBorder,
    borderRadius: 10,
    height: 52,
    width: '100%',
    gap: 10,
  },
  whatsappIcon: {
    width: 22,
    height: 22,
  },
  whatsappButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: colors.accentOrange,
  },
});
