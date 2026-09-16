/**
 * Duck Academy — Рольова модель та матриця авторизації (RBAC)
 * Ключ задачі Jira: SCRUM-54
 */

export const ACADEMY_ROLES = {
  CHILD: 'child',
  MENTOR: 'mentor',
  ADMIN: 'admin',
};

export const ACADEMY_PERMISSIONS = {
  READ_OWN_PROGRESS: 'read:own_progress',
  WRITE_OWN_PROGRESS: 'write:own_progress',
  READ_STUDENT_PROGRESS: 'read:student_progress',
  REVIEW_SUBMISSIONS: 'review:submissions',
  APPROVE_LESSON: 'approve:lesson',
  MANAGE_CURRICULUM: 'manage:curriculum',
  MANAGE_USERS: 'manage:users',
  VIEW_AUDIT_LOGS: 'view:audit_logs',
};

export const ROLE_PERMISSIONS = {
  [ACADEMY_ROLES.CHILD]: [
    ACADEMY_PERMISSIONS.READ_OWN_PROGRESS,
    ACADEMY_PERMISSIONS.WRITE_OWN_PROGRESS,
  ],
  [ACADEMY_ROLES.MENTOR]: [
    ACADEMY_PERMISSIONS.READ_OWN_PROGRESS,
    ACADEMY_PERMISSIONS.WRITE_OWN_PROGRESS,
    ACADEMY_PERMISSIONS.READ_STUDENT_PROGRESS,
    ACADEMY_PERMISSIONS.REVIEW_SUBMISSIONS,
    ACADEMY_PERMISSIONS.APPROVE_LESSON,
  ],
  [ACADEMY_ROLES.ADMIN]: [
    ACADEMY_PERMISSIONS.READ_OWN_PROGRESS,
    ACADEMY_PERMISSIONS.WRITE_OWN_PROGRESS,
    ACADEMY_PERMISSIONS.READ_STUDENT_PROGRESS,
    ACADEMY_PERMISSIONS.REVIEW_SUBMISSIONS,
    ACADEMY_PERMISSIONS.APPROVE_LESSON,
    ACADEMY_PERMISSIONS.MANAGE_CURRICULUM,
    ACADEMY_PERMISSIONS.MANAGE_USERS,
    ACADEMY_PERMISSIONS.VIEW_AUDIT_LOGS,
  ],
};

/**
 * Перевірка наявності дозволу в ролі
 */
export function hasPermission(role, permission) {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

/**
 * Перевірка доступу до ресурсу із запобіганням ескалації привілеїв
 * (Horizontal & Vertical Privilege Escalation Prevention)
 *
 * @param {Object} params
 * @param {Object} params.user Об'єкт авторизованого користувача { id, role, username }
 * @param {string} params.resourceOwnerId ID власника ресурсу (учня, автора коду)
 * @param {string} params.requiredPermission Необхідний дозвіл для виконання дії
 * @returns {{ allowed: boolean, reason?: string, message?: string }}
 */
export function canAccessResource({ user, resourceOwnerId, requiredPermission }) {
  if (!user || !user.role) {
    return { allowed: false, reason: 'UNAUTHENTICATED' };
  }

  // Перевірка вертикальної ескалації (Vertical Privilege Escalation)
  if (requiredPermission && !hasPermission(user.role, requiredPermission)) {
    return {
      allowed: false,
      reason: 'VERTICAL_PRIVILEGE_VIOLATION',
      message: `Роль ${user.role} не має дозволу ${requiredPermission}`,
    };
  }

  // Перевірка горизонтальної ескалації (Horizontal Privilege Escalation)
  // Дитина може взаємодіяти ТІЛЬКИ з власними ресурсами
  if (user.role === ACADEMY_ROLES.CHILD) {
    if (resourceOwnerId && resourceOwnerId !== user.id) {
      return {
        allowed: false,
        reason: 'HORIZONTAL_PRIVILEGE_VIOLATION',
        message: `Учень ${user.id} не має права доступу до даних іншого учня ${resourceOwnerId}`,
      };
    }
  }

  return { allowed: true };
}
