import { useState } from 'react';
import { X, User, Lock, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface UserSettingsProps {
  onClose: () => void;
}

export default function UserSettings({ onClose }: UserSettingsProps) {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'account'>('profile');
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleUpdateProfile() {
    if (!profile) return;

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName })
        .eq('id', profile.id);

      if (error) throw error;
      setMessage('Profile updated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword() {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (newPassword !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setMessage('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-xl w-full max-w-4xl h-[600px] flex overflow-hidden">
        <div className="w-64 bg-slate-900 p-4 space-y-2">
          <h3 className="text-xs font-semibold text-slate-400 uppercase px-2 mb-2">User Settings</h3>

          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
              activeTab === 'profile'
                ? 'bg-slate-700 text-white'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <User className="w-4 h-4 inline mr-2" />
            My Profile
          </button>

          <button
            onClick={() => setActiveTab('account')}
            className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
              activeTab === 'account'
                ? 'bg-slate-700 text-white'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Lock className="w-4 h-4 inline mr-2" />
            Password & Security
          </button>

          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={onClose}
              className="w-full px-3 py-2 text-slate-400 hover:text-white text-left rounded-md hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4 inline mr-2" />
              Close
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="p-6 border-b border-slate-700 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">
              {activeTab === 'profile' ? 'My Profile' : 'Password & Security'}
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'profile' && (
              <div className="space-y-6 max-w-2xl">
                <div className="flex items-center gap-4 p-4 bg-slate-900 rounded-lg">
                  <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center text-white text-2xl font-bold">
                    {profile?.username?.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-lg">{profile?.display_name || profile?.username}</p>
                    <p className="text-slate-400">@{profile?.username}</p>
                    {profile?.is_owner && (
                      <span className="inline-block mt-1 text-xs bg-amber-600 text-white px-2 py-1 rounded">
                        PLATFORM OWNER
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter display name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={profile?.username || ''}
                    disabled
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">Username cannot be changed</p>
                </div>

                {message && (
                  <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-3">
                    <p className="text-green-400 text-sm">{message}</p>
                  </div>
                )}

                {error && (
                  <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleUpdateProfile}
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="space-y-6 max-w-2xl">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Change Password</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter new password"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Confirm new password"
                      />
                    </div>

                    {message && (
                      <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-3">
                        <p className="text-green-400 text-sm">{message}</p>
                      </div>
                    )}

                    {error && (
                      <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
                        <p className="text-red-400 text-sm">{error}</p>
                      </div>
                    )}

                    <button
                      onClick={handleChangePassword}
                      disabled={loading || !newPassword || !confirmPassword}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Changing...' : 'Change Password'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
