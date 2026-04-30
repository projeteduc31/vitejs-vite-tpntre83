import React, { useState, useEffect } from 'react';
import './styles/global.css';
import { supabase } from './lib/supabase';
import { WhatsAppFloat } from './components/UI';
import AnnouncementsPage from './pages/AnnouncementsPage';
import SessionsPage from './pages/SessionsPage';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import QuizSelectPage from './pages/QuizSelectPage';
import QuizPage from './pages/QuizPage';
import ResultsPage from './pages/ResultsPage';
import CompetitionPage from './pages/CompetitionPage';
import AdminDashboard from './pages/AdminDashboard';
import ProfilePage from './pages/ProfilePage';

const INJECTED_STYLES = `
  .form-input {
    width: 100%;
    padding: 12px 14px;
    border-radius: 10px;
    background: var(--surface2);
    border: 1px solid var(--border);
    color: var(--text);
    font-size: 14px;
    font-family: var(--font-body);
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .form-input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(79,142,247,0.15);
  }
  .form-input::placeholder { color: var(--muted); }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--surface2); border-radius: 3px; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
  select.form-input option { background: var(--surface2); color: var(--text); }
`;

export default function App() {
  const [page, setPage] = useState('loading');
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [quizResults, setQuizResults] = useState<any>(null);
  const [quizQuestions, setQuizQuestions] = useState<any>(null);

  useEffect(() => {
    checkSession();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') setPage('dashboard');
      if (event === 'SIGNED_OUT') setPage('landing');
    });
    return () => subscription.unsubscribe();
  }, []);

  const checkSession = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) setPage('dashboard');
    else setPage('landing');
  };

  const navigate = (target: string, data: any = {}) => {
    if (data.subject) setSelectedSubject(data.subject);
    if (data.results) setQuizResults(data.results);
    if (data.questions) setQuizQuestions(data.questions);
    setPage(target);
    window.scrollTo(0, 0);
  };

  const handleQuizFinish = (results: any, questions: any) => {
    setQuizResults(results);
    setQuizQuestions(questions);
    navigate('results');
  };

  if (page === 'loading') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'var(--bg)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontFamily: 'var(--font-title)',
              fontWeight: 800,
              fontSize: 24,
              background: 'linear-gradient(135deg, #4F8EF7, #7C3AED)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: 16,
            }}
          >
            QuizApp EDU
          </div>
          <i
            className="fa-solid fa-spinner fa-spin"
            style={{ fontSize: 24, color: 'var(--accent)' }}
          />
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (page) {
      case 'landing':
        return <LandingPage onNavigate={navigate} />;
      case 'login':
        return <LoginPage onNavigate={navigate} />;
      case 'dashboard':
        return <Dashboard onNavigate={navigate} />;
      case 'quiz-select':
        return (
          <QuizSelectPage
            onStart={(subject: any) => navigate('quiz', { subject })}
            onBack={() => navigate('dashboard')}
          />
        );

      // ── Quiz — utilise les questions fixes si mode compétition ──
      case 'quiz':
        return selectedSubject ? (
          <QuizPage
            subjectId={selectedSubject.id}
            subjectName={selectedSubject.name}
            onFinish={handleQuizFinish}
            onBack={() =>
              navigate(
                selectedSubject.isCompetition ? 'competition' : 'dashboard'
              )
            }
            forcedQuestions={selectedSubject.fixedQuestions || null}
          />
        ) : (
          <Dashboard onNavigate={navigate} />
        );

      // ── Résultats ──
      case 'results':
        return quizResults ? (
          <ResultsPage
            results={quizResults}
            questions={quizQuestions}
            subjectName={selectedSubject?.name || ''}
            subjectId={selectedSubject?.id}
            selectedSubject={selectedSubject}
            onNext={() => {
              setQuizResults(null);
              setQuizQuestions(null);
              // Si compétition → quiz suivant avec même matière
              if (selectedSubject?.isCompetition) {
                navigate('quiz', {
                  subject: {
                    ...selectedSubject,
                    quizNumber: (selectedSubject.quizNumber || 1) + 1,
                    fixedQuestions: null, // sera rechargé par CompetitionPage
                  },
                });
              } else {
                navigate('quiz');
              }
            }}
            onRetry={() => {
              setQuizResults(null);
              navigate('quiz', { questions: quizQuestions });
            }}
            onOtherSubject={() => navigate('quiz-select')}
            onHome={() => navigate('dashboard')}
            onViewLeaderboard={() => navigate('competition')}
          />
        ) : (
          <Dashboard onNavigate={navigate} />
        );

      case 'competition':
        return (
          <CompetitionPage
            onNavigate={navigate}
            onBack={() => navigate('dashboard')}
          />
        );
      case 'profile':
        return <ProfilePage onNavigate={navigate} />;
      case 'announcements':
        return <AnnouncementsPage onNavigate={navigate} />;
      case 'sessions':
        return <SessionsPage onNavigate={navigate} />;
      case 'admin':
        return <AdminDashboard onNavigate={navigate} />;
      default:
        return <Dashboard onNavigate={navigate} />;
    }
  };

  return (
    <>
      <style>{INJECTED_STYLES}</style>
      {renderPage()}
      <WhatsAppFloat />
    </>
  );
}

