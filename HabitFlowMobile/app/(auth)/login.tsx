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

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, isLoading } = useAuthStore();
  const { themeConfig } = useThemeStore();
  const colors = themeConfig.colors;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    
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
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    
    const { error } = await signIn(email, password);
    
    if (error) {
      Alert.alert('Login Failed', error.message);
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
          {/* Logo */}
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <Text style={{ fontSize: 48 }}>🎯</Text>
            <Text
              style={{
                fontSize: 32,
                fontWeight: '700',
                color: colors.textPrimary,
                marginTop: 12,
              }}
            >
              HabitFlow
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: colors.textSecondary,
                marginTop: 4,
              }}
            >
              Build better habits
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
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
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

            {/* Forgot Password */}
            <Link href="/(auth)/forgot-password" asChild>
              <TouchableOpacity style={{ alignSelf: 'flex-end' }}>
                <Text style={{ color: colors.primary, fontSize: 14 }}>
                  Forgot password?
                </Text>
              </TouchableOpacity>
            </Link>

            {/* Login Button */}
            <TouchableOpacity
              style={{
                backgroundColor: colors.primary,
                borderRadius: 12,
                padding: 16,
                alignItems: 'center',
                marginTop: 8,
                opacity: isLoading ? 0.7 : 1,
              }}
              onPress={handleLogin}
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
                  Sign In
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Register Link */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              marginTop: 32,
            }}
          >
            <Text style={{ color: colors.textSecondary }}>
              Don't have an account?{' '}
            </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text style={{ color: colors.primary, fontWeight: '600' }}>
                  Sign Up
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
