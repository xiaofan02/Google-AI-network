
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { DeviceType, Device, DICTIONARY, DeviceStatus, Vendor } from '../types';
import { Search, Filter, Terminal, FileText, X, Power, Trash2, Plus, Upload, Edit, CheckSquare, Square, ChevronLeft, ChevronRight } from 'lucide-react';

export const DeviceList: React.FC = () => {
  const { devices, toggleDeviceStatus, language, addDevice, removeDevice, deleteDevices, importDevices, updateDevice } = useApp();
  const [filter, setFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [viewConfigDevice, setViewConfigDevice] = useState<Device | null>(null);
  const [showTerminal, setShowTerminal] = useState<Device | null>(null);
  const [editDevice, setEditDevice] = useState<Device | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Terminal State
  const [terminalHistory, setTerminalHistory] = useState<string[]>([]);
  const [terminalInput, setTerminalInput] = useState('');
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  // Add/Edit Form State
  const [formData, setFormData] = useState<Partial<Device>>({
      name: '',
      ip: '',
      type: DeviceType.SWITCH,
      vendor: Vendor.CISCO,
      role: 'ACCESS'
  });

  const [importText, setImportText] = useState('');
  const t = DICTIONARY[language];

  // Filtering
  const filteredDevices = devices.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(filter.toLowerCase()) || d.ip.includes(filter);
    const matchesType = typeFilter === 'ALL' || d.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filteredDevices.length / itemsPerPage);
  const paginatedDevices = filteredDevices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
      if (showTerminal) {
          setTerminalHistory([`NetGuardian Secure Shell (SSH) v2.0`, `Connecting to ${showTerminal.ip}...`, `Connected to ${showTerminal.name}`, '']);
      }
  }, [showTerminal]);

  useEffect(() => {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalHistory]);

  const handleTerminalCommand = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && showTerminal) {
          e.preventDefault();
          const cmd = terminalInput.trim();
          const newHistory = [...terminalHistory, `${showTerminal.name}# ${cmd}`];
          
          let response = '';
          if (cmd === 'help' || cmd === '?') {
              response = 'Available commands: show run, show ip int br, ping, reboot, exit';
          } else if (cmd.startsWith('ping')) {
              response = 'Sending 5, 100-byte ICMP Echos to 8.8.8.8, timeout is 2 seconds:\n!!!!!\nSuccess rate is 100 percent (5/5), round-trip min/avg/max = 1/2/4 ms';
          } else if (cmd === 'show ip int br') {
              response = 'Interface              IP-Address      OK? Method Status                Protocol\nGigabitEthernet0/1     192.168.1.10    YES NVRAM  up                    up';
          } else if (cmd === 'show run') {
              response = showTerminal.config || 'Building configuration...';
          } else if (cmd === 'reboot') {
              response = 'System is rebooting...';
              setTimeout(() => { toggleDeviceStatus(showTerminal.id); setShowTerminal(null); }, 2000);
          } else if (cmd === 'exit') {
              setShowTerminal(null);
              return;
          } else if (cmd !== '') {
              response = '% Invalid input detected at marker.';
          }

          if(response) newHistory.push(response);
          setTerminalHistory(newHistory);
          setTerminalInput('');
      }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      addDevice(formData);
      setIsAddModalOpen(false);
      setFormData({ name: '', ip: '', type: DeviceType.SWITCH, vendor: Vendor.CISCO, role: 'ACCESS' });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if(editDevice) {
          updateDevice(editDevice.id, formData);
          setEditDevice(null);
      }
  };

  const openEditModal = (device: Device) => {
      setEditDevice(device);
      setFormData({ name: device.name, ip: device.ip, type: device.type, vendor: device.vendor, role: device.role });
  }

  const handleImportSubmit = () => {
      const success = importDevices(importText);
      if(success) {
          setIsImportModalOpen(false);
          setImportText('');
      } else {
          alert('Invalid JSON format');
      }
  };

  const toggleSelection = (id: string) => {
      setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectAll = () => {
      if (selectedIds.length === paginatedDevices.length) {
          setSelectedIds([]);
      } else {
          setSelectedIds(paginatedDevices.map(d => d.id));
      }
  };

  const batchDelete = () => {
      if(window.confirm(`Delete ${selectedIds.length} devices?`)) {
          deleteDevices(selectedIds);
          setSelectedIds([]);
      }
  }

  const batchReboot = () => {
       selectedIds.forEach(id => toggleDeviceStatus(id));
       setSelectedIds([]);
  }

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800">
        <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
            <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
                <input 
                    type="text" 
                    placeholder={t.search} 
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                />
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                <Filter size={18} className="text-slate-500" />
                <select 
                    className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                >
                    <option value="ALL">All Types</option>
                    {Object.values(DeviceType).map(t => (
                        <option key={t} value={t}>{t}</option>
                    ))}
                </select>
            </div>
        </div>

        <div className="flex gap-3 w-full xl:w-auto">
             <button 
                onClick={() => {
                    setFormData({ name: '', ip: '', type: DeviceType.SWITCH, vendor: Vendor.CISCO, role: 'ACCESS' });
                    setIsAddModalOpen(true)
                }}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1 xl:flex-none"
             >
                <Plus size={16} />
                {t.addDevice}
             </button>
             <button 
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1 xl:flex-none"
             >
                <Upload size={16} />
                {t.batchImport}
             </button>
        </div>
      </div>

      {selectedIds.length > 0 && (
          <div className="bg-blue-900/30 border border-blue-800 p-3 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2">
              <span className="text-sm text-blue-200 font-medium px-2">{selectedIds.length} {t.selected}</span>
              <div className="flex gap-2">
                  <button onClick={batchReboot} className="px-3 py-1.5 bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/40 rounded text-sm flex items-center gap-2">
                      <Power size={14}/> {t.reboot}
                  </button>
                  <button onClick={batchDelete} className="px-3 py-1.5 bg-red-600/20 text-red-400 hover:bg-red-600/40 rounded text-sm flex items-center gap-2">
                      <Trash2 size={14}/> {t.delete}
                  </button>
              </div>
          </div>
      )}

      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400">
                <thead className="bg-slate-800/50 text-slate-200 font-medium">
                    <tr>
                        <th className="px-6 py-4 w-10">
                            <button onClick={selectAll} className="text-slate-400 hover:text-white">
                                {selectedIds.length > 0 && selectedIds.length === paginatedDevices.length ? <CheckSquare size={16}/> : <Square size={16}/>}
                            </button>
                        </th>
                        <th className="px-6 py-4">{t.name}</th>
                        <th className="px-6 py-4">{t.type}</th>
                        <th className="px-6 py-4">{t.ipAddress}</th>
                        <th className="px-6 py-4">{t.status}</th>
                        <th className="px-6 py-4">{t.cpu} / {t.memory}</th>
                        <th className="px-6 py-4 text-right">{t.actions}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                    {paginatedDevices.map((device) => (
                        <tr key={device.id} className={`hover:bg-slate-800/30 transition-colors ${selectedIds.includes(device.id) ? 'bg-blue-900/10' : ''}`}>
                            <td className="px-6 py-4">
                                <button onClick={() => toggleSelection(device.id)} className={`hover:text-white ${selectedIds.includes(device.id) ? 'text-blue-400' : 'text-slate-600'}`}>
                                    {selectedIds.includes(device.id) ? <CheckSquare size={16}/> : <Square size={16}/>}
                                </button>
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-200">
                                {device.name}
                                <span className="block text-[10px] text-slate-500">{device.vendor}</span>
                            </td>
                            <td className="px-6 py-4 text-xs">
                                <span className="px-2 py-1 rounded-full bg-slate-800 border border-slate-700">
                                    {device.type}
                                </span>
                            </td>
                            <td className="px-6 py-4 font-mono">{device.ip}</td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${
                                        device.status === 'ONLINE' ? 'bg-green-500' : 
                                        device.status === 'CRITICAL' ? 'bg-red-500' : 
                                        device.status === 'WARNING' ? 'bg-yellow-500' : 'bg-slate-500'
                                    }`}></div>
                                    <span className={
                                         device.status === 'ONLINE' ? 'text-green-400' : 
                                         device.status === 'CRITICAL' ? 'text-red-400' : 
                                         device.status === 'WARNING' ? 'text-yellow-400' : 'text-slate-500'
                                    }>{t[device.status.toLowerCase() as keyof typeof t] || device.status}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex flex-col gap-1 w-24">
                                    <div className="flex justify-between text-[10px] text-slate-500">
                                        <span>CPU</span>
                                        <span>{device.cpuUsage.toFixed(2)}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mb-1">
                                        <div className="h-full bg-blue-500" style={{ width: `${device.cpuUsage}%` }}></div>
                                    </div>
                                    
                                    <div className="flex justify-between text-[10px] text-slate-500">
                                        <span>Mem</span>
                                        <span>{device.memUsage.toFixed(2)}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-purple-500" style={{ width: `${device.memUsage}%` }}></div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex gap-2 justify-end">
                                    <button 
                                        onClick={() => openEditModal(device)}
                                        className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-blue-400 transition-colors"
                                        title={t.edit}
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button 
                                        onClick={() => setViewConfigDevice(device)}
                                        className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-blue-400 transition-colors"
                                        title={t.viewConfig}
                                    >
                                        <FileText size={16} />
                                    </button>
                                    <button 
                                        onClick={() => setShowTerminal(device)}
                                        className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-green-400 transition-colors"
                                        title={t.terminal}
                                    >
                                        <Terminal size={16} />
                                    </button>
                                    <button 
                                        onClick={() => toggleDeviceStatus(device.id)}
                                        className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-yellow-400 transition-colors"
                                        title={t.reboot}
                                    >
                                        <Power size={16} />
                                    </button>
                                    <button 
                                        onClick={() => {
                                            if(window.confirm(`Are you sure you want to delete ${device.name}?`)) {
                                                removeDevice(device.id);
                                            }
                                        }}
                                        className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-red-400 transition-colors"
                                        title={t.delete}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800">
             <span className="text-sm text-slate-500">
                 Page {currentPage} of {totalPages || 1}
             </span>
             <div className="flex gap-2">
                 <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="p-2 bg-slate-800 text-slate-400 rounded hover:text-white disabled:opacity-50"
                 >
                     <ChevronLeft size={16} />
                 </button>
                 <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="p-2 bg-slate-800 text-slate-400 rounded hover:text-white disabled:opacity-50"
                 >
                     <ChevronRight size={16} />
                 </button>
             </div>
        </div>
      </div>

      {/* Add / Edit Device Modal */}
      {(isAddModalOpen || editDevice) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">{editDevice ? t.edit : t.addDevice}</h3>
                    <button onClick={() => { setIsAddModalOpen(false); setEditDevice(null); }} className="text-slate-400 hover:text-white"><X size={20}/></button>
                </div>
                <form onSubmit={editDevice ? handleEditSubmit : handleAddSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">{t.name}</label>
                        <input 
                            required 
                            type="text" 
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">{t.ipAddress}</label>
                        <input 
                            required 
                            type="text" 
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                            value={formData.ip}
                            onChange={e => setFormData({...formData, ip: e.target.value})}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">{t.type}</label>
                            <select 
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none"
                                value={formData.type}
                                onChange={e => setFormData({...formData, type: e.target.value as DeviceType})}
                            >
                                {Object.values(DeviceType).map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Vendor</label>
                            <select 
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none"
                                value={formData.vendor}
                                onChange={e => setFormData({...formData, vendor: e.target.value as Vendor})}
                            >
                                {Object.values(Vendor).map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Role</label>
                        <select 
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none"
                            value={formData.role}
                            onChange={e => setFormData({...formData, role: e.target.value as any})}
                        >
                            <option value="CORE">CORE</option>
                            <option value="DISTRIBUTION">DISTRIBUTION</option>
                            <option value="ACCESS">ACCESS</option>
                            <option value="EDGE">EDGE</option>
                        </select>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => { setIsAddModalOpen(false); setEditDevice(null); }} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg">{t.cancel}</button>
                        <button type="submit" className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg">{t.save}</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">{t.batchImport}</h3>
                    <button onClick={() => setIsImportModalOpen(false)} className="text-slate-400 hover:text-white"><X size={20}/></button>
                </div>
                <div className="space-y-4">
                    <p className="text-sm text-slate-400">Paste a JSON array of devices. Example:</p>
                    <pre className="text-xs bg-slate-950 p-2 text-slate-500 rounded font-mono">
                        {`[{"name": "New-SW", "ip": "10.0.0.5", "type": "SWITCH"}]`}
                    </pre>
                    <textarea 
                        className="w-full h-40 bg-slate-800 border border-slate-700 rounded-lg p-3 text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                        value={importText}
                        onChange={e => setImportText(e.target.value)}
                        placeholder="Paste JSON here..."
                    ></textarea>
                    <div className="flex gap-3 pt-2">
                        <button onClick={() => setIsImportModalOpen(false)} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg">{t.cancel}</button>
                        <button onClick={handleImportSubmit} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg">{t.import}</button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* View Config Modal */}
      {viewConfigDevice && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[80vh]">
                <div className="flex justify-between items-center p-4 border-b border-slate-800">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <FileText size={18} className="text-blue-500"/>
                        {t.configViewer} - {viewConfigDevice.name}
                    </h3>
                    <button onClick={() => setViewConfigDevice(null)} className="text-slate-400 hover:text-white"><X size={20}/></button>
                </div>
                <div className="p-0 flex-1 overflow-hidden">
                    <pre className="w-full h-full overflow-auto bg-slate-950 p-4 text-xs font-mono text-green-400 scrollbar-thin scrollbar-thumb-slate-700">
                        {viewConfigDevice.config || '# No configuration data available.'}
                    </pre>
                </div>
                <div className="p-3 border-t border-slate-800 bg-slate-800/50 flex justify-end">
                    <button onClick={() => setViewConfigDevice(null)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm">{t.close}</button>
                </div>
            </div>
        </div>
      )}

      {/* Terminal Modal (Interactive) */}
      {showTerminal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-black border border-slate-700 rounded-xl w-full max-w-3xl shadow-2xl flex flex-col h-[500px]">
                <div className="flex justify-between items-center p-2 border-b border-slate-800 bg-slate-900 rounded-t-xl">
                    <div className="flex gap-2 px-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <span className="text-slate-400 text-xs">{showTerminal.ip} - SSH</span>
                    <button onClick={() => setShowTerminal(null)} className="text-slate-400 hover:text-white px-2"><X size={16}/></button>
                </div>
                <div className="p-4 flex-1 overflow-auto font-mono text-sm text-slate-300" onClick={() => document.getElementById('term-input')?.focus()}>
                    {terminalHistory.map((line, i) => (
                        <div key={i} className="whitespace-pre-wrap mb-1">{line}</div>
                    ))}
                    <div className="flex">
                        <span className="text-green-500 mr-2">
                            {showTerminal.type === DeviceType.SWITCH || showTerminal.type === DeviceType.ROUTER ? `${showTerminal.name}#` : `${showTerminal.name}:~$`}
                        </span>
                        <input 
                            id="term-input"
                            autoFocus
                            className="bg-transparent border-none outline-none text-slate-300 flex-1"
                            value={terminalInput}
                            onChange={(e) => setTerminalInput(e.target.value)}
                            onKeyDown={handleTerminalCommand}
                        />
                    </div>
                    <div ref={terminalEndRef}></div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
