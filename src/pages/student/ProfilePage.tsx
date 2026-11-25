import React, { useState } from 'react';
import {
  User,
  Mail,
  IdCard,
  Building2,
  Calendar,
  Phone,
  Edit2,
  Save,
  Clock,
  ShieldCheck,
  CheckCircle2,
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
      {/* Profile Header Card */}
      <div className="bg-white dark:bg-[#111C32] rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
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
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover ring-4 ring-blue-500/20 shadow-md"
              />
              {isEditing && (
                <label className="absolute -bottom-1 -right-1 p-2 rounded-xl bg-blue-600 text-white cursor-pointer hover:bg-blue-700 transition-colors shadow-xs">
                  <Camera className="w-3.5 h-3.5" />
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
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {currentUser.fullName}
                </h1>
                <Badge
                  variant={currentUser.role === 'admin' ? 'purple' : 'primary'}
                  size="sm"
                >
                  {currentUser.role === 'admin' ? 'Administrator' : 'Student'}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {currentUser.department} &bull; {currentUser.batch}
              </p>
              <p className="text-xs font-mono text-blue-600 dark:text-blue-400 font-bold mt-1">
                Student ID: {currentUser.studentId}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (isEditing) {
                // cancel
                setIsEditing(false);
                setFullName(currentUser.fullName);
                setPhone(currentUser.phone || '');
                setBio(currentUser.bio || '');
              } else {
                setIsEditing(true);
              }
            }}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
          </button>
        </div>

        {message && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 font-medium">
            {error}
          </div>
        )}

        {/* Profile Info Form / Display */}
        <form onSubmit={handleSave} className="mt-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Full Legal Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              ) : (
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 py-1">
                  {currentUser.fullName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                University Email Address
              </label>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300 py-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{currentUser.email}</span>
                <span className="text-[10px] text-slate-400 italic">(Locked)</span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Student ID
              </label>
              <p className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 py-1">
                {currentUser.studentId}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Department & School
              </label>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 py-1">
                {currentUser.department}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Batch / Academic Year
              </label>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 py-1">
                {currentUser.batch}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Contact Phone
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              ) : (
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 py-1">
                  {currentUser.phone || 'No phone number provided'}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Personal Academic Bio
            </label>
            {isEditing ? (
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your academic interests, focus areas, or campus projects..."
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            ) : (
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed py-1">
                {currentUser.bio || 'No student biography added yet.'}
              </p>
            )}
          </div>

          <div className="pt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Account initialized on {new Date(currentUser.createdAt).toLocaleDateString()}</span>
          </div>

          {isEditing && (
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center gap-2"
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
