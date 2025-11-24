
import React from 'react';
import { useApp } from '../context/AppContext';
import { DICTIONARY } from '../types';
import { Cloud, Server, Database, Box, Activity } from 'lucide-react';

export const CloudView: React.FC = () => {
    const { cloudResources, language } = useApp();
    const t = DICTIONARY[language];

    const awsResources = cloudResources.filter(r => r.provider === 'AWS');
    const azureResources = cloudResources.filter(r => r.provider === 'AZURE');
    
    const totalCost = cloudResources.reduce((acc, r) => acc + r.cost, 0);

    return (
        <div className="space-y-6">
             <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white">{t.cloud}</h2>
                    <p className="text-slate-400 text-sm">Monitor hybrid resources across AWS and Azure.</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex items-center gap-4">
                     <div className="p-4 bg-orange-500/10 text-orange-400 rounded-full">
                         <Cloud size={24} />
                     </div>
                     <div>
                         <p className="text-slate-400 text-sm">AWS Resources</p>
                         <h3 className="text-2xl font-bold text-white">{awsResources.length}</h3>
                     </div>
                 </div>
                 <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex items-center gap-4">
                     <div className="p-4 bg-blue-500/10 text-blue-400 rounded-full">
                         <Cloud size={24} />
                     </div>
                     <div>
                         <p className="text-slate-400 text-sm">Azure Resources</p>
                         <h3 className="text-2xl font-bold text-white">{azureResources.length}</h3>
                     </div>
                 </div>
                 <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex items-center gap-4">
                     <div className="p-4 bg-green-500/10 text-green-400 rounded-full">
                         <Activity size={24} />
                     </div>
                     <div>
                         <p className="text-slate-400 text-sm">{t.totalCost}</p>
                         <h3 className="text-2xl font-bold text-white">${totalCost.toFixed(2)}</h3>
                     </div>
                 </div>
            </div>

            {/* Provider Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* AWS */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                    <div className="bg-[#232f3e] px-6 py-4 border-b border-slate-800 flex items-center gap-2">
                        <span className="font-bold text-orange-400">AWS</span>
                        <span className="text-xs text-slate-400">us-east-1 / us-west-2</span>
                    </div>
                    <div className="p-4 space-y-3">
                        {awsResources.map(res => (
                            <CloudCard key={res.id} resource={res} />
                        ))}
                    </div>
                </div>

                {/* Azure */}
                 <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                    <div className="bg-[#0078d4] px-6 py-4 border-b border-slate-800 flex items-center gap-2">
                        <span className="font-bold text-white">Azure</span>
                        <span className="text-xs text-white/70">East US</span>
                    </div>
                    <div className="p-4 space-y-3">
                        {azureResources.map(res => (
                            <CloudCard key={res.id} resource={res} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const CloudCard: React.FC<{ resource: any }> = ({ resource }) => {
    const getIcon = () => {
        if (resource.type === 'EC2' || resource.type === 'VM') return <Server size={16} />;
        if (resource.type === 'RDS' || resource.type === 'SQL') return <Database size={16} />;
        return <Box size={16} />;
    };

    return (
        <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-3 flex justify-between items-center hover:bg-slate-800 transition-colors">
            <div className="flex items-center gap-3">
                <div className="text-slate-400">{getIcon()}</div>
                <div>
                    <h4 className="text-sm font-medium text-slate-200">{resource.name}</h4>
                    <p className="text-[10px] text-slate-500">{resource.type} • {resource.region}</p>
                </div>
            </div>
            <div className="text-right">
                <div className="flex items-center justify-end gap-1 mb-1">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    <span className="text-xs text-green-400">{resource.status}</span>
                </div>
                <p className="text-xs text-slate-400">${resource.cost}/mo</p>
            </div>
        </div>
    );
}
