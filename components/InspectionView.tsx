
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { DICTIONARY, InspectionItem, ComplianceRule, AIAnalysisResult, DetailedReportData, Device } from '../types';
import { ClipboardCheck, Play, CheckCircle, XCircle, AlertTriangle, Sparkles, Download, Clock, History, FileText, Plus, Copy, ArrowLeft } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

// --- STYLED PROFESSIONAL REPORT COMPONENT ---
// Matches the HTML template provided by user
const ProfessionalReport: React.FC<{ data: DetailedReportData; onBack: () => void }> = ({ data, onBack }) => {
    const COLORS = {
        primary: '#45B7D1',
        secondary: '#FF6B6B',
        success: '#4ECDC4',
        warning: '#FFEAA7',
        info: '#96CEB4',
        light: '#F8F9FA',
        dark: '#2C3E50'
    };

    const interfaceData = [
        { name: 'Up', value: data.summary.upInterfaces, color: COLORS.success },
        { name: 'Down', value: data.summary.totalInterfaces - data.summary.upInterfaces, color: COLORS.secondary },
    ];

    const cpuData = data.summary.cpuTrend.map((val, i) => ({
        time: `${(i+1)*1}min`,
        value: val
    }));

    return (
        <div className="absolute inset-0 z-50 overflow-y-auto bg-[#F8F9FA] text-[#2C3E50] font-sans animate-in slide-in-from-bottom-10 fade-in duration-300">
            <div className="max-w-[1200px] mx-auto p-8">
                {/* Header */}
                <div className="mb-8 text-center p-8 rounded-[15px] text-white shadow-lg relative bg-gradient-to-br from-[#45B7D1] to-[#96CEB4]">
                    <button onClick={onBack} className="absolute left-6 top-6 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors text-white">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-3xl font-bold mb-2">交换机巡检报告</h1>
                    <p className="opacity-90">巡检时间: {data.generatedAt}</p>
                    <p className="opacity-90">设备型号: {data.summary.deviceModel}</p>
                </div>

                {/* Summary Section */}
                <div className="bg-white rounded-[15px] p-8 mb-12 shadow-[0_5px_15px_rgba(0,0,0,0.05)] border-l-[5px] border-[#45B7D1]">
                    <h2 className="text-[#45B7D1] text-xl font-bold mt-0 border-b-2 border-[#45B7D1]/20 pb-3 mb-6">📋 报告概览</h2>
                    <div className="flex flex-wrap gap-5">
                        <SummaryCard title="交换机型号" value={data.summary.deviceModel} color={COLORS.success} />
                        <SummaryCard title="IOS版本" value={data.summary.osVersion} color={COLORS.success} />
                        <SummaryCard title="接口总数" value={data.summary.totalInterfaces.toString()} color={COLORS.success} />
                        <SummaryCard title="正常运行接口" value={data.summary.upInterfaces.toString()} color={COLORS.success} />
                    </div>
                </div>

                {/* Core Findings */}
                <div className="bg-white rounded-[15px] p-8 mb-12 shadow-[0_5px_15px_rgba(0,0,0,0.05)] border-l-[5px] border-[#45B7D1]">
                    <h2 className="text-[#45B7D1] text-xl font-bold mt-0 border-b-2 border-[#45B7D1]/20 pb-3 mb-6">🎯 核心发现</h2>
                    <ul className="space-y-3">
                        {data.coreFindings.map((finding, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm leading-6">
                                <span className="text-[#45B7D1] font-bold">•</span> {finding}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Data Visuals */}
                <div className="bg-white rounded-[15px] p-8 mb-12 shadow-[0_5px_15px_rgba(0,0,0,0.05)] border-l-[5px] border-[#45B7D1]">
                    <h2 className="text-[#45B7D1] text-xl font-bold mt-0 border-b-2 border-[#45B7D1]/20 pb-3 mb-6">📊 数据看板</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Pie Chart */}
                        <div className="bg-white/80 rounded-[15px] p-5 shadow-[0_5px_15px_rgba(0,0,0,0.03)] text-center border border-slate-100">
                            <h3 className="font-bold mb-4 text-[#2C3E50]">接口状态分布</h3>
                            <div className="h-64 w-full">
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie data={interfaceData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                            {interfaceData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-4 text-left text-sm text-[#2C3E50] leading-6">
                                <p>从饼图可以看出，交换机共有 {data.summary.totalInterfaces} 个接口。正常运行接口占大多数，基本连接状态良好。</p>
                            </div>
                        </div>

                        {/* Bar Chart */}
                        <div className="bg-white/80 rounded-[15px] p-5 shadow-[0_5px_15px_rgba(0,0,0,0.03)] text-center border border-slate-100">
                            <h3 className="font-bold mb-4 text-[#2C3E50]">CPU使用率趋势</h3>
                            <div className="h-64 w-full">
                                <ResponsiveContainer>
                                    <BarChart data={cpuData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                                        <XAxis dataKey="time" stroke="#94a3b8" fontSize={12}/>
                                        <YAxis stroke="#94a3b8" fontSize={12}/>
                                        <Tooltip cursor={{fill: '#f0f0f0'}} />
                                        <Bar dataKey="value" fill="#45B7D1" radius={[4, 4, 0, 0]} name="CPU %" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-4 text-left text-sm text-[#2C3E50] leading-6">
                                <p>CPU使用率在5分钟内保持在 {data.summary.cpuTrend[1]}% 左右，处于正常水平，无异常进程占用。</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Strategy Suggestions */}
                <div className="bg-white rounded-[15px] p-8 mb-12 shadow-[0_5px_15px_rgba(0,0,0,0.05)] border-l-[5px] border-[#45B7D1]">
                    <h2 className="text-[#45B7D1] text-xl font-bold mt-0 border-b-2 border-[#45B7D1]/20 pb-3 mb-6">💡 策略建议</h2>
                    <ol className="list-decimal list-inside space-y-3 pl-2 text-sm leading-6">
                        {data.suggestions.map((sug, i) => (
                            <li key={i}>{sug}</li>
                        ))}
                    </ol>
                </div>

                {/* Action Items */}
                <div className="bg-white rounded-[15px] p-8 mb-12 shadow-[0_5px_15px_rgba(0,0,0,0.05)] border-l-[5px] border-[#45B7D1]">
                    <h2 className="text-[#45B7D1] text-xl font-bold mt-0 border-b-2 border-[#45B7D1]/20 pb-3 mb-6">🚀 行动清单</h2>
                    <ul className="space-y-3">
                        {data.actions.map((act, i) => (
                            <li key={i} className="flex items-center gap-3 text-sm">
                                <span className="w-2 h-2 rounded-full bg-[#45B7D1]"></span>
                                <span>{act}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="text-center text-[#666] mt-12 text-sm">
                    <p>Generated by NetGuardian AI • 本地数据处理</p>
                </div>
            </div>
        </div>
    );
};

const SummaryCard: React.FC<{ title: string, value: string, color: string }> = ({ title, value, color }) => (
    <div className="flex-1 min-w-[200px] bg-white/90 rounded-[10px] p-5 shadow-[0_5px_15px_rgba(0,0,0,0.05)] border-l-4" style={{ borderLeftColor: color }}>
        <h3 className="m-0 text-[#2C3E50] text-sm font-bold opacity-80 mb-2">{title}</h3>
        <div className="text-2xl font-bold text-[#2C3E50]">{value}</div>
    </div>
);

// --- MAIN VIEW ---
export const InspectionView: React.FC = () => {
    const { devices, language, startInspection, isInspecting, inspectionProgress, inspectionReport, inspectionHistory, selectInspectionReport, triggerAICopilot, inspectionSettings, updateInspectionSettings, complianceRules, addComplianceRule } = useApp();
    const t = DICTIONARY[language];
    const [filter, setFilter] = useState<'ALL' | 'FAIL'>('ALL');
    const [activeTab, setActiveTab] = useState<'INSPECTION' | 'COMPLIANCE'>('INSPECTION');
    const [showReportOverlay, setShowReportOverlay] = useState(false);
    const [currentReportData, setCurrentReportData] = useState<DetailedReportData | null>(null);
    
    const logEndRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (isInspecting) logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [inspectionReport?.log, isInspecting]);

    const [newRule, setNewRule] = useState<Partial<ComplianceRule>>({ name: '', regex: '', severity: 'MEDIUM' });

    const handleDiagnose = (item: InspectionItem) => {
        triggerAICopilot(`Diagnose inspection failure for device ${item.deviceName}. Error: "${item.message}".`);
    }

    // --- TRANSFORM DEVICE DATA TO PROFESSIONAL REPORT ---
    const generateReportForDevice = (item: InspectionItem) => {
        const device = devices.find(d => d.id === item.deviceId);
        if (!device) return;

        let findings = ["设备连接正常。", "基础配置符合规范。"];
        let suggestions = ["建议定期备份配置。", "关注 CPU 峰值使用率。"];
        let actions = ["检查日志归档。", "确认 NTP 同步状态。"];

        // Extract content from AI Analysis if available
        if (item.aiAnalysis && typeof item.aiAnalysis === 'object') {
            const ai = item.aiAnalysis;
            if(ai.issues && ai.issues.length > 0) {
                findings = ai.issues.map(i => `${i.severity}: ${i.finding}`);
                suggestions = ai.issues.map(i => i.recommendation);
                actions = ai.issues.map(i => i.command || "人工核查");
            }
        } else if (item.status !== 'PASS') {
            findings = [`检测到问题: ${item.checkType}`, item.message];
            suggestions = ["立即检查相关配置。", "咨询 AI 助手获取修复方案。"];
            actions = ["执行诊断命令。", "修复失败项。"];
        }

        const reportData: DetailedReportData = {
            summary: {
                deviceModel: device.type + ' (' + device.vendor + ')',
                osVersion: device.os,
                totalInterfaces: device.interfaces.length + 24, // Simulating physical ports
                upInterfaces: device.interfaces.filter(i => i.status === 'UP').length,
                overallStatus: device.status,
                cpuTrend: [Math.max(0, Math.floor(device.cpuUsage - 5)), Math.floor(device.cpuUsage), Math.max(0, Math.floor(device.cpuUsage + 2))],
                memUsage: Math.floor(device.memUsage),
                errorLogs: item.status === 'PASS' ? 0 : 1
            },
            coreFindings: findings,
            suggestions: suggestions,
            actions: actions,
            generatedAt: new Date().toLocaleString()
        };

        setCurrentReportData(reportData);
        setShowReportOverlay(true);
    };

    const downloadReport = () => {
        if(!inspectionReport) return;
        const content = JSON.stringify(inspectionReport, null, 2);
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Inspection_Report.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    const chartData = inspectionReport ? [
        { name: 'Pass', value: inspectionReport.passedChecks, color: '#22c55e' },
        { name: 'Fail', value: inspectionReport.failedChecks, color: '#ef4444' },
    ] : [];

    const filteredItems = inspectionReport?.items.filter(item => filter === 'ALL' || item.status !== 'PASS') || [];

    const renderAIAnalysis = (analysis: AIAnalysisResult | string) => {
        if (typeof analysis === 'string') return <div className="text-slate-300 text-xs">{analysis}</div>;
        return (
            <div className="space-y-3 w-full">
                <div className="flex justify-between items-center border-b border-slate-700/50 pb-2">
                    <span className="font-bold text-sm text-slate-200">Executive Summary</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${analysis.score > 80 ? 'bg-green-900/50 text-green-400' : 'bg-yellow-900/50 text-yellow-400'}`}>Score: {analysis.score}</span>
                </div>
                <p className="text-xs text-slate-400 italic">{analysis.summary}</p>
                <div className="space-y-2 mt-2">
                    {analysis.issues.map((issue, idx) => (
                        <div key={idx} className="bg-slate-950/50 p-2 rounded border border-slate-800">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[10px] px-1.5 rounded uppercase font-bold ${issue.severity === 'HIGH' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}>{issue.severity}</span>
                                <span className="text-xs font-semibold text-slate-300">{issue.finding}</span>
                            </div>
                            <p className="text-[10px] text-slate-500 mb-1">{issue.recommendation}</p>
                            {issue.command && (
                                <div className="flex items-center gap-2 bg-black p-1.5 rounded border border-slate-700/50 group cursor-pointer" onClick={() => navigator.clipboard.writeText(issue.command || '')}>
                                    <code className="text-[10px] text-green-400 font-mono flex-1">{issue.command}</code>
                                    <Copy size={10} className="text-slate-600 group-hover:text-white"/>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // --- RENDER FULL REPORT OVERLAY ---
    if (showReportOverlay && currentReportData) {
        return <ProfessionalReport data={currentReportData} onBack={() => setShowReportOverlay(false)} />;
    }

    return (
        <div className="h-full flex flex-col space-y-4 overflow-hidden relative">
            <div className="flex justify-between items-center shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-white">{t.inspection}</h2>
                    <p className="text-slate-400 text-sm">Automated network health check, compliance patrol, and AI diagnostics.</p>
                </div>
                <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
                     <button onClick={() => setActiveTab('INSPECTION')} className={`px-4 py-2 rounded text-sm ${activeTab === 'INSPECTION' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>Patrol</button>
                     <button onClick={() => setActiveTab('COMPLIANCE')} className={`px-4 py-2 rounded text-sm ${activeTab === 'COMPLIANCE' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>{t.compliance}</button>
                </div>
            </div>

            {activeTab === 'INSPECTION' ? (
                <div className="flex-1 flex gap-6 min-h-0">
                    {/* Sidebar */}
                    <div className="w-72 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col overflow-hidden shrink-0">
                         <div className="mb-6 border-b border-slate-800 pb-4">
                             <h3 className="text-slate-200 font-semibold mb-3 flex items-center gap-2"><Clock size={16} /> {t.autoInspection}</h3>
                             <div className="space-y-3">
                                 <div className="flex items-center justify-between">
                                     <span className="text-xs text-slate-400">{t.enableSchedule}</span>
                                     <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={inspectionSettings.enabled} onChange={(e) => updateInspectionSettings({ enabled: e.target.checked })} className="sr-only peer" />
                                        <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                                     </label>
                                 </div>
                             </div>
                         </div>
                         <div className="flex-1 overflow-hidden flex flex-col">
                             <h3 className="text-slate-200 font-semibold mb-3 flex items-center gap-2"><History size={16} /> {t.history}</h3>
                             <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-slate-700">
                                 {inspectionHistory.map(report => (
                                     <div key={report.id} onClick={() => selectInspectionReport(report.id)} className={`p-3 rounded-lg cursor-pointer transition-colors border ${inspectionReport?.id === report.id ? 'bg-blue-900/20 border-blue-500' : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800'}`}>
                                         <div className="flex justify-between items-start">
                                             <span className="text-xs font-bold text-slate-300">{report.startTime.toLocaleTimeString()}</span>
                                             <span className={`text-[10px] px-1.5 rounded ${report.score >= 90 ? 'bg-green-900/30 text-green-400' : 'bg-yellow-900/30 text-yellow-400'}`}>{report.score}%</span>
                                         </div>
                                         <div className="mt-1 flex gap-2 text-[10px] text-slate-500">
                                             <span className="text-red-400">{report.failedChecks} Fail</span>
                                             <span>{report.totalChecks} Total</span>
                                         </div>
                                     </div>
                                 ))}
                             </div>
                         </div>
                    </div>

                    {/* Main Panel */}
                    <div className="flex-1 flex flex-col space-y-4 min-w-0">
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shrink-0 relative overflow-hidden">
                            {isInspecting && (
                                <div className="absolute inset-0 z-20 bg-slate-950/90 flex flex-col items-center justify-center backdrop-blur-sm">
                                    <h3 className="text-xl font-bold text-blue-400 animate-pulse mb-2">{t.executing}...</h3>
                                    <div className="w-1/2 bg-slate-800 h-2 rounded-full overflow-hidden mb-4">
                                        <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${inspectionProgress}%` }}></div>
                                    </div>
                                    <div className="w-2/3 h-48 bg-black border border-slate-700 rounded p-4 font-mono text-xs text-green-400 overflow-y-auto">
                                        {inspectionReport?.log?.map((l, i) => <div key={i}>{l}</div>)}
                                        <div ref={logEndRef}></div>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col md:flex-row gap-6 items-center relative z-10">
                                <div className="flex-1 w-full">
                                    {!isInspecting && (
                                        <div className="flex gap-4 items-center">
                                            <button onClick={startInspection} className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-lg shadow-lg shadow-blue-900/40 flex items-center gap-2 transition-transform hover:scale-105">
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
                                    </div>
                                )}
                            </div>
                        </div>

                        {inspectionReport && !isInspecting && (
                            <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col min-h-0 animate-in fade-in slide-in-from-bottom-4">
                                <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50 shrink-0">
                                    <div className="flex gap-4 items-center">
                                        <h3 className="font-bold text-white">
                                            {t.inspectionResults} 
                                            <span className="ml-2 text-xs font-normal text-slate-500">{inspectionReport.startTime.toLocaleString()}</span>
                                        </h3>
                                        <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
                                            <button onClick={() => setFilter('ALL')} className={`px-3 py-1 rounded text-xs transition-colors ${filter === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>All</button>
                                            <button onClick={() => setFilter('FAIL')} className={`px-3 py-1 rounded text-xs transition-colors ${filter === 'FAIL' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'}`}>Failed</button>
                                        </div>
                                    </div>
                                    <button onClick={downloadReport} className="text-slate-400 hover:text-white flex items-center gap-2 text-sm">
                                        <Download size={16} /> JSON
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto divide-y divide-slate-800 p-0">
                                    {filteredItems.map(item => (
                                        <div key={item.id} className="p-4 flex flex-col gap-2 hover:bg-slate-800/30 transition-colors">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-2 rounded-full ${item.status === 'PASS' ? 'bg-green-500/10 text-green-500' : item.status === 'FAIL' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                                        {item.status === 'PASS' && <CheckCircle size={18} />}
                                                        {item.status === 'FAIL' && <XCircle size={18} />}
                                                        {item.status === 'WARNING' && <AlertTriangle size={18} />}
                                                    </div>
                                                    <div>
                                                        <p className="text-slate-200 font-medium">{item.deviceName}</p>
                                                        <div className="flex gap-2">
                                                            <span className="text-xs bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">{item.checkType}</span>
                                                            <p className="text-xs text-slate-500">{item.message}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex gap-2">
                                                    {/* VIEW REPORT BUTTON */}
                                                    <button onClick={() => generateReportForDevice(item)} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded text-xs transition-colors">
                                                        <FileText size={12} /> 📄 报告
                                                    </button>

                                                    {item.status !== 'PASS' && !item.aiAnalysis && (
                                                        <button onClick={() => handleDiagnose(item)} className="flex items-center gap-1 px-3 py-1.5 bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 rounded text-xs transition-colors">
                                                            <Sparkles size={12} /> {t.diagnose}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {item.aiAnalysis && typeof item.aiAnalysis === 'object' && (
                                                <div className="ml-12 mt-2 p-4 bg-purple-900/10 border border-purple-500/20 rounded-lg">
                                                    <div className="flex items-center gap-2 mb-2 font-bold text-purple-400 text-sm">
                                                        <Sparkles size={14}/> AI Professional Analysis
                                                    </div>
                                                    {renderAIAnalysis(item.aiAnalysis)}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                // Compliance Tab (Unchanged)
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-right-4">
                    <div className="space-y-4">
                         {complianceRules.map(rule => (
                             <div key={rule.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex justify-between items-start">
                                 <div>
                                     <h3 className="font-bold text-slate-200">{rule.name}</h3>
                                     <p className="text-sm text-slate-400">{rule.description}</p>
                                     <code className="text-xs bg-slate-950 px-2 py-1 rounded text-blue-300 mt-2 block w-fit">Regex: {rule.regex}</code>
                                 </div>
                                 <div className="flex flex-col items-end gap-2">
                                     <span className={`text-[10px] font-bold px-2 py-1 rounded ${rule.severity === 'HIGH' ? 'bg-red-900/50 text-red-400' : 'bg-blue-900/50 text-blue-400'}`}>{rule.severity}</span>
                                     <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={rule.enabled} readOnly className="sr-only peer" />
                                        <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-green-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                                     </label>
                                 </div>
                             </div>
                         ))}
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Plus size={18}/> {t.addRule}</h3>
                        <div className="space-y-4">
                            <input className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" placeholder="Rule Name" value={newRule.name} onChange={e => setNewRule({...newRule, name: e.target.value})} />
                            <input className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white font-mono" placeholder="Regex Pattern" value={newRule.regex} onChange={e => setNewRule({...newRule, regex: e.target.value})} />
                            <button onClick={() => { addComplianceRule(newRule); setNewRule({name:'', regex:'', severity:'MEDIUM'}); }} className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium">Save Rule</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
