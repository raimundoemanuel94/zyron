# 🏋️ ExerciseDB Integration Setup

## O que é ExerciseDB?

ExerciseDB é um banco de dados com **11,000+ exercícios** com imagens de qualidade profissional, tipo treinomestre.com.br.

## Como Configurar

### 1. Obtenha sua API Key

1. Acesse: https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb
2. Clique em "Subscribe" (versão free disponível)
3. Copie sua API Key

### 2. Configure no Projeto

Crie um arquivo `.env.local` na raiz do projeto:

```bash
REACT_APP_EXERCISEDB_KEY=sua_api_key_aqui
```

### 3. Como Funciona

```javascript
// O serviço automaticamente:
// 1. Busca a imagem do ExerciseDB
// 2. Salva em cache local (localStorage)
// 3. Próximas vezes carrega do cache (muito rápido!)

import { getExerciseImage } from './utils/exerciseDbService';

const imageData = await getExerciseImage('Barbell Bench Press');
// Retorna: { frame0: gifUrl, frame1: imageUrl, muscles: [...] }
```

## Estrutura do Cache

```javascript
// Exemplo do que fica em cache:
{
  "barbell_bench_press": {
    "frame0": "https://exercisedb.dev/image/...",
    "name": "Barbell Bench Press",
    "muscles": ["Pectorals", "Triceps"]
  }
}
```

## Limpar Cache

```javascript
import { clearCache } from './utils/exerciseDbService';

clearCache(); // Remove tudo e recarrega
```

## Status do Cache

```javascript
import { getCacheStats } from './utils/exerciseDbService';

const stats = getCacheStats();
console.log(stats);
// { exercisesInCache: 30, sizeInKb: "45.3", lastUpdated: "2026-04-01" }
```

## Preços

- **Free**: 100 requisições/dia (suficiente para setup)
- **Pro**: requisições ilimitadas

## Documentação Oficial

- https://www.exercisedb.dev/docs
- https://github.com/ExerciseDB/exercisedb-api

---

**Pronto!** Agora o app carrega imagens profissionais com cache local. 🚀
