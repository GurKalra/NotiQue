import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../../config/colors';
import { API } from '../../config/api';
import type { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';

type WhatsApp2NavigationProp = NativeStackNavigationProp<
  OnboardingStackParamList,
  'WhatsApp2'
>;

interface WhatsApp2Props {
  navigation: WhatsApp2NavigationProp;
}

interface CountryCode {
  code: string;
  country: string;
  flag: string;
}

const COUNTRY_CODES: CountryCode[] = [
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+1', country: 'United States', flag: '🇺🇸' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+82', country: 'South Korea', flag: '🇰🇷' },
];

export default function WhatsApp2({
  navigation,
}: WhatsApp2Props): React.JSX.Element {
  const [selectedCode, setSelectedCode] = useState<CountryCode>(COUNTRY_CODES[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pickerVisible, setPickerVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendCode = async (): Promise<void> => {
    const fullPhone = `${selectedCode.code}${phoneNumber.trim()}`;

    setLoading(true);
    try {
      const res = await fetch(API.whatsappPair, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: fullPhone }),
      });

      if (!res.ok) {
        throw new Error('Pairing request failed');
      }

      const data = await res.json();

      if (data.alreadyConnected) {
        navigation.navigate('SelectGroups');
        return;
      }

      navigation.navigate('WhatsApp3', {
        pairingCode: data.pairingCode,
        phoneNumber: fullPhone,
        expiresIn: data.expiresIn,
      });
    } catch (err) {
      Alert.alert(
        'Something went wrong',
        'Could not generate a pairing code right now. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderCountryItem = ({ item }: { item: CountryCode }) => (
    <TouchableOpacity
      style={styles.countryItem}
      activeOpacity={0.7}
      onPress={() => {
        setSelectedCode(item);
        setPickerVisible(false);
      }}
    >
      <Text style={styles.countryFlag}>{item.flag}</Text>
      <Text style={styles.countryName}>{item.country}</Text>
      <Text style={styles.countryCode}>{item.code}</Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />

      {/* Top bar — small logo left, grad cap right */}
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

      {/* Title section */}
      <View style={styles.titleSection}>
        <Text style={styles.heading}>Enter Your Number</Text>
        <Text style={styles.subtitle}>
          We will send a pairing code{'\n'}to link your WhatsApp
        </Text>
      </View>

      {/* Form section */}
      <View style={styles.formSection}>
        {/* Country Code Picker */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Country Code</Text>
          <TouchableOpacity
            style={styles.selectButton}
            activeOpacity={0.8}
            onPress={() => setPickerVisible(true)}
          >
            <Text style={styles.selectFlag}>{selectedCode.flag}</Text>
            <Text style={styles.selectText}>{selectedCode.code}</Text>
            <Text style={styles.selectArrow}>▾</Text>
          </TouchableOpacity>
        </View>

        {/* Phone Number Input */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Contact Number</Text>
          <TextInput
            style={styles.phoneInput}
            placeholder="XXXXXXXXXX"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
            maxLength={15}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />
        </View>
      </View>

      {/* Bottom — Send Code button */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleSendCode}
          style={[
            styles.sendButton,
            (!phoneNumber.trim() || loading) && styles.sendButtonDisabled,
          ]}
          disabled={!phoneNumber.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.accentOrange} />
          ) : (
            <Text style={styles.sendButtonText}>Send Code</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Country Code Picker Modal */}
      <Modal
        visible={pickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPickerVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select Country</Text>
            <FlatList
              data={COUNTRY_CODES}
              keyExtractor={(item) => item.code}
              renderItem={renderCountryItem}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
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
  titleSection: {
    paddingTop: 20,
    paddingBottom: 32,
  },
  heading: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    color: colors.textPrimary,
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: colors.accentOrange,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  formSection: {
    flex: 1,
    gap: 28,
  },
  fieldGroup: {
    gap: 10,
  },
  fieldLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: colors.textPrimary,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.bgBorder,
    borderRadius: 10,
    height: 48,
    paddingHorizontal: 14,
    gap: 8,
    alignSelf: 'flex-start',
    minWidth: 120,
  },
  selectFlag: {
    fontSize: 18,
  },
  selectText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: colors.textPrimary,
  },
  selectArrow: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  phoneInput: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.bgBorder,
    borderRadius: 10,
    height: 48,
    paddingHorizontal: 16,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: colors.textPrimary,
  },
  bottomSection: {
    paddingBottom: 52,
    alignItems: 'center',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.bgBorder,
    borderRadius: 10,
    height: 52,
    width: '100%',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: colors.accentOrange,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingBottom: 40,
    maxHeight: '60%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.bgBorder,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: 16,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.bgBorder,
    gap: 12,
  },
  countryFlag: {
    fontSize: 22,
  },
  countryName: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: colors.textPrimary,
    flex: 1,
  },
  countryCode: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: colors.textSecondary,
  },
});