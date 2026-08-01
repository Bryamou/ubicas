import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

export function NotificationBell({ userId }: { userId: string | undefined }) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(userId);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-full p-2 text-ink-light hover:bg-surface-muted"
        aria-label="Notificaciones"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-card border border-border bg-white shadow-soft">
          <div className="flex items-center justify-between border-b border-border p-3">
            <span className="text-sm font-semibold text-ink">Notificaciones</span>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-xs font-semibold text-brand hover:underline">
                Marcar todas como leídas
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-center text-sm text-ink-light">Sin notificaciones</p>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n.id}
                  to={n.link_url ?? '#'}
                  onClick={() => {
                    if (!n.read) markAsRead(n.id);
                    setOpen(false);
                  }}
                  className={`block border-b border-border p-3 text-sm transition hover:bg-surface-muted ${
                    n.read ? '' : 'bg-brand-soft/40'
                  }`}
                >
                  <p className="font-semibold text-ink">{n.title}</p>
                  {n.body && <p className="mt-0.5 text-xs text-ink-light">{n.body}</p>}
                  <p className="mt-1 text-[10px] text-ink-light">
                    {new Date(n.created_at).toLocaleString('es-PE')}
                  </p>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
