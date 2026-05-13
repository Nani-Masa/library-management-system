import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../components/layout/Layout';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/api';
import toast from 'react-hot-toast';

const CONDITIONS = ['EXCELLENT', 'GOOD', 'FAIR', 'POOR'];
const CONDITION_COLOR = { EXCELLENT: '#34d399', GOOD: '#818cf8', FAIR: '#fbbf24', POOR: '#fb7185' };

export default function Marketplace() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]       = useState({ title: '', author: '', isbn: '', condition: 'GOOD', description: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (!authLoading && !user) router.push('/login'); }, [user, authLoading]);
  useEffect(() => {
    api.get('/marketplace').then(r => setItems(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const donate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await api.post('/marketplace', form);
      toast.success('📦 Book listed for donation!');
      setItems(prev => [{ ...data, donor_name: user.name }, ...prev]);
      setForm({ title: '', author: '', isbn: '', condition: 'GOOD', description: '' });
      setShowForm(false);
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const claim = async (id, title) => {
    try {
      await api.put(`/marketplace/${id}/claim`);
      toast.success(`✅ "${title}" claimed!`);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (err) { toast.error(err.response?.data?.error || 'Already claimed'); }
  };

  if (authLoading || !user) return null;

  return (
    <>
      <Head><title>Book Marketplace — LibraryOS</title></Head>
      <Layout>
        <div className="page-enter">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px' }}>Book Marketplace</h1>
              <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>Donate and exchange books with fellow students</p>
            </div>
            <button className="btn-primary" onClick={() => setShowForm(s => !s)}>
              {showForm ? 'Cancel' : '+ Donate a book'}
            </button>
          </div>

          {/* Donate form */}
          {showForm && (
            <div className="card" style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>List a book for donation</div>
              <form onSubmit={donate}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Book title *</label>
                    <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="e.g. Clean Code" />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Author *</label>
                    <input className="input" value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} required placeholder="e.g. Robert C. Martin" />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>ISBN (optional)</label>
                    <input className="input" value={form.isbn} onChange={e => setForm(f => ({ ...f, isbn: e.target.value }))} placeholder="e.g. 9780132350884" />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Condition *</label>
                    <select className="input" value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))}>
                      {CONDITIONS.map(c => <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Description (optional)</label>
                  <textarea className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Any notes about the book condition..." style={{ resize: 'vertical', minHeight: 60 }} />
                </div>
                <button type="submit" className="btn-primary" disabled={submitting} style={{ opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? 'Listing…' : '📦 List for donation'}
                </button>
              </form>
            </div>
          )}

          {/* Listings */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 140, borderRadius: 16 }} />)}
            </div>
          ) : items.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🎁</div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>No books listed yet</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Be the first to donate a book!</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
              {items.map(item => (
                <div key={item.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ width: 40, height: 54, borderRadius: 6, background: 'linear-gradient(135deg,#134e4a,#0f766e)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>📗</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{item.author}</div>
                      <div style={{ marginTop: 4, display: 'flex', gap: 5 }}>
                        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 6,
                          background: `rgba(0,0,0,0.2)`, color: CONDITION_COLOR[item.condition] || '#94a3b8', fontWeight: 600 }}>
                          {item.condition}
                        </span>
                      </div>
                    </div>
                  </div>
                  {item.description && (
                    <p style={{ fontSize: 11, color: '#64748b', margin: 0, lineHeight: 1.6 }}>{item.description}</p>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                    <span style={{ fontSize: 11, color: '#64748b' }}>From {item.donor_name}</span>
                    {item.donor_id !== user.id && (
                      <button onClick={() => claim(item.id, item.title)}
                        style={{ padding: '5px 12px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
                          borderRadius: 7, color: '#818cf8', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                        Claim
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}
