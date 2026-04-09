import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  Dumbbell,
  MessageSquareText,
  RotateCcw,
  SendHorizontal,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { C, Badge } from '../../styles/ds';

const CONTEXTS = [
  { id: 'workout', label: 'Treino', icon: Dumbbell },
  { id: 'progress', label: 'Progresso', icon: TrendingUp },
  { id: 'recovery', label: 'Recuperacao', icon: Activity },
];

const GUIDED_QUESTIONS = [
  { label: 'O que treinar hoje?', question: 'O que treinar hoje?' },
  { label: 'Posso descansar hoje?', question: 'Posso descansar hoje?' },
  { label: 'Como estou evoluindo?', question: 'Como estou evoluindo?' },
  { label: 'O que ajustar no proximo treino?', question: 'O que ajustar no proximo treino?' },
];

const MAX_QUESTION_LENGTH = 120;
const MAX_HISTORY_ITEMS = 3;

const FALLBACKS = {
  workout: {
    answer: 'Nao consegui fechar sua leitura de treino agora.',
    reasoning: ['Coach temporariamente indisponivel.', 'Tente atualizar em alguns segundos.'],
    action: 'Repita seu ultimo bloco com tecnica limpa assim que a leitura voltar.',
    confidence: 'baixa',
  },
  progress: {
    answer: 'Sua leitura de progresso nao carregou agora.',
    reasoning: ['Sem resposta do coach neste momento.', 'Os dados continuam seguros no backend.'],
    action: 'Mantenha cargas e duracao registradas para a proxima leitura.',
    confidence: 'baixa',
  },
  recovery: {
    answer: 'Nao consegui fechar sua leitura de recuperacao agora.',
    reasoning: ['A analise de recuperacao ficou indisponivel por instantes.', 'Se precisar, atualize em alguns segundos.'],
    action: 'Se o corpo estiver pesado, alivie intensidade no proximo treino.',
    confidence: 'baixa',
  },
  question: {
    answer: 'Posso responder so sobre treino, recuperacao, evolucao, frequencia e proxima sessao.',
    reasoning: ['Pergunta fora do foco operacional do coach atual.'],
    action: 'Reescreva a pergunta focando o proximo treino ou sua recuperacao.',
    confidence: 'baixa',
  },
};

const getAuthHeader = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Sessao invalida');
  }

  return `Bearer ${session.access_token}`;
};

