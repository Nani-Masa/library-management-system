import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../components/layout/Layout';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function MyBorrows() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [borrows, setBorrows]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [requesting, setRequesting] = useState(null);

  useEffect(() => { if (!authLoading && !user) router.push('/login'); }, [user, authLoading]);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/borrow/my');
      setBorrows(data);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { if (user) load(); }, [user]);

  // Submit a RETURN REQUEST to librarian (not direct return)
  const requestReturn = async (bookId, title) => {
    setRequesting(bookId);
    try {
      await api.post('/requests', { book_id: bookId, type: 'RETURN' });
      toast.success(`📨 Return request submitted for "${title}"! Bring the book to the library once approved.`);
      load();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to submit return request';
      toast.error(msg);
    } finally {
      setRequesting(null);
    }
  };

  const active  = borrows.filter(b => !b.returned_at);
  const history = borrows.filter(b => b.returned_at);

  if (authLoading || !user) return null;

  const Row = ({ b }) => {
    const due      = new Date(b.due_date);
    const now      = new Date();
    const daysLeft = Math.ceil((due - now) / 86400000);
    const overdue  = !b.returned_at && daysLeft < 0;
    const dueSoon  = !b.returned_at && daysLeft >= 0 && daysLeft <= 3;

    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 0',
        borderBottom: '1px solid var(--border)',
      }}>
        {/* Book cover */}
        <div style={{
          width: 38, height: 52, borderRadius: 6, flexShrink: 0,
          background: 'linear-gradient(135deg,#312e81,#4f46e5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
        }}>📚</div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.title}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>{b.author}</div>
          <div style={{ display: 'flex', gap: 10, fontSize: 10, color: 'var(--subtle)', flexWrap: 'wrap' }}>
            <span>📅 Issued: {new Date(b.issued_at).toLocaleDateString()}</span>
            {b.returned_at
              ? <span>✅ Returned: {new Date(b.returned_at).toLocaleDateString()}</span>
              : <span style={{ color: overdue ? '#fb7185' : dueSoon ? '#fbbf24' : 'var(--subtle)' }}>
                  ⏰ Due: {due.toLocaleDateString()}
                </span>
            }
            {b.fine_amount > 0 && (
              <span style={{ color: '#fb7185' }}>💰 Fine: ₹{parseFloat(b.fine_amount).toFixed(2)}</span>
            )}
          </div>
        </div>

        {/* Status / Action */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          {b.returned_at ? (
            <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 100, fontWeight: 600, background: 'rgba(52,211,153,0.12)', color: '#34d399' }}>
              ✅ Returned
            </span>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
              {/* Due status badge */}
              <span style={{
                fontSize: 11, fontWeight: 600,
                color: overdue ? '#fb7185' : dueSoon ? '#fbbf24' : '#34d399',
              }}>
                {overdue ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
              </span>

              {/* Return request button */}
              <ReturnButton b={b} requesting={requesting} requestReturn={requestReturn} />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <Head><title>My Borrows — LibraryOS</title></Head>
      <Layout>
        <div className="page-enter">
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, color: 'var(--subtle)', marginBottom: 4 }}>Home / My Borrows</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--text)' }}>My Borrows</h1>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
              {active.length} active · {history.length} returned
            </p>
          </div>

          {/* How return works info banner */}
          <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, padding: '10px 16px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 18 }}>ℹ️</span>
            <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
              To return a book, click <strong style={{ color: 'var(--text)' }}>Request Return</strong> below.
              The librarian will review and approve it.
              Then bring the physical book to the library counter.
            </div>
          </div>

          {loading ? (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
              {[1,2,3].map(i => (
                <div key={i} className="skeleton" style={{ height: 60, borderRadius: 8, marginBottom: 8 }} />
              ))}
            </div>
          ) : (
            <>
              {/* Active borrows */}
              {active.length > 0 ? (
                <>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>
                    Currently borrowed ({active.length})
                  </div>
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '0 16px', marginBottom: 24 }}>
                    {active.map(b => <Row key={b.id} b={b} />)}
                  </div>
                </>
              ) : (
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, textAlign: 'center', padding: '40px 0', marginBottom: 24 }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>📭</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>No active borrows</div>
                  <button onClick={() => router.push('/books')} style={{ marginTop: 12, padding: '8px 20px', background: '#6366f1', border: 'none', borderRadius: 8, color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    Browse books
                  </button>
                </div>
              )}

              {/* History */}
              {history.length > 0 && (
                <>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>
                    Return history ({history.length})
                  </div>
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '0 16px' }}>
                    {history.map(b => <Row key={b.id} b={b} />)}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </Layout>
    </>
  );
}

// Separate component to handle return button state cleanly
function ReturnButton({ b, requesting, requestReturn }) {
  const [pendingReturn, setPendingReturn] = useState(false);

  // Check if there's already a pending return request
  useEffect(() => {
    api.get('/requests').then(r => {
      const existing = r.data.find(req =>
        req.book_id === b.book_id &&
        req.type === 'RETURN' &&
        req.status === 'PENDING'
      );
      if (existing) setPendingReturn(true);
    }).catch(() => {});
  }, [b.book_id]);

  if (pendingReturn) {
    return (
      <span style={{
        fontSize: 11, padding: '5px 12px', borderRadius: 7,
        background: 'rgba(251,191,36,0.12)',
        border: '1px solid rgba(251,191,36,0.3)',
        color: '#fbbf24', fontWeight: 600,
      }}>
        ⏳ Return pending
      </span>
    );
  }

  return (
    <button
      onClick={() => requestReturn(b.book_id, b.title)}
      disabled={requesting === b.book_id}
      style={{
        padding: '6px 14px',
        background: requesting === b.book_id ? 'var(--surface2)' : 'rgba(99,102,241,0.12)',
        border: '1px solid rgba(99,102,241,0.3)',
        borderRadius: 7, color: '#818cf8',
        fontSize: 11, fontWeight: 600,
        cursor: requesting === b.book_id ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => { if (requesting !== b.book_id) e.currentTarget.style.background = 'rgba(99,102,241,0.2)'; }}
      onMouseLeave={e => { if (requesting !== b.book_id) e.currentTarget.style.background = 'rgba(99,102,241,0.12)'; }}>
      {requesting === b.book_id ? '⏳ Submitting…' : '📤 Request Return'}
    </button>
  );
}
