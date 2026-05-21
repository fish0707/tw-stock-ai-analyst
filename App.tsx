import React, { useState, useEffect } from 'react';
import { AppSettings, Tab } from './types';
import Settings from './components/Settings';
import AnalysisView from './components/AnalysisView';
import Dashboard from './components/Dashboard';
import GasGenerator from './components/GasGenerator';
import MonsterStockFinder from './components/MonsterStockFinder';

// ?è¨­è¨­å?ï¼ˆè??³è¨­å®šé??¢å¡«?¥æ‚¨??API Keyï¼?const DEFAULT_SETTINGS: AppSettings = {
  geminiKey: (import.meta as any).env.VITE_GEMINI_API_KEY || '',
  fugleKey: (import.meta as any).env.VITE_FUGLE_API_KEY || '',
  lineChannelToken: '',
  lineUserId: '',
  sheetId: '',
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.DASHBOARD);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  // Load settings from localStorage on mount, but prioritize defaults if keys are missing
  useEffect(() => {
    const saved = localStorage.getItem('twStockAppSettings');
    if (saved) {
      const parsed = JSON.parse(saved);
      setSettings({
        geminiKey: parsed.geminiKey || DEFAULT_SETTINGS.geminiKey,
        fugleKey: parsed.fugleKey || DEFAULT_SETTINGS.fugleKey,
        lineChannelToken: parsed.lineChannelToken || parsed.lineToken || DEFAULT_SETTINGS.lineChannelToken,
        lineUserId: parsed.lineUserId || DEFAULT_SETTINGS.lineUserId,
        sheetId: parsed.sheetId || DEFAULT_SETTINGS.sheetId,
      });
    }
  }, []);

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('twStockAppSettings', JSON.stringify(newSettings));
    // Do not auto switch tab
  };

  return (
    <div className="min-h-screen bg-darkBg text-gray-100 font-sans pb-10">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-cardBg/90 backdrop-blur-md border-b border-gray-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <span className="text-2xl">??</span>
              <span className="font-bold text-xl tracking-tight text-white hidden md:block">TW Stock <span className="text-twRed">AI</span> Analyst</span>
              <span className="font-bold text-xl tracking-tight text-white md:hidden">TW <span className="text-twRed">AI</span></span>
            </div>
            
            <div className="flex space-x-2 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveTab(Tab.DASHBOARD)}
                className={`px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === Tab.DASHBOARD ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                ??Ž§??              </button>
              <button
                onClick={() => setActiveTab(Tab.ANALYSIS)}
                className={`px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === Tab.ANALYSIS ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                ?‹è‚¡?†æ?
              </button>
              <button
                onClick={() => setActiveTab(Tab.MONSTER_STOCK)}
                className={`px-3 py-2 rounded-md text-sm font-bold whitespace-nowrap transition-colors ${
                  activeTab === Tab.MONSTER_STOCK 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' 
                    : 'text-pink-400 hover:bg-gray-700 hover:text-pink-300'
                }`}
              >
                ?Ž° è³­å?æ©Ÿå™¨(å¦–è‚¡)
              </button>
              <button
                onClick={() => setActiveTab(Tab.AUTOMATION)}
                className={`px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === Tab.AUTOMATION ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                ?ªå???(GAS)
              </button>
              <button
                onClick={() => setActiveTab(Tab.SETTINGS)}
                className={`px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === Tab.SETTINGS ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                è¨­å?
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!settings.geminiKey && activeTab !== Tab.SETTINGS && (
           <div className="bg-yellow-900/50 border-l-4 border-yellow-500 text-yellow-200 p-4 mb-6" role="alert">
              <p className="font-bold">è¨­å??ªå???/p>
              <p>è«‹å?å¾€?Œè¨­å®šã€é??¢è¼¸?¥æ‚¨??Gemini API Key ä»¥å??¨å??å??½ã€?/p>
           </div>
        )}

        {activeTab === Tab.DASHBOARD && <Dashboard settings={settings} />}
        {activeTab === Tab.ANALYSIS && <AnalysisView apiKey={settings.geminiKey} fugleKey={settings.fugleKey} />}
        {activeTab === Tab.MONSTER_STOCK && <MonsterStockFinder settings={settings} />}
        {activeTab === Tab.AUTOMATION && <GasGenerator settings={settings} />}
        {activeTab === Tab.SETTINGS && <Settings settings={settings} onSave={handleSaveSettings} />}
      </main>
    </div>
  );
};

export default App;