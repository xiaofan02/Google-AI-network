
import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Sparkles, Bot } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { useApp } from '../context/AppContext';
import { DICTIONARY } from '../types';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export const AICopilot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { devices, addLog, toggleDeviceStatus, language, aiSettings, copilotTrigger, clearCopilotTrigger } = useApp();
  const t = DICTIONARY[language];
  
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: language === 'cn' ? DICTIONARY.cn.aiWelcome : DICTIONARY.en.aiWelcome }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Handle external triggers (e.g. from Security Audit or Logs)
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

    try {
      // Transform messages for history
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const responseText = await geminiService.sendMessage(
        history, 
        userMsg.text,
        { devices, addLog, toggleDeviceStatus, language, aiSettings }
      );

      const botMsg: Message = { role: 'model', text: responseText };
      setMessages(prev => [...prev, botMsg]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', text: t.aiCommError || "Sorry, something went wrong." }]);
    } finally {
      setIsTyping(false);
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
        className="fixed bottom-6 right-6 h-14 w-14 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg shadow-blue-900/50 flex items-center justify-center transition-transform hover:scale-110 z-50"
      >
        <Sparkles size={24} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
      {/* Header */}
      <div className="bg-slate-800/80 backdrop-blur p-4 flex justify-between items-center border-b border-slate-700">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">{t.copilotTitle}</h3>
            <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-xs text-slate-400">{t.online}</span>
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
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-800 rounded-2xl rounded-bl-none px-4 py-3 border border-slate-700 flex items-center gap-1">
              <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-75"></span>
              <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-150"></span>
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
            className="absolute right-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-[10px] text-slate-500 mt-2 text-center">
            {t.aiDisclaimer}
        </p>
      </div>
    </div>
  );
};
