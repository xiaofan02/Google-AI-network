
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { TopologyView } from './components/TopologyView';
import { DeviceList } from './components/DeviceList';
import { SecurityAudit } from './components/SecurityAudit';
import { SettingsView } from './components/SettingsView';
import { IPAMView } from './components/IPAMView';
import { ReportsView } from './components/ReportsView';
import { ThreatIntelligence } from './components/ThreatIntelligence';
import { LogAnalysis } from './components/LogAnalysis';
import { AutomationView } from './components/AutomationView';
import { CloudView } from './components/CloudView';
import { InspectionView } from './components/InspectionView';
import { AICopilot } from './components/AICopilot';
import { AppProvider } from './context/AppContext';
import { GoogleGenAI } from "@google/genai";

// Check for API Key at startup
const hasApiKey = !!process.env.API_KEY;

const App: React.FC = () => {
  return (
    <AppProvider>
      <HashRouter>
        <div className="flex h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
           {/* Main Layout Wrapper */}
          <Layout>
            <div className="flex-1 overflow-hidden relative flex flex-col h-full">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/topology" element={<TopologyView />} />
                <Route path="/devices" element={<DeviceList />} />
                <Route path="/ipam" element={<IPAMView />} />
                <Route path="/reports" element={<ReportsView />} />
                <Route path="/security" element={<SecurityAudit />} />
                <Route path="/threats" element={<ThreatIntelligence />} />
                <Route path="/logs" element={<LogAnalysis />} />
                <Route path="/automation" element={<AutomationView />} />
                <Route path="/cloud" element={<CloudView />} />
                <Route path="/inspection" element={<InspectionView />} />
                <Route path="/settings" element={<SettingsView />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              
              {/* AI Copilot Overlay */}
              <AICopilot />
            </div>
          </Layout>
        </div>
      </HashRouter>
    </AppProvider>
  );
};

export default App;
