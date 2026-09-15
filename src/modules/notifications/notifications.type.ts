export const NOTIFICATION_TYPES = [
    'comment_post',
    'follow',
    'like_post',
    'mention_comment',
    'mention_post',
    'reply_comment',
    'support_reply',
    'support_status',
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export type Notification = {
    is_read: boolean;
    time: Date;
    type: NotificationType;
    user?: string;
    post?: string;
    comment?: string;
    support_request?: string;
    support_status?: string;
};

export type CreateNotification = {
    type: NotificationType;
    user?: string;
    post?: string;
    comment?: string;
    support_request?: string;
    support_status?: string;
};
