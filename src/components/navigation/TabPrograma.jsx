import React, { useState } from 'react';

const DAYS = [
  {
    id: 'push-a', name: 'Push A', day: 'Segunda',
    muscles: 'Peito · Ombro · Tríceps',
    warmup: ['5 min esteira leve 5 km/h','Rotação de ombros: 2×15 (frente e trás)','Band pull-apart: 2×20','Elevação lateral com band: 1×15 leve','1–2 séries leves no 1º composto (50–60%)'],
    exercises: [
      { name: 'Supino reto com barra', detail: 'Foco: peito, deltóide anterior, tríceps', sets: '4', reps: '5–7', rir: '1–2', rest: '2–3 min', type: 'compound' },
      { name: 'Desenvolvimento com halteres', detail: 'Escápula neutra, não elevar o trapézio', sets: '4', reps: '8–10', rir: '1–2', rest: '2 min', type: 'compound' },
      { name: 'Crucifixo inclinado halteres', detail: '30–45° de inclinação, alongamento no fundo', sets: '3', reps: '10–12', rir: '2', rest: '90 seg', type: 'iso' },
      { name: 'Elevação lateral com halteres', detail: 'Cotovelo levemente flexionado, foco deltóide medial', sets: '4', reps: '12–15', rir: '1', rest: '60 seg', type: 'iso' },
      { name: 'Tríceps pulley corda', detail: 'Separar a corda ao final, abrir o tríceps', sets: '3', reps: '12–15', rir: '1', rest: '60 seg', type: 'iso' },
      { name: 'Tríceps testa barra EZ', detail: 'Cotovelos fixos, amplitude total', sets: '3', reps: '10–12', rir: '1', rest: '60 seg', type: 'iso' },
    ],
    cardio: '20–25 min · 2 min 5 km/h + 2 min 8 km/h alternando',
  },
  {
    id: 'pull-a', name: 'Pull A', day: 'Terça',
    muscles: 'Costas · Bíceps · Face pull',
    warmup: ['5 min esteira leve','Rotação torácica em 4 apoios: 10 rep/lado','Dislocações com band: 2×10','Remada curvada leve: 1×15 aquecimento'],
    exercises: [
      { name: 'Barra fixa pronada', detail: 'Pegada larga, foco no V do dorso. Assistida se necessário', sets: '4', reps: '5–8', rir: '1–2', rest: '2–3 min', type: 'compound' },
      { name: 'Remada curvada com barra', detail: 'Tronco ~45°, puxar em direção ao umbigo', sets: '4', reps: '6–8', rir: '1–2', rest: '2–3 min', type: 'compound' },
      { name: 'Pulldown pegada neutra', detail: 'Cotovelos apontando para o chão, escápula retraída', sets: '3', reps: '10–12', rir: '2', rest: '90 seg', type: 'compound' },
      { name: 'Rosca direta barra EZ', detail: 'Cotovelos fixos ao corpo, excêntrico controlado', sets: '3', reps: '10–12', rir: '1', rest: '90 seg', type: 'iso' },
      { name: 'Rosca martelo halteres', detail: 'Foco braquial e braquiorradial', sets: '3', reps: '12–15', rir: '1', rest: '60 seg', type: 'iso' },
      { name: 'Face pull com corda', detail: 'Puxar para a testa, rotação externa — saúde do ombro', sets: '3', reps: '15–20', rir: '2', rest: '60 seg', type: 'iso' },
    ],
    cardio: '25–30 min · Caminhada 5–6 km/h + 2 blocos de corrida 8 km/h de 3 min',
  },
  {
    id: 'legs-a', name: 'Legs A', day: 'Quarta',
    muscles: 'Quadríceps · Glúteo · Panturrilha',
    warmup: ['5 min esteira leve','Mobilidade de tornozelo: 10 rep/lado','Abertura de quadril (mundo): 8 rep/lado','Agachamento sem carga: 2×10','1–2 séries leves no agachamento'],
    exercises: [
      { name: 'Agachamento livre com barra', detail: 'Quadríceps e glúteo · Profundidade total', sets: '4', reps: '5–7', rir: '1–2', rest: '3 min', type: 'compound' },
      { name: 'Leg press 45°', detail: 'Pés médios, amplitude total, não trancar o joelho', sets: '4', reps: '10–12', rir: '1', rest: '2 min', type: 'compound' },
      { name: 'Cadeira extensora', detail: 'Pico de contração, descida controlada em 3 seg', sets: '3', reps: '12–15', rir: '1', rest: '90 seg', type: 'iso' },
      { name: 'Stiff com halteres', detail: 'Foco isquiotibial — quadril dobra, não a lombar', sets: '3', reps: '10–12', rir: '2', rest: '90 seg', type: 'compound' },
      { name: 'Panturrilha em pé', detail: 'Amplitude total, pausa de 1 seg no alongamento', sets: '4', reps: '12–15', rir: '1', rest: '60 seg', type: 'iso' },
    ],
    cardio: '20 min caminhada 5–6 km/h apenas · Dia de pernas = cardio mais leve',
  },
  {
    id: 'upper-b', name: 'Upper B', day: 'Quinta',
    muscles: 'Peito · Costas · Ombro · Braços · Core',
    warmup: ['5 min esteira','Rotação de ombros + band pull-apart: 2×15','Rosca leve e tríceps leve: 1×15 cada'],
    exercises: [
      { name: 'Supino inclinado halteres', detail: 'Foco no feixe clavicular — ângulo diferente do Push A', sets: '4', reps: '8–10', rir: '1–2', rest: '2 min', type: 'compound' },
      { name: 'Remada cavalinho / máquina', detail: 'Pegada neutra, puxar para o umbigo', sets: '4', reps: '10–12', rir: '1–2', rest: '2 min', type: 'compound' },
      { name: 'Desenvolvimento Arnold', detail: 'Rotação no movimento, ativa todos os feixes do deltóide', sets: '3', reps: '10–12', rir: '2', rest: '90 seg', type: 'compound' },
      { name: 'Crucifixo cabo polia alta', detail: 'Cruzar as mãos na frente do quadril, tensão constante', sets: '3', reps: '12–15', rir: '1', rest: '60 seg', type: 'iso' },
      { name: 'Rosca concentrada halter', detail: 'Pico de contração obrigatório, excêntrico 3 seg', sets: '3', reps: '10–12', rir: '0–1', rest: '60 seg', type: 'iso' },
      { name: 'Tríceps francês halter', detail: 'Descida atrás da cabeça, cotovelos estáveis', sets: '3', reps: '12–15', rir: '1', rest: '60 seg', type: 'iso' },
      { name: 'Elevação lateral cabo baixo', detail: 'Tensão constante — superior ao halter no pico', sets: '3', reps: '15–20', rir: '1', rest: '60 seg', type: 'iso' },
      { name: 'Prancha abdominal', detail: 'Respiração diafragmática, não prender o ar', sets: '3', reps: '30–45 seg', rir: '—', rest: '45 seg', type: 'core' },
      { name: 'Crunch polia alta', detail: 'Flexão real de tronco — não puxada de pescoço', sets: '3', reps: '15–20', rir: '1', rest: '60 seg', type: 'core' },
      { name: 'Elevação de pernas na barra', detail: 'Controle total, sem balanço', sets: '3', reps: '12–15', rir: '1', rest: '60 seg', type: 'core' },
    ],
    cardio: '25 min · Blocos 2 min caminhada 5 km/h + 3 min corrida 7–8 km/h',
  },
  {
    id: 'legs-b', name: 'Legs B + Core', day: 'Sexta',
    muscles: 'Posterior · Búlgaro · Abdômen',
    warmup: ['5 min esteira','Hip hinge com bastão: 10 reps','Afundo sem carga: 2×8/lado','Mobilidade de tornozelo e quadril'],
    exercises: [
      { name: 'Levantamento terra convencional', detail: 'Foco posterior: isquiotibial, glúteo, lombar', sets: '4', reps: '4–6', rir: '1–2', rest: '3 min', type: 'compound' },
      { name: 'Agachamento búlgaro halteres', detail: 'Pé traseiro elevado, tronco levemente inclinado', sets: '3', reps: '8–10/lado', rir: '1–2', rest: '2 min', type: 'compound' },
      { name: 'Cadeira flexora (leg curl)', detail: 'Excêntrico de 3 seg, isquiotibial em comprimento', sets: '4', reps: '10–12', rir: '1', rest: '90 seg', type: 'iso' },
      { name: 'Hip thrust com barra', detail: 'Pico de extensão de quadril, glúteo no topo', sets: '3', reps: '12–15', rir: '1', rest: '90 seg', type: 'compound' },
      { name: 'Panturrilha sentado (sóleo)', detail: 'Joelho ~90°, foco no sóleo — diferente do Legs A', sets: '4', reps: '15–20', rir: '1', rest: '60 seg', type: 'iso' },
      { name: 'Dead bug', detail: 'Lombar colada no chão, movimento contralateral', sets: '3', reps: '10/lado', rir: '—', rest: '45 seg', type: 'core' },
      { name: 'Ab wheel (roda abdominal)', detail: 'Extensão parcial se não domina o movimento completo', sets: '3', reps: '8–12', rir: '1', rest: '60 seg', type: 'core' },
      { name: 'Bicicleta abdominal', detail: 'Rotação real do tronco, não do pescoço', sets: '3', reps: '20/lado', rir: '—', rest: '45 seg', type: 'core' },
    ],
    cardio: '20 min caminhada 5–6 km/h · Fim de semana = recuperação completa',
  },
];

