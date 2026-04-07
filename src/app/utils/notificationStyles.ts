import type { NotificationPriority } from '../types/notification';

/**
 * Returns inline border-left style based on notification priority.
 */
export function getPriorityBorderStyle(priority: NotificationPriority): string {
  switch (priority) {
    case 'high':
      return '4px solid #DC2626';
    case 'medium':
      return '4px solid #F59E0B';
    default:
      return '4px solid #E5E7EB';
  }
}
