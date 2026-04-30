import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { BottomNav } from '../components/UI';
import { SUBJECTS, QUESTIONS } from '../data/mockData';

function getProgramId(program: string): string {
  const map: Record<string, string> = {
    Informatique: 'prog-info',
    Mathématiques: 'prog-math',
    'Physique-Chimie': 'prog-phys',
    'Droit civil': 'prog-dci',
    Médecine: 'prog-mgen',
    Finance: 'prog-fin',
    Marketing: 'prog-mkt',
  };
  return map[program] || 'prog-info';
}

function getSubjectsForProfile(profile: any): any[] {
  if (!profile?.program) return Object.values(SUBJECTS).flat();
  const programId = getProgramId(profile.program);
  const allKeys = Object.keys(SUBJECTS).filter((k) => k.startsWith(programId));
  if (allKeys.length === 0) return Object.values(SUBJECTS).flat();
  return allKeys.flatMap((k) => SUBJECTS[k]);
}

export default function CompetitionPage({
  onNavigate,
  onBack,
}: {
  onNavigate: (p: string, d?: any) => void;
  onBack: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'classement' | 'corrections'>(
    'classement'
  );
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [myProfile, setMyProfile] = useState<any>(null);
  const [myProgress, setMyProgress] = useState<any>(null);
  const [myAnswers, setMyAnswers] = useState<any[]>([]);
  const [competition, setCompetition] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSubject, setModalSubject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingBoard, setLoadingBoard] = useState(false);
  const [totalPlayers, setTotalPlayers] = useState(0);

  useEffect(() => {
    loadMyProfile();
  }, []);
  useEffect(() => {
    if (activeSubject) loadCompetitionData(activeSubject);
  }, [activeSubject]);

  const loadMyProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setMyProfile(data);
      const subjects = getSubjectsForProfile(data);
      if (subjects.length > 0) setActiveSubject(subjects[0].id);
      const { count } = await supabase
        .from('competition_entries')
        .select('user_id', { count: 'exact', head: true });
      setTotalPlayers(count || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadCompetitionData = async (subjectId: string) => {
    setLoadingBoard(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Récupère la compétition active (non expirée)
      const { data: comp } = await supabase
        .from('competitions')
        .select('*')
        .eq('subject_id', subjectId)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setCompetition(comp);

      if (!comp) {
        setLeaderboard([]);
        setMyProgress(null);
        setLoadingBoard(false);
        return;
      }

      // Progression de l'utilisateur
      const { data: progress } = await supabase
        .from('competition_progress')
        .select('*')
        .eq('competition_id', comp.id)
        .eq('user_id', user.id)
        .maybeSingle();

      setMyProgress(progress);
      setMyAnswers(progress?.answers || []);

      // Classement — les entrées de moins de 2 semaines
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const { data: entries } = await supabase
        .from('competition_entries')
        .select(
          'score, total, played_at, profiles:user_id (id, full_name, username, avatar_url)'
        )
        .eq('subject_id', subjectId)
        .gte('played_at', twoWeeksAgo.toISOString())
        .order('score', { ascending: false })
        .limit(15);

      if (!entries) {
        setLeaderboard([]);
        return;
      }

      const ranked = entries
        .map((e: any) => ({
          userId: e.profiles?.id,
          name: e.profiles?.username || e.profiles?.full_name || 'Anonyme',
          avatarUrl: e.profiles?.avatar_url || null,
          initials: getInitials(
            e.profiles?.username || e.profiles?.full_name || 'AN'
          ),
          score20: Math.round((e.score / e.total) * 20 * 10) / 10,
          score: e.score,
          total: e.total,
          playedAt: e.played_at,
          isMe: e.profiles?.id === user.id,
        }))
        .sort((a: any, b: any) => b.score20 - a.score20)
        .map((e: any, idx: number) => ({ ...e, rank: idx + 1 }));

      setLeaderboard(ranked);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBoard(false);
    }
  };

  // Lance le quiz suivant de la compétition
  const handleJoin = async () => {
    if (!modalSubject) return;
    setModalOpen(false);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Trouve ou crée la compétition
    let comp = competition;
    if (!comp) {
      const { data: newComp } = await supabase
        .from('competitions')
        .insert({
          subject_id: modalSubject.id,
          subject_name: modalSubject.name,
          expires_at: new Date(
            Date.now() + 14 * 24 * 60 * 60 * 1000
          ).toISOString(),
        })
        .select()
        .single();
      comp = newComp;
      setCompetition(comp);
    }

    // Trouve ou crée la progression
    let progress = myProgress;
    if (!progress) {
      const { data: newProgress } = await supabase
        .from('competition_progress')
        .insert({
          competition_id: comp.id,
          user_id: user.id,
          next_quiz: 1,
          answers: [],
        })
        .select()
        .single();
      progress = newProgress;
      setMyProgress(progress);
    }

    const nextQuiz = progress?.next_quiz || 1;

    // Génère ou récupère les questions fixes pour ce quiz
    const { data: existingQuiz } = await supabase
      .from('competition_quizzes')
      .select('*')
      .eq('competition_id', comp.id)
      .eq('quiz_number', nextQuiz)
      .maybeSingle();

    let quizQuestions;
    if (existingQuiz) {
      quizQuestions = existingQuiz.questions;
    } else {
      // Génère les questions et les sauvegarde pour que tous aient les mêmes
      const pool = QUESTIONS[modalSubject.id] || [];
      const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 20);
      await supabase.from('competition_quizzes').insert({
        competition_id: comp.id,
        quiz_number: nextQuiz,
        questions: shuffled,
      });
      quizQuestions = shuffled;
    }

    // Lance le quiz avec les questions fixes
    onNavigate('quiz', {
      subject: {
        ...modalSubject,
        competitionId: comp.id,
        isCompetition: true,
        quizNumber: nextQuiz,
        fixedQuestions: quizQuestions,
      },
    });
  };

  // Bouton "Quiz suivant" après avoir terminé un quiz
  const handleNextQuiz = async () => {
    if (!competition || !activeSubject) return;
    const subject = getSubjectsForProfile(myProfile).find(
      (s: any) => s.id === activeSubject
    );
    if (!subject) return;
    setModalSubject(subject);
    await handleJoinWithSubject(subject);
  };

  const handleJoinWithSubject = async (subject: any) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    let comp = competition;
    if (!comp) return;

    const { data: progress } = await supabase
      .from('competition_progress')
      .select('*')
      .eq('competition_id', comp.id)
      .eq('user_id', user.id)
      .maybeSingle();

    const nextQuiz = progress?.next_quiz || 1;

    const { data: existingQuiz } = await supabase
      .from('competition_quizzes')
      .select('*')
      .eq('competition_id', comp.id)
      .eq('quiz_number', nextQuiz)
      .maybeSingle();

    let quizQuestions;
    if (existingQuiz) {
      quizQuestions = existingQuiz.questions;
    } else {
      const pool = QUESTIONS[subject.id] || [];
      const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 20);
      await supabase.from('competition_quizzes').insert({
        competition_id: comp.id,
        quiz_number: nextQuiz,
        questions: shuffled,
      });
      quizQuestions = shuffled;
    }

    onNavigate('quiz', {
      subject: {
        ...subject,
        competitionId: comp.id,
        isCompetition: true,
        quizNumber: nextQuiz,
        fixedQuestions: quizQuestions,
      },
    });
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

  const subjects = getSubjectsForProfile(myProfile);
  const myEntry = leaderboard.find((e) => e.isMe);
  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);
  const activeSubjectObj = subjects.find((s) => s.id === activeSubject);
  const nextQuizNumber = myProgress?.next_quiz || 1;
  const hasStarted = myProgress && nextQuizNumber > 1;

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

  return (
    <div className="page-container">
      <div
        className="bg-glow"
        style={{
          background:
            'radial-gradient(ellipse 500px 400px at 50% 0%, rgba(245,158,11,0.07) 0%, transparent 60%)',
        }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* En-tête */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            paddingTop: 24,
            marginBottom: 18,
          }}
        >
          <button
            onClick={onBack}
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
              (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
            }}
          >
            <i className="fa-solid fa-arrow-left" style={{ fontSize: 13 }} />
          </button>
          <div
            style={{
              fontFamily: 'var(--font-title)',
              fontWeight: 700,
              fontSize: 20,
            }}
          >
            Compétition
          </div>
        </div>

        {/* Tabs Classement / Corrections */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            marginBottom: 16,
            background: 'var(--surface)',
            borderRadius: 12,
            padding: 4,
            border: '1px solid var(--border)',
          }}
        >
          {[
            { id: 'classement', label: 'Classement', icon: 'fa-ranking-star' },
            { id: 'corrections', label: 'Corrections', icon: 'fa-list-check' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                flex: 1,
                padding: '10px 0',
                borderRadius: 9,
                border: 'none',
                fontFamily: 'var(--font-title)',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.2s',
                background:
                  activeTab === tab.id
                    ? 'linear-gradient(135deg, #4F8EF7, #7C3AED)'
                    : 'transparent',
                color: activeTab === tab.id ? '#fff' : 'var(--muted)',
                boxShadow:
                  activeTab === tab.id
                    ? '0 4px 12px rgba(79,142,247,0.3)'
                    : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <i className={`fa-solid ${tab.icon}`} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Carte Jouer */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1a1040, #0d1f3c)',
            border: '1px solid rgba(79,142,247,0.25)',
            borderRadius: 20,
            padding: '20px 18px',
            marginBottom: 16,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -30,
              right: -30,
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: 'rgba(79,142,247,0.08)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: -20,
              left: -20,
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'rgba(124,58,237,0.08)',
              pointerEvents: 'none',
            }}
          />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10,
              position: 'relative',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(239,68,68,0.15)',
                border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 20,
                padding: '5px 12px',
                fontSize: 12,
                color: '#F87171',
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  background: '#EF4444',
                  borderRadius: '50%',
                  animation: 'pulse 1.2s ease infinite',
                }}
              />
              {totalPlayers} actif{totalPlayers > 1 ? 's' : ''} maintenant
            </div>
            <button
              onClick={() => setModalOpen(true)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(245,158,11,0.15)',
                border: '1px solid rgba(245,158,11,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--amber)',
                fontSize: 16,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  'rgba(245,158,11,0.25)';
                (e.currentTarget as HTMLElement).style.transform =
                  'scale(1.1) rotate(-10deg)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  'rgba(245,158,11,0.15)';
                (e.currentTarget as HTMLElement).style.transform =
                  'scale(1) rotate(0deg)';
              }}
            >
              <i className="fa-solid fa-bolt" />
            </button>
          </div>

          <div
            style={{
              fontFamily: 'var(--font-title)',
              fontWeight: 800,
              fontSize: 22,
              marginBottom: 4,
            }}
          >
            {hasStarted
              ? `Quiz #${nextQuizNumber} — Continuer`
              : 'Jouer maintenant'}
          </div>
          <div
            style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}
          >
            {activeSubjectObj?.name || ''} · {myProfile?.level || ''} ·{' '}
            {hasStarted
              ? `${nextQuizNumber - 1} quiz complétés`
              : 'Premier quiz'}
          </div>

          <div
            style={{
              display: 'flex',
              gap: 8,
              marginBottom: 16,
              flexWrap: 'wrap',
            }}
          >
            {['20 questions', 'Chrono activé', 'Mêmes questions pour tous'].map(
              (tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: 11,
                    padding: '4px 10px',
                    borderRadius: 20,
                    background: 'rgba(255,255,255,0.07)',
                    color: 'var(--muted)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  {tag}
                </span>
              )
            )}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {/* Bouton jouer / continuer */}
            <button
              onClick={() => setModalOpen(true)}
              style={{
                flex: 1,
                padding: '13px 18px',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #4F8EF7, #7C3AED)',
                color: '#fff',
                fontFamily: 'var(--font-title)',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.2s',
                boxShadow: '0 4px 16px rgba(79,142,247,0.35)',
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
                (e.currentTarget as HTMLElement).style.filter = 'brightness(1)';
              }}
            >
              <i
                className={`fa-solid ${hasStarted ? 'fa-forward' : 'fa-play'}`}
              />
              {hasStarted ? `Quiz #${nextQuizNumber}` : 'Rejoindre'}
            </button>
          </div>
        </div>

        {/* Tabs matières */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            marginBottom: 16,
            paddingBottom: 2,
          }}
        >
          {subjects.map((s: any) => (
            <button
              key={s.id}
              onClick={() => setActiveSubject(s.id)}
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
                  activeSubject === s.id
                    ? 'rgba(79,142,247,0.15)'
                    : 'var(--surface)',
                border: `1.5px solid ${
                  activeSubject === s.id
                    ? 'rgba(79,142,247,0.4)'
                    : 'var(--border)'
                }`,
                color:
                  activeSubject === s.id ? 'var(--accent)' : 'var(--muted)',
                boxShadow:
                  activeSubject === s.id
                    ? '0 4px 12px rgba(79,142,247,0.15)'
                    : 'none',
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
              <span style={{ marginRight: 5, fontWeight: 700 }}>
                {s.name
                  .split(' ')
                  .map((w: string) => w[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
              {s.name.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* ── TAB CLASSEMENT ── */}
        {activeTab === 'classement' && (
          <>
            {myEntry && (
              <div
                style={{
                  background:
                    'linear-gradient(135deg, rgba(79,142,247,0.12), rgba(124,58,237,0.08))',
                  border: '1px solid rgba(79,142,247,0.25)',
                  borderRadius: 'var(--radius)',
                  padding: '14px 16px',
                  marginBottom: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  animation: 'fadeUp 0.4s ease both',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-title)',
                      fontWeight: 800,
                      fontSize: 26,
                      color: 'var(--accent)',
                      minWidth: 42,
                    }}
                  >
                    #{myEntry.rank}
                  </div>
                  <AvatarRound entry={myEntry} size={38} />
                  <div>
                    <div
                      style={{
                        fontFamily: 'var(--font-title)',
                        fontWeight: 600,
                        fontSize: 14,
                      }}
                    >
                      Ton classement
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--muted)',
                        marginTop: 1,
                      }}
                    >
                      {activeSubjectObj?.name} · Quiz #{nextQuizNumber - 1}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-title)',
                      fontWeight: 800,
                      fontSize: 20,
                      color: 'var(--green)',
                    }}
                  >
                    {myEntry.score20}/20
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--green)',
                      marginTop: 2,
                    }}
                  >
                    <i
                      className="fa-solid fa-arrow-up"
                      style={{ fontSize: 9, marginRight: 3 }}
                    />
                    Top {Math.round((myEntry.rank / leaderboard.length) * 100)}%
                  </div>
                </div>
              </div>
            )}

            {/* Info expiration */}
            {competition?.expires_at && (
              <div
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '9px 14px',
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 12,
                  color: 'var(--muted)',
                }}
              >
                <i
                  className="fa-solid fa-clock"
                  style={{ color: 'var(--amber)', fontSize: 13 }}
                />
                Compétition active jusqu'au{' '}
                {new Date(competition.expires_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                })}
              </div>
            )}

            {loadingBoard ? (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  padding: 40,
                }}
              >
                <i
                  className="fa-solid fa-spinner fa-spin"
                  style={{ fontSize: 22, color: 'var(--accent)' }}
                />
              </div>
            ) : leaderboard.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '50px 20px',
                  color: 'var(--muted)',
                }}
              >
                <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
                <div
                  style={{
                    fontFamily: 'var(--font-title)',
                    fontWeight: 700,
                    fontSize: 18,
                    marginBottom: 8,
                  }}
                >
                  Aucun participant encore
                </div>
                <div
                  style={{ fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}
                >
                  Sois le premier à rejoindre !
                </div>
                <button
                  onClick={() => setModalOpen(true)}
                  className="btn-primary"
                  style={{ maxWidth: 260, margin: '0 auto' }}
                >
                  <i className="fa-solid fa-bolt" /> Jouer maintenant
                </button>
              </div>
            ) : (
              <>
                {top3.length >= 1 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-end',
                      justifyContent: 'center',
                      gap: 8,
                      marginBottom: 20,
                      padding: '10px 0',
                    }}
                  >
                    {top3.length >= 2 && (
                      <PodiumItem entry={top3[1]} medal="silver" height={65} />
                    )}
                    {top3.length >= 1 && (
                      <PodiumItem entry={top3[0]} medal="gold" height={85} />
                    )}
                    {top3.length >= 3 && (
                      <PodiumItem entry={top3[2]} medal="bronze" height={50} />
                    )}
                  </div>
                )}
                {rest.map((entry: any, idx: number) => (
                  <LeaderboardRow
                    key={entry.userId}
                    entry={entry}
                    idx={idx}
                    myEntry={myEntry}
                  />
                ))}
              </>
            )}
          </>
        )}

        {/* ── TAB CORRECTIONS ── */}
        {activeTab === 'corrections' && (
          <div>
            {myAnswers.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '50px 20px',
                  color: 'var(--muted)',
                }}
              >
                <i
                  className="fa-solid fa-list-check"
                  style={{
                    fontSize: 40,
                    marginBottom: 16,
                    display: 'block',
                    opacity: 0.2,
                  }}
                />
                <div
                  style={{
                    fontFamily: 'var(--font-title)',
                    fontWeight: 600,
                    fontSize: 16,
                    marginBottom: 8,
                  }}
                >
                  Aucune correction disponible
                </div>
                <div style={{ fontSize: 13 }}>
                  Complète au moins un quiz pour voir les corrections.
                </div>
              </div>
            ) : (
              myAnswers.map((quizResult: any, quizIdx: number) => (
                <div key={quizIdx} style={{ marginBottom: 20 }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-title)',
                      fontWeight: 700,
                      fontSize: 15,
                      marginBottom: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 14px',
                      background: 'var(--surface)',
                      borderRadius: 10,
                      border: '1px solid var(--border)',
                    }}
                  >
                    <i
                      className="fa-solid fa-list-check"
                      style={{ color: 'var(--accent)' }}
                    />
                    Quiz #{quizIdx + 1}
                    <span
                      style={{
                        marginLeft: 'auto',
                        fontFamily: 'var(--font-title)',
                        fontWeight: 700,
                        fontSize: 14,
                        color:
                          quizResult.score20 >= 10
                            ? 'var(--green)'
                            : 'var(--red)',
                      }}
                    >
                      {quizResult.score20}/20
                    </span>
                  </div>
                  {quizResult.details?.map((d: any, i: number) => (
                    <div
                      key={i}
                      style={{
                        marginBottom: 10,
                        borderRadius: 'var(--radius)',
                        overflow: 'hidden',
                        border: '1px solid var(--border)',
                        animation: `fadeUp 0.3s ease ${i * 0.03}s both`,
                      }}
                    >
                      <div
                        style={{
                          padding: '12px 14px',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 10,
                          background: 'var(--surface)',
                        }}
                      >
                        <div
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 7,
                            flexShrink: 0,
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
                        <div style={{ fontSize: 12, lineHeight: 1.5 }}>
                          {d.question?.text}
                        </div>
                      </div>
                      <div
                        style={{
                          padding: '10px 14px',
                          background: 'var(--surface2)',
                          borderTop: '1px solid var(--border)',
                          fontSize: 11,
                          color: 'var(--muted)',
                        }}
                      >
                        <div style={{ marginBottom: 4 }}>
                          <span
                            style={{ color: 'var(--green)', fontWeight: 500 }}
                          >
                            ✓ Bonne réponse :{' '}
                          </span>
                          {d.question?.options?.[d.question?.correct]}
                        </div>
                        {d.chosenIndex !== null &&
                          d.chosenIndex !== d.question?.correct && (
                            <div style={{ marginBottom: 4 }}>
                              <span
                                style={{ color: 'var(--red)', fontWeight: 500 }}
                              >
                                ✗ Ta réponse :{' '}
                              </span>
                              {d.question?.options?.[d.chosenIndex]}
                            </div>
                          )}
                        {d.question?.explanation && (
                          <div
                            style={{
                              marginTop: 6,
                              paddingTop: 6,
                              borderTop: '1px solid var(--border)',
                              lineHeight: 1.5,
                            }}
                          >
                            {d.question.explanation}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          onClick={() => setModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--surface)',
              borderRadius: '24px 24px 0 0',
              padding: '24px 20px 44px',
              width: '100%',
              maxWidth: 480,
              border: '1px solid var(--border)',
              animation: 'fadeUp 0.25s ease both',
            }}
          >
            <div
              style={{
                width: 40,
                height: 4,
                background: 'var(--surface3)',
                borderRadius: 2,
                margin: '0 auto 20px',
              }}
            />
            <div
              style={{
                fontFamily: 'var(--font-title)',
                fontWeight: 700,
                fontSize: 18,
                marginBottom: 4,
              }}
            >
              Choisir la matière
            </div>
            <div
              style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}
            >
              Mêmes questions pour tous · 20 questions · 1 seul essai par quiz
            </div>

            {subjects.map((s: any) => (
              <div
                key={s.id}
                onClick={() => setModalSubject(s)}
                style={{
                  background:
                    modalSubject?.id === s.id
                      ? 'rgba(79,142,247,0.08)'
                      : 'var(--surface2)',
                  border: `1.5px solid ${
                    modalSubject?.id === s.id
                      ? 'var(--accent)'
                      : 'var(--border)'
                  }`,
                  borderRadius: 14,
                  padding: '14px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  marginBottom: 10,
                  transition: 'all 0.18s',
                }}
                onMouseEnter={(e) => {
                  if (modalSubject?.id !== s.id) {
                    (e.currentTarget as HTMLElement).style.borderColor =
                      'rgba(79,142,247,0.3)';
                    (e.currentTarget as HTMLElement).style.transform =
                      'translateX(4px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (modalSubject?.id !== s.id) {
                    (e.currentTarget as HTMLElement).style.borderColor =
                      'var(--border)';
                    (e.currentTarget as HTMLElement).style.transform =
                      'translateX(0)';
                  }
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background:
                      modalSubject?.id === s.id
                        ? 'rgba(79,142,247,0.15)'
                        : 'var(--surface)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-title)',
                    fontWeight: 800,
                    fontSize: 14,
                    color:
                      modalSubject?.id === s.id
                        ? 'var(--accent)'
                        : 'var(--muted)',
                    flexShrink: 0,
                    border: '1px solid var(--border)',
                  }}
                >
                  {s.name
                    .split(' ')
                    .map((w: string) => w[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-title)',
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                  >
                    {s.name}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--muted)',
                      marginTop: 3,
                    }}
                  >
                    <i
                      className="fa-solid fa-circle-question"
                      style={{ marginRight: 4 }}
                    />
                    {s.questionCount} questions · 20 par quiz
                  </div>
                </div>
                {modalSubject?.id === s.id && (
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: 'var(--accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <i
                      className="fa-solid fa-check"
                      style={{ fontSize: 10, color: '#fff' }}
                    />
                  </div>
                )}
              </div>
            ))}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button
                onClick={() => setModalOpen(false)}
                style={{
                  flex: 1,
                  padding: 14,
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--muted)',
                  fontFamily: 'var(--font-title)',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.18s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    'var(--surface2)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    'transparent';
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleJoin}
                disabled={!modalSubject}
                style={{
                  flex: 2,
                  padding: 14,
                  borderRadius: 12,
                  border: 'none',
                  background: modalSubject
                    ? 'linear-gradient(135deg, #4F8EF7, #7C3AED)'
                    : 'var(--surface2)',
                  color: modalSubject ? '#fff' : 'var(--muted)',
                  fontFamily: 'var(--font-title)',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: modalSubject ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'all 0.2s',
                  boxShadow: modalSubject
                    ? '0 4px 16px rgba(79,142,247,0.3)'
                    : 'none',
                }}
                onMouseEnter={(e) => {
                  if (modalSubject) {
                    (e.currentTarget as HTMLElement).style.transform =
                      'translateY(-1px)';
                    (e.currentTarget as HTMLElement).style.filter =
                      'brightness(1.08)';
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform =
                    'translateY(0)';
                  (e.currentTarget as HTMLElement).style.filter =
                    'brightness(1)';
                }}
              >
                <i className="fa-solid fa-bolt" /> Lancer le quiz
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav active="competition" onNavigate={onNavigate} />
    </div>
  );
}

function AvatarRound({ entry, size = 40 }: { entry: any; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        flexShrink: 0,
        background: entry.avatarUrl
          ? 'transparent'
          : entry.isMe
          ? 'linear-gradient(135deg, #4F8EF7, #7C3AED)'
          : 'linear-gradient(135deg, #374151, #1F2937)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-title)',
        fontWeight: 700,
        fontSize: size * 0.33,
        color: '#fff',
        border: `2px solid ${entry.isMe ? 'var(--accent)' : 'var(--surface3)'}`,
        boxShadow: entry.isMe ? '0 0 0 2px rgba(79,142,247,0.3)' : 'none',
      }}
    >
      {entry.avatarUrl ? (
        <img
          src={entry.avatarUrl}
          alt={entry.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        entry.initials
      )}
    </div>
  );
}

