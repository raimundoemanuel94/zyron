// ─── PROGRAMA PPL + UPPER — 12 SEMANAS ───────────────────────────────────────
// Baseado em evidências científicas para hipertrofia natural
// Frequência: 2× por músculo/semana | Seg–Sex

export const workoutData = {

  // SEGUNDA — Push A
  1: {
    title: 'Push A',
    focus: 'Peito · Ombro · Tríceps',
    image: '/images/chest.png',
    warmup: [
      '5 min esteira leve 5 km/h',
      'Rotação de ombros: 2×15 (frente e trás)',
      'Band pull-apart: 2×20',
      'Elevação lateral com band: 1×15 leve',
      '1–2 séries leves no 1º composto (50–60%)',
    ],
    exercises: [
      { id: 'pa1', name: 'Supino Reto com Barra',        group: 'Peito',   sets: 4, reps: '5–7',   rir: '1–2', rest: 150, type: 'compound', detail: 'Foco: peito, deltóide anterior, tríceps' },
      { id: 'pa2', name: 'Desenvolvimento com Halteres', group: 'Ombro',   sets: 4, reps: '8–10',  rir: '1–2', rest: 120, type: 'compound', detail: 'Escápula neutra, não elevar o trapézio' },
      { id: 'pa3', name: 'Crucifixo Inclinado Halteres', group: 'Peito',   sets: 3, reps: '10–12', rir: '2',   rest: 90,  type: 'iso',      detail: '30–45° de inclinação, alongamento no fundo' },
      { id: 'pa4', name: 'Elevação Lateral Halteres',    group: 'Ombro',   sets: 4, reps: '12–15', rir: '1',   rest: 60,  type: 'iso',      detail: 'Cotovelo levemente flexionado, foco deltóide medial' },
      { id: 'pa5', name: 'Tríceps Pulley Corda',         group: 'Tríceps', sets: 3, reps: '12–15', rir: '1',   rest: 60,  type: 'iso',      detail: 'Separar a corda ao final, abrir o tríceps' },
      { id: 'pa6', name: 'Tríceps Testa Barra EZ',       group: 'Tríceps', sets: 3, reps: '10–12', rir: '1',   rest: 60,  type: 'iso',      detail: 'Cotovelos fixos, amplitude total' },
    ],
    cardio: 'Esteira 20–25 min · 2 min 5 km/h + 2 min 8 km/h alternando',
    cooldown: [
      'Alongamento de peitoral na parede: 30s cada lado',
      'Alongamento de tríceps atrás da cabeça: 30s cada braço',
      'Alongamento de ombro cruzado no peito: 30s cada lado',
    ],
  },

  // TERÇA — Pull A
  2: {
    title: 'Pull A',
    focus: 'Costas · Bíceps · Face pull',
    image: '/images/back.png',
    warmup: [
      '5 min esteira leve',
      'Rotação torácica em 4 apoios: 10 rep/lado',
      'Dislocações com band: 2×10',
      'Remada curvada leve: 1×15 aquecimento',
    ],
    exercises: [
      { id: 'pla1', name: 'Barra Fixa Pronada',          group: 'Costas', sets: 4, reps: '5–8',   rir: '1–2', rest: 150, type: 'compound', detail: 'Pegada larga, foco no V do dorso. Assistida se necessário' },
      { id: 'pla2', name: 'Remada Curvada com Barra',    group: 'Costas', sets: 4, reps: '6–8',   rir: '1–2', rest: 150, type: 'compound', detail: 'Tronco ~45°, puxar em direção ao umbigo' },
      { id: 'pla3', name: 'Pulldown Pegada Neutra',      group: 'Costas', sets: 3, reps: '10–12', rir: '2',   rest: 90,  type: 'compound', detail: 'Cotovelos apontando para o chão, escápula retraída' },
      { id: 'pla4', name: 'Rosca Direta Barra EZ',       group: 'Bíceps', sets: 3, reps: '10–12', rir: '1',   rest: 90,  type: 'iso',      detail: 'Cotovelos fixos ao corpo, excêntrico controlado' },
      { id: 'pla5', name: 'Rosca Martelo Halteres',      group: 'Bíceps', sets: 3, reps: '12–15', rir: '1',   rest: 60,  type: 'iso',      detail: 'Foco braquial e braquiorradial' },
      { id: 'pla6', name: 'Face Pull com Corda',         group: 'Ombro',  sets: 3, reps: '15–20', rir: '2',   rest: 60,  type: 'iso',      detail: 'Puxar para a testa, rotação externa — saúde do ombro' },
    ],
    cardio: 'Esteira 25–30 min · Caminhada 5–6 km/h + 2 blocos corrida 8 km/h de 3 min',
    cooldown: [
      'Alongamento de dorsal pendurado ou sentado: 30s',
      'Alongamento de bíceps com braço estendido na parede: 30s cada lado',
      'Rotação de ombros lenta: 10 reps cada direção',
    ],
  },

  // QUARTA — Legs A
  3: {
    title: 'Legs A',
    focus: 'Quadríceps · Glúteo · Panturrilha',
    image: '/images/legs.png',
    warmup: [
      '5 min esteira leve',
      'Mobilidade de tornozelo: 10 rep/lado',
      'Abertura de quadril (mundo): 8 rep/lado',
      'Agachamento sem carga: 2×10',
      '1–2 séries leves no agachamento principal',
    ],
    exercises: [
      { id: 'la1', name: 'Agachamento Livre com Barra', group: 'Quadríceps',  sets: 4, reps: '5–7',   rir: '1–2', rest: 180, type: 'compound', detail: 'Profundidade total se mobilidade permitir' },
      { id: 'la2', name: 'Leg Press 45°',               group: 'Quadríceps',  sets: 4, reps: '10–12', rir: '1',   rest: 120, type: 'compound', detail: 'Pés médios, amplitude total, não trancar o joelho' },
      { id: 'la3', name: 'Cadeira Extensora',           group: 'Quadríceps',  sets: 3, reps: '12–15', rir: '1',   rest: 90,  type: 'iso',      detail: 'Pico de contração, descida controlada em 3 seg' },
      { id: 'la4', name: 'Stiff com Halteres',          group: 'Isquiotibial',sets: 3, reps: '10–12', rir: '2',   rest: 90,  type: 'compound', detail: 'Foco isquiotibial — quadril dobra, não a lombar' },
      { id: 'la5', name: 'Panturrilha em Pé',           group: 'Panturrilha', sets: 4, reps: '12–15', rir: '1',   rest: 60,  type: 'iso',      detail: 'Amplitude total, pausa de 1 seg no alongamento' },
    ],
    cardio: 'Esteira 20 min caminhada 5–6 km/h apenas · Dia de pernas = cardio mais leve',
    cooldown: [
      'Alongamento de quadríceps em pé: 30s cada perna',
      'Alongamento de panturrilha na parede: 30s cada perna',
      'Alongamento de isquiotibiais sentado: 30s cada perna',
    ],
  },

  // QUINTA — Upper B
  4: {
    title: 'Upper B',
    focus: 'Peito · Costas · Ombro · Braços · Core',
    image: '/images/chest.png',
    warmup: [
      '5 min esteira',
      'Rotação de ombros + band pull-apart: 2×15',
      'Rosca leve e tríceps leve: 1×15 cada',
    ],
    exercises: [
      { id: 'ub1',  name: 'Supino Inclinado Halteres',    group: 'Peito',   sets: 4, reps: '8–10',  rir: '1–2', rest: 120, type: 'compound', detail: 'Foco no feixe clavicular — ângulo diferente do Push A' },
      { id: 'ub2',  name: 'Remada Cavalinho / Máquina',   group: 'Costas',  sets: 4, reps: '10–12', rir: '1–2', rest: 120, type: 'compound', detail: 'Pegada neutra, puxar para o umbigo' },
      { id: 'ub3',  name: 'Desenvolvimento Arnold',       group: 'Ombro',   sets: 3, reps: '10–12', rir: '2',   rest: 90,  type: 'compound', detail: 'Rotação no movimento, ativa todos os feixes do deltóide' },
      { id: 'ub4',  name: 'Crucifixo Cabo Polia Alta',    group: 'Peito',   sets: 3, reps: '12–15', rir: '1',   rest: 60,  type: 'iso',      detail: 'Cruzar as mãos na frente do quadril, tensão constante' },
      { id: 'ub5',  name: 'Rosca Concentrada Halter',     group: 'Bíceps',  sets: 3, reps: '10–12', rir: '0–1', rest: 60,  type: 'iso',      detail: 'Pico de contração obrigatório, excêntrico 3 seg' },
      { id: 'ub6',  name: 'Tríceps Francês Halter',       group: 'Tríceps', sets: 3, reps: '12–15', rir: '1',   rest: 60,  type: 'iso',      detail: 'Descida atrás da cabeça, cotovelos estáveis' },
      { id: 'ub7',  name: 'Elevação Lateral Cabo Baixo',  group: 'Ombro',   sets: 3, reps: '15–20', rir: '1',   rest: 60,  type: 'iso',      detail: 'Tensão constante — superior ao halter no pico' },
      { id: 'ub8',  name: 'Prancha Abdominal',            group: 'Core',    sets: 3, reps: '30–45s',rir: '—',   rest: 45,  type: 'core',     detail: 'Respiração diafragmática, não prender o ar' },
      { id: 'ub9',  name: 'Crunch Polia Alta',            group: 'Core',    sets: 3, reps: '15–20', rir: '1',   rest: 60,  type: 'core',     detail: 'Flexão real de tronco — não puxada de pescoço' },
      { id: 'ub10', name: 'Elevação de Pernas na Barra',  group: 'Core',    sets: 3, reps: '12–15', rir: '1',   rest: 60,  type: 'core',     detail: 'Controle total, sem balanço' },
    ],
    cardio: 'Esteira 25 min · Blocos 2 min caminhada 5 km/h + 3 min corrida 7–8 km/h',
    cooldown: [
      'Alongamento de peitoral e ombro: 30s cada lado',
      'Alongamento de abdômen em extensão (cobra): 30s',
      'Respiração profunda controlada: 5 ciclos lentos',
    ],
  },

  // SEXTA — Legs B + Core
  5: {
    title: 'Legs B + Core',
    focus: 'Posterior · Búlgaro · Abdômen',
    image: '/images/legs.png',
    warmup: [
      '5 min esteira',
      'Hip hinge com bastão: 10 reps',
      'Afundo sem carga: 2×8/lado',
      'Mobilidade de tornozelo e quadril',
    ],
    exercises: [
      { id: 'lb1', name: 'Levantamento Terra Convencional', group: 'Posterior',   sets: 4, reps: '4–6',   rir: '1–2', rest: 180, type: 'compound', detail: 'Foco posterior: isquiotibial, glúteo, lombar' },
      { id: 'lb2', name: 'Agachamento Búlgaro Halteres',   group: 'Quadríceps',  sets: 3, reps: '8–10/l', rir: '1–2', rest: 120, type: 'compound', detail: 'Pé traseiro elevado, tronco levemente inclinado' },
      { id: 'lb3', name: 'Cadeira Flexora (Leg Curl)',      group: 'Isquiotibial',sets: 4, reps: '10–12', rir: '1',   rest: 90,  type: 'iso',      detail: 'Excêntrico de 3 seg, isquiotibial em comprimento' },
      { id: 'lb4', name: 'Hip Thrust com Barra',           group: 'Glúteo',      sets: 3, reps: '12–15', rir: '1',   rest: 90,  type: 'compound', detail: 'Pico de extensão de quadril, glúteo no topo' },
      { id: 'lb5', name: 'Panturrilha Sentado (Sóleo)',    group: 'Panturrilha', sets: 4, reps: '15–20', rir: '1',   rest: 60,  type: 'iso',      detail: 'Joelho ~90°, foco no sóleo — diferente do Legs A' },
      { id: 'lb6', name: 'Dead Bug',                       group: 'Core',        sets: 3, reps: '10/lado',rir: '—',   rest: 45,  type: 'core',     detail: 'Lombar colada no chão, movimento contralateral' },
      { id: 'lb7', name: 'Ab Wheel (Roda Abdominal)',      group: 'Core',        sets: 3, reps: '8–12',  rir: '1',   rest: 60,  type: 'core',     detail: 'Extensão parcial se não domina o movimento completo' },
      { id: 'lb8', name: 'Bicicleta Abdominal',            group: 'Core',        sets: 3, reps: '20/lado',rir: '—',   rest: 45,  type: 'core',     detail: 'Rotação real do tronco, não do pescoço' },
    ],
    cardio: 'Esteira 20 min caminhada 5–6 km/h · Fim de semana = recuperação completa',
    cooldown: [
      'Alongamento de glúteo cruzado deitado: 30s cada lado',
      'Alongamento de isquiotibiais e lombar: 30s',
      'Alongamento de panturrilha: 30s cada perna',
    ],
  },

  // SÁBADO e DOMINGO — Descanso
  0: { title: 'Descanso Ativo', focus: 'Recuperação — Você merece!', exercises: [], cardio: 'Caminhada leve 20–30 min (opcional)' },
  6: { title: 'Descanso Ativo', focus: 'Recuperação — Você merece!', exercises: [], cardio: 'Caminhada leve 20–30 min (opcional)' },
};
