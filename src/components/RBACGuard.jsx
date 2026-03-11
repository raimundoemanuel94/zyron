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
