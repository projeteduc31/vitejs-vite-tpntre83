import React, { useState, useEffect, useRef } from 'react';
import { signUp, validatePassword } from '../lib/auth';

const FEATURES = [
  {
    icon: 'fa-brain',
    color: 'var(--accent)',
    bg: 'rgba(79,142,247,0.12)',
    title: 'QCM générés par IA',
    desc: 'Directement depuis tes polys et tes épreuves réelles.',
  },
  {
    icon: 'fa-circle-check',
    color: 'var(--green)',
    bg: 'rgba(16,185,129,0.12)',
    title: 'Correction immédiate',
    desc: 'Bonne/mauvaise réponse + explication pédagogique.',
  },
  {
    icon: 'fa-ranking-star',
    color: '#F87171',
    bg: 'rgba(239,68,68,0.12)',
    title: 'Mode compétition',
    desc: 'Affronte tes camarades. Score = moyenne de tes quiz.',
  },
  {
    icon: 'fa-stopwatch',
    color: 'var(--amber)',
    bg: 'rgba(245,158,11,0.12)',
    title: 'Quiz chronométrés',
    desc: "30 secondes par question. Conditions réelles d'examen.",
  },
  {
    icon: 'fa-chart-line',
    color: '#A78BFA',
    bg: 'rgba(139,92,246,0.12)',
    title: 'Suivi de progression',
    desc: 'Historique, score moyen, taux de réussite par matière.',
  },
  {
    icon: 'fa-mobile-screen',
    color: 'var(--accent)',
    bg: 'rgba(79,142,247,0.12)',
    title: 'Partout, tout le temps',
    desc: 'Web + mobile. Fonctionne même en 3G.',
  },
];

const STATS = [
  { target: 5000, suffix: '+', label: 'Étudiants actifs' },
  { target: 50, suffix: '+', label: 'Universités' },
  { target: 200000, suffix: '+', label: 'Quiz passés' },
];

