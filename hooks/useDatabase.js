import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useDatabase(user) {
  const [comodos, setComodos] = useState([]);
  const [locais, setLocais] = useState([]);
  const [itens, setItens] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (user) {
      loadAll();
    } else {
      setComodos([]);
      setLocais([]);
      setItens([]);
      setIsLoaded(false);
    }
  }, [user]);

  const loadAll = async () => {
    try {
      const [cRes, lRes, iRes] = await Promise.all([
        supabase.from('comodos').select('*').order('nome'),
        supabase.from('locais').select('*').order('nome'),
        supabase.from('itens').select('*').order('nome'),
      ]);

      if (cRes.data) setComodos(cRes.data);
      if (lRes.data) setLocais(lRes.data);
      if (iRes.data) setItens(iRes.data);
    } catch (e) {
      console.error('Failed to load data:', e);
    }
    setIsLoaded(true);
  };

  // ===== COMODOS =====
  const addComodo = useCallback(async (nome) => {
    const { data, error } = await supabase
      .from('comodos')
      .insert({ nome: nome.toUpperCase() })
      .select()
      .single();

    if (error) { console.error('addComodo error:', error); return; }
    setComodos(prev => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)));
    return data;
  }, []);

  const updateComodo = useCallback(async (id, newNome, newFotoBlob = null) => {
    let updatePayload = { nome: newNome.toUpperCase() };
    
    if (newFotoBlob && user) {
      const fileName = `${user.id}/comodos/${crypto.randomUUID()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('fotos')
        .upload(fileName, newFotoBlob, { contentType: 'image/jpeg' });
      
      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage.from('fotos').getPublicUrl(fileName);
        updatePayload.foto_url = publicUrlData.publicUrl;

        // Tentar apagar a foto antiga
        const oldComodo = comodos.find(c => c.id === id);
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
  const addLocal = useCallback(async (comodoId, nome) => {
    if (!comodoId) { console.error('Missing comodoId'); return; }

    const { data, error } = await supabase
      .from('locais')
      .insert({ comodo_id: comodoId, nome: nome.toUpperCase() })
      .select()
      .single();

    if (error) { console.error('addLocal error:', error); return; }
    setLocais(prev => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)));
    return data;
  }, []);

  const updateLocal = useCallback(async (id, newNome, parentLocalId, newFotoBlob = null) => {
    let updatePayload = { nome: newNome.toUpperCase(), parent_local_id: parentLocalId };

    if (newFotoBlob && user) {
      const fileName = `${user.id}/locais/${crypto.randomUUID()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('fotos')
        .upload(fileName, newFotoBlob, { contentType: 'image/jpeg' });
      
      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage.from('fotos').getPublicUrl(fileName);
        updatePayload.foto_url = publicUrlData.publicUrl;

        // Tentar apagar a foto antiga
        const oldLocal = locais.find(l => l.id === id);
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

    setLocais(prev =>
      prev.map(l => l.id === id ? { ...l, ...updatePayload } : l)
        .sort((a, b) => a.nome.localeCompare(b.nome))
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

  const updateItem = useCallback(async (id, newNome, newEspecificacao, newFotoBlob = null) => {
    let updatePayload = { nome: newNome.toUpperCase(), especificacao: newEspecificacao };
    
    if (newFotoBlob && user) {
      const fileName = `${user.id}/${crypto.randomUUID()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('fotos')
        .upload(fileName, newFotoBlob, { contentType: 'image/jpeg' });
      
      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage.from('fotos').getPublicUrl(fileName);
        updatePayload.foto_url = publicUrlData.publicUrl;

        const oldItem = itens.find(i => i.id === id);
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

    const setter = type === 'comodos' ? setComodos : type === 'locais' ? setLocais : setItens;
    setter(prev =>
      prev.map(item => item.id === id ? { ...item, nome: newNome.toUpperCase() } : item)
        .sort((a, b) => a.nome.localeCompare(b.nome))
    );
  }, []);

  const getStats = useCallback(() => ({
    totalComodos: comodos.length,
    totalLocais: locais.length,
    totalItens: itens.length,
  }), [comodos, locais, itens]);

  return {
    comodos,
    locais,
    itens,
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
