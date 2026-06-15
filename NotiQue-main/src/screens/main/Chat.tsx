/**
 * Chat Screen — NotiQue AI
 *
 * RAG chatbot: user messages → POST /chat → Lambda injects S3 feed+todos as
 * context → Groq answers → displayed as chat bubbles.
 *
 * Rules from project.md:
 * - user bubble appears immediately on send (do NOT wait for API)
 * - typing indicator while POST /chat is in flight
 * - suggestion chips disappear after first message is sent
 * - "View all tasks" button when response contains a list
 * - no persistent history between sessions — fresh every open
 * - disclaimer always visible below input bar
 * - no RobotFAB — this IS the chat screen
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors } from '../../config/colors';
import { API } from '../../config/api';
import { mockProfile } from '../../config/mockData';
import type { AppStackParamList, MainTabParamList } from '../../navigation/AppNavigator';

// ─── Types ────────────────────────────────────────────────────────────────

type ChatNavProp = NativeStackNavigationProp<AppStackParamList, 'Chat'>;

type MessageRole = 'user' | 'bot';

interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  /** true while waiting for API response */
  isTyping?: boolean;
  /** true if message contains a task list → show "View all tasks" button */
  hasTaskList?: boolean;
  /** true if this is an error bubble — tapping it retries the original message */
  isError?: boolean;
  /** the original user message text, used for retry */
  retryText?: string;
  timestamp: string;
}

// ─── Suggestion chips shown before any message is sent ────────────────────

const INITIAL_CHIPS = [
  "What's due today?",
  'Summarize unread class updates',
  'Any classes canceled tomorrow?',
  'Any class updates?',
];

// ─── Contextual chips shown after each bot response ───────────────────────

const FOLLOW_UP_CHIPS = ['Show my upcoming tasks', 'Any class updates?'];

// ─── Helpers ──────────────────────────────────────────────────────────────