export default function LandingPage({
  onNavigate,
}: {
  onNavigate: (p: string) => void;
}) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    university: '',
    faculty: '',
    program: '',
    username: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [showPolicy, setShowPolicy] = useState<'privacy' | 'terms' | null>(
    null
  );

  const [counts, setCounts] = useState([0, 0, 0]);
  const statsRef = useRef<HTMLDivElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !animated.current) {
          animated.current = true;
          animateCounters();
        }
      },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const animateCounters = () => {
    const duration = 1800,
      steps = 60,
      interval = duration / steps;
    STATS.forEach((stat, idx) => {
      let current = 0;
      const increment = stat.target / steps;
      const timer = setInterval(() => {
        current = Math.min(current + increment, stat.target);
        setCounts((prev) => {
          const u = [...prev];
          u[idx] = Math.round(current);
          return u;
        });
        if (current >= stat.target) clearInterval(timer);
      }, interval);
    });
  };

  const formatCount = (n: number) =>
    n >= 1000 ? (n / 1000).toFixed(1).replace('.0', '') + 'K' : n.toString();

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!accepted) {
      setError("Veuillez accepter les conditions d'utilisation");
      return;
    }
    if (!form.username.trim()) {
      setError("Le nom d'utilisateur est requis");
      return;
    }
    const pwdError = validatePassword(form.password);
    if (pwdError) {
      setError(pwdError);
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    setLoading(true);
    try {
      await signUp(
        form.email,
        form.password,
        form.name,
        form.university,
        form.program,
        'L1',
        form.username
      );
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const scrollToForm = () =>
    document
      .getElementById('signup-form')
      ?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 40 }}>
      <div className="bg-glow" />
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Nav */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 20px 0',
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
          <button
            onClick={() => onNavigate('login')}
            style={{
              padding: '8px 18px',
              borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--text)',
              cursor: 'pointer',
              transition: 'all 0.18s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                'var(--accent)';
              (e.currentTarget as HTMLElement).style.transform =
                'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                'var(--border)';
              (e.currentTarget as HTMLElement).style.transform =
                'translateY(0)';
            }}
          >
            <i
              className="fa-regular fa-circle-user"
              style={{ marginRight: 6 }}
            />
            Connexion
          </button>
        </nav>

        {/* Hero */}
        <section style={{ padding: '40px 20px 0', textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(79,142,247,0.1)',
              border: '1px solid rgba(79,142,247,0.2)',
              borderRadius: 20,
              padding: '6px 14px',
              fontSize: 12,
              color: 'var(--accent)',
              marginBottom: 20,
              animation: 'fadeUp 0.4s ease both',
            }}
          >
            <i className="fa-solid fa-bolt" /> Plateforme de révision
            intelligente
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-title)',
              fontWeight: 800,
              fontSize: 32,
              lineHeight: 1.15,
              marginBottom: 14,
              animation: 'fadeUp 0.4s ease 0.08s both',
            }}
          >
            Révisez mieux,{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #4F8EF7, #7C3AED)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              réussissez vos examens
            </span>
          </h1>
          <p
            style={{
              fontSize: 15,
              color: 'var(--muted)',
              lineHeight: 1.6,
              marginBottom: 28,
              animation: 'fadeUp 0.4s ease 0.16s both',
            }}
          >
            Des QCM générés automatiquement depuis vos cours et vos vraies
            épreuves. Disponible pour toutes les universités francophones.
          </p>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              marginBottom: 16,
              animation: 'fadeUp 0.4s ease 0.24s both',
            }}
          >
            <button className="btn-primary" onClick={scrollToForm}>
              <i className="fa-solid fa-graduation-cap" /> S'inscrire
              gratuitement — 7 jours offerts
            </button>
            <button className="btn-secondary">
              <i className="fa-solid fa-play" /> Voir une démo
            </button>
          </div>
          <p
            style={{
              fontSize: 12,
              color: 'var(--muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <i
              className="fa-solid fa-shield-halved"
              style={{ color: 'var(--green)' }}
            />
            Sans carte bancaire · Annulable à tout moment
          </p>
        </section>

        {/* Stats */}
        <div
          ref={statsRef}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 1,
            background: 'var(--border)',
            margin: '28px 20px 0',
            borderRadius: 'var(--radius)',
            overflow: 'hidden',
            border: '1px solid var(--border)',
          }}
        >
          {STATS.map((stat, idx) => (
            <div
              key={stat.label}
              style={{
                background: 'var(--surface)',
                padding: '18px 10px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-title)',
                  fontWeight: 800,
                  fontSize: 22,
                  background: 'linear-gradient(135deg, #4F8EF7, #7C3AED)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {formatCount(counts[idx])}
                {stat.suffix}
              </div>
              <div
                style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Features */}
        <section style={{ padding: '32px 20px 0' }}>
          <h2
            style={{
              fontFamily: 'var(--font-title)',
              fontWeight: 700,
              fontSize: 18,
              marginBottom: 16,
              textAlign: 'center',
            }}
          >
            Tout ce dont tu as besoin
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {FEATURES.map((f, idx) => (
              <div
                key={f.title}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: 16,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                  transition: 'all 0.2s',
                  animation: `fadeUp 0.4s ease ${idx * 0.06}s both`,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform =
                    'translateX(4px)';
                  (e.currentTarget as HTMLElement).style.borderColor =
                    'rgba(79,142,247,0.25)';
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
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: f.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    color: f.color,
                    flexShrink: 0,
                  }}
                >
                  <i className={`fa-solid ${f.icon}`} />
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--font-title)',
                      fontWeight: 600,
                      fontSize: 14,
                      marginBottom: 4,
                    }}
                  >
                    {f.title}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--muted)',
                      lineHeight: 1.5,
                    }}
                  >
                    {f.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Formulaire inscription */}
        <section style={{ padding: '28px 20px 0' }} id="signup-form">
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 20,
              padding: 24,
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-title)',
                fontWeight: 700,
                fontSize: 18,
                marginBottom: 4,
              }}
            >
              Créer mon compte
            </div>
            <div
              style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}
            >
              7 jours gratuits · Sans carte bancaire
            </div>

            {submitted ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: 'rgba(16,185,129,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    animation: 'fadeUp 0.4s ease both',
                  }}
                >
                  <i
                    className="fa-solid fa-envelope-circle-check"
                    style={{ fontSize: 28, color: 'var(--green)' }}
                  />
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-title)',
                    fontWeight: 700,
                    fontSize: 18,
                    marginBottom: 8,
                  }}
                >
                  Vérifie ta boîte mail !
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: 'var(--muted)',
                    lineHeight: 1.6,
                  }}
                >
                  Un email de confirmation a été envoyé à<br />
                  <strong style={{ color: 'var(--text)' }}>{form.email}</strong>
                  <br />
                  <br />
                  Clique sur le lien dans l'email pour activer ton compte.
                </div>
                <button
                  onClick={() => onNavigate('login')}
                  className="btn-primary"
                  style={{ marginTop: 20 }}
                >
                  <i className="fa-solid fa-right-to-bracket" /> Aller à la
                  connexion
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <Field label="Prénom et nom">
                  <input
                    className="form-input"
                    type="text"
                    placeholder="Ex : Aliou Konaté"
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    required
                  />
                </Field>

                <Field label="Nom d'utilisateur">
                  <div style={{ position: 'relative' }}>
                    <span
                      style={{
                        position: 'absolute',
                        left: 14,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--muted)',
                        fontSize: 14,
                      }}
                    >
                      @
                    </span>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="ton_pseudo"
                      style={{ paddingLeft: 30 }}
                      value={form.username}
                      onChange={(e) =>
                        handleChange(
                          'username',
                          e.target.value.toLowerCase().replace(/\s/g, '_')
                        )
                      }
                      required
                    />
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--muted)',
                      marginTop: 4,
                    }}
                  >
                    Affiché dans les classements de compétition
                  </div>
                </Field>

                <Field label="Adresse email">
                  <input
                    className="form-input"
                    type="email"
                    placeholder="ton@email.com"
                    value={form.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    required
                  />
                </Field>

                <Field label="Mot de passe">
                  <div style={{ position: 'relative' }}>
                    <input
                      className="form-input"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="8 car. min. · Maj + min + chiffre"
                      value={form.password}
                      onChange={(e) => handleChange('password', e.target.value)}
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
                  {form.password.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        gap: 6,
                        flexWrap: 'wrap',
                        marginTop: 8,
                      }}
                    >
                      {[
                        { label: '8 car.', ok: form.password.length >= 8 },
                        { label: 'Majuscule', ok: /[A-Z]/.test(form.password) },
                        { label: 'Minuscule', ok: /[a-z]/.test(form.password) },
                        { label: 'Chiffre', ok: /[0-9]/.test(form.password) },
                      ].map((r) => (
                        <span
                          key={r.label}
                          style={{
                            fontSize: 10,
                            padding: '3px 8px',
                            borderRadius: 6,
                            background: r.ok
                              ? 'rgba(16,185,129,0.15)'
                              : 'rgba(239,68,68,0.1)',
                            color: r.ok ? 'var(--green)' : 'var(--red)',
                            border: `1px solid ${
                              r.ok
                                ? 'rgba(16,185,129,0.2)'
                                : 'rgba(239,68,68,0.15)'
                            }`,
                          }}
                        >
                          <i
                            className={`fa-solid ${
                              r.ok ? 'fa-check' : 'fa-xmark'
                            }`}
                            style={{ marginRight: 4 }}
                          />
                          {r.label}
                        </span>
                      ))}
                    </div>
                  )}
                </Field>

                <Field label="Confirmer le mot de passe">
                  <div style={{ position: 'relative' }}>
                    <input
                      className="form-input"
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Répète ton mot de passe"
                      value={form.confirmPassword}
                      onChange={(e) =>
                        handleChange('confirmPassword', e.target.value)
                      }
                      required
                      style={{ paddingRight: 44 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
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
                          showConfirm ? 'fa-eye-slash' : 'fa-eye'
                        }`}
                      />
                    </button>
                  </div>
                  {form.confirmPassword.length > 0 && (
                    <div
                      style={{
                        fontSize: 11,
                        marginTop: 5,
                        color:
                          form.password === form.confirmPassword
                            ? 'var(--green)'
                            : 'var(--red)',
                      }}
                    >
                      <i
                        className={`fa-solid ${
                          form.password === form.confirmPassword
                            ? 'fa-check'
                            : 'fa-xmark'
                        }`}
                        style={{ marginRight: 4 }}
                      />
                      {form.password === form.confirmPassword
                        ? 'Les mots de passe correspondent'
                        : 'Ne correspondent pas'}
                    </div>
                  )}
                </Field>

                <Field label="Université">
                  <select
                    className="form-input"
                    value={form.university}
                    onChange={(e) => handleChange('university', e.target.value)}
                    required
                  >
                    <option value="">Sélectionner ton université…</option>
                    <option>Université d'Abomey-Calavi</option>
                    <option>Université de Lomé</option>
                    <option>Université de Dakar</option>
                    <option>Université de Ouagadougou</option>
                    <option>Autre université</option>
                  </select>
                </Field>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 10,
                    marginBottom: 16,
                  }}
                >
                  <Field label="Faculté / École">
                    <select
                      className="form-input"
                      value={form.faculty}
                      onChange={(e) => handleChange('faculty', e.target.value)}
                    >
                      <option value="">Faculté…</option>
                      <option>Fac. des Sciences</option>
                      <option>Fac. de Droit</option>
                      <option>Fac. de Médecine</option>
                      <option>École de Commerce</option>
                      <option>Fac. des Lettres</option>
                    </select>
                  </Field>
                  <Field label="Filière">
                    <select
                      className="form-input"
                      value={form.program}
                      onChange={(e) => handleChange('program', e.target.value)}
                    >
                      <option value="">Filière…</option>
                      <option>Informatique</option>
                      <option>Mathématiques</option>
                      <option>Droit civil</option>
                      <option>Médecine</option>
                      <option>Finance</option>
                      <option>Marketing</option>
                    </select>
                  </Field>
                </div>

                {error && (
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
                    <i className="fa-solid fa-circle-exclamation" /> {error}
                  </div>
                )}

                {/* Case à cocher politique */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    marginBottom: 14,
                    padding: '12px 14px',
                    background: 'rgba(79,142,247,0.05)',
                    borderRadius: 10,
                    border: '1px solid rgba(79,142,247,0.12)',
                  }}
                >
                  <input
                    type="checkbox"
                    id="accept"
                    checked={accepted}
                    onChange={(e) => setAccepted(e.target.checked)}
                    style={{
                      width: 16,
                      height: 16,
                      marginTop: 2,
                      cursor: 'pointer',
                      accentColor: 'var(--accent)',
                      flexShrink: 0,
                    }}
                  />
                  <label
                    htmlFor="accept"
                    style={{
                      fontSize: 12,
                      color: 'var(--muted)',
                      lineHeight: 1.6,
                      cursor: 'pointer',
                    }}
                  >
                    En m'inscrivant, j'accepte la{' '}
                    <span
                      onClick={(e) => {
                        e.preventDefault();
                        setShowPolicy('privacy');
                      }}
                      style={{
                        color: 'var(--accent)',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        fontWeight: 500,
                      }}
                    >
                      Politique de confidentialité
                    </span>{' '}
                    et les{' '}
                    <span
                      onClick={(e) => {
                        e.preventDefault();
                        setShowPolicy('terms');
                      }}
                      style={{
                        color: 'var(--accent)',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        fontWeight: 500,
                      }}
                    >
                      Conditions d'utilisation
                    </span>{' '}
                    de QuizApp EDU.
                  </label>
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin" /> Création en
                      cours…
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-rocket" /> Créer mon compte
                    </>
                  )}
                </button>

                <div
                  style={{
                    textAlign: 'center',
                    marginTop: 16,
                    fontSize: 12,
                    color: 'var(--muted)',
                  }}
                >
                  Déjà inscrit ?{' '}
                  <span
                    onClick={() => onNavigate('login')}
                    style={{
                      color: 'var(--accent)',
                      cursor: 'pointer',
                      fontWeight: 500,
                    }}
                  >
                    Se connecter
                  </span>
                </div>
              </form>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer style={{ padding: '28px 20px 0', textAlign: 'center' }}>
          <div
            style={{
              fontFamily: 'var(--font-title)',
              fontWeight: 800,
              fontSize: 16,
              marginBottom: 8,
              background: 'linear-gradient(135deg, #4F8EF7, #7C3AED)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            QuizApp EDU
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
            © 2026 · La révision intelligente pour les étudiants africains
          </div>
        </footer>
      </div>

      {/* ── Modal Politique — EN DEHORS du formulaire ── */}
      {showPolicy && (
        <div
          onClick={() => setShowPolicy(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            zIndex: 200,
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
              maxHeight: '85vh',
              overflowY: 'auto',
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-title)',
                  fontWeight: 700,
                  fontSize: 18,
                }}
              >
                {showPolicy === 'privacy'
                  ? '🔒 Politique de confidentialité'
                  : "📋 Conditions d'utilisation"}
              </div>
              <button
                onClick={() => setShowPolicy(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  fontSize: 22,
                }}
              >
                ×
              </button>
            </div>

            {showPolicy === 'privacy' ? (
              <div
                style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.8 }}
              >
                <p
                  style={{
                    color: 'var(--text)',
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  Dernière mise à jour : Avril 2026
                </p>
                <p style={{ marginBottom: 16 }}>
                  QuizApp EDU s'engage à protéger la vie privée de ses
                  utilisateurs. Cette politique décrit comment nous collectons,
                  utilisons et protégeons vos données personnelles.
                </p>
                <p
                  style={{
                    color: 'var(--text)',
                    fontWeight: 600,
                    marginBottom: 6,
                  }}
                >
                  1. Données collectées
                </p>
                <p style={{ marginBottom: 16 }}>
                  Nous collectons les informations fournies lors de votre
                  inscription : nom complet, adresse email, nom d'utilisateur,
                  université, faculté et filière. Nous collectons également des
                  données d'utilisation : quiz passés, scores, sessions et
                  progression.
                </p>
                <p
                  style={{
                    color: 'var(--text)',
                    fontWeight: 600,
                    marginBottom: 6,
                  }}
                >
                  2. Utilisation des données
                </p>
                <p style={{ marginBottom: 16 }}>
                  Vos données sont utilisées pour personnaliser votre expérience
                  d'apprentissage, afficher votre progression, vous permettre de
                  participer aux compétitions et améliorer nos services. Votre
                  nom d'utilisateur et votre photo peuvent être visibles dans
                  les classements.
                </p>
                <p
                  style={{
                    color: 'var(--text)',
                    fontWeight: 600,
                    marginBottom: 6,
                  }}
                >
                  3. Protection des données
                </p>
                <p style={{ marginBottom: 16 }}>
                  Vos données sont stockées de manière sécurisée via Supabase,
                  conforme aux standards internationaux. Nous ne vendons pas vos
                  données à des tiers. Votre mot de passe est chiffré et jamais
                  stocké en clair.
                </p>
                <p
                  style={{
                    color: 'var(--text)',
                    fontWeight: 600,
                    marginBottom: 6,
                  }}
                >
                  4. Vos droits
                </p>
                <p style={{ marginBottom: 16 }}>
                  Vous pouvez accéder à vos données, les modifier depuis votre
                  profil, ou demander leur suppression via notre support. Vous
                  pouvez supprimer votre compte à tout moment depuis la page
                  Profil.
                </p>
                <p
                  style={{
                    color: 'var(--text)',
                    fontWeight: 600,
                    marginBottom: 6,
                  }}
                >
                  5. Cookies
                </p>
                <p style={{ marginBottom: 16 }}>
                  Nous utilisons uniquement des cookies techniques nécessaires
                  au fonctionnement de l'application. Aucun cookie publicitaire
                  n'est utilisé.
                </p>
                <p
                  style={{
                    color: 'var(--text)',
                    fontWeight: 600,
                    marginBottom: 6,
                  }}
                >
                  6. Contact
                </p>
                <p>
                  Pour toute question concernant vos données, contactez-nous via
                  le bouton WhatsApp de l'application.
                </p>
              </div>
            ) : (
              <div
                style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.8 }}
              >
                <p
                  style={{
                    color: 'var(--text)',
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  Dernière mise à jour : Avril 2026
                </p>
                <p style={{ marginBottom: 16 }}>
                  En utilisant QuizApp EDU, vous acceptez les présentes
                  conditions. Veuillez les lire attentivement avant de créer
                  votre compte.
                </p>
                <p
                  style={{
                    color: 'var(--text)',
                    fontWeight: 600,
                    marginBottom: 6,
                  }}
                >
                  1. Description du service
                </p>
                <p style={{ marginBottom: 16 }}>
                  QuizApp EDU est une plateforme de révision par QCM destinée
                  aux étudiants universitaires francophones. Elle permet de
                  s'exercer via des quiz, participer à des compétitions et
                  suivre sa progression académique.
                </p>
                <p
                  style={{
                    color: 'var(--text)',
                    fontWeight: 600,
                    marginBottom: 6,
                  }}
                >
                  2. Inscription et compte
                </p>
                <p style={{ marginBottom: 16 }}>
                  Vous devez avoir au moins 16 ans pour créer un compte. Vous
                  êtes responsable de la confidentialité de vos identifiants.
                  Les informations fournies doivent être exactes. Un seul compte
                  par personne est autorisé.
                </p>
                <p
                  style={{
                    color: 'var(--text)',
                    fontWeight: 600,
                    marginBottom: 6,
                  }}
                >
                  3. Utilisation acceptable
                </p>
                <p style={{ marginBottom: 16 }}>
                  Vous vous engagez à utiliser l'application de manière honnête
                  et respectueuse. Il est interdit de tricher dans les
                  compétitions, d'usurper l'identité d'un autre utilisateur, ou
                  de publier du contenu offensant.
                </p>
                <p
                  style={{
                    color: 'var(--text)',
                    fontWeight: 600,
                    marginBottom: 6,
                  }}
                >
                  4. Propriété intellectuelle
                </p>
                <p style={{ marginBottom: 16 }}>
                  Les QCM et contenus pédagogiques sont la propriété de QuizApp
                  EDU ou de ses partenaires. Toute reproduction ou
                  commercialisation sans autorisation est interdite.
                </p>
                <p
                  style={{
                    color: 'var(--text)',
                    fontWeight: 600,
                    marginBottom: 6,
                  }}
                >
                  5. Suspension et résiliation
                </p>
                <p style={{ marginBottom: 16 }}>
                  Nous nous réservons le droit de suspendre tout compte ne
                  respectant pas ces conditions. Vous pouvez supprimer votre
                  compte à tout moment depuis la page Profil.
                </p>
                <p
                  style={{
                    color: 'var(--text)',
                    fontWeight: 600,
                    marginBottom: 6,
                  }}
                >
                  6. Limitation de responsabilité
                </p>
                <p style={{ marginBottom: 16 }}>
                  QuizApp EDU fournit le service "tel quel" sans garantie de
                  disponibilité continue. Nous ne sommes pas responsables des
                  résultats académiques obtenus via notre plateforme.
                </p>
                <p
                  style={{
                    color: 'var(--text)',
                    fontWeight: 600,
                    marginBottom: 6,
                  }}
                >
                  7. Modifications
                </p>
                <p>
                  Ces conditions peuvent être modifiées à tout moment. Les
                  utilisateurs seront informés via une annonce sur la
                  plateforme.
                </p>
              </div>
            )}

            <button
              onClick={() => {
                setAccepted(true);
                setShowPolicy(null);
              }}
              className="btn-primary"
              style={{ marginTop: 20 }}
            >
              <i className="fa-solid fa-check" /> J'accepte et je ferme
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label
        style={{
          display: 'block',
          fontSize: 11,
          color: 'var(--muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
