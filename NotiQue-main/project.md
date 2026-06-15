# NotiQue — AI IDE Project Brief

## What This File Is
This is the complete project brief for NotiQue. Read this entire file before writing any code. Every color, font, component, screen, and API call is defined here. Do not deviate from these specs unless explicitly told to.

---

## What NotiQue Is
NotiQue is a unified AI-powered student assistant mobile app. It connects to WhatsApp groups, Gmail, and Google Classroom — reads everything across all three sources — classifies every message by importance and action requirement — and surfaces only what the student actually needs to know, before they even think to look.

It is not a chatbot. It is not a notification forwarder. It is an ambient AI layer that eliminates the noise between a student and what actually matters.

---

## Tech Stack

### Frontend
- **Framework:** Expo + React Native (TypeScript)
- **Styling:** NativeWind (Tailwind for React Native)
- **Navigation:** React Navigation (Bottom Tabs + Stack)
- **Local Storage:** AsyncStorage (saves userId on device)
- **Push Notifications:** expo-notifications
- **Auth:** expo-auth-session (Google OAuth)
- **API Calls:** fetch (no Axios, no extra library)

### Backend (already built, frontend consumes it)
- AWS Lambda + API Gateway
- AWS S3 (user data storage)
- Groq API (AI classification and chat)
- AWS SNS (push notifications)
- AWS EC2 (WhatsApp bridge)

---

## Color Palette
Use these exact hex values. No other colors. Ever.

```
bgPrimary:     #0A0A0F   → main screen background
bgCard:        #13131A   → card and list item background
bgBorder:      #1E1E2E   → card borders, dividers
accentOrange:  #FF6B2B   → primary accent, buttons, active states
textPrimary:   #FFFFFF   → all main text
textSecondary: #8B8B9E   → subtext, labels, timestamps
high:          #FF4444   → high importance tags and icons
medium:        #FF6B2B   → medium importance (same as accent)
low:           #4A4A5A   → low importance tags, muted elements
success:       #22C55E   → completed todos, connected states
whatsappGreen: #25D366   → WhatsApp specific button only
```

---

## Typography
- **Font:** Inter (Google Fonts)
- **All text uses Inter. No other fonts.**

```
Screen titles:     Inter Bold      22px
Section headings:  Inter SemiBold  16px
Card titles:       Inter SemiBold  15px
Body text:         Inter Regular   14px
Subtext/labels:    Inter Regular   13px
Timestamps:        Inter Regular   12px
Tags/pills:        Inter SemiBold  11px uppercase
```

---

## Spacing System
```
screen horizontal padding:  16px both sides
card padding:               16px
gap between cards:          8px
gap between sections:       24px
card border radius:         12px
button border radius:       10px
tag/pill border radius:     6px
```

---

## Component Specs

### FeedCard
Used on: Home Feed screen (Action cards), Info screen
```
width: full width minus 32px (16px padding each side)
background: bgCard
border: 1px bgBorder
border radius: 12px
padding: 16px

TOP ROW:
  left:  colored dot (8px circle, color = importance color) 
         + importance label text (11px uppercase semibold, importance color)
  right: source tag "WhatsApp · CSE-A" (12px secondary color)

TITLE ROW:
  Inter SemiBold 15px white
  max 2 lines, ellipsis after

DESCRIPTION ROW:
  Inter Regular 13px secondary color
  max 2 lines

BOTTOM ROW:
  left:  calendar icon (12px) + deadline text (12px orange if today, secondary if future)
  right: "✕ Not important" (12px secondary, tappable)

if reminderCount > 1:
  show "[n] reminders" in 12px secondary below description
```

### TodoItem
Used on: Todo screen
```
same card structure as FeedCard with these differences:
  left side: circle checkbox (24px, border bgBorder, tappable)
  when ticked: green checkmark fill, title gets strikethrough
  right side: importance tag pill (high/medium/low) + three dot menu removed
  deadline shown in orange if today, red if overdue, secondary if upcoming
```

### InfoCard
Used on: Info screen
```
same as FeedCard but:
  left icon: circle icon (24px) with importance icon inside
    high   → red X circle
    medium → orange ! circle  
    low    → grey i circle
  bottom row shows source + timestamp
  right: ✕ dismiss button
```

### ImportanceTag
Reusable pill component
```
high:   background #FF444420  text #FF4444  label "High"
medium: background #FF6B2B20  text #FF6B2B  label "Medium"
low:    background #4A4A5A40  text #8B8B9E  label "Low"
padding: 4px 8px
border radius: 6px
font: Inter SemiBold 11px uppercase
```

### BottomNav
Used on: all main screens
```
background: bgCard
border top: 1px bgBorder
height: 60px
four tabs: Feed | Todo | Info | Your Account
active tab: accentOrange icon + label
inactive tab: secondary color icon + label
icons: use lucide-react-native or expo vector icons
```

### RobotFAB
Floating action button, used on Feed, Todo, Info screens
```
position: absolute
bottom: 80px (above bottom nav)
right: 20px
width: 56px
height: 56px
border radius: 28px (full circle)
background: accentOrange
shadow: yes
z-index: 999
inside: robot.png image asset OR 🤖 emoji as placeholder
on tap: navigate to Chat screen
```

### OrangeButton
Primary CTA button
```
background: accentOrange
border radius: 10px
height: 52px
width: full width minus 32px
text: Inter SemiBold 16px white centered
```

### OutlineButton
Secondary button
```
background: transparent
border: 1px bgBorder
border radius: 10px
height: 52px
text: Inter SemiBold 16px white centered
```

---

## Folder Structure
```
notiQue/
  assets/
    robot.png
    cf-logo.png
  src/
    config/
      api.ts          ← BASE_URL and all endpoints
      colors.ts       ← color palette constants
      mockData.ts     ← mock API responses for development
    screens/
      onboarding/
        Welcome.tsx
        ConnectGoogle.tsx
        WhatsApp1.tsx        ← Connect WhatsApp intro
        WhatsApp2.tsx        ← Enter phone number
        WhatsApp3.tsx        ← Pairing code display
        WhatsApp4.tsx        ← WhatsApp connected success
        SelectGroups.tsx     ← Choose tracked groups
      HomeFeed.tsx
      Info.tsx
      Todo.tsx
      Chat.tsx
      Account.tsx
    components/
      FeedCard.tsx
      TodoItem.tsx
      InfoCard.tsx
      ImportanceTag.tsx
      BottomNav.tsx
      RobotFAB.tsx
      OrangeButton.tsx
      OutlineButton.tsx
    navigation/
      AppNavigator.tsx      ← main bottom tab navigator
      OnboardingNavigator.tsx ← onboarding stack navigator
    App.tsx
```

