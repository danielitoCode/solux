/**
 * Backoffice aggregates management of:
 * - reservations status
 * - support tickets
 * - contact messages
 * - catalog items (products/services)
 * - presentation content (texts, photos, contact info)
 *
 * Access controlled by UserRole:
 * - admin   → full access
 * - support → tickets + contact messages
 * - sales   → reservations + catalog + contact messages
 */
export type BackofficeSection =
  | 'dashboard'
  | 'reservations'
  | 'tickets'
  | 'messages'
  | 'catalog'
  | 'presentation'
  | 'users';
