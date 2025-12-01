
import { GoogleGenAI, FunctionDeclaration, Type } from "@google/genai";
import { Device, DeviceStatus, DICTIONARY, Language, AISettings, AgentThought, AIAnalysisResult, Vendor, DeviceType, DetailedReportData, InspectionItem } from "../types";

// --- MCP TOOL REGISTRY ---
interface AppContextData {
    devices: Device[];
    addLog: Function;
    toggleDeviceStatus: Function;
    language: string;
    aiSettings: AISettings;
    subnets: any[];
    logs: any[];
    vulnerabilities: any[];
}

const MCP_TOOLS_DEF = [
    {
        name: "find_device",
        description: "Find a device ID by fuzzy searching name or IP.",
        parameters: { type: Type.OBJECT, properties: { search_term: { type: Type.STRING } }, required: ["search_term"] }
    },
    {
        name: "execute_cli_command",
        description: "Execute a raw CLI command on a network device via SSH. Use this for ANY operational command (show, display, ping, etc.).",
        parameters: { 
            type: Type.OBJECT, 
            properties: { 
                device_id: { type: Type.STRING },
                command: { type: Type.STRING, description: "The specific vendor command (e.g. 'show ip int br', 'display version'). Translate natural language to this." }
            }, 
            required: ["device_id", "command"] 
        }
    },
    {
        name: "get_device_logs",
        description: "Fetch recent logs for a specific device.",
        parameters: { type: Type.OBJECT, properties: { device_name: { type: Type.STRING } }, required: ["device_name"] }
    },
    {
        name: "scan_subnet",
        description: "Simulate a scan on a specific subnet CIDR.",
        parameters: { type: Type.OBJECT, properties: { cidr: { type: Type.STRING } }, required: ["cidr"] }
    },
    {
        name: "reboot_device",
        description: "Reboot a device by ID.",
        parameters: { type: Type.OBJECT, properties: { device_id: { type: Type.STRING } }, required: ["device_id"] }
    },
    {
        name: "check_vulnerabilities",
        description: "List open vulnerabilities for a device.",
        parameters: { type: Type.OBJECT, properties: { device_id: { type: Type.STRING } }, required: ["device_id"] }
    }
];

export class GeminiService {
  
