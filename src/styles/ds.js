/**
 * ZYRON Design System — tokens globais
 * Cor principal: #FFFFFF (Branco Minimalista)
 * Importar em qualquer tela: import { C, T, Card, Btn, Badge } from '../../styles/ds';
 */

// ─── Cores ────────────────────────────────────────────────────────────────────
export const C = {
  neon:    '#FFFFFF',                    // Branco — ações principais, ativo
  neonDim: 'rgba(255,255,255,0.55)',
  neonBg:  'rgba(255,255,255,0.07)',
  neonBorder: 'rgba(255,255,255,0.20)',

  blue:    '#7DA1FF',                    // Azul — hidratação / info
  blueBg:  'rgba(92,124,255,0.10)',
  blueBorder: 'rgba(92,124,255,0.22)',

  orange:  '#FF9A57',                    // Laranja — proteína / energia
  orangeBg: 'rgba(255,120,0,0.10)',
  orangeBorder: 'rgba(255,120,0,0.22)',

  red:     '#FF5C5C',                    // Vermelho — alerta / destruição
  redBg:   'rgba(255,59,48,0.10)',
  redBorder: 'rgba(255,59,48,0.22)',

  purple:  '#A78BFA',                    // Roxo — coach / IA
  purpleBg: 'rgba(139,92,246,0.10)',
  purpleBorder: 'rgba(139,92,246,0.22)',

  surface: 'rgba(14,14,18,0.97)',        // Fundo dos cards
  border:  'rgba(255,255,255,0.07)',     // Borda padrão
  borderHover: 'rgba(255,255,255,0.18)',
  text:    '#ffffff',
  textSub: 'rgba(255,255,255,0.40)',
  textMute:'rgba(255,255,255,0.22)',
};

// ─── Tipografia ───────────────────────────────────────────────────────────────
export const T = {
  sectionTitle: 'text-[13px] font-black uppercase tracking-[0.12em] text-white',
  sub:  'text-[9.5px] font-semibold uppercase tracking-[0.18em]',
  subColor: 'color: rgba(255,255,255,0.38)',
  bigNum: 'font-black leading-none text-white',
  label: 'text-[9px] font-bold uppercase tracking-[0.2em]',
  labelColor: 'rgba(255,255,255,0.38)',
  body: 'text-[12px] font-medium text-white leading-relaxed',
};

// ─── Card base ────────────────────────────────────────────────────────────────
export const Card = {
  base: 'relative overflow-hidden rounded-[20px] border',
  style: {
    background: 'rgba(14,14,18,0.97)',
    border:     '1px solid rgba(255,255,255,0.07)',
    boxShadow:  '0 8px 28px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)',
  },
  padding: { padding: '14px' },
};

// ─── Botão primário (branco) ──────────────────────────────────────────────────
export const Btn = {
  primary: {
    background: '#FFFFFF',
    color: '#000000',
    border: 'none',
    borderRadius: '999px',
    fontWeight: 900,
    fontSize: '11px',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    boxShadow: '0 0 14px rgba(255,255,255,0.12)',
    padding: '10px 20px',
  },
  secondary: {
    background: 'rgba(255,255,255,0.04)',
    color: 'rgba(255,255,255,0.65)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '999px',
    fontWeight: 700,
    fontSize: '11px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    padding: '9px 18px',
  },
  danger: {
    background: 'rgba(255,59,48,0.08)',
    color: '#FF5C5C',
    border: '1px solid rgba(255,59,48,0.20)',
    borderRadius: '999px',
    fontWeight: 700,
    fontSize: '11px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    padding: '9px 18px',
  },
};

// ─── Badge ────────────────────────────────────────────────────────────────────
export const Badge = {
  neon:   'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8.5px] font-bold uppercase tracking-widest bg-white/[0.08] text-white border border-white/[0.18]',
  blue:   'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8.5px] font-bold uppercase tracking-widest bg-[rgba(92,124,255,0.10)] text-[#7DA1FF] border border-[rgba(92,124,255,0.22)]',
  orange: 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8.5px] font-bold uppercase tracking-widest bg-[rgba(255,120,0,0.10)] text-[#FF9A57] border border-[rgba(255,120,0,0.22)]',
  red:    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8.5px] font-bold uppercase tracking-widest bg-[rgba(255,59,48,0.10)] text-[#FF5C5C] border border-[rgba(255,59,48,0.22)]',
  purple: 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8.5px] font-bold uppercase tracking-widest bg-[rgba(139,92,246,0.10)] text-[#A78BFA] border border-[rgba(139,92,246,0.22)]',
  neutral:'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8.5px] font-bold uppercase tracking-widest bg-white/[0.05] text-neutral-400 border border-white/[0.08]',
};

// ─── Input ────────────────────────────────────────────────────────────────────
export const Input = {
  base: 'w-full bg-[rgba(255,255,255,0.03)] border border-white/[0.08] rounded-[14px] px-4 py-3 text-[13px] font-medium text-white placeholder:text-neutral-600 outline-none focus:border-white/[0.40] transition-colors',
};

// ─── Gradiente de fundo para topo de cards ────────────────────────────────────
export const topGlow = (color = 'rgba(255,255,255,0.10)') =>
  `linear-gradient(90deg, transparent, ${color}, transparent)`;

// ─── Feedback semântico ───────────────────────────────────────────────────────
export const Feedback = {
  success: {
    bg: 'rgba(74,222,128,0.12)',
    border: 'rgba(74,222,128,0.25)',
    text: '#4ADE80',
  },
  error: {
    bg: 'rgba(255,92,92,0.12)',
    border: 'rgba(255,92,92,0.25)',
    text: '#FF5C5C',
  },
  warning: {
    bg: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.25)',
    text: '#F59E0B',
  },
};
