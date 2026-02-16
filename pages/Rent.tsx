
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { DollarSign, CheckCircle, AlertCircle, Clock, CalendarPlus, MessageCircle, Wallet, History, Search, Filter, User, Calendar, ChevronDown, ChevronUp, Download, FilePlus, Check } from 'lucide-react';
import { RentRecord, PaymentTransaction } from '../types';

const Rent = () => {
  const { rentRecords, shops, addRentPayment, generateMonthlyRent, createRentBill, settings, showToast } = useApp();
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Modals State
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<RentRecord | null>(null);
  
  // Export State
  const [exportConfig, setExportConfig] = useState({
    startMonth: new Date().toISOString().slice(0, 7),
    endMonth: new Date().toISOString().slice(0, 7),
    format: 'csv'
  });
  const [exportSelectedShops, setExportSelectedShops] = useState<string[]>(['all']);
  
  // Advanced Search State for Export Modal
  const [exportShopSearch, setExportShopSearch] = useState('');

  // History View State
  const [historyYear, setHistoryYear] = useState<string>(new Date().getFullYear().toString());
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  // Payment Form State
  const [payForm, setPayForm] = useState<{ amount: number | string, note: string }>({ amount: 0, note: '' });

  // Filter Logic
  const occupiedShops = shops.filter(s => s.status === 'Occupied');
  
  const processedList = occupiedShops.map(shop => {
     const record = rentRecords.find(r => r.shopId === shop.id && r.month === selectedMonth);
     return {
        shop,
        record, 
        status: record ? record.status : 'Not Generated'
     };
  });

  const filteredList = processedList.filter(item => {
    const { shop, record } = item;
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      shop.shopNumber.toLowerCase().includes(query) ||
      shop.ownerName.toLowerCase().includes(query) ||
      shop.phone.includes(query);

    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const filteredExportShops = shops.filter(shop => {
     const query = exportShopSearch.toLowerCase();
     return shop.shopNumber.toLowerCase().includes(query) || 
            shop.ownerName.toLowerCase().includes(query) ||
            shop.phone.includes(query);
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Paid': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800';
      case 'Partial': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'Pending': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
      case 'Overdue': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
      case 'Not Generated': return 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 border-gray-200';
    }
  };

  const formatDate = (dateStr: string) => {
    if(!dateStr) return '';
    const [y, m] = dateStr.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const formatFloor = (floor: string) => {
    if (floor === 'Basement' || floor === 'Lower Ground') return 'Lower Ground';
    if (floor === 'Ground') return 'Ground Floor';
    return `Floor ${floor}`;
  };

  const handleGenerateDues = () => {
    if(confirm(`Generate RENT bills for all occupied shops for ${formatDate(selectedMonth)}?`)) {
        generateMonthlyRent(selectedMonth);
    }
  };

  const handleCreateSingleBill = async (shopId: string) => {
     await createRentBill(shopId, selectedMonth);
  };

  const toggleShopSelection = (shopId: string) => {
     if (shopId === 'all') {
       if (exportSelectedShops.includes('all')) setExportSelectedShops([]); 
       else setExportSelectedShops(['all']); 
     } else {
       let newSelection = [...exportSelectedShops];
       if (newSelection.includes('all')) newSelection = []; 
       if (newSelection.includes(shopId)) newSelection = newSelection.filter(id => id !== shopId);
       else newSelection.push(shopId);
       setExportSelectedShops(newSelection);
     }
  };

  const handleExport = () => {
    const dataToExport = rentRecords.filter(r => {
      if (!r.month) return false;
      const inDateRange = r.month >= exportConfig.startMonth && r.month <= exportConfig.endMonth;
      const isAllSelected = exportSelectedShops.includes('all');
      const matchesShop = isAllSelected || exportSelectedShops.includes(r.shopId);
      return inDateRange && matchesShop;
    });

    if (dataToExport.length === 0) {
      showToast("No records found for the selected criteria.", 'error');
      return;
    }

    const headers = ['Month', 'Shop No', 'Owner', 'Phone', 'Total Due', 'Collected', 'Balance', 'Status', 'Due Date', 'Transactions'];
    const csvRows = dataToExport.map(r => {
      const balance = (r.amount || 0) - (r.collected || 0);
      const txDetails = (r.transactions || []).map(t => `${t.date} (Rs.${t.amount}) by ${t.collectedBy}`).join('; ');
      return [
        r.month, r.shopNumber, `"${r.ownerName}"`, r.phone, r.amount, r.collected, balance, r.status, r.dueDate, `"${txDetails}"`
      ].join(',');
    });

    const csvString = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `rent_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportModalOpen(false);
    showToast("Rent report downloaded successfully", 'success');
  };

  const openPayModal = (record: RentRecord) => {
    setSelectedRecord(record);
    setPayForm({
      amount: Math.max(0, (record.amount || 0) - (record.collected || 0)),
      note: ''
    });
    setIsPayModalOpen(true);
  };

  const openHistoryModal = (record: RentRecord) => {
    setSelectedRecord(record);
    if(record.month) setHistoryYear(record.month.split('-')[0]);
    setIsHistoryModalOpen(true);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRecord) {
      addRentPayment(selectedRecord.id, Number(payForm.amount), payForm.note);
      setIsPayModalOpen(false);
    }
  };

  const sendWhatsApp = (record: RentRecord, transaction?: PaymentTransaction) => {
    if (!record.phone) {
      showToast("No phone number registered for this shop owner.", 'error');
      return;
    }
    const remaining = (record.amount || 0) - (record.collected || 0);
    const text = `*${settings.plazaName} - RENT STATUS*\nShop: ${record.shopNumber} (${record.ownerName})\nMonth: ${formatDate(record.month)}\n\n*Total Due: Rs. ${(record.amount || 0).toLocaleString()}*\nPaid: Rs. ${(record.collected || 0).toLocaleString()}\n*Balance: Rs. ${(remaining || 0).toLocaleString()}*\n\nStatus: ${record.status.toUpperCase()}`;
    window.open(`https://wa.me/${record.phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shopHistory = useMemo(() => {
    if (!selectedRecord) return { years: [], recordsByYear: {} };
    const allRecords = rentRecords.filter(r => r.shopId === selectedRecord.shopId);
    const recordsByYear: Record<string, RentRecord[]> = {};
    allRecords.forEach(r => {
      if(!r.month) return;
      const y = r.month.split('-')[0];
      if (!recordsByYear[y]) recordsByYear[y] = [];
      recordsByYear[y].push(r);
    });
    const years = Object.keys(recordsByYear).sort().reverse();
    years.forEach(y => { recordsByYear[y].sort((a, b) => b.month.localeCompare(a.month)); });
    return { years, recordsByYear };
  }, [selectedRecord, rentRecords]);

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Rent Collection</h2>
            <p className="text-gray-500 dark:text-gray-400">Manage monthly rent payments.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex-1 md:flex-none">
                <input 
                    type="month" 
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="border-none outline-none text-gray-700 dark:text-gray-200 font-medium bg-transparent w-full dark:[color-scheme:dark]"
                />
              </div>
              <button onClick={() => { setIsExportModalOpen(true); setExportSelectedShops(['all']); setExportShopSearch(''); }} className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors whitespace-nowrap shadow-sm">
                  <Download size={16} /> <span className="hidden sm:inline">Export</span>
              </button>
              <button onClick={handleGenerateDues} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors whitespace-nowrap shadow-sm">
                  <CalendarPlus size={16} /> <span className="hidden sm:inline">Generate All</span>
              </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-4 transition-colors">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Search shop # or owner..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none transition-all" />
          </div>
          <div className="flex items-center gap-2 min-w-[200px]">
            <Filter className="text-gray-400" size={18} />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none transition-all cursor-pointer">
              <option value="All">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Partial">Partial</option>
              <option value="Overdue">Overdue</option>
              <option value="Not Generated">Not Generated</option>
            </select>
          </div>
        </div>
      </div>

      {/* MOBILE CARD VIEW */}
      <div className="grid grid-cols-1 gap-4 lg:hidden">
        {filteredList.map(({ shop, record, status }) => {
             const remaining = record ? (record.amount || 0) - (record.collected || 0) : shop.monthlyRent;
             return (
             <div key={shop.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                   <div className="flex items-center gap-4 w-full">
                      <div className="h-12 min-w-[3rem] w-auto px-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800 flex items-center justify-center font-bold text-sm md:text-lg shrink-0">
                          <span className="truncate max-w-[80px]">{shop.shopNumber}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                         <h3 className="font-bold text-gray-900 dark:text-white truncate">{shop.ownerName}</h3>
                         <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{formatDate(selectedMonth)}</p>
                      </div>
                   </div>
                   <span className={`px-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wider shrink-0 ml-2 ${getStatusColor(status)}`}>
                      {status}
                   </span>
                </div>
                
                {status === 'Not Generated' ? (
                   <div className="py-6 text-center bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-dashed border-gray-200 dark:border-gray-600">
                      <p className="text-sm text-gray-500 mb-3 font-medium">No bill for this month.</p>
                      <button onClick={() => handleCreateSingleBill(shop.id)} className="bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-lg font-bold shadow-sm border border-gray-200 dark:border-gray-600 hover:bg-gray-50 transition-colors text-sm">
                         Generate Bill (Rs. {(shop.monthlyRent || 0).toLocaleString()})
                      </button>
                   </div>
                ) : (
                   <>
                    {/* 3-Column Grid for Financials */}
                    <div className="grid grid-cols-3 gap-2 bg-gray-50 dark:bg-gray-700/30 p-3 rounded-xl border border-gray-100 dark:border-gray-700/50 mb-4 text-center">
                       <div>
                          <p className="text-[10px] uppercase text-gray-500 dark:text-gray-400 font-bold mb-1">Due</p>
                          <p className="font-bold text-gray-900 dark:text-white text-sm">{(record!.amount || 0).toLocaleString()}</p>
                       </div>
                       <div className="border-l border-r border-gray-200 dark:border-gray-600">
                          <p className="text-[10px] uppercase text-gray-500 dark:text-gray-400 font-bold mb-1">Paid</p>
                          <p className="font-bold text-green-600 dark:text-green-400 text-sm">{(record!.collected || 0).toLocaleString()}</p>
                       </div>
                       <div>
                          <p className="text-[10px] uppercase text-gray-500 dark:text-gray-400 font-bold mb-1">Balance</p>
                          <p className={`font-bold text-sm ${remaining > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>{(remaining || 0).toLocaleString()}</p>
                       </div>
                    </div>

                    <div className="flex gap-2">
                       <button onClick={() => sendWhatsApp(record!)} className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-2.5 rounded-xl text-sm font-bold flex justify-center items-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                          <MessageCircle size={18}/> Share
                       </button>
                       {status !== 'Paid' && (
                          <button onClick={() => openPayModal(record!)} className="flex-[2] bg-blue-600 text-white py-2.5 rounded-xl text-sm font-bold flex justify-center items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-none transition-all">
                             <DollarSign size={18}/> Collect
                          </button>
                       )}
                       <button onClick={() => openHistoryModal(record!)} className="px-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                          <History size={20}/>
                       </button>
                    </div>
                   </>
                )}
             </div>
          )
        })}
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Shop Info</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rent Due</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Collected</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Balance</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredList.map(({ shop, record, status }) => {
                  const remaining = record ? (record.amount || 0) - (record.collected || 0) : shop.monthlyRent;
                  return (
                  <tr key={shop.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 min-w-[2.5rem] w-auto px-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800 flex items-center justify-center font-bold text-sm shrink-0">
                            <span className="truncate max-w-[80px]">{shop.shopNumber}</span>
                        </div>
                        <div className="min-w-0">
                           <div className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[150px]">{shop.ownerName}</div>
                           <div className="text-xs text-gray-500 dark:text-gray-400">{formatFloor(shop.floor)}</div>
                        </div>
                      </div>
                    </td>
                    {status === 'Not Generated' ? (
                       <td colSpan={5} className="px-6 py-4 text-center">
                          <button onClick={() => handleCreateSingleBill(shop.id)} className="text-blue-600 hover:text-blue-700 text-sm font-bold bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg transition-colors">Generate Bill (Rs. {shop.monthlyRent})</button>
                       </td>
                    ) : (
                       <>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">Rs. {record!.amount.toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm font-bold text-green-600 dark:text-green-400">Rs. {record!.collected.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right text-sm font-bold text-red-600 dark:text-red-400">Rs. {remaining.toLocaleString()}</td>
                        <td className="px-6 py-4 text-center">
                           <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(status)}`}>
                             {status}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <div className="flex justify-end items-center gap-2">
                              <button onClick={() => sendWhatsApp(record!)} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors" title="Share via WhatsApp"><MessageCircle size={18}/></button>
                              <button onClick={() => openHistoryModal(record!)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="View History"><History size={18}/></button>
                              {status !== 'Paid' ? (
                                <button onClick={() => openPayModal(record!)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1.5 shadow-sm transition-all hover:shadow-md"><DollarSign size={14} /> Collect</button>
                              ) : <span className="text-gray-400 px-4 py-2 flex items-center gap-1 cursor-default opacity-50"><CheckCircle size={16}/> Done</span>}
                           </div>
                        </td>
                       </>
                    )}
                  </tr>
                )})}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pay Modal */}
      {isPayModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md transition-colors animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 rounded-t-2xl">
              <div><h3 className="text-lg font-bold text-gray-800 dark:text-white">Collect Rent</h3><p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Shop {selectedRecord.shopNumber} • {formatDate(selectedRecord.month)}</p></div>
              <button onClick={() => setIsPayModalOpen(false)} className="bg-gray-200 dark:bg-gray-600 rounded-full p-1 text-gray-500 dark:text-gray-300 hover:text-gray-800"><FilePlus className="rotate-45" size={16} /></button>
            </div>
            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-center border border-blue-100 dark:border-blue-800"><p className="text-xs text-blue-600 dark:text-blue-300 uppercase font-bold mb-1">Total Due</p><p className="text-xl font-bold text-blue-900 dark:text-blue-100">{(selectedRecord.amount || 0).toLocaleString()}</p></div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl text-center border border-orange-100 dark:border-orange-800"><p className="text-xs text-orange-600 dark:text-orange-300 uppercase font-bold mb-1">Remaining</p><p className="text-xl font-bold text-orange-900 dark:text-orange-100">{((selectedRecord.amount || 0) - (selectedRecord.collected || 0)).toLocaleString()}</p></div>
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Amount to Collect</label>
                  <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rs.</span>
                      <input 
                        type="number" 
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors font-bold text-lg" 
                        value={payForm.amount} 
                        onFocus={(e) => e.target.select()}
                        onChange={e => setPayForm({...payForm, amount: e.target.value === '' ? '' : Number(e.target.value)})} 
                      />
                  </div>
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Note (Optional)</label>
                  <input 
                    type="text" 
                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors" 
                    value={payForm.note} 
                    onChange={e => setPayForm({...payForm, note: e.target.value})} 
                    placeholder="e.g. Cash payment by Ali"
                  />
               </div>
               <button type="submit" className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 dark:shadow-none mt-2">Confirm Payment</button>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {isHistoryModalOpen && selectedRecord && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-4xl h-[80vh] flex flex-col transition-colors overflow-hidden animate-in zoom-in-95 duration-200">
               <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center shrink-0"><h3 className="text-lg font-bold break-words pr-4 text-gray-900 dark:text-white">Payment History: {selectedRecord.ownerName}</h3><button onClick={() => setIsHistoryModalOpen(false)} className="bg-gray-100 dark:bg-gray-700 rounded-full p-1.5 text-gray-500 hover:text-gray-800"><FilePlus className="rotate-45" size={18}/></button></div>
               <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                  <div className="w-full md:w-56 bg-gray-50 dark:bg-gray-800/50 border-r border-gray-100 dark:border-gray-700 p-4 overflow-y-auto shrink-0">
                     <p className="text-xs font-bold text-gray-400 uppercase mb-3 px-2">Select Year</p>
                     {shopHistory.years.map(year => (
                        <button key={year} onClick={() => setHistoryYear(year)} className={`w-full text-left px-4 py-3 rounded-xl mb-2 text-sm font-bold transition-all ${historyYear === year ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-300 ring-1 ring-gray-100 dark:ring-gray-600' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>{year}</button>
                     ))}
                  </div>
                  <div className="flex-1 p-6 overflow-y-auto bg-white dark:bg-gray-800">
                     {(shopHistory.recordsByYear[historyYear] || []).map(r => (
                        <div key={r.id} className="border border-gray-100 dark:border-gray-700 rounded-xl p-4 mb-4 shadow-sm hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
                           <div className="flex justify-between font-bold cursor-pointer items-center" onClick={() => setExpandedHistoryId(expandedHistoryId === r.id ? null : r.id)}>
                              <div className="flex items-center gap-3">
                                 <span className="text-gray-800 dark:text-white text-lg">{formatDate(r.month)}</span>
                                 <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase ${getStatusColor(r.status)}`}>{r.status}</span>
                              </div>
                              <div className="flex items-center gap-3 text-gray-500">
                                 <span className="text-sm font-medium">Rs. {r.collected.toLocaleString()} <span className="text-gray-300">/</span> {r.amount.toLocaleString()}</span>
                                 {expandedHistoryId === r.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                              </div>
                           </div>
                           {expandedHistoryId === r.id && (
                              <div className="mt-4 space-y-3 pl-2 border-l-2 border-gray-100 dark:border-gray-700 ml-1">
                                 {r.transactions.length === 0 ? <p className="text-sm text-gray-400 italic pl-2">No transactions recorded.</p> : r.transactions.map(t => (
                                    <div key={t.id} className="flex justify-between items-start bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg ml-2">
                                       <div>
                                          <p className="text-sm font-bold text-gray-800 dark:text-white">{t.date}</p>
                                          {t.collectedBy && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1"><User size={12}/> {t.collectedBy}</p>}
                                          {t.note && <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-1">"{t.note}"</p>}
                                       </div>
                                       <span className="font-bold text-green-600 dark:text-green-400 text-sm bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">Rs. {t.amount.toLocaleString()}</span>
                                    </div>
                                 ))}
                              </div>
                           )}
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         </div>
      )}
      
      {/* Export Modal is largely same logic, skipping minor re-render */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
           <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6 relative flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-center mb-4 shrink-0">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Export Report</h3>
                <button onClick={() => setIsExportModalOpen(false)} className="text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full p-1"><FilePlus className="rotate-45" size={16}/></button>
              </div>
              <div className="space-y-4 overflow-y-auto">
                 <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Start</label><input type="month" className="w-full p-2 border border-gray-300 rounded-lg text-sm" value={exportConfig.startMonth} onChange={e => setExportConfig({...exportConfig, startMonth: e.target.value})} /></div>
                    <div><label className="text-xs font-bold uppercase text-gray-500 mb-1 block">End</label><input type="month" className="w-full p-2 border border-gray-300 rounded-lg text-sm" value={exportConfig.endMonth} onChange={e => setExportConfig({...exportConfig, endMonth: e.target.value})} /></div>
                 </div>
                 <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase text-gray-500">Filter Shops</label>
                    <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden flex flex-col">
                       <div className="p-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input type="text" className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 outline-none" placeholder="Search..." value={exportShopSearch} onChange={(e) => setExportShopSearch(e.target.value)} />
                       </div>
                       <div className="max-h-40 overflow-y-auto p-1 bg-white dark:bg-gray-800">
                          <div className={`px-3 py-2 text-sm rounded-md cursor-pointer flex justify-between ${exportSelectedShops.includes('all') ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-gray-50'}`} onClick={() => toggleShopSelection('all')}>
                             <span>All Shops</span>
                             {exportSelectedShops.includes('all') && <Check size={14}/>}
                          </div>
                          {filteredExportShops.map(s => (
                             <div key={s.id} className={`px-3 py-2 text-sm rounded-md cursor-pointer flex justify-between ${exportSelectedShops.includes(s.id) ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-gray-50'}`} onClick={() => toggleShopSelection(s.id)}>
                                <span>{s.shopNumber} - {s.ownerName}</span>
                                {exportSelectedShops.includes(s.id) && <Check size={14}/>}
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>
                 <button onClick={handleExport} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 mt-2 shadow-lg hover:bg-blue-700">Download CSV</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Rent;
