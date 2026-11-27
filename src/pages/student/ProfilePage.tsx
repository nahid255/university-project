import React, { useState } from 'react';
import {
  Mail,
  Edit2,
  Save,
  Clock,
  Camera,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { updateUserProfile } from '../../services/authService';
import { uploadFile, validateFile } from '../../services/storage';
import { Badge } from '../../components/common/Badge';

export const ProfilePage: React.FC = () => {
  const { currentUser, refreshProfile } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!currentUser) return null;

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file, {
      maxSizeMB: 2,
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    });

    if (!validation.valid) {
      setError(validation.error || 'Invalid image file.');
      return;
    }

    try {
      const path = `avatars/${currentUser.uid}/${file.name}`;
      const url = await uploadFile(file, path);
      setAvatarUrl(url);
    } catch {
      setError('Could not upload avatar image.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      await updateUserProfile(currentUser.uid, {
        fullName: fullName.trim(),
        phone: phone.trim(),
        bio: bio.trim(),
        avatarUrl,
      });

      refreshProfile();
      setIsEditing(false);
      setMessage('Profile updated successfully.');
      setTimeout(() => setMessage(null), 3000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to update profile.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="jstu-surface p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-5">
            <div className="relative">
              <img
                src={
                  avatarUrl ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                    currentUser.fullName
                  )}`
                }
                alt={currentUser.fullName}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-blue-500/25 shadow-sm"
              />
              {isEditing && (
                <label className="absolute -bottom-1.5 -right-1.5 p-2 rounded-xl bg-blue-600 text-white cursor-pointer hover:bg-blue-700 transition-colors shadow-sm">
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="jstu-page-title">
                  {currentUser.fullName}
                </h1>
                <Badge
                  variant={currentUser.role === 'admin' ? 'purple' : 'primary'}
                  size="sm"
                >
                  {currentUser.role === 'admin' ? 'Administrator' : 'Student'}
                </Badge>
              </div>
              <p className="text-[15px] text-slate-600 dark:text-slate-300 mt-1">
                {currentUser.department} &middot; {currentUser.batch}
              </p>
              <p className="text-sm font-mono text-blue-600 dark:text-blue-400 font-semibold mt-1">
                Student ID: {currentUser.studentId}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (isEditing) {
                setIsEditing(false);
                setFullName(currentUser.fullName);
                setPhone(currentUser.phone || '');
                setBio(currentUser.bio || '');
              } else {
                setIsEditing(true);
              }
            }}
            className="jstu-btn-secondary shrink-0"
          >
            <Edit2 className="w-4 h-4" />
            <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
          </button>
        </div>

        {message && (
          <div className="mt-5 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/50 text-sm text-emerald-800 dark:text-emerald-200 font-medium">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-5 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 text-sm text-rose-700 dark:text-rose-300 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="mt-7 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                Full Legal Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="jstu-input"
                />
              ) : (
                <p className="text-base font-semibold text-slate-900 dark:text-slate-100 py-1">
                  {currentUser.fullName}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                University Email Address
              </label>
              <p className="text-base font-medium text-slate-700 dark:text-slate-300 py-1 flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate">{currentUser.email}</span>
                <span className="text-sm text-slate-400">(Locked)</span>
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                Student ID
              </label>
              <p className="text-base font-mono font-semibold text-slate-900 dark:text-slate-100 py-1">
                {currentUser.studentId}
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                Department &amp; School
              </label>
              <p className="text-base font-semibold text-slate-900 dark:text-slate-100 py-1">
                {currentUser.department}
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                Batch / Academic Year
              </label>
              <p className="text-base font-semibold text-slate-900 dark:text-slate-100 py-1">
                {currentUser.batch}
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                Contact Phone
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="jstu-input"
                />
              ) : (
                <p className="text-base font-semibold text-slate-900 dark:text-slate-100 py-1">
                  {currentUser.phone || 'No phone number provided'}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
              Personal Academic Bio
            </label>
            {isEditing ? (
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your academic interests, focus areas, or campus projects..."
                className="jstu-textarea"
              />
            ) : (
              <p className="jstu-body py-1">
                {currentUser.bio || 'No student biography added yet.'}
              </p>
            )}
          </div>

          <div className="pt-2 text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2 tabular-nums">
            <Clock className="w-4 h-4" />
            <span>Account initialized on {new Date(currentUser.createdAt).toLocaleDateString()}</span>
          </div>

          {isEditing && (
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/80 dark:border-slate-800">
              <button
                type="submit"
                disabled={saving}
                className="jstu-btn-primary"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving changes...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
