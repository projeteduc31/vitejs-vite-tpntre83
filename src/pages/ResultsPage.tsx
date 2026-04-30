import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';

const SOUNDS = {
  excellent:
    'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3',
  bien: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
  moyen: 'https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3',
  faible: 'https://assets.mixkit.co/active_storage/sfx/2021/2021-preview.mp3',
};

export default function ResultsPage({
  results,
  questions,
  subjectName,
  subjectId,
  selectedSubject,
  onNext,
  onRetry,
  onOtherSubject,
  onHome,
  onViewLeaderboard,
}: any) {
  const [saved, setSaved] = useState(false);
  const [exporting, setExporting] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const savedRef = useRef(false); // ← bloque le double appel StrictMode

  useEffect(() => {
    if (results && !savedRef.current) {
      savedRef.current = true;
      saveSession();
      playSound(results.scoreOn20);
    }
  }, []);

  const playSound = (score: number) => {
    try {
      let url = SOUNDS.faible;
      if (score >= 16) url = SOUNDS.excellent;
      else if (score >= 12) url = SOUNDS.bien;
      else if (score >= 10) url = SOUNDS.moyen;
      const audio = new Audio(url);
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch (e) {}
  };

  const saveSession = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const totalQuestions = results.details?.length || questions?.length || 20;

      await supabase.from('quiz_sessions').insert({
        user_id: user.id,
        subject_id: subjectId || 'unknown',
        subject_name: subjectName || 'Matière inconnue',
        score: results.correct,
        total: totalQuestions,
        skipped: results.skipped,
        duration_sec: 0,
      });

      // Score compétition
      if (selectedSubject?.isCompetition && selectedSubject?.competitionId) {
        const { data: existing } = await supabase
          .from('competition_entries')
          .select('id, score, total')
          .eq('competition_id', selectedSubject.competitionId)
          .eq('user_id', user.id)
          .maybeSingle();

        const newScore20 = (results.correct / totalQuestions) * 20;
        const oldScore20 = existing
          ? (existing.score / existing.total) * 20
          : -1;

        if (!existing) {
          await supabase.from('competition_entries').insert({
            competition_id: selectedSubject.competitionId,
            user_id: user.id,
            subject_id: subjectId || selectedSubject.id,
            subject_name: subjectName || selectedSubject.name,
            score: results.correct,
            total: totalQuestions,
          });
        } else if (newScore20 > oldScore20) {
          await supabase
            .from('competition_entries')
            .update({
              score: results.correct,
              total: totalQuestions,
              played_at: new Date().toISOString(),
            })
            .eq('id', existing.id);
        }

        // ── Sauvegarde la progression (quiz suivant + réponses pour corrections) ──
        const quizNumber = selectedSubject.quizNumber || 1;

        // Récupère la progression existante
        const { data: progress } = await supabase
          .from('competition_progress')
          .select('*')
          .eq('competition_id', selectedSubject.competitionId)
          .eq('user_id', user.id)
          .maybeSingle();

        // Ajoute ce quiz aux réponses sauvegardées
        const existingAnswers = progress?.answers || [];
        const newAnswers = [
          ...existingAnswers,
          {
            quizNumber,
            score20: newScore20,
            correct: results.correct,
            total: totalQuestions,
            details: results.details,
          },
        ];

        if (progress) {
          await supabase
            .from('competition_progress')
            .update({
              next_quiz: quizNumber + 1,
              answers: newAnswers,
              updated_at: new Date().toISOString(),
            })
            .eq('id', progress.id);
        } else {
          await supabase.from('competition_progress').insert({
            competition_id: selectedSubject.competitionId,
            user_id: user.id,
            next_quiz: quizNumber + 1,
            answers: newAnswers,
          });
        }
      }

      await updateStreak(user.id);
      setSaved(true);
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
    }
  };

  const updateStreak = async (userId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const { data: profile } = await supabase
      .from('profiles')
      .select('streak_days, last_activity')
      .eq('id', userId)
      .single();
    if (!profile) return;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    let newStreak = profile.streak_days || 0;
    if (profile.last_activity === today) return;
    else if (profile.last_activity === yesterdayStr) newStreak += 1;
    else newStreak = 1;
    await supabase
      .from('profiles')
      .update({ streak_days: newStreak, last_activity: today })
      .eq('id', userId);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 400;
      const ctx = canvas.getContext('2d')!;
      const grad = ctx.createLinearGradient(0, 0, 600, 400);
      grad.addColorStop(0, '#0A0F1E');
      grad.addColorStop(1, '#1a2235');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 600, 400);
      ctx.fillStyle = '#4F8EF7';
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('QuizApp EDU', 300, 55);
      ctx.fillStyle = '#6B7FA3';
      ctx.font = '16px Arial';
      ctx.fillText(subjectName, 300, 85);
      const scoreColor = results.scoreOn20 >= 10 ? '#10B981' : '#EF4444';
      ctx.fillStyle = scoreColor;
      ctx.font = 'bold 80px Arial';
      ctx.fillText(`${results.scoreOn20}`, 300, 200);
      ctx.fillStyle = '#6B7FA3';
      ctx.font = '24px Arial';
      ctx.fillText('/ 20', 300, 235);
      ctx.fillStyle = '#F1F5FF';
      ctx.font = 'bold 22px Arial';
      ctx.fillText(results.appreciation, 300, 275);
      ctx.fillStyle = '#6B7FA3';
      ctx.font = '14px Arial';
      ctx.fillText(
        `✓ ${results.correct} bonnes  ✗ ${results.wrong} mauvaises  → ${results.skipped} passées`,
        300,
        315
      );
      ctx.fillStyle = '#4a5568';
      ctx.font = '12px Arial';
      ctx.fillText(
        new Date().toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
        300,
        360
      );
      const link = document.createElement('a');
      link.download = `resultat-quiz-${subjectName}-${results.scoreOn20}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  };

  if (!results) return null;
  const { correct, wrong, skipped, scoreOn20, appreciation, details } = results;
  const isCompetition = selectedSubject?.isCompetition;

  return (
    <div
      className="page-container"
      style={{ paddingBottom: 20 }}
      ref={resultRef}
    >
      <div
        className="bg-glow"
        style={{
          background:
            'radial-gradient(ellipse 500px 400px at 50% 0%, rgba(16,185,129,0.07) 0%, transparent 60%)',
        }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* En-tête */}
        <div
          style={{
            paddingTop: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8,
          }}
        >
          <button
            onClick={onHome}
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
              (e.currentTarget as HTMLElement).style.transform = 'scale(1.08)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
            }}
          >
            <i className="fa-solid fa-house" style={{ fontSize: 13 }} />
          </button>
          <div
            style={{
              fontSize: 13,
              color: 'var(--muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <i
              className="fa-solid fa-book"
              style={{ color: 'var(--accent)' }}
            />
            {subjectName}
            {isCompetition && (
              <span
                style={{
                  fontSize: 10,
                  background: 'rgba(245,158,11,0.15)',
                  color: 'var(--amber)',
                  padding: '2px 7px',
                  borderRadius: 5,
                }}
              >
                <i className="fa-solid fa-bolt" style={{ marginRight: 3 }} />
                Compétition
              </span>
            )}
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'rgba(79,142,247,0.1)',
              border: '1px solid rgba(79,142,247,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--accent)',
              transition: 'all 0.18s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'scale(1.08)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
            }}
            title="Exporter le résultat"
          >
            {exporting ? (
              <i
                className="fa-solid fa-spinner fa-spin"
                style={{ fontSize: 13 }}
              />
            ) : (
              <i className="fa-solid fa-share-nodes" style={{ fontSize: 13 }} />
            )}
          </button>
        </div>

        {/* Score */}
        <div
          style={{
            textAlign: 'center',
            paddingTop: 16,
            animation: 'fadeUp 0.5s ease both',
          }}
        >
          <ScoreRing score={scoreOn20} />
          <div
            style={{
              display: 'inline-block',
              padding: '6px 18px',
              borderRadius: 20,
              fontFamily: 'var(--font-title)',
              fontWeight: 700,
              fontSize: 14,
              marginBottom: 6,
              background:
                scoreOn20 >= 10
                  ? 'rgba(16,185,129,0.15)'
                  : 'rgba(239,68,68,0.12)',
              border: `1px solid ${
                scoreOn20 >= 10 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.2)'
              }`,
              color: scoreOn20 >= 10 ? 'var(--green)' : 'var(--red)',
            }}
          >
            <i className="fa-solid fa-star" style={{ marginRight: 5 }} />
            {appreciation}
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>
            {scoreOn20 >= 16
              ? '🏆 Performance exceptionnelle !'
              : scoreOn20 >= 10
              ? '👍 Bon travail, continue !'
              : '💪 Ne lâche pas, tu vas progresser !'}
          </div>
          {saved && (
            <div
              style={{
                fontSize: 11,
                color: 'var(--green)',
                marginTop: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}
            >
              <i className="fa-solid fa-cloud-arrow-up" /> Score sauvegardé
            </div>
          )}
        </div>

        {/* Mini stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr',
            gap: 8,
            marginTop: 20,
            animation: 'fadeUp 0.4s ease 0.1s both',
          }}
        >
          {[
            {
              value: correct,
              color: 'var(--green)',
              icon: 'fa-check',
              label: 'Bonnes',
            },
            {
              value: wrong,
              color: 'var(--red)',
              icon: 'fa-xmark',
              label: 'Mauvaises',
            },
            {
              value: skipped,
              color: 'var(--amber)',
              icon: 'fa-forward',
              label: 'Passées',
            },
            {
              value: `${scoreOn20}`,
              color: 'var(--accent)',
              icon: 'fa-star',
              label: 'Score',
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
              <div
                style={{
                  fontFamily: 'var(--font-title)',
                  fontWeight: 700,
                  fontSize: 18,
                  color: s.color,
                }}
              >
                {s.value}
              </div>
              <div
                style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3 }}
              >
                <i
                  className={`fa-solid ${s.icon}`}
                  style={{ marginRight: 3 }}
                />
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Boutons — différents selon mode compétition ou solo */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
            marginTop: 16,
            animation: 'fadeUp 0.4s ease 0.2s both',
          }}
        >
          {isCompetition ? (
            // Mode compétition : voir classement + quiz suivant
            <>
              <div
                onClick={onViewLeaderboard}
                style={{
                  padding: 15,
                  borderRadius: 'var(--radius)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                  color: '#fff',
                  border: 'none',
                  gridColumn: '1 / -1',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform =
                    'translateY(-2px)';
                  (e.currentTarget as HTMLElement).style.filter =
                    'brightness(1.08)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform =
                    'translateY(0)';
                  (e.currentTarget as HTMLElement).style.filter =
                    'brightness(1)';
                }}
              >
                <i
                  className="fa-solid fa-ranking-star"
                  style={{ fontSize: 22 }}
                />
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-title)',
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    Voir le classement
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>
                    Résultats mis à jour
                  </div>
                </div>
              </div>
              <div
                onClick={onNext}
                style={{
                  padding: 15,
                  borderRadius: 'var(--radius)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  background: 'linear-gradient(135deg, #4F8EF7, #7C3AED)',
                  color: '#fff',
                  border: 'none',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform =
                    'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform =
                    'translateY(0)';
                }}
              >
                <i
                  className="fa-solid fa-forward-fast"
                  style={{ fontSize: 20 }}
                />
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-title)',
                      fontWeight: 600,
                      fontSize: 13,
                    }}
                  >
                    Quiz suivant
                  </div>
                  <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>
                    Même matière
                  </div>
                </div>
              </div>
              <div
                onClick={onHome}
                style={{
                  padding: 15,
                  borderRadius: 'var(--radius)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform =
                    'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform =
                    'translateY(0)';
                }}
              >
                <i className="fa-solid fa-house" style={{ fontSize: 20 }} />
                <div
                  style={{
                    fontFamily: 'var(--font-title)',
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  Accueil
                </div>
              </div>
            </>
          ) : (
            // Mode solo : 4 boutons normaux
            <>
              {[
                {
                  icon: 'fa-forward-fast',
                  label: 'Quiz suivant',
                  sub: 'Même matière',
                  style: {
                    background: 'linear-gradient(135deg, #4F8EF7, #7C3AED)',
                    color: '#fff',
                    border: 'none',
                  },
                  onClick: onNext,
                },
                {
                  icon: 'fa-rotate-left',
                  label: 'Reprendre',
                  sub: 'Mêmes questions',
                  style: {
                    background: 'rgba(16,185,129,0.1)',
                    border: '1px solid rgba(16,185,129,0.25)',
                    color: 'var(--green)',
                  },
                  onClick: onRetry,
                },
                {
                  icon: 'fa-book-open',
                  label: 'Autre matière',
                  sub: 'Même filière',
                  style: {
                    background: 'rgba(245,158,11,0.1)',
                    border: '1px solid rgba(245,158,11,0.25)',
                    color: 'var(--amber)',
                  },
                  onClick: onOtherSubject,
                },
                {
                  icon: 'fa-house',
                  label: 'Accueil',
                  sub: '',
                  style: {
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                  },
                  onClick: onHome,
                },
              ].map((b) => (
                <div
                  key={b.label}
                  onClick={b.onClick}
                  style={{
                    padding: 15,
                    borderRadius: 'var(--radius)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.2s',
                    ...b.style,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.transform =
                      'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.transform =
                      'translateY(0)';
                  }}
                >
                  <i
                    className={`fa-solid ${b.icon}`}
                    style={{ fontSize: 20 }}
                  />
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-title)',
                        fontWeight: 600,
                        fontSize: 13,
                      }}
                    >
                      {b.label}
                    </div>
                    {b.sub && (
                      <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>
                        {b.sub}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Correction */}
        <div
          style={{
            marginTop: 24,
            marginBottom: 12,
            fontFamily: 'var(--font-title)',
            fontWeight: 700,
            fontSize: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <i
            className="fa-solid fa-list-check"
            style={{ color: 'var(--accent)' }}
          />{' '}
          Correction complète
        </div>

        {details.map((d: any, i: number) => (
          <div
            key={i}
            style={{
              marginBottom: 12,
              borderRadius: 'var(--radius)',
              overflow: 'hidden',
              border: '1px solid var(--border)',
              animation: `fadeUp 0.4s ease ${i * 0.04}s both`,
            }}
          >
            <div
              style={{
                padding: '13px 16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                background: 'var(--surface)',
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 8,
                  flexShrink: 0,
                  marginTop: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  background:
                    d.status === 'correct'
                      ? 'rgba(16,185,129,0.2)'
                      : d.status === 'skipped'
                      ? 'rgba(245,158,11,0.2)'
                      : 'rgba(239,68,68,0.2)',
                  color:
                    d.status === 'correct'
                      ? 'var(--green)'
                      : d.status === 'skipped'
                      ? 'var(--amber)'
                      : 'var(--red)',
                }}
              >
                <i
                  className={`fa-solid ${
                    d.status === 'correct'
                      ? 'fa-check'
                      : d.status === 'skipped'
                      ? 'fa-forward'
                      : 'fa-xmark'
                  }`}
                />
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.5 }}>
                {d.question.text}
              </div>
            </div>
            <div
              style={{
                padding: '12px 16px',
                background: 'var(--surface2)',
                borderTop: '1px solid var(--border)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 7,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 500,
                    padding: '2px 8px',
                    borderRadius: 5,
                    minWidth: 76,
                    textAlign: 'center',
                    background:
                      d.status === 'correct'
                        ? 'rgba(16,185,129,0.15)'
                        : d.status === 'skipped'
                        ? 'rgba(245,158,11,0.15)'
                        : 'rgba(239,68,68,0.15)',
                    color:
                      d.status === 'correct'
                        ? 'var(--green)'
                        : d.status === 'skipped'
                        ? 'var(--amber)'
                        : 'var(--red)',
                  }}
                >
                  {d.status === 'skipped' ? 'Passée' : 'Ta réponse'}
                </span>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {d.chosenIndex !== null
                    ? `${String.fromCharCode(65 + d.chosenIndex)} — ${
                        d.question.options[d.chosenIndex]
                      }`
                    : 'Temps écoulé / ignorée'}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 500,
                    padding: '2px 8px',
                    borderRadius: 5,
                    minWidth: 76,
                    textAlign: 'center',
                    background: 'rgba(16,185,129,0.15)',
                    color: 'var(--green)',
                  }}
                >
                  Bonne réponse
                </span>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {String.fromCharCode(65 + d.question.correct)} —{' '}
                  {d.question.options[d.question.correct]}
                </span>
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--muted)',
                  lineHeight: 1.6,
                  marginTop: 8,
                  paddingTop: 8,
                  borderTop: '1px solid var(--border)',
                }}
              >
                {d.question.explanation}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const pct = score / 20;
  const C = 2 * Math.PI * 55;
  const color = score >= 16 ? '#10B981' : score >= 10 ? '#4F8EF7' : '#EF4444';
  return (
    <div
      style={{
        position: 'relative',
        width: 130,
        height: 130,
        margin: '0 auto 16px',
      }}
    >
      <svg
        width="130"
        height="130"
        viewBox="0 0 130 130"
        style={{ transform: 'rotate(-90deg)' }}
      >
        <circle
          cx="65"
          cy="65"
          r="55"
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="10"
        />
        <circle
          cx="65"
          cy="65"
          r="55"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - pct)}
          style={{ transition: 'stroke-dashoffset 1.2s ease, stroke 0.5s' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-title)',
            fontWeight: 800,
            fontSize: 34,
            color,
            transition: 'color 0.5s',
          }}
        >
          {score}
        </div>
        <div style={{ fontSize: 14, color: 'var(--muted)' }}>/20</div>
      </div>
    </div>
  );
}
