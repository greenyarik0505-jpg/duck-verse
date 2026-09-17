'use client';

import { useState, useEffect, useCallback } from 'react';

export default function MentorOfficeHoursView({ currentUser }) {
  const [activeTab, setActiveTab] = useState('slots'); // 'slots' | 'my_bookings' | 'mentor_panel' | 'rules'
  const [slots, setSlots] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedMentorFilter, setSelectedMentorFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  // Booking Form State
  const [selectedSlotForBooking, setSelectedSlotForBooking] = useState(null);
  const [bookingAgenda, setBookingAgenda] = useState('');
  const [bookingFocus, setBookingFocus] = useState('Audio Engine & 130 BPM Synthesizer');

  // Reschedule Form State
  const [reschedulingBookingId, setReschedulingBookingId] = useState(null);
  const [targetSlotId, setTargetSlotId] = useState('');

  // Mentor Complete Form State
  const [completingBookingId, setCompletingBookingId] = useState(null);
  const [publicSummaryInput, setPublicSummaryInput] = useState('');
  const [privateNotesInput, setPrivateNotesInput] = useState('');
  const [jiraTaskKeyInput, setJiraTaskKeyInput] = useState('SCRUM-54');

  const isMentorOrAdmin =
    currentUser?.role === 'mentor' ||
    currentUser?.role === 'admin' ||
    currentUser?.role === 'team_lead';

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const url = selectedMentorFilter
        ? `/api/academy/mentoring?mentorId=${selectedMentorFilter}`
        : '/api/academy/mentoring';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setSlots(data.slots || []);
        setMentors(data.mentors || []);
        setBookings(data.bookings || []);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, [selectedMentorFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Booking
  const handleBookSlot = async (e) => {
    e.preventDefault();
    if (!selectedSlotForBooking) return;
    if (bookingAgenda.trim().length < 10) {
      setActionMessage('Порядок денний (agenda) повинен містити щонайменше 10 символів.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/academy/mentoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'book',
          slotId: selectedSlotForBooking.id,
          agenda: bookingAgenda.trim(),
          preferredFocus: bookingFocus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(`✅ Консультацію успішно заброньовано! Слот: ${new Date(data.booking.startTime).toLocaleString('uk-UA')}`);
        setSelectedSlotForBooking(null);
        setBookingAgenda('');
        await fetchData();
        setActiveTab('my_bookings');
      } else {
        setActionMessage(`❌ Помилка: ${data.error}`);
      }
    } catch (err) {
      setActionMessage(`❌ Помилка мережі: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle Cancel
  const handleCancelBooking = async (bookingId) => {
    if (!confirm('Ви дійсно бажаєте скасувати цю консультацію? Слот стане доступним для інших учнів.')) return;
    try {
      setLoading(true);
      const res = await fetch('/api/academy/mentoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel',
          bookingId,
          reason: 'Скасовано учнем через особистий кабінет',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage('🚫 Консультацію успішно скасовано, слот звільнено.');
        await fetchData();
      } else {
        setActionMessage(`❌ Помилка скасування: ${data.error}`);
      }
    } catch (err) {
      setActionMessage(`❌ Помилка: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle Reschedule
  const handleReschedule = async (e) => {
    e.preventDefault();
    if (!reschedulingBookingId || !targetSlotId) return;

    try {
      setLoading(true);
      const res = await fetch('/api/academy/mentoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reschedule',
          bookingId: reschedulingBookingId,
          newSlotId: targetSlotId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage('🔄 Консультацію успішно перенесено на новий слот!');
        setReschedulingBookingId(null);
        setTargetSlotId('');
        await fetchData();
      } else {
        setActionMessage(`❌ Помилка перенесення: ${data.error}`);
      }
    } catch (err) {
      setActionMessage(`❌ Помилка: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle Mentor Completion
  const handleCompleteSession = async (e) => {
    e.preventDefault();
    if (!completingBookingId) return;

    try {
      setLoading(true);
      const res = await fetch('/api/academy/mentoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete',
          bookingId: completingBookingId,
          publicSummary: publicSummaryInput,
          privateNotes: privateNotesInput,
          followUpJiraTask: {
            key: jiraTaskKeyInput,
            summary: 'Follow-up задача за результатами 1-on-1 сесії',
            url: `https://gta6-sliv-cyberleek.atlassian.net/browse/${jiraTaskKeyInput}`,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(`🎓 Сесію успішно завершено! Фіксовано резюме та задачу Jira (${jiraTaskKeyInput}).`);
        setCompletingBookingId(null);
        setPublicSummaryInput('');
        setPrivateNotesInput('');
        await fetchData();
      } else {
        setActionMessage(`❌ Помилка: ${data.error}`);
      }
    } catch (err) {
      setActionMessage(`❌ Помилка: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (isoString) => {
    try {
      return new Date(isoString).toLocaleString('uk-UA', {
        timeZone: 'Europe/Kyiv',
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <section className="academy-skills-section" style={{ marginTop: '48px' }}>
      {/* Заголовок SCRUM-99 */}
      <div className="academy-skills-header">
        <div>
          <h2
            style={{
              fontFamily: 'Orbitron, sans-serif',
              fontSize: '22px',
              color: '#38bdf8',
              letterSpacing: '0.05em',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              margin: 0,
            }}
          >
            <span>📅</span> MENTOR OFFICE HOURS & 1-ON-1 BOOKING (SCRUM-99)
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: '4px 0 0 0' }}>
            Індивідуальні 30-хвилинні консультації з менторами (Kyiv time), захист від подвійного бронювання, ліміт Fair-Use (1/тиждень), приватні нотатки та Jira follow-up.
          </p>
        </div>

        {/* Навігаційні таби */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('slots')}
            className={`academy-tab-button ${activeTab === 'slots' ? 'active' : ''}`}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              cursor: 'pointer',
              border: activeTab === 'slots' ? '1px solid #38bdf8' : '1px solid #334155',
              background: activeTab === 'slots' ? 'rgba(56, 189, 248, 0.15)' : '#0f172a',
              color: activeTab === 'slots' ? '#38bdf8' : '#94a3b8',
              fontWeight: 'bold',
            }}
          >
            📅 Доступні слоти ({slots.length})
          </button>

          <button
            onClick={() => setActiveTab('my_bookings')}
            className={`academy-tab-button ${activeTab === 'my_bookings' ? 'active' : ''}`}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              cursor: 'pointer',
              border: activeTab === 'my_bookings' ? '1px solid #10b981' : '1px solid #334155',
              background: activeTab === 'my_bookings' ? 'rgba(16, 185, 129, 0.15)' : '#0f172a',
              color: activeTab === 'my_bookings' ? '#10b981' : '#94a3b8',
              fontWeight: 'bold',
            }}
          >
            📌 Мої консультації ({bookings.length})
          </button>

          <button
            onClick={() => setActiveTab('mentor_panel')}
            className={`academy-tab-button ${activeTab === 'mentor_panel' ? 'active' : ''}`}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              cursor: 'pointer',
              border: activeTab === 'mentor_panel' ? '1px solid #f59e0b' : '1px solid #334155',
              background: activeTab === 'mentor_panel' ? 'rgba(245, 158, 11, 0.15)' : '#0f172a',
              color: activeTab === 'mentor_panel' ? '#f59e0b' : '#94a3b8',
              fontWeight: 'bold',
            }}
          >
            🎓 Панель ментора {isMentorOrAdmin ? '👑' : '🔒'}
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            className={`academy-tab-button ${activeTab === 'rules' ? 'active' : ''}`}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              cursor: 'pointer',
              border: activeTab === 'rules' ? '1px solid #a855f7' : '1px solid #334155',
              background: activeTab === 'rules' ? 'rgba(168, 85, 247, 0.15)' : '#0f172a',
              color: activeTab === 'rules' ? '#a855f7' : '#94a3b8',
              fontWeight: 'bold',
            }}
          >
            ⚖️ Fair-Use & Приватність
          </button>
        </div>
      </div>

      {actionMessage && (
        <div
          style={{
            margin: '16px 0',
            padding: '12px 16px',
            borderRadius: '8px',
            background: actionMessage.includes('❌') ? 'rgba(239, 68, 68, 0.15)' : 'rgba(56, 189, 248, 0.15)',
            border: actionMessage.includes('❌') ? '1px solid #ef4444' : '1px solid #38bdf8',
            color: actionMessage.includes('❌') ? '#fca5a5' : '#7dd3fc',
            fontSize: '14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{actionMessage}</span>
          <button
            onClick={() => setActionMessage('')}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Вкладка 1: Доступні слоти */}
      {activeTab === 'slots' && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{ color: '#94a3b8', fontSize: '14px' }}>Фільтр за ментором:</label>
              <select
                value={selectedMentorFilter}
                onChange={(e) => setSelectedMentorFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#f8fafc',
                  fontSize: '13px',
                }}
              >
                <option value="">Усі ментори</option>
                {mentors.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                ))}
              </select>
            </div>

            <div style={{ color: '#64748b', fontSize: '13px' }}>
              ℹ️ Всі слоти тривалістю 30 хв за київським часом (Europe/Kyiv).
            </div>
          </div>

          {slots.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', background: '#090d16', borderRadius: '10px', border: '1px dashed #334155', color: '#94a3b8' }}>
              Немає доступних слотів за вибраним фільтром. Спробуйте скинути фільтр.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {slots.map((slot) => (
                <div
                  key={slot.id}
                  style={{
                    background: '#090d16',
                    border: '1px solid #1e293b',
                    borderRadius: '10px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontWeight: 'bold' }}>
                        Вільний слот
                      </span>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        Тиждень #{slot.weekNumber}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '16px', color: '#f8fafc', margin: '0 0 6px 0', fontWeight: 'bold' }}>
                      {slot.mentorName}
                    </h3>
                    <div style={{ fontSize: '13px', color: '#38bdf8', marginBottom: '8px' }}>
                      🕒 {formatDateTime(slot.startTime)} (Kyiv)
                    </div>
                    <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 12px 0' }}>
                      30 хв консультації для рев&apos;ю коду, дебагу або архітектурного розбору.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedSlotForBooking(slot);
                      setActionMessage('');
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '13px',
                      transition: 'opacity 0.2s',
                    }}
                  >
                    Забронювати слот
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Модальне вікно бронювання */}
          {selectedSlotForBooking && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.75)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '20px',
              }}
            >
              <div
                style={{
                  background: '#0f172a',
                  border: '1px solid #38bdf8',
                  borderRadius: '12px',
                  padding: '24px',
                  maxWidth: '520px',
                  width: '100%',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '18px', color: '#38bdf8', margin: 0, fontFamily: 'Orbitron, sans-serif' }}>
                    Запис на консультацію
                  </h3>
                  <button
                    onClick={() => setSelectedSlotForBooking(null)}
                    style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '18px', cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ background: '#1e293b', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', color: '#e2e8f0' }}>
                  <div><strong>Ментор:</strong> {selectedSlotForBooking.mentorName}</div>
                  <div><strong>Час:</strong> {formatDateTime(selectedSlotForBooking.startTime)} (Europe/Kyiv)</div>
                  <div><strong>Квота:</strong> 1 активна консультація на тиждень (Fair-Use)</div>
                </div>

                <form onSubmit={handleBookSlot}>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
                      Тема та пріоритет:
                    </label>
                    <select
                      value={bookingFocus}
                      onChange={(e) => setBookingFocus(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: '#090d16',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        fontSize: '13px',
                      }}
                    >
                      <option value="Audio Engine & 130 BPM Synthesizer">Audio Engine & 130 BPM Synthesizer</option>
                      <option value="Canvas 2D Physics & Hitboxes">Canvas 2D Physics & Hitboxes</option>
                      <option value="Next.js App Router & Architecture">Next.js App Router & Architecture</option>
                      <option value="General Code Review & PR Prep">General Code Review & PR Prep</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
                      Порядок денний (Agenda, обов&apos;язково від 10 символів):
                    </label>
                    <textarea
                      value={bookingAgenda}
                      onChange={(e) => setBookingAgenda(e.target.value)}
                      placeholder="Опишіть, що ви вже спробували, на чому застрягли та яке питання хочете розібрати..."
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: '#090d16',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        fontSize: '13px',
                        resize: 'vertical',
                      }}
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedSlotForBooking(null)}
                      style={{
                        padding: '10px 16px',
                        background: '#1e293b',
                        color: '#94a3b8',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                      }}
                    >
                      Скасувати
                    </button>
                    <button
                      type="submit"
                      disabled={loading || bookingAgenda.trim().length < 10}
                      style={{
                        padding: '10px 16px',
                        background: loading || bookingAgenda.trim().length < 10 ? '#334155' : 'linear-gradient(135deg, #0284c7, #2563eb)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: loading || bookingAgenda.trim().length < 10 ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold',
                        fontSize: '13px',
                      }}
                    >
                      {loading ? 'Бронювання...' : 'Підтвердити запис'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Вкладка 2: Мої консультації */}
      {activeTab === 'my_bookings' && (
        <div style={{ marginTop: '20px' }}>
          {bookings.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', background: '#090d16', borderRadius: '10px', border: '1px dashed #334155', color: '#94a3b8' }}>
              У вас поки немає заброньованих консультацій. Оберіть зручний час у вкладці &quot;Доступні слоти&quot;.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  style={{
                    background: '#090d16',
                    border: '1px solid #1e293b',
                    borderRadius: '10px',
                    padding: '20px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontWeight: 'bold',
                            background:
                              booking.status === 'CONFIRMED' ? 'rgba(16, 185, 129, 0.15)' :
                              booking.status === 'COMPLETED' ? 'rgba(56, 189, 248, 0.15)' :
                              'rgba(239, 68, 68, 0.15)',
                            color:
                              booking.status === 'CONFIRMED' ? '#34d399' :
                              booking.status === 'COMPLETED' ? '#38bdf8' :
                              '#f87171',
                          }}
                        >
                          {booking.status}
                        </span>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                          ID: {booking.id} | Тиждень #{booking.weekNumber}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '17px', color: '#f8fafc', margin: 0, fontWeight: 'bold' }}>
                        Консультація: {booking.mentorName}
                      </h3>
                      <div style={{ fontSize: '13px', color: '#38bdf8', marginTop: '2px' }}>
                        🕒 {formatDateTime(booking.startTime)} (Kyiv)
                      </div>
                    </div>

                    {booking.status === 'CONFIRMED' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => setReschedulingBookingId(booking.id)}
                          style={{
                            padding: '6px 12px',
                            background: '#1e293b',
                            color: '#38bdf8',
                            border: '1px solid #38bdf8',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 'bold',
                          }}
                        >
                          🔄 Перенести
                        </button>
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          style={{
                            padding: '6px 12px',
                            background: 'rgba(239, 68, 68, 0.15)',
                            color: '#f87171',
                            border: '1px solid #ef4444',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 'bold',
                          }}
                        >
                          Скасувати
                        </button>
                      </div>
                    )}
                  </div>

                  <div style={{ background: '#0d131f', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '10px' }}>
                    <div style={{ color: '#94a3b8', marginBottom: '4px' }}>
                      <strong>Порядок денний (Agenda):</strong>
                    </div>
                    <div style={{ color: '#e2e8f0' }}>{booking.agenda}</div>
                  </div>

                  {booking.publicSummary && (
                    <div style={{ background: 'rgba(56, 189, 248, 0.08)', borderLeft: '3px solid #38bdf8', padding: '10px 14px', borderRadius: '4px', fontSize: '13px', marginBottom: '10px' }}>
                      <div style={{ color: '#38bdf8', fontWeight: 'bold', marginBottom: '4px' }}>
                        📝 Підсумки сесії від ментора:
                      </div>
                      <div style={{ color: '#cbd5e1' }}>{booking.publicSummary}</div>
                    </div>
                  )}

                  {booking.followUpJiraTask && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#94a3b8' }}>
                      <span>🔗 Follow-up задача в Jira:</span>
                      <a
                        href={booking.followUpJiraTask.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: '#38bdf8', textDecoration: 'underline', fontWeight: 'bold' }}
                      >
                        [{booking.followUpJiraTask.key}] {booking.followUpJiraTask.summary}
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Модальне вікно перенесення */}
          {reschedulingBookingId && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.75)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '20px',
              }}
            >
              <div
                style={{
                  background: '#0f172a',
                  border: '1px solid #38bdf8',
                  borderRadius: '12px',
                  padding: '24px',
                  maxWidth: '480px',
                  width: '100%',
                }}
              >
                <h3 style={{ fontSize: '18px', color: '#38bdf8', margin: '0 0 16px 0', fontFamily: 'Orbitron, sans-serif' }}>
                  Перенесення консультації
                </h3>
                <form onSubmit={handleReschedule}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
                      Оберіть новий доступний слот:
                    </label>
                    <select
                      value={targetSlotId}
                      onChange={(e) => setTargetSlotId(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: '#090d16',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        fontSize: '13px',
                      }}
                      required
                    >
                      <option value="">-- Оберіть часовий слот --</option>
                      {slots.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.mentorName} — {formatDateTime(s.startTime)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => setReschedulingBookingId(null)}
                      style={{
                        padding: '10px 16px',
                        background: '#1e293b',
                        color: '#94a3b8',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                      }}
                    >
                      Скасувати
                    </button>
                    <button
                      type="submit"
                      disabled={!targetSlotId}
                      style={{
                        padding: '10px 16px',
                        background: !targetSlotId ? '#334155' : '#0284c7',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: !targetSlotId ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold',
                        fontSize: '13px',
                      }}
                    >
                      Зберегти зміни
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Вкладка 3: Панель ментора */}
      {activeTab === 'mentor_panel' && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ padding: '16px', background: '#090d16', borderRadius: '10px', border: '1px solid #1e293b', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', color: '#f59e0b', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🛡️</span> Інструменти ментора та ізоляція нотаток
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
              Ментори можуть фіксувати публічні результати консультацій для учня, вести внутрішні конфіденційні педагогічні спостереження (`privateMentorNotes`), які захищені від перегляду учнем та батьками, а також пов&apos;язувати підсумки зустрічі з завданнями в Jira.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {bookings.map((b) => (
              <div
                key={b.id}
                style={{
                  background: '#090d16',
                  border: '1px solid #1e293b',
                  borderRadius: '10px',
                  padding: '20px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      Учень: <strong style={{ color: '#f8fafc' }}>{b.studentName}</strong> ({b.studentId})
                    </div>
                    <div style={{ fontSize: '14px', color: '#38bdf8', marginTop: '2px' }}>
                      Час: {formatDateTime(b.startTime)} | Статус: <strong>{b.status}</strong>
                    </div>
                  </div>

                  {b.status === 'CONFIRMED' && (
                    <button
                      onClick={() => setCompletingBookingId(b.id)}
                      style={{
                        padding: '6px 14px',
                        background: 'linear-gradient(135deg, #059669, #10b981)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold',
                      }}
                    >
                      Завершити та додати підсумок
                    </button>
                  )}
                </div>

                <div style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '10px' }}>
                  <strong>Agenda учня:</strong> {b.agenda}
                </div>

                {b.privateMentorNotes && (
                  <div style={{ background: 'rgba(245, 158, 11, 0.1)', borderLeft: '3px solid #f59e0b', padding: '10px 14px', borderRadius: '4px', fontSize: '13px', marginTop: '10px' }}>
                    <div style={{ color: '#f59e0b', fontWeight: 'bold', marginBottom: '4px' }}>
                      🔒 Конфіденційні педагогічні спостереження (Тільки для викладачів):
                    </div>
                    <div style={{ color: '#fde68a' }}>{b.privateMentorNotes}</div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Модальне вікно завершення консультації */}
          {completingBookingId && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.75)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '20px',
              }}
            >
              <div
                style={{
                  background: '#0f172a',
                  border: '1px solid #10b981',
                  borderRadius: '12px',
                  padding: '24px',
                  maxWidth: '520px',
                  width: '100%',
                }}
              >
                <h3 style={{ fontSize: '18px', color: '#34d399', margin: '0 0 16px 0', fontFamily: 'Orbitron, sans-serif' }}>
                  Завершення 1-on-1 сесії
                </h3>

                <form onSubmit={handleCompleteSession}>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
                      Публічний підсумок для учня:
                    </label>
                    <textarea
                      value={publicSummaryInput}
                      onChange={(e) => setPublicSummaryInput(e.target.value)}
                      placeholder="Що було досягнуто, які матеріали опрацьовано..."
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: '#090d16',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        fontSize: '13px',
                      }}
                      required
                    />
                  </div>

                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '13px', color: '#f59e0b', marginBottom: '6px' }}>
                      🔒 Конфіденційні нотатки ментора (Child Privacy Safe):
                    </label>
                    <textarea
                      value={privateNotesInput}
                      onChange={(e) => setPrivateNotesInput(e.target.value)}
                      placeholder="Особисті спостереження, прогалини в знаннях, рекомендації для інших викладачів..."
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: '#090d16',
                        border: '1px solid #78350f',
                        borderRadius: '6px',
                        color: '#fde68a',
                        fontSize: '13px',
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
                      Ключ зв&apos;язаної задачі Jira:
                    </label>
                    <input
                      type="text"
                      value={jiraTaskKeyInput}
                      onChange={(e) => setJiraTaskKeyInput(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: '#090d16',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        fontSize: '13px',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => setCompletingBookingId(null)}
                      style={{
                        padding: '10px 16px',
                        background: '#1e293b',
                        color: '#94a3b8',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                      }}
                    >
                      Скасувати
                    </button>
                    <button
                      type="submit"
                      style={{
                        padding: '10px 16px',
                        background: 'linear-gradient(135deg, #059669, #10b981)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '13px',
                      }}
                    >
                      Зберегти та закрити сесію
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Вкладка 4: Регламент та приватність */}
      {activeTab === 'rules' && (
        <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          <div style={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: '10px', padding: '20px' }}>
            <h3 style={{ fontSize: '16px', color: '#38bdf8', margin: '0 0 10px 0' }}>
              ⚖️ Fair-Use Quota Policy
            </h3>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#94a3b8', fontSize: '13px', lineHeight: '1.7' }}>
              <li><strong>Рівний доступ для кожного:</strong> Кожен студент може мати щонайбільше 1 активну консультацію на календарний тиждень.</li>
              <li><strong>Запобігання монополізації:</strong> Спроба забронювати другий слот на той самий тиждень блокується помилкою `FAIR_USE_QUOTA_EXCEEDED`.</li>
              <li><strong>Скасування слоту:</strong> У разі скасування квота відновлюється автоматично.</li>
            </ul>
          </div>

          <div style={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: '10px', padding: '20px' }}>
            <h3 style={{ fontSize: '16px', color: '#a855f7', margin: '0 0 10px 0' }}>
              🛡️ Child Privacy Shield
            </h3>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#94a3b8', fontSize: '13px', lineHeight: '1.7' }}>
              <li><strong>Ізоляція внутрішніх нотаток:</strong> Поле `privateMentorNotes` повністю відфільтровується для учня та батьків на рівні бекенду (Zero Leakage).</li>
              <li><strong>Публічні підсумки:</strong> Учень бачить лише конструктивні кроки та навчальні рекомендації (`publicSummary`).</li>
              <li><strong>Відповідність COPPA/GDPR-K:</strong> Жодних персональних або чутливих психологічних оцінок не потрапляє у відкритий клієнтський стан.</li>
            </ul>
          </div>

          <div style={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: '10px', padding: '20px' }}>
            <h3 style={{ fontSize: '16px', color: '#10b981', margin: '0 0 10px 0' }}>
              ⚡ Атомарність та Синхронізація
            </h3>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#94a3b8', fontSize: '13px', lineHeight: '1.7' }}>
              <li><strong>Double-Booking Prevention:</strong> Одночасне бронювання одного слота двома студентами повертає `SLOT_ALREADY_BOOKED`.</li>
              <li><strong>Europe/Kyiv:</strong> Усі розклади строго прив&apos;язані до IANA часового поясу України.</li>
              <li><strong>Jira Follow-Up Integration:</strong> За результатами сесії генерується зв&apos;язок з таскою в проекті `SCRUM`.</li>
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
