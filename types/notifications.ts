// ============================================================
// types/notifications.ts
// Notification types for admin tracking status updates
// ============================================================

export type NotificationType =
  | 'nvc_review_complete'
  | 'dq_qualified'
  | 'interview_scheduled'
  | 'administrative_processing'
  | 'ap_cleared'
  | 'admin_status_update'
  | 'nvc_check_reminder';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'critical';

export type NotificationStatus = 'unread' | 'read' | 'dismissed';

export interface Notification {
  id: string;
  user_id: string;
  journey_id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  body: string;
  action_url?: string;
  action_label?: string;
  status: NotificationStatus;
  created_at: string;
  read_at?: string;
  dismissed_at?: string;
}

export interface CreateNotificationBody {
  user_id: string;
  journey_id: string;
  type: NotificationType;
  priority?: NotificationPriority;
  title: string;
  body: string;
  action_url?: string;
  action_label?: string;
}

export interface NotificationListResponse {
  success: true;
  notifications: Notification[];
  total: number;
  unread_count: number;
}

// Notification templates for admin tracking updates
export const NOTIFICATION_TEMPLATES: Record<NotificationType, {
  title: string;
  body: string;
  priority: NotificationPriority;
  action_label: string;
  action_url: string;
}> = {
  nvc_review_complete: {
    title: 'NVC Document Review Complete',
    body: 'Great news! The NVC has completed their review of your documents. Your case is now being processed for Documentarily Qualified status.',
    priority: 'high',
    action_label: 'View Dashboard',
    action_url: '/visa-category/ir-category/ir-1-journey',
  },
  dq_qualified: {
    title: 'You Are Documentarily Qualified!',
    body: 'Congratulations! NVC has confirmed your case is Documentarily Qualified. Your interview will be scheduled based on visa bulletin availability.',
    priority: 'critical',
    action_label: 'View Dashboard',
    action_url: '/visa-category/ir-category/ir-1-journey',
  },
  interview_scheduled: {
    title: 'Interview Scheduled',
    body: 'Your visa interview has been scheduled. Please review the interview preparation guide and ensure all documents are ready.',
    priority: 'critical',
    action_label: 'View Details',
    action_url: '/visa-category/ir-category/ir-1-journey',
  },
  administrative_processing: {
    title: 'Administrative Processing',
    body: 'Your case is under additional administrative review. This is a normal part of the process and can take several weeks. You will be notified once it is cleared.',
    priority: 'high',
    action_label: 'Learn More',
    action_url: 'https://ceac.state.gov/CEAC/',
  },
  ap_cleared: {
    title: 'Administrative Processing Cleared',
    body: 'Your administrative processing is complete. Your case is now moving forward for final visa issuance.',
    priority: 'high',
    action_label: 'View Dashboard',
    action_url: '/visa-category/ir-category/ir-1-journey',
  },
  admin_status_update: {
    title: 'Case Status Update',
    body: 'Your visa case status has been updated by our admin team. Check your dashboard for the latest information.',
    priority: 'normal',
    action_label: 'View Dashboard',
    action_url: '/visa-category/ir-category/ir-1-journey',
  },
  nvc_check_reminder: {
    title: 'Daily Reminder: Check NVC Inbox',
    body: 'Your case is currently awaiting NVC document review. Have you checked your registered email or the CEAC portal for updates today?',
    priority: 'normal',
    action_label: 'Open CEAC Portal',
    action_url: 'https://ceac.state.gov/IV/Login.aspx',
  },
};
