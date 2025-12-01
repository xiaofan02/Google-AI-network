
export enum DeviceType {
  ROUTER = 'ROUTER',
  SWITCH = 'SWITCH',
  FIREWALL = 'FIREWALL',
  ESXI = 'ESXI',
  PROXMOX = 'PROXMOX',
  DOCKER_HOST = 'DOCKER_HOST',
  VM = 'VM',
  CONTAINER = 'CONTAINER'
}

export enum Vendor {
  CISCO = 'Cisco',
  HUAWEI = 'Huawei',
  JUNIPER = 'Juniper',
  ARISTA = 'Arista',
  MIKROTIK = 'MikroTik',
  VMWARE = 'VMware',
  LINUX = 'Linux'
}

export enum DeviceStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL'
}

export interface NetworkInterface {
  id: string;
  name: string; 
  mac: string;
  ip: string;
  speed: number; 
  rxRate: number; 
  txRate: number; 
  status: 'UP' | 'DOWN';
}

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  vendor: Vendor;
  role?: 'CORE' | 'DISTRIBUTION' | 'ACCESS' | 'EDGE'; 
  ip: string;
  os: string;
  status: DeviceStatus;
  uptime: number; 
  cpuUsage: number; 
  memUsage: number; 
  diskUsage: number; 
  interfaces: NetworkInterface[];
  config?: string; 
  children?: string[]; 
  parentId?: string; 
}

export interface Link {
  source: string;
  target: string;
  value: number; 
}

export interface TopologyData {
  nodes: Device[];
  links: Link[];
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  message: string;
  deviceId?: string;
  rawSyslog?: string; 
}

export interface Vulnerability {
  id: string;
  deviceId: string;
  deviceName: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  remediation: string;
  cveId?: string;
  status: 'OPEN' | 'FIXED';
}

export interface BugReport {
  id: string;
  vendor: Vendor;
  affectedVersions: string[];
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  cveId?: string;
  publishDate: string;
}

export interface Subnet {
  id: string;
  cidr: string; 
  name: string;
  usage: number; 
  totalIps: number;
  usedIps: number;
  location: string;
}

export interface Report {
  id: string;
  name: string;
  type: string;
  date: Date;
  size: string;
  status: 'READY' | 'GENERATING' | 'FAILED';
  url?: string;
}

export interface TrafficPoint {
  time: string;
  rx: number; 
  tx: number; 
}

export interface AISettings {
  useCustom: boolean;
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface CloudResource {
  id: string;
  provider: 'AWS' | 'AZURE';
  type: 'EC2' | 'S3' | 'RDS' | 'VM' | 'BLOB' | 'SQL';
  name: string;
  region: string;
  status: 'RUNNING' | 'STOPPED' | 'PROVISIONING';
  cost: number; 
  cpuUsage: number;
}

export interface AutomationTask {
  id: string;
  name: string;
  description: string;
  scriptType: 'PYTHON' | 'ANSIBLE' | 'BASH';
  script: string;
  lastRun: Date | null;
  status: 'IDLE' | 'RUNNING' | 'SUCCESS' | 'FAILED';
  progress: number;
}

// --- NCCM Config Management ---
export interface ConfigBackup {
  id: string;
  deviceId: string;
  timestamp: Date;
  version: string; // v1, v2, v3
  content: string;
  changeNote: string;
}

// --- NetFlow ---
export interface FlowRecord {
  id: string;
  timestamp: Date;
  srcIp: string;
  dstIp: string;
  srcPort: number;
  dstPort: number;
  protocol: 'TCP' | 'UDP' | 'ICMP';
  bytes: number;
  application: string;
}

// --- INSPECTION & COMPLIANCE ---

export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  regex: string; 
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  enabled: boolean;
}

// Structured AI Result for Inspection
export interface AIAnalysisResult {
    summary: string;
    score: number;
    issues: {
        severity: 'HIGH' | 'MEDIUM' | 'LOW';
        finding: string;
        recommendation: string;
        command?: string;
    }[];
}

