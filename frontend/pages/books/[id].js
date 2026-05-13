import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import Chatbot from '../../components/dashboard/Chatbot';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/api';
import toast from 'react-hot-toast';

// Save helpers using localStorage
const SAVED_KEY = 'libraryos_saved_books';
function getSaved() { try { return JSON.parse(localStorage.getItem(SAVED_KEY) || '[]'); } catch { return []; } }
function checkSaved(id) { return getSaved().some(b => b.id === id); }
function toggleSaveBook(book) {
  const saved = getSaved();
  const exists = saved.some(b => b.id === book.id);
  if (exists) {
    localStorage.setItem(SAVED_KEY, JSON.stringify(saved.filter(b => b.id !== book.id)));
    return false;
  } else {
    localStorage.setItem(SAVED_KEY, JSON.stringify([{ ...book, saved_at: new Date().toISOString() }, ...saved]));
    return true;
  }
}

function ConfirmModal({ book, onConfirm, onCancel, loading }) {
  const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: '#1e293b', border: '1px solid rgba(148,163,184,0.2)',
        borderRadius: 20, padding: '28px 24px', width: 320,
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📖</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Confirm Borrow Request</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>Please review the details below</div>
        </div>
        <div style={{ background: '#0f172a', borderRadius: 12, padding: 14, marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{book?.title}</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>{book?.author}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              ['📅 Borrow date', new Date().toLocaleDateString()],
              ['⏰ Due date',    dueDate.toLocaleDateString()],
              ['💰 Fine if late','₹0.50 per day'],
              ['📍 Shelf',       book?.shelf_location || 'See librarian'],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: '#64748b' }}>{label}</span>
                <span style={{ color: '#f1f5f9', fontWeight: 500 }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 8, padding: '8px 12px', marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: '#fbbf24' }}>
            ⚠️ Return by <strong>{dueDate.toLocaleDateString()}</strong> to avoid late fines.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '10px', background: '#293548', border: 'none', borderRadius: 8, color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={{ flex: 1, padding: '10px', background: loading ? '#4338ca' : '#6366f1', border: 'none', borderRadius: 8, color: 'white', fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Borrowing…' : '📨 Submit Request'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BookDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { user, loading: authLoading } = useAuth();
  const [book, setBook]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [borrowing, setBorrowing] = useState(false);
  const [saved, setSaved]         = useState(false);
  const [review, setReview]       = useState({ rating: 5, content: '' });

  useEffect(() => { if (!authLoading && !user) router.push('/login'); }, [user, authLoading]);

  useEffect(() => {
    if (!id) return;
    api.get(`/books/${id}`)
      .then(r => {
        setBook(r.data);
        setSaved(checkSaved(id));
      })
      .catch(() => router.push('/books'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = () => {
    if (!book) return;
    const nowSaved = toggleSaveBook(book);
    setSaved(nowSaved);
    toast.success(nowSaved ? '⭐ Saved to your list!' : 'Removed from saved books');
  };

  const confirmBorrow = async () => {
    setBorrowing(true);
    try {
      await api.post('/requests', { book_id: id, type: 'BORROW' });
      toast.success('📨 Borrow request submitted! Visit library once approved.');
      setBook(b => ({ ...b, available_copies: parseInt(b.available_copies) - 1 }));
      setShowModal(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not borrow book');
    } finally {
      setBorrowing(false);
    }
  };

  const reserve = async () => {
    try {
      await api.post('/reserve', { book_id: id });
      toast.success('📅 Reserved! You will be notified when available.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not reserve');
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/reviews', { book_id: id, ...review });
      toast.success('⭐ Review submitted!');
      setBook(b => ({ ...b, reviews: [{ ...data, user_name: user.name }, ...(b.reviews || [])] }));
      setReview({ rating: 5, content: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not submit review');
    }
  };

  if (authLoading || !user || loading) {
    return (
      <Layout>
        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 20, marginBottom: 24 }}>
          <div className="skeleton" style={{ height: 108, borderRadius: 10 }} />
          <div>
            <div className="skeleton" style={{ height: 22, width: '60%', marginBottom: 8, borderRadius: 6 }} />
            <div className="skeleton" style={{ height: 14, width: '40%', borderRadius: 6 }} />
          </div>
        </div>
      </Layout>
    );
  }

  const available = parseInt(book?.available_copies) > 0;
  const avgStars  = Math.round(parseFloat(book?.avg_rating || 0));

  return (
    <>
      <Head><title>{book?.title} — LibraryOS</title></Head>
      <Layout>
        <div className="page-enter">
          {showModal && (
            <ConfirmModal
              book={book}
              onConfirm={confirmBorrow}
              onCancel={() => setShowModal(false)}
              loading={borrowing}
            />
          )}

          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16, cursor: 'pointer' }}
            onClick={() => router.push('/books')}>← Back to catalog</div>

          {/* Book header */}
          <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
            <div style={{ width: 80, height: 108, borderRadius: 10, flexShrink: 0, background: 'linear-gradient(135deg,#312e81,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>📚</div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.4px', marginBottom: 4 }}>{book?.title}</h1>
              <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12 }}>{book?.author}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>{book?.category}</span>
                {book?.published_year && <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, background: '#293548', color: '#94a3b8' }}>📅 {book.published_year}</span>}
                {book?.pages && <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, background: '#293548', color: '#94a3b8' }}>📄 {book.pages} pages</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#fbbf24' }}>{'★'.repeat(avgStars)}{'☆'.repeat(5 - avgStars)}</span>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>{book?.avg_rating} · {book?.review_count} reviews</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            <button
              onClick={() => available && setShowModal(true)}
              disabled={!available}
              style={{
                flex: 1, padding: '10px',
                background: available ? '#6366f1' : '#293548',
                border: 'none', borderRadius: 10,
                color: available ? 'white' : '#64748b',
                fontSize: 13, fontWeight: 600,
                cursor: available ? 'pointer' : 'not-allowed',
              }}>
              {available ? '📨 Request to Borrow' : '📖 Unavailable'}
            </button>
            {!available && (
              <button onClick={reserve} style={{ padding: '10px 16px', background: '#1e293b', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 10, color: '#f1f5f9', fontSize: 13, cursor: 'pointer' }}>
                📅 Reserve
              </button>
            )}
            {/* Save button */}
            <button
              onClick={handleSave}
              title={saved ? 'Remove from saved' : 'Save for later'}
              style={{
                padding: '10px 16px',
                background: saved ? 'rgba(251,191,36,0.15)' : '#1e293b',
                border: saved ? '1px solid rgba(251,191,36,0.4)' : '1px solid rgba(148,163,184,0.2)',
                borderRadius: 10,
                color: saved ? '#fbbf24' : '#94a3b8',
                fontSize: 16, cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { if (!saved) { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.4)'; e.currentTarget.style.color = '#fbbf24'; } }}
              onMouseLeave={e => { if (!saved) { e.currentTarget.style.borderColor = 'rgba(148,163,184,0.2)'; e.currentTarget.style.color = '#94a3b8'; } }}>
              {saved ? '⭐' : '☆'}
            </button>
          </div>

          {/* Availability */}
          <div style={{ background: '#1e293b', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 14, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Availability</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                ['Total copies', book?.total_copies, null],
                ['Available',    book?.available_copies, available ? '#34d399' : '#fb7185'],
                ['Shelf',        book?.shelf_location || 'TBD', null],
                ['ISBN',         book?.isbn, null],
              ].map(([label, val, color]) => (
                <div key={label} style={{ background: '#293548', borderRadius: 8, padding: '8px 12px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>{label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: color || '#f1f5f9' }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          {book?.description && (
            <div style={{ background: '#1e293b', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 14, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>About this book</div>
              <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.7 }}>{book.description}</p>
            </div>
          )}

          {/* Reviews */}
          <div style={{ background: '#1e293b', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
              Reviews ({book?.reviews?.length || 0})
            </div>
            <form onSubmit={submitReview} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                {[1,2,3,4,5].map(s => (
                  <span key={s} onClick={() => setReview(r => ({ ...r, rating: s }))}
                    style={{ cursor: 'pointer', fontSize: 20, color: s <= review.rating ? '#fbbf24' : '#293548' }}>★</span>
                ))}
              </div>
              <textarea
                value={review.content}
                onChange={e => setReview(r => ({ ...r, content: e.target.value }))}
                placeholder="Share your thoughts about this book..."
                style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#f1f5f9', outline: 'none', resize: 'vertical', minHeight: 72, marginBottom: 8, boxSizing: 'border-box' }}
              />
              <button type="submit" style={{ padding: '7px 16px', background: '#6366f1', border: 'none', borderRadius: 8, color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                Post review
              </button>
            </form>
            {book?.reviews?.map(r => (
              <div key={r.id} style={{ paddingBottom: 14, marginBottom: 14, borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>
                    {r.user_name?.slice(0,2).toUpperCase()}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{r.user_name}</span>
                  <span style={{ color: '#fbbf24', fontSize: 11 }}>{'★'.repeat(r.rating)}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: '#64748b' }}>{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>{r.content}</p>
              </div>
            ))}
          </div>
        </div>
      </Layout>
      <Chatbot />
    </>
  );
}
