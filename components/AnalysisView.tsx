import React, { useState, useEffect } from 'react';
import { AnalysisResult } from '../types';
import { analyzeSingleStock } from '../services/geminiService';
import { fetchFuglePrice } from '../services/fugleService';
import StockChart from './StockChart';

interface Props {
  apiKey: string;
  fugleKey: string;
}

const AnalysisView: React.FC<Props> = ({ apiKey, fugleKey }) => {
  const [stockSymbol, setStockSymbol] = useState('');
  const [manualPrice, setManualPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleAnalyze = async () => {
    if (!stockSymbol) return;
    if (!apiKey) {
      setError('請先至「設定」輸入 Gemini API Key');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setLogs([]);
    addLog(`開始分析股票：${stockSymbol}`);

    try {
      let currentPrice = 0;
      
      // 0. Check for manual price override
      if (manualPrice) {
        currentPrice = parseFloat(manualPrice);
        addLog(`使用手動輸入價格：${currentPrice}`);
      } else {
        // 1. Try to get real price from Fugle
        if (fugleKey) {
          addLog(`正在透過 Fugle API 取得即時報價...`);
          const realPrice = await fetchFuglePrice(stockSymbol, fugleKey);
          if (realPrice) {
            currentPrice = realPrice;
            addLog(`Fugle API 取得報價成功：${currentPrice}`);
          } else {
            addLog(`⚠️ Fugle API 無法取得報價，將交由 AI 進行網路搜尋`);
          }
        } else {
          addLog(`未設定 Fugle Key，將交由 AI 進行網路搜尋`);
        }
      }

      if (currentPrice === 0) {
         console.warn("No Fugle Key provided or fetch failed, using AI estimation.");
      }
      
      const analysis = await analyzeSingleStock(apiKey, stockSymbol, currentPrice, addLog);
      addLog(`✅ 分析完成！`);
      setResult(analysis);
    } catch (err: any) {
      addLog(`❌ 發生錯誤：${err.message}`);
      setError(err.message || '分析失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  const getSuggestionStyle = (s: string) => {
    switch(s) {
      case 'BUY_NOW': return 'bg-twRed text-white animate-pulse';
      case 'WAIT': return 'bg-yellow-600 text-white';
      case 'SELL': return 'bg-twGreen text-white';
      default: return 'bg-gray-600 text-gray-200';
    }
  };

  const getSuggestionText = (s: string) => {
     switch(s) {
      case 'BUY_NOW': return '🔥 立即進場';
      case 'WAIT': return '⏳ 等待回檔';
      case 'SELL': return '📉 建議賣出';
      default: return '👀 觀望';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1">
          <label className="block text-sm text-gray-400 mb-1 ml-1">股票代號</label>
          <input
            type="text"
            value={stockSymbol}
            onChange={(e) => setStockSymbol(e.target.value.toUpperCase())}
            placeholder="輸入代號 (如: 2330)"
            className="w-full bg-cardBg border border-gray-600 rounded-lg px-6 py-4 text-xl focus:outline-none focus:border-twRed"
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
          />
        </div>
        <div className="w-full md:w-48">
          <label className="block text-sm text-gray-400 mb-1 ml-1">目前股價 (選填)</label>
          <input
            type="number"
            value={manualPrice}
            onChange={(e) => setManualPrice(e.target.value)}
            placeholder="自動抓取"
            className="w-full bg-cardBg border border-gray-600 rounded-lg px-6 py-4 text-xl focus:outline-none focus:border-twRed"
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className={`w-full md:w-auto px-8 py-4 rounded-lg font-bold text-white text-lg transition-all h-[62px] ${
              loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-twRed hover:bg-red-600 shadow-lg hover:shadow-red-900/50'
            }`}
          >
            {loading ? '分析中...' : '開始分析'}
          </button>
        </div>
      </div>

      {!fugleKey && (
        <div className="text-yellow-500 text-sm mb-4 bg-yellow-900/20 p-2 rounded border border-yellow-700">
          ⚠️ 尚未設定 Fugle API Key，AI 將使用模擬或歷史股價進行分析，建議前往設定頁面填寫以獲得精確買點。
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-900/30 border border-red-500 text-red-200 rounded-lg mb-6">
          {error}
        </div>
      )}

      {logs.length > 0 && (!result || loading) && (
        <div className="mb-8 bg-black/50 p-4 rounded-lg border border-gray-700 font-mono text-sm text-green-400 space-y-2 h-48 overflow-y-auto shadow-inner">
          <div className="text-gray-500 mb-2 border-b border-gray-700 pb-2 flex justify-between items-center sticky top-0 bg-black/80 backdrop-blur-sm">
            <span className="font-bold">系統執行日誌</span>
            {loading && <span className="animate-pulse flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full"></span> 執行中...</span>}
          </div>
          {logs.map((log, i) => <div key={i} className="border-b border-gray-800/50 pb-1 last:border-0">{log}</div>)}
        </div>
      )}

      {result && !loading && (
        <div className="animate-fade-in space-y-6">
          {/* Header Card */}
          <div className="bg-cardBg rounded-xl p-6 shadow-xl border-l-4 border-twRed">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">{result.name} <span className="text-gray-400 text-xl">({result.symbol})</span></h2>
                <div className="text-3xl font-mono font-bold text-white mb-3 flex items-baseline gap-2">
                   {result.currentPrice}
                   <span className="text-xs text-gray-500 font-sans font-normal bg-darkBg px-2 py-1 rounded border border-gray-700">
                     分析基準價
                   </span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`px-4 py-1.5 rounded-full text-base font-bold shadow-lg ${getSuggestionStyle(result.suggestion)}`}>
                    {getSuggestionText(result.suggestion)}
                  </span>
                  <span className={`px-3 py-1 rounded text-sm font-bold border ${
                    result.trend === 'BULLISH' ? 'border-twRed text-twRed' : 
                    result.trend === 'BEARISH' ? 'border-twGreen text-twGreen' : 'border-gray-500 text-gray-400'
                  }`}>
                    {result.trend === 'BULLISH' ? '趨勢偏多' : result.trend === 'BEARISH' ? '趨勢偏空' : '趨勢盤整'}
                  </span>
                </div>
              </div>
              <div className="text-left md:text-right bg-darkBg/50 p-3 rounded-lg border border-gray-700">
                <p className="text-gray-400 text-xs uppercase tracking-wider">Target Range</p>
                <p className="text-xl font-mono font-bold">
                  L: <span className="text-twGreen">{result.predictedLow}</span> ~ H: <span className="text-twRed">{result.predictedHigh}</span>
                </p>
              </div>
            </div>

            <StockChart 
              currentPrice={result.currentPrice} 
              predictedHigh={result.predictedHigh}
              predictedLow={result.predictedLow}
              buyPoint={result.buyPoint}
              sellPoint={result.sellPoint}
            />
          </div>

          {/* Analysis Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-cardBg rounded-xl p-6 shadow-lg border border-gray-700">
              <h3 className="text-xl font-bold mb-4 text-blue-400 border-b border-gray-700 pb-2">操作策略</h3>
              <div className="space-y-6">
                <div className="flex justify-between items-center p-3 bg-darkBg rounded border border-gray-800">
                  <span className="text-gray-400">建議買入點 (Buy Point)</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-twRed">{result.buyPoint}</span>
                    <p className="text-xs text-gray-500">
                       {result.suggestion === 'WAIT' ? '需等待回檔' : '現價可嘗試'}
                    </p>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 bg-darkBg rounded border border-gray-800">
                  <span className="text-gray-400">建議停利點 (Sell Point)</span>
                  <span className="text-xl font-bold text-green-400">{result.sellPoint}</span>
                </div>
                
                {result.indicators && (
                  <div className="mt-4">
                    <h4 className="text-sm text-blue-400 font-bold mb-2">進階技術指標 (RSI/KD/MACD/布林):</h4>
                    <p className="text-gray-300 text-sm bg-blue-900/10 p-3 rounded border-l-2 border-blue-400">
                      {result.indicators}
                    </p>
                  </div>
                )}

                <div className="mt-4">
                   <h4 className="text-sm text-gray-400 mb-2">策略理由：</h4>
                   <p className="text-gray-300 leading-relaxed text-sm bg-darkBg/30 p-3 rounded border-l-2 border-blue-500">
                     {result.reasoning}
                   </p>
                </div>
              </div>
            </div>

            <div className="bg-cardBg rounded-xl p-6 shadow-lg border border-gray-700 space-y-6">
              <div>
                <h3 className="text-xl font-bold mb-4 text-purple-400 border-b border-gray-700 pb-2">AI 分析師觀點</h3>
                <p className="text-gray-300 leading-relaxed whitespace-pre-line text-base">
                  {result.analysisText}
                </p>
              </div>

              {result.sentiment && (
                <div>
                  <h4 className="text-sm text-purple-400 font-bold mb-2">市場情緒 (PTT/Dcard/新聞):</h4>
                  <p className="text-gray-300 text-sm bg-purple-900/10 p-3 rounded border-l-2 border-purple-400">
                    {result.sentiment}
                  </p>
                </div>
              )}

              {result.keywordHeat && (
                <div>
                  <h4 className="text-sm text-orange-400 font-bold mb-2">關鍵字熱度與討論量:</h4>
                  <p className="text-gray-300 text-sm bg-orange-900/10 p-3 rounded border-l-2 border-orange-400">
                    {result.keywordHeat}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisView;