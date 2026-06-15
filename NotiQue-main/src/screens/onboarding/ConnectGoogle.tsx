import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../../config/colors';
import GoogleIcon from '../../components/GoogleIcon';
import { API } from '../../config/api';
import type { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';

WebBrowser.maybeCompleteAuthSession();

type ConnectGoogleNavigationProp = NativeStackNavigationProp<
  OnboardingStackParamList,
  'ConnectGoogle'
>;

interface ConnectGoogleProps {
  navigation: ConnectGoogleNavigationProp;
}

// ── Google OAuth config ─────────────────────────────────────────
const GOOGLE_CLIENT_ID =
  '977086704137-iluash2b6m7p76nkv3kovei15crm9c4i.apps.googleusercontent.com';

const GOOGLE_SCOPES = [
  'openid',
  'profile',
  'email',
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.student-submissions.me.readonly',
  'https://www.googleapis.com/auth/gmail.readonly',
];

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

export default function ConnectGoogle({
  navigation,
}: ConnectGoogleProps): React.JSX.Element {
  const [loading, setLoading] = useState(false);

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'com.notiquedev.notiQue',
  });

  console.log("=== REDIRECT URI ===");
  console.log(redirectUri);

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID,
      scopes: GOOGLE_SCOPES,
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
    },
    discovery
  );

  useEffect(() => {
    const handleUrl = (event: { url: string }) => {
      const url = event.url;
      console.log('=== INCOMING URL ===', url);
      const parsed = Linking.parse(url);
      const code = parsed.queryParams?.code as string | undefined;
      if (code && request?.codeVerifier) {
        handleAuthSuccess(code, request.codeVerifier);
      }
    };

    const subscription = Linking.addEventListener('url', handleUrl);
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl({ url });
    });

    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request]);

  const handleAuthSuccess = async (code: string, codeVerifier: string): Promise<void> => {
    try {
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          code,
          code_verifier: codeVerifier,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }).toString(),
      });

      const tokenData = await tokenRes.json();
      console.log('=== TOKEN DATA ===', JSON.stringify(tokenData));
      const accessToken = tokenData.access_token;
      if (!accessToken) throw new Error('No access token');

      const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const userInfo = await userInfoRes.json();

      await AsyncStorage.setItem('googleAccessToken', accessToken);
      await AsyncStorage.setItem('googleEmail', userInfo.email ?? '');
      await AsyncStorage.setItem('googleName', userInfo.name ?? '');

      const res = await fetch(API.register, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userInfo.name ?? 'Student User',
          email: userInfo.email ?? `student${Date.now()}@college.edu`,
          deviceToken: 'placeholder-device-token',
        }),
      });
      const data = await res.json();
      await AsyncStorage.setItem('userId', data.userId);
      navigation.navigate('WhatsApp1');
    } catch (err) {
      console.log('=== AUTH ERROR ===', err);
      Alert.alert('Something went wrong', 'Could not connect right now.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async (): Promise<void> => {
    setLoading(true);
    try {
      console.log('=== CALLING promptAsync ===');
      const result = await promptAsync();
      console.log('=== promptAsync RESOLVED ===', JSON.stringify(result));

      const res = await fetch(API.register, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Student User',
          email: `student${Date.now()}@college.edu`,
          deviceToken: 'placeholder-device-token',
        }),
      });

      const data = await res.json();
      await AsyncStorage.setItem('userId', data.userId);
      navigation.navigate('WhatsApp1');
    } catch (err) {
      console.log('=== promptAsync ERROR ===', err);
      Alert.alert('Something went wrong', 'Could not connect right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header — logo + branding (same as Welcome) */}
      <View style={styles.headerSection}>
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>NQ</Text>
        </View>
        <Text style={styles.appName}>NotiQue</Text>
        <Text style={styles.tagline}>
          The operating system for{'\n'}student life
        </Text>
      </View>

      {/* Middle — grad cap + connect prompt */}
      <View style={styles.middleSection}>
        <Image
          source={require('../../../assets/grad-cap.png')}
          style={styles.gradCapImage}
          resizeMode="contain"
        />
        <Text style={styles.connectTitle}>Connect your college account</Text>
      </View>

      {/* Bottom — Google sign-in button */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleGoogleSignIn}
          disabled={!request || loading}
          style={[styles.googleButton, (loading || !request) && styles.googleButtonDisabled]}
        >
          {loading ? (
            <ActivityIndicator color={colors.accentOrange} />
          ) : (
            <>
              <GoogleIcon size={20} />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </>
          )}
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
  googleButton: {
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
  googleButtonDisabled: {
    opacity: 0.6,
  },
  googleButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: colors.accentOrange,
  },
});