---

## API Config
```typescript
// src/config/api.ts
export const BASE_URL = "PASTE_AWS_URL_HERE"

export const API = {
  register:       BASE_URL + "/register",
  feed:           BASE_URL + "/feed",
  todos:          BASE_URL + "/todos",
  todosDone:      BASE_URL + "/todos/done",
  chat:           BASE_URL + "/chat",
  profile:        BASE_URL + "/profile",
  settings:       BASE_URL + "/settings",
  feedback:       BASE_URL + "/feedback",
  whatsappPair:   BASE_URL + "/whatsapp/pair",
  whatsappStatus: BASE_URL + "/whatsapp/status",
  sync:           BASE_URL + "/sync",
}
```

Every API call must include this header:
```
"x-user-id": userId  ← read from AsyncStorage on every call
```

userId is saved to AsyncStorage during registration and read on every subsequent app open.

---

## API Response Shapes

### GET /feed
```json
{
  "cards": [
    {
      "id": "uuid",
      "type": "ACTION or INFO",
      "importance": "high | medium | low",
      "title": "string max 80 chars",
      "description": "string one line detail",
      "source": "whatsapp | gmail | classroom",
      "sourceGroup": "CSE-A 2025",
      "studentMentioned": true,
      "reminderCount": 1,
      "deadline": "ISO8601 or null",
      "createdAt": "ISO8601",
      "expiresAt": "ISO8601"
    }
  ],
  "count": 1
}
```

### GET /todos
```json
{
  "todos": [
    {
      "id": "uuid",
      "title": "string",
      "description": "string",
      "subject": "string",
      "deadline": "ISO8601 or null",
      "importance": "high | medium | low",
      "source": "whatsapp | gmail | classroom",
      "autoTrackable": false,
      "reminderCount": 1,
      "completedAt": "ISO8601 or null",
      "fingerprint": "subject-date-string"
    }
  ]
}
```

### POST /chat
```json
request:  { "message": "string" }
response: { "answer": "string" }
```

### GET /profile
```json
{
  "userId": "uuid",
  "name": "string",
  "email": "string",
  "sources": {
    "whatsapp": true,
    "gmail": true,
    "classroom": true
  }
}
```

### POST /todos/done
```json
request:  { "todoId": "uuid" }
response: { "ok": true }
```

### POST /feedback
```json
request:  { "cardId": "uuid", "reason": "not_important" }
response: { "ok": true }
```

### POST /register
```json
request:  { "name": "string", "email": "string", "deviceToken": "string" }
response: { "userId": "uuid", "ok": true }
```

### POST /whatsapp/pair
```json
request:  { "phoneNumber": "+91XXXXXXXXXX" }
response: { "pairingCode": "A1B2C3D4", "expiresIn": 60 }
```

### POST /whatsapp/status
```json
request:  {}
response: { "connected": true, "phoneNumber": "+91XXXXXXXXXX" }
```

---

## Mock Data
Use this when BASE_URL is not ready. Import from src/config/mockData.ts
```typescript
export const mockFeed = {
  cards: [
    {
      id: "1",
      type: "ACTION",
      importance: "high",
      title: "CN Lab report due tonight",
      description: "Submit on Google Classroom by 11:59 PM",
      source: "whatsapp",
      sourceGroup: "CSE-A 2025",
      studentMentioned: true,
      reminderCount: 3,
      deadline: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString()
    },
    {
      id: "2",
      type: "INFO",
      importance: "medium",
      title: "OOP lecture moved to 2pm",
      description: "Room changed to Block A, Room 204",
      source: "whatsapp",
      sourceGroup: "CSE-A 2025",
      studentMentioned: false,
      reminderCount: 1,
      deadline: null,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString()
    },
    {
      id: "3",
      type: "INFO",
      importance: "low",
      title: "Mess menu: Rajma Chawal today",
      description: "Lunch special announced in hostel group",
      source: "whatsapp",
      sourceGroup: "Hostel Block C",
      studentMentioned: false,
      reminderCount: 1,
      deadline: null,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString()
    }
  ],
  count: 3
}

export const mockTodos = {
  todos: [
    {
      id: "1",
      title: "Submit CN Lab report",
      description: "Submit ER diagram and normalization",
      subject: "Computer Networks",
      deadline: new Date().toISOString(),
      importance: "high",
      source: "whatsapp",
      autoTrackable: false,
      reminderCount: 3,
      completedAt: null,
      fingerprint: "computer-networks-today"
    },
    {
      id: "2",
      title: "Prepare for Maths Tutorial",
      description: "Learn Integration by Parts",
      subject: "Mathematics",
      deadline: new Date(Date.now() + 86400000).toISOString(),
      importance: "medium",
      source: "classroom",
      autoTrackable: true,
      reminderCount: 1,
      completedAt: null,
      fingerprint: "mathematics-tomorrow"
    },
    {
      id: "3",
      title: "Placements Aptitude Practice",
      description: "Practice 20 quantitative questions",
      subject: "Placements",
      deadline: new Date(Date.now() - 3600000).toISOString(),
      importance: "low",
      source: "whatsapp",
      autoTrackable: false,
      reminderCount: 1,
      completedAt: new Date().toISOString(),
      fingerprint: "placements-today"
    }
  ]
}

export const mockProfile = {
  userId: "mock-user-123",
  name: "Gurvansh Singh",
  email: "gurvansh@college.edu",
  sources: {
    whatsapp: true,
    gmail: true,
    classroom: true
  }
}

export const mockGroups = [
  { id: "1", name: "CSE-A 2025", tracked: true },
  { id: "2", name: "CN Lab Group", tracked: true },
  { id: "3", name: "Placement Cell", tracked: false },
  { id: "4", name: "Hostel Block C", tracked: false },
  { id: "5", name: "F1 Fan Club 🏎️", tracked: false }
]
```

---

## Screen Breakdown

### Welcome (Onboarding)
```
full screen: bgPrimary background
center aligned vertically and horizontally

CF logo square (80px, orange background, white CF text, border radius 16)
"NotiQue" Inter Bold 24px white below logo
"The operating system for student life" Inter Regular italic 14px secondary

large gap

graduation cap icon (orange, 48px)

OrangeButton at bottom: "Get Started"
  navigate to ConnectGoogle on tap
```

### ConnectGoogle (Onboarding)
```
same header: CF logo + NotiQue + tagline

graduation cap icon

"Connect your college account" Inter SemiBold 18px white centered

Google sign-in button (white background, Google G logo, "Continue with Google")
  on tap: trigger Google OAuth via expo-auth-session
  on success: navigate to WhatsApp1
```

