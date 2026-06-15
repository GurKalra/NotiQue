/**
 * ManageGroups
 *
 * Renders the SelectGroups screen in "manage mode" — accessible from Account.
 * Shows a back button. On save: updates SettingsContext and goes back.
 * Does NOT call completeOnboarding (user is already in the main app).
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { colors } from '../../config/colors';
import { API } from '../../config/api';
import { useSettings } from '../../context/SettingsContext';
import OrangeButton from '../../components/OrangeButton';

function PeopleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
        stroke={colors.textSecondary}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={9} cy={7} r={4} stroke={colors.textSecondary} strokeWidth={2} />
      <Path
        d="M23 21v-2a4 4 0 00-3-3.87"
        stroke={colors.textSecondary}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16 3.13a4 4 0 010 7.75"
        stroke={colors.textSecondary}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

interface GroupItem {
  id: string;
  name: string;
  participants: number;
  tracked: boolean;
}

export default function ManageGroups() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { trackedGroups, saveGroupSelection } = useSettings();

  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadGroups() {
      setLoading(true);
      setLoadError(false);
      try {
        const userId = await AsyncStorage.getItem('userId');
        const res = await fetch(API.whatsappGroups, {
          headers: { 'x-user-id': userId ?? '' },
        });

        if (!res.ok) throw new Error('Failed to fetch groups');

        const data = await res.json();

        if (!isMounted) return;

        const fetched: GroupItem[] = (data.groups ?? []).map((g: any) => ({
          id: g.id,
          name: g.name,
          participants: g.participants,
          // Match by NAME — trackedGroups (from /settings) stores group names,
          // not WhatsApp JIDs, same as SelectGroups.
          tracked: trackedGroups.find((t) => t.name === g.name)?.tracked ?? false,
        }));

        setGroups(fetched);
      } catch {
        if (isMounted) setLoadError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadGroups();
    return () => { isMounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasSelection = groups.some((g) => g.tracked);

  const toggleGroup = (id: string) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === id ? { ...g, tracked: !g.tracked } : g))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Saves to SettingsContext + AsyncStorage
      await saveGroupSelection(groups);

      // Also push the selection to the backend
      const userId = await AsyncStorage.getItem('userId');
      await fetch(API.settings, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId ?? '',
        },
        body: JSON.stringify({
          trackedGroups: groups.filter((g) => g.tracked).map((g) => g.name),
        }),
      });

      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  const renderGroupItem = ({ item }: { item: GroupItem }) => (
    <View style={styles.groupRow}>
      <View style={styles.groupLeft}>
        <PeopleIcon />
        <View style={styles.groupInfo}>
          <Text style={styles.groupName}>{item.name}</Text>
          <Text style={styles.groupParticipants}>{item.participants} members</Text>
        </View>
      </View>
      <Switch
        value={item.tracked}
        onValueChange={() => toggleGroup(item.id)}
        trackColor={{ false: colors.bgBorder, true: colors.accentOrange }}
        thumbColor={colors.textPrimary}
        ios_backgroundColor={colors.bgBorder}
      />
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <StatusBar style="light" />

      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Groups</Text>
        <View style={{ width: 36 }} />
      </View>

      <Text style={styles.subtitle}>
        Choose which WhatsApp groups NotiQue monitors. Groups you turn off stay
        here so you can re-enable them anytime.
      </Text>

      {loading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.accentOrange} />
          <Text style={styles.emptyText}>Loading your WhatsApp groups...</Text>
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          renderItem={renderGroupItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {loadError
                  ? 'Could not load groups.\nMake sure your WhatsApp is connected.'
                  : 'No WhatsApp groups found.\nMake sure your WhatsApp is connected.'}
              </Text>
            </View>
          }
        />
      )}

      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 20 }]}>
        <OrangeButton
          label={saving ? 'Saving...' : 'Save Changes'}
          onPress={handleSave}
          style={!hasSelection || saving ? styles.buttonDisabled : undefined}
          disabled={!hasSelection || saving}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: colors.textPrimary,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  listContent: {
    paddingBottom: 16,
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.bgBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  groupLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: colors.textPrimary,
  },
  groupParticipants: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  bottomSection: {
    paddingTop: 16,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  // Empty / loading states
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 20,
  },
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});