# ZYRON Project Context

## vite.config.js
```js
// Force Deployment Trigger: 2026-03-09T20:05:00Z
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "prompt",
      includeAssets: [
        'favicon.ico', 
        'apple-touch-icon.png', 
        'images/zyron-logo.png',
        'images/zyron-192.png',
        'images/zyron-512.png'
      ],
      manifest: {
        id: "com.zyron.app",
        name: "ZYRON — A Força da Sua Evolução",
        short_name: "ZYRON",
        description: "Seu personal trainer de IA. A Força da Sua Evolução.",
        theme_color: "#000000",
        background_color: "#000000",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        categories: ["fitness", "lifestyle", "productivity"],
        screenshots: [
          {
            src: "/images/zyron-512.png",
            sizes: "512x512",
            type: "image/png",
            form_factor: "narrow",
            label: "Home Screen"
          },
          {
            src: "/images/zyron-512.png",
            sizes: "512x512",
            type: "image/png",
            form_factor: "wide",
            label: "Dashboard View"
          }
        ],
        icons: [
          {
            src: "/images/zyron-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/images/zyron-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/images/zyron-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable"
          },
          {
            src: "/images/zyron-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "unsplash-images",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 7,
              },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-api",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5,
              },
            },
          },
          {
            urlPattern: /^https:\/\/www\.youtube\.com\/iframe_api/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "youtube-api",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24, // 1 day
              },
            },
          },
        ],
      },
    }),
    {
      name: 'api-proxy',
      configureServer(server) {
        server.middlewares.use('/api/search', async (req, res) => {
          try {
            const url = new URL(req.url, `http://${req.headers.host}`);
            const q = url.searchParams.get('q');
            if (!q) {
              res.statusCode = 400;
              return res.end(JSON.stringify({ error: 'Missing query' }));
            }
            
            const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
            const response = await fetch(searchUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
              }
            });
            
            const html = await response.text();
            const match = html.match(/var ytInitialData = (\{.*?\});<\/script>/);
            
            if (match && match[1]) {
              const data = JSON.parse(match[1]);
              const contents = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents;
              
              if (contents && contents.length > 0) {
                const results = contents
                  .filter(c => c.videoRenderer)
                  .map(c => {
                     const id = c.videoRenderer.videoId;
                     return {
                       id: id,
                       title: c.videoRenderer.title?.runs?.[0]?.text || 'ZYRON Audio',
                       thumbnail: `https://img.youtube.com/vi/${id}/mqdefault.jpg`,
                       artist: c.videoRenderer.ownerText?.runs?.[0]?.text || 'YouTube'
                     };
                  });
                  
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify(results.slice(0, 15)));
              }
            }
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Parse Error' }));
          } catch(e) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e.message }));
          }
        });
      }
    }
  ],
});

```

## package.json
```json
{
  "name": "zyron",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "@google/genai": "^1.43.0",
    "@react-three/drei": "^9.122.0",
    "@react-three/fiber": "^8.17.10",
    "@supabase/supabase-js": "^2.98.0",
    "@types/three": "^0.163.0",
    "@vercel/speed-insights": "^1.3.1",
    "framer-motion": "^12.34.4",
    "lucide-react": "^0.576.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "recharts": "^3.7.0",
    "swiper": "^12.1.2",
    "three": "^0.163.0"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "@vitejs/plugin-react-swc": "^3.5.0",
    "http-proxy-middleware": "^3.0.5",
    "tailwindcss": "^4.0.0",
    "vite": "^6.0.0",
    "vite-plugin-pwa": "^1.2.0"
  }
}

```

## src/App.jsx
```jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './lib/supabase';
import logger from './utils/logger';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { MusicProvider } from './contexts/MusicContext';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import FichaDeTreinoScreen from './components/FichaDeTreinoScreen';
import GlobalPlayer from './components/GlobalPlayer';
import OnboardingScreen from './components/OnboardingScreen';
import LoginScreen from './components/LoginScreen';
import AdminScreen from './components/AdminScreen';
import ErrorBoundary from './components/ErrorBoundary';
import ErrorDiagnostics from './components/ErrorDiagnostics';
import ErrorLogger from './components/ErrorLogger';
import PWASplashScreen from './components/PWASplashScreen';
import ForceUpdateBanner from './components/ForceUpdateBanner';
import RBACGuard from './components/RBACGuard';
import PersonalDashboard from './components/admin/PersonalDashboard';
import audioUnlocker from './utils/audioUnlock.js';

const DebugOverlay = ({ user, userRole, viewManager }) => (
  <div className="fixed bottom-0 left-0 right-0 bg-black/90 border-t border-yellow-500/20 p-2 z-50 text-[8px] font-mono flex justify-around items-center backdrop-blur-md">
    <div className="flex gap-4">
      <span className="text-neutral-500 uppercase">UID:</span>
      <span className="text-white">{user?.id?.slice(0, 8)}...</span>
    </div>
    <div className="flex gap-4">
      <span className="text-neutral-500 uppercase">ROLE:</span>
      <span className="text-yellow-400 font-bold">{userRole || 'FETCHING...'}</span>
    </div>
    <div className="flex gap-4">
      <span className="text-neutral-500 uppercase">VIEW:</span>
      <span className="text-white uppercase">{viewManager}</span>
    </div>
  </div>
);

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true); // ← NOVO: evita flash de login
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'USER' | 'PERSONAL' | 'ADMIN'
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [viewManager, setViewManager] = useState('app'); // 'app' | 'admin' | 'personal'
  const globalConstraintsRef = useRef(null);

  // Initial Auth Sync
  useEffect(() => {
    // Inicializar logger
    logger.systemEvent('App inicializado', {
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    });


    // ── Auth sempre verificado, independente do PWA ──────────────────────
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        logger.userAction('Login automático via sessão', {
          userId: session.user.id,
          email: session.user.email
        });
        setIsAuthenticated(true);
        setUser(session.user);
      }
      setAuthLoading(false); // ← Libera a tela só após confirmar o estado de auth
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        logger.userAction('Usuário autenticado', {
          userId: session.user.id,
          email: session.user.email,
          event: _event
        });
        setIsAuthenticated(true);
        setUser(session.user);
      } else {
        logger.userAction('Usuário deslogado', { event: _event });
        setIsAuthenticated(false);
        setUser(null);
      }
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []); // ← Array vazio: hardcorePWA é import estático, nunca muda


  const handleLogin = (sessionUser) => {
    setUser(sessionUser);
    setIsAuthenticated(true);
    setShowOnboarding(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUser(null);
    setViewManager('app');
  };

  return (
    <MusicProvider>
      {/* 
         THE BACKBONE: This container holds the constraints for the entire app.
         The media layer lives here as a sibling to the views, ensuring it NEVER unmounts.
      */}
      <div 
        ref={globalConstraintsRef} 
        className="relative min-h-screen w-full bg-black overflow-x-hidden selection:bg-yellow-400 selection:text-black"
      >
        {/* 
           GLOBAL MEDIA LAYER: Outside conditional logic but inside MusicProvider.
           Persistent across ALL application states.
        */}
        {isAuthenticated && (
          <GlobalPlayer constraintsRef={globalConstraintsRef} />
        )}
        
        {/* Redundant banners removed by user request */}

        
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white overflow-hidden">
          <SpeedInsights />
          {/* PWA Install Banner */}
          <ForceUpdateBanner />

          {/* ── Aguarda Supabase confirmar auth antes de renderizar qualquer tela ── */}
          {authLoading ? (
            <div className="fixed inset-0 bg-black z-50" />
          ) : (
          <AnimatePresence mode="wait">
            {!isAuthenticated ? (
              showOnboarding ? (
                <motion.div 
                  key="onboarding" 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }} 
                  className="w-full"
                >
                  <OnboardingScreen onComplete={handleLogin} onCancel={() => setShowOnboarding(false)} />
                </motion.div>
              ) : (
                <motion.div 
                  key="login" 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }} 
                  className="w-full"
                >
                  <LoginScreen onLogin={handleLogin} onRegisterClick={() => setShowOnboarding(true)} />
                </motion.div>
              )
            ) : (
              <RBACGuard user={user} onRoleVerified={(role) => {
                console.log('[App] Role verified:', role);
                setUserRole(role);
              }}>
                <motion.div 
                  key="main-content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="w-full"
                >
                  {/* Prioridade: Visão explícita pelo viewManager */}
                  {viewManager === 'admin' ? (
                    <AdminScreen user={user} onLogout={handleLogout} onBack={() => setViewManager('app')} />
                  ) : 
                  viewManager === 'personal' ? (
                    <PersonalDashboard user={user} onLogout={handleLogout} onBack={() => setViewManager('app')} />
                  ) : (
                    /* Aluno padrão (USER) no modo app, default inicial para todos */
                    <FichaDeTreinoScreen 
                      user={user} 
                      onLogout={handleLogout} 
                      onOpenAdmin={() => { 
                        if (userRole === 'ADMIN') setViewManager('admin');
                        else if (userRole === 'PERSONAL') setViewManager('personal');
                      }} 
                    />
                  )}
                </motion.div>
              </RBACGuard>
            )}
          </AnimatePresence>
          )} {/* fecha o authLoading ternário */}

        </div>
      </div>
      
      {/* Vercel Speed Insights - Performance Monitoring */}
      <SpeedInsights />
      
      {/* Debug Logs removed - component missing */}
      {isAuthenticated && <DebugOverlay user={user} userRole={userRole} viewManager={viewManager} />}
    </MusicProvider>
  );
}

export default App;

```

## src/components/admin/AdminFinanceiro.jsx
```jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, AlertTriangle, Search, Check, X, Clock, Filter, ChevronDown, CreditCard, Calendar } from 'lucide-react';

const STORAGE_KEY = 'zyron-payments';

const STATUS_MAP = {
  paid: { label: 'Em Dia', color: 'emerald', icon: '✅' },
  pending: { label: 'Pendente', color: 'yellow', icon: '⚠️' },
  overdue: { label: 'Vencido', color: 'red', icon: '🔴' },
};

const PLANS = [
  { id: 'mensal', name: 'Mensal', price: 159 },
  { id: 'trimestral', name: 'Trimestral', price: 399 },
  { id: 'semestral', name: 'Semestral', price: 699 },
  { id: 'anual', name: 'Anual', price: 1199 },
];

