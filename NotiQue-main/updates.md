# NotiQue — Rewiring & Placeholder Tracker

This file tracks everything that currently uses mock/placeholder behavior
and will need rewiring once the backend or services are ready.

**Integration checklist** — complete these in order:
1. Set BASE_URL (§2)
2. Wire Google OAuth → register → save userId (§1)
3. Wire WhatsApp pair → resend → status (§3, §4)
4. Wire group fetch + start tracking (§5)
5. SettingsContext → GET /settings on mount (§11)
6. HomeFeed → GET /feed on mount (§12)
7. Info → GET /feed on mount (§13)
8. Todo → GET /todos, POST /todos/done, POST /todos (§9, §10)
9. Account → GET /profile + GET /settings, POST /settings, DELETE /profile (§7, §8)
10. Chat → POST /chat (§14)

---

## 1. Google OAuth (ConnectGoogle Screen)

**File:** `src/screens/onboarding/ConnectGoogle.tsx`  
**Current behavior:** Tapping "Continue with Google" navigates directly to `WhatsApp1` (mock).  
**What to wire:**
1. Use `expo-auth-session` to trigger Google OAuth popup
2. User signs in → Google returns an auth code
3. Send auth code to `POST /register` on your backend (`API.register`)
4. Backend exchanges it for tokens, stores them, returns `{ userId }`
5. Save `userId` to `AsyncStorage` under key `'userId'`
6. Then navigate to `WhatsApp1`

**Code location:**
```typescript
// In handleGoogleSignIn():
// MOCK MODE: Navigate directly to WhatsApp1
navigation.navigate('WhatsApp1');

// REAL MODE:
const response = await Google.useAuthRequest(...); // expo-auth-session
const { data } = await fetch(API.register, {
  method: 'POST',
  body: JSON.stringify({ authCode: response.code }),
});
await AsyncStorage.setItem('userId', data.userId);
navigation.navigate('WhatsApp1');
```

---

## 2. API Base URL

**File:** `src/config/api.ts`  
**Current behavior:** `BASE_URL` is set to `"PASTE_AWS_URL_HERE"` — a placeholder string.  
**What to wire:** Replace with the real AWS API Gateway URL once the backend is deployed:
```typescript
export const BASE_URL = "https://xxxxxxxxxx.execute-api.ap-south-1.amazonaws.com/prod";
```
Once this single string is changed, every `fetch(API.xxx, ...)` call in the app will point to the real backend.

**All registered endpoints (for reference):**
| Constant | URL | Method(s) |
|---|---|---|
| `API.register` | `/register` | POST |
| `API.feed` | `/feed` | GET |
| `API.todos` | `/todos` | GET, POST |
| `API.todosDone` | `/todos/done` | POST |
| `API.chat` | `/chat` | POST |
| `API.profile` | `/profile` | GET, DELETE |
| `API.settings` | `/settings` | GET, POST |
| `API.whatsappPair` | `/whatsapp/pair` | POST |
| `API.whatsappResend` | `/whatsapp/resend` | POST |
| `API.whatsappStatus` | `/whatsapp/status` | POST |
| `API.whatsappGroups` | `/whatsapp/groups` | GET |
| `API.deleteAccount` | `/profile` | DELETE |
| `API.sync` | `/sync` | POST (EventBridge) |

---

## 3. WhatsApp Pairing — Send Code (WhatsApp2 Screen)

**File:** `src/screens/onboarding/WhatsApp2.tsx`  
**Current behavior:** Tapping "Send Code" navigates directly to `WhatsApp3` with a hardcoded pairing code `"A1B2-C3D4"` and the real `phoneNumber` constructed from country code + input.  
**What to wire:**
1. `phoneNumber` is already constructed correctly as `${selectedCode.code}${phoneNumber.trim()}`
2. Call `POST /whatsapp/pair` (`API.whatsappPair`) with `{ phoneNumber }`
3. Receive `{ pairingCode, expiresIn }` from backend
4. Navigate to `WhatsApp3` with the real `pairingCode`, real `expiresIn`, and the `phoneNumber`

**Code location:**
```typescript
// In handleSendCode():
const fullPhone = `${selectedCode.code}${phoneNumber.trim()}`;

// MOCK MODE:
navigation.navigate('WhatsApp3', { pairingCode: 'A1B2-C3D4', phoneNumber: fullPhone });

// REAL MODE:
const res = await fetch(API.whatsappPair, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phoneNumber: fullPhone }),
});
const { pairingCode, expiresIn } = await res.json();
navigation.navigate('WhatsApp3', { pairingCode, phoneNumber: fullPhone });
// Note: pass expiresIn too and use it to initialise the countdown in WhatsApp3
```

