# ZYRON APP — MAPEAMENTO COMPLETO DE BUGS

## 🔴 BUGS CRÍTICOS (Funcionamento quebrado)

### BUG 1: Water/Protein não persistem entre recargas
**Localização:** `FichaDeTreinoScreen.jsx` linhas 198-205, 320-330
**Problema:**
- `useState(0)` inicializa sempre com 0
- Carrega do localStorage no useEffect mas DEPOIS sobrescreve com 0

**Solução Implementada:** ✅ CORRIGIDO
- Usar `useState(() => { ... })` para inicializar com localStorage na primeira renderização
- Water e Protein agora carregam do localStorage se for o mesmo dia

---

### BUG 2: Avatar upload — lógica duplicada e conflitante
**Localização:** `FichaDeTreinoScreen.jsx` linhas 180-183
**Problema:**
- Chama `updateProfile()` AND `profileService.patchProfile()` (redundante)
- Conflito: qual atualiza o state? Qual persiste no Supabase?

**Impacto:** ⚠️ Avatar pode atualizar ou não dependendo do contexto
**Status:** ⏳ PENDENTE CORREÇÃO

---

### BUG 3: Exercise completion não persiste
**Localização:** `FichaDeTreinoScreen.jsx`
**Problema:**
- `completedExercises` é state local apenas
- Não está sendo inserido em `workout_logs` table do Supabase
- Quando user recarrega = exercícios completados desaparecem

**Impacto:** ❌ Session progress é perdida ao recarregar
**Status:** ⏳ PENDENTE CORREÇÃO
**Solução esperada:** Inserir em `workout_logs` ao chamar `handleExerciseComplete`

---

### BUG 4: Load tracking — sem persistência
**Localização:** `FichaDeTreinoScreen.jsx`, `WorkoutCard.jsx`
**Problema:**
- `loads` é state local = não persiste entre recargas
- Não há `updateLoad` implementation que salve no Supabase
- Cada exercício perde o peso/reps quando app recarrega

**Impacto:** ❌ User não consegue rastrear progressão real
**Status:** ⏳ PENDENTE CORREÇÃO

---

### BUG 5: Profile sync — múltiplas sources de verdade
**Localização:** Toda a app
**Problema:**
- Weight salvo em localStorage ('gym_weight')
- Weight também está em profile.bio.weightKg no Supabase
- TabEvolucao passa `weight` prop mas carrega de onde?
- Se user atualiza weight em Evolucao, volta pra Home = qual valor?

**Impacto:** ⚠️ Data mismatch entre localStorage e BD
**Status:** ⏳ PENDENTE CORREÇÃO

---

## 🟡 BUGS SECUNDÁRIOS (UI/UX)

### BUG 6: Night mode — não persiste
**Localização:** `FichaDeTreinoScreen.jsx`
**Problema:**
- Toggle muda `nightMode` state
- Não salva em localStorage
- Ao recarregar = volta ao default (light mode)

**Impacto:** ⚠️ User preference perdida
**Status:** ⏳ PENDENTE CORREÇÃO

---

### BUG 7: Notification bell — never displays content
**Localização:** `FichaDeTreinoScreen.jsx`
**Problema:**
- Bell icon shows red dot quando há notificações
- Clique marca como lido mas nunca mostra a mensagem
- User nunca vê o que a notificação dizia

**Impacto:** ⚠️ Feature inútil, confunde user
**Status:** ⏳ PENDENTE CORREÇÃO

---

## 📋 RESUMO POR PRIORIDADE

| Prioridade | Bug | Status | Impacto |
|---|---|---|---|
| 🔴 P1 | Water/Protein não persistem | ✅ CORRIGIDO | User experience |
| 🔴 P1 | Exercise completion não persiste | ⏳ PENDENTE | Dados perdidos |
| 🔴 P1 | Load tracking sem persistência | ⏳ PENDENTE | Impossível rastrear |
| 🟡 P2 | Avatar duplicado updateProfile | ⏳ PENDENTE | Avatar pode não atualizar |
| 🟡 P2 | Profile weight — múltiplas sources | ⏳ PENDENTE | Data mismatch |
| 🟡 P3 | Night mode não persiste | ⏳ PENDENTE | UX ruim |
| 🟡 P3 | Notification content não mostra | ⏳ PENDENTE | Feature incompleta |

---

## ✅ PRÓXIMAS AÇÕES

1. **Urgente:** Implementar `workout_logs` insert ao completar exercício
2. **Urgente:** Salvar `loads` no Supabase com sessão
3. **Important:** Unificar avatar update (remover duplicata)
4. **Important:** Sincronizar weight entre localStorage e BD
5. **Nice-to-have:** Persistir nightMode preference
6. **Nice-to-have:** Mostrar notificação no toast/modal
