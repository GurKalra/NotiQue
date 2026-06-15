/**
 * SettingsContext
 *
 * Single source of truth for:
 *  1. Notification importance preferences (medium, low toggles)
 *  2. Tracked WhatsApp groups (which groups the user monitors)
 *
 * Used by: Account (write), Info (read), HomeFeed (read)
 *
 * REAL MODE: seeded from GET /settings on app mount, cached to AsyncStorage
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API } from '../config/api';

// ─── Types ────────────────────────────────────────────────────────────────

export interface TrackedGroup {
  id: string;
  name: string;
  /** whether notifications for this group are currently ON */
  tracked: boolean;
}

export interface NotifPrefs {
  /** High is always true and non-interactive */
  high: boolean;
  medium: boolean;
  low: boolean;
}

interface SettingsContextValue {
  /** Groups the user has ever enabled tracking for.
   *  Groups never enabled are not in this list.
   *  Groups disabled still appear (tracked: false) so user can re-enable. */
  trackedGroups: TrackedGroup[];
  notifPrefs: NotifPrefs;
  /** Called from SelectGroups after onboarding or Manage Groups.
   *  groups = full list from WhatsApp API (all available).
   *  We keep only those ever turned ON, plus preserve existing ones. */
  saveGroupSelection: (groups: TrackedGroup[]) => Promise<void>;
  updateGroupTracked: (id: string, tracked: boolean) => Promise<void>;
  updateNotifPrefs: (prefs: Partial<NotifPrefs>) => Promise<void>;
}

// ─── Persistence keys ─────────────────────────────────────────────────────

const GROUPS_KEY = 'trackedGroups';
const NOTIF_KEY = 'notifPrefs';

// ─── Context ──────────────────────────────────────────────────────────────

const SettingsContext = createContext<SettingsContextValue>({
  trackedGroups: [],
  notifPrefs: { high: true, medium: true, low: false },
  saveGroupSelection: async () => {},
  updateGroupTracked: async () => {},
  updateNotifPrefs: async () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [trackedGroups, setTrackedGroups] = useState<TrackedGroup[]>([]);
  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs>({
    high: true,
    medium: true,
    low: false,
  });

  // Load settings on mount — from cache first (fast UI), then refresh from API
  useEffect(() => {
    async function load() {
      // 1. Load cached values first so UI isn't empty while fetching
      try {
        const [groupsJson, notifJson] = await Promise.all([
          AsyncStorage.getItem(GROUPS_KEY),
          AsyncStorage.getItem(NOTIF_KEY),
        ]);

        if (groupsJson) setTrackedGroups(JSON.parse(groupsJson));
        if (notifJson) setNotifPrefs(JSON.parse(notifJson));
      } catch (e) {
        console.warn('[SettingsContext] cache load failed:', e);
      }

      // 2. Fetch latest from backend and overwrite
      try {
        const userId = await AsyncStorage.getItem('userId');
        const res = await fetch(API.settings, {
          headers: { 'x-user-id': userId ?? '' },
        });

        if (!res.ok) return;

        const data = await res.json();

        // Backend stores trackedGroups as an array of group names (strings).
        // Map each into a TrackedGroup entry — id mirrors name so matching
        // stays consistent with how the WhatsApp bridge filters by group name.
        const groupNames: string[] = data.trackedGroups ?? [];
        const fetchedGroups: TrackedGroup[] = groupNames.map((name) => ({
          id: name,
          name,
          tracked: true,
        }));

        const fetchedNotifs: NotifPrefs = {
          ...(data.notifications ?? { medium: true, low: false }),
          high: true,
        };

        setTrackedGroups(fetchedGroups);
        setNotifPrefs(fetchedNotifs);

        await AsyncStorage.setItem(GROUPS_KEY, JSON.stringify(fetchedGroups));
        await AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(fetchedNotifs));
      } catch (e) {
        console.warn('[SettingsContext] remote load failed:', e);
      }
    }
    load();
  }, []);

  /**
   * Called when user finishes SelectGroups (onboarding OR manage flow).
   * groups = all groups shown in SelectGroups.
   * We only keep groups where tracked=true, PLUS any previously tracked group
   * so it stays in the list even if now set to false.
   */
  const saveGroupSelection = useCallback(
    async (incoming: TrackedGroup[]) => {
      const onGroups = incoming.filter((g) => g.tracked);
      const offGroupsEverTracked = incoming.filter(
        (g) =>
          !g.tracked &&
          trackedGroups.some((existing) => existing.id === g.id)
      );
      const combined = [...onGroups, ...offGroupsEverTracked];
      // Deduplicate by id
      const deduped = combined.filter(
        (g, idx, arr) => arr.findIndex((x) => x.id === g.id) === idx
      );
      setTrackedGroups(deduped);
      await AsyncStorage.setItem(GROUPS_KEY, JSON.stringify(deduped));
    },
    [trackedGroups]
  );

  const updateGroupTracked = useCallback(
    async (id: string, tracked: boolean) => {
      const updated = trackedGroups.map((g) =>
        g.id === id ? { ...g, tracked } : g
      );
      setTrackedGroups(updated);
      await AsyncStorage.setItem(GROUPS_KEY, JSON.stringify(updated));
    },
    [trackedGroups]
  );

  const updateNotifPrefs = useCallback(
    async (prefs: Partial<NotifPrefs>) => {
      const updated = { ...notifPrefs, ...prefs, high: true }; // high always true
      setNotifPrefs(updated);
      await AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(updated));
    },
    [notifPrefs]
  );

  return (
    <SettingsContext.Provider
      value={{
        trackedGroups,
        notifPrefs,
        saveGroupSelection,
        updateGroupTracked,
        updateNotifPrefs,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  return useContext(SettingsContext);
}