function LoginPage({ onNavigate }: { onNavigate: (p: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { signIn } = await import('./lib/auth');
      await signIn(email, password);
      onNavigate('dashboard');
    } catch (err: any) {
      if (err.message?.includes('Invalid login')) {
        setError('Email ou mot de passe incorrect');
      } else if (err.message?.includes('Email not confirmed')) {
        setError(
          'Confirme ton email avant de te connecter. Vérifie ta boîte mail.'
        );
      } else {
        setError(err.message || 'Une erreur est survenue');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    try {
      const { resetPassword } = await import('./lib/auth');
      await resetPassword(resetEmail);
      setResetSent(true);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: 480,
        margin: '0 auto',
        padding: '60px 20px',
        minHeight: '100vh',
      }}
    >
      <div className="bg-glow" />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div
          style={{
            fontFamily: 'var(--font-title)',
            fontWeight: 800,
            fontSize: 22,
            background: 'linear-gradient(135deg, #4F8EF7, #7C3AED)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textAlign: 'center',
            marginBottom: 40,
          }}
        >
          QuizApp EDU
        </div>
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            padding: 28,
          }}
        >
          {showReset ? (
            <>
              <button
                onClick={() => {
                  setShowReset(false);
                  setResetSent(false);
                  setError(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  fontSize: 13,
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <i className="fa-solid fa-arrow-left" /> Retour
              </button>
              {resetSent ? (
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: 'rgba(16,185,129,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                    }}
                  >
                    <i
                      className="fa-solid fa-envelope"
                      style={{ fontSize: 22, color: 'var(--green)' }}
                    />
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-title)',
                      fontWeight: 700,
                      fontSize: 16,
                      marginBottom: 8,
                    }}
                  >
                    Email envoyé !
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: 'var(--muted)',
                      lineHeight: 1.6,
                    }}
                  >
                    Consulte ta boîte mail pour réinitialiser ton mot de passe.
                  </div>
                  <button
                    onClick={() => setShowReset(false)}
                    className="btn-primary"
                    style={{ marginTop: 20 }}
                  >
                    <i className="fa-solid fa-arrow-left" /> Retour à la
                    connexion
                  </button>
                </div>
              ) : (
                <>
                  <div
                    style={{
                      fontFamily: 'var(--font-title)',
                      fontWeight: 700,
                      fontSize: 18,
                      marginBottom: 4,
                    }}
                  >
                    Mot de passe oublié
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: 'var(--muted)',
                      marginBottom: 20,
                    }}
                  >
                    Entre ton email pour recevoir un lien de réinitialisation.
                  </div>
                  <form onSubmit={handleReset}>
                    <div style={{ marginBottom: 16 }}>
                      <label style={labelStyle}>Adresse email</label>
                      <input
                        className="form-input"
                        type="email"
                        placeholder="ton@email.com"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        required
                      />
                    </div>
                    {error && <ErrorBox message={error} />}
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={resetLoading}
                    >
                      {resetLoading ? (
                        <>
                          <i className="fa-solid fa-spinner fa-spin" /> Envoi…
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-paper-plane" /> Envoyer le
                          lien
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </>
          ) : (
            <>
              <div
                style={{
                  fontFamily: 'var(--font-title)',
                  fontWeight: 700,
                  fontSize: 20,
                  marginBottom: 4,
                }}
              >
                Connexion
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--muted)',
                  marginBottom: 24,
                }}
              >
                Bienvenue ! Entrez vos identifiants.
              </div>
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>Adresse email</label>
                  <input
                    className="form-input"
                    type="email"
                    placeholder="ton@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div style={{ marginBottom: 6 }}>
                  <label style={labelStyle}>Mot de passe</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="form-input"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Votre mot de passe"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      style={{ paddingRight: 44 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--muted)',
                        fontSize: 14,
                      }}
                    >
                      <i
                        className={`fa-solid ${
                          showPassword ? 'fa-eye-slash' : 'fa-eye'
                        }`}
                      />
                    </button>
                  </div>
                </div>
                <div style={{ textAlign: 'right', marginBottom: 20 }}>
                  <span
                    onClick={() => {
                      setShowReset(true);
                      setError(null);
                    }}
                    style={{
                      fontSize: 12,
                      color: 'var(--accent)',
                      cursor: 'pointer',
                    }}
                  >
                    Mot de passe oublié ?
                  </span>
                </div>
                {error && <ErrorBox message={error} />}
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin" /> Connexion…
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-right-to-bracket" /> Se
                      connecter
                    </>
                  )}
                </button>
              </form>
              <div
                style={{
                  textAlign: 'center',
                  marginTop: 16,
                  fontSize: 12,
                  color: 'var(--muted)',
                }}
              >
                Pas encore de compte ?{' '}
                <span
                  onClick={() => onNavigate('landing')}
                  style={{
                    color: 'var(--accent)',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  S'inscrire
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  color: 'var(--muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginBottom: 6,
};

function ErrorBox({ message }: { message: string }) {
  return (
    <div
      style={{
        background: 'rgba(239,68,68,0.1)',
        border: '1px solid rgba(239,68,68,0.2)',
        borderRadius: 10,
        padding: '10px 14px',
        fontSize: 13,
        color: 'var(--red)',
        marginBottom: 14,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <i className="fa-solid fa-circle-exclamation" />
      {message}
    </div>
  );
}
