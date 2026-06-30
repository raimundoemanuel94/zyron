/**
 * exerciseAnimations.js
 *
 * Fonte primária : raw.githubusercontent.com (path CORRETO: sem /images/)
 * Fonte fallback : yuhonas.github.io/free-exercise-db (GitHub Pages, sem hotlink block)
 *
 * Path documentado oficialmente:
 *   https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Air_Bike/0.jpg
 *   ↑ SEM /images/ no meio
 */

import { getAnimationUrl, getAnimationFallbackUrl } from '../config/animationConfig';

export const gif = (dbId) => ({
  frame0:   getAnimationUrl(dbId, 0),
  frame1:   getAnimationUrl(dbId, 1),
  frame0fb: getAnimationFallbackUrl(dbId, 0),
  frame1fb: getAnimationFallbackUrl(dbId, 1),
});

export const EXERCISE_ANIMATIONS = {

  // ── PEITO ────────────────────────────────────────────────────────────────
  'p1': {
    ...gif('Barbell_Bench_Press'),
    muscles: ['Peitorais', 'Tríceps', 'Deltoide Anterior'],
    tip: 'Escápulas retraídas, pés firmes no chão.',
    instructions: ['Deite no banco plano com a barra acima do peito.','Agarre a barra ligeiramente mais larga que os ombros.','Desça a barra de forma controlada até o peito baixo/esterno.','Empurre a barra para cima até os braços quase estendidos.'],
  },
  'p2': {
    ...gif('Dumbbell_Incline_Bench_Press'),
    muscles: ['Peitorais (clavicular)', 'Deltoide Anterior', 'Tríceps'],
    tip: 'Cotovelos a 45° do tronco, controle a descida.',
    instructions: ['Ajuste o banco para 30–45° de inclinação.','Segure os halteres na altura do peito, palmas à frente.','Empurre os halteres para cima convergindo levemente.','Desça de forma controlada até o nível do peito.'],
  },
  'p_cm': {
    ...gif('Pec_Deck_Flyes'),
    muscles: ['Peitorais', 'Coracobraquial'],
    tip: 'Pressione os padres no final para recrutar ao máximo.',
    instructions: ['Sente-se com as costas no encosto e ajuste a altura do assento.','Posicione os braços nos apoios com cotovelos a 90°.','Aproxime os braços na frente do peito espremendo o peitoral.','Retorne lentamente até a posição inicial.'],
  },
  'p3': {
    ...gif('Cable_Crossover'),
    muscles: ['Peitorais', 'Deltoide Anterior'],
    tip: 'Mantenha um leve arco nas costas e cotovelos ligeiramente dobrados.',
    instructions: ['Posicione as polias acima da cabeça e selecione o peso.','Passe um passo à frente e incline levemente o tronco.','Puxe os cabos para baixo e centro cruzando os punhos.','Retorne de forma controlada sentindo a abertura do peito.'],
  },

  // ── TRÍCEPS ──────────────────────────────────────────────────────────────
  't1': {
    ...gif('Triceps_Pushdown'),
    muscles: ['Tríceps (todas as cabeças)'],
    tip: 'Barra reta ou W, foco na descida controlada.',
    instructions: ['Abaixe a barra até a extensão total dos braços.','Mantenha os cotovelos fixos ao lado do corpo.','Sinta a contração no tríceps.'],
  },
  't2': {
    ...gif('Triceps_Pushdown_-_Rope_Attachment'),
    muscles: ['Tríceps (especialmente cabeça lateral/longa)'],
    tip: 'Afaste as pontas da corda no final para maior contração.',
    instructions: ['Segure as extremidades da corda com as palmas voltadas uma para a outra.','Pressione para baixo, separando as mãos na parte inferior.','Retorne lentamente até os antebraços ficarem paralelos ao chão.'],
  },
  't3': {
    ...gif('Lying_Triceps_Press'),
    muscles: ['Tríceps (cabeça longa)'],
    tip: 'Testa próxima ao chão, não deixe os cotovelos abrirem.',
    instructions: ['Deite no banco com a barra EZ acima do peito.','Mãos próximas, cotovelos apontados para cima.','Dobre os cotovelos abaixando a barra em direção à testa.','Estenda os braços de volta à posição inicial.'],
  },
  't_mb': {
    ...gif('Bench_Dips'),
    muscles: ['Tríceps', 'Deltóide Anterior', 'Peitorais'],
    tip: 'Mantenha o corpo próximo ao banco, costas retas.',
    instructions: ['Apoie as palmas num banco atrás de você, dedos para frente.','Pernas estendidas à sua frente no chão ou num segundo banco.','Dobre os cotovelos abaixando o quadril até 90°.','Empurre para cima voltando à posição inicial.'],
  },

  // ── COSTAS ───────────────────────────────────────────────────────────────
  'c1': {
    ...gif('Wide-Grip_Lat_Pulldown'),
    muscles: ['Latíssimo do Dorso', 'Romboides', 'Bíceps'],
    tip: 'Puxe até a clavícula, retração de escápula no final.',
    instructions: ['Sente-se na máquina e prenda os joelhos no apoio.','Agarre a barra com pegada ampla pronada.','Puxe a barra até a clavícula retraindo as escápulas.','Retorne de forma controlada sentindo a abertura do dorso.'],
  },
  'c_rc': {
    ...gif('Barbell_Bent_Over_Row'),
    muscles: ['Latíssimo do Dorso', 'Romboides', 'Trapézio Médio'],
    tip: 'Costas planas, puxe até o umbigo.',
    instructions: ['Incline o tronco a 45° segurando a barra com pegada pronada.','Mantenha as costas neutras e joelhos levemente dobrados.','Puxe a barra em direção ao umbigo retraindo as escápulas.','Desça lentamente com controle total.'],
  },
  'c_rm': {
    ...gif('Seated_Cable_Rows'),
    muscles: ['Latíssimo do Dorso', 'Romboides', 'Bíceps'],
    tip: 'Tronco ereto, cotovelos próximos ao corpo.',
    instructions: ['Sente-se na máquina com os pés nos apoios.','Agarre o triângulo e mantenha o tronco ereto.','Puxe o triângulo até o abdômen retraindo as escápulas.','Retorne lentamente à extensão completa.'],
  },
  'c_pd': {
    ...gif('Close-Grip_Front_Lat_Pulldown'),
    muscles: ['Latíssimo do Dorso', 'Bíceps', 'Redondo Maior'],
    tip: 'Pegada supinada, foque no latíssimo.',
    instructions: ['Use a barra com pegada fechada supinada (palmas para você).','Sente-se com os joelhos presos e tronco levemente inclinado.','Puxe a barra até a clavícula espremendo os cotovelos para baixo.','Retorne controlado até extensão total dos braços.'],
  },

  // ── BÍCEPS ───────────────────────────────────────────────────────────────
  'b1':   { ...gif('Barbell_Curl'),         muscles: ['Bíceps Braquial', 'Braquial'],              tip: 'Cotovelos fixos ao corpo, não balance o tronco.',        instructions: ['Fique de pé com pegada supinada.','Mantenha os cotovelos presos ao tronco.','Curve a barra até os bíceps contrair totalmente.','Desça lentamente.'] },
  'b_ra': { ...gif('Hammer_Curls'),         muscles: ['Bíceps', 'Braquiorradial (antebraço)'],      tip: 'Polegares para cima, movimento alternado e controlado.',  instructions: ['Polegares para cima.','Cotovelos presos ao tronco.','Curve um halter de cada vez.','Alterne os lados.'] },
  'b3':   { ...gif('Concentration_Curl'),   muscles: ['Bíceps Braquial (pico)'],                    tip: 'Cotovelão apoiado na coxa, isolamento total.',            instructions: ['Sente-se com as pernas abertas.','Apoie o cotovelo na coxa.','Curve o halter contraindo ao máximo.','Desça até a extensão completa.'] },
  'b_rw': { ...gif('Barbell_Curl'),         muscles: ['Bíceps Braquial', 'Braquial'],              tip: 'Barra EZ reduz stress no pulso. Cotovelos fixos.',        instructions: ['Pegada supinada na barra EZ.','Tronco estático.','Curve até a contração máxima.','Desça lentamente.'] },
  'b2':   { ...gif('Hammer_Curls'),         muscles: ['Bíceps', 'Braquiorradial (antebraço)'],      tip: 'Neutro (polegares para cima), movimento unilateral.',     instructions: ['Pegada neutra (polegar para cima).','Cotovelos presos ao tronco.','Curve um halter por vez.','Alterne os lados.'] },
  'b_bi': { ...gif('Incline_Dumbbell_Curl'),muscles: ['Bíceps Braquial (cabeça longa)'],            tip: 'Inclinação aumenta a amplitude de movimento do bíceps.',  instructions: ['Banco inclinado a 60°.','Braços pendurados atrás do corpo.','Curve sem mover os cotovelos.','Desça para máximo alongamento.'] },

  // ── PERNA ────────────────────────────────────────────────────────────────
  'l1': {
    ...gif('Barbell_Squat'),
    muscles: ['Quadríceps', 'Glúteos', 'Isquiotibiais', 'Core'],
    tip: 'Joelhos alinhados com os pés, peito erguido, desça até 90°.',
    instructions: ['Barra nos trapézios, pés na largura dos ombros.','Mantenha o peito alto e lombar neutra.','Desça até 90° de quadril.','Empurre pelo calcanhar para voltar.'],
  },
  'l2': {
    ...gif('Leg_Press'),
    muscles: ['Quadríceps', 'Glúteos', 'Isquiotibiais'],
    tip: 'Pés largos = mais glúteo. Pés centralizados = mais quadríceps.',
    instructions: ['Posicione os pés na plataforma.','Dobre os joelhos até 90°.','Empurre sem travar os joelhos.','Retorne devagar.'],
  },
  'l3':   { ...gif('Leg_Extensions'),       muscles: ['Quadríceps (isolado)'],                     tip: 'Extensão completa no topo, desça com controle.',          instructions: ['Joelhos a 90°.','Estenda até horizontal.','Segure 1s no topo.','Desça lentamente.'] },
  'l4':   { ...gif('Lying_Leg_Curls'),      muscles: ['Isquiotibiais (isolado)'],                  tip: 'Quadril no apoio, curl completo.',                        instructions: ['Deite de bruços.','Curve as pernas em direção ao glúteo.','Desça até extensão completa.'] },
  'l5':   { ...gif('Romanian_Deadlift'),    muscles: ['Isquiotibiais', 'Glúteos'],                  tip: 'Costas neutras, empurre o quadril para trás.',            instructions: ['Segure a barra na frente das coxas.','Empurre o quadril para trás descendo.','Desça até sentir o isquiotibial alongar.','Retorne empurrando o quadril para frente.'] },
  'l_ht': { ...gif('Barbell_Hip_Thrust'),   muscles: ['Glúteos', 'Isquiotibiais'],                  tip: 'Queixo no peito, espreme o glúteo no topo por 1s.',       instructions: ['Apoie as costas no banco.','Barra sobre o quadril.','Empurre o quadril para cima até ficar paralelo ao chão.','Desça controlado.'] },
  'ca1':  { ...gif('Standing_Calf_Raises'), muscles: ['Gastrocnêmio', 'Sóleo'],                     tip: 'Amplitude total: desça até o alongamento máximo.',        instructions: ['Fique na borda de um degrau.','Suba nas pontas dos pés.','Desça abaixo da linha do degrau para alongar.'] },
  'ca_s': { ...gif('Seated_Calf_Raise'),    muscles: ['Sóleo', 'Gastrocnêmio'],                     tip: 'Joelhos a 90°, foque no Sóleo.',                          instructions: ['Pés na plataforma, joelhos sob o apoio.','Suba na ponta dos pés.','Desça até o pleno alongamento.'] },

  // ── OMBRO ────────────────────────────────────────────────────────────────
  's1':   { ...gif('Dumbbell_Shoulder_Press'), muscles: ['Deltoide Anterior e Lateral', 'Tríceps'], tip: 'Cotovelos a 90°, não trave no topo.',                     instructions: ['Halteres na altura dos ombros.','Palmas para frente.','Empurre para cima convergindo.','Desça controlado.'] },
  's2':   { ...gif('Side_Lateral_Raise'),      muscles: ['Deltoide Lateral (medial)'],              tip: 'Cotovelos levemente dobrados, suba até a linha dos ombros.', instructions: ['Halteres ao lado do corpo.','Eleve os braços lateralmente.','Desça lentamente.'] },
  's3':   { ...gif('Dumbbell_Front_Raise'),    muscles: ['Deltoide Anterior'],                      tip: 'Controle o eccêntrico, não balance o tronco.',            instructions: ['Halteres na frente das coxas.','Levante à linha dos ombros.','Desça devagar.'] },
  's4':   { ...gif('Reverse_Flyes'),           muscles: ['Deltoide Posterior', 'Romboides'],        tip: 'Cotovelos levemente dobrados, retração de escápula.',     instructions: ['Incline o tronco a 45°.','Eleve os braços lateralmente.','Desça sentindo a contração.'] },
  's_et': { ...gif('Barbell_Shrug'),           muscles: ['Trapézio Superior'],                      tip: 'Suba direto, sem rotação. Segure 1s no topo.',            instructions: ['Barra na frente com pegada pronada.','Levante os ombros o mais alto possível.','Segure 1s e desça.'] },

  // ── TRÍCEPS dia 5 ────────────────────────────────────────────────────────
  't_mb2': { ...gif('Bench_Dips'), muscles: ['Tríceps (todas as cabeças)', 'Peitorais'], tip: 'Corpo próximo ao banco, desça até 90° de cotovelo.', instructions: ['Mãos num banco por trás.','Pernas estendidas à frente.','Dobre os cotovelos até 90°.','Empurre para cima.'] },

  // ── CORE & FUNCIONAL ─────────────────────────────────────────────────────
  'crunch':    { ...gif('Crunches'),          muscles: ['Reto Abdominal'],                           tip: 'Não puxe o pescoço.',             instructions: ['Joelhos dobrados, pés no chão.','Levante os ombros contraindo o abdômen.','Desça mantendo a tensão.'] },
  'leg_raise': { ...gif('Hanging_Leg_Raise'), muscles: ['Infra-Abdominal', 'Flexores do Quadril'],   tip: 'Evite balançar o corpo.',          instructions: ['Pendure-se na barra.','Eleve as pernas até o quadril.','Desça com controle total.'] },
  'plank':     { ...gif('Plank'),             muscles: ['Core Integral', 'Lombar', 'Ombros'],        tip: 'Corpo em linha reta.',             instructions: ['Apoie-se nos antebraços e pontas dos pés.','Sustente respirando de forma controlada.'] },
  'push_up':   { ...gif('Pushups'),           muscles: ['Peitorais', 'Tríceps', 'Deltoide Anterior'],tip: 'Core firme, não arqueie as costas.',instructions: ['Prancha alta, mãos mais largas que os ombros.','Desça o peito ao chão.','Empurre de volta.'] },
  'pull_up':   { ...gif('Pullups'),           muscles: ['Latíssimo do Dorso', 'Bíceps'],             tip: 'Puxe até o queixo passar da barra.',instructions: ['Pegada pronada na barra.','Puxe retraindo as escápulas.','Desça controlado.'] },
  'deadlift':  { ...gif('Barbell_Deadlift'),  muscles: ['Cadeia Posterior', 'Glúteos'],              tip: 'Barra próxima à canela, costas neutras.',instructions: ['Pés sob a barra.','Levante estendendo quadril e joelhos.','Retorne com controle.'] },
  'lunges':    { ...gif('Dumbbell_Lunges'),   muscles: ['Quadríceps', 'Glúteos', 'Isquiotibiais'],   tip: 'Passo largo para manter joelhos a 90°.',instructions: ['Halter em cada mão.','Passo à frente, joelho de trás quase no chão.','Empurre com o pé da frente.'] },

  // ═══════════════════════════════════════════════════════════
  // PROGRAMA PPL + UPPER — 12 semanas
  // ═══════════════════════════════════════════════════════════

  // ── PUSH A — Segunda ────────────────────────────────────────────────────
  'pa1': {
    ...gif('Barbell_Bench_Press'),
    muscles: ['Peitorais', 'Tríceps', 'Deltoide Anterior'],
    tip: 'Escápulas retraídas, pés firmes no chão.',
    instructions: ['Deite no banco plano com a barra acima do peito.','Agarre a barra ligeiramente mais larga que os ombros.','Desça a barra de forma controlada até o peito baixo/esterno.','Empurre a barra para cima até os braços quase estendidos.'],
  },
  'pa2': {
    ...gif('Dumbbell_Shoulder_Press'),
    muscles: ['Deltoide Anterior e Lateral', 'Tríceps'],
    tip: 'Cotovelos a 90°, não trave no topo.',
    instructions: ['Halteres na altura dos ombros, palmas para frente.','Empurre para cima convergindo levemente.','Desça controlado até a linha dos ombros.'],
  },
  'pa3': {
    ...gif('Dumbbell_Incline_Bench_Press'),
    muscles: ['Peitorais (clavicular)', 'Deltoide Anterior'],
    tip: 'Cotovelos a 45° do tronco, controle a descida.',
    instructions: ['Banco inclinado 30–45°.','Halteres na altura do peito, palmas à frente.','Empurre convergindo levemente.','Desça controlado até o alongamento.'],
  },
  'pa4': {
    ...gif('Side_Lateral_Raise'),
    muscles: ['Deltoide Lateral (medial)'],
    tip: 'Cotovelos levemente dobrados, suba até a linha dos ombros.',
    instructions: ['Halteres ao lado do corpo.','Eleve os braços lateralmente até a linha dos ombros.','Desça lentamente com controle.'],
  },
  'pa5': {
    ...gif('Triceps_Pushdown_-_Rope_Attachment'),
    muscles: ['Tríceps (cabeça lateral/longa)'],
    tip: 'Afaste as pontas da corda no final do movimento.',
    instructions: ['Segure a corda com pegada neutra.','Empurre para baixo estendendo os cotovelos.','Afaste as mãos no final contraindo o tríceps.','Retorne controlado.'],
  },
  'pa6': {
    ...gif('Lying_Triceps_Press'),
    muscles: ['Tríceps (cabeça longa)'],
    tip: 'Cotovelos fixos, desça até a testa.',
    instructions: ['Deite no banco segurando a barra EZ acima do peito.','Mantenha os cotovelos fixos e dobre até a testa.','Estenda de volta sem mover os ombros.'],
  },

  // ── PULL A — Terça ──────────────────────────────────────────────────────
  'pla1': {
    ...gif('Pullups'),
    muscles: ['Latíssimo do Dorso', 'Bíceps', 'Romboides'],
    tip: 'Puxe até o queixo passar da barra, pegada larga.',
    instructions: ['Pegada pronada, mais larga que os ombros.','Puxe o corpo retraindo as escápulas.','Desça controlado até a extensão completa.'],
  },
  'pla2': {
    ...gif('Barbell_Bent_Over_Row'),
    muscles: ['Latíssimo do Dorso', 'Romboides', 'Trapézio Médio'],
    tip: 'Costas planas, puxe até o umbigo.',
    instructions: ['Incline o tronco a 45° segurando a barra.','Mantenha costas neutras, joelhos levemente dobrados.','Puxe a barra ao umbigo retraindo as escápulas.','Desça lentamente.'],
  },
  'pla3': {
    ...gif('Close-Grip_Front_Lat_Pulldown'),
    muscles: ['Latíssimo do Dorso', 'Bíceps', 'Redondo Maior'],
    tip: 'Cotovelos apontando para o chão, escápula retraída.',
    instructions: ['Pegada neutra/fechada na barra.','Joelhos presos, tronco levemente inclinado.','Puxe até a clavícula espremendo os cotovelos para baixo.','Retorne controlado.'],
  },
  'pla4': {
    ...gif('Barbell_Curl'),
    muscles: ['Bíceps Braquial', 'Braquial'],
    tip: 'Cotovelos fixos ao corpo, não balance o tronco.',
    instructions: ['Pegada supinada na barra EZ.','Cotovelos presos ao tronco.','Curve até a contração máxima.','Desça lentamente.'],
  },
  'pla5': {
    ...gif('Hammer_Curls'),
    muscles: ['Bíceps', 'Braquiorradial (antebraço)'],
    tip: 'Polegares para cima, movimento controlado.',
    instructions: ['Pegada neutra (polegar para cima).','Cotovelos presos ao tronco.','Curve um halter por vez ou junto.','Desça com controle.'],
  },
  'pla6': {
    ...gif('Face_Pull'),
    muscles: ['Deltoide Posterior', 'Romboides', 'Manguito Rotador'],
    tip: 'Puxe a corda em direção à testa, rotação externa.',
    instructions: ['Polia na altura do rosto.','Puxe a corda separando as mãos em direção à testa.','Gire os ombros para fora no final.','Retorne controlado.'],
  },

  // ── LEGS A — Quarta ─────────────────────────────────────────────────────
  'la1': {
    ...gif('Barbell_Squat'),
    muscles: ['Quadríceps', 'Glúteos', 'Core'],
    tip: 'Joelhos alinhados com os pés, desça até 90°.',
    instructions: ['Barra nos trapézios, pés na largura dos ombros.','Peito alto, lombar neutra.','Desça até 90° de quadril.','Empurre pelo calcanhar para subir.'],
  },
  'la2': {
    ...gif('Leg_Press'),
    muscles: ['Quadríceps', 'Glúteos'],
    tip: 'Pés médios, amplitude total sem travar o joelho.',
    instructions: ['Pés na plataforma, posição média.','Dobre os joelhos até 90°.','Empurre sem travar.','Retorne devagar.'],
  },
  'la3': {
    ...gif('Leg_Extensions'),
    muscles: ['Quadríceps (isolado)'],
    tip: 'Extensão completa no topo, desça com controle.',
    instructions: ['Joelhos a 90° no apoio.','Estenda até quase horizontal.','Segure 1s no topo.','Desça lentamente em 3 seg.'],
  },
  'la4': {
    ...gif('Romanian_Deadlift'),
    muscles: ['Isquiotibiais', 'Glúteos'],
    tip: 'Costas neutras, empurre o quadril para trás.',
    instructions: ['Halteres na frente das coxas.','Empurre o quadril para trás descendo.','Desça até sentir o alongamento.','Retorne empurrando o quadril para frente.'],
  },
  'la5': {
    ...gif('Standing_Calf_Raises'),
    muscles: ['Gastrocnêmio', 'Sóleo'],
    tip: 'Amplitude total: desça até o alongamento máximo.',
    instructions: ['Na borda de um degrau ou aparelho.','Suba nas pontas dos pés.','Desça abaixo da linha para alongar.','Pausa de 1s no topo.'],
  },

  // ── UPPER B — Quinta ────────────────────────────────────────────────────
  'ub1': {
    ...gif('Dumbbell_Incline_Bench_Press'),
    muscles: ['Peitorais (clavicular)', 'Deltoide Anterior', 'Tríceps'],
    tip: 'Foco no feixe clavicular — ângulo diferente do Push A.',
    instructions: ['Banco a 30–45°.','Halteres na altura do peito.','Empurre convergindo levemente.','Desça controlado.'],
  },
  'ub2': {
    ...gif('Seated_Cable_Rows'),
    muscles: ['Latíssimo do Dorso', 'Romboides', 'Bíceps'],
    tip: 'Tronco ereto, cotovelos próximos ao corpo.',
    instructions: ['Pés nos apoios, tronco ereto.','Puxe o triângulo até o abdômen.','Retraia as escápulas no final.','Retorne controlado.'],
  },
  'ub3': {
    ...gif('Arnold_Press'),
    muscles: ['Deltoide (todos os feixes)', 'Tríceps'],
    tip: 'Rotação no movimento, ativa todo o ombro.',
    instructions: ['Halteres na frente, palmas voltadas para você.','Empurre girando as palmas para frente.','No topo, palmas para fora.','Desça revertendo a rotação.'],
  },
  'ub4': {
    ...gif('Cable_Crossover'),
    muscles: ['Peitorais', 'Deltoide Anterior'],
    tip: 'Cruze as mãos na frente do quadril, tensão constante.',
    instructions: ['Polias altas, um passo à frente.','Puxe os cabos para baixo e ao centro.','Cruze as mãos sentindo a contração.','Retorne controlado.'],
  },
  'ub5': {
    ...gif('Concentration_Curl'),
    muscles: ['Bíceps Braquial (pico)'],
    tip: 'Cotovelo apoiado na coxa, isolamento total.',
    instructions: ['Sentado, cotovelo apoiado na coxa.','Curve contraindo ao máximo.','Pausa de 1s no topo.','Desça até a extensão completa.'],
  },
  'ub6': {
    ...gif('Lying_Triceps_Press'),
    muscles: ['Tríceps (todas as cabeças)'],
    tip: 'Descida atrás da cabeça, cotovelos estáveis.',
    instructions: ['Halter acima da cabeça com os dois braços.','Desça atrás da cabeça flexionando o cotovelo.','Estenda de volta sem mover os ombros.'],
  },
  'ub7': {
    ...gif('Side_Lateral_Raise'),
    muscles: ['Deltoide Lateral'],
    tip: 'Tensão constante do cabo — superior ao halter no pico.',
    instructions: ['Polia baixa, um passo afastado.','Eleve o braço lateralmente.','Segure no topo.','Desça controlado.'],
  },
  'ub8': {
    ...gif('Plank'),
    muscles: ['Core Integral', 'Lombar', 'Ombros'],
    tip: 'Corpo em linha reta, respiração controlada.',
    instructions: ['Apoie-se nos antebraços e pontas dos pés.','Mantenha o corpo alinhado.','Sustente respirando de forma controlada.'],
  },
  'ub9': {
    ...gif('Cable_Crunch'),
    muscles: ['Reto Abdominal'],
    tip: 'Flexão real de tronco — não puxada de pescoço.',
    instructions: ['Ajoelhado de frente para a polia alta.','Flexione o tronco contraindo o abdômen.','Retorne controlado sem soltar a tensão.'],
  },
  'ub10': {
    ...gif('Hanging_Leg_Raise'),
    muscles: ['Infra-Abdominal', 'Flexores do Quadril'],
    tip: 'Controle total, sem balançar o corpo.',
    instructions: ['Pendure-se na barra.','Eleve as pernas até a linha do quadril.','Desça com controle total.'],
  },

  // ── LEGS B + CORE — Sexta ───────────────────────────────────────────────
  'lb1': {
    ...gif('Barbell_Deadlift'),
    muscles: ['Cadeia Posterior', 'Glúteos', 'Lombar'],
    tip: 'Barra próxima à canela, costas neutras.',
    instructions: ['Pés sob a barra, pegada na largura dos ombros.','Levante estendendo quadril e joelhos juntos.','Mantenha a barra próxima ao corpo.','Retorne com controle total.'],
  },
  'lb2': {
    ...gif('Dumbbell_Lunges'),
    muscles: ['Quadríceps', 'Glúteos'],
    tip: 'Pé traseiro elevado, tronco levemente inclinado.',
    instructions: ['Pé de trás apoiado num banco elevado.','Halteres nas mãos.','Desça até o joelho de trás quase tocar o chão.','Empurre com o pé da frente.'],
  },
  'lb3': {
    ...gif('Lying_Leg_Curls'),
    muscles: ['Isquiotibiais (isolado)'],
    tip: 'Quadril no apoio, curl completo e controlado.',
    instructions: ['Deite de bruços no aparelho.','Curve as pernas em direção ao glúteo.','Pausa de 1s no topo.','Desça até a extensão completa (3 seg).'],
  },
  'lb4': {
    ...gif('Barbell_Hip_Thrust'),
    muscles: ['Glúteos', 'Isquiotibiais'],
    tip: 'Espreme o glúteo no topo por 1 segundo.',
    instructions: ['Apoie as costas no banco, barra sobre o quadril.','Empurre o quadril para cima até ficar paralelo ao chão.','Pausa de 1s no topo.','Desça controlado.'],
  },
  'lb5': {
    ...gif('Seated_Calf_Raise'),
    muscles: ['Sóleo', 'Gastrocnêmio'],
    tip: 'Joelho a 90°, foco no sóleo — diferente do Legs A.',
    instructions: ['Pés na plataforma, joelhos sob o apoio.','Suba na ponta dos pés.','Desça até o alongamento total.','Pausa de 1s no topo.'],
  },
  'lb6': {
    ...gif('Crunches'),
    muscles: ['Reto Abdominal', 'Core Profundo'],
    tip: 'Lombar colada no chão, movimento contralateral.',
    instructions: ['Deitado, braços e pernas estendidos.','Leve braço e perna opostos ao centro alternando.','Mantenha a lombar sempre no chão.'],
  },
  'lb7': {
    ...gif('Ab_Roller'),
    muscles: ['Core Integral', 'Reto Abdominal'],
    tip: 'Extensão parcial se ainda não domina o movimento completo.',
    instructions: ['Ajoelhado segurando a roda.','Role para frente mantendo o core contraído.','Volte controlado sem deixar o quadril cair.'],
  },
  'lb8': {
    ...gif('Air_Bike'),
    muscles: ['Reto Abdominal', 'Oblíquos'],
    tip: 'Rotação real do tronco, não só do pescoço.',
    instructions: ['Deitado, mãos atrás da cabeça.','Leve cotovelo ao joelho oposto alternando.','Mantenha o movimento controlado, sem puxar o pescoço.'],
  },
};

// ─── Fallback padrão ──────────────────────────────────────────────────────────
export const DEFAULT_ANIMATION = {
  ...gif('Barbell_Bench_Press'),
  muscles:      ['Músculos Principais'],
  tip:          'Execute com controle e amplitude completa.',
  instructions: ['Execute o exercício com boa postura e técnica controlada.'],
};