### WhatsApp1 (Onboarding)
```
same header

WhatsApp icon (green, 48px)

"Connect WhatsApp" Inter SemiBold 18px white centered

green OrangeButton (use whatsappGreen color): "Connect WhatsApp"
  navigate to WhatsApp2 on tap
```

### WhatsApp2 (Onboarding) — Enter Phone Number
```
same header

"Enter Your Number" Inter Bold 20px white centered
"We'll send a pairing code to link your WhatsApp" secondary italic centered

country code selector (default +91) + phone number input field

OrangeButton: "Send Code"
  call POST /whatsapp/pair with phone number
  on success: navigate to WhatsApp3 with pairingCode
```

### WhatsApp3 (Onboarding) — Pairing Code
```
same header

"Link Your Device" Inter Bold 20px white centered
"Connect your WhatsApp to get started" secondary italic centered

step indicators row:
  Go to Linked Devices → Link with phone number → Enter this code → Add a Linked Device
  small icons with arrows between them

large code display box:
  background bgCard border bgBorder border radius 12
  "A1B2-C3D4" Inter Bold 32px white monospace centered
  "Code expires in X seconds" Inter Regular 12px high color below

"Resend Code?" text button in orange below box

OrangeButton: "I have entered the code"
  call POST /whatsapp/status
  on connected: navigate to WhatsApp4
```

### WhatsApp4 (Onboarding) — Connected
```
same header

large green checkmark circle (80px, success color)

"WhatsApp connected!" Inter Bold 22px white centered
"Now choose your groups" Inter Regular 14px secondary centered

OrangeButton: "Choose Groups →"
  navigate to SelectGroups
```

### SelectGroups (Onboarding)
```
CF logo top left, graduation cap top right

"Choose Groups" Inter Bold 20px white (full width orange outlined button style as heading)

list of groups fetched from WhatsApp bridge:
  each row: bgCard background, border radius 12, 56px height
  left: group icon (person/people icon) + group name Inter SemiBold 15px white
  right: toggle (orange when ON, grey when OFF)

realistic names from mockGroups

OrangeButton at bottom: "Start Tracking"
  save settings via POST /settings
  navigate to main app (HomeFeed)
```

### HomeFeed (Main)
```
TOP BAR:
  left: CF logo (40px)
  center: "NotiQue" Inter SemiBold 18px white
  right: bell icon (accentOrange)

GREETING:
  "Good morning," Inter Regular 16px secondary
  "Gurvansh" Inter Bold 28px white (name from profile)
  below: pill showing "3 things need your attention" with orange dot

TWO CARD LAYOUT:
  two cards side by side with 8px gap

  LEFT CARD — Info:
    header row: orange i icon + "Info" semibold + "View all →" orange right
    list of 3 INFO cards from feed (type=INFO)
    each item: one line title + timestamp below
    importance dot on left of each item

  RIGHT CARD — Actions:
    header row: orange checkbox icon + "Actions" semibold + "View all →" orange right
    list of 3 ACTION cards from feed (type=ACTION)
    each item: circle checkbox + title + importance tag below

OTHERS ROW:
  full width bgCard row
  left: ... icon + "Others" secondary text
  right: chevron down
  collapsed by default
  shows LOW importance items when expanded

RobotFAB: bottom right, navigates to Chat

BOTTOM NAV: Feed active
```

### Info (Main)
```
TOP BAR: same pattern

HEADER:
  "Info" Inter Bold 28px white
  "Important updates and announcements so you stay informed." secondary
  megaphone icon top right (orange)

FILTER TABS:
  All | High | Medium | Low
  active tab: orange outlined pill
  inactive: no background

GROUPED LIST:
  Today / Yesterday / This Week sections
  each section: label left + "N updates" right
  InfoCard components for each item
  "View all for [period] →" orange link after 3 items

BOTTOM NAV: Info active
```

### Todo (Main)
```
TOP BAR: same pattern, clipboard+clock icon top right

HEADER:
  "My" white + "Todo" orange — Inter Bold 28px
  "Stay on top of your tasks and never miss what matters." secondary

STATS ROW:
  four pills: All Tasks | Pending | Completed | Overdue (red dot)
  numbers in orange/green/red accordingly

FILTER TABS:
  All | Pending | Completed | Overdue

GROUPED LIST:
  Today / Upcoming / Overdue sections
  TodoItem component for each
  completed items show strikethrough + green checkmark

RobotFAB: bottom right

BOTTOM NAV: Todo active
```

### Chat (Main)
```
TOP BAR:
  left: CF logo
  center: "NotiQue AI" Inter SemiBold 18px white
  right: history/clock icon

GREETING SECTION:
  "Hi, [name] 👋" Inter Bold 26px white
  "How can I help you today?" secondary
  robot.png image positioned absolute top right (120px)

QUICK CHIPS (2x2 grid):
  "What's due today?"
  "Summarize unread class updates"
  "Any classes canceled tomorrow?"
  "Any class updates?"
  each: bgCard background, border radius 10, icon + text

CHAT AREA:
  AI messages: left aligned, bgCard bubble, CF logo avatar
  User messages: right aligned, accentOrange bubble, white text
  timestamps below each bubble in secondary 11px

SUGGESTION CHIPS (below conversation):
  "Show my upcoming tasks"
  "Any class updates?"
  horizontal scroll row

INPUT BAR:
  bgCard background, border radius 12
  "Ask anything..." placeholder secondary
  send button: orange circle with up arrow

DISCLAIMER:
  "NotiQue AI can make mistakes. Please verify important information."
  Inter Regular 11px secondary centered

BOTTOM NAV: no active (chat is accessed via FAB)
```

### Account (Main)
```
TOP BAR:
  left: CF logo
  center: "Your Account" Inter SemiBold 18px white
  right: settings gear icon (orange)

PROFILE:
  large circle 72px: orange background, white initials "GS"
  name: Inter Bold 20px white centered
  email: Inter Regular 14px secondary centered
  college pill: "SRM KTR · CSE" bgCard border radius 20

SECTIONS (each with uppercase 11px secondary label):

CONNECTED SOURCES:
  three rows (WhatsApp, Gmail, Google Classroom)
  each: icon + name + "Connected" green pill + green dot

TRACKED GROUPS:
  rows with toggle
  "CSE-A 2025" ON, "CN Lab Group" ON, "Placement Cell" OFF
  "+ Manage Groups" orange text link below

NOTIFICATIONS:
  High Importance — toggle ON but greyed (always on)
  Medium Importance — toggle ON (can change)
  Low Importance — toggle OFF (can change)
  subtext under each in secondary 12px

ACCOUNT:
  "Delete All My Data" — red text, trash icon, chevron right
  "Sign Out" — white text, sign out icon, chevron right

BOTTOM NAV: Your Account active
```

