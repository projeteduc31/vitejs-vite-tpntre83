import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

type AdminTab = 'overview' | 'users' | 'universities' | 'notifications' | 'pdf';

export default function AdminDashboard({
  onNavigate,
}: {
  onNavigate: (p: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    users: 0,
    sessions: 0,
    competitions: 0,
    todayActive: 0,
  });

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        onNavigate('dashboard');
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();
      if (!profile?.is_admin) {
        onNavigate('dashboard');
        return;
      }
      setIsAdmin(true);
      loadStats();
    } catch (err) {
      onNavigate('dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    const [{ count: users }, { count: sessions }, { count: competitions }] =
      await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase
          .from('quiz_sessions')
          .select('*', { count: 'exact', head: true }),
        supabase
          .from('competitions')
          .select('*', { count: 'exact', head: true }),
      ]);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: todayActive } = await supabase
      .from('quiz_sessions')
      .select('*', { count: 'exact', head: true })
      .gte('played_at', today.toISOString());
    setStats({
      users: users || 0,
      sessions: sessions || 0,
      competitions: competitions || 0,
      todayActive: todayActive || 0,
    });
  };

  if (loading)
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <i
          className="fa-solid fa-spinner fa-spin"
          style={{ fontSize: 28, color: 'var(--accent)' }}
        />
      </div>
    );
  if (!isAdmin) return null;

  const TABS: { id: AdminTab; label: string; icon: string }[] = [
    { id: 'overview', label: "Vue d'ensemble", icon: 'fa-chart-pie' },
    { id: 'users', label: 'Utilisateurs', icon: 'fa-users' },
    { id: 'universities', label: 'Universités', icon: 'fa-university' },
    { id: 'notifications', label: 'Annonces', icon: 'fa-bell' },
    { id: 'pdf', label: 'Upload PDF', icon: 'fa-file-pdf' },
  ];

  return (
    <div
      style={{
        maxWidth: 480,
        margin: '0 auto',
        minHeight: '100vh',
        paddingBottom: 40,
      }}
    >
      <div className="bg-glow" />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '24px 20px 0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => onNavigate('dashboard')}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--muted)',
                transition: 'all 0.18s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform =
                  'scale(1.08)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
              }}
            >
              <i className="fa-solid fa-arrow-left" style={{ fontSize: 13 }} />
            </button>
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-title)',
                  fontWeight: 800,
                  fontSize: 18,
                  background: 'linear-gradient(135deg, #4F8EF7, #7C3AED)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Admin Dashboard
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                Panneau d'administration
              </div>
            </div>
          </div>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #EF4444, #DC2626)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <i
              className="fa-solid fa-shield-halved"
              style={{ fontSize: 14, color: '#fff' }}
            />
          </div>
        </div>

        <div
          style={{
            overflowX: 'auto',
            scrollbarWidth: 'none',
            display: 'flex',
            gap: 8,
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 14px',
                borderRadius: 20,
                fontFamily: 'var(--font-title)',
                fontWeight: 600,
                fontSize: 12,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.2s',
                background:
                  activeTab === tab.id
                    ? 'linear-gradient(135deg, #4F8EF7, #7C3AED)'
                    : 'var(--surface)',
                border: `1px solid ${
                  activeTab === tab.id ? 'transparent' : 'var(--border)'
                }`,
                color: activeTab === tab.id ? '#fff' : 'var(--muted)',
                boxShadow:
                  activeTab === tab.id
                    ? '0 4px 12px rgba(79,142,247,0.3)'
                    : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <i className={`fa-solid ${tab.icon}`} style={{ fontSize: 11 }} />{' '}
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '20px 20px 0' }}>
          {activeTab === 'overview' && <OverviewTab stats={stats} />}
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'universities' && <UniversitiesTab />}
          {activeTab === 'notifications' && <NotificationsTab />}
          {activeTab === 'pdf' && <PdfTab />}
        </div>
      </div>
    </div>
  );
}

