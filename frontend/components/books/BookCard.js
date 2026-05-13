import { useRouter } from 'next/router';

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

export default function BookCard({ book }) {
  const router = useRouter();
  const gradient = COVER_GRADIENTS[book.isbn?.charCodeAt(0) % COVER_GRADIENTS.length] || COVER_GRADIENTS[0];
  const emoji = COVER_EMOJIS[book.category] || COVER_EMOJIS.default;
  const available = parseInt(book.available_copies) > 0;
  const lowStock = parseInt(book.available_copies) === 1;
  const stars = Math.round(parseFloat(book.avg_rating || 0));

  return (
    <div
      onClick={() => router.push(`/books/${book.id}`)}
      style={{
        background: '#1e293b',
        border: '1px solid rgba(148,163,184,0.12)',
        borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
        transition: 'all 0.2s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(148,163,184,0.25)';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.3)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(148,163,184,0.12)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}>
      {/* Cover */}
      <div style={{ height: 90, background: gradient, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 28, position: 'relative' }}>
        {emoji}
        <span style={{
          position: 'absolute', top: 8, right: 8,
          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100,
          background: available
            ? (lowStock ? 'rgba(251,191,36,0.2)' : 'rgba(52,211,153,0.2)')
            : 'rgba(251,113,133,0.2)',
          color: available
            ? (lowStock ? '#fbbf24' : '#34d399')
            : '#fb7185',
        }}>
          {available ? (lowStock ? '1 left' : 'Available') : 'Unavailable'}
        </span>
      </div>
      {/* Info */}
      <div style={{ padding: '12px 14px' }}>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {book.title}
        </div>
        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {book.author}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: '#fbbf24', fontSize: 10, letterSpacing: 1 }}>
            {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
          </span>
          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6,
            background: '#293548', color: '#94a3b8' }}>
            {book.category}
          </span>
        </div>
      </div>
    </div>
  );
}
