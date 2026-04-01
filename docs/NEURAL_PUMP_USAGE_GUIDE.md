# 🎯 Neural Pump - Guia de Uso

## Como Funciona (Visão do Usuário)

### Cenário 1: Usuário Normal
```
1. Abre app Zyron
2. Vai para aba "Treino" 💪
3. Seleciona o treino do dia
4. Clica em um exercício (ex: "Supino Reto")
5. Vê uma notificação: "💎 Neural Pump é um recurso PREMIUM"
6. O corpo continua mostrando o próximo exercício padrão
```

### Cenário 2: Usuário Premium/Admin
```
1. Abre app Zyron
2. Vai para aba "Treino" 💪
3. Seleciona o treino do dia
4. Clica em "Supino Reto" 📌
   ↓
   Corpo acende: PEITO em vermelho intenso com glow
   Badge aparece: "🔴 Neural Pump Ativo"
5. Clica em "Tríceps Corda" 📌
   ↓
   Corpo muda para: TRÍCEPS em vermelho
   Badge continua visível
6. Inicia a série clicando "INICIAR SÉRIE"
   ↓
   Corpo continua mostrando TRÍCEPS (músculo primário)
   Timer começa
7. Finaliza série clicando "FINALIZAR SÉRIE"
   ↓
   Preparação para próximo exercício
8. Clica no próximo exercício
   ↓
   Corpo atualiza para novo grupo muscular
```

## Como Implementar (Visão do Dev)

### Passo 1: Dados do Exercício
Cada exercício possui um `id` (ex: 'p1', 'c1', 'b1')

```javascript
// Em src/data/workoutData.js
const exercise = {
  id: "p1",
  name: "Supino reto barra",
  group: "Peito",  // Campo visual tradicional
  sets: 4,
  reps: "8-12",
  rest: 90
};
```

### Passo 2: Mapeamento (Nova Info)
O arquivo `muscleMapping.js` mapeia exercício → músculos

```javascript
// src/data/muscleMapping.js
export const EXERCISE_MUSCLE_MAP = {
  'p1': {
    primaryMuscles: ['Peito'],
    secondaryMuscles: ['Ombro', 'Tríceps']
  },
  'c1': {
    primaryMuscles: ['Costas'],
    secondaryMuscles: ['Bíceps']
  },
  // ... mais exercícios
};
```

### Passo 3: Hook de Estado
O hook `useMusclePump` gerencia tudo

```javascript
// Em qualquer componente
const {
  activeMuscles,              // ['Peito', 'Ombro', 'Tríceps']
  activePrimaryMuscles,       // ['Peito']
  currentExerciseId,          // 'p1'
  isPremiumUser,              // true/false
  activateMusclePump,         // (exerciseId) => void
  deactivateMusclePump,       // () => void
} = useMusclePump(userRole);

// Ativar pump
activateMusclePump('p1'); // Destaca Peito em vermelho

// Desativar pump
deactivateMusclePump(); // Remove destaque
```

### Passo 4: Integração no Componente
Exemplo de como usar no WorkoutCard:

```javascript
// Em WorkoutCard.jsx
export default function WorkoutCard({
  ex,
  onActivateMuscle,  // ← Novo prop
  isPremiumUser,      // ← Novo prop
  // ... outros props
}) {
  const handleClick = () => {
    setIsExpanded(true);

    // Ativar pump se premium
    if (onActivateMuscle && isPremiumUser) {
      onActivateMuscle(ex.id);
    }
  };

  return (
    <div onClick={handleClick}>
      {/* Card do exercício */}
    </div>
  );
}
```

### Passo 5: AnatomyMap2D - Exibe Músculos
O componente existente já suporta `activeGroup`:

```javascript
// Em AnatomyMap2D.jsx
<AnatomyMap2D
  activeGroup="Peito"  // ← Aceita nome do músculo
/>
```

## Arquitetura de Fluxo de Dados

