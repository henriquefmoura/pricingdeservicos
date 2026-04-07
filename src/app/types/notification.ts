export type NotificationType =
  | 'support_request'       // Admin/User sent a support message
  | 'plaza_pricing_complete' // A plaza completed all pricings
  | 'new_codes_to_price'    // Master assigned new codes to price
  | 'codes_from_admin'      // Admin assigned codes to user
  | 'support_reply';        // Reply to a support message

export type NotificationPriority = 'low' | 'medium' | 'high';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  fromUserId: string;
  fromUserName: string;
  fromUserRole: 'master' | 'admin' | 'user';
  toRole: 'master' | 'admin' | 'user';
  toPlaza?: string;          // Target plaza (for plaza-specific notifications)
  plaza?: string;            // Related plaza
  priority: NotificationPriority;
  read: boolean;
  createdAt: Date;
  metadata?: Record<string, string | number>;
}

export interface SupportMessage {
  id: string;
  threadId: string;
  fromUserId: string;
  fromUserName: string;
  fromUserRole: 'master' | 'admin' | 'user';
  toRole: 'master' | 'admin' | 'user';
  toPlaza?: string;
  message: string;
  createdAt: Date;
  read: boolean;
}

export interface SupportThread {
  id: string;
  subject: string;
  fromUserId: string;
  fromUserName: string;
  fromUserRole: 'master' | 'admin' | 'user';
  toRole: 'master' | 'admin' | 'user';
  plaza?: string;
  status: 'open' | 'closed';
  createdAt: Date;
  updatedAt: Date;
  messages: SupportMessage[];
}
