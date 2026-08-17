import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { authApi } from '../../services/api';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordScreen() {
  const router = useRouter();

  // Field states
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI Flow & Loading states
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Error states
  const [apiError, setApiError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // Validators
  const validateEmail = (val: string) => {
    if (!val.trim()) return 'Email is required';
    if (!EMAIL_REGEX.test(val.trim())) return 'Enter a valid email address';
    return '';
  };

  const validateOtp = (val: string) => {
    if (!val.trim()) return 'OTP is required';
    if (!/^\d{6}$/.test(val.trim())) return 'OTP must be exactly 6 digits';
    return '';
  };

  const validatePassword = (val: string) => {
    if (!val) return 'New password is required';
    if (val.length < 8) return 'Password must be at least 8 characters';
    return '';
  };

  // Step 1: Send OTP
  const handleSendOtp = async () => {
    setApiError('');
    const eErr = validateEmail(email);
    setEmailError(eErr);
    if (eErr) return;

    setLoading(true);
    try {
      await authApi.forgotPasswordRequest(email.trim());
      setStep(2);
    } catch (err: any) {
      setApiError(err.message || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP & Reset Password
  const handleVerifyAndReset = async () => {
    setApiError('');
    const oErr = validateOtp(otp);
    const pErr = validatePassword(password);
    let cpErr = '';
    if (password !== confirmPassword) {
      cpErr = 'Passwords do not match';
    }

    setOtpError(oErr);
    setPasswordError(pErr);
    setConfirmPasswordError(cpErr);

    if (oErr || pErr || cpErr) return;

    setLoading(true);
    try {
      await authApi.forgotPasswordVerify(email.trim(), otp.trim(), password);
      setStep(3);
    } catch (err: any) {
      setApiError(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  // Helper Error components
  const ErrorRow = ({ msg }: { msg: string }) =>
    msg ? (
      <View style={styles.fieldErrorRow}>
        <Ionicons name="warning-outline" size={13} color="#dc2626" />
        <Text style={styles.fieldErrorText}>{msg}</Text>
      </View>
    ) : null;

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
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Back Button */}
          {step < 3 && (
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => (step === 2 ? setStep(1) : router.back())}
            >
              <Ionicons name="arrow-back" size={24} color="#64748b" />
            </TouchableOpacity>
          )}

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons 
                name={step === 3 ? "checkmark-circle" : "key-outline"} 
                size={48} 
                color="#0a1930" 
              />
            </View>
            <Text style={styles.welcomeText}>
              {step === 1 && "Forgot Password?"}
              {step === 2 && "Reset Password"}
              {step === 3 && "Password Reset!"}
            </Text>
            <Text style={styles.subText}>
              {step === 1 && "No worries, we'll send you a 6-digit OTP code to verify your email."}
              {step === 2 && `Enter the 6-digit code sent to ${email} and set your new password.`}
              {step === 3 && "Your password has been reset successfully. You can now log in with your new password."}
            </Text>
          </View>

          {/* API Error Banner */}
          <ApiBanner />

          {/* Form Step 1: Request OTP */}
          {step === 1 && (
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <View style={[styles.inputContainer, emailError ? styles.inputError : null]}>
                  <Ionicons name="mail-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor="#94a3b8"
                    value={email}
                    onChangeText={(val) => {
                      setEmail(val);
                      if (emailError) setEmailError('');
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                <ErrorRow msg={emailError} />
              </View>

              <TouchableOpacity 
                style={[styles.resetButton, loading && styles.resetButtonDisabled]} 
                onPress={handleSendOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.resetButtonText}>Send Reset OTP</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Form Step 2: Verify OTP & Enter New Password */}
          {step === 2 && (
            <View style={styles.form}>
              {/* OTP Field */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Verification Code (OTP)</Text>
                <View style={[styles.inputContainer, otpError ? styles.inputError : null]}>
                  <Ionicons name="shield-checkmark-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.otpInput]}
                    placeholder="123456"
                    placeholderTextColor="#94a3b8"
                    value={otp}
                    onChangeText={(val) => {
                      setOtp(val.replace(/[^0-9]/g, ''));
                      if (otpError) setOtpError('');
                    }}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>
                <ErrorRow msg={otpError} />
              </View>

              {/* Password Field */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>New Password</Text>
                <View style={[styles.inputContainer, passwordError ? styles.inputError : null]}>
                  <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="At least 8 characters"
                    placeholderTextColor="#94a3b8"
                    value={password}
                    onChangeText={(val) => {
                      setPassword(val);
                      if (passwordError) setPasswordError('');
                    }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons 
                      name={showPassword ? "eye-off-outline" : "eye-outline"} 
                      size={20} 
                      color="#94a3b8" 
                    />
                  </TouchableOpacity>
                </View>
                <ErrorRow msg={passwordError} />
              </View>

              {/* Confirm Password Field */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm New Password</Text>
                <View style={[styles.inputContainer, confirmPasswordError ? styles.inputError : null]}>
                  <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Re-enter password"
                    placeholderTextColor="#94a3b8"
                    value={confirmPassword}
                    onChangeText={(val) => {
                      setConfirmPassword(val);
                      if (confirmPasswordError) setConfirmPasswordError('');
                    }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                </View>
                <ErrorRow msg={confirmPasswordError} />
              </View>

              <TouchableOpacity 
                style={[styles.resetButton, loading && styles.resetButtonDisabled]} 
                onPress={handleVerifyAndReset}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.resetButtonText}>Update Password</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Form Step 3: Success Screen */}
          {step === 3 && (
            <View style={styles.successContainer}>
              <TouchableOpacity 
                style={styles.backToLoginButton} 
                onPress={() => router.replace('/(auth)/login')}
              >
                <Text style={styles.backToLoginText}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          )}

          {step < 3 && (
            <TouchableOpacity 
              style={styles.footerLink} 
              onPress={() => router.replace('/(auth)/login')}
            >
              <Ionicons name="arrow-back" size={16} color="#64748b" />
              <Text style={styles.footerLinkText}>Back to Login</Text>
            </TouchableOpacity>
          )}
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
    flexGrow: 1,
  },
  backButton: {
    marginTop: 8,
    marginBottom: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#fff',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
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
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 15,
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
  otpInput: {
    fontSize: 18,
    letterSpacing: 2,
    fontWeight: '600',
  },
  resetButton: {
    backgroundColor: '#0a1930',
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  resetButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  fieldErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  fieldErrorText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '500',
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
    marginBottom: 20,
  },
  errorBannerText: {
    flex: 1,
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '500',
  },
  successContainer: {
    alignItems: 'center',
    gap: 24,
    marginTop: 16,
  },
  backToLoginButton: {
    width: '100%',
    backgroundColor: '#0a1930',
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backToLoginText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    paddingTop: 40,
    gap: 8,
  },
  footerLinkText: {
    color: '#64748b',
    fontSize: 15,
    fontWeight: '500',
  },
});
