export enum QuickAlertType {
  LOW_FUEL = 'LOW_FUEL',
  OBSTACLE_AHEAD = 'OBSTACLE_AHEAD',
  PULL_OVER = 'PULL_OVER',
  REGROUP = 'REGROUP',
  HAZARD_WEATHER = 'HAZARD_WEATHER',
  POLICE_TRAP = 'POLICE_TRAP',
  CUSTOM = 'CUSTOM',
}

export interface IQuickAlert {
  id: string;
  tripId: string;
  type: QuickAlertType;
  senderId: string;
  senderName: string;
  senderRole?: string;
  message: string;
  latitude?: number;
  longitude?: number;
  timestamp: string;
}
