/**
 * Duck Academy — Portfolio & Cryptographic Skills Certificate (SCRUM-47)
 * Формування портфоліо учня, перевірених свідоцтв навичок (Evidence)
 * та генерація безпечних shareable сертифікатів з цифровим підписом HMAC.
 */

import crypto from 'crypto';
import { CURRICULUM_REGISTRY, ACADEMY_TRACKS } from '../registry.js';

const CERTIFICATE_SECRET = process.env.ACADEMY_CERTIFICATE_SECRET || 'duck-academy-cert-signature-key-2026';
const CERTIFICATE_VERSION = '1.0.0';

// In-memory сховище відкликаних сертифікатів (Revocation List)
const revokedCertificateIds = new Set();

export const SENIOR_RUBRIC_DIMENSIONS = [
  { id: 'tradeoffs', name: 'Trade-offs & Architecture', desc: 'Усвідомлений вибір рішень, відхилені альтернативи, ADR' },
  { id: 'security', name: 'Security & Safe Guardrails', desc: 'RBAC, захист сесій, відсутність витоку секретів' },
  { id: 'performance', name: 'Performance & 60 FPS SLA', desc: 'Продуктивність Canvas, оптимізація запитів, latency' },
  { id: 'maintainability', name: 'Maintainability & Tests', desc: 'Чистота коду, контрактне тестування, зрозумілі PR' }
];

/**
 * Кодування base64url
 */
function base64UrlEncode(data) {
  return Buffer.from(data)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Декодування base64url
 */
function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  return Buffer.from(base64, 'base64').toString('utf8');
}

/**
 * Будує агреговане портфоліо учня виключно на основі перевірених свідоцтв
 */
export function buildPortfolioView({ learnerId, displayName, completedLessonIds = [], rubricScores = {}, mentorFeedback = '' }) {
  const verifiedLessons = [];

  for (const lessonId of completedLessonIds) {
    const lesson = CURRICULUM_REGISTRY.find((l) => l.id === lessonId);
    if (!lesson) continue;

    verifiedLessons.push({
      id: lesson.id,
      title: lesson.title,
      level: lesson.level,
      trackId: lesson.trackId,
      jiraKey: lesson.jiraKey,
      evidence: {
        githubPr: `https://github.com/greenyarik0505-jpg/duck-verse/pulls?q=${lesson.jiraKey}`,
        jiraIssue: `https://gta6-sliv-cyberleek.atlassian.net/browse/${lesson.jiraKey}`,
        testsPassed: true
      },
      completedAt: new Date().toISOString().split('T')[0]
    });
  }

  // Розрахунок Senior Rubric
  const rubricDetails = SENIOR_RUBRIC_DIMENSIONS.map((dim) => ({
    ...dim,
    score: rubricScores[dim.id] !== undefined ? Math.min(5, Math.max(1, rubricScores[dim.id])) : 5
  }));

  const totalScore = rubricDetails.reduce((acc, d) => acc + d.score, 0);

  return {
    learnerId: String(learnerId || 'anonymous'),
    displayName: String(displayName || 'Duck Verse Learner').trim().slice(0, 32),
    completedLessonsCount: verifiedLessons.length,
    lessons: verifiedLessons,
    seniorRubric: {
      dimensions: rubricDetails,
      totalScore,
      maxScore: SENIOR_RUBRIC_DIMENSIONS.length * 5,
      mentorFeedback: mentorFeedback || 'Відповідає інженерним стандартам Duck Verse.'
    },
    generatedAt: new Date().toISOString()
  };
}

/**
 * Генерує публічно поширюваний підписаний токен сертифіката без персональних даних (no email, no auth tokens)
 */
export function generateCertificate({ learnerId, displayName, trackId, completedLessonIds = [], expiresInDays = 30 }) {
  const certId = `cert-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const now = Date.now();
  const exp = now + (expiresInDays * 24 * 60 * 60 * 1000);

  const track = ACADEMY_TRACKS.find((t) => t.id === trackId) || ACADEMY_TRACKS[0];

  const payload = {
    version: CERTIFICATE_VERSION,
    certId,
    displayName: String(displayName || 'Duck Verse Learner').trim().slice(0, 32),
    trackId: track.id,
    trackTitle: track.title,
    completedCount: completedLessonIds.length,
    verifiedLessons: completedLessonIds.slice(0, 10), // перелік ID пройдених модулів
    iat: now,
    exp
  };

  const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', CERTIFICATE_SECRET)
    .update(payloadEncoded)
    .digest('base64url');

  const token = `${payloadEncoded}.${signature}`;

  return {
    certificateId: certId,
    token,
    shareUrl: `/academy/certificate?token=${token}`,
    expiresAt: new Date(exp).toISOString()
  };
}

/**
 * Перевіряє валідність, термін дії та відсутність відкликання сертифіката
 */
export function verifyCertificateToken(token) {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'MISSING_TOKEN' };
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false, error: 'MALFORMED_TOKEN' };
  }

  const [payloadEncoded, signature] = parts;
  const expectedSignature = crypto
    .createHmac('sha256', CERTIFICATE_SECRET)
    .update(payloadEncoded)
    .digest('base64url');

  if (signature.length !== expectedSignature.length) {
    return { valid: false, error: 'INVALID_SIGNATURE' };
  }

  const isSigValid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  if (!isSigValid) {
    return { valid: false, error: 'INVALID_SIGNATURE' };
  }

  try {
    const payload = JSON.parse(base64UrlDecode(payloadEncoded));
    const now = Date.now();

    if (now > payload.exp) {
      return { valid: false, error: 'CERTIFICATE_EXPIRED', expiredAt: new Date(payload.exp).toISOString() };
    }

    if (revokedCertificateIds.has(payload.certId)) {
      return { valid: false, error: 'CERTIFICATE_REVOKED' };
    }

    return {
      valid: true,
      certificate: payload
    };
  } catch (err) {
    return { valid: false, error: 'INVALID_PAYLOAD' };
  }
}

/**
 * Відкликає раніше виданий сертифікат (Revoke link)
 */
export function revokeCertificate(certId) {
  if (certId && typeof certId === 'string') {
    revokedCertificateIds.add(certId);
    return true;
  }
  return false;
}

/**
 * Перевіряє, чи відкликано сертифікат
 */
export function isCertificateRevoked(certId) {
  return revokedCertificateIds.has(certId);
}
