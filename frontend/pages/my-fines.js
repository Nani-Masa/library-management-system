import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../components/layout/Layout';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/api';

export default function MyFines() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [fines, setFines]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (!authLoading && !user) router.push('/login'); }, [user, authLoading]);
  useEffect(() => {
    if (!user) return;
    api.get('/fines/my').then(r => setFines(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  const totalPending = fines.filter(f => !f.fine_paid).reduce((s, f) => s + parseFloat(f.fine_amount || 0), 0);

  if (authLoading || !user) return null;

  return (
    <>
      <Head><title>My Fines — LibraryOS</title></Head>
      <Layout>
        <div className="page-enter">
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, color: 'var(--subtle)', marginBottom: 4 }}>Home / My Fines</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--text)' }}>My Fines</h1>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>View and track your library fines</p>
          </div>

          {/* Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
            <div style={{ background: totalPending > 0 ? 'rgba(251,113,133,0.08)' : 'rgba(52,211,153,0.08)', border: `1px solid ${totalPending > 0 ? 'rgba(251,113,133,0.25)' : 'rgba(52,211,153,0.25)'}`, borderRadius: 14, padding: '16px 20px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Total Pending</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: totalPending > 0 ? '#fb7185' : '#34d399' }}>
                ${totalPending.toFixed(2)}
              </div>
              {totalPending > 0 && <div style={{ fontSize: 11, color: '#fb7185', marginTop: 4 }}>Please pay at the library counter</div>}
              {totalPending === 0 && <div style={{ fontSize: 11, color: '#34d399', marginTop: 4 }}>No pending fines 🎉</div>}
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 20px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Total Fines</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)' }}>{fines.length}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                {fines.filter(f => f.fine_paid).length} paid · {fines.filter(f => !f.fine_paid).length} pending
              </div>
            </div>
          </div>

          {/* Fine notice */}
          {totalPending > 0 && (
            <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 18 }}>⚠️</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fbbf24', marginBottom: 2 }}>You have unpaid fines</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
                  You have <strong style={{ color: 'var(--text)' }}>${totalPending.toFixed(2)}</strong> in pending fines.
                  Please visit the library counter to clear them. Unpaid fines may affect your ability to borrow books.
                </div>
              </div>
            </div>
          )}

          {/* Fines list */}
          {loading ? (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
              {[1,2].map(i => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 10, marginBottom: 10 }} />)}
            </div>
          ) : fines.length === 0 ? (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '60px 0', textAlign: 'center', color: 'var(--muted)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>No fines!</div>
              <div style={{ fontSize: 13 }}>Keep returning books on time to stay fine-free.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {fines.map(fine => (
                <div key={fine.id} style={{
                  background: 'var(--surface)', border: `1px solid ${fine.fine_paid ? 'var(--border)' : 'rgba(251,113,133,0.2)'}`,
                  borderRadius: 14, padding: '16px 18px',
                  opacity: fine.fine_paid ? 0.7 : 1,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{fine.book_title}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{fine.book_author}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: fine.fine_paid ? '#34d399' : '#fb7185' }}>
                        ${parseFloat(fine.fine_amount).toFixed(2)}
                      </div>
                      <span style={{
                        fontSize: 10, padding: '2px 8px', borderRadius: 100, fontWeight: 600,
                        background: fine.fine_paid ? 'rgba(52,211,153,0.15)' : 'rgba(251,113,133,0.15)',
                        color: fine.fine_paid ? '#34d399' : '#fb7185',
                      }}>
                        {fine.fine_paid ? '✅ Paid' : '⏳ Pending'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    {[
                      ['Due date', new Date(fine.due_date).toLocaleDateString()],
                      ['Imposed by', fine.imposed_by_name || 'System'],
                      ['Imposed on', fine.fine_imposed_at ? new Date(fine.fine_imposed_at).toLocaleDateString() : '—'],
                    ].map(([label, value]) => (
                      <div key={label} style={{ background: 'var(--surface2)', borderRadius: 8, padding: '7px 10px' }}>
                        <div style={{ fontSize: 10, color: 'var(--subtle)', marginBottom: 2 }}>{label}</div>
                        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>{value}</div>
                      </div>
                    ))}
                  </div>

                  {fine.fine_note && (
                    <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(251,191,36,0.08)', borderRadius: 8, fontSize: 12, color: 'var(--muted)' }}>
                      📝 <strong style={{ color: 'var(--text)' }}>Note:</strong> {fine.fine_note}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}