export default function AdminFinanceiro({ users = [] }) {
  const [payments, setPayments] = useState({});
  const [filter, setFilter] = useState('all'); // 'all' | 'paid' | 'pending' | 'overdue'
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(null);

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setPayments(JSON.parse(saved));
    } catch (e) {
      console.error('Erro ao carregar pagamentos:', e);
    }
  }, []);

  // Save to localStorage
  const savePayments = (newPayments) => {
    setPayments(newPayments);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPayments));
  };

  // Get payment info for a user (or default)
  const getPayment = (userId) => {
    return payments[userId] || {
      status: 'pending',
      plan: 'mensal',
      dueDate: null,
      lastPayment: null,
      history: [],
    };
  };

  // Register a payment
  const registerPayment = (userId, plan) => {
    const planInfo = PLANS.find(p => p.id === plan) || PLANS[0];
    const now = new Date();
    const nextDue = new Date(now);

    if (plan === 'mensal') nextDue.setMonth(nextDue.getMonth() + 1);
    else if (plan === 'trimestral') nextDue.setMonth(nextDue.getMonth() + 3);
    else if (plan === 'semestral') nextDue.setMonth(nextDue.getMonth() + 6);
    else if (plan === 'anual') nextDue.setFullYear(nextDue.getFullYear() + 1);

    const current = getPayment(userId);
    const newPayment = {
      ...current,
      status: 'paid',
      plan: plan,
      dueDate: nextDue.toISOString(),
      lastPayment: now.toISOString(),
      amount: planInfo.price,
      history: [
        { date: now.toISOString(), amount: planInfo.price, plan: planInfo.name },
        ...(current.history || []).slice(0, 11),
      ],
    };

    savePayments({ ...payments, [userId]: newPayment });
    setShowPaymentModal(null);
  };

  // Mark as overdue
  const markOverdue = (userId) => {
    const current = getPayment(userId);
    savePayments({ ...payments, [userId]: { ...current, status: 'overdue' } });
  };

  // Auto-check overdue
  useEffect(() => {
    const now = new Date();
    let updated = false;
    const newPayments = { ...payments };

    Object.entries(newPayments).forEach(([uid, p]) => {
      if (p.status === 'paid' && p.dueDate && new Date(p.dueDate) < now) {
        newPayments[uid] = { ...p, status: 'overdue' };
        updated = true;
      }
    });

    if (updated) savePayments(newPayments);
  }, [payments]);

  // Stats
  const allPaymentData = users.map(u => ({ ...u, payment: getPayment(u.id) }));
  const paidCount = allPaymentData.filter(u => u.payment.status === 'paid').length;
  const pendingCount = allPaymentData.filter(u => u.payment.status === 'pending').length;
  const overdueCount = allPaymentData.filter(u => u.payment.status === 'overdue').length;

  const totalRevenue = Object.values(payments)
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const overdueRevenue = allPaymentData
    .filter(u => u.payment.status === 'overdue')
    .reduce((sum, u) => {
      const plan = PLANS.find(p => p.id === u.payment.plan);
      return sum + (plan?.price || 159);
    }, 0);

  // Filter
  const filtered = allPaymentData.filter(u => {
    const matchesSearch = u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    if (filter === 'all') return matchesSearch;
    return matchesSearch && u.payment.status === filter;
  });

  return (
    <div className="space-y-8">
      {/* KPIs Financeiros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-neutral-900/50 backdrop-blur-md p-5 rounded-2xl border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
          <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Receita Ativa</p>
          <h3 className="text-2xl font-black italic text-white mt-1">
            <span className="text-base text-neutral-500">R$</span> {totalRevenue.toLocaleString('pt-BR')}
          </h3>
          <div className="flex items-center gap-1 mt-1">
            <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full" />
            <span className="text-[9px] text-emerald-400 font-bold uppercase">{paidCount} em dia</span>
          </div>
        </div>

        <div className="bg-neutral-900/50 backdrop-blur-md p-5 rounded-2xl border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/10 transition-colors" />
          <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Em Atraso</p>
          <h3 className="text-2xl font-black italic text-red-400 mt-1">
            <span className="text-base text-red-400/60">R$</span> {overdueRevenue.toLocaleString('pt-BR')}
          </h3>
          <div className="flex items-center gap-1 mt-1">
            <div className="h-1.5 w-1.5 bg-red-500 rounded-full animate-pulse" />
            <span className="text-[9px] text-red-400 font-bold uppercase">{overdueCount} vencidos</span>
          </div>
        </div>

        <div className="bg-neutral-900/50 backdrop-blur-md p-5 rounded-2xl border border-white/5">
          <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Pendentes</p>
          <h3 className="text-2xl font-black italic text-yellow-400 mt-1">{pendingCount}</h3>
          <span className="text-[9px] text-neutral-500 font-bold uppercase">aguardando primeiro pagamento</span>
        </div>

        <div className="bg-neutral-900/50 backdrop-blur-md p-5 rounded-2xl border border-white/5">
          <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Ticket Médio</p>
          <h3 className="text-2xl font-black italic text-white mt-1">
            <span className="text-base text-neutral-500">R$</span> {paidCount > 0 ? Math.round(totalRevenue / paidCount) : 0}
          </h3>
          <span className="text-[9px] text-neutral-500 font-bold uppercase">por aluno ativo</span>
        </div>
      </div>

      {/* Filtros + Tabela */}
      <div className="bg-neutral-900/50 backdrop-blur-md rounded-3xl border border-white/5 overflow-hidden">
        <div className="p-5 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-neutral-950/50">
          <h2 className="text-lg font-black italic uppercase tracking-tight text-white">Controle de Pagamentos</h2>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex bg-black/50 border border-white/10 rounded-lg p-1">
              {[
                { key: 'all', label: 'Todos', bg: 'bg-yellow-500 text-black' },
                { key: 'paid', label: 'Em Dia', bg: 'bg-emerald-500 text-black' },
                { key: 'pending', label: 'Pendente', bg: 'bg-yellow-500 text-black' },
                { key: 'overdue', label: 'Vencido', bg: 'bg-red-500 text-white' },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${filter === f.key ? f.bg + ' shadow-sm' : 'text-neutral-500 hover:text-white'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={14} />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-black/50 border border-white/10 rounded-lg py-1.5 pl-9 pr-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-yellow-400 w-40"
              />
            </div>
          </div>
        </div>

        <div className="max-h-[500px] overflow-y-auto">
          <table className="w-full text-left">
            <thead className="bg-neutral-900/80 sticky top-0 z-10">
              <tr>
                <th className="p-4 text-[10px] font-black tracking-widest uppercase text-neutral-500 border-b border-white/5">Aluno</th>
                <th className="p-4 text-[10px] font-black tracking-widest uppercase text-neutral-500 border-b border-white/5">Status</th>
                <th className="p-4 text-[10px] font-black tracking-widest uppercase text-neutral-500 border-b border-white/5">Plano</th>
                <th className="p-4 text-[10px] font-black tracking-widest uppercase text-neutral-500 border-b border-white/5">Vencimento</th>
                <th className="p-4 text-[10px] font-black tracking-widest uppercase text-neutral-500 border-b border-white/5 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => {
                const s = STATUS_MAP[u.payment.status];
                const plan = PLANS.find(p => p.id === u.payment.plan);
                const dueDate = u.payment.dueDate ? new Date(u.payment.dueDate).toLocaleDateString('pt-BR') : '—';
                return (
                  <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs bg-neutral-800 text-yellow-500 border border-yellow-500/20`}>
                          {u.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-neutral-200">{u.name || 'Sem Nome'}</p>
                          <p className="text-[9px] text-neutral-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 bg-${s.color}-500/10 text-${s.color}-400 border border-${s.color}-500/20 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1`}>
                        {s.icon} {s.label}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-bold text-neutral-300">{plan?.name || 'Não definido'}</span>
                      <p className="text-[9px] text-neutral-500">R$ {plan?.price || '—'}</p>
                    </td>
                    <td className="p-4 text-sm text-neutral-400">{dueDate}</td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => setShowPaymentModal(u)}
                          className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                        >
                          Registrar Pgto
                        </button>
                        {u.payment.status !== 'overdue' && (
                          <button
                            onClick={() => markOverdue(u.id)}
                            className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all opacity-0 group-hover:opacity-100"
                          >
                            Vencido
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Registrar Pagamento */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-neutral-900 border border-emerald-500/20 rounded-3xl w-full max-w-sm p-6 shadow-[0_0_40px_rgba(16,185,129,0.1)]"
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
                  <CreditCard size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black italic uppercase text-white leading-none">Registrar Pagamento</h3>
                  <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold mt-1">{showPaymentModal.name}</p>
                </div>
              </div>
              <button onClick={() => setShowPaymentModal(null)} className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-full"><X size={18} /></button>
            </div>

            <div className="space-y-3">
              {PLANS.map(plan => (
                <button
                  key={plan.id}
                  onClick={() => registerPayment(showPaymentModal.id, plan.id)}
                  className="w-full flex items-center justify-between bg-black/40 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/30 rounded-xl px-4 py-3 transition-all group"
                >
                  <div className="text-left">
                    <p className="text-sm font-bold text-neutral-200 group-hover:text-emerald-400 transition-colors">{plan.name}</p>
                    <p className="text-[9px] text-neutral-500 uppercase tracking-widest">Plano {plan.id}</p>
                  </div>
                  <span className="text-lg font-black text-emerald-400">R$ {plan.price}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

```

## src/components/admin/AdminPersonais.jsx
```jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, X, Plus, Search, Dumbbell, ChevronRight, Trash2, UserPlus, Edit2, Lock, Loader2 } from 'lucide-react';
import { workoutData } from '../../data/workoutData';
import { supabase } from '../../lib/supabase';

const STORAGE_KEY = 'zyron-personais';

export default function AdminPersonais({ users = [] }) {
  const [trainers, setTrainers] = useState([]);
  const [showAddTrainer, setShowAddTrainer] = useState(false);
  const [newTrainer, setNewTrainer] = useState({ name: '', email: '', phone: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showTrainerDetail, setShowTrainerDetail] = useState(null);

  // Load personais from profiles table
  useEffect(() => {
    fetchTrainers();
  }, []);

  const fetchTrainers = async () => {
    try {
      // 1. Fetch profiles with role 'PERSONAL'
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'PERSONAL');

      if (profileError) throw profileError;

      // 2. Fetch all student links for these trainers
      const { data: links, error: linksError } = await supabase
        .from('trainer_students')
        .select('*');

      if (linksError) throw linksError;

      // 3. Combine data
      const consolidated = profileData.map(p => ({
        ...p,
        students: links.filter(l => l.trainer_id === p.id).map(l => l.student_id)
      }));

      setTrainers(consolidated);
    } catch (e) {
      console.error('Erro ao carregar personais:', e);
    }
  };

  // Add trainer
  const handleAddTrainer = async () => {
    if (!newTrainer.name || !newTrainer.email || !newTrainer.password) {
      return alert('Preencha nome, email e senha do personal');
    }

    if (newTrainer.password.length < 6) {
      return alert('A senha deve ter pelo menos 6 caracteres');
    }

    setIsSubmitting(true);
    try {
      // 1. Criar conta no Auth (Nota: Isso pode enviar e-mail de confirmação dependendo do Supabase)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newTrainer.email,
        password: newTrainer.password,
        options: {
          data: {
            name: newTrainer.name,
            role: 'PERSONAL'
          }
        }
      });

      if (authError) throw authError;

      const userId = authData.user?.id;
      if (!userId) throw new Error("Erro ao obter ID do usuário criado.");

      // 2. Garantir que a Role seja 'PERSONAL' na tabela profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ 
          id: userId,
          role: 'PERSONAL', 
          name: newTrainer.name,
          email: newTrainer.email 
        });

      // Se der erro no update (ex: RLS), tentamos um upsert ou avisamos
      if (profileError) {
        console.warn('Erro ao atualizar role no perfil (pode ser RLS), mas a conta Auth foi criada:', profileError);
      }

      const trainer = {
        id: userId,
        name: newTrainer.name,
        email: newTrainer.email,
        phone: newTrainer.phone,
        students: [],
        createdAt: new Date().toISOString(),
      };

      saveTrainers([...trainers, trainer]);
      setNewTrainer({ name: '', email: '', phone: '', password: '' });
      setShowAddTrainer(false);
      alert('Personal cadastrado com sucesso! Ele já pode logar com este e-mail e senha.');

    } catch (err) {
      console.error('Erro ao cadastrar personal:', err);
      alert('Erro: ' + (err.message || 'Erro desconhecido ao criar conta.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remove trainer
  const removeTrainer = async (trainerId) => {
    if (!confirm('Remover este personal? A conta dele será mantida, mas perderá o acesso de personal.')) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'USER' })
        .eq('id', trainerId);

      if (error) throw error;
      fetchTrainers();
    } catch (err) {
      alert('Erro ao remover: ' + err.message);
    }
  };

  // Assign student to trainer
  const assignStudent = async (trainerId, studentId) => {
    try {
      const { error } = await supabase
        .from('trainer_students')
        .insert({ trainer_id: trainerId, student_id: studentId });

      if (error) {
        if (error.code === '23505') return; // Já vinculado
        throw error;
      }
      fetchTrainers();
    } catch (err) {
      alert('Erro ao vincular: ' + err.message);
    }
  };

  // Remove student from trainer
  const removeStudent = async (trainerId, studentId) => {
    try {
      const { error } = await supabase
        .from('trainer_students')
        .delete()
        .eq('trainer_id', trainerId)
        .eq('student_id', studentId);

      if (error) throw error;
      fetchTrainers();
    } catch (err) {
      alert('Erro ao desvincular: ' + err.message);
    }
  };

  // Helper: find user by id
  const findUser = (userId) => users.find(u => u.id === userId);

  // Students not yet assigned to any trainer
  const unassigned = users.filter(u =>
    !trainers.some(t => t.students.includes(u.id))
  );

  // Filter for assign modal
  const assignFilteredStudents = unassigned.filter(u =>
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Detail trainer view
  const detailTrainer = showTrainerDetail ? trainers.find(t => t.id === showTrainerDetail) : null;

  return (
    <div className="space-y-8">
      {/* Header + Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black italic uppercase tracking-tight text-white">Gestão de Personais</h2>
          <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Cadastre personal trainers e vincule alunos</p>
        </div>
        <button
          onClick={() => setShowAddTrainer(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black rounded-xl font-black uppercase tracking-widest text-[10px] transition-all shadow-[0_0_20px_rgba(234,179,8,0.2)]"
        >
          <Plus size={16} /> Novo Personal
        </button>
      </div>

      {/* Trainers Grid */}
      {trainers.length === 0 ? (
        <div className="bg-neutral-900/50 backdrop-blur-md rounded-3xl border border-white/5 p-12 text-center">
          <Users size={48} className="mx-auto text-neutral-700 mb-4" />
          <p className="text-neutral-500 font-bold uppercase tracking-widest text-sm">Nenhum personal cadastrado</p>
          <p className="text-neutral-600 text-xs mt-1">Clique em "Novo Personal" para começar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trainers.map(trainer => (
            <motion.div
              key={trainer.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-neutral-900/50 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden hover:border-yellow-500/20 transition-all group"
            >
              {/* Trainer Header */}
              <div className="p-5 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center font-black text-yellow-400 text-sm">
                      {trainer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-black text-white uppercase text-sm tracking-tight">{trainer.name}</h3>
                      {trainer.phone && <p className="text-[9px] text-neutral-500">{trainer.phone}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => removeTrainer(trainer.id)} className="p-1.5 bg-neutral-800 hover:bg-red-500/20 text-neutral-500 hover:text-red-400 rounded-lg transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Students Count + Actions */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">
                    {trainer.students.length} aluno{trainer.students.length !== 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={() => { setSelectedTrainer(trainer.id); setShowAssignModal(true); setSearchTerm(''); }}
                    className="flex items-center gap-1 px-2 py-1 bg-yellow-500/10 hover:bg-yellow-500 text-yellow-400 hover:text-black rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                  >
                    <UserPlus size={12} /> Vincular
                  </button>
                </div>

                {/* Student List (compact) */}
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {trainer.students.length === 0 ? (
                    <p className="text-[10px] text-neutral-600 text-center py-3">Nenhum aluno vinculado</p>
                  ) : (
                    trainer.students.map(studentId => {
                      const student = findUser(studentId);
                      if (!student) return null;
                      return (
                        <div key={studentId} className="flex items-center justify-between bg-black/30 rounded-lg px-3 py-1.5 border border-white/5 group/student">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-neutral-800 flex items-center justify-center text-[8px] font-black text-neutral-400">
                              {student.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <span className="text-[11px] font-bold text-neutral-300 truncate max-w-[100px]">{student.name || student.email?.split('@')[0]}</span>
                          </div>
                          <button
                            onClick={() => removeStudent(trainer.id, studentId)}
                            className="p-0.5 text-neutral-600 hover:text-red-400 transition-colors opacity-0 group-hover/student:opacity-100"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* View Details Button */}
                {trainer.students.length > 0 && (
                  <button
                    onClick={() => setShowTrainerDetail(trainer.id)}
                    className="w-full mt-3 flex items-center justify-center gap-1 py-2 bg-neutral-800/50 hover:bg-yellow-500/10 text-neutral-500 hover:text-yellow-400 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                  >
                    Ver Treinos <ChevronRight size={12} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal Adicionar Personal */}
      {showAddTrainer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-neutral-900 border border-yellow-500/20 rounded-3xl w-full max-w-sm p-6 shadow-[0_0_40px_rgba(234,179,8,0.1)]"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black italic uppercase text-white">Novo Personal</h3>
              <button onClick={() => setShowAddTrainer(false)} className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-full"><X size={18} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest">Nome *</label>
                <input
                  type="text"
                  placeholder="Ex: João Silva"
                  value={newTrainer.name}
                  onChange={(e) => setNewTrainer({ ...newTrainer, name: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 focus:border-yellow-500 rounded-xl p-3 text-white mt-1 outline-none transition-colors placeholder:text-neutral-600"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest">Email</label>
                <input
                  type="email"
                  placeholder="joao@gmail.com"
                  value={newTrainer.email}
                  onChange={(e) => setNewTrainer({ ...newTrainer, email: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 focus:border-yellow-500 rounded-xl p-3 text-white mt-1 outline-none transition-colors placeholder:text-neutral-600"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest">Senha de Acesso *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={14} />
                  <input
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={newTrainer.password}
                    onChange={(e) => setNewTrainer({ ...newTrainer, password: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 focus:border-yellow-500 rounded-xl p-3 pl-10 text-white mt-1 outline-none transition-colors placeholder:text-neutral-600"
                  />
                </div>
                <p className="text-[9px] text-neutral-500 mt-1 uppercase font-bold tracking-widest">O personal usará este e-mail e senha para logar.</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button 
                disabled={isSubmitting}
                onClick={() => setShowAddTrainer(false)} 
                className="px-5 py-2.5 rounded-xl font-bold uppercase tracking-widest text-xs bg-neutral-800 hover:bg-neutral-700 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                disabled={isSubmitting}
                onClick={handleAddTrainer} 
                className="px-5 py-2.5 rounded-xl font-black uppercase tracking-widest text-xs bg-yellow-500 hover:bg-yellow-400 text-black transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : null}
                {isSubmitting ? 'Cadastrando...' : 'Cadastrar Personal'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal Vincular Aluno */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-neutral-900 border border-yellow-500/20 rounded-3xl w-full max-w-md p-6 shadow-2xl flex flex-col max-h-[80vh]"
          >
            <div className="flex justify-between items-center mb-4 shrink-0">
              <div>
                <h3 className="text-lg font-black italic uppercase text-white">Vincular Aluno</h3>
                <p className="text-[10px] text-yellow-400 uppercase tracking-widest font-bold">
                  Para: {trainers.find(t => t.id === selectedTrainer)?.name}
                </p>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-full"><X size={18} /></button>
            </div>

            <div className="relative mb-3 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={14} />
              <input
                type="text"
                placeholder="Buscar aluno..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-yellow-400"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {assignFilteredStudents.length === 0 ? (
                <p className="text-neutral-500 text-center py-8 text-sm font-bold">Nenhum aluno disponível</p>
              ) : (
                assignFilteredStudents.map(student => (
                  <button
                    key={student.id}
                    onClick={() => { assignStudent(selectedTrainer, student.id); }}
                    className="w-full flex items-center justify-between bg-black/30 hover:bg-yellow-500/10 border border-white/5 hover:border-yellow-500/20 rounded-xl px-4 py-3 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center font-black text-xs text-neutral-400 group-hover:text-yellow-400 transition-colors">
                        {student.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-neutral-300 group-hover:text-yellow-400 transition-colors">{student.name || 'Sem Nome'}</p>
                        <p className="text-[9px] text-neutral-500">{student.email}</p>
                      </div>
                    </div>
                    <UserPlus size={16} className="text-neutral-600 group-hover:text-yellow-400 transition-colors" />
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal Detalhe do Personal (Alunos + Treinos) */}
      <AnimatePresence>
        {detailTrainer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-neutral-900 border border-white/10 rounded-3xl w-full max-w-2xl p-6 shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="flex justify-between items-center mb-6 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center font-black text-yellow-400 text-lg">
                    {detailTrainer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-black italic uppercase text-white leading-none">{detailTrainer.name}</h3>
                    <p className="text-[10px] text-yellow-400 uppercase tracking-widest font-bold mt-1">{detailTrainer.students.length} alunos ativos</p>
                  </div>
                </div>
                <button onClick={() => setShowTrainerDetail(null)} className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-full"><X size={20} /></button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                {detailTrainer.students.map(studentId => {
                  const student = findUser(studentId);
                  if (!student) return null;

                  // Get the current workout based on day
                  const today = new Date().getDay();
                  const currentWorkout = workoutData[today];

                  return (
                    <div key={studentId} className="bg-black/30 rounded-2xl border border-white/5 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-neutral-800 border border-yellow-500/20 flex items-center justify-center font-black text-xs text-yellow-400">
                            {student.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-black text-sm text-white uppercase">{student.name || 'Sem Nome'}</p>
                            <p className="text-[9px] text-neutral-500">{student.email}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">{student.goal || 'Geral'}</span>
                          <span className="text-[9px] font-bold text-yellow-400">{student.weight || '--'} kg</span>
                        </div>
                      </div>

                      {/* Treino do Dia */}
                      {currentWorkout && (
                        <div className="bg-neutral-900/50 rounded-xl p-3 border border-white/5">
                          <div className="flex items-center gap-2 mb-2">
                            <Dumbbell size={14} className="text-yellow-500" />
                            <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">Treino de Hoje — {currentWorkout.title}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-1">
                            {currentWorkout.exercises?.slice(0, 6).map(ex => (
                              <div key={ex.id} className="text-[10px] text-neutral-400 font-bold truncate">
                                • {ex.name}
                              </div>
                            ))}
                            {currentWorkout.exercises?.length > 6 && (
                              <span className="text-[9px] text-neutral-600">+{currentWorkout.exercises.length - 6} mais</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

```

## src/components/admin/PersonalDashboard.jsx
```jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Dumbbell, Droplets, Trophy, Search, Plus, 
  ChevronRight, X, Save, Activity, Zap, FileText, 
  Settings, LogOut, ArrowLeft, Loader2, Target,
  CheckCircle2, AlertCircle, TrendingUp, UserPlus,
  Mail, Lock, Ruler, Scale as ScaleIcon, Calendar
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { workoutData } from '../../data/workoutData';

const GlassCard = ({ children, className = "" }) => (
  <div className={`bg-neutral-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-2xl ${className}`}>
    {children}
  </div>
);

export default function PersonalDashboard({ user, onLogout, onBack }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // New Student state
  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    password: '',
    goal: 'Bulk',
    level: 'Full Body'
  });
  
  // Nutri goals state
  const [nutriGoals, setNutriGoals] = useState({
    water_goal: 0,
    protein_goal: 0,
    level: '',
    goal: '',
    age: '',
    weight: '',
    height: ''
  });

  // Load students linked to this personal trainer
  useEffect(() => {
    fetchMyStudents();
  }, [user]);

  const fetchMyStudents = async () => {
    try {
      setLoading(true);
      // 1. Get linked student IDs from trainer_students table
      const { data: links, error: linksError } = await supabase
        .from('trainer_students')
        .select('student_id')
        .eq('trainer_id', user.id);

      if (linksError) throw linksError;
      
      if (!links || links.length === 0) {
        setStudents([]);
        return;
      }

      const studentIds = links.map(l => l.student_id);

      // 2. Fetch profiles for these IDs
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('id', studentIds);

      if (error) throw error;
      setStudents(data || []);
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenStudent = (student) => {
    setSelectedStudent(student);
    setNutriGoals({
      water_goal: student.water_goal || 0,
      protein_goal: student.protein_goal || 0,
      level: student.level || '',
      goal: student.goal || '',
      age: student.age || '',
      weight: student.weight || '',
      height: student.height || ''
    });
  };

  const handleCreateStudent = async () => {
    if (!newStudent.name || !newStudent.email || !newStudent.password) {
      return alert('Preencha nome, email e senha');
    }

    setIsCreating(true);
    try {
      // 1. Auth SignUp
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newStudent.email,
        password: newStudent.password,
        options: {
          data: {
            name: newStudent.name,
            role: 'USER'
          }
        }
      });

      if (authError) throw authError;
      const studentId = authData.user?.id;

      // 2. Create Profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: studentId,
          name: newStudent.name,
          email: newStudent.email,
          goal: newStudent.goal,
          level: newStudent.level,
          role: 'USER'
        });

      if (profileError) throw profileError;

      // 3. Link to this Personal in Database
      const { error: linkError } = await supabase
        .from('trainer_students')
        .insert({
          trainer_id: user.id,
          student_id: studentId
        });

      if (linkError) throw linkError;

      alert('Atleta cadastrado e forjado com sucesso!');
      setShowAddStudent(false);
      setNewStudent({ name: '', email: '', password: '', goal: 'Bulk', level: 'Full Body' });
      fetchMyStudents();
    } catch (err) {
      if (err.message.includes('User already registered') || err.message.includes('already registered')) {
        try {
          // Fallback: Tentar vincular usuário existente pelo email
          const { data: existingProfile, error: searchError } = await supabase
            .from('profiles')
            .select('id, name')
            .eq('email', newStudent.email)
            .single();

          if (existingProfile) {
            const confirmLink = window.confirm(`O aluno "${existingProfile.name}" já tem conta. Deseja vinculá-lo à sua squad?`);
            if (confirmLink) {
              const { error: linkError } = await supabase
                .from('trainer_students')
                .insert({
                  trainer_id: user.id,
                  student_id: existingProfile.id
                });

              if (linkError) {
                if (linkError.code === '23505') {
                   alert('Este aluno já está na sua squad!');
                } else {
                   throw linkError;
                }
              } else {
                alert('Aluno vinculado com sucesso!');
              }
              setShowAddStudent(false);
              fetchMyStudents();
              return;
            }
          } else {
            alert('Este e-mail já está em uso, mas não conseguimos localizar o perfil. Verifique com o administrador.');
          }
        } catch (searchErr) {
          alert('Este e-mail já está cadastrado. Tente outro ou peça para o administrador vincular manualmente.');
        }
      } else {
        alert('Erro ao cadastrar: ' + err.message);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const updateNutriGoals = async () => {
    if (!selectedStudent) return;
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          water_goal: parseFloat(nutriGoals.water_goal),
          protein_goal: parseFloat(nutriGoals.protein_goal),
          level: nutriGoals.level,
          goal: nutriGoals.goal,
          age: parseInt(nutriGoals.age),
          weight: parseFloat(nutriGoals.weight),
          height: parseFloat(nutriGoals.height)
        })
        .eq('id', selectedStudent.id);

      if (error) throw error;
      
      // Update local state
      setStudents(prev => prev.map(s => 
        s.id === selectedStudent.id ? { ...s, ...nutriGoals } : s
      ));
      
      alert('Ficha técnica atualizada para ' + selectedStudent.name);
    } catch (err) {
      alert('Erro ao atualizar metas: ' + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-yellow-400 selection:text-black">
      {/* Abstract Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-yellow-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-neutral-900 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-yellow-400 rounded-2xl shadow-[0_0_30px_rgba(253,224,71,0.2)]">
              <Users size={32} className="text-black" />
            </div>
            <div>
              <h1 className="text-4xl font-black italic uppercase tracking-tighter">Painel do Treinador</h1>
              <p className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.4em] mt-1">
                Treinador: {user?.name || 'Coach'} ⚡ Acesso Total
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={onBack}
              className="px-6 py-3 bg-neutral-900 border border-white/5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-neutral-800 transition-all flex items-center gap-2"
            >
              <ArrowLeft size={16} /> Voltar
            </button>
            <button 
              onClick={onLogout}
              className="px-6 py-3 bg-red-500/10 border border-red-500/20 rounded-2xl font-black uppercase text-[10px] tracking-widest text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
            >
              <LogOut size={16} /> Sair
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main List Column */}
          <div className="lg:col-span-8 space-y-6">
            <GlassCard>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-8 bg-yellow-400 rounded-full" />
                  <h2 className="text-xl font-black uppercase italic tracking-tight">Minha Squad</h2>
                  <button 
                    onClick={() => setShowAddStudent(true)}
                    className="ml-4 p-2 bg-yellow-400/10 hover:bg-yellow-400 text-yellow-500 hover:text-black rounded-xl transition-all"
                    title="Cadastrar Novo Aluno"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
                  <input 
                    type="text"
                    placeholder="Buscar atleta..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-black/50 border border-white/5 rounded-2xl py-2.5 pl-10 pr-4 text-sm font-bold focus:outline-none focus:border-yellow-400/50 w-64 transition-all"
                  />
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 size={40} className="text-yellow-400 animate-spin mb-4" />
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-neutral-600">Sincronizando dados industriais...</p>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center py-20 opacity-30">
                  <Users size={64} className="mx-auto mb-4" />
                  <p className="font-black uppercase tracking-widest text-sm">Nenhum aluno encontrado</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredStudents.map(student => (
                    <motion.button
                      key={student.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleOpenStudent(student)}
                      className={`text-left p-5 rounded-3xl border transition-all ${
                        selectedStudent?.id === student.id 
                          ? 'bg-yellow-400 border-yellow-400 shadow-[0_0_30px_rgba(253,224,71,0.15)] text-black' 
                          : 'bg-black/30 border-white/5 hover:border-white/20 text-white'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-neutral-800 flex items-center justify-center overflow-hidden border border-white/10 shrink-0">
                          {student.avatar_url ? (
                            <img src={student.avatar_url} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <span className="font-black text-xl italic">{student.name?.charAt(0) || 'U'}</span>
                          )}
                        </div>
                        <div className="text-right">
                          <p className={`text-[10px] font-black uppercase tracking-widest ${selectedStudent?.id === student.id ? 'text-black/60' : 'text-neutral-500'}`}>Status</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            <span className="text-[10px] font-black uppercase tracking-tighter">Ativo</span>
                          </div>
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-black uppercase italic tracking-tighter truncate mb-1">{student.name || 'Sem Nome'}</h3>
                      <p className={`text-[10px] font-bold mb-4 ${selectedStudent?.id === student.id ? 'text-black/60' : 'text-neutral-500'}`}>{student.email}</p>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className={`p-2 rounded-xl ${selectedStudent?.id === student.id ? 'bg-black/10' : 'bg-white/5'}`}>
                          <p className="text-[8px] font-black uppercase tracking-widest mb-1 opacity-60">Foco</p>
                          <p className="text-[10px] font-black uppercase truncate">{student.level || 'Geral'}</p>
                        </div>
                        <div className={`p-2 rounded-xl ${selectedStudent?.id === student.id ? 'bg-black/10' : 'bg-white/5'}`}>
                          <p className="text-[8px] font-black uppercase tracking-widest mb-1 opacity-60">Peso</p>
                          <p className="text-[10px] font-black uppercase">{student.weight || '--'} kg</p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </GlassCard>

            {/* Quick Actions / Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GlassCard className="bg-emerald-500/5 border-emerald-500/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500">
                    <TrendingUp size={20} />
                  </div>
                  <h3 className="font-black uppercase italic tracking-tight text-emerald-500">Engajamento</h3>
                </div>
                <p className="text-3xl font-black italic">84%</p>
                <p className="text-[10px] font-black uppercase text-neutral-500 tracking-widest mt-1">Média de conclusão de treinos</p>
              </GlassCard>
              
              <GlassCard className="bg-yellow-500/5 border-yellow-500/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-yellow-500/10 rounded-xl text-yellow-400">
                    <Trophy size={20} />
                  </div>
                  <h3 className="font-black uppercase italic tracking-tight text-yellow-400">Squad Total</h3>
                </div>
                <p className="text-3xl font-black italic">{students.length}</p>
                <p className="text-[10px] font-black uppercase text-neutral-500 tracking-widest mt-1">Alunos sob sua gestão</p>
              </GlassCard>
            </div>
          </div>

          {/* Editor Column */}
          <div className="lg:col-span-4 space-y-6">
            <AnimatePresence mode="wait">
              {selectedStudent ? (
                <motion.div
                  key={selectedStudent.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  {/* Fuel Station Editor */}
                  <GlassCard className="border-yellow-500/20">
                    <div className="flex items-center justify-between mb-8">
                       <div className="flex items-center gap-3">
                        <Zap size={24} className="text-yellow-400" />
                        <h2 className="text-xl font-black uppercase italic tracking-tight">Metas e Bio</h2>
                      </div>
                    </div>

                    <div className="space-y-5">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-2 block">Proteína (g)</label>
                          <div className="relative">
                            <Activity size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-500" />
                            <input 
                              type="number"
                              value={nutriGoals.protein_goal}
                              onChange={(e) => setNutriGoals({...nutriGoals, protein_goal: e.target.value})}
                              className="w-full bg-black/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 font-black text-xl italic focus:outline-none focus:border-yellow-400 placeholder:text-neutral-800"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-2 block">Hidratação (L)</label>
                          <div className="relative">
                            <Droplets size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" />
                            <input 
                              type="number"
                              step="0.1"
                              value={nutriGoals.water_goal}
                              onChange={(e) => setNutriGoals({...nutriGoals, water_goal: e.target.value})}
                              className="w-full bg-black/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 font-black text-xl italic focus:outline-none focus:border-yellow-400 placeholder:text-neutral-800"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-2 block text-center">Idade</label>
                          <input 
                            type="number"
                            value={nutriGoals.age}
                            onChange={(e) => setNutriGoals({...nutriGoals, age: e.target.value})}
                            className="w-full bg-black/50 border border-white/5 rounded-xl py-2 px-3 text-center font-black text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-2 block text-center">Altura (cm)</label>
                          <input 
                            type="number"
                            value={nutriGoals.height}
                            onChange={(e) => setNutriGoals({...nutriGoals, height: e.target.value})}
                            className="w-full bg-black/50 border border-white/5 rounded-xl py-2 px-3 text-center font-black text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-2 block text-center">Peso (kg)</label>
                          <input 
                            type="number"
                            step="0.1"
                            value={nutriGoals.weight}
                            onChange={(e) => setNutriGoals({...nutriGoals, weight: e.target.value})}
                            className="w-full bg-black/50 border border-white/5 rounded-xl py-2 px-3 text-center font-black text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-2 block">Objetivo</label>
                          <input 
                            type="text"
                            value={nutriGoals.goal}
                            onChange={(e) => setNutriGoals({...nutriGoals, goal: e.target.value})}
                            className="w-full bg-black/50 border border-white/5 rounded-xl py-3 px-4 font-bold text-xs uppercase focus:outline-none focus:border-yellow-400"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-2 block">Foco</label>
                          <input 
                            type="text"
                            value={nutriGoals.level}
                            onChange={(e) => setNutriGoals({...nutriGoals, level: e.target.value})}
                            className="w-full bg-black/50 border border-white/5 rounded-xl py-3 px-4 font-bold text-xs uppercase focus:outline-none focus:border-yellow-400"
                          />
                        </div>
                      </div>

                      <div className="p-4 bg-neutral-900 border border-white/5 rounded-2xl">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <FileText size={14} className="text-neutral-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Plano Alimentar</span>
                          </div>
                          <button className="text-[8px] font-black uppercase text-yellow-400 hover:underline">Z-Upload</button>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-black/30 rounded-xl border border-dashed border-white/10 text-neutral-600 text-[10px] justify-center">
                          <Plus size={12} /> Vincular PDF/Imagem
                        </div>
                      </div>

                      <button 
                        onClick={updateNutriGoals}
                        disabled={isUpdating}
                        className="w-full py-5 bg-yellow-400 hover:bg-yellow-300 text-black rounded-3xl font-black uppercase italic tracking-widest text-sm shadow-[0_10px_40px_rgba(253,224,71,0.2)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isUpdating ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                        {isUpdating ? 'Salvando...' : 'Atualizar Prescrição'}
                      </button>
                    </div>
                  </GlassCard>

                  {/* Workout Assignment */}
                  <GlassCard>
                    <div className="flex items-center gap-3 mb-6">
                      <Dumbbell size={24} className="text-neutral-400" />
                      <h2 className="text-xl font-black uppercase italic tracking-tight">Prescrição</h2>
                    </div>
                    
                    <p className="text-[10px] font-bold text-neutral-500 mb-4 uppercase tracking-widest">Atribuir Ficha Inteligente</p>
                    <div className="space-y-2">
                       {Object.entries(workoutData).map(([dayKey, day]) => (
                         <div key={dayKey} className="group flex items-center justify-between p-3 bg-black/30 border border-white/5 rounded-xl hover:border-yellow-400/30 transition-all">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-yellow-400 uppercase tracking-tighter">Dia {dayKey}</span>
                              <span className="text-xs font-bold text-neutral-300">{day.title}</span>
                            </div>
                            <button className="p-2 bg-neutral-800 rounded-lg text-neutral-500 group-hover:bg-yellow-400 group-hover:text-black transition-all">
                              <Plus size={14} />
                            </button>
                         </div>
                       ))}
                    </div>
                  </GlassCard>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[400px] text-center border-2 border-dashed border-white/5 rounded-[40px] opacity-20">
                  <Target size={48} className="mb-4" />
                  <p className="font-black uppercase tracking-widest text-sm px-10">Selecione um atleta para iniciar a gestão técnica</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Modal: Forjar Novo Atleta */}
      {showAddStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-neutral-900 border border-yellow-500/20 rounded-[40px] w-full max-w-sm p-8 shadow-[0_0_80px_rgba(253,224,71,0.1)]"
          >
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-black italic uppercase text-white tracking-tighter">Novo Aluno</h3>
                <p className="text-[10px] text-yellow-400 uppercase tracking-widest font-black mt-1">Adicionar à sua base de alunos</p>
              </div>
              <button onClick={() => setShowAddStudent(false)} className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-full text-neutral-400"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500"><Users size={16} /></span>
                <input
                  type="text"
                  placeholder="Nome do Atleta"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                  className="w-full bg-black/50 border border-white/5 focus:border-yellow-400 rounded-2xl py-4 pl-12 pr-4 text-white font-bold outline-none transition-all"
                />
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500"><Mail size={16} /></span>
                <input
                  type="email"
                  placeholder="E-mail"
                  value={newStudent.email}
                  onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
                  className="w-full bg-black/50 border border-white/5 focus:border-yellow-400 rounded-2xl py-4 pl-12 pr-4 text-white font-bold outline-none transition-all"
                />
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500"><Lock size={16} /></span>
                <input
                  type="password"
                  placeholder="Senha Inicial"
                  value={newStudent.password}
                  onChange={(e) => setNewStudent({...newStudent, password: e.target.value})}
                  className="w-full bg-black/50 border border-white/5 focus:border-yellow-400 rounded-2xl py-4 pl-12 pr-4 text-white font-bold outline-none transition-all"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <select 
                   value={newStudent.goal}
                   onChange={(e) => setNewStudent({...newStudent, goal: e.target.value})}
                   className="bg-black/50 border border-white/5 rounded-xl p-3 text-xs font-black uppercase text-neutral-400 focus:text-yellow-400 outline-none"
                >
                  <option value="Bulk">Bulk</option>
                  <option value="Cut">Cut</option>
                  <option value="Recomp">Recomp</option>
                </select>
                <input
                  type="text"
                  placeholder="Foco (Ex: Pernas)"
                  value={newStudent.level}
                  onChange={(e) => setNewStudent({...newStudent, level: e.target.value})}
                  className="bg-black/50 border border-white/5 rounded-xl p-3 text-xs font-black uppercase text-white outline-none"
                />
              </div>
            </div>

            <button 
              onClick={handleCreateStudent}
              disabled={isCreating}
              className="w-full mt-8 py-5 bg-yellow-400 hover:bg-yellow-300 text-black rounded-3xl font-black uppercase italic tracking-widest text-sm shadow-[0_10px_40px_rgba(253,224,71,0.2)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isCreating ? <Loader2 size={20} className="animate-spin" /> : <UserPlus size={20} />}
              {isCreating ? 'Cadastrando...' : 'Confirmar Cadastro'}
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}

```

## src/components/AdminScreen.jsx
```jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Users, TrendingUp, DollarSign, LogOut, ArrowLeft, Search, Edit2, RotateCcw, Trash2, X, AlertTriangle, Bell, Send, FileCode, Activity, Trophy, Cake, Clock, Megaphone, ChevronRight, Calendar, LayoutDashboard, CreditCard, UserCheck, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { workoutData } from '../data/workoutData';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import AdminFinanceiro from './admin/AdminFinanceiro';
import AdminPersonais from './admin/AdminPersonais';
import PersonalDashboard from './admin/PersonalDashboard';

// Flatten all exercises from workoutData to use in the multi-select
const allExercises = Object.values(workoutData).flatMap(day => day.exercises || []).filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);

export default function AdminScreen({ user, onLogout, onBack }) {
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [adminTab, setAdminTab] = useState('dashboard'); // 'dashboard' | 'financeiro' | 'personais'
  
  // Modals state
  const [editUser, setEditUser] = useState(null);
  const [resetUser, setResetUser] = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);
  const [notificationUser, setNotificationUser] = useState(null);
  const [customPlanUser, setCustomPlanUser] = useState(null);
  const [customPlanData, setCustomPlanData] = useState({ name: 'Ficha VIP', exercises: [] });
  const [notificationData, setNotificationData] = useState({ title: '', message: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [analyticsData, setAnalyticsData] = useState([]);

  // ── Tier 1 States ──
  const [churnRiskUsers, setChurnRiskUsers] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [birthdays, setBirthdays] = useState([]);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastData, setBroadcastData] = useState({ title: '', message: '' });
  const [timelineUser, setTimelineUser] = useState(null);
  const [timelineData, setTimelineData] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      await fetchCurrentUserProfile();
      fetchUsers();
      fetchAnalytics();
      fetchChurnRisk();
      fetchLeaderboard();
      fetchBirthdays();
    };
    init();
  }, [user]);

  const fetchCurrentUserProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (data) setCurrentUserProfile(data);
    } catch (e) {
      console.error('Erro ao buscar perfil atual:', e);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      // Get dates for the last 7 days
      const dates = Array.from({length: 7}, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().split('T')[0];
      });

      const { data, error } = await supabase
        .from('daily_stats')
        .select('date, user_id')
        .gte('date', dates[0])
        .lte('date', dates[6]);

      if (error) throw error;

      // Map to chart data
      const chartData = dates.map(date => {
        // Formatar data para exibição ex: 15/03
        const [, month, day] = date.split('-');
        const formattedDate = `${day}/${month}`;
        
        // Contar usuários únicos naquele dia
        const usersThatDay = new Set(data.filter(d => d.date === date).map(d => d.user_id)).size;
        
        return { name: formattedDate, activeUsers: usersThatDay };
      });

      setAnalyticsData(chartData);
    } catch (error) {
      console.error("Erro ao buscar analytics:", error);
    }
  };

  // ── TIER 1: Alunos em Risco (sem treinar 7+ dias) ──
  const fetchChurnRisk = async () => {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const cutoff = sevenDaysAgo.toISOString().split('T')[0];

      // Buscar todos os profiles
      const { data: allProfiles } = await supabase.from('profiles').select('id, name, email');
      if (!allProfiles) return;

      // Buscar quem treinou nos últimos 7 dias
      const { data: recentStats } = await supabase
        .from('daily_stats')
        .select('user_id')
        .gte('date', cutoff);

      const activeIds = new Set((recentStats || []).map(s => s.user_id));
      const atRisk = allProfiles.filter(p => !activeIds.has(p.id));
      setChurnRiskUsers(atRisk);
    } catch (err) {
      console.error('Erro churn risk:', err);
    }
  };

  // ── TIER 1: Leaderboard (treinos no mês) ──
  const fetchLeaderboard = async () => {
    try {
      const firstOfMonth = new Date();
      firstOfMonth.setDate(1);
      const from = firstOfMonth.toISOString().split('T')[0];

      const { data } = await supabase
        .from('workout_logs')
        .select('user_id, id')
        .gte('created_at', from);

      if (!data) return;

      // Agrupar por user_id
      const counts = {};
      data.forEach(log => {
        counts[log.user_id] = (counts[log.user_id] || 0) + 1;
      });

      // Buscar nomes
      const userIds = Object.keys(counts);
      if (userIds.length === 0) { setLeaderboard([]); return; }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', userIds);

      const nameMap = {};
      (profiles || []).forEach(p => { nameMap[p.id] = p.name || 'Sem Nome'; });

      const ranked = Object.entries(counts)
        .map(([uid, count]) => ({ id: uid, name: nameMap[uid] || uid.substring(0, 8), workouts: count }))
        .sort((a, b) => b.workouts - a.workouts)
        .slice(0, 10);

      setLeaderboard(ranked);
    } catch (err) {
      console.error('Erro leaderboard:', err);
    }
  };

  // ── TIER 1: Aniversariantes do Mês ──
  const fetchBirthdays = async () => {
    try {
      const currentMonth = new Date().getMonth() + 1;
      const { data } = await supabase.from('profiles').select('id, name, email, birth_date');
      if (!data) return;

      const bdays = data.filter(p => {
        if (!p.birth_date) return false;
        const month = new Date(p.birth_date).getMonth() + 1;
        return month === currentMonth;
      }).map(p => ({
        ...p,
        day: new Date(p.birth_date).getDate()
      })).sort((a, b) => a.day - b.day);

      setBirthdays(bdays);
    } catch (err) {
      console.error('Erro birthdays:', err);
    }
  };

  // ── TIER 1: Timeline do Aluno ──
  const fetchUserTimeline = async (userId) => {
    setTimelineLoading(true);
    try {
      const { data } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30);

      setTimelineData(data || []);
    } catch (err) {
      console.error('Erro timeline:', err);
    } finally {
      setTimelineLoading(false);
    }
  };

  const handleOpenTimeline = (user) => {
    setTimelineUser(user);
    fetchUserTimeline(user.id);
  };

  // ── TIER 1: Broadcast (notificar todos) ──
  const handleBroadcast = async () => {
    if (!broadcastData.title || !broadcastData.message) return alert("Preencha título e mensagem");
    setIsProcessing(true);
    try {
      const inserts = domainUsers.map(u => ({
        user_id: u.id,
        title: broadcastData.title,
        message: broadcastData.message
      }));
      const { error } = await supabase.from('notifications').insert(inserts);
      if (error) throw error;
      setShowBroadcast(false);
      setBroadcastData({ title: '', message: '' });
      alert(`Notificação enviada para ${domainUsers.length} alunos!`);
    } catch (error) {
      alert("Erro ao enviar broadcast: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Filtragem por Role (Personal vê apenas seus alunos) ──
  const getDomainUsers = () => {
    if (!currentUserProfile) return [];
    if (currentUserProfile.role === 'ADMIN') return users;
    
    try {
      const trainerData = JSON.parse(localStorage.getItem('zyron-personais') || '[]');
      // Busca vínculo por email ou nome
      const myTrainerInfo = trainerData.find(t => 
        (t.email && t.email === currentUserProfile.email) || 
        (t.name && t.name === currentUserProfile.name)
      );
      
      if (myTrainerInfo && myTrainerInfo.students) {
        return users.filter(u => myTrainerInfo.students.includes(u.id));
      }
    } catch (e) {
      console.error('Erro ao filtrar alunos do personal:', e);
    }
    return [];
  };

  const domainUsers = getDomainUsers();

  const filteredUsers = domainUsers.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    
    // Mock status based on ID
    const isActive = user.id.charCodeAt(0) % 5 !== 0; 
    
    if (filterStatus === 'active') return matchesSearch && isActive;
    if (filterStatus === 'inactive') return matchesSearch && !isActive;
    
    return matchesSearch;
  });

  const handleSaveEdit = async () => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: editUser.name,
          age: editUser.age,
          height: editUser.height,
          weight: editUser.weight,
          goal: editUser.goal,
          level: editUser.level
        })
        .eq('id', editUser.id);
      
      if (error) throw error;
      setEditUser(null);
      fetchUsers();
    } catch (error) {
      alert("Erro ao atualizar: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmReset = async () => {
    setIsProcessing(true);
    try {
      // Deletar logs e stats mas manter o perfil intacto
      await supabase.from('workout_logs').delete().eq('user_id', resetUser.id);
      await supabase.from('daily_stats').delete().eq('user_id', resetUser.id);
      await supabase.from('exercise_prs').delete().eq('user_id', resetUser.id);
      
      setResetUser(null);
      alert("Progresso apagado com sucesso!");
    } catch (error) {
      alert("Erro ao resetar: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmDelete = async () => {
    setIsProcessing(true);
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', deleteUser.id);
      if (error) throw error;
      setDeleteUser(null);
      fetchUsers();
    } catch (error) {
      alert("Erro ao excluir. O RLS de exclusão requer privilégios ou você só pode excluir registros vinculando API de admin.");
      setDeleteUser(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendNotification = async () => {
    if (!notificationData.title || !notificationData.message) return alert("Preencha título e mensagem");
    setIsProcessing(true);
    try {
      const { error } = await supabase.from('notifications').insert({
        user_id: notificationUser.id,
        title: notificationData.title,
        message: notificationData.message
      });
      if (error) throw error;
      setNotificationUser(null);
      setNotificationData({ title: '', message: '' });
      alert("Notificação enviada com sucesso!");
    } catch (error) {
      alert("Erro ao enviar: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAssignCustomPlan = async () => {
    if (!customPlanData.name || customPlanData.exercises.length === 0) return alert("Preencha o nome e selecione exercícios");
    setIsProcessing(true);
    try {
      const { error } = await supabase.from('custom_workouts').insert({
        user_id: customPlanUser.id,
        workout_name: customPlanData.name,
        exercises: customPlanData.exercises
      });
      if (error) throw error;
      setCustomPlanUser(null);
      setCustomPlanData({ name: 'Ficha VIP', exercises: [] });
      alert("Ficha personalizada enviada com sucesso!");
    } catch (error) {
      alert("Erro ao enviar ficha: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleExerciseSelection = (exerciseId) => {
    setCustomPlanData(prev => ({
      ...prev,
      exercises: prev.exercises.includes(exerciseId) 
        ? prev.exercises.filter(id => id !== exerciseId)
        : [...prev.exercises, exerciseId]
    }));
  };

  if (loading && !currentUserProfile) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="text-yellow-400 animate-spin" size={48} />
      </div>
    );
  }

  if (currentUserProfile?.role === 'PERSONAL' || user?.user_metadata?.role === 'PERSONAL') {
    return <PersonalDashboard user={user} onLogout={onLogout} onBack={onBack} />;
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-slate-100 font-sans p-6 selection:bg-yellow-400 selection:text-black">
      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-20 overflow-hidden z-0">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-red-600 rounded-full blur-[150px] animate-pulse"></div>
        <div className="absolute top-1/2 -right-24 w-64 h-64 bg-yellow-600 rounded-full blur-[120px]" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-10 bg-neutral-900/40 backdrop-blur-md p-6 rounded-3xl border border-red-500/20 shadow-[0_0_30px_rgba(220,38,38,0.1)]">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-3 bg-neutral-800 rounded-xl hover:bg-neutral-700 transition-colors">
              <ArrowLeft size={20} className="text-neutral-400" />
            </button>
            <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/30">
              <ShieldAlert className="text-red-500" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white">God Mode</h1>
              <p className="text-[10px] font-bold text-red-500 uppercase tracking-[0.3em]">Painel de Controle Administrativo</p>
            </div>
          </div>
          
          <button onClick={onLogout} className="flex items-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl font-black uppercase tracking-widest text-xs transition-colors border border-red-500/20">
            <LogOut size={16} /> Encerrar Sessão
          </button>
        </header>

        {/* Tab Navigation */}
        <div className="flex bg-neutral-900/50 backdrop-blur-md rounded-2xl p-1.5 border border-white/5 mb-10 gap-1">
          {[
            { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, public: true },
            { key: 'financeiro', label: 'Financeiro', icon: CreditCard, public: currentUserProfile?.role === 'ADMIN' },
            { key: 'personais', label: 'Personais', icon: UserCheck, public: currentUserProfile?.role === 'ADMIN' },
          ].map(tab => {
            if (!tab.public) return null;
            const Icon = tab.icon;
            const active = adminTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setAdminTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  active
                    ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.2)]'
                    : 'text-neutral-500 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ══════ TAB: FINANCEIRO ══════ */}
        {adminTab === 'financeiro' && <AdminFinanceiro users={domainUsers} />}

        {/* ══════ TAB: PERSONAIS ══════ */}
        {adminTab === 'personais' && <AdminPersonais users={domainUsers} />}

        {/* ══════ TAB: DASHBOARD (conteúdo já existente) ══════ */}
        {adminTab === 'dashboard' && (
        <>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-neutral-900/50 backdrop-blur-md p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-2xl group-hover:bg-yellow-500/10 transition-colors"></div>
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Total de Alunos</p>
                <h3 className="text-4xl font-black italic text-white mt-2">{users.length}</h3>
              </div>
              <div className="p-3 bg-yellow-500/10 rounded-xl">
                <Users className="text-yellow-500" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-neutral-900/50 backdrop-blur-md p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors"></div>
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Taxa de Retenção</p>
                <h3 className="text-4xl font-black italic text-white mt-2">94<span className="text-xl text-neutral-500">%</span></h3>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-xl">
                <TrendingUp className="text-emerald-500" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-neutral-900/50 backdrop-blur-md p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors"></div>
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">MRR Estimado</p>
                <div className="flex items-end gap-3 mt-1">
                  <h3 className="text-4xl font-black italic text-white flex items-end"><span className="text-xl text-neutral-500 mb-1 mr-1">R$</span> {(users.length * 159).toLocaleString('pt-BR')}</h3>
                  <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg mb-1 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                    <TrendingUp size={12} className="text-emerald-400" />
                    <span className="text-xs font-black text-emerald-400">+12%</span>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <DollarSign className="text-blue-500" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Chart Weekly Active Users */}
        <div className="bg-neutral-900/50 backdrop-blur-md p-6 rounded-3xl border border-white/5 mb-10 overflow-hidden relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-yellow-500/10 rounded-xl">
              <Activity className="text-yellow-500" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black italic uppercase tracking-tight text-white">Pulso de Retenção</h2>
              <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Usuários Ativos (Últimos 7 Dias)</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analyticsData}>
                <defs>
                  <filter id="neonGlowAdmin" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur1" />
                    <feGaussianBlur in="SourceGraphic" stdDeviation="15" result="blur2" />
                    <feMerge>
                      <feMergeNode in="blur2" />
                      <feMergeNode in="blur1" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <XAxis 
                  dataKey="name" 
                  stroke="#525252" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10} 
                  tick={{ fontWeight: 900, fontFamily: 'monospace' }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#333', borderRadius: '12px', padding: '12px', color: '#fff' }}
                  itemStyle={{ color: '#eab308', fontWeight: 900, fontSize: '14px' }}
                  labelStyle={{ color: '#737373', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 900, marginBottom: '4px' }}
                  cursor={{ stroke: '#262626', strokeWidth: 2, strokeDasharray: '4 4' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="activeUsers" 
                  name="Alunos Ativos"
                  stroke="#eab308" 
                  strokeWidth={4}
                  dot={{ r: 4, fill: '#0a0a0a', stroke: '#eab308', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#eab308', stroke: '#0a0a0a', strokeWidth: 2 }}
                  filter="url(#neonGlowAdmin)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ═══════════════ TIER 1 SECTIONS ═══════════════ */}

        {/* ── 1. Alunos em Risco (Churn) ── */}
        {churnRiskUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/5 backdrop-blur-md p-6 rounded-3xl border border-red-500/20 mb-10 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-500 via-orange-500 to-red-500" />
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-xl">
                  <AlertTriangle className="text-red-500" size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black italic uppercase tracking-tight text-red-400">Alunos em Risco</h2>
                  <p className="text-[10px] text-red-400/60 uppercase tracking-widest font-bold">Sem treinar há 7+ dias</p>
                </div>
              </div>
              <span className="text-3xl font-black italic text-red-400">{churnRiskUsers.length}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-2">
              {churnRiskUsers.slice(0, 12).map(u => (
                <div key={u.id} className="flex items-center justify-between bg-black/30 rounded-xl px-4 py-2 border border-red-500/10 group">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-red-500/20 flex items-center justify-center text-[10px] font-black text-red-400">
                      {u.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="text-sm font-bold text-neutral-300 truncate max-w-[120px]">{u.name || u.email?.split('@')[0]}</span>
                  </div>
                  <button
                    onClick={() => { setNotificationUser(u); setNotificationData({ title: 'Sentimos sua falta!', message: `Fala ${u.name || 'campeão'}! Faz tempo que você não treina. Vamos voltar com tudo? 💪` }); }}
                    className="px-2 py-1 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all"
                  >
                    Lembrar
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── 2. Leaderboard + 4. Aniversariantes (2 colunas) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {/* Leaderboard */}
          <div className="bg-neutral-900/50 backdrop-blur-md p-6 rounded-3xl border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-yellow-500 via-amber-400 to-yellow-600" />
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-yellow-500/10 rounded-xl">
                <Trophy className="text-yellow-500" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black italic uppercase tracking-tight text-white">Ranking do Mês</h2>
                <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Top Atletas — {new Date().toLocaleString('pt-BR', { month: 'long' })}</p>
              </div>
            </div>
            {leaderboard.length === 0 ? (
              <p className="text-neutral-500 text-sm text-center py-8 font-bold">Nenhum treino registrado este mês</p>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((u, i) => {
                  const medals = ['bg-yellow-500 text-black', 'bg-neutral-400 text-black', 'bg-amber-700 text-white'];
                  const medalColor = i < 3 ? medals[i] : 'bg-neutral-800 text-neutral-400';
                  return (
                    <div key={u.id} className="flex items-center justify-between bg-black/30 rounded-xl px-4 py-2.5 border border-white/5 hover:border-yellow-500/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black ${medalColor}`}>
                          {i + 1}
                        </div>
                        <span className={`text-sm font-bold ${i === 0 ? 'text-yellow-400' : 'text-neutral-300'}`}>{u.name}</span>
                      </div>
                      <span className="text-sm font-black text-yellow-500">{u.workouts} <span className="text-[9px] text-neutral-500 uppercase tracking-widest">treinos</span></span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Aniversariantes */}
          <div className="bg-neutral-900/50 backdrop-blur-md p-6 rounded-3xl border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-pink-500 via-purple-500 to-pink-500" />
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-pink-500/10 rounded-xl">
                <Cake className="text-pink-400" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black italic uppercase tracking-tight text-white">Aniversariantes</h2>
                <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">{new Date().toLocaleString('pt-BR', { month: 'long' })}</p>
              </div>
            </div>
            {birthdays.length === 0 ? (
              <p className="text-neutral-500 text-sm text-center py-8 font-bold">Nenhum aniversariante este mês</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {birthdays.map(u => (
                  <div key={u.id} className="flex items-center justify-between bg-black/30 rounded-xl px-4 py-2.5 border border-white/5 group">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-pink-500/20 flex items-center justify-center text-[10px] font-black text-pink-400">
                        🎂
                      </div>
                      <div>
                        <span className="text-sm font-bold text-neutral-300">{u.name || 'Sem Nome'}</span>
                        <p className="text-[9px] text-neutral-500 font-bold">Dia {u.day}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => { setNotificationUser(u); setNotificationData({ title: '🎉 Feliz Aniversário!', message: `Parabéns ${u.name || ''}! O ZYRON deseja um dia incrível. Continue evoluindo! 🎂💪` }); }}
                      className="px-2 py-1 bg-pink-500/10 hover:bg-pink-500 text-pink-400 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all"
                    >
                      Parabéns
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* User Table */}

        <div className="bg-neutral-900/50 backdrop-blur-md rounded-3xl border border-white/5 overflow-hidden flex flex-col h-[600px]">
          <div className="p-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-neutral-950/50">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-black italic uppercase tracking-tight text-white">Gestão de Operadores</h2>
              <button
                onClick={() => setShowBroadcast(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 hover:bg-yellow-500 text-yellow-500 hover:text-black rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border border-yellow-500/20"
              >
                <Megaphone size={14} /> Notificar Todos
              </button>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
              {/* Filtros Rápidos */}
              <div className="flex bg-black/50 border border-white/10 rounded-lg p-1 w-full sm:w-auto">
                <button 
                  onClick={() => setFilterStatus('all')}
                  className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-widest transition-all ${filterStatus === 'all' ? 'bg-yellow-500 text-black shadow-sm' : 'text-neutral-500 hover:text-white'}`}
                >Todos</button>
                <button 
                  onClick={() => setFilterStatus('active')}
                  className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-widest transition-all ${filterStatus === 'active' ? 'bg-emerald-500 text-black shadow-sm' : 'text-neutral-500 hover:text-emerald-400'}`}
                >Ativos</button>
                <button 
                  onClick={() => setFilterStatus('inactive')}
                  className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-widest transition-all ${filterStatus === 'inactive' ? 'bg-red-500 text-white shadow-sm' : 'text-neutral-500 hover:text-red-400'}`}
                >Inativos</button>
              </div>

              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
                <input 
                  type="text" 
                  placeholder="Buscar aluno..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-black/50 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/20 w-full md:w-64 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex justify-center flex-col items-center h-full text-neutral-500">
                <div className="w-8 h-8 border-4 border-yellow-400/20 border-t-yellow-400 rounded-full animate-spin mb-4"></div>
                <p className="text-xs font-black uppercase tracking-widest">Carregando Banco de Dados</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex justify-center items-center h-full text-neutral-500 text-sm font-bold uppercase tracking-widest">
                Nenhum operador encontrado na base.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-neutral-900/80 sticky top-0 z-10 backdrop-blur-md">
                  <tr>
                    <th className="p-4 text-[10px] font-black tracking-widest uppercase text-neutral-500 border-b border-white/5">Operador (Nome)</th>
                    <th className="p-4 text-[10px] font-black tracking-widest uppercase text-neutral-500 border-b border-white/5">Email</th>
                    <th className="p-4 text-[10px] font-black tracking-widest uppercase text-neutral-500 border-b border-white/5">Status/Plano</th>
                    <th className="p-4 text-[10px] font-black tracking-widest uppercase text-neutral-500 border-b border-white/5 text-center">Foco</th>
                    <th className="p-4 text-[10px] font-black tracking-widest uppercase text-neutral-500 border-b border-white/5 text-right">Métricas</th>
                    <th className="p-4 text-[10px] font-black tracking-widest uppercase text-neutral-500 border-b border-white/5 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id} onClick={() => handleOpenTimeline(u)} className="border-b border-white/5 hover:bg-white/5 transition-colors group cursor-pointer">
                      <td className="p-4 py-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs ${u.role === 'ADMIN' ? 'bg-red-500 text-white' : 'bg-neutral-800 text-yellow-500 border border-yellow-500/20'}`}>
                            {u.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-200 group-hover:text-yellow-400 transition-colors uppercase text-sm">
                              {u.name || 'Sem Nome'}
                            </p>
                            <span className="text-[9px] text-neutral-500 font-black tracking-widest uppercase">
                              ID: {u.id.substring(0, 8)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-neutral-400">{u.email}</td>
                      <td className="p-4">
                        {u.id.charCodeAt(0) % 5 !== 0 ? (
                          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                            Ativo (PRO+)
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                            Inativo
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-xs font-bold text-neutral-300 uppercase tracking-widest bg-neutral-800 px-3 py-1 rounded-lg">
                          {u.goal || 'Geral'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[11px] font-bold text-neutral-300 uppercase"><span className="text-yellow-500">{u.weight || '--'}</span> KG</span>
                          <span className="text-[9px] font-black text-neutral-500 tracking-widest uppercase">{u.level || 'Não def.'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setCustomPlanUser(u)} className="p-2 bg-neutral-800 hover:bg-emerald-500/20 text-neutral-400 hover:text-emerald-400 rounded-xl transition-colors" title="Atribuir Ficha">
                            <FileCode size={16} />
                          </button>
                          <button onClick={() => setNotificationUser(u)} className="p-2 bg-neutral-800 hover:bg-indigo-500/20 text-neutral-400 hover:text-indigo-400 rounded-xl transition-colors" title="Enviar Notificação">
                            <Bell size={16} />
                          </button>
                          <button onClick={() => setEditUser({...u})} className="p-2 bg-neutral-800 hover:bg-yellow-500/20 text-neutral-400 hover:text-yellow-500 rounded-xl transition-colors" title="Editar">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => setResetUser(u)} className="p-2 bg-neutral-800 hover:bg-blue-500/20 text-neutral-400 hover:text-blue-500 rounded-xl transition-colors" title="Zerar Progresso">
                            <RotateCcw size={16} />
                          </button>
                          {u.role !== 'ADMIN' && (
                            <button onClick={() => setDeleteUser(u)} className="p-2 bg-neutral-800 hover:bg-red-500/20 text-neutral-400 hover:text-red-500 rounded-xl transition-colors" title="Excluir">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        </>
      )}

      {/* Editar Usuário Modal */}

      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-white/10 rounded-3xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black italic uppercase text-white">Editar Perfil</h3>
              <button onClick={() => setEditUser(null)} className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-full"><X size={20} /></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest">Email (Apenas Leitura)</label>
                <input type="text" value={editUser.email} disabled className="w-full bg-black/50 border border-white/5 rounded-xl p-3 text-neutral-500 mt-1 cursor-not-allowed" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest">Nome</label>
                <input type="text" value={editUser.name} onChange={(e) => setEditUser({...editUser, name: e.target.value})} className="w-full bg-black/50 border border-white/10 focus:border-yellow-500 rounded-xl p-3 text-white mt-1 outline-none transition-colors" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest">Idade</label>
                  <input type="number" value={editUser.age || ''} onChange={(e) => setEditUser({...editUser, age: parseInt(e.target.value)})} className="w-full bg-black/50 border border-white/10 focus:border-yellow-500 rounded-xl p-3 text-white mt-1 outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest">Peso (kg)</label>
                  <input type="number" step="0.1" value={editUser.weight || ''} onChange={(e) => setEditUser({...editUser, weight: parseFloat(e.target.value)})} className="w-full bg-black/50 border border-white/10 focus:border-yellow-500 rounded-xl p-3 text-white mt-1 outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest">Altura (cm)</label>
                  <input type="number" value={editUser.height || ''} onChange={(e) => setEditUser({...editUser, height: parseInt(e.target.value)})} className="w-full bg-black/50 border border-white/10 focus:border-yellow-500 rounded-xl p-3 text-white mt-1 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest">Foco</label>
                  <select value={editUser.goal || ''} onChange={(e) => setEditUser({...editUser, goal: e.target.value})} className="w-full bg-black/50 border border-white/10 focus:border-yellow-500 rounded-xl p-3 text-white mt-1 outline-none">
                    <option value="hipertrofia">Hipertrofia</option>
                    <option value="definicao">Definição</option>
                    <option value="forca">Força Bruta</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest">Nível</label>
                  <select value={editUser.level || ''} onChange={(e) => setEditUser({...editUser, level: e.target.value})} className="w-full bg-black/50 border border-white/10 focus:border-yellow-500 rounded-xl p-3 text-white mt-1 outline-none">
                    <option value="iniciante">Iniciante</option>
                    <option value="intermediario">Intermediário</option>
                    <option value="avancado">Avançado</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setEditUser(null)} className="px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs bg-neutral-800 hover:bg-neutral-700 transition-colors">Cancelar</button>
              <button disabled={isProcessing} onClick={handleSaveEdit} className="px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs bg-yellow-500 hover:bg-yellow-400 text-black shadow-[0_0_20px_rgba(234,179,8,0.2)] transition-all flex items-center justify-center min-w-[120px]">
                {isProcessing ? <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Reset */}
      {resetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-white/10 rounded-3xl w-full max-w-sm p-6 shadow-2xl text-center">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
              <RotateCcw className="text-blue-500" size={32} />
            </div>
            <h3 className="text-xl font-black italic uppercase text-white mb-2">Zerar Progresso?</h3>
            <p className="text-sm text-neutral-400 mb-6 font-medium">Tem certeza que deseja apagar os logs de treino, registros de PRs e água de <strong className="text-white">{resetUser.name}</strong>? Os dados de perfil serão mantidos.</p>
            <div className="flex gap-3">
              <button onClick={() => setResetUser(null)} className="flex-1 py-3 rounded-xl font-bold uppercase tracking-widest text-xs bg-neutral-800 hover:bg-neutral-700 transition-colors">Cancelar</button>
              <button disabled={isProcessing} onClick={handleConfirmReset} className="flex-1 py-3 rounded-xl font-black uppercase tracking-widest text-xs bg-blue-600 hover:bg-blue-500 text-white transition-all flex items-center justify-center">
                {isProcessing ? 'Apagando...' : 'Sim, Resetar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Exclusão */}
      {deleteUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-red-500/20 rounded-3xl w-full max-w-sm p-6 shadow-[0_0_40px_rgba(220,38,38,0.1)] text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
              <AlertTriangle className="text-red-500" size={32} />
            </div>
            <h3 className="text-xl font-black italic uppercase text-red-500 mb-2">Excluir Conta?</h3>
            <p className="text-sm text-neutral-400 mb-6 font-medium">Esta ação é <strong>irreversível</strong>. O perfil de <strong className="text-white">{deleteUser.name}</strong> da tabela profiles será apagado e não poderá ser desfeito.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteUser(null)} className="flex-1 py-3 rounded-xl font-bold uppercase tracking-widest text-xs bg-neutral-800 hover:bg-neutral-700 transition-colors">Cancelar</button>
              <button disabled={isProcessing} onClick={handleConfirmDelete} className="flex-1 py-3 rounded-xl font-black uppercase tracking-widest text-xs bg-red-600 hover:bg-red-500 text-white transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] flex items-center justify-center">
                {isProcessing ? 'Excluindo...' : 'Excluir Conta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Notificação */}
      {notificationUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-indigo-500/20 rounded-3xl w-full max-w-md p-6 shadow-[0_0_40px_rgba(99,102,241,0.1)]">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
                  <Bell size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black italic uppercase text-white leading-none">Notificar Aluno</h3>
                  <p className="text-[10px] text-indigo-400 uppercase tracking-widest font-bold mt-1">Para: {notificationUser.name}</p>
                </div>
              </div>
              <button onClick={() => setNotificationUser(null)} className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-full"><X size={20} /></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Título do Aviso</label>
                <input 
                  type="text" 
                  placeholder="Ex: Vencimento da Mensalidade"
                  value={notificationData.title}
                  onChange={(e) => setNotificationData({...notificationData, title: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 focus:border-indigo-500 rounded-xl p-3 text-white mt-1 outline-none transition-colors placeholder:text-neutral-600" 
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Mensagem</label>
                <textarea 
                  placeholder="Ex: Fala João! Sua mensalidade vence amanhã..."
                  rows={4}
                  value={notificationData.message}
                  onChange={(e) => setNotificationData({...notificationData, message: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 focus:border-indigo-500 rounded-xl p-3 text-white mt-1 outline-none transition-colors placeholder:text-neutral-600 resize-none" 
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setNotificationUser(null)} className="px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs bg-neutral-800 hover:bg-neutral-700 transition-colors">Cancelar</button>
              <button disabled={isProcessing} onClick={handleSendNotification} className="px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.2)] transition-all flex items-center justify-center gap-2 min-w-[120px]">
                {isProcessing ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <><Send size={16} /> Enviar</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ficha Personalizada */}
      {customPlanUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-emerald-500/20 rounded-3xl w-full max-w-2xl p-6 shadow-[0_0_40px_rgba(16,185,129,0.1)] flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
                  <FileCode size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black italic uppercase text-white leading-none">Criar Nova Ficha</h3>
                  <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold mt-1">Para: {customPlanUser.name}</p>
                </div>
              </div>
              <button onClick={() => setCustomPlanUser(null)} className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-full"><X size={20} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
              <div>
                <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Nome da Ficha</label>
                <input 
                  type="text" 
                  value={customPlanData.name}
                  onChange={(e) => setCustomPlanData({...customPlanData, name: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 focus:border-emerald-500 rounded-xl p-3 text-white mt-1 outline-none transition-colors" 
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Selecionar Exercícios</label>
                  <span className="text-xs font-black text-neutral-500 tracking-widest">{customPlanData.exercises.length} Selecionados</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {allExercises.map(ex => (
                    <label 
                      key={ex.id} 
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        customPlanData.exercises.includes(ex.id) 
                          ? 'bg-emerald-500/10 border-emerald-500/50 text-white' 
                          : 'bg-black/50 border-white/5 text-neutral-400 hover:border-white/20'
                      }`}
                    >
                      <input 
                        type="checkbox" 
                        checked={customPlanData.exercises.includes(ex.id)}
                        onChange={() => toggleExerciseSelection(ex.id)}
                        className="hidden"
                      />
                      <div className={`w-4 h-4 rounded shadow-inner border flex items-center justify-center shrink-0 transition-colors ${
                        customPlanData.exercises.includes(ex.id) ? 'bg-emerald-500 border-emerald-500' : 'bg-neutral-800 border-neutral-600'
                      }`}>
                        {customPlanData.exercises.includes(ex.id) && <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold truncate">{ex.name}</span>
                        <span className="text-[9px] uppercase tracking-widest text-neutral-500">{ex.group}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex justify-end gap-3 shrink-0">
              <button onClick={() => setCustomPlanUser(null)} className="px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs bg-neutral-800 hover:bg-neutral-700 transition-colors text-white">Cancelar</button>
              <button disabled={isProcessing} onClick={handleAssignCustomPlan} className="px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all flex items-center justify-center gap-2 min-w-[150px]">
                {isProcessing ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <><FileCode size={16} /> Salvar Ficha</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════ Modal Broadcast (Notificar Todos) ══════ */}
      {showBroadcast && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-neutral-900 border border-yellow-500/20 rounded-3xl w-full max-w-md p-6 shadow-[0_0_40px_rgba(234,179,8,0.1)]"
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 rounded-xl text-yellow-400">
                  <Megaphone size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black italic uppercase text-white leading-none">Broadcast</h3>
                  <p className="text-[10px] text-yellow-400 uppercase tracking-widest font-bold mt-1">Para: Todos ({users.length} alunos)</p>
                </div>
              </div>
              <button onClick={() => setShowBroadcast(false)} className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-full"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest">Título</label>
                <input
                  type="text"
                  placeholder="Ex: Nova ficha disponível!"
                  value={broadcastData.title}
                  onChange={(e) => setBroadcastData({...broadcastData, title: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 focus:border-yellow-500 rounded-xl p-3 text-white mt-1 outline-none transition-colors placeholder:text-neutral-600"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest">Mensagem</label>
                <textarea
                  placeholder="Ex: A partir de hoje, todos os alunos têm acesso à ficha atualizada..."
                  rows={4}
                  value={broadcastData.message}
                  onChange={(e) => setBroadcastData({...broadcastData, message: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 focus:border-yellow-500 rounded-xl p-3 text-white mt-1 outline-none transition-colors placeholder:text-neutral-600 resize-none"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setShowBroadcast(false)} className="px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs bg-neutral-800 hover:bg-neutral-700 transition-colors">Cancelar</button>
              <button disabled={isProcessing} onClick={handleBroadcast} className="px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs bg-yellow-500 hover:bg-yellow-400 text-black shadow-[0_0_20px_rgba(234,179,8,0.2)] transition-all flex items-center justify-center gap-2 min-w-[150px]">
                {isProcessing ? <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : <><Megaphone size={16} /> Enviar para Todos</>}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ══════ Modal Timeline do Aluno ══════ */}
      <AnimatePresence>
        {timelineUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-neutral-900 border border-white/10 rounded-3xl w-full max-w-lg p-6 shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="flex justify-between items-center mb-6 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500/10 rounded-xl text-yellow-400">
                    <Clock size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black italic uppercase text-white leading-none">Timeline</h3>
                    <p className="text-[10px] text-yellow-400 uppercase tracking-widest font-bold mt-1">{timelineUser.name || timelineUser.email} — Últimos 30 treinos</p>
                  </div>
                </div>
                <button onClick={() => setTimelineUser(null)} className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-full"><X size={20} /></button>
              </div>

              {/* Perfil Summary Area */}
              <div className="grid grid-cols-3 gap-2 mb-6 shrink-0">
                <div className="bg-black/30 rounded-2xl p-3 border border-white/5 text-center">
                   <p className="text-[8px] font-black text-neutral-500 uppercase tracking-widest mb-1">Peso Atual</p>
                   <p className="text-sm font-black text-yellow-400">{timelineUser.weight || '--'} kg</p>
                </div>
                <div className="bg-black/30 rounded-2xl p-3 border border-white/5 text-center">
                   <p className="text-[8px] font-black text-neutral-500 uppercase tracking-widest mb-1">Objetivo</p>
                   <p className="text-sm font-black text-emerald-400 uppercase tracking-tighter truncate">{timelineUser.goal || 'Geral'}</p>
                </div>
                <div className="bg-black/30 rounded-2xl p-3 border border-white/5 text-center">
                   <p className="text-[8px] font-black text-neutral-500 uppercase tracking-widest mb-1">Foco</p>
                   <p className="text-sm font-black text-indigo-400 uppercase tracking-tighter truncate">{timelineUser.level || 'Full Body'}</p>
                </div>
              </div>

              {/* Quick Docs (Dieta) */}
              <div className="mb-6 shrink-0">
                <div className="flex items-center gap-2 mb-2 px-1">
                  <FileCode size={12} className="text-neutral-500" />
                  <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Documentos & Dieta</span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                   <button className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] font-bold text-red-400 whitespace-nowrap">
                     <FileText size={14} /> Plano Alimentar.pdf
                   </button>
                   <button className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[10px] font-bold text-blue-400 whitespace-nowrap">
                     <Activity size={14} /> Exames.pdf
                   </button>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-3 px-1">
                <Dumbbell size={12} className="text-neutral-500" />
                <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Histórico de Treinos</span>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                {timelineLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="w-8 h-8 border-4 border-yellow-400/20 border-t-yellow-400 rounded-full animate-spin" />
                  </div>
                ) : timelineData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
                    <Calendar size={40} className="mb-3 opacity-30" />
                    <p className="text-sm font-bold uppercase tracking-widest">Nenhum treino registrado</p>
                  </div>
                ) : (
                  timelineData.map((log, i) => {
                    const date = new Date(log.created_at);
                    const dayStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                    const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                    const durMin = log.duration_seconds ? Math.floor(log.duration_seconds / 60) : '—';
                    const setsCount = log.total_sets || log.sets_count || '—';

                    return (
                      <motion.div
                        key={log.id || i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="flex items-center gap-4 bg-black/30 rounded-xl px-4 py-3 border border-white/5 hover:border-yellow-500/20 transition-colors"
                      >
                        {/* Date pill */}
                        <div className="flex flex-col items-center min-w-[44px]">
                          <span className="text-sm font-black text-yellow-400">{dayStr}</span>
                          <span className="text-[9px] text-neutral-500 font-bold">{timeStr}</span>
                        </div>

                        {/* Divider */}
                        <div className="w-px h-10 bg-white/10" />

                        {/* Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-neutral-300 uppercase tracking-wider">
                              Treino {log.workout_key || ''}
                            </span>
                          </div>
                          <div className="flex gap-4 mt-1">
                            <span className="text-[10px] text-neutral-500 font-bold">
                              ⏱ {durMin}min
                            </span>
                            <span className="text-[10px] text-neutral-500 font-bold">
                              💪 {setsCount} séries
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
    </div>
  );
}

```

## src/components/Anatomy3D.jsx
```jsx
import React, { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

// All active muscles use Neon Yellow in the Black Gold edition
const NEON_YELLOW = '#FDE047';
const BRUSHED_STEEL = '#222222';

function HumanFigure({ activeGroup, heatMap = {} }) {
  const groupRef = useRef()

  const getHeatIntensity = (part) => {
    // If we have a heatmap (Phase 6), prioritize it:
    if (Object.keys(heatMap).length > 0) {
      return heatMap[part] || 0; // Returns 0.0 to 1.0
    }
    // Backward compatibility with activeGroup
    return part === activeGroup ? 1.0 : 0;
  }

  const getMaterialProps = (part) => {
    const intensity = getHeatIntensity(part);
    const isActive = intensity > 0;
    
    return {
      color: isActive ? NEON_YELLOW : BRUSHED_STEEL,
      metalness: isActive ? 0.3 : 0.9, // Brushed steel is highly metal
      roughness: isActive ? 0.2 : 0.45, // Brushed steel has medium roughness
      emissive: isActive ? NEON_YELLOW : '#000000',
      emissiveIntensity: isActive ? (1.5 * intensity) : 0
    }
  }

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.3
    }
  })

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Head */}
      <mesh position={[0, 1.65, 0]}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial {...getMaterialProps('Cabeca')} />
      </mesh>

      {/* Neck */}
      <mesh position={[0, 1.42, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.18, 12]} />
        <meshStandardMaterial {...getMaterialProps('Pescoco')} />
      </mesh>

      {/* Torso / Chest */}
      <mesh position={[0, 1.0, 0]}>
        <boxGeometry args={[0.55, 0.7, 0.28]} />
        <meshStandardMaterial {...getMaterialProps('Peito')} />
      </mesh>

      {/* Abdômen */}
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[0.48, 0.35, 0.25]} />
        <meshStandardMaterial {...getMaterialProps('Abdômen')} />
      </mesh>

      {/* Shoulders */}
      <mesh position={[-0.35, 1.2, 0]}>
        <sphereGeometry args={[0.13, 12, 12]} />
        <meshStandardMaterial {...getMaterialProps('Ombro')} />
      </mesh>
      <mesh position={[0.35, 1.2, 0]}>
        <sphereGeometry args={[0.13, 12, 12]} />
        <meshStandardMaterial {...getMaterialProps('Ombro')} />
      </mesh>

      {/* Upper Arms (Bíceps/Tríceps) */}
      <mesh position={[-0.45, 0.88, 0]}>
        <cylinderGeometry args={[0.09, 0.08, 0.45, 10]} />
        <meshStandardMaterial {...getMaterialProps('Bíceps')} />
      </mesh>
      <mesh position={[0.45, 0.88, 0]}>
        <cylinderGeometry args={[0.09, 0.08, 0.45, 10]} />
        <meshStandardMaterial {...getMaterialProps('Bíceps')} />
      </mesh>

      {/* Forearms (Tríceps continued) */}
      <mesh position={[-0.45, 0.42, 0]}>
        <cylinderGeometry args={[0.07, 0.055, 0.4, 10]} />
        <meshStandardMaterial {...getMaterialProps('Tríceps')} />
      </mesh>
      <mesh position={[0.45, 0.42, 0]}>
        <cylinderGeometry args={[0.07, 0.055, 0.4, 10]} />
        <meshStandardMaterial {...getMaterialProps('Tríceps')} />
      </mesh>

      {/* Back (visible from back) */}
      <mesh position={[0, 1.0, -0.08]}>
        <boxGeometry args={[0.5, 0.65, 0.12]} />
        <meshStandardMaterial {...getMaterialProps('Costas')} />
      </mesh>

      {/* Hips */}
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[0.5, 0.22, 0.27]} />
        <meshStandardMaterial {...getMaterialProps('Quadril')} />
      </mesh>

      {/* Upper Legs (Perna) */}
      <mesh position={[-0.16, -0.12, 0]}>
        <cylinderGeometry args={[0.11, 0.09, 0.55, 10]} />
        <meshStandardMaterial {...getMaterialProps('Perna')} />
      </mesh>
      <mesh position={[0.16, -0.12, 0]}>
        <cylinderGeometry args={[0.11, 0.09, 0.55, 10]} />
        <meshStandardMaterial {...getMaterialProps('Perna')} />
      </mesh>

      {/* Lower Legs (Panturrilha) */}
      <mesh position={[-0.16, -0.58, 0]}>
        <cylinderGeometry args={[0.08, 0.065, 0.5, 10]} />
        <meshStandardMaterial {...getMaterialProps('Panturrilha')} />
      </mesh>
      <mesh position={[0.16, -0.58, 0]}>
        <cylinderGeometry args={[0.08, 0.065, 0.5, 10]} />
        <meshStandardMaterial {...getMaterialProps('Panturrilha')} />
      </mesh>

      {/* Feet */}
      <mesh position={[-0.16, -0.87, 0.05]}>
        <boxGeometry args={[0.1, 0.07, 0.22]} />
        <meshStandardMaterial {...getMaterialProps('Pe')} />
      </mesh>
      <mesh position={[0.16, -0.87, 0.05]}>
        <boxGeometry args={[0.1, 0.07, 0.22]} />
        <meshStandardMaterial {...getMaterialProps('Pe')} />
      </mesh>
    </group>
  )
}

export default function Anatomy3D({ activeGroup, heatMap = {} }) {
  const activeColor = NEON_YELLOW;
  
  // Calculate if there's any active recovering muscle in heatmap
  const hasHeat = Object.keys(heatMap).length > 0 || activeGroup;

  return (
    <div className="h-56 w-full bg-neutral-900/40 rounded-3xl border border-white/5 overflow-hidden relative shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]">
      {/* Label */}
      <div className="absolute top-3 left-4 z-10 flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${hasHeat ? 'animate-pulse' : ''}`}
          style={{ backgroundColor: hasHeat ? activeColor : '#475569', boxShadow: hasHeat ? `0 0 10px ${activeColor}` : 'none' }}
        />
        <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400">
          {activeGroup ? `Foco Muscular: ${activeGroup}` : 'Smart Anatomy Engine'}
        </span>
      </div>

      <Canvas camera={{ position: [0, 0.5, 3.2], fov: 45 }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[2, 3, 2]} intensity={1.5} color="#ffffff" />
        <pointLight position={[-2, 1, -2]} intensity={0.5} color={activeColor} />
        <HumanFigure activeGroup={activeGroup} heatMap={heatMap} />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.8}
        />
      </Canvas>

      {/* Touch hint */}
      <div className="absolute bottom-2 right-4 z-10 pointer-events-none">
        <p className="text-[8px] font-bold text-slate-700 uppercase tracking-[0.2em]">drag to rotate</p>
      </div>
    </div>
  )
}

```

## src/components/ErrorBoundary.jsx
```jsx
import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error, errorInfo) {
    return {
      hasError: true,
      error,
      errorInfo
    };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log do erro
    console.error('❌ ErrorBoundary capturou erro:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorBoundary: true
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-900 text-white flex items-center justify-center p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">❌ Erro Crítico</h1>
            <p className="mb-4">Ocorreu um erro inesperado</p>
            <div className="bg-red-800 p-4 rounded text-sm">
              <p className="font-medium mb-2">{this.state.error?.message || 'Erro desconhecido'}</p>
              <details className="text-left">
                <summary className="cursor-pointer font-medium">Detalhes Técnicos</summary>
                <pre className="text-xs mt-2 overflow-auto">
                  {JSON.stringify({
                    error: this.state.error?.message,
                    stack: this.state.error?.stack,
                    componentStack: this.state.errorInfo?.componentStack
                  }, null, 2)}
                </pre>
              </details>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

```

## src/components/ErrorDiagnostics.jsx
```jsx
import React, { useState, useEffect } from 'react';

export default function ErrorDiagnostics() {
  const [isVisible, setIsVisible] = useState(false);
  const [diagnostics, setDiagnostics] = useState({});

  useEffect(() => {
    const runDiagnostics = () => {
      const results = {
        // 1. Verificar Service Worker
        serviceWorker: {
          registered: !!navigator.serviceWorker,
          controller: !!navigator.serviceWorker?.controller,
          ready: navigator.serviceWorker?.controller?.state === 'activated'
        },
        
        // 2. Verificar PWA
        pwa: {
          standalone: window.matchMedia('(display-mode: standalone)').matches,
          installed: window.localStorage.getItem('pwa-installed') === 'true',
          beforeinstallprompt: 'onbeforeinstallprompt' in window
        },
        
        // 3. Verificar Storage
        storage: {
          localStorage: !!window.localStorage,
          sessionStorage: !!window.sessionStorage,
          indexedDB: 'indexedDB' in window
        },
        
        // 4. Verificar Network
        network: {
          online: navigator.onLine,
          effectiveType: navigator.connection?.effectiveType,
          downlink: navigator.connection?.downlink,
          rtt: navigator.connection?.rtt
        },
        
        // 5. Verificar Hardware
        hardware: {
          cores: navigator.hardwareConcurrency,
          memory: navigator.deviceMemory,
          vibration: 'vibrate' in navigator
        },
        
        // 6. Verificar Áudio
        audio: {
          context: 'AudioContext' in window,
          webAudio: 'webkitAudioContext' in window,
          mediaDevices: navigator.mediaDevices?.getUserMedia
        }
      };
      
      setDiagnostics(results);
    };

    runDiagnostics();
  }, []);

  const refreshDiagnostics = () => {
    runDiagnostics();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 left-4 bg-gray-900 text-white p-4 rounded-lg shadow-lg z-50 max-w-md max-h-96 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">🔧 Diagnóstico do Sistema</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-3">
        <div className="space-y-2">
          <h4 className="font-medium text-green-400 mb-2">✅ Service Worker</h4>
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span>Registrado:</span>
              <span className={diagnostics.serviceWorker?.registered ? 'text-green-400' : 'text-red-400'}>
                {diagnostics.serviceWorker?.registered ? 'Sim' : 'Não'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Controller:</span>
              <span className={diagnostics.serviceWorker?.controller ? 'text-green-400' : 'text-yellow-400'}>
                {diagnostics.serviceWorker?.controller ? 'Ativo' : 'Inativo'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Estado:</span>
              <span className={diagnostics.serviceWorker?.ready ? 'text-green-400' : 'text-red-400'}>
                {diagnostics.serviceWorker?.ready ? 'Pronto' : 'Não pronto'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <h4 className="font-medium text-blue-400 mb-2">📱 PWA</h4>
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span>Standalone:</span>
              <span className={diagnostics.pwa?.standalone ? 'text-green-400' : 'text-gray-400'}>
                {diagnostics.pwa?.standalone ? 'Sim' : 'Não'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Instalado:</span>
              <span className={diagnostics.pwa?.installed ? 'text-green-400' : 'text-yellow-400'}>
                {diagnostics.pwa?.installed ? 'Sim' : 'Não'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <h4 className="font-medium text-purple-400 mb-2">💾 Storage</h4>
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span>LocalStorage:</span>
              <span className={diagnostics.storage?.localStorage ? 'text-green-400' : 'text-red-400'}>
                {diagnostics.storage?.localStorage ? 'Disponível' : 'Indisponível'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>SessionStorage:</span>
              <span className={diagnostics.storage?.sessionStorage ? 'text-green-400' : 'text-red-400'}>
                {diagnostics.storage?.sessionStorage ? 'Disponível' : 'Indisponível'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>IndexedDB:</span>
              <span className={diagnostics.storage?.indexedDB ? 'text-green-400' : 'text-gray-400'}>
                {diagnostics.storage?.indexedDB ? 'Disponível' : 'Desconhecido'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <h4 className="font-medium text-yellow-400 mb-2">🌐 Network</h4>
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span>Online:</span>
              <span className={diagnostics.network?.online ? 'text-green-400' : 'text-red-400'}>
                {diagnostics.network?.online ? 'Sim' : 'Não'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Conexão:</span>
              <span className="text-gray-400">
                {diagnostics.network?.effectiveType || 'Desconhecida'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <h4 className="font-medium text-orange-400 mb-2">🔧 Hardware</h4>
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span>CPU Cores:</span>
              <span className="text-gray-400">
                {diagnostics.hardware?.cores || 'Desconhecido'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Memória:</span>
              <span className="text-gray-400">
                {diagnostics.hardware?.memory ? `${Math.round(diagnostics.hardware.memory * 1024)} MB` : 'Desconhecida'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Vibração:</span>
              <span className={diagnostics.hardware?.vibration ? 'text-green-400' : 'text-gray-400'}>
                {diagnostics.hardware?.vibration ? 'Disponível' : 'Indisponível'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <h4 className="font-medium text-red-400 mb-2">🎵 Áudio</h4>
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span>AudioContext:</span>
              <span className={diagnostics.audio?.context ? 'text-green-400' : 'text-red-400'}>
                {diagnostics.audio?.context ? 'Disponível' : 'Indisponível'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Web Audio:</span>
              <span className={diagnostics.audio?.webAudio ? 'text-green-400' : 'text-red-400'}>
                {diagnostics.audio?.webAudio ? 'Disponível' : 'Indisponível'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Media Devices:</span>
              <span className={diagnostics.audio?.mediaDevices ? 'text-green-400' : 'text-yellow-400'}>
                {diagnostics.audio?.mediaDevices ? 'Disponível' : 'Permissão necessária'}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex space-x-2 mt-4">
        <button
          onClick={refreshDiagnostics}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm"
        >
          Atualizar
        </button>
        <button
          onClick={() => setIsVisible(false)}
          className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded text-sm"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}

```

## src/components/ErrorLogger.jsx
```jsx
import React, { useState, useEffect } from 'react';

export default function ErrorLogger() {
  const [errors, setErrors] = useState([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Capturar erros globais
    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = (...args) => {
      const error = {
        timestamp: new Date(),
        message: args.join(' '),
        stack: new Error().stack,
        level: 'error'
      };
      
      setErrors(prev => [...prev, error]);
      originalError(...args);
    };

    console.warn = (...args) => {
      const warning = {
        timestamp: new Date(),
        message: args.join(' '),
        level: 'warning'
      };
      
      setErrors(prev => [...prev, warning]);
      originalWarn(...args);
    };

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  const clearErrors = () => {
    setErrors([]);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 bg-gray-900 text-white p-4 rounded-lg shadow-lg z-50 max-w-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">📋 Error Logger</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {errors.length === 0 ? (
          <p className="text-gray-400 text-center">Nenhum erro capturado</p>
        ) : (
          errors.map((error, index) => (
            <div key={index} className={`text-xs p-2 rounded ${
              error.level === 'error' ? 'bg-red-900' :
              error.level === 'warning' ? 'bg-yellow-900' : 'bg-gray-800'
            }`}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-400">
                  {error.timestamp.toLocaleTimeString()}
                </span>
                <span className={`px-2 py-1 rounded text-xs ${
                  error.level === 'error' ? 'bg-red-600' :
                  error.level === 'warning' ? 'bg-yellow-600' : 'bg-gray-600'
                }`}>
                  {error.level.toUpperCase()}
                </span>
              </div>
              <div className="text-gray-200">{error.message}</div>
            </div>
          ))
        )}
      </div>
      
      <div className="flex space-x-2 mt-4">
        <button
          onClick={clearErrors}
          className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm"
        >
          Limpar Erros
        </button>
        <button
          onClick={() => {
            const dataStr = JSON.stringify(errors, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `zyron-errors-${new Date().toISOString()}.json`;
            a.click();
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm"
        >
          Exportar
        </button>
      </div>
    </div>
  );
}

```

## src/components/EvolutionTimeline.jsx
```jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Camera, Clock, ChevronRight, X, Trophy, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import logger from '../utils/logger';

export default function EvolutionTimeline({ user }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, [user?.id]);

  const fetchHistory = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (err) {
      logger.error('Erro ao buscar histórico de evolução', {}, err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="space-y-8 pb-10">
      <header className="flex justify-between items-end px-1">
        <div>
          <p className="text-yellow-400 text-xs font-black uppercase tracking-widest">Seu Progresso</p>
          <h2 className="text-3xl font-black italic text-white leading-none tracking-tighter">LINHA DO TEMPO</h2>
        </div>
        <div className="bg-yellow-400/10 p-2 rounded-2xl border border-yellow-400/20 shadow-[0_0_15px_rgba(253,224,71,0.15)]">
          <TrendingUp className="text-yellow-400" size={24} />
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-yellow-400/20 border-t-yellow-400 rounded-full animate-spin" />
          <p className="text-xs font-black text-neutral-500 uppercase tracking-widest">Carregando Evolução...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-20 bg-neutral-900/30 rounded-3xl border border-dashed border-neutral-800">
           <Trophy size={48} className="mx-auto text-neutral-800 mb-4" />
           <p className="font-black uppercase tracking-widest text-[10px] text-neutral-600">Nenhum treino registrado ainda</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 px-1">
          {history.map((item) => (
            <motion.div
              key={item.id}
              layoutId={`card-${item.id}`}
              onClick={() => item.photo_url && setSelectedPhoto(item)}
              className="relative aspect-square bg-neutral-900 rounded-3xl overflow-hidden border border-white/5 active:scale-95 transition-transform cursor-pointer group"
            >
              {item.photo_url ? (
                <motion.img 
                  layoutId={`photo-${item.id}`}
                  src={item.photo_url} 
                  alt="Progresso" 
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center gap-2">
                   <div className="text-neutral-700 bg-neutral-800/50 p-3 rounded-full">
                      <Clock size={20} />
                   </div>
                   <span className="text-[8px] font-black text-neutral-500 uppercase tracking-widest leading-none">Treino s/ foto</span>
                </div>
              )}
              
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-4 right-4">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-yellow-400 tracking-widest uppercase">{formatDate(item.created_at)}</span>
                  <span className="text-[8px] font-bold text-neutral-400 uppercase">{Math.floor(item.duration_seconds / 60)}m</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Shared Element Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPhoto(null)}
              className="absolute inset-0 bg-black/95 backdrop-blur-2xl"
            />
            
            <motion.div
              layoutId={`card-${selectedPhoto.id}`}
              className="relative w-full max-w-lg aspect-[3/4] rounded-4xl overflow-hidden shadow-2xl border border-white/10 z-110"
            >
              <motion.img
                layoutId={`photo-${selectedPhoto.id}`}
                src={selectedPhoto.photo_url}
                className="w-full h-full object-cover"
              />
              
              <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
                 <div className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                    <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mb-0.5">Evolução ZYRON</p>
                    <h3 className="text-lg font-black italic text-white uppercase tracking-tighter">{formatDate(selectedPhoto.created_at)}</h3>
                 </div>
                 <button 
                  onClick={() => setSelectedPhoto(null)}
                  className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-red-500 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="absolute bottom-6 left-6 right-6 bg-black/50 backdrop-blur-md p-6 rounded-3xl border border-white/10">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Duração do Treino</span>
                    <p className="text-xl font-black italic">{Math.floor(selectedPhoto.duration_seconds / 60)}m {selectedPhoto.duration_seconds % 60}s</p>
                  </div>
                  <Trophy className="text-yellow-400" size={32} />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

```

## src/components/FichaDeTreinoScreen.jsx
```jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Dumbbell, 
  User, 
  LogOut, 
  ArrowRight, 
  PlayCircle, 
  PauseCircle, 
  ChevronLeft, 
  ChevronRight, 
  Share2, 
  CheckCircle, 
  Zap, 
  Droplets, 
  Beef, 
  MessageSquare, 
  Camera, 
  Scale, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Award, 
  Trophy, 
  Target, 
  History, 
  Settings, 
  Bell, 
  ChevronDown, 
  Check, 
  X, 
  Search, 
  Filter, 
  Shield, 
  Activity,
  Calendar, // Added from original first import
  Play, // Added from original first import
  CheckCircle2, // Added from original first import
  Timer as TimerIcon, // Added from original first import
  Plus, // Added from original first import
  Minus, // Added from original first import
  ArrowBigUp, // Added from original first import
  ShieldAlert, // Added from original first import
  Moon, // Added from original first import
  Sun, // Added from original first import
  Coffee, // Added from original first import
  CreditCard, // Added from original first import
  Crown, // Added from original first import
  Flame, // Added from original first import
  FileText, // Added from original first import
  Download, // Added from original first import
  QrCode // Added from original first import
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Pagination } from 'swiper/modules';
import { workoutData } from '../data/workoutData';
import Anatomy3D from './Anatomy3D';
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import WorkoutCard from './WorkoutCard';
import WorkoutCompleted from './WorkoutCompleted';
import { supabase } from '../lib/supabase';
import { sanitizeWorkoutState } from '../utils/sanitizer';

import TabPainel from './tabs/TabPainel';
import TabTreino from './tabs/TabTreino';
import TabEvolucao from './tabs/TabEvolucao';
import TabPerfil from './tabs/TabPerfil';
import TabCoach from './tabs/TabCoach';
import { useSyncWorkout } from '../hooks/useSyncWorkout';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';

// YouTube Direct Video IDs for each exercise
// Replace these with your own preferred tutorial video IDs
export const EXERCISE_VIDEOS = {
  'p1': '50RSzhMG5Hc', // Supino Reto Barra
  'p2': 'Fa-X2ByLHaY', // Supino Inclinado Halter
  'p_cm': 'nuTuKjcQRHg', // Crucifixo Maquina (using crossover as proxy)
  'p3': 'nuTuKjcQRHg', // Cross Over
  't1': '5PPKThQuR3M', // Triceps Pulley
  't2': 'VnFopAIGO7E', // Triceps Corda
  't3': '40Cx-IfJhA0', // Triceps Testa
  't_mb': '2OymsPc-9Tw', // Mergulho Banco (using frances as proxy)
  'c1': '3qj46qsOgfI', // Puxada Aberta
  'c_rc': 'fEA4O71kFr4', // Remada Curvada (using baixa as proxy)
  'c_rm': 'mjFIZX68F_8', // Remada Maquina (using serrote as proxy)
  'c_pd': 'mjFIZX68F_8', // Pulldown
  'b1': 'iA4RH6zDin0', // Rosca Direta Barra W
  'b_ra': '8PN6YfFC6Q4', // Rosca Alternada (using martelo as proxy)
  'b3': 'Qm4NdQttdi8', // Rosca Concentrada
  'l1': '3vTRFnzCMaA', // Agachamento Livre
  'l2': 'DQ4-HXFlKXI', // Leg Press 45
  'l3': 'I_uBK4DDflU', // Extensora
  'l4': 'PcTCUdxywHo', // Mesa Flexora
  'l_st': 'PcTCUdxywHo', // Stiff
  'l_ep': 'PcTCUdxywHo', // Elevacao Pelvica
  'ca1': 'ZQdqLXtNpMQ',// Gemeos em Pe
  'ca_s': 'ZQdqLXtNpMQ', // Panturrilha Sentado
  's1': 'DFXtzdXN_iY', // Desenvolvimento Halter
  's2': 'yURmeIEl1Fg', // Elevacao Lateral
  's3': 'F6toacmeUlA', // Elevacao Frontal
  's4': 'C9Q9so5Fqws', // Crucifixo Inverso
  's_et': 'C9Q9so5Fqws', // Encolhimento
  'b_rw': 'iA4RH6zDin0', // Rosca Barra W
  'b2': '8PN6YfFC6Q4', // Rosca Martelo
  'b_bi': 'Qm4NdQttdi8', // Rosca Banco Inclinado
};

const QUICK_ACTIONS = [
  { id: 'session', icon: Zap, label: 'Iniciar Sessão' },
  { id: 'water', icon: Droplets, label: 'Água +250ml' },
  { id: 'protein', icon: Beef, label: 'Proteína +30g' },
  { id: 'coach', icon: MessageSquare, label: 'Coach IA' },
  { id: 'photo', icon: Camera, label: 'Foto Evolução' },
  { id: 'weight', icon: Scale, label: 'Registrar Peso' },
];

const QUICK_ICON_MAP = { 
  Zap, 
  Droplets, 
  Beef, 
  Coffee, 
  Camera, 
  Scale,
  Dumbbell,
  LayoutDashboard,
  Target
};

export default function FichaDeTreinoScreen({ user, onLogout, onOpenAdmin }) {
  // Debug: Log do objeto user
  console.log('🔍 DEBUG - User object:', user);
  console.log('🔍 DEBUG - User name:', user?.name);
  console.log('🔍 DEBUG - User role:', user?.role);
  console.log('🔍 DEBUG - User email:', user?.email);
  console.log('🔍 DEBUG - User id:', user?.id);
  
  const [userProfile, setUserProfile] = useState(null);
  
  // Buscar perfil completo do usuário
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) return;
      
      console.log('🔍 Buscando perfil para user ID:', user.id);
      console.log('🔍 User email:', user.email);
      
      try {
        // Tentar buscar por ID primeiro
        let { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (error) {
          console.warn('⚠️ Erro ao buscar perfil por ID:', error);
          
          // Fallback: buscar por email
          console.log('🔄 Tentando buscar por email...');
          const { data: emailData, error: emailError } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', user.email)
            .maybeSingle();
            
          if (emailError) {
            console.error('❌ Erro ao buscar perfil por email:', emailError);
            console.log('🔍 Criando perfil padrão...');
            
            // Criar perfil padrão se não existir
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert({
                id: user.id,
                email: user.email,
                name: user.email?.split('@')[0] || 'Usuário',
                role: user.user_metadata?.role || 
                      (['raiiimundoemanuel2018@gmail.com', 'raimundoemanuel2018@gmail.com', 'raimundoemanuel1@gmail.com'].includes(user.email?.toLowerCase()) ? 'ADMIN' : 'USER'),
                created_at: new Date().toISOString()
              })
              .select('*')
              .single();
              
            if (createError) {
              console.error('❌ Erro ao criar perfil:', createError);
              return;
            }
            
            console.log('✅ Perfil criado:', newProfile);
            setUserProfile(newProfile);
          } else {
            console.log('✅ Perfil encontrado por email:', emailData);
            setUserProfile(emailData);
          }
        } else {
          console.log('✅ Perfil encontrado por ID:', data);
          setUserProfile(data);
        }
      } catch (error) {
        console.error('❌ Erro geral ao buscar perfil:', error);
      }
    };
    
    fetchUserProfile();
  }, [user?.id, user?.email]);
  const [activeTab, setActiveTab] = useState('painel');
  const [perfilTab, setPerfilTab] = useState('geral');
  const [isTraining, setIsTraining] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [videoModal, setVideoModal] = useState(null); // Keep for painel preview
  const [expandedVideo, setExpandedVideo] = useState(null); // For inline workout videos
  const [water, setWater] = useState(0);
  const [protein, setProtein] = useState(0);
  const [loads, setLoads] = useState({});
  const [prHistory, setPrHistory] = useState({});
  const [completedExercises, setCompletedExercises] = useState([]);
  const [sessionSets, setSessionSets] = useState([]); // Advanced Sync: Track all sets
  const [restTimer, setRestTimer] = useState(0);
  const [weight, setWeight] = useState(80);
  const [lastWaterTime, setLastWaterTime] = useState(Date.now()); // Para alerta de 2 horas
  const [nightMode, setNightMode] = useState(false); // Low blue light filter
  const [showPR, setShowPR] = useState(null); // Animation trigger for PR
  const [selectedWorkoutKey, setSelectedWorkoutKey] = useState(null);
  const [availableWorkouts, setAvailableWorkouts] = useState(workoutData);
  const [isLoaded, setIsLoaded] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [showCompletedScreen, setShowCompletedScreen] = useState(false);
  const [lastWorkoutSummary, setLastWorkoutSummary] = useState(null);
  
  const timerRef = useRef(null);
  const restTimerRef = useRef(null);
  const appConstraintsRef = useRef(null);

  // ZYRON SYNC ENGINE: Offline-first persistence
  const { logWorkout, isOnline, syncPending } = useSyncWorkout(user);

  // Auto-day detection (Default)
  const today = new Date().getDay();
  const currentWorkout = selectedWorkoutKey !== null ? availableWorkouts[selectedWorkoutKey] : availableWorkouts[today];

  // Load from localStorage
  useEffect(() => {
    const savedLogs = localStorage.getItem('gym_logs');
    const savedDaily = localStorage.getItem('gym_daily');
    const savedPRs = localStorage.getItem('gym_prs');
    const savedWeight = localStorage.getItem('gym_weight');
    const savedSession = localStorage.getItem('gym_active_session');
    const savedVersion = localStorage.getItem('gym_version');
    const todayStr = new Date().toDateString();

    const CURRENT_VERSION = 'zyron-v2';

    // Se a versão do app mudou (nova ficha), limpa a sessão antiga para forçar o novo treino
    if (savedVersion !== CURRENT_VERSION) {
      localStorage.removeItem('gym_active_session');
      localStorage.setItem('gym_version', CURRENT_VERSION);
    } else {
      try {
        if (savedSession) {
          const session = JSON.parse(savedSession);
          if (session && session.date === todayStr) {
            setIsTraining(!!session.isTraining);
            setSelectedWorkoutKey(session.selectedWorkoutKey !== undefined ? session.selectedWorkoutKey : null);
            setCompletedExercises(Array.isArray(session.completedExercises) ? session.completedExercises : []);
            setSessionTime(Number(session.sessionTime) || 0);
            if (session.isTraining) setActiveTab('workout');
          }
        }
      } catch (e) {
        console.error("Erro ao carregar sessão do LocalStorage:", e);
      }
    }

    try {
      if (savedLogs) setLoads(JSON.parse(savedLogs) || {});
      if (savedPRs) setPrHistory(JSON.parse(savedPRs) || {});
      if (savedWeight) setWeight(parseFloat(savedWeight) || 80);

      if (savedDaily) {
        const daily = JSON.parse(savedDaily);
        if (daily && daily.date === todayStr) {
          setWater(Number(daily.water) || 0);
          setProtein(Number(daily.protein) || 0);
          if (daily.lastWaterTime) setLastWaterTime(Number(daily.lastWaterTime));
        }
      }
    } catch (e) {
      console.error("Erro ao carregar dados do LocalStorage:", e);
    }
    
    setIsLoaded(true);
  }, []);

  // Fetch Custom Workouts
  useEffect(() => {
    const fetchCustomWorkouts = async () => {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from('custom_workouts')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true);
        
        if (data && data.length > 0) {
          const allExercisesFlat = Object.values(workoutData).flatMap(day => day.exercises || []);
          const expandedWorkouts = { ...workoutData };
          
          data.forEach(cw => {
            const assignedExercises = cw.exercises.map(exId => allExercisesFlat.find(e => e.id === exId)).filter(Boolean);
            expandedWorkouts[`custom_${cw.id}`] = {
              title: cw.workout_name,
              focus: "Ficha VIP Exclusiva",
              image: "/images/custom.png", 
              exercises: assignedExercises,
              isCustom: true
            };
          });
          
          setAvailableWorkouts(expandedWorkouts);
        }
      } catch (err) {
        console.error("Erro ao carregar Ficha Personalizada:", err);
      }
    };

    if (isLoaded) {
      fetchCustomWorkouts();
    }
  }, [user, isLoaded]);

  // Save Daily Stats & Weight
  useEffect(() => {
    const todayStr = new Date().toDateString();
    try {
      // Higienização rigorosa para evitar estruturas circulares (ex: eventos React/SVG)
      const safeWater = typeof water === 'number' ? water : (parseFloat(water) || 0);
      const safeProtein = typeof protein === 'number' ? protein : (parseFloat(protein) || 0);
      const safeWeight = typeof weight === 'number' ? weight : (parseFloat(weight) || 80);
      const safeWaterTime = typeof lastWaterTime === 'number' ? lastWaterTime : Date.now();

      localStorage.setItem('gym_daily', JSON.stringify({
        date: String(todayStr),
        water: safeWater,
        protein: safeProtein,
        lastWaterTime: safeWaterTime
      }));
      localStorage.setItem('gym_weight', String(safeWeight));
    } catch (e) {
      console.error("Falha ao persistir dados diários no localStorage:", e);
    }

    // Sync com Supabase (Fire and forget, Offline-First)
    if (user?.id) {
      const todayIso = new Date().toISOString().split('T')[0];
      supabase.from('daily_stats').upsert({
        user_id: user.id,
        date: todayIso,
        water_amount: Number(water) || 0,
        protein_amount: Number(protein) || 0
      }, { onConflict: 'user_id, date' });

      supabase.from('profiles').update({ weight: Number(weight) || 0 }).eq('id', user.id);
    }
  }, [water, protein, weight, lastWaterTime, isLoaded, user]);

  // Save Session Persistence
  useEffect(() => {
    if (!isLoaded) return;
    if (isTraining) {
      try {
        const todayStr = new Date().toDateString();
        // NUCLEAR CLEANING: Use the new sanitizer utility to prevent circularity
        const rawSession = {
          date: new Date().toDateString(),
          isTraining,
          selectedWorkoutKey,
          completedExercises,
          sessionTime
        };
        
        const cleanSession = sanitizeWorkoutState(rawSession);
        localStorage.setItem('gym_active_session', JSON.stringify(cleanSession));
      } catch (e) {
        console.error("Falha ao salvar sessão (Estrutura Circular Detectada):", e);
      }
    } else {
      localStorage.removeItem('gym_active_session');
    }
  }, [isTraining, selectedWorkoutKey, completedExercises, sessionTime, isLoaded]);

  // Session Timer Logic
  useEffect(() => {
    if (isTraining) {
      timerRef.current = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isTraining]);

  // Rest Timer Logic
  useEffect(() => {
    if (restTimer > 0) {
      restTimerRef.current = setInterval(() => {
        setRestTimer(prev => prev - 1);
      }, 1000);
    } else {
      clearInterval(restTimerRef.current);
    }
    return () => clearInterval(restTimerRef.current);
  }, [restTimer]);

  const startSession = (workoutKey) => {
    // SECURITY FIX: React onClick passes the Event object if no arguments are provided.
    // If workoutKey is an object (like an SVGSVGElement Event), fallback to `today`.
    let safeKey = today;
    if (typeof workoutKey === 'number' || typeof workoutKey === 'string') {
      safeKey = Number(workoutKey);
    }

    setIsTraining(true);
    setSelectedWorkoutKey(safeKey);
    setActiveTab('workout');
    setSessionTime(0);
    setCompletedExercises([]);
  };

  const handleExerciseComplete = (id, isFinal = true, setData = null) => {
    if (setData) {
      setSessionSets(prev => [...prev, {
        exercise_id: id,
        ...setData,
        timestamp: new Date().toISOString()
      }]);
    }

    if (isFinal) {
      if (!completedExercises.includes(id)) {
        setCompletedExercises(prev => [...prev, id]);
      }
    }
    setRestTimer(60); 
  };

  const handleFinishSession = async () => {
    if (isTraining) {
      setLastWorkoutSummary({
        workout: {
          workout_key: String(selectedWorkoutKey || today),
          duration_seconds: sessionTime,
          created_at: new Date().toISOString()
        },
        sets: [...sessionSets]
      });
      setShowCompletedScreen(true);
      setIsTraining(false);
      localStorage.removeItem('gym_active_session');
    }
  };

  const handleFinalSync = async (workoutData, setsData) => {
    await logWorkout(workoutData, setsData);
    setShowCompletedScreen(false);
    setSessionSets([]);
    setLastWorkoutSummary(null);
  };

  const [voiceTimerActive, setVoiceTimerActive] = useState(false);
  const [plankTime, setPlankTime] = useState(0);
  const plankIntervalRef = useRef(null);

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.2;
      utterance.pitch = 0.8; // Lower pitch for industrial feel
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleVoiceTimer = () => {
    if (voiceTimerActive) {
      clearInterval(plankIntervalRef.current);
      setVoiceTimerActive(false);
      speak("Sessão finalizada. Excelente trabalho, ZYRON.");
    } else {
      setPlankTime(0);
      setVoiceTimerActive(true);
      speak("Iniciando prancha. Mantenha o core rígido.");
      
      plankIntervalRef.current = setInterval(() => {
        setPlankTime(prev => {
          const next = prev + 1;
          if (next === 30) speak("Trinta segundos. Mantenha a guarda.");
          if (next === 60) speak("Um minuto. Nível Alpha atingido.");
          if (next % 60 === 0 && next > 60) speak(`${next / 60} minutos. Performance extrema.`);
          return next;
        });
      }, 1000);
    }
  };

  const formatPlankTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ... (rest of the return content below)

  const updateLoad = (exerciseId, value) => {
    const newWeight = parseFloat(value);
    const oldPR = prHistory[exerciseId] || 0;
    
    // Progressive Overload Check
    if (newWeight > oldPR) {
      try {
        const newPRs = { ...prHistory, [exerciseId]: newWeight };
        setPrHistory(newPRs);
        
        // Higienização de PRs (Garantir apenas números)
        const cleanPRs = {};
        Object.keys(newPRs).forEach(k => {
          if (typeof newPRs[k] === 'number') cleanPRs[k] = newPRs[k];
          else if (!isNaN(parseFloat(newPRs[k]))) cleanPRs[k] = parseFloat(newPRs[k]);
        });
        
        localStorage.setItem('gym_prs', JSON.stringify(cleanPRs));
        setShowPR(exerciseId);
        setTimeout(() => setShowPR(null), 3000);

        if (user?.id) {
          supabase.from('exercise_prs').upsert({
            user_id: user.id,
            exercise_id: exerciseId,
            max_load: newWeight
          }, { onConflict: 'user_id, exercise_id' });
        }
      } catch (e) {
        console.error("Failed to save PR to localStorage:", e);
      }
    }

    try {
      const newLoads = { ...loads, [exerciseId]: value };
      setLoads(newLoads);
      
      // Sanitização profunda do objeto de cargas
      const cleanLoads = {};
      Object.keys(newLoads).forEach(key => {
        if (typeof newLoads[key] === 'string' || typeof newLoads[key] === 'number') {
          cleanLoads[key] = String(newLoads[key]);
        }
      });
      localStorage.setItem('gym_logs', JSON.stringify(cleanLoads));
    } catch (e) {
      console.error("Erro ao salvar cargas:", e);
    }
  };

  const handleWaterDrink = (val) => {
    setWater(prev => (val === 0 ? 0 : prev + val));
    if (val !== 0) {
      setLastWaterTime(Date.now());
    }
  };

  const waterGoal = (weight * 35) / 1000;
  const proteinGoal = Math.floor(weight * 2);
  const isHydrationAlert = (Date.now() - lastWaterTime) > 7200000; // 2 hours in ms
  const remainingProtein = Math.max(0, proteinGoal - protein);

  // UI Components
  const NavButton = ({ id, icon: Icon, label }) => {
    const emojiMap = {
      painel: '📊',
      workout: '💪',
      coach: '💬',
      perfil: '👤'
    };
    return (
      <button
        onClick={() => {
          if (id) setActiveTab(String(id));
        }}
        className={`flex flex-col items-center justify-center py-2 px-1 transition-all duration-300 ${
          activeTab === id ? 'text-yellow-300 scale-110' : 'text-neutral-500 hover:text-slate-300'
        }`}
      >
        <span className="text-xl mb-1">{emojiMap[id] || '📍'}</span>
        <span className="text-[10px] uppercase font-black tracking-tighter">{label}</span>
        {activeTab === id && (
          <motion.div layoutId="nav-dot" className="h-1 w-1 bg-yellow-400 rounded-full mt-1" />
        )}
      </button>
    );
  };

  const GlassCard = ({ children, className = "", gradient = false }) => (
    <div className={`relative overflow-hidden bg-neutral-900/50 backdrop-blur-md border border-neutral-800 rounded-2xl p-6 shadow-[0_0_20px_rgba(37,99,235,0.05)] hover:border-yellow-500/30 transition-all duration-500 ${className}`}>
      {gradient && (
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-yellow-500 via-indigo-500 to-yellow-500 animate-gradient-x"></div>
      )}
      {children}
    </div>
  );

  return (
    <div ref={appConstraintsRef} className={`min-h-screen bg-black text-slate-100 font-sans pb-32 transition-all duration-700 ${nightMode ? 'sepia-[0.3] brightness-[0.8]' : ''}`}>
      
      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-20 overflow-hidden z-0">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-yellow-500 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute top-1/2 -right-24 w-64 h-64 bg-indigo-600 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Rest Timer Top Bar */}
      <AnimatePresence>
        {restTimer > 0 && (
          <motion.div 
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            className={`fixed top-0 left-0 w-full z-50 px-6 py-2 flex items-center justify-between shadow-xl transition-colors duration-500 ${
              restTimer <= 10 ? 'bg-red-500 text-white' : 'bg-yellow-400 text-neutral-950'
            }`}
          >
            <div className="flex items-center gap-2 font-black uppercase text-[10px] tracking-widest italic">
              <Zap size={14} className="animate-bounce" /> 
              {restTimer <= 10 ? 'PREPARAR PARA SÉRIE' : 'RECUPERAÇÃO ATIVA'}
            </div>
            <div className="flex items-center gap-4">
              <div className="text-xl font-black font-mono tracking-tighter">{restTimer}s</div>
              <button onClick={() => setRestTimer(0)} className="bg-black/10 p-1 rounded-md hover:bg-black/20 transition-colors">
                <Plus size={14} className="rotate-45" />
              </button>
            </div>
            {/* Progress bar line */}
            <motion.div 
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 60, ease: "linear" }}
              className="absolute bottom-0 left-0 h-1 w-full origin-left bg-black/20"
            />
          </motion.div>
        )}
        {/* Neon Green "Série Liberada" popup when timer hits 0 (managed briefly via state or just implicit) */}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/5 p-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-neutral-800 border-2 border-yellow-500 overflow-hidden relative shrink-0">
              <img src="/images/zyron-logo.png" alt="ZYRON" className="w-full h-full object-contain mix-blend-screen" />
            </div>
            <div>
              <h1 className="text-base font-black italic tracking-tighter uppercase leading-none text-slate-100">
                {userProfile?.name || user?.name || user?.email?.split('@')[0] || 'ALUNO'}
              </h1>
              <p className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest mt-0.5">ZYRON</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setNightMode(!nightMode)}
              className={`p-2 rounded-xl transition-all ${nightMode ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-neutral-900 text-neutral-500 hover:text-white'}`}
              title="Modo Noturno (Low Blue Light)"
            >
              {nightMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {((userProfile?.role === 'ADMIN' || user?.role === 'ADMIN' || user?.user_metadata?.role === 'ADMIN' || ['raiiimundoemanuel2018@gmail.com', 'raimundoemanuel2018@gmail.com', 'raimundoemanuel1@gmail.com'].includes(user?.email?.toLowerCase())) || 
               (userProfile?.role === 'PERSONAL' || user?.role === 'PERSONAL' || user?.user_metadata?.role === 'PERSONAL')) && (
              <button 
                onClick={onOpenAdmin}
                className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-500/20 group flex items-center gap-2"
                title="God Mode"
              >
                <ShieldAlert size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Admin</span>
              </button>
            )}

            <button 
              onClick={onLogout}
              className="p-2 rounded-xl bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white transition-all border border-white/5 group"
              title="Sair do App"
            >
              <LogOut size={18} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {isTraining && (
          <div className="max-w-xl mx-auto mt-3">
             <motion.div 
               initial={{ scale: 0.8, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="bg-red-500/10 border border-red-500/20 px-4 py-1.5 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-red-500/5"
             >
               <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
               <span className="text-xs font-black font-mono text-red-500 tracking-tighter">SESSÃO ATIVA: {formatTime(sessionTime)}</span>
             </motion.div>
          </div>
        )}
      </header>

      <main className="max-w-xl mx-auto p-6 relative z-10">
        <AnimatePresence mode="wait">
          
          {/* PAINEL SCREEN */}
          {activeTab === 'painel' && (
            <TabPainel 
              user={user} today={today} currentWorkout={currentWorkout} 
              startSession={startSession} water={water} waterGoal={waterGoal} 
              isHydrationAlert={isHydrationAlert} handleWaterDrink={handleWaterDrink} 
              protein={protein} proteinGoal={proteinGoal} setProtein={setProtein} 
            />
          )}

          {/* WORKOUT SCREEN */}
          {activeTab === 'workout' && (
            <TabTreino 
              today={today} workoutData={availableWorkouts} startSession={startSession} 
              setVideoModal={setVideoModal} isTraining={isTraining} setIsTraining={handleFinishSession}
              currentWorkout={currentWorkout} completedExercises={completedExercises} 
              restTimer={restTimer} handleExerciseComplete={handleExerciseComplete} 
              loads={loads} updateLoad={updateLoad} prHistory={prHistory} showPR={showPR} 
            />
          )}

          {/* PROGRESS SCREEN */}
          {activeTab === 'progress' && (
            <TabEvolucao 
              user={user}
              currentWorkout={currentWorkout} 
              prHistory={prHistory} 
              weight={weight} 
              setWeight={setWeight} 
              workoutData={availableWorkouts}
            />
          )}

          {/* PERFIL SCREEN */}
          {activeTab === 'perfil' && (
            <TabPerfil 
              user={user} today={today} voiceTimerActive={voiceTimerActive} 
              toggleVoiceTimer={toggleVoiceTimer} formatPlankTime={formatPlankTime} 
              plankTime={plankTime} onLogout={onLogout} 
            />
          )}

          {/* COACH IA SCREEN */}
          {activeTab === 'coach' && (
            <TabCoach
              user={user}
              prHistory={prHistory}
              workoutData={availableWorkouts}
            />
          )}

        </AnimatePresence>

        {/* Global Video PiP */}
        <AnimatePresence>
          {videoModal && (
            <motion.div
              drag
              dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
              dragElastic={0.4}
              onDragEnd={(e, info) => {
                if (info.offset.y < -50 || info.offset.y > 50) setVideoModal(null);
              }}
              initial={{ opacity: 0, y: 50, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.8 }}
              className="fixed bottom-32 right-4 z-50 w-72 bg-neutral-900 rounded-2xl border border-white/10 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] cursor-grab active:cursor-grabbing"
            >
              <div className="flex justify-between items-center px-4 py-3 bg-neutral-950 border-b border-white/5 pointer-events-auto">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-white truncate max-w-[180px]">{videoModal.name}</h4>
                </div>
                <button
                  onClick={() => setVideoModal(null)}
                  className="text-neutral-500 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="relative aspect-video bg-black pointer-events-none">
                <div className="absolute inset-0 pointer-events-auto">
                  <iframe
                    src={`https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(videoModal.query)}&autoplay=1&rel=0&controls=0`}
                    title={videoModal.name}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
              <div className="px-4 py-2 bg-neutral-950/80 backdrop-blur-md flex justify-center">
                <div className="w-8 h-1 bg-white/20 rounded-full" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* FAB Backdrop Overlay */}
      <AnimatePresence>
        {fabOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
            onClick={() => setFabOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* FAB Quick Actions Menu */}
      <AnimatePresence>
        {fabOpen && (
          <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
            {QUICK_ACTIONS.map((item, index) => {
              const totalItems = QUICK_ACTIONS.length;
              const spreadAngle = 160;
              const startAngle = -90 - spreadAngle / 2;
              const angleStep = spreadAngle / (totalItems - 1);
              const angle = (startAngle + index * angleStep) * (Math.PI / 180);
              const radius = 130;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
                  animate={{ opacity: 1, x, y, scale: 1 }}
                  exit={{ opacity: 0, x: 0, y: 0, scale: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22, delay: index * 0.04 }}
                  className="absolute pointer-events-auto"
                  style={{ left: '50%', top: '50%', transform: `translate(-50%, -50%)` }}
                >
                  <button
                    onClick={(e) => {
                      // CRITICAL FIX: explicitly prevent the Event object from passing through
                      if (e && e.preventDefault) e.preventDefault();
                      if (e && e.stopPropagation) e.stopPropagation();
                      setFabOpen(false);
                      
                      const actionId = item.id;
                      if (actionId === 'session') {
                        startSession(Number(today)); 
                      } else if (actionId === 'water') {
                        handleWaterDrink(0.25);
                      } else if (actionId === 'protein') {
                        setProtein(prev => prev + 30);
                      } else if (actionId === 'coach') {
                        setActiveTab('coach');
                      } else if (actionId === 'photo') {
                        setActiveTab('progress');
                      } else if (actionId === 'weight') {
                        setActiveTab('perfil');
                      }
                    }}
                    className="group flex flex-col items-center gap-1.5 focus:outline-none"
                  >
                    <div className="h-12 w-12 rounded-full bg-neutral-900 flex items-center justify-center shadow-[0_0_15px_rgba(253,224,71,0.2)] border border-yellow-400/30 group-hover:scale-110 group-active:scale-90 group-hover:border-yellow-400 group-hover:shadow-[0_0_25px_rgba(253,224,71,0.5)] transition-all duration-300">
                      <item.icon size={22} className="text-yellow-400 drop-shadow-[0_0_8px_rgba(253,224,71,0.8)]" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-white/90 whitespace-nowrap bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full">
                      {item.label}
                    </span>
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* Navigation moved below Player in App.jsx or kept here if it's tab-specific */}

      {/* FIXED NAVIGATION */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[92%] max-w-lg bg-neutral-900/60 backdrop-blur-3xl border border-white/10 rounded-full p-3 flex justify-between items-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50">
        <NavButton id="painel" icon={LayoutDashboard} label="Painel" />
        <NavButton id="workout" icon={Dumbbell} label="Treino" />
        
        <button 
          onClick={() => setFabOpen(!fabOpen)}
          className={`relative h-16 w-16 rounded-full -mt-16 border-4 border-neutral-950 shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group overflow-hidden ${
            fabOpen 
              ? 'bg-red-500 shadow-red-500/40' 
              : 'bg-yellow-400 shadow-yellow-400/40'
          }`}
        >
          <div className="absolute inset-0 bg-linear-to-tr from-white/20 to-transparent"></div>
          <div
            className={`relative z-10 pointer-events-none flex items-center justify-center transition-transform duration-300 ${fabOpen ? 'rotate-45' : ''}`}
          >
            {/* REMOVIDO TODO SVG E MOTION PARA ISOLAR CRASH CIRCULAR */}
            <span className="text-3xl font-black text-neutral-950" style={{ marginTop: '-4px' }}>+</span>
          </div>
        </button>

        <NavButton id="progress" icon={Trophy} label="Evolução" />
        <NavButton id="perfil" icon={Target} label="Perfil" />
      </nav>

      {/* Global Style Inject for Animations */}
      <style>{`
        @keyframes gradient-x {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }
      `}</style>
      {/* Workout Completed Screen Overlay */}
      <AnimatePresence>
        {showCompletedScreen && lastWorkoutSummary && (
          <WorkoutCompleted 
            workout={lastWorkoutSummary.workout}
            sets={lastWorkoutSummary.sets}
            onFinish={handleFinalSync}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

```

## src/components/ForceUpdateBanner.jsx
```jsx
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRegisterSW } from 'virtual:pwa-register/react';
import logger from '../utils/logger';

export default function ForceUpdateBanner() {
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(null);

  // ZYRON: The native, correct way to handle Vite PWA updates in Prompt Mode
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('[PWA] SW Registrado:', r);
    },
    onRegisterError(error) {
      console.error('[PWA] Erro no registro do SW:', error);
    },
  });

  const handleUpdate = () => {
    logger.systemEvent('Usuário iniciou atualização do PWA (Prompt Mode)');
    let p = 0;
    progressRef.current = setInterval(() => {
      p += Math.random() * 25 + 10;
      if (p >= 100) {
        p = 100;
        clearInterval(progressRef.current);
        // Aplica o update matando o Worker antigo e recarrega a página instantaneamente
        updateServiceWorker(true);
      }
      setProgress(p);
    }, 200);
  };

  const close = () => {
    setNeedRefresh(false);
  };

  if (!needRefresh) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed top-0 left-0 right-0 z-100 p-3"
      >
        <div className="relative mx-auto max-w-md overflow-hidden rounded-2xl border border-white/10 bg-black/70 backdrop-blur-xl shadow-[0_8px_40px_rgba(253,224,71,0.15)]">
          {/* Barra de progresso amarela no topo */}
          {progress > 0 && (
            <motion.div
              className="absolute top-0 left-0 h-[3px] bg-linear-to-r from-yellow-400 to-yellow-200"
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: 'easeOut', duration: 0.3 }}
            />
          )}

          <div className="flex items-center gap-3 px-4 py-3">
            {/* Ícone animado */}
            <div className="relative shrink-0">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                className="w-10 h-10 rounded-xl bg-linear-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-yellow-400/20"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                  <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                  <path d="M16 21h5v-5" />
                </svg>
              </motion.div>
              {/* Pulsing glow */}
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 rounded-xl bg-yellow-400/30 blur-md"
              />
            </div>

            {/* Texto */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white leading-tight">
                Nova versão disponível
              </p>
              <p className="text-[11px] text-neutral-400 leading-tight mt-0.5">
                Toque para atualizar o ZYRON
              </p>
            </div>

            {/* Botões */}
            <div className="flex items-center gap-2 shrink-0">
              {progress === 0 ? (
                <>
                  <button
                    onClick={close}
                    className="text-neutral-500 text-xs font-medium px-2 py-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-all"
                  >
                    Depois
                  </button>
                  <button
                    onClick={handleUpdate}
                    className="px-4 py-1.5 rounded-xl bg-linear-to-r from-yellow-400 to-amber-500 text-black text-xs font-black uppercase tracking-wide shadow-lg shadow-yellow-400/20 hover:shadow-yellow-400/40 active:scale-95 transition-all"
                  >
                    Atualizar
                  </button>
                </>
              ) : (
                <span className="text-yellow-400 text-xs font-bold animate-pulse">
                  Atualizando...
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

```

## src/components/GlobalPlayer.jsx
```jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Music, Maximize2, Zap } from 'lucide-react';
import { useMusic } from '../contexts/MusicContext';
import audioUnlocker from '../utils/audioUnlock';

/**
 * ZYRON Global Player Component
 * Handles music playback and UI, with built-in iOS audio unlock protection.
 */
export default function GlobalPlayer({ constraintsRef }) {
  const { 
    currentTrack, 
    isPlaying, 
    togglePlay, 
    nextTrack, 
    prevTrack, 
    progress,
    playerPosition,
    updatePlayerPosition,
    isMinimized,
    toggleMinimized
  } = useMusic();

  const controls = useAnimation();
  const [lastTap, setLastTap] = useState(0);

  // ZYRON iOS RESCUE: Secure Audio Context Unlock
  useEffect(() => {
    // 1. Initialize the internal context (stateless)
    audioUnlocker.init();

    // 2. Define the interaction handler
    const handleInteraction = async () => {
      console.log('🎵 Interação detectada: Desbloqueando motor de áudio...');
      const success = await audioUnlocker.unlock();
      
      if (success) {
        // Remove listeners immediately after success
        window.removeEventListener('click', handleInteraction);
        window.removeEventListener('touchstart', handleInteraction);
      }
    };

    // 3. Attach listeners globally but managed by this component
    window.addEventListener('click', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  // Sync animation position on mount or changes
  useEffect(() => {
    controls.set(playerPosition);
  }, [playerPosition, controls]);

  // MEDIA SESSION API: Industrial background support
  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack) {
      // 1. Atualizar Metadados (iOS/Android Lockscreen)
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title || 'Treino ZYRON',
        artist: currentTrack.artist || 'ZYRON Coach',
        album: 'A Força da Sua Evolução',
        artwork: [
          { src: currentTrack.thumbnail || '/images/zyron-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/images/zyron-192.png', sizes: '192x192', type: 'image/png' }
        ]
      });

      // 2. Handlers de Controle Remoto
      const actions = [
        ['play', togglePlay],
        ['pause', togglePlay],
        ['previoustrack', prevTrack],
        ['nexttrack', nextTrack],
        ['seekbackward', () => {}],
        ['seekforward', () => {}]
      ];

      for (const [action, handler] of actions) {
        try {
          navigator.mediaSession.setActionHandler(action, handler);
        } catch (error) {
          console.warn(`MediaSession action "${action}" não suportada.`);
        }
      }

      // 3. Sincronizar estado de reprodução
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [currentTrack, isPlaying, togglePlay, nextTrack, prevTrack]);

  const handleDragEnd = (event, info) => {
    // Current offset within constraints
    let newPos = { x: info.offset.x, y: info.offset.y };
    
    // Window boundaries for snap logic (approximate assuming player is small)
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const currentAbsoluteX = info.point.x;
    const currentAbsoluteY = info.point.y;
    
    // Auto-Snap to Edges (Left or Right) to free visual space
    if (currentAbsoluteX < windowWidth / 2) {
      newPos.x -= currentAbsoluteX - 20; // Snap to left margin
    } else {
      newPos.x += (windowWidth - currentAbsoluteX) - 20; // Snap to right margin
    }

    // Auto-Snap to avoid Bottom Bar and Top Safe Area
    if (currentAbsoluteY > windowHeight - 100) {
      newPos.y -= (currentAbsoluteY - (windowHeight - 120)); // Push up from bottom nav
    } else if (currentAbsoluteY < 80) {
      newPos.y += (80 - currentAbsoluteY); // Push down from top edge/notches
    }

    // Animate to snapped position
    controls.start({ x: newPos.x, y: newPos.y, transition: { type: 'spring', stiffness: 300, damping: 30 } });
    
    // Save to LocalStorage persistently
    updatePlayerPosition(newPos);
  };


  const handleTap = (e) => {
    // Evitar que cliques nos botões de controle propaguem para o container
    if (e.target.closest('button')) return;
    
    toggleMinimized();
  };

  if (!currentTrack) return null;

  return (
    <motion.div
      drag
      dragConstraints={constraintsRef} // App.jsx ref holding the screen
      dragElastic={0.1}
      dragMomentum={false} // Prevent sliding off-screen indefinitely
      animate={controls}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.05, opacity: 0.95, cursor: 'grabbing' }}
      whileTap={{ scale: 0.98 }}
      className={`fixed z-50 cursor-grab touch-none select-none
        ${isMinimized 
          ? 'w-16 h-16 rounded-[2rem]' 
          : 'w-64 rounded-[2.5rem] p-1.5'
        }
        bg-black/70 backdrop-blur-xl border border-yellow-400/80 shadow-[0_10px_40px_rgba(253,224,71,0.25)]
        flex items-center gap-2 overflow-hidden transition-[width,height,border-radius] duration-400 ease-[cubic-bezier(0.25,1,0.5,1)]
      `}
      style={{ bottom: '100px', left: '20px' }}
      onClick={handleTap}
    >
      <AnimatePresence mode="wait">
        {isMinimized ? (
          <motion.div
            key="minimized-pill"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="w-full h-full rounded-full overflow-hidden relative group"
          >
            {currentTrack.thumbnail ? (
               <img src={currentTrack.thumbnail} alt="Capa" className="w-full h-full object-cover brightness-75 group-hover:brightness-100 transition-all" />
            ) : (
               <div className="w-full h-full flex items-center justify-center bg-neutral-900">
                 <Music className="text-yellow-400" size={20} />
               </div>
            )}
            {isPlaying && (
              <div className="absolute inset-0 border-[3px] border-yellow-400/30 rounded-full animate-ping" />
            )}
          </motion.div>
        ) : (
          <motion.div
            key="expanded-pill"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex items-center w-full gap-2 px-1 relative"
          >
            {/* Thumbnail Circle */}
            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-white/20 shadow-lg">
              {currentTrack.thumbnail ? (
                <img src={currentTrack.thumbnail} alt="Capa" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-neutral-800">
                  <Music className="text-yellow-400" size={14} />
                </div>
              )}
            </div>

            {/* Compact Metadata */}
            <div className="flex-1 min-w-0">
               <h4 className="text-[10px] font-black text-white truncate uppercase tracking-tighter">
                 {currentTrack.title}
               </h4>
               <p className="text-[8px] font-bold text-yellow-400/80 truncate uppercase">
                 {currentTrack.artist || 'ZYRON'}
               </p>
            </div>

            {/* Quick Controls */}
            <div className="flex items-center gap-1.5 pr-1">
              <button 
                onTouchStart={(e) => { e.stopPropagation(); togglePlay(); }}
                className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-black active:scale-90 transition-transform shadow-md"
              >
                {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
              </button>
              
              <button 
                onTouchStart={(e) => { e.stopPropagation(); nextTrack(); }}
                className="text-white/40 hover:text-white transition-colors p-1"
              >
                <SkipForward size={16} fill="currentColor" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Precision Progress Bar */}
      {!isMinimized && (
        <div className="absolute bottom-0 left-0 h-[2px] w-full bg-white/10 overflow-hidden">
          <motion.div 
            className="h-full bg-yellow-400 shadow-[0_0_10px_#FDE047]"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </motion.div>
  );
}

```

## src/components/LoginScreen.jsx
```jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, ShieldCheck, Zap } from "lucide-react";

import { supabase } from "../lib/supabase";

// Typewriter hook — loop infinito
function useTypewriter(text, speed = 65, eraseSpeed = 35, hold = 2000, delay = 1200) {
  const [displayed, setDisplayed] = useState('');
  const [phase, setPhase] = useState('wait'); // 'wait' | 'type' | 'hold' | 'erase'

  useEffect(() => {
    let timeout;
    if (phase === 'wait') {
      timeout = setTimeout(() => setPhase('type'), delay);
    } else if (phase === 'type') {
      if (displayed.length < text.length) {
        timeout = setTimeout(() => setDisplayed(text.slice(0, displayed.length + 1)), speed);
      } else {
        timeout = setTimeout(() => setPhase('hold'), hold);
      }
    } else if (phase === 'hold') {
      setPhase('erase');
    } else if (phase === 'erase') {
      if (displayed.length > 0) {
        timeout = setTimeout(() => setDisplayed(text.slice(0, displayed.length - 1)), eraseSpeed);
      } else {
        timeout = setTimeout(() => setPhase('type'), 500);
      }
    }
    return () => clearTimeout(timeout);
  }, [phase, displayed, text, speed, eraseSpeed, hold, delay]);

  return { displayed, isTyping: phase === 'type' || phase === 'wait' };
}

const TypewriterSlogan = () => {
  const { displayed, isTyping } = useTypewriter('A Força da Sua Evolução.', 65, 30, 2500, 1200);
  return (
    <p className="text-sm mt-1 font-black tracking-[0.25em] uppercase h-6 flex items-center justify-center">
      <span className="text-transparent bg-clip-text bg-linear-to-r from-yellow-300 via-yellow-400 to-amber-500 drop-shadow-[0_0_8px_rgba(255,212,0,0.6)]">
        {displayed}
      </span>
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
        className="inline-block w-[2px] h-4 bg-yellow-400 ml-0.5 shadow-[0_0_6px_rgba(255,212,0,0.8)]"
      />
    </p>
  );
};

const IndustrialLogin = ({ onLogin, onRegisterClick }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [showUpdatePassword, setShowUpdatePassword] = useState(false);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setShowUpdatePassword(true);
        setShowRecovery(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      onLogin(data.user);
    } catch (error) {
      console.error("Erro de Autenticação:", error.message);
      alert(
        "Falha no login: " +
          (error.message === "Invalid login credentials"
            ? "Credenciais incorretas."
            : error.message),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setRecoveryLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });

      if (error) throw error;

      setMessage({
        type: "success",
        text: "Link de recuperação enviado! Verifique seu e-mail.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message || "Erro ao enviar e-mail de recuperação.",
      });
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "As senhas não coincidem." });
      return;
    }

    setRecoveryLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setMessage({
        type: "success",
        text: "Senha atualizada com sucesso! Você já pode entrar.",
      });
      
      setTimeout(() => {
        setShowUpdatePassword(false);
        setMessage({ type: "", text: "" });
      }, 3000);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message || "Erro ao atualizar senha.",
      });
    } finally {
      setRecoveryLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 font-sans selection:bg-yellow-400 selection:text-black">
      {/* Efeito de Luz de Fundo (Glow) */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-yellow-500/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-sm relative"
      >
        {/* Logo & Header */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="relative inline-flex items-center justify-center mb-2"
          >
            <img 
              src="/images/zyron-logo.png" 
              alt="ZYRON" 
              className="relative w-48 h-auto object-contain brightness-110 contrast-150 saturate-125 mix-blend-screen"
            />
          </motion.div>
          <TypewriterSlogan />
        </div>

        {/* Card Glassmorphism */}
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
          {/* Barra de Detalhe Industrial */}
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-yellow-400 to-transparent opacity-50" />

          {message.text && (
            <div className={`mb-6 p-4 rounded-xl text-xs font-bold uppercase tracking-wider ${
              message.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
            }`}>
              {message.text}
            </div>
          )}

          {showUpdatePassword ? (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-yellow-400 uppercase ml-1 tracking-widest">
                  Nova Senha
                </label>
                <div className="relative group">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-yellow-400 transition-colors"
                    size={20}
                  />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/20 transition-all text-sm"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-yellow-400 uppercase ml-1 tracking-widest">
                  Confirmar Nova Senha
                </label>
                <div className="relative group">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-yellow-400 transition-colors"
                    size={20}
                  />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/20 transition-all text-sm"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black py-3.5 rounded-xl shadow-[0_10px_20px_rgba(253,224,71,0.2)] flex items-center justify-center gap-2 transition-all uppercase italic tracking-wider text-sm"
                disabled={recoveryLoading}
              >
                {recoveryLoading ? (
                  <div className="w-6 h-6 border-4 border-black/20 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    Confirmar Nova Senha <ArrowRight size={20} />
                  </>
                )}
              </motion.button>
            </form>
          ) : !showRecovery ? (
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Input E-mail */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-yellow-400 uppercase ml-1 tracking-widest">
                  E-mail de Acesso
                </label>
                <div className="relative group">
                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-yellow-400 transition-colors"
                    size={20}
                  />
                  <input
                    type="email"
                    required
                    placeholder="exemplo@email.com"
                    autoComplete="email"
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/20 transition-all text-sm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Input Senha */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-bold text-yellow-400 uppercase tracking-widest">
                    Senha
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowRecovery(true);
                      setMessage({ type: "", text: "" });
                    }}
                    className="text-[10px] text-zinc-500 hover:text-white uppercase font-bold transition-colors"
                  >
                    Esqueceu?
                  </button>
                </div>
                <div className="relative group">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-yellow-400 transition-colors"
                    size={20}
                  />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/20 transition-all text-sm"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {/* Botão de Entrar */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black py-3.5 rounded-xl shadow-[0_10px_20px_rgba(253,224,71,0.2)] flex items-center justify-center gap-2 transition-all uppercase italic tracking-wider text-sm"
                disabled={loading}
              >
                {loading ? (
                  <div className="w-6 h-6 border-4 border-black/20 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    Entrar no Sistema <ArrowRight size={20} />
                  </>
                )}
              </motion.button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-yellow-400 uppercase ml-1 tracking-widest">
                  E-mail para Recuperação
                </label>
                <div className="relative group">
                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-yellow-400 transition-colors"
                    size={20}
                  />
                  <input
                    type="email"
                    required
                    placeholder="exemplo@email.com"
                    autoComplete="email"
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/20 transition-all text-sm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black py-3.5 rounded-xl shadow-[0_10px_20px_rgba(253,224,71,0.2)] flex items-center justify-center gap-2 transition-all uppercase italic tracking-wider text-sm"
                disabled={recoveryLoading}
              >
                {recoveryLoading ? (
                  <div className="w-6 h-6 border-4 border-black/20 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    Enviar Link <ArrowRight size={20} />
                  </>
                )}
              </motion.button>

              <button
                type="button"
                onClick={() => {
                  setShowRecovery(false);
                  setMessage({ type: "", text: "" });
                }}
                className="w-full text-[10px] text-zinc-500 hover:text-white uppercase font-bold transition-colors mt-2"
              >
                Voltar para o Login
              </button>
            </form>
          )}

          {/* Rodapé do Card */}
          <div className="mt-8 pt-6 border-t border-white/5 flex flex-col gap-4 items-center">
            {!showRecovery && (
              <p className="text-zinc-500 text-xs">
                Não tem conta?{" "}
                <span
                  onClick={onRegisterClick}
                  className="text-yellow-400 font-bold cursor-pointer hover:underline"
                >
                  Cadastre-se
                </span>
              </p>
            )}
            <div className="flex items-center gap-2 text-[10px] text-zinc-600 font-bold uppercase tracking-tighter">
              <ShieldCheck size={14} /> Acesso Criptografado de Ponta a Ponta
            </div>
          </div>
        </div>

        {/* Versão do Admin */}
        <p className="text-center mt-8 text-[10px] text-zinc-700 font-mono tracking-[0.3em] uppercase">
          Powered by ZYRON
        </p>
      </motion.div>
    </div>
  );
};

export default IndustrialLogin;

```

## src/components/OnboardingScreen.jsx
```jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Lock, ArrowRight, ArrowLeft, X,
  Activity, Droplets, Target, Dumbbell, Zap, ShieldCheck, CheckCircle2
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function OnboardingScreen({ onComplete, onCancel }) {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    age: 25,
    height: 175,
    weight: 75,
    goal: '',
    level: ''
  });

  const [isProcessing, setIsProcessing] = useState(false);

  const handleNext = () => {
    setDirection(1);
    setStep(s => Math.min(s + 1, 4));
  };
  
  const handleBack = () => {
    setDirection(-1);
    setStep(s => Math.max(s - 1, 1));
  };

  const updateForm = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateIMC = () => {
    if (!formData.height || !formData.weight) return 0;
    const h = formData.height / 100;
    return (formData.weight / (h * h)).toFixed(1);
  };

  const calculateWater = () => {
    return (formData.weight * 35 / 1000).toFixed(1); // in Liters
  };

  const getPasswordStrength = () => {
    const p = formData.password;
    if (p.length === 0) return 0;
    if (p.length < 6) return 1;
    if (p.length < 8) return 2;
    if (/[A-Z]/.test(p) && /[0-9]/.test(p)) return 4;
    return 3;
  };

  const passwordStrength = getPasswordStrength();
  const strengthColors = ['bg-zinc-700', 'bg-red-500', 'bg-orange-500', 'bg-yellow-400', 'bg-emerald-500'];
  const strengthColor = strengthColors[passwordStrength];

  const handleFinish = async () => {
    setIsProcessing(true);
    try {
      // 1. Criar o usuário no Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      const userId = authData.user?.id;

      if (userId) {
        // 2. Salvar o Profile do usuário
        const { error: profileError } = await supabase.from('profiles').insert([
          {
            id: userId,
            name: formData.name,
            email: formData.email,
            age: formData.age,
            height: formData.height,
            weight: formData.weight,
            goal: formData.goal,
            level: formData.level,
            water_goal: Number(calculateWater()),
            protein_goal: Math.floor(formData.weight * 2)
          }
        ]);
        
        if (profileError) {
          console.error("Erro ao salvar perfil:", profileError);
        }
      }

      // Concluído
      setTimeout(() => {
        onComplete(formData);
      }, 1500);
      
    } catch (error) {
       console.error("Erro no cadastro:", error.message);
       alert("Erro ao criar conta: " + error.message + " (Certifique-se de desativar 'Confirm Email' no painel Auth do Supabase se estiver testando)");
       setIsProcessing(false);
    }
  };

  const slideVariants = {
    enter: (dir) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.95
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: { duration: 0.4, type: 'spring', bounce: 0.2 }
    },
    exit: (dir) => ({
      x: dir < 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.3 }
    })
  };

  // Objetivos e Níveis
  const goals = [
    { id: 'hipertrofia', label: 'Hipertrofia', desc: 'Ganho de Massa Muscular', icon: Dumbbell },
    { id: 'definicao', label: 'Definição', desc: 'Queima de Gordura', icon: Activity },
    { id: 'forca', label: 'Força Bruta', desc: 'Aumento de Carga', icon: Target },
  ];

  const levels = [
    { id: 'iniciante', label: 'Iniciante', desc: '< 1 ano de treino' },
    { id: 'intermediario', label: 'Intermediário', desc: '1 a 3 anos de treino' },
    { id: 'avancado', label: 'Avançado', desc: '> 3 anos de treino' },
  ];

  return (
    <div className="fixed inset-0 min-h-screen bg-[#050505] flex flex-col p-6 font-sans selection:bg-yellow-400 selection:text-black overflow-hidden z-50">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-yellow-500/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="w-full max-w-md mx-auto relative z-10 flex flex-col h-full">
        {/* Header */}
        {!isProcessing && (
          <div className="flex items-center justify-between mt-4 mb-8 shrink-0">
            <button onClick={step === 1 ? onCancel : handleBack} className="w-12 h-12 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-400 hover:text-yellow-400 transition-colors">
              {step === 1 ? <X size={24} /> : <ArrowLeft size={24} />}
            </button>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${step >= i ? 'w-8 bg-yellow-400 shadow-[0_0_10px_rgba(253,224,71,0.5)]' : 'w-4 bg-zinc-800'}`} />
              ))}
            </div>
            <div className="w-12" /> {/* Spacer */}
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 relative">
          <AnimatePresence mode="wait" custom={direction}>
            
            {/* STEP 1: CREDENCIAIS */}
            {step === 1 && (
              <motion.div key="step1" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" className="absolute inset-0 flex flex-col">
                <div className="mb-8">
                  <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">Novo <span className="text-yellow-400">Operador</span></h2>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-2">Criação de Credenciais de Acesso</p>
                </div>
                
                <div className="bg-zinc-900/50 backdrop-blur-2xl border border-white/5 p-6 rounded-3xl shadow-2xl space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-yellow-400 uppercase tracking-widest ml-1">Nome de Guerra</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-yellow-400 transition-colors" size={20} />
                      <input type="text" placeholder="Seu nome" value={formData.name} onChange={(e) => updateForm('name', e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-yellow-400/50 transition-all font-bold" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-yellow-400 uppercase tracking-widest ml-1">E-mail</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-yellow-400 transition-colors" size={20} />
                      <input type="email" placeholder="contato@email.com" value={formData.email} onChange={(e) => updateForm('email', e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-yellow-400/50 transition-all font-bold" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-yellow-400 uppercase tracking-widest ml-1">Senha de Acesso</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-yellow-400 transition-colors" size={20} />
                      <input type="password" placeholder="••••••••" value={formData.password} onChange={(e) => updateForm('password', e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-yellow-400/50 transition-all font-bold" />
                    </div>
                    {/* Password Strength */}
                    <div className="flex gap-1 mt-2 h-1.5 px-1">
                      {[1,2,3,4].map(level => (
                        <div key={level} className={`flex-1 rounded-full transition-colors duration-300 ${passwordStrength >= level ? strengthColor : 'bg-zinc-800'}`} />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-8 pb-4 flex justify-end">
                  <button onClick={handleNext} disabled={!formData.name || !formData.email || !formData.password} className="bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed text-black font-black uppercase tracking-widest text-sm px-8 py-4 rounded-xl flex items-center gap-2 shadow-[0_0_20px_rgba(253,224,71,0.3)] transition-all">
                    Avançar <ArrowRight size={18} strokeWidth={3} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: BIOMETRIA */}
            {step === 2 && (
              <motion.div key="step2" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" className="absolute inset-0 flex flex-col">
                <div className="mb-8">
                  <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">Dados <span className="text-yellow-400">Biométricos</span></h2>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-2">Calibração do Motor Interno</p>
                </div>

                <div className="space-y-6">
                  <div className="bg-zinc-900/50 backdrop-blur-2xl border border-white/5 p-6 rounded-3xl shadow-2xl space-y-8">
                    {/* Idade */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <label className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">Idade</label>
                        <span className="text-2xl font-black italic text-white">{formData.age} <span className="text-xs text-zinc-500 uppercase">Anos</span></span>
                      </div>
                      <input type="range" min="14" max="80" value={formData.age} onChange={(e) => updateForm('age', parseInt(e.target.value))} className="w-full h-2 bg-black rounded-lg appearance-none cursor-pointer accent-yellow-400" />
                    </div>

                    {/* Altura */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <label className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">Altura</label>
                        <span className="text-2xl font-black italic text-white">{formData.height} <span className="text-xs text-zinc-500 uppercase">cm</span></span>
                      </div>
                      <input type="range" min="140" max="220" value={formData.height} onChange={(e) => updateForm('height', parseInt(e.target.value))} className="w-full h-2 bg-black rounded-lg appearance-none cursor-pointer accent-yellow-400" />
                    </div>

                    {/* Peso */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <label className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">Peso Atual</label>
                        <span className="text-2xl font-black italic text-white">{formData.weight} <span className="text-xs text-zinc-500 uppercase">kg</span></span>
                      </div>
                      <input type="range" min="40" max="150" step="0.5" value={formData.weight} onChange={(e) => updateForm('weight', parseFloat(e.target.value))} className="w-full h-2 bg-black rounded-lg appearance-none cursor-pointer accent-yellow-400" />
                    </div>
                  </div>

                  {/* Real-time Bio-Data */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-900/30 border border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                      <Activity size={20} className="text-yellow-400 mb-2" />
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Seu IMC</span>
                      <span className="text-2xl font-bold font-mono text-white mt-1">{calculateIMC()}</span>
                    </div>
                    <div className="bg-zinc-900/30 border border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                      <Droplets size={20} className="text-blue-400 mb-2" />
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Hidratação</span>
                      <span className="text-2xl font-bold font-mono text-white mt-1">{calculateWater()} <span className="text-[10px] text-zinc-500">L/dia</span></span>
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-8 pb-4 flex justify-end">
                  <button onClick={handleNext} className="bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase tracking-widest text-sm px-8 py-4 rounded-xl flex items-center gap-2 shadow-[0_0_20px_rgba(253,224,71,0.3)] transition-all">
                    Avançar <ArrowRight size={18} strokeWidth={3} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: PERFIL DE TREINO */}
            {step === 3 && (
              <motion.div key="step3" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" className="absolute inset-0 flex flex-col">
                <div className="mb-8">
                  <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">Objetivos <span className="text-yellow-400">PRO</span></h2>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-2">Definição do Sistema de Treino</p>
                </div>

                <div className="space-y-6 overflow-y-auto pb-4 pr-1">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-yellow-400 uppercase tracking-widest ml-1">Meta Principal</label>
                    <div className="grid grid-cols-1 gap-3">
                      {goals.map(g => (
                        <button 
                          key={g.id} 
                          onClick={() => updateForm('goal', g.id)}
                          className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${formData.goal === g.id ? 'bg-yellow-400/10 border-yellow-400 text-yellow-400 shadow-[0_0_15px_rgba(253,224,71,0.2)]' : 'bg-black/50 border-white/5 text-zinc-400 hover:border-white/20 hover:text-white'}`}
                        >
                          <div className={`p-2 rounded-xl ${formData.goal === g.id ? 'bg-yellow-400 text-black' : 'bg-zinc-800'}`}>
                            <g.icon size={20} />
                          </div>
                          <div className="text-left">
                            <span className="block text-sm font-black uppercase tracking-wider">{g.label}</span>
                            <span className="block text-[10px] uppercase font-bold opacity-70 mt-0.5">{g.desc}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-yellow-400 uppercase tracking-widest ml-1">Nível de Experiência</label>
                    <div className="grid grid-cols-1 gap-3">
                      {levels.map(l => (
                        <button 
                          key={l.id} 
                          onClick={() => updateForm('level', l.id)}
                          className={`flex justify-between items-center p-4 rounded-2xl border transition-all ${formData.level === l.id ? 'bg-yellow-400 border-yellow-400 text-black shadow-[0_0_15px_rgba(253,224,71,0.4)]' : 'bg-black/50 border-white/5 text-zinc-400 hover:border-white/20 hover:text-white'}`}
                        >
                          <div className="text-left">
                            <span className="block text-sm font-black uppercase tracking-wider">{l.label}</span>
                            <span className="block text-[10px] uppercase font-bold opacity-70 mt-0.5">{l.desc}</span>
                          </div>
                          {formData.level === l.id && <CheckCircle2 size={24} />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-6 pb-4 flex justify-end shrink-0">
                  <button onClick={handleNext} disabled={!formData.goal || !formData.level} className="bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed text-black font-black uppercase tracking-widest text-sm px-8 py-4 rounded-xl flex items-center gap-2 shadow-[0_0_20px_rgba(253,224,71,0.3)] transition-all">
                    Avançar <ArrowRight size={18} strokeWidth={3} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: RESUMO & PROCESSAMENTO */}
            {step === 4 && (
              <motion.div key="step4" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" className="absolute inset-0 flex flex-col items-center justify-center">
                
                {isProcessing ? (
                  <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center text-center">
                    <div className="relative w-32 h-32 flex items-center justify-center mb-8">
                      <div className="absolute inset-0 border-4 border-yellow-400/20 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-t-yellow-400 rounded-full animate-spin shadow-[0_0_30px_rgba(253,224,71,0.5)]"></div>
                      <Zap size={40} className="text-yellow-400 animate-pulse" fill="currentColor" />
                    </div>
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white mb-2">Processando Bio-Dados</h2>
                    <p className="text-[10px] text-yellow-400 font-mono uppercase tracking-[0.2em] animate-pulse">Calibrando Motor ZYRON...</p>
                  </motion.div>
                ) : (
                  <div className="w-full flex flex-col h-full">
                    <div className="mb-6 mt-4">
                      <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">Pronto para o <span className="text-yellow-400">Impacto</span></h2>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-2">Dossiê do Operador Finalizado</p>
                    </div>

                    <div className="bg-zinc-900/50 backdrop-blur-2xl border border-white/5 p-6 rounded-3xl shadow-2xl space-y-6 flex-1">
                      <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                        <div className="w-16 h-16 bg-yellow-400 uppercase rounded-2xl flex items-center justify-center text-3xl font-black text-black">
                          {formData.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-xl font-black uppercase tracking-tight text-white mb-1">{formData.name}</h3>
                          <div className="flex items-center gap-2">
                             <ShieldCheck size={14} className="text-emerald-400" />
                             <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Identidade Verificada</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="block text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-1">IMC Inicial</span>
                          <span className="text-xl font-mono text-white font-bold">{calculateIMC()}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-1">Hidratação / Dia</span>
                          <span className="text-xl font-mono text-blue-400 font-bold">{calculateWater()} L</span>
                        </div>
                        <div>
                          <span className="block text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-1">Meta Principal</span>
                          <span className="text-sm font-black text-yellow-400 uppercase tracking-wider">{goals.find(g => g.id === formData.goal)?.label}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-1">Nível Operacional</span>
                          <span className="text-sm font-black text-white uppercase tracking-wider">{levels.find(l => l.id === formData.level)?.label}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 mb-4">
                      <button onClick={handleFinish} className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase tracking-[0.2em] py-5 rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(253,224,71,0.4)] transition-all">
                        Ingressar no Sistema <Zap size={20} fill="currentColor" />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

```

## src/components/PWASplashScreen.jsx
```jsx
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PWASplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [phase, setPhase] = useState('logo'); // 'logo' | 'slogan' | 'exit'

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('slogan'), 900);
    const t2 = setTimeout(() => setPhase('exit'), 2000);
    const t3 = setTimeout(() => setIsVisible(false), 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 bg-black z-[200] flex flex-col items-center justify-center"
        >
          {/* Glow de fundo */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-80 h-80 bg-yellow-400/10 rounded-full blur-[100px]" />
          </div>

          {/* Logo */}
          <motion.div
            initial={{ scale: 0.75, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
            className="relative z-10 mb-4"
          >
            <img
              src="/images/zyron-logo.png"
              alt="ZYRON"
              className="w-64 h-auto object-contain brightness-110 saturate-125"
              style={{ filter: 'drop-shadow(0 0 24px rgba(253,200,0,0.5))' }}
            />
          </motion.div>

          {/* Slogan */}
          <AnimatePresence>
            {phase !== 'logo' && (
              <motion.p
                key="slogan"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="text-white/80 text-sm font-light tracking-[0.3em] uppercase z-10"
              >
                A força da sua evolução.
              </motion.p>
            )}
          </AnimatePresence>

          {/* Barra de carregamento */}
          <motion.div
            className="absolute bottom-12 left-0 h-[2px] bg-gradient-to-r from-transparent via-yellow-400 to-transparent"
            initial={{ width: '0%', left: '50%' }}
            animate={{ width: '60%', left: '20%' }}
            transition={{ duration: 1.8, ease: 'easeInOut' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

```

## src/components/RBACGuard.jsx
```jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { ShieldAlert, Cpu } from 'lucide-react';

/**
 * RBACGuard - Middleware de Proteção de Rota Industrial
 * Responsável por validar o papel (role) do usuário e garantir redirecionamento seguro.
 */
export default function RBACGuard({ user, onRoleVerified, children }) {
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function verifyRole() {
      if (!user) return;
      
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError) {
          if (profileError.code === 'PGRST116') {
            console.warn('[RBACGuard] Perfil não encontrado. Criando perfil padrão...');
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({ id: user.id, email: user.email, role: 'USER' });
            
            if (insertError) throw insertError;
            onRoleVerified('USER');
          } else {
            throw profileError;
          }
        } else {
          console.log('[RBACGuard] Role fetched from Supabase:', profile?.role);
          onRoleVerified(profile?.role || 'USER');
        }
      } catch (err) {
        console.error('[RBACGuard] Erro na verificação:', err);
        setError(`Erro: ${err.message || 'Falha na validação de privilégios'}. Código: ${err.code || 'N/A'}`);
      } finally {
        setTimeout(() => setVerifying(false), 800);
      }
    }

    verifyRole();
  }, [user]);

  if (verifying) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-yellow-400/20 blur-3xl animate-pulse rounded-full" />
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="relative p-6 border-2 border-dashed border-yellow-400/30 rounded-full"
          >
            <Cpu className="text-yellow-400" size={48} />
          </motion.div>
        </div>
        
        <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter mb-2">
          INICIALIZANDO ZYRON...
        </h2>
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <motion.div 
              key={i}
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              className="w-2 h-2 bg-yellow-400 rounded-full"
            />
          ))}
        </div>
        
        <p className="mt-6 text-[10px] font-black text-neutral-500 uppercase tracking-[0.4em] max-w-xs">
          Verificando protocolos de segurança e nível de autorização
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="text-red-600 mb-4" size={64} />
        <h3 className="text-xl font-black text-white uppercase italic mb-2">Erro de Acesso Industrial</h3>
        <p className="text-neutral-500 text-xs uppercase tracking-widest font-bold mb-6 max-w-xs">
          {error}
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-yellow-500 text-black font-black uppercase tracking-widest text-xs hover:bg-yellow-400 transition-all rounded-xl shadow-[0_0_20px_rgba(234,179,8,0.2)]"
          >
            Tentar Novamente (Recarregar)
          </button>
          <button 
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.reload();
            }}
            className="px-8 py-3 bg-neutral-900 border border-white/5 text-neutral-500 font-black uppercase tracking-widest text-xs hover:text-white transition-all rounded-xl"
          >
            Sair e Re-autenticar
          </button>
        </div>
      </div>
    );
  }

  return children;
}

```

## src/components/tabs/TabCoach.jsx
```jsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Send, Bot, User, AlertTriangle, Trash2, ChevronDown, Dumbbell, Droplets, Trophy } from 'lucide-react';
import { sendMessageToGemini, buildSystemPrompt } from '../../lib/gemini';

const QUICK_PROMPTS = [
  { label: '🔥 Treino de Hoje', text: 'Me dê um resumo do meu treino de hoje e dicas para maximizar o resultado.' },
  { label: '⚡ Aumentar Carga', text: 'Quando e como devo aumentar minha carga para continuar progredindo?' },
  { label: '🎯 Metas Smart', text: 'Baseado no meu peso e objetivo, calcule minhas metas ideais de proteína diária, hidratação e calorias. Me dê números exatos.' },
  { label: '💧 Nutrição', text: 'Qual a minha meta de proteína e hidratação hoje baseada no meu peso?' },
  { label: '😴 Recuperação', text: 'Estou cansado. Devo treinar mesmo assim ou descansar? O que fazer?' },
  { label: '📈 Progresso', text: 'Analise meus PRs e me diga se estou progredindo bem.' },
];

const TypingIndicator = () => (
  <div className="flex items-end gap-3">
    <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(253,224,71,0.4)]">
      <Zap size={14} className="text-black fill-black" />
    </div>
    <div className="bg-neutral-900 border border-white/5 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-yellow-400 rounded-full"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  </div>
);

const Message = ({ msg }) => {
  const isUser = msg.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex items-end gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
        isUser
          ? 'bg-neutral-800 border border-white/10'
          : 'bg-yellow-400 shadow-[0_0_15px_rgba(253,224,71,0.3)]'
      }`}>
        {isUser
          ? <User size={14} className="text-neutral-400" />
          : <Zap size={14} className="text-black fill-black" />
        }
      </div>

      {/* Bubble */}
      <div className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm font-medium leading-relaxed whitespace-pre-wrap ${
        isUser
          ? 'bg-yellow-400 text-black rounded-br-sm font-bold'
          : 'bg-neutral-900 border border-white/5 text-neutral-100 rounded-bl-sm'
      }`}>
        {msg.text}
      </div>
    </motion.div>
  );
};

export default function TabCoach({ user, prHistory, workoutData }) {
  const [messages, setMessages] = useState([
    {
      role: 'model',
      text: `Olá, ${user?.name?.split(' ')[0] || 'Atleta'}! ⚡ Sou o **ZYRON Coach**, sua IA de alta performance.\n\nEstou com acesso ao seu perfil, treino de hoje e seus PRs. Me pergunte qualquer coisa — treino, nutrição, recuperação, estratégia. Vamos forjar sua evolução!`,
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const systemPrompt = buildSystemPrompt(user, prHistory, workoutData);

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Build Gemini history format (exclude the welcome message)
  const buildHistory = () => {
    return messages.slice(1).map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));
  };

  const handleSend = async (text) => {
    const messageText = text || input.trim();
    if (!messageText || loading) return;

    setInput('');
    setError(null);
    setShowQuickPrompts(false);

    const userMsg = { role: 'user', text: messageText };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = buildHistory();
      const response = await sendMessageToGemini(history, messageText, systemPrompt);
      setMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (err) {
      console.error('ZYRON Coach Error:', err);
      setError(err.message || 'Erro ao conectar com a IA. Verifique sua API Key.');
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([{
      role: 'model',
      text: `Conversa reiniciada! ⚡ Como posso ajudar, ${user?.name?.split(' ')[0] || 'Atleta'}?`,
    }]);
    setShowQuickPrompts(true);
    setError(null);
  };

  return (
    <motion.div
      key="coach"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col h-[calc(100vh-200px)] min-h-[500px]"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-1 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-yellow-400 rounded-2xl shadow-[0_0_20px_rgba(253,224,71,0.3)]">
            <Zap size={20} className="text-black fill-black" />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight italic">ZYRON Coach</h2>
            <p className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest">IA Personal Trainer</p>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="p-2 bg-neutral-900 border border-white/5 rounded-xl text-neutral-500 hover:text-red-400 hover:border-red-400/20 transition-all"
          title="Limpar conversa"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Context Pills */}
      <div className="flex gap-2 mb-4 shrink-0 overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900/60 border border-white/5 rounded-full text-[10px] font-black uppercase tracking-wider text-neutral-400 whitespace-nowrap shrink-0">
          <Dumbbell size={10} className="text-yellow-400" />
          {workoutData?.[new Date().getDay()]?.title || 'Descanso'}
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900/60 border border-white/5 rounded-full text-[10px] font-black uppercase tracking-wider text-neutral-400 whitespace-nowrap shrink-0">
          <Trophy size={10} className="text-yellow-400" />
          {Object.keys(prHistory || {}).length} PRs
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900/60 border border-white/5 rounded-full text-[10px] font-black uppercase tracking-wider text-neutral-400 whitespace-nowrap shrink-0">
          <User size={10} className="text-yellow-400" />
          {user?.weight || '?'}kg • {user?.goal || 'Hipertrofia'}
        </div>
      </div>

      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 p-3 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-2 shrink-0"
          >
            <AlertTriangle size={14} className="text-red-400 mt-0.5 shrink-0" />
            <p className="text-[11px] font-bold text-red-400">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-none">
        {messages.map((msg, i) => (
          <Message key={i} msg={msg} />
        ))}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Quick Prompts */}
      <AnimatePresence>
        {showQuickPrompts && messages.length <= 1 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-4 shrink-0"
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-600 mb-2 ml-1">
              Perguntas rápidas
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((qp) => (
                <button
                  key={qp.label}
                  onClick={() => handleSend(qp.text)}
                  className="px-3 py-2 bg-neutral-900/60 border border-white/5 rounded-xl text-[11px] font-bold text-neutral-300 hover:border-yellow-400/30 hover:text-yellow-400 transition-all active:scale-95"
                >
                  {qp.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="mt-4 shrink-0">
        <div className="flex items-end gap-3 bg-neutral-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-3 focus-within:border-yellow-400/30 transition-all">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte ao seu Coach de IA..."
            rows={1}
            className="flex-1 bg-transparent text-white text-sm font-medium placeholder:text-neutral-600 resize-none outline-none leading-relaxed max-h-32 overflow-y-auto"
            style={{ scrollbarWidth: 'none' }}
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="w-10 h-10 bg-yellow-400 hover:bg-yellow-300 disabled:bg-neutral-800 disabled:text-neutral-600 text-black rounded-xl flex items-center justify-center transition-all shrink-0 shadow-[0_0_15px_rgba(253,224,71,0.2)] disabled:shadow-none"
          >
            <Send size={16} />
          </motion.button>
        </div>
        <p className="text-center text-[9px] text-neutral-700 font-bold uppercase tracking-widest mt-2">
          Powered by Groq AI • ZYRON Coach
        </p>
      </div>
    </motion.div>
  );
}

```

## src/components/tabs/TabEvolucao.jsx
```jsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Award, Target, ChevronRight, History, ArrowBigUp, Camera, Plus, Zap, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import EvolutionTimeline from '../EvolutionTimeline';

// Componente para animar a contagem percentual
const AnimatedCounter = ({ to }) => {
  const [count, setCount] = React.useState(0);
  React.useEffect(() => {
    let start = 0;
    const end = parseInt(to);
    if (start === end) return;
    let totalMilSecDur = 1500;
    let incrementTime = (totalMilSecDur / end);
    let timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start === end) clearInterval(timer);
    }, incrementTime);
    return () => clearInterval(timer);
  }, [to]);
  return <>{count}</>;
};

export default function TabEvolucao({
  user,
  prHistory,
  weight,
  setWeight,
  workoutData
}) {
  const [isSavingWeight, setIsSavingWeight] = React.useState(false);
  
  // Auto-sync weight to Supabase when it changes (debounced)
  React.useEffect(() => {
    const saveWeight = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;
        
        setIsSavingWeight(true);
        const { error } = await supabase
          .from('body_measurements')
          .insert({
            user_id: session.user.id,
            weight: weight
          });
          
        if (error) console.error("Error saving weight:", error);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSavingWeight(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      // Avoid saving on initial load if we had a way to track it, but for now we debounce saving
      saveWeight();
    }, 2000); // Wait 2s after user stops dragging slider

    return () => clearTimeout(debounceTimer);
  }, [weight]);

  // Mock de dados para visualização imediata do Gráfico Neon (Sistematizado com Black Gold)
  const data = [
    { date: '01/02', carga: 60, trend: 58 },
    { date: '08/02', carga: 64, trend: 62 },
    { date: '15/02', carga: 64, trend: 66 },
    { date: '22/02', carga: 70, trend: 70 },
    { date: '01/03', carga: 75, trend: 74 },
  ];

  const totalPrs = Object.keys(prHistory || {}).length;

  return (
    <motion.div
      key="evolucao"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      {/* Header Premium */}
      <header className="flex justify-between items-end px-1">
        <div>
          <p className="text-yellow-400 text-xs font-black uppercase tracking-widest">Performance</p>
          <h2 className="text-3xl font-black italic text-white leading-none tracking-tighter">EVOLUÇÃO</h2>
        </div>
        <div className="bg-yellow-400/10 p-2 rounded-2xl border border-yellow-400/20 shadow-[0_0_15px_rgba(253,224,71,0.15)]">
          <TrendingUp className="text-yellow-400" size={24} />
        </div>
      </header>

      {/* Card de Gráfico Neon */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-[0px_10px_30px_rgba(0,0,0,0.8)]"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-white font-bold uppercase text-sm italic tracking-tight">Evolução de Cargas</h3>
          <span className="text-yellow-400 font-black text-xl italic tracking-tighter">15% ▲</span>
        </div>
        
        <div className="h-48 w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#52525b" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                dy={10}
              />
              <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
              <RechartsTooltip 
                contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '12px', color: '#fff' }}
                itemStyle={{ color: '#FDE047', fontWeight: 'bold' }}
              />
              <Line 
                type="monotone" 
                dataKey="carga" 
                name="Carga Real"
                stroke="#FDE047" 
                strokeWidth={4} 
                dot={{ r: 6, fill: '#FDE047', strokeWidth: 0 }}
                activeDot={{ r: 8, stroke: '#FDE047', strokeWidth: 4, fill: '#000' }}
                style={{ filter: 'drop-shadow(0px 0px 8px rgba(253, 224, 71, 0.5))' }}
              />
              <Line 
                type="monotone" 
                dataKey="trend" 
                name="Tendência Projetada"
                stroke="#737373" 
                strokeWidth={2} 
                strokeDasharray="5 5"
                dot={false}
                activeDot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Grid de Gamificação (Substitui Métricas Técnicas por Motivacionais) */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-neutral-900/50 border border-white/5 p-5 rounded-3xl shadow-xl flex flex-col justify-between group hover:border-yellow-500/30 transition-colors">
          <Zap className="text-yellow-500 mb-2 drop-shadow-[0_0_8px_rgba(253,224,71,0.5)]" size={24} />
          <div>
            <p className="text-neutral-500 text-[10px] font-black tracking-widest uppercase">Ganho de Força</p>
            <p className="text-white font-black text-4xl italic tracking-tighter flex items-start">
              <AnimatedCounter to="18" /><span className="text-lg text-yellow-500 ml-1 mt-1">%</span>
            </p>
          </div>
        </div>
        <div className="bg-neutral-900/50 border border-white/5 p-5 rounded-3xl shadow-xl flex flex-col justify-between group hover:border-emerald-500/30 transition-colors">
          <Calendar className="text-emerald-500 mb-2 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" size={24} />
          <div>
            <p className="text-neutral-500 text-[10px] font-black tracking-widest uppercase">Frequência Mês</p>
            <p className="text-white font-black text-4xl italic tracking-tighter">15<span className="text-lg text-neutral-500 ml-1">/20</span></p>
            <div className="w-full bg-black/50 h-1.5 rounded-full mt-2 overflow-hidden border border-white/5">
              <div className="bg-emerald-500 h-full rounded-full w-[75%] shadow-[0_0_10px_rgba(16,185,129,0.6)]"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Histórico de Recordes Humano */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2 pt-2">
          <h3 className="text-lg font-black uppercase italic tracking-tight text-white flex items-center gap-2">
            Minhas Superações <span className="text-yellow-500">🏆</span>
          </h3>
        </div>
        
        {Object.entries(prHistory).length === 0 ? (
          <div className="text-center py-10 bg-neutral-900/30 rounded-3xl border border-dashed border-neutral-800">
            <p className="font-black uppercase tracking-widest text-[10px] text-neutral-700">Aguardando superações</p>
          </div>
        ) : (
          Object.entries(prHistory).map(([id, weightVal]) => {
            const ex = Object.values(workoutData).flatMap(w => w.exercises || []).find(e => e.id === id);
            // Mock um peso anterior para mostrar a evolução
            const oldWeight = Math.max(0, Math.floor(weightVal * 0.85));
            const diff = weightVal - oldWeight;
            
            return (
              <div key={id} className="group flex flex-col p-4 bg-neutral-900/50 backdrop-blur-md rounded-2xl border border-white/5 shadow-xl transition-all cursor-default hover:border-yellow-500/30">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest block mb-0.5">{ex?.group || "Músculo"}</span>
                    <h4 className="text-sm font-black text-slate-200 uppercase">{ex?.name || id}</h4>
                  </div>
                  <div className="flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                    <span className="text-xs font-black text-emerald-400">+{diff}kg</span>
                  </div>
                </div>
                <div className="flex items-center justify-between bg-black/40 rounded-xl p-3 border border-white/5">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Antes</span>
                    <span className="text-lg font-black italic text-neutral-400">{oldWeight}<span className="text-[10px]">KG</span></span>
                  </div>
                  <ChevronRight className="text-neutral-700" size={16} />
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] font-black text-yellow-500/70 uppercase tracking-widest">Agora</span>
                    <span className="text-xl font-black italic text-white drop-shadow-[0_0_8px_rgba(253,224,71,0.3)]">{weightVal}<span className="text-[10px] text-yellow-500/50 ml-1">KG</span></span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Linha do Tempo de Evolução (Histórico Real do Supabase) */}
      <EvolutionTimeline user={user} />

      {/* Peso Corporal Control - Integrado para consistência */}
      <div className="bg-neutral-900/50 backdrop-blur-md border border-white/5 p-6 rounded-3xl shadow-xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-600/10 rounded-2xl border border-emerald-600/20">
              <ArrowBigUp className="text-emerald-500" size={24} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Peso Corporal</span>
              <h3 className="text-lg font-black uppercase tracking-tight italic text-slate-200">Atualizar Peso</h3>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="text-4xl font-black text-white italic tracking-tighter">{weight}<span className="text-sm ml-1 text-neutral-500">KG</span></div>
            {isSavingWeight && <span className="text-[8px] text-yellow-500 animate-pulse uppercase tracking-widest mt-1">Sincronizando...</span>}
          </div>
        </div>
        <input 
          type="range" 
          min="50" max="150" step="0.5"
          value={weight} 
          onChange={(e) => setWeight(parseFloat(e.target.value))}
          className="w-full h-2 bg-neutral-950/80 rounded-lg appearance-none cursor-pointer accent-yellow-500 border border-white/5"
        />
      </div>
      
    </motion.div>
  );
}

```

## src/components/tabs/TabPainel.jsx
```jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Zap, Droplets, Beef, Crown, CreditCard, Flame, CheckCircle2, BellRing, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const GlassCard = ({ children, className = '' }) => (
  <div className={`bg-neutral-900/50 backdrop-blur-md border border-white/5 p-6 rounded-3xl shadow-xl ${className}`}>
    {children}
  </div>
);

export default function TabPainel({
  user,
  today,
  currentWorkout,
  startSession,
  water,
  waterGoal,
  isHydrationAlert,
  handleWaterDrink,
  protein,
  proteinGoal,
  setProtein
}) {
  const [activeNotification, setActiveNotification] = useState(null);
  const [trainedDays, setTrainedDays] = useState([]);
  const remainingProtein = Math.max(0, proteinGoal - protein);

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
      fetchWeekStreak();
    }
  }, [user]);

  // Fetch real workout streak from this week
  const fetchWeekStreak = async () => {
    try {
      // Get start of current week (Sunday)
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('workout_logs')
        .select('created_at')
        .eq('user_id', user.id)
        .gte('created_at', startOfWeek.toISOString())
        .order('created_at', { ascending: true });
      
      if (error) {
        // Silently ignore schema/permission errors to prevent console pollution
        if (error.code !== '42P01' && error.code !== 'PGRST116') {
             // console.error("Ignored streak fetch error:", error.message);
        }
        return;
      }

      if (data && data.length > 0) {
        const days = [...new Set(data.map(log => new Date(log.created_at).getDay()))];
        setTrainedDays(days);
      }
    } catch (e) {
       // Silenced to avoid console spam if table doesn't exist
    }
  };

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle(); // Use maybeSingle to avoid 406 Not Acceptable on empty results
        
      if (error) {
        // Silently ignore schema/permission errors
        return;
      }
        
      if (data) {
        setActiveNotification(data);
      }
    } catch (e) {
      // Silenced to avoid console spam
    }
  };

  const markAsRead = async () => {
    if (!activeNotification) return;
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', activeNotification.id);
      setActiveNotification(null);
    } catch (e) {
      console.error(e);
      setActiveNotification(null);
    }
  };
  
  // Saudação dinâmica baseada na hora e frase motivacional:
  const hour = new Date().getHours();
  let greeting = 'BOA NOITE';
  if (hour >= 5 && hour < 12) greeting = 'BOM DIA';
  else if (hour >= 12 && hour < 18) greeting = 'BOA TARDE';

  const quotes = [
    "A DISCIPLINA FORJA O AÇO.",
    "BEM-VINDO À FÁBRICA DE MONSTROS.",
    "O DESCANSO TAMBÉM É TREINO.",
    "HOJE É DIA DE ESMAGAR.",
    "SÓ OS FORTES SOBREVIVEM.",
    "CADA GOTA DE SUOR CONTA."
  ];
  // Usa o dia do mês para parear a frase de forma determinística
  const quote = quotes[new Date().getDate() % quotes.length];

  // Imagem de fundo dinâmica (usando Unsplash estilizado)
  // Caso o treino contenha "Peito", "Costas", etc, poderíamos variar a URL.
  // Por enquanto uma imagem bem pesada e industrial:
  const bgImage = "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop";

  return (
    <motion.div
      key="painel"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      {/* HEADER E DATA */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight italic">Painel de Controle</h2>
          <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <div className="p-3 bg-yellow-500/10 rounded-2xl border border-yellow-500/20">
          <span className="text-2xl">📊</span>
        </div>
      </div>

      {/* STREAK MOMENTUM - Dados Reais do Supabase */}
      <GlassCard className="mb-6 border-yellow-500/20 bg-neutral-900/40">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest block mb-1">Momentum</span>
            <h3 className="text-lg font-black uppercase italic tracking-tight text-white flex items-center gap-2">
              Sequência de Treinos <span className="text-orange-500">🔥</span>
            </h3>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-yellow-400 italic">{trainedDays.length}</span>
            <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest block">esta semana</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, idx) => {
            const isActive = trainedDays.includes(idx);
            const isToday = idx === today;
            return (
              <div key={idx} className="flex flex-col items-center gap-1.5">
                <span className={`text-[9px] font-black uppercase ${isToday ? 'text-yellow-400' : 'text-neutral-500'}`}>{day}</span>
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${
                  isActive 
                    ? 'bg-yellow-400 border-yellow-400 text-neutral-950 shadow-[0_0_10px_rgba(253,224,71,0.3)]' 
                    : isToday 
                      ? 'bg-neutral-900 border-yellow-400/30 text-yellow-400/50'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-700'
                }`}>
                  {isActive ? <span className="font-bold text-xs">✓</span> : <div className="w-1.5 h-1.5 rounded-full bg-neutral-800"></div>}
                </div>
              </div>
            )
          })}
        </div>
      </GlassCard>

      {/* WELCOME DASHBOARD EXPERIENCIE (HERO CARD) */}
      <div 
        className="bg-neutral-900/80 backdrop-blur-xl border border-yellow-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden group min-h-[280px] flex flex-col justify-end"
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundBlendMode: 'overlay'
        }}
      >
        {/* Overlay Dark Gradient Misto para garantir leitura */}
        <div className="absolute inset-0 bg-linear-to-t from-neutral-950 via-neutral-950/80 to-neutral-950/40 pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/20 rounded-full blur-[100px] pointer-events-none mix-blend-screen"></div>
        
        <div className="relative z-10 flex flex-col gap-5">
          <div className="space-y-1">
            <span className="inline-block px-3 py-1 bg-yellow-400/20 text-yellow-400 text-[10px] font-black uppercase tracking-widest border border-yellow-400/30 rounded-full backdrop-blur-sm mb-2">
              {greeting}, {user?.name?.split(' ')[0] || 'PRO'}
            </span>
            <h2 className="text-3xl font-black uppercase tracking-tighter italic text-white leading-[1.1]">
              {quote}
            </h2>
            <p className="text-sm font-bold text-neutral-400 mt-2 tracking-wide uppercase">
              FOCO DO DIA: <span className="text-yellow-400 ml-1">{currentWorkout?.title || 'DESCANSO'}</span>
            </p>
          </div>
          
          <button 
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(50);
              startSession(today);
            }}
            className="group relative w-full bg-yellow-400 text-black font-black uppercase tracking-[0.2em] py-4 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(253,224,71,0.2)] hover:shadow-[0_0_40px_rgba(253,224,71,0.4)] transition-all active:scale-95 overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">Iniciar Sessão ⚡</span>
            {/* Shimmer Effect */}
            <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/40 to-transparent group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none"></div>
          </button>
        </div>
      </div>

      {/* WIDGETS DE SAÚDE E METAS */}
      <h3 className="text-lg font-black uppercase italic tracking-tight text-white mb-2 ml-1">Metas Diárias</h3>
      <div className="grid grid-cols-2 gap-6">
        {/* Water Widget */}
        <div className="space-y-4 bg-neutral-900/40 p-4 rounded-3xl border border-white/5 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-blue-500/10 transition-colors"></div>
          <div className="flex items-center gap-2 relative z-10">
            <span className="text-blue-400 text-lg">💧</span>
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Hidratação</span>
          </div>
          <div className={`relative h-32 w-full bg-neutral-950/80 rounded-2xl border ${isHydrationAlert && water < waterGoal ? 'border-yellow-400 shadow-[0_0_15px_rgba(253,224,71,0.3)] animate-pulse' : 'border-white/5'} overflow-hidden flex items-center justify-center transition-all z-10`}>
            <svg className="w-24 h-24 transform -rotate-90">
              <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-neutral-900" />
              <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray="251.2" strokeDashoffset={251.2 - (Math.min(100, (water / waterGoal) * 100) / 100) * 251.2} className="text-blue-500 transition-all duration-1000" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 12px rgba(59,130,246,0.6))' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black italic text-white">{water.toFixed(1)}<span className="text-xs text-blue-500">L</span></span>
              <span className="text-[8px] font-bold text-neutral-500 uppercase mt-1">META {waterGoal.toFixed(1)}L</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 relative z-10">
            {[0.25, 0.5].map(val => (
              <button 
                key={val}
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(50);
                  handleWaterDrink(Number(val));
                }}
                className="py-2 bg-neutral-900/80 backdrop-blur-md border border-white/5 rounded-xl text-[10px] font-black hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] active:scale-95 text-neutral-400"
              >
                +{val >= 1 ? val : val.toString().substring(1)}L
              </button>
            ))}
          </div>
        </div>

        {/* Protein Widget */}
        <div className="space-y-4 bg-neutral-900/40 p-4 rounded-3xl border border-white/5 shadow-lg flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-red-500/10 transition-colors"></div>
          <div className="flex items-center gap-2 relative z-10">
            <span className="text-red-400 text-lg">🥩</span>
            <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Proteína</span>
          </div>
          <div className="relative h-32 w-full bg-neutral-950/80 rounded-2xl border border-white/5 overflow-hidden flex items-center justify-center z-10">
            {remainingProtein === 0 && (
              <div className="absolute top-2 right-2 bg-emerald-500/20 text-emerald-400 text-[8px] font-black px-2 py-1 rounded-full border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.3)] z-20">
                BATEU
              </div>
            )}
            
            <svg className="w-24 h-24 transform -rotate-90">
              <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-neutral-900" />
              <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray="251.2" strokeDashoffset={251.2 - (Math.min(100, (protein / proteinGoal) * 100) / 100) * 251.2} className="text-red-500 transition-all duration-1000" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 12px rgba(248,113,113,0.6))' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black italic text-white">{protein}<span className="text-xs text-red-500">g</span></span>
              <span className="text-[8px] font-bold text-neutral-500 uppercase mt-1">META {proteinGoal}g</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-auto relative z-10">
            {[30, 50].map(val => (
              <button 
                key={val}
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(50);
                  setProtein(prev => prev + Number(val));
                }}
                className="py-2 bg-neutral-900/80 backdrop-blur-md border border-white/5 rounded-xl text-[10px] font-black hover:bg-red-500 hover:text-white hover:border-red-500 transition-all hover:shadow-[0_0_15px_rgba(248,113,113,0.4)] active:scale-95 text-neutral-400"
              >
                +{val}g
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* NOTIFICATION MODAL */}
      <AnimatePresence>
        {activeNotification && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed inset-x-4 bottom-24 z-50 max-w-xl mx-auto"
          >
            <div className="bg-neutral-900 border border-indigo-500/30 rounded-3xl p-6 shadow-[0_20px_50px_rgba(99,102,241,0.2)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[40px] pointer-events-none"></div>
              
              <div className="flex justify-between items-start relative z-10 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/30 font-bold text-xl">
                    🔔
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Mensagem da Administração</h4>
                    <h3 className="text-lg font-black italic uppercase text-white leading-tight">{activeNotification.title}</h3>
                  </div>
                </div>
                <button 
                  onClick={markAsRead}
                  className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-full text-neutral-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="relative z-10 bg-black/40 rounded-xl p-4 border border-white/5 mb-4">
                <p className="text-sm font-medium text-neutral-300 whitespace-pre-wrap leading-relaxed">
                  {activeNotification.message}
                </p>
              </div>

              <button 
                onClick={markAsRead}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-colors border border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.3)]"
              >
                Entendido
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

```

## src/components/tabs/TabPerfil.jsx
```jsx
import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Crown, FileText, Download, Flame, CheckCircle2, Trophy, TimerIcon, Play, LogOut, QrCode, ArrowBigUp, Camera, User, Music, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useMusic } from '../../contexts/MusicContext';

// Generic GlassCard component
const GlassCard = ({ children }) => (
  <div className="bg-neutral-900/50 backdrop-blur-md border border-white/5 p-6 rounded-3xl shadow-xl">
    {children}
  </div>
);

export default function TabPerfil({
  user,
  today,
  voiceTimerActive,
  toggleVoiceTimer,
  formatPlankTime,
  plankTime,
  onLogout
}) {
  const [perfilTab, setPerfilTab] = useState('geral');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  // Music State
  const { searchMusic, setPlaylist, loadVideoById } = useMusic();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([
    // Default HQ Playlists
    { id: 'dQw4w9WgXcQ', title: 'ZYRON Hardcore Mix Vol 1', thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/default.jpg' },
    { id: 'jfKfPfyJRdk', title: 'Lofi Hip Hop Radio - Relax', thumbnail: 'https://img.youtube.com/vi/jfKfPfyJRdk/default.jpg' },
  ]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResults([]); // Limpar cache anterior para evitar crashes e stale UI
    try {
      const results = await searchMusic(searchQuery);
      setSearchResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const playSelectedTrack = (track, index) => {
    setPlaylist(searchResults);
    loadVideoById(track);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${ext}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl + '?t=' + Date.now();
      
      // Update profile
      await supabase.from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      setAvatarUrl(publicUrl);
    } catch (err) {
      console.error('Erro no upload:', err);
      alert('Erro ao enviar foto. Verifique se o bucket "avatars" existe no Supabase Storage.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div
      key="perfil"
      initial={{ opacity: 0, rotateX: 45 }}
      animate={{ opacity: 1, rotateX: 0 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.4 } }}
      className="space-y-8 pb-10"
    >
      {/* PROFILE HEADER WITH AVATAR */}
      <div className="flex items-center gap-5 mb-2">
        <div className="relative group">
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-20 h-20 rounded-2xl bg-neutral-800 border-2 border-yellow-500 overflow-hidden relative flex items-center justify-center group-hover:border-yellow-300 transition-all shadow-[0_0_20px_rgba(253,224,71,0.15)]"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-black text-yellow-400 italic">
                {user?.name?.charAt(0) || '?'}
              </span>
            )}
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {uploading ? (
                <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera size={20} className="text-yellow-400" />
              )}
            </div>
          </button>
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-black uppercase tracking-tighter italic leading-none text-white">
            {user?.name || 'ATLETA'}
          </h2>
          <p className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.3em] mt-1">ZYRON PRO</p>
          <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mt-1">{user?.email || ''}</p>
        </div>
        <div className="p-3 bg-yellow-500/10 rounded-2xl border border-yellow-500/20">
          <Crown className="text-yellow-400" size={28} />
        </div>
      </div>

      {/* Perfil Sub-Navigation */}
      <div className="flex gap-2 p-1 bg-neutral-900/50 rounded-2xl border border-white/5 mb-6">
        {['geral', 'docs', 'financeiro', 'music'].map(tab => (
          <button 
            key={tab}
            onClick={() => setPerfilTab(tab)}
            className={`flex-1 py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              perfilTab === tab 
                ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/20' 
                : 'text-neutral-500 hover:text-white'
            }`}
          >
            {tab === 'geral' ? 'Geral' : tab === 'docs' ? 'Docs' : tab === 'financeiro' ? 'PIX' : 'Música'}
          </button>
        ))}
      </div>

      {/* TAB MENSALIDADE / FINANCEIRO */}
      {perfilTab === 'music' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <GlassCard>
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-yellow-400/10 rounded-2xl border border-yellow-400/20">
                <Music className="text-yellow-400" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black uppercase italic tracking-tight">ZYRON Radio</h3>
                <p className="text-[10px] uppercase font-bold text-neutral-500 tracking-widest">Global PWA Player</p>
              </div>
            </div>

            <form onSubmit={handleSearch} className="relative mb-6">
              <input 
                type="text" 
                placeholder="Buscar música no YouTube..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-neutral-950 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/30 transition-all font-bold placeholder:text-neutral-600"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-widest bg-yellow-400 text-black px-3 py-1.5 rounded-lg hover:bg-yellow-300 transition-colors">
                Buscar
              </button>
            </form>

            <div className="space-y-3">
              {isSearching ? (
                <div className="animate-pulse flex flex-col gap-3">
                   {[1,2,3].map(i => <div key={i} className="h-16 bg-white/5 rounded-xl w-full" />)}
                </div>
              ) : (
                searchResults.map((track, idx) => (
                  <div 
                    key={track.id} 
                    onClick={() => playSelectedTrack(track, idx)}
                    className="flex items-center gap-4 p-3 rounded-xl bg-neutral-900 border border-white/5 hover:border-yellow-400/30 cursor-pointer transition-all group"
                  >
                    <div className="w-12 h-12 rounded-lg bg-neutral-800 overflow-hidden relative">
                      {track.thumbnail && <img src={track.thumbnail} alt={track.title} className="w-full h-full object-cover" />}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <Play size={16} className="text-yellow-400 fill-current" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-black text-white truncate">{track.title}</h4>
                      <p className="text-[9px] text-neutral-500 uppercase tracking-widest font-bold">YouTube Audio</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </div>
      )}

      {/* TAB MENSALIDADE / FINANCEIRO */}
      {perfilTab === 'financeiro' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <GlassCard>
            <div className="flex items-center gap-4 mb-6">
              <QrCode className="text-yellow-400" size={24} />
              <div>
                <h3 className="text-lg font-black uppercase italic tracking-tight">Pagamento Fácil</h3>
                <p className="text-[10px] uppercase font-bold text-neutral-500 tracking-widest">Renovação via PIX</p>
              </div>
            </div>
            <button className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-black uppercase tracking-[0.2em] py-4 rounded-xl flex items-center justify-center gap-2 transition-all border border-white/5 hover:border-white/20 active:scale-95">
              Gerar Código PIX <ArrowBigUp size={18} className="rotate-45" />
            </button>
            <button className="w-full mt-3 bg-transparent text-neutral-500 hover:text-white font-bold uppercase text-[10px] tracking-widest py-3 rounded-xl transition-all">
              Gerenciar Cartões de Crédito
            </button>
          </GlassCard>
        </div>
      )}

      {/* TAB DOCUMENTOS */}
      {perfilTab === 'docs' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <GlassCard>
            <h3 className="text-lg font-black uppercase italic tracking-tight mb-6">Central de Arquivos</h3>
            <div className="space-y-4">
              {/* PDF 1 */}
              <div className="flex items-center justify-between p-4 bg-neutral-900/80 border border-white/5 rounded-2xl hover:border-yellow-400/30 transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-red-500/10 rounded-xl text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all">
                     <FileText size={20} />
                   </div>
                   <div>
                     <p className="text-sm font-black uppercase tracking-wider text-white">Plano Alimentar</p>
                     <p className="text-[10px] font-bold text-neutral-500 uppercase">Atualizado em 12/04/2026</p>
                   </div>
                </div>
                <Download size={18} className="text-neutral-500 group-hover:text-yellow-400 transition-colors" />
              </div>

              {/* PDF 2 */}
              <div className="flex items-center justify-between p-4 bg-neutral-900/80 border border-white/5 rounded-2xl hover:border-yellow-400/30 transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all">
                     <FileText size={20} />
                   </div>
                   <div>
                     <p className="text-sm font-black uppercase tracking-wider text-white">Exames e Bioimpedância</p>
                     <p className="text-[10px] font-bold text-neutral-500 uppercase">Atualizado em 05/03/2026</p>
                   </div>
                </div>
                <Download size={18} className="text-neutral-500 group-hover:text-yellow-400 transition-colors" />
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* TAB GERAL E LOGOUT */}
      {perfilTab === 'geral' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Gamification / Streaks */}
          <GlassCard>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-black uppercase italic tracking-tight">Consistência</h3>
                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Treinos na Semana</p>
              </div>
              <Flame className="text-orange-500" size={24} />
            </div>
            
            <div className="flex justify-between items-center mb-6">
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, idx) => {
                const isActive = idx === 1 || idx === 3 || idx === today;
                return (
                  <div key={idx} className="flex flex-col items-center gap-2">
                    <span className="text-[9px] text-neutral-600 font-black uppercase">{day}</span>
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${
                      isActive 
                        ? 'bg-yellow-400 border-yellow-400 text-neutral-950 shadow-[0_0_15px_rgba(253,224,71,0.3)]' 
                        : 'bg-neutral-900 border-neutral-800 text-neutral-700'
                    }`}>
                      {isActive ? <CheckCircle2 size={16} strokeWidth={3} /> : <div className="w-1.5 h-1.5 rounded-full bg-neutral-800"></div>}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="bg-neutral-950 p-4 rounded-xl border border-white/5 flex items-center gap-4">
               <div className="h-12 w-12 rounded-full bg-linear-to-tr from-yellow-600 to-yellow-300 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(253,224,71,0.2)]">
                 <Trophy className="text-neutral-950" size={20} fill="currentColor" />
               </div>
               <div>
                 <h4 className="text-sm font-black text-white uppercase italic tracking-tight">Badge Gold Ativa</h4>
                 <p className="text-[10px] text-neutral-400 font-medium leading-tight">Você treinou 4 vezes na semana passada.</p>
               </div>
            </div>
          </GlassCard>

          {/* Abs & Core Legacy */}
          <GlassCard>
            <div className="flex items-center justify-between mb-8">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] mb-1">Prancha Isométrica</span>
                <h3 className="text-lg font-black uppercase italic tracking-tight">ZYRON Voz Ativa</h3>
              </div>
              <div className="p-3 bg-neutral-950 rounded-2xl border border-white/5">
                <TimerIcon className={`text-indigo-500 ${voiceTimerActive ? 'animate-pulse' : ''}`} size={24} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-5xl font-black text-white italic tracking-tighter font-mono">
                {formatPlankTime(plankTime)}
              </div>
              <button 
                onClick={toggleVoiceTimer}
                className={`h-20 w-20 rounded-full flex items-center justify-center text-white shadow-2xl transition-all active:scale-90 group ${
                  voiceTimerActive ? 'bg-red-600 shadow-red-500/30' : 'bg-indigo-600 shadow-indigo-500/30'
                }`}
              >
                {voiceTimerActive ? (
                  <div className="h-6 w-6 bg-white rounded-sm"></div>
                ) : (
                  <Play size={28} fill="currentColor" className="group-hover:translate-x-1 transition-transform" />
                )}
              </button>
            </div>
          </GlassCard>

          {/* Botão de Logout Centralizado */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onLogout}
            className="w-full py-5 rounded-3xl bg-neutral-900 border border-red-500/30 text-red-500 font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-red-500 hover:text-white transition-all shadow-[0_10px_30px_rgba(239,68,68,0.1)] active:scale-95"
          >
            <LogOut size={20} />
            Encerrar Sessão Segura
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}

```

## src/components/tabs/TabTreino.jsx
```jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, ShieldAlert, Zap, Play, PlayCircle, Coffee, Flame } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-coverflow';

// Assuming these are passed or imported from their respective paths.
// If Anatomy3D, WorkoutCard, or EXERCISE_VIDEOS are in parent folder, we import like this:
import Anatomy3D from '../Anatomy3D';
import WorkoutCard from '../WorkoutCard';
import { EXERCISE_VIDEOS } from '../FichaDeTreinoScreen';

export default function TabTreino({
  today,
  workoutData,
  startSession,
  setVideoModal,
  isTraining,
  setIsTraining,
  currentWorkout,
  completedExercises,
  restTimer,
  handleExerciseComplete,
  loads,
  updateLoad,
  prHistory,
  showPR
}) {
  const [cardioRunning, setCardioRunning] = useState(false);
  const [cardioTime, setCardioTime] = useState(0);
  const cardioTimerRef = useRef(null);

  // Cardio Timer Logic
  useEffect(() => {
    if (cardioRunning) {
      cardioTimerRef.current = setInterval(() => {
        setCardioTime(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(cardioTimerRef.current);
    }
    return () => clearInterval(cardioTimerRef.current);
  }, [cardioRunning]);

  const formatCardioTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence mode="wait">
      
      {/* 1. STATE: NOT TRAINING (SHOW CAROUSEL) */}
      {!isTraining && (
        <motion.div
          key="routine-list"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="space-y-6"
        >
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-500/10 rounded-2xl border border-yellow-500/20">
                <span className="text-xl">💪</span>
              </div>
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight italic">Selecionar Rotina</h3>
                <p className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest">ZYRON Session Prep</p>
              </div>
            </div>
          </div>

          <div className="relative -mx-6">
            <Swiper
              effect={'coverflow'}
              grabCursor={true}
              centeredSlides={true}
              slidesPerView={'auto'}
              coverflowEffect={{
                rotate: 30,
                stretch: 0,
                depth: 100,
                modifier: 1,
                slideShadows: true,
              }}
              modules={[EffectCoverflow]}
              className="w-full py-10"
            >
              {Object.entries(workoutData)
                .filter(([key]) => key !== '0' && key !== '6' && workoutData[key].exercises.length > 0)
                .map(([key, workout]) => (
                  <SwiperSlide key={key} className="w-[280px] sm:w-[320px]">
                    <motion.div 
                      whileTap={{ scale: 0.95 }}
                      className={`relative h-[400px] rounded-3xl overflow-hidden border transition-all duration-500 ${
                        today === parseInt(key) 
                          ? 'border-yellow-400 animate-neon-pulse' 
                          : 'border-neutral-800'
                      }`}
                    >
                      <img 
                        src={workout.image || "/images/chest.png"} 
                        className="absolute inset-0 w-full h-full object-cover opacity-60 grayscale-[0.5] hover:grayscale-0 transition-all duration-700" 
                        alt={workout.title}
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/40 to-transparent" />

                      {today === parseInt(key) && (
                        <div className="absolute top-4 right-4 bg-yellow-500 text-white text-[8px] font-black uppercase px-3 py-1 rounded-full tracking-widest animate-pulse z-10">
                          Sugestão do Dia
                        </div>
                      )}

                      <div className="absolute bottom-0 p-6 w-full z-10">
                        <span className="text-yellow-400 text-[9px] font-black uppercase tracking-[0.2em]">
                          {workout.focus}
                        </span>
                        <h3 className="text-white text-2xl font-black italic leading-none mt-1 uppercase group-hover:text-yellow-300 transition-colors">
                          {workout.title}
                        </h3>
                        
                        <button 
                          onClick={(e) => {
                            if(e && e.stopPropagation) e.stopPropagation();
                            startSession(parseInt(key));
                          }}
                          className="mt-6 w-full py-4 bg-yellow-500 border border-yellow-400 text-white font-black rounded-2xl hover:bg-yellow-400 transition-all uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 group/btn"
                        >
                          <span className="text-white">{today === parseInt(key) ? '⚡' : '▶️'}</span>
                          Selecionar
                        </button>

                        <button
                          onClick={(e) => {
                            if(e && e.stopPropagation) e.stopPropagation();
                            const firstEx = workout.exercises[0];
                            if (firstEx) {
                              setVideoModal({ 
                                name: `Técnica: ${firstEx.name}`, 
                                query: EXERCISE_VIDEOS[firstEx.id] || firstEx.name + ' técnica exercício' 
                              });
                            }
                          }}
                          className="mt-2 w-full py-2 bg-neutral-900/50 text-neutral-400 hover:text-white font-black rounded-xl border border-white/5 hover:border-yellow-400/30 transition-all uppercase text-[8px] tracking-[0.2em] flex items-center justify-center gap-2"
                        >
                          <span className="text-xs">🎥</span>
                          Pré-visualizar Técnica
                        </button>
                      </div>
                    </motion.div>
                  </SwiperSlide>
                ))}
            </Swiper>
          </div>

          {today === 0 || today === 6 ? (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3">
              <span className="text-amber-500 text-lg">⚠️</span>
              <p className="text-[10px] font-black text-amber-500 uppercase italic">Hoje é dia de descanso. Mantenha a guarda.</p>
            </div>
          ) : (
            <div className="px-1">
              <button 
                onClick={() => startSession(today)}
                className="w-full relative overflow-hidden bg-neutral-900 border border-white/5 hover:bg-neutral-800 p-5 rounded-2xl font-black uppercase tracking-[0.2em] italic flex items-center justify-center gap-3 transition-all group"
              >
                <span className="text-yellow-400 text-xl group-hover:scale-110 transition-transform">⚡</span> 
                RESUMO DO TREINO ATUAL
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* 2. STATE: ACTIVE TRAINING SESSION */}
      {isTraining && (
        <motion.div
          key="active-session"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="space-y-6"
        >
          <div className="flex justify-between items-end mb-4 px-2">
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none">Sessão Ativa</h2>
              <div className="flex flex-col gap-1 mt-2">
                {restTimer === 0 && <p className="text-[10px] font-black text-emerald-500 uppercase">Pronto para o próximo set</p>}
              </div>
            </div>
            <div className="p-3 bg-neutral-900 rounded-2xl border border-white/5">
              <span className="text-neutral-500 text-xl">☕</span>
            </div>
          </div>

          {currentWorkout?.preCardio && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-4 bg-yellow-400 text-black rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 shadow-lg shadow-yellow-400/20 mb-4"
            >
              <Zap size={16} fill="black" /> 
              <span>PRE-TREINO: {currentWorkout.preCardio}</span>
            </motion.div>
          )}

          {currentWorkout?.exercises?.length > 0 && (
            <Anatomy3D activeGroup={currentWorkout.exercises.find(e => !completedExercises.includes(e.id))?.group} />
          )}

          {!currentWorkout?.exercises?.length ? (
            <div className="text-center p-16 bg-neutral-900/40 backdrop-blur-md rounded-3xl border border-dashed border-neutral-700">
              <span className="block text-4xl mb-6 opacity-30">⚠️</span>
              <p className="text-neutral-500 font-black uppercase tracking-widest text-lg">OFF DAY - Descanso Ativo</p>
            </div>
          ) : (
            currentWorkout.exercises.map((ex) => (
              <WorkoutCard
                key={ex.id}
                ex={ex}
                completed={completedExercises.includes(ex.id)}
                onComplete={handleExerciseComplete}
                load={loads[ex.id]}
                onUpdateLoad={updateLoad}
                prHistoryLoad={prHistory[ex.id]}
                showPR={showPR}
                videoQuery={EXERCISE_VIDEOS[ex.id] || 'vcBig73oqpE'}
              />
            ))
          )}

          {currentWorkout?.cardio && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className={`mt-8 p-6 rounded-3xl flex flex-col items-center gap-4 text-center transition-all duration-300 border ${
                cardioRunning ? 'bg-yellow-400 text-neutral-950 shadow-[0_0_30px_rgba(253,224,71,0.4)] border-yellow-400' : 'bg-neutral-900/80 border-yellow-500/30'
              }`}
            >
              <div className={`p-3 rounded-full ${cardioRunning ? 'bg-neutral-950/20' : 'bg-yellow-500/10'}`}>
                <Flame size={24} className={cardioRunning ? 'text-neutral-950 animate-pulse' : 'text-yellow-400'} />
              </div>
              
              <div className="w-full">
                <h4 className={`font-black uppercase tracking-tight italic ${cardioRunning ? 'text-neutral-950' : 'text-white'}`}>Finalização: Cardio</h4>
                <p className={`text-[12px] font-black uppercase tracking-widest mt-1 ${cardioRunning ? 'text-neutral-800' : 'text-yellow-400'}`}>{currentWorkout.cardio}</p>
              </div>

              <motion.button 
                layout
                onClick={(e) => {
                  e.stopPropagation();
                  setCardioRunning(!cardioRunning);
                }}
                className={`mt-2 w-full h-16 rounded-xl flex items-center justify-between px-6 transition-all duration-300 ${
                  cardioRunning 
                    ? 'bg-neutral-950 text-yellow-400 shadow-[0_0_20px_rgba(0,0,0,0.6)]' 
                    : 'bg-yellow-400 text-neutral-950 border-2 border-yellow-400 shadow-[0_0_15px_rgba(253,224,71,0.2)]'
                }`}
              >
                <div className="flex flex-col items-start leading-none">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-80">
                    {cardioRunning ? 'Em Execução' : 'Pronto para Queimar?'}
                  </span>
                  <span className="text-xl font-black italic uppercase tracking-tighter shrink-0">
                    {cardioRunning ? '■ FINALIZAR' : '> INICIAR CARDIO'}
                  </span>
                </div>
                
                {cardioRunning && (
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-red-600 rounded-full animate-ping" />
                    <span className="text-2xl font-black font-mono tracking-tighter">
                      {formatCardioTime(cardioTime)}
                    </span>
                  </div>
                )}
              </motion.button>
            </motion.div>
          )}

          <button 
            onClick={() => setIsTraining(false)}
            className="w-full bg-neutral-900/50 hover:bg-red-600 border border-white/5 hover:border-red-500 p-6 rounded-3xl font-black uppercase tracking-[0.3em] italic text-neutral-400 hover:text-white transition-all flex items-center justify-center gap-4 mt-8"
          >
            <span className="text-xl">🛑</span> FINALIZAR SESSÃO
          </button>
        </motion.div>
      )}

    </AnimatePresence>
  );
}

```

## src/components/WorkoutCard.jsx
```jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayCircle, CheckCircle2, Trophy, Zap, Plus, Minus, History, Play, Square, X, ChevronDown, ChevronUp } from 'lucide-react';

export default function WorkoutCard({
  ex,
  completed,
  onComplete,
  load,
  onUpdateLoad,
  prHistoryLoad,
  showPR,
  videoQuery
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [activeSet, setActiveSet] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [setTimer, setSetTimer] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const cardRef = useRef(null);
  const timerRef = useRef(null);

  // Timer logic for active set
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSetTimer(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning]);

  const formatSetTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const playMetalSound = () => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'); // Metal hit/clank
    audio.volume = 0.5;
    audio.play().catch(e => console.log("Audio play blocked"));
  };

  const handleToggleSet = (e) => {
    e.stopPropagation();
    if (navigator.vibrate) navigator.vibrate(50); // Haptic feedback on interact
    if (!isRunning) {
      setIsRunning(true);
      setSetTimer(0);
    } else {
      setIsRunning(false);
      playMetalSound();
      
      // Feature request: "Ao clicar em finalizar, dispare automaticamente o temporizador de descanso no topo e REGISTRE A CARGA"
      onUpdateLoad(ex.id, load || '0');

      const setData = {
        set_number: activeSet,
        weight_kg: load || '0',
        reps: ex.reps ? parseInt(ex.reps.split('-')[0]) : 0,
        rpe: null // Could be added to UI in the future
      };

      if (activeSet < parseInt(ex.sets)) {
        setActiveSet(prev => prev + 1);
        onComplete(ex.id, false, setData); // Partial complete/timer trigger + data
      } else {
        onComplete(ex.id, true, setData); // Final complete + data
        setIsExpanded(false);
      }
    }
  };

  // Smart Play (Intersection Observer) - Feature 1
  useEffect(() => {
    if (!isExpanded) {
      setVideoPlaying(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVideoPlaying(true);
        } else {
          setVideoPlaying(false);
        }
      },
      { threshold: 0.5 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) observer.unobserve(cardRef.current);
    };
  }, [isExpanded]);

  // Haptic Picker Handlers - Feature 2
  const handleLoadChange = (delta) => {
    const currentLoad = parseFloat(load) || 0;
    const newLoad = Math.max(0, currentLoad + delta);
    onUpdateLoad(ex.id, newLoad.toString());
  };

  const isNewPR = parseFloat(load) > (prHistoryLoad || 0);

  return (
    <motion.div 
      layout
      ref={cardRef}
      className={`relative bg-neutral-950 backdrop-blur-md border transition-all duration-500 rounded-4xl p-6 overflow-hidden ${
        completed 
          ? 'border-emerald-500/50 opacity-70 shadow-[0_0_30px_rgba(16,185,129,0.1)]' 
          : isExpanded 
            ? 'border-yellow-400 animate-neon-pulse z-10' 
            : 'border-white/5 hover:border-yellow-400/30 shadow-2xl shadow-black/40'
      }`}
      onClick={() => {
        if (!completed && !isExpanded) {
          setIsExpanded(true);
        }
      }}
    >
      {/* PR Celebration Overlay */}
      <AnimatePresence>
        {showPR === ex.id && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ 
              opacity: [0, 1, 1, 0], 
              scale: [0.9, 1.05, 1.05, 1],
              borderColor: ['#10b981', '#34d399', '#10b981']
            }}
            transition={{ duration: 2.5, times: [0, 0.2, 0.8, 1] }}
            className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center bg-emerald-500/10 rounded-4xl z-20 border-2 border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.2)]"
          >
            <motion.div
              animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="text-5xl mb-2"
            >
              🏆
            </motion.div>
            <span className="text-2xl font-black italic text-emerald-400 uppercase tracking-widest">NOVO RECORDE!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-4">
        {/* Banner Area (Click to Expand Video) */}
        <div 
          className="relative h-40 -mx-6 -mt-6 mb-2 overflow-hidden cursor-pointer group/banner border-b border-yellow-400/20"
          onClick={(e) => {
            e.stopPropagation();
            if (!isExpanded) setIsExpanded(true);
            setShowVideo(!showVideo);
          }}
        >
          <img 
            src={ex.image || `https://img.youtube.com/vi/${videoQuery}/0.jpg`} 
            alt={ex.name}
            className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-500 scale-105 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-linear-to-t from-neutral-950 via-neutral-950/20 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-yellow-400/10 backdrop-blur-md p-4 rounded-full border border-yellow-400/50 group-hover:scale-110 group-hover:bg-yellow-400/30 transition-all">
              <Play className="text-yellow-400 fill-yellow-400" size={32} />
            </div>
          </div>
          <div className="absolute bottom-3 left-6 flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
             <span className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.3em] drop-shadow-lg">Técnica Industrial</span>
          </div>
        </div>

        {/* Inline Video Expander */}
        <AnimatePresence>
          {showVideo && (
            <React.Fragment>
              <div 
                className="fixed inset-0 z-40 bg-transparent" 
                onClick={(e) => { e.stopPropagation(); setShowVideo(false); }}
              />
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden bg-black rounded-2xl border border-white/10 relative z-50"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative aspect-video">
                  <iframe
                    src={`https://www.youtube.com/embed/${videoQuery}?autoplay=1&modestbranding=1&rel=0`}
                    title={ex.name}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowVideo(false); }}
                    className="absolute top-2 right-2 p-2 bg-black/60 rounded-full text-white hover:bg-red-500 transition-colors z-10"
                  >
                    <X size={16} />
                  </button>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowVideo(false); }}
                  className="w-full py-3 bg-neutral-900 text-neutral-400 font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors"
                >
                  X FECHAR VÍDEO
                </button>
              </motion.div>
            </React.Fragment>
          )}
        </AnimatePresence>

        <div className="flex justify-between items-start gap-4">

          <div className="space-y-1 flex-1">
            <span className="bg-yellow-400/10 text-yellow-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] border border-yellow-400/30">
              {ex.group}
            </span>
            <h3 className="text-2xl font-black uppercase tracking-tighter italic text-white group-hover:text-yellow-400 transition-colors leading-none pt-1">
              {ex.name}
            </h3>
            
            {!isExpanded && (
              <div className="flex flex-wrap gap-4 mt-2 opacity-60">
                <span className="text-[10px] font-black tracking-widest uppercase text-neutral-400">{ex.sets} SÉRIES</span>
                <span className="text-[10px] font-black tracking-widest uppercase text-neutral-400">{ex.reps} REPS</span>
                <span className="text-[10px] font-black tracking-widest uppercase text-yellow-400">{load || '0'} KG</span>
              </div>
            )}
          </div>

          {/* OLD CHECK BUTTON REMOVED - ONLY BRUTALISTA REMAINS IN EXPANDED STATE */}
        </div>
      </div>

      {/* Progressive Reveal Box */}
      <AnimatePresence>
        {isExpanded && !completed && (
          <motion.div
            initial={{ height: 0, opacity: 0, marginTop: 0 }}
            animate={{ height: 'auto', opacity: 1, marginTop: 24 }}
            exit={{ height: 0, opacity: 0, marginTop: 0 }}
            className="overflow-hidden pb-4"
          >
            <div className="grid grid-cols-2 gap-4">
              {/* Prescrição Block */}
              <div className="bg-neutral-900/50 p-4 rounded-2xl border border-white/5 flex flex-col justify-center gap-4">
                <div className="flex justify-between items-center text-[10px] text-neutral-500 font-black uppercase tracking-widest">
                  <span>Séries Restantes</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl text-yellow-400 font-black tracking-tighter">{Math.max(0, parseInt(ex.sets) - activeSet + (isRunning ? 1 : 1))}</span>
                    <span className="text-[10px] text-neutral-600 font-bold">/ {ex.sets}</span>
                  </div>
                </div>
                <div className="w-full h-px bg-white/5"></div>
                <div className="flex justify-between items-center text-[10px] text-neutral-500 font-black uppercase tracking-widest">
                  <span>Repetições</span>
                  <span className="text-xl text-white font-black tracking-tighter">{ex.reps}</span>
                </div>
              </div>

              {/* Wheel Picker Styled Carga */}
              <div className="flex flex-col gap-3">
                <div className={`bg-neutral-900 p-2 rounded-2xl border transition-all relative flex flex-col items-center justify-center overflow-hidden h-full ${
                  isNewPR 
                    ? 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)] bg-emerald-950/20' 
                    : 'border-white/10 hover:border-yellow-400/30 focus-within:border-yellow-400'
                }`}>
                  <div className="relative flex items-center justify-center w-full gap-3 my-2">
                    
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleLoadChange(-1); }}
                      className="w-10 h-10 rounded-full bg-neutral-800 border border-white/5 flex items-center justify-center active:scale-90 hover:bg-neutral-700 text-white transition-all"
                    >
                      <Minus size={20} />
                    </button>

                    <input
                      type="number"
                      value={load || ''}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => onUpdateLoad(ex.id, e.target.value)}
                      placeholder="0"
                      className={`w-20 bg-transparent text-center font-black text-4xl italic tracking-tighter outline-none focus:border-b border-yellow-400/50 ${isNewPR ? 'text-emerald-400' : 'text-white'}`}
                    />

                    <button 
                      onClick={(e) => { e.stopPropagation(); handleLoadChange(1); }}
                      className="w-10 h-10 rounded-full bg-neutral-800 border border-white/5 flex items-center justify-center active:scale-90 hover:bg-neutral-700 text-white transition-all"
                    >
                      <Plus size={20} />
                    </button>
                    
                  </div>

                  {prHistoryLoad ? (
                    <div className="mt-1 flex items-center gap-1 opacity-60">
                      <span className="text-[8px] font-black text-yellow-500 uppercase tracking-widest">PR: {prHistoryLoad}kg</span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Brutalist Action Button */}
            <motion.button 
              layout
              onClick={(e) => {
                handleToggleSet(e);
                if (!isRunning) {
                   cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }}
              className={`mt-4 w-full h-16 rounded-xl flex items-center justify-between px-6 transition-all duration-300 ${
                isRunning 
                  ? 'bg-yellow-400 text-neutral-950 shadow-[0_0_20px_rgba(253,224,71,0.6)] animate-pulse' 
                  : 'bg-neutral-950 text-yellow-400 border-2 border-yellow-400 shadow-[0_0_15px_rgba(0,0,0,0.8)]'
              }`}
            >
              <div className="flex flex-col items-start leading-none">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-80">
                  {isRunning ? 'Em Execução' : 'Próxima'}
                </span>
                <span className="text-xl font-black italic uppercase tracking-tighter">
                  {isRunning ? '■ FINALIZAR SÉRIE' : `> INICIAR SÉRIE ${activeSet}`}
                </span>
              </div>
              
              {isRunning && (
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-red-600 rounded-full animate-ping" />
                  <span className="text-2xl font-black font-mono tracking-tighter">
                    {formatSetTime(setTimer)}
                  </span>
                </div>
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Check Backup (If needed for high intensity) */}
      {!isExpanded && !completed && (
        <div className="absolute top-4 right-6">
           <button 
             onClick={(e) => {
                e.stopPropagation();
                onComplete(ex.id, true);
             }}
             className="text-[8px] font-black text-white/20 hover:text-yellow-400 uppercase tracking-widest"
           >
             Quick Check
           </button>
        </div>
      )}
    </motion.div>
  );
}

```

## src/components/WorkoutCompleted.jsx
```jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Camera, CheckCircle, Share2, ArrowRight, X, Instagram, Download } from 'lucide-react';
import { db } from '../utils/db';
import logger from '../utils/logger';
import { generateShareableImage, getLocalizedDayName } from '../utils/imageGenerator';
import { supabase } from '../lib/supabase';

export default function WorkoutCompleted({ workout, sets, onFinish }) {
  const [photo, setPhoto] = useState(null);
  const [shareableBlob, setShareableBlob] = useState(null);
  const [shareableUrl, setShareableUrl] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCelebration, setShowCelebration] = useState(true);
  const [trainedDays, setTrainedDays] = useState([]);

  useEffect(() => {
    // Fetch this week's workouts to determine the streak
    const fetchWeeklyStreak = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Get the start of the current week (Sunday)
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const { data, error } = await supabase
          .from('workout_logs')
          .select('created_at')
          .eq('user_id', session.user.id)
          .gte('created_at', startOfWeek.toISOString());
        
        let days = [];
        if (data && data.length > 0) {
          days = data.map(log => new Date(log.created_at).getDay());
        }
        
        // Always include today since they just finished a workout
        const todayIdx = new Date().getDay();
        if (!days.includes(todayIdx)) {
          days.push(todayIdx);
        }
        
        setTrainedDays([...new Set(days)]);
      } catch (e) {
        console.error('Failed to fetch weekly streak', e);
        setTrainedDays([new Date().getDay()]); // Fallback
      }
    };
    
    // Quick local fallback for instant render
    setTrainedDays([new Date().getDay()]);
    fetchWeeklyStreak();
  }, []);

  useEffect(() => {
    // Auto-hide large trophy after 3 seconds
    const timer = setTimeout(() => setShowCelebration(false), 3000);
    return () => {
      clearTimeout(timer);
      if (shareableUrl) URL.revokeObjectURL(shareableUrl);
    };
  }, [shareableUrl]);

  const handleCapture = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target.result;
      setPhoto(base64);
      
      // Generate Shareable Card
      setIsGenerating(true);
      try {
        const stats = {
          duration: `${Math.floor(workout.duration_seconds / 60)}m ${workout.duration_seconds % 60}s`,
          sets: `${sets.length} SETS`,
          dayName: getLocalizedDayName(),
          trainedDays: trainedDays
        };
        const blob = await generateShareableImage(base64, stats);
        setShareableBlob(blob);
        setShareableUrl(URL.createObjectURL(blob));
      } catch (err) {
        logger.error('Erro ao gerar card de compartilhamento', {}, err);
      } finally {
        setIsGenerating(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleShare = async () => {
    if (!shareableBlob) return;

    const file = new File([shareableBlob], `zyron-pump-${Date.now()}.jpg`, { type: 'image/jpeg' });
    
    // ZYRON CRASH PROTECTION: Web Share API Check
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'Meu Pump no ZYRON',
          text: 'Mais um treino finalizado com ZYRON Alpha Performance! 🦾🔥'
        });
        logger.userAction('Treino compartilhado com sucesso');
      } catch (err) {
        if (err.name !== 'AbortError') {
          logger.error('Erro ao compartilhar', {}, err);
        }
      }
    } else {
      // Fallback: Download
      const link = document.createElement('a');
      link.href = shareableUrl;
      link.download = `zyron-pump-${Date.now()}.jpg`;
      link.click();
      logger.userAction('Download do card realizado (Share API unsupported)');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    // ZYRON CRASH PROTECTION: Ultra-safe Haptic Feedback (iOS/Safari Guard)
    try {
      if (typeof window !== 'undefined' && 
          'navigator' in window && 
          typeof navigator.vibrate === 'function') {
        navigator.vibrate([100, 30, 100]);
      }
    } catch (vibrateError) {
      console.warn('Haptic Feedback not supported/prevented:', vibrateError);
    }

    try {
      const photoId = `photo_${Date.now()}`;
      if (photo) {
        // Save large photo to IndexedDB for offline-first batch sync
        await db.savePhoto(photoId, photo);
      }

      // Finish workout with optional photoId
      await onFinish({
        ...workout,
        photo_id: photo ? photoId : null,
        photo_payload: photo // Pass directly if online, hook will decide
      }, sets);

    } catch (err) {
      logger.error('Erro ao salvar conclusão do treino', {}, err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6 text-white overflow-y-auto">
      {/* Glow de fundo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-96 h-96 bg-yellow-400/8 rounded-full blur-[120px]" />
      </div>

      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 1 }}
            exit={{ scale: 2, opacity: 0 }}
            className="absolute z-60 pointer-events-none"
          >
            <Trophy size={120} className="text-yellow-400 drop-shadow-[0_0_30px_rgba(250,204,21,0.5)]" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md space-y-6 z-10"
      >
        {/* ── Logo ZYRON Gold + Slogan ── */}
        <div className="flex flex-col items-center gap-2 pb-2">
          <img
            src="/images/zyron-logo.png"
            alt="ZYRON"
            className="w-44 h-auto object-contain"
            style={{ filter: 'drop-shadow(0 0 20px rgba(253,200,0,0.45)) brightness(1.1) saturate(1.2)' }}
          />
          <p className="text-white/60 text-xs font-light tracking-[0.25em] uppercase">
            A força da sua evolução.
          </p>
        </div>

        {/* ── Status badges ── */}
        <div className="flex gap-3 justify-center">
          <div className="flex items-center gap-1.5 bg-yellow-400/10 border border-yellow-400/20 rounded-xl px-3 py-1.5">
            <span className="text-yellow-400 text-base">✓</span>
            <span className="text-yellow-400 font-black text-[10px] uppercase tracking-widest">Treino Feito</span>
          </div>
          <div className="flex items-center gap-1.5 bg-yellow-400/10 border border-yellow-400/20 rounded-xl px-3 py-1.5">
            <span className="text-yellow-400 text-base">✓</span>
            <span className="text-yellow-400 font-black text-[10px] uppercase tracking-widest">Dados Blindados</span>
          </div>
        </div>

        {/* Stats Summary Card */}
        <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-5 grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Duração</span>
            <div className="text-xl font-black italic">{Math.floor(workout?.duration_seconds / 60)}m {workout?.duration_seconds % 60}s</div>
          </div>
          <div className="space-y-1 text-right">
            <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Séries Totais</span>
            <div className="text-xl font-black italic text-yellow-400">{sets?.length ?? 0}</div>
          </div>
        </div>

        {/* Photo/Card Capture Area */}
        <div className="relative group">
          <div className="aspect-square w-full bg-neutral-900 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center overflow-hidden transition-all group-hover:border-yellow-400/50">
            {photo ? (
              <>
                <img src={shareableUrl || photo} alt="Seu físico" className="w-full h-full object-cover" />
                
                {isGenerating && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400">Estilizando Card...</span>
                  </div>
                )}

                <button 
                  onClick={() => {
                    setPhoto(null);
                    setShareableBlob(null);
                    if (shareableUrl) URL.revokeObjectURL(shareableUrl);
                    setShareableUrl(null);
                  }} 
                  className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-red-500 transition-all z-20"
                >
                  <X size={16} />
                </button>
              </>
            ) : (
              <label className="flex flex-col items-center gap-4 cursor-pointer p-12 text-center">
                <div className="p-4 bg-yellow-400/10 rounded-full border border-yellow-400/20">
                  <Camera size={32} className="text-yellow-400" />
                </div>
                <div className="space-y-1">
                  <span className="font-black uppercase text-sm tracking-tighter">Registrar Progresso</span>
                  <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest">Capture seu pump para o histórico</p>
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="user" 
                  className="hidden" 
                  onChange={handleCapture}
                />
              </label>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4 pt-4">
          <AnimatePresence>
            {photo && !isGenerating && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                onClick={handleShare}
                className="w-full h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center gap-3 font-black uppercase italic tracking-tighter text-lg shadow-[0_0_20px_rgba(79,70,229,0.3)] active:scale-95 transition-all"
              >
                <Instagram size={20} />
                Compartilhar nos Stories
              </motion.button>
            )}
          </AnimatePresence>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`w-full h-16 rounded-2xl flex items-center justify-center gap-3 font-black uppercase italic tracking-tighter text-xl transition-all ${
              isSaving ? 'bg-neutral-800 text-neutral-500' : 'bg-yellow-400 text-neutral-950 shadow-[0_0_30px_rgba(250,204,21,0.3)] active:scale-95'
            }`}
          >
            {isSaving ? 'SINCRONIZANDO...' : (
              <>
                SALVAR TREINO <ArrowRight size={24} />
              </>
            )}
          </button>
          
          <div className="flex justify-center gap-8">
            <button 
              onClick={handleShare}
              disabled={!photo || isGenerating}
              className="flex flex-col items-center gap-1 text-neutral-500 hover:text-white transition-colors disabled:opacity-30"
            >
              <Download size={20} />
              <span className="text-[8px] font-black uppercase tracking-widest">Baixar Card</span>
            </button>
            <button 
              onClick={() => onFinish(workout, sets)}
              className="flex flex-col items-center gap-1 text-neutral-500 hover:text-white transition-colors"
            >
              <CheckCircle size={20} />
              <span className="text-[8px] font-black uppercase tracking-widest">Sem Foto</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

```

## src/contexts/AuthContext.jsx
```jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        setIsAuthenticated(true);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    user,
    setUser,
    isAuthenticated,
    setIsAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;

```

## src/contexts/MusicContext.jsx
```jsx
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import logger from '../utils/logger';

const MusicContext = createContext();

export function useMusic() {
  return useContext(MusicContext);
}

export const MusicProvider = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [volume, setVolume] = useState(parseInt(localStorage.getItem('player_volume') || '100', 10));
  const [playlist, setPlaylist] = useState([]);
  const [progress, setProgress] = useState(0);
  const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 0 });
  const [isMinimized, setIsMinimized] = useState(false);
  const [wakeLock, setWakeLock] = useState(null);
  const [audioContext, setAudioContext] = useState(null);
  const [isBackgroundMode, setIsBackgroundMode] = useState(false); // Novo estado para controlar o modo background
  const [hasUserInteracted, setHasUserInteracted] = useState(false); // Controle de interação do usuário

  const playerRef = useRef(null); // Ref para o iframe do YouTube
  const silentAudioRef = useRef(null); // Ref para o elemento de áudio silencioso
  const backgroundAudioRef = useRef(null); // Ref para o elemento de áudio de background para iOS
  const audioSourceNode = useRef(null);
  const gainNode = useRef(null);
  const analyserNode = useRef(null);
  const animationFrameId = useRef(null);

  // Função agressiva para forçar áudio no PWA
  const forcePlayAudio = async (audioElement, trackId) => {
    const strategies = [
      // Estratégia 1: Play direto
      () => audioElement.play(),
      
      // Estratégia 2: Com contexto de áudio
      () => {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaElementSource(audioElement);
        source.connect(audioContext.destination);
        return audioElement.play();
      },
      
      // Estratégia 3: Muted depois unmuted
      () => {
        audioElement.muted = true;
        return audioElement.play().then(() => {
          audioElement.muted = false;
          return audioElement;
        });
      },
      
      // Estratégia 4: Baixo volume depois normal
      () => {
        const originalVolume = audioElement.volume;
        audioElement.volume = 0.001;
        return audioElement.play().then(() => {
          audioElement.volume = originalVolume;
          return audioElement;
        });
      }
    ];

    for (let i = 0; i < strategies.length; i++) {
      try {
        console.log(`🎵 Tentando estratégia ${i + 1} para tocar áudio`);
        await strategies[i]();
        console.log(`✅ Estratégia ${i + 1} funcionou!`);
        logger.userAction(`Áudio iniciado com estratégia ${i + 1}`, { trackId });
        return true;
      } catch (error) {
        console.warn(`❌ Estratégia ${i + 1} falhou:`, error.message);
        continue;
      }
    }
    
    return false;
  };

  // Listener para detectar primeira interação
  useEffect(() => {
    const handleFirstInteraction = () => {
      console.log('🎵 Primeira interação do usuário detectada');
      logger.userAction('Primeira interação do usuário', {
        timestamp: new Date().toISOString()
      });
      // Remover listeners após primeira interação
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction, { once: true });
    document.addEventListener('touchstart', handleFirstInteraction, { once: true });
    document.addEventListener('keydown', handleFirstInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
  }, []);

  // Log inicialização
  useEffect(() => {
    logger.systemEvent('MusicContext inicializado', {
      hasPlayerRef: !!playerRef.current,
      hasSilentAudioRef: !!silentAudioRef.current,
      hasBackgroundAudioRef: !!backgroundAudioRef.current
    });
  }, []);

  // Initialize YT Player API
  useEffect(() => {
    // Load local storage track
    const savedTrack = localStorage.getItem('zyron_last_track');
    if (savedTrack) {
      try {
        setCurrentTrack(JSON.parse(savedTrack));
      } catch (e) {
        console.error("Error parsing saved track", e);
      }
    }

    // Load player position
    const savedPos = localStorage.getItem('zyron_player_pos');
    if (savedPos) {
      try {
        setPlayerPosition(JSON.parse(savedPos));
      } catch (e) {
        console.error("Error parsing saved position", e);
      }
    }

    // Load minimized state
    const savedMinimized = localStorage.getItem('zyron_player_minimized');
    if (savedMinimized) {
      setIsMinimized(savedMinimized === 'true');
    }

    if (!document.getElementById('yt-api-script')) {
      const tag = document.createElement('script');
      tag.id = 'yt-api-script';
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    window.onYouTubeIframeAPIReady = () => {
      playerRef.current = new window.YT.Player('yt-player-hidden', {
        height: '0',
        width: '0',
        videoId: '',
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3
        },
        events: {
          onReady: onPlayerReady,
          onStateChange: onPlayerStateChange,
          onError: onPlayerError
        }
      });
    };

    return () => {
      window.onYouTubeIframeAPIReady = null;
    };
  }, []);

  const onPlayerReady = (event) => {
    if (currentTrack) {
      if (currentTrack.id) {
        event.target.cueVideoById(currentTrack.id);
      }
    }
  };

  const onPlayerStateChange = (event) => {
    if (event.data === window.YT.PlayerState.PLAYING) {
      setIsPlaying(true);
      if (currentTrack) {
        updateMediaSession(currentTrack);
      }
    } else if (event.data === window.YT.PlayerState.PAUSED || event.data === window.YT.PlayerState.ENDED) {
      setIsPlaying(false);
      if (silentAudioRef.current) {
        silentAudioRef.current.pause();
      }
      releaseWakeLock();
    }
  };

  const onPlayerError = (event) => {
    console.error("YouTube Player Error", event.data);
    // Simple fallback alert for copyrighted content
    if (event.data === 150 || event.data === 101) {
      alert("Mídia protegida, tente outra faixa.");
      setIsPlaying(false);
      if (playlist.length > 0) nextTrack();
    }
  };

  // Progress tracking
  useEffect(() => {
    let interval;
    if (isPlaying && playerRef.current && playerRef.current.getCurrentTime) {
      interval = setInterval(() => {
        const currentTime = playerRef.current.getCurrentTime();
        const duration = playerRef.current.getDuration();
        if (duration > 0) {
          setProgress((currentTime / duration) * 100);
        }
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const loadVideoById = async (track) => {
    if (!track) return;
    
    logger.userAction('loadVideoById', {
      trackId: track.id,
      trackTitle: track.title,
      trackArtist: track.artist
    });
    
    // FORÇAR UI INSTANTÂNEA - Player abre antes de validar
    console.log('🚀 Player abrindo instantaneamente para:', track.title);
    setCurrentTrack(track);
    setIsPlaying(true); // Mostra UI imediatamente
    localStorage.setItem('zyron_last_track', JSON.stringify(track));
    
    try {
      // PRIORIZAR PROXY DE ÁUDIO VIA VERCEL
      console.log('🎵 Tentando proxy de áudio Vercel para:', track.id);
      logger.info('Tentando proxy de áudio Vercel', { trackId: track.id });
      
      try {
        // Usar proxy CORS da Vercel para stream
        const proxyResponse = await fetch(`/api/audio-stream/${track.id}`);
        
        if (proxyResponse.ok) {
          const streamData = await proxyResponse.json();
          if (streamData.audioUrl) {
            console.log('✅ Proxy Vercel funcionou, usando áudio nativo');
            logger.info('Proxy Vercel funcionou', { 
              trackId: track.id,
              audioUrl: streamData.audioUrl,
              format: streamData.format
            });
            
            // Criar elemento de áudio dinamicamente para PWA
            const audioElement = new Audio();
            audioElement.src = streamData.audioUrl;
            audioElement.volume = volume / 100;
            audioElement.crossOrigin = "anonymous";
            
            // Usar estratégia agressiva para PWA
            const success = await forcePlayAudio(audioElement, track.id);
            
            if (success) {
              // Salvar referência para controle
              if (backgroundAudioRef.current) {
                backgroundAudioRef.current = audioElement;
              }
              return;
            }
            
            // Se todas as estratégias falharem, tentar com interação do usuário
            console.warn('⚠️ Todas as estratégias falharam, exigindo interação do usuário');
            logger.warn('Todas as estratégias de autoplay falharam', { 
              trackId: track.id
            });
            
            // Criar listener de clique para tocar após interação
            const playAfterInteraction = () => {
              forcePlayAudio(audioElement, track.id)
                .then(success => {
                  if (success) {
                    console.log('🎵 Áudio iniciado após interação do usuário');
                    logger.userAction('Áudio iniciado após interação', { trackId: track.id });
                    // Salvar referência para controle
                    if (backgroundAudioRef.current) {
                      backgroundAudioRef.current = audioElement;
                    }
                  }
                })
                .catch(err => {
                  console.error('❌ Falha ao tocar após interação:', err);
                  logger.error('Falha ao tocar após interação', { 
                    trackId: track.id, 
                    error: err.message 
                  });
                });
              
              // Remover listener após sucesso
              document.removeEventListener('click', playAfterInteraction);
              document.removeEventListener('touchstart', playAfterInteraction);
            };
            
            // Adicionar listeners para interação
            document.addEventListener('click', playAfterInteraction, { once: true });
            document.addEventListener('touchstart', playAfterInteraction, { once: true });
            
            // Mostrar mensagem para usuário
            alert('🎵 Clique em qualquer lugar para iniciar a música');
            return;
          }
        }
      } catch (proxyError) {
        console.warn('Proxy Vercel falhou:', proxyError.message);
        logger.warn('Proxy Vercel falhou', { 
          trackId: track.id, 
          error: proxyError.message 
        });
      }
      
      // FALLBACK DIRETO PARA YOUTUBE IFRAME (ignorando CORS do Piped)
      console.log('⚠️ Proxy falhou, usando YouTube iframe direto');
      logger.warn('Fallback direto para YouTube iframe', { trackId: track.id });
      
      if (playerRef.current && playerRef.current.loadVideoById) {
        playerRef.current.loadVideoById(track.id);
        setIsPlaying(true);
        updateMediaSession(track);
        await startSilentAudio();
        requestWakeLock();
        
        // PWA Autoplay Fix para YouTube também
        try {
          // YouTube iframe geralmente funciona melhor, mas vamos garantir
          console.log('🎵 YouTube iframe carregado');
          logger.userAction('YouTube iframe iniciado (fallback)', { trackId: track.id });
        } catch (youtubeError) {
          console.warn('⚠️ YouTube iframe autoplay bloqueado:', youtubeError.message);
          logger.warn('YouTube iframe autoplay bloqueado', { 
            trackId: track.id, 
            error: youtubeError.message 
          });
          
          // Alertar usuário para interagir
          alert('🎵 Clique no player para iniciar a música');
        }
        return;
      }
      
    } catch (error) {
      console.error('ERRO CRÍTICO AO CARREGAR ÁUDIO:', error);
      logger.error('Erro crítico ao carregar áudio', {
        trackId: track.id,
        trackTitle: track.title,
        errorMessage: error.message,
        errorStack: error.stack
      }, error);
      
      // ALERTA DIRETO PARA DEBUG
      alert(`🚨 ERRO CRÍTICO DETECTADO!\n\n` +
            `Música: ${track.title}\n` +
            `ID: ${track.id}\n` +
            `Erro: ${error.message}\n\n` +
            `Tire um print e envie ao desenvolvedor!\n\n` +
            `Console: Aperte F12 para ver detalhes completos`);
      
      // Resetar estado se falhar tudo
      setIsPlaying(false);
      setCurrentTrack(null);
    }
  };
  const togglePlay = async () => {
    logger.userAction('togglePlay', { 
      isPlaying: isPlaying,
      hasCurrentTrack: !!currentTrack,
      trackId: currentTrack?.id
    });
    
    console.log('🎯 Toggle Play acionado - isPlaying:', isPlaying);
    
    if (isPlaying) {
      // Pausar todos os áudios
      if (playerRef.current && playerRef.current.pauseVideo) {
        playerRef.current.pauseVideo();
      }
      if (backgroundAudioRef.current) {
        backgroundAudioRef.current.pause();
      }
      if (silentAudioRef.current) {
        silentAudioRef.current.pause();
      }
      setIsPlaying(false);
      releaseWakeLock();
      logger.userAction('Música pausada', { trackId: currentTrack?.id });
    } else {
      // FORÇAR UI INSTANTÂNEA
      if (currentTrack) {
        setIsPlaying(true); // UI imediata
        console.log('🚀 Forçando UI de playback imediato');
      }
      
      try {
        // 1. Áudio silencioso primeiro
        if (silentAudioRef.current) {
          silentAudioRef.current.volume = 0.01;
          await silentAudioRef.current.play();
          console.log('🔊 Silent audio iniciado');
          logger.debug('Silent audio iniciado');
        }
        
        // 2. Áudio de background (se tiver src)
        if (backgroundAudioRef.current && backgroundAudioRef.current.src) {
          backgroundAudioRef.current.volume = volume / 100;
          await backgroundAudioRef.current.play();
          console.log('🎵 Background audio retomado');
          logger.debug('Background audio retomado');
        }
        
        // 3. YouTube iframe (se existir)
        if (currentTrack && playerRef.current) {
          if (playerRef.current.getPlayerState() === window.YT.PlayerState.CUED || playerRef.current.getPlayerState() === -1) {
            playerRef.current.loadVideoById(currentTrack.id);
          } else {
            playerRef.current.playVideo();
          }
          console.log('📺 YouTube play iniciado');
          logger.debug('YouTube play iniciado');
        }
        
        updateMediaSession(currentTrack);
        requestWakeLock();
        
        console.log('✅ Playback triplo concluído com sucesso');
        logger.userAction('Música iniciada', { 
          trackId: currentTrack?.id,
          trackTitle: currentTrack?.title,
          volume: volume
        });
        
      } catch (error) {
        console.error('ERRO NO PLAYBACK:', error);
        logger.error('Erro no playback', {
          trackId: currentTrack?.id,
          errorMessage: error.message,
          errorStack: error.stack
        }, error);
        
        alert(`Erro ao tocar: ${error.message}`);
        
        // Resetar estado em caso de erro
        setIsPlaying(false);
      }
    }
  };

  const nextTrack = () => {
    if (playlist.length === 0) return;
    const currentIndex = playlist.findIndex(t => t.id === currentTrack?.id);
    const nextIndex = (currentIndex + 1) % playlist.length;
    loadVideoById(playlist[nextIndex]);
  };

  const prevTrack = () => {
    if (playlist.length === 0) return;
    const currentIndex = playlist.findIndex(t => t.id === currentTrack?.id);
    const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    loadVideoById(playlist[prevIndex]);
  };

  const changeVolume = (newVolume) => {
    setVolume(newVolume);
    if (playerRef.current && playerRef.current.setVolume) {
      playerRef.current.setVolume(newVolume);
    }
  };

  const updatePlayerPosition = (pos) => {
    setPlayerPosition(pos);
    localStorage.setItem('zyron_player_pos', JSON.stringify(pos));
  };

  const toggleMinimized = () => {
    const newState = !isMinimized;
    setIsMinimized(newState);
    localStorage.setItem('zyron_player_minimized', String(newState));
  };

  // Initialize Audio Context for iOS Background Mode
  const initAudioContext = () => {
    if (!audioContext && typeof AudioContext !== 'undefined') {
      const ctx = new AudioContext();
      setAudioContext(ctx);
      return ctx;
    }
    return audioContext;
  };

  // Enhanced iOS Wake Lock - Multiple Audio Streams
  const startSilentAudio = async () => {
    if (silentAudioRef.current) {
      try {
        silentAudioRef.current.volume = 0.01;
        await silentAudioRef.current.play();
        console.log('🔊 Silent audio iniciado para iOS wake lock');
      } catch (error) {
        console.log('Silent audio falhou:', error.message);
      }
    }

    // Background Audio Stream (mais robusto)
    if (backgroundAudioRef.current) {
      try {
        backgroundAudioRef.current.volume = 0.001;
        backgroundAudioRef.current.loop = true;
        await backgroundAudioRef.current.play();
        console.log('🎵 Background audio stream iniciado');
      } catch (error) {
        console.log('Background audio falhou:', error.message);
      }
    }

    // Initialize Web Audio Context
    initAudioContext();

    // FORÇAR ÁUDIO REAL - Criar áudio de teste
    try {
      const testAudio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=');
      testAudio.volume = 0.1;
      testAudio.loop = true;
      await testAudio.play();
      console.log('🔊 Áudio de teste iniciado');
      
      // Parar após 2 segundos
      setTimeout(() => {
        testAudio.pause();
        console.log('🔇 Áudio de teste parado');
      }, 2000);
    } catch (error) {
      console.log('Áudio de teste falhou:', error.message);
    }
  };

  // Wake Lock API para Android/Chrome
  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        const lock = await navigator.wakeLock.request('screen');
        setWakeLock(lock);
        console.log('🔒 Wake Lock ativo');
        
        lock.addEventListener('release', () => {
          console.log('🔓 Wake Lock liberado');
          setWakeLock(null);
        });
      } catch (error) {
        console.log('Wake Lock falhou:', error.message);
      }
    }
  };

  const releaseWakeLock = () => {
    if (wakeLock) {
      wakeLock.release();
      setWakeLock(null);
    }
    
    // Parar todos os áudios de background
    if (silentAudioRef.current) {
      silentAudioRef.current.pause();
    }
    if (backgroundAudioRef.current) {
      backgroundAudioRef.current.pause();
    }
    
    console.log('🔓 Wake lock e áudios de background liberados');
  };

  const updateMediaSession = (track) => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: track.title,
        artist: track.artist || 'ZYRON Radio',
        album: 'A Força da Sua Evolução',
        artwork: [
          { src: track.thumbnail || '/images/zyron-192.png', sizes: '192x192', type: 'image/png' },
          { src: track.thumbnail || '/images/zyron-512.png', sizes: '512x512', type: 'image/png' },
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => {
        togglePlay();
        startSilentAudio();
        requestWakeLock();
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        togglePlay();
        if (silentAudioRef.current) {
          silentAudioRef.current.pause();
        }
        releaseWakeLock();
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => prevTrack());
      navigator.mediaSession.setActionHandler('nexttrack', () => nextTrack());

      // iOS Interruption Handling Avançado
      if (silentAudioRef.current) {
        silentAudioRef.current.onpause = () => {
          console.log('📱 iOS interrompeu áudio silencioso');
          // Tentar recuperar após 1 segundo
          setTimeout(() => {
            if (isPlaying) {
              startSilentAudio();
              // Tentar retomar YouTube também
              if (playerRef.current && playerRef.current.playVideo) {
                try {
                  playerRef.current.playVideo();
                } catch (e) {
                  console.log('Falha ao retomar YouTube:', e);
                }
              }
            }
          }, 1000);
        };
        
        silentAudioRef.current.onplay = () => {
          console.log('📱 iOS retomou áudio silencioso');
        };
      }

      // Background Audio Stream Handler
      if (backgroundAudioRef.current) {
        backgroundAudioRef.current.onpause = () => {
          console.log('📱 Background audio pausado pelo iOS');
          // Recuperar automaticamente
          setTimeout(() => {
            if (isPlaying) {
              backgroundAudioRef.current.play().catch(e => {
                console.log('Falha ao recuperar background audio:', e);
              });
            }
          }, 500);
        };
      }

      // Page Visibility API - Detectar quando app vai para background
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          console.log('📱 App foi para background');
          setIsBackgroundMode(true);
          // Forçar áudio de background
          startSilentAudio();
        } else {
          console.log('📱 App voltou para foreground');
          setIsBackgroundMode(false);
          // Se estava tocando, garantir que continue
          if (isPlaying) {
            setTimeout(() => {
              startSilentAudio();
              // Tentar retomar YouTube se necessário
              if (playerRef.current && playerRef.current.playVideo) {
                try {
                  if (playerRef.current.getPlayerState() !== window.YT.PlayerState.PLAYING) {
                    playerRef.current.playVideo();
                  }
                } catch (e) {
                  console.log('Falha ao retomar YouTube no foreground:', e);
                }
              }
            }, 1000);
          }
        }
      });

      // iOS Focus/Blur Events - Detectar quando usuário interage com controles
      window.addEventListener('blur', () => {
        console.log('📱 Janela perdeu foco (usuário interagiu com controles)');
        if (isPlaying) {
          setTimeout(() => {
            startSilentAudio();
          }, 500);
        }
      });

      window.addEventListener('focus', () => {
        console.log('📱 Janela ganhou foco');
        if (isPlaying) {
          setTimeout(() => {
            startSilentAudio();
            // Verificar se YouTube ainda está tocando
            if (playerRef.current && playerRef.current.getPlayerState) {
              try {
                const state = playerRef.current.getPlayerState();
                if (state !== window.YT.PlayerState.PLAYING) {
                  console.log('🔄 YouTube não está tocando, retomando...');
                  playerRef.current.playVideo();
                }
              } catch (e) {
                console.log('Erro ao verificar estado do YouTube:', e);
              }
            }
          }, 1000);
        }
      });
    }
  };

  const searchMusic = async (query) => {
    logger.userAction('searchMusic', { query: query.trim() });
    
    if (!query || query.trim().length === 0) {
      console.warn('Busca vazia, retornando array vazio');
      logger.warn('Busca vazia', { query });
      return [];
    }

    // Limpar estado anterior para evitar stale UI
    const searchResults = [];
    
    console.log(`ZYRON Radio: Iniciando busca estruturada para "${query}"`);
    logger.info('Iniciando busca estruturada', { query });
    
    // Fallback Chain: Piped Streams -> Piped Search -> Invidious -> Cache Local
    const apiEndpoints = [
      {
        name: 'Piped Streams API',
        url: `https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(query)}`,
        transform: (data) => data.map(item => ({
          id: item.url?.split('v=')[1] || item.url?.split('/').pop() || item.videoId,
          title: item.title || 'ZYRON Audio',
          thumbnail: item.thumbnail || `https://img.youtube.com/vi/${item.videoId || item.url?.split('v=')[1]}/mqdefault.jpg`,
          artist: item.uploaderName || item.channelName || 'Unknown Artist',
          duration: item.duration
        }))
      },
      {
        name: 'YouTube Direct (Vercel Proxy)',
        url: `/api/search?q=${encodeURIComponent(query)}`,
        transform: (data) => data
      },
      {
        name: 'Invidious API',
        url: `https://yewtu.be/api/v1/search?q=${encodeURIComponent(query)}`,
        transform: (data) => data.map(item => ({
          id: item.videoId,
          title: item.title || 'ZYRON Audio',
          thumbnail: `https://img.youtube.com/vi/${item.videoId}/mqdefault.jpg`,
          artist: item.author || item.channelName || 'Unknown Artist',
          duration: item.lengthSeconds
        }))
      }
    ];

    for (const endpoint of apiEndpoints) {
      try {
        console.log(`Tentando ${endpoint.name}...`);
        
        const response = await fetch(endpoint.url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'ZYRON-Music/1.0'
          },
          signal: AbortSignal.timeout(10000) // Timeout 10s
        });

        if (response.ok) {
          const data = await response.json();
          
          if (data && Array.isArray(data) && data.length > 0) {
            const results = endpoint.transform(data).filter(item => 
              item.id && item.title && item.id.length > 0
            );
            
            if (results.length > 0) {
              console.log(`✅ Sucesso com ${endpoint.name}: ${results.length} resultados`);
              console.log('Primeiros 2 resultados:', results.slice(0, 2));
              return results.slice(0, 15); // Limitar para performance
            }
          }
        } else {
          console.warn(`${endpoint.name} respondeu com status ${response.status}`);
        }
      } catch (error) {
        console.warn(`Falha em ${endpoint.name}:`, error.message);
        continue;
      }
    }

    // Fallback final - curadoria local baseada no gênero
    console.warn('⚠️ Todas as APIs falharam, usando curadoria local');
    const fallbackTracks = [
      { id: 'dQw4w9WgXcQ', title: 'ZYRON Hardcore Mix Vol 1', thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/default.jpg', artist: 'ZYRON Mixes' },
      { id: 'jfKfPfyJRdk', title: 'Lofi Hip Hop Radio', thumbnail: 'https://img.youtube.com/vi/jfKfPfyJRdk/default.jpg', artist: 'Lofi Girl' },
      { id: 'L_jWHftIyJQ', title: 'Epic Workout Motivation', thumbnail: 'https://img.youtube.com/vi/L_jWHftIyJQ/default.jpg', artist: 'ZYRON Fitness' },
      { id: 'M7lc1UVf-VE', title: 'Never Gonna Give You Up', thumbnail: 'https://img.youtube.com/vi/M7lc1UVf-VE/default.jpg', artist: 'Rick Astley' }
    ];
    
    return fallbackTracks;
  };
  const contextValue = {
    isPlaying,
    currentTrack,
    volume,
    playlist,
    progress,
    playerPosition,
    isMinimized,
    togglePlay,
    nextTrack,
    prevTrack,
    changeVolume,
    setPlaylist,
    searchMusic,
    loadVideoById,
    updatePlayerPosition,
    toggleMinimized
  };

  return (
    <MusicContext.Provider value={contextValue}>
      {children}
      
      {/* iOS Wake Lock - Silent Loop Audio (1 segundo real) */}
      <audio 
        ref={silentAudioRef}
        loop 
        style={{ display: 'none' }}
        src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT" 
      />

      {/* Background Audio Stream - iOS Wake Lock Backup */}
      <audio 
        ref={backgroundAudioRef}
        loop 
        style={{ display: 'none' }}
        src="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=" 
      />

      {/* 
        CRITICAL FIX: YouTube API replaces the target div with an iframe. 
        If this happens directly in a React tree next to AnimatePresence, React will crash with DOM NotFoundError on unmounts. 
        Wrapping it in a stable parent div protects the React tree from this mutation. 
      */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', width: '0px', height: '0px' }}>
        <div id="yt-player-hidden"></div>
      </div>
    </MusicContext.Provider>
  );
}

```

## src/contexts/NotificationContext.jsx
```jsx
import React, { createContext, useContext, useState } from 'react';

const NotificationContext = createContext({
  notifications: [],
  addNotification: () => {},
  removeNotification: () => {}
});

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (notification) => {
    setNotifications(prev => [...prev, {
      id: Date.now(),
      ...notification,
      timestamp: new Date()
    }]);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const value = {
    notifications,
    addNotification,
    removeNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

export default NotificationContext;

```

## src/contexts/ThemeContext.jsx
```jsx
import React, { createContext, useContext } from 'react';

const ThemeContext = createContext({
  theme: 'dark',
  colors: {
    primary: '#8b5cf6',
    secondary: '#1f2937',
    accent: '#3b82f6',
    background: '#000000',
    surface: '#1a1a1a',
    text: '#ffffff'
  }
});

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('dark');

  const value = {
    theme,
    setTheme,
    colors: {
      primary: '#8b5cf6',
      secondary: '#1f2937',
      accent: '#3b82f6',
      background: '#000000',
      surface: '#1a1a1a',
      text: '#ffffff'
    }
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export default ThemeContext;

```

## src/data/workoutData.js
```js
export const workoutData = {
  1: {
    title: "Peito + Tríceps",
    focus: "Hipertrofia - Empurre",
    image: "/images/chest.png",
    exercises: [
      { id: "p1", name: "Supino reto barra", group: "Peito", sets: 4, reps: "8-12", rest: 90 },
      { id: "p2", name: "Supino inclinado halter", group: "Peito", sets: 3, reps: "8-12", rest: 60 },
      { id: "p_cm", name: "Crucifixo máquina", group: "Peito", sets: 3, reps: "8-12", rest: 60 },
      { id: "p3", name: "Crossover polia", group: "Peito", sets: 3, reps: "8-12", rest: 60 },
      { id: "t2", name: "Tríceps corda", group: "Tríceps", sets: 3, reps: "8-12", rest: 60 },
      { id: "t3", name: "Tríceps testa", group: "Tríceps", sets: 3, reps: "8-12", rest: 60 },
      { id: "t_mb", name: "Mergulho banco", group: "Tríceps", sets: 4, reps: "8-12", rest: 60 },
    ],
    cardio: "Esteira 15-20 min (Pós-treino)"
  },
  2: {
    title: "Costas + Bíceps",
    focus: "Hipertrofia - Puxe",
    image: "/images/back.png",
    exercises: [
      { id: "c1", name: "Puxada frente aberta", group: "Costas", sets: 4, reps: "8-12", rest: 90 },
      { id: "c_rc", name: "Remada curvada barra", group: "Costas", sets: 3, reps: "8-12", rest: 90 },
      { id: "c_rm", name: "Remada máquina", group: "Costas", sets: 3, reps: "8-12", rest: 60 },
      { id: "c_pd", name: "Pulldown", group: "Costas", sets: 3, reps: "8-12", rest: 60 },
      { id: "b1", name: "Rosca direta barra", group: "Bíceps", sets: 3, reps: "8-12", rest: 60 },
      { id: "b_ra", name: "Rosca alternada halter", group: "Bíceps", sets: 3, reps: "8-12", rest: 60 },
      { id: "b3", name: "Rosca concentrada", group: "Bíceps", sets: 3, reps: "8-12", rest: 60 },
    ],
    cardio: "Esteira 15-20 min (Pós-treino)"
  },
  3: {
    title: "Pernas completas + Panturrilha",
    focus: "Membros Inferiores",
    image: "/images/legs.png",
    exercises: [
      { id: "l1", name: "Agachamento livre", group: "Perna", sets: 4, reps: "8-12", rest: 120 },
      { id: "l2", name: "Leg press", group: "Perna", sets: 4, reps: "8-12", rest: 90 },
      { id: "l3", name: "Cadeira extensora", group: "Perna", sets: 3, reps: "8-12", rest: 60 },
      { id: "l4", name: "Mesa flexora", group: "Perna", sets: 3, reps: "8-12", rest: 60 },
      { id: "l_st", name: "Stiff", group: "Perna", sets: 3, reps: "8-12", rest: 90 },
      { id: "l_ep", name: "Elevação pélvica", group: "Perna", sets: 3, reps: "8-12", rest: 90 },
      { id: "ca1", name: "Panturrilha em pé", group: "Panturrilha", sets: 4, reps: "8-12", rest: 60 },
      { id: "ca_s", name: "Panturrilha sentado", group: "Panturrilha", sets: 3, reps: "8-12", rest: 60 },
    ],
    preCardio: "Esteira 10-15 min (Aquecimento/Preparatório)"
  },
  4: {
    title: "Ombro",
    focus: "Hipertrofia - Deltoides",
    image: "/images/shoulders.png",
    exercises: [
      { id: "s1", name: "Desenvolvimento halter", group: "Ombro", sets: 4, reps: "8-12", rest: 90 },
      { id: "s2", name: "Elevação lateral", group: "Ombro", sets: 4, reps: "8-12", rest: 60 },
      { id: "s3", name: "Elevação frontal", group: "Ombro", sets: 3, reps: "8-12", rest: 60 },
      { id: "s4", name: "Crucifixo invertido", group: "Ombro", sets: 3, reps: "8-12", rest: 60 },
      { id: "s_et", name: "Encolhimento trapézio", group: "Ombro", sets: 3, reps: "8-12", rest: 60 },
    ],
    cardio: "Esteira 15-20 min (Pós-treino)"
  },
  5: {
    title: "Bíceps + Tríceps",
    focus: "Braços e Definição",
    image: "/images/arms.png",
    exercises: [
      { id: "b_rw", name: "Rosca barra W", group: "Bíceps", sets: 4, reps: "8-12", rest: 60 },
      { id: "b2", name: "Rosca martelo", group: "Bíceps", sets: 3, reps: "8-12", rest: 60 },
      { id: "b_bi", name: "Rosca banco inclinado", group: "Bíceps", sets: 3, reps: "8-12", rest: 60 },
      { id: "t3", name: "Tríceps testa", group: "Tríceps", sets: 3, reps: "8-12", rest: 60 },
      { id: "t2", name: "Tríceps corda", group: "Tríceps", sets: 3, reps: "8-12", rest: 60 },
      { id: "t_mb2", name: "Tríceps banco", group: "Tríceps", sets: 3, reps: "8-12", rest: 60 },
    ],
    cardio: "Esteira 15 min (Pós-treino)"
  },
  0: { title: "Descanso Ativo", focus: "Recuperação", exercises: [] },
  6: { title: "Descanso Ativo", focus: "Recuperação", exercises: [] },
};

```

## src/hooks/useSyncWorkout.js
```js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import logger from '../utils/logger';
import { db as zyronDB } from '../utils/db';

/**
 * useSyncWorkout Hook - ZYRON Advanced Sync v2 (Photos + IndexedDB Queue)
 */
export function useSyncWorkout(user) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncPending, setSyncPending] = useState(0);

  // Initialize queue length from IndexedDB
  useEffect(() => {
    const initQueue = async () => {
      try {
        const queue = await zyronDB.getSyncQueue();
        setSyncPending(queue.length);
      } catch (e) {
        console.error('Failed to init sync queue', e);
      }
    };
    initQueue();
  }, []);

  const performSync = useCallback(async () => {
    if (!navigator.onLine) return;
    
    try {
      const queue = await zyronDB.getSyncQueue();
      if (queue.length === 0) {
        setSyncPending(0);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      logger.systemEvent('Iniciando sincronização de itens pendentes', { items: queue.length });

      for (const item of queue) {
        try {
          if (item.retryCount >= 5) {
             logger.warn('Skip sync for item (max retries)', { id: item.id });
             continue;
          }

          // ZYRON ADVANCED: Check if there's a photo in IndexedDB for this workout
          if (item.workout && item.workout.photo_id) {
            const photoData = await zyronDB.getPhoto(item.workout.photo_id);
            if (photoData) {
              item.workout.photo_payload = photoData;
            }
          }

          const response = await fetch('/api/sync-workout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify(item)
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.details || errorData.error || 'Sync failed');
          }

          // Success: Clean up IndexedDB photo and queue item
          if (item.workout && item.workout.photo_id) {
            await zyronDB.deletePhoto(item.workout.photo_id);
          }
          await zyronDB.removeFromSyncQueue(item.id);
          
          logger.systemEvent('Item sincronizado com sucesso', { id: item.id });
        } catch (err) {
          logger.error('Falha ao sincronizar item individual', { id: item.id }, err);
          await zyronDB.updateSyncRetry(item.id, (item.retryCount || 0) + 1, 'failed');
        }
      }

      // Re-evaluate pending
      const newQueue = await zyronDB.getSyncQueue();
      setSyncPending(newQueue.length);
      
    } catch (e) {
       logger.error('Sync process failed globally', {}, e);
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      performSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [performSync]);

  /**
   * Main method to log a workout
   * @param {Object} workout - Now includes photo_id (indexedDB) and photo_payload (base64)
   * @param {Array} sets
   */
  const logWorkout = useCallback(async (workout, sets) => {
    const payload = { type: 'workout_log', workout, sets };

    // If offline, queue immediately. Photo is already in indexedDB via WorkoutCompleted.jsx
    if (!navigator.onLine) {
      logger.warn('Offline: Treino salvo no IndexedDB Queue');
      await zyronDB.addToSyncQueue(payload);
      setSyncPending(prev => prev + 1);
      return { success: true, status: 'queued' };
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');

      const response = await fetch('/api/sync-workout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('API unstable, queueing for later');
      }

      // If it was an immediate Success, and there was a photo_id, clean it from DB
      if (workout.photo_id) {
        await zyronDB.deletePhoto(workout.photo_id);
      }

      logger.systemEvent('Treino enviado para nuvem com sucesso');
      return { success: true, status: 'synced' };
    } catch (err) {
      logger.warn('Erro na sincronização imediata, enfileirando...', {}, err);
      // Ensure payload is queued
      await zyronDB.addToSyncQueue(payload);
      setSyncPending(prev => prev + 1);
      return { success: true, status: 'queued' };
    }
  }, []);

  return { 
    isOnline, 
    logWorkout, 
    syncPending, 
    performSync 
  };
}

```

## src/index.css
```css
@import "tailwindcss";

@theme {
  --color-industrial-bg: #000000;
  --color-industrial-card: #111111;
  --color-industrial-accent: #ffd400;
  --color-industrial-success: #10b981;
}

:root {
  --primary-yellow: #ffd400; /* Amarelo Vibrante Oficial ZYRON */
  --industrial-black: #000000; /* Fundo Profundo Puro */
  --surface-gray: #111111; /* Cards e Widgets */
  --accent-gold: #ffd400; /* Tons de destaque */

  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;

  color-scheme: dark;
  color: rgba(255, 255, 255, 0.87);
  background-color: var(--industrial-black); /* Carbon Black */

  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  overflow-x: hidden;
  background-color: #000000;
}

#root {
  width: 100%;
}

/* Custom scrollbar for Industrial look */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: var(--industrial-black);
}
::-webkit-scrollbar-thumb {
  background: #333333;
  border-radius: 10px;
  border: 1px solid rgba(253, 224, 71, 0.1);
}
::-webkit-scrollbar-thumb:hover {
  background: var(--accent-gold);
}

/* Glassmorphism Utilities */
.glass {
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

/* Global Animations */
@keyframes gradient-x {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
.animate-gradient-x {
  background-size: 200% 200%;
  animation: gradient-x 3s ease infinite;
}

@keyframes spin-slow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.animate-spin-slow {
  animation: spin-slow 8s linear infinite;
}

/* Input Chrome/Safari removal */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  appearance: none;
  -webkit-appearance: none;
  margin: 0;
}

/* Firefox */
input[type="number"] {
  appearance: textfield;
  -moz-appearance: textfield;
}

/* Industrial VFX Keyframes */
@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}

@keyframes neon-pulse {
  0%,
  100% {
    box-shadow:
      0 0 10px rgba(253, 224, 71, 0.4),
      0 0 20px rgba(253, 224, 71, 0.2);
  }
  50% {
    box-shadow:
      0 0 20px rgba(253, 224, 71, 0.8),
      0 0 35px rgba(253, 224, 71, 0.6);
  }
}

.animate-neon-pulse {
  animation: neon-pulse 2s ease-in-out infinite;
}

```

## src/lib/gemini.js
```js
/**
 * ZYRON Coach — Groq AI Integration
 * Groq offers Llama 3.3-70B for free: https://console.groq.com
 * Free tier: 30 req/min, 14,400 req/day
 */

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Fallback chain — todos grátis no Groq
const MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'gemma2-9b-it',
];

/**
 * Build the system prompt with the user's live context.
 */
export function buildSystemPrompt(user, prHistory, workoutData) {
  const today = new Date().getDay();
  const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const todayWorkout = workoutData?.[today];

  const topPRs = Object.entries(prHistory || {})
    .slice(0, 8)
    .map(([id, load]) => `  • ${id}: ${load}kg`)
    .join('\n') || '  Nenhum PR registrado ainda.';

  return `Você é o ZYRON Coach, um personal trainer de IA de elite integrado ao app ZYRON.

Seu estilo: direto, motivador, técnico, sem enrolação. Foco absoluto em resultados.
Idioma: português brasileiro. Use emojis esportivos com moderação (⚡💪🔥).
Respostas curtas e objetivas. Máximo 3 parágrafos, salvo quando o atleta pedir detalhes.

## Perfil do Atleta
- Nome: ${user?.name || 'Atleta'}
- Peso: ${user?.weight || '?'}kg
- Objetivo: ${user?.goal || 'Hipertrofia'}
- Nível: ${user?.level || 'Intermediário'}

## Sessão de Hoje (${dayNames[today]})
- Treino: ${todayWorkout?.title || 'Descanso'}
- Foco: ${todayWorkout?.focus || '-'}
- Exercícios: ${todayWorkout?.exercises?.map(e => e.name).join(', ') || 'Nenhum'}
${todayWorkout?.cardio ? `- Cardio: ${todayWorkout.cardio}` : ''}

## Diretrizes Técnicas (ZYRON 5x)
- Descanso: 90s para multiarticulares (compostos) e 60s para isolados.
- Progressão: Aumentar carga progressivamente ao atingir o máximo de reps com boa execução.
- Cardio: Esteira pós-treino (exceto na quarta-feira, onde é feito ANTES do treino de perna).
- Intensidade: Foco em falha controlada e cadência perfeita.

## Melhores Marcas (PRs)
${topPRs}

## Diretrizes de Resposta
- Nunca invente fatos ou exercícios inexistentes.
- Se não souber, seja honesto.
- Mantenha o atleta motivado e focado.
- Slogan: Forje Sua Evolução. ⚡`;
}

/**
 * Send a message using Groq API (OpenAI-compatible format).
 * Falls back through model list on rate limit.
 */
export async function sendMessageToGemini(history, userMessage, systemInstruction) {
  if (!GROQ_API_KEY) {
    throw new Error('VITE_GROQ_API_KEY não configurada no .env — obtenha em console.groq.com');
  }

  // Convert history format to OpenAI messages format
  const messages = [
    { role: 'system', content: systemInstruction },
    ...history.map(h => ({
      role: h.role === 'model' ? 'assistant' : 'user',
      content: h.parts?.[0]?.text ?? h.content ?? ''
    })),
    { role: 'user', content: userMessage }
  ];

  for (let i = 0; i < MODELS.length; i++) {
    const model = MODELS[i];
    try {
      console.log(`[ZYRON Coach] Usando Groq/${model}`);

      const res = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.85,
          max_tokens: 1024,
        })
      });

      if (!res.ok) {
        const err = await res.json();
        const is429 = res.status === 429;
        if (is429 && i < MODELS.length - 1) {
          console.log(`[ZYRON Coach] Rate limit em ${model}, tentando próximo...`);
          continue;
        }
        throw new Error(err.message || String(err));
      }

      const data = await res.json();
      return data.choices?.[0]?.message?.content ?? 'Sem resposta.';

    } catch (err) {
      if (i === MODELS.length - 1) throw err;
    }
  }

  throw new Error('Todos os modelos estão indisponíveis. Tente novamente em instantes.');
}

```

## src/lib/supabase.js
```js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

```

## src/main.jsx
```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

```

## src/utils/audioUnlock.js
```js
/**
 * iOS Audio Persistence Utility
 * Purpose: Provides a safe way to unlock the Web Audio API context.
 * Refactored: Removed global side-effects to prevent ReferenceErrors during boot.
 */

class AudioUnlocker {
  constructor() {
    this.context = null;
    this.isUnlocked = false;
    this.silentBuffer = null;
  }

  /**
   * Safe initialization to be called from a React useEffect
   */
  async init() {
    if (this.isUnlocked || typeof window === 'undefined') return;

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;

      if (!this.context) {
        this.context = new AudioContext();
      }

      // Create a 1-second silent buffer
      this.silentBuffer = this.context.createBuffer(1, this.context.sampleRate, this.context.sampleRate);
      
      console.log('🔇 AudioUnlocker: Pronto para desbloqueio na primeira interação.');
      return true;
    } catch (err) {
      console.error('❌ AudioUnlocker init error:', err);
      return false;
    }
  }

  /**
   * The actual unlock call - MUST be triggered by a user event (click/touch)
   */
  async unlock() {
    if (!this.context || this.isUnlocked) return;

    try {
      if (this.context.state === 'suspended') {
        await this.context.resume();
      }
      
      // Play a tiny silent sound to satisfy iOS requirements
      const source = this.context.createBufferSource();
      source.buffer = this.silentBuffer;
      source.connect(this.context.destination);
      source.start(0);
      
      this.isUnlocked = true;
      console.log('🔊 Áudio ZYRON desbloqueado via AudioContext (iOS Safe)');
      return true;
    } catch (err) {
      console.error('❌ Falha ao desbloquear contexto de áudio:', err);
      return false;
    }
  }

  /**
   * Maintains the context active for background play
   */
  keepAlive() {
    if (!this.context || !this.isUnlocked) return;
    try {
      const source = this.context.createBufferSource();
      source.buffer = this.silentBuffer;
      source.connect(this.context.destination);
      source.start(0);
    } catch (e) {
      // Ignore background drift errors
    }
  }
}

const audioUnlocker = new AudioUnlocker();
export default audioUnlocker;

```

## src/utils/db.js
```js
const DB_NAME = 'ZYRON_OFFLINE_DB';
const DB_VERSION = 2; // Bumped for PENDING_SYNC
const STORE_NAME = 'PENDING_PHOTOS';
const SYNC_STORE_NAME = 'PENDING_SYNC';
/**
 * ZYRON IndexedDB Utility
 * Handles large payloads (like base64 images) that exceed LocalStorage limits.
 */
class ZyronDB {
  constructor() {
    this.db = null;
  }

  async open() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(SYNC_STORE_NAME)) {
          db.createObjectStore(SYNC_STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        reject('IndexedDB Error: ' + event.target.error);
      };
    });
  }

  async savePhoto(id, base64Data) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({ id, data: base64Data, timestamp: Date.now() });

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async getPhoto(id) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result?.data || null);
      request.onerror = () => reject(request.error);
    });
  }

  async deletePhoto(id) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  // --- NEW: Sync Queue Methods ---

  async addToSyncQueue(item) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(SYNC_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(SYNC_STORE_NAME);
      
      const payload = {
        ...item,
        id: item.id || crypto.randomUUID(),
        timestamp: item.timestamp || Date.now(),
        retryCount: item.retryCount || 0,
        status: item.status || 'pending'
      };

      const request = store.put(payload);

      request.onsuccess = () => resolve(payload);
      request.onerror = () => reject(request.error);
    });
  }

  async getSyncQueue() {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(SYNC_STORE_NAME, 'readonly');
      const store = transaction.objectStore(SYNC_STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const items = request.result || [];
        // Sort by timestamp asc (oldest first)
        items.sort((a, b) => a.timestamp - b.timestamp);
        resolve(items);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async removeFromSyncQueue(id) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(SYNC_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(SYNC_STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async updateSyncRetry(id, retryCount, status = 'pending') {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(SYNC_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(SYNC_STORE_NAME);
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const item = getReq.result;
        if (item) {
          item.retryCount = retryCount;
          item.status = status;
          const putReq = store.put(item);
          putReq.onsuccess = () => resolve(true);
          putReq.onerror = () => reject(putReq.error);
        } else {
          resolve(false);
        }
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }
}

export const db = new ZyronDB();

```

## src/utils/imageGenerator.js
```js
/**
 * Utility to generate a ZYRON branded shareable card for social media (Stories)
 * @param {string} photoBase64 - User's captured photo
 * @param {Object} stats - Workout stats { duration, sets, dayName, dayIndex? }
 * @returns {Promise<Blob>} - Generated image blob
 *
 * LAYOUT (de baixo para cima, sem sobreposição):
 *   H - 60   → "ESTILO DE VIDA INDUSTRIAL" (tagline)
 *   H - 120  → "ZYRON" (marca d'água amarela)
 *   H - 210  → divider line
 *   H - 290  → stats row: "Xm Ys  ·  N séries"
 *   H - 370  → label: "GYM · ZYRON"
 *   H - 480  → dias da semana (7 blocos estilo Mtfit)
 *   ------
 *   Y: 100   → Título do dia (topo)
 *   Y: 195   → bar decorativa
 */
export async function generateShareableImage(photoBase64, stats) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx    = canvas.getContext('2d');

    // ── 1. Canvas 1080×1920 (Stories 9:16) ─────────────────────────────────
    const W = 1080;
    const H = 1920;
    canvas.width  = W;
    canvas.height = H;

    const img = new Image();
    img.src = photoBase64;

    img.onload = () => {
      // ── 2. Cover Image ───────────────────────────────────────────────────
      const scale   = Math.max(W / img.width, H / img.height);
      const drawW   = img.width  * scale;
      const drawH   = img.height * scale;
      const offsetX = (W - drawW) / 2;
      const offsetY = (H - drawH) / 2;
      ctx.drawImage(img, offsetX, offsetY, drawW, drawH);

      // ── 3. Gradiente inferior de contraste (Y: H - 500 → H) ─────────────────
      // Menos gradiente, apenas o suficiente para os textos na parte de baixo
      const botGrad = ctx.createLinearGradient(0, H - 500, 0, H);
      botGrad.addColorStop(0,    'rgba(0,0,0,0)');
      botGrad.addColorStop(0.6,  'rgba(0,0,0,0.6)');
      botGrad.addColorStop(1,    'rgba(0,0,0,0.9)');
      ctx.fillStyle = botGrad;
      ctx.fillRect(0, H - 500, W, 500);

      // ══════════════════════════════════════════════════════════════════════
      // CORPO REFORMULADO (CLEAN)
      // ══════════════════════════════════════════════════════════════════════

      // ── Dias da Semana estilo Mtfit (Agressive Streak) ──────────────────
      const dayLabels  = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
      const todayIdx   = stats.dayIndex ?? new Date().getDay(); // 0=Dom
      const trainedDays = stats.trainedDays || [todayIdx]; // Fallback to at least today

      const cellSize   = 100;
      const gap        = 28;
      const totalW     = dayLabels.length * cellSize + (dayLabels.length - 1) * gap;
      const startX     = (W - totalW) / 2;
      const baseY      = H - 250;

      dayLabels.forEach((lbl, i) => {
        const cx = startX + i * (cellSize + gap) + cellSize / 2;
        const cy = baseY;
        const isToday = i === todayIdx;
        const isTrained = trainedDays.includes(i);

        // Círculo de fundo
        ctx.beginPath();
        ctx.arc(cx, cy, cellSize / 2, 0, Math.PI * 2);

        if (isTrained) {
          ctx.fillStyle = '#FDE047'; // Aggressive Yellow fill for trained days
        } else {
          ctx.fillStyle = 'rgba(255,255,255,0.08)'; // Dim background for untrained
        }
        ctx.fill();

        // Borda agressiva no dia atual
        if (isToday) {
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 6;
          ctx.stroke();
        }

        // Letra do dia ou Ícone de Check
        ctx.font      = isTrained ? 'bold 44px sans-serif' : '500 38px sans-serif';
        ctx.fillStyle = isTrained ? '#000000' : 'rgba(255,255,255,0.4)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Em vez da letra, se treinou, podemos colocar um 'X' ou usar a letra forte
        ctx.fillText(isTrained ? 'X' : lbl, cx, cy + 4); 

        // Ponto embaixo contínuo para dias de série (streak)
        if (isTrained) {
          ctx.beginPath();
          ctx.arc(cx, cy + cellSize / 2 + 18, 8, 0, Math.PI * 2);
          ctx.fillStyle = '#FDE047';
          ctx.fill();
        }
      });

      // Reset textBaseline
      ctx.textBaseline = 'alphabetic';

      // ── Logo "ZYRON" ────────────────────────
      ctx.textAlign = 'center';
      ctx.font      = 'bold italic 72px sans-serif';
      ctx.fillStyle = '#FDE047';
      ctx.fillText('ZYRON', W / 2, H - 110);

      // ── Tagline ────────────────────────────────────
      ctx.font      = '400 24px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.letterSpacing = '4px';
      ctx.fillText('A FORÇA DA SUA EVOLUÇÃO.', W / 2, H - 60);

      // ── 5. Retorna Blob JPEG ───────────────────────────────────────────────
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.95);
    };

    img.onerror = reject;
  });
}

/**
 * Get current day name in PT-BR with an adjective
 */
export function getLocalizedDayName() {
  const days = [
    'Domingo Implacável',
    'Segunda Brutal',
    'Terça Intensa',
    'Quarta Destruidora',
    'Quinta Dominante',
    'Sexta Alpha',
    'Sábado de Ferro'
  ];
  return days[new Date().getDay()];
}

```

## src/utils/logger.js
```js
class ZYRONLogger {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000;
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.endpoint = '/api/logs';
  }

  // Níveis de log
  levels = {
    ERROR: 'ERROR',
    WARN: 'WARN', 
    INFO: 'INFO',
    DEBUG: 'DEBUG',
    USER_ACTION: 'USER_ACTION',
    SYSTEM_EVENT: 'SYSTEM_EVENT'
  };

  // Formatar timestamp
  getTimestamp() {
    return new Date().toISOString();
  }

  // Obter informações do usuário
  getUserInfo() {
    try {
      const user = JSON.parse(localStorage.getItem('zyron_user') || '{}');
      return {
        id: user.id || 'anonymous',
        email: user.email || 'anonymous',
        role: user.role || 'user'
      };
    } catch {
      return { id: 'anonymous', email: 'anonymous', role: 'user' };
    }
  }

  // Obter informações do dispositivo
  getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
      isPWA: window.matchMedia('(display-mode: standalone)').matches,
      screenResolution: `${screen.width}x${screen.height}`,
      language: navigator.language,
      online: navigator.onLine,
      battery: navigator.getBattery ? 'supported' : 'not-supported'
    };
  }

  // Obter informações da aplicação
  getAppInfo() {
    return {
      version: '1.1.0',
      url: window.location.href,
      path: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      referrer: document.referrer,
      timestamp: this.getTimestamp()
    };
  }

  // Criar entrada de log
  createLogEntry(level, message, data = {}, error = null) {
    const entry = {
      id: this.generateId(),
      timestamp: this.getTimestamp(),
      level,
      message,
      data,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code || null
      } : null,
      user: this.getUserInfo(),
      device: this.getDeviceInfo(),
      app: this.getAppInfo(),
      sessionId: this.getSessionId()
    };

    return entry;
  }

  // Gerar ID único
  generateId() {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Obter/criar session ID
  getSessionId() {
    let sessionId = sessionStorage.getItem('zyron_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('zyron_session_id', sessionId);
    }
    return sessionId;
  }

  // Adicionar log ao array
  addLog(entry) {
    this.logs.unshift(entry);
    
    // Manter apenas os logs mais recentes
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Salvar no localStorage
    this.saveLogsToStorage();

    // Enviar para servidor se for erro
    if (entry.level === this.levels.ERROR) {
      this.sendToServer(entry);
    }

    // Console output em desenvolvimento
    if (this.isDevelopment) {
      this.consoleOutput(entry);
    }
  }

  // Salvar logs no localStorage
  saveLogsToStorage() {
    try {
      const logsToSave = this.logs.slice(0, 100); // Salva apenas 100 logs no storage
      localStorage.setItem('zyron_logs', JSON.stringify(logsToSave));
    } catch (error) {
      console.warn('Erro ao salvar logs no localStorage:', error);
    }
  }

  // Carregar logs do localStorage
  loadLogsFromStorage() {
    try {
      const savedLogs = localStorage.getItem('zyron_logs');
      if (savedLogs) {
        this.logs = JSON.parse(savedLogs);
      }
    } catch (error) {
      console.warn('Erro ao carregar logs do localStorage:', error);
      this.logs = [];
    }
  }

  // Output no console
  consoleOutput(entry) {
    const style = {
      ERROR: 'color: #ff4444; font-weight: bold;',
      WARN: 'color: #ffaa00; font-weight: bold;',
      INFO: 'color: #4444ff; font-weight: bold;',
      DEBUG: 'color: #888888;',
      USER_ACTION: 'color: #00aa44; font-weight: bold;',
      SYSTEM_EVENT: 'color: #aa00aa; font-weight: bold;'
    };

    const css = style[entry.level] || '';
    const prefix = `[${entry.timestamp}] [${entry.level}] [${entry.user.id}]`;
    
    console.log(`%c${prefix} ${entry.message}`, css, entry);
  }

  // Enviar log para servidor
  async sendToServer(entry) {
    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry)
      });
    } catch (error) {
      console.warn('Erro ao enviar log para servidor:', error);
    }
  }

  // Métodos de log
  error(message, data = {}, error = null) {
    const entry = this.createLogEntry(this.levels.ERROR, message, data, error);
    this.addLog(entry);
    return entry;
  }

  warn(message, data = {}) {
    const entry = this.createLogEntry(this.levels.WARN, message, data);
    this.addLog(entry);
    return entry;
  }

  info(message, data = {}) {
    const entry = this.createLogEntry(this.levels.INFO, message, data);
    this.addLog(entry);
    return entry;
  }

  debug(message, data = {}) {
    const entry = this.createLogEntry(this.levels.DEBUG, message, data);
    this.addLog(entry);
    return entry;
  }

  userAction(action, data = {}) {
    const entry = this.createLogEntry(this.levels.USER_ACTION, `USER: ${action}`, data);
    this.addLog(entry);
    return entry;
  }

  systemEvent(event, data = {}) {
    const entry = this.createLogEntry(this.levels.SYSTEM_EVENT, `SYSTEM: ${event}`, data);
    this.addLog(entry);
    return entry;
  }

  // Obter logs
  getLogs(level = null, limit = 50) {
    let filteredLogs = this.logs;
    
    if (level) {
      filteredLogs = this.logs.filter(log => log.level === level);
    }
    
    return filteredLogs.slice(0, limit);
  }

  // Obter erros
  getErrors(limit = 20) {
    return this.getLogs(this.levels.ERROR, limit);
  }

  // Obter ações do usuário
  getUserActions(limit = 50) {
    return this.getLogs(this.levels.USER_ACTION, limit);
  }

  // Limpar logs
  clearLogs() {
    this.logs = [];
    localStorage.removeItem('zyron_logs');
    this.info('Logs limpos pelo usuário');
  }

  // Exportar logs
  exportLogs() {
    const dataStr = JSON.stringify(this.logs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `zyron_logs_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }

  // Inicializar
  init() {
    this.loadLogsFromStorage();
    this.systemEvent('Logger inicializado', { logsCount: this.logs.length });
    
    // Capturar erros globais
    window.addEventListener('error', (event) => {
      this.error('Erro JavaScript global', {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }, event.error);
    });

    // Capturar rejeições não tratadas
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Promise rejeitada não tratada', {
        reason: event.reason
      });
    });

    // Capturar mudanças de conexão
    window.addEventListener('online', () => {
      this.systemEvent('Conexão restaurada');
    });

    window.addEventListener('offline', () => {
      this.systemEvent('Conexão perdida');
    });
  }
}

// Instância global
const logger = new ZYRONLogger();
logger.init();

export default logger;

```

## src/utils/sanitizer.js
```js
/**
 * ZYRON Sanitizer Utility
 * Purpose: Prevent "Circular Structure" errors when saving state to LocalStorage
 * by removing non-serializable objects (React Events, DOM Nodes, etc.)
 */

export const sanitizeWorkoutState = (state) => {
  if (state === null || state === undefined) return state;

  // Handle primitives directly
  if (typeof state !== 'object') {
    return state;
  }

  // Handle arrays
  if (Array.isArray(state)) {
    return state.map(item => sanitizeWorkoutState(item));
  }

  // Handle objects
  const sanitized = {};
  
  for (const [key, value] of Object.entries(state)) {
    // Skip internal React/DOM properties
    if (key.startsWith('_') || key.startsWith('$$')) continue;

    // Detect if value is a React Event or DOM element
    if (value && typeof value === 'object') {
      // Is it a DOM Node?
      if (value instanceof Node || (typeof value.nodeType === 'number' && typeof value.nodeName === 'string')) {
        continue;
      }
      // Is it a React Synthetic Event?
      if (value.nativeEvent || value.target) {
        // Special case: if it's startSession being called by an event
        // we omit the event object entirely.
        continue;
      }
      
      // Recursive sanitization for nested objects
      sanitized[key] = sanitizeWorkoutState(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

/**
 * Specifically cleans the workout session before stringify
 */
export const cleanSessionData = (session) => {
  return {
    date: String(session.date || new Date().toDateString()),
    isTraining: Boolean(session.isTraining),
    selectedWorkoutKey: typeof session.selectedWorkoutKey === 'object' ? null : session.selectedWorkoutKey,
    completedExercises: Array.isArray(session.completedExercises) 
      ? session.completedExercises.filter(ex => typeof ex === 'string') 
      : [],
    sessionTime: Number(session.sessionTime) || 0
  };
};

```

## public/sw.js
```js
/**
 * ZYRON Service Worker v5.0.0
 * 
 * Estratégia: Network-first para assets dinâmicos, cache-first para estáticos.
 * SEM reloads automáticos. SEM heartbeat. SEM loops.
 * Detecta update e AVISA o cliente — o usuário decide quando atualizar.
 */
const CACHE_NAME = 'zyron-pwa-v5.0.0';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/images/zyron-192.png',
  '/images/zyron-512.png'
];

// ── INSTALL ─────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando', CACHE_NAME);
  self.skipWaiting(); // ativa imediatamente

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Alguns assets não foram cacheados:', err);
      });
    })
  );
});

// ── ACTIVATE ────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativado', CACHE_NAME);

  event.waitUntil(
    caches.keys().then((names) => {
      const oldCaches = names.filter((name) => name !== CACHE_NAME);
      const isRealUpdate = oldCaches.length > 0; // true = substituiu versão anterior

      return Promise.all(oldCaches.map((name) => {
        console.log('[SW] Removendo cache antigo:', name);
        return caches.delete(name);
      }))
      .then(() => self.clients.claim())
      .then(() => {
        // Só notifica UPDATE_AVAILABLE se for uma atualização real
        if (isRealUpdate) {
          return self.clients.matchAll().then((clients) => {
            clients.forEach((client) => {
              client.postMessage({
                type: 'UPDATE_AVAILABLE',
                version: CACHE_NAME,
                timestamp: Date.now()
              });
            });
          });
        }
      });
    })
  );
});

// ── FETCH ───────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignorar requests não-GET e cross-origin
  if (event.request.method !== 'GET' || url.origin !== location.origin) return;

  // API routes: sempre network (sem cache)
  if (url.pathname.startsWith('/api/')) return;

  // JS/CSS: Network-first (pega sempre do servidor, fallback pro cache)
  if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Demais assets (imagens, fontes, HTML): cache-first, refresh em background
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });

      return cached || networkFetch;
    })
  );
});

// ── MESSAGES ────────────────────────────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (!event.data) return;

  switch (event.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CLEAR_CACHE':
      caches.keys().then((names) =>
        Promise.all(names.map((n) => caches.delete(n)))
      );
      break;

    case 'GET_VERSION':
      event.source?.postMessage({
        type: 'CURRENT_VERSION',
        version: CACHE_NAME
      });
      break;
  }
});

```

