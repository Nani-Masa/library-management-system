import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../components/layout/Layout';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/api';
import toast from 'react-hot-toast';

const STATUS_STYLE = {
  PENDING:   { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.3)',  icon: '⏳' },
  APPROVED:  { color: '#34d399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.3)',  icon: '✅' },
  REJECTED:  { color: '#fb7185', bg: 'rgba(251,113,133,0.12)', border: 'rgba(251,113,133,0.3)', icon: '❌' },
  CANCELLED: { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)',  border: 'rgba(148,163,184,0.2)', icon: '🚫' },
};

export default function MyRequests() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('ALL');

  useEffect(() => { if (!authLoading && !user) router.push('/login'); }, [user, authLoading]);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/requests');
      setRequests(data);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { if (user) load(); }, [user]);

  const cancel = async (id) => {
    if (!confirm('Cancel this request?')) return;
    try {
      await api.put(`/requests/${id}/cancel`);
      toast.success('Request cancelled');
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const filtered = filter === 'ALL' ? requests : requests.filter(r => r.status === filter);
  const pending  = requests.filter(r => r.status === 'PENDING').length;

  if (authLoading || !user) return null;

  return (
    <>
      <Head><title>My Requests — LibraryOS</title></Head>
      <Layout>
        <div className="page-enter">
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, color: 'var(--subtle)', marginBottom: 4 }}>Home / My Requests</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--text)' }}>My Requests</h1>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>Track your borrow and return requests</p>
          </div>

          {/* Pending alert */}
          {pending > 0 && (
            <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 20 }}>⏳</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fbbf24' }}>
                  {pending} pending request{pending > 1 ? 's' : ''}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                  The librarian will review and approve your request. Please visit the library once approved.
                </div>
              </div>
            </div>
          )}

          {/* How it works */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 18px', marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>📋 How the request system works</div>
            <div style={{ display: 'flex', gap: 0, position: 'relative' }}>
              {[
                { step: '1', icon: '📱', title: 'Submit Request', desc: 'Request to borrow or return a book from the catalog', color: '#6366f1' },
                { step: '2', icon: '👀', title: 'Staff Reviews',  desc: 'Librarian or admin reviews and approves your request', color: '#8b5cf6' },
                { step: '3', icon: '🔔', title: 'Get Notified',   desc: 'You receive a notification when approved or rejected', color: '#a78bfa' },
                { step: '4', icon: '🏛️', title: 'Visit Library', desc: 'Collect or return the book at the library counter', color: '#34d399' },
              ].map((s, i) => (
                <div key={s.step} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, position: 'relative' }}>
                  {i < 3 && <div style={{ position: 'absolute', top: 16, left: '60%', right: '-40%', height: 2, background: 'var(--border)', zIndex: 0 }} />}
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, zIndex: 1, flexShrink: 0 }}>{s.icon}</div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{s.title}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.4 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Filter pills */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
            {['ALL','PENDING','APPROVED','REJECTED','CANCELLED'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '5px 14px', borderRadius: 100, fontSize: 11, fontWeight: 500, cursor: 'pointer',
                border: 'none',
                background: filter === f ? '#6366f1' : 'var(--surface2)',
                color: filter === f ? 'white' : 'var(--muted)',
                transition: 'all 0.15s',
              }}>
                {f === 'ALL' ? 'All' : STATUS_STYLE[f]?.icon + ' ' + f.charAt(0) + f.slice(1).toLowerCase()}
                {f !== 'ALL' && ` (${requests.filter(r => r.status === f).length})`}
              </button>
            ))}
          </div>

          {/* Requests list */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 90, borderRadius: 14 }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '60px 0', textAlign: 'center', color: 'var(--muted)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>No requests yet</div>
              <div style={{ fontSize: 13, marginBottom: 20 }}>Browse books and request to borrow one!</div>
              <button onClick={() => router.push('/books')} style={{ padding: '10px 24px', background: '#6366f1', border: 'none', borderRadius: 10, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Browse Books
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map(req => {
                const s = STATUS_STYLE[req.status] || STATUS_STYLE.PENDING;
                return (
                  <div key={req.id} style={{ background: 'var(--surface)', border: `1px solid ${req.status === 'PENDING' ? 'rgba(251,191,36,0.2)' : 'var(--border)'}`, borderRadius: 14, padding: '16px 18px' }}>
                    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      {/* Book cover placeholder */}
                      <div style={{ width: 44, height: 58, borderRadius: 8, background: 'linear-gradient(135deg,#312e81,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>📚</div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, gap: 10 }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{req.book_title}</div>
                            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{req.book_author}</div>
                          </div>
                          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                            <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 100, fontWeight: 700, background: req.type === 'BORROW' ? 'rgba(99,102,241,0.15)' : 'rgba(251,191,36,0.15)', color: req.type === 'BORROW' ? '#818cf8' : '#fbbf24' }}>
                              {req.type === 'BORROW' ? '📥 Borrow' : '📤 Return'}
                            </span>
                            <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 100, fontWeight: 700, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                              {s.icon} {req.status}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--muted)', marginBottom: req.note || req.admin_note ? 8 : 0 }}>
                          <span>📅 Requested: {new Date(req.created_at).toLocaleDateString()}</span>
                          {req.shelf_location && <span>📍 Shelf: {req.shelf_location}</span>}
                          {req.reviewed_at && <span>👤 Reviewed: {new Date(req.reviewed_at).toLocaleDateString()}</span>}
                        </div>

                        {/* Notes */}
                        {req.note && (
                          <div style={{ fontSize: 11, color: 'var(--muted)', background: 'var(--surface2)', borderRadius: 6, padding: '5px 8px', marginBottom: 4 }}>
                            📝 Your note: {req.note}
                          </div>
                        )}
                        {req.admin_note && (
                          <div style={{ fontSize: 11, color: req.status === 'REJECTED' ? '#fb7185' : '#34d399', background: req.status === 'REJECTED' ? 'rgba(251,113,133,0.08)' : 'rgba(52,211,153,0.08)', borderRadius: 6, padding: '5px 8px' }}>
                            {req.status === 'APPROVED' ? '✅' : '❌'} Staff note: {req.admin_note}
                          </div>
                        )}

                        {/* Approved instructions */}
                        {req.status === 'APPROVED' && req.type === 'BORROW' && (
                          <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 8, fontSize: 12, color: '#34d399' }}>
                            🏛️ <strong>Please visit the library counter</strong> to collect your book. Shelf: {req.shelf_location || 'Ask the librarian'}
                          </div>
                        )}
                        {req.status === 'APPROVED' && req.type === 'RETURN' && (
                          <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 8, fontSize: 12, color: '#34d399' }}>
                            🏛️ <strong>Please bring the book</strong> to the library counter for return processing.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Cancel button for pending */}
                    {req.status === 'PENDING' && (
                      <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
                        <button onClick={() => cancel(req.id)} style={{
                          padding: '5px 14px', background: 'transparent',
                          border: '1px solid rgba(251,113,133,0.25)',
                          borderRadius: 7, color: 'var(--muted)',
                          fontSize: 11, cursor: 'pointer', transition: 'all 0.15s',
                        }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#fb7185'; e.currentTarget.style.borderColor = 'rgba(251,113,133,0.5)'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'rgba(251,113,133,0.25)'; }}>
                          Cancel request
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}
