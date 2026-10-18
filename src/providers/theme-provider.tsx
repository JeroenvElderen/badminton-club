import { supabase } from '@/lib/supabase';
import { DEFAULT_THEME, isThemeId, THEMES, type AppTheme, type ThemeId } from '@/lib/themes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type ThemeContextValue = {
  themeId: ThemeId;
  theme: AppTheme;
  ready: boolean;
  setTheme: (id: ThemeId) => Promise<void>;
};
const ThemeContext = createContext<ThemeContextValue | null>(null);
const storageKey = (userId: string) => `riverside:theme:${userId}`;

export function AppThemeProvider({ userId, children }: { userId: string; children: React.ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>(DEFAULT_THEME);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    setThemeId(DEFAULT_THEME);
    setReady(false);
    async function load() {
      try {
        const local = await AsyncStorage.getItem(storageKey(userId));
        if (active && isThemeId(local)) setThemeId(local);
        const { data, error } = await supabase
          .from('profiles').select('theme_id').eq('id', userId).maybeSingle();
        if (!error && active && isThemeId(data?.theme_id)) {
          setThemeId(data.theme_id);
          await AsyncStorage.setItem(storageKey(userId), data.theme_id);
        } else if (error) {
          console.warn('Theme sync unavailable:', error.message);
        }
      } catch (error) {
        console.warn('Could not load theme preference:', error);
      } finally {
        if (active) setReady(true);
      }
    }
    void load();
    return () => { active = false; };
  }, [userId]);

  const setTheme = useCallback(async (id: ThemeId) => {
    if (!isThemeId(id)) return;
    const previous = themeId;
    setThemeId(id);
    try {
      await AsyncStorage.setItem(storageKey(userId), id);
      const { error } = await supabase.from('profiles').update({ theme_id: id }).eq('id', userId);
      if (error) console.warn('Theme saved locally but Supabase sync failed:', error.message);
    } catch (error) {
      setThemeId(previous);
      console.warn('Theme save failed:', error);
      throw error;
    }
  }, [themeId, userId]);

  const value = useMemo(() => ({ themeId, theme: THEMES[themeId], ready, setTheme }), [themeId, ready, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useAppTheme must be used within AppThemeProvider');
  return context;
}
