'use client';

import { useState, useRef } from 'react';
import { IconBack, IconDelete, IconEdit, IconMic, IconCamera } from './Icons';
import { compressImage } from '../utils/image';

export default function ExploreView({ 
  comodos, locais, itens, 
  addComodo, addLocal, addItem, deleteItem, rename, updateItem, updateLocal, updateComodo,
  level, setLevel,
  currentComodo, setCurrentComodo,
  currentLocal, setCurrentLocal
}) {
  const [inputValue, setInputValue] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [pendingItem, setPendingItem] = useState(null); // { nome }
  const [especInput, setEspecInput] = useState('');
  const [editingItem, setEditingItem] = useState(null); // { type, id, nome, especificacao, parent_local_id, comodo_id }
  const [editNomeInput, setEditNomeInput] = useState('');
  const [editEspecInput, setEditEspecInput] = useState('');
  const [editParentIdInput, setEditParentIdInput] = useState('');
  const [editComodoIdInput, setEditComodoIdInput] = useState('');
  const [isListeningFor, setIsListeningFor] = useState(null); // 'add' ou 'edit'
  
  // Foto states
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoBlob, setFotoBlob] = useState(null);
  const [zoomedFoto, setZoomedFoto] = useState(null);
  const [removeFoto, setRemoveFoto] = useState(false);
  
  // Ref para inputs de arquivo
  const fileInputRefAdd = useRef(null);
  const fileInputRefEdit = useRef(null);

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

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const blob = await compressImage(file, 400, 0.7);
        setFotoBlob(blob);
        setFotoPreview(URL.createObjectURL(blob));
        setRemoveFoto(false);
      } catch (err) {
        console.error('Erro ao processar imagem', err);
        alert('Erro ao processar imagem');
      }
    }
  };

  const resetFoto = () => {
    setFotoPreview(null);
    setFotoBlob(null);
    setRemoveFoto(false);
  };

  const handleBack = () => {
    if (level === 2) {
      setLevel(1);
    } else if (level === 3) {
      if (currentLocal && currentLocal.parent_local_id) {
        const parent = locais.find(l => l.id === currentLocal.parent_local_id);
        setCurrentLocal(parent || null);
      } else {
        setLevel(2);
        setCurrentLocal(null);
      }
    }
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
      setPendingItem({ nome: val });
      setEspecInput('');
      setInputValue('');
      resetFoto();
    }
  };

  const handleSaveItem = () => {
    if (pendingItem && currentLocal) {
      addItem(currentLocal.id, pendingItem.nome, especInput.trim(), fotoBlob);
      setPendingItem(null);
      setEspecInput('');
      resetFoto();
    }
  };

  const handleSkipEspec = () => {
    if (pendingItem && currentLocal) {
      addItem(currentLocal.id, pendingItem.nome, '', fotoBlob);
      setPendingItem(null);
      setEspecInput('');
      resetFoto();
    }
  };

  const handleDeleteConfirm = () => {
    if (confirmDelete) {
      deleteItem(confirmDelete.type, confirmDelete.id);
      setConfirmDelete(null);
      if (confirmDelete.type === 'locais' && currentLocal?.id === confirmDelete.id) {
        handleBack();
      }
    }
  };

  const handleEditClick = (type, item) => {
    setEditingItem({ type, id: item.id, comodo_id: item.comodo_id });
    setEditNomeInput(item.nome);
    setEditEspecInput(item.especificacao || '');
    setEditParentIdInput(item.parent_local_id || '');
    setEditComodoIdInput(item.comodo_id || '');
    
    // Todas as entidades agora suportam foto
    setFotoPreview(item.foto_url || null);
    setFotoBlob(null);
    setRemoveFoto(false);
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;
    if (!editNomeInput.trim()) return;

    if (editingItem.type === 'itens') {
      updateItem(editingItem.id, editNomeInput.trim(), editEspecInput.trim(), fotoBlob, removeFoto);
    } else if (editingItem.type === 'locais') {
      updateLocal(editingItem.id, editNomeInput.trim(), editParentIdInput || null, editComodoIdInput, fotoBlob, removeFoto);
    } else if (editingItem.type === 'comodos') {
      updateComodo(editingItem.id, editNomeInput.trim(), fotoBlob, removeFoto);
    } else {
      rename(editingItem.type, editingItem.id, editNomeInput.trim());
    }
    setEditingItem(null);
    resetFoto();
  };

  const getLocaisCount = (comodoId) => locais.filter(l => l.comodo_id === comodoId && !l.parent_local_id).length;
  const getItensCount = (localId) => {
    const directItens = itens.filter(i => i.local_id === localId).length;
    const directSubLocais = locais.filter(l => l.parent_local_id === localId).length;
    return directItens + directSubLocais;
  };

  const placeholders = {
    1: "Nome do cômodo...",
    2: "Nome do local (ex: Armário, Gaveta)...",
    3: "Nome do item..."
  };

  const emptyMessages = {
    1: { emoji: "🏠", text: "Nenhum cômodo cadastrado. Comece adicionando os cômodos da casa!" },
    2: { emoji: "📦", text: "Nenhum local neste cômodo. Adicione móveis ou espaços!" },
    3: { emoji: "🔍", text: "Nenhum item ou sub-local aqui. Cadastre seus pertences!" }
  };

  const buildLocalChain = () => {
    const chain = [];
    let curr = currentLocal;
    while (curr) {
      chain.unshift(curr);
      curr = locais.find(l => l.id === curr.parent_local_id);
    }
    return chain;
  };

  const localChain = currentLocal ? buildLocalChain() : [];

  const currentComodos = comodos;
  const currentLocaisTop = locais.filter(l => l.comodo_id === currentComodo?.id && !l.parent_local_id);
  const currentLocaisSub = locais.filter(l => l.parent_local_id === currentLocal?.id);
  const currentItens = itens.filter(i => i.local_id === currentLocal?.id);

  const isEmpty = level === 1 ? currentComodos.length === 0 :
                  level === 2 ? currentLocaisTop.length === 0 :
                  (currentLocaisSub.length + currentItens.length) === 0;

  const getValidParents = (localId) => {
    if (!editComodoIdInput) return [];
    return locais.filter(l => l.comodo_id === editComodoIdInput && l.id !== localId);
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        {level > 1 && (
          <div className="breadcrumb" style={{ flexWrap: 'wrap' }}>
            <span style={{ cursor: 'pointer' }} onClick={() => { setLevel(1); setCurrentComodo(null); setCurrentLocal(null); }}>Cômodos</span>
            {level >= 2 && (
               <>
                 &gt; <span style={{ cursor: 'pointer' }} onClick={() => { setLevel(2); setCurrentLocal(null); }}>{currentComodo?.nome}</span>
               </>
            )}
            {level === 3 && localChain.map((loc, idx) => (
               <span key={loc.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                 &gt; <span 
                        style={{ cursor: idx < localChain.length - 1 ? 'pointer' : 'default', color: idx === localChain.length - 1 ? 'var(--black)' : 'var(--gray)' }} 
                        onClick={() => {
                          if (idx < localChain.length - 1) {
                            setCurrentLocal(loc);
                          }
                        }}
                      >{loc.nome}</span>
               </span>
            ))}
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
        {isEmpty && (
          <div className="empty-state">
            <span className="emoji">{emptyMessages[level].emoji}</span>
            <p>{emptyMessages[level].text}</p>
          </div>
        )}

        {/* Nível 1: Cômodos */}
        {level === 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 className="title-brutal" style={{ margin: 0 }}>Cômodos <span style={{ fontSize: '1.2rem', color: 'var(--gray)' }}>({currentComodos.length})</span></h2>
          </div>
        )}
        <div className="list-container">
          {level === 1 && currentComodos.map(c => (
            <div key={c.id} className="card" onClick={() => { setCurrentComodo(c); setLevel(2); }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                {c.foto_url && (
                  <div style={{ width: '48px', height: '48px', flexShrink: 0, border: '2px solid var(--black)', overflow: 'hidden', borderRadius: 'var(--radius)' }}>
                    <img src={c.foto_url} alt={c.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onClick={(e) => { e.stopPropagation(); setZoomedFoto({ url: c.foto_url, title: c.nome }); }} />
                  </div>
                )}
                <h3 style={{ margin: 0, flex: 1, wordBreak: 'break-word', fontSize: '1.2rem', alignSelf: 'center' }}>{c.nome}</h3>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid var(--black)', paddingTop: '12px', marginTop: '4px' }}>
                <span className="badge badge-cyan" style={{ fontSize: '0.8rem' }}>{getLocaisCount(c.id)} locais</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="edit-btn" onClick={(e) => { e.stopPropagation(); handleEditClick('comodos', c); }}><IconEdit /></button>
                  <button className="delete-btn" onClick={(e) => { e.stopPropagation(); setConfirmDelete({ type: 'comodos', id: c.id, name: c.nome }); }}><IconDelete /></button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Nível 2: Locais do Cômodo */}
        {level === 2 && currentComodo && (
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
            <button className="btn-ghost" onClick={handleBack} style={{ marginRight: '10px', padding: '5px 10px' }}>←</button>
            <h2 className="title-brutal" style={{ margin: 0, flex: 1, wordBreak: 'break-word', lineHeight: 1.2 }}>{currentComodo.nome} <span style={{ fontSize: '1.2rem', color: 'var(--gray)' }}>({currentLocaisTop.length})</span></h2>
          </div>
        )}
        <div className="list-container">
          {level === 2 && currentLocaisTop.map(l => (
            <div key={l.id} className="card" onClick={() => { setCurrentLocal(l); setLevel(3); }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                {l.foto_url && (
                  <div style={{ width: '48px', height: '48px', flexShrink: 0, border: '2px solid var(--black)', overflow: 'hidden', borderRadius: 'var(--radius)' }}>
                    <img src={l.foto_url} alt={l.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onClick={(e) => { e.stopPropagation(); setZoomedFoto({ url: l.foto_url, title: l.nome }); }} />
                  </div>
                )}
                <h3 style={{ margin: 0, flex: 1, wordBreak: 'break-word', fontSize: '1.2rem', alignSelf: 'center' }}>{!l.foto_url && <span style={{ marginRight: '8px' }}>📦</span>}{l.nome}</h3>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid var(--black)', paddingTop: '12px', marginTop: '4px' }}>
                <span className="badge badge-yellow" style={{ fontSize: '0.8rem' }}>{getItensCount(l.id)} itens</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="edit-btn" onClick={(e) => { e.stopPropagation(); handleEditClick('locais', l); }}><IconEdit /></button>
                  <button className="delete-btn" onClick={(e) => { e.stopPropagation(); setConfirmDelete({ type: 'locais', id: l.id, name: l.nome }); }}><IconDelete /></button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Nível 3: Sub-locais e Itens */}
        {level === 3 && currentLocal && (
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
            <button className="btn-ghost" onClick={handleBack} style={{ marginRight: '10px', padding: '5px 10px' }}>←</button>
            <h2 className="title-brutal" style={{ margin: 0, flex: 1, wordBreak: 'break-word', lineHeight: 1.2 }}>{currentLocal.nome} <span style={{ fontSize: '1.2rem', color: 'var(--gray)' }}>({currentLocaisSub.length} locais | {currentItens.length} itens)</span></h2>
          </div>
        )}
        
        <div className="list-container">
          {level === 3 && (
            <>
              {/* Lista de Sub-locais primeiro */}
              {currentLocaisSub.map(l => (
                <div key={l.id} className="card" onClick={() => setCurrentLocal(l)} style={{ borderLeft: '10px solid var(--lime)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    {l.foto_url && (
                      <div style={{ width: '48px', height: '48px', flexShrink: 0, border: '2px solid var(--black)', overflow: 'hidden', borderRadius: 'var(--radius)' }}>
                        <img src={l.foto_url} alt={l.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onClick={(e) => { e.stopPropagation(); setZoomedFoto({ url: l.foto_url, title: l.nome }); }} />
                      </div>
                    )}
                    <h3 style={{ margin: 0, flex: 1, wordBreak: 'break-word', fontSize: '1.2rem', alignSelf: 'center' }}>
                      <span style={{ fontSize: '1.2rem', marginRight: '6px' }}>📦</span>{l.nome}
                    </h3>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid var(--black)', paddingTop: '12px', marginTop: '4px' }}>
                    <span className="badge badge-yellow" style={{ fontSize: '0.8rem' }}>{getItensCount(l.id)} itens</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="edit-btn" onClick={(e) => { e.stopPropagation(); handleEditClick('locais', l); }}><IconEdit /></button>
                      <button className="delete-btn" onClick={(e) => { e.stopPropagation(); setConfirmDelete({ type: 'locais', id: l.id, name: l.nome }); }}><IconDelete /></button>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Lista de Itens */}
              {currentItens.map(i => (
                <div key={i.id} className="card card-static" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    {i.foto_url && (
                      <div style={{ width: '48px', height: '48px', flexShrink: 0, border: '2px solid var(--black)', overflow: 'hidden' }}>
                        <img src={i.foto_url} alt={i.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onClick={(e) => { e.stopPropagation(); setZoomedFoto({ url: i.foto_url, title: i.nome }); }} />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0, alignSelf: 'center' }}>
                      <h3 style={{ whiteSpace: 'normal', wordBreak: 'break-word', margin: 0, fontSize: '1.2rem' }}>{i.nome}</h3>
                      {i.especificacao && <p style={{ fontSize: '0.85rem', color: 'var(--gray)', margin: '4px 0 0 0', wordBreak: 'break-word' }}>{i.especificacao}</p>}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '2px solid var(--black)', paddingTop: '12px', marginTop: '4px', gap: '8px' }}>
                    <button className="edit-btn" onClick={(e) => { e.stopPropagation(); handleEditClick('itens', i); }}><IconEdit /></button>
                    <button className="delete-btn" onClick={(e) => { e.stopPropagation(); setConfirmDelete({ type: 'itens', id: i.id, name: i.nome }); }}><IconDelete /></button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Especificação Dialog (Pending Item) */}
      {pendingItem && (
        <div className="confirm-overlay" onClick={handleSkipEspec}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'left' }}>
            <h3 style={{ marginBottom: '4px' }}>"{pendingItem.nome}"</h3>
            <p style={{ marginBottom: '16px' }}>Onde exatamente está este item e qual a foto dele?</p>
            
            {fotoPreview && (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                <img src={fotoPreview} alt="Preview" style={{ width: '120px', height: '120px', objectFit: 'cover', border: '3px solid var(--black)', borderRadius: '4px' }} />
              </div>
            )}

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

            <div style={{ marginBottom: '20px' }}>
              <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                id="camera-input-add" 
                style={{ display: 'none' }} 
                onChange={handleFileChange}
                ref={fileInputRefAdd}
              />
              <button 
                type="button" 
                className="btn-yellow" 
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                onClick={() => fileInputRefAdd.current?.click()}
              >
                <IconCamera /> {fotoPreview ? "Trocar Foto" : "Tirar Foto"}
              </button>
            </div>

            <div className="confirm-actions">
              <button className="btn-cyan" onClick={handleSkipEspec}>Pular/Cancelar</button>
              <button className="btn-lime" onClick={handleSaveItem}>Salvar Item</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Dialog (Comodos, Locais, Itens) */}
      {editingItem && (
        <div className="confirm-overlay" onClick={() => { setEditingItem(null); resetFoto(); }}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'left' }}>
            <h3 style={{ marginBottom: '16px' }}>Editar {editingItem.type === 'itens' ? 'Item' : editingItem.type === 'locais' ? 'Local' : 'Cômodo'}</h3>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gray)' }}>Nome</label>
            <input 
              className="input-brutal"
              value={editNomeInput}
              onChange={(e) => setEditNomeInput(e.target.value)}
              style={{ marginBottom: '16px', marginTop: '4px' }}
            />

            {editingItem.type === 'locais' && (
              <>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gray)' }}>Cômodo Atual:</label>
                <select 
                  className="input-brutal"
                  value={editComodoIdInput}
                  onChange={(e) => {
                    setEditComodoIdInput(e.target.value);
                    if (e.target.value !== editingItem.comodo_id) {
                      setEditParentIdInput(''); // reseta o parent se mudar de comodo
                    }
                  }}
                  style={{ marginBottom: '16px', marginTop: '4px', display: 'block', backgroundColor: 'var(--white)', cursor: 'pointer' }}
                >
                  {comodos.map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>

                <label style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gray)' }}>Mover para dentro de:</label>
                <select 
                  className="input-brutal"
                  value={editParentIdInput}
                  onChange={(e) => setEditParentIdInput(e.target.value)}
                  style={{ marginBottom: '16px', marginTop: '4px', display: 'block', backgroundColor: 'var(--white)', cursor: 'pointer' }}
                >
                  <option value="">[Nenhum - Direto no cômodo]</option>
                  {getValidParents(editingItem.id).map(l => (
                    <option key={l.id} value={l.id}>{l.nome}</option>
                  ))}
                </select>
              </>
            )}

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
            
            {/* Secao de Foto para todas as entidades */}
            <label style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gray)', display: 'block', marginTop: '8px' }}>Foto</label>
            
            {fotoPreview && (
              <div style={{ display: 'flex', justifyContent: 'center', margin: '10px 0' }}>
                <img src={fotoPreview} alt="Preview" style={{ width: '100px', height: '100px', objectFit: 'cover', border: '2px solid var(--black)', borderRadius: 'var(--radius)' }} />
              </div>
            )}

            <div style={{ marginBottom: '16px', marginTop: '8px', display: 'flex', gap: '8px' }}>
              <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                id="camera-input-edit" 
                style={{ display: 'none' }} 
                onChange={handleFileChange}
                ref={fileInputRefEdit}
              />
              <button 
                type="button" 
                className="btn-yellow" 
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                onClick={() => fileInputRefEdit.current?.click()}
              >
                <IconCamera /> {fotoPreview ? "Substituir Foto" : "Adicionar Foto"}
              </button>
              {fotoPreview && (
                <button 
                  type="button" 
                  className="btn-red" 
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '0 16px' }}
                  onClick={() => {
                    setFotoPreview(null);
                    setFotoBlob(null);
                    setRemoveFoto(true);
                  }}
                >
                  <IconDelete /> Apagar Foto
                </button>
              )}
            </div>
            
            <div className="confirm-actions">
              <button className="btn-cyan" onClick={() => { setEditingItem(null); resetFoto(); }}>Cancelar</button>
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
              {confirmDelete.type === 'locais' && 'Todos os sub-locais e itens deste local serão excluídos.'}
              {confirmDelete.type === 'itens' && 'Este item e sua foto (se houver) serão removidos permanentemente.'}
            </p>
            <div className="confirm-actions">
              <button className="btn-cyan" onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className="btn-red" onClick={handleDeleteConfirm}>Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* Zoom Modal */}
      {zoomedFoto && (
        <div className="confirm-overlay" onClick={() => setZoomedFoto(null)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center', padding: '16px' }}>
            <img src={zoomedFoto.url} alt={zoomedFoto.title} style={{ width: '100%', maxHeight: '60vh', objectFit: 'contain', borderRadius: '4px', marginBottom: '16px', border: '3px solid var(--black)' }} />
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', wordBreak: 'break-word' }}>{zoomedFoto.title}</h3>
            <button className="btn-cyan" onClick={() => setZoomedFoto(null)} style={{ width: '100%' }}>OK, Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
}
