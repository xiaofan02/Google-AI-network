
import React from 'react';
import { useApp } from '../context/AppContext';
import { DICTIONARY } from '../types';
import { ArrowRightLeft, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export const NetFlowView: React.FC = () => {
    const { netflowData, language } = useApp();
    const t = DICTIONARY[language];

    // Aggregations
    const topTalkers = Object.entries(netflowData.reduce((acc, flow) => {
        acc[flow.srcIp] = (acc[flow.srcIp] || 0) + flow.bytes;
        return acc;
    }, {} as Record<string, number>))
    .sort((a,b) => (b[1] as number) - (a[1] as number))
    .slice(0, 5)
    .map(([ip, bytes]) => ({ name: ip, bytes: Math.round((bytes as number) / 1024) })); // KB

    const protocols = Object.entries(netflowData.reduce((acc, flow) => {
        acc[flow.application] = (acc[flow.application] || 0) + 1;
        return acc;
    }, {} as Record<string, number>))
    .map(([name, count]) => ({ name, value: count as number }));

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white">{t.netflow}</h2>
                    <p className="text-slate-400 text-sm">Visualize network traffic flows, top talkers, and protocol distribution.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Talkers */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-slate-200 mb-4">{t.topTalkers} (KB)</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topTalkers} layout="vertical">
                                <XAxis type="number" stroke="#64748b" />
                                <YAxis dataKey="name" type="category" width={100} stroke="#94a3b8" fontSize={12}/>
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }} />
                                <Bar dataKey="bytes" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Protocol Dist */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-slate-200 mb-4">{t.protocols}</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={protocols} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                                    {protocols.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Flow Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-800 font-bold text-white">Recent Flows</div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="bg-slate-800/50 text-slate-200">
                            <tr>
                                <th className="px-6 py-3">Time</th>
                                <th className="px-6 py-3">Source</th>
                                <th className="px-6 py-3">Destination</th>
                                <th className="px-6 py-3">App</th>
                                <th className="px-6 py-3 text-right">Bytes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {netflowData.slice(0, 10).map((flow) => (
                                <tr key={flow.id} className="hover:bg-slate-800/30">
                                    <td className="px-6 py-2">{flow.timestamp.toLocaleTimeString()}</td>
                                    <td className="px-6 py-2 font-mono text-xs text-blue-300">{flow.srcIp}:{flow.srcPort}</td>
                                    <td className="px-6 py-2 font-mono text-xs text-green-300">{flow.dstIp}:{flow.dstPort}</td>
                                    <td className="px-6 py-2"><span className="bg-slate-800 px-2 py-1 rounded text-xs border border-slate-700">{flow.application}</span></td>
                                    <td className="px-6 py-2 text-right font-mono">{flow.bytes.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
