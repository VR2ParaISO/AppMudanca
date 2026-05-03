'use client';

import { useState, useEffect } from 'react';
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

  const db = useDatabase();

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

  if (!mounted || !db.isLoaded) {
    return (
      <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card card-static" style={{ textAlign: 'center', padding: '40px' }}>
          <h2>Carregando...</h2>
        </div>
      </main>
    );
  }

  return (
    <main>
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
