import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MAP_CONFIG, FRONT_POINTS, BACK_POINTS } from '../../data/bodyMapPoints';
import { RotateCcw, Copy, Check } from 'lucide-react';

const DraggablePoint = ({ pt, onDrag, isActive }) => {
  return (
    <motion.g
      drag
      dragMomentum={false}
      onDrag={(e, info) => onDrag(pt.key, info.point)}
      style={{ cursor: 'grab' }}
      whileTap={{ cursor: 'grabbing' }}
    >
      <circle
        cx={pt.x}
        cy={pt.y}
        r="2.5"
        fill={isActive ? '#facc15' : '#ef4444'}
        stroke="white"
        strokeWidth="0.5"
      />
      <text
        x={pt.x + 3}
        y={pt.y + 1}
        fontSize="3"
        fill="white"
        fontWeight="bold"
        style={{ pointerEvents: 'none', filter: 'drop-shadow(0 1px 2px black)' }}
      >
        {pt.label} ({pt.x.toFixed(0)}, {pt.y.toFixed(0)})
      </text>
    </motion.g>
  );
};

export default function BodyMapEditor() {
  const [view, setView] = useState('FRONT');
  const [points, setPoints] = useState(view === 'FRONT' ? FRONT_POINTS : BACK_POINTS);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setPoints(view === 'FRONT' ? FRONT_POINTS : BACK_POINTS);
  }, [view]);

  const handleDrag = (key, rawPoint) => {
    // Converter coordenadas de tela (pixel) para o viewBox (0-100)
    // O ideal é usar o SVG local coordinate, mas para simplificar
    // usaremos uma aproximação baseada na variação do drag
    // No entanto, para precisão absoluta, o ideal é o clique direto no SVG.
  };

  const handleSvgClick = (e) => {
    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
    
    // Atualiza o último ponto ativo ou o primeiro carregado
    const x = +svgP.x.toFixed(1);
    const y = +svgP.y.toFixed(1);

    // No modo editor, vamos apenas logar ou atualizar o ponto selecionado
    console.log(`NOVA COORDENADA → x: ${x}, y: ${y}`);
  };

  const copyToClipboard = () => {
    const output = JSON.stringify(points, (key, value) => {
        if (typeof value === 'number') return +value.toFixed(1);
        return value;
    }, 2);
    
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] rounded-3xl border border-white/5 overflow-hidden relative">
      {/* HUD Superior */}
      <div className="p-4 bg-black/40 border-b border-white/5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-widest">Body Map Editor</h3>
          <p className="text-[10px] text-neutral-500 uppercase font-bold mt-1">Calibre os pontos clicando na silhueta</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setView(v => v === 'FRONT' ? 'BACK' : 'FRONT')}
            className="p-2 bg-neutral-900 rounded-full text-white hover:bg-neutral-800 transition"
          >
            <RotateCcw size={16} />
          </button>
          <button 
            onClick={copyToClipboard}
            className="flex items-center gap-2 px-3 py-2 bg-yellow-400 rounded-xl text-black text-[10px] font-black uppercase tracking-widest hover:bg-yellow-500 transition"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copiado' : 'Copiar JSON'}
          </button>
        </div>
      </div>

      {/* Área de Calibração */}
      <div className="flex-1 relative flex items-center justify-center p-4">
        <svg
          viewBox={`0 0 ${MAP_CONFIG.VB_W} ${MAP_CONFIG.VB_H}`}
          className="h-full w-auto max-w-full cursor-crosshair"
          onClick={handleSvgClick}
        >
          <image
            href={view === 'FRONT' ? MAP_CONFIG.IMAGE_FRONT : MAP_CONFIG.IMAGE_BACK}
            width="100" height="100"
            className="opacity-60"
            style={{ mixBlendMode: 'screen' }}
          />
          
          {/* Grade de Precisão */}
          <g opacity="0.1" pointerEvents="none">
            {[10,20,30,40,50,60,70,80,90].map(v => (
              <React.Fragment key={v}>
                <line x1={v} y1={0} x2={v} y2={100} stroke="#fff" strokeWidth="0.1" />
                <line x1={0} y1={v} x2={100} y2={v} stroke="#fff" strokeWidth="0.1" />
              </React.Fragment>
            ))}
          </g>

          {/* Pontos Atuais */}
          {points.map(pt => (
            <circle
              key={pt.key}
              cx={pt.x}
              cy={pt.y}
              r="1.2"
              fill="#facc15"
              stroke="black"
              strokeWidth="0.3"
            />
          ))}
        </svg>

        {/* Instruções overlay */}
        <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
          <span className="bg-black/80 px-4 py-2 rounded-full border border-white/10 text-[9px] font-black text-yellow-400 uppercase tracking-widest">
            Clique na silhueta e veja o log (F12) para x/y
          </span>
        </div>
      </div>
    </div>
  );
}
