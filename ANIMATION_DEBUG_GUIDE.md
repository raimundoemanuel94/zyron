# 🔧 Guia de Debug — Problemas de Animação

## O que Fazer para Diagnosticar

### 1. Abra o DevTools do Navegador
```
Chrome/Edge:  Pressione F12 ou Ctrl+Shift+I
Firefox:      Pressione F12 ou Ctrl+Shift+I
Safari:       Cmd+Option+I
```

### 2. Vá para a aba "Console"

### 3. Execute o Comando de Diagnóstico
```javascript
animationDiagnostics.summary()
```

Você verá um relatório tipo:
```
📊 ANIMATION SUMMARY
Total exercises logged: 30
✓ Working animations: 28
✗ Failed animations: 2

⚠️ Exercises with missing frames:
  - Elevação de Quadril (Hip Thrust)
  - Panturrilha em Pé
```

### 4. Ver Dados Completos
```javascript
animationDiagnostics.log
```

Mostra qual exercício, qual URL falhou, timestamp, etc.

---

## Problemas Comuns e Soluções

### Problema: "Todas as animações mostram 💪 (fallback)"

**Causa Provável**: As URLs do GitHub estão inacessíveis

**Solução**:
1. Abra `console` (F12)
2. Procure por erros do tipo: `✗ Frame0 failed: https://raw.githubusercontent.com/...`
3. Copie a URL e tente acessar no navegador
4. Se retornar 404 ou erro CORS, contate o mantenedor do free-exercise-db

### Problema: "Alguns exercícios funcionam, outros não"

**Causa Provável**: Nomes do free-exercise-db diferentes da expectativa

**Solução**:
1. Rode `animationDiagnostics.summary()`
2. Identifique qual exercício falhou
3. Vá até `src/data/exerciseAnimations.js`
4. Procure por esse exercício (ex: `'l_ep'`)
5. Verifique o `gif()` mapeado
6. Teste a URL manualmente no navegador

### Problema: "Animação carregou mas não alterna frame0 ↔ frame1"

**Causa Provável**: Problema na lógica de alternância

**Solução**:
1. Abra Console (F12)
2. Execute: `setInterval(() => console.log('Frame' ), 1000)` pra testar
3. Verifique se o intervalo está rodando (deve ver "Frame" a cada 1s)
4. Se não ver, o problema é no `ExerciseAnimation.jsx`

---

## Checklist de Diagnóstico Rápido

- [ ] `animationDiagnostics.summary()` mostra 0 exercícios → Feche e abra um exercício
- [ ] `animationDiagnostics.summary()` mostra muitos ✗ → URLs do GitHub não estão acessíveis
- [ ] Aparece 💪 com "(Animação indisponível)" → Frame não conseguiu carregar (5s timeout)
- [ ] Mostra "Carregando..." eternamente → Timeout configurado errado ou imagem muito lenta
- [ ] Frame0 e Frame1 alternam → ✓ TUDO OK!

---

## Próximos Passos se Não Resolver

Se os problemas persistirem:

1. **Verifique as URLs** do GitHub:
   ```javascript
   // Exemplo: Para 'l_ep' (Elevação de Quadril)
   // Deve ser acessível em:
   https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Weighted_Glute_Bridge/0.jpg
   https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Weighted_Glute_Bridge/1.jpg
   ```

2. **Teste com CURL**:
   ```bash
   curl -I "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Weighted_Glute_Bridge/0.jpg"
   # Deve retornar HTTP 200
   ```

3. **Se CORS for o problema**, considere usar um proxy:
   ```javascript
   // Em exerciseAnimations.js:
   const PROXY = 'https://cors-anywhere.herokuapp.com/';
   const BASE = PROXY + 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';
   ```

---

## Logs que você Verá

### ✓ Sucesso:
```
✓ Frame0 loaded: Elevação de Quadril (Hip Thrust)
✓ Frame1 loaded: Elevação de Quadril (Hip Thrust)
```

### ✗ Falha:
```
✗ Frame0 failed: https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Weighted_Glute_Bridge/0.jpg?t=1743667200
🖼️ Frame0 render error: https://raw.githubusercontent.com/...
```

---

**Dúvidas?** Abra a Console (F12) e veja os logs! 🎯
