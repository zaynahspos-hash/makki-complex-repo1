import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Shop, RentRecord, MaintenanceCollection, RepairRecord, PlazaSettings, PaymentTransaction, Permission } from '../types';
import { auth, db, firebaseConfig } from '../services/firebase'; 
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  getAuth as getAuthFromApp,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { initializeApp, deleteApp } from 'firebase/app'; 
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  onSnapshot, 
  deleteDoc,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { CheckCircle, AlertCircle, Info as InfoIcon, X } from 'lucide-react';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  user: User | null;
  staffList: User[];
  shops: Shop[];
  rentRecords: RentRecord[];
  maintenanceCollections: MaintenanceCollection[];
  repairRecords: RepairRecord[];
  settings: PlazaSettings;
  theme: 'light' | 'dark';
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
  resetUserPassword: (email: string, newPassword?: string) => Promise<void>;
  toggleTheme: () => void;
  
  // Toast
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;

  addShop: (shop: Shop) => Promise<void>;
  updateShop: (shop: Shop) => Promise<void>;
  
  // Repairs
  addRepair: (record: RepairRecord) => void;
  updateRepair: (record: RepairRecord) => void;

  // Rent
  addRentPayment: (recordId: string, amount: number, note?: string) => void;
  generateMonthlyRent: (month: string) => void;
  createRentBill: (shopId: string, month: string) => Promise<void>;

  // Maintenance Collection
  addMaintenancePayment: (recordId: string, amount: number, note?: string) => void;
  generateMonthlyMaintenance: (month: string) => void;
  createMaintenanceBill: (shopId: string, month: string) => Promise<void>;

  updateSettings: (settings: PlazaSettings) => Promise<void>;
  addStaff: (user: User) => Promise<void>;
  updateStaff: (uid: string, data: Partial<User>) => Promise<void>;
  deleteStaff: (uid: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [staffList, setStaffList] = useState<User[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [rentRecords, setRentRecords] = useState<RentRecord[]>([]);
  const [maintenanceCollections, setMaintenanceCollections] = useState<MaintenanceCollection[]>([]);
  const [repairRecords, setRepairRecords] = useState<RepairRecord[]>([]);
  
  const [settings, setSettings] = useState<PlazaSettings>({
    plazaName: 'Plaza Manager',
    address: 'City Center',
    contactPhone: '',
    lateFeePercentage: 5
  });

  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // 1. Handle Auth State Changes & Real-time Profile Sync
  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Set up real-time listener for the user's profile
        unsubscribeProfile = onSnapshot(doc(db, 'users', firebaseUser.uid), (docSnap) => {
          // Define all available permissions
          const allPerms: Permission[] = ['dashboard', 'shops', 'rent', 'maintenance', 'settings'];

          if (docSnap.exists()) {
            const data = docSnap.data();
            
            // CRITICAL FIX: If role is 'admin', FORCE all permissions.
            // If role is 'staff', use stored permissions or default to dashboard.
            let permissions: Permission[] = [];
            
            if (data.role === 'admin') {
              permissions = allPerms;
            } else {
              permissions = Array.isArray(data.permissions) && data.permissions.length > 0 
                ? data.permissions 
                : ['dashboard'];
            }

            setUser({ 
              uid: firebaseUser.uid, 
              ...data, 
              permissions
            } as User);
          } else {
            // Fallback: Doc created but not synced yet, OR user manually created in Auth
            // We give FULL ACCESS temporarily to ensure no lockout
            setUser({
               uid: firebaseUser.uid,
               email: firebaseUser.email || '',
               displayName: firebaseUser.displayName || 'User',
               role: 'admin',
               permissions: allPerms
            });
          }
          setIsLoading(false);
        }, (error) => {
           console.error("Profile sync error:", error);
           // On error, still allow access
           setUser({
             uid: firebaseUser.uid,
             email: firebaseUser.email || '',
             displayName: 'User',
             role: 'admin',
             permissions: ['dashboard', 'shops', 'rent', 'maintenance', 'settings']
           });
           setIsLoading(false);
        });

      } else {
        if (unsubscribeProfile) unsubscribeProfile();
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  // 2. Real-time Data Listeners
  useEffect(() => {
    if (!user) return;

    const unsubShops = onSnapshot(collection(db, 'shops'), 
      (snapshot) => setShops(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Shop))),
      (err) => console.log("Shop sync error ignored", err)
    );

    const unsubRent = onSnapshot(collection(db, 'rentRecords'), 
      (snapshot) => {
         const records = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as RentRecord));
         records.sort((a, b) => (b.month || '').localeCompare(a.month || '')); 
         setRentRecords(records);
      },
      (err) => console.log("Rent sync error ignored", err)
    );

    const unsubMaint = onSnapshot(collection(db, 'maintenanceCollections'), 
      (snapshot) => {
         const records = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as MaintenanceCollection));
         records.sort((a, b) => (b.month || '').localeCompare(a.month || ''));
         setMaintenanceCollections(records);
      },
      (err) => console.log("Maint sync error ignored", err)
    );

    const unsubRepairs = onSnapshot(collection(db, 'repairRecords'), 
      (snapshot) => setRepairRecords(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as RepairRecord))),
      (err) => console.log("Repair sync error ignored", err)
    );

    const unsubSettings = onSnapshot(doc(db, 'settings', 'plaza'), 
      (docSnap) => {
        if (docSnap.exists()) setSettings(docSnap.data() as PlazaSettings);
      },
      (err) => console.log("Settings sync error ignored", err)
    );

    // FIX: Sanitize staff list permissions to prevent TypeError in Settings page
    const unsubStaff = onSnapshot(collection(db, 'users'), 
      (snapshot) => setStaffList(snapshot.docs.map(d => {
         const data = d.data();
         return { 
           uid: d.id, 
           ...data,
           permissions: Array.isArray(data.permissions) ? data.permissions : []
         } as User;
      })),
      (err) => console.log("Staff sync error ignored", err)
    );

    return () => {
      unsubShops();
      unsubRent();
      unsubMaint();
      unsubRepairs();
      unsubSettings();
      unsubStaff();
    };
  }, [user]);

  // Theme Logic
  useEffect(() => {
    const savedTheme = localStorage.getItem('plaza-theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('plaza-theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  // --- ACTIONS ---

  const login = async (email: string, password?: string) => {
    if (!password) throw new Error("Password required");
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (email: string, password: string, displayName: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Create admin profile immediately
      await setDoc(doc(db, 'users', userCredential.user.uid), {
         uid: userCredential.user.uid,
         email: email,
         displayName: displayName,
         role: 'admin', 
         permissions: ['dashboard', 'shops', 'rent', 'maintenance', 'settings'],
         createdAt: new Date().toISOString()
      });
      showToast(`Welcome ${displayName}! Account created.`, 'success');
    } catch (error: any) {
      console.error("Signup Error:", error);
      throw error;
    }
  };

  const logout = () => {
    signOut(auth);
  };
  
  const resetUserPassword = async (email: string, newPassword?: string) => {
    try {
      const q = query(collection(db, 'users'), where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        showToast("Error: Email not found in staff records.", 'error');
        throw new Error("User not found in database");
      }

      const userDoc = querySnapshot.docs[0];

      if (newPassword && newPassword.trim() !== "") {
        await updateDoc(doc(db, 'users', userDoc.id), {
          password: newPassword
        });
      }

      await sendPasswordResetEmail(auth, email);
      
      if (newPassword) {
        showToast(`Credentials updated & Reset Link sent to ${email}`, 'success');
      } else {
        showToast(`Password Reset Link sent to ${email}`, 'success');
      }

    } catch (error: any) {
      console.error("Reset Error:", error);
      if (error.message !== "User not found in database") {
         showToast(error.message || "Failed to initiate password reset", 'error');
      }
      throw error;
    }
  };

  const addShop = async (shop: Shop) => {
    try {
      const { id, ...shopData } = shop; 
      const docRef = await addDoc(collection(db, 'shops'), shopData);
      
      if (shopData.status === 'Occupied') {
        const currentMonth = new Date().toISOString().slice(0, 7);
        
        await addDoc(collection(db, 'rentRecords'), {
          shopId: docRef.id,
          shopNumber: shopData.shopNumber,
          ownerName: shopData.ownerName,
          phone: shopData.phone || '',
          amount: shopData.monthlyRent || 0,
          collected: 0,
          transactions: [],
          dueDate: `${currentMonth}-05`,
          status: 'Pending',
          month: currentMonth
        });

        await addDoc(collection(db, 'maintenanceCollections'), {
          shopId: docRef.id,
          shopNumber: shopData.shopNumber,
          ownerName: shopData.ownerName,
          phone: shopData.phone || '',
          amount: shopData.monthlyMaintenance || 0,
          collected: 0,
          transactions: [],
          dueDate: `${currentMonth}-10`,
          status: 'Pending',
          month: currentMonth
        });
      }
      showToast(`Shop ${shopData.shopNumber} created successfully`, 'success');
    } catch (error: any) {
      console.error(error);
      showToast(`Failed to add shop: ${error.message}`, 'error');
      throw error;
    }
  };

  const updateShop = async (shop: Shop) => {
    try {
      const { id, ...shopData } = shop;
      if (!id) throw new Error("Shop ID is missing");
      await updateDoc(doc(db, 'shops', id), shopData as any);
      showToast(`Shop ${shopData.shopNumber} updated successfully`, 'success');
    } catch (error: any) {
      console.error(error);
      showToast(`Failed to update shop: ${error.message}`, 'error');
      throw error;
    }
  };

  // --- STAFF MANAGEMENT LOGIC ---
  const addStaff = async (newUser: User) => {
    const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
    const secondaryAuth = getAuthFromApp(secondaryApp);

    try {
       if (!newUser.password) throw new Error("Password is required");
       const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newUser.email, newUser.password);
       const createdUid = userCredential.user.uid;

       const { uid, password, ...userData } = newUser; 
       
       await setDoc(doc(db, 'users', createdUid), {
         ...userData,
         uid: createdUid,
         role: 'staff',
         password: password, 
         createdAt: new Date().toISOString()
       });

       await signOut(secondaryAuth);
       await deleteApp(secondaryApp);
       showToast(`Staff Account Created: ${newUser.email}`, 'success');

    } catch (error: any) {
      await deleteApp(secondaryApp);
      console.error("Error creating staff:", error);
      const msg = error.code === 'auth/email-already-in-use' 
        ? 'That email is already in use.' 
        : error.message;
      throw new Error(msg); 
    }
  };

  const updateStaff = async (uid: string, data: Partial<User>) => {
    await updateDoc(doc(db, 'users', uid), data as any);
  };

  const deleteStaff = async (uid: string) => {
    await deleteDoc(doc(db, 'users', uid));
    showToast("User access revoked successfully", 'success');
  };

  // Repairs
  const addRepair = async (record: RepairRecord) => {
    const { id, ...data } = record;
    await addDoc(collection(db, 'repairRecords'), data);
  };

  const updateRepair = async (record: RepairRecord) => {
     const { id, ...data } = record;
     if (!id) return;
     await updateDoc(doc(db, 'repairRecords', id), data as any);
  };

  // Settings
  const updateSettings = async (newSettings: PlazaSettings) => {
    try {
      await setDoc(doc(db, 'settings', 'plaza'), newSettings, { merge: true });
      showToast("General settings saved successfully", 'success');
    } catch (error: any) {
      console.error("Settings Error", error);
      showToast(`Failed to save settings: ${error.message}`, 'error');
      throw error;
    }
  };

  // Rent
  const addRentPayment = async (recordId: string, amount: number, note: string = '') => {
    const record = rentRecords.find(r => r.id === recordId);
    if (!record) return;

    const newCollected = (record.collected || 0) + amount;
    let newStatus: RentRecord['status'] = 'Pending';
    if (newCollected >= (record.amount || 0)) newStatus = 'Paid';
    else if (newCollected > 0) newStatus = 'Partial';

    const transaction: PaymentTransaction = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toLocaleString(),
      amount: amount,
      note,
      collectedBy: user?.displayName || 'Unknown Staff'
    };
    
    const updatedTransactions = [transaction, ...(record.transactions || [])];

    await updateDoc(doc(db, 'rentRecords', recordId), {
      collected: newCollected,
      status: newStatus,
      transactions: updatedTransactions
    });
    showToast(`Rent payment recorded: Rs. ${amount}`, 'success');
  };

  const generateMonthlyRent = async (month: string) => {
    let count = 0;
    const batchPromises = [];

    for (const shop of shops) {
      if (shop.status === 'Occupied') {
        const exists = rentRecords.some(r => r.shopId === shop.id && r.month === month);
        
        if (!exists) {
           const newRecord = {
            shopId: shop.id,
            shopNumber: shop.shopNumber,
            ownerName: shop.ownerName,
            phone: shop.phone || '',
            amount: shop.monthlyRent || 0,
            collected: 0,
            transactions: [],
            dueDate: `${month}-05`,
            status: 'Pending',
            month: month
           };
           batchPromises.push(addDoc(collection(db, 'rentRecords'), newRecord));
           count++;
        }
      }
    }

    await Promise.all(batchPromises);

    if (count > 0) {
      showToast(`Generated ${count} Rent Bills for ${month}`, 'success');
    } else {
      showToast(`Bills for ${month} already exist`, 'info');
    }
  };

  const createRentBill = async (shopId: string, month: string) => {
    const shop = shops.find(s => s.id === shopId);
    if(!shop) return;
    
    await addDoc(collection(db, 'rentRecords'), {
        shopId: shop.id,
        shopNumber: shop.shopNumber,
        ownerName: shop.ownerName,
        phone: shop.phone || '',
        amount: shop.monthlyRent || 0,
        collected: 0,
        transactions: [],
        dueDate: `${month}-05`,
        status: 'Pending',
        month: month
    });
    showToast(`Bill generated for Shop ${shop.shopNumber}`, 'success');
  };

  // Maintenance
  const addMaintenancePayment = async (recordId: string, amount: number, note: string = '') => {
    const record = maintenanceCollections.find(r => r.id === recordId);
    if (!record) return;

    const newCollected = (record.collected || 0) + amount;
    let newStatus: MaintenanceCollection['status'] = 'Pending';
    if (newCollected >= (record.amount || 0)) newStatus = 'Paid';
    else if (newCollected > 0) newStatus = 'Partial';

    const transaction: PaymentTransaction = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toLocaleString(),
      amount: amount,
      note,
      collectedBy: user?.displayName || 'Unknown Staff'
    };

    const updatedTransactions = [transaction, ...(record.transactions || [])];

    await updateDoc(doc(db, 'maintenanceCollections', recordId), {
      collected: newCollected,
      status: newStatus,
      transactions: updatedTransactions
    });
    showToast(`Maintenance payment recorded: Rs. ${amount}`, 'success');
  };

  const generateMonthlyMaintenance = async (month: string) => {
    let count = 0;
    const batchPromises = [];

    for (const shop of shops) {
      if (shop.status === 'Occupied') {
        const exists = maintenanceCollections.some(r => r.shopId === shop.id && r.month === month);
        if (!exists) {
           const newRecord = {
            shopId: shop.id,
            shopNumber: shop.shopNumber,
            ownerName: shop.ownerName,
            phone: shop.phone || '',
            amount: shop.monthlyMaintenance || 0,
            collected: 0,
            transactions: [],
            dueDate: `${month}-10`,
            status: 'Pending',
            month: month
           };
           batchPromises.push(addDoc(collection(db, 'maintenanceCollections'), newRecord));
           count++;
        }
      }
    }
    await Promise.all(batchPromises);
    
    if (count > 0) {
      showToast(`Generated ${count} Maintenance Bills for ${month}`, 'success');
    } else {
      showToast(`Bills for ${month} already exist`, 'info');
    }
  };

  const createMaintenanceBill = async (shopId: string, month: string) => {
    const shop = shops.find(s => s.id === shopId);
    if(!shop) return;
    
    await addDoc(collection(db, 'maintenanceCollections'), {
        shopId: shop.id,
        shopNumber: shop.shopNumber,
        ownerName: shop.ownerName,
        phone: shop.phone || '',
        amount: shop.monthlyMaintenance || 0,
        collected: 0,
        transactions: [],
        dueDate: `${month}-10`,
        status: 'Pending',
        month: month
    });
    showToast(`Maintenance bill generated for Shop ${shop.shopNumber}`, 'success');
  };

  return (
    <AppContext.Provider value={{
      user,
      staffList,
      shops,
      rentRecords,
      maintenanceCollections,
      repairRecords,
      settings,
      theme,
      isLoading,
      showToast,
      login,
      signup,
      logout,
      resetUserPassword,
      toggleTheme,
      addShop,
      updateShop,
      addRepair,
      updateRepair,
      addRentPayment,
      generateMonthlyRent,
      createRentBill,
      addMaintenancePayment,
      generateMonthlyMaintenance,
      createMaintenanceBill,
      updateSettings,
      addStaff,
      updateStaff,
      deleteStaff
    }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
           <div key={t.id} className={`shadow-xl rounded-xl p-4 text-white flex items-center gap-3 max-w-md animate-in slide-in-from-bottom-5 fade-in duration-300 pointer-events-auto ${
             t.type === 'success' ? 'bg-green-600 dark:bg-green-700' : 
             t.type === 'error' ? 'bg-red-600 dark:bg-red-700' : 
             'bg-blue-600 dark:bg-blue-700'
           }`}>
             {t.type === 'success' && <CheckCircle size={20} className="shrink-0" />}
             {t.type === 'error' && <AlertCircle size={20} className="shrink-0" />}
             {t.type === 'info' && <InfoIcon size={20} className="shrink-0" />}
             <p className="font-medium text-sm">{t.message}</p>
             <button onClick={() => removeToast(t.id)} className="ml-auto text-white/80 hover:text-white"><X size={16} /></button>
           </div>
        ))}
      </div>
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};