---

## 4. WhatsApp — Code Screen (WhatsApp3 Screen)

**File:** `src/screens/onboarding/WhatsApp3.tsx`  
**Current behavior:**
- Shows pairing code passed from WhatsApp2 (currently hardcoded `"A1B2-C3D4"` in mock)
- 60s countdown starts on mount via `startTimer(60)` — hardcoded, should use `expiresIn` from API
- **"Resend Code"** button: greyed out while countdown runs, orange at 0, shows spinner on tap
  - Mock: 1s delay then resets timer (code stays same)
  - Does NOT yet call `POST /whatsapp/resend`
- **"I have entered the code"**: navigates directly to WhatsApp4 (mock, no status check)
- **"Copy Code"**: copies to clipboard — fully works

**What to wire:**

### 4a. Timer initialisation
```typescript
// WhatsApp3 receives pairingCode + phoneNumber from WhatsApp2 nav params
// Also add expiresIn to the nav param type and use it:
const { pairingCode, phoneNumber, expiresIn } = route.params;
startTimer(expiresIn ?? 60); // use real value from /whatsapp/pair response
```

### 4b. Resend Code button
```typescript
// In handleResendCode():
// MOCK MODE: 1s mock delay, same code, resets timer
// REAL MODE:
const res = await fetch(API.whatsappResend, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phoneNumber }),
});
const data = await res.json();
setCode(data.pairingCode);
startTimer(data.expiresIn ?? 60);
// On failure: setResendLoading(false) — button stays tappable, user can retry
```

### 4c. "I have entered the code" button
```typescript
// In handleCodeEntered():
// MOCK MODE: navigation.navigate('WhatsApp4');
// REAL MODE:
const userId = await AsyncStorage.getItem('userId');
const res = await fetch(API.whatsappStatus, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-user-id': userId ?? '' },
});
const { connected } = await res.json();
if (connected) navigation.navigate('WhatsApp4');
else Alert.alert('Not connected yet', 'Please make sure you entered the code in WhatsApp.');
```

> **Note for backend:** `POST /whatsapp/resend` should accept `{ phoneNumber }` and return `{ pairingCode, expiresIn }`.  
> Also update `OnboardingStackParamList` to include `expiresIn?: number` in WhatsApp3 params when this is wired.

---

## 5. SelectGroups — Fetch Groups & Start Tracking

**File:** `src/screens/onboarding/SelectGroups.tsx`  
**Current behavior (mock):**
- Uses `mockGroups` from `mockData.ts` (5 hardcoded groups)
- Toggles work locally; `saveGroupSelection()` persists to AsyncStorage via `SettingsContext`
- "Start Tracking" calls `completeOnboarding()` which sets `onboardingComplete = 'true'` in AsyncStorage

**What to wire:**
```typescript
// On screen mount, replace mockGroups with:
const userId = await AsyncStorage.getItem('userId');
const res = await fetch(API.whatsappGroups, { headers: { 'x-user-id': userId ?? '' } });
const { groups } = await res.json();
// groups shape: [{ id: string, name: string, participants: number }]
setGroups(groups.map(g => ({ ...g, tracked: false })));

// In handleStartTracking():
// saveGroupSelection(groups) already calls persistToAsyncStorage in SettingsContext
// REAL MODE: also POST /settings:
await fetch(API.settings, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
  body: JSON.stringify({ trackedGroups: groups.filter(g => g.tracked).map(g => g.id) }),
});
await completeOnboarding(realUserId); // pass real userId from /register
```

---

## 6. App Startup — Onboarding Completion Check

**File:** `App.tsx` + `src/context/AuthContext.tsx`  
**Current behavior:** On mount, `App.tsx` reads `AsyncStorage.getItem('onboardingComplete')`.
- `'true'` → renders `AppNavigator` (full app)
- `null` → renders `OnboardingNavigator`

This means a user who completed Google OAuth but crashed before WhatsApp pairing will restart from onboarding (correct behaviour).

**What changes when backend is ready:**
- No structural changes needed to `App.tsx` or `AuthContext.tsx`
- Just ensure `completeOnboarding(realUserId)` is called only from `SelectGroups` (last step), never earlier
- The `userId` key is set separately by `ConnectGoogle` when Google OAuth succeeds; `onboardingComplete` is only set when the entire flow finishes

