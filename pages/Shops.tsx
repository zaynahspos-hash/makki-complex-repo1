import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Search, Plus, MapPin, DollarSign, Wrench, Phone, Mail, MoreHorizontal, Edit, Trash2, X, Store } from 'lucide-react';
import { Shop } from '../types';

const Shops = () => {
  const { shops, addShop, updateShop, showToast } = useApp();
  const [filter, setFilter] = useState<'All' | 'Occupied' | 'Vacant'>('All');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Menu State
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Form State
  const [newShop, setNewShop] = useState<Partial<Shop> & { monthlyRent: number | string, monthlyMaintenance: number | string, floor: number | string }>({
    shopNumber: '',
    floor: 1,
    ownerName: '',
    phone: '',
    email: '',
    status: 'Occupied',
    monthlyRent: 0,
    monthlyMaintenance: 0
  });

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredShops = shops.filter(shop => {
    const matchesFilter = filter === 'All' || shop.status === filter;
    const matchesSearch = shop.shopNumber.toLowerCase().includes(search.toLowerCase()) || 
                          shop.ownerName.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleOpenAddModal = () => {
    setEditingId(null);
    setNewShop({
        shopNumber: '',
        floor: 1,
        ownerName: '',
        phone: '',
        email: '',
        status: 'Occupied',
        monthlyRent: 0,
        monthlyMaintenance: 0
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (shop: Shop) => {
    setEditingId(shop.id);
    setNewShop({ ...shop });
    setActiveMenuId(null);
    setIsModalOpen(true);
  };

  const handleSaveShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShop.shopNumber || !newShop.ownerName) return;
    
    // Convert numeric fields back to pure numbers for saving (default to 0 if empty string)
    const shopToSave = {
       ...newShop,
       floor: Number(newShop.floor) || 0,
       monthlyRent: Number(newShop.monthlyRent) || 0,
       monthlyMaintenance: Number(newShop.monthlyMaintenance) || 0,
    };

    try {
      if (editingId) {
          await updateShop({ ...shopToSave, id: editingId } as Shop);
          // Success message handled in context
      } else {
          await addShop({
              id: Math.random().toString(36).substr(2, 9),
              ...shopToSave as Shop
          });
          // Success message handled in context
      }

      setIsModalOpen(false);
      setNewShop({ 
        shopNumber: '', 
        floor: 1, 
        ownerName: '', 
        phone: '', 
        email: '', 
        status: 'Occupied', 
        monthlyRent: 0, 
        monthlyMaintenance: 0 
      });
      setEditingId(null);
    } catch (error: any) {
      // Error is logged in context, but we ensure UI reflects failure if context doesn't catch all
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Shops & Units</h2>
          <p className="text-gray-500 dark:text-gray-400">Manage directory and ownership.</p>
        </div>
        <button 
          onClick={handleOpenAddModal}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 dark:shadow-none flex items-center justify-center gap-2"
        >
          <Plus size={18} /> Add New Shop
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row gap-4 transition-colors">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text"
            placeholder="Search shop #, owner..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg shrink-0">
          {(['All', 'Occupied', 'Vacant'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                filter === f 
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredShops.map(shop => (
          <div key={shop.id} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all group relative flex flex-col h-full">
            
            <div className="flex justify-between items-start mb-4">
               <div className="flex items-center gap-4 w-full">
                  <div className={`h-14 min-w-[3.5rem] w-auto px-2 rounded-xl flex items-center justify-center font-bold text-lg border shadow-sm shrink-0 ${
                      shop.status === 'Occupied' 
                      ? 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' 
                      : 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-500 dark:border-gray-700'
                  }`}>
                    <span className="truncate max-w-[100px]">{shop.shopNumber}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate" title={shop.ownerName || 'No Owner'}>{shop.ownerName || 'No Owner'}</h3>
                    <div className="flex items-center text-xs font-medium text-gray-500 dark:text-gray-400 mt-1 gap-3">
                       <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300 shrink-0">
                          <MapPin size={10} /> Floor {shop.floor}
                       </span>
                    </div>
                  </div>
               </div>
               
               {/* Fixed: Grouped Status and Menu Button side-by-side to prevent overlap */}
               <div className="flex items-center gap-2 ml-2 shrink-0">
                   <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                     shop.status === 'Occupied' 
                       ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900' 
                       : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600'
                   }`}>
                     {shop.status}
                   </span>

                   <div className="relative">
                      <button 
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            setActiveMenuId(activeMenuId === shop.id ? null : shop.id); 
                        }}
                        className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                      >
                         <MoreHorizontal size={20} />
                      </button>
                      
                      {activeMenuId === shop.id && (
                        <div ref={menuRef} className="absolute right-0 top-8 w-40 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-1.5 z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                            <button 
                              onClick={() => handleOpenEditModal(shop)}
                              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 font-medium"
                            >
                              <Edit size={16} className="text-blue-500" /> Edit Details
                            </button>
                        </div>
                      )}
                   </div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-gray-50 dark:bg-gray-700/30 p-3 rounded-xl mb-4 border border-gray-100 dark:border-gray-700/50">
               <div className="space-y-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1"><DollarSign size={12}/> Rent</p>
                  <p className="font-bold text-gray-900 dark:text-white">Rs. {(shop.monthlyRent || 0).toLocaleString()}</p>
               </div>
               <div className="space-y-1 border-l border-gray-200 dark:border-gray-600 pl-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1"><Wrench size={12}/> Maint.</p>
                  <p className="font-bold text-gray-900 dark:text-white">Rs. {(shop.monthlyMaintenance || 0).toLocaleString()}</p>
               </div>
            </div>

            <div className="mt-auto space-y-2">
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 gap-2 bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-100 dark:border-gray-700/50">
                    <Phone size={14} className="shrink-0 text-blue-500" /> 
                    <span className="truncate font-medium">{shop.phone || 'No phone'}</span>
                </div>
                {shop.email && (
                   <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 gap-2 bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-100 dark:border-gray-700/50">
                      <Mail size={14} className="shrink-0 text-purple-500" /> 
                      <span className="truncate font-medium">{shop.email}</span>
                   </div>
                )}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] transition-colors animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 shrink-0">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Store size={20} className="text-blue-600"/>
                {editingId ? 'Edit Shop Details' : 'Add New Shop'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-gray-200 dark:bg-gray-600 rounded-full p-1">
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleSaveShop} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Shop Number</label>
                  <input required type="text" className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors font-medium" 
                    value={newShop.shopNumber} onChange={e => setNewShop({...newShop, shopNumber: e.target.value})} placeholder="e.g. 101" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Floor Level</label>
                  <input 
                    required 
                    type="number" 
                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors font-medium"
                    value={newShop.floor} 
                    onFocus={(e) => e.target.select()}
                    onChange={e => setNewShop({...newShop, floor: e.target.value === '' ? '' : Number(e.target.value) as any})} 
                    placeholder="e.g. 1" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Owner Name</label>
                <input required type="text" className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors font-medium" 
                  value={newShop.ownerName} onChange={e => setNewShop({...newShop, ownerName: e.target.value})} placeholder="Full Name" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Phone</label>
                  <input required type="tel" className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors font-medium" 
                    value={newShop.phone} onChange={e => setNewShop({...newShop, phone: e.target.value})} placeholder="0300..." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Email (Opt)</label>
                  <input type="email" className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors font-medium" 
                    value={newShop.email} onChange={e => setNewShop({...newShop, email: e.target.value})} placeholder="@gmail.com" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                <div>
                  <label className="block text-xs font-bold text-blue-800 dark:text-blue-300 uppercase mb-1">Rent Amount</label>
                  <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rs.</span>
                      <input 
                        required 
                        type="number" 
                        className="w-full pl-10 pr-3 py-2.5 border border-blue-200 dark:border-blue-800 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors font-bold" 
                        value={newShop.monthlyRent} 
                        onFocus={(e) => e.target.select()}
                        onChange={e => setNewShop({...newShop, monthlyRent: e.target.value === '' ? '' : Number(e.target.value) as any})} 
                      />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-blue-800 dark:text-blue-300 uppercase mb-1">Maint. Amount</label>
                  <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rs.</span>
                      <input 
                        required 
                        type="number" 
                        className="w-full pl-10 pr-3 py-2.5 border border-blue-200 dark:border-blue-800 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors font-bold" 
                        value={newShop.monthlyMaintenance} 
                        onFocus={(e) => e.target.select()}
                        onChange={e => setNewShop({...newShop, monthlyMaintenance: e.target.value === '' ? '' : Number(e.target.value) as any})} 
                      />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Occupancy Status</label>
                <div className="flex space-x-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
                   <label className={`flex-1 text-center py-2 rounded-lg text-sm font-medium cursor-pointer transition-all ${newShop.status === 'Occupied' ? 'bg-white dark:bg-gray-600 shadow-sm text-green-700 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    <input type="radio" name="status" checked={newShop.status === 'Occupied'} onChange={() => setNewShop({...newShop, status: 'Occupied'})} className="hidden" />
                    Occupied
                  </label>
                  <label className={`flex-1 text-center py-2 rounded-lg text-sm font-medium cursor-pointer transition-all ${newShop.status === 'Vacant' ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-700 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                    <input type="radio" name="status" checked={newShop.status === 'Vacant'} onChange={() => setNewShop({...newShop, status: 'Vacant'})} className="hidden" />
                    Vacant
                  </label>
                </div>
              </div>

              <div className="pt-4 flex gap-3 shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border border-gray-200 dark:border-gray-600 rounded-xl font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-none transition-colors">
                    {editingId ? 'Update Shop' : 'Create Shop'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Shops;