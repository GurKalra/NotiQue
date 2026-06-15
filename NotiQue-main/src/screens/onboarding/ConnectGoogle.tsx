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
  '977086704137-a8tg1h2fdpftd700ivgej31jn8liebnk.apps.googleusercontent.com';

const GOOGLE_SCOPES = [
  'openid',
  'profile',
  'email',
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.student-submissions.me.readonly',
  //'https://www.googleapis.com/auth/gmail.readonly',
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
    // @ts-ignore — useProxy is required for Expo Go
    useProxy: true,
    // @ts-ignore — useProxy is required for Expo Go
    projectNameForProxy: '@notique-dev/notiQue',
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
    if (response?.type === 'success') {
      const { code } = response.params;
      if (code && request?.codeVerifier) {
        handleAuthSuccess(code, request.codeVerifier, redirectUri);
      } else {
        setLoading(false);
        Alert.alert('Something went wrong', 'No authorization code received. Please try again.');
      }
    } else if (response?.type === 'error') {
      setLoading(false);
      Alert.alert('Sign-in cancelled', 'Google sign-in was cancelled or failed.');
    } else if (response?.type === 'cancel' || response?.type === 'dismiss') {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  const handleAuthSuccess = async (
    code: string,
    codeVerifier: string,
    redirectUriUsed: string
  ): Promise<void> => {
    try {
      // Exchange the authorization code for tokens via our backend
      // (keeps the client secret server-side)
      const tokenRes = await fetch(API.googleToken, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          codeVerifier,
          redirectUri: redirectUriUsed,
        }),
      });

      if (!tokenRes.ok) {
        throw new Error('Token exchange failed');
      }

      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access_token;

      if (!accessToken) {
        throw new Error('No access token received');
      }

      // Fetch real user info from Google
      const userInfoRes = await fetch(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!userInfoRes.ok) {
        throw new Error('Failed to fetch user info');
      }

      const userInfo = await userInfoRes.json();
      // userInfo: { id, email, name, given_name, family_name, picture, ... }

      // Store the Google access token (and refresh token if provided) for later sync calls
      await AsyncStorage.setItem('googleAccessToken', accessToken);
      if (tokenData.refresh_token) {
        await AsyncStorage.setItem('googleRefreshToken', tokenData.refresh_token);
      }
      await AsyncStorage.setItem('googleEmail', userInfo.email ?? '');
      await AsyncStorage.setItem('googleName', userInfo.name ?? '');

      // Register (or re-register) the user with their real Google identity
      const res = await fetch(API.register, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userInfo.name ?? 'Student User',
          email: userInfo.email ?? `student${Date.now()}@college.edu`,
          deviceToken: 'placeholder-device-token',
        }),
      });

      if (!res.ok) {
        throw new Error('Registration failed');
      }

      const data = await res.json();
      await AsyncStorage.setItem('userId', data.userId);

      navigation.navigate('WhatsApp1');
    } catch (err) {
      Alert.alert(
        'Something went wrong',
        'Could not connect right now. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async (): Promise<void> => {
    Alert.alert("Redirect URI", redirectUri);
    setLoading(true);
    try {
      await promptAsync({
        // @ts-ignore — useProxy is required for Expo Go
        useProxy: true,
      });
    } catch (err) {
      setLoading(false);
      Alert.alert(
        'Something went wrong',
        'Could not start Google sign-in. Please try again.'
      );
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