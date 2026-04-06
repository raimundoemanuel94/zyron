import { useState, useEffect, useMemo, useCallback } from 'react';
import { profileService } from './profileService';
import { calculateMetrics } from '../fitness/fitnessEngine';

/**
 * useProfile Hook - The central brain for User Profile and Fitness Metrics
 * @param {string} userId - Auth user ID
 */
export function useProfile(userId) {
  const [profile, setProfile] = useState(null);
  const [statsData, setStatsData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setStatsData(null);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const [pData, sData] = await Promise.all([
        profileService.getProfile(userId),
        profileService.getProfileStats(userId)
      ]);
      setProfile(pData);
      setStatsData(sData);
    } catch (err) {
      console.error('[useProfile] Fetch Error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  /**
   * Derived metrics based on current profile state.
   */
  const metrics = useMemo(() => {
    if (!profile) return null;
    return calculateMetrics(profile);
  }, [profile]);

  /**
   * Combined stats (DB + Profile Goals)
   */
  const stats = useMemo(() => {
    if (!statsData || !profile) return null;
    return {
      ...statsData,
      weeklyTargetDays: profile.goals?.frequencyPerWeek || 0
    };
  }, [statsData, profile]);

  /**
   * Updates the profile state and persists it to the database.
   */
  const updateProfile = async (updates) => {
    if (!userId || !profile) return false;

    const newProfile = {
      ...profile,
      ...updates,
      bio: updates.bio ? { ...profile.bio, ...updates.bio } : profile.bio,
      goals: updates.goals ? { ...profile.goals, ...updates.goals } : profile.goals,
      preferences: updates.preferences ? { ...profile.preferences, ...updates.preferences } : profile.preferences,
    };

    setProfile(newProfile);
    const success = await profileService.updateProfile(userId, newProfile);
    
    if (!success) {
      console.warn('[useProfile] Update failed, refreshing from source...');
      await fetchProfile();
      return false;
    }

    return true;
  };

  return {
    profile,
    metrics,
    stats,
    isLoading,
    error,
    refreshProfile: fetchProfile,
    updateProfile,
  };
}
