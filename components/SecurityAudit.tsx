
import React from 'react';
import { useApp } from '../context/AppContext';
import { DICTIONARY } from '../types';
import { ShieldCheck, ShieldAlert, CheckCircle, AlertTriangle, Loader2, Sparkles } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export const SecurityAudit: React.FC = () => {
  const { vulnerabilities, fixVulnerability, language, startSecurityScan, isScanning, scanProgress, triggerAICopilot } = useApp();
  const t = DICTIONARY[language];

  const openVulns = vulnerabilities.filter(v => v.status === 'OPEN');
  const highSev = openVulns.filter(v => v.severity === 'HIGH').length;
  const medSev = openVulns.filter(v => v.severity === 'MEDIUM').length;
  const lowSev = openVulns.filter(v => v.severity === 'LOW').length;

  const score = Math.max(0, 100 - (highSev * 20 + medSev * 10 + lowSev * 5));

  const data = [
    { name: 'Secure', value: score, color: '#22c55e' },
    { name: 'Risk', value: 100 - score, color: '#ef4444' },
  ];

  const handleAskAI = (vuln: any) => {
      const prompt = `Can you explain the vulnerability "${vuln.description}" on device ${vuln.deviceName}? What is the recommended remediation besides "${vuln.remediation}"?`;
      triggerAICopilot(prompt);
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Security Score */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center relative overflow-hidden">
            <h3 className="text-slate-400 font-medium mb-4 z-10">{t.securityScore}</h3>
            <div className="w-40 h-40 relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            innerRadius={60}
                            outerRadius={75}
                            startAngle={90}
                            endAngle={-270}
                            dataKey="value"
                            stroke="none"
                        >
                             {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                             ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-4xl font-bold text-white">{score}</span>
                    <span className="text-xs text-slate-500">/ 100</span>
                </div>
            </div>
            <div className="absolute top-0 right-0 p-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        </div>

        {/* Stats */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-center space-y-6">
            <div className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                <div className="flex items-center gap-3">
                    <ShieldAlert className="text-red-500" />
                    <div>
                        <p className="text-sm text-slate-400">High Severity</p>
                        <p className="text-xl font-bold text-white">{highSev}</p>
                    </div>
                </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                <div className="flex items-center gap-3">
                    <AlertTriangle className="text-yellow-500" />
                    <div>
                        <p className="text-sm text-slate-400">Medium Severity</p>
                        <p className="text-xl font-bold text-white">{medSev}</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Action Panel */}
        <div className="bg-gradient-to-br from-blue-900 to-slate-900 border border-blue-800 rounded-xl p-6 flex flex-col justify-between relative overflow-hidden">
            <div>
                <h3 className="text-xl font-bold text-white mb-2">{isScanning ? t.scanning : t.scanNow}</h3>
                <p className="text-blue-200 text-sm mb-4">Run a comprehensive security scan across all network devices.</p>
            </div>
            
            {isScanning ? (
                <div className="w-full space-y-2">
                     <div className="flex justify-between text-xs text-blue-200">
                         <span>Progress</span>
                         <span>{scanProgress}%</span>
                     </div>
                     <div className="w-full bg-blue-900/50 rounded-full h-2 overflow-hidden">
                         <div className="h-full bg-blue-400 transition-all duration-300" style={{ width: `${scanProgress}%` }}></div>
                     </div>
                </div>
            ) : (
                <button 
                    onClick={startSecurityScan}
                    className="w-full py-3 bg-blue-500 hover:bg-blue-400 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-900/50 flex items-center justify-center gap-2"
                >
                    <ShieldCheck size={18} />
                    Start Deep Scan
                </button>
            )}
        </div>
      </div>

      {/* Vulnerability List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/30 flex justify-between items-center">
            <h3 className="font-semibold text-slate-200">{t.vulnerabilities}</h3>
            {isScanning && <Loader2 size={16} className="text-blue-500 animate-spin"/>}
        </div>
        <div className="divide-y divide-slate-800 max-h-[500px] overflow-y-auto">
            {vulnerabilities.map((vuln) => (
                <div key={vuln.id} className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors animate-in slide-in-from-left-2 duration-300">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                                vuln.severity === 'HIGH' ? 'bg-red-500/20 text-red-400' :
                                vuln.severity === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-blue-500/20 text-blue-400'
                            }`}>
                                {vuln.severity}
                            </span>
                            <span className="font-medium text-slate-200">{vuln.description}</span>
                            {vuln.cveId && <span className="text-xs text-slate-500 bg-slate-800 px-1 rounded">{vuln.cveId}</span>}
                        </div>
                        <p className="text-xs text-slate-500">Device: <span className="text-slate-300">{vuln.deviceName}</span> • {t.lastScan}: 10 mins ago</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        {vuln.status === 'FIXED' ? (
                            <span className="text-green-500 flex items-center gap-1 text-sm font-medium">
                                <CheckCircle size={16} /> Fixed
                            </span>
                        ) : (
                            <>
                                <button
                                    onClick={() => handleAskAI(vuln)}
                                    className="px-3 py-1.5 bg-purple-600/20 text-purple-400 hover:bg-purple-600/40 text-xs rounded transition-colors flex items-center gap-1"
                                >
                                    <Sparkles size={12}/> {t.askAIFix}
                                </button>
                                <button 
                                    onClick={() => fixVulnerability(vuln.id)}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded shadow-sm transition-colors"
                                >
                                    {t.fix}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            ))}
            {vulnerabilities.length === 0 && (
                <div className="p-8 text-center text-slate-500">
                    <ShieldCheck size={48} className="mx-auto mb-4 opacity-20" />
                    <p>No vulnerabilities detected. System is secure.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
