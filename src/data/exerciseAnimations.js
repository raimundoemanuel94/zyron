// free-exercise-db image base via raw GitHub (sem CORS / ORB blocking em img tags)
// Cada exercício tem 2 frames: /0.jpg (início) e /1.jpg (contração)
// Path correto: /exercises/{id}/0.jpg  (sem /images/ no meio)

const BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';

export const gif = (dbId) => ({
  frame0: `${BASE}/${dbId}/0.jpg`,
  frame1: `${BASE}/${dbId}/1.jpg`,
});

export const EXERCISE_ANIMATIONS = {

  // ──────────────────────────────── PEITO ────────────────────────────────
  'p1': {
    ...gif('Barbell_Bench_Press'),
    muscles: ['Peitorais', 'Tríceps', 'Deltoide Anterior'],
    tip: 'Escápulas retraídas, pés firmes no chão.',
    instructions: [
      'Deite no banco plano com a barra acima do peito.',
      'Agarre a barra ligeiramente mais larga que os ombros.',
      'Desça a barra de forma controlada até o peito baixo/esterno.',
      'Empurre a barra para cima até os braços quase estendidos.',
    ],
  },

  'p2': {
    ...gif('Dumbbell_Incline_Bench_Press'),
    muscles: ['Peitorais (clavicular)', 'Deltoide Anterior', 'Tríceps'],
    tip: 'Cotovelos a 45° do tronco, controle a descida.',
    instructions: [
      'Ajuste o banco para 30–45° de inclinação.',
      'Segure os halteres na altura do peito, palmas à frente.',
      'Empurre os halteres para cima convergindo levemente.',
      'Desça de forma controlada até o nível do peito.',
    ],
  },

  'p_cm': {
    ...gif('Pec_Deck_Flyes'),
    muscles: ['Peitorais', 'Coracobraquial'],
    tip: 'Pressione os padres no final para recrutar ao máximo.',
    instructions: [
      'Sente-se com as costas no encosto e ajuste a altura do assento.',
      'Posicione os braços nos apoios com cotovelos a 90°.',
      'Aproxime os braços na frente do peito espremendo o peitoral.',
      'Retorne lentamente até a posição inicial.',
    ],
  },

  'p3': {
    ...gif('Cable_Crossover'),
    muscles: ['Peitorais', 'Deltoide Anterior'],
    tip: 'Mantenha um leve arco nas costas e cotovelos ligeiramente dobrados.',
    instructions: [
      'Posicione as polias acima da cabeça e selecione o peso.',
      'Passe um passo à frente e incline levemente o tronco.',
      'Puxe os cabos para baixo e centro cruzando os punhos.',
      'Retorne de forma controlada sentindo a abertura do peito.',
    ],
  },

  // ──────────────────────────────── TRÍCEPS ────────────────────────────────
  't2': {
    ...gif('Triceps_Pushdown'),
    muscles: ['Tríceps (todas as cabeças)'],
    tip: 'Cotovelos fixos ao corpo, extensão completa no fim.',
    instructions: [
      'Ajuste a polia alta e encaixe a corda.',
      'Posicione os cotovelos presos ao tronco.',
      'Estenda os braços para baixo separando as extremidades da corda.',
      'Volte controladamente até os cotovelos a 90°.',
    ],
  },

  't3': {
    ...gif('Barbell_Lying_Triceps_Extension'),
    muscles: ['Tríceps (cabeça longa)'],
    tip: 'Testa próxima ao chão, não deixe os cotovelos abrirem.',
    instructions: [
      'Deite no banco com a barra EZ acima do peito.',
      'Mãos próximas, cotovelos apontados para cima.',
      'Dobre os cotovelos abaixando a barra em direção à testa.',
      'Estenda os braços de volta à posição inicial.',
    ],
  },

  't_mb': {
    ...gif('Bench_Dips'),
    muscles: ['Tríceps', 'Deltóide Anterior', 'Peitorais'],
    tip: 'Mantenha o corpo próximo ao banco, costas retas.',
    instructions: [
      'Apoie as palmas num banco atrás de você, dedos para frente.',
      'Pernas estendidas à sua frente no chão ou num segundo banco.',
      'Dobre os cotovelos abaixando o quadril até 90°.',
      'Empurre para cima voltando à posição inicial.',
    ],
  },

  // ──────────────────────────────── COSTAS ────────────────────────────────
  'c1': {
    ...gif('Wide-Grip_Lat_Pulldown'),
    muscles: ['Latíssimo do Dorso', 'Romboides', 'Bíceps'],
    tip: 'Puxe até a clavícula, retração de escápula no final.',
    instructions: [
      'Sente-se na máquina e prenda os joelhos no apoio.',
      'Agarre a barra com pegada ampla pronada.',
      'Puxe a barra até a clavícula retraindo as escápulas.',
      'Retorne de forma controlada sentindo a abertura do dorso.',
    ],
  },

  'c_rc': {
    ...gif('Barbell_Bent_Over_Row'),
    muscles: ['Latíssimo do Dorso', 'Romboides', 'Trapézio Médio'],
    tip: 'Costas planas, puxe até o umbigo.',
    instructions: [
      'Incline o tronco a 45° segurando a barra com pegada pronada.',
      'Mantenha as costas neutras e joelhos levemente dobrados.',
      'Puxe a barra em direção ao umbigo retraindo as escápulas.',
      'Desça lentamente com controle total.',
    ],
  },

  'c_rm': {
    ...gif('Seated_Cable_Rows'),
    muscles: ['Latíssimo do Dorso', 'Romboides', 'Bíceps'],
    tip: 'Tronco ereto, cotovelos próximos ao corpo.',
    instructions: [
      'Sente-se na máquina com os pés nos apoios.',
      'Agarre o triângulo e mantenha o tronco ereto.',
      'Puxe o triângulo até o abdômen retraindo as escápulas.',
      'Retorne lentamente à extensão completa.',
    ],
  },

  'c_pd': {
    ...gif('Close-Grip_Front_Lat_Pulldown'),
    muscles: ['Latíssimo do Dorso', 'Bíceps', 'Redondo Maior'],
    tip: 'Pegada supinada, foque no latíssimo.',
    instructions: [
      'Use a barra com pegada fechada supinada (palmas para você).',
      'Sente-se com os joelhos presos e tronco levemente inclinado.',
      'Puxe a barra até a clavícula espremendo os cotovelos para baixo.',
      'Retorne controlado até extensão total dos braços.',
    ],
  },

  // ──────────────────────────────── BÍCEPS ────────────────────────────────
  'b1': {
    ...gif('Barbell_Curl'),
    muscles: ['Bíceps Braquial', 'Braquial'],
    tip: 'Cotovelos fixos ao corpo, não balance o tronco.',
    instructions: [
      'Fique de pé segurando a barra com pegada supinada (palmas para cima).',
      'Mantenha os cotovelos presos ao tronco.',
      'Curve a barra até os bíceps contrair totalmente.',
      'Desça de forma lenta e controlada.',
    ],
  },

  'b_ra': {
    ...gif('Hammer_Curls'),
    muscles: ['Bíceps', 'Braquiorradial (antebraço)'],
    tip: 'Polegares para cima, movimento alternado e controlado.',
    instructions: [
      'Fique de pé com um halter em cada mão, polegares para cima.',
      'Mantenha os cotovelos presos ao tronco.',
      'Curve um halter de cada vez em direção ao ombro.',
      'Alterne os lados mantendo o tronco estático.',
    ],
  },

  'b3': {
    ...gif('Concentration_Curl'),
    muscles: ['Bíceps Braquial (pico)'],
    tip: 'Cotovelão apoiado na coxa, isolamento total.',
    instructions: [
      'Sente-se num banco com as pernas abertas.',
      'Apoie o cotovelo na parte interna da coxa com o halter.',
      'Curve o halter em direção ao ombro contraindo ao máximo.',
      'Desça lentamente até a extensão completa do braço.',
    ],
  },

  // ──────────────────────────────── PERNA ────────────────────────────────
  'l1': {
    ...gif('Barbell_Squat'),
    muscles: ['Quadríceps', 'Glúteos', 'Isquiotibiais', 'Core'],
    tip: 'Joelhos alinhados com os pés, peito erguido, desça até 90°.',
    instructions: [
      'Barra apoiada nos trapézios médios, pés na largura dos ombros.',
      'Mantenha o peito alto e a lombar neutra.',
      'Desça como se fosse sentar em uma cadeira até 90° de quadril.',
      'Empurre pelo calcanhar para voltar à posição inicial.',
    ],
  },

  'l2': {
    ...gif('Leg_Press'),
    muscles: ['Quadríceps', 'Glúteos', 'Isquiotibiais'],
    tip: 'Pés largos = mais glúteo. Pés centralizados = mais quadríceps.',
    instructions: [
      'Sente-se na cadeira e posicione os pés na plataforma.',
      'Destrave e dobre os joelhos até 90° de forma controlada.',
      'Empurre a plataforma com força sem travar os joelhos no final.',
      'Retorne lentamente sob controle.',
    ],
  },

  'l3': {
    ...gif('Leg_Extensions'),
    muscles: ['Quadríceps (isolamento)'],
    tip: 'Contraia no alto por 1 segundo, desça lentamente.',
    instructions: [
      'Sente-se na cadeira extensora com as costas apoiadas.',
      'Posicione as espumas no início da canela.',
      'Estenda as pernas até elas ficarem paralelas ao chão.',
      'Desça devagar resistindo ao peso.',
    ],
  },

  'l4': {
    ...gif('Lying_Leg_Curls'),
    muscles: ['Isquiotibiais', 'Panturrilha'],
    tip: 'Quadril pressionado no banco, não jogue o corpo.',
    instructions: [
      'Deite de bruços na mesa flexora com as espumas nos calcanhares.',
      'Mantenha o quadril pressionado no banco.',
      'Dobre os joelhos puxando os calcanhares em direção ao glúteo.',
      'Retorne devagar à posição estendida.',
    ],
  },

  'l_st': {
    ...gif('Romanian_Deadlift'),
    muscles: ['Isquiotibiais', 'Glúteos', 'Lombar'],
    tip: 'Barra rente ao corpo, descida até sentir o alongamento.',
    instructions: [
      'Fique de pé com a barra na frente das coxas.',
      'Empurre o quadril para trás enquanto desliza a barra pela perna.',
      'Desça até sentir forte alongamento nos isquiotibiais.',
      'Contraia o glúteo para retornar à posição vertical.',
    ],
  },

  'l_ep': {
    ...gif('Weighted_Glute_Bridge'),
    muscles: ['Glúteos', 'Isquiotibiais', 'Core'],
    tip: 'Empurre com calcanhar, contraia o glúteo no topo por 2s.',
    instructions: [
      'Deite de costas com os joelhos dobrados e pés no chão.',
      'Coloque a barra ou halter sobre o quadril.',
      'Empurre o quadril para cima usando o calcanhar.',
      'Contraia o glúteo no topo por 2 segundos e desça.',
    ],
  },

  // ──────────────────────────────── PANTURRILHA ────────────────────────────────
  'ca1': {
    ...gif('Standing_Calf_Raises'),
    muscles: ['Gastrocnêmio', 'Sóleo'],
    tip: 'Amplitude completa — calcanhar abaixo do degrau.',
    instructions: [
      'Fique na ponta dos pés num degrau ou plataforma.',
      'Deixe os calcanhares cair abaixo do nível do degrau.',
      'Suba na ponta dos pés o mais alto possível.',
      'Desça lentamente sentindo o alongamento da panturrilha.',
    ],
  },

  'ca_s': {
    ...gif('Seated_Calf_Raise'),
    muscles: ['Sóleo', 'Gastrocnêmio'],
    tip: 'Joelhos a 90°, foque no Sóleo (diferente do em pé).',
    instructions: [
      'Sente-se na máquina com os pés na plataforma.',
      'Posicione os joelhos sob o apoio e solte a trava.',
      'Empurre os calcanhares para baixo subindo na ponta dos pés.',
      'Desça lentamente até o pleno alongamento.',
    ],
  },

  // ──────────────────────────────── OMBRO ────────────────────────────────
  's1': {
    ...gif('Dumbbell_Shoulder_Press'),
    muscles: ['Deltoide Anterior e Lateral', 'Tríceps', 'Trapézio'],
    tip: 'Cotovelos a 90° com o chão, não trave os cotovelos no topo.',
    instructions: [
      'Sente-se no banco vertical com halteres na altura dos ombros.',
      'Palmas voltadas para frente, cotovelos a 90°.',
      'Empurre os halteres para cima convergindo levemente.',
      'Desça controlado até os ombros ficarem a 90°.',
    ],
  },

  's2': {
    ...gif('Side_Lateral_Raise'),
    muscles: ['Deltoide Lateral (medial)'],
    tip: 'Cotovelos levemente dobrados, suba até a linha dos ombros.',
    instructions: [
      'Fique de pé com halteres ao lado do corpo.',
      'Mantenha os cotovelos levemente dobrados.',
      'Eleve os braços lateralmente até a altura dos ombros.',
      'Desça lentamente resistindo ao peso.',
    ],
  },

  's3': {
    ...gif('Dumbbell_Front_Raise'),
    muscles: ['Deltoide Anterior'],
    tip: 'Controle o eccêntrico, não balance o tronco.',
    instructions: [
      'Fique de pé com halteres na frente das coxas.',
      'Levante um braço de cada vez (ou os dois) à frente.',
      'Suba até a linha dos ombros com o braço estendido.',
      'Desça devagar até a posição inicial.',
    ],
  },

  's4': {
    ...gif('Reverse_Flyes'),
    muscles: ['Deltoide Posterior', 'Romboides', 'Trapézio Médio'],
    tip: 'Cotovelos levemente dobrados, retração de escápula.',
    instructions: [
      'Incline o tronco a 45° para frente com halteres abaixo do peito.',
      'Cotovelos ligeiramente dobrados, palmas opostas.',
      'Eleve os braços lateralmente retraindo as escápulas.',
      'Desça devagar sentindo contração nos deltoides posteriores.',
    ],
  },

  's_et': {
    ...gif('Barbell_Shrug'),
    muscles: ['Trapézio Superior'],
    tip: 'Suba direto, sem rotação. Segure 1 segundo no topo.',
    instructions: [
      'Fique de pé segurando a barra na frente com pegada pronada.',
      'Braços estendidos, postura ereta.',
      'Levante os ombros o mais alto possível (encolhimento).',
      'Segure 1s no topo e desça de forma controlada.',
    ],
  },

  // ──────────────────────────────── BÍCEPS (dia 5) ────────────────────────────────
  'b_rw': {
    ...gif('Barbell_Curl'),
    muscles: ['Bíceps Braquial', 'Braquial'],
    tip: 'Barra EZ reduz stress no pulso. Cotovelos fixos.',
    instructions: [
      'Segure a barra EZ com pegada supinada na posição mais larga.',
      'Cotovelos ao corpo e tronco completamente estático.',
      'Cure a barra até a contração máxima.',
      'Desça lentamente à extensão total.',
    ],
  },

  'b2': {
    ...gif('Hammer_Curls'),
    muscles: ['Bíceps', 'Braquiorradial (antebraço)'],
    tip: 'Neutro (polegares para cima), movimento unilateral controlado.',
    instructions: [
      'Fique de pé com halteres em pegada neutra (polegar para cima).',
      'Mantenha os cotovelos presos ao tronco.',
      'Curve um halter por vez em direção ao ombro.',
      'Alterne os lados de forma controlada.',
    ],
  },

  'b_bi': {
    ...gif('Incline_Dumbbell_Curl'),
    muscles: ['Bíceps Braquial (cabeça longa)'],
    tip: 'Inclinação aumenta a amplitude de movimento do bíceps.',
    instructions: [
      'Deite num banco inclinado a 60° segurando halteres.',
      'Deixe os braços pendurados atrás do corpo.',
      'Curve os halteres para cima sem mover os cotovelos.',
      'Desça completamente para máximo alongamento.',
    ],
  },

  // ──────────────────────────────── TRÍCEPS (dia 5 – reuso ok) ────────────────────────────────
  't_mb2': {
    ...gif('Bench_Dips'),
    muscles: ['Tríceps (todas as cabeças)', 'Peitorais'],
    tip: 'Corpo próximo ao banco, desça até 90° de cotovelo.',
    instructions: [
      'Apoie as mãos num banco por trás.',
      'Estenda as pernas à frente.',
      'Dobre os cotovelos até 90° abaixando o quadril.',
      'Empurre para cima estendendo totalmente os tríceps.',
    ],
  },
};

// Fallback para exercises sem mapeamento
export const DEFAULT_ANIMATION = {
  frame0: 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/images/Barbell_Bench_Press/0.jpg',
  frame1: 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/images/Barbell_Bench_Press/1.jpg',
  muscles: ['Músculos Principais'],
  tip: 'Execute com controle e amplitude completa.',
  instructions: ['Execute o exercício com boa postura e técnica controlada.'],
};
