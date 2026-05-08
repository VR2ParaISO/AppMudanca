import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useDatabase(user) {
  const [casas, setCasas] = useState([]);
  const [currentCasa, setCurrentCasa] = useState(null);
  const [comodos, setComodos] = useState([]);
  const [locais, setLocais] = useState([]);
  const [itens, setItens] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (user) {
      loadAll();
    } else {
      setCasas([]);
      setCurrentCasa(null);
      setComodos([]);
      setLocais([]);
      setItens([]);
      setIsLoaded(false);
    }
  }, [user]);

  const loadAll = async () => {
    try {
      const [csRes, cRes, lRes, iRes] = await Promise.all([
        supabase.from('casas').select('*').order('nome'),
        supabase.from('comodos').select('*').order('nome'),
        supabase.from('locais').select('*').order('nome'),
        supabase.from('itens').select('*').order('nome'),
      ]);

      if (csRes.data) {
        setCasas(csRes.data);
        if (csRes.data.length > 0) {
          // Mantém a casa selecionada atual (se ainda existir), pega a salva no perfil, ou a primeira
          const lastCasaId = user?.user_metadata?.last_casa_id;
          setCurrentCasa(prev => {
            if (prev && csRes.data.find(c => c.id === prev.id)) return prev;
            if (lastCasaId) {
              const found = csRes.data.find(c => c.id === lastCasaId);
              if (found) return found;
            }
            return csRes.data[0];
          });
        }
      }
      if (cRes.data) setComodos(cRes.data);
      if (lRes.data) setLocais(lRes.data);
      if (iRes.data) setItens(iRes.data);
    } catch (e) {
      console.error('Failed to load data:', e);
    }
    setIsLoaded(true);
  };

  // ===== CASAS =====
  const addCasa = useCallback(async (nome, especificacao = '') => {
    const { data, error } = await supabase
      .from('casas')
      .insert({ nome: nome.trim(), especificacao })
      .select()
      .single();

    if (error) { console.error('addCasa error:', error); return; }
    setCasas(prev => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)));
    setCurrentCasa(data);
    if (user) {
      supabase.auth.updateUser({ data: { last_casa_id: data.id } }).catch(e => console.error(e));
    }
    return data;
  }, []);

  const updateCasa = useCallback(async (id, newNome, newEspecificacao = '', newFotoBlob = null, removeFoto = false) => {
    let updatePayload = { nome: newNome.trim(), especificacao: newEspecificacao };
    const oldCasa = casas.find(c => c.id === id);

    if (removeFoto && !newFotoBlob) {
      updatePayload.foto_url = null;
      if (oldCasa && oldCasa.foto_url) {
        const path = oldCasa.foto_url.split('/public/fotos/')[1];
        if (path) supabase.storage.from('fotos').remove([path]).catch(err => console.error("Error removing old photo", err));
      }
    } else if (newFotoBlob && user) {
      const fileName = `${user.id}/casas/${crypto.randomUUID()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('fotos')
        .upload(fileName, newFotoBlob, { contentType: 'image/jpeg' });
      
      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage.from('fotos').getPublicUrl(fileName);
        updatePayload.foto_url = publicUrlData.publicUrl;

        if (oldCasa && oldCasa.foto_url) {
          const path = oldCasa.foto_url.split('/public/fotos/')[1];
          if (path) supabase.storage.from('fotos').remove([path]).catch(err => console.error("Error removing old photo", err));
        }
      }
    }

    const { error } = await supabase.from('casas')
      .update(updatePayload)
      .eq('id', id);
    if (error) { console.error('updateCasa error:', error); return; }

    setCasas(prev => prev.map(c => c.id === id ? { ...c, ...updatePayload } : c).sort((a, b) => a.nome.localeCompare(b.nome)));
    setCurrentCasa(prev => prev?.id === id ? { ...prev, ...updatePayload } : prev);
  }, [user, casas]);

  const deleteCasa = useCallback(async (id) => {
    const casaToDelete = casas.find(c => c.id === id);
    if (casaToDelete && casaToDelete.foto_url) {
      const path = casaToDelete.foto_url.split('/public/fotos/')[1];
      if (path) supabase.storage.from('fotos').remove([path]).catch(err => console.error("Error removing photo", err));
    }

    const { error } = await supabase.from('casas').delete().eq('id', id);
    if (error) { console.error('deleteCasa error:', error); return; }

    setCasas(prev => {
      const novasCasas = prev.filter(c => c.id !== id);
      const nextCasa = novasCasas.length > 0 ? novasCasas[0] : null;
      setCurrentCasa(nextCasa);
      if (user && currentCasa?.id === id) {
        supabase.auth.updateUser({ data: { last_casa_id: nextCasa ? nextCasa.id : null } }).catch(e => console.error(e));
      }
      return novasCasas;
    });
    // Opcional: remover os cômodos, locais e itens do estado local, mas um reload/loadAll seria melhor ou apenas filtrar
    setComodos(prev => prev.filter(c => c.casa_id !== id));
  }, [casas, currentCasa, user]);

  // ===== COMODOS =====
  const addComodo = useCallback(async (nome, especificacao = '') => {
    if (!currentCasa) { console.error('Nenhuma casa selecionada'); return; }

    const { data, error } = await supabase
      .from('comodos')
      .insert({ nome: nome.toUpperCase(), casa_id: currentCasa.id, especificacao })
      .select()
      .single();

    if (error) { console.error('addComodo error:', error); return; }
    setComodos(prev => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)));
    return data;
  }, [currentCasa]);

  const updateComodo = useCallback(async (id, newNome, newEspecificacao = '', newFotoBlob = null, removeFoto = false) => {
    let updatePayload = { nome: newNome.toUpperCase(), especificacao: newEspecificacao };
    
    const oldComodo = comodos.find(c => c.id === id);

    if (removeFoto && !newFotoBlob) {
      updatePayload.foto_url = null;
      if (oldComodo && oldComodo.foto_url) {
        const path = oldComodo.foto_url.split('/public/fotos/')[1];
        if (path) supabase.storage.from('fotos').remove([path]).catch(err => console.error("Error removing old photo", err));
      }
    } else if (newFotoBlob && user) {
      const fileName = `${user.id}/comodos/${crypto.randomUUID()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('fotos')
        .upload(fileName, newFotoBlob, { contentType: 'image/jpeg' });
      
      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage.from('fotos').getPublicUrl(fileName);
        updatePayload.foto_url = publicUrlData.publicUrl;

        // Tentar apagar a foto antiga se houver substituicao
        if (oldComodo && oldComodo.foto_url) {
          const path = oldComodo.foto_url.split('/public/fotos/')[1];
          if (path) supabase.storage.from('fotos').remove([path]).catch(err => console.error("Error removing old photo", err));
        }
      }
    }

    const { error } = await supabase.from('comodos')
      .update(updatePayload)
      .eq('id', id);
    if (error) { console.error('updateComodo error:', error); return; }

    setComodos(prev =>
      prev.map(c => c.id === id ? { ...c, ...updatePayload } : c)
        .sort((a, b) => a.nome.localeCompare(b.nome))
    );
  }, [user, comodos]);

  // ===== LOCAIS =====
  const addLocal = useCallback(async (comodoId, nome, especificacao = '') => {
    if (!comodoId) { console.error('Missing comodoId'); return; }

    const { data, error } = await supabase
      .from('locais')
      .insert({ comodo_id: comodoId, nome: nome.toUpperCase(), especificacao })
      .select()
      .single();

    if (error) { console.error('addLocal error:', error); return; }
    setLocais(prev => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)));
    return data;
  }, []);

  const updateLocal = useCallback(async (id, newNome, newEspecificacao = '', parentLocalId, newComodoId, newFotoBlob = null, removeFoto = false) => {
    let updatePayload = { nome: newNome.toUpperCase(), especificacao: newEspecificacao, parent_local_id: parentLocalId, comodo_id: newComodoId };

    const oldLocal = locais.find(l => l.id === id);

    if (removeFoto && !newFotoBlob) {
      updatePayload.foto_url = null;
      if (oldLocal && oldLocal.foto_url) {
        const path = oldLocal.foto_url.split('/public/fotos/')[1];
        if (path) supabase.storage.from('fotos').remove([path]).catch(err => console.error("Error removing old photo", err));
      }
    } else if (newFotoBlob && user) {
      const fileName = `${user.id}/locais/${crypto.randomUUID()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('fotos')
        .upload(fileName, newFotoBlob, { contentType: 'image/jpeg' });
      
      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage.from('fotos').getPublicUrl(fileName);
        updatePayload.foto_url = publicUrlData.publicUrl;

        // Tentar apagar a foto antiga se substituida
        if (oldLocal && oldLocal.foto_url) {
          const path = oldLocal.foto_url.split('/public/fotos/')[1];
          if (path) supabase.storage.from('fotos').remove([path]).catch(err => console.error("Error removing old photo", err));
        }
      }
    }

    const { error } = await supabase.from('locais')
      .update(updatePayload)
      .eq('id', id);
    if (error) { console.error('updateLocal error:', error); return; }

    // Atualiza comodo_id em todos os sub-locais dependentes
    const descendants = [];
    const findDescendants = (parentId) => {
      locais.filter(l => l.parent_local_id === parentId).forEach(child => {
        descendants.push(child.id);
        findDescendants(child.id);
      });
    };
    findDescendants(id);

    if (descendants.length > 0) {
      await supabase.from('locais').update({ comodo_id: newComodoId }).in('id', descendants);
    }

    setLocais(prev =>
      prev.map(l => {
        if (l.id === id) return { ...l, ...updatePayload };
        if (descendants.includes(l.id)) return { ...l, comodo_id: newComodoId };
        return l;
      }).sort((a, b) => a.nome.localeCompare(b.nome))
    );
  }, [user, locais]);

  // ===== ITENS =====
  const addItem = useCallback(async (localId, nome, especificacao = '', fotoBlob = null) => {
    let foto_url = null;
    if (fotoBlob && user) {
      const fileName = `${user.id}/${crypto.randomUUID()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('fotos')
        .upload(fileName, fotoBlob, { contentType: 'image/jpeg' });
      
      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage.from('fotos').getPublicUrl(fileName);
        foto_url = publicUrlData.publicUrl;
      } else {
        console.error('Upload error:', uploadError);
      }
    }

    const { data, error } = await supabase
      .from('itens')
      .insert({ local_id: localId, nome: nome.toUpperCase(), especificacao, foto_url })
      .select()
      .single();

    if (error) { console.error('addItem error:', error); return; }
    setItens(prev => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)));
    return data;
  }, [user]);

  const updateItem = useCallback(async (id, newNome, newEspecificacao, newFotoBlob = null, removeFoto = false) => {
    let updatePayload = { nome: newNome.toUpperCase(), especificacao: newEspecificacao };
    
    const oldItem = itens.find(i => i.id === id);

    if (removeFoto && !newFotoBlob) {
      updatePayload.foto_url = null;
      if (oldItem && oldItem.foto_url) {
        const path = oldItem.foto_url.split('/public/fotos/')[1];
        if (path) supabase.storage.from('fotos').remove([path]).catch(err => console.error("Error removing old photo", err));
      }
    } else if (newFotoBlob && user) {
      const fileName = `${user.id}/${crypto.randomUUID()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('fotos')
        .upload(fileName, newFotoBlob, { contentType: 'image/jpeg' });
      
      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage.from('fotos').getPublicUrl(fileName);
        updatePayload.foto_url = publicUrlData.publicUrl;

        if (oldItem && oldItem.foto_url) {
          const path = oldItem.foto_url.split('/public/fotos/')[1];
          if (path) supabase.storage.from('fotos').remove([path]).catch(err => console.error("Error removing old photo", err));
        }
      }
    }

    const { error } = await supabase.from('itens')
      .update(updatePayload)
      .eq('id', id);
    if (error) { console.error('updateItem error:', error); return; }

    setItens(prev =>
      prev.map(item => item.id === id ? { ...item, ...updatePayload } : item)
        .sort((a, b) => a.nome.localeCompare(b.nome))
    );
  }, [user, itens]);


  // ===== DELETE =====
  const deleteItem = useCallback(async (type, id) => {
    // Apagar foto correspondente no Storage
    const list = type === 'comodos' ? comodos : type === 'locais' ? locais : itens;
    const itemToDelete = list.find(i => i.id === id);
    if (itemToDelete && itemToDelete.foto_url) {
      const path = itemToDelete.foto_url.split('/public/fotos/')[1];
      if (path) {
        supabase.storage.from('fotos').remove([path]).catch(err => console.error("Error removing photo", err));
      }
    }

    const { error } = await supabase.from(type).delete().eq('id', id);
    if (error) { console.error('delete error:', error); return; }

    if (type === 'comodos') {
      const affectedLocais = locais.filter(l => l.comodo_id === id).map(l => l.id);
      setComodos(prev => prev.filter(c => c.id !== id));
      setLocais(prev => prev.filter(l => l.comodo_id !== id));
      setItens(prev => prev.filter(i => !affectedLocais.includes(i.local_id)));
    } else if (type === 'locais') {
      setLocais(prev => prev.filter(l => l.id !== id && l.parent_local_id !== id));
      setItens(prev => prev.filter(i => i.local_id !== id));
    } else if (type === 'itens') {
      setItens(prev => prev.filter(i => i.id !== id));
    }
  }, [locais, itens, comodos]);

  // ===== RENAME ===== (mantido por retrocompatibilidade se necessário, mas updateComodo e updateLocal são preferíveis agora)
  const rename = useCallback(async (type, id, newNome) => {
    const { error } = await supabase.from(type).update({ nome: newNome.toUpperCase() }).eq('id', id);
    if (error) { console.error('rename error:', error); return; }

    const setter = type === 'casas' ? setCasas : type === 'comodos' ? setComodos : type === 'locais' ? setLocais : setItens;
    setter(prev =>
      prev.map(item => item.id === id ? { ...item, nome: newNome.toUpperCase() } : item)
        .sort((a, b) => a.nome.localeCompare(b.nome))
    );
  }, []);

  // Filtragem dos dados pela casa atual
  const filteredComodos = comodos.filter(c => c.casa_id === currentCasa?.id);
  const filteredLocais = locais.filter(l => filteredComodos.some(fc => fc.id === l.comodo_id));
  const filteredItens = itens.filter(i => filteredLocais.some(fl => fl.id === i.local_id));

  const getStats = useCallback(() => ({
    totalCasas: casas.length,
    totalComodos: filteredComodos.length,
    totalLocais: filteredLocais.length,
    totalItens: filteredItens.length,
  }), [casas, filteredComodos, filteredLocais, filteredItens]);

  const setAndSaveCurrentCasa = useCallback((casa) => {
    setCurrentCasa(casa);
    if (casa && user) {
      supabase.auth.updateUser({ data: { last_casa_id: casa.id } }).catch(e => console.error(e));
    }
  }, [user]);

  return {
    casas,
    currentCasa,
    setCurrentCasa: setAndSaveCurrentCasa,
    addCasa,
    updateCasa,
    deleteCasa,
    comodos: filteredComodos,
    locais: filteredLocais,
    itens: filteredItens,
    addComodo,
    updateComodo,
    addLocal,
    updateLocal,
    addItem,
    updateItem,
    deleteItem,
    rename,
    getStats,
    isLoaded,
  };
}
