import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Store, DollarSign, TrendingUp, Calendar, ChevronRight, Wrench } from 'lucide-react';

const Dashboard = () => {
  const { shops, rentRecords, maintenanceCollections, settings } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'rent' | 'maintenance'>('rent');

  const totalShops = shops.length;
  const occupiedShops = shops.filter(s => s.status === 'Occupied').length;
  
  const totalRentCollected = rentRecords.reduce((acc, curr) => acc + (curr.collected || 0), 0);
  const totalMaintCollected = maintenanceCollections.reduce((acc, curr) => acc + (curr.collected || 0), 0);
  const totalRevenue = totalRentCollected + totalMaintCollected;

  const pendingRent = rentRecords.reduce((acc, curr) => acc + ((curr.amount || 0) - (curr.collected || 0)), 0);
  const pendingMaintMoney = maintenanceCollections.reduce((acc, curr) => acc + ((curr.amount || 0) - (curr.collected || 0)), 0);
  const totalPendingDues = pendingRent + pendingMaintMoney;

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

  const StatCard = ({ title, value, subtext, icon: Icon, color }: any) => (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-start justify-between hover:shadow-md transition-all">
      <div className="flex-1 min-w-0 pr-2">
        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium truncate">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1 truncate">{value}</h3>
        {subtext && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">{subtext}</p>}
      </div>
      <div className={`p-3 rounded-xl shrink-0 ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  );

  const displayedRecords = activeTab === 'rent' ? rentRecords.slice(0, 5) : maintenanceCollections.slice(0, 5);

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{settings.plazaName}</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Overview of {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-lg text-sm font-medium w-fit">
          <Calendar size={16} />
          <span>{new Date().toDateString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard 
          title="Total Revenue" 
          value={`Rs. ${(totalRevenue || 0).toLocaleString()}`} 
          subtext={`Rent: ${(totalRentCollected || 0).toLocaleString()} + Maint: ${(totalMaintCollected || 0).toLocaleString()}`}
          icon={DollarSign} 
          color="bg-green-500" 
        />
        <StatCard 
          title="Occupancy" 
          value={`${occupiedShops}/${totalShops}`} 
          subtext={`${totalShops > 0 ? Math.round((occupiedShops/totalShops)*100) : 0}% Occupied`}
          icon={Store} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="Pending Dues" 
          value={`Rs. ${(totalPendingDues || 0).toLocaleString()}`} 
          subtext="Unpaid Rent & Maintenance"
          icon={TrendingUp} 
          color="bg-orange-400" 
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 md:p-6 transition-all">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
             <div className="flex items-center gap-4 bg-gray-100 dark:bg-gray-700/50 p-1 rounded-xl w-full sm:w-auto">
                <button 
                  onClick={() => setActiveTab('rent')}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'rent' ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                >
                  <DollarSign size={16} /> Rent
                </button>
                <button 
                  onClick={() => setActiveTab('maintenance')}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'maintenance' ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-300 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                >
                  <Wrench size={16} /> Maintenance
                </button>
             </div>
             
             <button 
                onClick={() => navigate(activeTab === 'rent' ? '/rent' : '/maintenance')}
                className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline focus:outline-none flex items-center gap-1 self-end sm:self-auto"
             >
                View All {activeTab === 'rent' ? 'Rent' : 'Maintenance'} <ChevronRight size={16} />
             </button>
          </div>

          <div className="space-y-3">
            {displayedRecords.map(record => (
              <div key={record.id} className="flex items-start justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-600 gap-3">
                
                {/* Left Side: Shop Info */}
                <div className="flex items-start space-x-3 flex-1 min-w-0">
                  <div className={`min-w-[2.5rem] max-w-[6rem] sm:max-w-[8rem] h-auto px-2 py-1 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs border mt-0.5 break-words text-center ${
                    activeTab === 'rent'
                      ? 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
                      : 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800'
                  }`}>
                    {record.shopNumber}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-words leading-snug">{record.ownerName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{formatDate(record.month)} • {activeTab === 'rent' ? 'Rent' : 'Maintenance'}</p>
                  </div>
                </div>

                {/* Right Side: Amount & Status */}
                <div className="text-right shrink-0 ml-2">
                  <p className="text-sm font-bold text-gray-900 dark:text-white whitespace-nowrap">Rs. {(record.amount || 0).toLocaleString()}</p>
                  <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium mt-1 ${
                    record.status === 'Paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                    record.status === 'Pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                  }`}>
                    {record.status}
                  </span>
                </div>
              </div>
            ))}
            {displayedRecords.length === 0 && <p className="text-center text-gray-400 dark:text-gray-500 py-8 text-sm">No recent transactions found.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;