
import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Sparkles, Bot, Terminal, Loader2, ChevronRight } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { useApp } from '../context/AppContext';
import { DICTIONARY, AgentThought } from '../types';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export const AICopilot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { devices, addLog, toggleDeviceStatus, language, aiSettings, copilotTrigger, clearCopilotTrigger, subnets, logs, vulnerabilities } = useApp();
  const t = DICTIONARY[language];
  
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: language === 'cn' ? DICTIONARY.cn.aiWelcome : DICTIONARY.en.aiWelcome }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [agentThought, setAgentThought] = useState<AgentThought | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, agentThought]);

  useEffect(() => {
      if (copilotTrigger) {
          setIsOpen(true);
          handleSend(copilotTrigger);
          clearCopilotTrigger();
      }
  }, [copilotTrigger]);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || inputValue;
    if (!textToSend.trim()) return;

    const userMsg: Message = { role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);
    setAgentThought(null);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      // Pass context data for tools
      const appContext = { devices, addLog, toggleDeviceStatus, language, aiSettings, subnets, logs, vulnerabilities };

      const responseText = await geminiService.sendMessage(
        history, 
        userMsg.text,
        appContext,
        (thought) => setAgentThought(thought) // Callback for thoughts
      );

      const botMsg: Message = { role: 'model', text: responseText };
      setMessages(prev => [...prev, botMsg]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', text: t.aiCommError }]);
    } finally {
      setIsTyping(false);
      setAgentThought(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-full shadow-lg shadow-blue-900/50 flex items-center justify-center transition-transform hover:scale-110 z-50 group"
      >
        <Sparkles size={24} className="group-hover:animate-spin-slow" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
      {/* Header */}
      <div className="bg-slate-800/80 backdrop-blur p-4 flex justify-between items-center border-b border-slate-700">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-1.5 rounded-lg">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">{t.copilotTitle}</h3>
            <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-xs text-slate-400 font-mono">MCP ACTIVE</span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-700"
        >
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900 scrollbar-thin scrollbar-thumb-slate-700">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-md ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}

        {/* Agent Thought / Tool Execution Visualization */}
        {(isTyping || agentThought) && (
          <div className="flex justify-start w-full">
            <div className="max-w-[90%] bg-slate-900/50 border border-slate-700 border-dashed rounded-xl p-3 text-xs font-mono text-slate-400 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-blue-400 font-bold uppercase tracking-wider">
                    <Loader2 size={12} className="animate-spin" />
                    {t.agentReasoning}
                </div>
                {agentThought ? (
                     <div className="animate-in fade-in slide-in-from-left-2">
                         <div className="flex items-center gap-1 text-slate-300">
                             <ChevronRight size={12} /> {agentThought.step}...
                         </div>
                         <div className="pl-4 text-slate-500 truncate">
                             Tool: {agentThought.tool}
                         </div>
                         <div className="pl-4 text-slate-600 truncate">
                             Params: {agentThought.details}
                         </div>
                     </div>
                ) : (
                    <span className="text-slate-500 italic">Thinking...</span>
                )}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-slate-900 border-t border-slate-800">
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={t.askAI}
            className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-500"
          />
          <button 
            onClick={() => handleSend()}
            disabled={!inputValue.trim() || isTyping}
            className="absolute right-2 p-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-[10px] text-slate-500 mt-2 text-center flex items-center justify-center gap-1">
            <Terminal size={10} /> {t.aiDisclaimer}
        </p>
      </div>
    </div>
  );
};
