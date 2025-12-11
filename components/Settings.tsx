import React, { useState, useEffect } from 'react';
import { Bell, User, Info, Mail, CheckCircle, AlertTriangle, Clock, Wrench, Loader2 } from 'lucide-react';
import { useLanguage } from '../lib/i18n';
import { getNotificationPreferences, updateNotificationPreferences, NotificationPreferences, getUserContext } from '../services/apiService';

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

        {/* Profile Settings - Placeholder */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden opacity-60">
          <div className="px-6 py-4 border-b border-stone-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <User className="text-blue-600" size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-stone-900">{t('settings.profile')}</h2>
              <p className="text-sm text-stone-500">{t('settings.profileDescription')}</p>
            </div>
            <span className="ml-auto text-xs bg-stone-100 text-stone-500 px-2 py-1 rounded-full">
              {t('common.comingSoon')}
            </span>
          </div>
          <div className="p-6 text-stone-400 text-sm">
            {t('settings.profilePlaceholder')}
          </div>
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
