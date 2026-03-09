---
name: pwa-mastery
description: Otimização extrema de PWAs para mobile (iOS/Android).
---

# PWA Mastery Skill

Especialista em manter a experiência de aplicativo nativo no navegador.

## 📱 iOS Startup Optimization

As splash screens no iOS são resoluções específicas. Sempre que atualizar o logotipo, verifique se todas as media queries em `index.html` estão apontando para o arquivo correto.

## 🔊 Audio & Timers

O iOS suspende contextos de áudio de forma agressiva.

- **Regra**: O `audioUnlocker.keepAlive()` deve ser chamado em eventos de `click` ou `startDate` do treino.
- **Background**: Para manter timers ativos, use o `hardcorePWA.js` heartbeat.

## 🔄 Updates "Hardcore"

O ZYRON usa um sistema de atualização forçada. Se houver uma nova versão (`SW_UPDATE`), o app deve recarregar imediatamente para evitar dessincronização de schema com o Supabase.

## 🎭 Manifesto

O `manifest.json` deve incluir `purpose: "any maskable"` para evitar que ícones fiquem com bordas brancas no Android.
