
import { Device, DeviceType, Vendor, DeviceStatus, Link, TopologyData, Vulnerability, Report, BugReport, LogEntry, CloudResource, AutomationTask } from '../types';

const getRandomStatus = (): DeviceStatus => {
  const rand = Math.random();
  if (rand > 0.96) return DeviceStatus.CRITICAL;
  if (rand > 0.88) return DeviceStatus.WARNING;
  return DeviceStatus.ONLINE;
};

// Simulate Configs for Multi-Vendor
const generateConfig = (name: string, type: DeviceType, vendor: Vendor, ip: string, interfaces: any[]): string => {
  const timestamp = new Date().toLocaleString();
  
  if (vendor === Vendor.CISCO) {
    let config = `! Cisco IOS XE Configuration\n! Last configuration change at ${timestamp}\nversion 16.9\nservice timestamps debug datetime msec\nservice timestamps log datetime msec\nhostname ${name}\n!\n`;
    config += `interface Vlan1\n ip address ${ip} 255.255.255.0\n no shutdown\n!\n`;
    interfaces.forEach((iface: any) => {
      config += `interface ${iface.name}\n ip address ${iface.ip} 255.255.255.252\n no shutdown\n!\n`;
    });
    return config + `ip route 0.0.0.0 0.0.0.0 192.168.1.1\n!\nend`;
  } 
  
  if (vendor === Vendor.HUAWEI) {
    let config = `# Huawei VRP Software\n# Last configuration change at ${timestamp}\nsysname ${name}\n#\nvlan 1\n#\ninterface Vlanif1\n ip address ${ip} 255.255.255.0\n#\n`;
    interfaces.forEach((iface: any) => {
        config += `interface ${iface.name}\n ip address ${iface.ip} 255.255.255.252\n undo shutdown\n#\n`;
    });
    return config + `ip route-static 0.0.0.0 0.0.0.0 192.168.1.1\nreturn`;
  }

  if (vendor === Vendor.JUNIPER) {
      let config = `## Last commit: ${timestamp}\nsystem {\n  host-name ${name};\n  root-authentication {\n    encrypted-password "$6$randomhash";\n  }\n}\ninterfaces {\n`;
      interfaces.forEach((iface: any) => {
          config += `  ${iface.name} {\n    unit 0 {\n      family inet {\n        address ${iface.ip}/30;\n      }\n    }\n  }\n`;
      });
      return config + `}\nrouting-options {\n  static {\n    route 0.0.0.0/0 next-hop 192.168.1.1;\n  }\n}`;
  }

  return `# Generic / Linux Config for ${name}\n# Generated ${timestamp}\nhostname ${name}\ninterface eth0\n  address ${ip}\n  netmask 255.255.255.0\n  gateway 192.168.1.1`;
};

const createDevice = (id: string, name: string, type: DeviceType, vendor: Vendor, role: 'CORE' | 'DISTRIBUTION' | 'ACCESS' | 'EDGE', parentId?: string): Device => {
  const ip = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  
  // Interface Naming Convention based on Vendor
  let ifName = 'eth0';
  if (vendor === Vendor.CISCO) ifName = 'GigabitEthernet0/1';
  if (vendor === Vendor.HUAWEI) ifName = 'GE1/0/1';
  if (vendor === Vendor.JUNIPER) ifName = 'ge-0/0/0';

  const mainInterface = {
    id: `eth0-${id}`,
    name: ifName,
    mac: '00:1A:2B:3C:4D:5E',
    ip: ip,
    speed: 1000,
    rxRate: Math.random() * 100,
    txRate: Math.random() * 100,
    status: 'UP' as const
  };

  const interfaces = [mainInterface];
  
  // OS Simulation
  let os = 'Linux';
  if (vendor === Vendor.CISCO) os = 'IOS XE 17.3';
  if (vendor === Vendor.HUAWEI) os = 'VRP 8.1';
  if (vendor === Vendor.JUNIPER) os = 'Junos OS 21.4';
  if (type === DeviceType.ESXI) os = 'VMware ESXi 7.0';

  return {
    id,
    name,
    type,
    vendor,
    role,
    ip,
    os,
    status: getRandomStatus(),
    uptime: Math.floor(Math.random() * 1000000),
    cpuUsage: Math.floor(Math.random() * 60) + 10,
    memUsage: Math.floor(Math.random() * 60) + 20,
    diskUsage: Math.floor(Math.random() * 60) + 20,
    interfaces: interfaces,
    config: generateConfig(name, type, vendor, ip, interfaces),
    children: [],
    parentId
  };
};

