import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { profileService } from '../../core/profile/profileService';
import { supabase } from '../../lib/supabase';
import { ShieldAlert } from 'lucide-react';

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
        setTimeout(() => setVerifying(false), 2700); // Um pouco mais de tempo para reforçar o visual premium
      }
    }

    verifyRole();
  }, [user]);

  if (verifying) {
    return (
      <div className="fixed inset-0 z-50 overflow-hidden bg-black text-center">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center opacity-22"
          style={{ backgroundImage: "url('/images/zyron-hero-impact.png')" }}
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/52 via-black/76 to-black/95" />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.32 }}
          transition={{ duration: 0.45 }}
          className="absolute inset-0 z-0"
          style={{
            background:
              'radial-gradient(circle at 18% 16%, rgba(253,200,0,0.16), transparent 42%), radial-gradient(circle at 82% 84%, rgba(255,255,255,0.08), transparent 42%)',
          }}
        />

        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
            className="w-full flex flex-col items-center"
          >
            <motion.svg
              width="58"
              height="58"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="mb-5"
              animate={{ y: [0, -2, 0], opacity: [0.82, 1, 0.82] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <path d="M10 32L22 8H30L18 32H10Z" fill="#FDC800" />
              <path d="M22 32L34 8H26L14 32H22Z" fill="#FDC800" fillOpacity="0.7" />
            </motion.svg>

            <h2 className="mb-1 text-[34px] font-black italic uppercase tracking-tight text-white drop-shadow-2xl">
              ZYRON
            </h2>
            <p className="mb-6 text-[10px] font-bold uppercase tracking-[0.26em] text-white/55">
              Preparando seu painel
            </p>

            <div className="mb-4 flex items-center gap-2.5">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className={`h-2.5 w-2.5 rounded-full ${i === 1 ? "bg-[#FDC800]" : "bg-white/85"}`}
                  animate={{ y: [0, -8, 0], opacity: [0.35, 1, 0.35], scale: [0.94, 1, 0.94] }}
                  transition={{ duration: 0.66, repeat: Infinity, delay: i * 0.16, ease: "easeInOut" }}
                  style={i === 1 ? { boxShadow: "0 0 10px rgba(253,200,0,0.45)" } : undefined}
                />
              ))}
            </div>

            <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-white/42">Carregando</p>
          </motion.div>
        </div>
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
