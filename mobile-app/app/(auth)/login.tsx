import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { authApi } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { APP_NAME, APP_SUBTITLE, APP_LOGO } from '../../constants/config';
import { BrandTitle } from '../../components/BrandTitle';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Lock ref to prevent duplicate double-tap login requests
  const isLoggingInRef = useRef(false);

  // Field-level errors
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [apiError, setApiError] = useState('');

  const validateEmail = (value: string) => {
    if (!value.trim()) return 'Email is required';
    if (!EMAIL_REGEX.test(value.trim())) return 'Enter a valid email address';
    return '';
  };

  const validatePassword = (value: string) => {
    if (!value) return 'Password is required';
    if (value.length < 6) return 'Password must be at least 6 characters';
    return '';
  };

  const handleLogin = async () => {
    setApiError('');

    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    setEmailError(eErr);
    setPasswordError(pErr);

    if (eErr || pErr) return;

    if (isLoggingInRef.current) return;
    isLoggingInRef.current = true;
    setLoading(true);
    try {
      const response = await authApi.login(email.trim(), password);
      // Support both token formats: { token } or { access }
      const token = response?.token || response?.access;
      if (token) {
        await AsyncStorage.setItem('token', token);
      }
      if (response?.refresh) {
        await AsyncStorage.setItem('refresh_token', response.refresh);
      }
      const userRole = response?.user?.role || 'student';
      if (userRole === 'teacher') {
        router.replace('/(teacher)');
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      const msg: string = err.message || '';
      const msgLower = msg.toLowerCase();

      // Map technical backend validation/bad-request messages to a clean, user-friendly message
      const isTechnicalError = 
        msgLower.includes('validation') || 
        msgLower.includes('bad request') || 
        msgLower.includes('error');
        
      const friendlyMsg = isTechnicalError 
        ? 'Invalid email or password. Please try again.' 
        : (msg || 'Invalid email or password. Please try again.');

      // Show credential errors on the password field
      if (
        msgLower.includes('password') ||
        msgLower.includes('credential') ||
        msgLower.includes('invalid') ||
        msgLower.includes('incorrect') ||
        msgLower.includes('wrong') ||
        err.status === 401 ||
        isTechnicalError
      ) {
        setPasswordError(friendlyMsg);
      } else {
        const errorMsg = friendlyMsg;
        if (Platform.OS === 'web') {
          alert(errorMsg);
        } else {
          Alert.alert('Login Failed', errorMsg);
        }
      }
    } finally {
      isLoggingInRef.current = false;
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Back Button */}
          {router.canGoBack() && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#64748b" />
            </TouchableOpacity>
          )}

          {/* Brand Header — logo icon left + styled text right */}
          <View style={styles.brandHeader}>
            <Image
              source={APP_LOGO}
              style={styles.brandIcon}
              contentFit="contain"
            />
            <BrandTitle size="compact" showTagline={false} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.welcomeText}>Welcome Back</Text>
            <Text style={styles.subText}>Sign in to access your account</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={[styles.inputContainer, !!emailError && styles.inputError]}>
                <Ionicons name="mail-outline" size={20} color={emailError ? '#dc2626' : '#94a3b8'} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email address"
                  placeholderTextColor="#94a3b8"
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    if (emailError) setEmailError(validateEmail(v));
                    setApiError('');
                  }}
                  onBlur={() => setEmailError(validateEmail(email))}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>
              {!!emailError && (
                <View style={styles.fieldErrorRow}>
                  <Ionicons name="warning-outline" size={13} color="#dc2626" />
                  <Text style={styles.fieldErrorText}>{emailError}</Text>
                </View>
              )}
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={[styles.inputContainer, !!passwordError && styles.inputError]}>
                <Ionicons name="lock-closed-outline" size={20} color={passwordError ? '#dc2626' : '#94a3b8'} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#94a3b8"
                  value={password}
                  onChangeText={(v) => {
                    setPassword(v);
                    if (passwordError) setPasswordError(validatePassword(v));
                    setApiError('');
                  }}
                  onBlur={() => setPasswordError(validatePassword(password))}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#94a3b8"
                  />
                </TouchableOpacity>
              </View>
              {!!passwordError && (
                <View style={styles.fieldErrorRow}>
                  <Ionicons name="warning-outline" size={13} color="#dc2626" />
                  <Text style={styles.fieldErrorText}>{passwordError}</Text>
                </View>
              )}
              <TouchableOpacity 
                style={styles.forgotPassword}
                onPress={() => router.push('/(auth)/forgot-password')}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </TouchableOpacity>

            {/* Signup Link */}
            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
                <Text style={styles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>© 2026 <Text style={{ color: '#3b82f6', fontWeight: '600' }}>{APP_NAME}</Text>. All rights reserved.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 24,
    flexGrow: 1,
  },
  backButton: {
    marginTop: 8,
    marginBottom: 12,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 12,
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 28,
    marginTop: 4,
  },
  brandIcon: {
    width: 70,
    height: 70,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  logoImage: {
    width: 180,
    height: 45,
  },
  logoTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  logoSubtitle: {
    fontSize: 9,
    letterSpacing: 0,
    color: '#64748b',
    fontWeight: '500',
    flexShrink: 1,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0a1930',
    marginBottom: 8,
  },
  subText: {
    fontSize: 15,
    color: '#64748b',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    flex: 1,
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '500',
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
  },
  inputError: {
    borderColor: '#f87171',
    backgroundColor: '#fff5f5',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1e293b',
  },
  fieldErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fieldErrorText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '500',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  forgotPasswordText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#0a1930',
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  loginButtonDisabled: {
    backgroundColor: '#475569',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 4,
  },
  signupText: {
    color: '#64748b',
    fontSize: 15,
  },
  signupLink: {
    color: '#3b82f6',
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 40,
    alignItems: 'center',
  },
  footerText: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
  },
});