---

## 7. Account Screen — Profile & Settings API

**File:** `src/screens/main/Account.tsx`  
**Current behavior (mock):**
- Uses `mockProfile` (name, email, sources) from `mockData.ts` directly
- Reads `trackedGroups` and `notifPrefs` from `SettingsContext` (seeded from `mockSettings`)
- Toggle changes update `SettingsContext` + AsyncStorage; a debounced console.log fires after 500ms (no real API call)

**What to wire:**
```typescript
// On Account screen mount, parallel fetch:
const userId = await AsyncStorage.getItem('userId');
const [profile, settings] = await Promise.all([
  fetch(API.profile, { headers: { 'x-user-id': userId } }).then(r => r.json()),
  fetch(API.settings, { headers: { 'x-user-id': userId } }).then(r => r.json()),
]);
// Then seed SettingsContext with the real settings:
// settings shape: { trackedGroups: [...], notifications: { medium: bool, low: bool } }
```

**Debounced persist (in `scheduleSettingsPersist`):**
```typescript
// REAL MODE: fire this after 500ms debounce:
const userId = await AsyncStorage.getItem('userId');
await fetch(API.settings, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
  body: JSON.stringify({
    trackedGroups: trackedGroups.filter(g => g.tracked).map(g => g.id),
    notifications: { high: true, medium: notifPrefs.medium, low: notifPrefs.low },
  }),
});
// On failure: revert local state, show error toast
```

> **Architecture note:** `SettingsContext` (`src/context/SettingsContext.tsx`) is the single source of truth for all toggle state. On real integration, seed it from `GET /settings` instead of `mockSettings`. The `saveGroupSelection`, `updateGroupTracked`, and `updateNotifPrefs` methods already write to AsyncStorage — add the `POST /settings` call inside each of them.

---

## 8. Account Screen — Delete Data & Sign Out

**File:** `src/screens/main/Account.tsx`  
**Current behavior (mock):**
- "Delete All My Data" shows Alert, then calls `signOut()` only (no API call)
- "Sign Out" calls `signOut()` which clears `onboardingComplete` + `userId` from AsyncStorage ✅ fully wired

**What to wire for Delete All My Data:**
```typescript
// In handleDeleteData() → Alert "Delete Everything" confirm handler:
// MOCK MODE: await signOut();
// REAL MODE:
const userId = await AsyncStorage.getItem('userId');
const res = await fetch(API.deleteAccount, {
  method: 'DELETE',
  headers: { 'x-user-id': userId ?? '' },
});
if (res.ok) {
  await signOut(); // clears AsyncStorage + flips navigator to Onboarding
} else {
  Alert.alert('Error', 'Something went wrong. Try again.');
}
```

---

## 9. Todo Screen — GET /todos

**File:** `src/screens/main/Todo.tsx`  
**Current behavior (mock):** `mockTodos.todos` loaded directly into local state on component render.  
**What to wire:**
```typescript
// In useEffect on mount (add this):
const userId = await AsyncStorage.getItem('userId');
const res = await fetch(API.todos, { headers: { 'x-user-id': userId ?? '' } });
const data = await res.json();
setTodos(data.todos);
// Show a loading spinner while fetching; show empty state on error
```
All grouping (Today/Upcoming/Overdue) and tab filtering are pure frontend logic — no changes needed there.

---

## 10. Todo Screen — Mark Done & Manual Add

**File:** `src/screens/main/Todo.tsx`

### Mark as Done (optimistic update)
```typescript
// In handleTick(id):
// Optimistic: already updates local state immediately before API call
// REAL MODE: fire this after the state update:
const userId = await AsyncStorage.getItem('userId');
const res = await fetch(API.todosDone, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-user-id': userId ?? '' },
  body: JSON.stringify({ todoId: id }),
});
// On failure: revert completedAt back to null in local state + show toast
if (!res.ok) setTodos(prev => prev.map(t => t.id === id ? { ...t, completedAt: null } : t));
```

