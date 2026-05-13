import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../components/layout/Layout';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/api';
import toast from 'react-hot-toast';

const COVER_GRADIENTS = [
  'linear-gradient(135deg,#312e81,#4f46e5)',
  'linear-gradient(135deg,#134e4a,#0f766e)',
  'linear-gradient(135deg,#7c2d12,#c2410c)',
  'linear-gradient(135deg,#1e1b4b,#6d28d9)',
  'linear-gradient(135deg,#064e3b,#047857)',
  'linear-gradient(135deg,#1a1a2e,#16213e)',
  'linear-gradient(135deg,#4a1942,#9d174d)',
  'linear-gradient(135deg,#1e3a5f,#1d4ed8)',
];

const COVER_EMOJIS = {
  'Computer Science': '💻',
  'Artificial Intelligence': '🧠',
  'Data Science': '📊',
  'Mathematics': '📐',
  'Physics': '⚛️',
  'Fiction': '📖',
  'History': '🏛️',
  'default': '📚',
};

const SAVED_KEY = 'libraryos_saved_books';

function getSaved() {
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY) || '[]');
  } catch { return []; }
}

function setSaved(books) {
  localStorage.setItem(SAVED_KEY, JSON.stringify(books));
}

export function isSaved(bookId) {
  return getSaved().some(b => b.id === bookId);
}

export function toggleSave(book) {
  const saved = getSaved();
  const exists = saved.some(b => b.id === book.id);
  if (exists) {
    setSaved(saved.filter(b => b.id !== book.id));
    return false;
  } else {
    setSaved([{ ...book, saved_at: new Date().toISOString() }, ...saved]);
    return true;
  }
}

