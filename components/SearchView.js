'use client';

import { useState } from 'react';
import { IconMic } from './Icons';

export default function SearchView({ itens, locais, comodos }) {
  const [query, setQuery] = useState('');

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
      
      <input 
        className="input-brutal"
        placeholder="O que você está procurando?"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        id="search-input"
      />

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