export const generateMockTopology = (nodeCount: number): { devices: Device[], topology: TopologyData, vulnerabilities: Vulnerability[] } => {
  const devices: Device[] = [];
  const links: Link[] = [];

  // --- Tier 1: Core (Mixed Vendor) ---
  const core1 = createDevice('core-01', 'Core-Cisco', DeviceType.ROUTER, Vendor.CISCO, 'CORE');
  const core2 = createDevice('core-02', 'Core-Huawei', DeviceType.ROUTER, Vendor.HUAWEI, 'CORE');
  devices.push(core1, core2);
  links.push({ source: core1.id, target: core2.id, value: 20 });

  // --- Tier 2: Distribution ---
  const dist1 = createDevice('dist-01', 'Dist-Juniper-1', DeviceType.SWITCH, Vendor.JUNIPER, 'DISTRIBUTION');
  const dist2 = createDevice('dist-02', 'Dist-Arista-1', DeviceType.SWITCH, Vendor.ARISTA, 'DISTRIBUTION');
  devices.push(dist1, dist2);

  // Core Links
  links.push({ source: core1.id, target: dist1.id, value: 10 });
  links.push({ source: core2.id, target: dist2.id, value: 10 });
  links.push({ source: dist1.id, target: dist2.id, value: 5 });

  // --- Tier 3: Access ---
  for(let i=1; i<=3; i++) {
    const acc = createDevice(`acc-0${i}`, `Access-SW${i}`, DeviceType.SWITCH, Vendor.CISCO, 'ACCESS');
    devices.push(acc);
    links.push({ source: dist1.id, target: acc.id, value: 5 });
    links.push({ source: dist2.id, target: acc.id, value: 5 });
    
    // --- Tier 4: Edge (Servers) ---
    const hostCount = 2;
    for(let h=0; h<hostCount; h++) {
        const type = h === 0 ? DeviceType.ESXI : DeviceType.PROXMOX;
        const vendor = Vendor.VMWARE;
        const host = createDevice(`host-${acc.id}-${h}`, `Host-${acc.id.split('-')[1]}-${h}`, type, vendor, 'EDGE');
        devices.push(host);
        links.push({ source: acc.id, target: host.id, value: 2 });
    }
  }

  const topology: TopologyData = {
    nodes: devices.filter(d => !d.parentId),
    links: links
  };

  // --- Vulnerabilities Mock ---
  const vulnerabilities: Vulnerability[] = [
      { id: 'v1', deviceId: 'core-01', deviceName: 'Core-Cisco', severity: 'MEDIUM', description: 'SNMP Default Community String (public)', remediation: 'Change SNMP community string', cveId: 'CVE-2023-2001', status: 'OPEN' },
      { id: 'v2', deviceId: 'dist-01', deviceName: 'Dist-Juniper-1', severity: 'HIGH', description: 'J-Web Remote Code Execution', remediation: 'Update Junos OS to version 21.4R3', cveId: 'CVE-2023-36844', status: 'OPEN' },
      { id: 'v3', deviceId: 'acc-01', deviceName: 'Access-SW1', severity: 'LOW', description: 'Port Security Disabled', remediation: 'Enable port-security on access ports', status: 'OPEN' },
  ];

  return { devices, topology, vulnerabilities };
};

export const generateMockReport = (type: string, name: string): Report => {
    return {
        id: Math.random().toString(36).substr(2, 9),
        name: `${name}_${new Date().toISOString().split('T')[0]}.pdf`,
        type: type,
        date: new Date(),
        size: `${(Math.random() * 5 + 0.5).toFixed(1)} MB`,
        status: 'READY',
        url: '#'
    };
};

