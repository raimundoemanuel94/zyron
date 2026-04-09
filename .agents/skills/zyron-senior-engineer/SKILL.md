---
name: zyron-senior-engineer
description: Padrões de engenharia sênior para o ecossistema ZYRON.
---

# ZYRON Senior Engineer Skill

Este skill define os padrões técnicos obrigatórios para manutenção e evolução do ZYRON.

## 🛠️ Stack de Alta Performance

- **React 18**: Use Hooks customizados para separar lógica de UI.
- **Tailwind 4**: Priorize as novas diretrizes da v4 (modern CSS features).
- **Vercel Edge**: APIs devem ser `runtime: 'edge'` para latência mínima.
- **Supabase**: Toda mutação deve considerar o RLS.

## 📐 Regras de Ouro

1. **Sanitização de LocalStorage**: Nunca salve o estado global sem passar pelo `sanitizeWorkoutState`. Erros de "Circular Structure" são inaceitáveis.
2. **Offline-First**: Use o hook `useSyncWorkout` para qualquer registro de dados sensíveis (treinos, PRs, água).
3. **UX Industrial**: Animações via Framer Motion devem ser `layout` ou `spring` para transições fluidas. No mobile, use `haptics` para feedbacks de ação.

## 🧪 Verificação

Antes de considerar uma tarefa pronta, verifique:

- Se o PWA continua instalável.
- Se o áudio iOS não foi bloqueado (use `audioUnlocker`).
- Se o build de produção (`npm run build`) não possui erros de exportação ESM.
