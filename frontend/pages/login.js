import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name}!`);
      router.push(user.role === 'admin' || user.role === 'librarian' ? '/admin' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    const creds = {
      admin:     { email: 'admin@library.edu',     password: 'Admin@123' },
      librarian: { email: 'librarian@library.edu', password: 'Admin@123' },
      student:   { email: 'student@library.edu',   password: 'Admin@123' },
    };
    setEmail(creds[role].email);
    setPassword(creds[role].password);
  };

  const inputStyle = {
    width: '100%', background: 'var(--bg)',
    border: '1px solid rgba(148,163,184,0.2)',
    borderRadius: 8, padding: '9px 12px',
    fontSize: 13, color: '#f1f5f9',
    outline: 'none', boxSizing: 'border-box',
  };

  return (
    <>
      <Head><title>Sign In — LibraryOS</title></Head>
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: 'var(--surface)', border: '1px solid rgba(148,163,184,0.15)', borderRadius: 20, padding: '32px 28px', width: 340 }}>

          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📚</div>
              <span style={{ fontWeight: 700, fontSize: 16 }}>LibraryOS</span>
            </div>
          </div>

          <h2 style={{ fontSize: 18, fontWeight: 600, textAlign: 'center', marginBottom: 4 }}>Welcome back</h2>
          <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', marginBottom: 24 }}>Sign in to your account</p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#94a3b8', display: 'block', marginBottom: 5 }}>Email address</label>
              <input
                type="email" placeholder="student@university.edu"
                value={email} onChange={e => setEmail(e.target.value)}
                required style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#94a3b8', display: 'block', marginBottom: 5 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)}
                  required style={{ ...inputStyle, paddingRight: 42 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  style={{
                    position: 'absolute', right: 10, top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none',
                    cursor: 'pointer', fontSize: 16,
                    color: '#64748b', padding: '0 2px', lineHeight: 1,
                  }}
                  title={showPass ? 'Hide password' : 'Show password'}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '10px',
              background: loading ? '#4338ca' : '#6366f1',
              border: 'none', borderRadius: 8, color: 'white',
              fontSize: 13, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div style={{ margin: '16px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(148,163,184,0.12)' }} />
            <span style={{ fontSize: 11, color: '#64748b' }}>demo accounts</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(148,163,184,0.12)' }} />
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            {['admin','librarian','student'].map(role => (
              <button key={role} onClick={() => fillDemo(role)} style={{
                flex: 1, padding: '7px 4px', background: 'var(--bg)',
                border: '1px solid rgba(148,163,184,0.15)',
                borderRadius: 8, color: '#94a3b8', fontSize: 11,
                cursor: 'pointer', textTransform: 'capitalize',
              }}>{role}</button>
            ))}
          </div>
          <p style={{ fontSize: 11, color: '#64748b', textAlign: 'center', marginTop: 8 }}>
            Click a role to fill the form, then Sign in
          </p>

          <p style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', marginTop: 16 }}>
            Don&apos;t have an account?{' '}
            <Link href="/register" style={{ color: '#818cf8', textDecoration: 'none' }}>Sign up</Link>
          </p>
        </div>
      </div>
    </>
  );
}
