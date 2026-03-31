# 💪 ZYRON — A Força da Sua Evolução

**Your AI-Powered Personal Training & Fitness Companion**

[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black)](https://axiron.vercel.app)
[![React](https://img.shields.io/badge/React-18.3.1-blue)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6.0.0-purple)](https://vitejs.dev)
[![Tailwind](https://img.shields.io/badge/Tailwind-4.0-cyan)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-green)](#license)

---

## 🚀 Overview

ZYRON é um aplicativo web progressivo (PWA) de treinamento físico com:

- 🤖 **IA Integrada** — Google Gemini + Groq (Llama 3.3) para coaching inteligente
- 📱 **Offline First** — PWA completo que funciona sem internet
- 🎯 **Mapa Muscular Interativo** — Visualização SVG de músculos ativados por exercício
- 🎨 **UI/UX Moderna** — Animações Framer Motion, Tailwind CSS 4.0
- 🔐 **Segurança** — Autenticação via Supabase + RBAC
- 📊 **Analytics** — Rastreamento de treinos, histórico de cargas, evolução
- 🎵 **Audio** — Música de treino integrada com Groq
- 🌐 **Deploy** — Vercel + Supabase PostgreSQL

**Live Demo:** https://axiron.vercel.app

---

## 📋 Table of Contents

- [Tech Stack](#-tech-stack)
- [Features](#-features)
- [Quick Start](#-quick-start)
- [Development](#-development)
- [Project Structure](#-project-structure)
- [Documentation](#-documentation)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18.3.1 | Component library |
| **Build Tool** | Vite 6.0.0 | Fast bundler |
| **Styling** | Tailwind CSS 4.0 | Utility-first CSS |
| **Animations** | Framer Motion 12.34 | Smooth animations |
| **3D Graphics** | Three.js + React Three Fiber | 3D visualizations |
| **Charts** | Recharts 3.7 | Data visualization |
| **Icons** | Lucide React 0.576 | 200+ SVG icons |
| **Carousel** | Swiper 12.1 | Touch-friendly carousel |
| **Database** | Supabase (PostgreSQL) | Backend + Auth |
| **APIs** | Vercel Functions | Serverless backend |
| **AI** | Google Gemini + Groq | Language models |
| **PWA** | vite-plugin-pwa | Offline support |
| **Package Manager** | npm | Dependency management |
| **Deployment** | Vercel | Hosting + CI/CD |

---

## ✨ Features

### 🏋️ Workout Management
- ✅ Estrutura de treinos (A/B/C/D split)
- ✅ Exercícios customizáveis com séries/repetições
- ✅ Registro automático de cargas (Supino Reto: 100kg → 105kg)
- ✅ Histórico de PR (Personal Record)
- ✅ Timer de descanso com haptic feedback

### 🦵 Anatomical Muscle Mapping
- ✅ Visualização SVG do corpo humano (Frente/Costas/Lado)
- ✅ Músculos destacados por exercício
- ✅ Percentual de ativação muscular
- ✅ Animações suaves com Framer Motion
- ✅ Integração com Supabase para dados dinâmicos

### 🧠 IA Integration
- ✅ Coaching em tempo real com Google Gemini
- ✅ Análise de performance com Groq (Llama 3.3-70B)
- ✅ Geração de sugestões de treino
- ✅ Avaliação de técnica

### 📊 Analytics & Progress
- ✅ Gráficos de evolução de carga (linha)
- ✅ Timeline de progresso muscular
- ✅ Estatísticas de treino por semana
- ✅ Comparação histórica

### 🎵 Audio Experience
- ✅ Playlist de treino integrada
- ✅ Sincronização de batidas com treino
- ✅ Unlock de audio automático (Mobile)

### 👤 User Management
- ✅ Autenticação via Supabase
- ✅ Role-Based Access Control (RBAC)
- ✅ Perfil customizável
- ✅ Preferências de tema

### 📱 PWA Features
- ✅ Funciona offline
- ✅ Instalável em home screen
- ✅ Service Worker automático
- ✅ Sincronização background

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm 9+
- Supabase account (gratuito em supabase.com)
- Google Gemini API key (supabase.com/api/keys)
- Groq API key (console.groq.com)

### Installation

```bash
# Clone repository
git clone https://github.com/raimundoemanuel94/zyron.git
cd zyron

# Install dependencies
npm install

# Create .env.local (copy from .env.example and fill real values)
cp .env.example .env.local

# Edit .env.local with your API keys
# VITE_SUPABASE_URL=your_url
# VITE_SUPABASE_ANON_KEY=your_key
# VITE_GEMINI_API_KEY=your_key
# VITE_GROQ_API_KEY=your_key
```

### Development

```bash
# Start dev server
npm run dev

# Open http://localhost:5173
```

### Build

```bash
# Production build
npm run build

# Preview build
npm run preview
```

---

## 📁 Project Structure

```
src/
├── App.jsx                 # Main app component
├── main.jsx               # Entry point
├── index.css              # Global styles + Tailwind
│
├── components/            # React components
│   ├── screens/           # Full-screen views
│   ├── workout/           # Workout-related
│   ├── anatomy/           # Muscle visualization
│   ├── navigation/        # Tab navigation
│   ├── admin/             # Admin panel
│   └── shared/            # Reusable components
│
├── contexts/              # React Context
│   ├── AuthContext.jsx    # Authentication
│   ├── MusicContext.jsx   # Music player
│   └── ThemeContext.jsx   # Theme (dark/light)
│
├── hooks/                 # Custom React hooks
│   ├── useMusclePump.js   # Muscle activation
│   └── useSyncWorkout.js  # Workout sync
│
├── lib/                   # External integrations
│   ├── supabase.js        # Supabase client
│   └── gemini.js          # Google Gemini AI
│
├── utils/                 # Utility functions
│   ├── db.js              # Database helpers
│   ├── haptics.js         # Vibration feedback
│   ├── audioUnlock.js     # Mobile audio unlock
│   └── logger.js          # Logging
│
└── data/                  # Static data
    ├── workoutData.js     # Workout routines
    └── muscleMapping.js   # Muscle definitions
```

**Detalhes completos:** Ver [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

---

## 📚 Documentation

Documentação completa está em `docs/`:

| Documento | Propósito |
|-----------|-----------|
| [docs/QUICK_START.md](docs/QUICK_START.md) | Setup rápido e dicas |
| [docs/ANATOMY.md](docs/ANATOMY.md) | Sistema de mapa muscular |
| [docs/IMPLEMENTATION.md](docs/IMPLEMENTATION.md) | Detalhes de implementação |
| [docs/AI_MODELS.md](docs/AI_MODELS.md) | Google Gemini + Groq setup |
| [docs/API.md](docs/API.md) | API endpoints (Vercel Functions) |
| [docs/DATABASE.md](docs/DATABASE.md) | Schema do Supabase |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Deploy na Vercel |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Arquitetura geral |

---

## 🔧 Development

### Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/nova-feature

# Make changes and commit
git add .
git commit -m "feat: describe your feature"

# Push and create PR
git push origin feature/nova-feature
```

### Code Style

- **Prettier**: Formatter automático (configured em `.prettierrc`)
- **ESLint**: Linter (config em `.eslintrc.json`)
- **Tailwind**: Utility-first CSS classes
- **Components**: Functional components with hooks

---

## 🚀 Deployment

### Vercel (Recommended)

1. Push para GitHub
2. Conecte seu repo em https://vercel.com
3. Configure variáveis de ambiente:
   ```
   VITE_SUPABASE_URL
   VITE_SUPABASE_ANON_KEY
   VITE_GEMINI_API_KEY
   VITE_GROQ_API_KEY
   ```
4. Deploy automático em cada push!

**Live:** https://axiron.vercel.app

### Supabase Setup

```sql
-- Execute em Supabase SQL Editor:
-- Ver docs/DATABASE.md para full schema

-- Anatomy tables
CREATE TABLE muscles (...)
CREATE TABLE exercises_muscles (...)

-- User tables
CREATE TABLE users (...)
CREATE TABLE workouts (...)
```

Ver [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) para passo-a-passo completo.

---

## 🤝 Contributing

Contribuições são bem-vindas!

1. Fork o repositório
2. Crie uma branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'feat: Add AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

Ver [CONTRIBUTING.md](.github/CONTRIBUTING.md) para detalhes.

---

## 📄 License

Este projeto está licenciado sob a MIT License — veja [LICENSE](LICENSE) para detalhes.

---

## 👤 Author

**Raimundo Emanuel**

- GitHub: [@raimundoemanuel94](https://github.com/raimundoemanuel94)
- Email: raiiimundoemanuel2018@gmail.com

---

## 🙏 Acknowledgments

- React team para o excelente framework
- Vercel pelo hosting e CI/CD
- Supabase pelo backend gratuito
- Google + Groq pelas APIs de IA
- Comunidade open-source 💚

---

## 📞 Support

Tem dúvidas ou encontrou um bug?

- 🐛 **Bug Report:** Abra uma [Issue](https://github.com/raimundoemanuel94/zyron/issues)
- 💬 **Feature Request:** Abra uma [Discussion](https://github.com/raimundoemanuel94/zyron/discussions)
- 📧 **Email:** raiiimundoemanuel2018@gmail.com

---

**Desenvolvido com 💪 e ❤️ por Raimundo Emanuel**

*Last updated: March 31, 2026*
