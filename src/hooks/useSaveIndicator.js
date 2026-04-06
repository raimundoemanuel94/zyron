/**
 * SAVE INDICATOR HOOK
 * Provides visual feedback for data persistence operations
 * Shows "Salvando..." during sync, "✓ Salvo" on success, "✗ Erro" on failure
 */

import { useState, useCallback } from 'react';

export function useSaveIndicator() {
  const [saveState, setSaveState] = useState(null); // null | 'saving' | 'success' | 'error'
  const [saveMessage, setSaveMessage] = useState('');

  const showSaving = useCallback((message = 'Salvando...') => {
    setSaveState('saving');
    setSaveMessage(message);
  }, []);

  const showSuccess = useCallback((message = 'Salvo com sucesso!') => {
    setSaveState('success');
    setSaveMessage(message);
    // Auto-hide success message after 2 seconds
    const timer = setTimeout(() => {
      setSaveState(null);
      setSaveMessage('');
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const showError = useCallback((message = 'Erro ao salvar', duration = 3000) => {
    setSaveState('error');
    setSaveMessage(message);
    // Auto-hide error message after duration
    const timer = setTimeout(() => {
      setSaveState(null);
      setSaveMessage('');
    }, duration);
    return () => clearTimeout(timer);
  }, []);

  const clear = useCallback(() => {
    setSaveState(null);
    setSaveMessage('');
  }, []);

  return {
    saveState,
    saveMessage,
    showSaving,
    showSuccess,
    showError,
    clear,
  };
}

/**
 * SAVE INDICATOR COMPONENT
 * Visual feedback component to show alongside save operations
 */
export function SaveIndicator({ state, message }) {
  if (!state) return null;

  const iconMap = {
    saving: '⏳',
    success: '✓',
    error: '✗',
  };

  const colorMap = {
    saving: '#FFD700', // Gold
    success: '#00FF00', // Green
    error: '#FF4444', // Red
  };

  const textMap = {
    saving: '#FFF',
    success: '#00FF00',
    error: '#FF4444',
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        borderRadius: '8px',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        border: `1px solid ${colorMap[state]}`,
        color: textMap[state],
        fontSize: '12px',
        fontWeight: 600,
        animation: state === 'saving' ? 'pulse 1s infinite' : 'none',
      }}
    >
      <span style={{ fontSize: '16px' }}>{iconMap[state]}</span>
      <span>{message}</span>
    </div>
  );
}
