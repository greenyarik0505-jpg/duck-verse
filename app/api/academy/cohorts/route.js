import { NextResponse } from 'next/server';
import { verifySignedSessionToken } from '../../../../lib/academy/auth/session';
import {
  getTeamsList,
  getTeamDetails,
  createTeam,
  createTeamInvite,
  acceptTeamInvite,
  revokeTeamInvite,
  submitTeamRetrospective,
  archiveTeam,
} from '../../../../lib/academy/cohorts/cohorts';

function getAuthenticatedUser(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/duck_academy_session=([^;]+)/);
  if (match) {
    const verified = verifySignedSessionToken(match[1]);
    if (verified.valid && verified.session) {
      return verified.session;
    }
  }
  return { userId: 'user_guest', username: 'Гість', role: 'guest' };
}

/**
 * GET /api/academy/cohorts
 */
export async function GET(request) {
  const currentUser = getAuthenticatedUser(request);
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view') || 'teams';
  const teamId = searchParams.get('teamId');
  const cohortId = searchParams.get('cohortId') || 'cohort-autumn-2026';

  const requestingUser = {
    id: currentUser.userId,
    username: currentUser.username,
    role: currentUser.role,
  };

  try {
    if (view === 'teams') {
      const teams = getTeamsList({ requestingUser, cohortId });
      return NextResponse.json({ success: true, teams });
    }

    if (view === 'details' && teamId) {
      const team = getTeamDetails({ teamId, requestingUser });
      return NextResponse.json({ success: true, team });
    }

    return NextResponse.json({ success: false, error: 'Невідомий запит view' }, { status: 400 });
  } catch (err) {
    const status = err.code?.includes('UNAUTHORIZED') ? 403 : 400;
    return NextResponse.json({ success: false, error: err.message, code: err.code }, { status });
  }
}

/**
 * POST /api/academy/cohorts
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
    const { action, teamId, token, ...payload } = body;

    if (action === 'create_team') {
      const team = createTeam({
        ownerUser: requestingUser,
        name: payload.name,
        capacity: payload.capacity,
        mentorId: payload.mentorId,
      });
      return NextResponse.json({ success: true, team });
    }

    if (action === 'create_invite') {
      const invite = createTeamInvite({
        teamId,
        invitedEmail: payload.invitedEmail,
        targetRole: payload.targetRole,
        actor: requestingUser,
        expiresHours: payload.expiresHours || 72,
      });
      return NextResponse.json({ success: true, invite });
    }

    if (action === 'accept_invite') {
      const result = acceptTeamInvite({
        token,
        acceptingUser: requestingUser,
      });
      return NextResponse.json({ success: true, result });
    }

    if (action === 'revoke_invite') {
      const result = revokeTeamInvite({
        token,
        actor: requestingUser,
      });
      return NextResponse.json({ success: true, result });
    }

    if (action === 'submit_retro') {
      const retro = submitTeamRetrospective({
        teamId,
        actor: requestingUser,
        items: payload.items,
      });
      return NextResponse.json({ success: true, retro });
    }

    if (action === 'archive_team') {
      const result = archiveTeam({
        teamId,
        actor: requestingUser,
      });
      return NextResponse.json({ success: true, result });
    }

    return NextResponse.json({ success: false, error: 'Невідома дія (action)' }, { status: 400 });
  } catch (err) {
    const isSecurityError = err.code?.includes('UNAUTHORIZED') || err.code?.includes('BLOCKED') || err.code?.includes('EXCEEDED');
    return NextResponse.json({ success: false, error: err.message, code: err.code }, { status: isSecurityError ? 403 : 400 });
  }
}
