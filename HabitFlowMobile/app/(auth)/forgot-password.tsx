import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAuthStore, useThemeStore } from '../../src/stores';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { resetPassword, isLoading } = useAuthStore();
  const { themeConfig } = useThemeStore();
  const colors = themeConfig.colors;

  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Invalid email format');
      return;
    }
    
    setError('');
    const { error } = await resetPassword(email);
    
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: colors.bgSecondary,
              borderRadius: 100,
              padding: 24,
              marginBottom: 24,
            }}
          >
            <Ionicons name="mail-outline" size={48} color={colors.primary} />
          </View>
          
          <Text
            style={{
              fontSize: 24,
              fontWeight: '700',
              color: colors.textPrimary,
              textAlign: 'center',
            }}
          >
            Check Your Email
          </Text>
          
          <Text
            style={{
              fontSize: 16,
              color: colors.textSecondary,
              textAlign: 'center',
              marginTop: 12,
              lineHeight: 24,
            }}
          >
            We've sent a password reset link to{'\n'}
            <Text style={{ color: colors.primary, fontWeight: '500' }}>
              {email}
            </Text>
          </Text>
          
          <TouchableOpacity
            style={{
              backgroundColor: colors.primary,
              borderRadius: 12,
              padding: 16,
              paddingHorizontal: 32,
              marginTop: 32,
            }}
            onPress={() => router.replace('/(auth)/login')}
          >
            <Text
              style={{
                color: '#fff',
                fontSize: 16,
                fontWeight: '600',
              }}
            >
              Back to Login
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={{ marginTop: 16 }}
            onPress={() => setSent(false)}
          >
            <Text style={{ color: colors.textMuted, fontSize: 14 }}>
              Didn't receive email? Try again
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            padding: 24,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back Button */}
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity
              style={{
                position: 'absolute',
                top: 16,
                left: 0,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Ionicons name="arrow-back" size={24} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary, marginLeft: 4 }}>
                Back
              </Text>
            </TouchableOpacity>
          </Link>

          {/* Header */}
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <View
              style={{
                backgroundColor: colors.bgSecondary,
                borderRadius: 100,
                padding: 20,
                marginBottom: 20,
              }}
            >
              <Ionicons name="lock-closed-outline" size={40} color={colors.primary} />
            </View>
            
            <Text
              style={{
                fontSize: 28,
                fontWeight: '700',
                color: colors.textPrimary,
              }}
            >
              Reset Password
            </Text>
            
            <Text
              style={{
                fontSize: 16,
                color: colors.textSecondary,
                marginTop: 8,
                textAlign: 'center',
                lineHeight: 24,
              }}
            >
              Enter your email and we'll send you{'\n'}a link to reset your password
            </Text>
          </View>

          {/* Form */}
          <View style={{ gap: 16 }}>
            {/* Email Input */}
            <View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: colors.textSecondary,
                  marginBottom: 8,
                }}
              >
                Email
              </Text>
              <TextInput
                style={{
                  backgroundColor: colors.bgSecondary,
                  borderWidth: 1,
                  borderColor: error ? '#ef4444' : colors.border,
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 16,
                  color: colors.textPrimary,
                }}
                placeholder="your@email.com"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setError('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
              {error && (
                <Text style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>
                  {error}
                </Text>
              )}
            </View>

            {/* Reset Button */}
            <TouchableOpacity
              style={{
                backgroundColor: colors.primary,
                borderRadius: 12,
                padding: 16,
                alignItems: 'center',
                marginTop: 8,
                opacity: isLoading ? 0.7 : 1,
              }}
              onPress={handleResetPassword}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text
                  style={{
                    color: '#fff',
                    fontSize: 16,
                    fontWeight: '600',
                  }}
                >
                  Send Reset Link
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
