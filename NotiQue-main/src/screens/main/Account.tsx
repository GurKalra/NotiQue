import React, { useRef, useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Animated,
  Image,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors } from '../../config/colors';
import { API } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useScreenFade } from '../../hooks/useScreenFade';
import { TAB_BAR_HEIGHT, AppStackParamList } from '../../navigation/AppNavigator';

type AccountNavProp = NativeStackNavigationProp<AppStackParamList>;

interface ProfileData {
  name: string;
  email: string;
  sources: {
    whatsapp: boolean;
    gmail: boolean;
    classroom: boolean;
  };
}

const DEFAULT_PROFILE: ProfileData = {
  name: 'Student',
  email: '',
  sources: { whatsapp: false, gmail: false, classroom: false },
};

// ─── Helpers ──────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ─── Sub-components ───────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}

interface SourceRowProps {
  logo: React.ReactNode;
  name: string;
  connected: boolean;
}

function SourceRow({ logo, name, connected }: SourceRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        {logo}
        <Text style={styles.rowTitle}>{name}</Text>
      </View>
      <View style={[styles.statusPill, connected ? styles.statusConnected : styles.statusDisconnected]}>
        <Text style={[styles.statusText, { color: connected ? colors.success : colors.textSecondary }]}>
          {connected ? 'Connected' : 'Not connected'}
        </Text>
        <View style={[styles.statusDot, { backgroundColor: connected ? colors.success : colors.textSecondary }]} />
      </View>
    </View>
  );
}

interface NotifRowProps {
  iconName: keyof typeof Feather.glyphMap;
  iconColor: string;
  label: string;
  subtext: string;
  value: boolean;
  disabled?: boolean;
  onValueChange?: (v: boolean) => void;
}

function NotifRow({ iconName, iconColor, label, subtext, value, disabled = false, onValueChange }: NotifRowProps) {
  return (
    <View style={styles.notifRow}>
      <View style={[styles.notifIconBox, { backgroundColor: `${iconColor}22` }]}>
        <Feather name={iconName} size={16} color={iconColor} />
      </View>
      <View style={styles.rowTextCol}>
        <Text style={styles.rowTitle}>{label}</Text>
        <Text style={styles.rowSubtext}>{subtext}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: colors.bgBorder, true: disabled ? colors.bgBorder : colors.accentOrange }}
        thumbColor={disabled ? colors.textSecondary : colors.textPrimary}
        ios_backgroundColor={colors.bgBorder}
      />
    </View>
  );
}

// ─── Main Account Screen ──────────────────────────────────────────────────

