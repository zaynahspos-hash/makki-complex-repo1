import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Save, Building, MapPin, Percent, Users, UserPlus, Trash2, Key, Shield, Loader2, Mail, Check, Edit, Info, Store, Facebook, Instagram, Youtube, User as UserIcon, AlertTriangle, X, Phone, Settings as SettingsIcon } from 'lucide-react';
import { Permission, User } from '../types';

// Custom SVG Icons for Brands not in Lucide
const TikTokIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.687a8.182 8.182 0 0 0 4.773 1.526V6.79a4.831 4.831 0 0 1-1.003-.104z"/>
  </svg>
);

const SnapchatIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M12.003 2c-2.88 0-5.46 1.488-5.46 4.314 0 2.222 1.638 3.318 1.593 4.152-.042.756-1.572.822-1.572 2.37 0 1.296 1.482 1.356 1.05 2.322-.642 1.41-3.666 1.134-3.666 3.12 0 1.032.96 1.632 2.766 1.956 1.398.252 2.928-.27 3.636-.456.666-.174 1.092-.126 1.656 0 .708.186 2.238.708 3.636.456 1.806-.324 2.766-.924 2.766-1.956 0-1.986-3.024-1.71-3.666-3.12-.432-.966 1.05-1.026 1.05-2.322 0-1.548-1.53-1.614-1.572-2.37-.042-.834 1.596-1.932 1.596-4.152C17.463 3.488 14.883 2 12.003 2z"/>
  </svg>
);

const WhatsAppIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23-1.48 0-2.93-.39-4.19-1.15l-.3-.18-3.12.82.83-3.04-.19-.31a8.173 8.173 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24M16.53 14.3c-.23-.11-1.36-.67-1.57-.75-.21-.08-.36-.12-.51.12-.15.25-.59.75-.72.9-.14.15-.26.17-.49.06-.23-.11-.97-.36-1.85-1.14-.69-.6-1.16-1.35-1.29-1.58-.13-.23-.01-.36.1-.47.1-.1.23-.26.35-.4.11-.13.15-.22.23-.37.08-.15.04-.28-.02-.4-.06-.12-.51-1.23-.7-1.69-.19-.45-.38-.39-.52-.4h-.44c-.15 0-.4.06-.61.29-.21.23-.79.77-.79 1.88 0 1.11.81 2.18.92 2.33.11.15 1.59 2.43 3.85 3.4.54.23.96.37 1.29.47.55.18 1.06.15 1.46.09.45-.06 1.36-.56 1.55-1.1.19-.54.19-1 .13-1.1-.06-.11-.22-.17-.45-.29" />
  </svg>
);

