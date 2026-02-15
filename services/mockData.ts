import { Shop, RentRecord, MaintenanceCollection, RepairRecord, User } from '../types';

// Helper to get current month strings dynamicallly
const today = new Date();
const currentMonth = today.toISOString().slice(0, 7); // YYYY-MM
const prevMonthDate = new Date();
prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
const prevMonth = prevMonthDate.toISOString().slice(0, 7);

const currentYear = today.getFullYear();
const currentMonthNum = today.getMonth() + 1;

export const mockStaffList: User[] = [
  {
    uid: 'user-1',
    email: 'admin@plaza.com',
    displayName: 'Super Admin',
    role: 'admin',
    permissions: ['dashboard', 'shops', 'rent', 'maintenance', 'settings'],
    password: 'admin'
  },
  {
    uid: 'user-2',
    email: 'staff@plaza.com',
    displayName: 'Ali Staff',
    role: 'staff',
    permissions: ['dashboard', 'rent', 'maintenance'],
    password: 'staff'
  }
];

export const mockShops: Shop[] = [
  { id: '1', shopNumber: '101', floor: 1, ownerName: 'Ali Electronics', phone: '0300-1234567', email: 'ali@test.com', monthlyRent: 45000, monthlyMaintenance: 5000, status: 'Occupied' },
  { id: '2', shopNumber: '102', floor: 1, ownerName: 'Bilal Fabrics', phone: '0321-9876543', monthlyRent: 50000, monthlyMaintenance: 5000, status: 'Occupied' },
  { id: '3', shopNumber: '201', floor: 2, ownerName: 'Cyber Cafe', phone: '0333-5555555', email: 'cafe@test.com', monthlyRent: 35000, monthlyMaintenance: 4000, status: 'Occupied' },
  { id: '4', shopNumber: '202', floor: 2, ownerName: 'Beauty Salon', phone: '0345-1112222', monthlyRent: 35000, monthlyMaintenance: 4000, status: 'Occupied' },
  { id: '5', shopNumber: '103', floor: 1, ownerName: 'Pharmacy Plus', phone: '0300-7778888', monthlyRent: 48000, monthlyMaintenance: 5000, status: 'Occupied' },
];

export const mockRent: RentRecord[] = [
  { 
    id: 'r1', 
    shopId: '1', 
    shopNumber: '101', 
    ownerName: 'Ali Electronics', 
    phone: '0300-1234567', 
    amount: 45000, 
    collected: 45000,
    transactions: [
      { id: 't1', date: `${currentYear}-${currentMonthNum.toString().padStart(2, '0')}-04, 10:30 AM`, amount: 45000, note: 'Full Rent Payment', collectedBy: 'Super Admin' }
    ],
    dueDate: `${currentMonth}-05`, 
    status: 'Paid', 
    month: currentMonth
  },
  { 
    id: 'r2', 
    shopId: '3', 
    shopNumber: '201', 
    ownerName: 'Cyber Cafe', 
    phone: '0333-5555555', 
    amount: 35000, 
    collected: 0,
    transactions: [],
    dueDate: `${currentMonth}-05`, 
    status: 'Pending', 
    month: currentMonth 
  },
  { 
    id: 'r3', 
    shopId: '4', 
    shopNumber: '202', 
    ownerName: 'Beauty Salon', 
    phone: '0345-1112222', 
    amount: 35000, 
    collected: 20000,
    transactions: [
       { id: 't2', date: `${prevMonth}-15, 02:00 PM`, amount: 20000, note: 'Partial Rent', collectedBy: 'Ali Staff' }
    ], 
    dueDate: `${prevMonth}-05`, 
    status: 'Partial', 
    month: prevMonth 
  },
];

export const mockMaintenanceCollections: MaintenanceCollection[] = [
  { 
    id: 'mc1', 
    shopId: '1', 
    shopNumber: '101', 
    ownerName: 'Ali Electronics', 
    phone: '0300-1234567', 
    amount: 5000, 
    collected: 5000,
    transactions: [
      { id: 'mt1', date: `${currentYear}-${currentMonthNum.toString().padStart(2, '0')}-04, 10:35 AM`, amount: 5000, note: 'Monthly Maintenance', collectedBy: 'Super Admin' }
    ],
    dueDate: `${currentMonth}-10`, 
    status: 'Paid', 
    month: currentMonth
  },
  { 
    id: 'mc2', 
    shopId: '3', 
    shopNumber: '201', 
    ownerName: 'Cyber Cafe', 
    phone: '0333-5555555', 
    amount: 4000, 
    collected: 0,
    transactions: [],
    dueDate: `${currentMonth}-10`, 
    status: 'Pending', 
    month: currentMonth 
  },
];

export const mockRepairs: RepairRecord[] = [
  { id: 'm1', shopId: '1', shopNumber: '101', issue: 'AC Leaking Water', priority: 'High', status: 'Pending', dateReported: `${currentMonth}-10` },
  { id: 'm2', shopId: '3', shopNumber: '201', issue: 'Replace Corridor Bulb', priority: 'Low', status: 'Completed', dateReported: `${currentMonth}-05`, dateResolved: `${currentMonth}-06`, cost: 500, resolutionNotes: 'Replaced with LED bulb' },
  { id: 'm3', shopId: '4', shopNumber: '202', issue: 'Broken Floor Tile', priority: 'Medium', status: 'In Progress', dateReported: `${currentMonth}-08` },
];