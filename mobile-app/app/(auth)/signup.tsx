import React, { useState, useEffect, useRef } from 'react';
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
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { authApi } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_NAME, APP_SUBTITLE, APP_LOGO } from '../../constants/config';
import { BrandTitle } from '../../components/BrandTitle';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_RESEND_SECONDS = 90;

export default function SignupScreen() {
  const router = useRouter();

  // Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');

  // UI State
  const [step, setStep] = useState<1 | 2>(1); // Step 1: Email/Password | Step 2: OTP
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loadingSend, setLoadingSend] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Errors
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [apiError, setApiError] = useState('');

  // OTP input refs for auto-focus
  const otpInputRef = useRef<TextInput>(null);

  // Lock refs to prevent duplicate double-tap requests
  const isSendingRef = useRef(false);
  const isVerifyingRef = useRef(false);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((p) => p - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // ─── Validators ─────────────────────────────────────────────────────────────
  const validateEmail = (v: string) => {
    if (!v.trim()) return 'Email is required';
    if (!EMAIL_REGEX.test(v.trim())) return 'Enter a valid email address';
    return '';
  };

  const validatePassword = (v: string) => {
    if (!v) return 'Password is required';
    if (v.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(v)) return 'Password must contain at least one uppercase letter';
    if (!/[0-9]/.test(v)) return 'Password must contain at least one number';
    return '';
  };

  const validateConfirmPassword = (v: string, pw: string) => {
    if (!v) return 'Please confirm your password';
    if (v !== pw) return 'Passwords do not match';
    return '';
  };

  const validateOtp = (v: string) => {
    if (!v) return 'OTP is required';
    if (!/^\d{6}$/.test(v)) return 'OTP must be exactly 6 digits';
    return '';
  };

  // ─── Step 1: Send OTP ────────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    if (isSendingRef.current) return;
    setApiError('');
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    const cpErr = validateConfirmPassword(confirmPassword, password);
    setEmailError(eErr);
    setPasswordError(pErr);
    setConfirmPasswordError(cpErr);
    if (eErr || pErr || cpErr) return;

    isSendingRef.current = true;
    setLoadingSend(true);
    try {
      await authApi.registerStudent(email.trim(), password);
      setStep(2);
      setCountdown(OTP_RESEND_SECONDS);
      setTimeout(() => otpInputRef.current?.focus(), 300);
    } catch (err: any) {
      const msg: string = err.message || '';
      const msgLower = msg.toLowerCase();
      const body = err.body || {};

      if (body.email) {
        setEmailError(Array.isArray(body.email) ? body.email[0] : String(body.email));
      } else if (
        msgLower.includes('email') ||
        msgLower.includes('already') ||
        msgLower.includes('exist') ||
        msgLower.includes('registered') ||
        err.status === 400 ||
        err.status === 409
      ) {
        setEmailError(msg || 'This email is already registered. Please login or use a different email.');
      } else {
        setApiError(msg || 'Failed to send OTP. Please try again.');
      }
    } finally {
      isSendingRef.current = false;
      setLoadingSend(false);
    }
  };

  // ─── Step 2: Resend OTP ───────────────────────────────────────────────────────
  const handleResendOtp = async () => {
    if (isSendingRef.current) return;
    setApiError('');
    setOtp('');
    setOtpError('');
    isSendingRef.current = true;
    setLoadingSend(true);
    try {
      await authApi.registerStudent(email.trim(), password);
      setCountdown(OTP_RESEND_SECONDS);
    } catch (err: any) {
      setApiError(err.message || 'Failed to resend OTP.');
    } finally {
      isSendingRef.current = false;
      setLoadingSend(false);
    }
  };

  // ─── Step 2: Verify OTP & Complete Registration ───────────────────────────────
  const handleVerifyOtp = async () => {
    if (isVerifyingRef.current) return;
    setApiError('');
    const oErr = validateOtp(otp);
    setOtpError(oErr);
    if (oErr) return;

    isVerifyingRef.current = true;
    setLoadingVerify(true);
    try {
      const response = await authApi.verifyOtp(email.trim(), otp.trim());
      
      // Save tokens returned by the OTP verification response
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
      if (err.body?.already_registered) {
        Alert.alert(
          'Already Registered',
          'Your email has already been verified and registered. Please log in.',
          [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
        );
      } else {
        setOtpError(err.message || 'Invalid OTP. Please check and try again.');
      }
    } finally {
      isVerifyingRef.current = false;
      setLoadingVerify(false);
    }
  };

  // ─── Format countdown ─────────────────────────────────────────────────────────
  const formatCountdown = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}:${sec.toString().padStart(2, '0')}` : `${sec}s`;
  };

  // ─── Shared Error Row ─────────────────────────────────────────────────────────
  const ErrorRow = ({ msg }: { msg: string }) =>
    msg ? (
      <View style={styles.fieldErrorRow}>
        <Ionicons name="warning-outline" size={13} color="#dc2626" />
        <Text style={styles.fieldErrorText}>{msg}</Text>
      </View>
    ) : null;

  // ─── API Error Banner ─────────────────────────────────────────────────────────
  const ApiBanner = () =>
    apiError ? (
      <View style={styles.errorBanner}>
        <Ionicons name="alert-circle-outline" size={18} color="#dc2626" />
        <Text style={styles.errorBannerText}>{apiError}</Text>
      </View>
    ) : null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand Header — logo icon left + styled text right */}
          <View style={styles.brandHeader}>
            <Image
              source={APP_LOGO}
              style={styles.brandIcon}
              contentFit="contain"
            />
            <BrandTitle size="compact" showTagline={false} />
          </View>

          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => (step === 2 ? setStep(1) : router.back())}
          >
            <Ionicons name="arrow-back" size={24} color="#64748b" />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            {/* Step Indicator */}
            <View style={styles.stepIndicator}>
              <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]}>
                {step > 1 ? (
                  <Ionicons name="checkmark" size={14} color="#fff" />
                ) : (
                  <Text style={styles.stepDotText}>1</Text>
                )}
              </View>
              <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
              <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]}>
                <Text style={[styles.stepDotText, step >= 2 && { color: '#fff' }]}>2</Text>
              </View>
            </View>

            <Text style={styles.welcomeText}>
              {step === 1 ? 'Create Account' : 'Verify Email'}
            </Text>
            <Text style={styles.subText}>
              {step === 1
                ? 'Register as a student to get started'
                : `Enter the 6-digit OTP sent to\n${email}`}
            </Text>
          </View>

          <ApiBanner />

          {/* ── STEP 1: Registration Form ── */}
          {step === 1 && (
            <View style={styles.form}>

              {/* Student Badge */}
              <View style={styles.studentBadge}>
                <Ionicons name="school" size={16} color="#3b82f6" />
                <Text style={styles.studentBadgeText}>Registering as Student</Text>
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <View style={[styles.inputContainer, !!emailError && styles.inputError]}>
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={emailError ? '#dc2626' : '#94a3b8'}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
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
                <ErrorRow msg={emailError} />
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={[styles.inputContainer, !!passwordError && styles.inputError]}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={passwordError ? '#dc2626' : '#94a3b8'}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Create a strong password"
                    placeholderTextColor="#94a3b8"
                    value={password}
                    onChangeText={(v) => {
                      setPassword(v);
                      if (passwordError) setPasswordError(validatePassword(v));
                      if (confirmPasswordError) setConfirmPasswordError(validateConfirmPassword(confirmPassword, v));
                      setApiError('');
                    }}
                    onBlur={() => setPasswordError(validatePassword(password))}
                    secureTextEntry={!showPassword}
                    returnKeyType="next"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#94a3b8" />
                  </TouchableOpacity>
                </View>
                <ErrorRow msg={passwordError} />
                {!passwordError && (
                  <Text style={styles.passwordHint}>
                    Min 8 chars · uppercase · number
                  </Text>
                )}
              </View>

              {/* Confirm Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={[styles.inputContainer, !!confirmPasswordError && styles.inputError]}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={confirmPasswordError ? '#dc2626' : '#94a3b8'}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Re-enter your password"
                    placeholderTextColor="#94a3b8"
                    value={confirmPassword}
                    onChangeText={(v) => {
                      setConfirmPassword(v);
                      if (confirmPasswordError) setConfirmPasswordError(validateConfirmPassword(v, password));
                      setApiError('');
                    }}
                    onBlur={() => setConfirmPasswordError(validateConfirmPassword(confirmPassword, password))}
                    secureTextEntry={!showConfirmPassword}
                    returnKeyType="done"
                    onSubmitEditing={handleSendOtp}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#94a3b8" />
                  </TouchableOpacity>
                </View>
                <ErrorRow msg={confirmPasswordError} />
              </View>

              {/* Send OTP Button */}
              <TouchableOpacity
                style={[styles.primaryButton, loadingSend && styles.primaryButtonDisabled]}
                onPress={handleSendOtp}
                disabled={loadingSend}
              >
                {loadingSend ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>Send OTP to Email</Text>
                    <Ionicons name="send" size={16} color="#fff" style={{ marginLeft: 8 }} />
                  </>
                )}
              </TouchableOpacity>

              {/* Login Link */}
              <View style={styles.loginLinkContainer}>
                <Text style={styles.linkText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                  <Text style={styles.linkBold}>Login</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── STEP 2: OTP Verification ── */}
          {step === 2 && (
            <View style={styles.form}>

              {/* OTP Sent Info */}
              <View style={styles.otpInfoBox}>
                <Ionicons name="mail" size={20} color="#3b82f6" />
                <Text style={styles.otpInfoText}>
                  A 6-digit OTP has been sent to <Text style={{ fontWeight: '700' }}>{email}</Text>
                </Text>
              </View>

              {/* OTP Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Enter OTP</Text>
                <View style={[styles.inputContainer, styles.otpInputContainer, !!otpError && styles.inputError]}>
                  <Ionicons
                    name="keypad-outline"
                    size={20}
                    color={otpError ? '#dc2626' : '#94a3b8'}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    ref={otpInputRef}
                    style={[styles.input, styles.otpInput]}
                    placeholder="• • • • • •"
                    placeholderTextColor="#94a3b8"
                    value={otp}
                    onChangeText={(v) => {
                      const digits = v.replace(/\D/g, '').slice(0, 6);
                      setOtp(digits);
                      if (otpError) setOtpError(validateOtp(digits));
                      setApiError('');
                    }}
                    keyboardType="number-pad"
                    maxLength={6}
                    returnKeyType="done"
                    onSubmitEditing={handleVerifyOtp}
                  />
                  {otp.length > 0 && (
                    <TouchableOpacity onPress={() => { setOtp(''); setOtpError(''); }}>
                      <Ionicons name="close-circle" size={20} color="#94a3b8" />
                    </TouchableOpacity>
                  )}
                </View>
                <ErrorRow msg={otpError} />
              </View>

              {/* OTP digit progress */}
              <View style={styles.otpDots}>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <View
                    key={i}
                    style={[styles.otpDot, otp.length > i && styles.otpDotFilled]}
                  />
                ))}
              </View>

              {/* Verify Button */}
              <TouchableOpacity
                style={[styles.primaryButton, (loadingVerify || otp.length < 6) && styles.primaryButtonDisabled]}
                onPress={handleVerifyOtp}
                disabled={loadingVerify || otp.length < 6}
              >
                {loadingVerify ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>Verify & Create Account</Text>
                    <Ionicons name="checkmark-circle" size={16} color="#fff" style={{ marginLeft: 8 }} />
                  </>
                )}
              </TouchableOpacity>

              {/* Resend OTP */}
              <View style={styles.resendRow}>
                <Text style={styles.linkText}>Didn't receive OTP? </Text>
                {countdown > 0 ? (
                  <Text style={styles.countdownText}>Resend in {formatCountdown(countdown)}</Text>
                ) : (
                  <TouchableOpacity onPress={handleResendOtp} disabled={loadingSend}>
                    {loadingSend ? (
                      <ActivityIndicator size="small" color="#3b82f6" />
                    ) : (
                      <Text style={styles.linkBold}>Resend OTP</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>

              {/* Change Email */}
              <TouchableOpacity
                style={styles.changeEmailBtn}
                onPress={() => { setStep(1); setOtp(''); setOtpError(''); setApiError(''); }}
              >
                <Ionicons name="pencil-outline" size={14} color="#64748b" />
                <Text style={styles.changeEmailText}>Change email address</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              © 2026 <Text style={{ color: '#3b82f6', fontWeight: '600' }}>{APP_NAME}</Text>. All rights reserved.
            </Text>
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
    paddingBottom: 40,
    flexGrow: 1,
  },
  backButton: {
    marginTop: 8,
    marginBottom: 12,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
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
    marginBottom: 20,
  },
  logoImage: {
    width: 180,
    height: 45,
  },
  logoTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#3b82f6',
    letterSpacing: -0.5,
  },
  logoSubtitle: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: '600',
    flexShrink: 1,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 0,
  },
  stepDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: '#0a1930',
  },
  stepDotText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
  },
  stepLine: {
    flex: 1,
    height: 3,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 4,
    maxWidth: 60,
  },
  stepLineActive: {
    backgroundColor: '#0a1930',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0a1930',
    marginBottom: 6,
    textAlign: 'center',
  },
  subText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
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
    gap: 16,
  },
  studentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 4,
  },
  studentBadgeText: {
    color: '#2563eb',
    fontSize: 13,
    fontWeight: '600',
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
    paddingHorizontal: 12,
    height: 52,
  },
  inputError: {
    borderColor: '#f87171',
    backgroundColor: '#fff5f5',
  },
  otpInputContainer: {
    height: 60,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#1e293b',
  },
  otpInput: {
    fontSize: 22,
    letterSpacing: 8,
    fontWeight: '700',
    textAlign: 'center',
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
  passwordHint: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  primaryButton: {
    flexDirection: 'row',
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
  primaryButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 4,
  },
  linkText: {
    color: '#64748b',
    fontSize: 14,
  },
  linkBold: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
  },
  otpInfoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 12,
    padding: 14,
  },
  otpInfoText: {
    flex: 1,
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 20,
  },
  otpDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: -4,
  },
  otpDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#e2e8f0',
  },
  otpDotFilled: {
    backgroundColor: '#0a1930',
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  countdownText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  changeEmailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  changeEmailText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '500',
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    color: '#94a3b8',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 18,
  },
});
