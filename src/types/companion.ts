export type CompanionStatus = 'idle' | 'busy' | 'offline' | 'leave';

export interface Companion {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  gender: 'male' | 'female';
  age: number;
  status: CompanionStatus;
  level: 'standard' | 'senior' | 'expert';
  rating: number;
  orderCount: number;
  goodHospitals: string[];
  skills: string[];
  distance?: number;
  todayOrderCount?: number;
  freeTime?: string;
  certificate?: string;
  experience: number;
  intro: string;
}
