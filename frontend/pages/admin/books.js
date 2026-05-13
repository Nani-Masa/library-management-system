import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function AdminBooks() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [books, setBooks]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    isbn: '', title: '', author: '', category: '',
    description: '', total_copies: 1, shelf_location: '', published_year: '', pages: ''
  });

  useEffect(() => {
    if (!authLoading && (!user || (user.role !== 'admin' && user.role !== 'librarian'))) {
      router.push('/dashboard');
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!user) return;
    api.get('/books?limit=50').then(r => setBooks(r.data.books || [])).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/books', {
        ...form,
        total_copies: parseInt(form.total_copies),
        published_year: form.published_year ? parseInt(form.published_year) : null,
        pages: form.pages ? parseInt(form.pages) : null,
      });
      toast.success('Book added successfully!');
      setBooks(prev => [data, ...prev]);
      setShowForm(false);
      setForm({ isbn: '', title: '', author: '', category: '', description: '', total_copies: 1, shelf_location: '', published_year: '', pages: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add book');
    }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete "${title}"?`)) return;
    try {
      await api.delete(`/books/${id}`);
      toast.success('Book deleted');
      setBooks(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  const filtered = books.filter(b =>
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    b.author.toLowerCase().includes(search.toLowerCase())
  );

  const inputStyle = {
    width: '100%', background: '#0f172a',
    border: '1px solid rgba(148,163,184,0.2)',
    borderRadius: 8, padding: '8px 12px',
    fontSize: 13, color: '#f1f5f9', outline: 'none'
  };

  if (authLoading || !user) return null;

  return (
    <>
      <Head><title>Manage Books — LibraryOS Admin</title></Head>
      <Layout>
        <div className="page-enter">
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Admin / Books</div>
              <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px' }}>Manage Books</h1>
              <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>{books.length} books in catalog</p>
            </div>
            <button
              onClick={() => setShowForm(s => !s)}
              style={{
                padding: '9px 18px', background: showForm ? '#293548' : '#6366f1',
                border: 'none', borderRadius: 10, color: 'white',
                fontSize: 13, fontWeight: 600, cursor: 'pointer'
              }}>
              {showForm ? 'Cancel' : '+ Add Book'}
            </button>
          </div>

          {/* Add Book Form */}
          {showForm && (
            <div style={{
              background: '#1e293b', border: '1px solid rgba(148,163,184,0.15)',
              borderRadius: 16, padding: 20, marginBottom: 24
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Add New Book</div>
              <form onSubmit={handleAdd}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  {[
                    ['ISBN *', 'isbn', 'text', '9780134685991'],
                    ['Title *', 'title', 'text', 'Effective Java'],
                    ['Author *', 'author', 'text', 'Joshua Bloch'],
                    ['Category *', 'category', 'text', 'Computer Science'],
                    ['Shelf Location', 'shelf_location', 'text', 'A-01'],
                    ['Total Copies', 'total_copies', 'number', '1'],
                    ['Published Year', 'published_year', 'number', '2023'],
                    ['Pages', 'pages', 'number', '400'],
                  ].map(([label, name, type, placeholder]) => (
                    <div key={name}>
                      <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>{label}</label>
                      <input
                        type={type}
                        placeholder={placeholder}
                        value={form[name]}
                        onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
                        required={['isbn','title','author','category'].includes(name)}
                        style={inputStyle}
                      />
                    </div>
                  ))}
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Description</label>
                  <textarea
                    placeholder="Brief description of the book..."
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }}
                  />
                </div>
                <button type="submit" style={{
                  padding: '9px 20px', background: '#6366f1', border: 'none',
                  borderRadius: 8, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer'
                }}>
                  Add Book
                </button>
              </form>
            </div>
          )}

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
              placeholder="Search books..."
              style={{ background: 'none', border: 'none', color: '#f1f5f9', fontSize: 13, flex: 1, outline: 'none' }}
            />
          </div>

          {/* Books Table */}
          {loading ? (
            <div style={{ background: '#1e293b', borderRadius: 16, padding: 20 }}>
              {[1,2,3,4,5].map(i => (
                <div key={i} className="skeleton" style={{ height: 44, borderRadius: 8, marginBottom: 8 }} />
              ))}
            </div>
          ) : (
            <div style={{ background: '#1e293b', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 16, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
                    {['Title', 'Author', 'Category', 'Copies', 'Shelf', 'Actions'].map(h => (
                      <th key={h} style={{
                        textAlign: 'left', fontSize: 10, fontWeight: 600,
                        color: '#64748b', textTransform: 'uppercase',
                        letterSpacing: '0.06em', padding: '12px 16px'
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((book, i) => (
                    <tr key={book.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(148,163,184,0.06)' : 'none' }}>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500, maxWidth: 200 }}>
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{book.title}</div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: '#94a3b8' }}>{book.author}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          fontSize: 10, padding: '2px 8px', borderRadius: 6,
                          background: 'rgba(99,102,241,0.15)', color: '#818cf8'
                        }}>{book.category}</span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12 }}>
                        <span style={{ color: parseInt(book.available_copies) > 0 ? '#34d399' : '#fb7185', fontWeight: 600 }}>
                          {book.available_copies}
                        </span>
                        <span style={{ color: '#64748b' }}> / {book.total_copies}</span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: '#94a3b8' }}>{book.shelf_location || '—'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <button
                          onClick={() => handleDelete(book.id, book.title)}
                          style={{
                            padding: '4px 10px', background: 'rgba(251,113,133,0.1)',
                            border: '1px solid rgba(251,113,133,0.3)',
                            borderRadius: 6, color: '#fb7185',
                            fontSize: 11, cursor: 'pointer'
                          }}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                        No books found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}