function getTimestamp(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getFirstName(name: string) {
  return name.split(' ')[0] || 'there';
}

/** Detect if a bot response likely contains a task/todo list */
function containsTaskList(text: string): boolean {
  return (
    /\d+\.\s/.test(text) || // "1. item"
    /\n-\s/.test(text) ||   // "- item"
    /tasks?.+today/i.test(text)
  );
}

// ─── Typing Indicator ─────────────────────────────────────────────────────

function TypingDots() {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  React.useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 300, useNativeDriver: true }),
        ])
      ).start();

    animate(dot1, 0);
    animate(dot2, 180);
    animate(dot3, 360);
  }, []);

  return (
    <View style={styles.typingDots}>
      {[dot1, dot2, dot3].map((dot, i) => (
        <Animated.View key={i} style={[styles.typingDot, { opacity: dot }]} />
      ))}
    </View>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────

interface BubbleProps {
  message: ChatMessage;
  onViewAllTasks: () => void;
  onRetry: (text: string) => void;
}

function Bubble({ message, onViewAllTasks, onRetry }: BubbleProps) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <View style={styles.userBubbleRow}>
        <View style={styles.userBubble}>
          <Text style={styles.userBubbleText}>{message.text}</Text>
        </View>
      </View>
    );
  }

  // Bot bubble
  return (
    <View style={styles.botBubbleRow}>
      <Image
        source={require('../../../assets/cutie-bot.png')}
        style={styles.botAvatar}
        resizeMode="contain"
      />
      <View style={styles.botBubbleCol}>
        {message.isError ? (
          <TouchableOpacity
            style={[styles.botBubble, styles.errorBubble]}
            activeOpacity={0.7}
            onPress={() => message.retryText && onRetry(message.retryText)}
          >
            <Text style={styles.errorBubbleText}>{message.text}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.botBubble}>
            {message.isTyping ? (
              <TypingDots />
            ) : (
              <Text style={styles.botBubbleText}>{message.text}</Text>
            )}
          </View>
        )}
        {!message.isTyping && (
          <Text style={styles.bubbleTimestamp}>{message.timestamp}</Text>
        )}
        {!message.isTyping && message.hasTaskList && (
          <TouchableOpacity style={styles.viewTasksBtn} onPress={onViewAllTasks} activeOpacity={0.8}>
            <Text style={styles.viewTasksBtnText}>View all tasks</Text>
            <Feather name="chevron-right" size={14} color={colors.accentOrange} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Main Chat Screen ─────────────────────────────────────────────────────

export default function Chat(): React.JSX.Element {
  const navigation = useNavigation<ChatNavProp>();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const firstName = getFirstName(mockProfile.name);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasSentAny, setHasSentAny] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(false);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  const sendMessage = useCallback(
    async (text: string, isRetry = false) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      setInputText('');
      setHasSentAny(true);
      setShowFollowUp(false);

      // On retry, remove the previous error bubble before re-sending
      if (isRetry) {
        setMessages((prev) => prev.filter((m) => !m.isError));
      } else {
        const userMsg: ChatMessage = {
          id: `u-${Date.now()}`,
          role: 'user',
          text: trimmed,
          timestamp: getTimestamp(),
        };
        // User bubble appears immediately — do NOT wait for API
        setMessages((prev) => [...prev, userMsg]);
      }
      scrollToBottom();

      // Typing indicator
      setIsLoading(true);
      const typingId = `bot-typing-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: typingId, role: 'bot', text: '', isTyping: true, timestamp: '' },
      ]);
      scrollToBottom();

      try {
        const userId = await AsyncStorage.getItem('userId');
        const res = await fetch(API.chat, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId ?? '',
          },
          body: JSON.stringify({ message: trimmed }),
        });

        if (!res.ok) throw new Error('Chat request failed');

        const data = await res.json();
        const answer = data.answer;

        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          role: 'bot',
          text: answer,
          hasTaskList: containsTaskList(answer),
          timestamp: getTimestamp(),
        };

        setMessages((prev) => prev.filter((m) => m.id !== typingId).concat(botMsg));
        setShowFollowUp(true);
        scrollToBottom();
      } catch {
        const errMsg: ChatMessage = {
          id: `bot-err-${Date.now()}`,
          role: 'bot',
          text: 'Something went wrong. Tap to retry.',
          isError: true,
          retryText: trimmed,
          timestamp: getTimestamp(),
        };
        setMessages((prev) => prev.filter((m) => m.id !== typingId).concat(errMsg));
        scrollToBottom();
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, scrollToBottom]
  );

  const handleRetry = useCallback(
    (text: string) => sendMessage(text, true),
    [sendMessage]
  );

  const handleChipPress = (chip: string) => sendMessage(chip);

  const handleViewAllTasks = () => {
    // Navigate to Todo tab
    (navigation as any).navigate('MainTabs', { screen: 'Todo' });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <StatusBar style="light" />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>NotiQue</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Hero header with cutie-bot */}
      {!hasSentAny && (
        <View style={styles.heroRow}>
          <View>
            <Text style={styles.heroGreeting}>Hi, {firstName}</Text>
            <Text style={styles.heroSubtitle}>How can I help you today?</Text>
          </View>
          <Image
            source={require('../../../assets/cutie-bot.png')}
            style={styles.heroBotImage}
            resizeMode="contain"
          />
        </View>
      )}

      {/* Suggestion chips (pre-conversation) */}
      {!hasSentAny && (
        <View style={styles.chipGrid}>
          {INITIAL_CHIPS.map((chip) => (
            <TouchableOpacity
              key={chip}
              style={styles.chip}
              onPress={() => handleChipPress(chip)}
              activeOpacity={0.75}
            >
              <Text style={styles.chipText}>{chip}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={scrollToBottom}
      >
        {messages.length > 0 && (
          <Text style={styles.dateDivider}>Today</Text>
        )}
        {messages.map((msg) => (
          <Bubble
            key={msg.id}
            message={msg}
            onViewAllTasks={handleViewAllTasks}
            onRetry={handleRetry}
          />
        ))}

        {/* Follow-up chips below last bot response */}
        {showFollowUp && !isLoading && (
          <View style={styles.followUpRow}>
            {FOLLOW_UP_CHIPS.map((chip) => (
              <TouchableOpacity
                key={chip}
                style={styles.followUpChip}
                onPress={() => handleChipPress(chip)}
                activeOpacity={0.75}
              >
                <Text style={styles.followUpChipText}>{chip}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Input bar */}
      <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask anything..."
          placeholderTextColor={colors.textSecondary}
          multiline
          onSubmitEditing={() => sendMessage(inputText)}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!inputText.trim() || isLoading) && styles.sendBtnDisabled]}
          onPress={() => sendMessage(inputText)}
          activeOpacity={0.85}
          disabled={!inputText.trim() || isLoading}
        >
          <Feather name="arrow-up" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Disclaimer — always visible, never remove */}
      <Text style={[styles.disclaimer, { paddingBottom: insets.bottom + 4 }]}>
        NotiQue AI can make mistakes. Please verify important information.
      </Text>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: colors.textPrimary,
  },
  // Hero
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  heroGreeting: {
    fontFamily: 'Inter_700Bold',
    fontSize: 26,
    color: colors.textPrimary,
  },
  heroSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  heroBotImage: {
    width: 90,
    height: 90,
  },
  // Initial chips — 2x2 grid
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 16,
  },
  chip: {
    width: '47%',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.bgBorder,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    justifyContent: 'center',
  },
  chipText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  // Messages
  messageList: {
    flex: 1,
  },
  messageListContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  dateDivider: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginVertical: 8,
  },
  // User bubble
  userBubbleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  userBubble: {
    backgroundColor: colors.accentOrange,
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxWidth: '78%',
  },
  userBubbleText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  // Bot bubble
  botBubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  botAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgCard,
  },
  botBubbleCol: {
    flex: 1,
    gap: 6,
  },
  botBubble: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.bgBorder,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '90%',
    alignSelf: 'flex-start',
  },
  botBubbleText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  // Error bubble (tap to retry)
  errorBubble: {
    borderColor: colors.high,
  },
  errorBubbleText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: colors.high,
    lineHeight: 22,
  },
  bubbleTimestamp: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  // Typing indicator
  typingDots: {
    flexDirection: 'row',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textSecondary,
  },
  // "View all tasks" button inside bot response
  viewTasksBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.accentOrange,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  viewTasksBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: colors.accentOrange,
  },
  // Follow-up chips (after AI response)
  followUpRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
    paddingLeft: 46, // align with bot bubble (avatar width + gap)
  },
  followUpChip: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.bgBorder,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  followUpChipText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textPrimary,
  },
  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.bgBorder,
    backgroundColor: colors.bgPrimary,
  },
  input: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.bgBorder,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: colors.textPrimary,
    maxHeight: 120,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accentOrange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  // Disclaimer
  disclaimer: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 24,
    paddingTop: 6,
    backgroundColor: colors.bgPrimary,
  },
});