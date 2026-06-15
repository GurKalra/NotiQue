import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path, Circle } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../../config/colors';
import OrangeButton from '../../components/OrangeButton';
import { API } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import type { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';

type SelectGroupsNavigationProp = NativeStackNavigationProp<
  OnboardingStackParamList,
  'SelectGroups'
>;

interface SelectGroupsProps {
  navigation: SelectGroupsNavigationProp;
  /** When true: opened from Account "Manage Groups", show back button, no completeOnboarding */
  manageMode?: boolean;
  onDone?: () => void;
}

interface GroupItem {
  id: string;
  name: string;
  participants: number;
  tracked: boolean;
}

function PeopleIcon(): React.JSX.Element {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
        stroke={colors.textSecondary}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle
        cx={9}
        cy={7}
        r={4}
        stroke={colors.textSecondary}
        strokeWidth={2}
      />
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

export default function SelectGroups({
  navigation,
  manageMode = false,
  onDone,
}: SelectGroupsProps): React.JSX.Element {
  const { completeOnboarding } = useAuth();
  const { trackedGroups, saveGroupSelection } = useSettings();

  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState(false);

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
          // Match by NAME, since trackedGroups (from /settings) stores group names,
          // not WhatsApp JIDs — the bridge filters by chat.name too.
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

  const toggleGroup = (id: string): void => {
    setGroups((prev) =>
      prev.map((g) => (g.id === id ? { ...g, tracked: !g.tracked } : g))
    );
  };

  const handleStartTracking = async (): Promise<void> => {
    setSubmitting(true);
    try {
      // Save group selection to SettingsContext (persists to AsyncStorage)
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

      if (manageMode) {
        // Manage flow: just go back to Account screen
        onDone?.();
      } else {
        // Onboarding flow: mark full onboarding complete → switches to AppNavigator
        await completeOnboarding();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderGroupItem = ({ item }: { item: GroupItem }) => (
    <View style={styles.groupRow}>
      <View style={styles.groupLeft}>
        <PeopleIcon />
        <View style={styles.groupInfo}>
          <Text style={styles.groupName}>{item.name}</Text>
          <Text style={styles.groupParticipants}>
            {item.participants} members
          </Text>
        </View>
      </View>
      <Switch
        value={item.tracked}
        onValueChange={() => toggleGroup(item.id)}
        trackColor={{
          false: colors.bgBorder,
          true: colors.accentOrange,
        }}
        thumbColor={colors.textPrimary}
      />
    </View>
  );

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

      {/* "Choose Groups" heading as outlined button style */}
      <View style={styles.headingContainer}>
        <Text style={styles.headingText}>Choose Groups</Text>
      </View>

      {/* Groups list */}
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
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.backButtonText}>Go Back</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Bottom — Start Tracking */}
      <View style={styles.bottomSection}>
        <OrangeButton
          label={submitting ? 'Saving...' : 'Start Tracking'}
          onPress={handleStartTracking}
          style={!hasSelection || submitting ? styles.buttonDisabled : undefined}
          disabled={!hasSelection || submitting}
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
    paddingBottom: 16,
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
  headingContainer: {
    borderWidth: 1,
    borderColor: colors.accentOrange,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  headingText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: colors.accentOrange,
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
    minHeight: 56,
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
    paddingVertical: 16,
    paddingBottom: 52,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  // Empty state
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
  backButton: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.bgBorder,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  backButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: colors.accentOrange,
  },
});