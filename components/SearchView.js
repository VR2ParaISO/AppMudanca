'use client';

import { useState } from 'react';
import { IconMic } from './Icons';

export default function SearchView({ itens, locais, comodos, onNavigate }) {
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);

  const startListening = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Reconhecimento de voz não suportado neste navegador.");
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = 'pt-BR';
    rec.continuous = false;
    rec.interimResults = false;

    rec.onstart = () => setIsListening(true);
    rec.onend = () => setIsListening(false);
    rec.onerror = () => setIsListening(false);
    rec.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setQuery(text);
    };

    try { rec.start(); } catch (e) {}
  };

  let results = [];
  if (query.trim()) {
    const q = query.toLowerCase();
    
    const matchedComodos = comodos.filter(c => c.nome.toLowerCase().includes(q))
      .map(c => ({ ...c, searchType: 'comodo', title: c.nome, hierarchy: 'Cômodo' }));
      
    const matchedLocais = locais.filter(l => l.nome.toLowerCase().includes(q))
      .map(l => {
        const comodo = comodos.find(c => c.id === l.comodo_id);
        return { ...l, searchType: 'local', title: l.nome, hierarchy: `${comodo?.nome || '—'}`, comodoObj: comodo };
      });
      
    const matchedItens = itens.filter(i => 
        i.nome.toLowerCase().includes(q) || 
        i.especificacao?.toLowerCase().includes(q)
      ).map(item => {
        const local = locais.find(l => l.id === item.local_id);
        const comodo = comodos.find(c => c.id === local?.comodo_id);
        return { ...item, searchType: 'item', title: item.nome, hierarchy: `${comodo?.nome || '—'} › ${local?.nome || '—'}`, localObj: local, comodoObj: comodo };
      });
      
    results = [...matchedComodos, ...matchedLocais, ...matchedItens];
  }

  const totalElementos = itens.length + locais.length + comodos.length;

  return (
    <div>
      <div className="page-header">
        <h1>🔍 Buscar Tudo</h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--gray)', fontWeight: 500, marginTop: '4px' }}>
          {totalElementos} {totalElementos === 1 ? 'elemento cadastrado' : 'elementos cadastrados'}
        </p>
      </div>
      
      <div style={{ display: 'flex', gap: '8px' }}>
        <input 
          className="input-brutal"
          placeholder="Cômodos, locais ou itens..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          id="search-input"
          style={{ flex: 1 }}
        />
        <button 
          type="button"
          className="edit-btn" 
          style={{ backgroundColor: isListening ? 'var(--blue)' : 'var(--cyan)' }}
          onClick={startListening}
        >
          <IconMic />
        </button>
      </div>

      <div style={{ marginTop: '24px' }}>
        {query && results.length === 0 && (
          <div className="empty-state">
            <span className="emoji">😕</span>
            <p>Nenhum resultado para "{query}"</p>
          </div>
        )}

        {results.map(res => {
          const handleResultClick = () => {
            if (res.searchType === 'comodo') {
              onNavigate(2, res, null);
            } else if (res.searchType === 'local') {
              onNavigate(3, res.comodoObj, res);
            } else if (res.searchType === 'item') {
              onNavigate(3, res.comodoObj, res.localObj);
            }
          };

          return (
            <div 
              key={`${res.searchType}-${res.id}`} 
              className="card card-static search-result"
              onClick={handleResultClick}
              style={{ cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {res.foto_url && (
                    <div style={{ width: '40px', height: '40px', flexShrink: 0, border: '2px solid var(--black)', overflow: 'hidden', borderRadius: res.searchType === 'item' ? '0' : 'var(--radius)' }}>
                      <img src={res.foto_url} alt={res.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onClick={(e) => { e.stopPropagation(); window.open(res.foto_url, '_blank'); }} />
                    </div>
                  )}
                  <h2 style={{ fontSize: '1.3rem', margin: 0 }}>{res.title}</h2>
                </div>
                <span className={`badge ${res.searchType === 'comodo' ? 'badge-cyan' : res.searchType === 'local' ? 'badge-yellow' : ''}`} style={{ fontSize: '0.7rem' }}>
                  {res.searchType === 'comodo' ? 'Cômodo' : res.searchType === 'local' ? 'Local' : 'Item'}
                </span>
              </div>
              {res.searchType === 'item' && res.especificacao && (
                <div className="spec-tag">
                  <small>📍</small>{res.especificacao}
                </div>
              )}
              <div className="hierarchy">
                {res.hierarchy}
              </div>
            </div>
          );
        })}

        {!query && (
          <div className="empty-state">
            <span className="emoji">📦</span>
            <p>Digite o nome do que você procura para encontrar instantaneamente.</p>
          </div>
        )}
      </div>
    </div>
  );
}
