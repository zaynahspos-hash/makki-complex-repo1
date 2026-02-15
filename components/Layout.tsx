import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Store, DollarSign, Wrench, Settings, LogOut, Menu, User as UserIcon, Moon, Sun, Banknote } from 'lucide-react';
import { useApp } from '../context/AppContext';
import clsx from 'clsx';
import { Permission } from '../types';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, theme, toggleTheme, settings } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname === path;

  const allNavItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/', permission: 'dashboard' as Permission },
    { icon: Banknote, label: 'Revenue', path: '/revenue', permission: 'revenue' as Permission },
    { icon: Store, label: 'Shops', path: '/shops', permission: 'shops' as Permission },
    { icon: DollarSign, label: 'Rent', path: '/rent', permission: 'rent' as Permission },
    { icon: Wrench, label: 'Maintenance', path: '/maintenance', permission: 'maintenance' as Permission },
    { icon: Settings, label: 'Settings', path: '/settings', permission: 'settings' as Permission },
  ];

  // Fallback: If user has 'dashboard' or is admin, show Revenue for now if not explicitly in permissions list
  // ensuring backward compatibility for existing users
  const navItems = allNavItems.filter(item => {
    if (user?.role === 'admin') return true;
    if (item.permission === 'revenue') return user?.permissions?.includes('dashboard') || user?.permissions?.includes('revenue');
    return user?.permissions?.includes(item.permission);
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col md:flex-row transition-colors duration-200">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 fixed h-full z-30 transition-colors duration-200">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center space-x-3">
          <img 
            src="https://res.cloudinary.com/dguw4vfjc/image/upload/v1770670391/shme3oddvvyl7nmcyup5.webp" 
            alt="Plaza Logo" 
            className="w-14 h-14 rounded-xl object-cover shrink-0 shadow-sm"
          />
          <span className="font-bold text-lg text-gray-800 dark:text-white truncate" title={settings.plazaName}>
            {settings.plazaName || 'Plaza Manager'}
          </span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={clsx(
                "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
                isActive(item.path)
                  ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              )}
            >
              <item.icon size={28} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100 dark:border-gray-700">
          <div className="px-4 py-2 mb-2">
             <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Logged in as</p>
             <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{user?.displayName}</p>
          </div>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen pb-24 md:pb-0">
        
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16 px-4 md:px-8 flex items-center justify-between sticky top-0 z-20 transition-colors duration-200">
          <div className="flex items-center space-x-3 md:hidden overflow-hidden">
             <img 
                src="https://res.cloudinary.com/dguw4vfjc/image/upload/v1770670391/shme3oddvvyl7nmcyup5.webp" 
                alt="Plaza Logo" 
                className="w-10 h-10 rounded-lg object-cover shrink-0"
             />
             <span className="font-bold text-lg text-gray-800 dark:text-white truncate">
                {settings.plazaName || 'Plaza'}
             </span>
          </div>
          
          <div className="hidden md:block">
            <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
              {navItems.find(i => isActive(i.path))?.label || 'Plaza Manager'}
            </h1>
          </div>

          <div className="flex items-center space-x-4 shrink-0">
            <button 
              onClick={toggleTheme}
              className="p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded-full transition-colors"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button 
                 onClick={() => setIsProfileOpen(!isProfileOpen)}
                 className="flex items-center space-x-2 focus:outline-none"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:ring-2 hover:ring-blue-200 dark:hover:ring-blue-900 transition-all">
                  {user?.displayName?.[0] || 'U'}
                </div>
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-1 z-50 transform origin-top-right transition-all">
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user?.displayName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                  </div>
                  
                  <button 
                    onClick={() => navigate('/settings')}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Settings size={16} /> Settings
                  </button>

                  <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 w-full p-4 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation - High Z-Index & Safe Area Aware */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 w-full bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-around z-[1000] overflow-x-auto no-scrollbar pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] dark:shadow-none min-h-[4rem]">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={clsx(
              "flex flex-col items-center justify-center min-w-0 flex-1 py-1 transition-colors",
              isActive(item.path) 
                ? "text-blue-600 dark:text-blue-400" 
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            )}
          >
            <div className={clsx("p-1 rounded-xl transition-all flex-shrink-0", isActive(item.path) && "bg-blue-50 dark:bg-gray-700")}>
               <item.icon size={24} className="block" strokeWidth={isActive(item.path) ? 2.5 : 2} />
            </div>
            <span className="text-[10px] font-medium whitespace-nowrap truncate w-full text-center">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Layout;