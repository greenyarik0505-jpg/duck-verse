/**
 * Duck Academy — Configuration & Feature Flags
 * SCRUM-56: Curriculum registry та feature architecture
 */

export const ACADEMY_CONFIG = {
  version: '1.0.0',
  schemaVersion: '2026.1',
  enabled: process.env.NEXT_PUBLIC_FEATURE_ACADEMY !== 'false', // Enabled by default unless explicitly disabled
  maxPrerequisitesDepth: 10,
  tracks: [
    'track-frontend-gaming',
    'track-devsecops',
    'track-ai-safety'
  ]
};

export function isAcademyEnabled() {
  return ACADEMY_CONFIG.enabled;
}
