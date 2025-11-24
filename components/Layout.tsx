
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Network, 
  Server, 
  Settings, 
  Activity, 
  Globe,
  Bell,
  ShieldCheck,
  FileBarChart,
  Map,
  Bug,
  FileText,
  Workflow,
  Cloud,
  ClipboardCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DICTIONARY } from '../types';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language, setLanguage, logs } = useApp();
  const location = useLocation();
  const t = DICTIONARY[language];

  // Recent alerts count
  const alertCount = logs.filter(l => l.level === 'WARN' || l.level === 'ERROR').length;

  const navItems = [
    { path: '/', icon: <LayoutDashboard size={20} />, label: t.dashboard },
    { path: '/topology', icon: <Network size={20} />, label: t.topology },
    { path: '/devices', icon: <Server size={20} />, label: t.devices },
    { path: '/inspection', icon: <ClipboardCheck size={20} />, label: t.inspection }, // New Inspection
    { path: '/cloud', icon: <Cloud size={20} />, label: t.cloud },
    { path: '/automation', icon: <Workflow size={20} />, label: t.automation },
    { path: '/ipam', icon: <Map size={20} />, label: t.ipam },
    { path: '/reports', icon: <FileBarChart size={20} />, label: t.reports },
    { path: '/security', icon: <ShieldCheck size={20} />, label: t.security },
    { path: '/threats', icon: <Bug size={20} />, label: t.threats },
    { path: '/logs', icon: <FileText size={20} />, label: t.logs },
    { path: '/settings', icon: <Settings size={20} />, label: t.settings },
  ];

  return (
    <div className="flex h-full w-full bg-slate-950">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col z-20">
        <div className="p-6 flex items-center space-x-2 border-b border-slate-800">
          <Activity className="text-blue-500" size={28} />
          <span className="text-xl font-bold text-blue-100 tracking-tight">NetGuardian</span>
        </div>

        <nav className="flex-1 py-6 space-y-1 px-3 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
            <div className="flex items-center justify-between text-slate-400 px-4 py-2">
                 <span className="text-sm flex items-center gap-2">
                    <Globe size={16}/>
                    {language === 'en' ? 'English' : '中文'}
                 </span>
                 <button 
                    onClick={() => setLanguage(language === 'en' ? 'cn' : 'en')}
                    className="text-xs bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded border border-slate-700"
                 >
                    Switch
                 </button>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-950 relative">
        {/* Header */}
        <header className="h-16 bg-slate-900/50 backdrop-blur-sm border-b border-slate-800 flex items-center justify-between px-8 sticky top-0 z-10">
            <h1 className="text-xl font-semibold text-slate-100">
                {navItems.find(i => i.path === location.pathname)?.label || 'Overview'}
            </h1>
            
            <div className="flex items-center space-x-4">
                <div className="relative cursor-pointer">
                    <Bell size={20} className="text-slate-400 hover:text-white transition-colors" />
                    {alertCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold">
                            {alertCount > 9 ? '9+' : alertCount}
                        </span>
                    )}
                </div>
                <div className="h-8 w-8 rounded-full bg-blue-500/20 border border-blue-500/50 flex items-center justify-center text-blue-400 font-bold text-sm">
                    AD
                </div>
            </div>
        </header>

        {/* Viewport */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {children}
        </div>
      </main>
    </div>
  );
};
