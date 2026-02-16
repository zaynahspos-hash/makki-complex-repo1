
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { CalendarPlus, Wallet, AlertCircle, CheckCircle, MessageCircle, History, User, Search, Filter, Clock, ChevronRight, ChevronUp, ChevronDown, Calendar, Download, FilePlus, Check, DollarSign } from 'lucide-react';
import { MaintenanceCollection, PaymentTransaction } from '../types';

const Maintenance = () => {
  const { maintenanceCollections, shops, addMaintenancePayment, generateMonthlyMaintenance, createMaintenanceBill, settings, showToast, user } = useApp();

  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<MaintenanceCollection | null>(null);
  const [payForm, setPayForm] = useState<{ amount: number | string, note: string }>({ amount: 0, note: '' });

  const [exportConfig, setExportConfig] = useState({
    startMonth: new Date().toISOString().slice(0, 7),
    endMonth: new Date().toISOString().slice(0, 7),
    format: 'csv'
  });
  const [exportSelectedShops, setExportSelectedShops] = useState<string[]>(['all']);
  const [exportShopSearch, setExportShopSearch] = useState('');

  const [historyYear, setHistoryYear] = useState<string>(new Date().getFullYear().toString());
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  const occupiedShops = shops.filter(s => s.status === 'Occupied');
  
  const processedList = occupiedShops.map(shop => {
     const record = maintenanceCollections.find(r => r.shopId === shop.id && r.month === selectedMonth);
     return {
        shop,
        record,
        status: record ? record.status : 'Not Generated'
     };
  });

  const filteredList = processedList.filter(item => {
    const { shop } = item;
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

  const handleGenerateDues = () => {
    if(confirm(`Generate MAINTENANCE bills for ${formatDate(selectedMonth)}?`)) {
        generateMonthlyMaintenance(selectedMonth);
    }
  };

  const handleCreateSingleBill = async (shopId: string) => {
     await createMaintenanceBill(shopId, selectedMonth);
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
    const dataToExport = maintenanceCollections.filter(r => {
      if (!r.month) return false;
      const inDateRange = r.month >= exportConfig.startMonth && r.month <= exportConfig.endMonth;
      const isAllSelected = exportSelectedShops.includes('all');
      const matchesShop = isAllSelected || exportSelectedShops.includes(r.shopId);
      return inDateRange && matchesShop;
    });

    if (dataToExport.length === 0) {
      showToast("No records found.", 'error');
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
    link.setAttribute('download', `maintenance_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportModalOpen(false);
    showToast("Maintenance report downloaded successfully", 'success');
  };

  const openPayModal = (record: MaintenanceCollection) => {
    setSelectedCollection(record);
    setPayForm({ amount: Math.max(0, (record.amount || 0) - (record.collected || 0)), note: '' });
    setIsPayModalOpen(true);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCollection) {
      addMaintenancePayment(selectedCollection.id, Number(payForm.amount), payForm.note);
      setIsPayModalOpen(false);
    }
  };

  const openHistoryModal = (record: MaintenanceCollection) => {
    setSelectedCollection(record);
    if(record.month) setHistoryYear(record.month.split('-')[0]);
    setIsHistoryModalOpen(true);
  };

  const sendWhatsApp = (record: MaintenanceCollection) => {
    if (!record.phone) { 
        showToast("No phone number found", 'error'); 
        return; 
    }

    // 1. Format Phone Number (+92)
    let phone = record.phone.replace(/\D/g, ''); // Remove non-digits
    if (phone.startsWith('0')) {
      phone = '92' + phone.slice(1);
    }

    // 2. Calculate Previous Dues (Arrears)
    const previousRecords = maintenanceCollections.filter(r => r.shopId === record.shopId && r.month < record.month);
    const previousDues = previousRecords.reduce((acc, r) => acc + ((r.amount || 0) - (r.collected || 0)), 0);

    // 3. Current Month Stats
    const currentDue = record.amount || 0;
    const currentPaid = record.collected || 0;
    const currentBalance = currentDue - currentPaid;

    // 4. Total Outstanding
    const totalOutstanding = previousDues + currentBalance;

    // 5. Construct Message
    const text = `
*${settings.plazaName.toUpperCase()} - MAINTENANCE BILL*
--------------------------------
*Generated By:* ${user?.displayName || 'Admin'}
*Date:* ${new Date().toLocaleDateString()}

*SHOP DETAILS:*
Shop No: ${record.shopNumber}
Owner: ${record.ownerName}

*PREVIOUS DUES (ARREARS):*
Rs. ${previousDues.toLocaleString()}

*CURRENT MONTH (${formatDate(record.month).toUpperCase()}):*
Target: Rs. ${currentDue.toLocaleString()}
Paid: Rs. ${currentPaid.toLocaleString()}
*Current Balance: Rs. ${currentBalance.toLocaleString()}*

--------------------------------
*TOTAL PAYABLE AMOUNT:*
*Rs. ${totalOutstanding.toLocaleString()}*
--------------------------------
${record.status === 'Paid' ? '✅ *PAID IN FULL*' : '⚠️ *PAYMENT PENDING*'}
`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shopHistory = useMemo(() => {
    if (!selectedCollection) return { years: [], recordsByYear: {} };
    const allRecords = maintenanceCollections.filter(r => r.shopId === selectedCollection.shopId);
    const recordsByYear: Record<string, MaintenanceCollection[]> = {};
    allRecords.forEach(r => {
      if(!r.month) return;
      const y = r.month.split('-')[0];
      if (!recordsByYear[y]) recordsByYear[y] = [];
      recordsByYear[y].push(r);
    });
    const years = Object.keys(recordsByYear).sort().reverse();
    years.forEach(y => { recordsByYear[y].sort((a, b) => b.month.localeCompare(a.month)); });
    return { years, recordsByYear };
  }, [selectedCollection, maintenanceCollections]);

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div><h2 className="text-2xl font-bold text-gray-800 dark:text-white">Maintenance</h2><p className="text-gray-500 dark:text-gray-400">Monthly maintenance collections.</p></div>
           <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
             <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex-1 md:flex-none">
              <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="border-none outline-none text-gray-700 dark:text-gray-200 font-medium bg-transparent w-full dark:[color-scheme:dark]" />
            </div>
            <button onClick={() => { setIsExportModalOpen(true); setExportSelectedShops(['all']); setExportShopSearch(''); }} className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors whitespace-nowrap shadow-sm">
                <Download size={16} /> <span className="hidden sm:inline">Export</span>
            </button>
            <button onClick={handleGenerateDues} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors whitespace-nowrap shadow-sm">
                <CalendarPlus size={16} /> Generate
            </button>
           </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-4 transition-colors">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none transition-all" />
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
             const remaining = record ? (record.amount || 0) - (record.collected || 0) : shop.monthlyMaintenance;
             return (
             <div key={shop.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                   <div className="flex items-center gap-4 w-full">
                      <div className="h-10 min-w-[2.5rem] w-auto px-2 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-800 flex items-center justify-center font-bold text-sm shrink-0">
                          <span className="truncate max-w-[80px]">{shop.shopNumber}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                         <h3 className="font-bold text-gray-900 dark:text-white truncate">{shop.ownerName}</h3>
                         <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{formatDate(selectedMonth)}</p>
                      </div>
                   </div>
                   <span className={`px-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wider shrink-0 ml-2 ${getStatusColor(status)}`}>{status}</span>
                </div>
                {status === 'Not Generated' ? (
                   <div className="py-6 text-center bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-dashed border-gray-200 dark:border-gray-600">
                      <p className="text-sm text-gray-500 mb-3 font-medium">No bill generated.</p>
                      <button onClick={() => handleCreateSingleBill(shop.id)} className="bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 px-4 py-2 rounded-lg font-bold shadow-sm border border-gray-200 dark:border-gray-600 hover:bg-gray-50 transition-colors text-sm">Generate (Rs. {shop.monthlyMaintenance})</button>
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
                       {status !== 'Paid' && <button onClick={() => openPayModal(record!)} className="flex-[2] bg-purple-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-purple-700 shadow-lg shadow-purple-200 dark:shadow-none flex items-center justify-center gap-2"><DollarSign size={18}/> Collect</button>}
                       <button onClick={() => openHistoryModal(record!)} className="px-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"><History size={20}/></button>
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
                 <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Shop</th>
                 <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Due</th>
                 <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Collected</th>
                 <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Balance</th>
                 <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                 <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
           </thead>
           <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredList.map(({ shop, record, status }) => {
                 const remaining = record ? (record.amount || 0) - (record.collected || 0) : shop.monthlyMaintenance;
                 return (
                 <tr key={shop.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-3">
                       <div className="h-10 min-w-[2.5rem] w-auto px-2 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 border border-purple-100 dark:border-purple-800 flex items-center justify-center font-bold text-sm shrink-0">
                          <span className="truncate max-w-[80px]">{shop.shopNumber}</span>
                       </div>
                       <div className="min-w-0"><div className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[150px]">{shop.ownerName}</div></div>
                    </td>
                    {status === 'Not Generated' ? (
                       <td colSpan={5} className="px-6 py-4 text-center">
                          <button onClick={() => handleCreateSingleBill(shop.id)} className="text-purple-600 hover:text-purple-700 text-sm font-bold bg-purple-50 dark:bg-purple-900/20 px-4 py-2 rounded-lg transition-colors">Generate Bill (Rs. {shop.monthlyMaintenance})</button>
                       </td>
                    ) : (
                       <>
                       <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">Rs. {record!.amount.toLocaleString()}</td>
                       <td className="px-6 py-4 text-sm font-bold text-green-600 dark:text-green-400">Rs. {record!.collected.toLocaleString()}</td>
                       <td className="px-6 py-4 text-sm font-bold text-red-600 dark:text-red-400">Rs. {remaining.toLocaleString()}</td>
                       <td className="px-6 py-4 text-center"><span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(status)}`}>{status}</span></td>
                       <td className="px-6 py-4 text-right">
                           <div className="flex justify-end items-center gap-2">
                              <button onClick={() => sendWhatsApp(record!)} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"><MessageCircle size={18}/></button>
                              <button onClick={() => openHistoryModal(record!)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"><History size={18}/></button>
                              {status !== 'Paid' ? (
                                <button onClick={() => openPayModal(record!)} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1.5 shadow-sm transition-all hover:shadow-md">Collect</button>
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

      {isPayModalOpen && selectedCollection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
           <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md transition-colors animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 rounded-t-2xl">
                 <div><h3 className="text-lg font-bold text-gray-800 dark:text-white">Collect Maintenance</h3><p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Shop {selectedCollection.shopNumber} • {formatDate(selectedCollection.month)}</p></div>
                 <button onClick={() => setIsPayModalOpen(false)} className="bg-gray-200 dark:bg-gray-600 rounded-full p-1 text-gray-500 dark:text-gray-300 hover:text-gray-800"><FilePlus className="rotate-45" size={16}/></button>
              </div>
              <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl text-center border border-purple-100 dark:border-purple-800"><p className="text-xs text-purple-600 dark:text-purple-300 uppercase font-bold mb-1">Total Due</p><p className="text-xl font-bold text-purple-900 dark:text-purple-100">{(selectedCollection.amount || 0).toLocaleString()}</p></div>
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl text-center border border-orange-100 dark:border-orange-800"><p className="text-xs text-orange-600 dark:text-orange-300 uppercase font-bold mb-1">Remaining</p><p className="text-xl font-bold text-orange-900 dark:text-orange-100">{((selectedCollection.amount || 0) - (selectedCollection.collected || 0)).toLocaleString()}</p></div>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Amount</label>
                    <div className="relative">
                       <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rs.</span>
                       <input 
                         type="number" 
                         className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-colors font-bold text-lg" 
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
                      className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-colors" 
                      value={payForm.note} 
                      onChange={e => setPayForm({...payForm, note: e.target.value})} 
                      placeholder="e.g. Cash payment"
                    />
                 </div>
                 <button type="submit" className="w-full bg-purple-600 text-white py-3.5 rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200 dark:shadow-none mt-2">Confirm Payment</button>
              </form>
           </div>
        </div>
      )}

      {/* History Modal */}
      {isHistoryModalOpen && selectedCollection && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-4xl h-[80vh] flex flex-col transition-colors overflow-hidden animate-in zoom-in-95 duration-200">
               <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center shrink-0"><h3 className="text-lg font-bold break-words pr-4 text-gray-900 dark:text-white">Payment History: {selectedCollection.ownerName}</h3><button onClick={() => setIsHistoryModalOpen(false)} className="bg-gray-100 dark:bg-gray-700 rounded-full p-1.5 text-gray-500 hover:text-gray-800"><FilePlus className="rotate-45" size={18}/></button></div>
               <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                  <div className="w-full md:w-56 bg-gray-50 dark:bg-gray-800/50 border-r border-gray-100 dark:border-gray-700 p-4 overflow-y-auto shrink-0">
                     <p className="text-xs font-bold text-gray-400 uppercase mb-3 px-2">Select Year</p>
                     {shopHistory.years.map(year => (
                        <button key={year} onClick={() => setHistoryYear(year)} className={`w-full text-left px-4 py-3 rounded-xl mb-2 text-sm font-bold transition-all ${historyYear === year ? 'bg-white dark:bg-gray-700 shadow-sm text-purple-600 dark:text-purple-300 ring-1 ring-gray-100 dark:ring-gray-600' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>{year}</button>
                     ))}
                  </div>
                  <div className="flex-1 p-6 overflow-y-auto bg-white dark:bg-gray-800">
                     {(shopHistory.recordsByYear[historyYear] || []).map(r => (
                        <div key={r.id} className="border border-gray-100 dark:border-gray-700 rounded-xl p-4 mb-4 shadow-sm hover:border-purple-200 dark:hover:border-purple-800 transition-colors">
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
    </div>
  );
};

export default Maintenance;
