'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import pt from '@/locales/pt';
import en from '@/locales/en';
import es from '@/locales/es';
import de from '@/locales/de';
import fr from '@/locales/fr';
import it from '@/locales/it';
import zh from '@/locales/zh';
import ja from '@/locales/ja';
import ko from '@/locales/ko';
import { supabase } from '@/lib/supabase';

const dictionaries = { pt, en, es, de, fr, it, zh, ja, ko };

export const supportedLanguages = [
  { code: 'pt', name: 'Português', icon: '🇧🇷' },
  { code: 'en', name: 'English', icon: '🇺🇸' },
  { code: 'es', name: 'Español', icon: '🇪🇸' },
  { code: 'de', name: 'Deutsch', icon: '🇩🇪' },
  { code: 'fr', name: 'Français', icon: '🇫🇷' },
  { code: 'it', name: 'Italiano', icon: '🇮🇹' },
  { code: 'zh', name: '中文', icon: '🇨🇳' },
  { code: 'ja', name: '日本語', icon: '🇯🇵' },
  { code: 'ko', name: '한국어', icon: '🇰🇷' }
];

const LanguageContext = createContext();

export function LanguageProvider({ children, user }) {
  const [lang, setLang] = useState('en'); // Default to 'en' before checking
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const initializeLanguage = () => {
      // 1. Try to get from user profile
      let userLang = user?.user_metadata?.language;
      
      // 2. Fallback to browser language
      if (!userLang && typeof window !== 'undefined') {
        const browserLang = navigator.language.split('-')[0]; // "pt-BR" -> "pt"
        if (dictionaries[browserLang]) {
          userLang = browserLang;
        }
      }

      // 3. Final Fallback to 'en'
      if (!userLang || !dictionaries[userLang]) {
        userLang = 'en';
      }

      setLang(userLang);
      setIsLoaded(true);
    };

    initializeLanguage();
  }, [user]);

  const changeLanguage = async (newLang) => {
    if (!dictionaries[newLang]) return;
    setLang(newLang);
    
    // Save to user metadata
    if (user) {
      try {
        await supabase.auth.updateUser({
          data: { language: newLang }
        });
      } catch (e) {
        console.error("Error saving language preference", e);
      }
    }
  };

  const getCustomLabel = (currentCasa, level) => {
    if (!currentCasa) return null;
    switch (level) {
      case 'level1': return currentCasa.label_nivel1;
      case 'level2': return currentCasa.label_nivel2;
      case 'level3': return currentCasa.label_nivel3;
      case 'level4': return currentCasa.label_nivel4;
      default: return null;
    }
  };

  const t = (path, currentCasa = null, args = []) => {
    // 1. Check for custom casa labels FIRST if requesting hierarchy names
    if (currentCasa && path.startsWith('hierarchy.')) {
      const level = path.split('.')[1];
      const customLabel = getCustomLabel(currentCasa, level);
      if (customLabel) return customLabel;
    }

    // 2. Fetch from dictionary
    const keys = path.split('.');
    let value = dictionaries[lang];
    for (let key of keys) {
      if (value === undefined) break;
      value = value[key];
    }
    
    // Fallback to English if key missing in current language
    if (value === undefined && lang !== 'en') {
      value = dictionaries['en'];
      for (let key of keys) {
        if (value === undefined) break;
        value = value[key];
      }
    }
    
    if (typeof value === 'string' && args.length > 0) {
      args.forEach((arg, i) => {
        value = value.replace(`{${i}}`, arg);
      });
    }

    return value || path; // Return path if totally not found
  };

  return (
    <LanguageContext.Provider value={{ lang, changeLanguage, t, isLoaded }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
