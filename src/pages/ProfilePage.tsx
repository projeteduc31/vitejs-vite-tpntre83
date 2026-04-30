import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { validatePassword } from '../lib/auth';
import { BottomNav } from '../components/UI';

export default function ProfilePage({
  onNavigate,
}: {
  onNavigate: (p: string) => void;
}) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'password'>('info');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    full_name: '',
    faculty: '',
    level: '',
    semester: '',
    username: '',
  });

  const [pwdForm, setPwdForm] = useState({ newPwd: '', confirm: '' });
  const [showPwd, setShowPwd] = useState({ newPwd: false, confirm: false });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        onNavigate('login');
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setProfile(data);
      setForm({
        full_name: data?.full_name || '',
        faculty: data?.faculty || '',
        level: data?.level || '',
        semester: data?.semester || '',
        username: data?.username || '',
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const saveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('profiles').update(form).eq('id', user.id);
      setSuccess('Profil mis à jour avec succès !');
      setProfile((prev: any) => ({ ...prev, ...form }));
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const pwdError = validatePassword(pwdForm.newPwd);
    if (pwdError) {
      setError(pwdError);
      return;
    }
    if (pwdForm.newPwd !== pwdForm.confirm) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: pwdForm.newPwd,
      });
      if (error) throw error;
      setSuccess('Mot de passe modifié avec succès !');
      setPwdForm({ newPwd: '', confirm: '' });
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('La photo ne doit pas dépasser 2MB');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const ext = file.name.split('.').pop();
      const filePath = `avatars/${user.id}_${Date.now()}.${ext}`;
      if (profile?.avatar_url) {
        const oldPath = profile.avatar_url.split('/avatars/')[1];
        if (oldPath) await supabase.storage.from('avatars').remove([oldPath]);
      }
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);
      if (uploadError) throw uploadError;
      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath);
      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);
      setProfile((prev: any) => ({ ...prev, avatar_url: publicUrl }));
      setSuccess('Photo mise à jour !');
    } catch (err: any) {
      setError('Erreur upload : ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    onNavigate('landing');
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
        {/* En-tête */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 24,
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => onNavigate('dashboard')}
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
                color: 'var(--muted)',
                transition: 'all 0.18s',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = 'scale(1.08)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = 'scale(1)')
              }
            >
              <i className="fa-solid fa-arrow-left" style={{ fontSize: 14 }} />
            </button>
            <div
              style={{
                fontFamily: 'var(--font-title)',
                fontWeight: 700,
                fontSize: 18,
              }}
            >
              Mon profil
            </div>
          </div>
          <button
            onClick={handleSignOut}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 10,
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
              color: 'var(--red)',
              fontFamily: 'var(--font-title)',
              fontWeight: 600,
              fontSize: 12,
              cursor: 'pointer',
              transition: 'all 0.18s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                'rgba(239,68,68,0.18)';
              (e.currentTarget as HTMLElement).style.transform = 'scale(1.04)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                'rgba(239,68,68,0.1)';
              (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
            }}
          >
            <i className="fa-solid fa-right-from-bracket" /> Déconnexion
          </button>
        </div>

        {/* Avatar */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            marginBottom: 24,
          }}
        >
          <div style={{ position: 'relative' }}>
            <div
              style={{
                width: 90,
                height: 90,
                borderRadius: '50%',
                background: profile?.avatar_url
                  ? 'transparent'
                  : 'linear-gradient(135deg, #4F8EF7, #7C3AED)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-title)',
                fontWeight: 700,
                fontSize: 28,
                color: '#fff',
                overflow: 'hidden',
                border: '3px solid var(--surface2)',
                boxShadow: '0 4px 16px rgba(79,142,247,0.3)',
              }}
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="avatar"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                getInitials(profile?.full_name || '')
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'var(--accent)',
                border: '2px solid var(--bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#fff',
                fontSize: 11,
                transition: 'transform 0.18s',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = 'scale(1.15)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = 'scale(1)')
              }
            >
              <i className="fa-solid fa-camera" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              style={{ display: 'none' }}
            />
          </div>

          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontFamily: 'var(--font-title)',
                fontWeight: 700,
                fontSize: 18,
              }}
            >
              {profile?.full_name}
            </div>
            {profile?.username && (
              <div
                style={{ fontSize: 13, color: 'var(--accent)', marginTop: 2 }}
              >
                @{profile.username}
              </div>
            )}
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
              {profile?.email}
            </div>
            {profile?.program && (
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--accent)',
                  marginTop: 4,
                  background: 'rgba(79,142,247,0.1)',
                  padding: '3px 10px',
                  borderRadius: 20,
                  display: 'inline-block',
                }}
              >
                {profile.program} · {profile.level || ''}
              </div>
            )}
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              fontSize: 12,
              color: 'var(--accent)',
              background: 'rgba(79,142,247,0.1)',
              border: '1px solid rgba(79,142,247,0.2)',
              borderRadius: 8,
              padding: '6px 14px',
              cursor: 'pointer',
              transition: 'all 0.18s',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = 'rgba(79,142,247,0.18)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = 'rgba(79,142,247,0.1)')
            }
          >
            <i className="fa-solid fa-camera" style={{ marginRight: 6 }} />
            {profile?.avatar_url ? 'Changer la photo' : 'Ajouter une photo'}
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[
            { id: 'info', label: 'Mes informations', icon: 'fa-user' },
            { id: 'password', label: 'Mot de passe', icon: 'fa-lock' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setError('');
                setSuccess('');
              }}
              style={{
                flex: 1,
                padding: '10px 8px',
                borderRadius: 10,
                border: `1px solid ${
                  activeTab === tab.id
                    ? 'rgba(79,142,247,0.3)'
                    : 'var(--border)'
                }`,
                background:
                  activeTab === tab.id
                    ? 'rgba(79,142,247,0.12)'
                    : 'var(--surface)',
                color: activeTab === tab.id ? 'var(--accent)' : 'var(--muted)',
                fontFamily: 'var(--font-title)',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'all 0.18s',
              }}
            >
              <i className={`fa-solid ${tab.icon}`} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Messages */}
        {success && (
          <div
            style={{
              marginBottom: 14,
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: 10,
              padding: '10px 14px',
              fontSize: 13,
              color: 'var(--green)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <i className="fa-solid fa-circle-check" /> {success}
          </div>
        )}
        {error && (
          <div
            style={{
              marginBottom: 14,
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 10,
              padding: '10px 14px',
              fontSize: 13,
              color: 'var(--red)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <i className="fa-solid fa-circle-exclamation" /> {error}
          </div>
        )}

        {/* Tab Infos */}
        {activeTab === 'info' && (
          <form onSubmit={saveInfo}>
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              <Field label="Prénom et nom">
                <input
                  className="form-input"
                  type="text"
                  placeholder="Ton nom complet"
                  value={form.full_name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, full_name: e.target.value }))
                  }
                  required
                />
              </Field>

              {/* Nom d'utilisateur */}
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
                      setForm((p) => ({
                        ...p,
                        username: e.target.value
                          .toLowerCase()
                          .replace(/\s/g, '_'),
                      }))
                    }
                  />
                </div>
                <div
                  style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}
                >
                  Affiché dans les classements · Lettres, chiffres et _
                  uniquement
                </div>
              </Field>

              <Field label="Faculté / École">
                <select
                  className="form-input"
                  value={form.faculty}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, faculty: e.target.value }))
                  }
                >
                  <option value="">Sélectionner…</option>
                  <option>Faculté des Sciences</option>
                  <option>Faculté de Droit</option>
                  <option>Faculté de Médecine</option>
                  <option>École de Commerce</option>
                  <option>Faculté des Lettres</option>
                </select>
              </Field>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                }}
              >
                <Field label="Niveau">
                  <select
                    className="form-input"
                    value={form.level}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, level: e.target.value }))
                    }
                  >
                    <option value="">Niveau…</option>
                    <option value="L1">Licence 1</option>
                    <option value="L2">Licence 2</option>
                    <option value="L3">Licence 3</option>
                  </select>
                </Field>
                <Field label="Semestre">
                  <select
                    className="form-input"
                    value={form.semester}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, semester: e.target.value }))
                    }
                  >
                    <option value="">Semestre…</option>
                    <option value="S1">S1</option>
                    <option value="S2">S2</option>
                    <option value="S3">S3</option>
                    <option value="S4">S4</option>
                    <option value="S5">S5</option>
                    <option value="S6">S6</option>
                  </select>
                </Field>
              </div>

              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin" /> Sauvegarde…
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-floppy-disk" /> Sauvegarder
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Tab Mot de passe */}
        {activeTab === 'password' && (
          <form onSubmit={savePassword}>
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              <Field label="Nouveau mot de passe">
                <div style={{ position: 'relative' }}>
                  <input
                    className="form-input"
                    type={showPwd.newPwd ? 'text' : 'password'}
                    placeholder="8 car. min. · Maj + min + chiffre"
                    value={pwdForm.newPwd}
                    onChange={(e) =>
                      setPwdForm((p) => ({ ...p, newPwd: e.target.value }))
                    }
                    required
                    style={{ paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPwd((p) => ({ ...p, newPwd: !p.newPwd }))
                    }
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
                        showPwd.newPwd ? 'fa-eye-slash' : 'fa-eye'
                      }`}
                    />
                  </button>
                </div>
                {pwdForm.newPwd.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      gap: 6,
                      flexWrap: 'wrap',
                      marginTop: 8,
                    }}
                  >
                    {[
                      { label: '8 car.', ok: pwdForm.newPwd.length >= 8 },
                      { label: 'Majuscule', ok: /[A-Z]/.test(pwdForm.newPwd) },
                      { label: 'Minuscule', ok: /[a-z]/.test(pwdForm.newPwd) },
                      { label: 'Chiffre', ok: /[0-9]/.test(pwdForm.newPwd) },
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
                    type={showPwd.confirm ? 'text' : 'password'}
                    placeholder="Répète ton nouveau mot de passe"
                    value={pwdForm.confirm}
                    onChange={(e) =>
                      setPwdForm((p) => ({ ...p, confirm: e.target.value }))
                    }
                    required
                    style={{ paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPwd((p) => ({ ...p, confirm: !p.confirm }))
                    }
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
                        showPwd.confirm ? 'fa-eye-slash' : 'fa-eye'
                      }`}
                    />
                  </button>
                </div>
                {pwdForm.confirm.length > 0 && (
                  <div
                    style={{
                      fontSize: 11,
                      marginTop: 5,
                      color:
                        pwdForm.newPwd === pwdForm.confirm
                          ? 'var(--green)'
                          : 'var(--red)',
                    }}
                  >
                    <i
                      className={`fa-solid ${
                        pwdForm.newPwd === pwdForm.confirm
                          ? 'fa-check'
                          : 'fa-xmark'
                      }`}
                      style={{ marginRight: 4 }}
                    />
                    {pwdForm.newPwd === pwdForm.confirm
                      ? 'Les mots de passe correspondent'
                      : 'Ne correspondent pas'}
                  </div>
                )}
              </Field>

              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin" /> Modification…
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-lock" /> Changer le mot de passe
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
      <BottomNav active="profile" onNavigate={onNavigate} />
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
    <div>
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