const WEEKS = [
  { num: 1, type: 'Adaptação neural', deload: false, detail: 'Use pesos com que consiga completar todas as séries em RIR 3–4. Calibre as cargas e anote tudo.' },
  { num: 2, type: 'Volume inicial', deload: false, detail: 'Aumente a carga nos compostos se completou tudo na semana 1. Mantenha RIR 2–3.' },
  { num: 3, type: 'Carga progride', deload: false, detail: 'Completou todas as séries no topo? Sobe 2,5 kg nos compostos. RIR 1–2 nos principais.' },
  { num: 4, type: 'Maior intensidade', deload: false, detail: 'Semana mais pesada. Algumas séries chegam a RIR 0–1 nos isolados. Foco na execução.' },
  { num: 5, type: 'DELOAD', deload: true, detail: 'Carga a 50–60%, séries a 50%, RIR 4–5. Durma mais, coma bem. O crescimento acontece aqui.' },
  { num: 6, type: 'Reinício forte', deload: false, detail: 'Volte com as cargas máximas da semana 4. Registre os novos pesos. RIR 2 nos compostos.' },
  { num: 7, type: 'Progressão', deload: false, detail: 'Se travar, adicione uma rep por série antes de aumentar o peso.' },
  { num: 8, type: 'Volume alto', deload: false, detail: 'Maior volume do programa. Push e Pull podem ter +1 série extra nos compostos.' },
  { num: 9, type: 'Intensidade pico', deload: false, detail: 'Compostos RIR 1, isolados chegando ao RIR 0. Semana mais dura do programa.' },
  { num: 10, type: 'Consolidação', deload: false, detail: 'Mantenha as cargas da semana 9. Solidifique os ganhos sem mais fadiga.' },
  { num: 11, type: 'Teste de força', deload: false, detail: 'Teste 1–3 RMs nos compostos principais. Volume reduzido. Meça a evolução.' },
  { num: 12, type: 'DELOAD FINAL', deload: true, detail: 'Avalie as 12 semanas: meça, tire fotos, registre cargas. Próximo bloco começa aqui.' },
];

