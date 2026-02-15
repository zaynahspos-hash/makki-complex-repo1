
import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Banknote, Calendar, Search, Download, TrendingUp, Filter, User, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { PaymentTransaction } from '../types';

interface FlatTransaction extends PaymentTransaction {
  type: 'Rent' | 'Maintenance';
  shopNumber: string;
  ownerName: string;
  monthBill: string;
  rawDate: Date;
}

const Revenue = () => {
  const { rentRecords, maintenanceCollections, showToast } = useApp();
  
  // --- DATE HELPERS ---
  const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseDate = (dateStr: string) => {
    if (!dateStr) return new Date(0);
    let d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d;
    const dmyMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10);
      const month = parseInt(dmyMatch[2], 10) - 1; 
      const year = parseInt(dmyMatch[3], 10);
      let hours = 0, minutes = 0, seconds = 0;
      const timeMatch = dateStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?/i);
      if (timeMatch) {
        hours = parseInt(timeMatch[1], 10);
        minutes = parseInt(timeMatch[2], 10);
        seconds = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
        const period = timeMatch[4]?.toUpperCase();
        if (period === 'PM' && hours < 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
      }
      d = new Date(year, month, day, hours, minutes, seconds);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date(0);
  };

  // --- STATE ---
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const [startDate, setStartDate] = useState(getLocalDateString(startOfMonth));
  const [endDate, setEndDate] = useState(getLocalDateString(endOfMonth));
  const [activeQuickFilter, setActiveQuickFilter] = useState<'today' | '7d' | '15d' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'allTime' | 'custom'>('thisMonth');
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Rent' | 'Maintenance'>('All');

  // Refs
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);

  // --- DATA PROCESSING ---
  const allTransactions = useMemo(() => {
    const flat: FlatTransaction[] = [];
    
    rentRecords.forEach(record => {
      if (record.transactions && Array.isArray(record.transactions)) {
        record.transactions.forEach(tx => {
          const amt = typeof tx.amount === 'string' ? parseFloat(tx.amount) : tx.amount;
          flat.push({
            ...tx,
            amount: amt || 0, 
            type: 'Rent',
            shopNumber: record.shopNumber,
            ownerName: record.ownerName,
            monthBill: record.month,
            rawDate: parseDate(tx.date)
          });
        });
      }
    });

    maintenanceCollections.forEach(record => {
        if (record.transactions && Array.isArray(record.transactions)) {
          record.transactions.forEach(tx => {
            const amt = typeof tx.amount === 'string' ? parseFloat(tx.amount) : tx.amount;
            flat.push({
              ...tx,
              amount: amt || 0,
              type: 'Maintenance',
              shopNumber: record.shopNumber,
              ownerName: record.ownerName,
              monthBill: record.month,
              rawDate: parseDate(tx.date)
            });
          });
        }
      });
      
    return flat.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());
  }, [rentRecords, maintenanceCollections]);

  // --- FILTERING ---
  const applyFilter = (filter: 'today' | '7d' | '15d' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'allTime') => {
    const end = new Date();
    let start = new Date();
    
    if (filter === 'today') {
      start = new Date();
    } else if (filter === '7d') {
      start.setDate(end.getDate() - 7);
    } else if (filter === '15d') {
        start.setDate(end.getDate() - 15);
    } else if (filter === 'thisMonth') {
      start = new Date(end.getFullYear(), end.getMonth(), 1);
      const lastDay = new Date(end.getFullYear(), end.getMonth() + 1, 0);
      end.setTime(lastDay.getTime());
    } else if (filter === 'lastMonth') {
      start = new Date(end.getFullYear(), end.getMonth() - 1, 1);
      end.setDate(0); 
    } else if (filter === 'thisYear') {
      start = new Date(end.getFullYear(), 0, 1);
      const lastDay = new Date(end.getFullYear(), 11, 31);
      end.setTime(lastDay.getTime());
    } else if (filter === 'allTime') {
      start = new Date(2020, 0, 1);
      const lastDay = new Date(end.getFullYear(), 11, 31);
      end.setTime(lastDay.getTime());
    }
    
    setStartDate(getLocalDateString(start));
    setEndDate(getLocalDateString(end));
    setActiveQuickFilter(filter);
  };

  const handleCustomDateChange = (type: 'start' | 'end', value: string) => {
      if (type === 'start') setStartDate(value);
      else setEndDate(value);
      setActiveQuickFilter('custom');
  };

  const filteredTransactions = useMemo(() => {
    const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
    const start = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);
    const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
    const end = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);

    return allTransactions.filter(tx => {
        const txDate = tx.rawDate;
        const isValidDate = txDate.getTime() > 0;
        const inRange = txDate >= start && txDate <= end;
        
        const q = searchQuery.toLowerCase();
        const matchesSearch = 
            tx.shopNumber.toLowerCase().includes(q) || 
            tx.ownerName.toLowerCase().includes(q) ||
            tx.collectedBy.toLowerCase().includes(q) ||
            (tx.note && tx.note.toLowerCase().includes(q));

        const matchesType = typeFilter === 'All' || tx.type === typeFilter;
            
        return isValidDate && inRange && matchesSearch && matchesType;
    });
  }, [allTransactions, startDate, endDate, searchQuery, typeFilter]);

  const totalRevenue = filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0);

  const handleExport = () => {
      if (filteredTransactions.length === 0) {
        showToast("No records match the current filters.", "error");
        return;
      }

      const headers = ['Date', 'Type', 'Shop No', 'Owner', 'Amount', 'Collected By', 'Note'];
      const rows = filteredTransactions.map(tx => [
          `"${tx.date}"`,
          tx.type,
          tx.shopNumber,
          `"${tx.ownerName}"`,
          tx.amount,
          tx.collectedBy,
          `"${tx.note || ''}"`
      ]);
      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `revenue_export_${startDate}_to_${endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast("Revenue report downloaded", "success");
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      
      {/* HEADER SECTION (Title & Export) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Revenue</h2>
           <p className="text-gray-500 dark:text-gray-400">Financial Overview</p>
        </div>
        <button onClick={handleExport} className="w-full md:w-auto bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors shadow-sm">
            <Download size={18} /> Export CSV
        </button>
      </div>

      {/* COMPACT FILTER & STATS BAR */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-4 transition-colors">
         
         {/* Date Range Inputs (Grid for better alignment on mobile) */}
         <div className="flex-1 grid grid-cols-2 gap-3">
            <div className="relative">
               <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none text-gray-400"><Calendar size={14} /></div>
               <input 
                  ref={startDateRef} 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => handleCustomDateChange('start', e.target.value)} 
                  onClick={(e) => {
                    try {
                      if ('showPicker' in HTMLInputElement.prototype) {
                        e.currentTarget.showPicker();
                      }
                    } catch (error) {
                      console.log('Picker not supported or blocked', error);
                    }
                  }}
                  className="w-full pl-8 pr-2 py-2 text-xs font-bold border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer" 
                />
            </div>
            <div className="relative">
               <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none text-gray-400"><Calendar size={14} /></div>
               <input 
                  ref={endDateRef} 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => handleCustomDateChange('end', e.target.value)} 
                  onClick={(e) => {
                    try {
                      if ('showPicker' in HTMLInputElement.prototype) {
                         e.currentTarget.showPicker();
                      }
                    } catch (error) {
                      console.log('Picker not supported or blocked', error);
                    }
                  }}
                  className="w-full pl-8 pr-2 py-2 text-xs font-bold border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer" 
               />
            </div>
         </div>

         {/* Total Revenue Pill */}
         <div className="flex items-center justify-between md:justify-end bg-blue-50 dark:bg-blue-900/30 px-3 py-2 rounded-lg border border-blue-100 dark:border-blue-800 min-w-[140px]">
             <span className="text-xs text-blue-600 dark:text-blue-300 font-bold uppercase mr-2">Total</span>
             <span className="text-lg font-bold text-blue-700 dark:text-blue-200">Rs. {totalRevenue.toLocaleString()}</span>
         </div>
      </div>

      {/* QUICK FILTERS (Horizontal Scroll) */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'today', label: 'Today' }, 
            { id: '7d', label: '7 Days' }, 
            { id: '15d', label: '15 Days' }, 
            { id: 'thisMonth', label: 'This Month' }, 
            { id: 'lastMonth', label: 'Last Month' },
            { id: 'thisYear', label: 'This Year' },
            { id: 'allTime', label: 'All Time' }
          ].map(btn => (
              <button 
                key={btn.id} 
                onClick={() => applyFilter(btn.id as any)} 
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border whitespace-nowrap ${
                  activeQuickFilter === btn.id 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                {btn.label}
              </button>
          ))}
      </div>

      {/* SEARCH BAR & TYPE FILTER */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-4 transition-colors">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
                type="text" 
                placeholder="Search transactions..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none transition-all" 
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto min-w-[200px]">
             <Filter className="text-gray-400 shrink-0" size={18} />
             <select 
                value={typeFilter} 
                onChange={(e) => setTypeFilter(e.target.value as any)} 
                className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none transition-all cursor-pointer"
             >
                <option value="All">All Types</option>
                <option value="Rent">Rent</option>
                <option value="Maintenance">Maint</option>
             </select>
          </div>
      </div>

      {/* MOBILE CARD GRID */}
      <div className="grid grid-cols-1 gap-4 lg:hidden">
         {filteredTransactions.map((tx, idx) => (
             <div key={tx.id + idx} className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                   <div className="flex items-center gap-4 w-[70%]">
                      <div className={`h-10 min-w-[2.5rem] px-2 rounded-xl flex items-center justify-center font-bold text-sm border shrink-0 ${
                         tx.type === 'Rent'
                         ? 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
                         : 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800'
                      }`}>
                         <span className="truncate max-w-[80px]">{tx.shopNumber}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                         <h4 className="font-bold text-gray-900 dark:text-white text-base truncate">{tx.ownerName}</h4>
                         <span className="text-xs text-gray-500 dark:text-gray-400 font-medium block mt-0.5">{(tx.date || '').split(',')[0]}</span>
                      </div>
                   </div>
                   
                   <p className="font-bold text-base text-gray-900 dark:text-white">Rs. {tx.amount.toLocaleString()}</p>
                </div>
                
                <div className="flex justify-between items-center border-t border-gray-50 dark:border-gray-700/50 pt-3 mt-2">
                   <div className="flex items-center gap-3">
                       <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border tracking-wide ${
                          tx.type === 'Rent' 
                          ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900' 
                          : 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-900'
                       }`}>
                          {tx.type}
                       </span>
                       <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                         <User size={12}/> {(tx.collectedBy || 'Unknown').split(' ')[0]}
                       </p>
                   </div>
                   {tx.note && <span className="text-xs text-gray-400 italic truncate max-w-[120px]">"{tx.note}"</span>}
                </div>
             </div>
         ))}
         {filteredTransactions.length === 0 && (
             <div className="text-center py-12 text-gray-400 flex flex-col items-center gap-2">
                <Search size={32} className="opacity-20" />
                <p className="text-sm font-medium">No records found.</p>
             </div>
         )}
      </div>

      {/* DESKTOP TABLE */}
      <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Shop Info</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Collected By</th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {filteredTransactions.map((tx, idx) => (
                        <tr key={tx.id + idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap font-medium">{tx.date}</td>
                            <td className="px-6 py-4">
                                <div className="flex items-center">
                                    <div className={`h-8 min-w-[2.5rem] w-auto px-2 rounded-md flex items-center justify-center font-bold text-xs mr-3 shrink-0 border ${
                                         tx.type === 'Rent'
                                         ? 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
                                         : 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800'
                                    }`}>
                                        <span className="truncate max-w-[80px]">{tx.shopNumber}</span>
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                       <span className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[150px]">{tx.ownerName}</span>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border tracking-wide ${
                                  tx.type === 'Rent' 
                                  ? 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-900' 
                                  : 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-900'
                                }`}>
                                  {tx.type}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                               <div className="flex items-center gap-1.5">
                                  <User size={14} className="text-gray-400"/> {tx.collectedBy}
                               </div>
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">Rs. {tx.amount.toLocaleString()}</td>
                        </tr>
                    ))}
                    {filteredTransactions.length === 0 && (
                        <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 font-medium">No transactions found.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default Revenue;
