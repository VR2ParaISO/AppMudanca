'use client';

import { useState, useEffect, useRef } from 'react';
import { IconMic } from './Icons';

export default function VoiceInputOverlay({ isOpen, onClose, onResult, contextLabel, showEspecificacao = false }) {
  const [isListening, setIsListening] = useState(false);
  const [isListeningEspec, setIsListeningEspec] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [inputNome, setInputNome] = useState('');
  const [inputEspecificacao, setInputEspecificacao] = useState('');
  const recognitionRef = useRef(null);
  const showEspecificacaoRef = useRef(showEspecificacao);

  const startListeningEspec = () => {
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

    rec.onstart = () => setIsListeningEspec(true);
    rec.onend = () => setIsListeningEspec(false);
    rec.onerror = () => setIsListeningEspec(false);
    rec.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setInputEspecificacao(text);
    };

    try { rec.start(); } catch (e) {}
  };

  useEffect(() => {
    showEspecificacaoRef.current = showEspecificacao;
  }, [showEspecificacao]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const rec = new SpeechRecognition();
    rec.lang = 'pt-BR';
    rec.continuous = false;
    rec.interimResults = true;

    rec.onstart = () => setIsListening(true);
    rec.onend = () => setIsListening(false);
    rec.onerror = () => setIsListening(false);
    rec.onresult = (event) => {
      const current = event.results[0][0].transcript;
      setTranscript(current);
      if (event.results[0].isFinal) {
        let nome = current.trim();
        let espec = '';
        // Comma parsing only for items
        if (showEspecificacaoRef.current && nome.includes(',')) {
          const parts = nome.split(',');
          nome = parts[0].trim();
          espec = parts.slice(1).join(',').trim();
        }
        setInputNome(nome);
        setInputEspecificacao(espec);
      }
    };

    recognitionRef.current = rec;

    return () => {
      try { rec.abort(); } catch (_) {}
    };
  }, []);

  // Reset state and auto-start listening when overlay opens
  useEffect(() => {
    if (isOpen) {
      setTranscript('');
      setInputNome('');
      setInputEspecificacao('');
      // Small delay to ensure overlay is rendered before starting
      const timer = setTimeout(() => {
        if (recognitionRef.current) {
          try { recognitionRef.current.start(); } catch (_) {}
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const startListening = () => {
    if (recognitionRef.current) {
      setTranscript('');
      setInputNome('');
      setInputEspecificacao('');
      try {
        recognitionRef.current.start();
      } catch (_) {
        // Already started
      }
    } else {
      alert("Reconhecimento de voz não suportado neste navegador.");
    }
  };

  const handleConfirm = () => {
    if (inputNome.trim()) {
      onResult({ nome: inputNome.trim(), especificacao: inputEspecificacao.trim() });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="voice-overlay">
      <div className="card voice-card card-static" style={{ textAlign: 'center' }}>
        <h2 style={{ marginBottom: '8px' }}>Adicionar por Voz</h2>
        {contextLabel && (
          <p style={{ fontSize: '0.85rem', color: 'var(--gray)', marginBottom: '20px', fontWeight: 500 }}>
            {contextLabel}
          </p>
        )}
        
        <div 
          className={`mic-circle ${isListening ? 'listening' : ''}`}
          style={{ 
            backgroundColor: isListening ? 'var(--blue)' : 'var(--bg)',
            boxShadow: isListening ? 'none' : 'var(--shadow)',
            color: isListening ? 'var(--white)' : 'var(--black)'
          }} 
          onClick={startListening}
        >
          <IconMic />
        </div>

        <p style={{ minHeight: '40px', fontSize: '1rem', fontWeight: 600, color: isListening ? 'var(--blue)' : 'var(--gray)' }}>
          {isListening ? '🎙️ Ouvindo...' : transcript ? `"${transcript}"` : 'Toque no microfone e fale'}
        </p>

        {/* Editable fields after voice capture */}
        {inputNome && !isListening && (
          <div style={{ marginTop: '20px', textAlign: 'left' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gray)' }}>Nome</label>
            <input 
              className="input-brutal"
              value={inputNome}
              onChange={(e) => setInputNome(e.target.value)}
              style={{ marginBottom: '10px', marginTop: '4px' }}
            />
            {showEspecificacao && (
              <>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gray)' }}>Especificação (opcional)</label>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <input 
                    className="input-brutal"
                    value={inputEspecificacao}
                    onChange={(e) => setInputEspecificacao(e.target.value)}
                    placeholder="Ex: segunda gaveta, embaixo..."
                    style={{ flex: 1 }}
                  />
                  <button 
                    type="button"
                    className="edit-btn" 
                    style={{ backgroundColor: isListeningEspec ? 'var(--blue)' : 'var(--cyan)' }}
                    onClick={startListeningEspec}
                  >
                    <IconMic />
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
          <button className="btn-cyan" style={{ flex: 1 }} onClick={onClose}>
            Cancelar
          </button>
          {inputNome && (
            <button className="btn-lime" style={{ flex: 1 }} onClick={handleConfirm}>
              Salvar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