---

## Navigation Structure
```
ROOT:
  if no userId in AsyncStorage → OnboardingNavigator
  if userId exists → AppNavigator

OnboardingNavigator (Stack):
  Welcome → ConnectGoogle → WhatsApp1 → WhatsApp2 
  → WhatsApp3 → WhatsApp4 → SelectGroups → AppNavigator

AppNavigator (Bottom Tabs):
  HomeFeed (Feed)
  Todo
  Info
  Account (Your Account)

Chat screen accessed via RobotFAB from any main screen
  uses Stack navigation pushed on top of current tab
```

---

## Key Behaviours

### userId flow
```
app opens
→ check AsyncStorage for userId
→ if exists: go to main app, use it in every API call header
→ if not: go to onboarding, register, save userId, go to main app
```

### feed card grouping (Info screen)
```
today:     createdAt date === today's date
yesterday: createdAt date === yesterday's date
this week: createdAt date within last 7 days
```

### todo grouping
```
today:    deadline date === today
upcoming: deadline date > today, completedAt is null
overdue:  deadline date < today, completedAt is null
completed shown only when "Completed" filter tab is active
```

### importance color mapping
```
"high"   → colors.high    (#FF4444)
"medium" → colors.medium  (#FF6B2B)
"low"    → colors.low     (#4A4A5A)
```

### deadline display formatting
```
today:     "Today, 11:59 PM"  → orange color
tomorrow:  "Tomorrow, 10:00 AM" → secondary color
past:      "May 14, 6:00 PM"  → red color (overdue)
future:    "May 18, 4:00 PM"  → secondary color
```

---

## Rules For The AI IDE
1. always use the exact hex values from the color palette — no approximations
2. always use Inter font — no system fonts
3. every screen has bgPrimary as background
4. every API call includes x-user-id header from AsyncStorage
5. use mock data from mockData.ts until BASE_URL is filled in
6. RobotFAB appears on HomeFeed, Todo, and Info screens only
7. never add features not listed in this brief
8. card border radius is always 12px
9. buttons are always 52px height full width
10. bottom nav is always 60px height
11. do not use any third party UI component libraries — build from spec
12. typescript strict mode — type everything properly
13. when API call is loading show a subtle skeleton loader in bgCard color
14. when API call fails show a simple retry button in accentOrange

---

*NotiQue — The operating system for student life*
*Built for HackOn with Amazon Season 6.0*


How Backend Connects to Frontend
the connection is one URL
the entire backend is accessible through a single API Gateway URL. when the backend team deploys, they give you one string that looks like:
https://xxxxxxxxxx.execute-api.ap-south-1.amazonaws.com/prod
paste that into src/config/api.ts as BASE_URL. every screen automatically starts using real data instead of mock data. nothing else changes.
until that URL exists, every screen uses mockData.ts. the code structure is identical either way — just swap the data source.

how each screen gets its data
screen mounts
→ read userId from AsyncStorage
→ if no userId → redirect to onboarding
→ if userId exists → call the relevant API endpoint
→ show skeleton loader (bgCard colored placeholder) while waiting
→ render real data when response arrives
→ show retry button in accentOrange if call fails

Google OAuth — how it actually works in Expo
Google OAuth does NOT need EventBridge. EventBridge is only for the GCR periodic sync on the backend. the frontend Google auth flow is completely separate:
user taps "Continue with Google"
→ expo-auth-session opens Google's login page in a browser popup
→ user signs in with their college Google account
→ Google redirects back to the app with an auth code
→ app sends that auth code to POST /register on the backend
→ backend exchanges it for access token + refresh token
→ backend stores tokens in S3 under that userId
→ backend returns userId to app
→ app saves userId to AsyncStorage
→ app navigates to WhatsApp onboarding
the frontend never touches tokens directly. it just passes the auth code to the backend and gets a userId back.

placeholder strategy while backend is not ready
for every screen that needs real data, use this exact pattern:
step 1: build the screen fully with mock data from mockData.ts
step 2: the UI looks and works exactly as designed
step 3: when BASE_URL is filled in, replace mock data with:
        const response = await fetch(API.feed, {
          headers: { 'x-user-id': userId }
        })
        const data = await response.json()
step 4: UI renders identically, just with real data
specific placeholders per screen:
ConnectGoogle screen:
  → "Continue with Google" button shows normally
  → on tap: currently navigates directly to WhatsApp1 (mock)
  → when backend ready: triggers real OAuth flow first

WhatsApp2 screen (phone number entry):
  → "Send Code" button shows normally
  → on tap: currently navigates directly to WhatsApp3 with hardcoded code "A1B2-C3D4" (mock)
  → when backend ready: calls POST /whatsapp/pair first

WhatsApp3 screen (pairing code):
  → shows hardcoded "A1B2-C3D4" as the code (mock)
  → "I have entered the code" navigates directly to WhatsApp4 (mock)
  → when backend ready: calls POST /whatsapp/status to verify connection first

SelectGroups screen:
  → shows mockGroups list (mock)
  → "Start Tracking" navigates directly to HomeFeed (mock)
  → when backend ready: calls POST /settings first

HomeFeed screen:
  → shows mockFeed.cards split into ACTION and INFO (mock)
  → when backend ready: calls GET /feed

Todo screen:
  → shows mockTodos.todos (mock)
  → tick button calls POST /todos/done (this can be wired to real API immediately, just logs if no backend yet)
  → when backend ready: calls GET /todos

Info screen:
  → shows mockFeed.cards filtered to type=INFO (mock)
  → same feed endpoint as HomeFeed, different filter

Chat screen:
  → input sends message
  → currently shows hardcoded response "I'll be able to answer questions once connected to your data." (mock)
  → when backend ready: calls POST /chat

Account screen:
  → shows mockProfile data (mock)
  → when backend ready: calls GET /profile

the one file that controls everything
src/config/api.ts

change BASE_URL from placeholder string to real AWS URL
→ every screen switches from mock to real simultaneously
→ no other file needs to change
→ this is the single handoff moment between frontend and backend



paste this into NOTIQUEPROJECT.md under a new section:

---

## WhatsApp Groups — How They Load on SelectGroups Screen