```
┌─ MusclePumpWrapper (useMusclePump hook) ─────────┐
│                                                    │
│  Estados:                                         │
│  - activeMuscles (todos)                         │
│  - activePrimaryMuscles (principais)             │
│  - isPremiumUser                                 │
│                                                  │
│  Funções:                                        │
│  - activateMusclePump(exerciseId)               │
│  - deactivateMusclePump()                       │
└──────────────────┬──────────────────────────────┘
                   │ Passa props via React.cloneElement
                   ↓
            ┌─ TabTreino ─────────────┐
            │                         │
            │  Recebe props:          │
            │  - onActivateMuscle     │
            │  - isPremiumUser        │
            │  - activePrimaryMuscles │
            └──────────┬──────────────┘
                       │ Renderiza WorkoutCards
                       │ e AnatomyMap2D
                       ↓
        ┌─ WorkoutCard [exercício] ──┐
        │                           │
        │ onClick → onActivateMuscle()
        │ Chama: ex.id              │
        └──────────┬────────────────┘
                   │
        ┌──────────↓────────────────┐
        │ useMusclePump busca em    │
        │ muscleMapping.js:         │
        │ EXERCISE_MUSCLE_MAP[id]   │
        └──────────┬────────────────┘
                   │
        ┌──────────↓────────────────┐
        │ Retorna:                  │
        │ {                         │
        │   primaryMuscles: [...],  │
        │   secondaryMuscles: [...]  │
        │ }                         │
        └──────────┬────────────────┘
                   │ Via TabTreino props
                   ↓
        ┌─ AnatomyMap2D ────────────┐
        │                          │
        │ activeGroup = primaryM.. │
        │ Exibe: Vermelho no corpo │
        └──────────────────────────┘
```

## Exemplo Real: Supino → Tríceps

```javascript
// 1. Usuário clica em "Supino Reto Barra"
//    WorkoutCard recebe click
//    Chama: onActivateMuscle('p1')

// 2. useMusclePump verifica:
const muscleData = EXERCISE_MUSCLE_MAP['p1'];
// Retorna:
// {
//   primaryMuscles: ['Peito'],
//   secondaryMuscles: ['Ombro', 'Tríceps']
// }

// 3. State atualiza:
setActiveMuscles(['Peito', 'Ombro', 'Tríceps']);
setActivePrimaryMuscles(['Peito']);

// 4. TabTreino atualiza AnatomyMap2D:
<AnatomyMap2D activeGroup="Peito" />
// Corpo mostra PEITO em vermelho

// 5. Usuário clica em "Tríceps Corda"
//    Chama: onActivateMuscle('t2')

// 6. useMusclePump busca:
const muscleData = EXERCISE_MUSCLE_MAP['t2'];
// {
//   primaryMuscles: ['Tríceps'],
//   secondaryMuscles: ['Peito']
// }

// 7. State atualiza:
setActiveMuscles(['Tríceps', 'Peito']);
setActivePrimaryMuscles(['Tríceps']);

// 8. AnatomyMap2D recebe:
<AnatomyMap2D activeGroup="Tríceps" />
// Corpo agora mostra TRÍCEPS em vermelho (animação suave)
```

## Checklist de Testes

- [ ] Login como ADMIN
- [ ] Ir para aba Treino
- [ ] Selecionar um treino
- [ ] Clicar em exercício
- [ ] Verificar: Corpo destaca muscular correto?
- [ ] Badge "🔴 Neural Pump Ativo" aparece?
- [ ] Clicar em outro exercício
- [ ] Verificar: Transição suave do destaque?
- [ ] Iniciar série
- [ ] Verificar: Destaque continua visível?
- [ ] Logout e fazer login como USUÁRIO NORMAL
- [ ] Clicar em exercício
- [ ] Verificar: Recebe aviso "💎 Neural Pump é recurso PREMIUM"?

## Troubleshooting

### Destaque não aparece
- [ ] Usuário é ADMIN/PREMIUM?
- [ ] `isAnyAdmin` está retornando true?
- [ ] Músculos estão no muscleMapping.js?

### AnatomyMap2D não atualiza
- [ ] Props `activePrimaryMuscles` chegando correto?
- [ ] `activeGroup` está sendo passado ao componente?

### Badge não aparece
- [ ] `currentExerciseId` está setado?
- [ ] `isPremiumUser` é true?

## Adições Futuras

1. **Analytics**
   - Registrar quais músculos mais trabalhados
   - Gráfico de evolução muscular

2. **Gamificação**
   - Badge "Pompa Mestre" - ativar pump em 10 exercícios
   - Desafio: Completar treino inteiro com pump

3. **Customização**
   - Cor customizável (vermelho, azul, verde)
   - Intensidade do glow
   - Som ao ativar pump

4. **Social**
   - Compartilhar "sessão com pump"
   - Desafio entre amigos: quem ativa pump mais

5. **IA**
   - Sugerir exercícios baseado em grupos musculares
   - "Você trabalhou pouco ombro este mês"
