import { NextResponse } from 'next/server';
import { verifySignedSessionToken } from '../../../../lib/academy/auth/session';
import {
  MENTOR_PROFILES,
  getAvailableSlots,
  bookOfficeHourSlot,
  rescheduleBooking,
  cancelBooking,
  completeOfficeHourSession,
  getUserBookings,
} from '../../../../lib/academy/mentoring/office_hours';

function getAuthenticatedUser(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/duck_academy_session=([^;]+)/);
  if (match) {
    const verified = verifySignedSessionToken(match[1]);
    if (verified.valid && verified.session) {
      return verified.session;
    }
  }
  return { userId: 'student_guest', username: 'Гість Академії', role: 'student' };
}

/**
 * GET /api/academy/mentoring
 */
export async function GET(request) {
  const currentUser = getAuthenticatedUser(request);
  const { searchParams } = new URL(request.url);
  const mentorId = searchParams.get('mentorId') || undefined;

  const requestingUser = {
    id: currentUser.userId,
    username: currentUser.username,
    role: currentUser.role,
  };

  try {
    const slots = getAvailableSlots({ mentorId });
    const bookings = getUserBookings({ requestingUser });

    return NextResponse.json({
      success: true,
      slots,
      mentors: MENTOR_PROFILES,
      bookings,
      currentUser: requestingUser,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message, code: err.code || 'UNKNOWN_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/academy/mentoring
 */
export async function POST(request) {
  const currentUser = getAuthenticatedUser(request);
  const requestingUser = {
    id: currentUser.userId,
    username: currentUser.username,
    role: currentUser.role,
  };

  try {
    const body = await request.json();
    const { action, slotId, bookingId, newSlotId, agenda, preferredFocus, reason, publicSummary, privateNotes, followUpJiraTask } = body;

    if (action === 'book') {
      const booking = bookOfficeHourSlot({
        slotId,
        studentUser: requestingUser,
        agenda,
        preferredFocus,
      });
      return NextResponse.json({ success: true, booking });
    }

    if (action === 'reschedule') {
      const result = rescheduleBooking({
        bookingId,
        newSlotId,
        actor: requestingUser,
      });
      return NextResponse.json(result);
    }

    if (action === 'cancel') {
      const result = cancelBooking({
        bookingId,
        actor: requestingUser,
        reason,
      });
      return NextResponse.json(result);
    }

    if (action === 'complete') {
      const result = completeOfficeHourSession({
        bookingId,
        mentorUser: requestingUser,
        publicSummary,
        privateNotes,
        followUpJiraTask,
      });
      return NextResponse.json(result);
    }

    return NextResponse.json({ success: false, error: 'Невідома дія (action)' }, { status: 400 });
  } catch (err) {
    let status = 400;
    if (err.code === 'SLOT_ALREADY_BOOKED' || err.code === 'FAIR_USE_QUOTA_EXCEEDED') {
      status = 409;
    } else if (err.code?.includes('UNAUTHORIZED')) {
      status = 403;
    }
    return NextResponse.json({ success: false, error: err.message, code: err.code }, { status });
  }
}