### the full flow
```
user completes WhatsApp pairing (WhatsApp2 + WhatsApp3 screens)
→ bridge on EC2 is now connected to user's WhatsApp account
→ user reaches SelectGroups screen
→ app calls GET /whatsapp/groups with x-user-id header
→ Lambda receives request
→ Lambda calls EC2 bridge internally on port 3001
→ bridge runs client.getChats() via whatsapp-web.js
→ filters results to groups only (excludes individual chats)
→ returns array of group objects to Lambda
→ Lambda returns array to app
→ app renders each group as a toggle row
→ user toggles which groups to track
→ user taps "Start Tracking"
→ app calls POST /settings with selected group IDs
→ navigates to HomeFeed
```

---

### API endpoint
```
GET /whatsapp/groups
headers: x-user-id: {userId}

response:
{
  "groups": [
    { "id": "xxxxx@g.us", "name": "CSE-A 2025", "participants": 67 },
    { "id": "xxxxx@g.us", "name": "CN Lab Group", "participants": 23 },
    { "id": "xxxxx@g.us", "name": "Placement Cell", "participants": 89 },
    { "id": "xxxxx@g.us", "name": "Hostel Block C", "participants": 34 },
    { "id": "xxxxx@g.us", "name": "F1 Fan Club", "participants": 142 }
  ]
}
```

---

### how SelectGroups screen uses this data
```
screen mounts
→ show skeleton loader (bgCard colored rows) while fetching
→ call GET /whatsapp/groups
→ on success: render each group as a toggle row
→ on failure: show retry button in accentOrange

each toggle row:
  left:  people icon (secondary color) + group.name (textPrimary 15px semibold)
         + participant count below (textSecondary 12px) e.g. "67 members"
  right: toggle (orange when ON, bgBorder when OFF)
         default state: all toggles OFF
         user must explicitly turn ON the groups they want

bottom: OrangeButton "Start Tracking"
  disabled (grey) until at least one group is toggled ON
  enabled (orange) when one or more groups selected
  on tap: collect all group IDs where toggle is ON
          call POST /settings with:
          { "trackedGroups": ["xxxxx@g.us", "xxxxx@g.us"] }
          on success: navigate to HomeFeed
```

---

### mock data while backend not ready
```
import { mockGroups } from '../config/mockData'

mockGroups shape:
[
  { id: "1", name: "CSE-A 2025", participants: 67, tracked: false },
  { id: "2", name: "CN Lab Group", participants: 23, tracked: false },
  { id: "3", name: "Placement Cell", participants: 89, tracked: false },
  { id: "4", name: "Hostel Block C", participants: 34, tracked: false },
  { id: "5", name: "F1 Fan Club 🏎️", participants: 142, tracked: false }
]

all tracked: false by default
user toggles them ON
when BASE_URL is filled in: replace mockGroups with GET /whatsapp/groups call
rendering logic stays identical
```

---

### add to api.ts
```
whatsappGroups: BASE_URL + "/whatsapp/groups"
```

---

### important UI rules for this screen
- show participant count under each group name so user knows group size
- do not pre-select any groups — user must explicitly choose
- "Start Tracking" button stays grey and unresponsive until at least one group is ON
- if GET /whatsapp/groups returns empty array — show message "No WhatsApp groups found. Make sure your WhatsApp is connected." with a back button
- list is scrollable if user has many groups — no fixed height cap


paste this into NOTIQUEPROJECT.md under a new section:

---

## Info Screen — How The API Works

### what the info screen is
the Info screen displays INFO type cards only — messages and updates that the student needs to know about but do not require any action. class cancellations, lecture reschedules, announcements, exam notices. no todos created from these, just awareness.

---

### where the data comes from
the Info screen calls the exact same endpoint as the Home Feed:
```
GET /feed
headers: x-user-id: {userId}
```

the difference is purely frontend filtering. the app receives all cards and filters by type:
```
HomeFeed screen → show type === "ACTION" cards in Actions panel
Info screen     → show type === "INFO" cards only
```

no separate backend endpoint. no separate API call. same data, different filter.

---

### how the screen loads data
```
screen mounts
→ read userId from AsyncStorage
→ call GET {API.feed} with x-user-id header
→ show skeleton loaders (bgCard colored rows) while waiting
→ on success:
    filter cards where card.type === "INFO"
    group by date:
      today     → card.createdAt date === today
      yesterday → card.createdAt date === yesterday
      this week → card.createdAt within last 7 days
    sort within each group by importance:
      high first, then medium, then low
    render grouped list
→ on failure: show retry button in accentOrange
```

---

### filter tabs behaviour
```
four tabs at top: All | High | Medium | Low

All tab (default):
  show all INFO cards regardless of importance

High tab:
  filter to cards where importance === "high"

Medium tab:
  filter to cards where importance === "medium"

Low tab:
  filter to cards where importance === "low"

tab filtering happens entirely on the frontend
no new API call when switching tabs
just re-filter the already fetched cards array
active tab: orange outlined pill
inactive tab: no background, secondary text color
```

---

### dismiss button behaviour
```
user taps ✕ on a card
→ call POST {API.feedback} with:
  { "cardId": card.id, "reason": "not_important" }
→ on success:
    remove card from local state immediately (optimistic update)
    card disappears from feed without reload
→ on failure:
    show brief error toast "couldn't dismiss, try again"
    card stays visible
```

---

### what each InfoCard renders from the API response
```
card.importance     → icon type and color
                      high   → red X circle icon
                      medium → orange ! circle icon
                      low    → grey i circle icon

card.title          → Inter SemiBold 15px white, max 2 lines

card.description    → Inter Regular 13px secondary, max 2 lines

card.createdAt      → formatted time e.g. "9:15 AM" shown below description

card.source         → source icon + source label
card.sourceGroup    → shown as "WhatsApp · CSE-A 2025" or "Gmail · Prof. Sharma"
                      Inter Regular 12px secondary

card.importance     → ImportanceTag component top right of card
                      high = red tag, medium = orange tag, low = grey tag

✕ button            → top right, secondary color, calls POST /feedback on tap
```

---

### grouping logic — frontend only
```javascript
const today = new Date().toDateString()
const yesterday = new Date(Date.now() - 86400000).toDateString()

const grouped = {
  today:     cards.filter(c => new Date(c.createdAt).toDateString() === today),
  yesterday: cards.filter(c => new Date(c.createdAt).toDateString() === yesterday),
  thisWeek:  cards.filter(c => {
    const d = new Date(c.createdAt).toDateString()
    return d !== today && d !== yesterday
  })
}
```

only render a section if it has cards. if today has no INFO cards, skip the Today section entirely. don't show empty sections.

---

