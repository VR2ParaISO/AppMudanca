'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AuthView from '@/components/AuthView';
import { useDatabase } from '@/hooks/useDatabase';
import { supabase } from '@/lib/supabase';
import ExploreView from '@/components/ExploreView';
import SearchView from '@/components/SearchView';
import VoiceInputOverlay from '@/components/VoiceInputOverlay';
import { IconSearch, IconHierarchy, IconMic, IconPlus } from '@/components/Icons';

export default function Home() {
  const [activeTab, setActiveTab] = useState('explore');
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [appTitleInput, setAppTitleInput] = useState('');
  const [mounted, setMounted] = useState(false);
  
  // Navigation State for Explore View
  const [level, setLevel] = useState(1); 
  const [currentComodo, setCurrentComodo] = useState(null);
  const [currentLocal, setCurrentLocal] = useState(null);

  const { user, loading: authLoading, signOut } = useAuth();
  const db = useDatabase(user);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleVoiceResult = ({ nome, especificacao }) => {
    if (!nome) return;

    if (activeTab === 'search') {
      // If in search mode, just do nothing (search is text-based)
      return;
    }

    if (level === 1) {
      db.addComodo(nome);
    } else if (level === 2 && currentComodo) {
      db.addLocal(currentComodo.id, nome);
    } else if (level === 3 && currentLocal) {
      db.addItem(currentLocal.id, nome, especificacao);
    }
    
    setIsVoiceOpen(false);
  };

  const getVoiceContextLabel = () => {
    if (level === 1) return 'Adicionando novo cômodo';
    if (level === 2 && currentComodo) return `Adicionando local em "${currentComodo.nome}"`;
    if (level === 3 && currentLocal) return `Adicionando item em "${currentLocal.nome}"`;
    return '';
  };

  const handleSaveTitle = async () => {
    if (!appTitleInput.trim()) return;
    const { error } = await supabase.auth.updateUser({
      data: { app_title: appTitleInput.trim() }
    });
    if (!error) {
      setIsUserMenuOpen(false);
      // O hook useAuth atualizará o user automaticamente na maioria das vezes, mas forçamos reload se preciso
      window.location.reload(); 
    } else {
      alert("Erro ao salvar o nome.");
    }
  };

  if (!mounted || authLoading || (user && !db.isLoaded)) {
    return (
      <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card card-static" style={{ textAlign: 'center', padding: '40px' }}>
          <h2>Carregando...</h2>
        </div>
      </main>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  const appTitle = user?.user_metadata?.app_title || 'OrganizaMudança';
  const initial = user?.email ? user.email.charAt(0).toUpperCase() : 'U';

  return (
    <main style={{ paddingTop: '80px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', background: 'var(--white)', borderBottom: 'var(--border)', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, boxShadow: 'var(--shadow-small)' }}>
        <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--blue)' }}>{appTitle}</h3>
        <div 
          onClick={() => {
            setAppTitleInput(appTitle);
            setIsUserMenuOpen(true);
          }} 
          style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--black)', color: 'var(--lime)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', cursor: 'pointer', border: '2px solid var(--black)' }}
        >
          {initial}
        </div>
      </header>
      {activeTab === 'explore' ? (
        <ExploreView 
          comodos={db.comodos}
          locais={db.locais}
          itens={db.itens}
          addComodo={db.addComodo}
          addLocal={db.addLocal}
          addItem={db.addItem}
          deleteItem={db.deleteItem}
          rename={db.rename}
          updateItem={db.updateItem}
          updateLocal={db.updateLocal}
          updateComodo={db.updateComodo}
          level={level}
          setLevel={setLevel}
          currentComodo={currentComodo}
          setCurrentComodo={setCurrentComodo}
          currentLocal={currentLocal}
          setCurrentLocal={setCurrentLocal}
        />
      ) : (
        <SearchView 
          itens={db.itens}
          locais={db.locais}
          comodos={db.comodos}
          onNavigate={(targetLevel, c, l) => {
            if (c) setCurrentComodo(c);
            if (l) setCurrentLocal(l);
            setLevel(targetLevel);
            setActiveTab('explore');
          }}
        />
      )}

      {/* FAB - only in explore mode */}
      {activeTab === 'explore' && (
        <button className="fab" onClick={() => setIsVoiceOpen(true)} aria-label="Adicionar por voz">
          <IconMic />
        </button>
      )}

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <div 
          className={`nav-item ${activeTab === 'explore' ? 'active' : ''}`}
          onClick={() => { setActiveTab('explore'); }}
        >
          <IconHierarchy />
          <span>Explorar</span>
        </div>
        <div 
          className={`nav-item ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          <IconSearch />
          <span>Buscar</span>
        </div>
      </nav>

      <VoiceInputOverlay 
        isOpen={isVoiceOpen} 
        onClose={() => setIsVoiceOpen(false)}
        onResult={handleVoiceResult}
        contextLabel={getVoiceContextLabel()}
        showEspecificacao={level === 3}
      />

      {isUserMenuOpen && (
        <div className="confirm-overlay" onClick={() => setIsUserMenuOpen(false)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'left' }}>
            <h3 style={{ marginBottom: '4px' }}>Menu do Usuário</h3>
            <p style={{ color: 'var(--gray)', fontSize: '0.85rem', marginBottom: '20px' }}>Logado como: {user.email}</p>
            
            <label style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gray)' }}>Nome do Aplicativo</label>
            <input 
              className="input-brutal"
              value={appTitleInput}
              onChange={(e) => setAppTitleInput(e.target.value)}
              placeholder="Ex: Minha Mudança"
              style={{ marginBottom: '16px', marginTop: '4px' }}
            />
            
            <button className="btn-lime" onClick={handleSaveTitle} style={{ width: '100%', marginBottom: '24px' }}>
              Salvar Nome
            </button>

            <hr style={{ border: 'none', borderTop: '2px solid var(--black)', margin: '0 -20px 20px -20px' }} />

            <button onClick={signOut} className="btn-red" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
              Sair da Conta
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