  // --- Simulated CLI Output Engine (Mocking Netmiko) ---
  private simulateCliOutput(device: Device, command: string): string {
      const cmd = command.toLowerCase().trim();
      const hostname = device.name;
      // Vendor prompt styles
      let prompt = `${hostname}#`;
      if (device.vendor === Vendor.HUAWEI) prompt = `<${hostname}>`;
      if (device.vendor === Vendor.JUNIPER) prompt = `root@${hostname}>`;
      if (device.type === DeviceType.ESXI || device.os.includes('Linux')) prompt = `root@${hostname}:~#`;

      const timestamp = new Date().toISOString();
      let output = "";

      // 1. Version / System Info
      if (cmd.includes('ver') || cmd.includes('uname')) {
          if (device.vendor === Vendor.CISCO) {
              output = `Cisco IOS XE Software, Version ${device.os}\nCopyright (c) 1986-2023 by Cisco Systems, Inc.\nCompiled ${timestamp} by mcpre\n\n${hostname} uptime is ${Math.floor(device.uptime / 3600)} hours, ${Math.floor((device.uptime % 3600) / 60)} minutes\nSystem image file is "bootflash:packages.conf"`;
          } else if (device.vendor === Vendor.HUAWEI) {
              output = `Huawei Versatile Routing Platform Software\nVRP (R) software, Version ${device.os}\nCopyright (C) 2000-2023 Huawei Technologies Co., Ltd.\n${hostname} uptime is 3 weeks, 2 days`;
          } else if (device.vendor === Vendor.JUNIPER) {
              output = `Hostname: ${hostname}\nModel: srx300\nJunos: ${device.os}\nKERNEL 64-bit  ${timestamp}`;
          } else {
              output = `Linux ${hostname} 5.15.0-76-generic #83-Ubuntu SMP ${timestamp} x86_64 x86_64 x86_64 GNU/Linux`;
          }
      } 
      // 2. Configuration
      else if (cmd.includes('run') || cmd.includes('curr') || cmd.includes('configuration') || cmd.includes('cat /etc')) {
          output = device.config || "! No configuration found";
      } 
      // 3. Interfaces
      else if (cmd.includes('int') || cmd.includes('brief') || cmd.includes('terse') || cmd.includes('ip addr')) {
          if (device.vendor === Vendor.CISCO) {
              output = `Interface              IP-Address      OK? Method Status                Protocol\n`;
              device.interfaces.forEach(iface => {
                  output += `${iface.name.padEnd(22)} ${iface.ip.padEnd(15)} YES manual ${iface.status.toLowerCase().padEnd(21)} ${iface.status.toLowerCase()}\n`;
              });
          } else if (device.vendor === Vendor.HUAWEI) {
              output = `Interface                   IP Address/Mask      Physical   Protocol  \n`;
              device.interfaces.forEach(iface => {
                  output += `${iface.name.padEnd(27)} ${iface.ip.padEnd(20)} ${iface.status.padEnd(10)} ${iface.status}\n`;
              });
          } else {
              output = `1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN\n    inet 127.0.0.1/8 scope host lo\n2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 state UP\n    inet ${device.ip}/24 brd 192.168.1.255 scope global eth0`;
          }
      } 
      // 4. ARP / Neighbors
      else if (cmd.includes('arp') || cmd.includes('neighbor') || cmd.includes('mac')) {
          if (device.vendor === Vendor.CISCO) {
              output = `Protocol  Address          Age (min)  Hardware Addr   Type   Interface\nInternet  192.168.1.1             -   0000.0c9f.f001  ARPA   Vlan1\nInternet  192.168.1.50           12   0050.56bf.2312  ARPA   Vlan1`;
          } else {
              output = `IP ADDRESS      MAC ADDRESS     EXPIRE(M) TYPE INTERFACE      VPN-INSTANCE\n192.168.1.1     0000-0c9f-f001            S--  Vlanif1\n192.168.1.50    0050-56bf-2312  12        D-0  Vlanif1`;
          }
      }
      // 5. VLANs
      else if (cmd.includes('vlan')) {
          output = `VLAN Name                             Status    Ports\n---- -------------------------------- --------- -------------------------------\n1    default                          active    Gi0/1, Gi0/2\n10   Sales                            active    Gi0/3, Gi0/4\n20   Engineering                      active    Gi0/5\n100  Management                       active    Gi0/24`;
      }
      // 6. Ping
      else if (cmd.startsWith('ping')) {
          const target = cmd.split(' ').pop() || '8.8.8.8';
          output = `Type escape sequence to abort.\nSending 5, 100-byte ICMP Echos to ${target}, timeout is 2 seconds:\n!!!!!\nSuccess rate is 100 percent (5/5), round-trip min/avg/max = 1/2/4 ms`;
      }
      // 7. Generic Fallback
      else {
          if (device.vendor === Vendor.CISCO) output = `% Invalid input detected at '^' marker.`;
          else if (device.vendor === Vendor.HUAWEI) output = `Error: Unrecognized command found at '^' position.`;
          else output = `bash: ${cmd.split(' ')[0]}: command not found`;
      }

      return `${prompt} ${command}\n${output}\n${prompt}`;
  }

