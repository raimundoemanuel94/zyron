/**
 * NOTIFICATION SHEET
 * Displays unread notifications in a side panel
 * Allows user to mark notifications as read
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, Bell, Trash2 } from 'lucide-react';
import { notifications } from '../services/persistenceService';

export default function NotificationSheet({ userId, isOpen, onClose }) {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load unread notifications
  useEffect(() => {
    if (!isOpen || !userId) return;

    const loadNotifications = async () => {
      try {
        setLoading(true);
        const unread = await notifications.getUnreadNotifications(userId);
        setNotifs(unread || []);
      } catch (err) {
        console.error('Failed to load notifications:', err);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, [isOpen, userId]);

  // Mark notification as read
  const handleMarkAsRead = async (notifId) => {
    try {
      await notifications.markAsRead(notifId);
      setNotifs(prev => prev.filter(n => n.id !== notifId));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[99] backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-neutral-950 z-[100] flex flex-col overflow-hidden"
            style={{
              borderLeft: '1px solid rgba(255,255,255,0.07)',
              boxShadow: '-16px 0 48px rgba(0,0,0,0.9)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/15">
                  <Bell size={16} style={{ color: '#7DA1FF' }} />
                </div>
                <h2 className="font-black uppercase tracking-tight text-white text-lg">
                  Notificações
                </h2>
              </div>
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <X size={16} style={{ color: 'rgba(255,255,255,0.6)' }} />
              </button>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-pulse text-neutral-600 text-sm">Carregando...</div>
                </div>
              )}

              {notifs.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bell size={32} style={{ color: 'rgba(255,255,255,0.20)' }} className="mb-3" />
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.30)' }}>
                    Nenhuma notificação
                  </p>
                </div>
              )}

              {notifs.map((notif, idx) => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-4 rounded-lg transition-colors"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-black uppercase text-xs tracking-widest text-white flex-1">
                      {notif.title || 'Notificação'}
                    </h3>
                    <button
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="flex h-6 w-6 items-center justify-center rounded transition-colors shrink-0"
                      style={{ background: 'rgba(255,255,255,0.05)' }}
                      title="Marcar como lida"
                    >
                      <CheckCircle2 size={14} style={{ color: 'rgba(255,255,255,0.40)' }} />
                    </button>
                  </div>

                  <p className="text-[11px] leading-relaxed font-semibold" style={{ color: 'rgba(255,255,255,0.60)' }}>
                    {notif.message || 'Sem conteúdo'}
                  </p>

                  <p className="text-[9px] mt-2 uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>
                    {new Date(notif.created_at).toLocaleDateString('pt-BR')} às{' '}
                    {new Date(notif.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/10 shrink-0 text-center">
              <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.30)' }}>
                Zyron Notifications
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