function Msg({ type, text }: { type: 'success' | 'error'; text: string }) {
  return (
    <div
      style={{
        background:
          type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
        border: `1px solid ${
          type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'
        }`,
        borderRadius: 10,
        padding: '10px 14px',
        fontSize: 13,
        color: type === 'success' ? 'var(--green)' : 'var(--red)',
        marginBottom: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <i
        className={`fa-solid ${
          type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'
        }`}
      />{' '}
      {text}
    </div>
  );
}

function Label({ text }: { text: string }) {
  return (
    <label
      style={{
        display: 'block',
        fontSize: 11,
        color: 'var(--muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginBottom: 5,
      }}
    >
      {text}
    </label>
  );
}

function SectionTitle({
  icon,
  color,
  text,
}: {
  icon: string;
  color: string;
  text: string;
}) {
  return (
    <div
      style={{
        fontFamily: 'var(--font-title)',
        fontWeight: 700,
        fontSize: 14,
        marginBottom: 12,
        marginTop: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <i className={`fa-solid ${icon}`} style={{ color, fontSize: 13 }} />{' '}
      {text}
    </div>
  );
}

// ─── TAB : Vue d'ensemble ─────────────────────────────────────
function OverviewTab({ stats }: { stats: any }) {
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);

  useEffect(() => {
    loadRecent();
  }, []);

  const loadRecent = async () => {
    const { data: users } = await supabase
      .from('profiles')
      .select('full_name, username, email, created_at, program, is_suspended')
      .order('created_at', { ascending: false })
      .limit(5);
    setRecentUsers(users || []);
    const { data: sessions } = await supabase
      .from('quiz_sessions')
      .select(
        'subject_name, score, total, played_at, profiles:user_id(full_name, username)'
      )
      .order('played_at', { ascending: false })
      .limit(5);
    setRecentSessions(sessions || []);
  };

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          marginBottom: 24,
        }}
      >
        {[
          {
            value: stats.users,
            label: 'Inscrits total',
            icon: 'fa-users',
            color: 'var(--accent)',
            bg: 'rgba(79,142,247,0.1)',
          },
          {
            value: stats.todayActive,
            label: "Actifs aujourd'hui",
            icon: 'fa-bolt',
            color: 'var(--green)',
            bg: 'rgba(16,185,129,0.1)',
          },
          {
            value: stats.sessions,
            label: 'Quiz passés total',
            icon: 'fa-circle-play',
            color: 'var(--amber)',
            bg: 'rgba(245,158,11,0.1)',
          },
          {
            value: stats.competitions,
            label: 'Compétitions',
            icon: 'fa-ranking-star',
            color: '#F87171',
            bg: 'rgba(239,68,68,0.1)',
          },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '16px 14px',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.transform =
                'translateY(-2px)')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.transform =
                'translateY(0)')
            }
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: s.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 10,
              }}
            >
              <i
                className={`fa-solid ${s.icon}`}
                style={{ fontSize: 15, color: s.color }}
              />
            </div>
            <div
              style={{
                fontFamily: 'var(--font-title)',
                fontWeight: 800,
                fontSize: 26,
                color: s.color,
              }}
            >
              {s.value}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <SectionTitle
        icon="fa-user-plus"
        color="var(--accent)"
        text="Derniers inscrits"
      />
      {recentUsers.map((u, idx) => (
        <div
          key={idx}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '12px 14px',
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #4F8EF7, #7C3AED)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-title)',
              fontWeight: 700,
              fontSize: 13,
              color: '#fff',
              flexShrink: 0,
            }}
          >
            {(u.username || u.full_name || '?')[0].toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>
              {u.full_name}
              {u.is_suspended && (
                <span
                  style={{
                    fontSize: 10,
                    background: 'rgba(239,68,68,0.1)',
                    color: 'var(--red)',
                    padding: '2px 6px',
                    borderRadius: 5,
                    marginLeft: 6,
                  }}
                >
                  Suspendu
                </span>
              )}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>
              {u.username && (
                <span style={{ color: 'var(--accent)', marginRight: 6 }}>
                  @{u.username}
                </span>
              )}
              {u.program || u.email}
            </div>
          </div>
          <div style={{ fontSize: 10, color: 'var(--muted)' }}>
            {new Date(u.created_at).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
            })}
          </div>
        </div>
      ))}

      <SectionTitle
        icon="fa-clock-rotate-left"
        color="var(--green)"
        text="Dernières sessions"
      />
      {recentSessions.map((s: any, idx: number) => (
        <div
          key={idx}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '12px 14px',
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>
              {s.subject_name}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>
              {s.profiles?.username || s.profiles?.full_name || 'Anonyme'} ·{' '}
              {new Date(s.played_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
          <div
            style={{
              fontFamily: 'var(--font-title)',
              fontWeight: 700,
              fontSize: 14,
              color:
                (s.score / s.total) * 20 >= 10 ? 'var(--green)' : 'var(--red)',
              background:
                (s.score / s.total) * 20 >= 10
                  ? 'rgba(16,185,129,0.1)'
                  : 'rgba(239,68,68,0.1)',
              padding: '4px 10px',
              borderRadius: 8,
            }}
          >
            {Math.round((s.score / s.total) * 20 * 10) / 10}/20
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── TAB : Utilisateurs ───────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select(
        'id, full_name, username, email, program, level, faculty, created_at, streak_days, is_admin, is_suspended'
      )
      .order('created_at', { ascending: false });
    setUsers(data || []);
    setLoading(false);
  };

  const toggleAdmin = async (id: string, cur: boolean) => {
    await supabase.from('profiles').update({ is_admin: !cur }).eq('id', id);
    setSuccess('Rôle mis à jour !');
    loadUsers();
  };
  const toggleSuspend = async (id: string, cur: boolean) => {
    await supabase.from('profiles').update({ is_suspended: !cur }).eq('id', id);
    setSuccess(cur ? 'Réactivé.' : 'Suspendu.');
    loadUsers();
  };
  const deleteUser = async (id: string, name: string) => {
    if (!confirm(`Supprimer ${name} ?`)) return;
    await supabase.from('profiles').delete().eq('id', id);
    setSuccess('Supprimé.');
    loadUsers();
  };

  const filtered = users.filter(
    (u) =>
      (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.username || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'var(--surface)',
          border: '1.5px solid var(--border)',
          borderRadius: 12,
          padding: '10px 14px',
          marginBottom: 14,
        }}
      >
        <i
          className="fa-solid fa-magnifying-glass"
          style={{ color: 'var(--muted)', fontSize: 13 }}
        />
        <input
          style={{
            flex: 1,
            background: 'none',
            border: 'none',
            outline: 'none',
            color: 'var(--text)',
            fontSize: 13,
            fontFamily: 'var(--font-body)',
          }}
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div
        style={{
          background: 'rgba(79,142,247,0.06)',
          border: '1px solid rgba(79,142,247,0.15)',
          borderRadius: 10,
          padding: '10px 14px',
          marginBottom: 14,
          fontSize: 12,
          color: 'var(--muted)',
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <span>
          <i
            className="fa-solid fa-users"
            style={{ color: 'var(--accent)', marginRight: 5 }}
          />
          {users.length} inscrits
        </span>
        <span>
          <i
            className="fa-solid fa-shield-halved"
            style={{ color: 'var(--amber)', marginRight: 5 }}
          />
          {users.filter((u) => u.is_admin).length} admins
        </span>
        <span>
          <i
            className="fa-solid fa-ban"
            style={{ color: 'var(--red)', marginRight: 5 }}
          />
          {users.filter((u) => u.is_suspended).length} suspendus
        </span>
      </div>
      {success && <Msg type="success" text={success} />}
      {error && <Msg type="error" text={error} />}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}>
          <i
            className="fa-solid fa-spinner fa-spin"
            style={{ fontSize: 20, color: 'var(--accent)' }}
          />
        </div>
      ) : (
        filtered.map((u, idx) => (
          <div
            key={u.id}
            style={{
              background: u.is_suspended
                ? 'rgba(239,68,68,0.04)'
                : 'var(--surface)',
              border: `1px solid ${
                u.is_suspended ? 'rgba(239,68,68,0.15)' : 'var(--border)'
              }`,
              borderRadius: 'var(--radius)',
              padding: 14,
              marginBottom: 10,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: u.is_admin
                    ? 'linear-gradient(135deg, #F59E0B, #D97706)'
                    : u.is_suspended
                    ? 'linear-gradient(135deg, #6B7280, #4B5563)'
                    : 'linear-gradient(135deg, #4F8EF7, #7C3AED)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-title)',
                  fontWeight: 700,
                  fontSize: 14,
                  color: '#fff',
                  flexShrink: 0,
                }}
              >
                {(u.username || u.full_name || '?')[0].toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    flexWrap: 'wrap',
                  }}
                >
                  {u.full_name}
                  {u.is_admin && (
                    <span
                      style={{
                        fontSize: 10,
                        background: 'rgba(245,158,11,0.15)',
                        color: 'var(--amber)',
                        padding: '2px 6px',
                        borderRadius: 5,
                      }}
                    >
                      Admin
                    </span>
                  )}
                  {u.is_suspended && (
                    <span
                      style={{
                        fontSize: 10,
                        background: 'rgba(239,68,68,0.1)',
                        color: 'var(--red)',
                        padding: '2px 6px',
                        borderRadius: 5,
                      }}
                    >
                      Suspendu
                    </span>
                  )}
                </div>
                <div
                  style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}
                >
                  {u.username && (
                    <span style={{ color: 'var(--accent)', marginRight: 6 }}>
                      @{u.username}
                    </span>
                  )}
                  {u.email}
                </div>
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                gap: 6,
                flexWrap: 'wrap',
                marginBottom: 12,
              }}
            >
              {u.program && (
                <span
                  style={{
                    fontSize: 10,
                    padding: '3px 8px',
                    borderRadius: 6,
                    background: 'rgba(79,142,247,0.1)',
                    color: 'var(--accent)',
                  }}
                >
                  {u.program}
                </span>
              )}
              {u.level && (
                <span
                  style={{
                    fontSize: 10,
                    padding: '3px 8px',
                    borderRadius: 6,
                    background: 'rgba(16,185,129,0.1)',
                    color: 'var(--green)',
                  }}
                >
                  {u.level}
                </span>
              )}
              {u.streak_days > 0 && (
                <span
                  style={{
                    fontSize: 10,
                    padding: '3px 8px',
                    borderRadius: 6,
                    background: 'rgba(245,158,11,0.1)',
                    color: 'var(--amber)',
                  }}
                >
                  🔥 {u.streak_days}j
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => toggleSuspend(u.id, u.is_suspended)}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  borderRadius: 8,
                  border: `1px solid ${
                    u.is_suspended
                      ? 'rgba(16,185,129,0.3)'
                      : 'rgba(239,68,68,0.2)'
                  }`,
                  background: u.is_suspended
                    ? 'rgba(16,185,129,0.1)'
                    : 'rgba(239,68,68,0.08)',
                  color: u.is_suspended ? 'var(--green)' : 'var(--red)',
                  fontSize: 11,
                  fontFamily: 'var(--font-title)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.18s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                }}
              >
                <i
                  className={`fa-solid ${
                    u.is_suspended ? 'fa-circle-check' : 'fa-ban'
                  }`}
                />
                {u.is_suspended ? 'Réactiver' : 'Suspendre'}
              </button>
              <button
                onClick={() => toggleAdmin(u.id, u.is_admin)}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  borderRadius: 8,
                  border: `1px solid ${
                    u.is_admin ? 'rgba(245,158,11,0.3)' : 'var(--border)'
                  }`,
                  background: u.is_admin
                    ? 'rgba(245,158,11,0.1)'
                    : 'var(--surface2)',
                  color: u.is_admin ? 'var(--amber)' : 'var(--muted)',
                  fontSize: 11,
                  fontFamily: 'var(--font-title)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.18s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                }}
              >
                <i className="fa-solid fa-shield-halved" />
                {u.is_admin ? 'Retirer admin' : 'Rendre admin'}
              </button>
              <button
                onClick={() => deleteUser(u.id, u.full_name)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(239,68,68,0.2)',
                  background: 'rgba(239,68,68,0.08)',
                  color: 'var(--red)',
                  fontSize: 11,
                  cursor: 'pointer',
                  transition: 'all 0.18s',
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.background =
                    'rgba(239,68,68,0.18)')
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.background =
                    'rgba(239,68,68,0.08)')
                }
              >
                <i className="fa-solid fa-trash" />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ─── TAB : Universités ────────────────────────────────────────
function UniversitiesTab() {
  const [universities, setUniversities] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [expandedUni, setExpandedUni] = useState<string | null>(null);
  const [expandedFac, setExpandedFac] = useState<string | null>(null);
  const [uniForm, setUniForm] = useState({ name: '', city: '', country: '' });
  const [facForm, setFacForm] = useState({ name: '', university_id: '' });
  const [progForm, setProgForm] = useState({ name: '', faculty_id: '' });
  const [editUni, setEditUni] = useState<any>(null);
  const [editFac, setEditFac] = useState<any>(null);
  const [editProg, setEditProg] = useState<any>(null);
  const [showUniForm, setShowUniForm] = useState(false);
  const [showFacForm, setShowFacForm] = useState<string | null>(null);
  const [showProgForm, setShowProgForm] = useState<string | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    const [{ data: unis }, { data: facs }, { data: progs }] = await Promise.all(
      [
        supabase.from('universities').select('*').order('name'),
        supabase.from('faculties').select('*').order('name'),
        supabase.from('programs').select('*').order('name'),
      ]
    );
    setUniversities(unis || []);
    setFaculties(facs || []);
    setPrograms(progs || []);
    setLoading(false);
  };

  const saveUni = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      if (editUni) {
        await supabase
          .from('universities')
          .update(uniForm)
          .eq('id', editUni.id);
        setSuccess('Université mise à jour !');
      } else {
        await supabase.from('universities').insert(uniForm);
        setSuccess('Université ajoutée !');
      }
      setUniForm({ name: '', city: '', country: '' });
      setEditUni(null);
      setShowUniForm(false);
      loadAll();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const saveFac = async (e: React.FormEvent, uniId: string) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      if (editFac) {
        await supabase
          .from('faculties')
          .update({ name: facForm.name })
          .eq('id', editFac.id);
        setSuccess('Faculté mise à jour !');
      } else {
        await supabase
          .from('faculties')
          .insert({ name: facForm.name, university_id: uniId });
        setSuccess('Faculté ajoutée !');
      }
      setFacForm({ name: '', university_id: '' });
      setEditFac(null);
      setShowFacForm(null);
      loadAll();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const saveProg = async (e: React.FormEvent, facId: string) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      if (editProg) {
        await supabase
          .from('programs')
          .update({ name: progForm.name })
          .eq('id', editProg.id);
        setSuccess('Filière mise à jour !');
      } else {
        await supabase
          .from('programs')
          .insert({ name: progForm.name, faculty_id: facId });
        setSuccess('Filière ajoutée !');
      }
      setProgForm({ name: '', faculty_id: '' });
      setEditProg(null);
      setShowProgForm(null);
      loadAll();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteUni = async (id: string) => {
    if (!confirm('Supprimer cette université ?')) return;
    await supabase.from('universities').delete().eq('id', id);
    setSuccess('Supprimé.');
    loadAll();
  };
  const deleteFac = async (id: string) => {
    if (!confirm('Supprimer cette faculté ?')) return;
    await supabase.from('faculties').delete().eq('id', id);
    setSuccess('Supprimé.');
    loadAll();
  };
  const deleteProg = async (id: string) => {
    if (!confirm('Supprimer cette filière ?')) return;
    await supabase.from('programs').delete().eq('id', id);
    setSuccess('Supprimé.');
    loadAll();
  };

  const miniBtn = (
    label: string,
    icon: string,
    onClick: () => void,
    color = 'var(--accent)',
    bg = 'rgba(79,142,247,0.1)'
  ) => (
    <button
      onClick={onClick}
      style={{
        padding: '5px 10px',
        borderRadius: 7,
        border: `1px solid ${bg}`,
        background: bg,
        color,
        fontSize: 11,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        fontFamily: 'var(--font-title)',
        fontWeight: 600,
        transition: 'all 0.18s',
      }}
      onMouseEnter={(e) =>
        ((e.currentTarget as HTMLElement).style.filter = 'brightness(1.15)')
      }
      onMouseLeave={(e) =>
        ((e.currentTarget as HTMLElement).style.filter = 'brightness(1)')
      }
    >
      <i className={`fa-solid ${icon}`} style={{ fontSize: 10 }} /> {label}
    </button>
  );

  return (
    <div>
      {success && <Msg type="success" text={success} />}
      {error && <Msg type="error" text={error} />}

      <button
        onClick={() => {
          setShowUniForm(!showUniForm);
          setEditUni(null);
          setUniForm({ name: '', city: '', country: '' });
        }}
        style={{
          width: '100%',
          padding: 12,
          borderRadius: 12,
          border: '1.5px dashed var(--border)',
          background: 'transparent',
          color: 'var(--accent)',
          fontFamily: 'var(--font-title)',
          fontWeight: 600,
          fontSize: 13,
          cursor: 'pointer',
          marginBottom: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          transition: 'all 0.18s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background =
            'rgba(79,142,247,0.05)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = 'transparent';
        }}
      >
        <i className="fa-solid fa-plus" />{' '}
        {showUniForm ? 'Annuler' : 'Ajouter une université'}
      </button>

      {showUniForm && (
        <form
          onSubmit={saveUni}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: 16,
            marginBottom: 14,
            animation: 'fadeUp 0.3s ease both',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-title)',
              fontWeight: 600,
              fontSize: 14,
              marginBottom: 12,
            }}
          >
            {editUni ? 'Modifier' : 'Nouvelle université'}
          </div>
          {[
            {
              key: 'name',
              label: 'Nom',
              placeholder: "Université d'Abomey-Calavi",
            },
            { key: 'city', label: 'Ville', placeholder: 'Cotonou' },
            { key: 'country', label: 'Pays', placeholder: 'Bénin' },
          ].map((f) => (
            <div key={f.key} style={{ marginBottom: 10 }}>
              <Label text={f.label} />
              <input
                className="form-input"
                type="text"
                placeholder={f.placeholder}
                value={(uniForm as any)[f.key]}
                onChange={(e) =>
                  setUniForm((p) => ({ ...p, [f.key]: e.target.value }))
                }
                required={f.key === 'name'}
              />
            </div>
          ))}
          <button type="submit" className="btn-primary">
            <i
              className={`fa-solid ${editUni ? 'fa-floppy-disk' : 'fa-plus'}`}
            />{' '}
            {editUni ? 'Sauvegarder' : 'Ajouter'}
          </button>
        </form>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}>
          <i
            className="fa-solid fa-spinner fa-spin"
            style={{ fontSize: 20, color: 'var(--accent)' }}
          />
        </div>
      ) : (
        universities.map((uni, idx) => {
          const uniFacs = faculties.filter((f) => f.university_id === uni.id);
          const isExpanded = expandedUni === uni.id;
          return (
            <div key={uni.id} style={{ marginBottom: 10 }}>
              <div
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: isExpanded ? '12px 12px 0 0' : 12,
                  padding: '13px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'rgba(79,142,247,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <i
                    className="fa-solid fa-university"
                    style={{ fontSize: 14, color: 'var(--accent)' }}
                  />
                </div>
                <div
                  style={{ flex: 1, cursor: 'pointer' }}
                  onClick={() => setExpandedUni(isExpanded ? null : uni.id)}
                >
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {uni.name}
                  </div>
                  {(uni.city || uni.country) && (
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--muted)',
                        marginTop: 1,
                      }}
                    >
                      {[uni.city, uni.country].filter(Boolean).join(' · ')}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      fontSize: 10,
                      background: 'rgba(79,142,247,0.1)',
                      color: 'var(--accent)',
                      padding: '2px 7px',
                      borderRadius: 5,
                    }}
                  >
                    {uniFacs.length} fac.
                  </span>
                  <button
                    onClick={() => {
                      setEditUni(uni);
                      setUniForm({
                        name: uni.name,
                        city: uni.city || '',
                        country: uni.country || '',
                      });
                      setShowUniForm(true);
                      window.scrollTo(0, 0);
                    }}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 7,
                      border: '1px solid var(--border)',
                      background: 'var(--surface2)',
                      color: 'var(--muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      transition: 'all 0.18s',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.color =
                        'var(--accent)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.color =
                        'var(--muted)';
                    }}
                  >
                    <i className="fa-solid fa-pen" />
                  </button>
                  <button
                    onClick={() => deleteUni(uni.id)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 7,
                      border: '1px solid rgba(239,68,68,0.2)',
                      background: 'rgba(239,68,68,0.08)',
                      color: 'var(--red)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      transition: 'all 0.18s',
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLElement).style.background =
                        'rgba(239,68,68,0.18)')
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.background =
                        'rgba(239,68,68,0.08)')
                    }
                  >
                    <i className="fa-solid fa-trash" />
                  </button>
                  <i
                    className={`fa-solid fa-chevron-${
                      isExpanded ? 'up' : 'down'
                    }`}
                    style={{
                      fontSize: 11,
                      color: 'var(--muted)',
                      cursor: 'pointer',
                      marginLeft: 4,
                    }}
                    onClick={() => setExpandedUni(isExpanded ? null : uni.id)}
                  />
                </div>
              </div>

              {isExpanded && (
                <div
                  style={{
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    borderTop: 'none',
                    borderRadius: '0 0 12px 12px',
                    padding: '10px 12px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--muted)',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      <i
                        className="fa-solid fa-building-columns"
                        style={{ marginRight: 5, color: 'var(--accent)' }}
                      />
                      Facultés
                    </div>
                    {miniBtn('Ajouter', 'fa-plus', () => {
                      setShowFacForm(showFacForm === uni.id ? null : uni.id);
                      setEditFac(null);
                      setFacForm({ name: '', university_id: uni.id });
                    })}
                  </div>

                  {showFacForm === uni.id && (
                    <form
                      onSubmit={(e) => saveFac(e, uni.id)}
                      style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 10,
                        padding: 12,
                        marginBottom: 10,
                        animation: 'fadeUp 0.25s ease both',
                      }}
                    >
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          className="form-input"
                          type="text"
                          placeholder="Ex: Faculté des Sciences"
                          value={facForm.name}
                          onChange={(e) =>
                            setFacForm((p) => ({ ...p, name: e.target.value }))
                          }
                          required
                          style={{ flex: 1 }}
                        />
                        <button
                          type="submit"
                          style={{
                            padding: '0 14px',
                            borderRadius: 10,
                            border: 'none',
                            background: 'var(--accent)',
                            color: '#fff',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-title)',
                            fontWeight: 600,
                            fontSize: 12,
                            flexShrink: 0,
                          }}
                        >
                          {editFac ? 'Sauv.' : 'Ajouter'}
                        </button>
                      </div>
                    </form>
                  )}

                  {uniFacs.length === 0 ? (
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--muted)',
                        textAlign: 'center',
                        padding: '10px 0',
                      }}
                    >
                      Aucune faculté
                    </div>
                  ) : (
                    uniFacs.map((fac) => {
                      const facProgs = programs.filter(
                        (p) => p.faculty_id === fac.id
                      );
                      const isFacExp = expandedFac === fac.id;
                      return (
                        <div key={fac.id} style={{ marginBottom: 8 }}>
                          <div
                            style={{
                              background: 'var(--surface)',
                              border: '1px solid var(--border)',
                              borderRadius: isFacExp ? '8px 8px 0 0' : 8,
                              padding: '10px 12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                            }}
                          >
                            <i
                              className="fa-solid fa-building-columns"
                              style={{
                                fontSize: 12,
                                color: 'var(--accent)',
                                flexShrink: 0,
                              }}
                            />
                            <div
                              style={{
                                flex: 1,
                                fontSize: 12,
                                fontWeight: 500,
                                cursor: 'pointer',
                              }}
                              onClick={() =>
                                setExpandedFac(isFacExp ? null : fac.id)
                              }
                            >
                              {fac.name}
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 5,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 10,
                                  background: 'rgba(16,185,129,0.1)',
                                  color: 'var(--green)',
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                }}
                              >
                                {facProgs.length} fil.
                              </span>
                              <button
                                onClick={() => {
                                  setEditFac(fac);
                                  setFacForm({
                                    name: fac.name,
                                    university_id: uni.id,
                                  });
                                  setShowFacForm(uni.id);
                                }}
                                style={{
                                  width: 24,
                                  height: 24,
                                  borderRadius: 6,
                                  border: '1px solid var(--border)',
                                  background: 'var(--surface2)',
                                  color: 'var(--muted)',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 10,
                                  transition: 'all 0.18s',
                                }}
                                onMouseEnter={(e) => {
                                  (e.currentTarget as HTMLElement).style.color =
                                    'var(--accent)';
                                }}
                                onMouseLeave={(e) => {
                                  (e.currentTarget as HTMLElement).style.color =
                                    'var(--muted)';
                                }}
                              >
                                <i className="fa-solid fa-pen" />
                              </button>
                              <button
                                onClick={() => deleteFac(fac.id)}
                                style={{
                                  width: 24,
                                  height: 24,
                                  borderRadius: 6,
                                  border: '1px solid rgba(239,68,68,0.2)',
                                  background: 'rgba(239,68,68,0.08)',
                                  color: 'var(--red)',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 10,
                                  transition: 'all 0.18s',
                                }}
                                onMouseEnter={(e) =>
                                  ((
                                    e.currentTarget as HTMLElement
                                  ).style.background = 'rgba(239,68,68,0.18)')
                                }
                                onMouseLeave={(e) =>
                                  ((
                                    e.currentTarget as HTMLElement
                                  ).style.background = 'rgba(239,68,68,0.08)')
                                }
                              >
                                <i className="fa-solid fa-trash" />
                              </button>
                              <i
                                className={`fa-solid fa-chevron-${
                                  isFacExp ? 'up' : 'down'
                                }`}
                                style={{
                                  fontSize: 10,
                                  color: 'var(--muted)',
                                  cursor: 'pointer',
                                }}
                                onClick={() =>
                                  setExpandedFac(isFacExp ? null : fac.id)
                                }
                              />
                            </div>
                          </div>

                          {isFacExp && (
                            <div
                              style={{
                                background: 'rgba(16,185,129,0.03)',
                                border: '1px solid var(--border)',
                                borderTop: 'none',
                                borderRadius: '0 0 8px 8px',
                                padding: '8px 10px',
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  marginBottom: 6,
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 10,
                                    color: 'var(--muted)',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                  }}
                                >
                                  <i
                                    className="fa-solid fa-graduation-cap"
                                    style={{
                                      marginRight: 4,
                                      color: 'var(--green)',
                                    }}
                                  />
                                  Filières
                                </div>
                                {miniBtn(
                                  'Ajouter',
                                  'fa-plus',
                                  () => {
                                    setShowProgForm(
                                      showProgForm === fac.id ? null : fac.id
                                    );
                                    setEditProg(null);
                                    setProgForm({
                                      name: '',
                                      faculty_id: fac.id,
                                    });
                                  },
                                  'var(--green)',
                                  'rgba(16,185,129,0.1)'
                                )}
                              </div>

                              {showProgForm === fac.id && (
                                <form
                                  onSubmit={(e) => saveProg(e, fac.id)}
                                  style={{
                                    background: 'var(--surface)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 8,
                                    padding: 10,
                                    marginBottom: 8,
                                    animation: 'fadeUp 0.25s ease both',
                                  }}
                                >
                                  <div style={{ display: 'flex', gap: 8 }}>
                                    <input
                                      className="form-input"
                                      type="text"
                                      placeholder="Ex: Informatique"
                                      value={progForm.name}
                                      onChange={(e) =>
                                        setProgForm((p) => ({
                                          ...p,
                                          name: e.target.value,
                                        }))
                                      }
                                      required
                                      style={{ flex: 1 }}
                                    />
                                    <button
                                      type="submit"
                                      style={{
                                        padding: '0 12px',
                                        borderRadius: 8,
                                        border: 'none',
                                        background: 'var(--green)',
                                        color: '#fff',
                                        cursor: 'pointer',
                                        fontFamily: 'var(--font-title)',
                                        fontWeight: 600,
                                        fontSize: 12,
                                        flexShrink: 0,
                                      }}
                                    >
                                      {editProg ? 'Sauv.' : 'Ajouter'}
                                    </button>
                                  </div>
                                </form>
                              )}

                              {facProgs.length === 0 ? (
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: 'var(--muted)',
                                    textAlign: 'center',
                                    padding: '6px 0',
                                  }}
                                >
                                  Aucune filière
                                </div>
                              ) : (
                                facProgs.map((prog) => (
                                  <div
                                    key={prog.id}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 8,
                                      padding: '6px 8px',
                                      borderRadius: 7,
                                      background: 'var(--surface)',
                                      border: '1px solid var(--border)',
                                      marginBottom: 5,
                                    }}
                                  >
                                    <i
                                      className="fa-solid fa-graduation-cap"
                                      style={{
                                        fontSize: 10,
                                        color: 'var(--green)',
                                        flexShrink: 0,
                                      }}
                                    />
                                    <div style={{ flex: 1, fontSize: 12 }}>
                                      {prog.name}
                                    </div>
                                    <button
                                      onClick={() => {
                                        setEditProg(prog);
                                        setProgForm({
                                          name: prog.name,
                                          faculty_id: fac.id,
                                        });
                                        setShowProgForm(fac.id);
                                      }}
                                      style={{
                                        width: 22,
                                        height: 22,
                                        borderRadius: 5,
                                        border: '1px solid var(--border)',
                                        background: 'var(--surface2)',
                                        color: 'var(--muted)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 10,
                                        transition: 'all 0.18s',
                                      }}
                                      onMouseEnter={(e) => {
                                        (
                                          e.currentTarget as HTMLElement
                                        ).style.color = 'var(--accent)';
                                      }}
                                      onMouseLeave={(e) => {
                                        (
                                          e.currentTarget as HTMLElement
                                        ).style.color = 'var(--muted)';
                                      }}
                                    >
                                      <i className="fa-solid fa-pen" />
                                    </button>
                                    <button
                                      onClick={() => deleteProg(prog.id)}
                                      style={{
                                        width: 22,
                                        height: 22,
                                        borderRadius: 5,
                                        border: '1px solid rgba(239,68,68,0.2)',
                                        background: 'rgba(239,68,68,0.08)',
                                        color: 'var(--red)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 10,
                                        transition: 'all 0.18s',
                                      }}
                                      onMouseEnter={(e) =>
                                        ((
                                          e.currentTarget as HTMLElement
                                        ).style.background =
                                          'rgba(239,68,68,0.18)')
                                      }
                                      onMouseLeave={(e) =>
                                        ((
                                          e.currentTarget as HTMLElement
                                        ).style.background =
                                          'rgba(239,68,68,0.08)')
                                      }
                                    >
                                      <i className="fa-solid fa-trash" />
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

// ─── TAB : Annonces ───────────────────────────────────────────
function NotificationsTab() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({ title: '', body: '' });

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });
    setAnnouncements(data || []);
    setLoading(false);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      if (editItem) {
        await supabase.from('announcements').update(form).eq('id', editItem.id);
        setSuccess('Annonce modifiée !');
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        await supabase
          .from('announcements')
          .insert({ ...form, created_by: user?.id });
        setSuccess('Annonce envoyée !');
      }
      setForm({ title: '', body: '' });
      setEditItem(null);
      setShowForm(false);
      loadAnnouncements();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const toggleHide = async (id: string, cur: boolean) => {
    await supabase
      .from('announcements')
      .update({ is_hidden: !cur })
      .eq('id', id);
    setSuccess(cur ? 'Visible.' : 'Masquée.');
    loadAnnouncements();
  };
  const deleteAnnouncement = async (id: string) => {
    if (!confirm('Supprimer ?')) return;
    await supabase.from('announcements').delete().eq('id', id);
    setSuccess('Supprimée.');
    loadAnnouncements();
  };
  const startEdit = (a: any) => {
    setEditItem(a);
    setForm({ title: a.title, body: a.body });
    setShowForm(true);
    window.scrollTo(0, 0);
  };

  return (
    <div>
      <button
        onClick={() => {
          setShowForm(!showForm);
          setEditItem(null);
          setForm({ title: '', body: '' });
        }}
        style={{
          width: '100%',
          padding: 12,
          borderRadius: 12,
          border: '1.5px dashed var(--border)',
          background: 'transparent',
          color: 'var(--accent)',
          fontFamily: 'var(--font-title)',
          fontWeight: 600,
          fontSize: 13,
          cursor: 'pointer',
          marginBottom: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          transition: 'all 0.18s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background =
            'rgba(79,142,247,0.05)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = 'transparent';
        }}
      >
        <i className="fa-solid fa-bullhorn" />{' '}
        {showForm ? 'Annuler' : 'Nouvelle annonce'}
      </button>

      {success && <Msg type="success" text={success} />}
      {error && <Msg type="error" text={error} />}

      {showForm && (
        <form
          onSubmit={save}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: 16,
            marginBottom: 14,
            animation: 'fadeUp 0.3s ease both',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-title)',
              fontWeight: 600,
              fontSize: 14,
              marginBottom: 12,
            }}
          >
            {editItem ? "Modifier l'annonce" : 'Nouvelle annonce'}
          </div>
          <div style={{ marginBottom: 10 }}>
            <Label text="Titre" />
            <input
              className="form-input"
              type="text"
              placeholder="Titre"
              value={form.title}
              onChange={(e) =>
                setForm((p) => ({ ...p, title: e.target.value }))
              }
              required
            />
          </div>
          <div style={{ marginBottom: 14 }}>
            <Label text="Message" />
            <textarea
              className="form-input"
              placeholder="Contenu..."
              value={form.body}
              onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
              required
              rows={4}
              style={{ resize: 'none', lineHeight: 1.6 }}
            />
          </div>
          <button type="submit" className="btn-primary">
            <i
              className={`fa-solid ${
                editItem ? 'fa-floppy-disk' : 'fa-paper-plane'
              }`}
            />
            {editItem ? 'Sauvegarder' : 'Envoyer à tous'}
          </button>
        </form>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}>
          <i
            className="fa-solid fa-spinner fa-spin"
            style={{ fontSize: 20, color: 'var(--accent)' }}
          />
        </div>
      ) : announcements.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '30px 0',
            color: 'var(--muted)',
            fontSize: 13,
          }}
        >
          <i
            className="fa-solid fa-bell-slash"
            style={{
              fontSize: 32,
              display: 'block',
              marginBottom: 10,
              opacity: 0.2,
            }}
          />
          Aucune annonce
        </div>
      ) : (
        announcements.map((a, idx) => (
          <div
            key={a.id}
            style={{
              background: a.is_hidden
                ? 'rgba(107,114,128,0.05)'
                : 'var(--surface)',
              border: `1px solid ${
                a.is_hidden ? 'rgba(107,114,128,0.2)' : 'var(--border)'
              }`,
              borderRadius: 'var(--radius)',
              padding: '14px 16px',
              marginBottom: 10,
              opacity: a.is_hidden ? 0.6 : 1,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 10,
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-title)',
                  fontWeight: 600,
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {a.title}
                {a.is_hidden && (
                  <span
                    style={{
                      fontSize: 10,
                      background: 'rgba(107,114,128,0.1)',
                      color: 'var(--muted)',
                      padding: '2px 7px',
                      borderRadius: 5,
                    }}
                  >
                    Masquée
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                <button
                  onClick={() => startEdit(a)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 7,
                    border: '1px solid var(--border)',
                    background: 'var(--surface2)',
                    color: 'var(--muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    transition: 'all 0.18s',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color =
                      'var(--accent)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color =
                      'var(--muted)';
                  }}
                >
                  <i className="fa-solid fa-pen" />
                </button>
                <button
                  onClick={() => toggleHide(a.id, a.is_hidden)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 7,
                    border: `1px solid ${
                      a.is_hidden
                        ? 'rgba(16,185,129,0.3)'
                        : 'rgba(107,114,128,0.3)'
                    }`,
                    background: a.is_hidden
                      ? 'rgba(16,185,129,0.1)'
                      : 'rgba(107,114,128,0.08)',
                    color: a.is_hidden ? 'var(--green)' : 'var(--muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    transition: 'all 0.18s',
                  }}
                  title={a.is_hidden ? 'Rendre visible' : 'Masquer'}
                >
                  <i
                    className={`fa-solid ${
                      a.is_hidden ? 'fa-eye' : 'fa-eye-slash'
                    }`}
                  />
                </button>
                <button
                  onClick={() => deleteAnnouncement(a.id)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 7,
                    border: '1px solid rgba(239,68,68,0.2)',
                    background: 'rgba(239,68,68,0.08)',
                    color: 'var(--red)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    transition: 'all 0.18s',
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      'rgba(239,68,68,0.18)')
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      'rgba(239,68,68,0.08)')
                  }
                >
                  <i className="fa-solid fa-trash" />
                </button>
              </div>
            </div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--muted)',
                lineHeight: 1.6,
                marginBottom: 6,
              }}
            >
              {a.body}
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--muted)',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <i className="fa-solid fa-clock" style={{ fontSize: 10 }} />
              {new Date(a.created_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ─── TAB : Upload PDF ─────────────────────────────────────────
function PdfTab() {
  const [universities, setUniversities] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [editQuiz, setEditQuiz] = useState<any>(null);
  const [form, setForm] = useState({
    subject: '',
    semester: '',
    program: '',
    university_id: '',
    faculty_id: '',
  });
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [{ data: unis }, { data: facs }, { data: quizs }] = await Promise.all(
      [
        supabase.from('universities').select('*').order('name'),
        supabase.from('faculties').select('*').order('name'),
        supabase
          .from('generated_quizzes')
          .select('*')
          .order('created_at', { ascending: false }),
      ]
    );
    setUniversities(unis || []);
    setFaculties(facs || []);
    setQuizzes(quizs || []);
  };

  const filteredFacs = faculties.filter(
    (f) => f.university_id === form.university_id
  );

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Sélectionne un fichier PDF');
      return;
    }
    setUploading(true);
    setError('');
    setSuccess('');
    try {
      const fileName = `${form.program}_${form.semester}_${
        form.subject
      }_${Date.now()}.pdf`
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/_+/g, '_');

      const { error: uploadError } = await supabase.storage
        .from('pdfs')
        .upload(fileName, file);
      if (uploadError) throw uploadError;

      await supabase.from('generated_quizzes').insert({
        pdf_name: fileName,
        subject_name: form.subject,
        program: form.program,
        semester: form.semester,
        university_id: form.university_id || null,
        faculty_id: form.faculty_id || null,
        questions: [],
        is_active: false,
      });

      setSuccess(`PDF uploadé ! Clique sur "Générer QCM" pour lancer l'IA.`);
      setFile(null);
      setForm({
        subject: '',
        semester: '',
        program: '',
        university_id: '',
        faculty_id: '',
      });
      if (fileRef.current) fileRef.current.value = '';
      loadData();
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const generateQCM = async (quiz: any) => {
    setGenerating(quiz.id);
    setError('');
    setSuccess('');
    try {
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('pdfs')
        .download(quiz.pdf_name);
      if (downloadError)
        throw new Error(
          'Impossible de télécharger le PDF : ' + downloadError.message
        );

      const arrayBuf = await fileData.arrayBuffer();
      const bytes = new Uint8Array(arrayBuf);
      let binary = '';
      const chunkSize = 8192;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.slice(i, i + chunkSize));
      }
      const base64PDF = btoa(binary);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const claudeResponse = await fetch(
        `https://glrhwcxunxsqkmlbrojn.supabase.co/functions/v1/dynamic-responder`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            base64PDF,
            subjectName: quiz.subject_name,
            program: quiz.program,
            semester: quiz.semester,
          }),
        }
      );

      if (!claudeResponse.ok) {
        const errData = await claudeResponse.json();
        throw new Error(
          errData.error || `Erreur HTTP ${claudeResponse.status}`
        );
      }

      const data = await claudeResponse.json();
      console.log('Réponse Claude:', JSON.stringify(data));

      const rawText = data.content?.[0]?.text || '';
      console.log('Raw text:', rawText);

      if (!rawText)
        throw new Error('Réponse vide de Claude — vérifie ta clé API');

      const cleaned = rawText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      let questions;
      try {
        questions = JSON.parse(cleaned);
      } catch (parseErr) {
        const match = cleaned.match(/\[[\s\S]*\]/);
        if (match) questions = JSON.parse(match[0]);
        else throw new Error(`JSON invalide : ${cleaned.slice(0, 200)}`);
      }

      if (!Array.isArray(questions) || questions.length === 0)
        throw new Error('Aucune question générée');

      await supabase
        .from('generated_quizzes')
        .update({ questions, is_active: true })
        .eq('id', quiz.id);
      setSuccess(
        `✅ ${questions.length} questions générées pour "${quiz.subject_name}" !`
      );
      loadData();
    } catch (err: any) {
      setError(`Erreur génération : ${err.message}`);
    } finally {
      setGenerating(null);
    }
  };

  const deleteQuiz = async (quiz: any) => {
    if (!confirm(`Supprimer "${quiz.subject_name}" ?`)) return;
    await supabase.from('generated_quizzes').delete().eq('id', quiz.id);
    await supabase.storage.from('pdfs').remove([quiz.pdf_name]);
    setSuccess('Supprimé.');
    loadData();
  };
  const toggleActive = async (quiz: any) => {
    await supabase
      .from('generated_quizzes')
      .update({ is_active: !quiz.is_active })
      .eq('id', quiz.id);
    setSuccess(quiz.is_active ? 'Désactivé.' : 'Activé.');
    loadData();
  };

  const saveEditQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editQuiz) return;
    try {
      const questions = JSON.parse(editQuiz.questionsText);
      await supabase
        .from('generated_quizzes')
        .update({
          questions,
          subject_name: editQuiz.subject_name,
          semester: editQuiz.semester,
        })
        .eq('id', editQuiz.id);
      setSuccess('QCM mis à jour !');
      setEditQuiz(null);
      loadData();
    } catch (err) {
      setError('JSON invalide');
    }
  };

  return (
    <div>
      <div
        style={{
          background: 'rgba(79,142,247,0.06)',
          border: '1px solid rgba(79,142,247,0.15)',
          borderRadius: 12,
          padding: '12px 14px',
          marginBottom: 14,
          fontSize: 12,
          color: 'var(--muted)',
          lineHeight: 1.6,
        }}
      >
        <i
          className="fa-solid fa-circle-info"
          style={{ color: 'var(--accent)', marginRight: 6 }}
        />
        Uploade un PDF → Clique{' '}
        <strong style={{ color: 'var(--accent)' }}>Générer QCM</strong> → Claude
        IA crée automatiquement 20 questions.
      </div>

      {success && <Msg type="success" text={success} />}
      {error && <Msg type="error" text={error} />}

      <form
        onSubmit={handleUpload}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: 16,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-title)',
            fontWeight: 600,
            fontSize: 14,
            marginBottom: 14,
          }}
        >
          <i
            className="fa-solid fa-cloud-arrow-up"
            style={{ color: 'var(--accent)', marginRight: 8 }}
          />
          Uploader un document
        </div>

        <div
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${file ? 'var(--green)' : 'var(--border)'}`,
            borderRadius: 12,
            padding: '20px 16px',
            textAlign: 'center',
            cursor: 'pointer',
            marginBottom: 14,
            transition: 'all 0.2s',
            background: file ? 'rgba(16,185,129,0.05)' : 'transparent',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = file
              ? 'var(--green)'
              : 'var(--accent)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = file
              ? 'var(--green)'
              : 'var(--border)';
          }}
        >
          <i
            className={`fa-solid ${
              file ? 'fa-file-circle-check' : 'fa-file-pdf'
            }`}
            style={{
              fontSize: 28,
              color: file ? 'var(--green)' : 'var(--muted)',
              marginBottom: 8,
              display: 'block',
            }}
          />
          <div
            style={{
              fontSize: 13,
              color: file ? 'var(--green)' : 'var(--muted)',
              fontWeight: file ? 600 : 400,
            }}
          >
            {file ? file.name : 'Cliquer pour sélectionner un PDF'}
          </div>
          {file && (
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </div>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          style={{ display: 'none' }}
        />

        <div style={{ marginBottom: 10 }}>
          <Label text="Université" />
          <select
            className="form-input"
            value={form.university_id}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                university_id: e.target.value,
                faculty_id: '',
              }))
            }
            required
          >
            <option value="">Sélectionner une université…</option>
            {universities.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        {form.university_id && (
          <div style={{ marginBottom: 10 }}>
            <Label text="Faculté / École" />
            <select
              className="form-input"
              value={form.faculty_id}
              onChange={(e) =>
                setForm((p) => ({ ...p, faculty_id: e.target.value }))
              }
              required
            >
              <option value="">Sélectionner une faculté…</option>
              {filteredFacs.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
            marginBottom: 10,
          }}
        >
          <div>
            <Label text="Filière" />
            <input
              className="form-input"
              type="text"
              placeholder="Ex: Informatique"
              value={form.program}
              onChange={(e) =>
                setForm((p) => ({ ...p, program: e.target.value }))
              }
              required
            />
          </div>
          <div>
            <Label text="Semestre" />
            <select
              className="form-input"
              value={form.semester}
              onChange={(e) =>
                setForm((p) => ({ ...p, semester: e.target.value }))
              }
              required
            >
              <option value="">Semestre…</option>
              {['S1', 'S2', 'S3', 'S4', 'S5', 'S6'].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <Label text="Nom de la matière" />
          <input
            className="form-input"
            type="text"
            placeholder="Ex: Algorithmique avancée"
            value={form.subject}
            onChange={(e) =>
              setForm((p) => ({ ...p, subject: e.target.value }))
            }
            required
          />
        </div>

        <button type="submit" className="btn-primary" disabled={uploading}>
          {uploading ? (
            <>
              <i className="fa-solid fa-spinner fa-spin" /> Upload…
            </>
          ) : (
            <>
              <i className="fa-solid fa-cloud-arrow-up" /> Uploader le PDF
            </>
          )}
        </button>
      </form>

      {quizzes.length > 0 && (
        <>
          <SectionTitle
            icon="fa-robot"
            color="var(--accent)"
            text={`QCM générés par IA (${quizzes.length})`}
          />

          {editQuiz && (
            <form
              onSubmit={saveEditQuiz}
              style={{
                background: 'var(--surface)',
                border: '1px solid rgba(79,142,247,0.3)',
                borderRadius: 'var(--radius)',
                padding: 16,
                marginBottom: 14,
                animation: 'fadeUp 0.3s ease both',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-title)',
                  fontWeight: 600,
                  fontSize: 14,
                  marginBottom: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                Modifier le QCM
                <button
                  type="button"
                  onClick={() => setEditQuiz(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--muted)',
                    cursor: 'pointer',
                    fontSize: 18,
                  }}
                >
                  ×
                </button>
              </div>
              <div style={{ marginBottom: 10 }}>
                <Label text="Matière" />
                <input
                  className="form-input"
                  value={editQuiz.subject_name}
                  onChange={(e) =>
                    setEditQuiz((p: any) => ({
                      ...p,
                      subject_name: e.target.value,
                    }))
                  }
                />
              </div>
              <div style={{ marginBottom: 10 }}>
                <Label text="Semestre" />
                <select
                  className="form-input"
                  value={editQuiz.semester}
                  onChange={(e) =>
                    setEditQuiz((p: any) => ({
                      ...p,
                      semester: e.target.value,
                    }))
                  }
                >
                  {['S1', 'S2', 'S3', 'S4', 'S5', 'S6'].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <Label
                  text={`Questions JSON (${(() => {
                    try {
                      return JSON.parse(editQuiz.questionsText || '[]').length;
                    } catch {
                      return 0;
                    }
                  })()} questions)`}
                />
                <textarea
                  className="form-input"
                  value={editQuiz.questionsText}
                  onChange={(e) =>
                    setEditQuiz((p: any) => ({
                      ...p,
                      questionsText: e.target.value,
                    }))
                  }
                  rows={10}
                  style={{
                    resize: 'vertical',
                    fontFamily: 'monospace',
                    fontSize: 11,
                    lineHeight: 1.5,
                  }}
                  placeholder='[{"text":"?","options":["A","B","C","D"],"correct":0,"explanation":"..."}]'
                />
              </div>
              <button type="submit" className="btn-primary">
                <i className="fa-solid fa-floppy-disk" /> Sauvegarder
              </button>
            </form>
          )}

          {quizzes.map((q, idx) => (
            <div
              key={q.id}
              style={{
                background: q.is_active
                  ? 'var(--surface)'
                  : 'rgba(107,114,128,0.05)',
                border: `1px solid ${
                  q.is_active ? 'var(--border)' : 'rgba(107,114,128,0.2)'
                }`,
                borderRadius: 'var(--radius)',
                padding: 14,
                marginBottom: 10,
                opacity: q.is_active ? 1 : 0.75,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background:
                      q.questions?.length > 0
                        ? 'rgba(16,185,129,0.1)'
                        : 'rgba(239,68,68,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <i
                    className={`fa-solid ${
                      q.questions?.length > 0 ? 'fa-robot' : 'fa-file-pdf'
                    }`}
                    style={{
                      fontSize: 16,
                      color:
                        q.questions?.length > 0 ? 'var(--green)' : '#EF4444',
                    }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      flexWrap: 'wrap',
                    }}
                  >
                    {q.subject_name}
                    {!q.is_active && (
                      <span
                        style={{
                          fontSize: 10,
                          background: 'rgba(107,114,128,0.1)',
                          color: 'var(--muted)',
                          padding: '2px 6px',
                          borderRadius: 5,
                        }}
                      >
                        Inactif
                      </span>
                    )}
                    {q.questions?.length > 0 && (
                      <span
                        style={{
                          fontSize: 10,
                          background: 'rgba(16,185,129,0.1)',
                          color: 'var(--green)',
                          padding: '2px 6px',
                          borderRadius: 5,
                        }}
                      >
                        ✓ IA générée
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--muted)',
                      marginTop: 3,
                      display: 'flex',
                      gap: 8,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span>
                      <i
                        className="fa-solid fa-graduation-cap"
                        style={{ marginRight: 3 }}
                      />
                      {q.program}
                    </span>
                    <span>
                      <i
                        className="fa-solid fa-calendar"
                        style={{ marginRight: 3 }}
                      />
                      {q.semester}
                    </span>
                    <span>
                      <i
                        className="fa-solid fa-circle-question"
                        style={{ marginRight: 3 }}
                      />
                      {q.questions?.length || 0} questions
                    </span>
                  </div>
                </div>
              </div>

              {(!q.questions || q.questions.length === 0) && (
                <button
                  onClick={() => generateQCM(q)}
                  disabled={generating === q.id}
                  style={{
                    width: '100%',
                    padding: 11,
                    borderRadius: 10,
                    border: 'none',
                    background:
                      generating === q.id
                        ? 'var(--surface2)'
                        : 'linear-gradient(135deg, #4F8EF7, #7C3AED)',
                    color: generating === q.id ? 'var(--muted)' : '#fff',
                    fontFamily: 'var(--font-title)',
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: generating === q.id ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    marginBottom: 10,
                    transition: 'all 0.2s',
                    boxShadow:
                      generating === q.id
                        ? 'none'
                        : '0 4px 12px rgba(79,142,247,0.3)',
                  }}
                >
                  {generating === q.id ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin" /> Génération
                      en cours…
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-robot" /> Générer QCM avec
                      Claude IA
                    </>
                  )}
                </button>
              )}

              {q.questions?.length > 0 && (
                <button
                  onClick={() => generateQCM(q)}
                  disabled={generating === q.id}
                  style={{
                    width: '100%',
                    padding: 9,
                    borderRadius: 10,
                    border: '1px solid rgba(79,142,247,0.2)',
                    background: 'rgba(79,142,247,0.06)',
                    color: 'var(--accent)',
                    fontFamily: 'var(--font-title)',
                    fontWeight: 600,
                    fontSize: 12,
                    cursor: generating === q.id ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    marginBottom: 10,
                    transition: 'all 0.2s',
                  }}
                >
                  {generating === q.id ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin" />{' '}
                      Régénération…
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-rotate" /> Régénérer
                    </>
                  )}
                </button>
              )}

              <div style={{ display: 'flex', gap: 7 }}>
                <button
                  onClick={() =>
                    setEditQuiz({
                      ...q,
                      questionsText: JSON.stringify(q.questions || [], null, 2),
                    })
                  }
                  style={{
                    flex: 1,
                    padding: '7px 0',
                    borderRadius: 8,
                    border: '1px solid rgba(79,142,247,0.2)',
                    background: 'rgba(79,142,247,0.08)',
                    color: 'var(--accent)',
                    fontSize: 11,
                    fontFamily: 'var(--font-title)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                    transition: 'all 0.18s',
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      'rgba(79,142,247,0.15)')
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      'rgba(79,142,247,0.08)')
                  }
                >
                  <i className="fa-solid fa-pen" /> Modifier
                </button>
                <button
                  onClick={() => toggleActive(q)}
                  style={{
                    flex: 1,
                    padding: '7px 0',
                    borderRadius: 8,
                    border: `1px solid ${
                      q.is_active
                        ? 'rgba(107,114,128,0.2)'
                        : 'rgba(16,185,129,0.25)'
                    }`,
                    background: q.is_active
                      ? 'rgba(107,114,128,0.08)'
                      : 'rgba(16,185,129,0.08)',
                    color: q.is_active ? 'var(--muted)' : 'var(--green)',
                    fontSize: 11,
                    fontFamily: 'var(--font-title)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                    transition: 'all 0.18s',
                  }}
                >
                  <i
                    className={`fa-solid ${
                      q.is_active ? 'fa-eye-slash' : 'fa-eye'
                    }`}
                  />
                  {q.is_active ? 'Désactiver' : 'Activer'}
                </button>
                <button
                  onClick={() => deleteQuiz(q)}
                  style={{
                    padding: '7px 12px',
                    borderRadius: 8,
                    border: '1px solid rgba(239,68,68,0.2)',
                    background: 'rgba(239,68,68,0.08)',
                    color: 'var(--red)',
                    fontSize: 11,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    transition: 'all 0.18s',
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      'rgba(239,68,68,0.18)')
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      'rgba(239,68,68,0.08)')
                  }
                >
                  <i className="fa-solid fa-trash" />
                </button>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
