
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DICTIONARY } from '../types';
import { FileText, Sparkles, Filter, RefreshCw } from 'lucide-react';

export const LogAnalysis: React.FC = () => {
    const { syslogs, language, triggerAICopilot } = useApp();
    const t = DICTIONARY[language];
    const [filter, setFilter] = useState('');

    const filteredLogs = syslogs.filter(l => 
        l.message.toLowerCase().includes(filter.toLowerCase()) || 
        l.deviceId?.toLowerCase().includes(filter.toLowerCase())
    );

    const handleAnalyze = (log: any) => {
        triggerAICopilot(`Analyze this syslog message: "${log.rawSyslog}". What does it mean and how should I fix it?`);
    };

    return (
        <div className="space-y-6">
             <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white">{t.logAnalysis}</h2>
                    <p className="text-slate-400 text-sm">Centralized Syslog collection and AI-powered root cause analysis.</p>
                </div>
            </div>

            <div className="flex gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800">
                <div className="relative flex-1">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                        type="text" 
                        placeholder="Filter logs..." 
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>
                <button className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                    <RefreshCw size={16} /> Refresh
                </button>
            </div>

            <div className="bg-black rounded-xl border border-slate-800 overflow-hidden font-mono text-xs">
                <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 text-slate-400 font-bold flex justify-between">
                    <span>/var/log/syslog-ng/network.log</span>
                    <span>{filteredLogs.length} entries</span>
                </div>
                <div className="max-h-[600px] overflow-y-auto p-4 space-y-1">
                    {filteredLogs.map((log) => (
                        <div key={log.id} className="group flex items-start hover:bg-slate-900/50 p-1 rounded transition-colors">
                            <span className="text-slate-500 w-36 shrink-0">{log.timestamp.toLocaleTimeString()}</span>
                            <span className={`w-16 shrink-0 font-bold ${
                                log.level === 'ERROR' ? 'text-red-500' :
                                log.level === 'WARN' ? 'text-yellow-500' : 'text-blue-500'
                            }`}>{log.level}</span>
                            <span className="text-slate-400 w-24 shrink-0">{log.deviceId}</span>
                            <span className="text-slate-300 flex-1 break-all">{log.message}</span>
                            <button 
                                onClick={() => handleAnalyze(log)}
                                className="opacity-0 group-hover:opacity-100 ml-2 text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-opacity"
                                title="Analyze with AI"
                            >
                                <Sparkles size={12} /> AI
                            </button>
                        </div>
                    ))}
                    {filteredLogs.length === 0 && (
                        <div className="text-slate-600 text-center py-10">No logs found matching filter.</div>
                    )}
                </div>
            </div>
        </div>
    );
};
