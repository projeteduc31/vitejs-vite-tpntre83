import React, { useEffect, useState } from 'react';
import { BottomNav } from '../components/UI';
import { supabase } from '../lib/supabase';

export default function Dashboard({
  onNavigate,
}: {
  onNavigate: (p: string, d?: any) => void;
}) {
  const [profile, setProfile] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [stats, setStats] = useState({ avg: 0, total: 0, rate: 0 });
  const [loading, setLoading] = useState(true);
  const [hasNotif, setHasNotif] = useState(false);
  const [theme, setTheme] = useState(
    () => localStorage.getItem('theme') || 'dark'
  );

  const days = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  useEffect(() => {
    loadData();
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.setAttribute(
      'data-theme',
      next === 'light' ? 'light' : ''
    );
  };

  const loadData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        onNavigate('login');
        return;
      }

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setProfile(prof);

      // ── Récupère TOUTES les sessions sans limite pour les stats ──
      const { data: allSessions } = await supabase
        .from('quiz_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('played_at', { ascending: false });

      // ── 5 dernières pour l'affichage ──
      setHistory((allSessions || []).slice(0, 5));

      // ── Calcul correct des stats ──
      if (allSessions && allSessions.length > 0) {
        const total = allSessions.length;
        const avg =
          allSessions.reduce((s: number, q: any) => {
            const t = q.total > 0 ? q.total : 20;
            return s + (q.score / t) * 20;
          }, 0) / total;
        const rate = Math.round(
          (allSessions.filter((q: any) => {
            const t = q.total > 0 ? q.total : 20;
            return (q.score / t) * 20 >= 10;
          }).length /
            total) *
            100
        );
        setStats({ avg: Math.round(avg * 10) / 10, total, rate });
      }

      const { data: ann } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })
        .limit(3);
      setAnnouncements(ann || []);

      if (ann && ann.length > 0 && prof) {
        const lastRead = prof.last_read_announcement;
        const lastAnnounce = ann[0].created_at;
        if (!lastRead || new Date(lastAnnounce) > new Date(lastRead)) {
          setHasNotif(true);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleNotifClick = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('profiles')
        .update({ last_read_announcement: new Date().toISOString() })
        .eq('id', user.id);
    }
    setHasNotif(false);
    onNavigate('announcements');
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diff === 0) return "Aujourd'hui";
    if (diff === 1) return 'Hier';
    return `Il y a ${diff}j`;
  };

  const handleInvite = () => {
    const appUrl = window.location.origin;
    const message = encodeURIComponent(
      `👋 Salut ! Je révise mes cours avec QuizApp EDU et c'est vraiment efficace.\n\nTu peux t'inscrire gratuitement ici : ${appUrl}\n\n🎓 Des QCM générés depuis tes vrais cours, mode compétition avec tes camarades, et bien plus encore !`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  if (loading) {
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
  }

  const name = profile?.full_name || 'Étudiant';
  const initials = getInitials(name);
  const streak = profile?.streak_days || 0;
  const isNew = stats.total === 0;

  // ── Calcul correct du jour actuel dans la semaine ──
  // JS: 0=Dim, 1=Lun... → on convertit en 0=Lun, 6=Dim
  const todayIndex = (new Date().getDay() + 6) % 7;

  return (
    <div className="page-container">
      <div className="bg-glow" />
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* En-tête */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 24,
            marginBottom: 4,
          }}
        >
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
            QuizApp EDU
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Mode jour/nuit */}
            <button
              onClick={toggleTheme}
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.18s',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = 'scale(1.08)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = 'scale(1)')
              }
              title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
            >
              <i
                className={`fa-solid ${
                  theme === 'dark' ? 'fa-sun' : 'fa-moon'
                }`}
                style={{
                  fontSize: 15,
                  color: theme === 'dark' ? '#F59E0B' : '#6B7FA3',
                  transition: 'all 0.3s',
                }}
              />
            </button>

            {/* Notifications */}
            <button
              onClick={handleNotifClick}
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                cursor: 'pointer',
                transition: 'all 0.18s',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = 'scale(1.08)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = 'scale(1)')
              }
            >
              <i
                className="fa-solid fa-bell"
                style={{ fontSize: 15, color: 'var(--muted)' }}
              />
              {hasNotif && (
                <div
                  style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    width: 8,
                    height: 8,
                    background: '#EF4444',
                    borderRadius: '50%',
                    animation: 'pulse 1.5s ease infinite',
                  }}
                />
              )}
            </button>

            {/* Avatar */}
            <div
              onClick={() => onNavigate('profile')}
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: profile?.avatar_url
                  ? 'transparent'
                  : 'linear-gradient(135deg, #4F8EF7, #7C3AED)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-title)',
                fontWeight: 700,
                fontSize: 14,
                color: '#fff',
                cursor: 'pointer',
                overflow: 'hidden',
                transition: 'transform 0.18s',
                boxShadow: '0 2px 8px rgba(79,142,247,0.3)',
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.transform =
                  'scale(1.08)')
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.transform = 'scale(1)')
              }
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="avatar"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                initials
              )}
            </div>
          </div>
        </header>

        {/* Bienvenue */}
        <section style={{ marginTop: 20, animation: 'fadeUp 0.4s ease both' }}>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>
            {isNew ? 'Bienvenue,' : 'Bon retour,'}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-title)',
              fontWeight: 700,
              fontSize: 26,
              marginTop: 2,
            }}
          >
            {name.split(' ')[0]}{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #4F8EF7, #7C3AED)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {name.split(' ').slice(1).join(' ')}
            </span>
          </div>
          {isNew && (
            <div
              style={{
                fontSize: 13,
                color: 'var(--muted)',
                marginTop: 8,
                background: 'rgba(79,142,247,0.08)',
                border: '1px solid rgba(79,142,247,0.15)',
                borderRadius: 10,
                padding: '8px 12px',
              }}
            >
              <i
                className="fa-solid fa-rocket"
                style={{ color: 'var(--accent)', marginRight: 6 }}
              />
              Lance ton premier quiz pour commencer ton aventure !
            </div>
          )}
        </section>

        {/* Streak — avec jours corrects */}
        <div
          style={{
            marginTop: 20,
            background:
              'linear-gradient(135deg, rgba(79,142,247,0.15), rgba(124,58,237,0.12))',
            border: '1px solid rgba(79,142,247,0.2)',
            borderRadius: 'var(--radius)',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            animation: 'fadeUp 0.4s ease 0.08s both',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <i
              className="fa-solid fa-fire"
              style={{
                fontSize: 22,
                color: streak > 0 ? 'var(--amber)' : 'var(--muted)',
                filter: streak > 0 ? 'drop-shadow(0 0 6px #F59E0B80)' : 'none',
              }}
            />
            <div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                Série en cours
              </div>
              {streak > 0 ? (
                <div
                  style={{
                    fontFamily: 'var(--font-title)',
                    fontWeight: 700,
                    fontSize: 16,
                    color: 'var(--amber)',
                  }}
                >
                  {streak} jour{streak > 1 ? 's' : ''} 🔥
                </div>
              ) : (
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--muted)',
                    fontStyle: 'italic',
                  }}
                >
                  Fais un quiz aujourd'hui !
                </div>
              )}
            </div>
          </div>
          {/* ── Jours de la semaine — aujourd'hui bien mis en évidence ── */}
          <div style={{ display: 'flex', gap: 5 }}>
            {days.map((day, i) => {
              const isToday = i === todayIndex;
              // Un jour est "fait" s'il est dans les X derniers jours selon le streak
              const isDone =
                streak > 0 && i <= todayIndex && i > todayIndex - streak;
              return (
                <div
                  key={i}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 9,
                    fontWeight: 600,
                    background: isToday
                      ? 'var(--amber)'
                      : isDone
                      ? 'rgba(245,158,11,0.25)'
                      : 'var(--surface2)',
                    color: isToday
                      ? '#000'
                      : isDone
                      ? 'var(--amber)'
                      : 'var(--muted)',
                    border: isToday
                      ? 'none'
                      : isDone
                      ? '1px solid rgba(245,158,11,0.4)'
                      : '1px solid var(--border)',
                    transition: 'all 0.2s',
                    boxShadow: isToday
                      ? '0 0 8px rgba(245,158,11,0.5)'
                      : 'none',
                  }}
                >
                  {day}
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 10,
            marginTop: 16,
            animation: 'fadeUp 0.4s ease 0.16s both',
          }}
        >
          {isNew
            ? [
                {
                  icon: 'fa-star',
                  color: 'var(--accent)',
                  label: 'Score moyen',
                  empty: '—',
                },
                {
                  icon: 'fa-circle-play',
                  color: 'var(--green)',
                  label: 'Quiz passés',
                  empty: '0',
                },
                {
                  icon: 'fa-chart-pie',
                  color: 'var(--amber)',
                  label: 'Taux réussite',
                  empty: '—',
                },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    padding: '14px 12px',
                    textAlign: 'center',
                  }}
                >
                  <i
                    className={`fa-solid ${s.icon}`}
                    style={{
                      fontSize: 20,
                      color: s.color,
                      marginBottom: 6,
                      display: 'block',
                    }}
                  />
                  <div
                    style={{
                      fontFamily: 'var(--font-title)',
                      fontWeight: 700,
                      fontSize: 18,
                      color: s.color,
                    }}
                  >
                    {s.empty}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--muted)',
                      marginTop: 3,
                    }}
                  >
                    {s.label}
                  </div>
                </div>
              ))
            : [
                {
                  value: `${stats.avg}/20`,
                  color: 'var(--accent)',
                  label: 'Score moyen',
                  icon: 'fa-star',
                },
                {
                  value: stats.total,
                  color: 'var(--green)',
                  label: 'Quiz passés',
                  icon: 'fa-circle-play',
                },
                {
                  value: `${stats.rate}%`,
                  color: 'var(--amber)',
                  label: 'Taux réussite',
                  icon: 'fa-chart-pie',
                },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    padding: '14px 12px',
                    textAlign: 'center',
                    transition: 'transform 0.2s',
                    cursor: 'default',
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
                  <i
                    className={`fa-solid ${s.icon}`}
                    style={{
                      fontSize: 16,
                      color: s.color,
                      marginBottom: 6,
                      display: 'block',
                    }}
                  />
                  <div
                    style={{
                      fontFamily: 'var(--font-title)',
                      fontWeight: 700,
                      fontSize: 20,
                      color: s.color,
                    }}
                  >
                    {s.value}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--muted)',
                      marginTop: 3,
                    }}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
        </div>

        {/* CTA Quiz */}
        <div
          style={{ marginTop: 20, animation: 'fadeUp 0.4s ease 0.24s both' }}
        >
          <div
            onClick={() => onNavigate('quiz-select')}
            style={{
              background: 'linear-gradient(135deg, #4F8EF7, #7C3AED)',
              borderRadius: 'var(--radius-lg)',
              padding: '22px 20px',
              cursor: 'pointer',
              transition: 'transform 0.2s, filter 0.2s',
              boxShadow: '0 4px 20px rgba(79,142,247,0.35)',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform =
                'translateY(-2px)';
              (e.currentTarget as HTMLElement).style.filter =
                'brightness(1.06)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform =
                'translateY(0)';
              (e.currentTarget as HTMLElement).style.filter = 'brightness(1)';
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
              <span
                style={{
                  background: 'rgba(255,255,255,0.18)',
                  borderRadius: 8,
                  padding: '4px 12px',
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                <i className="fa-solid fa-bolt" style={{ marginRight: 5 }} />
                Quiz solo
              </span>
              <div
                style={{
                  width: 34,
                  height: 34,
                  background: 'rgba(255,255,255,0.18)',
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <i
                  className="fa-solid fa-arrow-right"
                  style={{ fontSize: 14 }}
                />
              </div>
            </div>
            <div
              style={{
                fontFamily: 'var(--font-title)',
                fontWeight: 700,
                fontSize: 20,
              }}
            >
              {isNew ? 'Lancer mon premier quiz' : 'Commencer un quiz'}
            </div>
            <div style={{ fontSize: 13, opacity: 0.75, marginTop: 4 }}>
              {profile?.program && profile?.level
                ? `${profile.program} · ${profile.level}`
                : 'Choisis ta matière'}
            </div>
          </div>
        </div>

        {/* Accès rapide */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            marginTop: 14,
            animation: 'fadeUp 0.4s ease 0.32s both',
          }}
        >
          <div
            onClick={() => onNavigate('competition')}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '16px 14px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform =
                'translateY(-2px)';
              (e.currentTarget as HTMLElement).style.borderColor =
                'rgba(239,68,68,0.3)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform =
                'translateY(0)';
              (e.currentTarget as HTMLElement).style.borderColor =
                'var(--border)';
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'rgba(239,68,68,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 17,
                marginBottom: 10,
              }}
            >
              <i
                className="fa-solid fa-ranking-star"
                style={{ color: '#F87171' }}
              />
            </div>
            <div
              style={{
                fontFamily: 'var(--font-title)',
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              Compétition
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>
              Affronter tes pairs
            </div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                background: 'rgba(239,68,68,0.12)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 6,
                padding: '2px 8px',
                fontSize: 10,
                color: '#F87171',
                marginTop: 6,
              }}
            >
              <div
                style={{
                  width: 5,
                  height: 5,
                  background: '#EF4444',
                  borderRadius: '50%',
                  animation: 'pulse 1.2s ease infinite',
                }}
              />
              Actif maintenant
            </div>
          </div>

          <div
            onClick={handleInvite}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '16px 14px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform =
                'translateY(-2px)';
              (e.currentTarget as HTMLElement).style.borderColor =
                'rgba(37,211,102,0.3)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform =
                'translateY(0)';
              (e.currentTarget as HTMLElement).style.borderColor =
                'var(--border)';
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'rgba(37,211,102,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 17,
                marginBottom: 10,
              }}
            >
              <i
                className="fa-brands fa-whatsapp"
                style={{ color: '#25D366' }}
              />
            </div>
            <div
              style={{
                fontFamily: 'var(--font-title)',
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              Inviter un ami
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>
              Partager sur WhatsApp
            </div>
          </div>
        </div>

        {/* Annonces */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 24,
            marginBottom: 10,
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-title)',
              fontWeight: 600,
              fontSize: 15,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <i
              className="fa-solid fa-bullhorn"
              style={{ color: 'var(--accent)', fontSize: 14 }}
            />
            Annonces
          </div>
          <span
            onClick={handleNotifClick}
            style={{
              fontSize: 12,
              color: 'var(--accent)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.opacity = '0.7')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.opacity = '1')
            }
          >
            Voir tout{' '}
            <i className="fa-solid fa-chevron-right" style={{ fontSize: 10 }} />
          </span>
        </div>

        {announcements.length === 0 ? (
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: 20,
              textAlign: 'center',
              color: 'var(--muted)',
              fontSize: 13,
            }}
          >
            <i
              className="fa-solid fa-bullhorn"
              style={{
                fontSize: 22,
                marginBottom: 8,
                display: 'block',
                opacity: 0.3,
              }}
            />
            Aucune annonce pour le moment
          </div>
        ) : (
          announcements.map((a: any, idx: number) => (
            <div
              key={a.id}
              onClick={handleNotifClick}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '14px 16px',
                marginBottom: 10,
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
                cursor: 'pointer',
                transition: 'all 0.2s',
                animation: `fadeUp 0.4s ease ${0.1 * idx}s both`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform =
                  'translateX(4px)';
                (e.currentTarget as HTMLElement).style.borderColor =
                  'rgba(79,142,247,0.3)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform =
                  'translateX(0)';
                (e.currentTarget as HTMLElement).style.borderColor =
                  'var(--border)';
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
                  className="fa-solid fa-bell"
                  style={{ fontSize: 14, color: 'var(--accent)' }}
                />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 3 }}>
                  {a.title}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                  {formatDate(a.created_at)}
                </div>
              </div>
            </div>
          ))
        )}

        {/* Historique */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 24,
            marginBottom: 10,
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-title)',
              fontWeight: 600,
              fontSize: 15,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <i
              className="fa-solid fa-clock-rotate-left"
              style={{ color: 'var(--green)', fontSize: 14 }}
            />
            Dernières sessions
          </div>
          <span
            onClick={() => onNavigate('sessions')}
            style={{
              fontSize: 12,
              color: 'var(--accent)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.opacity = '0.7')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.opacity = '1')
            }
          >
            Voir tout{' '}
            <i className="fa-solid fa-chevron-right" style={{ fontSize: 10 }} />
          </span>
        </div>

        {history.length === 0 ? (
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: 24,
              textAlign: 'center',
              color: 'var(--muted)',
              fontSize: 13,
            }}
          >
            <i
              className="fa-solid fa-clock-rotate-left"
              style={{
                fontSize: 24,
                marginBottom: 10,
                display: 'block',
                opacity: 0.3,
              }}
            />
            Aucune session pour le moment.
            <br />
            <span
              style={{
                color: 'var(--accent)',
                cursor: 'pointer',
                marginTop: 6,
                display: 'inline-block',
              }}
              onClick={() => onNavigate('quiz-select')}
            >
              Lance ton premier quiz !
            </span>
          </div>
        ) : (
          history.map((h: any, idx: number) => (
            <div
              key={h.id}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '14px 16px',
                marginBottom: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.2s',
                animation: `fadeUp 0.4s ease ${0.1 * idx}s both`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform =
                  'translateX(4px)';
                (e.currentTarget as HTMLElement).style.borderColor =
                  'rgba(79,142,247,0.2)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform =
                  'translateX(0)';
                (e.currentTarget as HTMLElement).style.borderColor =
                  'var(--border)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: 'rgba(79,142,247,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <i
                    className="fa-solid fa-diagram-project"
                    style={{ fontSize: 15, color: 'var(--accent)' }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>
                    {h.subject_name}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--muted)',
                      marginTop: 1,
                    }}
                  >
                    {formatDate(h.played_at)} · {h.total} questions
                  </div>
                </div>
              </div>
              <div
                style={{
                  padding: '5px 12px',
                  borderRadius: 8,
                  fontFamily: 'var(--font-title)',
                  fontWeight: 700,
                  fontSize: 13,
                  background:
                    (h.score / h.total) * 20 >= 10
                      ? 'rgba(16,185,129,0.15)'
                      : 'rgba(239,68,68,0.15)',
                  color:
                    (h.score / h.total) * 20 >= 10
                      ? 'var(--green)'
                      : 'var(--red)',
                  border: `1px solid ${
                    (h.score / h.total) * 20 >= 10
                      ? 'rgba(16,185,129,0.2)'
                      : 'rgba(239,68,68,0.2)'
                  }`,
                }}
              >
                {Math.round((h.score / h.total) * 20 * 10) / 10}/20
              </div>
            </div>
          ))
        )}
      </div>
      <BottomNav active="dashboard" onNavigate={onNavigate} />
    </div>
  );
}
