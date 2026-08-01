import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, MessagesSquare, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useConversations, useMessages } from '@/hooks/useConversations';
import { Navbar } from '@/components/Navbar';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';

export function MessagesPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { conversations, loading: loadingConversations, refresh: refreshConversations } = useConversations(user?.id);

  const activeId = searchParams.get('conversation') ?? undefined;
  const { messages, loading: loadingMessages, sendMessage } = useMessages(activeId, user?.id);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const activeConversation = conversations.find((c) => c.id === activeId);

  const openConversation = (id: string) => setSearchParams({ conversation: id });
  const backToList = () => setSearchParams({}, { replace: true });

  const handleSend = async () => {
    if (!draft.trim()) return;
    setSending(true);
    await sendMessage(draft);
    setDraft('');
    setSending(false);
    refreshConversations();
  };

  return (
    <div className="min-h-screen bg-surface-muted">
      <Navbar />
      <div className="mx-auto flex h-[calc(100vh-80px)] max-w-6xl">
        {/* Lista de conversaciones: en móvil se oculta apenas hay una
            conversación activa (patrón típico de apps de chat) */}
        <div
          className={`w-full shrink-0 overflow-y-auto border-r border-border bg-white sm:block sm:w-80 ${
            activeId ? 'hidden sm:block' : 'block'
          }`}
        >
          <div className="border-b border-border p-4">
            <h1 className="text-lg font-bold text-ink">Mensajes</h1>
          </div>
          {loadingConversations ? (
            <LoadingState label="Cargando conversaciones…" />
          ) : conversations.length === 0 ? (
            <div className="p-4">
              <EmptyState icon={<MessagesSquare size={24} />} title="Sin conversaciones aún" />
            </div>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => openConversation(c.id)}
                className={`flex w-full flex-col gap-0.5 border-b border-border p-4 text-left transition hover:bg-surface-muted ${
                  c.id === activeId ? 'bg-brand-soft' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-ink">{c.otherUserName}</span>
                  {c.unreadCount > 0 && (
                    <span className="rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {c.unreadCount}
                    </span>
                  )}
                </div>
                {c.propertyTitle && <span className="truncate text-xs text-ink-light">{c.propertyTitle}</span>}
                {c.lastMessage && <span className="truncate text-xs text-ink-light">{c.lastMessage}</span>}
              </button>
            ))
          )}
        </div>

        {/* Hilo activo: en móvil solo se muestra cuando hay una
            conversación seleccionada, con botón de volver a la lista */}
        <div className={`flex-1 flex-col sm:flex ${activeId ? 'flex' : 'hidden'}`}>
          {!activeConversation ? (
            <div className="flex flex-1 items-center justify-center text-sm text-ink-light">
              Selecciona una conversación
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 border-b border-border bg-white p-4">
                <button onClick={backToList} className="p-1 text-ink-light hover:text-ink sm:hidden" aria-label="Volver">
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <p className="font-semibold text-ink">{activeConversation.otherUserName}</p>
                  {activeConversation.propertyTitle && (
                    <p className="text-xs text-ink-light">{activeConversation.propertyTitle}</p>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {loadingMessages ? (
                  <LoadingState label="Cargando mensajes…" />
                ) : (
                  <div className="flex flex-col gap-2">
                    {messages.map((m) => (
                      <div
                        key={m.id}
                        className={`max-w-[85%] rounded-card px-3 py-2 text-sm sm:max-w-[70%] ${
                          m.sender_id === user?.id
                            ? 'ml-auto bg-brand text-white'
                            : 'bg-white text-ink shadow-card'
                        }`}
                      >
                        {m.body}
                        <div className={`mt-1 text-[10px] ${m.sender_id === user?.id ? 'text-white/70' : 'text-ink-light'}`}>
                          {new Date(m.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 border-t border-border bg-white p-3 sm:p-4">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Escribe un mensaje…"
                  className="h-11 min-w-0 flex-1 rounded-input border border-border px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
                <Button variant="primary" icon={<Send size={16} />} onClick={handleSend} loading={sending}>
                  <span className="hidden sm:inline">Enviar</span>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