const fetchCoachAnalysis = async ({ context, question = '' }) => {
  const auth = await getAuthHeader();
  const response = await fetch('/api/ai/coach', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: auth,
    },
    body: JSON.stringify({ context, question }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || `HTTP ${response.status}`);
  }

  return {
    answer: data?.answer || data?.message || '',
    reasoning: Array.isArray(data?.reasoning)
      ? data.reasoning
      : Array.isArray(data?.insights)
        ? data.insights
        : [],
    action: data?.action || (Array.isArray(data?.suggestions) ? data.suggestions[0] : '') || '',
    confidence: data?.confidence || 'baixa',
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

const confidenceStyle = (confidence) => {
  if (confidence === 'alta') {
    return { color: C.neon, border: '1px solid rgba(205,255,90,0.25)', background: 'rgba(205,255,90,0.08)' };
  }

  if (confidence === 'media') {
    return { color: '#FDC800', border: '1px solid rgba(253,200,0,0.24)', background: 'rgba(253,200,0,0.08)' };
  }

  return { color: C.red, border: `1px solid ${C.redBorder}`, background: C.redBg };
};

const buildRequestId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const buildRequestPayload = ({ context, question = '', label, mode }) => ({
  context,
  question,
  label,
  mode,
  requestId: buildRequestId(),
  askedAt: new Date().toISOString(),
});

const formatRequestTime = (value) => {
  if (!value) return '';

  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

export default function TabCoach({ user, profile }) {
  const [activeContext, setActiveContext] = useState('workout');
  const [requestState, setRequestState] = useState(() => buildRequestPayload({
    context: 'workout',
    question: '',
    label: 'Treino',
    mode: 'context',
  }));
  const [analysis, setAnalysis] = useState(FALLBACKS.workout);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshSeed, setRefreshSeed] = useState(0);
  const [questionInput, setQuestionInput] = useState('');
  const [questionHistory, setQuestionHistory] = useState([]);
  const [lastAnsweredAt, setLastAnsweredAt] = useState('');
  const latestRequestIdRef = useRef(requestState.requestId);

  const currentContext = useMemo(
    () => CONTEXTS.find((item) => item.id === activeContext) || CONTEXTS[0],
    [activeContext],
  );

  const runCoachRequest = useCallback(async (request) => {
    const fallbackKey = request.context === 'question' ? 'question' : request.context;
    const isQuestionRequest = request.context === 'question';
    const startedAt = request.askedAt || new Date().toISOString();

    latestRequestIdRef.current = request.requestId;

    if (isQuestionRequest && request.question) {
      setQuestionHistory((current) => [
        {
          id: request.requestId,
          question: request.question,
          status: 'loading',
          askedAt: startedAt,
          answeredAt: '',
          answer: '',
        },
        ...current.filter((item) => item.id !== request.requestId),
      ].slice(0, MAX_HISTORY_ITEMS));
    }

    setLoading(true);
    setError('');

    try {
      const data = await fetchCoachAnalysis(request);
      const nextAnalysis = {
        answer: data.answer || FALLBACKS[fallbackKey].answer,
        reasoning: data.reasoning?.length ? data.reasoning : FALLBACKS[fallbackKey].reasoning,
        action: data.action || FALLBACKS[fallbackKey].action,
        confidence: data.confidence || FALLBACKS[fallbackKey].confidence,
      };
      const answeredAt = new Date().toISOString();

      if (isQuestionRequest && request.question) {
        setQuestionHistory((current) => current.map((item) => (
          item.id === request.requestId
            ? { ...item, status: 'done', answeredAt, answer: nextAnalysis.answer }
            : item
        )));
      }

      if (latestRequestIdRef.current !== request.requestId) {
        return;
      }

      setAnalysis(nextAnalysis);
      setLastAnsweredAt(answeredAt);
    } catch (loadError) {
      console.error('[TabCoach]', loadError);
      const answeredAt = new Date().toISOString();
      const nextAnalysis = FALLBACKS[fallbackKey];

      if (isQuestionRequest && request.question) {
        setQuestionHistory((current) => current.map((item) => (
          item.id === request.requestId
            ? { ...item, status: 'done', answeredAt, answer: nextAnalysis.answer }
            : item
        )));
      }

      if (latestRequestIdRef.current !== request.requestId) {
        return;
      }

      setError(loadError.message || 'Falha ao carregar coach');
      setAnalysis(nextAnalysis);
      setLastAnsweredAt(answeredAt);
    } finally {
      if (latestRequestIdRef.current === request.requestId) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    runCoachRequest(requestState);
  }, [requestState, refreshSeed, runCoachRequest, user?.id]);

  const firstName = profile?.name?.split(' ')?.[0] || 'Atleta';
  const CurrentIcon = requestState.context === 'question' ? MessageSquareText : currentContext.icon;
  const promptRemaining = MAX_QUESTION_LENGTH - questionInput.length;
  const confidenceUi = confidenceStyle(analysis.confidence);
  const lastAnsweredLabel = formatRequestTime(lastAnsweredAt);

  const submitQuestion = (event) => {
    event?.preventDefault?.();
    const trimmed = questionInput.trim();
    if (!trimmed) return;

    setRequestState(buildRequestPayload({
      context: 'question',
      question: trimmed,
      label: 'Pergunta livre',
      mode: 'free',
    }));
    setQuestionInput('');
  };

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
              Analise real e pergunta guiada
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
            onClick={() => {
              setActiveContext(id);
              setRequestState({
                context: id,
                question: '',
                label,
                mode: 'context',
              });
            }}
            className={Badge.neutral}
            style={{
              whiteSpace: 'nowrap',
              background: activeContext === id ? C.purpleBg : 'rgba(255,255,255,0.03)',
              border: activeContext === id ? `1px solid ${C.purpleBorder}` : '1px solid rgba(255,255,255,0.08)',
              color: activeContext === id ? '#fff' : C.textSub,
            }}
          >
            <Icon size={10} style={{ color: activeContext === id ? C.purple : C.neon }} />
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
        <div className="mb-4 flex items-center gap-2.5">
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
              {requestState.context === 'question' ? requestState.label : `contexto ${currentContext.label}`}
            </p>
          </div>
        </div>

        <div className="mb-4">
          <p className="mb-2 text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: C.textSub }}>
            Pergunta guiada
          </p>
          <div className="grid grid-cols-2 gap-2">
            {GUIDED_QUESTIONS.map((item) => (
              <motion.button
                key={item.label}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setQuestionInput('');
                  setRequestState(buildRequestPayload({
                    context: 'question',
                    question: item.question,
                    label: item.label,
                    mode: 'guided',
                  }));
                }}
                className="rounded-[16px] px-3 py-3 text-left text-[11px] font-semibold"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
              >
                {item.label}
              </motion.button>
            ))}
          </div>
        </div>

        <form onSubmit={submitQuestion} className="mb-5 rounded-[18px] p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: C.textSub }}>
              Pergunta livre
            </p>
            <span className="text-[10px] font-semibold" style={{ color: promptRemaining < 18 ? C.red : C.textSub }}>
              {promptRemaining}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              value={questionInput}
              onChange={(event) => setQuestionInput(event.target.value.slice(0, MAX_QUESTION_LENGTH))}
              placeholder="Pergunte sobre treino, recuperacao, evolucao, frequencia ou proxima sessao"
              className="flex-1 bg-transparent text-[12px] font-medium text-white outline-none placeholder:text-neutral-600"
            />
            <motion.button
              type="submit"
              whileTap={{ scale: 0.94 }}
              disabled={!questionInput.trim()}
              className="flex h-10 w-10 items-center justify-center rounded-[12px]"
              style={{
                background: questionInput.trim() ? C.purpleBg : 'rgba(255,255,255,0.05)',
                border: questionInput.trim() ? `1px solid ${C.purpleBorder}` : '1px solid rgba(255,255,255,0.08)',
                color: questionInput.trim() ? '#fff' : C.textSub,
              }}
            >
              <SendHorizontal size={14} />
            </motion.button>
          </div>

          <p className="mt-2 text-[10px] font-medium" style={{ color: C.textSub }}>
            So vale pergunta sobre treino, recuperacao, evolucao, frequencia e proxima sessao.
          </p>
        </form>

        {loading ? (
          <div
            className="flex min-h-[120px] flex-col justify-center gap-3 rounded-[18px] px-4 py-5"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          >
            <LoadingDots />
            <p className="text-[12px] font-medium" style={{ color: C.textSub }}>
              {requestState.context === 'question'
                ? 'Cruzando sua pergunta com treino, frequencia e recuperacao reais...'
                : 'Lendo seus treinos, check-ins e PRs...'}
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

            {questionHistory.length ? (
              <div className="mb-4">
                <p className="mb-2 text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: C.textSub }}>
                  Perguntas recentes
                </p>
                <div className="grid gap-2">
                  {questionHistory.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-[16px] px-3 py-3"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-[11px] font-semibold text-white">{item.question}</p>
                        <span className="shrink-0 text-[9px] font-bold uppercase tracking-[0.14em]" style={{ color: item.status === 'loading' ? C.purple : C.textSub }}>
                          {item.status === 'loading' ? 'Respondendo' : formatRequestTime(item.answeredAt || item.askedAt)}
                        </span>
                      </div>
                      {item.answer ? (
                        <p className="mt-2 text-[10px] font-medium leading-relaxed" style={{ color: 'rgba(255,255,255,0.72)' }}>
                          {item.answer}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div
              className="rounded-[20px] px-4 py-4"
              style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} style={{ color: C.neon }} />
                  <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: C.neon }}>
                    Resposta objetiva
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {lastAnsweredLabel ? (
                    <span className="text-[9px] font-bold uppercase tracking-[0.14em]" style={{ color: C.textSub }}>
                      atualizado {lastAnsweredLabel}
                    </span>
                  ) : null}
                  <div
                    className="rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em]"
                    style={confidenceUi}
                  >
                    {analysis.confidence}
                  </div>
                </div>
              </div>

              <p className="text-[13px] font-medium leading-relaxed text-white">
                {analysis.answer}
              </p>
            </div>

            <div className="mt-4 grid gap-3">
              {analysis.reasoning?.length ? (
                <div>
                  <p className="mb-2 text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: C.textSub }}>
                    Raciocinio
                  </p>
                  <div className="grid gap-2">
                    {analysis.reasoning.map((item) => (
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

              <div>
                <p className="mb-2 text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: C.textSub }}>
                  Acao
                </p>
                <div
                  className="rounded-[16px] px-3 py-3 text-[11px] font-semibold"
                  style={{ background: C.purpleBg, border: `1px solid ${C.purpleBorder}`, color: '#fff' }}
                >
                  <div className="flex items-start gap-2">
                    <Target size={13} style={{ color: C.neon, marginTop: 1, flexShrink: 0 }} />
                    <span>{analysis.action}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-[16px] px-3 py-3 text-[10px] font-semibold" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: C.textSub }}>
                <div className="flex items-center gap-2">
                  <ShieldCheck size={12} style={{ color: C.neon }} />
                  <span>Confianca {analysis.confidence} baseada no seu historico real.</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
