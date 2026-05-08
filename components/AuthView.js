'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AuthView() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const { t } = useLanguage();

  const translateError = (message) => {
    // Check exact matches first, then partial matches
    const dict = {
      "Invalid login credentials": t('authErrors.Invalid login credentials'),
      "User already registered": t('authErrors.User already registered'),
      "Password should be at least 6 characters": t('authErrors.Password should be at least 6 characters'),
    };
    for (const key of Object.keys(dict)) {
      if (message.includes(key)) return dict[key];
    }
    return t('authErrors.default');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      } else {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        setSuccessMsg(t('auth.success_register'));
      }
    } catch (err) {
      setError(translateError(err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '30px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '4px' }}>INDEXIA</h2>
        <p style={{ textAlign: 'center', color: 'var(--gray)', marginBottom: '24px', fontSize: '0.9rem' }}>
          {isLogin ? t('auth.login') : t('auth.register')}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>{t('auth.email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="search-input"
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>{t('auth.password')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="search-input"
              style={{ width: '100%' }}
            />
          </div>

          {error && <p style={{ color: 'var(--danger-color)', fontSize: '14px', margin: 0 }}>{error}</p>}
          {successMsg && <p style={{ color: 'var(--success-color)', fontSize: '14px', margin: 0 }}>{successMsg}</p>}

          <button type="submit" disabled={loading} style={{ padding: '12px', background: 'var(--blue)', color: 'white', border: 'none', borderRadius: 'var(--radius)', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
            {loading ? t('auth.wait') : (isLogin ? t('auth.enter') : t('auth.register_btn'))}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            style={{ background: 'none', border: 'none', color: 'var(--blue)', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isLogin ? t('auth.no_account') : t('auth.has_account')}
          </button>
        </div>
      </div>
    </div>
  );
}
