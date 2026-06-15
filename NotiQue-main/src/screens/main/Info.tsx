import React, { useState, useCallback, useRef, useEffect } from 'react';
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
import { API } from '../../config/api';
import ImportanceTag from '../../components/ImportanceTag';
import RobotFAB from '../../components/RobotFAB';
import { TAB_BAR_HEIGHT } from '../../navigation/AppNavigator';
import { useScreenFade } from '../../hooks/useScreenFade';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettings } from '../../context/SettingsContext';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

// ─── Types ────────────────────────────────────────────────────────────────

type Importance = 'high' | 'medium' | 'low';
type Source = 'whatsapp' | 'gmail' | 'classroom';

interface FeedCard {
  id: string;
  type: 'ACTION' | 'INFO';
  importance: Importance;
  title: string;
  description: string;
  source: Source;
  sourceGroup: string;
  createdAt: string;
  deadline: string | null;
  reminderCount: number;
  studentMentioned: boolean;
  expiresAt: string;
}

type FilterTab = 'All' | 'High' | 'Medium' | 'Low';

// ─── Helpers ──────────────────────────────────────────────────────────────

const todayStr = new Date().toDateString();
const yesterdayStr = new Date(Date.now() - 86400000).toDateString();

function getDateGroup(createdAt: string): 'today' | 'yesterday' | 'week' {
  const d = new Date(createdAt).toDateString();
  if (d === todayStr) return 'today';
  if (d === yesterdayStr) return 'yesterday';
  return 'week';
}

