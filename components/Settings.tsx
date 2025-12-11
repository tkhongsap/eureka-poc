import React, { useState, useEffect, useRef } from 'react';
import { Bell, User, Info, Mail, CheckCircle, AlertTriangle, Clock, Wrench, Loader2, Save, Phone, Briefcase, AtSign, Camera } from 'lucide-react';
import { useLanguage } from '../lib/i18n';
import { getNotificationPreferences, updateNotificationPreferences, NotificationPreferences, getUserContext, getMyProfile, updateMyProfile, UserProfile, uploadImage } from '../services/apiService';

interface NotificationPreference {
  id: keyof NotificationPreferences;
  labelKey: string;
  descriptionKey: string;
  icon: React.ReactNode;
  enabled: boolean;
}

const Settings: React.FC = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Profile state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [editedProfile, setEditedProfile] = useState<{name: string; phone: string; avatar_url: string}>({
    name: '',
    phone: '',
    avatar_url: '',
  });
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  
  // Notification preferences state
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreference[]>([
    {
      id: 'wo_assigned',
      labelKey: 'settings.notif.woAssigned',
      descriptionKey: 'settings.notif.woAssignedDesc',
      icon: <Wrench size={18} className="text-teal-600" />,
      enabled: true,
    },
    {
      id: 'wo_status_changed',
      labelKey: 'settings.notif.woStatusChanged',
      descriptionKey: 'settings.notif.woStatusChangedDesc',
      icon: <CheckCircle size={18} className="text-green-600" />,
      enabled: true,
    },
    {
      id: 'wo_overdue',
      labelKey: 'settings.notif.woOverdue',
      descriptionKey: 'settings.notif.woOverdueDesc',
      icon: <AlertTriangle size={18} className="text-red-600" />,
      enabled: true,
    },
    {
      id: 'wo_due_soon',
      labelKey: 'settings.notif.woDueSoon',
      descriptionKey: 'settings.notif.woDueSoonDesc',
      icon: <Clock size={18} className="text-orange-600" />,
      enabled: true,
    },
    {
      id: 'email_digest',
      labelKey: 'settings.notif.emailDigest',
      descriptionKey: 'settings.notif.emailDigestDesc',
      icon: <Mail size={18} className="text-blue-600" />,
      enabled: false,
    },
  ]);

  // Load profile from API
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setProfileLoading(true);
        const data = await getMyProfile();
        setProfile(data);
        setEditedProfile({
          name: data.name || '',
          phone: data.phone || '',
          avatar_url: data.avatar_url || '',
        });
        setProfileError(null);
      } catch (e) {
        console.error('Failed to load profile:', e);
        setProfileError('Failed to load profile');
      } finally {
        setProfileLoading(false);
      }
    };
    loadProfile();
  }, []);

  // Save profile
  const handleSaveProfile = async () => {
    if (!profile) return;
    
    setProfileSaving(true);
    setProfileSuccess(false);
    try {
      const updated = await updateMyProfile(editedProfile);
      setProfile(updated);
      setProfileError(null);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
      
      // Update sessionStorage so Header gets new avatar
      const storedAuth = sessionStorage.getItem('authUser');
      if (storedAuth) {
        try {
          const authData = JSON.parse(storedAuth);
          authData.avatar_url = updated.avatar_url;
          authData.name = updated.name;
          sessionStorage.setItem('authUser', JSON.stringify(authData));
          // Dispatch event to notify App.tsx to refresh user
          window.dispatchEvent(new CustomEvent('profileUpdated', { detail: updated }));
        } catch (e) {
          console.log('Could not update sessionStorage');
        }
      }
    } catch (e) {
      console.error('Failed to save profile:', e);
      setProfileError('Failed to save profile');
    } finally {
      setProfileSaving(false);
    }
  };

  // Handle avatar upload
  const handleAvatarClick = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setProfileError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setProfileError('Image size must be less than 5MB');
      return;
    }

    setAvatarUploading(true);
    setProfileError(null);

    try {
      // Upload to image API
      const result = await uploadImage(file);
      // Use the raw endpoint URL for direct image display
      const avatarUrl = `/api/images/${result.id}/raw`;
      setEditedProfile(prev => ({ ...prev, avatar_url: avatarUrl }));
    } catch (e) {
      console.error('Failed to upload avatar:', e);
      setProfileError('Failed to upload image');
    } finally {
      setAvatarUploading(false);
    }
  };

  // Load preferences from API
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        setLoading(true);
        console.log('Loading preferences, user context:', getUserContext());
        const prefs = await getNotificationPreferences();
        console.log('Loaded preferences:', prefs);
        setNotificationPrefs(prev => prev.map(pref => ({
          ...pref,
          enabled: prefs[pref.id] ?? pref.enabled,
        })));
        setError(null);
      } catch (e) {
        console.error('Failed to load notification preferences:', e);
        setError('Failed to load preferences');
      } finally {
        setLoading(false);
      }
    };
    loadPreferences();
  }, []);

  // Save preferences to API
  const togglePreference = async (id: keyof NotificationPreferences) => {
    console.log('Toggle preference clicked:', id);
    setSaving(id);
    
    // Optimistic update
    const updated = notificationPrefs.map(pref => 
      pref.id === id ? { ...pref, enabled: !pref.enabled } : pref
    );
    setNotificationPrefs(updated);
    
    // Build preferences object
    const prefsToSave: NotificationPreferences = {
      wo_assigned: updated.find(p => p.id === 'wo_assigned')?.enabled ?? true,
      wo_status_changed: updated.find(p => p.id === 'wo_status_changed')?.enabled ?? true,
      wo_overdue: updated.find(p => p.id === 'wo_overdue')?.enabled ?? true,
      wo_due_soon: updated.find(p => p.id === 'wo_due_soon')?.enabled ?? true,
      email_digest: updated.find(p => p.id === 'email_digest')?.enabled ?? false,
    };
    
    console.log('Saving preferences:', prefsToSave);
    
    try {
      const result = await updateNotificationPreferences(prefsToSave);
      console.log('Save successful:', result);
      setError(null);
    } catch (e) {
      console.error('Failed to save notification preferences:', e);
      // Revert on error
      setNotificationPrefs(prev => prev.map(pref => 
        pref.id === id ? { ...pref, enabled: !pref.enabled } : pref
      ));
      setError('Failed to save preferences');
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900">{t('nav.settings')}</h1>
        <p className="text-stone-500 mt-1">{t('settings.description')}</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* Notification Settings */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
              <Bell className="text-orange-600" size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-stone-900">{t('settings.notifications')}</h2>
              <p className="text-sm text-stone-500">{t('settings.notificationsDescription')}</p>
            </div>
          </div>
          {loading ? (
            <div className="p-6 flex items-center justify-center">
              <Loader2 className="animate-spin text-teal-600" size={24} />
            </div>
          ) : (
          <div className="p-6 space-y-4">
            {notificationPrefs.map((pref) => (
              <div 
                key={pref.id}
                className="flex items-center justify-between p-4 bg-stone-50 rounded-xl hover:bg-stone-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    {pref.icon}
                  </div>
                  <div>
                    <div className="font-medium text-stone-800">{t(pref.labelKey as any)}</div>
                    <div className="text-sm text-stone-500">{t(pref.descriptionKey as any)}</div>
                  </div>
                </div>
                <button
                  onClick={() => togglePreference(pref.id)}
                  className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${
                    pref.enabled ? 'bg-teal-600' : 'bg-stone-300'
                  } ${saving === pref.id ? 'opacity-50' : ''}`}
                  disabled={saving === pref.id}
                >
                  {saving === pref.id ? (
                    <Loader2 className="absolute top-1 left-3.5 w-5 h-5 text-teal-600 animate-spin" />
                  ) : (
                  <span
                    className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                      pref.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                  )}
                </button>
              </div>
            ))}
          </div>
          )}
        </div>

        {/* Profile Settings */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <User className="text-blue-600" size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-stone-900">{t('settings.profile')}</h2>
              <p className="text-sm text-stone-500">{t('settings.profileDescription')}</p>
            </div>
          </div>
          {profileLoading ? (
            <div className="p-6 flex items-center justify-center">
              <Loader2 className="animate-spin text-blue-600" size={24} />
            </div>
          ) : profile ? (
            <div className="p-6 space-y-6">
              {/* Avatar and Info (read-only info) */}
              <div className="flex items-center gap-4 pb-4 border-b border-stone-100">
                {/* Clickable Avatar */}
                <div className="relative group">
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <button
                    onClick={handleAvatarClick}
                    disabled={avatarUploading}
                    className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-stone-200 hover:border-blue-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <img 
                      src={editedProfile.avatar_url || profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`}
                      alt={profile.name}
                      className="w-full h-full object-cover"
                    />
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      {avatarUploading ? (
                        <Loader2 size={20} className="text-white animate-spin" />
                      ) : (
                        <Camera size={20} className="text-white" />
                      )}
                    </div>
                  </button>
                  <p className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-stone-400 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    {t('settings.changePhoto')}
                  </p>
                </div>
                <div>
                  <div className="font-semibold text-stone-900 text-lg">{profile.name}</div>
                  <div className="flex items-center gap-1 text-stone-500 text-sm">
                    <AtSign size={14} />
                    {profile.email || '-'}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-teal-50 text-teal-700 text-xs font-medium rounded-full">
                      {profile.userRole}
                    </span>
                    {profile.job_title && (
                      <span className="flex items-center gap-1 text-stone-500 text-xs">
                        <Briefcase size={12} />
                        {profile.job_title}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Error/Success messages */}
              {profileError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                  <AlertTriangle size={16} />
                  {profileError}
                </div>
              )}
              {profileSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
                  <CheckCircle size={16} />
                  {t('settings.profileSaved')}
                </div>
              )}
              
              {/* Editable fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    {t('settings.name')}
                  </label>
                  <div className="relative">
                    <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="text"
                      value={editedProfile.name}
                      onChange={(e) => setEditedProfile(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={t('settings.namePlaceholder')}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    {t('settings.phone')}
                  </label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="tel"
                      value={editedProfile.phone}
                      onChange={(e) => setEditedProfile(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={t('settings.phonePlaceholder')}
                    />
                  </div>
                </div>
              </div>
              
              {/* Save button */}
              <div className="pt-2">
                <button
                  onClick={handleSaveProfile}
                  disabled={profileSaving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {profileSaving ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Save size={18} />
                  )}
                  {t('settings.saveProfile')}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 text-stone-400 text-sm">
              {t('settings.profileError')}
            </div>
          )}
        </div>

        {/* About Section */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center">
              <Info className="text-stone-600" size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-stone-900">{t('settings.about')}</h2>
              <p className="text-sm text-stone-500">{t('settings.aboutDescription')}</p>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-stone-500">{t('settings.version')}:</span>
                <span className="ml-2 font-medium text-stone-900">1.0.0-beta</span>
              </div>
              <div>
                <span className="text-stone-500">{t('settings.tenant')}:</span>
                <span className="ml-2 font-medium text-stone-900">Acme Corp</span>
              </div>
              <div>
                <span className="text-stone-500">{t('settings.environment')}:</span>
                <span className="ml-2 font-medium text-stone-900">Development</span>
              </div>
              <div>
                <span className="text-stone-500">{t('settings.lastUpdated')}:</span>
                <span className="ml-2 font-medium text-stone-900">2025-12-11</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