### Manual Add (+ FAB → AddTodoModal)
The user explicitly requested a manual add button (overrides spec's "AI-only" rule).  
```typescript
// In handleAddTodo(partial):
// MOCK MODE: just prepends to local state with userAdded: true
// REAL MODE: POST to a new backend endpoint:
const userId = await AsyncStorage.getItem('userId');
const res = await fetch(API.todos, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-user-id': userId ?? '' },
  body: JSON.stringify({ ...partial, userAdded: true }),
});
const { todo } = await res.json();
setTodos(prev => [todo, ...prev]); // use server-assigned ID
```

> **Backend note:** Add `POST /todos` endpoint for manual creation. Store with `source: "manual"` in `todos/active.json`. Return the created todo object with a real UUID.

---

## 11. SettingsContext — GET /settings on App Mount

**File:** `src/context/SettingsContext.tsx`  
**Current behavior:** On mount, reads from AsyncStorage. If nothing in AsyncStorage, seeds from `mockSettings` (hardcoded 3 groups, medium=true, low=false).  
**What to wire:**
```typescript
// In the load() useEffect inside SettingsProvider:
// MOCK MODE: if (!groupsJson) setTrackedGroups(mockSettings.trackedGroups)
// REAL MODE:
const userId = await AsyncStorage.getItem('userId');
const res = await fetch(API.settings, { headers: { 'x-user-id': userId ?? '' } });
const data = await res.json();
setTrackedGroups(data.trackedGroups);
setNotifPrefs({ ...data.notifications, high: true });
// Also write to AsyncStorage so offline reads work:
await AsyncStorage.setItem(GROUPS_KEY, JSON.stringify(data.trackedGroups));
await AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(data.notifications));
```

> **Architecture note:** `SettingsContext` is read by `Account`, `Info`, `HomeFeed`, and `ManageGroups`. All four will automatically reflect real data once this single context is wired.

---

## 12. HomeFeed Screen — GET /feed

**File:** `src/screens/main/HomeFeed.tsx`  
**Current behavior:** Uses `mockFeed.cards` from `mockData.ts` directly — no API call, no loading state.  
**What to wire:**
```typescript
// Add useEffect + useState for feed cards:
const [feedCards, setFeedCards] = useState<FeedCard[]>([]);

useEffect(() => {
  async function loadFeed() {
    const userId = await AsyncStorage.getItem('userId');
    const res = await fetch(API.feed, { headers: { 'x-user-id': userId ?? '' } });
    const data = await res.json();
    setFeedCards(data.cards);
  }
  loadFeed();
}, []);

// Replace all mockFeed.cards references with feedCards
```

**Filtering stays the same** — `infoItems`, `actionItems`, `lowPriorityItems` are derived from the card array with `notifPrefs` from `SettingsContext`. No changes needed there.

> **Pull-to-refresh:** Add `RefreshControl` to the `ScrollView` to allow the user to manually refresh the feed. Call `loadFeed()` on refresh.

---

## 13. Info Screen — Feed Data

**File:** `src/screens/main/Info.tsx`  
**Current behavior:**
- Uses `mockFeed.cards` filtered to `type === 'INFO'`
- Dismiss ("X") button removes the card from the local `dismissedIds` Set — **local only, no API call** (feedback API not implemented in prototype)

**What to wire (feed data only):**

Same as HomeFeed (§12) — replace `mockFeed.cards` with a real `GET /feed` call. Info filters `type === 'INFO'` from the same response. If HomeFeed and Info share a feed context in future, only one fetch is needed.

```typescript
// On mount:
const userId = await AsyncStorage.getItem('userId');
const res = await fetch(API.feed, { headers: { 'x-user-id': userId ?? '' } });
const { cards } = await res.json();
setAllCards(cards.filter(c => c.type === 'INFO'));
```

> **Note:** Card dismiss stays local-only in the prototype. The card simply disappears from the UI for the session and reappears on next app open. No `POST /feedback` is made.

---

## 14. Chat Screen — POST /chat

**File:** `src/screens/main/Chat.tsx`  
**Current behavior (mock):** Waits 1.5s, then shows a hardcoded placeholder response for any message sent.  
**What to wire:**
```typescript
// In sendMessage(), replace the mock block with:
const userId = await AsyncStorage.getItem('userId');
const res = await fetch(API.chat, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-user-id': userId ?? '',
  },
  body: JSON.stringify({ message: trimmed }),
});
const data = await res.json();
const answer = data.answer; // plain text, may contain \n- bullet points

// On failure: show "Something went wrong. Tap to retry." in the bot bubble
// The retry button should re-call sendMessage(trimmed) with the same text
```

**What stays the same after wiring:**
- User bubble appears immediately (no change needed)
- Typing indicator shows while fetch is in flight (no change needed)
- `containsTaskList(answer)` detection for "View all tasks" button (no change needed)
- Follow-up chips after each response (no change needed)
- Disclaimer always visible (no change needed)
- No chat history between sessions (stateless by design)

---

*Last updated: 2026-06-14*