function formatTime(createdAt: string): string {
  const d = new Date(createdAt);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${m} ${period}`;
}

function formatDateLabel(createdAt: string): string {
  const group = getDateGroup(createdAt);
  if (group === 'today') return formatTime(createdAt);
  if (group === 'yesterday') return formatTime(createdAt);
  const d = new Date(createdAt);
  return `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}, ${formatTime(createdAt)}`;
}

function sourceLabel(source: Source, sourceGroup: string): string {
  const s = source === 'gmail' ? 'Gmail' : source === 'classroom' ? 'Classroom' : 'WhatsApp';
  return `${s} · ${sourceGroup}`;
}

function importanceIcon(importance: Importance): { name: keyof typeof Feather.glyphMap; color: string } {
  if (importance === 'high') return { name: 'x-circle', color: colors.high };
  if (importance === 'medium') return { name: 'alert-circle', color: colors.accentOrange };
  return { name: 'info', color: colors.textSecondary };
}

// ─── InfoCard component ───────────────────────────────────────────────────

interface InfoCardProps {
  card: FeedCard;
  onDismiss: (id: string) => void;
}

function InfoCard({ card, onDismiss }: InfoCardProps): React.JSX.Element {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const icon = importanceIcon(card.importance);
  const srcLabel = sourceLabel(card.source, card.sourceGroup);
  const srcIcon: keyof typeof Feather.glyphMap =
    card.source === 'gmail' ? 'mail' : card.source === 'classroom' ? 'book-open' : 'message-circle';

  const handleDismiss = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start(() => onDismiss(card.id));
  };

  return (
    <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
      {/* Left icon */}
      <View style={styles.cardIconCol}>
        <Feather name={icon.name} size={20} color={icon.color} />
      </View>

      {/* Content */}
      <View style={styles.cardBody}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {card.title}
          </Text>
          <ImportanceTag importance={card.importance} />
        </View>
        <Text style={styles.cardDescription} numberOfLines={2}>
          {card.description}
        </Text>
        <View style={styles.cardMeta}>
          <Feather name="clock" size={11} color={colors.textSecondary} />
          <Text style={styles.metaText}>{formatDateLabel(card.createdAt)}</Text>
          <Feather name={srcIcon} size={11} color={colors.textSecondary} />
          <Text style={styles.metaText} numberOfLines={1}>
            {srcLabel}
          </Text>
        </View>
      </View>

      {/* Dismiss */}
      <TouchableOpacity
        style={styles.dismissBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        onPress={handleDismiss}
      >
        <Feather name="x" size={16} color={colors.textSecondary} />
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Section component ────────────────────────────────────────────────────

const MAX_VISIBLE = 3;

interface SectionProps {
  title: string;
  cards: FeedCard[];
  onDismiss: (id: string) => void;
}

function Section({ title, cards, onDismiss }: SectionProps): React.JSX.Element | null {
  const [expanded, setExpanded] = useState(false);

  if (cards.length === 0) return null;

  const visible = expanded ? cards : cards.slice(0, MAX_VISIBLE);
  const hasMore = cards.length > MAX_VISIBLE;

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  };

  return (
    <View style={styles.section}>
      {/* Section header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionCount}>
          {cards.length} {cards.length === 1 ? 'update' : 'updates'}
        </Text>
      </View>

      {/* Cards */}
      {visible.map((card) => (
        <InfoCard key={card.id} card={card} onDismiss={onDismiss} />
      ))}

      {/* View all / Show less */}
      {hasMore && (
        <TouchableOpacity style={styles.viewAllRow} onPress={toggleExpand} activeOpacity={0.7}>
          <Text style={styles.viewAllText}>
            {expanded
              ? 'Show less'
              : `View all for ${title.toLowerCase()} →`}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Filter tabs ──────────────────────────────────────────────────────────

const TABS: FilterTab[] = ['All', 'High', 'Medium', 'Low'];

interface FilterTabsProps {
  active: FilterTab;
  onChange: (t: FilterTab) => void;
}

function FilterTabs({ active, onChange }: FilterTabsProps): React.JSX.Element {
  const dotColor: Record<FilterTab, string> = {
    All: 'transparent',
    High: colors.high,
    Medium: colors.accentOrange,
    Low: colors.textSecondary,
  };

  return (
    <View style={styles.tabsRow}>
      {TABS.map((tab) => {
        const isActive = tab === active;
        return (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => onChange(tab)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
              {tab}
            </Text>
            {tab !== 'All' && (
              <View
                style={[
                  styles.tabDot,
                  { backgroundColor: dotColor[tab] },
                ]}
              />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────

function EmptyState({ filter }: { filter: FilterTab }): React.JSX.Element {
  return (
    <View style={styles.emptyContainer}>
      <Feather name="volume-2" size={48} color={colors.textSecondary} />
      <Text style={styles.emptyTitle}>
        {filter === 'All' ? 'No updates yet' : `No ${filter} updates`}
      </Text>
      <Text style={styles.emptySubtext}>
        {filter === 'All'
          ? 'New announcements from your groups and email will appear here'
          : 'Try switching to All'}
      </Text>
    </View>
  );
}

// ─── Main Info screen ─────────────────────────────────────────────────────

export default function Info(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<FilterTab>('All');
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [feedCards, setFeedCards] = useState<FeedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useScreenFade();
  const insets = useSafeAreaInsets();
  const scrollPaddingBottom = insets.bottom + 12 + TAB_BAR_HEIGHT + 80;
  // Read notification prefs — filter out importance levels the user disabled
  const { notifPrefs } = useSettings();

  const loadFeed = useCallback(async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const res = await fetch(API.feed, {
        headers: { 'x-user-id': userId ?? '' },
      });
      if (!res.ok) throw new Error('Failed to fetch feed');
      const data = await res.json();
      // Backend returns "reason" as the explanation text; map to "description"
      const cards: FeedCard[] = (data.cards ?? []).map((c: any) => ({
        ...c,
        description: c.description ?? c.reason ?? '',
      }));
      setFeedCards(cards);
    } catch (e) {
      console.warn('[Info] feed load failed:', e);
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

  // Always INFO type only — per project.md rules
  // Also respect notification prefs: high always shows, medium/low only if enabled
  const allInfo = feedCards.filter(
    (c) =>
      c.type === 'INFO' &&
      !dismissedIds.has(c.id) &&
      (c.importance === 'high' ||
        (c.importance === 'medium' && notifPrefs.medium) ||
        (c.importance === 'low' && notifPrefs.low))
  );

  const handleTabChange = useCallback((tab: FilterTab) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTab(tab);
  }, []);

  const handleDismiss = useCallback((id: string) => {
    // Removes card from the visible list — local only, no API call in prototype
    setDismissedIds((prev) => new Set(prev).add(id));
  }, []);

  const filtered =
    activeTab === 'All'
      ? allInfo
      : allInfo.filter((c) => c.importance === activeTab.toLowerCase());

  const todayCards = filtered
    .filter((c) => getDateGroup(c.createdAt) === 'today')
    .sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.importance] - order[b.importance];
    });
  const yesterdayCards = filtered
    .filter((c) => getDateGroup(c.createdAt) === 'yesterday')
    .sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.importance] - order[b.importance];
    });
  const weekCards = filtered
    .filter((c) => getDateGroup(c.createdAt) === 'week')
    .sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.importance] - order[b.importance];
    });

  const hasAny = todayCards.length + yesterdayCards.length + weekCards.length > 0;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar style="light" />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.topLogoBox}>
          <Text style={styles.topLogoText}>NQ</Text>
        </View>
        <Text style={styles.topTitle}>NotiQue</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTextCol}>
          <Text style={styles.headerTitle}>Info</Text>
          <Text style={styles.headerSubtitle}>
            Important updates and announcements so you stay informed
          </Text>
        </View>
        <Feather name="volume-2" size={32} color={colors.accentOrange} />
      </View>

      {/* Filter Tabs */}
      <FilterTabs active={activeTab} onChange={handleTabChange} />

      {/* Grouped List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accentOrange} />
        </View>
      ) : (
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
          {hasAny ? (
            <>
              <Section title="Today" cards={todayCards} onDismiss={handleDismiss} />
              <Section title="Yesterday" cards={yesterdayCards} onDismiss={handleDismiss} />
              <Section title="This Week" cards={weekCards} onDismiss={handleDismiss} />
            </>
          ) : (
            <EmptyState filter={activeTab} />
          )}
        </ScrollView>
      )}

      <RobotFAB />
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────

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
    paddingBottom: 8,
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
  // Header section
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 12,
  },
  headerTextCol: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    fontStyle: 'italic',
  },
  // Filter tabs
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 5,
  },
  tabActive: {
    borderColor: colors.accentOrange,
  },
  tabText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textSecondary,
  },
  tabTextActive: {
    fontFamily: 'Inter_600SemiBold',
    color: colors.accentOrange,
  },
  tabDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Scrollable content
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 160,
  },
  // Section
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: colors.textPrimary,
  },
  sectionCount: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.accentOrange,
  },
  // Card
  card: {
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.bgBorder,
    padding: 12,
    marginBottom: 8,
    alignItems: 'flex-start',
    gap: 10,
  },
  cardIconCol: {
    paddingTop: 2,
    width: 24,
    alignItems: 'center',
  },
  cardBody: {
    flex: 1,
    gap: 4,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 2,
  },
  cardTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
    lineHeight: 20,
  },
  cardDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  metaText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: colors.textSecondary,
    marginRight: 4,
  },
  dismissBtn: {
    paddingTop: 2,
  },
  // View all
  viewAllRow: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  viewAllText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: colors.accentOrange,
  },
  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: colors.textSecondary,
    marginTop: 8,
  },
  emptySubtext: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 32,
  },
});