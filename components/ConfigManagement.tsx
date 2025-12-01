
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DICTIONARY, ConfigBackup } from '../types';
import { FileCode, Clock, GitCommit, Search, ArrowRight, AlertTriangle, Sparkles, X, ArrowRightLeft } from 'lucide-react';
import { geminiService } from '../services/geminiService';

export const ConfigManagement: React.FC = () => {
    const { configBackups, devices, language, aiSettings } = useApp();
    const t = DICTIONARY[language];
    const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
    const [selectedBackup, setSelectedBackup] = useState<ConfigBackup | null>(null);
    const [compareMode, setCompareMode] = useState(false);
    const [compareTarget, setCompareTarget] = useState<ConfigBackup | null>(null);
    
    // AI Analysis
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const deviceList = Array.from(new Set(configBackups.map(b => b.deviceId))).map(id => devices.find(d => d.id === id)).filter(Boolean);
    const currentDeviceBackups = configBackups.filter(b => b.deviceId === selectedDevice).sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime());

    const handleCompare = (backup: ConfigBackup) => {
        if (!compareMode) {
            setCompareMode(true);
            setCompareTarget(backup); // This is the "Newer" version usually
        } else {
            // Logic to handle comparison select
        }
    };

    const generateDiff = (oldText: string, newText: string) => {
        const oldLines = oldText.split('\n');
        const newLines = newText.split('\n');
        // Simple Diff Logic
        return newLines.map((line, i) => {
            if (!oldLines.includes(line)) return { type: 'add', content: line };
            return { type: 'same', content: line };
        }).concat(oldLines.filter(l => !newLines.includes(l)).map(l => ({ type: 'remove', content: l })));
    };

    const handleAnalyzeDiff = async () => {
        if (!selectedBackup || !compareTarget) return;
        setIsAnalyzing(true);
        // Construct diff string
        const diff = `Comparing ${compareTarget.version} with ${selectedBackup.version}:\n` + 
                     generateDiff(selectedBackup.content, compareTarget.content)
                     .filter(l => l.type !== 'same')
                     .map(l => `${l.type === 'add' ? '+' : '-'} ${l.content}`)
                     .join('\n');
        
        try {
            const result = await geminiService.analyzeConfigDiff(diff, aiSettings);
            setAiAnalysis(result);
        } catch (e) {
            setAiAnalysis("Error analyzing configuration.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="h-full flex gap-6">
            {/* Device List Sidebar */}
            <div className="w-64 bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden shrink-0">
                <div className="p-4 border-b border-slate-800">
                    <h3 className="font-bold text-white flex items-center gap-2"><FileCode size={18}/> {t.configMgmt}</h3>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {deviceList.map(dev => (
                        <div 
                            key={dev!.id} 
                            onClick={() => { setSelectedDevice(dev!.id); setSelectedBackup(null); setCompareMode(false); setCompareTarget(null); setAiAnalysis(null); }}
                            className={`p-3 border-b border-slate-800 cursor-pointer hover:bg-slate-800 ${selectedDevice === dev!.id ? 'bg-blue-900/20 border-l-4 border-l-blue-500' : 'text-slate-400'}`}
                        >
                            <div className="font-medium text-sm text-slate-200">{dev!.name}</div>
                            <div className="text-xs text-slate-500">{dev!.ip}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col gap-4 min-w-0">
                {selectedDevice ? (
                    <>
                        {/* Timeline / Version Picker */}
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 overflow-x-auto whitespace-nowrap">
                            <h4 className="text-sm font-bold text-slate-400 mb-4">{t.history}</h4>
                            <div className="flex gap-4">
                                {currentDeviceBackups.map(backup => (
                                    <div 
                                        key={backup.id}
                                        onClick={() => {
                                            if (compareMode && compareTarget && compareTarget.id !== backup.id) {
                                                setSelectedBackup(backup);
                                            } else if (!compareMode) {
                                                setSelectedBackup(backup);
                                            }
                                        }}
                                        className={`inline-block w-48 p-4 rounded-lg border cursor-pointer transition-all ${
                                            selectedBackup?.id === backup.id ? 'bg-blue-600 border-blue-500 text-white' : 
                                            compareTarget?.id === backup.id ? 'bg-green-600 border-green-500 text-white' :
                                            'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
                                        }`}
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-mono font-bold">{backup.version}</span>
                                            <GitCommit size={14} />
                                        </div>
                                        <div className="text-xs opacity-70 mb-1">{backup.timestamp.toLocaleString()}</div>
                                        <div className="text-xs italic truncate">{backup.changeNote}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Viewer Area */}
                        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col min-h-0">
                            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/30">
                                <div className="flex items-center gap-4">
                                    <h3 className="font-bold text-white">
                                        {compareMode && compareTarget && selectedBackup 
                                            ? `${t.diff}: ${selectedBackup.version} vs ${compareTarget.version}`
                                            : selectedBackup ? `${t.viewConfig}: ${selectedBackup.version}` : 'Select a version'}
                                    </h3>
                                    {!compareMode && selectedBackup && (
                                        <button 
                                            onClick={() => handleCompare(selectedBackup)}
                                            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded border border-slate-600 flex items-center gap-2"
                                        >
                                            <ArrowRightLeft size={12}/> {t.compare}
                                        </button>
                                    )}
                                    {compareMode && (
                                        <button onClick={() => { setCompareMode(false); setCompareTarget(null); setAiAnalysis(null); }} className="text-xs text-red-400 hover:underline">Exit Compare</button>
                                    )}
                                </div>
                                {compareMode && selectedBackup && compareTarget && (
                                    <button 
                                        onClick={handleAnalyzeDiff}
                                        disabled={isAnalyzing}
                                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded flex items-center gap-2 disabled:opacity-50"
                                    >
                                        <Sparkles size={16}/> {isAnalyzing ? 'Analyzing...' : t.analyzeDiff}
                                    </button>
                                )}
                            </div>

                            <div className="flex-1 overflow-auto p-0 font-mono text-xs relative">
                                {compareMode && selectedBackup && compareTarget ? (
                                    // Diff View
                                    <div className="flex h-full">
                                        <div className="w-1/2 border-r border-slate-700 bg-slate-950 p-4 overflow-auto">
                                            <div className="text-slate-500 mb-2 font-bold text-center">Version {selectedBackup.version} (Old)</div>
                                            {generateDiff(selectedBackup.content, compareTarget.content).filter(x => x.type !== 'add').map((line, i) => (
                                                <div key={i} className={`${line.type === 'remove' ? 'bg-red-900/30 text-red-300' : 'text-slate-400'}`}>
                                                    {line.type === 'remove' ? '- ' : '  '}{line.content}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="w-1/2 bg-slate-950 p-4 overflow-auto">
                                            <div className="text-slate-500 mb-2 font-bold text-center">Version {compareTarget.version} (New)</div>
                                            {generateDiff(selectedBackup.content, compareTarget.content).filter(x => x.type !== 'remove').map((line, i) => (
                                                <div key={i} className={`${line.type === 'add' ? 'bg-green-900/30 text-green-300' : 'text-slate-400'}`}>
                                                    {line.type === 'add' ? '+ ' : '  '}{line.content}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : selectedBackup ? (
                                    // Standard View
                                    <pre className="p-4 text-green-400 bg-slate-950 h-full overflow-auto">
                                        {selectedBackup.content}
                                    </pre>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-slate-500">
                                        Select a backup version to view content.
                                    </div>
                                )}
                                
                                {/* AI Analysis Overlay */}
                                {aiAnalysis && (
                                    <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-slate-900 border-t border-slate-700 shadow-2xl animate-slide-in-bottom p-4 overflow-auto">
                                        <div className="flex justify-between items-start mb-2 sticky top-0">
                                            <h4 className="font-bold text-purple-400 flex items-center gap-2"><Sparkles size={16}/> AI Change Analysis</h4>
                                            <button onClick={() => setAiAnalysis(null)} className="text-slate-400 hover:text-white"><X size={16}/></button>
                                        </div>
                                        <div className="text-slate-300 whitespace-pre-wrap">{aiAnalysis}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
                        Select a device to manage configuration.
                    </div>
                )}
            </div>
        </div>
    );
};
