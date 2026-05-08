'use client';

import { useAuth } from '@/hooks/useAuth';
import { LanguageProvider } from '@/contexts/LanguageContext';

export function Providers({ children }) {
  const { user } = useAuth();
  return (
    <LanguageProvider user={user}>
      {children}
    </LanguageProvider>
  );
}
