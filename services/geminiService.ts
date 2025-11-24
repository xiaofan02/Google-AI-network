
import { GoogleGenAI, FunctionDeclaration, Type } from "@google/genai";
import { Device, DeviceStatus, DICTIONARY, Language, AISettings } from "../types";

// --- Tool Definitions ---

const getDeviceListTool: FunctionDeclaration = {
  name: "get_device_list",
  description: "Get a list of all devices in the network with their basic status.",
  parameters: {
    type: Type.OBJECT,
    properties: {},
  }
};

const getDeviceDetailsTool: FunctionDeclaration = {
  name: "get_device_details",
  description: "Get detailed metrics (CPU, Mem, Disk, Interfaces) for a specific device by name or ID. Use this for general health checks.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      identifier: { type: Type.STRING, description: "The name or ID of the device." }
    },
    required: ["identifier"]
  }
};

const getDeviceConfigTool: FunctionDeclaration = {
  name: "get_device_config",
  description: "Retrieve the full raw configuration (startup-config or /etc/config) of a device. Use this when the user asks about specific ports, VLANs, or interface settings (e.g., 'Show me port 24 on Core Switch').",
  parameters: {
    type: Type.OBJECT,
    properties: {
      identifier: { type: Type.STRING, description: "The name or ID of the device." }
    },
    required: ["identifier"]
  }
};

const rebootDeviceTool: FunctionDeclaration = {
  name: "reboot_device",
  description: "Simulate a reboot command for a specific device. Use this when a user asks to restart or reboot.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      identifier: { type: Type.STRING, description: "The name or ID of the device to reboot." }
    },
    required: ["identifier"]
  }
};

const diagnoseIssueTool: FunctionDeclaration = {
  name: "diagnose_network_issue",
  description: "Analyzes the network for critical or warning states and returns a summary of problems.",
  parameters: {
    type: Type.OBJECT,
    properties: {}
  }
};

export const TOOLS = [getDeviceListTool, getDeviceDetailsTool, getDeviceConfigTool, rebootDeviceTool, diagnoseIssueTool];

// --- Service Implementation ---

export class GeminiService {
  
  // Helper to fuzzy find device
  private findDevice(identifier: string, devices: Device[]): Device | undefined {
      const search = identifier.toLowerCase().trim();
      // 1. Exact ID match
      let found = devices.find(d => d.id === search);
      if (found) return found;

      // 2. Name contains match
      found = devices.find(d => d.name.toLowerCase().includes(search));
      if (found) return found;
      
      // 3. Relaxed matching
      const cleanSearch = search.replace(/[^a-z0-9]/g, "");
      found = devices.find(d => d.name.toLowerCase().replace(/[^a-z0-9]/g, "").includes(cleanSearch));
      
      return found;
  }

  private createClient(aiSettings: AISettings): GoogleGenAI | null {
      let apiKey = process.env.API_KEY;
      let config: any = { apiKey };

      if (aiSettings.useCustom) {
          if (aiSettings.apiKey && aiSettings.apiKey.trim() !== '') {
              config.apiKey = aiSettings.apiKey;
          } else {
              return null; // Key missing
          }
          
          if (aiSettings.baseUrl && aiSettings.baseUrl.trim() !== '') {
              // Clean URL: remove trailing slash if present
              let cleanUrl = aiSettings.baseUrl.trim().replace(/\/$/, "");
              if(!cleanUrl.startsWith('http')) cleanUrl = `https://${cleanUrl}`;
              
              // IMPORTANT: For 3rd party proxies using @google/genai, we map rootUrl
              config.rootUrl = cleanUrl;
          }
      }

      if (!config.apiKey) return null;

      try {
          return new GoogleGenAI(config);
      } catch(e) {
          console.error("Failed to initialize AI Client:", e);
          return null;
      }
  }

  async validateConnection(aiSettings: AISettings): Promise<{success: boolean, message: string}> {
      try {
          const ai = this.createClient(aiSettings);
          if (!ai) return { success: false, message: "API Key is missing." };

          const modelName = (aiSettings.useCustom && aiSettings.model) ? aiSettings.model : 'gemini-2.5-flash';
          
          // Simple probe
          const result = await ai.models.generateContent({
              model: modelName,
              contents: "Hi"
          });
          
          if (result) {
              return { success: true, message: "Connected successfully." };
          }
          return { success: false, message: "No response from server." };

      } catch (error: any) {
          return { success: false, message: error.message || "Connection failed." };
      }
  }

