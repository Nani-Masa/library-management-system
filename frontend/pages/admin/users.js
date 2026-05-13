import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/api';

export default function AdminUsers() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || (user.role !== 'admin' && user.role !== 'librarian'))) {
      router.push('/dashboard');
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!user) return;
    api.get('/users').then(r => setUsers(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const ROLE_COLOR = { admin: '#fb7185', librarian: '#fbbf24', student: '#34d399' };

  if (authLoading || !user) return null;

  return (
    <>
      <Head><title>Manage Users — LibraryOS Admin</title></Head>
      <Layout>
        <div className="page-enter">
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Admin / Users</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px' }}>Manage Users</h1>
            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>{users.length} registered users</p>
          </div>

          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#1e293b', border: '1px solid rgba(148,163,184,0.15)',
            borderRadius: 10, padding: '9px 14px', marginBottom: 16
          }}>
            <span style={{ color: '#64748b' }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              style={{ background: 'none', border: 'none', color: '#f1f5f9', fontSize: 13, flex: 1, outline: 'none' }}
            />
          </div>

          {loading ? (
            <div style={{ background: '#1e293b', borderRadius: 16, padding: 20 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 44, borderRadius: 8, marginBottom: 8 }} />)}
            </div>
          ) : (
            <div style={{ background: '#1e293b', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 16, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
                    {['User', 'Email', 'Role', 'Student ID', 'Joined'].map(h => (
                      <th key={h} style={{
                        textAlign: 'left', fontSize: 10, fontWeight: 600,
                        color: '#64748b', textTransform: 'uppercase',
                        letterSpacing: '0.06em', padding: '12px 16px'
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u, i) => (
                    <tr key={u.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(148,163,184,0.06)' : 'none' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: '50%',
                            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 10, fontWeight: 700, flexShrink: 0
                          }}>
                            {u.name.slice(0,2).toUpperCase()}
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 500 }}>{u.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: '#94a3b8' }}>{u.email}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          fontSize: 10, padding: '2px 8px', borderRadius: 6, fontWeight: 600,
                          background: `rgba(0,0,0,0.2)`,
                          color: ROLE_COLOR[u.role] || '#94a3b8'
                        }}>{u.role}</span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: '#94a3b8' }}>{u.student_id || '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: '#64748b' }}>
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}
