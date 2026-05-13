import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../components/layout/Layout';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/api';
import toast from 'react-hot-toast';

const TIME_SLOTS = [
  '09:00–11:00','11:00–13:00','13:00–15:00',
  '15:00–17:00','17:00–19:00','19:00–21:00',
];
const ROOMS = ['Room 1','Room 2','Room 3','Room 4','Room 5'];

// ─────────────────────────────────────────────
// STUDENT VIEW — Book a room
// ─────────────────────────────────────────────
function StudentView({ user }) {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedRoom, setSelectedRoom] = useState('Room 1');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [myBookings, setMyBookings]     = useState([]);
  const [booking, setBooking]           = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/study-rooms/availability?date=${selectedDate}`),
      api.get('/study-rooms/my'),
    ]).then(([a, m]) => { setAvailability(a.data); setMyBookings(m.data); }).catch(() => {});
  }, [selectedDate]);

  const isBooked = (room, slot) => {
    const roomData = availability.find(r => r.room === room);
    if (!roomData) return false;
    const [s] = slot.split('–');
    return roomData.bookings.some(b => b.start_time === s);
  };

  const handleBook = async () => {
    if (!selectedSlot) { toast.error('Please select a time slot'); return; }
    const [start, end] = selectedSlot.split('–');
    setBooking(true);
    try {
      await api.post('/study-rooms', { room_number: selectedRoom, date: selectedDate, start_time: start, end_time: end });
      toast.success(`✅ ${selectedRoom} booked for ${selectedSlot}`);
      setSelectedSlot(null);
      const [a, m] = await Promise.all([
        api.get(`/study-rooms/availability?date=${selectedDate}`),
        api.get('/study-rooms/my'),
      ]);
      setAvailability(a.data); setMyBookings(m.data);
    } catch (err) { toast.error(err.response?.data?.error || 'Booking failed'); }
    finally { setBooking(false); }
  };

  const today = new Date();
  const calYear = today.getFullYear();
  const calMonth = today.getMonth();
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const blanks = firstDay === 0 ? 6 : firstDay - 1;
  const monthName = today.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      {/* Calendar */}
      <div>
        <div style={{ background: '#1e293b', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 16, padding: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 12 }}>{monthName}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3, marginBottom: 4 }}>
            {['Mo','Tu','We','Th','Fr','Sa','Su'].map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, color: '#64748b', paddingBottom: 4 }}>{d}</div>
            ))}
            {Array.from({ length: blanks }, (_, i) => <div key={`b${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const dateStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
              const isToday = day === today.getDate();
              const isSelected = dateStr === selectedDate;
              const isPast = new Date(dateStr) < new Date(today.toISOString().split('T')[0]);
              return (
                <div key={day} onClick={() => !isPast && setSelectedDate(dateStr)} style={{
                  aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 8, fontSize: 12, cursor: isPast ? 'not-allowed' : 'pointer',
                  fontWeight: isToday ? 700 : 400,
                  background: isSelected ? '#6366f1' : isToday ? 'rgba(99,102,241,0.2)' : 'transparent',
                  color: isSelected ? '#fff' : isPast ? '#293548' : '#94a3b8',
                  border: isToday && !isSelected ? '1px solid rgba(99,102,241,0.4)' : '1px solid transparent',
                  transition: 'all 0.15s',
                }}>{day}</div>
              );
            })}
          </div>
        </div>

        {/* Room selector */}
        <div style={{ background: '#1e293b', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 16, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 10 }}>Select room</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {ROOMS.map(room => {
              const roomData = availability.find(r => r.room === room);
              const booked = roomData?.bookings.length || 0;
              return (
                <div key={room} onClick={() => setSelectedRoom(room)} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                  borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
                  background: selectedRoom === room ? 'rgba(99,102,241,0.15)' : '#293548',
                  border: selectedRoom === room ? '1px solid rgba(99,102,241,0.4)' : '1px solid transparent',
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: booked >= 3 ? '#fb7185' : booked > 0 ? '#fbbf24' : '#34d399' }} />
                  <span style={{ fontSize: 12, fontWeight: 500 }}>{room}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 10, color: '#64748b' }}>Cap. 4</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Slots + confirm */}
      <div>
        <div style={{ background: '#1e293b', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 16, padding: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 10 }}>
            {selectedRoom} · {new Date(selectedDate + 'T00:00:00').toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {TIME_SLOTS.map(slot => {
              const taken = isBooked(selectedRoom, slot);
              const selected = selectedSlot === slot;
              return (
                <div key={slot} onClick={() => !taken && setSelectedSlot(slot)} style={{
                  padding: '9px 12px', borderRadius: 8, textAlign: 'center',
                  fontSize: 12, cursor: taken ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
                  opacity: taken ? 0.45 : 1,
                  background: selected ? 'rgba(99,102,241,0.15)' : taken ? '#293548' : 'transparent',
                  border: selected ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(148,163,184,0.15)',
                  color: selected ? '#818cf8' : taken ? '#64748b' : '#94a3b8',
                  textDecoration: taken ? 'line-through' : 'none',
                }}>
                  {slot}
                  {taken && <div style={{ fontSize: 9, marginTop: 2 }}>Booked</div>}
                </div>
              );
            })}
          </div>
        </div>

        {selectedSlot && (
          <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 12, padding: 16, marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{selectedRoom} · {selectedSlot}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 14 }}>
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString()} · Capacity: 4 people
            </div>
            <button onClick={handleBook} disabled={booking} style={{
              width: '100%', padding: '10px', background: booking ? '#4338ca' : '#6366f1',
              border: 'none', borderRadius: 8, color: 'white',
              fontSize: 13, fontWeight: 600, cursor: booking ? 'not-allowed' : 'pointer',
            }}>
              {booking ? 'Booking…' : '✓ Confirm booking'}
            </button>
          </div>
        )}

        {myBookings.length > 0 && (
          <div style={{ background: '#1e293b', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 16, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 10 }}>My upcoming bookings</div>
            {myBookings.slice(0,4).map((b, i) => (
              <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < 3 ? '1px solid rgba(148,163,184,0.08)' : 'none' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{b.room_number}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8' }}>{new Date(b.date).toLocaleDateString()} · {b.start_time}–{b.end_time}</div>
                </div>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 100, background: 'rgba(52,211,153,0.15)', color: '#34d399' }}>Confirmed</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ADMIN / LIBRARIAN VIEW — Manage bookings
// ─────────────────────────────────────────────
function AdminView() {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [availability, setAvailability] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [notifyModal, setNotifyModal]   = useState(null);
  const [notifMsg, setNotifMsg]         = useState('');
  const [notifType, setNotifType]       = useState('available');
  const [sending, setSending]           = useState(false);
  const [sentNotifs, setSentNotifs]     = useState({});

  useEffect(() => {
    api.get(`/study-rooms/availability?date=${selectedDate}`)
      .then(r => setAvailability(r.data))
      .catch(() => {});
  }, [selectedDate]);

  const today = new Date();
  const calYear = today.getFullYear();
  const calMonth = today.getMonth();
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const blanks = firstDay === 0 ? 6 : firstDay - 1;

  const totalBookings = availability.reduce((sum, r) => sum + r.bookings.length, 0);
  const totalStudents = availability.reduce((sum, r) => sum + r.bookings.length, 0);
  const filledRooms   = availability.filter(r => r.bookings.length >= 3).length;
  const freeRooms     = availability.filter(r => r.bookings.length === 0).length;

  const NOTIF_TYPES = [
    { value: 'available',  label: '✅ Room Available',       color: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.3)' },
    { value: 'filled',     label: '🚫 Room Filled',          color: '#fb7185', bg: 'rgba(251,113,133,0.1)', border: 'rgba(251,113,133,0.3)' },
    { value: 'next_shift', label: '⏰ Available Next Shift',  color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.3)' },
    { value: 'custom',     label: '✏️ Custom Message',        color: '#818cf8', bg: 'rgba(99,102,241,0.1)',  border: 'rgba(99,102,241,0.3)' },
  ];

  const DEFAULT_MSGS = {
    available:  (room, slot) => `✅ Good news! ${room} is now available for booking during ${slot}.`,
    filled:     (room, slot) => `🚫 ${room} is fully booked for ${slot}. Please choose another room or time.`,
    next_shift: (room, slot) => `⏰ ${room} is currently occupied during ${slot}, but will be available in the next shift. Please check back soon.`,
    custom:     () => '',
  };

  const openNotify = (booking, room) => {
    const slot = `${booking.start_time}–${booking.end_time}`;
    setNotifyModal({ booking, room });
    setNotifType('available');
    setNotifMsg(DEFAULT_MSGS['available'](room, slot));
  };

  const handleNotifTypeChange = (type) => {
    setNotifType(type);
    if (notifyModal) {
      const slot = `${notifyModal.booking.start_time}–${notifyModal.booking.end_time}`;
      setNotifMsg(DEFAULT_MSGS[type](notifyModal.room, slot));
    }
  };

  const sendNotification = async () => {
    if (!notifMsg.trim()) { toast.error('Please enter a message'); return; }
    setSending(true);
    await new Promise(r => setTimeout(r, 900));
    const key = `${notifyModal.booking.id}`;
    setSentNotifs(prev => ({ ...prev, [key]: { type: notifType, msg: notifMsg, time: new Date().toLocaleTimeString() } }));
    toast.success(`📨 Notification sent to ${notifyModal.booking.user_name || 'student'}!`);
    setNotifyModal(null);
    setNotifMsg('');
    setSending(false);
  };

  const getStatusBadge = (bookings) => {
    const count = bookings.length;
    if (count === 0)  return { label: 'Free',    color: '#34d399', bg: 'rgba(52,211,153,0.12)' };
    if (count >= 3)   return { label: 'Full',    color: '#fb7185', bg: 'rgba(251,113,133,0.12)' };
    return              { label: 'Partial', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' };
  };

  return (
    <div>
      {/* Notification Modal */}
      {notifyModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div style={{
            background: '#1e293b', border: '1px solid rgba(148,163,184,0.2)',
            borderRadius: 20, padding: 24, width: '100%', maxWidth: 420,
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Send Notification</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>
              To: <strong style={{ color: '#f1f5f9' }}>{notifyModal.booking.user_name || 'Student'}</strong>
              {' · '}{notifyModal.room} · {notifyModal.booking.start_time}–{notifyModal.booking.end_time}
            </div>

            {/* Notification type */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Notification type</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {NOTIF_TYPES.map(nt => (
                  <button key={nt.value} onClick={() => handleNotifTypeChange(nt.value)} style={{
                    padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                    background: notifType === nt.value ? nt.bg : '#0f172a',
                    border: notifType === nt.value ? `1px solid ${nt.border}` : '1px solid rgba(148,163,184,0.12)',
                    color: notifType === nt.value ? nt.color : '#94a3b8',
                    fontSize: 11, fontWeight: 500, textAlign: 'left',
                    transition: 'all 0.15s',
                  }}>
                    {nt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Message</div>
              <textarea
                value={notifMsg}
                onChange={e => setNotifMsg(e.target.value)}
                rows={4}
                style={{
                  width: '100%', background: '#0f172a',
                  border: '1px solid rgba(148,163,184,0.2)',
                  borderRadius: 8, padding: '10px 12px',
                  fontSize: 13, color: '#f1f5f9', outline: 'none',
                  resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6,
                }}
              />
            </div>

            {/* Preview */}
            <div style={{
              background: '#0f172a', border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 10, padding: '10px 14px', marginBottom: 16,
            }}>
              <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Preview</div>
              <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>{notifMsg || 'Your message will appear here...'}</div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setNotifyModal(null)} style={{
                flex: 1, padding: '10px', background: '#293548', border: 'none',
                borderRadius: 8, color: '#94a3b8', fontSize: 13, cursor: 'pointer',
              }}>Cancel</button>
              <button onClick={sendNotification} disabled={sending} style={{
                flex: 1, padding: '10px',
                background: sending ? '#4338ca' : '#6366f1',
                border: 'none', borderRadius: 8, color: 'white',
                fontSize: 13, fontWeight: 600, cursor: sending ? 'not-allowed' : 'pointer',
              }}>
                {sending ? 'Sending…' : '📨 Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Total Bookings', value: totalBookings, color: '#818cf8', icon: '📋' },
          { label: 'Students Today', value: totalStudents, color: '#34d399', icon: '🎓' },
          { label: 'Rooms Full',     value: filledRooms,   color: '#fb7185', icon: '🚫' },
          { label: 'Rooms Free',     value: freeRooms,     color: '#fbbf24', icon: '✅' },
        ].map(s => (
          <div key={s.label} style={{ background: '#1e293b', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</span>
              <span style={{ fontSize: 16 }}>{s.icon}</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 20 }}>
        {/* Mini calendar */}
        <div>
          <div style={{ background: '#1e293b', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 10 }}>
              {today.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
              {['M','T','W','T','F','S','S'].map((d, i) => (
                <div key={i} style={{ textAlign: 'center', fontSize: 9, color: '#64748b', paddingBottom: 3 }}>{d}</div>
              ))}
              {Array.from({ length: blanks }, (_, i) => <div key={`b${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const dateStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                const isToday = day === today.getDate();
                const isSelected = dateStr === selectedDate;
                const isPast = new Date(dateStr) < new Date(today.toISOString().split('T')[0]);
                return (
                  <div key={day} onClick={() => !isPast && setSelectedDate(dateStr)} style={{
                    aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 6, fontSize: 10, cursor: isPast ? 'default' : 'pointer',
                    background: isSelected ? '#6366f1' : isToday ? 'rgba(99,102,241,0.2)' : 'transparent',
                    color: isSelected ? '#fff' : isPast ? '#293548' : '#94a3b8',
                    fontWeight: isToday ? 700 : 400,
                  }}>{day}</div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div style={{ background: '#1e293b', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 14, padding: 14, marginTop: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Room Status</div>
            {[
              { color: '#34d399', label: 'Free (0 bookings)' },
              { color: '#fbbf24', label: 'Partial (1–2 bookings)' },
              { color: '#fb7185', label: 'Full (3+ bookings)' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: l.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: '#94a3b8' }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Room bookings panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>
            Bookings for {new Date(selectedDate + 'T00:00:00').toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>

          {ROOMS.map(room => {
            const roomData = availability.find(r => r.room === room);
            const bookings = roomData?.bookings || [];
            const status   = getStatusBadge(bookings);
            const isOpen   = selectedRoom === room;

            return (
              <div key={room} style={{
                background: '#1e293b', border: '1px solid rgba(148,163,184,0.12)',
                borderRadius: 14, overflow: 'hidden', transition: 'all 0.2s',
              }}>
                {/* Room header */}
                <div
                  onClick={() => setSelectedRoom(isOpen ? null : room)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 16px', cursor: 'pointer',
                    background: isOpen ? '#293548' : 'transparent',
                    transition: 'background 0.15s',
                  }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: status.color, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{room}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Capacity: 4 · {bookings.length} booking{bookings.length !== 1 ? 's' : ''} today</div>
                  </div>
                  <span style={{
                    fontSize: 10, padding: '3px 10px', borderRadius: 100, fontWeight: 600,
                    background: status.bg, color: status.color,
                  }}>{status.label}</span>
                  <span style={{ fontSize: 12, color: '#64748b' }}>{isOpen ? '▲' : '▼'}</span>
                </div>

                {/* Booking details */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid rgba(148,163,184,0.08)' }}>
                    {bookings.length === 0 ? (
                      <div style={{ padding: '20px 16px', textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                        <div style={{ fontSize: 24, marginBottom: 6 }}>✅</div>
                        No bookings for this room today. Room is free.
                      </div>
                    ) : (
                      <div>
                        {/* Time slot grid */}
                        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(148,163,184,0.06)' }}>
                          <div style={{ fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Time Slots</div>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {TIME_SLOTS.map(slot => {
                              const [s] = slot.split('–');
                              const booking = bookings.find(b => b.start_time === s);
                              const sent = booking && sentNotifs[booking.id];
                              return (
                                <div key={slot} style={{
                                  padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 500,
                                  background: booking ? 'rgba(251,113,133,0.12)' : 'rgba(52,211,153,0.1)',
                                  color: booking ? '#fb7185' : '#34d399',
                                  border: booking ? '1px solid rgba(251,113,133,0.2)' : '1px solid rgba(52,211,153,0.2)',
                                  position: 'relative',
                                }}>
                                  {slot}
                                  {booking ? ' 🔴' : ' 🟢'}
                                  {sent && <span style={{ marginLeft: 4, fontSize: 9, color: '#818cf8' }}>📨</span>}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Student list */}
                        <div style={{ padding: '12px 16px' }}>
                          <div style={{ fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                            Booked by ({bookings.length} student{bookings.length !== 1 ? 's' : ''})
                          </div>
                          {bookings.map((booking, i) => {
                            const sent = sentNotifs[booking.id];
                            return (
                              <div key={booking.id} style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                padding: '10px 0',
                                borderBottom: i < bookings.length - 1 ? '1px solid rgba(148,163,184,0.06)' : 'none',
                              }}>
                                {/* Avatar */}
                                <div style={{
                                  width: 32, height: 32, borderRadius: '50%',
                                  background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 11, fontWeight: 700, flexShrink: 0,
                                }}>
                                  {(booking.user_name || 'S').slice(0,2).toUpperCase()}
                                </div>
                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 12, fontWeight: 600 }}>{booking.user_name || 'Student'}</div>
                                  <div style={{ fontSize: 10, color: '#94a3b8' }}>{booking.start_time} – {booking.end_time}</div>
                                  {sent && (
                                    <div style={{ fontSize: 10, color: '#818cf8', marginTop: 2 }}>
                                      📨 Notified at {sent.time}: {sent.type === 'available' ? '✅ Available' : sent.type === 'filled' ? '🚫 Filled' : sent.type === 'next_shift' ? '⏰ Next shift' : '✏️ Custom'}
                                    </div>
                                  )}
                                </div>
                                {/* Time badge */}
                                <span style={{
                                  fontSize: 10, padding: '2px 8px', borderRadius: 6,
                                  background: 'rgba(99,102,241,0.1)', color: '#818cf8',
                                  flexShrink: 0,
                                }}>
                                  {booking.start_time}–{booking.end_time}
                                </span>
                                {/* Notify button */}
                                <button
                                  onClick={() => openNotify(booking, room)}
                                  style={{
                                    padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 600,
                                    background: sent ? 'rgba(52,211,153,0.1)' : 'rgba(99,102,241,0.12)',
                                    border: sent ? '1px solid rgba(52,211,153,0.3)' : '1px solid rgba(99,102,241,0.3)',
                                    color: sent ? '#34d399' : '#818cf8',
                                    cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
                                  }}
                                  onMouseEnter={e => { if (!sent) { e.currentTarget.style.background = 'rgba(99,102,241,0.2)'; } }}
                                  onMouseLeave={e => { if (!sent) { e.currentTarget.style.background = 'rgba(99,102,241,0.12)'; } }}>
                                  {sent ? '✓ Sent' : '📨 Notify'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
export default function StudyRooms() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => { if (!authLoading && !user) router.push('/login'); }, [user, authLoading]);
  if (authLoading || !user) return null;

  const isAdmin = user.role === 'admin' || user.role === 'librarian';

  return (
    <>
      <Head><title>Study Rooms — LibraryOS</title></Head>
      <Layout>
        <div className="page-enter">
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Home / Study Rooms</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px' }}>
                  {isAdmin ? 'Study Room Management' : 'Study Room Booking'}
                </h1>
                <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>
                  {isAdmin
                    ? 'Monitor bookings, view student details, and send notifications'
                    : 'Reserve a quiet space to focus'}
                </p>
              </div>
              {/* Role badge */}
              <span style={{
                fontSize: 11, padding: '4px 12px', borderRadius: 100, fontWeight: 600,
                background: isAdmin ? 'rgba(251,191,36,0.12)' : 'rgba(52,211,153,0.12)',
                color: isAdmin ? '#fbbf24' : '#34d399',
                border: isAdmin ? '1px solid rgba(251,191,36,0.3)' : '1px solid rgba(52,211,153,0.3)',
              }}>
                {isAdmin ? '👑 Admin View' : '🎓 Student View'}
              </span>
            </div>
          </div>

          {isAdmin ? <AdminView /> : <StudentView user={user} />}
        </div>
      </Layout>
    </>
  );
}