  // --- Tool Implementations ---
  private executeTool(name: string, args: any, context: AppContextData): string {
      const { devices, subnets, logs, vulnerabilities, toggleDeviceStatus } = context;

      switch(name) {
          case "find_device":
              const search = (args.search_term || "").toLowerCase();
              const found = devices.find(d => 
                  d.name.toLowerCase().includes(search) || 
                  d.ip.includes(search) || 
                  d.id === search
              );
              if (found) {
                  return JSON.stringify({ 
                      id: found.id, 
                      name: found.name, 
                      ip: found.ip, 
                      vendor: found.vendor, 
                      type: found.type,
                      status: found.status 
                  });
              }
              return "Device not found. Ask user for correct name.";

          case "execute_cli_command":
              const devCli = devices.find(x => x.id === args.device_id);
              if (!devCli) return "Device ID not found.";
              
              context.addLog({ level: 'INFO', message: `[Agent] Executing '${args.command}' on ${devCli.name} (${devCli.ip})`, deviceId: devCli.id });
              
              return this.simulateCliOutput(devCli, args.command);

          case "get_device_logs":
              const devLogs = logs.filter(l => l.deviceId && l.deviceId.toLowerCase().includes(args.device_name.toLowerCase())).slice(0, 5);
              return devLogs.length ? JSON.stringify(devLogs.map(l => l.message)) : "No recent logs found.";

          case "scan_subnet":
              const sub = subnets.find(s => s.cidr === args.cidr);
              return sub ? `Scanned ${args.cidr}. Usage: ${sub.usage}%. Devices found: ${sub.usedIps}` : "Subnet not found in IPAM.";

          case "reboot_device":
              toggleDeviceStatus(args.device_id);
              return `Reboot signal sent to ${args.device_id}.`;

          case "check_vulnerabilities":
               const vulns = vulnerabilities.filter(v => v.deviceId === args.device_id && v.status === 'OPEN');
               return vulns.length ? JSON.stringify(vulns.map(v => `${v.severity}: ${v.description}`)) : "No open vulnerabilities.";

          default:
              return "Tool not found.";
      }
  }

  // --- Helper to build robust URLs for Custom Proxies ---
  private constructUrl(baseUrl: string, model: string, apiKey: string): string {
      let cleanBase = baseUrl.trim().replace(/\/+$/, '');
      if(!cleanBase.startsWith('http')) cleanBase = `https://${cleanBase}`;

      // Scenario 1: User pasted the full endpoint URL (e.g. from Google AI Studio)
      if (cleanBase.includes('/models/') || cleanBase.includes(':generateContent')) {
          const separator = cleanBase.includes('?') ? '&' : '?';
          return `${cleanBase}${separator}key=${apiKey}`;
      }

      // Scenario 2: User pasted a base URL ending in /v1 or /v1beta (e.g. https://api.siliconflow.cn/v1)
      if (cleanBase.endsWith('/v1') || cleanBase.endsWith('/v1beta')) {
           return `${cleanBase}/models/${model}:generateContent?key=${apiKey}`;
      }

      // Scenario 3: User pasted a generic host (e.g. https://api.openai-proxy.com)
      // Default to /v1beta/models/... for compatibility with standard Google style proxies
      return `${cleanBase}/v1beta/models/${model}:generateContent?key=${apiKey}`;
  }

  // --- REST AGENT LOOP (ReAct Pattern) ---
  private async runAgentLoop(
      history: any[], 
      userMessage: string, 
      aiSettings: AISettings, 
      context: AppContextData,
      onThought: (thought: AgentThought) => void
  ): Promise<string> {
      
      const model = aiSettings.model || 'gemini-2.5-flash';
      const url = this.constructUrl(aiSettings.baseUrl || 'https://generativelanguage.googleapis.com', model, aiSettings.apiKey);

      const toolsJson = JSON.stringify(MCP_TOOLS_DEF);
      const systemInstruction = `You are NetGuardian Agent, an advanced Network Automation Engineer.
      
      YOUR CAPABILITIES:
      You have access to tools to interact with the network.
      TOOLS: ${toolsJson}

      CORE WORKFLOW (Follow this strict logic):
      1. **ANALYZE**: Understand the user's intent. (e.g. "Show ARP table on Core Switch")
      2. **LOCATE**: If you don't have the Device ID/Vendor, use 'find_device' first.
      3. **TRANSLATE**: Convert the natural language intent into the SPECIFIC VENDOR CLI COMMAND.
      4. **EXECUTE**: Use 'execute_cli_command' with the ID and the TRANSLATED command.
      5. **REPORT**: Present the raw output to the user clearly.

      PROTOCOL:
      - To use a tool, output JSON ONLY: { "tool": "tool_name", "args": { ... } }
      - Do not add markdown around the JSON.
      - I will execute the tool and give you the RESULT.
      - If you have the final answer, just speak normally.
      
      Current User Language: ${context.language === 'cn' ? 'Chinese' : 'English'}.
      `;

      let currentHistory = [
          ...history,
          { role: 'user', parts: [{ text: `SYSTEM_INSTRUCTION: ${systemInstruction}\nUSER_QUERY: ${userMessage}` }] }
      ];
      
      const MAX_TURNS = 8;
      let turn = 0;

      while (turn < MAX_TURNS) {
          turn++;
          
          try {
              const response = await fetch(url, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      contents: currentHistory,
                      generationConfig: { temperature: 0.1 } 
                  })
              });

