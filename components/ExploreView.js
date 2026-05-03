'use client';

import { useState } from 'react';
import { IconBack, IconDelete } from './Icons';

export default function ExploreView({ 
  comodos, locais, itens, 
  addComodo, addLocal, addItem, deleteItem,
  level, setLevel,
  currentComodo, setCurrentComodo,
  currentLocal, setCurrentLocal
}) {
  const [inputValue, setInputValue] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null); // { type, id, name }

  const handleBack = () => {
    if (level === 2) setLevel(1);
    if (level === 3) setLevel(2);
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const val = inputValue.trim();

    if (level === 1) {
      addComodo(val);
    } else if (level === 2 && currentComodo) {
      addLocal(currentComodo.id, val);
    } else if (level === 3 && currentLocal) {
      // Parse "item, especificacao"
      let nome = val;
      let especificacao = '';
      if (val.includes(',')) {
        const parts = val.split(',');
        nome = parts[0].trim();
        especificacao = parts.slice(1).join(',').trim();
      }
      addItem(currentLocal.id, nome, especificacao);
    }

    setInputValue('');
  };

  const handleDeleteConfirm = () => {
    if (confirmDelete) {
      deleteItem(confirmDelete.type, confirmDelete.id);
      setConfirmDelete(null);
    }
  };

  const getLocaisCount = (comodoId) => locais.filter(l => l.comodo_id === comodoId).length;
  const getItensCount = (localId) => itens.filter(i => i.local_id === localId).length;

  const placeholders = {
    1: "Nome do cômodo...",
    2: "Nome do local (ex: Armário, Gaveta)...",
    3: "Nome do item (ou \"item, detalhe\")..."
  };

  const emptyMessages = {
    1: { emoji: "🏠", text: "Nenhum cômodo cadastrado. Comece adicionando os cômodos da casa!" },
    2: { emoji: "📦", text: "Nenhum local neste cômodo. Adicione móveis ou espaços!" },
    3: { emoji: "🔍", text: "Nenhum item neste local. Cadastre seus pertences!" }
  };

  const currentList = level === 1 ? comodos : 
    level === 2 ? locais.filter(l => l.comodo_id === currentComodo?.id) :
    itens.filter(i => i.local_id === currentLocal?.id);

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        {level > 1 && (
          <div className="breadcrumb">
            <span style={{ cursor: 'pointer' }} onClick={() => setLevel(1)}>Cômodos</span>
            {level >= 2 && <>&gt; <span style={{ cursor: level === 3 ? 'pointer' : 'default' }} onClick={() => level === 3 && setLevel(2)}>{currentComodo?.nome}</span></>}
            {level === 3 && <>&gt; <span>{currentLocal?.nome}</span></>}
          </div>
        )}
        <div className="flex-between">
          {level > 1 && (
            <button className="back-btn" onClick={handleBack}>
              <IconBack />
            </button>
          )}
          <h1 style={{ flex: 1 }}>
            {level === 1 && "🏠 Cômodos"}
            {level === 2 && currentComodo?.nome}
            {level === 3 && currentLocal?.nome}
          </h1>
        </div>
      </div>

      {/* Add Form */}
      <form onSubmit={handleAdd} style={{ marginBottom: '24px' }}>
        <input 
          className="input-brutal"
          placeholder={placeholders[level]}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          id="main-input"
        />
        <button type="submit" className="btn-lime" style={{ width: '100%', marginTop: '10px' }}>
          + Adicionar
        </button>
      </form>

      {/* List */}
      <div className="list">
        {currentList.length === 0 && (
          <div className="empty-state">
            <span className="emoji">{emptyMessages[level].emoji}</span>
            <p>{emptyMessages[level].text}</p>
          </div>
        )}

        {level === 1 && comodos.map(c => (
          <div key={c.id} className="card flex-between" onClick={() => { setCurrentComodo(c); setLevel(2); }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: '1.15rem', fontWeight: 600, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.nome}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-cyan">{getLocaisCount(c.id)}</span>
              <button 
                className="delete-btn"
                onClick={(e) => { e.stopPropagation(); setConfirmDelete({ type: 'comodos', id: c.id, name: c.nome }); }}
              >
                <IconDelete />
              </button>
            </div>
          </div>
        ))}

        {level === 2 && locais.filter(l => l.comodo_id === currentComodo?.id).map(l => (
          <div key={l.id} className="card flex-between" onClick={() => { setCurrentLocal(l); setLevel(3); }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: '1.15rem', fontWeight: 600, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.nome}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-yellow">{getItensCount(l.id)}</span>
              <button 
                className="delete-btn"
                onClick={(e) => { e.stopPropagation(); setConfirmDelete({ type: 'locais', id: l.id, name: l.nome }); }}
              >
                <IconDelete />
              </button>
            </div>
          </div>
        ))}

        {level === 3 && itens.filter(i => i.local_id === currentLocal?.id).map(i => (
          <div key={i.id} className="card card-static flex-between">
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: '1.15rem', fontWeight: 600, display: 'block' }}>{i.nome}</span>
              {i.especificacao && (
                <div className="spec-tag">
                  <small>📍</small>{i.especificacao}
                </div>
              )}
            </div>
            <button 
              className="delete-btn"
              onClick={(e) => { e.stopPropagation(); setConfirmDelete({ type: 'itens', id: i.id, name: i.nome }); }}
            >
              <IconDelete />
            </button>
          </div>
        ))}
      </div>

      {/* Confirm Delete Dialog */}
      {confirmDelete && (
        <div className="confirm-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Excluir "{confirmDelete.name}"?</h3>
            <p>
              {confirmDelete.type === 'comodos' && 'Todos os locais e itens deste cômodo serão excluídos.'}
              {confirmDelete.type === 'locais' && 'Todos os itens deste local serão excluídos.'}
              {confirmDelete.type === 'itens' && 'Este item será removido permanentemente.'}
            </p>
            <div className="confirm-actions">
              <button className="btn-cyan" onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className="btn-red" onClick={handleDeleteConfirm}>Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
