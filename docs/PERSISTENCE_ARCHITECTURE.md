# ZYRON — PLANO DE ARQUITETURA DE PERSISTÊNCIA

## 📋 Análise Atual

### Estado Crítico
- `completedExercises` = state local apenas
- `loads` = state local apenas
- `water`, `protein` = localStorage básico (sem BD)
- `weight` = localStorage + Supabase (conflitante)
- `avatar` = 2 fluxos simultâneos (bug)
- `nightMode` = state apenas (perdido ao recarregar)

### Fonte de Verdade Hoje
- FichaDeTreinoScreen.jsx: tudo em state local
- localStorage: backup frágil
- Supabase: `profiles` table, nada mais

---

## 🏗️ ARQUITETURA ALVO

```
User Action
    ↓
[Local State Update]  ← UX imediata (otimista)
    ↓
[Supabase Save] ← Background persistence
    ↓
[localStorage Cache] ← Optional fallback
```

### Regra de Ouro
1. **Supabase é sempre a fonte oficial**
2. **localStorage = cache para offline/rapidez**
3. **State local = UX responsiva apenas**
4. **Nunca confiar 100% em state local**

---

## 📁 ARQUIVOS A CRIAR

### Novos (Persistência)
1. `src/services/persistenceService.js` — Wrappers Supabase CRUD
2. `src/hooks/usePersistence.js` — Custom hooks para persistência
3. `src/hooks/usePreferences.js` — User preferences (night mode)
4. `src/components/NotificationSheet.jsx` — Notification display

### Modificar (Integração)
1. `src/components/screens/FichaDeTreinoScreen.jsx` — integrar hooks
2. `src/components/navigation/TabPainel.jsx` — daily metrics
3. `src/components/navigation/TabEvolucao.jsx` — weight sync
4. `src/components/navigation/TabPerfil.jsx` — avatar fix
5. `src/components/workout/WorkoutCard.jsx` — load persistence

### Não Tocar
- `src/styles/` — Visual identity permanece 100% igual
- Layout/routing — Navegação existente
- Component names — Sem refatoração

---

## 🔄 FLUXOS POR FEATURE

### P1: Exercise Completion
```
User clica ✓
  ↓
setCompletedExercises([...])  [Local]
  ↓
insertWorkoutSessionIfNeeded()  [BD]
  ↓
upsertExerciseCompletion()  [BD]
  ↓
Se erro: rollback + toast
```

### P1: Load Management
```
User muda peso/reps
  ↓
setLoads({ [ex.id]: newLoad })  [Local]
  ↓
upsertExerciseLoad()  [BD]
  ↓
localStorage fallback
```

### P2: Avatar Unification
```
User upload avatar
  ↓
uploadStorage()  [Supabase Storage]
  ↓
updateProfile({ avatar_url })  [Único fluxo]
  ↓
setLocalAvatarUrl()  [Local]
```

### P2: Weight Unification
```
User muda peso em Evolução
  ↓
setWeight()  [Local]
  ↓
updateProfile({ bio.weightKg })  [BD Official]
  ↓
upsertDailyMetric()  [BD History]
```

### P3: Night Mode
```
User toggle
  ↓
setNightMode()  [Local]
  ↓
upsertUserPreference()  [BD Async]
  ↓
localStorage
```

### P3: Notifications
```
User clica sino
  ↓
fetchNotifications()  [BD]
  ↓
Abre NotificationSheet com lista
  ↓
markAsRead() ao clicar notif
```

---

## 📊 TABELAS SUPABASE NECESSÁRIAS

Precisam ser criadas (ou ajustadas) no Supabase:

```sql
-- workout_sessions — agrupador de exercícios do dia
CREATE TABLE workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  workout_key INT CHECK (workout_key BETWEEN 0 AND 6),
  session_date DATE,
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'paused'
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, session_date, workout_key)
);

-- exercise_completions — cada exercício concluído
CREATE TABLE exercise_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES workout_sessions,
  user_id UUID REFERENCES auth.users NOT NULL,
  exercise_id INT,
  exercise_name TEXT,
  completed_at TIMESTAMP DEFAULT NOW(),
  reps INT,
  sets INT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(session_id, exercise_id)
);

-- exercise_loads — progressão de peso
CREATE TABLE exercise_loads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  exercise_id INT,
  exercise_name TEXT,
  load_kg FLOAT,
  reps INT,
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, exercise_id)
);

-- daily_metrics — water, protein, weight por dia
CREATE TABLE daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  metric_date DATE,
  water_ml INT DEFAULT 0,
  protein_g INT DEFAULT 0,
  weight_kg FLOAT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, metric_date)
);

-- user_preferences — night mode, language, etc
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users UNIQUE NOT NULL,
  night_mode BOOLEAN DEFAULT FALSE,
  language TEXT DEFAULT 'pt-BR',
  notifications_enabled BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: Infrastructure
- [ ] Criar `persistenceService.js`
- [ ] Criar `usePersistence.js` com stubs
- [ ] Criar `usePreferences.js`
- [ ] Validar sem erros

### Fase 2: P1 Crítico
- [ ] Exercise completion → workout_sessions + exercise_completions
- [ ] Load tracking → exercise_loads
- [ ] Hidratação de state ao montar
- [ ] Testes end-to-end

### Fase 3: P2 Important
- [ ] Avatar unification (remover duplicata)
- [ ] Weight unification (localStorage + BD)
- [ ] Daily metrics sync
- [ ] Testes

### Fase 4: P3 Nice-to-have
- [ ] Night mode persistence
- [ ] NotificationSheet component
- [ ] Polish

---

## ⚠️ SEGURANÇA & REGRAS

- ✅ **RLS Rows:** Todos os inserts filtram por `user_id = auth.uid()`
- ✅ **Offline:** localStorage como fallback, não oficial
- ✅ **Concurrency:** UNIQUE constraints para evitar duplicatas
- ✅ **Timestamps:** `NOW()` server-side, não client
- ✅ **Error handling:** Toast + rollback se Supabase falhar
- ✅ **Visual:** Zero mudanças na estética

---

## 📦 Dependências

Todas já existem:
- ✅ @supabase/supabase-js
- ✅ framer-motion
- ✅ lucide-react
