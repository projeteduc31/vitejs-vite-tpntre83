import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 38,
        height: 38,
        borderRadius: 12,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        flexShrink: 0,
        color: 'var(--muted)',
        transition: 'all 0.18s ease',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = 'var(--surface2)';
        (e.currentTarget as HTMLElement).style.transform = 'scale(1.08)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = 'var(--surface)';
        (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
      }}
    >
      <i className="fa-solid fa-arrow-left" style={{ fontSize: 14 }} />
    </button>
  );
}

export function Avatar({
  initials,
  size = 38,
  gradient = 'linear-gradient(135deg, #4F8EF7, #7C3AED)',
}: {
  initials: string;
  size?: number;
  gradient?: string;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: gradient,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-title)',
        fontWeight: 700,
        fontSize: size * 0.35,
        color: '#fff',
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, any> = {
    active: {
      label: 'Actif',
      icon: 'fa-circle',
      color: 'var(--green)',
      bg: 'rgba(16,185,129,0.12)',
    },
    suspended: {
      label: 'Suspendu',
      icon: 'fa-clock',
      color: 'var(--amber)',
      bg: 'rgba(245,158,11,0.12)',
    },
    blocked: {
      label: 'Bloqué',
      icon: 'fa-ban',
      color: 'var(--red)',
      bg: 'rgba(239,68,68,0.12)',
    },
  };
  const c = configs[status] || configs.active;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '4px 10px',
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 500,
        background: c.bg,
        color: c.color,
      }}
    >
      <i className={`fa-solid ${c.icon}`} style={{ fontSize: 8 }} />
      {c.label}
    </span>
  );
}

export function ProgressBar({
  percent,
  color = 'linear-gradient(90deg, #4F8EF7, #7C3AED)',
}: {
  percent: number;
  color?: string;
}) {
  return (
    <div
      style={{
        height: 6,
        background: 'var(--surface2)',
        borderRadius: 4,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${Math.min(100, Math.max(0, percent))}%`,
          background: color,
          borderRadius: 4,
          transition: 'width 0.4s ease',
        }}
      />
    </div>
  );
}

export function ConfirmModal({
  isOpen,
  config,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  config: any;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!isOpen || !config) return null;
  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: 24,
          width: 340,
          animation: 'fadeUp 0.25s ease both',
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: config.iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            marginBottom: 14,
          }}
        >
          <i
            className={`fa-solid ${config.icon}`}
            style={{ color: config.iconColor }}
          />
        </div>
        <div
          style={{
            fontFamily: 'var(--font-title)',
            fontWeight: 700,
            fontSize: 16,
            marginBottom: 6,
          }}
        >
          {config.title}
        </div>
        <div
          style={{
            fontSize: 13,
            color: 'var(--muted)',
            lineHeight: 1.6,
            marginBottom: 20,
          }}
        >
          {config.description}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: 11,
              borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--muted)',
              fontFamily: 'var(--font-title)',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.18s',
            }}
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: 11,
              borderRadius: 10,
              border: 'none',
              background: config.confirmColor,
              color: '#fff',
              fontFamily: 'var(--font-title)',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.18s',
            }}
          >
            {config.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function BottomNav({
  active,
  onNavigate,
}: {
  active: string;
  onNavigate: (p: string) => void;
}) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();
      setIsAdmin(data?.is_admin || false);
    } catch (err) {}
  };

  const baseItems = [
    {
      id: 'dashboard',
      icon: 'fa-house-chimney',
      label: 'Accueil',
      color: '#4F8EF7',
    },
    {
      id: 'quiz-select',
      icon: 'fa-graduation-cap',
      label: 'Quiz',
      color: '#10B981',
    },
    {
      id: 'competition',
      icon: 'fa-ranking-star',
      label: 'Classement',
      color: '#F59E0B',
    },
    {
      id: 'profile',
      icon: 'fa-circle-user',
      label: 'Profil',
      color: '#8B5CF6',
    },
  ];

  const adminItem = {
    id: 'admin',
    icon: 'fa-shield-halved',
    label: 'Admin',
    color: '#EF4444',
  };
  const items = isAdmin ? [...baseItems, adminItem] : baseItems;

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 480,
        background: 'rgba(10,15,30,0.96)',
        backdropFilter: 'blur(24px)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-around',
        padding: '8px 0 20px',
        zIndex: 50,
      }}
    >
      {items.map((item) => {
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              padding: '6px 14px',
              borderRadius: 14,
              background: isActive ? `${item.color}18` : 'none',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
            }}
            onMouseEnter={(e) => {
              if (!isActive)
                (e.currentTarget as HTMLElement).style.transform =
                  'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              if (!isActive)
                (e.currentTarget as HTMLElement).style.transform =
                  'translateY(0)';
            }}
          >
            <div style={{ position: 'relative' }}>
              <i
                className={`fa-solid ${item.icon}`}
                style={{
                  fontSize: isActive ? 22 : 20,
                  color: isActive ? item.color : 'var(--muted)',
                  transition: 'all 0.2s ease',
                  filter: isActive
                    ? `drop-shadow(0 0 6px ${item.color}80)`
                    : 'none',
                }}
              />
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: -6,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: item.color,
                    boxShadow: `0 0 6px ${item.color}`,
                  }}
                />
              )}
            </div>
            <span
              style={{
                fontSize: 10,
                fontWeight: isActive ? 700 : 400,
                color: isActive ? item.color : 'var(--muted)',
                fontFamily: 'var(--font-title)',
                transition: 'all 0.2s ease',
                marginTop: 4,
              }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

export function WhatsAppFloat() {
  const phone = '22900000000';
  const message = encodeURIComponent(
    "Bonjour, j'ai besoin d'aide avec QuizApp EDU."
  );
  const url = `https://wa.me/${phone}?text=${message}`;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      <button className="whatsapp-float" title="Contacter le support">
        <i
          className="fa-brands fa-whatsapp"
          style={{ fontSize: 26, color: '#fff' }}
        />
      </button>
    </a>
  );
}

export function ThemeToggle({
  theme,
  onToggle,
}: {
  theme: string;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="btn-icon"
      title={
        theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'
      }
    >
      <i
        className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}
        style={{
          fontSize: 16,
          color: theme === 'dark' ? '#F59E0B' : '#6B7FA3',
          transition: 'all 0.3s ease',
        }}
      />
    </button>
  );
}
