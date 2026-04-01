# Neural Pump - Implementação de Destaque Muscular Interativo

## 📋 Resumo
Sistema premium que destaca dinamicamente os músculos sendo trabalhados durante a sessão de treino. Ao clicar em um exercício, o corpo no "Neural Monitor" acende em vermelho mostrando quais músculos estão sendo ativados.

## 🎯 Funcionalidades Implementadas

### 1. **Mapeamento de Músculos por Exercício**
- **Arquivo**: `src/data/muscleMapping.js`
- Mapeia cada exercício para seus músculos primários e secundários
- Exemplo:
  - Supino reto (p1) → Peito (primário), Ombro + Tríceps (secundários)
  - Puxada aberta (c1) → Costas (primário), Bíceps (secundário)

### 2. **Hook Custom `useMusclePump`**
- **Arquivo**: `src/hooks/useMusclePump.js`
- Gerencia estado dos músculos ativos
- Verifica permissão premium do usuário
- Retorna:
  - `activeMuscles`: Todos os músculos (primários + secundários)
  - `activePrimaryMuscles`: Apenas músculos principais
  - `activateMusclePump(exerciseId)`: Ativa destaque
  - `deactivateMusclePump()`: Desativa destaque
  - `isPremiumUser`: Verifica acesso premium

### 3. **Componente `MusclePumpWrapper`**
- **Arquivo**: `src/components/MusclePumpWrapper.jsx`
- Wrapper que envolve TabTreino
- Injeta props de músculo nos componentes filhos
- Mostra badge "Neural Pump Ativo" durante treino
- Exibe aviso para usuários não-premium

### 4. **Integração no `WorkoutCard`**
- **Arquivo**: `src/components/WorkoutCard.jsx`
- Aceita props: `onActivateMuscle` e `isPremiumUser`
- Ativa músculos ao:
  - Clicar no card do exercício
  - Iniciar uma série
- Apenas funciona para usuários premium

### 5. **Integração no `TabTreino`**
- **Arquivo**: `src/components/tabs/TabTreino.jsx`
- Recebe props de destaque muscular
- Passa `onActivateMuscle` para cada `WorkoutCard`
- Alimenta `AnatomyMap2D` com o músculo ativo:
  ```jsx
  activeGroup={
    isPremiumUser && activePrimaryMuscles?.length > 0
      ? activePrimaryMuscles[0]
      : currentWorkout.exercises.find(e => !completedExercises.includes(e.id))?.group
  }
  ```

### 6. **Integração no `FichaDeTreinoScreen`**
- **Arquivo**: `src/components/FichaDeTreinoScreen.jsx`
- Envolve TabTreino com `MusclePumpWrapper`
- Passa userRole (ADMIN/USER)
- Estrutura:
  ```jsx
  <MusclePumpWrapper userRole={isAnyAdmin ? 'ADMIN' : 'USER'} isTraining={isTraining}>
    <TabTreino ... />
  </MusclePumpWrapper>
  ```

## 🎮 Fluxo de Interação

1. **Usuário abre a aba Treino** → TabTreino é envolto por MusclePumpWrapper
2. **Clica em um exercício** → WorkoutCard chama `onActivateMuscle(ex.id)`
3. **useMusclePump recupera músculos** do mapeamento
4. **AnatomyMap2D atualiza** exibindo o músculo primário em vermelho brilhante
5. **Badge aparece**: "🔴 Neural Pump Ativo"
6. **Ao finalizar a série** → Corpo continua mostrando o músculo ativo

## 🔐 Controle de Acesso Premium

### Quem tem acesso:
- ✅ ADMIN
- ✅ PERSONAL (treinador)
- ❌ Usuários normais (recebem aviso)

### No código:
```javascript
const isPremiumUser = userRole === 'PREMIUM' || userRole === 'ADMIN' || userRole === 'PERSONAL';
```

## 🎨 Visual/UX

### Neural Monitor (AnatomyMap2D)
- Vermelho intenso (#ef4444) com glow
- Resplandor que pulsa suavemente
- Transição suave entre músculos
- Mostra "PUMP ATIVO" vs "EM ESPERA"

### Badge de Pump
- Posição: top-right fixed
- Cor: vermelho semi-transparente
- Mostra apenas quando treino está ativo e pump é ativado

### Aviso Premium
- Posição: bottom-center fixed
- Cor: âmbar
- Desaparece ao upgrade para premium

## 📊 Arquivos Criados/Modificados

### ✨ Novos:
- `src/data/muscleMapping.js` - Mapeamento exercício → músculos
- `src/hooks/useMusclePump.js` - Hook de gerenciamento de estado
- `src/components/MusclePumpWrapper.jsx` - Wrapper de integração

### ✏️ Modificados:
- `src/components/WorkoutCard.jsx` - Adicionado `onActivateMuscle` callback
- `src/components/tabs/TabTreino.jsx` - Integração de props de músculos
- `src/components/FichaDeTreinoScreen.jsx` - Adicionado wrapper

## 🧪 Próximos Passos para Teste

1. **Teste Local**:
   ```bash
   npm run dev
   ```
   - Navegar para aba "Treino"
   - Clicar em um exercício
   - Verificar se o corpo destaca o músculo correto

2. **Teste Premium**:
   - Logar como admin
   - Verificar que o pump funciona
   - Logar como user normal
   - Verificar que recebe aviso premium

3. **Teste de Transição**:
   - Clicar em múltiplos exercícios
   - Verificar suavidade da transição
   - Conferir timing da animação

## 🚀 Melhorias Futuras

- [ ] Adicionar toggle para habilitar/desabilitar pump
- [ ] Efeito de "bomba" mais intenso ao finalizar séries
- [ ] Sons de feedback ao ativar músculos
- [ ] Histórico de músculos trabalhados por treino
- [ ] Mapa 3D (já existe `Anatomy3D.jsx`)
- [ ] Dificuldade: Normal/Hardcore com mais efeitos
