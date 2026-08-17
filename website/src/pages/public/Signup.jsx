import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../services/api';
import toast from 'react-hot-toast';

export function Signup() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [otpInvalid, setOtpInvalid] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('student');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
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
    if (!email.trim() || !password.trim()) {
      toast.error('Please enter email and password first.');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address.');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await authApi.registerStudent(email, password);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const termsCheckbox = document.getElementById('terms');
    if (!termsCheckbox?.checked) {
      toast.error('You must agree to the Terms of Service and Privacy Policy.');
      return;
    }

    if (!otp.trim()) {
      toast.error('Please enter the OTP.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await authApi.verifyOtp(email, otp, role);
      
      const user = {
        email: data.user.email,
        role: data.user.role,
        id: data.user.id,
        has_profile: false, // New users don't have profiles yet
        token: data.access
      };
      
      localStorage.setItem('currentUser', JSON.stringify(user));
      localStorage.setItem('token', data.access);
      localStorage.setItem('user_id', user.id);
      
      
      toast.success('Account created successfully!');
      
      if (user.role === 'teacher') {
        navigate('/dashboard/setup-profile');
      } else {
        navigate('/');
      }
    } catch (err) {
      toast.error(err.message || 'Invalid OTP. Please try again.');
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
          
          <h1 className="text-3xl font-bold text-primary-dark mb-2">Create Account</h1>
          <p className="text-slate-500 text-[15px]">Join us to start your learning journey</p>
        </div>

        {/* Form */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          
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
                  countdown > 0
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
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              disabled={!otpSent || otpInvalid}
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
                <CheckCircle2 className="w-3 h-3" /> OTP sent to your email. Valid for {countdown}s.
              </p>
            )}
          </div>

          {/* Role Field */}
          <div className="space-y-1.5">
            <label className="block text-[15px] font-semibold text-slate-800">I am a</label>
            <select
              className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-[15px]"
              required
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label className="block text-[15px] font-semibold text-slate-800">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-11 pr-11 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-[15px]"
                required
              />
              <div 
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
              >
                <Eye className={`h-5 w-5 transition-colors ${showPassword ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`} />
              </div>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-1.5">
            <label className="block text-[15px] font-semibold text-slate-800">Confirm Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full pl-11 pr-11 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-[15px]"
                required
              />
              <div 
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center cursor-pointer"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Eye className={`h-5 w-5 transition-colors ${showConfirmPassword ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`} />
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="flex items-start mt-2">
            <input
              type="checkbox"
              id="terms"
              className="mt-1 w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/20"
              required
            />
            <label htmlFor="terms" className="ml-2.5 text-sm text-slate-600 cursor-pointer leading-tight">
              I agree to the <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>
            </label>
          </div>

          {/* Sign Up Button */}
          <button
            type="submit"
            disabled={loading || !otpSent}
            className={`w-full font-medium py-3.5 px-4 rounded-xl transition-colors text-[16px] shadow-sm mt-4 ${
              loading || !otpSent
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-[#0a1930] hover:bg-[#112240] text-white'
            }`}
          >
            {loading ? 'Processing...' : 'Create Account'}
          </button>
        </form>

        {/* Divider */}
        <div className="mt-8 mb-8 flex items-center">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="px-4 text-sm text-slate-500 font-medium">or</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        {/* Google Signup */}
        <button
          type="button"
          className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-medium py-3 px-4 rounded-xl transition-colors text-[15px] flex items-center justify-center gap-2 mb-8 shadow-sm"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Sign up with Google
        </button>

        {/* Login Link */}
        <p className="text-center text-[15px] text-slate-500">
          Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Login</Link>
        </p>

        {/* Back to Home */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex justify-center">
          <Link to="/" className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-medium text-[15px]">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
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