### mock data for Info screen
```typescript
import { mockFeed } from '../config/mockData'

const infoCards = mockFeed.cards.filter(c => c.type === 'INFO')
```

mockFeed already contains INFO type cards. just filter and render. no separate mock needed.

---

### view all behaviour
```
each date section shows max 3 cards
if section has more than 3:
  show "View all for today →" link in accentOrange below the 3rd card
  tapping it expands the section to show all cards in that group
  no navigation to new screen, just inline expand
  link changes to "Show less" after expanding
```

---

### empty state
```
if no INFO cards exist at all:
  show centered message:
    icon: megaphone outline (secondary color, 48px)
    text: "No updates yet"
    subtext: "New announcements from your groups and email will appear here"
    both in secondary color, centered

if a specific filter tab returns no results:
  show centered message:
    text: "No [High/Medium/Low] updates"
    subtext: "Try switching to All"
```

---

### rules for the AI IDE
- never make a separate API call for the Info screen — reuse the feed data already fetched
- filtering by type and importance happens in component state, not via API parameters
- dismiss action uses optimistic update — remove from UI first, then call API
- never show ACTION type cards on this screen under any circumstance
- the ImportanceTag component is already defined in components/ImportanceTag.tsx — import and reuse it
- skeleton loader shows 3 placeholder rows while data loads, same height as real cards

paste this into NOTIQUEPROJECT.md under a new section:

---

## Account Screen — How The API Works

## College Pill — How It Works

on registration:
  Google OAuth returns name and email
  extract domain from email: email.split('@')[1]
  map domain to college name:
    srmist.edu.in     → "SRM KTR"
    vit.ac.in         → "VIT Vellore"
    bits-pilani.ac.in → "BITS Pilani"
    iit*.ac.in        → "IIT"
    nit*.ac.in        → "NIT"
    default           → domain itself if no match found
  store collegeName in profile.json alongside name and email
  branch is not collected in prototype — pill shows college name only
  in production: additional onboarding step collects branch

on delete all my data:
  Lambda deletes entire users/{userId}/ folder from S3
  all data gone permanently
  Google account itself is never touched
  user can re-register fresh with same Google account


### what the account screen does
displays the student's profile, connected sources status, tracked WhatsApp groups with toggles, notification preferences, and account actions. it reads from two endpoints and writes to one.

---

### API calls this screen makes

**on screen mount — two calls in parallel:**
```
GET /profile      → loads name, email, connected sources
GET /settings     → loads tracked groups, notification preferences
```

both calls happen simultaneously using Promise.all so the screen doesn't load sequentially.

**on toggle change (tracked groups):**
```
POST /settings
body: { 
  "trackedGroups": ["id1", "id2"],   ← only the ON group IDs
  "notifications": {
    "high": true,
    "medium": true,
    "low": false
  }
}
```

called every time any toggle changes. debounce by 500ms so rapid toggles don't spam the API.

**on Delete All My Data tap:**
```
DELETE /profile
headers: x-user-id: {userId}
response: { "ok": true }

on success:
  clear userId from AsyncStorage
  clear all local state
  navigate to Welcome onboarding screen
```

add this route to api.ts:
```
deleteAccount: BASE_URL + "/profile"  ← method DELETE
```

**on Sign Out tap:**
```
no API call needed
just clear userId from AsyncStorage
navigate to Welcome onboarding screen
```

---

### what GET /profile returns and what renders it
```json
{
  "userId": "uuid",
  "name": "Gurvansh Singh",
  "email": "gurvansh@college.edu",
  "sources": {
    "whatsapp": true,
    "gmail": true,
    "classroom": true
  }
}
```

renders as:
```
profile.name        → "Gurvansh Singh" Inter Bold 20px white centered
                      initials extracted for avatar circle:
                      "GS" from "Gurvansh Singh" — first letter of each word
                      orange circle 72px, white Inter Bold 28px initials

profile.email       → Inter Regular 14px secondary centered

college pill        → hardcoded "SRM KTR · CSE" for prototype
                      bgCard background, border radius 20, secondary text 13px

sources.whatsapp    → WhatsApp row: if true show green "Connected" pill + green dot
                      if false show grey "Not connected" pill + grey dot
sources.gmail       → same pattern for Gmail row
sources.classroom   → same pattern for Google Classroom row
```

---

### what GET /settings returns and what renders it
```json
{
  "trackedGroups": [
    { "id": "xxxxx@g.us", "name": "CSE-A 2025", "tracked": true },
    { "id": "xxxxx@g.us", "name": "CN Lab Group", "tracked": true },
    { "id": "xxxxx@g.us", "name": "Placement Cell", "tracked": false }
  ],
  "notifications": {
    "high": true,
    "medium": true,
    "low": false
  }
}
```

renders as:
```
trackedGroups array  → one toggle row per group
                       group.name: Inter SemiBold 15px white
                       toggle: orange if group.tracked === true
                               grey if group.tracked === false

notifications.high   → High Importance toggle
                        always renders as ON and non-interactive
                        toggle visually orange but greyed out handle
                        subtext: "Always on" 12px secondary

notifications.medium → Medium Importance toggle
                        interactive, orange if true grey if false
                        subtext: "Deadlines within the week" 12px secondary

notifications.low    → Low Importance toggle
                        interactive, orange if true grey if false
                        subtext: "Social messages, mess menu" 12px secondary
```

---

### toggle state management
```
local state holds a copy of settings on screen mount
user toggles a group or notification preference
→ update local state immediately (optimistic update)
→ UI reflects change instantly
→ debounced POST /settings fires 500ms after last toggle change
→ on API failure: revert local state to previous value
                  show brief error toast
```

---

### delete all my data — confirmation flow
```
user taps "Delete All My Data"
→ show confirmation alert:
    title: "Are you sure?"
    message: "This removes all your data from NotiQue permanently. This cannot be undone."
    buttons: "Cancel" (dismiss) | "Delete Everything" (red, confirm)

user taps "Delete Everything"
→ call DELETE /profile
→ on success:
    clear AsyncStorage
    navigate to Welcome screen
    show no success message — just land on Welcome cleanly
→ on failure:
    show error toast "Something went wrong. Try again."
```

---

### manage groups button
```
"+ Manage Groups" orange text link below tracked groups list
on tap: navigate to SelectGroups onboarding screen
        but with back button available (not a one-way flow like onboarding)
        user can add or remove tracked groups at any time
        on save: calls POST /settings with updated group list
        on back: navigates back to Account screen
```

---

