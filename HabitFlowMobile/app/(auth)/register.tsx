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

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp, isLoading } = useAuthStore();
  const { themeConfig } = useThemeStore();
  const colors = themeConfig.colors;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validate = () => {
    const newErrors: typeof errors = {};
    
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    
    const { error } = await signUp(email, password, name);
    
    if (error) {
      Alert.alert('Registration Failed', error.message);
    } else {
      Alert.alert(
        'Account Created',
        'Please check your email to verify your account.',
        [{ text: 'OK' }]
      );
    }
  };

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
          {/* Header */}
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <Text style={{ fontSize: 48 }}>🎯</Text>
            <Text
              style={{
                fontSize: 28,
                fontWeight: '700',
                color: colors.textPrimary,
                marginTop: 12,
              }}
            >
              Create Account
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: colors.textSecondary,
                marginTop: 4,
              }}
            >
              Start your habit journey
            </Text>
          </View>

          {/* Form */}
          <View style={{ gap: 16 }}>
            {/* Name Input */}
            <View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: colors.textSecondary,
                  marginBottom: 8,
                }}
              >
                Name
              </Text>
              <TextInput
                style={{
                  backgroundColor: colors.bgSecondary,
                  borderWidth: 1,
                  borderColor: errors.name ? '#ef4444' : colors.border,
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 16,
                  color: colors.textPrimary,
                }}
                placeholder="Your name"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoComplete="name"
              />
              {errors.name && (
                <Text style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>
                  {errors.name}
                </Text>
              )}
            </View>

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
                  borderColor: errors.email ? '#ef4444' : colors.border,
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 16,
                  color: colors.textPrimary,
                }}
                placeholder="your@email.com"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
              {errors.email && (
                <Text style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>
                  {errors.email}
                </Text>
              )}
            </View>

            {/* Password Input */}
            <View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: colors.textSecondary,
                  marginBottom: 8,
                }}
              >
                Password
              </Text>
              <View style={{ position: 'relative' }}>
                <TextInput
                  style={{
                    backgroundColor: colors.bgSecondary,
                    borderWidth: 1,
                    borderColor: errors.password ? '#ef4444' : colors.border,
                    borderRadius: 12,
                    padding: 16,
                    paddingRight: 50,
                    fontSize: 16,
                    color: colors.textPrimary,
                  }}
                  placeholder="Create a password"
                  placeholderTextColor={colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password-new"
                />
                <TouchableOpacity
                  style={{
                    position: 'absolute',
                    right: 16,
                    top: 16,
                  }}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={24}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>
                  {errors.password}
                </Text>
              )}
            </View>

            {/* Confirm Password Input */}
            <View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: colors.textSecondary,
                  marginBottom: 8,
                }}
              >
                Confirm Password
              </Text>
              <TextInput
                style={{
                  backgroundColor: colors.bgSecondary,
                  borderWidth: 1,
                  borderColor: errors.confirmPassword ? '#ef4444' : colors.border,
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 16,
                  color: colors.textPrimary,
                }}
                placeholder="Confirm your password"
                placeholderTextColor={colors.textMuted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
              />
              {errors.confirmPassword && (
                <Text style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>
                  {errors.confirmPassword}
                </Text>
              )}
            </View>

            {/* Register Button */}
            <TouchableOpacity
              style={{
                backgroundColor: colors.primary,
                borderRadius: 12,
                padding: 16,
                alignItems: 'center',
                marginTop: 8,
                opacity: isLoading ? 0.7 : 1,
              }}
              onPress={handleRegister}
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
                  Create Account
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Login Link */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              marginTop: 32,
            }}
          >
            <Text style={{ color: colors.textSecondary }}>
              Already have an account?{' '}
            </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={{ color: colors.primary, fontWeight: '600' }}>
                  Sign In
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
