import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MAP_CONFIG, FRONT_POINTS, BACK_POINTS, MUSCLE_OVERLAYS } from '../../data/bodyMapPoints';

// ─── Subcomponente: Label e Linha SVG ──────────────────────────────────────────
const LabelLineSVG = ({ pt, isActive, onSelect }) => {
  const isLeft = pt.side === 'left';
  const labelX = isLeft ? 2 : 98;
  const lineX2 = isLeft ? 20 : 80;

  // Pontos a renderizar (um ou dois dependendo de isDual)
  const renderPoints = pt.isDual ? [pt.x, 100 - pt.x] : [pt.x];

  return (
    <g 
      className="cursor-pointer group" 
      onClick={(e) => { e.stopPropagation(); onSelect(pt.key); }}
    >
      {/* Linha conector horizontal */}
      <motion.line
        initial={false}
        animate={{ 
          stroke: isActive ? '#facc15' : 'rgba(255,255,255,0.15)',
          strokeWidth: isActive ? 0.6 : 0.2,
          opacity: isActive ? 1 : 0.6
        }}
        x1={pt.x}
        y1={pt.y}
        x2={lineX2}
        y2={pt.y}
        transition={{ duration: 0.3 }}
      />

      {/* Rótulo de texto estável */}
      <motion.text
        initial={false}
        animate={{ 
          fill: isActive ? '#facc15' : 'rgba(255,255,255,0.5)',
          scale: isActive ? 1.05 : 1,
          fontWeight: isActive ? '900' : '700'
        }}
        x={labelX}
        y={pt.y}
        textAnchor={isLeft ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize="3"
        className="uppercase tracking-[0.12em] select-none transition-all"
        style={{ 
          filter: isActive ? 'drop-shadow(0 0 10px rgba(250,204,21,0.6))' : 'none',
          fontFamily: 'Inter, system-ui, sans-serif',
          transformOrigin: `${labelX}% ${pt.y}%`
        }}
      >
        {pt.label}
      </motion.text>

      {/* Renderização de Pontos (Suporte a Dual) */}
      {renderPoints.map((xCoord, idx) => (
        <g key={`${pt.key}-${idx}`}>
          <circle
            cx={xCoord}
            cy={pt.y}
            r={isActive ? 1.8 : 1}
            fill={isActive ? '#facc15' : 'rgba(255,255,255,0.25)'}
            className="transition-all duration-300"
          />
          
          {isActive && (
            <motion.circle
              cx={xCoord}
              cy={pt.y}
              r={1.8}
              fill="none"
              stroke="#facc15"
              strokeWidth="0.4"
              animate={{ scale: [1, 3], opacity: [0.6, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
            />
          )}
        </g>
      ))}
    </g>
  );
};

// ─── Subcomponente: Glow Muscular SVG Nativo ──────────────────────────────────
function MuscleGlowSVG({ overlay, color = '#facc15' }) {
  if (!overlay) return null;

  const renderGlow = (cx, cy) => (
    <motion.ellipse
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.95, 1.05, 0.95] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      cx={cx}
      cy={cy}
      rx={overlay.rx}
      ry={overlay.ry}
      fill={color}
      filter="url(#glowFilter)"
    />
  );

  return (
    <g>
      {renderGlow(overlay.cx, overlay.cy)}
      {overlay.dual && renderGlow(100 - overlay.cx, overlay.cy)}
    </g>
  );
}

// ─── Componente Principal Unificado ──────────────────────────────────────────
export default function BodyMapCore({
  view = 'FRONT',
  activeGroup = null,
  onMuscleSelect,
  interactive = true,
  showLabels = true,
  className = ""
}) {
  const points = view === 'FRONT' ? FRONT_POINTS : BACK_POINTS;
  const imgSrc = view === 'FRONT' ? MAP_CONFIG.IMAGE_FRONT : MAP_CONFIG.IMAGE_BACK;
  
  // Lógica de overlay (glow)
  const muscleData = MUSCLE_OVERLAYS[activeGroup];
  const overlay = muscleData ? (view === 'FRONT' ? muscleData.front : muscleData.back) : null;

  return (
    <div className={`relative w-full h-full flex items-center justify-center bg-black/40 rounded-3xl overflow-hidden border border-white/5 ${className}`}>
      
      {/* ── SVG Unificado com Glows Integrados ── */}
      <svg
        viewBox={`0 0 ${MAP_CONFIG.VB_W} ${MAP_CONFIG.VB_H}`}
        className="h-full w-auto max-w-full drop-shadow-[0_0_40px_rgba(0,0,0,0.6)]"
        style={{ aspectRatio: '1/1' }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter id="glowFilter">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Silhueta */}
        <image
          href={imgSrc}
          x="0" y="0"
          width="100" height="100"
          className="opacity-70 transition-opacity duration-700"
          style={{ mixBlendMode: 'screen' }}
        />

        {/* Brilhos Musculares Sucessivos (Atrás dos labels) */}
        <AnimatePresence mode="wait">
          {activeGroup && overlay && (
            <MuscleGlowSVG 
              key={`glow-${activeGroup}-${view}`} 
              overlay={overlay} 
            />
          )}
        </AnimatePresence>

        {/* Labels e Pontos */}
        {showLabels && points.map(pt => (
          <LabelLineSVG
            key={pt.key}
            pt={pt}
            isActive={activeGroup === pt.key}
            onSelect={(key) => interactive && onMuscleSelect && onMuscleSelect(key)}
          />
        ))}
      </svg>

      {/* Efeito de Scanline Premium */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_2px,3px_100%]" />
    </div>
  );
}
