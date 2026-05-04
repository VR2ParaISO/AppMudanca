import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useDatabase(user) {
  const [comodos, setComodos] = useState([]);
  const [locais, setLocais] = useState([]);
  const [itens, setItens] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load all data when user changes
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

  // ===== ITENS =====
  const addItem = useCallback(async (localId, nome, especificacao = '') => {
    const { data, error } = await supabase
      .from('itens')
      .insert({ local_id: localId, nome: nome.toUpperCase(), especificacao })
      .select()
      .single();

    if (error) { console.error('addItem error:', error); return; }
    setItens(prev => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)));
    return data;
  }, []);

  // ===== DELETE =====
  const deleteItem = useCallback(async (type, id) => {
    const { error } = await supabase.from(type).delete().eq('id', id);
    if (error) { console.error('delete error:', error); return; }

    if (type === 'comodos') {
      const affectedLocais = locais.filter(l => l.comodo_id === id).map(l => l.id);
      setComodos(prev => prev.filter(c => c.id !== id));
      setLocais(prev => prev.filter(l => l.comodo_id !== id));
      setItens(prev => prev.filter(i => !affectedLocais.includes(i.local_id)));
    } else if (type === 'locais') {
      setLocais(prev => prev.filter(l => l.id !== id));
      setItens(prev => prev.filter(i => i.local_id !== id));
    } else if (type === 'itens') {
      setItens(prev => prev.filter(i => i.id !== id));
    }
  }, [locais]);

  // ===== RENAME =====
  const rename = useCallback(async (type, id, newNome) => {
    const { error } = await supabase.from(type).update({ nome: newNome.toUpperCase() }).eq('id', id);
    if (error) { console.error('rename error:', error); return; }

    const setter = type === 'comodos' ? setComodos : type === 'locais' ? setLocais : setItens;
    setter(prev =>
      prev.map(item => item.id === id ? { ...item, nome: newNome.toUpperCase() } : item)
        .sort((a, b) => a.nome.localeCompare(b.nome))
    );
  }, []);

  // ===== UPDATE ITEM (nome + especificacao) =====
  const updateItem = useCallback(async (id, newNome, newEspecificacao) => {
    const { error } = await supabase.from('itens')
      .update({ nome: newNome.toUpperCase(), especificacao: newEspecificacao })
      .eq('id', id);
    if (error) { console.error('updateItem error:', error); return; }

    setItens(prev =>
      prev.map(item => item.id === id ? { ...item, nome: newNome.toUpperCase(), especificacao: newEspecificacao } : item)
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
    addLocal,
    addItem,
    deleteItem,
    rename,
    updateItem,
    getStats,
    isLoaded,
  };
}
