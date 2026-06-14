export interface Hospital {
  id: string;
  name: string;
  address: string;
  level: string;
  departments: string[];
  distance?: number;
}
