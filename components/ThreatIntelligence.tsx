
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DICTIONARY, BugReport, Vendor } from '../types';
import { Bug, Search, AlertOctagon, CheckCircle } from 'lucide-react';

export const ThreatIntelligence: React.FC = () => {
    const { bugDatabase, devices, language } = useApp();
    const t = DICTIONARY[language];
    const [search, setSearch] = useState('');
    const [selectedVendor, setSelectedVendor] = useState<string>('ALL');

    const filteredBugs = bugDatabase.filter(bug => {
        const matchesSearch = bug.title.toLowerCase().includes(search.toLowerCase()) || 
                              bug.cveId?.toLowerCase().includes(search.toLowerCase());
        const matchesVendor = selectedVendor === 'ALL' || bug.vendor === selectedVendor;
        return matchesSearch && matchesVendor;
    });

    const checkAffectedDevices = (bug: BugReport) => {
        return devices.filter(d => 
            d.vendor === bug.vendor && 
            bug.affectedVersions.some(v => d.os.includes(v))
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white">{t.bugLibrary}</h2>
                    <p className="text-slate-400 text-sm">Global CVE and Bug database cross-referenced with your inventory.</p>
                </div>
            </div>

            <div className="flex gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search CVE, Title..." 
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <select 
                    className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2"
                    value={selectedVendor}
                    onChange={(e) => setSelectedVendor(e.target.value)}
                >
                    <option value="ALL">All Vendors</option>
                    {Object.values(Vendor).map(v => <option key={v} value={v}>{v}</option>)}
                </select>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filteredBugs.map(bug => {
                    const affected = checkAffectedDevices(bug);
                    return (
                        <div key={bug.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-all">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-3">
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                        bug.severity === 'CRITICAL' ? 'bg-red-900/50 text-red-400' :
                                        bug.severity === 'HIGH' ? 'bg-orange-900/50 text-orange-400' :
                                        'bg-blue-900/50 text-blue-400'
                                    }`}>
                                        {bug.severity}
                                    </span>
                                    <h3 className="text-lg font-bold text-slate-200">{bug.title}</h3>
                                </div>
                                <span className="text-xs text-slate-500 font-mono border border-slate-800 px-2 py-1 rounded">
                                    {bug.cveId}
                                </span>
                            </div>
                            
                            <p className="text-sm text-slate-400 mb-4">{bug.description}</p>
                            
                            <div className="flex flex-wrap gap-2 text-xs text-slate-500 mb-4">
                                <span className="bg-slate-800 px-2 py-1 rounded">Vendor: {bug.vendor}</span>
                                <span className="bg-slate-800 px-2 py-1 rounded">Versions: {bug.affectedVersions.join(', ')}</span>
                                <span className="bg-slate-800 px-2 py-1 rounded">Published: {bug.publishDate}</span>
                            </div>

                            <div className="border-t border-slate-800 pt-4">
                                <h4 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                                    <AlertOctagon size={16} className={affected.length > 0 ? "text-red-500" : "text-green-500"} />
                                    {t.affectedDevices}: {affected.length}
                                </h4>
                                {affected.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {affected.map(d => (
                                            <span key={d.id} className="text-xs bg-red-900/20 text-red-300 px-2 py-1 rounded border border-red-900/30 flex items-center gap-1">
                                                <Bug size={12}/> {d.name} ({d.ip})
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-xs text-green-500 flex items-center gap-1">
                                        <CheckCircle size={12} /> No devices in inventory match affected versions.
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