export default function Account(): React.JSX.Element {
  const { signOut } = useAuth();
  const { trackedGroups, notifPrefs, updateGroupTracked, updateNotifPrefs } = useSettings();
  const navigation = useNavigation<AccountNavProp>();
  const fadeAnim = useScreenFade();
  const insets = useSafeAreaInsets();
  const scrollPaddingBottom = insets.bottom + 12 + TAB_BAR_HEIGHT + 40;

  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const initials = getInitials(profile.name);

  // Load profile on mount (settings are seeded by SettingsContext separately)
  useEffect(() => {
    (async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        const res = await fetch(API.profile, {
          headers: { 'x-user-id': userId ?? '' },
        });
        if (res.ok) {
          const data = await res.json();
          setProfile({
            name: data.name ?? DEFAULT_PROFILE.name,
            email: data.email ?? DEFAULT_PROFILE.email,
            sources: { ...DEFAULT_PROFILE.sources, ...(data.sources ?? {}) },
          });
        }
      } catch (e) {
        console.warn('[Account] profile load failed:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Debounce ref — fired 500ms after last toggle
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleSettingsPersist = useCallback(
    (latestGroups = trackedGroups, latestNotif = notifPrefs) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(async () => {
        try {
          const userId = await AsyncStorage.getItem('userId');
          await fetch(API.settings, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': userId ?? '',
            },
            body: JSON.stringify({
              trackedGroups: latestGroups.filter((g) => g.tracked).map((g) => g.name),
              notifications: { high: true, medium: latestNotif.medium, low: latestNotif.low },
            }),
          });
        } catch (e) {
          console.warn('[Account] settings persist failed:', e);
        }
      }, 500);
    },
    [trackedGroups, notifPrefs]
  );

  const handleGroupToggle = async (id: string) => {
    const group = trackedGroups.find((g) => g.id === id);
    if (!group) return;
    const updatedTracked = !group.tracked;
    await updateGroupTracked(id, updatedTracked);
    const latestGroups = trackedGroups.map((g) =>
      g.id === id ? { ...g, tracked: updatedTracked } : g
    );
    scheduleSettingsPersist(latestGroups, notifPrefs);
  };

  const handleNotifToggle = async (key: 'medium' | 'low') => {
    const updatedValue = !notifPrefs[key];
    await updateNotifPrefs({ [key]: updatedValue });
    const latestNotif = { ...notifPrefs, [key]: updatedValue, high: true };
    scheduleSettingsPersist(trackedGroups, latestNotif);
  };

  const handleSyncGoogle = async () => {
    setSyncing(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      const res = await fetch(API.syncDemo, {
        method: 'POST',
        headers: { 'x-user-id': userId ?? '' },
      });
      if (res.ok) {
        const data = await res.json();
        setProfile((prev) => ({
          ...prev,
          sources: { ...prev.sources, gmail: true, classroom: true },
        }));
        Alert.alert('Sync complete', `${data.added} new items added to your feed and tasks.`);
      } else {
        Alert.alert('Sync failed', 'Please try again.');
      }
    } catch {
      Alert.alert('Sync failed', 'Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteData = () => {
    Alert.alert(
      'Are you sure?',
      'This removes all your data from NotiQue permanently. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              const userId = await AsyncStorage.getItem('userId');
              const res = await fetch(API.deleteAccount, {
                method: 'DELETE',
                headers: { 'x-user-id': userId ?? '' },
              });

              if (res.ok) {
                await signOut();
              } else {
                Alert.alert('Error', 'Something went wrong. Try again.');
              }
            } catch {
              Alert.alert('Error', 'Something went wrong. Try again.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleSignOut = async () => {
    // No API call — just clears AsyncStorage
    await signOut();
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar style="light" />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.topLogoBox}>
          <Text style={styles.topLogoText}>NQ</Text>
        </View>
        <Text style={styles.topTitle}>Your Account</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accentOrange} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollPaddingBottom }]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Profile ─────────────────────────────────────────────────── */}
          <View style={styles.profileSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <Text style={styles.profileName}>{profile.name}</Text>
            <Text style={styles.profileEmail}>{profile.email}</Text>
            {/* College only — branch removed (not collected in prototype) */}
            <View style={styles.collegePill}>
              <Text style={styles.collegePillText}>SRM KTR</Text>
            </View>
          </View>

          {/* ── Connected Sources ────────────────────────────────────────── */}
          <SectionLabel label="CONNECTED SOURCES" />
          <View style={styles.card}>
            <SourceRow
              logo={
                <Image
                  source={require('../../../assets/whatsapp.png')}
                  style={styles.sourceLogo}
                  resizeMode="contain"
                />
              }
              name="WhatsApp"
              connected={profile.sources.whatsapp}
            />
            <View style={styles.divider} />
            <SourceRow
              logo={
                <Image
                  source={require('../../../assets/gmail-logo.png')}
                  style={styles.sourceLogo}
                  resizeMode="contain"
                />
              }
              name="Gmail"
              connected={profile.sources.gmail}
            />
            <View style={styles.divider} />
            <SourceRow
              logo={
                <Image
                  source={require('../../../assets/google-classroom-logo.png')}
                  style={styles.sourceLogo}
                  resizeMode="contain"
                />
              }
              name="Google Classroom"
              connected={profile.sources.classroom}
            />
          </View>

          {/* Sync Gmail & Classroom button */}
          <TouchableOpacity
            style={styles.syncButton}
            onPress={handleSyncGoogle}
            activeOpacity={0.8}
            disabled={syncing}
          >
            {syncing ? (
              <ActivityIndicator size="small" color={colors.accentOrange} />
            ) : (
              <>
                <Feather name="refresh-cw" size={16} color={colors.accentOrange} />
                <Text style={styles.syncButtonText}>Sync Gmail & Classroom</Text>
              </>
            )}
          </TouchableOpacity>

          {/* ── Tracked Groups ───────────────────────────────────────────── */}
          <SectionLabel label="TRACKED GROUPS" />
          {trackedGroups.length > 0 ? (
            <View style={styles.card}>
              {trackedGroups.map((group, idx) => (
                <React.Fragment key={group.id}>
                  <View style={styles.row}>
                    <View style={styles.rowLeft}>
                      <Feather name="users" size={18} color={colors.textSecondary} />
                      <Text style={styles.rowTitle}>{group.name}</Text>
                    </View>
                    <Switch
                      value={group.tracked}
                      onValueChange={() => handleGroupToggle(group.id)}
                      trackColor={{ false: colors.bgBorder, true: colors.accentOrange }}
                      thumbColor={colors.textPrimary}
                      ios_backgroundColor={colors.bgBorder}
                    />
                  </View>
                  {idx < trackedGroups.length - 1 && <View style={styles.divider} />}
                </React.Fragment>
              ))}
            </View>
          ) : (
            <View style={styles.emptyGroups}>
              <Text style={styles.emptyGroupsText}>
                No groups tracked yet. Tap below to add some.
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.manageGroupsRow}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('ManageGroups')}
          >
            <Feather name="plus" size={14} color={colors.accentOrange} />
            <Text style={styles.manageGroupsText}>Manage Groups</Text>
          </TouchableOpacity>

          {/* ── Notifications ────────────────────────────────────────────── */}
          <SectionLabel label="NOTIFICATIONS" />
          <View style={styles.card}>
            {/* High: always ON, non-interactive */}
            <NotifRow
              iconName="bell"
              iconColor={colors.high}
              label="High Importance"
              subtext="Always on"
              value={true}
              disabled={true}
            />
            <View style={styles.divider} />
            {/* Medium: interactive — affects Info + HomeFeed */}
            <NotifRow
              iconName="bell"
              iconColor={colors.accentOrange}
              label="Medium Importance"
              subtext="Deadlines within the week"
              value={notifPrefs.medium}
              onValueChange={() => handleNotifToggle('medium')}
            />
            <View style={styles.divider} />
            {/* Low: interactive */}
            <NotifRow
              iconName="bell-off"
              iconColor={colors.textSecondary}
              label="Low Importance"
              subtext="Social messages, mess menu"
              value={notifPrefs.low}
              onValueChange={() => handleNotifToggle('low')}
            />
          </View>

          {/* ── Account Actions ──────────────────────────────────────────── */}
          <SectionLabel label="ACCOUNT" />
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.row}
              onPress={handleDeleteData}
              activeOpacity={0.7}
              disabled={deleting}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.actionIconBox, { backgroundColor: `${colors.high}22` }]}>
                  <Feather name="trash-2" size={18} color={colors.high} />
                </View>
                <View style={styles.rowTextCol}>
                  <Text style={[styles.rowTitle, { color: colors.high }]}>Delete All My Data</Text>
                  <Text style={styles.rowSubtext}>Removes all stored data from NotiQue</Text>
                </View>
              </View>
              {deleting ? (
                <ActivityIndicator size="small" color={colors.high} />
              ) : (
                <Feather name="chevron-right" size={18} color={colors.textSecondary} />
              )}
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.row} onPress={handleSignOut} activeOpacity={0.7}>
              <View style={styles.rowLeft}>
                <View style={[styles.actionIconBox, { backgroundColor: `${colors.textSecondary}22` }]}>
                  <Feather name="log-out" size={18} color={colors.textSecondary} />
                </View>
                <Text style={[styles.rowTitle, { color: colors.textSecondary }]}>Sign Out</Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 8,
  },
  topLogoBox: {
    width: 36, height: 36,
    backgroundColor: colors.accentOrange,
    borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  topLogoText: { fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.textPrimary },
  topTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 18, color: colors.textPrimary },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: 20 },
  // Profile
  profileSection: { alignItems: 'center', paddingVertical: 24 },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.accentOrange,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatarText: { fontFamily: 'Inter_700Bold', fontSize: 28, color: colors.textPrimary },
  profileName: { fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.textPrimary, textAlign: 'center' },
  profileEmail: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.textSecondary, marginTop: 4, textAlign: 'center' },
  collegePill: {
    marginTop: 10,
    backgroundColor: colors.bgCard,
    borderRadius: 20, borderWidth: 1, borderColor: colors.bgBorder,
    paddingHorizontal: 16, paddingVertical: 6,
  },
  collegePillText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.textSecondary },
  // Section label
  sectionLabel: {
    fontFamily: 'Inter_600SemiBold', fontSize: 11,
    color: colors.textSecondary, letterSpacing: 1,
    marginTop: 20, marginBottom: 8,
  },
  // Card container
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 14, borderWidth: 1, borderColor: colors.bgBorder,
    overflow: 'hidden',
  },
  divider: { height: 1, backgroundColor: colors.bgBorder, marginHorizontal: 16 },
  // Generic row
  row: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  rowTextCol: { flex: 1, gap: 2 },
  rowTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.textPrimary },
  rowSubtext: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.textSecondary },
  // Source logos
  sourceLogo: { width: 32, height: 32, borderRadius: 8 },
  // Status pill
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  statusConnected: { backgroundColor: `${colors.success}18`, borderColor: `${colors.success}40` },
  statusDisconnected: { backgroundColor: `${colors.textSecondary}18`, borderColor: `${colors.textSecondary}40` },
  statusText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  // Sync button
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.accentOrange,
    borderRadius: 12,
    paddingVertical: 12,
  },
  syncButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: colors.accentOrange,
  },
  // Manage groups
  manageGroupsRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 12, paddingHorizontal: 4,
  },
  manageGroupsText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.accentOrange },
  // Empty groups
  emptyGroups: {
    backgroundColor: colors.bgCard, borderRadius: 14,
    borderWidth: 1, borderColor: colors.bgBorder,
    padding: 20, alignItems: 'center',
  },
  emptyGroupsText: {
    fontFamily: 'Inter_400Regular', fontSize: 13,
    color: colors.textSecondary, textAlign: 'center', lineHeight: 20,
  },
  // Notification rows
  notifRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  notifIconBox: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  // Action rows
  actionIconBox: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});