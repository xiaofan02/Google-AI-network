
import React, { useState } from 'react';
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
  ClipboardCheck,
  ChevronDown,
  ChevronRight,
  Menu,
  FileCode,
  ArrowRightLeft
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DICTIONARY } from '../types';

interface NavItem {
  path: string;
  icon: React.ReactNode;
  label: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language, setLanguage, logs } = useApp();
  const location = useLocation();
  const t = DICTIONARY[language];

  // Recent alerts count
  const alertCount = logs.filter(l => l.level === 'WARN' || l.level === 'ERROR').length;

  // RESTRUCTURED MENU GROUPS FOR PROFESSIONAL NOC WORKFLOW
  const navGroups: NavGroup[] = [
    {
      label: t.menuMonitor, // Monitor / Dashboard
      items: [
        { path: '/', icon: <LayoutDashboard size={18} />, label: t.dashboard },
        { path: '/topology', icon: <Network size={18} />, label: t.topology },
        { path: '/cloud', icon: <Cloud size={18} />, label: t.cloud },
      ]
    },
    {
      label: t.menuAssets, // Assets
      items: [
        { path: '/devices', icon: <Server size={18} />, label: t.devices },
        { path: '/ipam', icon: <Map size={18} />, label: t.ipam },
      ]
    },
    {
      label: t.menuOps, // Analytics & Health
      items: [
        { path: '/inspection', icon: <ClipboardCheck size={18} />, label: t.inspection },
        { path: '/netflow', icon: <ArrowRightLeft size={18} />, label: t.netflow },
        { path: '/logs', icon: <FileText size={18} />, label: t.logs },
      ]
    },
    {
      label: t.menuNetOps, // Automation & Changes
      items: [
        { path: '/configuration', icon: <FileCode size={18} />, label: t.configMgmt },
        { path: '/automation', icon: <Workflow size={18} />, label: t.automation },
      ]
    },
    {
      label: t.menuSecurity, // Security
      items: [
        { path: '/security', icon: <ShieldCheck size={18} />, label: t.security },
        { path: '/threats', icon: <Bug size={18} />, label: t.threats },
      ]
    },
    {
      label: t.menuAdmin, // System
      items: [
        { path: '/reports', icon: <FileBarChart size={18} />, label: t.reports },
        { path: '/settings', icon: <Settings size={18} />, label: t.settings },
      ]
    }
  ];

  return (
    <div className="flex h-full w-full bg-slate-950">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col z-20 transition-all duration-300">
        <div className="p-6 flex items-center space-x-2 border-b border-slate-800 shrink-0">
          <Activity className="text-blue-500" size={28} />
          <span className="text-xl font-bold text-blue-100 tracking-tight">NetGuardian</span>
        </div>

        <nav className="flex-1 py-4 space-y-1 px-3 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
          {navGroups.map((group, idx) => (
             <NavGroupItem key={idx} group={group} location={location} />
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 shrink-0">
            <div className="flex items-center justify-between text-slate-400 px-4 py-2 bg-slate-800/50 rounded-lg">
                 <span className="text-sm flex items-center gap-2">
                    <Globe size={16}/>
                    {language === 'en' ? 'English' : '中文'}
                 </span>
                 <button 
                    onClick={() => setLanguage(language === 'en' ? 'cn' : 'en')}
                    className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded border border-slate-600 transition-colors"
                 >
                    Switch
                 </button>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-950 relative">
        {/* Header */}
        <header className="h-16 bg-slate-900/50 backdrop-blur-sm border-b border-slate-800 flex items-center justify-between px-8 sticky top-0 z-10 shrink-0">
            <h1 className="text-xl font-semibold text-slate-100">
                {/* Find label from nested groups */}
                {navGroups.flatMap(g => g.items).find(i => i.path === location.pathname)?.label || 'Overview'}
            </h1>
            
            <div className="flex items-center space-x-4">
                <div className="relative cursor-pointer group">
                    <Bell size={20} className="text-slate-400 group-hover:text-white transition-colors" />
                    {alertCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold animate-pulse">
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

const NavGroupItem: React.FC<{ group: NavGroup, location: any }> = ({ group, location }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const isActive = group.items.some(i => i.path === location.pathname);

    return (
        <div className="mb-2">
            <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-300 transition-colors"
            >
                {group.label}
                {isExpanded ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
            </button>
            
            <div className={`space-y-1 transition-all duration-300 overflow-hidden ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                {group.items.map(item => {
                    const isItemActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center space-x-3 px-4 py-2.5 mx-2 rounded-lg transition-all ${
                              isItemActive 
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' 
                                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100 hover:pl-5'
                            }`}
                        >
                            {item.icon}
                            <span className="font-medium text-sm">{item.label}</span>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