              if (!response.ok) {
                  const errText = await response.text();
                  throw new Error(`HTTP ${response.status}: ${errText}`);
              }
              
              const data = await response.json();
              const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

              let toolCall = null;
              try {
                  const cleaned = text.trim().replace(/```json/g, '').replace(/```/g, '');
                  const jsonStart = cleaned.indexOf('{');
                  const jsonEnd = cleaned.lastIndexOf('}');
                  if (jsonStart !== -1 && jsonEnd !== -1) {
                      const jsonStr = cleaned.substring(jsonStart, jsonEnd + 1);
                      const parsed = JSON.parse(jsonStr);
                      if (parsed.tool) toolCall = parsed;
                  }
              } catch (e) {
                  // Not JSON
              }

              if (toolCall && toolCall.tool) {
                  onThought({ step: 'executing', tool: toolCall.tool, details: JSON.stringify(toolCall.args) });
                  const result = this.executeTool(toolCall.tool, toolCall.args, context);
                  currentHistory.push({ role: 'model', parts: [{ text: text }] }); 
                  currentHistory.push({ role: 'user', parts: [{ text: `TOOL_OUTPUT: ${result}` }] });
              } else {
                  return text;
              }

          } catch (e: any) {
              return `Agent Error: ${e.message}`;
          }
      }

      return "Agent stopped (max turns reached).";
  }

  // --- PUBLIC API ---
  async sendMessage(
    history: any[], 
    message: string, 
    context: AppContextData,
    onThought?: (thought: AgentThought) => void
  ): Promise<string> {
    const handleThought = onThought || ((t) => console.log(t));
    const effectiveSettings = context.aiSettings.useCustom ? context.aiSettings : {
        useCustom: true,
        apiKey: process.env.API_KEY || "",
        baseUrl: "https://generativelanguage.googleapis.com",
        model: "gemini-2.5-flash"
    };

    if (!effectiveSettings.apiKey) return "API Key missing.";
    return this.runAgentLoop(history, message, effectiveSettings, context, handleThought);
  }

  async generateScript(prompt: string, scriptType: string, aiSettings: AISettings): Promise<string> {
       return this.sendMessage([], `Generate a ${scriptType} script for: ${prompt}. Output code only.`, {} as any);
  }

  async analyzeInspectionData(device: any, aiSettings: AISettings): Promise<string | AIAnalysisResult> {
      // Simplified JSON analysis for dashboard card
      const prompt = `Act as a Network Expert. Analyze: ${JSON.stringify(device)}. Output JSON: { "summary": "...", "score": 80, "issues": [{"severity":"HIGH","finding":"...","recommendation":"...","command":"..."}] }`;
      const response = await this.sendMessage([], prompt, { aiSettings } as any);
      try {
          const cleaned = response.replace(/```json/g, '').replace(/```/g, '').trim();
          return JSON.parse(cleaned.substring(cleaned.indexOf('{'), cleaned.lastIndexOf('}') + 1));
      } catch (e) {
          return { summary: "Analysis failed", score: 50, issues: [] };
      }
  }
  
  async analyzeConfigDiff(diff: string, aiSettings: AISettings): Promise<string> {
      return this.sendMessage([], `Analyze diff: ${diff}`, { aiSettings } as any);
  }

  // --- REPORT GENERATION (Professional Template) ---
  async generateDetailedReport(
      devices: Device[], 
      results: InspectionItem[], 
      aiSettings: AISettings
  ): Promise<DetailedReportData> {
      const coreDevice = devices.find(d => d.role === 'CORE') || devices[0];
      const failedItems = results.filter(r => r.status === 'FAIL');
      const failedChecks = failedItems.length;
      
      // Serialize failures for AI Context
      const failureContext = failedItems.map(f => `- ${f.checkType}: ${f.message}`).join('\n');
      
      const prompt = `
      You are a Senior Network Consultant generating a Formal Inspection Report for: ${coreDevice.name}.
      
      DATA:
      - OS: ${coreDevice.os}
      - Total Ports: 26
      - Active Ports: ${coreDevice.interfaces.length}
      - CPU Load: ${coreDevice.cpuUsage}%
      - Mem Load: ${coreDevice.memUsage}%
      - Failed Checks Count: ${failedChecks}
      
      SPECIFIC FAILURES DETECTED (Address these in Findings and Actions):
      ${failureContext || "None. System is healthy."}
      
      Generate a JSON object strictly matching this structure for a professional report:
      {
        "coreFindings": [
           "Switch overall status is [Normal/Critical]...",
           "Specific findings based on the failures listed above..."
        ],
        "suggestions": [
           "Specific remediation strategy for the failures...",
           "General best practices..."
        ],
        "actions": [
           "Exact action item to fix failures...",
           "Action item 2..."
        ]
      }
      
      TONE: Professional, succinct, expert. Use bullet points style text.
      `;

      try {
          const response = await this.sendMessage([], prompt, { aiSettings } as any);
          const cleaned = response.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleaned.substring(cleaned.indexOf('{'), cleaned.lastIndexOf('}') + 1));

          return {
              summary: {
                  deviceModel: 'Cisco Catalyst 9300',
                  osVersion: coreDevice.os,
                  totalInterfaces: 26,
                  upInterfaces: coreDevice.interfaces.filter(i => i.status === 'UP').length || 1,
                  overallStatus: coreDevice.status,
                  cpuTrend: [Math.max(0, Math.floor(coreDevice.cpuUsage - 5)), Math.floor(coreDevice.cpuUsage), Math.max(0, Math.floor(coreDevice.cpuUsage + 2))],
                  memUsage: Math.floor(coreDevice.memUsage),
                  errorLogs: failedChecks
              },
              coreFindings: parsed.coreFindings || ["System analysis complete."],
              suggestions: parsed.suggestions || ["Regular maintenance recommended."],
              actions: parsed.actions || ["Verify log files."],
              generatedAt: new Date().toLocaleString()
          };
      } catch (e) {
          return {
              summary: {
                  deviceModel: 'Cisco Catalyst 9300',
                  osVersion: coreDevice.os,
                  totalInterfaces: 26,
                  upInterfaces: 1,
                  overallStatus: 'NORMAL',
                  cpuTrend: [5, 5, 5],
                  memUsage: 45,
                  errorLogs: 0
              },
              coreFindings: ["Device is reachable.", "Basic configuration valid."],
              suggestions: ["Enable detailed logging."],
              actions: ["Monitor uplink status."],
              generatedAt: new Date().toLocaleString()
          };
      }
  }

  async validateConnection(aiSettings: AISettings): Promise<{success: boolean, message: string}> {
      try {
          const model = aiSettings.model || 'gemini-2.5-flash';
          const url = this.constructUrl(aiSettings.baseUrl || 'https://generativelanguage.googleapis.com', model, aiSettings.apiKey);
          const response = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contents: [{ parts: [{ text: "ping" }] }], generationConfig: { maxOutputTokens: 1 } })
          });
          if (!response.ok) throw new Error(`${response.status}`);
          return { success: true, message: "OK" };
      } catch (e: any) {
          return { success: false, message: e.message };
      }
  }
}

export const geminiService = new GeminiService();
