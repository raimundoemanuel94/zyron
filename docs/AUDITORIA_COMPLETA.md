# 🔍 AUDITORIA COMPLETA - ZYRON APP
**Data:** 2026-04-06
**Status:** Análise de Frontend + Backend

---

## ✅ BACKEND (SUPABASE) - PROBLEMAS ENCONTRADOS

### 🔴 P1 - CRÍTICO: Erro 400 em workout_logs

**Sintoma:** DevTools mostra erro 400 (Bad Request) ao buscar workout_logs
```
GET /rest/v1/workout_logs?select=created...&order=created_at.asc 400 (Bad Request)
```

**Causa Raiz:** A query está com SELECT inválido. Provavelmente usando coluna que não existe ou sintaxe errada.

**Verificar em Supabase:**
```sql
-- Execute no Supabase SQL Editor:
SELECT column_name FROM information_schema.columns
WHERE table_name='workout_logs' AND table_schema='public';
```

**Solução Esperada:**
- Garantir que todas as colunas referenciadas no front existem
- Revisar a query em `src/services/persistenceService.js` nas funções de `workoutLogs`

---

### 🔴 P2 - CRÍTICO: Storage Bucket 'avatars' Não Existe ou sem Permissão

**Sintoma:** "Erro ao enviar foto. Verifique se o bucket 'avatars' existe"

**Causa Raiz:**
1. Bucket 'avatars' não foi criado no Storage
2. OU policies de storage estão incorretas
3. OU bucket não está como público

**Solução:**
```sql
-- Execute no Supabase SQL Editor:

-- 1. Criar bucket se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Garantir políticas de upload
DROP POLICY IF EXISTS "Enable authenticated uploads" ON storage.objects;
CREATE POLICY "Enable authenticated uploads" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars');

-- 3. Garantir acesso público de leitura
DROP POLICY IF EXISTS "Enable public read access" ON storage.objects;
CREATE POLICY "Enable public read access" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

-- 4. Verificar se bucket realmente existe
SELECT * FROM storage.buckets WHERE id = 'avatars';
```

---

### 🟡 P3 - IMPORTANTE: Schema Incompleto

**Problema:** Algumas tabelas podem estar faltando colunas importantes

**Verificação:**
```sql
-- Tabelas críticas:
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema='public' AND table_name IN
('profiles', 'workout_logs', 'daily_stats', 'body_measurements', 'exercise_prs', 'custom_workouts', 'trainer_students');

-- Deve retornar 7 (se todas existem)
```

**Se faltar alguma tabela:**
- Rodar os SQL files em `database/` na ordem:
  1. `supabase_schema.sql`
  2. `missing_schema.sql`
  3. `rbac_setup.sql`

---

### 🟡 P4 - RLS Policies Podem Estar Bloqueando Inserts

**Problema:** As policies de workout_logs, daily_stats usam `WITH CHECK (auth.uid() = user_id)`

**Quando Falha:**
- Usuário tenta inserir dado mas `auth.uid()` não bate com `user_id`
- Ou autenticação não está sendo passada corretamente

**Verificação:**
```sql
-- No app, verificar se usuario está autenticado:
DevTools Console:
supabase.auth.getSession().then(s => console.log(s))

-- Se retornar null → usuário NÃO está autenticado
```

---

## ✅ FRONTEND (React) - PROBLEMAS & SOLUÇÕES

### 🔴 P1 - useExerciseCompletion Hook Incompleto

**Arquivo:** `src/hooks/usePersistence.js` linhas 208-297

**Problema:**
```javascript
// TODO: Sync to Supabase workout_logs table when fully integrated
```

**O que está quebrado:**
- Dados de exercício completado SÓ salvam em localStorage
- Não sincronizam com Supabase `workout_logs`
- Ao recarregar página = dados são perdidos

**Solução:**
```javascript
// Adicionar ao toggleExercise callback:

const insertWorkoutSession = async (exerciseId, sessionId) => {
  try {
    // 1. Garantir sessão existe
    const { data: session } = await supabase
      .from('workout_logs')
      .insert([{
        user_id: userId,
        workout_key: workoutKey,
        duration_seconds: 0, // TODO: calcular
        completed_at: new Date().toISOString()
      }])
      .select()
      .single();

    // 2. Inserir exercício completado
    if (session?.id) {
      await supabase
        .from('exercise_completions')
        .insert([{
          session_id: session.id,
          user_id: userId,
          exercise_id: exerciseId,
          completed_at: new Date().toISOString()
        }]);
    }
  } catch (err) {
    console.error('Failed to sync exercise completion:', err);
  }
};
```

**Status:** ⏳ PRECISA IMPLEMENTAR

---

### 🔴 P2 - Avatar Upload Não Funciona

**Arquivo:** `src/components/navigation/TabPerfil.jsx` linhas 61-82

**Problema:**
```javascript
await updateProfile({ avatarUrl: publicUrl });
```

**Por que falha:**
1. Bucket 'avatars' pode não existir (veja P2 do backend)
2. Ou a URL do Storage não é válida
3. Ou RLS está bloqueando

**Debug:**
```javascript
// Adicionar ao handleAvatarUpload para ver erro real:
console.error('Upload error:', err.message);
console.error('Full error:', err);
```

---

### 🟡 P3 - Profile Mapper Pode ter Campos Desalinhados

