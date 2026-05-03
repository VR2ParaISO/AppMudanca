'use client';

import { useState } from 'react';
import { IconMic } from './Icons';

export default function SearchView({ itens, locais, comodos }) {
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

  const results = query.trim() 
    ? itens.filter(i => 
        i.nome.toLowerCase().includes(query.toLowerCase()) || 
        i.especificacao?.toLowerCase().includes(query.toLowerCase())
      ).map(item => {
        const local = locais.find(l => l.id === item.local_id);
        const comodo = comodos.find(c => c.id === local?.comodo_id);
        return { ...item, localName: local?.nome || '—', comodoName: comodo?.nome || '—' };
      })
    : [];

  const totalItens = itens.length;

  return (
    <div>
      <div className="page-header">
        <h1>🔍 Buscar Itens</h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--gray)', fontWeight: 500, marginTop: '4px' }}>
          {totalItens} {totalItens === 1 ? 'item cadastrado' : 'itens cadastrados'}
        </p>
      </div>
      
      <div style={{ display: 'flex', gap: '8px' }}>
        <input 
          className="input-brutal"
          placeholder="O que você está procurando?"
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

        {results.map(res => (
          <div key={res.id} className="card card-static search-result">
            <h2 style={{ fontSize: '1.3rem', marginBottom: '4px' }}>{res.nome}</h2>
            {res.especificacao && (
              <div className="spec-tag">
                <small>📍</small>{res.especificacao}
              </div>
            )}
            <div className="hierarchy">
              {res.comodoName} › {res.localName}
            </div>
          </div>
        ))}

        {!query && (
          <div className="empty-state">
            <span className="emoji">📦</span>
            <p>Digite o nome de um item para encontrá-lo instantaneamente.</p>
          </div>
        )}
      </div>
    </div>
  );
}
