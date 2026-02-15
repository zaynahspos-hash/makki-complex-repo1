export type Role = 'admin' | 'staff';

export type Permission = 'dashboard' | 'shops' | 'rent' | 'maintenance' | 'settings';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
  photoURL?: string;
  permissions: Permission[];
  password?: string;
}

export interface Shop {
  id: string;
  shopNumber: string;
  floor: number;
  ownerName: string;
  phone: string;
  email?: string;
  monthlyRent: number;
  monthlyMaintenance: number;
  status: 'Occupied' | 'Vacant';
}

export interface PaymentTransaction {
  id: string;
  date: string;
  amount: number;
  note?: string;
  collectedBy: string;
}

// Strictly for Rent
export interface RentRecord {
  id: string;
  shopId: string;
  shopNumber: string;
  ownerName: string;
  phone: string;
  
  amount: number; // Target Rent
  collected: number; // Actual Collected
  
  transactions: PaymentTransaction[];

  dueDate: string;
  status: 'Paid' | 'Partial' | 'Pending' | 'Overdue';
  month: string;
}

// Strictly for Maintenance Fees
export interface MaintenanceCollection {
  id: string;
  shopId: string;
  shopNumber: string;
  ownerName: string;
  phone: string;
  
  amount: number; // Target Maintenance
  collected: number; // Actual Collected
  
  transactions: PaymentTransaction[];

  dueDate: string;
  status: 'Paid' | 'Partial' | 'Pending' | 'Overdue';
  month: string;
}

// For Repairs / Tasks (Renamed from MaintenanceRecord)
export interface RepairRecord {
  id: string;
  shopId: string;
  shopNumber: string;
  issue: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'In Progress' | 'Completed';
  dateReported: string;
  dateResolved?: string;
  cost?: number;
  resolutionNotes?: string;
}

export interface Stats {
  totalShops: number;
  occupiedShops: number;
  totalRentCollected: number;
  pendingMaintenance: number;
}

export interface PlazaSettings {
  plazaName: string;
  address: string;
  contactPhone: string;
  lateFeePercentage: number;
}