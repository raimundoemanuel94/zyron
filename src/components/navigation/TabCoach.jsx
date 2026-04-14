import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  Dumbbell,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { getSessionOrHandleInvalidRefresh } from '../../lib/sessionRecovery';
import { buildApiUrl } from '../../services/api/baseUrl';
import { C, Badge } from '../../styles/ds';

const CONTEXTS = [
  { id: 'workout', label: 'Treino', icon: Dumbbell },
  { id: 'progress', label: 'Progresso', icon: TrendingUp },
  { id: 'recovery', label: 'Recuperacao', icon: Activity },
];

const FALLBACKS = {
  workout: {
    message: 'Nao consegui ler seu historico agora.\nMantenha a execucao forte no proximo treino.\nVolte em instantes para atualizar a analise.',
    insights: ['Coach temporariamente indisponivel', 'Tente novamente em alguns segundos'],
    suggestions: ['Registrar o proximo treino ajuda a liberar uma leitura melhor'],
  },
  progress: {
    message: 'Sua leitura de progresso nao carregou agora.\nPriorize constancia e registre cargas reais.\nVolte em instantes para atualizar a analise.',
    insights: ['Sem resposta da IA neste momento', 'Os dados continuam seguros no backend'],
    suggestions: ['Mantenha as cargas atualizadas para uma analise mais precisa'],
  },
  recovery: {
    message: 'Nao consegui fechar sua leitura de recuperacao agora.\nObserve energia, sono e ritmo da semana.\nVolte em instantes para atualizar a analise.',
    insights: ['Leitura temporariamente indisponivel', 'Os check-ins serao usados assim que a IA responder'],
    suggestions: ['Se estiver muito cansado, reduza intensidade no proximo treino'],
  },
};

const getAuthHeader = async () => {
  const { session } = await getSessionOrHandleInvalidRefresh();
  if (!session?.access_token) {
    throw new Error('Sessao invalida');
  }

  return `Bearer ${session.access_token}`;
};

const fetchCoachAnalysis = async (context) => {
  const auth = await getAuthHeader();
  const response = await fetch(buildApiUrl('/api/ai/coach'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: auth,
    },
    body: JSON.stringify({ context }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || `HTTP ${response.status}`);
  }

  return {
    message: data?.message || '',
    insights: Array.isArray(data?.insights) ? data.insights : [],
    suggestions: Array.isArray(data?.suggestions) ? data.suggestions : [],
  };
};

const LoadingDots = () => (
  <div className="flex items-center gap-1.5">
    {[0, 1, 2].map((index) => (
      <motion.div
        key={index}
        className="h-2 w-2 rounded-full"
        style={{ background: C.purple }}
        animate={{ y: [0, -6, 0], opacity: [0.45, 1, 0.45] }}
        transition={{ duration: 0.7, repeat: Infinity, delay: index * 0.12 }}
      />
    ))}
  </div>
);

