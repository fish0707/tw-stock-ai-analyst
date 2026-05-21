import React, { useState } from 'react';
import { AppSettings, MonsterStock } from '../types';
import { findMonsterStocks } from '../services/geminiService';

interface Props {
  settings: AppSettings;
}

const MonsterStockFinder: React.FC<Props> = ({ settings }) => {
  const [market, setMarket] = useState('台股');
  const [marketCapLimit, setMarketCapLimit] = useState('優先尋找市值在 50 億至 200 億台幣之間的中小型股');
  const [sectorFocus, setSectorFocus] = useState('');
  const [exclusion, setExclusion] = useState('排除掉已經漲超過 2 倍的熱門股，我要的是還在底部、市場還沒發現的標的。');
  
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [results, setResults] = useState<MonsterStock[]>([]);
  const [error, setError] = useState('');

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  };

  const handleSearch = async () => {
    if (!settings.geminiKey) {
      setError('請先設定 Gemini API Key');
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);
    setLogs([]);
    addLog(`開始尋找【${market}】妖股...`);

    try {
      const data = await findMonsterStocks(
        settings.geminiKey,
        { market, marketCapLimit, sectorFocus, exclusion },
        addLog
      );
      setResults(data);
      addLog('✅ 掃描完成！');
    } catch (e: any) {
      setError(e.message || '掃描失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 p-6 rounded-xl shadow-lg border border-purple-500/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 blur-sm pointer-events-none">
          <span className="text-9xl">🎰</span>
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <span>🎰</span> 賭博機器 <span className="text-sm font-normal bg-pink-500/20 text-pink-300 px-2 py-1 rounded border border-pink-500/50">捕捉五倍妖股</span>
          </h2>
          <p className="text-gray-300">
            跳脫傳統穩健思維，尋找具備「低基期、產業質變、籌碼乾淨」的潛力轉機股。高風險、高報酬。
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Form */}
        <div className="bg-cardBg p-6 rounded-xl border border-gray-700 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1 ml-1">目標市場</label>
            <select 
              value={market}
              onChange={(e) => setMarket(e.target.value)}
              className="w-full bg-darkBg border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
            >
              <option value="台股">台股</option>
              <option value="美股">美股</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1 ml-1">限制市值 (選填)</label>
            <input
              type="text"
              value={marketCapLimit}
              onChange={(e) => setMarketCapLimit(e.target.value)}
              placeholder="例如：50至200億台幣"
              className="w-full bg-darkBg border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1 ml-1">鎖定族群 (選填)</label>
            <input
              type="text"
              value={sectorFocus}
              onChange={(e) => setSectorFocus(e.target.value)}
              placeholder="例如：CPO矽光子、核能、綠電"
              className="w-full bg-darkBg border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1 ml-1">排斥名單 (選填)</label>
            <textarea
              value={exclusion}
              onChange={(e) => setExclusion(e.target.value)}
              rows={3}
              placeholder="例如：排除已經漲超過兩倍的股票"
              className="w-full bg-darkBg border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 text-sm"
            />
          </div>

          <button
            onClick={handleSearch}
            disabled={loading}
            className={`w-full py-4 mt-2 rounded-lg font-bold text-white text-lg transition-all ${
              loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-[1.02] shadow-lg hover:shadow-purple-900/50'
            }`}
          >
            {loading ? '尋找妖股中...' : '啟動妖股雷達 ⚡'}
          </button>

          {error && <div className="text-red-400 mt-2 text-sm">{error}</div>}

           {/* Logs Panel integrated in sidebar */}
           <div className="mt-6 border-t border-gray-700 pt-4">
            <h3 className="text-sm font-bold text-gray-400 mb-2">系統日誌</h3>
            <div className="bg-darkBg rounded border border-gray-800 p-2 h-40 overflow-y-auto font-mono text-xs text-purple-300 space-y-1">
               {logs.length === 0 ? <span className="text-gray-600">等待執行...</span> : 
                 logs.map((log, i) => <div key={i} className="border-b border-gray-800/50 pb-1 last:border-0">{log}</div>)}
            </div>
          </div>
        </div>

        {/* Results Area */}
        <div className="lg:col-span-2 space-y-6">
          {(!results || results.length === 0) && !loading && (
             <div className="h-full flex items-center justify-center border border-dashed border-gray-700 rounded-xl bg-cardBg/50 min-h-[400px]">
                <p className="text-gray-500">設定條件後，點擊「啟動妖股雷達」開始掃描</p>
             </div>
          )}

          {results.map((stock, idx) => (
            <div key={idx} className="bg-cardBg p-6 rounded-xl border border-gray-700 hover:border-pink-500/50 transition-colors shadow-lg">
               <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                 <span className="text-pink-500">🔥</span> {stock.symbolAndName}
               </h3>
               
               <div className="space-y-4">
                 <div className="bg-darkBg p-4 rounded border border-gray-800">
                   <h4 className="text-sm font-bold text-purple-400 mb-1">妖股啟動點</h4>
                   <p className="text-gray-300 text-sm leading-relaxed">{stock.startingPoint}</p>
                 </div>
                 
                 <div className="bg-darkBg p-4 rounded border border-gray-800">
                   <h4 className="text-sm font-bold text-blue-400 mb-1">核心質變邏輯</h4>
                   <p className="text-gray-300 text-sm leading-relaxed">{stock.coreLogic}</p>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-darkBg p-4 rounded border border-gray-800">
                      <h4 className="text-sm font-bold text-orange-400 mb-1">籌碼診斷</h4>
                      <p className="text-gray-300 text-sm leading-relaxed">{stock.chipDiagnostics}</p>
                    </div>
                    
                    <div className="bg-darkBg p-4 rounded border border-gray-800 border-l-2 border-l-green-500">
                      <h4 className="text-sm font-bold text-green-400 mb-1">想像力空間 (Target)</h4>
                      <p className="text-gray-300 text-sm leading-relaxed">{stock.imaginationSpace}</p>
                    </div>
                 </div>

                 <div className="bg-red-900/10 p-4 rounded border border-red-900/30">
                   <h4 className="text-sm font-bold text-red-400 mb-1 flex items-center gap-1"><span className="text-lg">⚠️</span> 風險警告</h4>
                   <p className="text-red-300/80 text-sm leading-relaxed">{stock.riskWarning}</p>
                 </div>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MonsterStockFinder;
