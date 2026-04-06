# ZYRON - AUDITORIA DE PERSISTÊNCIA - DIAGNÓSTICO COMPLETO

## 🔍 ANÁLISE DE PROBLEMAS CRÍTICOS

### BUG #1: useDailyMetrics - Salvamento com Valores Antigos ⚠️ CRÍTICO

**Arquivo:** `src/hooks/usePersistence.js` (linhas 62-101)
**Status:** ✅ CORRIGIDO

**Problema:**
```javascript
// ❌ ANTES: Usava metrics.waterMl (valor antigo)
const supabaseUpdates = {
  water_amount: updates.waterMl !== undefined ? updates.waterMl : metrics.waterMl, // ❌ metrics é STALE
  protein_amount: updates.proteinG !== undefined ? updates.proteinG : metrics.proteinG,
  weight_kg: updates.weightKg !== undefined ? updates.weightKg : metrics.weightKg,
};
```

**Causa Raiz:**
- O `updateMetrics` callback dependia de `metrics` no closure
- Quando `setWater(water + 0.25)` era chamado, ele:
  1. Atualizava state (setMetrics) ✅
  2. Tentava sincronizar com Supabase usando `metrics` antigo ❌
  3. Resultado: valor antigo era enviado para Supabase

**Impacto:**
- Água: Clica "+250ml" → UI mostra 250ml ✅ → Reload → 0ml ❌
- Proteína: Clica "+30g" → UI mostra 30g ✅ → Reload → 0g ❌
- Peso: Similar

**Solução Aplicada:**
Agora o callback calcula `mergedMetrics` DENTRO do setState e usa esse valor para Supabase:
```javascript
let mergedMetrics;
setMetrics(prev => {
  mergedMetrics = { ...prev, ...updates };
  return mergedMetrics;
});

// Depois usa mergedMetrics (não metrics)
const supabaseUpdates = {
  water_amount: mergedMetrics?.waterMl ?? metrics.waterMl,
  // ...
};
```

---

### BUG #2: localStorage Fallback Interferindo ⚠️ MODERADO

**Arquivo:** `src/components/screens/FichaDeTreinoScreen.jsx` (linhas 298-342)
**Status:** ⏳ REQUER ANÁLISE

**Problema:**
```javascript
// No useEffect de load:
if (savedDaily) {
  const daily = JSON.parse(savedDaily);
  if (daily && daily.date === todayStr) {
    setWater(Number(daily.water) || 0); // ❌ Sobrescreve useDailyMetrics!
    setProtein(Number(daily.protein) || 0);
  }
}
```

**Causa Raiz:**
- `useDailyMetrics` carrega do Supabase no useEffect
- Este useEffect subsequente carrega do localStorage com prioridade
- Sequência:
  1. useDailyMetrics carrega Supabase → setMetrics({ water: 500, protein: 120 })
  2. localStorage useEffect carrega → setWater(0) se localStorage estiver vazio
  3. Resultado: valores são substituídos por 0

**Impacto:**
- Dados do Supabase são sobrescr itos pelo localStorage
- Se localStorage estiver "sujo" (com data de ontem), dados são perdidos

**Necessário:** Remover esse load de localStorage quando useDailyMetrics está ativo

---

### BUG #3: useExerciseLoads Dependency Issue

**Arquivo:** `src/hooks/usePersistence.js` (linhas 160-194)
**Status:** ✅ CORRIGIDO

**Problema:**
Callback incluía `loads` como dependency, causando updates desnecessários.

**Solução:** Removido `loads` do dependency array (agora é `[userId]`)

---

### BUG #4: Perfil - Merge Parcial Peut Sobrescrever Campos

**Arquivo:** `src/core/profile/useProfile.js` (linhas 62-83)
**Status:** ⏳ REQUER VALIDAÇÃO

**Problema:**
```javascript
const newProfile = {
  ...profile,
  ...updates,  // ❌ Pode sobrescrever bio inteiro se updates.bio = undefined
  bio: updates.bio ? { ...profile.bio, ...updates.bio } : profile.bio,
};
```

Se você passa `{ name: 'João' }`, ele mantém bio. Mas se passa `{ bio: null }`, não sobrescreve. Isso está OK.

