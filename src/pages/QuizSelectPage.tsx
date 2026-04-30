import React, { useState, useMemo, useEffect } from 'react';
import { SUBJECTS, SEMESTERS_BY_LEVEL } from '../data/mockData';
import { BackButton } from '../components/UI';
import { supabase } from '../lib/supabase';

export default function QuizSelectPage({
  onStart,
  onBack,
}: {
  onStart: (s: any) => void;
  onBack: () => void;
}) {
  const [profile, setProfile] = useState<any>(null);
  const [step, setStep] = useState(0); // 0 = semestre, 1 = matière
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  // Charge le profil de l'utilisateur au démarrage
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
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
      setProfile(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Semestres disponibles selon le niveau du profil
  const availableSemesters = useMemo(() => {
    if (!profile?.level) {
      // Si pas de niveau, affiche tous les semestres
      return Object.values(SEMESTERS_BY_LEVEL).flat();
    }
    return (
      SEMESTERS_BY_LEVEL[profile.level] ||
      Object.values(SEMESTERS_BY_LEVEL).flat()
    );
  }, [profile]);

  // Matières disponibles selon la filière et le semestre sélectionné
  const availableSubjects = useMemo(() => {
    if (!selected.semester) return [];
    const programId = getProgramId(profile?.program || '');
    const key = `${programId}_${selected.semester.id}`;
    return SUBJECTS[key] || [];
  }, [selected.semester, profile]);

  // Filtrage par recherche
  const filteredSubjects = useMemo(() => {
    if (!search) return availableSubjects;
    return availableSubjects.filter((s: any) =>
      s.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [availableSubjects, search]);

  const handleSelectSemester = (semester: any) => {
    setSelected((prev) => ({ ...prev, semester }));
    setStep(1);
  };

  const handleSelectSubject = (subject: any) => {
    onStart(subject);
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

  return (
    <div className="page-container">
      <div className="bg-glow" />
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* ── En-tête ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            paddingTop: 24,
            marginBottom: 20,
          }}
        >
          <BackButton onClick={() => (step > 0 ? setStep(0) : onBack())} />
          <div>
            <div
              style={{
                fontFamily: 'var(--font-title)',
                fontWeight: 700,
                fontSize: 18,
              }}
            >
              Choisir un quiz
            </div>
            {profile?.program && (
              <div
                style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}
              >
                <i
                  className="fa-solid fa-graduation-cap"
                  style={{ marginRight: 5, color: 'var(--accent)' }}
                />
                {profile.program} · {profile.faculty || ''}
              </div>
            )}
          </div>
        </div>

        {/* ── Stepper (2 étapes seulement) ── */}
        <div
          style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}
        >
          {['Semestre', 'Matière'].map((label, i) => (
            <React.Fragment key={label}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-title)',
                    fontWeight: 700,
                    fontSize: 11,
                    background:
                      i < step
                        ? 'var(--green)'
                        : i === step
                        ? 'var(--accent)'
                        : 'var(--surface2)',
                    color: i <= step ? '#fff' : 'var(--muted)',
                    border: i > step ? '1px solid var(--border)' : 'none',
                    boxShadow:
                      i === step ? '0 0 0 4px rgba(79,142,247,0.2)' : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  {i < step ? (
                    <i className="fa-solid fa-check" style={{ fontSize: 10 }} />
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  style={{
                    fontSize: 12,
                    color: i === step ? 'var(--text)' : 'var(--muted)',
                    fontWeight: i === step ? 600 : 400,
                  }}
                >
                  {label}
                </span>
              </div>
              {i < 1 && (
                <div
                  style={{
                    flex: 1,
                    height: 2,
                    background: i < step ? 'var(--green)' : 'var(--border)',
                    margin: '0 10px',
                    transition: 'background 0.3s',
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* ── Étape 0 : Choix du semestre ── */}
        {step === 0 && (
          <>
            <div style={{ marginBottom: 16 }}>
              <div
                style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}
              >
                Étape 1 / 2
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-title)',
                  fontWeight: 700,
                  fontSize: 20,
                }}
              >
                Quel semestre ?
              </div>
              {profile?.level && (
                <div
                  style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}
                >
                  Niveau {profile.level} —{' '}
                  {profile.level === 'L1'
                    ? 'S1 et S2'
                    : profile.level === 'L2'
                    ? 'S3 et S4'
                    : 'S5 et S6'}
                </div>
              )}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
              }}
            >
              {availableSemesters.map((sem: any, idx: number) => (
                <div
                  key={sem.id}
                  onClick={() => handleSelectSemester(sem)}
                  style={{
                    background: 'var(--surface)',
                    border: '1.5px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '20px 16px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s',
                    animation: `fadeUp 0.4s ease ${idx * 0.08}s both`,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.transform =
                      'translateY(-3px)';
                    (e.currentTarget as HTMLElement).style.borderColor =
                      'var(--accent)';
                    (e.currentTarget as HTMLElement).style.boxShadow =
                      '0 8px 24px rgba(79,142,247,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.transform =
                      'translateY(0)';
                    (e.currentTarget as HTMLElement).style.borderColor =
                      'var(--border)';
                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--font-title)',
                      fontWeight: 800,
                      fontSize: 36,
                      background: 'linear-gradient(135deg, #4F8EF7, #7C3AED)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      marginBottom: 6,
                    }}
                  >
                    S{sem.num}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-title)',
                      fontWeight: 600,
                      fontSize: 13,
                    }}
                  >
                    {sem.label}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--muted)',
                      marginTop: 4,
                    }}
                  >
                    {sem.range}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Étape 1 : Choix de la matière ── */}
        {step === 1 && (
          <>
            {/* Fil d'ariane */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'rgba(79,142,247,0.1)',
                  border: '1px solid rgba(79,142,247,0.25)',
                  borderRadius: 8,
                  padding: '5px 10px',
                  fontSize: 12,
                  color: 'var(--accent)',
                }}
              >
                <i className="fa-solid fa-calendar" style={{ fontSize: 10 }} />
                {selected.semester?.label}
                <i
                  className="fa-solid fa-xmark"
                  style={{ fontSize: 10, cursor: 'pointer', opacity: 0.7 }}
                  onClick={() => {
                    setStep(0);
                    setSelected({});
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div
                style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}
              >
                Étape 2 / 2
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-title)',
                  fontWeight: 700,
                  fontSize: 20,
                }}
              >
                Quelle matière ?
              </div>
            </div>

            {/* Barre de recherche */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: 'var(--surface)',
                border: '1.5px solid var(--border)',
                borderRadius: 12,
                padding: '12px 14px',
                marginBottom: 14,
                transition: 'border-color 0.2s',
              }}
            >
              <i
                className="fa-solid fa-magnifying-glass"
                style={{ color: 'var(--muted)', fontSize: 14 }}
              />
              <input
                style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text)',
                  fontSize: 14,
                  fontFamily: 'var(--font-body)',
                }}
                placeholder="Rechercher une matière..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <i
                  className="fa-solid fa-xmark"
                  style={{
                    color: 'var(--muted)',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                  onClick={() => setSearch('')}
                />
              )}
            </div>

            {/* Liste des matières */}
            {filteredSubjects.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 0',
                  color: 'var(--muted)',
                }}
              >
                <i
                  className="fa-solid fa-book-open"
                  style={{
                    fontSize: 32,
                    marginBottom: 12,
                    display: 'block',
                    opacity: 0.3,
                  }}
                />
                <div
                  style={{
                    fontFamily: 'var(--font-title)',
                    fontWeight: 600,
                    fontSize: 15,
                    marginBottom: 6,
                  }}
                >
                  {availableSubjects.length === 0
                    ? 'Aucune matière disponible'
                    : 'Aucun résultat'}
                </div>
                <div style={{ fontSize: 13 }}>
                  {availableSubjects.length === 0
                    ? 'Les matières de ce semestre seront bientôt ajoutées.'
                    : `Aucune matière ne correspond à "${search}"`}
                </div>
              </div>
            ) : (
              filteredSubjects.map((subject: any, idx: number) => (
                <div
                  key={subject.id}
                  onClick={() => handleSelectSubject(subject)}
                  style={{
                    background: 'var(--surface)',
                    border: '1.5px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    padding: '16px',
                    marginBottom: 10,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s',
                    animation: `fadeUp 0.4s ease ${idx * 0.06}s both`,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.transform =
                      'translateX(4px)';
                    (e.currentTarget as HTMLElement).style.borderColor =
                      'var(--accent)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.transform =
                      'translateX(0)';
                    (e.currentTarget as HTMLElement).style.borderColor =
                      'var(--border)';
                  }}
                >
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 14 }}
                  >
                    {/* Icône avec initiales */}
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: 'rgba(79,142,247,0.1)',
                        border: '1px solid rgba(79,142,247,0.15)',
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
                          color: 'var(--accent)',
                        }}
                      >
                        {subject.name
                          .split(' ')
                          .map((w: string) => w[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div
                        style={{
                          fontFamily: 'var(--font-title)',
                          fontWeight: 600,
                          fontSize: 14,
                        }}
                      >
                        {subject.name}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--muted)',
                          marginTop: 2,
                        }}
                      >
                        <i
                          className="fa-solid fa-circle-question"
                          style={{ marginRight: 4 }}
                        />
                        {subject.questionCount} questions disponibles
                      </div>
                    </div>
                  </div>
                  <i
                    className="fa-solid fa-chevron-right"
                    style={{ color: 'var(--muted)', fontSize: 12 }}
                  />
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Convertit le nom de filière en ID de programme
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
