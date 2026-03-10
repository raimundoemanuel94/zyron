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