export interface InspectionItem {
  id: string;
  deviceId: string;
  deviceName: string;
  checkType: 'AI_ANALYSIS' | 'COMPLIANCE' | 'PING' | 'RESOURCE';
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  aiAnalysis?: AIAnalysisResult | string; // Updated to allow structured object
  timestamp: Date;
}

export interface InspectionReport {
  id: string;
  startTime: Date;
  endTime?: Date;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  items: InspectionItem[];
  score: number;
  log: string[]; 
}

export interface InspectionSettings {
    enabled: boolean;
    interval: number; // minutes
    lastRun: Date | null;
    nextRun: Date | null;
}

export interface DetailedReportData {
  summary: {
      deviceModel: string;
      osVersion: string;
      totalInterfaces: number;
      upInterfaces: number;
      overallStatus: string;
      cpuTrend: number[];
      memUsage: number;
      errorLogs: number;
  };
  coreFindings: string[];
  suggestions: string[];
  actions: string[];
  generatedAt: string;
}

// --- AGENT TYPES ---
export interface AgentThought {
    step: string;
    tool?: string;
    details?: string;
}

// Language Support
export type Language = 'en' | 'cn';

export const DICTIONARY = {
  en: {
    dashboard: 'Dashboard',
    topology: 'Topology',
    devices: 'Devices',
    security: 'Security Audit',
    threats: 'Threat Intel',
    logs: 'Log Analysis',
    automation: 'Automation',
    cloud: 'Hybrid Cloud',
    inspection: 'Smart Inspection',
    settings: 'Settings',
    ipam: 'IP Address Mgmt',
    reports: 'Reports',
    configMgmt: 'Configuration',
    netflow: 'Traffic Analysis',
    
    // New Professional Groupings
    menuMonitor: 'Global Monitor',
    menuAssets: 'Asset Management',
    menuOps: 'Ops & Analytics',
    menuNetOps: 'Config & Automation',
    menuSecurity: 'Security Center',
    menuAdmin: 'Admin & Reports',

    aiCopilot: 'NetGuardian Agent',
    online: 'Online',
    offline: 'Offline',
    critical: 'Critical',
    warning: 'Warning',
    cpu: 'CPU Usage',
    memory: 'Memory',
    storage: 'Storage',
    network: 'Network',
    alerts: 'Alerts',
    search: 'Search devices...',
    askAI: 'Ask AI Agent to perform tasks...',
    status: 'Status',
    actions: 'Actions',
    totalDevices: 'Total Devices',
    traffic: 'Traffic Load',
    health: 'System Health',
    aiTyping: 'AI Agent is working...',
    name: 'Name',
    type: 'Type',
    ipAddress: 'IP Address',
    uptime: 'Uptime',
    viewConfig: 'View Config',
    terminal: 'Console',
    reboot: 'Reboot',
    delete: 'Delete',
    edit: 'Edit',
    addDevice: 'Add Device',
    batchImport: 'Batch Import',
    import: 'Import',
    cancel: 'Cancel',
    save: 'Save',
    avgCpu: 'Avg CPU Load',
    avgMem: 'Avg Memory',
    topResources: 'Top Resource Usage',
    deviceStatusDist: 'Device Status Distribution',
    eventLog: 'System Event Log',
    noEvents: 'No events recorded.',
    topologyZoom: 'Scroll to zoom • Drag canvas to pan',
    deviceDetails: 'Device Details',
    interfaces: 'Interfaces',
    close: 'Close',
    configViewer: 'Configuration Viewer',
    rawConfig: 'Raw Configuration',
    securityScore: 'Security Score',
    vulnerabilities: 'Vulnerabilities',
    fix: 'Fix',
    ignore: 'Ignore',
    scanNow: 'Scan Now',
    scanning: 'Scanning...',
    lastScan: 'Last Scan',
    snmpCommunity: 'SNMP Community String',
    scanInterval: 'Scan Interval (seconds)',
    saveSettings: 'Save Settings',
    generalSettings: 'General Settings',
    aiSettings: 'AI Configuration',
    notifications: 'Notifications',
    subnet: 'Subnet',
    utilization: 'Utilization',
    location: 'Location',
    available: 'Available',
    generateReport: 'Generate Report',
    download: 'Download',
    preview: 'Preview',
    reportType: 'Report Type',
    format: 'Format',
    trafficTrend: 'Real-time Network Traffic',
    batchActions: 'Batch Actions',
    selected: 'Selected',
    addSubnet: 'Add Subnet',
    cidr: 'CIDR Block',
    copilotTitle: 'NetGuardian Agent',
    aiDisclaimer: 'AI Agent (MCP) can execute real tasks.',
    aiWelcome: 'Hello! I am your AI Agent. I can manage devices, scan networks, and analyze logs. What shall I do?',
    apiKeyMissing: 'Error: API Key is missing. Please check your settings.',
    aiCommError: 'I encountered an error communicating with the AI service. Please try again.',
    aiThinking: 'Processing...',
    rebootSent: 'Reboot signal sent',
    deviceNotFound: 'Device not found',
    askAIFix: 'Ask AI for Fix',
    bugLibrary: 'Bug/Virus Library',
    affectedDevices: 'Affected Devices',
    analyzeLog: 'Analyze Log',
    logAnalysis: 'Log Analysis',
    playbooks: 'Playbooks',
    run: 'Run',
    running: 'Running...',
    cloudOverview: 'Cloud Overview',
    totalCost: 'Est. Monthly Cost',
    activeInstances: 'Active Instances',
    startInspection: 'Start Smart Inspection',
    inspectionProgress: 'Inspection Progress',
    inspectionResults: 'Inspection Results',
    checksPassed: 'Checks Passed',
    checksFailed: 'Checks Failed',
    inspectionScore: 'Inspection Score',
    diagnose: 'Diagnose',
    testConnection: 'Test Connection',
    connectionSuccess: 'Connection Successful!',
    connectionFailed: 'Connection Failed',
    autoInspection: 'Automatic Inspection',
    enableSchedule: 'Enable Schedule',
    every: 'Every',
    minutes: 'Minutes',
    history: 'History',
    deployment: 'Deployment Guide',
    compliance: 'Compliance Rules',
    addRule: 'Add Rule',
    regex: 'Regex Pattern',
    executing: 'Executing',
    collecting: 'Collecting info from',
    agentReasoning: 'Agent Reasoning',
    compare: 'Compare',
    version: 'Version',
    diff: 'Diff',
    analyzeDiff: 'Analyze Change Risk',
    topTalkers: 'Top Talkers',
    protocols: 'Protocols'
  },
  cn: {
    dashboard: '仪表盘',
    topology: '网络拓扑',
    devices: '设备管理',
    security: '安全审计',
    threats: '威胁情报',
    logs: '日志分析',
    automation: '自动化运维',
    cloud: '多云监控',
    inspection: '智能巡检',
    settings: '系统设置',
    ipam: 'IP 地址管理',
    reports: '报表中心',
    configMgmt: '配置管理',
    netflow: '流量分析',

    // New Professional Groupings
    menuMonitor: '全局监控',
    menuAssets: '资产管理',
    menuOps: '运维分析',
    menuNetOps: '配置与自动化',
    menuSecurity: '安全中心',
    menuAdmin: '报表与系统',

    aiCopilot: 'NetGuardian 智能代理',
    online: '在线',
    offline: '离线',
    critical: '严重',
    warning: '警告',
    cpu: 'CPU 使用率',
    memory: '内存',
    storage: '存储',
    network: '网络',
    alerts: '告警信息',
    search: '搜索设备名称或IP...',
    askAI: '告诉 AI 代理您需要做什么（例如：扫描网段、重启设备）...',
    status: '状态',
    actions: '操作',
    totalDevices: '设备总数',
    traffic: '流量负载',
    health: '系统健康度',
    aiTyping: 'AI 代理正在执行任务...',
    name: '名称',
    type: '类型',
    ipAddress: 'IP 地址',
    uptime: '运行时间',
    viewConfig: '查看配置',
    terminal: '控制台',
    reboot: '重启',
    delete: '删除',
    edit: '编辑',
    addDevice: '添加设备',
    batchImport: '批量导入',
    import: '导入',
    cancel: '取消',
    save: '保存',
    avgCpu: '平均 CPU',
    avgMem: '平均内存',
    topResources: '资源使用排行',
    deviceStatusDist: '设备状态分布',
    eventLog: '系统事件日志',
    noEvents: '暂无日志记录',
    topologyZoom: '滚动缩放 • 拖动画布平移',
    deviceDetails: '设备详情',
    interfaces: '接口列表',
    close: '关闭',
    configViewer: '配置查看器',
    rawConfig: '原始配置',
    securityScore: '安全评分',
    vulnerabilities: '漏洞列表',
    fix: '一键修复',
    ignore: '忽略',
    scanNow: '立即扫描',
    scanning: '正在扫描全网...',
    lastScan: '上次扫描',
    snmpCommunity: 'SNMP 团体名',
    scanInterval: '扫描间隔 (秒)',
    saveSettings: '保存设置',
    generalSettings: '常规设置',
    aiSettings: 'AI 模型配置',
    notifications: '通知设置',
    subnet: '网段',
    utilization: '使用率',
    location: '位置',
    available: '可用',
    generateReport: '生成报表',
    download: '下载',
    preview: '预览',
    reportType: '报表类型',
    format: '格式',
    trafficTrend: '实时网络流量趋势',
    batchActions: '批量操作',
    selected: '已选择',
    addSubnet: '添加网段',
    cidr: 'CIDR 网段',
    copilotTitle: 'NetGuardian 智能代理',
    aiDisclaimer: 'AI Agent (MCP) 可执行真实系统任务，请谨慎。',
    aiWelcome: '您好！我是您的智能运维代理。我可以帮您管理设备、扫描网络或分析日志。请下达指令。',
    apiKeyMissing: '错误：API Key 缺失，请检查设置。',
    aiCommError: '与 AI 服务通信时出错，请重试。',
    aiThinking: '正在处理...',
    rebootSent: '重启指令已发送',
    deviceNotFound: '未找到设备',
    askAIFix: '询问 AI 修复方案',
    bugLibrary: '病毒/漏洞库',
    affectedDevices: '受影响设备',
    analyzeLog: '智能分析日志',
    logAnalysis: '日志分析中心',
    playbooks: '运维剧本',
    run: '执行',
    running: '执行中...',
    cloudOverview: '云资源概览',
    totalCost: '预估月成本',
    activeInstances: '活跃实例',
    startInspection: '开始智能巡检',
    inspectionProgress: '巡检进度',
    inspectionResults: '巡检结果',
    checksPassed: '检查通过',
    checksFailed: '检查失败',
    inspectionScore: '巡检评分',
    diagnose: '智能诊断',
    testConnection: '测试连接',
    connectionSuccess: '连接成功！',
    connectionFailed: '连接失败',
    autoInspection: '自动巡检',
    enableSchedule: '开启定时任务',
    every: '每隔',
    minutes: '分钟',
    history: '历史记录',
    deployment: '部署指南',
    compliance: '合规性规则',
    addRule: '添加规则',
    regex: '正则表达式',
    executing: '正在执行',
    collecting: '正在采集信息：',
    agentReasoning: 'Agent 思考过程',
    compare: '配置比对',
    version: '版本',
    diff: '差异',
    analyzeDiff: '分析变更风险',
    topTalkers: 'Top 通信源',
    protocols: '协议分布'
  }
};