const Settings = () => {
  const { user, settings, updateSettings, staffList, addStaff, deleteStaff, updateStaff, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<'general' | 'staff' | 'info'>('general');
  
  // General Form
  const [formData, setFormData] = useState({ ...settings });
  
  // Staff Form
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [newStaff, setNewStaff] = useState<Partial<User>>({
    email: '',
    password: '',
    displayName: '',
    role: 'staff',
    permissions: ['dashboard', 'rent', 'maintenance']
  });
  const [isStaffLoading, setIsStaffLoading] = useState(false);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings(formData);
    } catch (e) {
      // Toast handled in context
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsStaffLoading(true);
    try {
      await addStaff(newStaff as User);
      setIsStaffModalOpen(false);
      setNewStaff({ email: '', password: '', displayName: '', role: 'staff', permissions: ['dashboard'] });
    } catch (e) {
      showToast("Failed to add staff member.", 'error');
    } finally {
      setIsStaffLoading(false);
    }
  };

  const togglePermission = (perm: Permission) => {
    setNewStaff(prev => {
      const perms = prev.permissions || [];
      if (perms.includes(perm)) {
        return { ...prev, permissions: perms.filter(p => p !== perm) };
      } else {
        return { ...prev, permissions: [...perms, perm] };
      }
    });
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Settings</h2>
          <p className="text-gray-500 dark:text-gray-400">Configure your plaza application.</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-gray-200 dark:border-gray-700">
         <button 
           onClick={() => setActiveTab('general')} 
           className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${activeTab === 'general' ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-gray-800' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
         >
           <div className="flex items-center gap-2"><SettingsIcon size={16}/> General Settings</div>
         </button>
         {user?.role === 'admin' && (
           <button 
             onClick={() => setActiveTab('staff')} 
             className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${activeTab === 'staff' ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-gray-800' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
           >
             <div className="flex items-center gap-2"><Users size={16}/> Staff Management</div>
           </button>
         )}
         <button 
           onClick={() => setActiveTab('info')} 
           className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${activeTab === 'info' ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-gray-800' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
         >
           <div className="flex items-center gap-2"><Info size={16}/> App Info</div>
         </button>
      </div>

      {activeTab === 'general' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 animate-in fade-in duration-300">
          <form onSubmit={handleSaveSettings} className="space-y-6 max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Building size={16} /> Plaza Name
                </label>
                <input 
                  type="text" 
                  value={formData.plazaName}
                  onChange={(e) => setFormData({...formData, plazaName: e.target.value})}
                  className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <MapPin size={16} /> Address
                </label>
                <input 
                  type="text" 
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Phone size={16} /> Contact Phone
                </label>
                <input 
                  type="text" 
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({...formData, contactPhone: e.target.value})}
                  className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Percent size={16} /> Late Fee Percentage
                </label>
                <input 
                  type="number" 
                  value={formData.lateFeePercentage}
                  onChange={(e) => setFormData({...formData, lateFeePercentage: Number(e.target.value)})}
                  className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 dark:shadow-none flex items-center gap-2"
            >
              <Save size={18} /> Save Changes
            </button>
          </form>
        </div>
      )}

      {activeTab === 'staff' && user?.role === 'admin' && (
        <div className="space-y-6 animate-in fade-in duration-300">
           <div className="flex justify-end">
              <button 
                 onClick={() => setIsStaffModalOpen(true)}
                 className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 shadow-md transition-colors"
              >
                 <UserPlus size={18} /> Add New Staff
              </button>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {staffList.map(staff => (
                 <div key={staff.uid} className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm relative group">
                    <div className="flex justify-between items-start mb-4">
                       <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg ${staff.role === 'admin' ? 'bg-purple-500' : 'bg-blue-500'}`}>
                             {staff.displayName?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div>
                             <h4 className="font-bold text-gray-900 dark:text-white">{staff.displayName}</h4>
                             <p className="text-xs text-gray-500 dark:text-gray-400">{staff.email}</p>
                          </div>
                       </div>
                       <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${staff.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {staff.role}
                       </span>
                    </div>
                    
                    <div className="mb-4">
                       <p className="text-xs font-semibold text-gray-400 mb-2 uppercase">Permissions</p>
                       <div className="flex flex-wrap gap-2">
                          {Array.isArray(staff.permissions) && staff.permissions.map(p => (
                             <span key={p} className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded text-xs capitalize border border-gray-200 dark:border-gray-600">
                                {p}
                             </span>
                          ))}
                          {(!Array.isArray(staff.permissions) || staff.permissions.length === 0) && <span className="text-gray-400 text-xs italic">No access</span>}
                       </div>
                    </div>

                    {staff.uid !== user?.uid && (
                        <button 
                           onClick={() => { if(confirm("Are you sure? This user will lose access.")) deleteStaff(staff.uid); }}
                           className="w-full py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex items-center justify-center gap-2"
                        >
                           <Trash2 size={16} /> Revoke Access
                        </button>
                    )}
                 </div>
              ))}
           </div>
        </div>
      )}

      {activeTab === 'info' && (
         <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center">
                <div className="w-24 h-24 mx-auto mb-6">
                   <img src="https://res.cloudinary.com/dguw4vfjc/image/upload/v1770670391/shme3oddvvyl7nmcyup5.webp" alt="Plaza Logo" className="w-full h-full object-cover rounded-2xl shadow-md" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Plaza Manager</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-8">Version 1.2.0 • Build 2024</p>

                <div className="max-w-md mx-auto bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-100 dark:border-gray-600">
                   <h4 className="font-bold text-gray-800 dark:text-white mb-1">Zaynahs Developers</h4>
                   <p className="text-sm text-blue-600 dark:text-blue-400 mb-4 font-medium">Developer: Mehar Shoaib</p>
                   
                   <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 italic">
                      "App made for Amir Sahab with love ❤️"
                   </p>
                   
                   <div className="flex justify-center gap-4">
                      <a href="https://wa.me/923000000000" target="_blank" rel="noreferrer" className="p-3 bg-green-100 hover:bg-green-200 text-green-700 rounded-full transition-colors" title="WhatsApp">
                         <WhatsAppIcon size={24} />
                      </a>
                      <a href="mailto:dev@shoaib.com" className="p-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full transition-colors" title="Email">
                         <Mail size={24} />
                      </a>
                      <a href="#" className="p-3 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full transition-colors" title="Facebook">
                         <Facebook size={24} />
                      </a>
                      <a href="#" className="p-3 bg-pink-100 hover:bg-pink-200 text-pink-700 rounded-full transition-colors" title="Instagram">
                         <Instagram size={24} />
                      </a>
                      <a href="https://www.tiktok.com/@shoaibzaynahh" target="_blank" rel="noreferrer" className="p-3 bg-black hover:bg-gray-800 text-white rounded-full transition-colors" title="TikTok">
                         <TikTokIcon size={24} />
                      </a>
                   </div>
                </div>
            </div>
         </div>
      )}

      {/* ADD STAFF MODAL */}
      {isStaffModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
               <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white">Add New Staff Member</h3>
                  <button onClick={() => setIsStaffModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
               </div>
               
               <form onSubmit={handleAddStaff} className="p-6 space-y-4 overflow-y-auto">
                  <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                     <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input required type="text" className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Staff Name"
                           value={newStaff.displayName} onChange={e => setNewStaff({...newStaff, displayName: e.target.value})} />
                     </div>
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                     <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input required type="email" className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="staff@plaza.com"
                           value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value})} />
                     </div>
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                     <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input required type="password" className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Min 6 characters"
                           value={newStaff.password} onChange={e => setNewStaff({...newStaff, password: e.target.value})} />
                     </div>
                  </div>
                  
                  <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Access Permissions</label>
                     <div className="grid grid-cols-2 gap-2">
                        {(['shops', 'rent', 'maintenance'] as const).map(p => (
                           <label key={p} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${newStaff.permissions?.includes(p) ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300' : 'bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400'}`}>
                              <input type="checkbox" className="hidden" checked={newStaff.permissions?.includes(p)} onChange={() => togglePermission(p)} />
                              {newStaff.permissions?.includes(p) ? <Check size={16} /> : <div className="w-4 h-4"/>}
                              <span className="capitalize font-medium">{p}</span>
                           </label>
                        ))}
                     </div>
                     <p className="text-xs text-gray-400 mt-2">* Dashboard access is granted by default.</p>
                  </div>

                  <button 
                     type="submit" 
                     disabled={isStaffLoading}
                     className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                     {isStaffLoading ? <Loader2 className="animate-spin" /> : 'Create Account'}
                  </button>
               </form>
            </div>
         </div>
      )}
    </div>
  );
};

export default Settings;