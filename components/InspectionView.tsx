
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DICTIONARY, InspectionItem } from '../types';
import { ClipboardCheck, Play, CheckCircle, XCircle, AlertTriangle, Sparkles, Download, PieChart as PieIcon, Clock, History } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export const InspectionView: React.FC = () => {
    const { language, startInspection, isInspecting, inspectionProgress, inspectionReport, inspectionHistory, selectInspectionReport, triggerAICopilot, inspectionSettings, updateInspectionSettings } = useApp();
    const t = DICTIONARY[language];
    const [filter, setFilter] = useState<'ALL' | 'FAIL'>('ALL');

    const handleDiagnose = (item: InspectionItem) => {
        triggerAICopilot(`Diagnose inspection failure for device ${item.deviceName} (ID: ${item.deviceId}). Failed check: ${item.checkType}. Error message: "${item.message}". How do I fix this?`);
    }

    const downloadReport = () => {
        if(!inspectionReport) return;
        const content = JSON.stringify(inspectionReport, null, 2);
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Inspection_Report_${new Date().toISOString()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    const chartData = inspectionReport ? [
        { name: 'Pass', value: inspectionReport.passedChecks, color: '#22c55e' },
        { name: 'Fail', value: inspectionReport.failedChecks, color: '#ef4444' },
    ] : [];

    const filteredItems = inspectionReport?.items.filter(item => filter === 'ALL' || item.status !== 'PASS') || [];

    return (
        <div className="h-full flex flex-col space-y-4 overflow-hidden">
            <div className="flex justify-between items-center shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-white">{t.inspection}</h2>
                    <p className="text-slate-400 text-sm">Automated network health check and compliance patrol.</p>
                </div>
            </div>

            <div className="flex-1 flex gap-6 min-h-0">
                {/* Sidebar: History & Schedule */}
                <div className="w-72 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col overflow-hidden shrink-0">
                     <div className="mb-6 border-b border-slate-800 pb-4">
                         <h3 className="text-slate-200 font-semibold mb-3 flex items-center gap-2">
                             <Clock size={16} /> {t.autoInspection}
                         </h3>
                         <div className="space-y-3">
                             <div className="flex items-center justify-between">
                                 <span className="text-xs text-slate-400">{t.enableSchedule}</span>
                                 <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={inspectionSettings.enabled} 
                                        onChange={(e) => updateInspectionSettings({ enabled: e.target.checked })} 
                                        className="sr-only peer" 
                                    />
                                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                 </label>
                             </div>
                             {inspectionSettings.enabled && (
                                 <div className="flex items-center gap-2 animate-in slide-in-from-top-2">
                                     <span className="text-xs text-slate-500">{t.every}</span>
                                     <input 
                                        type="number" 
                                        min="10" 
                                        max="1440" 
                                        value={inspectionSettings.interval}
                                        onChange={(e) => updateInspectionSettings({ interval: parseInt(e.target.value) })}
                                        className="w-16 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none"
                                     />
                                     <span className="text-xs text-slate-500">{t.minutes}</span>
                                 </div>
                             )}
                             {inspectionSettings.nextRun && (
                                 <p className="text-[10px] text-slate-500">
                                     Next run: {inspectionSettings.nextRun.toLocaleTimeString()}
                                 </p>
                             )}
                         </div>
                     </div>

                     <div className="flex-1 overflow-hidden flex flex-col">
                         <h3 className="text-slate-200 font-semibold mb-3 flex items-center gap-2">
                             <History size={16} /> {t.history}
                         </h3>
                         <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-slate-700">
                             {inspectionHistory.map(report => (
                                 <div 
                                    key={report.id}
                                    onClick={() => selectInspectionReport(report.id)}
                                    className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                                        inspectionReport?.id === report.id ? 'bg-blue-900/20 border-blue-500' : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800'
                                    }`}
                                 >
                                     <div className="flex justify-between items-start">
                                         <span className="text-xs font-bold text-slate-300">{report.startTime.toLocaleTimeString()}</span>
                                         <span className={`text-[10px] px-1.5 rounded ${report.score >= 90 ? 'bg-green-900/30 text-green-400' : 'bg-yellow-900/30 text-yellow-400'}`}>
                                             {report.score}%
                                         </span>
                                     </div>
                                     <div className="mt-1 flex gap-2 text-[10px] text-slate-500">
                                         <span className="text-red-400">{report.failedChecks} Fail</span>
                                         <span>{report.totalChecks} Total</span>
                                     </div>
                                 </div>
                             ))}
                             {inspectionHistory.length === 0 && (
                                 <div className="text-center py-4 text-xs text-slate-500">No history yet.</div>
                             )}
                         </div>
                     </div>
                </div>

                {/* Main Panel */}
                <div className="flex-1 flex flex-col space-y-4 min-w-0">
                    {/* Status / Control */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shrink-0">
                        <div className="flex flex-col md:flex-row gap-6 items-center">
                            <div className="flex-1 w-full">
                                {isInspecting ? (
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm text-blue-300">
                                            <span>{t.inspectionProgress}</span>
                                            <span>{inspectionProgress}%</span>
                                        </div>
                                        <div className="w-full bg-slate-800 h-4 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-blue-500 transition-all duration-300 striped-bar" 
                                                style={{ width: `${inspectionProgress}%` }}
                                            ></div>
                                        </div>
                                        <p className="text-xs text-slate-500 animate-pulse">Checking connectivity, CPU, memory, and config consistency...</p>
                                    </div>
                                ) : (
                                    <div className="flex gap-4 items-center">
                                        <button 
                                            onClick={startInspection}
                                            className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-lg shadow-lg shadow-blue-900/40 flex items-center gap-2 transition-transform hover:scale-105"
                                        >
                                            <Play size={24} fill="white" /> {t.startInspection}
                                        </button>
                                        {inspectionReport && (
                                            <div className="flex gap-4 px-6 border-l border-slate-800">
                                                <div className="text-center">
                                                    <p className="text-xs text-slate-500">{t.inspectionScore}</p>
                                                    <p className={`text-2xl font-bold ${inspectionReport.score >= 90 ? 'text-green-500' : 'text-yellow-500'}`}>{inspectionReport.score}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-xs text-slate-500">{t.checksFailed}</p>
                                                    <p className="text-2xl font-bold text-red-500">{inspectionReport.failedChecks}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            
                            {/* Mini Chart */}
                            {inspectionReport && !isInspecting && (
                                <div className="h-32 w-32 relative shrink-0">
                                     <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={chartData} innerRadius={25} outerRadius={35} paddingAngle={5} dataKey="value">
                                                {chartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <PieIcon size={16} className="text-slate-600"/>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Results List */}
                    {inspectionReport && !isInspecting && (
                        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col min-h-0 animate-in fade-in slide-in-from-bottom-4">
                            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50 shrink-0">
                                <div className="flex gap-4 items-center">
                                    <h3 className="font-bold text-white">
                                        {t.inspectionResults} 
                                        <span className="ml-2 text-xs font-normal text-slate-500">{inspectionReport.startTime.toLocaleString()}</span>
                                    </h3>
                                    <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
                                        <button 
                                            onClick={() => setFilter('ALL')}
                                            className={`px-3 py-1 rounded text-xs transition-colors ${filter === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                        >
                                            All ({inspectionReport.items.length})
                                        </button>
                                        <button 
                                            onClick={() => setFilter('FAIL')}
                                            className={`px-3 py-1 rounded text-xs transition-colors ${filter === 'FAIL' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                        >
                                            Failed ({inspectionReport.failedChecks})
                                        </button>
                                    </div>
                                </div>
                                <button onClick={downloadReport} className="text-slate-400 hover:text-white flex items-center gap-2 text-sm">
                                    <Download size={16} /> Export JSON
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto divide-y divide-slate-800 p-0">
                                {filteredItems.map(item => (
                                    <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-full ${
                                                item.status === 'PASS' ? 'bg-green-500/10 text-green-500' :
                                                item.status === 'FAIL' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'
                                            }`}>
                                                {item.status === 'PASS' && <CheckCircle size={18} />}
                                                {item.status === 'FAIL' && <XCircle size={18} />}
                                                {item.status === 'WARNING' && <AlertTriangle size={18} />}
                                            </div>
                                            <div>
                                                <p className="text-slate-200 font-medium">{item.deviceName}</p>
                                                <p className="text-xs text-slate-500">Check: {item.checkType} • {item.message}</p>
                                            </div>
                                        </div>
                                        
                                        {item.status !== 'PASS' && (
                                            <button 
                                                onClick={() => handleDiagnose(item)}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 rounded text-xs transition-colors"
                                            >
                                                <Sparkles size={12} /> {t.diagnose}
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {filteredItems.length === 0 && (
                                     <div className="p-8 text-center text-slate-500">
                                         <CheckCircle size={48} className="mx-auto mb-4 opacity-20 text-green-500" />
                                         <p>All checks passed!</p>
                                     </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