function PodiumItem({
  entry,
  medal,
  height,
}: {
  entry: any;
  medal: string;
  height: number;
}) {
  const medals: Record<string, any> = {
    gold: {
      grad: 'linear-gradient(135deg,#F59E0B,#D97706)',
      bar: 'rgba(245,158,11,0.12)',
      barB: 'rgba(245,158,11,0.35)',
      text: '#F59E0B',
      size: 54,
    },
    silver: {
      grad: 'linear-gradient(135deg,#9CA3AF,#6B7280)',
      bar: 'rgba(156,163,175,0.08)',
      barB: 'rgba(156,163,175,0.25)',
      text: '#9CA3AF',
      size: 46,
    },
    bronze: {
      grad: 'linear-gradient(135deg,#D97706,#92400E)',
      bar: 'rgba(217,119,6,0.08)',
      barB: 'rgba(217,119,6,0.25)',
      text: '#D97706',
      size: 40,
    },
  };
  const s = medals[medal];
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flex: 1,
      }}
    >
      {medal === 'gold' && (
        <div
          style={{
            fontSize: 20,
            marginBottom: 4,
            animation: 'bounce 2s ease infinite',
          }}
        >
          👑
        </div>
      )}
      <div
        style={{
          width: s.size,
          height: s.size,
          borderRadius: '50%',
          overflow: 'hidden',
          background: entry.avatarUrl ? 'transparent' : s.grad,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-title)',
          fontWeight: 700,
          fontSize: s.size * 0.33,
          color: '#fff',
          border: `3px solid ${s.barB}`,
          marginBottom: 6,
          boxShadow: `0 4px 16px ${s.barB}`,
        }}
      >
        {entry.avatarUrl ? (
          <img
            src={entry.avatarUrl}
            alt={entry.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          entry.initials
        )}
      </div>
      <div
        style={{
          fontSize: 11,
          color: 'var(--text)',
          fontWeight: 600,
          marginBottom: 6,
          textAlign: 'center',
          maxWidth: 80,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {entry.name.split(' ')[0]}
      </div>
      <div
        style={{
          width: '100%',
          minHeight: height,
          borderRadius: '10px 10px 0 0',
          background: s.bar,
          border: `1px solid ${s.barB}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingBottom: 12,
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-title)',
            fontWeight: 800,
            fontSize: 20,
            color: s.text,
          }}
        >
          {entry.rank}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-title)',
            fontWeight: 700,
            fontSize: 13,
            color: s.text,
            marginTop: 2,
          }}
        >
          {entry.score20}/20
        </div>
      </div>
    </div>
  );
}

function LeaderboardRow({
  entry,
  idx,
  myEntry,
}: {
  entry: any;
  idx: number;
  myEntry: any;
}) {
  const isTop = entry.rank <= 5;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
        borderRadius: 'var(--radius)',
        marginBottom: 8,
        background: entry.isMe ? 'rgba(79,142,247,0.08)' : 'var(--surface)',
        border: `1px solid ${
          entry.isMe ? 'rgba(79,142,247,0.3)' : 'var(--border)'
        }`,
        transition: 'all 0.2s',
        animation: `fadeUp 0.4s ease ${idx * 0.04}s both`,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'translateX(4px)';
        (e.currentTarget as HTMLElement).style.borderColor = entry.isMe
          ? 'rgba(79,142,247,0.5)'
          : 'rgba(255,255,255,0.12)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'translateX(0)';
        (e.currentTarget as HTMLElement).style.borderColor = entry.isMe
          ? 'rgba(79,142,247,0.3)'
          : 'var(--border)';
      }}
    >
      <div
        style={{
          width: 28,
          textAlign: 'center',
          fontFamily: 'var(--font-title)',
          fontWeight: 700,
          fontSize: 14,
          color: isTop ? 'var(--amber)' : 'var(--muted)',
          flexShrink: 0,
        }}
      >
        {entry.rank}
      </div>
      <AvatarRound entry={entry} size={38} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {entry.name}
          {entry.isMe && (
            <span
              style={{
                fontSize: 10,
                color: 'var(--accent)',
                background: 'rgba(79,142,247,0.12)',
                padding: '2px 7px',
                borderRadius: 6,
                flexShrink: 0,
              }}
            >
              Toi
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>
          {new Date(entry.playedAt).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div
          style={{
            fontFamily: 'var(--font-title)',
            fontWeight: 700,
            fontSize: 16,
            color: entry.score20 >= 10 ? 'var(--green)' : 'var(--red)',
          }}
        >
          {entry.score20}/20
        </div>
      </div>
    </div>
  );
}
