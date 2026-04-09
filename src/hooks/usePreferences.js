/**
 * USER PREFERENCES HOOK - Supabase
 * Manages user settings (night mode, language, notifications)
 * Preferences are stored in profiles table
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { profiles, cacheHelpers } from '../services/persistenceService';

/**
 * Hook for managing user preferences
 * @param {string} userId
 * @returns {object} { nightMode, setNightMode, language, setLanguage, notificationsEnabled, setNotificationsEnabled, loading, error }
 */
export function usePreferences(userId) {
  const [nightMode, setNightModeState] = useState(false);
  const [language, setLanguageState] = useState('pt-BR');
  const [notificationsEnabled, setNotificationsEnabledState] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isSyncingRef = useRef(false);

  // Load preferences from Supabase on mount
  useEffect(() => {
    if (!userId) return;

    const loadPreferences = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to load from cache first (faster)
        const cached = cacheHelpers.loadFromDisk(`preferences_${userId}`);
        if (cached) {
          setNightModeState(cached.nightMode ?? false);
          setLanguageState(cached.language ?? 'pt-BR');
          setNotificationsEnabledState(cached.notificationsEnabled ?? true);
        }

        // Fetch from Supabase
        const profile = await profiles.getProfile(userId);
        if (profile) {
          const prefs = {
            nightMode: profile.night_mode ?? false,
            language: profile.language ?? 'pt-BR',
            notificationsEnabled: profile.notifications_enabled ?? true,
          };

          setNightModeState(prefs.nightMode);
          setLanguageState(prefs.language);
          setNotificationsEnabledState(prefs.notificationsEnabled);
          cacheHelpers.saveToDisk(`preferences_${userId}`, prefs);
        }
      } catch (err) {
        console.error('Failed to load preferences:', err);
        setError(err.message);
        // Fall back to cache if available
        const cached = cacheHelpers.loadFromDisk(`preferences_${userId}`);
        if (cached) {
          setNightModeState(cached.nightMode ?? false);
          setLanguageState(cached.language ?? 'pt-BR');
          setNotificationsEnabledState(cached.notificationsEnabled ?? true);
        }
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [userId]);

  // Update night mode
  const setNightMode = useCallback((value) => {
    if (!userId) return;

    try {
      setError(null);
      const newValue = typeof value === 'function' ? value(nightMode) : value;
      setNightModeState(newValue);

      // Cache immediately
      const cacheKey = `preferences_${userId}`;
      const cached = cacheHelpers.loadFromDisk(cacheKey) || {};
      cacheHelpers.saveToDisk(cacheKey, {
        ...cached,
        nightMode: newValue
      });

      // Sync to Supabase (async)
      if (!isSyncingRef.current) {
        isSyncingRef.current = true;

        profiles.updateProfile(userId, { night_mode: newValue })
          .catch(err => {
            console.error('Failed to update night mode:', err);
            setError(err.message);
          })
          .finally(() => {
            isSyncingRef.current = false;
          });
      }
    } catch (err) {
      console.error('Failed to update night mode:', err);
      setError(err.message);
    }
  }, [userId, nightMode]);

  // Update language
  const setLanguage = useCallback((value) => {
    if (!userId) return;

    try {
      setError(null);
      const newValue = typeof value === 'function' ? value(language) : value;
      setLanguageState(newValue);

      // Cache immediately
      const cacheKey = `preferences_${userId}`;
      const cached = cacheHelpers.loadFromDisk(cacheKey) || {};
      cacheHelpers.saveToDisk(cacheKey, {
        ...cached,
        language: newValue
      });

      // Sync to Supabase (async)
      if (!isSyncingRef.current) {
        isSyncingRef.current = true;

        profiles.updateProfile(userId, { language: newValue })
          .catch(err => {
            console.error('Failed to update language:', err);
            setError(err.message);
          })
          .finally(() => {
            isSyncingRef.current = false;
          });
      }
    } catch (err) {
      console.error('Failed to update language:', err);
      setError(err.message);
    }
  }, [userId, language]);

  // Update notifications
  const setNotificationsEnabled = useCallback((value) => {
    if (!userId) return;

    try {
      setError(null);
      const newValue = typeof value === 'function' ? value(notificationsEnabled) : value;
      setNotificationsEnabledState(newValue);

      // Cache immediately
      const cacheKey = `preferences_${userId}`;
      const cached = cacheHelpers.loadFromDisk(cacheKey) || {};
      cacheHelpers.saveToDisk(cacheKey, {
        ...cached,
        notificationsEnabled: newValue
      });

      // Sync to Supabase (async)
      if (!isSyncingRef.current) {
        isSyncingRef.current = true;

        profiles.updateProfile(userId, { notifications_enabled: newValue })
          .catch(err => {
            console.error('Failed to update notifications:', err);
            setError(err.message);
          })
          .finally(() => {
            isSyncingRef.current = false;
          });
      }
    } catch (err) {
      console.error('Failed to update notifications:', err);
      setError(err.message);
    }
  }, [userId, notificationsEnabled]);

  return {
    nightMode,
    setNightMode,
    language,
    setLanguage,
    notificationsEnabled,
    setNotificationsEnabled,
    loading,
    error,
  };
}
