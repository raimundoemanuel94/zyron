import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { profileService } from '../../core/profile/profileService';
import { supabase } from '../../lib/supabase';
import { ShieldAlert, Cpu, Dumbbell } from 'lucide-react';

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
        const profile = await profileService.getProfile(user.id);

        if (!profile) {
          console.warn('[RBACGuard] Perfil não encontrado. Criando perfil padrão...');
          const success = await profileService.createProfile(user.id, {
            email: user.email,
            role: 'USER',
            name: user.user_metadata?.name || 'ATLETA'
          });

          if (!success) throw new Error("Falha ao criar perfil inicial.");
          onRoleVerified('USER');
        } else {
          console.log('[RBACGuard] Role fetched via service:', profile?.role);
          onRoleVerified(profile?.role || 'USER');
        }
      } catch (err) {
        console.error('[RBACGuard] Erro na verificação:', err);
        setError(`Erro: ${err.message || 'Falha na validação de privilégios'}`);
      } finally {
        setTimeout(() => setVerifying(false), 2000); // Reduzido para 2s para melhor UX
      }
    }

    verifyRole();
  }, [user]);

  if (verifying) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-10 flex justify-center">
          <div className="absolute inset-0 bg-yellow-500/20 blur-[50px] animate-pulse rounded-full w-32 h-32 ml-auto mr-auto" />
          <motion.div 
            animate={{ scale: [1, 1.15, 1], rotate: [-5, 5, -5] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="relative p-6 bg-neutral-900 border border-white/5 shadow-[0_0_40px_rgba(253,224,71,0.15)] rounded-3xl"
          >
            <Dumbbell className="text-yellow-400 drop-shadow-[0_0_15px_rgba(253,224,71,0.6)]" size={64} />
          </motion.div>
        </div>
        
        <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter mb-4 drop-shadow-lg">
          FORJANDO<br/><span className="text-yellow-400">RESULTADOS...</span>
        </h2>
        
        <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden mb-6 relative">
          <motion.div
            className="absolute top-0 left-0 h-full w-24 bg-linear-to-r from-transparent via-yellow-400 to-transparent blur-[1px]"
            animate={{ x: [-100, 250] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            style={{ boxShadow: '0 0 10px rgba(253,224,71,0.5)' }}
          />
        </div>
        
        <p className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.3em] max-w-xs">
          Sincronizando banco de dados de performance
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
