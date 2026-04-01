import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Zap, Activity } from 'lucide-react';
import BodyMapCore from './BodyMap/BodyMapCore';
import { BACK_POINTS } from '../data/bodyMapPoints';

const COLOR_PUMP    = '#ef4444'; // Vermelho pump (modo treino)
const COLOR_INTER   = '#f59e0b'; // Amarelo Zyron (modo interativo)

const BACK_KEYS = BACK_POINTS.map(p => p.key);

export default function AnatomyMap2D({
  activeGroup,
  interactive = false,
  onMuscleSelect,
  compact = false,
}) {
  const [manualView, setManualView] = useState(null);

  const autoView = useMemo(
    () => (!activeGroup ? 'FRONT' : BACK_KEYS.includes(activeGroup) ? 'BACK' : 'FRONT'),
    [activeGroup]
  );

  const view = manualView || autoView;

  // ── Versão compacta (Silhueta simples) ──────────────────────────────────────
  if (compact) {
    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <BodyMapCore 
          view={view} 
          activeGroup={activeGroup} 
          interactive={false} 
          showLabels={false}
          className="bg-transparent border-none"
        />
      </div>
    );
  }

  // ── Versão completa (HUD + Mapa Interativo) ──────────────────────────────────
  return (
    <div className={`w-full bg-black rounded-3xl border border-white/5 overflow-hidden relative shadow-[inset_0_0_100px_rgba(0,0,0,1)] flex items-center justify-center ${interactive ? 'h-[440px]' : 'h-72'}`}>

      {/* HUD Superior Esquerdo */}
      <div className="absolute top-5 left-5 z-20">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <div className={`w-3 h-3 rounded-full ${interactive ? 'bg-yellow-400 shadow-[0_0_15px_rgba(253,224,71,0.8)]' : 'bg-red-600 shadow-[0_0_20px_#ef4444]'}`} />
            <div className={`absolute w-6 h-6 border rounded-full animate-ping opacity-30 ${interactive ? 'border-yellow-400' : 'border-red-500'}`} />
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white italic leading-none">
              {interactive ? 'Anatomical Engine' : 'Neural Monitor'}
            </h4>
            <span className={`text-[8px] font-black uppercase tracking-widest mt-1 block ${interactive ? 'text-yellow-400' : 'text-red-500'}`}>
              {interactive ? 'Selecione a Musculatura' : (activeGroup ? 'PUMP ATIVO' : 'SISTEMA EM ESPERA')}
            </span>
          </div>
        </div>
      </div>

      {/* Setores de Visão (Frente/Costas) */}
      <div className="absolute top-5 right-5 z-20 flex gap-2">
        {['FRONT', 'BACK'].map(v => (
          <button
            key={v}
            onClick={() => setManualView(v)}
            className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full transition-all border ${
              view === v
                ? 'bg-yellow-400 text-neutral-950 border-yellow-400'
                : 'bg-white/5 text-neutral-500 border-white/10 hover:border-white/20'
            }`}
          >
            {v === 'FRONT' ? 'Frente' : 'Costas'}
          </button>
        ))}
      </div>

      {/* Core do Mapa Muscular SVG */}
      <div className="w-full h-full p-4 flex items-center justify-center">
        <BodyMapCore
          view={view}
          activeGroup={activeGroup}
          onMuscleSelect={onMuscleSelect}
          interactive={interactive}
          showLabels={true}
          className="bg-transparent border-none shadow-none"
        />
      </div>

      {/* Botão GIRAR (Somente Modo Interativo) */}
      {interactive && (
        <button
          onClick={() => setManualView(v => (v || view) === 'FRONT' ? 'BACK' : 'FRONT')}
          className="absolute bottom-5 right-5 z-20 flex flex-col items-center gap-1.5 bg-yellow-400/10 hover:bg-yellow-400/20 border border-yellow-400/30 rounded-2xl px-5 py-2.5 transition-all active:scale-95 group shadow-lg"
        >
          <RotateCcw size={18} className="text-yellow-400 group-hover:rotate-180 transition-transform duration-500" />
          <span className="text-[9px] font-black uppercase tracking-widest text-yellow-400">GIRAR MODELO</span>
        </button>
      )}

      {/* Footer HUD (Dados Técnicos) */}
      {!interactive && (
        <>
          <div className="absolute bottom-5 left-6 z-20 flex flex-col gap-2">
            <div className="flex gap-1.5">
              <div className="w-1.5 h-4 bg-red-600/40 rounded-full animate-pulse" />
              <div className="w-1.5 h-4 bg-red-600/20 rounded-full" />
              <div className="w-1.5 h-4 bg-red-600/10 rounded-full" />
            </div>
            <span className="text-[7px] font-mono text-neutral-600 tracking-tighter uppercase flex items-center gap-2">
              <Activity size={8} /> ENGINE_CORE.v4.SVG.ACTIVE
            </span>
          </div>
          <div className="absolute bottom-5 right-8 z-20 text-right">
            <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest block mb-0.5 opacity-60">Status Muscular</span>
            <span className="text-lg font-black text-red-500 uppercase italic tracking-tighter drop-shadow-[0_0_12px_rgba(239,68,68,0.5)]">
              {activeGroup || 'NO_DATA'}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
