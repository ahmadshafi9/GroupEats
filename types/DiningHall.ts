export type ExtendRequest = {
  requesterId: string;
  minutes: number;
  status: 'pending' | 'approved' | 'denied';
  createdAt: string;
};

export type DiningHallEvent = {
  id: string;
  creatorId: string;
  creatorName: string;
  targetTime: string;
  customMinutes?: number;
  participants: string[];
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
  notificationsSent: string[];
  extendRequests?: ExtendRequest[];
};

export type DiningHallInvitation = {
  eventId: string;
  fromUserId: string;
  fromUserName: string;
  targetTime: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
};