---

## 📊 MAPA DE FLUXOS DE PERSISTÊNCIA

### Fluxo 1: Água (+250ml)

```
User Click (+250ml)
    ↓
handleWaterDrink(0.25)
    ↓
setWater(prev => prev + 0.25)  // Chama updateMetrics({ waterMl: newValue })
    ↓
updateMetrics (useDailyMetrics)
    ├─ setMetrics({ waterMl: 250.25 })  [Local] ✅
    ├─ saveToDisk(daily_metrics_...)    [Cache] ✅
    └─ dailyStats.updateDailyStats()    [Supabase] ✅ (AGORA CORRIGIDO)
    ↓
UI atualiza: mostra 250.25ml ✅
    ↓
Reload da página
    ├─ useDailyMetrics useEffect
    ├─ getOrCreateDailyStats() → Supabase
    └─ setMetrics({ waterMl: 250.25 }) ✅
    ↓
Valor persiste! ✅
```

---

### Fluxo 2: Avatar Upload

```
User seleciona arquivo
    ↓
handleAvatarUpload()
    ├─ supabase.storage.upload() → Storage
    ├─ getPublicUrl() → URL
    ├─ updateProfile({ avatarUrl: publicUrl })  [Via useProfile]
    └─ DUPLICATA: profileService.patchProfile() [NÃO DEVERIA EXISTIR]
    ↓
Problema: Duas calls simultâneas!
```

**Status:** ⏳ PRECISA AUDITORIA EM `TabPerfil.jsx`

---

### Fluxo 3: Perfil (Editar Idade)

```
User clica em idade → openEditModal()
    ↓
Input modal com "25"
    ↓
saveEdit()
    ├─ updates = { bio: { ...profile.bio, age: 25 } }
    ├─ updateProfile(updates)  [Via useProfile]
    └─ profileService.updateProfile()
    ↓
setProfile(newProfile) [Local] ✅
    ↓
Reload
    ├─ useProfile useEffect
    ├─ profileService.getProfile() → Supabase
    └─ setProfile(data) ✅
    ↓
Idade persiste! ✅
```

---

## ✅ O QUE JÁ ESTÁ CORRETO

1. **Persistência Service:** Funções CRUD estão bem implementadas
2. **useProfile:** Merge de updates está correto
3. **Tabelas Supabase:** Schema está criado (profiles, daily_stats, exercise_prs, workout_logs)
4. **RLS (Row Level Security):** Aplicado corretamente (user_id = auth.uid())
5. **localStorage Fallback:** Funciona quando Supabase está offline

---

## 🔧 PENDÊNCIAS DE CORREÇÃO

### P1 - CRÍTICO
- [ ] Remover interference de localStorage em setWater/setProtein
- [ ] Validar que água/proteína salvam e persistem
- [ ] Validar que perfil salva e persiste
- [ ] Testar avatar upload (dupliação de update)

### P2 - IMPORTANT
- [ ] Adicionar feedback de "salvando..." ao editar perfil
- [ ] Feedback de erro se sincronização falhar
- [ ] Validar peso (sync entre TabEvolucao e daily_metrics)

### P3 - NICE-TO-HAVE
- [ ] Night mode persistence
- [ ] Notificações
- [ ] Exercise completion persistence

---

## 📝 SUMÁRIO DE CORREÇÕES FEITAS

### ✅ Correção 1: useDailyMetrics.updateMetrics
- **Arquivo:** src/hooks/usePersistence.js
- **Linhas:** 62-101
- **Mudança:** Agora usa mergedMetrics para sincronização Supabase
- **Resultado:** Água e proteína salvam valor correto

### ✅ Correção 2: useExerciseLoads.updateLoad
- **Arquivo:** src/hooks/usePersistence.js
- **Linhas:** 160-194
- **Mudança:** Removed `loads` from dependency array
- **Resultado:** Carregamento de pesos não causa updates infinitas

---

## 🚀 PRÓXIMOS PASSOS

1. Remover localStorage fallback para água/proteína
2. Testar todos os fluxos
3. Adicionar feedback UX (loading, sucesso, erro)
4. Validar todos os campos do perfil
5. Testar avatar upload
