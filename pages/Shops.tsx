import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Search, Plus, MapPin, DollarSign, Wrench, Phone, Mail, MoreHorizontal, Edit, Trash2, X } from 'lucide-react';
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
      // Context uses re-throw, so we catch here to prevent crash but use the error message
      // Note: Context already toasts the error, so avoiding double toast unless needed.
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Shops</h2>
          <p className="text-gray-500 dark:text-gray-400">Manage shops and owners.</p>
        </div>
        <button 
          onClick={handleOpenAddModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center space-x-2"
          title="Add a new shop"
        >
          <Plus size={18} />
          <span>Add New Shop</span>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row gap-4 transition-colors">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text"
            placeholder="Search shop # or owner..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
          {(['All', 'Occupied', 'Vacant'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === f 
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredShops.map(shop => (
          <div key={shop.id} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 transition-all group relative">
            <div className="flex justify-between items-start mb-3 gap-3">
              <div className="flex items-start space-x-3 flex-1 min-w-0">
                {/* Responsive Shop Number Badge */}
                <div className={`min-w-[2.5rem] max-w-[6rem] sm:max-w-[8rem] h-auto px-2 py-1 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs border mt-0.5 break-words text-center leading-tight ${
                  shop.status === 'Occupied' 
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600'
                }`}>
                  {shop.shopNumber}
                </div>
                {/* Flexible Content Area with break-words */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 dark:text-white break-words leading-tight mb-1 text-base">{shop.ownerName || 'No Owner'}</h3>
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-1">
                    <MapPin size={12} className="shrink-0" />
                    <span className="truncate">Floor {shop.floor}</span>
                  </div>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ml-auto ${
                shop.status === 'Occupied' 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}>
                {shop.status}
              </span>
            </div>

            <div className="space-y-2 mt-4 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
              <div className="flex justify-between text-sm items-center">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1"><DollarSign size={14}/> Rent</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">Rs. {(shop.monthlyRent || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1"><Wrench size={14}/> Maintenance</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">Rs. {(shop.monthlyMaintenance || 0).toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-3 space-y-1">
                {shop.phone && (
                   <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 gap-2">
                      <Phone size={12} className="shrink-0" /> <span className="truncate">{shop.phone}</span>
                   </div>
                )}
                {shop.email && (
                   <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 gap-2">
                      <Mail size={12} className="shrink-0" /> <span className="truncate">{shop.email}</span>
                   </div>
                )}
            </div>
            
            <div className="mt-4 pt-2 border-t border-gray-100 dark:border-gray-700 flex justify-end relative">
               <button 
                  onClick={(e) => { 
                      e.stopPropagation(); 
                      setActiveMenuId(activeMenuId === shop.id ? null : shop.id); 
                  }}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="More actions"
               >
                   <MoreHorizontal size={20} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"/>
               </button>

               {activeMenuId === shop.id && (
                 <div ref={menuRef} className="absolute right-0 bottom-8 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 py-1 z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <button 
                       onClick={() => handleOpenEditModal(shop)}
                       className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                       title="Edit shop details"
                    >
                       <Edit size={16} className="text-blue-500" /> Edit Details
                    </button>
                    {/* Add more actions here if needed */}
                 </div>
               )}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] transition-colors">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 shrink-0">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                {editingId ? 'Edit Shop Details' : 'Add New Shop'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveShop} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Shop Number</label>
                  <input required type="text" className="w-full p-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors" 
                    value={newShop.shopNumber} onChange={e => setNewShop({...newShop, shopNumber: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Floor</label>
                  <input 
                    required 
                    type="number" 
                    className="w-full p-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                    value={newShop.floor} 
                    onFocus={(e) => e.target.select()}
                    onChange={e => setNewShop({...newShop, floor: e.target.value === '' ? '' : Number(e.target.value) as any})} 
                    placeholder="e.g. 1" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Owner Name</label>
                <input required type="text" className="w-full p-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors" 
                  value={newShop.ownerName} onChange={e => setNewShop({...newShop, ownerName: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                  <input required type="tel" className="w-full p-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors" 
                    value={newShop.phone} onChange={e => setNewShop({...newShop, phone: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email (Optional)</label>
                  <input type="email" className="w-full p-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors" 
                    value={newShop.email} onChange={e => setNewShop({...newShop, email: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div>
                  <label className="block text-sm font-bold text-blue-800 dark:text-blue-300 mb-1">Rent (Rs)</label>
                  <input 
                    required 
                    type="number" 
                    className="w-full p-2.5 border border-blue-200 dark:border-blue-800 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors" 
                    value={newShop.monthlyRent} 
                    onFocus={(e) => e.target.select()}
                    onChange={e => setNewShop({...newShop, monthlyRent: e.target.value === '' ? '' : Number(e.target.value) as any})} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-blue-800 dark:text-blue-300 mb-1">Maint (Rs)</label>
                  <input 
                    required 
                    type="number" 
                    className="w-full p-2.5 border border-blue-200 dark:border-blue-800 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors" 
                    value={newShop.monthlyMaintenance} 
                    onFocus={(e) => e.target.select()}
                    onChange={e => setNewShop({...newShop, monthlyMaintenance: e.target.value === '' ? '' : Number(e.target.value) as any})} 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <div className="flex space-x-4">
                   <label className="flex items-center space-x-2 cursor-pointer text-gray-700 dark:text-gray-300">
                    <input type="radio" name="status" checked={newShop.status === 'Occupied'} onChange={() => setNewShop({...newShop, status: 'Occupied'})} className="text-blue-600 focus:ring-blue-500" />
                    <span>Occupied</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer text-gray-700 dark:text-gray-300">
                    <input type="radio" name="status" checked={newShop.status === 'Vacant'} onChange={() => setNewShop({...newShop, status: 'Vacant'})} className="text-blue-600 focus:ring-blue-500" />
                    <span>Vacant</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex gap-3 shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-md">
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