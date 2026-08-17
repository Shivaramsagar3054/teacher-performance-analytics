import React, { useState, useEffect } from 'react';
import { ShieldAlert, User, Key, Save, Lock } from 'lucide-react';
import { authApi } from '../../services/api';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';

export function Settings() {
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    email: '',
    username: '',
    role: ''
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);

  // Password States
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordUpdating, setPasswordUpdating] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setProfileLoading(true);
      const data = await authApi.getProfile();
      setProfile({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || '',
        username: data.username || '',
        role: data.role || ''
      });
      setProfileLoading(false);
    } catch (err) {
      console.error('Failed to load user profile', err);
      toast.error('Failed to load user profile details.');
      setProfileLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profile.first_name.trim() || !profile.last_name.trim()) {
      toast.error('First name and Last name are required.');
      return;
    }

    try {
      setProfileSaving(true);
      const updated = await authApi.updateProfile({
        first_name: profile.first_name,
        last_name: profile.last_name
      });
      setProfile(prev => ({
        ...prev,
        first_name: updated.first_name || '',
        last_name: updated.last_name || ''
      }));
      
      // Update local storage currentUser if it exists
      const stored = localStorage.getItem('currentUser');
      if (stored) {
        try {
          const userObj = JSON.parse(stored);
          userObj.first_name = updated.first_name;
          userObj.last_name = updated.last_name;
          localStorage.setItem('currentUser', JSON.stringify(userObj));
        } catch (e) {
          console.error(e);
        }
      }

      toast.success('Profile details updated successfully!');
      
      // Reload page or trigger navbar update
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!oldPassword) {
      toast.error('Please enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    try {
      setPasswordUpdating(true);
      await authApi.changePassword(oldPassword, newPassword);
      toast.success('Password updated successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.message || 'Failed to update password.');
    } finally {
      setPasswordUpdating(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-slate-500 font-medium text-sm">Loading security and settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto py-4">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight font-sans">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your account profile details and security settings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Profile Card */}
        <Card className="rounded-3xl border border-slate-200 shadow-sm bg-white overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-800 text-lg leading-tight">Account Details</h2>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Edit your name and profile information</p>
            </div>
          </div>
          
          <CardContent className="p-8">
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              
              {/* Email (Read Only) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Email Address</label>
                <input 
                  type="email" 
                  value={profile.email} 
                  disabled 
                  className="w-full bg-slate-50 text-slate-500 border border-slate-200/80 rounded-2xl px-4 py-3 text-sm font-semibold cursor-not-allowed opacity-75"
                />
              </div>

              {/* Username (Read Only) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Username</label>
                <input 
                  type="text" 
                  value={profile.username} 
                  disabled 
                  className="w-full bg-slate-50 text-slate-500 border border-slate-200/80 rounded-2xl px-4 py-3 text-sm font-semibold cursor-not-allowed opacity-75"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* First Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">First Name</label>
                  <input 
                    type="text" 
                    name="first_name"
                    value={profile.first_name}
                    onChange={(e) => setProfile(prev => ({ ...prev, first_name: e.target.value }))}
                    placeholder="Enter first name"
                    className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>

                {/* Last Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Last Name</label>
                  <input 
                    type="text" 
                    name="last_name"
                    value={profile.last_name}
                    onChange={(e) => setProfile(prev => ({ ...prev, last_name: e.target.value }))}
                    placeholder="Enter last name"
                    className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
              </div>

              {/* Role (Read Only) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Account Type</label>
                <input 
                  type="text" 
                  value={profile.role.toUpperCase()} 
                  disabled 
                  className="w-full bg-slate-50 text-slate-500 border border-slate-200/80 rounded-2xl px-4 py-3 text-sm font-semibold cursor-not-allowed opacity-75"
                />
              </div>

              <Button 
                type="submit" 
                disabled={profileSaving}
                className="w-full bg-primary-dark hover:bg-slate-800 text-white font-bold py-3.5 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {profileSaving ? 'Saving Changes...' : 'Save Changes'}
              </Button>

            </form>
          </CardContent>
        </Card>

        {/* Security Card */}
        <Card className="rounded-3xl border border-slate-200 shadow-sm bg-white overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-800 text-lg leading-tight">Change Password</h2>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Ensure your account is using a secure password</p>
            </div>
          </div>

          <CardContent className="p-8">
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              
              {/* Current Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Current Password</label>
                <input 
                  type="password" 
                  value={oldPassword} 
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">New Password</label>
                <input 
                  type="password" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="•••••••• (Min 8 characters)"
                  className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Confirm New Password</label>
                <input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl flex gap-3 text-xs text-amber-800 leading-relaxed">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  After updating your password, your session will remain active, but you must use the new password on future login attempts.
                </span>
              </div>

              <Button 
                type="submit" 
                disabled={passwordUpdating}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                {passwordUpdating ? 'Updating Password...' : 'Update Password'}
              </Button>

            </form>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
