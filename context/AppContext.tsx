
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Device, TopologyData, LogEntry, Language, DeviceType, DeviceStatus, Vulnerability, Report, TrafficPoint, Subnet, BugReport, AISettings, Vendor, CloudResource, AutomationTask, InspectionReport, InspectionItem, InspectionSettings, ComplianceRule, ConfigBackup, FlowRecord } from '../types';
import { generateMockTopology, generateMockReport, generateBugDatabase, generateSyslogs, generateCloudResources, generateAutomationTasks, generateConfigBackups, generateNetflowData } from '../services/mockDataService';
import { geminiService } from '../services/geminiService';

interface AppContextType {
  devices: Device[];
  topology: TopologyData;
  logs: LogEntry[];
  syslogs: LogEntry[];
  vulnerabilities: Vulnerability[];
  bugDatabase: BugReport[];
  reports: Report[];
  trafficHistory: TrafficPoint[];
  subnets: Subnet[];
  cloudResources: CloudResource[];
  automationTasks: AutomationTask[];
  
  // New Modules
  configBackups: ConfigBackup[];
  netflowData: FlowRecord[];

  // Inspection State
  inspectionReport: InspectionReport | null;
  inspectionHistory: InspectionReport[];
  isInspecting: boolean;
  inspectionProgress: number;
  inspectionSettings: InspectionSettings;
  updateInspectionSettings: (settings: Partial<InspectionSettings>) => void;
  complianceRules: ComplianceRule[];
  addComplianceRule: (rule: Partial<ComplianceRule>) => void;

  isScanning: boolean;
  scanProgress: number;
  language: Language;
  aiSettings: AISettings;
  setLanguage: (lang: Language) => void;
  updateAISettings: (settings: AISettings) => void;
  refreshData: () => void;
  addLog: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  toggleDeviceStatus: (id: string) => void;
  fixVulnerability: (id: string) => void;
  startSecurityScan: () => void;
  addDevice: (device: Partial<Device>) => void;
  updateDevice: (id: string, updates: Partial<Device>) => void;
  removeDevice: (id: string) => void;
  deleteDevices: (ids: string[]) => void;
  importDevices: (json: string) => boolean;
  generateNewReport: (type: string, name: string) => void;
  addSubnet: (subnet: Partial<Subnet>) => void;
  triggerAICopilot: (prompt: string) => void;
  copilotTrigger: string | null;
  clearCopilotTrigger: () => void;
  runAutomationTask: (id: string) => void;
  addAutomationTask: (task: Partial<AutomationTask>) => void;
  startInspection: () => void;
  selectInspectionReport: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<{ devices: Device[], topology: TopologyData, vulnerabilities: Vulnerability[] } | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [syslogs, setSyslogs] = useState<LogEntry[]>([]);
  const [bugDatabase, setBugDatabase] = useState<BugReport[]>([]);
  const [cloudResources, setCloudResources] = useState<CloudResource[]>([]);
  const [automationTasks, setAutomationTasks] = useState<AutomationTask[]>([]);
  const [configBackups, setConfigBackups] = useState<ConfigBackup[]>([]);
  const [netflowData, setNetflowData] = useState<FlowRecord[]>([]);
  
  const [reports, setReports] = useState<Report[]>([
      { id: 'r1', name: 'Asset_Inventory_Q3.pdf', type: 'Asset', date: new Date('2023-10-24'), size: '2.4 MB', status: 'READY' },
      { id: 'r2', name: 'Security_Audit_Weekly.csv', type: 'Security', date: new Date('2023-10-23'), size: '450 KB', status: 'READY' }
  ]);
  const [subnets, setSubnets] = useState<Subnet[]>([]);
  const [trafficHistory, setTrafficHistory] = useState<TrafficPoint[]>([]);
  const [language, setLanguage] = useState<Language>('cn');
  
