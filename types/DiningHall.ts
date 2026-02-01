// Dining Hall event types
export type DiningHallEvent = {
  id: string;
  creatorId: string;
  creatorName: string;
  targetTime: string; // ISO timestamp
  customMinutes?: number; // For custom time selection
  participants: string[]; // Array of user IDs
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
  notificationsSent: string[]; // Array of user IDs who received notifications
};

export type DiningHallInvitation = {
  eventId: string;
  fromUserId: string;
  fromUserName: string;
  targetTime: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
};