**Arquivo:** `src/core/profile/profileMapper.js`

**Problema:** Se o mapper não conhecer os campos novos do Supabase, dados são perdidos

**O que fazer:**
```
1. Abrir profileMapper.js
2. Verificar se todos os campos do DB estão mapeados
3. Listar colunas:
   SELECT column_name FROM information_schema.columns
   WHERE table_name='profiles' AND table_schema='public'
4. Comparar com o mapProfileToDB e mapDBToProfile
```

---

### 🟡 P4 - useDailyMetrics Não Sincroniza Weight com Profile

**Arquivo:** `src/hooks/usePersistence.js` linhas 13-109

**Problema:**
- Salva peso em `daily_stats.weight_kg`
- Mas `profiles.weight` pode estar desatualizado
- User vê pesos diferentes em abas diferentes

**Solução:**
```javascript
// Quando weight muda, sincronizar AMBAS as tabelas:
updateMetrics({ weightKg: newWeight }).then(() => {
  // Também atualizar profile.weight
  updateProfile({ bio: { weightKg: newWeight } });
});
```

---

## 📋 CHECKLIST DE CORREÇÃO

### Backend (Supabase Dashboard)

- [ ] **Bucket 'avatars'**
  - [ ] Existe e é público?
  - [ ] Policies de upload estão corretas?
  - ```sql
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('avatars', 'avatars', true)
    ON CONFLICT (id) DO NOTHING;
    ```

- [ ] **Tabelas Existem**
  - [ ] profiles
  - [ ] workout_logs
  - [ ] daily_stats
  - [ ] exercise_prs
  - [ ] body_measurements
  - [ ] custom_workouts
  - [ ] trainer_students

- [ ] **RLS Policies**
  - [ ] Testar INSERT em daily_stats como user autenticado
  - [ ] Testar INSERT em workout_logs
  - [ ] Testar SELECT em profiles

- [ ] **Storage Objects Policies**
  ```sql
  -- Listar todas as policies:
  SELECT policyname FROM pg_policies WHERE tablename='objects';
  ```

---

### Frontend (React/Vite)

- [ ] **Implementar useExerciseCompletion Sync**
  - [ ] Inserir em workout_logs ao completar exercício
  - [ ] Sincronizar com Supabase, não só localStorage
  - [ ] Testar: completar exercício → reload → dados persistem?

- [ ] **Debugar Avatar Upload**
  - [ ] Verificar se bucket existe
  - [ ] Adicionar console.log para ver erro real
  - [ ] Testar upload com arquivo pequeno (<1MB)

- [ ] **Unificar Weight em Múltiplas Tabelas**
  - [ ] daily_stats.weight_kg
  - [ ] profiles.weight
  - [ ] Sincronizar quando um muda

- [ ] **Verificar Profile Mapper**
  - [ ] Listar colunas reais em `profiles` table
  - [ ] Comparar com mapProfileToDB
  - [ ] Garantir 1:1 mapping

---

## 🧪 TESTES A FAZER

### Teste 1: Avatar Upload
```
1. Ir para Perfil
2. Clicar em avatar
3. Selecionar imagem (PNG/JPG, <1MB)
4. DevTools → Network → procurar erro
5. DevTools → Console → procurar erro
6. Supabase → Storage → Verificar se arquivo foi criado
7. Se erro: qual é a mensagem?
```

### Teste 2: Daily Stats Persistence
```
1. Adicionar 250ml água
2. Adicionar 30g proteína
3. Refresh página
4. Ambos os valores ainda estão lá?
5. Supabase → daily_stats table → verificar row de hoje
```

### Teste 3: Workout Completion Persistence
```
1. Iniciar treino
2. Marcar alguns exercícios como completos
3. Refresh página
4. Exercícios marcados como completos ainda estão?
5. Supabase → workout_logs table → existem rows de hoje?
```

---

## 📞 PRÓXIMAS AÇÕES

1. **Você executa os SQL fixes no Supabase**
   - Criar bucket 'avatars'
   - Garantir todas as tabelas existem
   - Verificar RLS policies

2. **Você testa no seu servidor local**
   - Avatar upload funciona?
   - Água/proteína salvam?
   - Treinos salvam?

3. **Se algum teste falhar:**
   - Execute no DevTools: `console.log(navigator.userAgent)`
   - Procure por erro específico em Network tab
   - Me passa o erro exato que aparece

---

## 🎯 Comandos SQL para Executar AGORA

Execute estes no Supabase SQL Editor (na ordem):

```sql
-- 1. Criar bucket avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Policies de storage
DROP POLICY IF EXISTS "Enable authenticated uploads to avatars" ON storage.objects;
CREATE POLICY "Enable authenticated uploads to avatars" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Enable public read for avatars" ON storage.objects;
CREATE POLICY "Enable public read for avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- 3. Verificar que bucket foi criado
SELECT id, name, public FROM storage.buckets WHERE id = 'avatars';

-- 4. Verificar todas as tabelas criticas
SELECT tablename FROM pg_tables
WHERE schemaname='public' AND tablename IN
('profiles','workout_logs','daily_stats','exercise_prs','body_measurements','custom_workouts');

-- 5. Verificar workspace_logs schema
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name='workout_logs' AND table_schema='public'
ORDER BY ordinal_position;
```

Se algum comando falhar, anote o erro exato para eu corrigir!