  const [aiSettings, setAiSettings] = useState<AISettings>({
      useCustom: false,
      apiKey: '',
      baseUrl: '',
      model: 'gemini-2.5-flash'
  });

  const [copilotTrigger, setCopilotTrigger] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  // Inspection State
  const [isInspecting, setIsInspecting] = useState(false);
  const [inspectionProgress, setInspectionProgress] = useState(0);
  const [inspectionReport, setInspectionReport] = useState<InspectionReport | null>(null);
  const [inspectionHistory, setInspectionHistory] = useState<InspectionReport[]>([]);
  const [inspectionSettings, setInspectionSettings] = useState<InspectionSettings>({
      enabled: false,
      interval: 60, 
      lastRun: null,
      nextRun: null
  });
  
  const [complianceRules, setComplianceRules] = useState<ComplianceRule[]>([
      { id: 'rule-1', name: 'Service Password Encryption', description: 'Ensure passwords are encrypted', regex: 'service password-encryption', severity: 'HIGH', enabled: true },
      { id: 'rule-2', name: 'SSH Timeout', description: 'Timeout must be set', regex: 'exec-timeout', severity: 'MEDIUM', enabled: true },
  ]);

  useEffect(() => {
    const initialData = generateMockTopology(25);
    setData(initialData);
    setBugDatabase(generateBugDatabase());
    setSyslogs(generateSyslogs(initialData.devices));
    setCloudResources(generateCloudResources());
    setAutomationTasks(generateAutomationTasks());
    setConfigBackups(generateConfigBackups(initialData.devices));
    setNetflowData(generateNetflowData());

    const subnetsMap: Record<string, number> = {};
    initialData.devices.forEach(d => {
        const parts = d.ip.split('.');
        if(parts.length === 4) {
            const subnet = `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
            subnetsMap[subnet] = (subnetsMap[subnet] || 0) + 1;
        }
    });
    const initialSubnets = Object.keys(subnetsMap).map((cidr, idx) => ({
        id: `sub-${idx}`,
        cidr,
        name: cidr === '192.168.1.0/24' ? 'Management LAN' : `VLAN ${10 * (idx+1)}`,
        usage: Math.round((subnetsMap[cidr] / 254) * 100),
        usedIps: subnetsMap[cidr],
        totalIps: 254,
        location: idx === 0 ? 'HQ - Server Room' : 'Branch Office'
    }));
    setSubnets(initialSubnets);

    const now = new Date();
    const initialTraffic = Array.from({length: 20}).map((_, i) => ({
        time: new Date(now.getTime() - (20 - i) * 2000).toLocaleTimeString(),
        rx: Math.floor(Math.random() * 500) + 100,
        tx: Math.floor(Math.random() * 500) + 100
    }));
    setTrafficHistory(initialTraffic);

  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!data) return;
      const updatedDevices = data.devices.map(d => ({
        ...d,
        cpuUsage: Math.min(100, Math.max(0, d.cpuUsage + (Math.random() * 10 - 5))),
        memUsage: Math.min(100, Math.max(0, d.memUsage + (Math.random() * 5 - 2.5))),
        interfaces: d.interfaces.map(i => ({
            ...i,
            rxRate: Math.max(0, i.rxRate + (Math.random() * 20 - 10)),
            txRate: Math.max(0, i.txRate + (Math.random() * 20 - 10)),
        }))
      }));

      const totalRx = updatedDevices.reduce((acc, d) => acc + (d.interfaces[0]?.rxRate || 0), 0);
      const totalTx = updatedDevices.reduce((acc, d) => acc + (d.interfaces[0]?.txRate || 0), 0);
      
      setTrafficHistory(prev => {
          const newPoint = { time: new Date().toLocaleTimeString(), rx: Math.floor(totalRx), tx: Math.floor(totalTx) };
          return [...prev.slice(1), newPoint];
      });

      setData(prev => prev ? { ...prev, devices: updatedDevices } : null);
    }, 2000);

    return () => clearInterval(interval);
  }, [data]);

  useEffect(() => {
      if (!inspectionSettings.enabled) return;
      const now = new Date();
      if (!inspectionSettings.nextRun || now >= inspectionSettings.nextRun) {
           if (!isInspecting) {
               startInspection();
               const next = new Date(now.getTime() + inspectionSettings.interval * 60000);
               setInspectionSettings(prev => ({ ...prev, lastRun: now, nextRun: next }));
           }
      }
      const timer = setInterval(() => {
           const current = new Date();
           if (inspectionSettings.nextRun && current >= inspectionSettings.nextRun) {
               if (!isInspecting) {
                   startInspection();
                   const next = new Date(current.getTime() + inspectionSettings.interval * 60000);
                   setInspectionSettings(prev => ({ ...prev, lastRun: current, nextRun: next }));
               }
           }
      }, 10000); 
      return () => clearInterval(timer);
  }, [inspectionSettings, isInspecting]);


  const refreshData = () => {
    const newData = generateMockTopology(25);
    setData(newData);
    addLog({ level: 'INFO', message: 'System data manually refreshed.' });
  };

  const addLog = (log: Omit<LogEntry, 'id' | 'timestamp'>) => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      ...log
    };
    setLogs(prev => [newLog, ...prev].slice(0, 100));
  };

  const toggleDeviceStatus = (id: string) => {
    if (!data) return;
    const updatedDevices = data.devices.map(d => {
      if (d.id === id) {
        const newStatus = d.status === DeviceStatus.ONLINE ? DeviceStatus.OFFLINE : DeviceStatus.ONLINE;
        addLog({ level: newStatus === DeviceStatus.ONLINE ? 'SUCCESS' : 'WARN', message: `Device ${d.name} status changed to ${newStatus}`, deviceId: id });
        return { ...d, status: newStatus };
      }
      return d;
    });
    setData({ ...data, devices: updatedDevices });
  };

  const fixVulnerability = (id: string) => {
      if(!data) return;
      const updatedVulns = data.vulnerabilities.map(v => {
          if(v.id === id) {
              addLog({ level: 'SUCCESS', message: `Vulnerability fixed: ${v.description} on ${v.deviceName}`, deviceId: v.deviceId });
              return { ...v, status: 'FIXED' as const };
          }
          return v;
      });
      setData({...data, vulnerabilities: updatedVulns});
  }

  const startSecurityScan = () => {
      if (isScanning || !data) return;
      setIsScanning(true);
      setScanProgress(0);
      addLog({ level: 'INFO', message: 'Initiating full network security scan...' });

      const interval = setInterval(() => {
          setScanProgress(prev => {
              if (prev >= 100) {
                  clearInterval(interval);
                  setIsScanning(false);
                  const newVuln: Vulnerability = {
                      id: `vuln-${Date.now()}`,
                      deviceId: data.devices[0].id,
                      deviceName: data.devices[0].name,
                      severity: 'MEDIUM',
                      description: 'Unencrypted Service Detected (HTTP)',
                      remediation: 'Enable HTTPS redirect',
                      status: 'OPEN'
                  };
                  setData(prevData => prevData ? { ...prevData, vulnerabilities: [newVuln, ...prevData.vulnerabilities] } : null);
                  addLog({ level: 'WARN', message: 'Scan complete. 1 new vulnerability detected.' });
                  return 100;
              }
              return prev + 10;
          });
      }, 500);
  };

  const addDevice = (deviceData: Partial<Device>) => {
      if (!data) return;
      const newDevice: Device = {
          id: `dev-${Math.random().toString(36).substr(2, 6)}`,
          name: deviceData.name || 'New Device',
          type: deviceData.type || DeviceType.SWITCH,
          vendor: deviceData.vendor || Vendor.CISCO,
          ip: deviceData.ip || '0.0.0.0',
          role: deviceData.role || 'ACCESS',
          status: DeviceStatus.ONLINE,
          os: 'Unknown',
          uptime: 0,
          cpuUsage: 0,
          memUsage: 0,
          diskUsage: 0,
          interfaces: [{
              id: 'eth0',
              name: 'eth0',
              mac: '00:00:00:00:00:00',
              ip: deviceData.ip || '0.0.0.0',
              speed: 1000,
              rxRate: 0,
              txRate: 0,
              status: 'UP'
          }],
          ...deviceData
      } as Device;
      setData({ ...data, devices: [...data.devices, newDevice] });
      addLog({ level: 'SUCCESS', message: `Device ${newDevice.name} added successfully.`, deviceId: newDevice.id });
  };

  const updateDevice = (id: string, updates: Partial<Device>) => {
      if (!data) return;
      const updatedDevices = data.devices.map(d => d.id === id ? { ...d, ...updates } : d);
      setData({ ...data, devices: updatedDevices });
      addLog({ level: 'INFO', message: `Device ${updates.name || id} updated.` });
  };

  const removeDevice = (id: string) => {
      if (!data) return;
      const target = data.devices.find(d => d.id === id);
      const updatedDevices = data.devices.filter(d => d.id !== id);
      const updatedLinks = data.topology.links.filter(l => l.source !== id && l.target !== id);
      setData({ ...data, devices: updatedDevices, topology: { ...data.topology, links: updatedLinks, nodes: updatedDevices } });
      addLog({ level: 'WARN', message: `Device ${target?.name || id} removed from system.` });
  };

  const deleteDevices = (ids: string[]) => {
      if (!data) return;
      const updatedDevices = data.devices.filter(d => !ids.includes(d.id));
      const updatedLinks = data.topology.links.filter(l => !ids.includes(l.source) && !ids.includes(l.target));
       setData({ ...data, devices: updatedDevices, topology: { ...data.topology, links: updatedLinks, nodes: updatedDevices } });
      addLog({ level: 'WARN', message: `Batch delete: ${ids.length} devices removed.` });
  };

  const importDevices = (json: string): boolean => {
      try {
          const parsed = JSON.parse(json);
          if (Array.isArray(parsed)) {
              const newDevices = parsed.map(d => ({
                  ...d,
                  id: d.id || `imported-${Math.random().toString(36).substr(2, 6)}`,
                  status: DeviceStatus.ONLINE,
                  interfaces: d.interfaces || [],
                  cpuUsage: 0,
                  memUsage: 0
              }));
              if(!data) return false;
              setData({ ...data, devices: [...data.devices, ...newDevices] });
              addLog({ level: 'SUCCESS', message: `Batch import successful. Added ${newDevices.length} devices.` });
              return true;
          }
          return false;
      } catch (e) {
          addLog({ level: 'ERROR', message: 'Failed to parse import data. Invalid JSON.' });
          return false;
      }
  };

  const generateNewReport = (type: string, name: string) => {
      const tempId = Math.random().toString();
      const tempReport: Report = {
          id: tempId,
          name: `${name}.pdf`,
          type,
          date: new Date(),
          size: '0 KB',
          status: 'GENERATING'
      };
      setReports(prev => [tempReport, ...prev]);
      setTimeout(() => {
          setReports(prev => prev.map(r => r.id === tempId ? generateMockReport(type, name) : r));
          addLog({ level: 'SUCCESS', message: `Report ${name} generated successfully.` });
      }, 3000);
  };

  const addSubnet = (subnet: Partial<Subnet>) => {
      const newSubnet: Subnet = {
          id: `sub-${Date.now()}`,
          cidr: subnet.cidr || '0.0.0.0/0',
          name: subnet.name || 'New Subnet',
          usage: 0,
          usedIps: 0,
          totalIps: 254,
          location: subnet.location || 'Unknown'
      };
      setSubnets(prev => [...prev, newSubnet]);
      addLog({ level: 'SUCCESS', message: `Subnet ${newSubnet.cidr} added.` });
  };

  const triggerAICopilot = (prompt: string) => {
      setCopilotTrigger(prompt);
  };

  const clearCopilotTrigger = () => {
      setCopilotTrigger(null);
  }
  
  const updateAISettings = (settings: AISettings) => {
      setAiSettings(settings);
      addLog({ level: 'SUCCESS', message: 'AI Configuration updated.' });
  }

  const runAutomationTask = (id: string) => {
      setAutomationTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'RUNNING', progress: 0 } : t));
      const interval = setInterval(() => {
          setAutomationTasks(prev => {
              const task = prev.find(t => t.id === id);
              if (!task || task.status !== 'RUNNING') {
                  clearInterval(interval);
                  return prev;
              }
              const newProgress = task.progress + 10;
              if (newProgress >= 100) {
                  clearInterval(interval);
                  addLog({ level: 'SUCCESS', message: `Automation Task '${task.name}' completed.` });
                  return prev.map(t => t.id === id ? { ...t, status: 'SUCCESS', progress: 100, lastRun: new Date() } : t);
              }
              return prev.map(t => t.id === id ? { ...t, progress: newProgress } : t);
          });
      }, 500);
  }

  const addAutomationTask = (task: Partial<AutomationTask>) => {
      const newTask: AutomationTask = {
          id: `task-${Date.now()}`,
          name: task.name || 'New Task',
          description: task.description || '',
          scriptType: task.scriptType || 'PYTHON',
          script: task.script || '',
          lastRun: null,
          status: 'IDLE',
          progress: 0
      };
      setAutomationTasks(prev => [...prev, newTask]);
      addLog({ level: 'SUCCESS', message: `New Automation Task '${newTask.name}' created.` });
  }

  const updateInspectionSettings = (settings: Partial<InspectionSettings>) => {
      setInspectionSettings(prev => ({ ...prev, ...settings }));
  }

  const addComplianceRule = (rule: Partial<ComplianceRule>) => {
      const newRule: ComplianceRule = {
          id: `rule-${Date.now()}`,
          name: rule.name || 'New Rule',
          description: rule.description || '',
          regex: rule.regex || '',
          severity: rule.severity || 'MEDIUM',
          enabled: true
      };
      setComplianceRules(prev => [...prev, newRule]);
  };

  // --- SMART INSPECTION 2.0 (SEQUENTIAL LOGIC) ---
  const startInspection = async () => {
      if (isInspecting || !data) return;
      setIsInspecting(true);
      setInspectionProgress(0);
      setInspectionReport(null);
      addLog({ level: 'INFO', message: 'Starting Smart Network Inspection...' });

      const devicesToInspect = data.devices;
      const results: InspectionItem[] = [];
      const logs: string[] = [];

      // Create a temporary ID for the report
      const reportId = `insp-${Date.now()}`;
      
      const updateReport = (progress: number, newItems: InspectionItem[], newLogs: string[]) => {
           setInspectionProgress(progress);
           if (newLogs.length > 0) logs.push(...newLogs);
           if (newItems.length > 0) results.push(...newItems);
           
           setInspectionReport({
               id: reportId,
               startTime: new Date(),
               totalChecks: devicesToInspect.length,
               passedChecks: results.filter(r => r.status === 'PASS').length,
               failedChecks: results.filter(r => r.status !== 'PASS').length,
               items: results,
               score: 0,
               log: logs
           });
      };

      for (let i = 0; i < devicesToInspect.length; i++) {
          const device = devicesToInspect[i];
          const progress = Math.round(((i + 1) / devicesToInspect.length) * 100);
          
          updateReport(progress, [], [`Connecting to ${device.name} (${device.ip}) via SSH...`]);
          await new Promise(r => setTimeout(r, 400)); 

          updateReport(progress, [], [`Executing 'show run', 'show environment' on ${device.name}...`]);
          await new Promise(r => setTimeout(r, 400));

          const localItems: InspectionItem[] = [];
          
          localItems.push({
              id: `chk-${device.id}-ping`, deviceId: device.id, deviceName: device.name, checkType: 'PING', timestamp: new Date(),
              status: device.status === DeviceStatus.OFFLINE ? 'FAIL' : 'PASS',
              message: device.status === DeviceStatus.OFFLINE ? 'Unreachable' : 'Latency <1ms'
          });

          complianceRules.forEach(rule => {
              if (!rule.enabled) return;
              if (device.config) {
                  const match = new RegExp(rule.regex).test(device.config);
                  localItems.push({
                       id: `chk-${device.id}-${rule.id}`, deviceId: device.id, deviceName: device.name, checkType: 'COMPLIANCE', timestamp: new Date(),
                       status: match ? 'PASS' : 'FAIL',
                       message: match ? `Rule '${rule.name}' matched` : `Rule '${rule.name}' violation detected`
                  });
              }
          });

          if (device.status !== DeviceStatus.ONLINE || device.role === 'CORE') {
              updateReport(progress, [], [`Sending telemetry to AI for analysis...`]);
              // Pass structured result directly
              const aiAnalysis = await geminiService.analyzeInspectionData(device, aiSettings);
              
              // Determine status based on structured AI output
              let status: 'PASS'|'WARNING'|'FAIL' = 'PASS';
              if (typeof aiAnalysis === 'object' && aiAnalysis.score < 80) status = 'WARNING';
              if (typeof aiAnalysis === 'object' && aiAnalysis.score < 50) status = 'FAIL';

              localItems.push({
                  id: `chk-${device.id}-ai`, deviceId: device.id, deviceName: device.name, checkType: 'AI_ANALYSIS', timestamp: new Date(),
                  status: status,
                  message: 'AI Health Assessment',
                  aiAnalysis: aiAnalysis
              });
          }

          updateReport(progress, localItems, [`Finished inspecting ${device.name}.`]);
      }

      setIsInspecting(false);
      const passed = results.filter(r => r.status === 'PASS').length;
      const score = Math.round((passed / results.length) * 100) || 100;

      const finalReport: InspectionReport = {
          id: reportId,
          startTime: new Date(),
          totalChecks: results.length,
          passedChecks: passed,
          failedChecks: results.length - passed,
          items: results,
          score: score,
          log: logs
      };

      setInspectionReport(finalReport);
      setInspectionHistory(prev => [finalReport, ...prev]);
      addLog({ level: 'SUCCESS', message: 'Smart Inspection Completed.' });
  }

  const selectInspectionReport = (id: string) => {
      const report = inspectionHistory.find(r => r.id === id);
      if (report) setInspectionReport(report);
  }

  return (
    <AppContext.Provider value={{
      devices: data?.devices || [],
      topology: data?.topology || { nodes: [], links: [] },
      vulnerabilities: data?.vulnerabilities || [],
      bugDatabase,
      cloudResources,
      automationTasks,
      configBackups,
      netflowData,
      logs,
      syslogs,
      reports,
      trafficHistory,
      subnets,
      isScanning,
      scanProgress,
      
      inspectionReport,
      inspectionHistory,
      isInspecting,
      inspectionProgress,
      inspectionSettings,
      updateInspectionSettings,
      selectInspectionReport,
      complianceRules,
      addComplianceRule,
      detailedReportData: null, // Removed usage

      language,
      aiSettings,
      copilotTrigger,
      setLanguage,
      updateAISettings,
      refreshData,
      addLog,
      toggleDeviceStatus,
      fixVulnerability,
      startSecurityScan,
      addDevice,
      updateDevice,
      removeDevice,
      deleteDevices,
      importDevices,
      generateNewReport,
      addSubnet,
      triggerAICopilot,
      clearCopilotTrigger,
      runAutomationTask,
      addAutomationTask,
      startInspection
    }}>
      {children}
    </AppContext.Provider>
  );
};
