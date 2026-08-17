import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../services/api';
import toast from 'react-hot-toast';

export function ForgotPassword() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [otpInvalid, setOtpInvalid] = useState(false);
  
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0 && otpSent) {
      setOtpInvalid(true);
    }
    return () => clearInterval(timer);
  }, [countdown, otpSent]);

  const handleSendOtp = async () => {
    if (!email.trim()) {
      toast.error('Please enter your email address first.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await authApi.forgotPasswordRequest(email);
      setOtpSent(true);
      setOtpInvalid(false);
      setCountdown(90);
      toast.success('OTP sent to your email!');
    } catch (err) {
      toast.error(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!otp.trim()) {
      toast.error('Please enter the OTP.');
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await authApi.forgotPasswordVerify(email, otp, newPassword);
      toast.success('Password successfully reset! You can now login.');
      navigate('/login');
    } catch (err) {
      toast.error(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-10 mt-8 mb-8">
        
        {/* Logo and Header */}
        <div className="flex flex-col items-center mb-8 select-none">
          <Link to="/" className="flex items-center gap-3 mb-6">
            <img src="/logo.png" alt="Logo" className="h-16 w-16 object-contain" />
            <div className="flex flex-col">
              <span className="font-black text-2xl text-slate-800 uppercase tracking-wide leading-none">Teacher</span>
              <span className="font-extrabold text-3xl text-blue-600 uppercase tracking-wide leading-none mt-0.5">Performance</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="h-[2px] w-6 bg-cyan-400 rounded"></span>
                <span className="text-xs font-bold tracking-[0.22em] text-slate-700 uppercase">Analyzer</span>
                <span className="h-[2px] w-6 bg-emerald-500 rounded"></span>
              </div>
            </div>
          </Link>
          
          <h1 className="text-3xl font-bold text-primary-dark mb-2">Reset Password</h1>
          <p className="text-slate-500 text-[15px] text-center">
            Verify your email with an OTP to create a new password.
          </p>
        </div>

        {/* Form */}
        <form className="space-y-5" onSubmit={handleResetPassword}>
          
          {/* Email Field */}
          <div className="space-y-1.5">
            <label className="block text-[15px] font-semibold text-slate-800">Email Address</label>
            <div className="flex gap-2">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  id="forgot-email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-[15px]"
                  required
                />
              </div>
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={countdown > 0 || loading}
                className={`px-4 py-3 rounded-xl font-medium text-sm transition-colors whitespace-nowrap min-w-[120px] flex justify-center ${
                  countdown > 0 || loading
                    ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                    : 'bg-primary/10 text-primary hover:bg-primary/20 border border-primary/10'
                }`}
              >
                {countdown > 0 ? (
                  `Resend in ${countdown}s`
                ) : otpSent ? (
                  'Resend OTP'
                ) : (
                  'Send OTP'
                )}
              </button>
            </div>
          </div>

          {/* Email OTP Field */}
          <div className="space-y-1.5">
            <label className="block text-[15px] font-semibold text-slate-800">Email OTP</label>
            <input
              type="text"
              id="forgot-otp"
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              disabled={!otpSent || otpInvalid || loading}
              className={`block w-full px-4 py-3 bg-white border rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors text-[15px] tracking-widest ${
                otpInvalid ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-primary'
              } ${(!otpSent || otpInvalid) ? 'bg-slate-50 opacity-70 cursor-not-allowed' : ''}`}
              required
            />
            {otpInvalid && (
              <p className="text-red-500 text-xs mt-1">OTP has expired. Please resend.</p>
            )}
            {otpSent && !otpInvalid && (
              <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> OTP sent. Valid for {countdown}s.
              </p>
            )}
          </div>

          {/* New Password Field */}
          <div className="space-y-1.5">
            <label className="block text-[15px] font-semibold text-slate-800">New Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                id="forgot-new-password"
                placeholder="Create new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={!otpSent || otpInvalid || loading}
                className={`block w-full pl-11 pr-11 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-[15px] ${(!otpSent || otpInvalid) ? 'bg-slate-50 opacity-70 cursor-not-allowed' : ''}`}
                required
              />
              <div 
                className={`absolute inset-y-0 right-0 pr-3.5 flex items-center ${(!otpSent || otpInvalid || loading) ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                onClick={() => (!otpSent || otpInvalid || loading) ? null : setShowPassword(!showPassword)}
              >
                <Eye className={`h-5 w-5 transition-colors ${showPassword ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`} />
              </div>
            </div>
          </div>

          {/* Confirm New Password Field */}
          <div className="space-y-1.5">
            <label className="block text-[15px] font-semibold text-slate-800">Confirm New Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="forgot-confirm-password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={!otpSent || otpInvalid || loading}
                className={`block w-full pl-11 pr-11 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-[15px] ${(!otpSent || otpInvalid) ? 'bg-slate-50 opacity-70 cursor-not-allowed' : ''}`}
                required
              />
              <div 
                className={`absolute inset-y-0 right-0 pr-3.5 flex items-center ${(!otpSent || otpInvalid || loading) ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                onClick={() => (!otpSent || otpInvalid || loading) ? null : setShowConfirmPassword(!showConfirmPassword)}
              >
                <Eye className={`h-5 w-5 transition-colors ${showConfirmPassword ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`} />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!otpSent || otpInvalid || loading}
            className={`w-full text-white font-medium py-3.5 px-4 rounded-xl transition-colors text-[16px] shadow-sm mt-4 flex items-center justify-center ${
              (!otpSent || otpInvalid || loading) 
                ? 'bg-slate-300 cursor-not-allowed' 
                : 'bg-[#0a1930] hover:bg-[#112240]'
            }`}
          >
            {loading ? 'Processing...' : 'Reset Password'}
          </button>
        </form>

        {/* Back to Login */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex justify-center">
          <Link to="/login" className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-medium text-[15px]">
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="text-sm text-slate-500 font-medium mt-auto pb-4">
        © 2025 Bright Future College. All rights reserved.
      </div>
    </div>
  );
}
