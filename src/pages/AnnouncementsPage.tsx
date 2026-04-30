import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { BackButton } from '../components/UI';

export default function AnnouncementsPage({
  onNavigate,
}: {
  onNavigate: (p: string) => void;
}) {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_hidden', false)
        .order('created_at', { ascending: false });
      setAnnouncements(data || []);
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
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
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
            marginBottom: 24,
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
              Annonces
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
              {announcements.length} annonce
              {announcements.length > 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {loading ? (
          <div
            style={{ display: 'flex', justifyContent: 'center', padding: 40 }}
          >
            <i
              className="fa-solid fa-spinner fa-spin"
              style={{ fontSize: 24, color: 'var(--accent)' }}
            />
          </div>
        ) : announcements.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: 'var(--muted)',
            }}
          >
            <i
              className="fa-solid fa-bullhorn"
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
              Aucune annonce
            </div>
            <div style={{ fontSize: 13 }}>
              Les annonces de ton établissement apparaîtront ici.
            </div>
          </div>
        ) : (
          announcements.map((a: any, idx: number) => (
            <div
              key={a.id}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '18px 16px',
                marginBottom: 12,
                transition: 'all 0.2s',
                cursor: 'pointer',
                animation: `fadeUp 0.4s ease ${idx * 0.06}s both`,
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
                style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: 'rgba(79,142,247,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <i
                    className="fa-solid fa-bullhorn"
                    style={{ fontSize: 16, color: 'var(--accent)' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-title)',
                      fontWeight: 600,
                      fontSize: 14,
                      marginBottom: 6,
                    }}
                  >
                    {a.title}
                  </div>
                  {a.body && (
                    <div
                      style={{
                        fontSize: 13,
                        color: 'var(--muted)',
                        lineHeight: 1.6,
                        marginBottom: 8,
                      }}
                    >
                      {a.body}
                    </div>
                  )}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 11,
                      color: 'var(--muted)',
                    }}
                  >
                    <i className="fa-regular fa-clock" />
                    {formatDate(a.created_at)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
