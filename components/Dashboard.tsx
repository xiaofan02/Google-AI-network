import React from 'react';
import { useApp } from '../context/AppContext';
import { DICTIONARY, DeviceStatus } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Server, ShieldAlert, Activity, Cpu } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { devices, language, logs } = useApp();
  const t = DICTIONARY[language];

  // Aggregations
  const totalDevices = devices.length;
  const onlineDevices = devices.filter(d => d.status === DeviceStatus.ONLINE).length;
  const criticalDevices = devices.filter(d => d.status === DeviceStatus.CRITICAL).length;
  const warningDevices = devices.filter(d => d.status === DeviceStatus.WARNING).length;
  const avgCpu = devices.reduce((acc, d) => acc + d.cpuUsage, 0) / totalDevices || 0;
  const avgMem = devices.reduce((acc, d) => acc + d.memUsage, 0) / totalDevices || 0;

  // Chart Data Preparation
  const statusData = [
    { name: t.online, value: onlineDevices, color: '#22c55e' },
    { name: t.warning, value: warningDevices, color: '#eab308' },
    { name: t.critical, value: criticalDevices, color: '#ef4444' },
    { name: t.offline, value: totalDevices - onlineDevices - warningDevices - criticalDevices, color: '#64748b' }
  ];

  const performanceData = devices.slice(0, 10).map(d => ({
    name: d.name,
    cpu: d.cpuUsage,
    mem: d.memUsage
  }));

  return (
    <div className="space-y-6 pb-20">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
            icon={<Server className="text-blue-400" />} 
            title={t.totalDevices} 
            value={totalDevices.toString()}
            subValue={`${onlineDevices} ${t.online}`}
            color="border-blue-500/20 bg-slate-900"
        />
        <StatCard 
            icon={<ShieldAlert className="text-red-400" />} 
            title={t.alerts} 
            value={criticalDevices.toString()} 
            subValue={`${warningDevices} ${t.warning}`}
            color="border-red-500/20 bg-slate-900"
        />
        <StatCard 
            icon={<Cpu className="text-purple-400" />} 
            title={t.avgCpu} 
            value={`${avgCpu.toFixed(1)}%`}
            subValue={`Peak: ${Math.max(...devices.map(d => d.cpuUsage)).toFixed(1)}%`}
            color="border-purple-500/20 bg-slate-900"
        />
        <StatCard 
            icon={<Activity className="text-green-400" />} 
            title={t.avgMem} 
            value={`${avgMem.toFixed(1)}%`}
            subValue="Stable"
            color="border-green-500/20 bg-slate-900"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Resource Usage Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-200 mb-4">{t.topResources}</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickFormatter={(val) => val.split('-')[0]} />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
                    itemStyle={{ color: '#cbd5e1' }}
                />
                <Bar dataKey="cpu" fill="#60a5fa" name="CPU %" radius={[4, 4, 0, 0]} />
                <Bar dataKey="mem" fill="#a78bfa" name="Memory %" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Device Status Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-200 mb-4">{t.deviceStatusDist}</h3>
          <div className="h-80 w-full flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="70%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-4 text-sm text-slate-400 mt-4">
                {statusData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span>{item.name}: {item.value}</span>
                    </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Logs */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-200 mb-4">{t.eventLog}</h3>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700">
            {logs.length === 0 ? <p className="text-slate-500">{t.noEvents}</p> : logs.map((log) => (
                <div key={log.id} className={`p-3 rounded border-l-4 bg-slate-950 ${
                    log.level === 'ERROR' ? 'border-red-500' : 
                    log.level === 'WARN' ? 'border-yellow-500' : 
                    log.level === 'SUCCESS' ? 'border-green-500' : 'border-blue-500'
                }`}>
                    <div className="flex justify-between items-start">
                        <span className="text-slate-300 text-sm font-medium">{log.message}</span>
                        <span className="text-slate-500 text-xs whitespace-nowrap ml-4">
                            {log.timestamp.toLocaleTimeString()}
                        </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-bold">
                        {log.level} {log.deviceId && `• ${log.deviceId}`}
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode, title: string, value: string, subValue: string, color: string }> = ({ icon, title, value, subValue, color }) => (
    <div className={`p-6 rounded-xl border ${color} shadow-sm`}>
        <div className="flex items-center justify-between">
            <div>
                <p className="text-slate-400 text-sm font-medium">{title}</p>
                <h4 className="text-2xl font-bold text-white mt-2">{value}</h4>
                <p className="text-slate-500 text-xs mt-1">{subValue}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-800/50 backdrop-blur-sm">
                {icon}
            </div>
        </div>
    </div>
);