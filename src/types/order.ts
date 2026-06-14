export type OrderStatus = 'pending' | 'assigned' | 'serving' | 'completed';

export interface PatientInfo {
  name: string;
  age: number;
  gender: 'male' | 'female';
  phone: string;
  idCard?: string;
}

export interface FamilyContact {
  name: string;
  relation: string;
  phone: string;
}

export interface ServiceNode {
  id: string;
  name: string;
  status: 'pending' | 'current' | 'done';
  time?: string;
  description?: string;
}

export interface Order {
  id: string;
  orderNo: string;
  status: OrderStatus;
  hospitalId: string;
  hospitalName: string;
  department: string;
  appointmentTime: string;
  checkItems: string[];
  specialNotes: string;
  patient: PatientInfo;
  familyContact: FamilyContact;
  companionId?: string;
  companionName?: string;
  companionPhone?: string;
  serviceLevel: 'standard' | 'premium' | 'vip';
  duration: number;
  price: number;
  actualDuration?: number;
  createTime: string;
  nodes: ServiceNode[];
  receiptPhotos?: string[];
  visitResult?: string;
  isOverdue?: boolean;
  complaint?: string;
  rating?: number;
  review?: string;
}

export interface HospitalOrderGroup {
  hospitalId: string;
  hospitalName: string;
  hospitalAddress: string;
  orderCount: number;
  pendingCount: number;
  assignedCount: number;
  servingCount: number;
  completedCount: number;
  orders: Order[];
}