### mock data for account screen
```typescript
import { mockProfile } from '../config/mockData'

const mockSettings = {
  trackedGroups: [
    { id: "1", name: "CSE-A 2025", tracked: true },
    { id: "2", name: "CN Lab Group", tracked: true },
    { id: "3", name: "Placement Cell", tracked: false }
  ],
  notifications: {
    high: true,
    medium: true,
    low: false
  }
}
```

add mockSettings to mockData.ts. when BASE_URL is ready, replace with real GET /settings call.

---

### rules for the AI IDE
- GET /profile and GET /settings must be called in parallel with Promise.all — not sequentially
- initials for avatar are always first letter of first name + first letter of last name, uppercase
- High Importance toggle must always appear ON and must not be interactive — render it as a disabled toggle
- all toggle changes use optimistic update — update UI first, then call API
- Delete All My Data must show a confirmation alert before calling DELETE /profile
- Sign Out clears AsyncStorage only — no API call
- college pill "SRM KTR · CSE" is hardcoded for prototype — document as "user-provided during registration" in PRD
- RobotFAB does not appear on Account screen

paste this into NOTIQUEPROJECT.md under a new section:

---

## Chat Screen — How The AI API Works

### what the chat does
the student types a question in natural language. the app sends it to the backend. Lambda reads the student's stored data from S3, injects it into a prompt as context, calls Groq/Bedrock, and returns a grounded answer. the AI never makes things up — it only answers from what exists in the student's S3 data.

---

### the full flow step by step
```
student types: "do i have anything due today?"
→ app calls POST /chat with the message
→ Lambda reads two files from S3 simultaneously:
    users/{userId}/feed/active.json
    users/{userId}/todos/active.json
→ Lambda builds a prompt:
    system: "you are a student assistant. answer ONLY from the data below.
             if the answer is not in the data say:
             'I don't see that in your current updates.'
             be concise. use bullet points for lists.
             never make up information."
    context: inject the feed cards and todos as JSON
    user message: "do i have anything due today?"
→ Lambda calls Groq API with the full prompt
→ Groq returns a natural language answer
→ Lambda returns { "answer": "..." } to the app
→ app renders the answer as a chat bubble
```

---

### what makes it RAG not a generic chatbot
```
normal chatbot:
  user asks → AI answers from training data → can hallucinate

this chat:
  user asks → Lambda fetches student's actual S3 data →
  injects it as context → AI answers ONLY from that context →
  cannot hallucinate because context is the only source
```

the AI has no memory of previous conversations. every chat message is a fresh call with the full S3 context injected. this means:

- the AI always has up to date information (whatever is in S3 right now)
- the AI never confuses one student's data with another's
- the AI cannot answer questions about things outside the student's feed and todos

---

### the prompt structure sent to Groq
```
SYSTEM:
You are a student assistant for NotiQue.
Answer the student's question using ONLY the data provided below.
Rules:
- if the answer is not in the data say exactly:
  "I don't see that in your current updates."
- be concise. use bullet points when listing multiple items.
- for deadlines be specific: say "tonight at 11:59 PM" not "soon"
- never say "based on the data" or refer to any system
- just answer naturally as if you know the student's schedule
- if asked about all upcoming deadlines sort by soonest first
- never invent courses, assignments, or deadlines

STUDENT'S CURRENT FEED:
[injected from feed/active.json]

STUDENT'S ACTIVE TODOS:
[injected from todos/active.json]

USER:
[student's actual question]
```

---

### API call the frontend makes
```
POST /chat
headers: x-user-id: {userId}
body: { "message": "do i have anything due today?" }

response:
{ "answer": "Yes, you have 2 things due today:\n- CN Lab report at 11:59 PM (high priority)\n- Maths tutorial at 5:00 PM (medium priority)" }
```

the answer field is plain text with newlines. the frontend renders it as a chat bubble. bullet points in the answer use \n- formatting which the frontend converts to visible list items.

---

### quick suggestion chips — how they work
```
the 4 chips shown before any conversation:
  "What's due today?"
  "Summarize unread class updates"
  "Any classes canceled tomorrow?"
  "Any class updates?"

these are hardcoded strings in the frontend
tapping a chip:
  → pre-fills the text input with that string
  → automatically submits it as if the user typed it
  → no separate API call, just triggers the same POST /chat flow
  → chip disappears once first message is sent
```

---

### suggestion chips below conversation — how they work
```
after each AI response two contextual chips appear:
  "Show my upcoming tasks"
  "Any class updates?"

these are also hardcoded in the frontend
same behaviour — tap to pre-fill and submit
they stay visible until the user sends another message
```

---

### loading state
```
user sends message
→ user bubble appears immediately on the right
→ AI bubble appears with animated typing indicator (three dots)
→ POST /chat is in flight
→ when response arrives: replace typing indicator with actual answer
→ if call fails: replace typing indicator with:
  "Something went wrong. Tap to retry."
  in secondary color, tappable to resend the same message
```

---

### "View all tasks" button in chat response
```
when the AI response contains a list of tasks:
  the frontend detects if answer contains todo items
  shows a "View all tasks →" button below the AI bubble
  tapping it navigates to the Todo screen
  this button is hardcoded frontend logic
  not returned by the API
```

---

### mock behaviour while backend not ready
```
user sends any message
→ app waits 1.5 seconds (simulates API call)
→ shows hardcoded response:
  "I'll be able to answer questions once connected to your data.
   Your feed and todos will appear here when the backend is ready."
→ when BASE_URL is filled in: replace mock with real POST /chat call
→ everything else (bubbles, chips, loading state) works identically
```

---

### rules for the AI IDE
- every chat call must include x-user-id header from AsyncStorage
- user bubble appears immediately on send — do not wait for API response
- typing indicator shows while POST /chat is in flight
- the chat has no persistent history between app sessions — each open is fresh
- suggestion chips disappear after first message is sent
- "View all tasks" button appears only when response contains a list of items
- never store the conversation in S3 — chat is stateless by design
- the disclaimer "NotiQue AI can make mistakes. Please verify important information." is always visible below the input bar — never remove it
- chat screen does not have a RobotFAB — it IS the chat screen


paste this into NOTIQUEPROJECT.md under a new section:

---

## Todo Screen — How The API Works

### what the todo screen does
displays all ACTION items the AI has extracted across WhatsApp, Gmail, and GCR. auto-populated by the backend — the student never manually creates a todo for something NotiQue already knows about. GCR submissions are tracked automatically. everything else is ticked manually. once ticked, an item never comes back.

---

