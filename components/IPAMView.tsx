
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DICTIONARY, Subnet } from '../types';
import { Map, Server, Plus, X, Search } from 'lucide-react';

export const IPAMView: React.FC = () => {
    const { subnets, language, addSubnet, devices } = useApp();
    const t = DICTIONARY[language];
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSubnet, setSelectedSubnet] = useState<Subnet | null>(null);
    const [newSubnet, setNewSubnet] = useState<Partial<Subnet>>({
        cidr: '', name: '', location: ''
    });

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        addSubnet(newSubnet);
        setIsModalOpen(false);
        setNewSubnet({ cidr: '', name: '', location: '' });
    };

    const getIpDetailsForSubnet = (subnet: Subnet) => {
        // Simple logic: assume /24. 
        const base = subnet.cidr.split('.').slice(0, 3).join('.');
        const details = [];
        for (let i = 1; i < 255; i++) {
            const ip = `${base}.${i}`;
            const device = devices.find(d => d.ip === ip);
            details.push({
                ip,
                status: device ? 'Used' : 'Available',
                device: device ? device.name : '-',
                mac: device ? device.interfaces[0]?.mac : '-'
            });
        }
        return details;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-600 rounded-lg">
                    <Map size={24} className="text-white"/>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white">{t.ipam}</h2>
                    <p className="text-slate-400 text-sm">Manage IP address allocations and subnet utilization.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subnets.map(subnet => (
                    <div 
                        key={subnet.id} 
                        onClick={() => setSelectedSubnet(subnet)}
                        className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-blue-500/50 cursor-pointer transition-all group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-mono text-lg font-bold text-blue-400 group-hover:text-blue-300">{subnet.cidr}</h3>
                                <p className="text-slate-400 text-sm">{subnet.name}</p>
                            </div>
                            <span className="bg-slate-800 text-slate-300 text-xs px-2 py-1 rounded border border-slate-700">
                                {subnet.location}
                            </span>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-slate-400">{t.utilization}</span>
                                    <span className={subnet.usage > 80 ? 'text-red-400' : 'text-green-400'}>{subnet.usage}%</span>
                                </div>
                                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full ${subnet.usage > 80 ? 'bg-red-500' : 'bg-blue-500'}`} 
                                        style={{ width: `${subnet.usage}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                                <div>
                                    <p className="text-xs text-slate-500">Used IPs</p>
                                    <p className="text-lg font-semibold text-white">{subnet.usedIps}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">{t.available}</p>
                                    <p className="text-lg font-semibold text-white">{subnet.totalIps - subnet.usedIps}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center gap-3 text-slate-500 hover:text-blue-400 hover:border-blue-500/50 transition-all"
                >
                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
                        <span className="text-2xl font-light">+</span>
                    </div>
                    <span className="font-medium">{t.addSubnet}</span>
                </button>
            </div>
            
            {/* Add Subnet Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">{t.addSubnet}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X size={20}/></button>
                        </div>
                        <form onSubmit={handleAdd} className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">{t.cidr}</label>
                                <input 
                                    required 
                                    placeholder="10.0.0.0/24"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                                    value={newSubnet.cidr}
                                    onChange={e => setNewSubnet({...newSubnet, cidr: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">{t.name}</label>
                                <input 
                                    required 
                                    placeholder="Sales VLAN"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                                    value={newSubnet.name}
                                    onChange={e => setNewSubnet({...newSubnet, name: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">{t.location}</label>
                                <input 
                                    placeholder="HQ Floor 2"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                                    value={newSubnet.location}
                                    onChange={e => setNewSubnet({...newSubnet, location: e.target.value})}
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg">{t.cancel}</button>
                                <button type="submit" className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg">{t.save}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Subnet Detail IP List Modal */}
            {selectedSubnet && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                     <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-4xl shadow-2xl flex flex-col h-[80vh]">
                        <div className="flex justify-between items-center p-4 border-b border-slate-800 shrink-0">
                            <div>
                                <h3 className="font-bold text-white text-lg">{selectedSubnet.cidr} Details</h3>
                                <p className="text-xs text-slate-400">{selectedSubnet.name} - {selectedSubnet.location}</p>
                            </div>
                            <button onClick={() => setSelectedSubnet(null)} className="text-slate-400 hover:text-white"><X size={20}/></button>
                        </div>
                        <div className="flex-1 overflow-auto p-0">
                            <table className="w-full text-left text-sm text-slate-400">
                                <thead className="bg-slate-800/50 text-slate-200 sticky top-0">
                                    <tr>
                                        <th className="px-6 py-3">IP Address</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3">Device Name</th>
                                        <th className="px-6 py-3">MAC Address</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {getIpDetailsForSubnet(selectedSubnet).map((item) => (
                                        <tr key={item.ip} className="hover:bg-slate-800/30">
                                            <td className="px-6 py-2 font-mono text-slate-300">{item.ip}</td>
                                            <td className="px-6 py-2">
                                                <span className={`px-2 py-0.5 rounded text-xs ${item.status === 'Used' ? 'bg-blue-900/50 text-blue-400' : 'bg-slate-800 text-slate-500'}`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-2">{item.device}</td>
                                            <td className="px-6 py-2 font-mono text-xs">{item.mac}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                     </div>
                </div>
            )}
        </div>
    );
};