function ExerciseRow({ ex, idx, dayId }) {
  const key = `zyron_kg_${dayId}_${idx}`;
  const [kg, setKg] = React.useState(() => localStorage.getItem(key) || '');
  const [saved, setSaved] = React.useState(false);

  function save() {
    if (!kg) return;
    localStorage.setItem(key, kg);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  const typeColors = {
    compound: { bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.3)', text: '#a5b4fc', label: 'Composto' },
    iso:      { bg: 'rgba(34,197,94,0.10)', border: 'rgba(34,197,94,0.25)', text: '#86efac', label: 'Isolado' },
    core:     { bg: 'rgba(251,146,60,0.10)', border: 'rgba(251,146,60,0.25)', text: '#fdba74', label: 'Core' },
  };
  const tc = typeColors[ex.type] || typeColors.iso;

  const rirColor = ex.rir === '0–1' || ex.rir === '0'
    ? { bg: 'rgba(239,68,68,0.12)', text: '#fca5a5' }
    : ex.rir === '1' || ex.rir === '1–2'
    ? { bg: 'rgba(245,158,11,0.12)', text: '#fcd34d' }
    : { bg: 'rgba(34,197,94,0.10)', text: '#86efac' };

  return (
    <div style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 12 }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%', flexShrink: 0, marginTop: 1,
        background: tc.bg, border: `1px solid ${tc.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700, color: tc.text,
      }}>{idx + 1}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#f0f0f0', marginBottom: 2 }}>{ex.name}</div>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>{ex.detail}</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', fontWeight: 600 }}>{ex.sets} séries</span>
          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'rgba(34,197,94,0.10)', color: '#86efac', fontWeight: 600 }}>{ex.reps} reps</span>
          {ex.rir !== '—' && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: rirColor.bg, color: rirColor.text, fontWeight: 600 }}>RIR {ex.rir}</span>}
          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', color: '#666', fontWeight: 600 }}>{ex.rest}</span>
          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: tc.bg, color: tc.text, fontWeight: 600 }}>{tc.label}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: '#666', minWidth: 56 }}>Kg usado</span>
          <input
            type="number"
            value={kg}
            onChange={e => setKg(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && save()}
            placeholder="—"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f0f0f0', fontSize: 14, fontWeight: 600, padding: '5px 10px', width: 70, textAlign: 'center' }}
          />
          <button
            onClick={save}
            style={{ background: saved ? '#22c55e' : '#FFFFFF', color: '#000', border: 'none', borderRadius: 8, padding: '5px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            {saved ? '✓' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TabPrograma() {
  const dow = new Date().getDay();
  const todayMap = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 };
  const todayIdx = todayMap[dow] ?? 0;

  const [activeDay, setActiveDay] = useState(todayIdx);
  const [activeSection, setActiveSection] = useState('treino'); // treino | semanas
  const [selWeek, setSelWeek] = useState(0);

  const totalDays = parseInt(localStorage.getItem('zyron_prog_days') || '0');
  const currentWeek = Math.min(12, Math.floor(totalDays / 5) + 1);

  function markDone() {
    const key = `zyron_prog_done_${DAYS[activeDay].id}_${new Date().toDateString()}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, '1');
    localStorage.setItem('zyron_prog_days', totalDays + 1);
    alert('Treino marcado como concluído! 💪');
  }

  const day = DAYS[activeDay];
  const week = WEEKS[selWeek];

  return (
    <div style={{ paddingTop: 8 }}>
      {/* Header com semana atual */}
      <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 11, color: '#FFFFFF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Programa PPL + Upper</div>
          <div style={{ fontSize: 13, color: '#f0f0f0', fontWeight: 600 }}>Semana {currentWeek} de 12 · Frequência 2× por músculo</div>
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#FFFFFF' }}>{currentWeek}<span style={{ fontSize: 12, color: '#888' }}>/12</span></div>
      </div>

      {/* Tabs seção */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[['treino', '💪 Treino'], ['semanas', '📅 12 Semanas']].map(([id, label]) => (
          <button key={id} onClick={() => setActiveSection(id)} style={{
            flex: 1, padding: '8px 0', borderRadius: 10, border: `1px solid ${activeSection === id ? '#FFFFFF' : 'rgba(255,255,255,0.08)'}`,
            background: activeSection === id ? 'rgba(255,255,255,0.1)' : 'transparent',
            color: activeSection === id ? '#FFFFFF' : '#888', fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}>{label}</button>
        ))}
      </div>

      {/* SEÇÃO TREINO */}
      {activeSection === 'treino' && (
        <div>
          {/* Pills dos dias */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 2 }}>
            {DAYS.map((d, i) => (
              <button key={i} onClick={() => setActiveDay(i)} style={{
                flexShrink: 0, padding: '6px 14px', borderRadius: 20,
                border: `1px solid ${i === activeDay ? '#FFFFFF' : 'rgba(255,255,255,0.1)'}`,
                background: i === activeDay ? 'rgba(255,255,255,0.12)' : 'transparent',
                color: i === activeDay ? '#FFFFFF' : '#888', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
              }}>{d.name}</button>
            ))}
          </div>

          {/* Info do dia */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#f0f0f0', marginBottom: 2 }}>{day.name} <span style={{ fontSize: 12, color: '#888', fontWeight: 400 }}>· {day.day}</span></div>
            <div style={{ fontSize: 12, color: '#888' }}>{day.muscles}</div>
          </div>

          {/* Aquecimento */}
          <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 12, padding: 14, marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#4ade80', marginBottom: 8 }}>🔥 Aquecimento + Mobilidade (8–10 min)</div>
            {day.warmup.map((w, i) => (
              <div key={i} style={{ fontSize: 12, color: '#86efac', lineHeight: 2 }}>· {w}</div>
            ))}
          </div>

          {/* Exercícios */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '4px 16px', marginBottom: 12 }}>
            {day.exercises.map((ex, i) => (
              <ExerciseRow key={i} ex={ex} idx={i} dayId={day.id} />
            ))}
          </div>

          {/* Botão concluir */}
          <button onClick={markDone} style={{
            width: '100%', background: '#FFFFFF', color: '#000', border: 'none', borderRadius: 12,
            padding: 14, fontSize: 14, fontWeight: 800, cursor: 'pointer', marginBottom: 12,
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>✓ Marcar treino como feito</button>

          {/* Cardio */}
          <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#818cf8', marginBottom: 6 }}>🏃 Cardio pós-treino</div>
            <div style={{ fontSize: 12, color: '#a5b4fc', lineHeight: 1.7 }}>{day.cardio}</div>
          </div>
        </div>
      )}

      {/* SEÇÃO 12 SEMANAS */}
      {activeSection === 'semanas' && (
        <div>
          <div style={{ fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Toque para ver os detalhes</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
            {WEEKS.map((w, i) => (
              <button key={i} onClick={() => setSelWeek(i)} style={{
                background: w.deload ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.03)',
                border: `${i === selWeek ? 2 : 1}px solid ${i === selWeek ? '#FFFFFF' : w.deload ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 10, padding: 10, textAlign: 'center', cursor: 'pointer',
              }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: w.deload ? '#fbbf24' : '#f0f0f0' }}>S{w.num}</div>
                <div style={{ fontSize: 9, color: w.deload ? '#f59e0b' : '#666', marginTop: 2 }}>{w.deload ? '🔄 Deload' : w.type.split(' ')[0]}</div>
              </button>
            ))}
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: week.deload ? '#fbbf24' : '#FFFFFF', marginBottom: 8 }}>
              Semana {week.num} — {week.type}
            </div>
            <div style={{ fontSize: 13, color: '#aaa', lineHeight: 1.7 }}>{week.detail}</div>
          </div>

          {/* Regra de progressão */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Regra de Progressão de Carga</div>
            {[
              ['Compostos pesados', '+2,5 kg quando completar todas as séries no topo'],
              ['Compostos auxiliares', '+2 kg quando completar todas as séries no topo'],
              ['Isolados', '+1–2 kg ou +1 rep por série'],
              ['Core', '+2–3 reps ou progressão de exercício'],
            ].map(([k, v]) => (
              <div key={k} style={{ paddingBottom: 10, marginBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#f0f0f0' }}>{k}</div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{v}</div>
              </div>
            ))}
            <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
              <strong style={{ color: '#FFFFFF' }}>Deload</strong>: Semanas 5 e 12 — carga 50–60%, séries 50%, RIR 4–5
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
