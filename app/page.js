'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AuthView from '@/components/AuthView';
import { useDatabase } from '@/hooks/useDatabase';
import ExploreView from '@/components/ExploreView';
import SearchView from '@/components/SearchView';
import VoiceInputOverlay from '@/components/VoiceInputOverlay';
import { IconSearch, IconHierarchy, IconMic, IconPlus } from '@/components/Icons';

export default function Home() {
  const [activeTab, setActiveTab] = useState('explore');
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
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

  return (
    <main>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', background: 'var(--card-bg)', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, zIndex: 10 }}>
        <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--primary-color)' }}>OrganizaMudança</h3>
        <button onClick={signOut} style={{ background: 'transparent', border: '1px solid var(--border-color)', padding: '5px 12px', borderRadius: 'var(--radius)', cursor: 'pointer', color: 'var(--text-color)', fontSize: '0.9rem' }}>Sair</button>
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
    </main>
  );
}
