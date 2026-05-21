import React, { useState, useEffect } from 'react';
import { AppSettings } from '../types';

interface Props {
  settings: AppSettings;
  onSave: (s: AppSettings) => void;
}

const Settings: React.FC<Props> = ({ settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleChange = (key: keyof AppSettings, value: string) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(localSettings);
    alert('設定已儲存！');
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-cardBg rounded-xl shadow-lg border border-gray-700">
      <h2 className="text-2xl font-bold mb-6 text-twRed">系統設定</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Google Gemini API Key (Required)</label>
          <div className="relative">
            <input
              type={showKey ? "text" : "password"}
              value={localSettings.geminiKey}
              onChange={(e) => handleChange('geminiKey', e.target.value)}
              className="w-full bg-darkBg border border-gray-600 rounded px-4 py-2 focus:outline-none focus:border-twRed transition-colors"
              placeholder="AI Studio API Key"
              required
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-2 text-gray-500 hover:text-gray-300 text-sm"
            >
              {showKey ? "Hide" : "Show"}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">用於執行股票分析與市場掃描。</p>
        </div>

        <div className="border-t border-gray-700 pt-6 mt-6">
            <h3 className="text-lg font-semibold text-white mb-4">LINE Messaging API 設定</h3>
            <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Channel Access Token (Long-lived)</label>
                  <input
                    type="password"
                    value={localSettings.lineChannelToken}
                    onChange={(e) => handleChange('lineChannelToken', e.target.value)}
                    className="w-full bg-darkBg border border-gray-600 rounded px-4 py-2 focus:outline-none focus:border-twRed transition-colors"
                    placeholder="LINE Developers Console > Messaging API > Channel access token"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Your User ID</label>
                  <input
                    type="text"
                    value={localSettings.lineUserId}
                    onChange={(e) => handleChange('lineUserId', e.target.value)}
                    className="w-full bg-darkBg border border-gray-600 rounded px-4 py-2 focus:outline-none focus:border-twRed transition-colors"
                    placeholder="Uxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                      (請填入您的 User ID，以便機器人發送通知給您)
                  </p>
                </div>
            </div>
        </div>

        <div className="border-t border-gray-700 pt-6 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Fugle (富果) API Key</label>
              <input
                type="password"
                value={localSettings.fugleKey}
                onChange={(e) => handleChange('fugleKey', e.target.value)}
                className="w-full bg-darkBg border border-gray-600 rounded px-4 py-2 focus:outline-none focus:border-twRed transition-colors"
                placeholder="Optional for real-time price data"
              />
            </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            className="w-full bg-twRed hover:bg-red-600 text-white font-bold py-3 px-4 rounded transition-all transform hover:scale-[1.02]"
          >
            儲存設定
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;