export const generateBugDatabase = (): BugReport[] => [
  { id: 'bug-1', vendor: Vendor.CISCO, affectedVersions: ['16.9', '17.3'], severity: 'CRITICAL', title: 'IOS XE Web UI Privilege Escalation', description: 'A vulnerability in the web UI of Cisco IOS XE software could allow an unauthenticated, remote attacker to create an account with privilege level 15 access.', cveId: 'CVE-2023-20198', publishDate: '2023-10-16' },
  { id: 'bug-2', vendor: Vendor.JUNIPER, affectedVersions: ['21.2', '21.4'], severity: 'HIGH', title: 'J-Web PHP External Variable Modification', description: 'A vulnerability in J-Web allow remote attacker to modify PHP environment variables.', cveId: 'CVE-2023-36845', publishDate: '2023-08-17' },
  { id: 'bug-3', vendor: Vendor.HUAWEI, affectedVersions: ['VRP 8.1'], severity: 'MEDIUM', title: 'SSH Service Denial of Service', description: 'Attackers can send malformed packets to cause SSH service restart.', cveId: 'CVE-2022-2231', publishDate: '2022-05-10' },
];

export const generateSyslogs = (devices: Device[]): LogEntry[] => {
    const logs: LogEntry[] = [];
    const events = [
        { msg: '%LINK-3-UPDOWN: Interface GigabitEthernet0/1, changed state to down', level: 'ERROR', sys: '<187>' },
        { msg: '%SYS-5-CONFIG_I: Configured from console by admin', level: 'INFO', sys: '<189>' },
        { msg: '%SEC-4-LOGIN_FAILED: Login failed from 192.168.1.50', level: 'WARN', sys: '<188>' },
        { msg: 'sshd[1234]: Failed password for root from 10.0.0.5 port 22 ssh2', level: 'WARN', sys: '<86>' }
    ];

    for(let i=0; i<10; i++) {
        const dev = devices[Math.floor(Math.random() * devices.length)];
        const evt = events[Math.floor(Math.random() * events.length)];
        logs.push({
            id: `sys-${Math.random()}`,
            timestamp: new Date(Date.now() - Math.random() * 10000000),
            level: evt.level as any,
            message: evt.msg,
            deviceId: dev.name,
            rawSyslog: `${evt.sys}${new Date().toISOString()} ${dev.name} ${evt.msg}`
        });
    }
    return logs.sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime());
};

export const generateCloudResources = (): CloudResource[] => [
    { id: 'aws-ec2-1', provider: 'AWS', type: 'EC2', name: 'Web-Server-Prod', region: 'us-east-1', status: 'RUNNING', cost: 45.20, cpuUsage: 12 },
    { id: 'aws-s3-1', provider: 'AWS', type: 'S3', name: 'backup-bucket-assets', region: 'us-east-1', status: 'RUNNING', cost: 12.50, cpuUsage: 0 },
    { id: 'aws-rds-1', provider: 'AWS', type: 'RDS', name: 'main-db-cluster', region: 'us-west-2', status: 'RUNNING', cost: 120.00, cpuUsage: 45 },
    { id: 'az-vm-1', provider: 'AZURE', type: 'VM', name: 'AD-Domain-Controller', region: 'eastus', status: 'RUNNING', cost: 55.00, cpuUsage: 8 },
    { id: 'az-blob-1', provider: 'AZURE', type: 'BLOB', name: 'log-archive', region: 'eastus', status: 'RUNNING', cost: 8.90, cpuUsage: 0 },
];

export const generateAutomationTasks = (): AutomationTask[] => [
    { id: 'task-1', name: 'Backup Core Switches', description: 'SSH into all core switches and save startup-config to TFTP.', scriptType: 'PYTHON', script: 'import netmiko\n# ... backup logic ...', lastRun: new Date('2023-10-25'), status: 'SUCCESS', progress: 100 },
    { id: 'task-2', name: 'Update Edge Firmware', description: 'Batch update firmware for edge access switches.', scriptType: 'ANSIBLE', script: '- name: Upgrade Firmware\n  hosts: edge_switches\n  tasks:\n    - name: Download Image...', lastRun: null, status: 'IDLE', progress: 0 },
    { id: 'task-3', name: 'NTP Configuration Sync', description: 'Ensure all devices are synced to 192.168.1.5.', scriptType: 'PYTHON', script: 'def sync_ntp(device):\n  print("Syncing NTP...")', lastRun: new Date('2023-10-20'), status: 'FAILED', progress: 45 },
];
