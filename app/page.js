'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AuthView from '@/components/AuthView';
import { useDatabase } from '@/hooks/useDatabase';
import { supabase } from '@/lib/supabase';
import ExploreView from '@/components/ExploreView';
import SearchView from '@/components/SearchView';
import VoiceInputOverlay from '@/components/VoiceInputOverlay';
import { IconSearch, IconHierarchy, IconMic, IconPlus, IconEdit, IconDelete, IconCamera } from '@/components/Icons';

export default function Home() {
  const [activeTab, setActiveTab] = useState('explore');
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCasaMenuOpen, setIsCasaMenuOpen] = useState(false);
  const [newCasaName, setNewCasaName] = useState('');
  const [newCasaEspec, setNewCasaEspec] = useState('');
  const [editingCasaId, setEditingCasaId] = useState(null);
  const [editCasaName, setEditCasaName] = useState('');
  const [editCasaEspec, setEditCasaEspec] = useState('');
  const [appTitleInput, setAppTitleInput] = useState('');
  const [mounted, setMounted] = useState(false);
  const [isListeningFor, setIsListeningFor] = useState(null);

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
      if (target === 'addCasa') {
        setNewCasaEspec(text);
      } else if (target === 'editCasa') {
        setEditCasaEspec(text);
      } else if (target === 'addCasaNome') {
        setNewCasaName(text);
      } else if (target === 'editCasaNome') {
        setEditCasaName(text);
      }
    };

    try { rec.start(); } catch (e) {}
  };
  
  // Foto states for Casas
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoBlob, setFotoBlob] = useState(null);
  const [removeFoto, setRemoveFoto] = useState(false);
  const [zoomedFoto, setZoomedFoto] = useState(null);
  const fileInputRefEditCasa = useRef(null);
  
  const handleFileChangeCasa = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const { compressImage } = await import('@/utils/image');
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
      db.addComodo(nome, especificacao);
    } else if (level === 2 && currentComodo) {
      db.addLocal(currentComodo.id, nome, especificacao);
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
        <div 
          onClick={() => setIsCasaMenuOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: 1, minWidth: 0 }}
        >
          {db.currentCasa?.foto_url ? (
            <div style={{ width: '28px', height: '28px', borderRadius: '4px', overflow: 'hidden', border: '2px solid var(--black)', flexShrink: 0 }}>
              <img 
                src={db.currentCasa.foto_url} 
                alt={db.currentCasa.nome} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setZoomedFoto({ url: db.currentCasa.foto_url, title: db.currentCasa.nome }); 
                }} 
              />
            </div>
          ) : (
            <span style={{ fontSize: '1.2rem' }}>🏠</span>
          )}
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--blue)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {db.currentCasa ? db.currentCasa.nome : 'Nova Casa...'}
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>▼</span>
        </div>
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
        showEspecificacao={true}
      />

      {/* Menu de Casas */}
      {isCasaMenuOpen && (
        <div className="confirm-overlay" onClick={() => {
          setIsCasaMenuOpen(false);
          setEditingCasaId(null);
          setFotoPreview(null);
          setFotoBlob(null);
        }}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'left', maxHeight: '80vh', overflowY: 'auto', width: '90%', maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>Minhas Casas</h3>
              <button className="btn-ghost" onClick={() => setIsCasaMenuOpen(false)}>✕</button>
            </div>
            
            <div className="list-container" style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {db.casas.map(casa => (
                <div 
                  key={casa.id} 
                  className="card" 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '12px',
                    border: db.currentCasa?.id === casa.id ? '2px solid var(--lime)' : '2px solid var(--black)',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    db.setCurrentCasa(casa);
                    setLevel(1);
                    setCurrentComodo(null);
                    setCurrentLocal(null);
                    setIsCasaMenuOpen(false);
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {casa.foto_url && (
                        <div style={{ width: '24px', height: '24px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--black)', flexShrink: 0 }}>
                          <img 
                            src={casa.foto_url} 
                            alt={casa.nome} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setZoomedFoto({ url: casa.foto_url, title: casa.nome }); 
                            }} 
                          />
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{casa.nome}</span>
                        {casa.especificacao && <span style={{ fontSize: '0.8rem', color: 'var(--gray)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{casa.especificacao}</span>}
                      </div>
                    </div>
                    {db.currentCasa?.id === casa.id && <span style={{ fontSize: '0.75rem', color: 'var(--blue)', marginTop: '2px' }}>🏠 Atual</span>}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', marginLeft: '12px' }} onClick={e => e.stopPropagation()}>
                    <button className="edit-btn" style={{ padding: '6px' }} onClick={() => { 
                      setEditingCasaId(casa.id); 
                      setEditCasaName(casa.nome);
                      setEditCasaEspec(casa.especificacao || '');
                      setFotoPreview(casa.foto_url || null);
                      setFotoBlob(null);
                      setRemoveFoto(false);
                    }}>
                      <IconEdit />
                    </button>
                    {db.casas.length > 1 && (
                      <button className="delete-btn" style={{ padding: '6px' }} onClick={() => { if(confirm(`Excluir a casa "${casa.nome}"?`)) db.deleteCasa(casa.id); }}>
                        <IconDelete />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {editingCasaId ? (
              <div style={{ background: '#f5f5f5', padding: '16px', borderRadius: '4px', border: '2px solid var(--black)' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Editar Nome</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', marginTop: '4px' }}>
                  <input 
                    className="input-brutal" 
                    value={editCasaName} 
                    onChange={e => setEditCasaName(e.target.value)} 
                    style={{ flex: 1, background: 'var(--white)' }}
                  />
                  <button 
                    type="button"
                    className="edit-btn" 
                    style={{ backgroundColor: isListeningFor === 'editCasaNome' ? 'var(--blue)' : 'var(--cyan)', padding: '0 12px' }}
                    onClick={() => startSpecificListening('editCasaNome')}
                  >
                    <IconMic />
                  </button>
                </div>

                {/* Especificação para Casas no Edit */}
                <label style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Especificação</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', marginTop: '4px' }}>
                  <input 
                    className="input-brutal" 
                    value={editCasaEspec}
                    onChange={e => setEditCasaEspec(e.target.value)} 
                    placeholder="Ex: Casa de praia alugada"
                    style={{ flex: 1, background: 'var(--white)' }}
                  />
                  <button 
                    type="button"
                    className="edit-btn" 
                    style={{ backgroundColor: isListeningFor === 'editCasa' ? 'var(--blue)' : 'var(--cyan)', padding: '0 12px' }}
                    onClick={() => startSpecificListening('editCasa')}
                  >
                    <IconMic />
                  </button>
                </div>

                <label style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Foto da Casa</label>
                {fotoPreview && (
                  <div style={{ display: 'flex', justifyContent: 'center', margin: '0 0 10px 0' }}>
                    <img src={fotoPreview} alt="Preview" style={{ width: '100px', height: '100px', objectFit: 'cover', border: '2px solid var(--black)', borderRadius: 'var(--radius)' }} />
                  </div>
                )}
                <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    style={{ display: 'none' }} 
                    onChange={handleFileChangeCasa}
                    ref={fileInputRefEditCasa}
                  />
                  <button 
                    type="button" 
                    className="btn-yellow" 
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '8px' }}
                    onClick={() => fileInputRefEditCasa.current?.click()}
                  >
                    <IconCamera /> {fotoPreview ? "Substituir" : "Adicionar Foto"}
                  </button>
                  {fotoPreview && (
                    <button 
                      type="button" 
                      className="btn-red" 
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px' }}
                      onClick={() => {
                        setFotoPreview(null);
                        setFotoBlob(null);
                        setRemoveFoto(true);
                      }}
                    >
                      <IconDelete />
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-cyan" style={{ flex: 1 }} onClick={() => {
                    setEditingCasaId(null);
                    setFotoPreview(null);
                    setFotoBlob(null);
                  }}>Cancelar</button>
                  <button className="btn-lime" style={{ flex: 1 }} onClick={() => {
                    if (editCasaName.trim()) {
                      db.updateCasa(editingCasaId, editCasaName, editCasaEspec, fotoBlob, removeFoto);
                      setEditingCasaId(null);
                      setFotoPreview(null);
                      setFotoBlob(null);
                    }
                  }}>Salvar</button>
                </div>
              </div>
            ) : (
              <div style={{ borderTop: '2px dashed var(--black)', paddingTop: '16px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Nova Casa / Projeto</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', marginTop: '4px' }}>
                  <input 
                    className="input-brutal" 
                    placeholder="Ex: Casa de Praia"
                    value={newCasaName} 
                    onChange={e => setNewCasaName(e.target.value)} 
                    style={{ flex: 1 }}
                  />
                  <button 
                    type="button"
                    className="edit-btn" 
                    style={{ backgroundColor: isListeningFor === 'addCasaNome' ? 'var(--blue)' : 'var(--cyan)', padding: '0 12px' }}
                    onClick={() => startSpecificListening('addCasaNome')}
                  >
                    <IconMic />
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <input 
                    className="input-brutal" 
                    placeholder="Especificação (opcional)"
                    value={newCasaEspec} 
                    onChange={e => setNewCasaEspec(e.target.value)} 
                    style={{ flex: 1 }}
                  />
                  <button 
                    type="button"
                    className="edit-btn" 
                    style={{ backgroundColor: isListeningFor === 'addCasa' ? 'var(--blue)' : 'var(--cyan)', padding: '0 12px' }}
                    onClick={() => startSpecificListening('addCasa')}
                  >
                    <IconMic />
                  </button>
                </div>
                <button className="btn-lime" style={{ width: '100%' }} onClick={() => {
                  if (newCasaName.trim()) {
                    db.addCasa(newCasaName, newCasaEspec);
                    setNewCasaName('');
                    setNewCasaEspec('');
                  }
                }}>
                  + Criar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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

      {/* Zoom Modal */}
      {zoomedFoto && (
        <div className="confirm-overlay" onClick={() => setZoomedFoto(null)} style={{ zIndex: 9999 }}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center', padding: '16px' }}>
            <img src={zoomedFoto.url} alt={zoomedFoto.title} style={{ width: '100%', maxHeight: '60vh', objectFit: 'contain', borderRadius: '4px', marginBottom: '16px', border: '3px solid var(--black)' }} />
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', wordBreak: 'break-word' }}>{zoomedFoto.title}</h3>
            <button className="btn-cyan" onClick={() => setZoomedFoto(null)} style={{ width: '100%' }}>OK, Fechar</button>
          </div>
        </div>
      )}
    </main>
  );
}
