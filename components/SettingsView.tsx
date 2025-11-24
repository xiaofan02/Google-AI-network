
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DICTIONARY } from '../types';
import { Save, Bell, Globe, Shield, Clock, Bot, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { geminiService } from '../services/geminiService';

export const SettingsView: React.FC = () => {
  const { language, setLanguage, addLog, aiSettings, updateAISettings } = useApp();
  const t = DICTIONARY[language];
  
  const [snmpCommunity, setSnmpCommunity] = useState('public');
  const [interval, setInterval] = useState(300);
  const [notifications, setNotifications] = useState(true);

  // Local state for AI form
  const [localAiSettings, setLocalAiSettings] = useState(aiSettings);
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  const handleSave = () => {
      updateAISettings(localAiSettings);
      addLog({ level: 'SUCCESS', message: 'System settings saved successfully.' });
  };

  const handleTestConnection = async () => {
      setIsTesting(true);
      setTestStatus('idle');
      const result = await geminiService.validateConnection(localAiSettings);
      setIsTesting(false);
      if (result.success) {
          setTestStatus('success');
          setTestMessage(t.connectionSuccess);
      } else {
          setTestStatus('error');
          setTestMessage(`${t.connectionFailed}: ${result.message}`);
      }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">{t.settings}</h2>
        <p className="text-slate-400">Configure global system parameters and preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* General Settings */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
            <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                <Globe size={20} className="text-blue-500" /> {t.generalSettings}
            </h3>
            
            <div className="space-y-4">
                <div>
                    <label className="block text-sm text-slate-400 mb-1">{t.snmpCommunity}</label>
                    <input 
                        type="password" 
                        value={snmpCommunity}
                        onChange={(e) => setSnmpCommunity(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    />
                </div>
                
                <div>
                    <label className="block text-sm text-slate-400 mb-1">{t.scanInterval}</label>
                    <div className="flex items-center gap-4">
                        <Clock size={18} className="text-slate-500" />
                        <input 
                            type="range" 
                            min="60" 
                            max="3600" 
                            step="60"
                            value={interval}
                            onChange={(e) => setInterval(parseInt(e.target.value))}
                            className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                        <span className="w-16 text-right text-slate-300 font-mono">{interval}s</span>
                    </div>
                </div>

                <div>
                    <label className="block text-sm text-slate-400 mb-2">Language / 语言</label>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setLanguage('en')}
                            className={`flex-1 py-2 rounded border text-sm transition-all ${
                                language === 'en' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                            }`}
                        >
                            English
                        </button>
                        <button 
                             onClick={() => setLanguage('cn')}
                             className={`flex-1 py-2 rounded border text-sm transition-all ${
                                language === 'cn' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                            }`}
                        >
                            中文 (Chinese)
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {/* AI Settings */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
            <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                <Bot size={20} className="text-purple-500" /> {t.aiSettings}
            </h3>
            
            <div className="space-y-4">
                 <div className="flex items-center justify-between">
                     <span className="text-sm text-slate-300">Use Custom API Configuration</span>
                     <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={localAiSettings.useCustom} 
                            onChange={(e) => setLocalAiSettings({...localAiSettings, useCustom: e.target.checked})} 
                            className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                     </label>
                 </div>
                 
                 {localAiSettings.useCustom && (
                     <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                         <div>
                            <label className="block text-xs text-slate-500 mb-1">API Key</label>
                            <input 
                                type="password" 
                                placeholder="sk-..."
                                value={localAiSettings.apiKey}
                                onChange={(e) => setLocalAiSettings({...localAiSettings, apiKey: e.target.value})}
                                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-white focus:border-purple-500 focus:outline-none"
                            />
                         </div>
                         <div>
                            <label className="block text-xs text-slate-500 mb-1">Base URL (e.g. https://api.siliconflow.cn/v1)</label>
                            <input 
                                type="text" 
                                placeholder="https://generativelanguage.googleapis.com"
                                value={localAiSettings.baseUrl}
                                onChange={(e) => setLocalAiSettings({...localAiSettings, baseUrl: e.target.value})}
                                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-white focus:border-purple-500 focus:outline-none"
                            />
                         </div>
                         <div>
                            <label className="block text-xs text-slate-500 mb-1">Model Name</label>
                            <input 
                                type="text" 
                                placeholder="gemini-2.5-flash"
                                value={localAiSettings.model}
                                onChange={(e) => setLocalAiSettings({...localAiSettings, model: e.target.value})}
                                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-white focus:border-purple-500 focus:outline-none"
                            />
                         </div>
                         
                         {/* Test Connection Button */}
                         <div className="pt-2 border-t border-slate-800 flex items-center gap-3">
                             <button 
                                onClick={handleTestConnection}
                                disabled={isTesting}
                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs flex items-center gap-2 disabled:opacity-50"
                             >
                                {isTesting && <Loader2 size={12} className="animate-spin"/>}
                                {t.testConnection}
                             </button>
                             {testStatus === 'success' && <span className="text-green-500 text-xs flex items-center gap-1"><CheckCircle size={12}/> {testMessage}</span>}
                             {testStatus === 'error' && <span className="text-red-500 text-xs flex items-center gap-1"><AlertTriangle size={12}/> {testMessage}</span>}
                         </div>
                     </div>
                 )}
                 <p className="text-xs text-slate-500">
                    Custom proxies must support the Google Gemini API format.
                 </p>
            </div>
        </div>

        {/* Notifications */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
            <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                <Bell size={20} className="text-yellow-500" /> {t.notifications}
            </h3>
            
            <div className="space-y-4">
                 <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div className="flex items-center gap-3">
                        <Shield className="text-red-400" size={18} />
                        <div>
                            <p className="text-sm font-medium text-slate-200">Critical Alerts</p>
                            <p className="text-xs text-slate-500">Email alerts for device failure</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={notifications} onChange={() => setNotifications(!notifications)} className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                 </div>
            </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-800">
        <button 
            onClick={handleSave}
            className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium shadow-lg shadow-green-900/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
        >
            <Save size={18} />
            {t.saveSettings}
        </button>
      </div>
    </div>
  );
};