### the full flow step by step
```
student opens Todo screen
→ app calls GET /todos with x-user-id header
→ Lambda reads users/{userId}/todos/active.json from S3
→ returns array of todo items sorted by deadline ascending
→ app groups them into Today / Upcoming / Overdue
→ renders each as a TodoItem component

student ticks a todo manually:
→ app calls POST /todos/done with { "todoId": "uuid" }
→ Lambda moves item from active.json to completed.json in S3
→ Lambda checks if a feed card exists for this todo
→ if yes: removes that feed card from feed/active.json too
→ returns { "ok": true }
→ frontend removes item from list immediately (optimistic update)

GCR auto-tick (happens in background every 15 mins):
→ EventBridge triggers Lambda /sync route
→ Lambda calls GCR API for each autoTrackable todo
→ checks if classroomAssignmentId is submitted
→ if submitted: calls same done logic as manual tick
→ student sees item disappear on next feed refresh
→ push notification sent: "CN Lab report auto-ticked — submitted on GCR"
```

---

### API calls this screen makes

**on screen mount:**
```
GET /todos
headers: x-user-id: {userId}

response:
{
  "todos": [
    {
      "id": "uuid",
      "title": "Submit CN Lab report",
      "description": "Submit ER diagram and normalization",
      "subject": "Computer Networks",
      "deadline": "2025-01-15T23:59:00Z",
      "importance": "high",
      "source": "whatsapp",
      "sourceGroup": "CSE-A 2025",
      "autoTrackable": false,
      "classroomCourseId": null,
      "classroomAssignmentId": null,
      "reminderCount": 3,
      "lastReminderAt": "2025-01-15T14:00:00Z",
      "fingerprint": "computer-networks-2025-01-15",
      "completedAt": null,
      "createdAt": "2025-01-15T08:23:00Z"
    }
  ]
}
```

**on manual tick:**
```
POST /todos/done
headers: x-user-id: {userId}
body: { "todoId": "uuid" }
response: { "ok": true }
```

**on filter tab change:**
```
no API call
filter happens entirely in frontend state
GET /todos is called once on mount
tabs just re-filter the already fetched array
```

---

### grouping logic — frontend only
```javascript
const now = new Date()
const todayStr = now.toDateString()
const tomorrowStr = new Date(now.getTime() + 86400000).toDateString()

const grouped = {
  today: todos.filter(t =>
    t.completedAt === null &&
    new Date(t.deadline).toDateString() === todayStr
  ),
  upcoming: todos.filter(t =>
    t.completedAt === null &&
    new Date(t.deadline) > now &&
    new Date(t.deadline).toDateString() !== todayStr
  ),
  overdue: todos.filter(t =>
    t.completedAt === null &&
    new Date(t.deadline) < now
  ),
  completed: todos.filter(t =>
    t.completedAt !== null
  )
}
```

only render a section if it has items. skip empty sections entirely.

---

### stats row — how calculated from API response
```
all tasks:  todos.length (entire array returned)
pending:    todos.filter(t => t.completedAt === null).length
completed:  todos.filter(t => t.completedAt !== null).length
overdue:    todos.filter(t =>
              t.completedAt === null &&
              new Date(t.deadline) < new Date()
            ).length
```

all four numbers calculated from the single GET /todos response. no separate API call for stats.

---

### filter tabs behaviour
```
All tab (default):
  show today + upcoming + overdue sections

Pending tab:
  show only items where completedAt === null

Completed tab:
  show only items where completedAt !== null
  show completedAt time instead of deadline
  strikethrough title + green checkmark

Overdue tab:
  show only items where deadline < now AND completedAt === null
  deadline text shown in red

switching tabs: no API call, pure frontend filter on existing state
```

---

### deadline display formatting
```
today + time not passed  → "Today, 11:59 PM"     orange color
today + time passed      → "Today, 11:59 PM"     red color + OVERDUE tag
tomorrow                 → "Tomorrow, 10:00 AM"  secondary color
future date              → "May 18, 4:00 PM"     secondary color
past date not today      → "May 14, 6:00 PM"     red color + OVERDUE tag
```

---

### TodoItem component — what each field renders
```
todo.importance         → ImportanceTag component top right
                          high = red, medium = orange, low = grey

circle checkbox left    → empty circle if completedAt === null
                          green checkmark fill if completedAt exists
                          tappable — calls POST /todos/done on tap

todo.title              → Inter SemiBold 15px white
                          strikethrough if completed

todo.description        → Inter Regular 13px secondary
                          hidden if completed

calendar icon +         → deadline formatted as above
todo.deadline             orange if today, red if overdue, secondary if future

todo.reminderCount      → if reminderCount > 1:
                          show "reminded X times" in 12px secondary
                          only shown on pending items

autoTrackable badge     → if todo.autoTrackable === true:
                          show small "GCR" pill in blue
                          means this will auto-tick when submitted on GCR
```

---

### optimistic update on tick
```
student taps checkbox
→ immediately remove item from active list in local state
→ UI updates instantly — no waiting for API
→ POST /todos/done fires in background
→ on success: nothing extra needed, UI already updated
→ on failure:
    add item back to local state
    show error toast: "couldn't mark as done, try again"
    checkbox reverts to unchecked
```

---

### overdue card appearance
```
same TodoItem component with these differences:
  red "OVERDUE" tag instead of importance tag
  deadline text in red
  card background slightly darker than normal: #1A0A0A
  circle checkbox border in red instead of bgBorder
```

---

### empty states
```
if no todos at all:
  centered clipboard icon (secondary, 48px)
  "No tasks yet"
  "Actions from your messages will appear here automatically"
  both secondary color

if pending tab has no items:
  "All caught up"
  "Nothing pending right now"

if overdue tab has no items:
  green checkmark icon
  "No overdue tasks"
  "You're on top of everything"

if completed tab has no items:
  "No completed tasks yet"
  "Tick something off to see it here"
```

---

### mock data for todo screen
```typescript
import { mockTodos } from '../config/mockData'

const todos = mockTodos.todos

grouped automatically by deadline date
when BASE_URL is ready: replace mockTodos with real GET /todos call
rendering logic stays identical
```

---

### rules for the AI IDE
- GET /todos called once on mount — never on tab switch
- all grouping and filtering is frontend logic on the fetched array
- optimistic update on tick — update UI before API responds
- completed items only visible when Completed filter tab is active
- overdue items show in their own section under All tab
- autoTrackable todos show a small GCR pill to indicate auto-tracking
- reminderCount only shown on pending items, never on completed
- RobotFAB appears on this screen — tapping it navigates to Chat
- three dot menu from the AI mockup is removed — not built
- no manual add button — todos are always AI-generated
- stats row numbers recalculate whenever local state changes