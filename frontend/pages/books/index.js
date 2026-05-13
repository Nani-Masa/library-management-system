import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import BookCard from '../../components/books/BookCard';
import Chatbot from '../../components/dashboard/Chatbot';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/api';

const CATEGORIES = ['All', 'Computer Science', 'Artificial Intelligence', 'Data Science', 'Mathematics', 'Physics', 'History', 'Fiction'];

export default function Books() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [books, setBooks]     = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [pages, setPages]     = useState(1);
  const [search, setSearch]   = useState('');
  const [category, setCategory] = useState('All');
  const [available, setAvail] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading]);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 18 });
      if (search) params.append('search', search);
      if (category !== 'All') params.append('category', category);
      if (available) params.append('available', 'true');
      const { data } = await api.get(`/books?${params}`);
      setBooks(data.books);
      setTotal(data.total);
      setPages(data.pages);
    } catch {}
    finally { setLoading(false); }
  }, [page, search, category, available]);

  useEffect(() => {
    if (user) fetchBooks();
  }, [user, fetchBooks]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  if (authLoading || !user) return null;

  return (
    <>
      <Head><title>Book Catalog — LibraryOS</title></Head>
      <Layout>
        <div className="page-enter">
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px' }}>Book Catalog</h1>
            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>{total.toLocaleString()} books available</p>
          </div>

          {/* Search bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#293548',
            border: '1px solid rgba(148,163,184,0.15)', borderRadius: 10, padding: '9px 14px', marginBottom: 14 }}>
            <span style={{ color: '#64748b' }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title, author, or ISBN..."
              style={{ background: 'none', border: 'none', color: '#f1f5f9', fontSize: 13, flex: 1, outline: 'none' }}
            />
            {search && <button onClick={() => setSearch('')} style={{ background:'none',border:'none',color:'#64748b',cursor:'pointer' }}>✕</button>}
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14, alignItems: 'center' }}>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => { setCategory(c); setPage(1); }}
                style={{
                  padding: '5px 12px', borderRadius: 100, fontSize: 11, fontWeight: 500, cursor: 'pointer',
                  border: category === c ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(148,163,184,0.15)',
                  background: category === c ? 'rgba(99,102,241,0.15)' : 'transparent',
                  color: category === c ? '#818cf8' : '#94a3b8', transition: 'all 0.15s',
                }}>
                {c}
              </button>
            ))}
            <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11,
              color: available ? '#34d399' : '#94a3b8', cursor: 'pointer', marginLeft: 4 }}>
              <input type="checkbox" checked={available} onChange={e => { setAvail(e.target.checked); setPage(1); }} />
              Available now
            </label>
          </div>

          {/* Grid */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12 }}>
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 170, borderRadius: 16 }} />
              ))}
            </div>
          ) : books.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12 }}>
              {books.map(b => <BookCard key={b.id} book={b} />)}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>No books found</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Try adjusting your search or filters</div>
            </div>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 32 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="btn-secondary" style={{ opacity: page === 1 ? 0.4 : 1 }}>← Prev</button>
              <span style={{ padding: '8px 16px', fontSize: 13, color: '#94a3b8' }}>{page} / {pages}</span>
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                className="btn-secondary" style={{ opacity: page === pages ? 0.4 : 1 }}>Next →</button>
            </div>
          )}
        </div>
      </Layout>
      <Chatbot />
    </>
  );
}