  async sendMessage(
    history: any[], 
    message: string, 
    appContextData: { devices: Device[], addLog: Function, toggleDeviceStatus: Function, language: string, aiSettings: AISettings }
  ): Promise<string> {
    
    const { devices, addLog, toggleDeviceStatus, language, aiSettings } = appContextData;
    const t = DICTIONARY[language as Language];

    const ai = this.createClient(aiSettings);
    
    if (!ai) {
        return t.apiKeyMissing;
    }

    const modelsToTry: string[] = [];
    if (aiSettings.useCustom && aiSettings.model) {
        modelsToTry.push(aiSettings.model);
    } else {
        modelsToTry.push("gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash");
    }

    // Create a concise list of available devices
    const deviceContext = devices.map(d => `${d.name} (${d.vendor}) ID: ${d.id}`).join(", ");
    
    let lastError: any = null;

    for (const modelName of modelsToTry) {
        try {
            const chat = ai.chats.create({
                model: modelName,
                history: history,
                config: {
                    systemInstruction: `You are NetGuardian AI, a Network Operations Center (NOC) expert.
                    
                    CURRENT CONTEXT - AVAILABLE DEVICES:
                    [${deviceContext}]
                    
                    INSTRUCTIONS:
                    1. Always map user descriptions (e.g. "Core Switch", "核心交换机") to the specific IDs provided above.
                    2. If the user writes in Chinese, reply in Chinese.
                    3. If the user writes in English, reply in English.
                    4. Use 'get_device_config' to inspect ports/VLANs.
                    
                    Current User UI Language: ${language}`,
                    tools: [{ functionDeclarations: TOOLS }]
                }
            });

            let result = await chat.sendMessage({ message });
            
            // Handle Tool Calls
            const call = result.functionCalls?.[0];
            if (call) {
                const functionName = call.name;
                const args = call.args;
                let functionResponseData: any = { result: "Unknown function" };

                // Tool Execution Logic...
                if (functionName === "get_device_list") {
                    functionResponseData = { 
                        devices: devices.map(d => ({ name: d.name, ip: d.ip, status: d.status, type: d.type, vendor: d.vendor })) 
                    };
                } else if (functionName === "get_device_details") {
                    const target = this.findDevice(args.identifier as string, devices);
                    if (target) {
                        functionResponseData = { device: target };
                    } else {
                        functionResponseData = { error: `Device '${args.identifier}' not found.` };
                    }
                } else if (functionName === "get_device_config") {
                    const target = this.findDevice(args.identifier as string, devices);
                    if (target) {
                        functionResponseData = { 
                            configContent: target.config || "No configuration file found." 
                        };
                    } else {
                        functionResponseData = { error: `Device '${args.identifier}' not found.` };
                    }
                } else if (functionName === "reboot_device") {
                    const target = this.findDevice(args.identifier as string, devices);
                    if (target) {
                        addLog({ level: 'WARN', message: `AI initiated reboot for ${target.name}`, deviceId: target.id });
                        toggleDeviceStatus(target.id);
                        functionResponseData = { status: "Command sent", message: `Reboot signal sent to ${target.name}.` };
                    } else {
                        functionResponseData = { error: "Device not found" };
                    }
                } else if (functionName === "diagnose_network_issue") {
                    const issues = devices.filter(d => d.status !== DeviceStatus.ONLINE).map(d => ({ name: d.name, status: d.status, issue: d.status === DeviceStatus.CRITICAL ? "High Load / Unresponsive" : "Resource Warning" }));
                    functionResponseData = { issues: issues.length > 0 ? issues : "System Healthy" };
                }

                const toolResponseParts = [{
                    functionResponse: {
                        name: functionName,
                        response: { result: functionResponseData }
                    }
                }];
                
                result = await chat.sendMessage({ message: toolResponseParts });
            }

            return result.text || t.aiThinking;

        } catch (error: any) {
            lastError = error;
            console.warn(`Model ${modelName} failed:`, error.message);
            
            // Stop retrying on auth errors
            if (error.status === 401 || error.status === 403) break;
            // Continue to next model in loop
        }
    }

    console.error("Gemini API Error:", lastError);
    return `${t.aiCommError} (${lastError?.message || 'Unknown Error'})`;
  }
}

export const geminiService = new GeminiService();
