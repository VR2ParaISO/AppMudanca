'use client';

import { useState } from 'react';
import { IconBack, IconDelete, IconEdit, IconMic } from './Icons';

export default function ExploreView({ 
  comodos, locais, itens, 
  addComodo, addLocal, addItem, deleteItem, rename, updateItem,
  level, setLevel,
  currentComodo, setCurrentComodo,
  currentLocal, setCurrentLocal
}) {
  const [inputValue, setInputValue] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [pendingItem, setPendingItem] = useState(null); // { nome } - awaiting especificacao
  const [especInput, setEspecInput] = useState('');
  const [editingItem, setEditingItem] = useState(null); // { type, id, nome, especificacao }
  const [editNomeInput, setEditNomeInput] = useState('');
  const [editEspecInput, setEditEspecInput] = useState('');
  const [isListeningFor, setIsListeningFor] = useState(null); // 'add' ou 'edit'

  const startSpecificListening = (target) => {
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

    rec.onstart = () => setIsListeningFor(target);
    rec.onend = () => setIsListeningFor(null);
    rec.onerror = () => setIsListeningFor(null);
    rec.onresult = (event) => {
      const text = event.results[0][0].transcript;
      if (target === 'add') {
        setEspecInput(text);
      } else if (target === 'edit') {
        setEditEspecInput(text);
      }
    };

    try { rec.start(); } catch (e) {}
  };

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
      setInputValue('');
    } else if (level === 2 && currentComodo) {
      addLocal(currentComodo.id, val);
      setInputValue('');
    } else if (level === 3 && currentLocal) {
      // Show especificacao dialog instead of saving directly
      setPendingItem({ nome: val });
      setEspecInput('');
      setInputValue('');
    }
  };

  const handleSaveItem = () => {
    if (pendingItem && currentLocal) {
      addItem(currentLocal.id, pendingItem.nome, especInput.trim());
      setPendingItem(null);
      setEspecInput('');
    }
  };

  const handleSkipEspec = () => {
    if (pendingItem && currentLocal) {
      addItem(currentLocal.id, pendingItem.nome, '');
      setPendingItem(null);
      setEspecInput('');
    }
  };

  const handleDeleteConfirm = () => {
    if (confirmDelete) {
      deleteItem(confirmDelete.type, confirmDelete.id);
      setConfirmDelete(null);
    }
  };

  const handleEditClick = (type, item) => {
    setEditingItem({ type, id: item.id });
    setEditNomeInput(item.nome);
    setEditEspecInput(item.especificacao || '');
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;
    if (!editNomeInput.trim()) return;

    if (editingItem.type === 'itens') {
      updateItem(editingItem.id, editNomeInput.trim(), editEspecInput.trim());
    } else {
      rename(editingItem.type, editingItem.id, editNomeInput.trim());
    }
    setEditingItem(null);
  };

  const getLocaisCount = (comodoId) => locais.filter(l => l.comodo_id === comodoId).length;
  const getItensCount = (localId) => itens.filter(i => i.local_id === localId).length;

  const placeholders = {
    1: "Nome do cômodo...",
    2: "Nome do local (ex: Armário, Gaveta)...",
    3: "Nome do item..."
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
                className="edit-btn"
                onClick={(e) => { e.stopPropagation(); handleEditClick('comodos', c); }}
              >
                <IconEdit />
              </button>
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
                className="edit-btn"
                onClick={(e) => { e.stopPropagation(); handleEditClick('locais', l); }}
              >
                <IconEdit />
              </button>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button 
                className="edit-btn"
                onClick={(e) => { e.stopPropagation(); handleEditClick('itens', i); }}
              >
                <IconEdit />
              </button>
              <button 
                className="delete-btn"
                onClick={(e) => { e.stopPropagation(); setConfirmDelete({ type: 'itens', id: i.id, name: i.nome }); }}
              >
                <IconDelete />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Especificação Dialog - appears after adding an item name */}
      {pendingItem && (
        <div className="confirm-overlay" onClick={handleSkipEspec}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'left' }}>
            <h3 style={{ marginBottom: '4px' }}>"{pendingItem.nome}"</h3>
            <p style={{ marginBottom: '16px' }}>Onde exatamente está este item?</p>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input 
                className="input-brutal"
                placeholder="Ex: segunda gaveta..."
                value={especInput}
                onChange={(e) => setEspecInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSaveItem(); }}}
                autoFocus
                style={{ flex: 1 }}
              />
              <button 
                type="button"
                className="edit-btn" 
                style={{ backgroundColor: isListeningFor === 'add' ? 'var(--blue)' : 'var(--cyan)' }}
                onClick={() => startSpecificListening('add')}
              >
                <IconMic />
              </button>
            </div>
            <div className="confirm-actions">
              <button className="btn-cyan" onClick={handleSkipEspec}>Pular</button>
              <button className="btn-lime" onClick={handleSaveItem}>Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      {editingItem && (
        <div className="confirm-overlay" onClick={() => setEditingItem(null)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'left' }}>
            <h3 style={{ marginBottom: '16px' }}>Editar {editingItem.type === 'itens' ? 'Item' : editingItem.type === 'locais' ? 'Local' : 'Cômodo'}</h3>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gray)' }}>Nome</label>
            <input 
              className="input-brutal"
              value={editNomeInput}
              onChange={(e) => setEditNomeInput(e.target.value)}
              style={{ marginBottom: '16px', marginTop: '4px' }}
            />
            {editingItem.type === 'itens' && (
              <>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gray)' }}>Especificação</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', marginTop: '4px' }}>
                  <input 
                    className="input-brutal"
                    value={editEspecInput}
                    onChange={(e) => setEditEspecInput(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button 
                    type="button"
                    className="edit-btn" 
                    style={{ backgroundColor: isListeningFor === 'edit' ? 'var(--blue)' : 'var(--cyan)' }}
                    onClick={() => startSpecificListening('edit')}
                  >
                    <IconMic />
                  </button>
                </div>
              </>
            )}
            <div className="confirm-actions">
              <button className="btn-cyan" onClick={() => setEditingItem(null)}>Cancelar</button>
              <button className="btn-lime" onClick={handleSaveEdit}>Salvar</button>
            </div>
          </div>
        </div>
      )}

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
