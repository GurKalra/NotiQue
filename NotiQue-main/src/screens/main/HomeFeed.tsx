import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../config/colors';
import { mockProfile } from '../../config/mockData';
import { API } from '../../config/api';
import RobotFAB from '../../components/RobotFAB';
import ImportanceTag from '../../components/ImportanceTag';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainTabParamList } from '../../navigation/AppNavigator';
import { TAB_BAR_HEIGHT } from '../../navigation/AppNavigator';
import { useScreenFade } from '../../hooks/useScreenFade';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettings } from '../../context/SettingsContext';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `Today, ${hour}:${m} ${period}`;
}

interface FeedCard {
  id: string;
  type: 'INFO' | 'ACTION';
  importance: 'high' | 'medium' | 'low';
  title: string;
  createdAt: string;
  [key: string]: any;
}

type HomeFeedNavigationProp = NativeStackNavigationProp<MainTabParamList, 'HomeFeed'>;

export default function HomeFeed(): React.JSX.Element {
  const navigation = useNavigation<HomeFeedNavigationProp>();
  const [othersExpanded, setOthersExpanded] = useState(false);
  const fadeAnim = useScreenFade();
  const insets = useSafeAreaInsets();
  const scrollPaddingBottom = insets.bottom + 12 + TAB_BAR_HEIGHT + 80;
  const { notifPrefs } = useSettings();

  const [feedCards, setFeedCards] = useState<FeedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const firstName = mockProfile.name.split(' ')[0] || 'User';

  const loadFeed = useCallback(async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const res = await fetch(API.feed, {
        headers: { 'x-user-id': userId ?? '' },
      });
      if (!res.ok) throw new Error('Failed to fetch feed');
      const data = await res.json();
      setFeedCards(data.cards ?? []);
    } catch (e) {
      console.warn('[HomeFeed] feed load failed:', e);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadFeed();
      setLoading(false);
    })();
  }, [loadFeed]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFeed();
    setRefreshing(false);
  }, [loadFeed]);

  // Filter by type AND notification prefs (high always shows)
  const infoItems = feedCards.filter(
    (c) =>
      c.type === 'INFO' &&
      (c.importance === 'high' ||
        (c.importance === 'medium' && notifPrefs.medium) ||
        (c.importance === 'low' && notifPrefs.low))
  );
  const actionItems = feedCards.filter(
    (c) =>
      c.type === 'ACTION' &&
      (c.importance === 'high' ||
        (c.importance === 'medium' && notifPrefs.medium) ||
        (c.importance === 'low' && notifPrefs.low))
  );
  // Others: ALWAYS show all low items — bypasses notifPrefs (that's the purpose of Others)
  const lowPriorityItems = feedCards.filter((c) => c.importance === 'low');

  const renderInfoItem = (item: FeedCard) => {
    const iconName =
      item.importance === 'high' ? 'x-circle' :
      item.importance === 'medium' ? 'alert-circle' : 'info';
    const dotColor =
      item.importance === 'high' ? colors.high :
      item.importance === 'medium' ? colors.accentOrange : colors.textSecondary;
    const timeString = formatTime(item.createdAt);

    return (
      <View key={item.id} style={styles.itemRow}>
        <View style={styles.infoLeft}>
          <Feather name={iconName} size={16} color={dotColor} style={{ marginTop: 2 }} />
        </View>
        <View style={styles.itemTextContainer}>
          <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.itemSubtitle}>{timeString}</Text>
        </View>
      </View>
    );
  };

  const renderActionItem = (item: FeedCard) => {
    const isHigh = item.importance === 'high';
    const tagColor = isHigh ? colors.high : item.importance === 'medium' ? colors.accentOrange : colors.textSecondary;
    const tagText = isHigh ? 'High' : item.importance === 'medium' ? 'Medium' : 'Low';

    return (
      <View key={item.id} style={styles.itemRow}>
        <View style={styles.actionLeft}>
          <View style={styles.checkbox} />
        </View>
        <View style={styles.itemTextContainer}>
          <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={[styles.itemSubtitle, { color: tagColor, marginTop: 4 }]}>{tagText}</Text>
        </View>
      </View>
    );
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar style="light" />

      {/* Top Bar — NQ logo left, NotiQue center, nothing right (per mockup) */}
      <View style={styles.topBar}>
        <View style={styles.topLogoBox}>
          <Text style={styles.topLogoText}>NQ</Text>
        </View>
        <Text style={styles.topTitle}>NotiQue</Text>
        {/* Spacer so title stays centered */}
        <View style={styles.topRightSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollPaddingBottom }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accentOrange}
            colors={[colors.accentOrange]}
          />
        }
      >
        {/* Greeting */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingText}>
            Welcome, <Text style={styles.greetingName}>{firstName}</Text>
          </Text>
          <Text style={styles.greetingSubtext}>
            Here's your smart overview of what matters
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accentOrange} />
          </View>
        ) : (
          <>
            {/* Two Column Layout */}
            <View style={styles.twoColumnContainer}>
              {/* Info Card */}
              <View style={styles.columnCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <Feather name="info" size={18} color={colors.accentOrange} />
                    <Text style={styles.cardTitle}>Info</Text>
                  </View>
                  <TouchableOpacity onPress={() => navigation.navigate('Info')}>
                    <Text style={styles.viewAllText}>View all ›</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.cardContent}>
                  {infoItems.map(renderInfoItem)}
                  {infoItems.length === 0 && <Text style={styles.emptyText}>No info</Text>}
                </View>
              </View>

              {/* Actions Card */}
              <View style={styles.columnCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <Feather name="check-square" size={18} color={colors.accentOrange} />
                    <Text style={styles.cardTitle}>Actions</Text>
                  </View>
                  <TouchableOpacity onPress={() => navigation.navigate('Todo')}>
                    <Text style={styles.viewAllText}>View all ›</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.cardContent}>
                  {actionItems.map(renderActionItem)}
                  {actionItems.length === 0 && <Text style={styles.emptyText}>No actions</Text>}
                </View>
              </View>
            </View>

            {/* Others Section */}
            <View style={styles.othersContainer}>
              <TouchableOpacity
                style={styles.othersHeader}
                activeOpacity={0.7}
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setOthersExpanded(!othersExpanded);
                }}
              >
                <View style={styles.othersLeft}>
                  <Feather name="more-horizontal" size={18} color={colors.accentOrange} />
                  <Text style={styles.othersTitle}>Others</Text>
                </View>
                <Feather
                  name={othersExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>

              {othersExpanded && (
                <View style={styles.othersContent}>
                  {lowPriorityItems.length > 0 ? (
                    lowPriorityItems.map((item) => (
                      <View key={item.id} style={styles.othersItem}>
                        <View style={styles.othersItemMain}>
                          <View style={styles.infoLeft}>
                            <Feather name="info" size={16} color={colors.textSecondary} style={{ marginTop: 2 }} />
                          </View>
                          <View style={styles.itemTextContainer}>
                            <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                            <Text style={styles.itemSubtitle}>{formatTime(item.createdAt)}</Text>
                          </View>
                        </View>
                        {/* Always show Low tag — that's the point of Others */}
                        <ImportanceTag importance="low" />
                      </View>
                    ))
                  ) : (
                    <Text style={styles.emptyText}>No other updates</Text>
                  )}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Global FAB */}
      <RobotFAB />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
  },
  topLogoBox: {
    width: 36,
    height: 36,
    backgroundColor: colors.accentOrange,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topLogoText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: colors.textPrimary,
  },
  topTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: colors.textPrimary,
  },
  topRightSpacer: {
    width: 36, // same as logo box so title is truly centered
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 0, // dynamic value applied inline
  },
  greetingSection: {
    marginTop: 10,
    marginBottom: 24,
  },
  greetingText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 26,
    color: colors.textPrimary,
  },
  greetingName: {
    fontFamily: 'Inter_700Bold',
    color: colors.accentOrange,
  },
  greetingSubtext: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 6,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  twoColumnContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  columnCard: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: colors.bgBorder,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: colors.textPrimary,
  },
  viewAllText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: colors.accentOrange,
  },
  cardContent: {
    gap: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  infoLeft: {
    width: 20,
    alignItems: 'center',
  },
  actionLeft: {
    width: 20,
    alignItems: 'center',
    paddingTop: 2,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.textSecondary,
  },
  itemTextContainer: {
    flex: 1,
  },
  itemTitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  itemSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 10,
  },
  othersContainer: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.bgBorder,
    overflow: 'hidden',
  },
  othersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  othersLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  othersTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: colors.textPrimary,
  },
  othersContent: {
    padding: 16,
    paddingTop: 0,
    gap: 12,
  },
  othersItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  othersItemMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    flex: 1,
    marginRight: 10,
  },
});