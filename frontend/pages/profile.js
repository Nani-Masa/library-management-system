import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../components/layout/Layout';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function Profile() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [studentId, setStudentId] = useState('');
  const [role, setRole]         = useState('');
  const [joined, setJoined]     = useState('');
  const [stats, setStats]       = useState({ completed: 0, reading: 0, active_days: 0 });
  const [saving, setSaving]     = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => { if (!authLoading && !user) router.push('/login'); }, [user, authLoading]);

  useEffect(() => {
    if (!user) return;
    api.get('/auth/me').then(r => {
      setName(r.data.name || '');
      setEmail(r.data.email || '');
      setStudentId(r.data.student_id || '');
      setRole(r.data.role || '');
      setJoined(r.data.created_at || '');
    }).catch(() => {});
    api.get('/analytics/reading-stats').then(r => setStats(r.data)).catch(() => {});
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await new Promise(r => setTimeout(r, 800));
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      stored.name = name;
      localStorage.setItem('user', JSON.stringify(stored));
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
    toast.success('Signed out successfully');
  };

  const ROLE_COLOR = { admin: '#fb7185', librarian: '#fbbf24', student: '#34d399' };
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const inputStyle = {
    width: '100%', background: '#0f172a',
    border: '1px solid rgba(148,163,184,0.2)',
    borderRadius: 8, padding: '9px 12px',
    fontSize: 13, color: '#f1f5f9',
    outline: 'none', boxSizing: 'border-box',
  };

  if (authLoading || !user) return null;

  return (
    <>
      <Head><title>Profile — LibraryOS</title></Head>
      <Layout>
        <div className="page-enter">
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Home / Profile</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px' }}>My Profile</h1>
          </div>

          {/* Profile Card */}
          <div style={{
            background: 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.1))',
            border: '1px solid rgba(99,102,241,0.25)',
            borderRadius: 20, padding: '28px 24px',
            display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24,
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, fontWeight: 700, flexShrink: 0,
              boxShadow: '0 8px 25px rgba(99,102,241,0.4)',
            }}>{initials || '?'}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{name}</div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>{email}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: 11, padding: '3px 10px', borderRadius: 100, fontWeight: 600,
                  background: `rgba(0,0,0,0.2)`,
                  color: ROLE_COLOR[role] || '#94a3b8',
                  border: `1px solid ${ROLE_COLOR[role] || '#94a3b8'}40`,
                }}>{role}</span>
                {studentId && (
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 100, background: '#293548', color: '#94a3b8' }}>
                    ID: {studentId}
                  </span>
                )}
                {joined && (
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 100, background: '#293548', color: '#94a3b8' }}>
                    Joined {new Date(joined).toLocaleDateString('default', { month: 'long', year: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 24 }}>
            {[
              { label: 'Books Completed', value: stats.completed, icon: '✅', color: '#34d399' },
              { label: 'Currently Reading', value: stats.reading,   icon: '📖', color: '#818cf8' },
              { label: 'Active Days',       value: stats.active_days, icon: '🔥', color: '#fb7185' },
            ].map(s => (
              <div key={s.label} style={{
                background: '#1e293b', border: '1px solid rgba(148,163,184,0.12)',
                borderRadius: 14, padding: '16px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 22 }}>{s.icon}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: s.color, letterSpacing: '-0.5px', margin: '4px 0' }}>{s.value}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#1e293b', padding: 4, borderRadius: 12, width: 'fit-content' }}>
            {['profile', 'security'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: '7px 18px', borderRadius: 8, border: 'none',
                background: activeTab === tab ? '#6366f1' : 'transparent',
                color: activeTab === tab ? 'white' : '#94a3b8',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
                textTransform: 'capitalize', transition: 'all 0.15s',
              }}>{tab}</button>
            ))}
          </div>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div style={{ background: '#1e293b', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 16, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Personal Information</div>
              <form onSubmit={handleSave}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 5 }}>Full name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 5 }}>Email address</label>
                    <input type="email" value={email} disabled style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 5 }}>Student ID</label>
                    <input type="text" value={studentId} onChange={e => setStudentId(e.target.value)} style={inputStyle} placeholder="e.g. STU2024001" />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 5 }}>Role</label>
                    <input type="text" value={role} disabled style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed', textTransform: 'capitalize' }} />
                  </div>
                </div>
                <button type="submit" disabled={saving} style={{
                  padding: '9px 20px', background: saving ? '#4338ca' : '#6366f1',
                  border: 'none', borderRadius: 8, color: 'white',
                  fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
                }}>
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              </form>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: '#1e293b', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 16, padding: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Password</div>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>Change your account password</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                  {['Current password', 'New password', 'Confirm new password'].map(label => (
                    <div key={label}>
                      <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 5 }}>{label}</label>
                      <input type="password" placeholder="••••••••" style={inputStyle} />
                    </div>
                  ))}
                </div>
                <button onClick={() => toast('Password change coming soon!', { icon: '🔒' })} style={{
                  padding: '9px 20px', background: '#6366f1',
                  border: 'none', borderRadius: 8, color: 'white',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}>Update password</button>
              </div>

              <div style={{
                background: 'rgba(251,113,133,0.05)',
                border: '1px solid rgba(251,113,133,0.2)',
                borderRadius: 16, padding: 20,
              }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fb7185', marginBottom: 4 }}>Sign out</div>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>Sign out of your account on this device</div>
                <button onClick={handleLogout} style={{
                  padding: '9px 20px',
                  background: 'rgba(251,113,133,0.15)',
                  border: '1px solid rgba(251,113,133,0.3)',
                  borderRadius: 8, color: '#fb7185',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}>Sign out</button>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}
