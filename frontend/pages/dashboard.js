import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../components/layout/Layout';
import StatCard from '../components/ui/StatCard';
import BookCard from '../components/books/BookCard';
import Chatbot from '../components/dashboard/Chatbot';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/api';

export default function Dashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [borrows, setBorrows]   = useState([]);
  const [recs, setRecs]         = useState([]);
  const [notifs, setNotifs]     = useState([]);
  const [stats, setStats]       = useState({ progress: 0, streak: 0, completed: 0, due: 0 });
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const [b, r, n] = await Promise.all([
          api.get('/borrow/my'),
          api.get('/chatbot/recommendations?limit=6'),
          api.get('/notifications'),
        ]);
        const active = b.data.filter(x => !x.returned_at);
        const dueSoon = active.filter(x => {
          const days = Math.ceil((new Date(x.due_date) - new Date()) / 86400000);
          return days <= 3 && days >= 0;
        });
        setBorrows(active.slice(0, 4));
        setRecs(r.data.recommendations || []);
        setNotifs(n.data.filter(x => !x.read_at).slice(0, 5));
        setStats({ due: dueSoon.length, active: active.length });
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, [user]);

  if (authLoading || !user) return null;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <>
      <Head><title>Dashboard — LibraryOS</title></Head>
      <Layout>
        <div className="page-enter">
          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Home / Overview</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px' }}>{greeting}, {user.name?.split(' ')[0]} 👋</h1>
            {stats.due > 0 && (
              <div style={{ marginTop: 6, fontSize: 13, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 6 }}>
                ⚠️ You have <strong>{stats.due}</strong> book{stats.due > 1 ? 's' : ''} due within 3 days
              </div>
            )}
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 24 }}>
            <StatCard label="Books Borrowed" value={stats.active || 0} icon="📚" color="#818cf8" delta="this month" deltaUp />
            <StatCard label="Due Soon"       value={stats.due || 0}    icon="⏰" color="#fbbf24" />
            <StatCard label="Read This Year" value={19}                 icon="📖" color="#34d399" delta="4 vs last year" deltaUp />
            <StatCard label="Day Streak"     value={14}                 icon="🔥" color="#fb7185" delta="Personal best!" deltaUp />
          </div>

          {/* Active borrows */}
          {borrows.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Currently borrowed</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {borrows.map(b => {
                  const daysLeft = Math.ceil((new Date(b.due_date) - new Date()) / 86400000);
                  const overdue = daysLeft < 0;
                  return (
                    <div key={b.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px' }}>
                      <div style={{ width: 36, height: 48, borderRadius: 6, background: 'linear-gradient(135deg,#312e81,#4f46e5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>📚</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.title}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{b.author}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: overdue ? '#fb7185' : daysLeft <= 3 ? '#fbbf24' : '#34d399' }}>
                          {overdue ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                        </div>
                        <div style={{ fontSize: 10, color: '#64748b' }}>{new Date(b.due_date).toLocaleDateString()}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notifications */}
          {notifs.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>🔔 Notifications</div>
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {notifs.map((n, i) => (
                  <div key={n.id} style={{ display: 'flex', gap: 12, padding: '12px 16px',
                    borderBottom: i < notifs.length - 1 ? '1px solid rgba(148,163,184,0.08)' : 'none' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1', marginTop: 4, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{n.title}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{n.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Recommendations */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>🤖 AI Recommendations for you</div>
              <button onClick={() => router.push('/books')}
                style={{ fontSize: 12, color: '#818cf8', background: 'none', border: 'none', cursor: 'pointer' }}>
                Browse all →
              </button>
            </div>
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 160, borderRadius: 16 }} />)}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12 }}>
                {recs.map(b => <BookCard key={b.id} book={b} />)}
              </div>
            )}
          </div>
        </div>
      </Layout>
      <Chatbot />
    </>
  );
}