export default function TabCoach({ user, profile }) {
  const [context, setContext] = useState('workout');
  const [analysis, setAnalysis] = useState(FALLBACKS.workout);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshSeed, setRefreshSeed] = useState(0);

  useEffect(() => {
    if (!user?.id) return undefined;

    let active = true;

    const load = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await fetchCoachAnalysis(context);
        if (!active) return;

        setAnalysis({
          message: data.message || FALLBACKS[context].message,
          insights: data.insights?.length ? data.insights : FALLBACKS[context].insights,
          suggestions: data.suggestions?.length ? data.suggestions : FALLBACKS[context].suggestions,
        });
      } catch (loadError) {
        console.error('[TabCoach]', loadError);
        if (!active) return;

        setError(loadError.message || 'Falha ao carregar coach');
        setAnalysis(FALLBACKS[context]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [context, refreshSeed, user?.id]);

  const currentContext = useMemo(
    () => CONTEXTS.find((item) => item.id === context) || CONTEXTS[0],
    [context],
  );

  const CurrentIcon = currentContext.icon;
  const firstName = profile?.name?.split(' ')?.[0] || 'Atleta';

  return (
    <motion.div
      key="coach"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-4"
      style={{ minHeight: 'calc(100dvh - 180px)' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-[16px]"
            style={{
              background: C.purpleBg,
              border: `1px solid ${C.purpleBorder}`,
              boxShadow: '0 0 18px rgba(139,92,246,0.16)',
            }}
          >
            <Zap size={18} style={{ color: C.purple }} />
          </div>
          <div>
            <h2 className="text-[14px] font-black uppercase tracking-tight text-white">ZYRON Coach</h2>
            <p className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: C.purple }}>
              Analise real do seu uso
            </p>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setRefreshSeed((value) => value + 1)}
          className="flex h-9 w-9 items-center justify-center rounded-[12px]"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          title="Atualizar"
        >
          <RotateCcw size={14} style={{ color: C.textSub }} />
        </motion.button>
      </div>

      <div className="flex flex-wrap gap-2">
        {CONTEXTS.map(({ id, label, icon: Icon }) => (
          <motion.button
            key={id}
            whileTap={{ scale: 0.96 }}
            onClick={() => setContext(id)}
            className={Badge.neutral}
            style={{
              whiteSpace: 'nowrap',
              background: context === id ? C.purpleBg : 'rgba(255,255,255,0.03)',
              border: context === id ? `1px solid ${C.purpleBorder}` : '1px solid rgba(255,255,255,0.08)',
              color: context === id ? '#fff' : C.textSub,
            }}
          >
            <Icon size={10} style={{ color: context === id ? C.purple : C.neon }} />
            {label}
          </motion.button>
        ))}
      </div>

      <div
        className="rounded-[24px] p-5"
        style={{
          background: 'linear-gradient(180deg, rgba(18,18,22,0.98) 0%, rgba(10,10,12,0.98) 100%)',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 18px 40px rgba(0,0,0,0.28)',
        }}
      >
        <div className="flex items-center gap-2.5 mb-4">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-[12px]"
            style={{ background: C.purpleBg, border: `1px solid ${C.purpleBorder}` }}
          >
            <CurrentIcon size={15} style={{ color: C.purple }} />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white">
              {firstName}, aqui vai sua leitura
            </p>
            <p className="text-[9px] font-semibold uppercase tracking-[0.14em]" style={{ color: C.textSub }}>
              contexto {currentContext.label}
            </p>
          </div>
        </div>

        {loading ? (
          <div
            className="flex min-h-[120px] flex-col justify-center gap-3 rounded-[18px] px-4 py-5"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          >
            <LoadingDots />
            <p className="text-[12px] font-medium" style={{ color: C.textSub }}>
              Lendo seus treinos, check-ins e PRs...
            </p>
          </div>
        ) : (
          <>
            {error ? (
              <div
                className="mb-4 flex items-start gap-2.5 rounded-[16px] px-3 py-3"
                style={{ background: C.redBg, border: `1px solid ${C.redBorder}` }}
              >
                <AlertTriangle size={14} style={{ color: C.red, marginTop: 1, flexShrink: 0 }} />
                <p className="text-[11px] font-bold" style={{ color: C.red }}>
                  Fallback ativo
                </p>
              </div>
            ) : null}

            <div
              className="rounded-[20px] px-4 py-4"
              style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="mb-3 flex items-center gap-2">
                <Sparkles size={14} style={{ color: C.neon }} />
                <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: C.neon }}>
                  Resposta da IA
                </p>
              </div>
              <p className="whitespace-pre-wrap text-[13px] font-medium leading-relaxed text-white">
                {analysis.message}
              </p>
            </div>

            <div className="mt-4 grid gap-3">
              {analysis.insights?.length ? (
                <div>
                  <p className="mb-2 text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: C.textSub }}>
                    Insights
                  </p>
                  <div className="grid gap-2">
                    {analysis.insights.map((item) => (
                      <div
                        key={item}
                        className="rounded-[16px] px-3 py-3 text-[11px] font-semibold"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.82)' }}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {analysis.suggestions?.length ? (
                <div>
                  <p className="mb-2 text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: C.textSub }}>
                    Sugestoes
                  </p>
                  <div className="grid gap-2">
                    {analysis.suggestions.map((item) => (
                      <div
                        key={item}
                        className="rounded-[16px] px-3 py-3 text-[11px] font-semibold"
                        style={{ background: C.purpleBg, border: `1px solid ${C.purpleBorder}`, color: '#fff' }}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
