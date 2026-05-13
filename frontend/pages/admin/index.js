import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import StatCard from '../../components/ui/StatCard';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/api';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || (user.role !== 'admin' && user.role !== 'librarian'))) {
      router.push('/dashboard');
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!user) return;
    api.get('/analytics/dashboard').then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  if (authLoading || !user || loading) return (
    <Layout>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
        {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }} />)}
      </div>
    </Layout>
  );

  const maxCount = Math.max(...(data?.monthly_trend?.map(m => m.count) || [1]));

  return (
    <>
      <Head><title>Analytics — LibraryOS Admin</title></Head>
      <Layout>
        <div className="page-enter">
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Admin / Analytics</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px' }}>Analytics Dashboard</h1>
            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>Library performance overview · Last 30 days</p>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 24 }}>
            <StatCard label="Total Books"   value={data?.stats?.total_books?.toLocaleString()} icon="📚" color="#818cf8" />
            <StatCard label="Active Users"  value={data?.stats?.total_users?.toLocaleString()} icon="👥" color="#34d399" delta="this month" deltaUp />
            <StatCard label="Books Issued"  value={data?.stats?.issued_books}                  icon="📋" color="#fbbf24" />
            <StatCard label="Overdue"       value={data?.stats?.overdue_books}                 icon="⚠️" color="#fb7185" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            {/* Chart */}
            <div className="card">
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Borrowing trends</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 16 }}>Monthly checkouts</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 100 }}>
                {data?.monthly_trend?.map((m, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div
                      title={`${m.month}: ${m.count}`}
                      style={{
                        width: '100%',
                        height: `${Math.max(8, (m.count / maxCount) * 80)}px`,
                        background: '#6366f1',
                        opacity: 0.5 + (i / (data.monthly_trend.length - 1)) * 5.00,
                        borderRadius: '4px 4px 0 0',
                        transition: 'all 0.3s',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                      onMouseLeave={e => e.currentTarget.style.opacity = String(0.5 + (i / (data.monthly_trend.length - 1)) * 2.00)}
                    />
                    <span style={{ fontSize: 9, color: '#64748b' }}>{m.month}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top categories */}
            <div className="card">
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Top categories</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data?.top_categories?.map((c, i) => {
                  const max = data.top_categories[0]?.count || 1;
                  const pct = Math.round((c.count / max) * 100);
                  const colors = ['#6366f1','#8b5cf6','#38bdf8','#34d399','#fbbf24','#fb7185'];
                  return (
                    <div key={c.category}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                        <span>{c.category}</span>
                        <span style={{ color: '#94a3b8' }}>{c.count}</span>
                      </div>
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${pct}%`, background: colors[i] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Top books */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Most borrowed books</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {data?.top_books?.map((b, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
                  borderBottom: i < data.top_books.length - 1 ? '1px solid rgba(148,163,184,0.08)' : 'none' }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: '#293548',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#818cf8', flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{b.title}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{b.author}</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#818cf8' }}>{b.borrow_count}×</div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent transactions */}
          <div className="card">
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Recent transactions</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Student','Book','Issued','Returned'].map(h => (
                    <th key={h} style={{ textAlign: 'left', fontSize: 10, fontWeight: 600, color: '#64748b',
                      textTransform: 'uppercase', letterSpacing: '0.06em', paddingBottom: 8 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data?.recent_transactions?.map((t, i) => (
                  <tr key={i}>
                    <td style={{ padding: '8px 0', fontSize: 12, borderTop: '1px solid rgba(148,163,184,0.08)' }}>{t.user_name}</td>
                    <td style={{ padding: '8px 0', fontSize: 12, borderTop: '1px solid rgba(148,163,184,0.08)', color: '#94a3b8' }}>{t.title?.slice(0, 30)}{t.title?.length > 30 ? '…' : ''}</td>
                    <td style={{ padding: '8px 0', fontSize: 11, borderTop: '1px solid rgba(148,163,184,0.08)', color: '#64748b' }}>{new Date(t.issued_at).toLocaleDateString()}</td>
                    <td style={{ padding: '8px 0', fontSize: 11, borderTop: '1px solid rgba(148,163,184,0.08)' }}>
                      {t.returned_at
                        ? <span style={{ color: '#34d399' }}>✓ {new Date(t.returned_at).toLocaleDateString()}</span>
                        : <span style={{ color: '#fbbf24' }}>Active</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Layout>
    </>
  );
}
