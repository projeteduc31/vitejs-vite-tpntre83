import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { BackButton } from '../components/UI';

export default function SessionsPage({
  onNavigate,
}: {
  onNavigate: (p: string) => void;
}) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ avg: 0, total: 0, rate: 0, best: 0 });

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('quiz_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('played_at', { ascending: false })
        .limit(20);

      setSessions(data || []);

      if (data && data.length > 0) {
        const total = data.length;
        const avg =
          data.reduce((s: number, q: any) => s + (q.score / q.total) * 20, 0) /
          total;
        const rate = Math.round(
          (data.filter((q: any) => (q.score / q.total) * 20 >= 10).length /
            total) *
            100
        );
        const best = Math.max(
          ...data.map(
            (q: any) => Math.round((q.score / q.total) * 20 * 10) / 10
          )
        );
        setStats({ avg: Math.round(avg * 10) / 10, total, rate, best });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diff === 0) return "Aujourd'hui";
    if (diff === 1) return 'Hier';
    if (diff < 7) return `Il y a ${diff} jours`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const getScore20 = (session: any) =>
    Math.round((session.score / session.total) * 20 * 10) / 10;

  const getAppreciation = (score: number) => {
    if (score >= 18) return { label: 'Excellent', color: '#10B981' };
    if (score >= 14) return { label: 'Très bien', color: '#4F8EF7' };
    if (score >= 10) return { label: 'Bien', color: '#F59E0B' };
    return { label: 'À retravailler', color: '#EF4444' };
  };

  return (
    <div className="page-container">
      <div className="bg-glow" />
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* En-tête */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            paddingTop: 24,
            marginBottom: 20,
          }}
        >
          <BackButton onClick={() => onNavigate('dashboard')} />
          <div>
            <div
              style={{
                fontFamily: 'var(--font-title)',
                fontWeight: 700,
                fontSize: 18,
              }}
            >
              Mes sessions
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
              {sessions.length} dernière{sessions.length > 1 ? 's' : ''} session
              {sessions.length > 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Stats globales */}
        {!loading && sessions.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr 1fr',
              gap: 8,
              marginBottom: 20,
              animation: 'fadeUp 0.4s ease both',
            }}
          >
            {[
              {
                value: `${stats.avg}/20`,
                label: 'Moyenne',
                color: 'var(--accent)',
                icon: 'fa-star',
              },
              {
                value: stats.total,
                label: 'Total',
                color: 'var(--green)',
                icon: 'fa-circle-check',
              },
              {
                value: `${stats.rate}%`,
                label: 'Réussite',
                color: 'var(--amber)',
                icon: 'fa-chart-pie',
              },
              {
                value: `${stats.best}/20`,
                label: 'Meilleur',
                color: '#F87171',
                icon: 'fa-trophy',
              },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '12px 8px',
                  textAlign: 'center',
                }}
              >
                <i
                  className={`fa-solid ${s.icon}`}
                  style={{
                    fontSize: 14,
                    color: s.color,
                    marginBottom: 5,
                    display: 'block',
                  }}
                />
                <div
                  style={{
                    fontFamily: 'var(--font-title)',
                    fontWeight: 700,
                    fontSize: 14,
                    color: s.color,
                  }}
                >
                  {s.value}
                </div>
                <div
                  style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div
            style={{ display: 'flex', justifyContent: 'center', padding: 40 }}
          >
            <i
              className="fa-solid fa-spinner fa-spin"
              style={{ fontSize: 24, color: 'var(--accent)' }}
            />
          </div>
        ) : sessions.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 0',
              color: 'var(--muted)',
            }}
          >
            <i
              className="fa-solid fa-clock-rotate-left"
              style={{
                fontSize: 40,
                marginBottom: 16,
                display: 'block',
                opacity: 0.3,
              }}
            />
            <div
              style={{
                fontFamily: 'var(--font-title)',
                fontWeight: 600,
                fontSize: 16,
                marginBottom: 6,
              }}
            >
              Aucune session
            </div>
            <div style={{ fontSize: 13 }}>
              Tes quiz apparaîtront ici après ta première session.
            </div>
            <div
              style={{
                marginTop: 16,
                cursor: 'pointer',
                color: 'var(--accent)',
                fontSize: 13,
              }}
              onClick={() => onNavigate('quiz-select')}
            >
              <i className="fa-solid fa-play" style={{ marginRight: 6 }} />
              Lancer un quiz
            </div>
          </div>
        ) : (
          sessions.map((s: any, idx: number) => {
            const score20 = getScore20(s);
            const appre = getAppreciation(score20);
            return (
              <div
                key={s.id}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '14px 16px',
                  marginBottom: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s',
                  cursor: 'default',
                  animation: `fadeUp 0.4s ease ${idx * 0.05}s both`,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform =
                    'translateX(4px)';
                  (
                    e.currentTarget as HTMLElement
                  ).style.borderColor = `${appre.color}40`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform =
                    'translateX(0)';
                  (e.currentTarget as HTMLElement).style.borderColor =
                    'var(--border)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {/* Icône initiales de la matière */}
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      background: `${appre.color}18`,
                      border: `1px solid ${appre.color}30`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-title)',
                        fontWeight: 700,
                        fontSize: 13,
                        color: appre.color,
                      }}
                    >
                      {s.subject_name
                        ?.split(' ')
                        .map((w: string) => w[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div
                      style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}
                    >
                      {s.subject_name}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 11,
                        color: 'var(--muted)',
                      }}
                    >
                      <span>
                        <i
                          className="fa-regular fa-clock"
                          style={{ marginRight: 3 }}
                        />
                        {formatDate(s.played_at)}
                      </span>
                      <span>·</span>
                      <span>{s.total} questions</span>
                      {s.skipped > 0 && (
                        <>
                          <span>·</span>
                          <span style={{ color: 'var(--amber)' }}>
                            {s.skipped} passées
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-title)',
                      fontWeight: 700,
                      fontSize: 16,
                      color: appre.color,
                    }}
                  >
                    {score20}/20
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: appre.color,
                      marginTop: 2,
                      background: `${appre.color}15`,
                      padding: '2px 7px',
                      borderRadius: 5,
                    }}
                  >
                    {appre.label}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
