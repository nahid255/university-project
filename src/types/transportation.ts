export type RouteStatus = 'Active' | 'Inactive' | 'Suspended';

export interface RouteStop {
  name: string;
  scheduledTime?: string;
}

export interface TransportationRoute {
  id: string;
  routeName: string;
  busNumber: string;
  startingPoint: string;
  destination: string;
  stops: RouteStop[];
  departureTime: string;
  arrivalTime: string;
  operatingDays: string[];
  driverName?: string;
  driverContact?: string;
  status: RouteStatus;
  statusNote?: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  createdByName?: string;
  isDemoData?: boolean;
}
