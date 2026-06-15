# NotiQue

**The operating system for student life.**

An AI-powered campus assistant that reads across WhatsApp, Gmail, and Google Classroom - classifies every message by importance and action requirement - and surfaces only what matters, before you even think to look.

Built for HackOn with Amazon Season 6.0 · AI for Campus, Community & Everyday Life

---

## The Problem

College students process 600-1,400 WhatsApp messages daily across 5-8 active groups, just to find the 3-8 that actually require action. Less than 1% of daily messages are actionable, yet students manually filter 100% of them - losing 25-45 minutes every single day. Critical deadlines aren't missed because information doesn't exist. They're missed because it's buried under birthday wishes, meme reactions, and forwarded content across channels that were never designed to work together.

---

## What NotiQue Does

NotiQue sits across a student's communication channels and acts as an intelligence layer between the noise and their attention.

- **AI-powered classification** - every incoming message from WhatsApp, Gmail, and Google Classroom is processed by AWS Bedrock, classified as `ACTION` or `INFO`, and scored `high`, `medium`, or `low` importance
- **Cross-source deduplication** - if the same assignment shows up as a Classroom post, a WhatsApp reminder, and an email, NotiQue recognizes it as one item using a subject-deadline fingerprint. Submit it on Classroom, and every future reminder is silently dropped
- **Time-decay notification logic** - urgency recalculates automatically as deadlines approach. A deadline three days away notifies once every 12 hours; the same deadline in two hours notifies on every reminder
- **Proactive todo management** - `ACTION` items auto-populate the todo list. Classroom submissions auto-tick. Physical submissions are ticked manually. Once done, an item never resurfaces
- **Privacy by architecture** - raw messages are processed and discarded at ingestion. What persists is never a message - it's a structured classification: type, importance, title, deadline. Compliant with India's DPDP Act 2023 by design, not by policy

---

## The Amazon Q Extension

Amazon Q Business connects Slack, SharePoint, and corporate email to surface what enterprise employees need before they ask. NotiQue applies the same architectural philosophy to students - WhatsApp replaces Slack, Gmail replaces corporate email, Google Classroom replaces the document system. The same AWS services that power Amazon Q's production infrastructure - Bedrock, Lambda, S3, SNS - form the foundation here, extended into a domain Amazon Q has never addressed.

---

## Tech Stack

### Frontend
- Expo + React Native (TypeScript)
- NativeWind (Tailwind for React Native)
- React Navigation
- AsyncStorage
- expo-notifications
- expo-auth-session (Google OAuth)

### Backend
- Node.js on AWS Lambda
- AWS API Gateway
- AWS S3 (structured JSON, no database)
- AWS Bedrock (classification + RAG chat)
- AWS SNS (push notifications)
- AWS EC2 (WhatsApp bridge via whatsapp-web.js)
- AWS EventBridge (Google Classroom periodic sync)
- Google OAuth 2.0 (Gmail + Classroom)

---

## Architecture

```
Data Sources (WhatsApp · Gmail · Classroom)
        ↓
Ingestion Layer (API Gateway + Lambda)
        ↓
AI Classification (AWS Bedrock)
        ↓ (raw message discarded here)
Semantic Storage + Dedup (AWS S3, fingerprint check)
        ↓
        ├──→ Push Alerts (AWS SNS, time-decay logic)
        └──→ On-Demand Data (feed · todos · chat)
                ↓
        NotiQue App (Expo · React Native)
```

Every component is independently replaceable. S3 can become DynamoDB at scale. The WhatsApp bridge can become an official API integration. Lambda stays Lambda regardless of scale. The core pipeline - ingest, classify, store, notify - never changes, only what implements each stage.

---

## Security: Prompt Injection Mitigation

Every incoming message is wrapped in explicit data boundary markers before reaching the AI, with an instruction that everything inside is content to classify, never commands to follow. The AI's output is validated against a strict JSON schema - anything that doesn't match is discarded before it touches storage or notifications. This is a two-layer defense at O(1) cost per message: one boundary at input, one schema check at output.

---



## Getting Started

```bash
git clone <repo-url>
cd notiQue
npx expo install
npx expo start --tunnel
```

Scan the QR code with Expo Go (Android/iOS). Requires SDK 54 for Expo Go compatibility.

Until the backend is deployed, the app runs entirely on mock data from `src/config/mockData.ts`. Once `BASE_URL` in `src/config/api.ts` is set to a live API Gateway URL, every screen switches to real data automatically.

---

## Team

Built for HackOn with Amazon Season 6.0 - AI for Campus, Community & Everyday Life track.

---

## License

TBD