export default function SavedBooks() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [saved, setSavedState]  = useState([]);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('All');
  const [borrowing, setBorrowing] = useState(null);

  useEffect(() => { if (!authLoading && !user) router.push('/login'); }, [user, authLoading]);

  useEffect(() => {
    setSavedState(getSaved());
  }, []);

  const removeBook = (bookId, title) => {
    const updated = getSaved().filter(b => b.id !== bookId);
    setSaved(updated);
    setSavedState(updated);
    toast.success(`Removed "${title}" from saved books`);
  };

  const clearAll = () => {
    if (!confirm('Remove all saved books?')) return;
    setSaved([]);
    setSavedState([]);
    toast.success('Saved books cleared');
  };

  const borrowBook = async (book) => {
    setBorrowing(book.id);
    try {
      await api.post('/borrow', { book_id: book.id });
      toast.success(`📚 "${book.title}" borrowed! Due in 14 days.`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not borrow');
    } finally {
      setBorrowing(null);
    }
  };

  const categories = ['All', ...new Set(saved.map(b => b.category).filter(Boolean))];

  const filtered = saved.filter(b => {
    const matchSearch = b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || b.category === filter;
    return matchSearch && matchFilter;
  });

  if (authLoading || !user) return null;

  return (
    <>
      <Head><title>Saved Books — LibraryOS</title></Head>
      <Layout>
        <div className="page-enter">
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Home / Saved Books</div>
              <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px' }}>Saved Books</h1>
              <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>
                {saved.length} book{saved.length !== 1 ? 's' : ''} saved
              </p>
            </div>
            {saved.length > 0 && (
              <button
                onClick={clearAll}
                style={{
                  padding: '8px 14px', background: 'transparent',
                  border: '1px solid rgba(251,113,133,0.25)',
                  borderRadius: 8, color: '#94a3b8',
                  fontSize: 12, cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#fb7185'; e.currentTarget.style.borderColor = 'rgba(251,113,133,0.5)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = 'rgba(251,113,133,0.25)'; }}>
                Clear all
              </button>
            )}
          </div>

          {saved.length === 0 ? (
            /* Empty state */
            <div style={{
              background: '#1e293b', border: '1px solid rgba(148,163,184,0.12)',
              borderRadius: 20, padding: '60px 40px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>⭐</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No saved books yet</div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 24, lineHeight: 1.7 }}>
                Save books you want to read later by clicking the ⭐ button on any book page.
              </div>
              <button
                onClick={() => router.push('/books')}
                style={{
                  padding: '10px 24px', background: '#6366f1',
                  border: 'none', borderRadius: 10,
                  color: 'white', fontSize: 13,
                  fontWeight: 600, cursor: 'pointer',
                }}>
                Browse catalog
              </button>
            </div>
          ) : (
            <>
              {/* Search bar */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: '#1e293b', border: '1px solid rgba(148,163,184,0.15)',
                borderRadius: 10, padding: '9px 14px', marginBottom: 12,
              }}>
                <span style={{ color: '#64748b' }}>🔍</span>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search saved books..."
                  style={{
                    background: 'none', border: 'none',
                    color: '#f1f5f9', fontSize: 13,
                    flex: 1, outline: 'none',
                  }}
                />
                {search && (
                  <button onClick={() => setSearch('')}
                    style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>✕</button>
                )}
              </div>

              {/* Category filters */}
              {categories.length > 1 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
                  {categories.map(cat => (
                    <button key={cat} onClick={() => setFilter(cat)} style={{
                      padding: '4px 12px', borderRadius: 100, fontSize: 11,
                      fontWeight: 500, cursor: 'pointer', border: 'none',
                      background: filter === cat ? '#6366f1' : '#1e293b',
                      color: filter === cat ? 'white' : '#94a3b8',
                      transition: 'all 0.15s',
                    }}>{cat}</button>
                  ))}
                </div>
              )}

              {/* No results */}
              {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
                  <div style={{ fontSize: 14 }}>No books match your search</div>
                </div>
              )}

              {/* Book grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))',
                gap: 14,
              }}>
                {filtered.map(book => {
                  const gradient = COVER_GRADIENTS[book.isbn?.charCodeAt(0) % COVER_GRADIENTS.length] || COVER_GRADIENTS[0];
                  const emoji = COVER_EMOJIS[book.category] || COVER_EMOJIS.default;
                  const available = parseInt(book.available_copies) > 0;
                  const stars = Math.round(parseFloat(book.avg_rating || 0));
                  const savedDate = new Date(book.saved_at).toLocaleDateString('default', { month: 'short', day: 'numeric' });

                  return (
                    <div key={book.id} style={{
                      background: '#1e293b',
                      border: '1px solid rgba(148,163,184,0.12)',
                      borderRadius: 16, overflow: 'hidden',
                      transition: 'all 0.2s', display: 'flex', flexDirection: 'column',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(148,163,184,0.25)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(148,163,184,0.12)'; e.currentTarget.style.transform = 'translateY(0)'; }}>

                      {/* Cover */}
                      <div
                        onClick={() => router.push(`/books/${book.id}`)}
                        style={{
                          height: 100, background: gradient, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 30, position: 'relative',
                        }}>
                        {emoji}
                        {/* Availability badge */}
                        <span style={{
                          position: 'absolute', top: 8, right: 8,
                          fontSize: 10, fontWeight: 700,
                          padding: '2px 8px', borderRadius: 100,
                          background: available ? 'rgba(52,211,153,0.2)' : 'rgba(251,113,133,0.2)',
                          color: available ? '#34d399' : '#fb7185',
                        }}>
                          {available ? 'Available' : 'Unavailable'}
                        </span>
                        {/* Saved date */}
                        <span style={{
                          position: 'absolute', bottom: 8, left: 8,
                          fontSize: 9, color: 'rgba(255,255,255,0.6)',
                          background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: 4,
                        }}>
                          Saved {savedDate}
                        </span>
                      </div>

                      {/* Info */}
                      <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div
                          onClick={() => router.push(`/books/${book.id}`)}
                          style={{ fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {book.title}
                        </div>
                        <div style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {book.author}
                        </div>
                        {stars > 0 && (
                          <div style={{ color: '#fbbf24', fontSize: 11 }}>
                            {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
                            <span style={{ color: '#64748b', marginLeft: 4 }}>{book.avg_rating}</span>
                          </div>
                        )}
                        <span style={{
                          fontSize: 10, padding: '2px 8px', borderRadius: 6,
                          background: '#293548', color: '#94a3b8',
                          alignSelf: 'flex-start',
                        }}>{book.category}</span>
                      </div>

                      {/* Actions */}
                      <div style={{ padding: '0 14px 14px', display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => borrowBook(book)}
                          disabled={!available || borrowing === book.id}
                          style={{
                            flex: 1, padding: '7px 8px',
                            background: available ? '#6366f1' : '#293548',
                            border: 'none', borderRadius: 8,
                            color: available ? 'white' : '#64748b',
                            fontSize: 11, fontWeight: 600,
                            cursor: available && borrowing !== book.id ? 'pointer' : 'not-allowed',
                            transition: 'all 0.15s',
                          }}>
                          {borrowing === book.id ? '…' : available ? 'Borrow' : 'Unavailable'}
                        </button>
                        <button
                          onClick={() => removeBook(book.id, book.title)}
                          title="Remove from saved"
                          style={{
                            width: 32, height: 32, borderRadius: 8,
                            background: 'rgba(251,113,133,0.1)',
                            border: '1px solid rgba(251,113,133,0.2)',
                            color: '#fb7185', fontSize: 14,
                            cursor: 'pointer', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.15s', flexShrink: 0,
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(251,113,133,0.2)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(251,113,133,0.1)'}>
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </Layout>
    </>
  );
}
