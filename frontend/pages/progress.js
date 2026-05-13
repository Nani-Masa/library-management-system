import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../components/layout/Layout';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function Progress() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [items, setItems]     = useState([]);
  const [stats, setStats]     = useState({ completed: 0, reading: 0, active_days: 0 });
  const [loading, setLoading] = useState(true);
  const [weeklyData]          = useState([42,78,55,91,63,88,104]);
  const days                  = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const maxPages              = Math.max(...weeklyData);

  useEffect(() => { if (!authLoading && !user) router.push('/login'); }, [user, authLoading]);
  useEffect(() => {
    if (!user) return;
    Promise.all([api.get('/reading-progress'), api.get('/analytics/reading-stats')])
      .then(([p, s]) => { setItems(p.data); setStats(s.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const updatePages = async (item, pages) => {
    const p = Math.max(0, Math.min(item.total_pages, parseInt(pages) || 0));
    const status = p >= item.total_pages ? 'completed' : 'reading';
    try {
      await api.post('/reading-progress', {
        book_id: item.book_id, pages_read: p,
        total_pages: item.total_pages, status,
      });
      setItems(prev => prev.map(x =>
        x.book_id === item.book_id
          ? { ...x, pages_read: p, percent: Math.round(p / item.total_pages * 100), status }
          : x
      ));
      if (status === 'completed') toast.success('🎉 Book completed!');
    } catch {}
  };

  if (authLoading || !user) return null;

  return (
    <>
      <Head><title>Reading Progress — LibraryOS</title></Head>
      <Layout>
        <div className="page-enter">
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px' }}>Reading Progress</h1>
            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>Track your reading journey</p>
          </div>

          {/* Streak Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 24 }}>
            {[
              { icon: '🔥', num: 14,               label: 'Day streak',     color: '#fb7185', bg: 'rgba(251,113,133,0.15)', border: 'rgba(251,113,133,0.3)' },
              { icon: '📚', num: stats.completed,   label: 'Books finished', color: '#818cf8', bg: 'rgba(99,102,241,0.15)',  border: 'rgba(99,102,241,0.3)' },
              { icon: '📖', num: stats.reading,     label: 'In progress',    color: '#34d399', bg: 'rgba(52,211,153,0.15)',  border: 'rgba(52,211,153,0.3)' },
            ].map(c => (
              <div key={c.label} style={{
                background: c.bg, border: `1px solid ${c.border}`,
                borderRadius: 14, padding: '16px 18px',
                display: 'flex', alignItems: 'center', gap: 14,
              }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{c.icon}</div>
                <div>
                  <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-1px', color: c.color }}>{c.num}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{c.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Year Goal */}
          <div style={{ background: '#1e293b', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 16, padding: 16, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>2024 Reading Goal</div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>{stats.completed} of 24 books · {Math.max(0, 24 - stats.completed)} to go</div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#818cf8' }}>
                {Math.min(100, Math.round((stats.completed / 24) * 100))}%
              </div>
            </div>
            <div style={{ background: '#293548', borderRadius: 100, height: 10, overflow: 'hidden' }}>
              <div style={{
                width: `${Math.min(100, Math.round((stats.completed / 24) * 100))}%`,
                height: '100%', borderRadius: 100,
                background: 'linear-gradient(90deg,#6366f1,#8b5cf6)',
                transition: 'width 0.6s ease',
              }} />
            </div>
          </div>

          {/* Weekly Pages Chart */}
          <div style={{ background: '#1e293b', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 16, padding: 20, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Pages read this week</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Daily reading activity</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#818cf8' }}>
                  {weeklyData.reduce((a, b) => a + b, 0)}
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>total pages</div>
              </div>
            </div>

            {/* Bar Chart */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
              {weeklyData.map((pages, i) => {
                const height = Math.max(8, (pages / maxPages) * 100);
                const isToday = i === new Date().getDay() - 1;
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{ fontSize: 9, color: '#64748b' }}>{pages}</div>
                    <div
                      title={`${days[i]}: ${pages} pages`}
                      style={{
                        width: '100%',
                        height: `${height}%`,
                        background: isToday
                          ? 'linear-gradient(180deg,#818cf8,#6366f1)'
                          : 'rgba(99,102,241,0.3)',
                        borderRadius: '4px 4px 0 0',
                        transition: 'all 0.3s',
                        cursor: 'pointer',
                        border: isToday ? '1px solid rgba(129,140,248,0.5)' : 'none',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'linear-gradient(180deg,#818cf8,#6366f1)'}
                      onMouseLeave={e => {
                        if (!isToday) e.currentTarget.style.background = 'rgba(99,102,241,0.3)';
                      }}
                    />
                    <div style={{ fontSize: 10, color: isToday ? '#818cf8' : '#64748b', fontWeight: isToday ? 700 : 400 }}>
                      {days[i]}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Chart Legend */}
            <div style={{ display: 'flex', gap: 16, marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(148,163,184,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94a3b8' }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: 'linear-gradient(180deg,#818cf8,#6366f1)' }} />
                Today
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94a3b8' }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(99,102,241,0.3)' }} />
                Other days
              </div>
              <div style={{ marginLeft: 'auto', fontSize: 11, color: '#64748b' }}>
                Avg: {Math.round(weeklyData.reduce((a,b) => a+b,0) / weeklyData.length)} pages/day
              </div>
            </div>
          </div>

          {/* Currently Reading */}
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Currently reading</div>
          {loading ? (
            <div style={{ background: '#1e293b', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 16, padding: 20 }}>
              <div className="skeleton" style={{ height: 60, borderRadius: 8 }} />
            </div>
          ) : items.filter(x => x.status === 'reading').length === 0 ? (
            <div style={{
              background: '#1e293b', border: '1px solid rgba(148,163,184,0.12)',
              borderRadius: 16, textAlign: 'center', padding: '40px 0', color: '#64748b',
            }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📖</div>
              <div style={{ fontSize: 14 }}>No books in progress</div>
              <button onClick={() => router.push('/books')} style={{
                marginTop: 12, padding: '8px 18px', background: '#6366f1',
                border: 'none', borderRadius: 8, color: 'white',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>Browse catalog</button>
            </div>
          ) : (
            <div style={{ background: '#1e293b', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 16, padding: 0, overflow: 'hidden' }}>
              {items.filter(x => x.status === 'reading').map((item, i, arr) => (
                <div key={item.id} style={{
                  display: 'flex', gap: 14, alignItems: 'center', padding: '14px 16px',
                  borderBottom: i < arr.length - 1 ? '1px solid rgba(148,163,184,0.08)' : 'none',
                }}>
                  <div style={{
                    width: 40, height: 54, borderRadius: 6, flexShrink: 0,
                    background: 'linear-gradient(135deg,#312e81,#4f46e5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                  }}>📚</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>{item.author} · {item.pages_read} / {item.total_pages} pages</div>
                    <div style={{ background: '#293548', borderRadius: 100, height: 6, overflow: 'hidden' }}>
                      <div style={{
                        width: `${item.percent || 0}%`, height: '100%', borderRadius: 100,
                        background: item.percent >= 80 ? '#34d399' : '#6366f1',
                        transition: 'width 0.6s ease',
                      }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: item.percent >= 80 ? '#34d399' : '#818cf8' }}>
                      {item.percent || 0}%
                    </span>
                    <input
                      type="number" min={0} max={item.total_pages}
                      defaultValue={item.pages_read}
                      onBlur={e => updatePages(item, e.target.value)}
                      style={{
                        width: 56, padding: '3px 6px',
                        background: '#293548',
                        border: '1px solid rgba(148,163,184,0.15)',
                        borderRadius: 6, color: '#f1f5f9',
                        fontSize: 11, textAlign: 'center', outline: 'none',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Completed */}
          {items.filter(x => x.status === 'completed').length > 0 && (
            <>
              <div style={{ fontSize: 14, fontWeight: 600, margin: '24px 0 12px' }}>✅ Completed</div>
              <div style={{ background: '#1e293b', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 16, overflow: 'hidden' }}>
                {items.filter(x => x.status === 'completed').map((item, i, arr) => (
                  <div key={item.id} style={{
                    display: 'flex', gap: 14, alignItems: 'center', padding: '12px 16px',
                    borderBottom: i < arr.length - 1 ? '1px solid rgba(148,163,184,0.08)' : 'none',
                    opacity: 0.75,
                  }}>
                    <div style={{ width: 34, height: 46, borderRadius: 6, background: 'linear-gradient(135deg,#064e3b,#047857)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>✅</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{item.title}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{item.author}</div>
                    </div>
                    <span style={{ fontSize: 11, color: '#34d399', fontWeight: 600 }}>Finished</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </Layout>
    </>
  );
}
