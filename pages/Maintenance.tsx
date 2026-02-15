import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { CalendarPlus, Wallet, AlertCircle, CheckCircle, MessageCircle, History, User, Search, Filter, Clock, ChevronRight, ChevronUp, ChevronDown, Calendar, Download, FilePlus, Check } from 'lucide-react';
import { MaintenanceCollection, PaymentTransaction } from '../types';

const Maintenance = () => {
  const { 
    maintenanceCollections, 
    shops,
    addMaintenancePayment, 
    generateMonthlyMaintenance, 
    createMaintenanceBill,
    settings,
    showToast
  } = useApp();

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

  // Advanced Search State for Export Modal
  const [exportShopSearch, setExportShopSearch] = useState('');

  const [historyYear, setHistoryYear] = useState<string>(new Date().getFullYear().toString());
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  // Filter Logic: Show all occupied shops
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

  // Filter logic for Export Modal dropdown
  const filteredExportShops = shops.filter(shop => {
     const query = exportShopSearch.toLowerCase();
     return shop.shopNumber.toLowerCase().includes(query) || 
            shop.ownerName.toLowerCase().includes(query) ||
            shop.phone.includes(query);
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Paid': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'Partial': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      case 'Pending': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
      case 'Overdue': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      case 'Not Generated': return 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'Paid': return <CheckCircle size={16} />;
      case 'Partial': return <Wallet size={16} />;
      case 'Pending': return <Clock size={16} />;
      case 'Overdue': return <AlertCircle size={16} />;
      case 'Not Generated': return <FilePlus size={16} />;
      default: return null;
    }
  };

  const formatDate = (dateStr: string) => {
    if(!dateStr) return '';
    const [y, m] = dateStr.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const handleGenerateDues = () => {
    // Confirmation handled by toast inside AppContext or adding a manual confirm here
    if(confirm(`Generate MAINTENANCE bills for ${formatDate(selectedMonth)}?`)) {
        generateMonthlyMaintenance(selectedMonth);
    }
  };

  const handleCreateSingleBill = async (shopId: string) => {
     await createMaintenanceBill(shopId, selectedMonth);
  };

  const toggleShopSelection = (shopId: string) => {
     if (shopId === 'all') {
       if (exportSelectedShops.includes('all')) {
         setExportSelectedShops([]); 
       } else {
         setExportSelectedShops(['all']); 
       }
     } else {
       let newSelection = [...exportSelectedShops];
       if (newSelection.includes('all')) {
         newSelection = []; 
       }
       if (newSelection.includes(shopId)) {
         newSelection = newSelection.filter(id => id !== shopId);
       } else {
         newSelection.push(shopId);
       }
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

  const sendWhatsApp = (record: MaintenanceCollection, transaction?: PaymentTransaction) => {
    if (!record.phone) { 
        showToast("No phone number found", 'error'); 
        return; 
    }
    const remaining = (record.amount || 0) - (record.collected || 0);
    const currentPayment = transaction ? transaction.amount : 0;
    const title = transaction ? "MAINTENANCE RECEIVED" : "MAINTENANCE STATUS";
    const text = `*${settings.plazaName} - ${title}*\n--------------------------------\n🏢 *Shop:* ${record.shopNumber} (${record.ownerName})\n📅 *Month:* ${formatDate(record.month)}\n--------------------------------\n🛠️ *MAINTENANCE BILL*\n   *Total Due:*     *Rs. ${(record.amount || 0).toLocaleString()}*\n--------------------------------\n💵 *PAYMENT DETAILS*\n   Previously Paid:  Rs. ${((record.collected || 0) - currentPayment).toLocaleString()}\n   *Current Payment:  Rs. ${(currentPayment || 0).toLocaleString()}*\n   \n   *Total Paid:*      *Rs. ${(record.collected || 0).toLocaleString()}*\n--------------------------------\n📉 *BALANCE REMAINING: Rs. ${(remaining || 0).toLocaleString()}*\n📊 *Status:* ${record.status.toUpperCase()}\n\nThank you!`.trim();
    window.open(`https://wa.me/${record.phone}?text=${encodeURIComponent(text)}`, '_blank');
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
              <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="border-none outline-none text-gray-700 dark:text-white font-medium bg-transparent w-full dark:[color-scheme:dark]" />
            </div>
            <button 
              onClick={() => { setIsExportModalOpen(true); setExportSelectedShops(['all']); setExportShopSearch(''); }} 
              className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors whitespace-nowrap shadow-sm"
              title="Export maintenance data"
            >
                <Download size={16} /> <span className="hidden sm:inline">Export</span>
            </button>
            <button 
                onClick={handleGenerateDues} 
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors whitespace-nowrap shadow-sm"
                title="Generate maintenance bills for all shops"
            >
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

      <div className="grid grid-cols-1 gap-4 lg:hidden">
        {filteredList.map(({ shop, record, status }) => {
             const remaining = record ? (record.amount || 0) - (record.collected || 0) : shop.monthlyMaintenance;
             return (
             <div key={shop.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-3 transition-colors">
                <div className="flex justify-between items-start gap-3">
                   <div className="flex items-start space-x-3 flex-1 min-w-0">
                      {/* Responsive Shop Badge */}
                      <div className={`min-w-[2.5rem] max-w-[6rem] sm:max-w-[8rem] h-auto px-2 py-1 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs border mt-0.5 break-words text-center leading-tight ${
                          shop.status === 'Occupied' 
                            ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-100 dark:border-purple-800' 
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600'
                      }`}>
                          {shop.shopNumber}
                      </div>
                      <div className="min-w-0 flex-1">
                         <h3 className="font-bold text-gray-900 dark:text-white break-words leading-tight text-sm">{shop.ownerName}</h3>
                         <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatDate(selectedMonth)}</p>
                      </div>
                   </div>
                   <span className={`px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shrink-0 ${getStatusColor(status)}`}>{getStatusIcon(status)} {status}</span>
                </div>
                {status === 'Not Generated' ? (
                   <div className="py-4 text-center">
                      <p className="text-sm text-gray-500 mb-3">Bill not generated.</p>
                      <button onClick={() => handleCreateSingleBill(shop.id)} className="w-full bg-purple-100 text-purple-600 py-2 rounded-lg font-medium hover:bg-purple-200">Generate (Rs. {shop.monthlyMaintenance})</button>
                   </div>
                ) : (
                   <>
                    <div className="flex justify-between text-sm py-2 border-t border-gray-50 dark:border-gray-700">
                         <span className="text-gray-600 dark:text-gray-300">Due: <b>Rs. {record!.amount.toLocaleString()}</b></span>
                         <span className={remaining > 0 ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>Bal: Rs. {remaining.toLocaleString()}</span>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => sendWhatsApp(record!)} className="flex-1 bg-green-50 text-green-700 py-2 rounded-lg text-sm font-medium flex justify-center gap-2 hover:bg-green-100"><MessageCircle size={16}/> Share</button>
                       {status !== 'Paid' && <button onClick={() => openPayModal(record!)} className="flex-1 bg-purple-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-purple-700">Collect</button>}
                       <button onClick={() => openHistoryModal(record!)} className="px-3 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"><History size={18}/></button>
                    </div>
                   </>
                )}
             </div>
          )
        })}
      </div>

      <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
        <table className="w-full">
           <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
              <tr>
                 <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Shop</th>
                 <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Due</th>
                 <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Collected</th>
                 <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Balance</th>
                 <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                 <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
           </thead>
           <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredList.map(({ shop, record, status }) => {
                 const remaining = record ? (record.amount || 0) - (record.collected || 0) : shop.monthlyMaintenance;
                 return (
                 <tr key={shop.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-3">
                       {/* Responsive Shop Badge for Table */}
                       <div className={`min-w-[2.5rem] max-w-[6rem] px-2 py-1 rounded-lg flex items-center justify-center font-bold text-xs border shrink-0 break-words text-center leading-tight ${
                           shop.status === 'Occupied' 
                           ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 border-purple-100 dark:border-purple-800' 
                           : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600'
                       }`}>
                          {shop.shopNumber}
                       </div>
                       <div><p className="text-sm font-medium text-gray-900 dark:text-white break-words max-w-[150px]">{shop.ownerName}</p></div>
                    </td>
                    {status === 'Not Generated' ? (
                       <td colSpan={5} className="px-6 py-4 text-center">
                          <button onClick={() => handleCreateSingleBill(shop.id)} className="text-purple-600 hover:underline text-sm font-medium">Generate Bill (Rs. {shop.monthlyMaintenance})</button>
                       </td>
                    ) : (
                       <>
                       <td className="px-6 py-4 text-sm font-medium">Rs. {record!.amount.toLocaleString()}</td>
                       <td className="px-6 py-4 text-sm font-medium text-green-600">Rs. {record!.collected.toLocaleString()}</td>
                       <td className="px-6 py-4 text-sm font-bold text-red-600">Rs. {remaining.toLocaleString()}</td>
                       <td className="px-6 py-4 text-center"><span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>{getStatusIcon(status)} {status}</span></td>
                       <td className="px-6 py-4 text-right space-x-2">
                          <button onClick={() => sendWhatsApp(record!)} className="text-gray-400 hover:text-green-600"><MessageCircle size={18}/></button>
                          <button onClick={() => openHistoryModal(record!)} className="text-gray-400 hover:text-blue-600"><History size={18}/></button>
                          {status !== 'Paid' && <button onClick={() => openPayModal(record!)} className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700">Collect</button>}
                       </td>
                       </>
                    )}
                 </tr>
              )})}
           </tbody>
        </table>
      </div>

      {isPayModalOpen && selectedCollection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
           <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md transition-colors">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 rounded-t-2xl">
                 <div className="flex-1 mr-2"><h3 className="text-lg font-bold text-gray-800 dark:text-white">Collect Maintenance</h3><p className="text-xs text-gray-500 break-words">Shop {selectedCollection.shopNumber} • {formatDate(selectedCollection.month)}</p></div>
                 <button onClick={() => setIsPayModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">&times;</button>
              </div>
              <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
                 <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg text-center"><p className="text-xs text-purple-600 uppercase font-bold">Total Due</p><p className="text-lg font-bold text-purple-900 dark:text-purple-100">Rs. {(selectedCollection.amount || 0).toLocaleString()}</p></div>
                 <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Amount</label>
                    <input 
                      type="number" 
                      className="w-full p-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-colors" 
                      value={payForm.amount} 
                      onFocus={(e) => e.target.select()}
                      onChange={e => setPayForm({...payForm, amount: e.target.value === '' ? '' : Number(e.target.value)})} 
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Note</label>
                    <input 
                      type="text" 
                      className="w-full p-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-colors" 
                      value={payForm.note} 
                      onChange={e => setPayForm({...payForm, note: e.target.value})} 
                      placeholder="Optional note" 
                    />
                 </div>
                 <button type="submit" className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold">Confirm</button>
              </form>
           </div>
        </div>
      )}

      {isHistoryModalOpen && selectedCollection && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-4xl h-[85vh] flex flex-col transition-colors overflow-hidden">
               <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center"><h3 className="text-lg font-bold break-words pr-4 text-gray-900 dark:text-white">{selectedCollection.ownerName} History</h3><button onClick={() => setIsHistoryModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">&times;</button></div>
               <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                  <div className="w-full md:w-48 bg-gray-50 dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 p-4 overflow-y-auto">
                     {shopHistory.years.map(year => (
                        <button key={year} onClick={() => setHistoryYear(year)} className={`w-full text-left px-4 py-2 rounded-lg mb-2 text-sm font-medium transition-colors ${historyYear === year ? 'bg-white dark:bg-gray-700 shadow text-purple-600 dark:text-purple-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>{year}</button>
                     ))}
                  </div>
                  <div className="flex-1 p-6 overflow-y-auto bg-white dark:bg-gray-800">
                     {(shopHistory.recordsByYear[historyYear] || []).map(r => (
                        <div key={r.id} className="border border-gray-100 dark:border-gray-700 rounded-lg p-4 mb-3 shadow-sm">
                           <div className="flex justify-between font-bold cursor-pointer items-center" onClick={() => setExpandedHistoryId(expandedHistoryId === r.id ? null : r.id)}>
                              <span className="text-gray-800 dark:text-white">{formatDate(r.month)}</span>
                              <div className="flex items-center gap-3">
                                 <span className="text-sm text-gray-600 dark:text-gray-300">Rs. {r.collected}/{r.amount}</span>
                                 {expandedHistoryId === r.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </div>
                           </div>
                           {expandedHistoryId === r.id && (
                              <div className="mt-4 space-y-3">
                                 {r.transactions.length === 0 ? <p className="text-sm text-gray-400 italic">No transactions</p> : r.transactions.map(t => (
                                    <div key={t.id} className="flex justify-between items-start bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg">
                                       <div>
                                          <p className="text-sm font-medium text-gray-900 dark:text-white">{t.date}</p>
                                          {t.collectedBy && (
                                             <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                                                <User size={10} /> Collected by {t.collectedBy}
                                             </p>
                                          )}
                                          {t.note && <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-1">"{t.note}"</p>}
                                       </div>
                                       <span className="font-bold text-green-600 dark:text-green-400 text-sm">Rs. {t.amount.toLocaleString()}</span>
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
      
      {/* EXPORT MODAL - FIXED SHOP SELECTION */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
           <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6 relative flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-center mb-4 shrink-0">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Export History</h3>
                <button onClick={() => setIsExportModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">&times;</button>
              </div>
              
              <div className="space-y-4 overflow-y-auto">
                 <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-sm font-medium block mb-1 text-gray-700 dark:text-gray-300">Start</label>
                        <input 
                          type="month" 
                          className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 dark:[color-scheme:dark]" 
                          value={exportConfig.startMonth} 
                          onChange={e => setExportConfig({...exportConfig, startMonth: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium block mb-1 text-gray-700 dark:text-gray-300">End</label>
                        <input 
                          type="month" 
                          className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 dark:[color-scheme:dark]" 
                          value={exportConfig.endMonth} 
                          onChange={e => setExportConfig({...exportConfig, endMonth: e.target.value})}
                        />
                    </div>
                 </div>
                 
                 {/* Replaced Absolute Dropdown with Inline Searchable List */}
                 <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Shop Selection</label>
                    <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden flex flex-col">
                       {/* Inline Search */}
                       <div className="p-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                         <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input 
                               type="text" 
                               className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none placeholder-gray-400" 
                               placeholder="Search shops..."
                               value={exportShopSearch}
                               onChange={(e) => setExportShopSearch(e.target.value)}
                            />
                         </div>
                       </div>
                       {/* Scrollable Shop List */}
                       <div className="max-h-40 overflow-y-auto p-1 bg-white dark:bg-gray-800">
                          <div 
                             className={`px-3 py-2 text-sm rounded-md cursor-pointer flex items-center justify-between transition-colors ${exportSelectedShops.includes('all') ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                             onClick={() => toggleShopSelection('all')}
                          >
                             <span className="font-medium">All Shops</span>
                             <div className={`w-4 h-4 rounded border flex items-center justify-center ${exportSelectedShops.includes('all') ? 'bg-blue-600 border-blue-600' : 'border-gray-300 dark:border-gray-500'}`}>
                                {exportSelectedShops.includes('all') && <Check size={10} className="text-white" />}
                             </div>
                          </div>
                          
                          {filteredExportShops.map(s => {
                             const isSelected = exportSelectedShops.includes(s.id);
                             return (
                             <div 
                                key={s.id} 
                                className={`px-3 py-2 text-sm rounded-md cursor-pointer flex items-center justify-between group transition-colors ${isSelected ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                onClick={() => toggleShopSelection(s.id)}
                             >
                                <div className="flex flex-col min-w-0">
                                   <span className="font-medium truncate">{s.shopNumber} <span className="font-normal opacity-70 text-xs">- {s.ownerName}</span></span>
                                </div>
                                <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ml-2 ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 dark:border-gray-500'}`}>
                                   {isSelected && <Check size={10} className="text-white" />}
                                </div>
                             </div>
                          )})}
                          
                          {filteredExportShops.length === 0 && (
                             <div className="px-4 py-3 text-sm text-gray-400 text-center italic">No matching shops</div>
                          )}
                       </div>
                    </div>
                 </div>

                 <button onClick={handleExport} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 mt-4 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 dark:shadow-none">
                    <Download size={20} /> Download Report
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Maintenance;