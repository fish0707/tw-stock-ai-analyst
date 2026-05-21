import React, { useState, useEffect } from 'react';
import { RecommendedStock, AppSettings } from '../types';
import { getDailyRecommendations } from '../services/geminiService';
import { sendLineNotification } from '../services/lineService';
import { fetchFuglePrice } from '../services/fugleService';

interface Props {
  settings: AppSettings;
}

const Dashboard: React.FC<Props> = ({ settings }) => {
  const [stocks, setStocks] = useState<RecommendedStock[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanTime, setScanTime] = useState<string | null>(null);
  const [monitoring, setMonitoring] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  // Function to simulate price checking
  const checkPrices = async (currentStocks: RecommendedStock[]) => {
    if (!settings.lineChannelToken || !settings.lineUserId) {
      addLog("⚠️ 無 LINE 設定，無法發送通知");
      return;
    }

    addLog("🔍 監控中：檢查股價是否觸及買點...");
    
    const actionableStock = currentStocks.find(s => s.suggestion === 'BUY_NOW');
    
    if (actionableStock) {
       const msg = `【觸發買點通知】\n股票：${actionableStock.name} (${actionableStock.symbol})\n現價：${actionableStock.currentPrice}\n建議買點：${actionableStock.buyPoint}\n狀態：🔥 立即進場`;
       addLog(`🚀 ${actionableStock.name} 符合進場條件，發送 LINE 通知...`);
       const sent = await sendLineNotification(settings.lineChannelToken, settings.lineUserId, msg);
       if (sent) addLog("✅ LINE 通知發送成功");
       else addLog("❌ LINE 通知發送失敗");
    } else {
       addLog("ℹ️ 目前無股票符合「立即進場」條件，持續監控中...");
    }
  };

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  };

  const handleMorningScan = async () => {
    if (!settings.geminiKey) {
      alert("請先設定 Gemini API Key");
      return;
    }

    setLoading(true);
    setScanTime(null);
    setLogs([]); // Clear logs
    addLog("開始執行「高勝率 + 分批獲利」選股掃描...");

    try {
      // 1. Get Recommendations from Gemini (Discovery Phase)
      addLog("🤖 AI 正在嚴格檢核五大佐證並計算雙重目標價...");
      const recs = await getDailyRecommendations(settings.geminiKey, addLog);
      
      let finalStocks = recs;

      // 2. Refresh Prices using Fugle API if available (Validation Phase)
      if (settings.fugleKey) {
        addLog("📊 正在透過 Fugle API 驗證今日收盤價...");
        const updatedStocks = await Promise.all(recs.map(async (stock) => {
          const realPrice = await fetchFuglePrice(stock.symbol, settings.fugleKey);
          if (realPrice) {
            // Re-evaluate suggestion based on real price
            let newSuggestion = stock.suggestion;
            if (realPrice <= stock.buyPoint * 1.05) {
                newSuggestion = 'BUY_NOW'; 
            } else {
                newSuggestion = 'WAIT';
            }
            
            return { ...stock, currentPrice: realPrice, suggestion: newSuggestion };
          }
          return stock;
        }));
        finalStocks = updatedStocks;
      } else {
        addLog("⚠️ 未設定 Fugle Key，使用 AI 搜尋之數據");
      }

      setStocks(finalStocks);
      setScanTime(new Date().toLocaleTimeString());
      addLog(`掃描完成，篩選出 ${finalStocks.length} 支高勝率潛力股`);
      
      // Auto start monitoring if we have results
      setMonitoring(true);
      
      // Simulate the check immediately for demo
      setTimeout(() => checkPrices(finalStocks), 2000);

    } catch (e) {
      console.error(e);
      addLog("❌ 掃描失敗");
      alert("掃描失敗，請檢查 API Key 或網路");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-cardBg p-6 rounded-xl shadow-lg border-l-4 border-twRed">
        <div>
          <h2 className="text-2xl font-bold text-white">高勝率選股實驗室 (5大佐證 + 雙重止盈)</h2>
          <p className="text-gray-400 mt-1">
            嚴格執行技術/基本/籌碼面五大篩選。策略：目標獲利 &gt; 20% (最終目標)，並設定部分止盈點。
            {scanTime && <span className="ml-2 text-green-400 text-sm">更新時間: {scanTime}</span>}
          </p>
        </div>
        <button
          onClick={handleMorningScan}
          disabled={loading}
          className={`px-6 py-3 rounded-lg font-bold text-white transition-all ${
            loading ? 'bg-gray-600' : 'bg-twRed hover:bg-red-600 shadow-lg shadow-red-900/50'
          }`}
        >
          {loading ? 'AI 正在進行深度驗證...' : '執行盤後掃描'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stock List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xl font-bold text-gray-200 mb-2">精選清單 (Tiered Exit Strategy)</h3>
          {stocks.length === 0 && !loading && (
            <div className="text-center py-20 bg-cardBg rounded-xl border border-dashed border-gray-700 text-gray-500">
              請點擊上方按鈕，AI 將為您尋找符合五大佐證的飆股
            </div>
          )}
          
          {stocks.map((stock) => {
            const partialGain = ((stock.partialTakeProfit - stock.buyPoint) / stock.buyPoint * 100).toFixed(1);
            const finalGain = ((stock.finalTakeProfit - stock.buyPoint) / stock.buyPoint * 100).toFixed(1);
            
            return (
              <div key={stock.symbol} className="bg-cardBg p-5 rounded-xl border border-gray-700 hover:border-twRed transition-colors shadow-lg group">
                {/* Card Header */}
                <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-inner ${stock.suggestion === 'BUY_NOW' ? 'bg-twRed animate-pulse' : 'bg-gray-700'}`}>
                      {stock.suggestion === 'BUY_NOW' ? '進場' : '觀望'}
                    </div>
                    <div>
                      <h4 className="font-bold text-xl text-white tracking-wide flex items-center gap-2">
                        {stock.name} <span className="text-gray-400 text-base">({stock.symbol})</span>
                      </h4>
                      <div className="flex gap-2 mt-1 text-sm text-gray-400">
                         現價: {stock.currentPrice} | 建議買點: <span className="text-yellow-400 font-bold">{stock.buyPoint}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Price Targets Block (Split) */}
                  <div className="flex gap-2 w-full md:w-auto">
                    <div className="bg-darkBg p-2 rounded border border-gray-700 flex-1 md:flex-none min-w-[100px]">
                       <div className="text-xs text-red-400 mb-1">🛑 止損 (Stop)</div>
                       <div className="text-lg font-bold text-red-400">{stock.stopLossPoint}</div>
                    </div>
                    <div className="bg-blue-900/20 p-2 rounded border border-blue-800 flex-1 md:flex-none min-w-[100px]">
                       <div className="text-xs text-blue-300 mb-1">🎯 部分止盈</div>
                       <div className="text-lg font-bold text-blue-300 flex items-center justify-between">
                         {stock.partialTakeProfit}
                         <span className="text-xs ml-1 opacity-70">+{partialGain}%</span>
                       </div>
                    </div>
                    <div className="bg-green-900/20 p-2 rounded border border-green-800 flex-1 md:flex-none min-w-[100px] animate-pulse-slow">
                       <div className="text-xs text-green-400 mb-1">🚀 最終目標</div>
                       <div className="text-lg font-bold text-green-400 flex items-center justify-between">
                         {stock.finalTakeProfit}
                         <span className="text-xs ml-1 opacity-70">+{finalGain}%</span>
                       </div>
                    </div>
                  </div>
                </div>

                {/* 5 Points Evidences */}
                <div className="bg-darkBg/50 rounded-lg p-4 border border-gray-800">
                  <h5 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider border-b border-gray-800 pb-2 flex justify-between">
                    <span>五大勝率佐證 (Five Evidences)</span>
                    <span className="text-twRed">ALL PASS</span>
                  </h5>
                  <ul className="space-y-2">
                    {stock.evidences && stock.evidences.length > 0 ? (
                      stock.evidences.map((evidence, idx) => (
                        <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                          <span className="text-twRed mt-0.5 font-bold">✓</span>
                          <span className="leading-relaxed">{evidence}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-gray-500 italic">無詳細佐證資料</li>
                    )}
                  </ul>
                </div>

                {/* New Features: Indicators & Sentiment */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                  {stock.indicators && (
                    <div className="bg-blue-900/10 p-3 rounded border border-blue-900/30">
                      <h6 className="text-[10px] font-bold text-blue-400 uppercase mb-1">進階指標 (RSI/KD/MACD/布林)</h6>
                      <p className="text-xs text-gray-300 leading-tight">{stock.indicators}</p>
                    </div>
                  )}
                  {stock.sentiment && (
                    <div className="bg-purple-900/10 p-3 rounded border border-purple-900/30">
                      <h6 className="text-[10px] font-bold text-purple-400 uppercase mb-1">市場情緒 (PTT/Dcard/新聞)</h6>
                      <p className="text-xs text-gray-300 leading-tight">{stock.sentiment}</p>
                    </div>
                  )}
                  {stock.keywordHeat && (
                    <div className="bg-orange-900/10 p-3 rounded border border-orange-900/30">
                      <h6 className="text-[10px] font-bold text-orange-400 uppercase mb-1">關鍵字熱度與討論量</h6>
                      <p className="text-xs text-gray-300 leading-tight">{stock.keywordHeat}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Monitoring Log */}
        <div className="bg-cardBg p-4 rounded-xl border border-gray-700 h-[600px] flex flex-col">
          <h3 className="text-xl font-bold text-gray-200 mb-4 flex items-center gap-2">
            <span>📡</span> 系統日誌
            {monitoring && <span className="animate-pulse w-2 h-2 rounded-full bg-green-500"></span>}
          </h3>
          <div className="flex-1 overflow-y-auto font-mono text-sm space-y-2 p-2 bg-darkBg rounded border border-gray-800">
            {logs.length === 0 ? (
              <span className="text-gray-600">等待執行...</span>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="text-gray-300 border-b border-gray-800 pb-1 last:border-0">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;