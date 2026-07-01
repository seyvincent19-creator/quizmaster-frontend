import { useState } from 'react';
import Layout from '../components/Layout';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';
import Spinner from '../components/ui/Spinner';

export default function Profile() {
  const { user, updateProfile, changePassword, loading } = useAuthStore();
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', email: user?.email || '' });
  const [passwordForm, setPasswordForm] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [profileErrors, setProfileErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileErrors({});
    const result = await updateProfile(profileForm);
    if (result.success) {
      toast.success('Profile updated!');
    } else {
      setProfileErrors(result.errors || {});
      toast.error('Failed to update profile');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordErrors({});
    const result = await changePassword(passwordForm);
    if (result.success) {
      toast.success('Password changed!');
      setPasswordForm({ current_password: '', password: '', password_confirmation: '' });
    } else {
      if (result.errors) setPasswordErrors(result.errors);
      toast.error(result.message || 'Failed to change password');
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>

        {/* Profile Info */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 pb-3 border-b">Personal Information</h2>
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input
                type="text" value={profileForm.name}
                onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))}
                className={`input ${profileErrors.name ? 'border-red-400' : ''}`}
              />
              {profileErrors.name && <p className="text-red-500 text-xs mt-1">{profileErrors.name[0]}</p>}
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email" value={profileForm.email}
                onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))}
                className={`input ${profileErrors.email ? 'border-red-400' : ''}`}
              />
              {profileErrors.email && <p className="text-red-500 text-xs mt-1">{profileErrors.email[0]}</p>}
            </div>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <Spinner size="sm" /> : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 pb-3 border-b">Change Password</h2>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="label">Current Password</label>
              <input
                type="password" value={passwordForm.current_password}
                onChange={e => setPasswordForm(f => ({ ...f, current_password: e.target.value }))}
                className="input" placeholder="••••••••"
              />
            </div>
            <div>
              <label className="label">New Password</label>
              <input
                type="password" value={passwordForm.password}
                onChange={e => setPasswordForm(f => ({ ...f, password: e.target.value }))}
                className={`input ${passwordErrors.password ? 'border-red-400' : ''}`}
                placeholder="Min. 8 characters"
              />
              {passwordErrors.password && <p className="text-red-500 text-xs mt-1">{passwordErrors.password[0]}</p>}
            </div>
            <div>
              <label className="label">Confirm New Password</label>
              <input
                type="password" value={passwordForm.password_confirmation}
                onChange={e => setPasswordForm(f => ({ ...f, password_confirmation: e.target.value }))}
                className="input" placeholder="Repeat new password"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <Spinner size="sm" /> : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
