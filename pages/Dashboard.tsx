import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Store, DollarSign, TrendingUp, Calendar, ChevronRight, Wrench, ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';

const Dashboard = () => {
  const { shops, rentRecords, maintenanceCollections, settings } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'rent' | 'maintenance'>('rent');

  // --- DATA CALCULATIONS --- //

  // 1. Occupancy
  const totalShops = shops.length;
  const occupiedShops = shops.filter(s => s.status === 'Occupied').length;
  const occupancyRate = totalShops > 0 ? Math.round((occupiedShops / totalShops) * 100) : 0;

  // 2. Helper: Date Parser (Matches Revenue.tsx logic for consistency)
  const parseDate = (dateStr: string) => {
    if (!dateStr) return new Date(0);
    let d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d;
    
    // Handle DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10);
      const month = parseInt(dmyMatch[2], 10) - 1;
      const year = parseInt(dmyMatch[3], 10);
      d = new Date(year, month, day);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date(0);
  };

  // 3. Revenue: Calculate THIS MONTH'S Revenue based on actual transaction dates
  const { revenueThisMonth, rentThisMonth, maintThisMonth } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let r = 0;
    let m = 0;

    // Sum Rent Transactions for current month
    rentRecords.forEach(rec => {
        if(rec.transactions) {
            rec.transactions.forEach(tx => {
                const d = parseDate(tx.date);
                if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
                    r += (typeof tx.amount === 'string' ? parseFloat(tx.amount) : tx.amount) || 0;
                }
            });
        }
    });

    // Sum Maintenance Transactions for current month
    maintenanceCollections.forEach(rec => {
        if(rec.transactions) {
            rec.transactions.forEach(tx => {
                const d = parseDate(tx.date);
                if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
                    m += (typeof tx.amount === 'string' ? parseFloat(tx.amount) : tx.amount) || 0;
                }
            });
        }
    });

    return { revenueThisMonth: r + m, rentThisMonth: r, maintThisMonth: m };
  }, [rentRecords, maintenanceCollections]);

  // 4. Pending Dues: Total outstanding balance (All Time)
  const totalPendingDues = useMemo(() => {
      const rentPending = rentRecords.reduce((acc, curr) => acc + ((curr.amount || 0) - (curr.collected || 0)), 0);
      const maintPending = maintenanceCollections.reduce((acc, curr) => acc + ((curr.amount || 0) - (curr.collected || 0)), 0);
      return rentPending + maintPending;
  }, [rentRecords, maintenanceCollections]);


  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const [y, m] = dateStr.split('-');
      const date = new Date(parseInt(y), parseInt(m) - 1);
      return date.toLocaleString('default', { month: 'short', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  const StatCard = ({ title, value, subtext, icon: Icon, colorClass, bgClass }: any) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group hover:shadow-md transition-all">
      <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity ${colorClass}`}>
        <Icon size={64} />
      </div>
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${bgClass} ${colorClass}`}>
           <Icon size={24} />
        </div>
        <div>
           <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">{title}</p>
           <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</h3>
           {subtext && <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 font-medium flex items-center gap-1">{subtext}</p>}
        </div>
      </div>
    </div>
  );

  const displayedRecords = activeTab === 'rent' ? rentRecords.slice(0, 5) : maintenanceCollections.slice(0, 5);

  return (
    <div className="space-y-8 pb-24 md:pb-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{settings.plazaName}</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
             Financial Overview • {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-xl text-sm font-medium shadow-sm">
          <Calendar size={16} />
          <span>{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          title="Revenue (This Month)" 
          value={`Rs. ${(revenueThisMonth || 0).toLocaleString()}`} 
          subtext={
            <>
               <span className="text-green-600 dark:text-green-400 flex items-center"><ArrowUpRight size={12}/> Rent: {rentThisMonth.toLocaleString()}</span>
               <span className="mx-1">•</span>
               <span>Maint: {maintThisMonth.toLocaleString()}</span>
            </>
          }
          icon={Wallet} 
          colorClass="text-green-600"
          bgClass="bg-green-100 dark:bg-green-900/30"
        />
        <StatCard 
          title="Occupancy Rate" 
          value={`${occupancyRate}%`} 
          subtext={`${occupiedShops} of ${totalShops} Units Occupied`}
          icon={Store} 
          colorClass="text-blue-600"
          bgClass="bg-blue-100 dark:bg-blue-900/30"
        />
        <StatCard 
          title="Total Outstanding" 
          value={`Rs. ${(totalPendingDues || 0).toLocaleString()}`} 
          subtext={<span className="text-orange-600 dark:text-orange-400">Total Pending Dues (All Time)</span>}
          icon={TrendingUp} 
          colorClass="text-orange-600"
          bgClass="bg-orange-100 dark:bg-orange-900/30"
        />
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
           <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Bills</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Latest generated bills and their status.</p>
           </div>
           
           <div className="flex items-center gap-2">
               <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700/50 p-1 rounded-lg">
                  <button 
                    onClick={() => setActiveTab('rent')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'rent' ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                  >
                    Rent
                  </button>
                  <button 
                    onClick={() => setActiveTab('maintenance')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'maintenance' ? 'bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                  >
                    Maint.
                  </button>
               </div>
               <button 
                  onClick={() => navigate(activeTab === 'rent' ? '/rent' : '/maintenance')}
                  className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
               >
                  <ArrowUpRight size={18} />
               </button>
           </div>
        </div>

        <div className="space-y-4">
          {displayedRecords.map(record => (
            <div key={record.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700/50 gap-4 hover:border-gray-200 dark:hover:border-gray-600 transition-colors cursor-pointer" onClick={() => navigate(activeTab === 'rent' ? '/rent' : '/maintenance')}>
              
              {/* Left Side: Shop Info */}
              <div className="flex items-center gap-4">
                <div className={`h-10 min-w-[2.5rem] w-auto px-2 rounded-lg flex items-center justify-center shrink-0 font-bold text-sm border ${
                  activeTab === 'rent'
                    ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800'
                    : 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800'
                }`}>
                  <span className="truncate max-w-[80px]">{record.shopNumber}</span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">{record.ownerName}</h4>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
                    {formatDate(record.month)}
                  </p>
                </div>
              </div>

              {/* Right Side: Amount & Status */}
              <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-gray-200 dark:border-gray-700 pt-3 sm:pt-0">
                <div className="text-right">
                   <p className="font-bold text-gray-900 dark:text-white">Rs. {(record.amount || 0).toLocaleString()}</p>
                   {((record.amount || 0) - (record.collected || 0)) > 0 && (
                       <p className="text-[10px] text-red-500 font-medium">Due: {((record.amount || 0) - (record.collected || 0)).toLocaleString()}</p>
                   )}
                </div>
                <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                  record.status === 'Paid' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900' :
                  record.status === 'Pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900' : 
                  'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900'
                }`}>
                  {record.status}
                </div>
              </div>
            </div>
          ))}
          {displayedRecords.length === 0 && (
             <div className="text-center py-10">
                <p className="text-gray-400 dark:text-gray-500 text-sm font-medium">No activity recorded yet.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;