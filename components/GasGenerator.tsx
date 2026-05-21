import React from 'react';
import { AppSettings } from '../types';

interface Props {
  settings: AppSettings;
}

const GasGenerator: React.FC<Props> = ({ settings }) => {
  // 檢查所有必要的 Key 是否存在
  const hasKeys = settings.geminiKey && settings.lineChannelToken && settings.lineUserId && settings.sheetId && settings.fugleKey;

  const gasCode = `
/**
 * 台灣股市 AI 分析師 - 全自動庫存診斷 & 選股機器人 (v3.0 增強版)
 * 
 * 更新重點：
 * 1. 智慧讀取：若找不到「庫存」分頁，自動讀取第一個分頁。
 * 2. 庫存診斷：強制 AI 給出庫存股的「具體停損價」與「停利價」。
 * 3. 雙軌制：庫存用 Fugle 查精確價，選股用 Gemini 查趨勢。
 */

// --- 您的設定 (已自動填入) ---
const GEMINI_API_KEY = "${settings.geminiKey || ''}";
const LINE_CHANNEL_TOKEN = "${settings.lineChannelToken || ''}";
const LINE_USER_ID = "${settings.lineUserId || ''}";
const SPREADSHEET_ID = "${settings.sheetId || ''}";
const FUGLE_API_KEY = "${settings.fugleKey || ''}";

// 預設讀取的分頁名稱 (若找不到會自動抓第一個)
const TARGET_TAB_NAME = "庫存"; 
const MODEL_NAME = "gemini-2.0-flash-exp"; 

function dailyStockScan() {
  Logger.log("🚀 開始執行每日投資日報生成 (v3.0)...");
  
  if (!GEMINI_API_KEY || !FUGLE_API_KEY || !SPREADSHEET_ID) {
    Logger.log("❌ 設定缺失：請檢查 API Key 或 Sheet ID");
    return;
  }

  try {
    // ----------------------------
    // Phase 1: 庫存診斷 (Inventory Analysis)
    // ----------------------------
    var portfolio = getUserPortfolio();
    var strategyAdvice = "";
    
    if (portfolio.length > 0) {
      Logger.log("📦 成功讀取 " + portfolio.length + " 檔庫存，正在透過 Fugle 更新股價...");
      
      // 更新庫存股價
      portfolio.forEach(function(stock) {
        var price = getFuglePrice(stock.symbol);
        stock.currentPrice = price ? price : "查無股價";
        // 計算帳面損益
        if (typeof stock.currentPrice === 'number') {
           var profit = ((stock.currentPrice - stock.cost) / stock.cost * 100).toFixed(1);
           stock.profitStr = (profit > 0 ? "+" : "") + profit + "%";
        } else {
           stock.profitStr = "N/A";
        }
        Utilities.sleep(200); // 避免 API 限制
      });
      
      Logger.log("📊 庫存更新完畢: " + JSON.stringify(portfolio));
      Logger.log("🤖 呼叫 AI 進行庫存停損停利診斷...");
      strategyAdvice = analyzePortfolioStrategy(portfolio);
    } else {
      Logger.log("⚠️ 警告：庫存列表為空 (可能是 Sheet 讀取失敗或無資料)");
      strategyAdvice = "⚠️ 無法讀取庫存資料。請確認 Google Sheet ID 正確，且第一欄為股票代號。";
    }

    // ----------------------------
    // Phase 2: 潛力選股 (New Opportunities)
    // ----------------------------
    Logger.log("🔍 開始執行潛力股掃描...");
    var recommendations = fetchGeminiRecommendations();

    // ----------------------------
    // Phase 3: 產生報告 & 發送
    // ----------------------------
    var today = new Date().toLocaleDateString();
    var message = "【🦅 每日投資日報 " + today + "】\\n";
    message += "========================\\n\\n";
    
    // Part A: 庫存診斷報告
    if (portfolio.length > 0) {
      message += "📊 **庫存診斷 (含停損/停利建議)**\\n";
      message += strategyAdvice + "\\n";
      message += "------------------------\\n";
    } else {
      message += "📊 **庫存狀態**\\n目前未讀取到庫存資料，請檢查 Google Sheet。\\n------------------------\\n";
    }

    // Part B: 潛力股推薦
    message += "🚀 **今日選股 (高勝率 + 20%獲利目標)**\\n";
    if (recommendations && recommendations.length > 0) {
      recommendations.forEach(function(stock, index) {
        // 二次驗證價格
        if (FUGLE_API_KEY) {
           var realPrice = getFuglePrice(stock.symbol);
           if (realPrice) stock.currentPrice = realPrice;
        }

        var icon = stock.suggestion === "BUY_NOW" ? "🔥" : "⏳";
        var gain = 0;
        if(stock.buyPoint > 0) gain = ((stock.finalTakeProfit - stock.buyPoint)/stock.buyPoint*100).toFixed(1);

        message += \`\${index + 1}. \${stock.name} (\${stock.symbol}) \${icon}\\n\`;
        message += \`   💰 收盤: \${stock.currentPrice} | 買點: \${stock.buyPoint}\\n\`;
        message += \`   🎯 目標: \${stock.finalTakeProfit} (+\${gain}%)\\n\`;
        message += \`   🛑 止損: \${stock.stopLossPoint}\\n\`;
        message += "------------------------\\n";
      });
    } else {
      message += "⚠️ 今日市場風險較高，無符合嚴格篩選之標的。\\n";
    }
    
    message += "\\n💡 投資有風險，請嚴格執行停損。";

    sendLineMessage(message);
    Logger.log("✅ 執行完成，訊息已發送至 LINE。");
    
  } catch (e) {
    Logger.log("❌ 發生嚴重錯誤: " + e.toString());
    sendLineMessage("⚠️ 系統執行發生錯誤: " + e.toString());
  }
}

// 智慧讀取 Sheet 資料
function getUserPortfolio() {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(TARGET_TAB_NAME);
    
    // Fallback: 如果找不到 "庫存" 分頁，就抓第一個分頁
    if (!sheet) {
      sheet = ss.getSheets()[0];
      Logger.log("⚠️ 找不到分頁 '" + TARGET_TAB_NAME + "'，改為讀取第一個分頁: " + sheet.getName());
    } else {
      Logger.log("✅ 讀取分頁: " + sheet.getName());
    }
    
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
       Logger.log("⚠️ Sheet 列數過少，可能無資料");
       return [];
    }
    
    // 讀取 A, B, C 欄 (代號, 成本, 股數)
    // 假設第一列是標題，從第二列開始讀
    var data = sheet.getRange(2, 1, lastRow - 1, 3).getValues();
    var portfolio = [];
    
    for (var i = 0; i < data.length; i++) {
      var symbol = data[i][0];
      // 確保代號存在
      if (symbol) {
        portfolio.push({
          symbol: symbol.toString().trim(),
          cost: data[i][1] || 0,
          shares: data[i][2] || 0,
          currentPrice: 0 // 稍後填入
        });
      }
    }
    return portfolio;
  } catch (e) {
    Logger.log("❌ 讀取 Sheet 失敗: " + e.toString());
    return [];
  }
}

// AI 分析庫存策略 (重點修正：要求具體停損停利)
function analyzePortfolioStrategy(portfolio) {
  var url = \`https://generativelanguage.googleapis.com/v1beta/models/\${MODEL_NAME}:generateContent?key=\${GEMINI_API_KEY}\`;
  
  var portfolioStr = JSON.stringify(portfolio);
  
  var systemPrompt = \`
    角色：你是擁有20年經驗的操盤手，風格果斷，重視風控。
    任務：用戶提供了庫存列表 (含 Fugle 最新收盤價 currentPrice)。請你給出操作指令。
    
    庫存資料：
    \${portfolioStr}
    
    【輸出規則】
    請針對每一支股票，輸出以下純文字格式 (不要 Markdown 標題，直接條列)：
    
    ● [股票名稱] ([代號])
       損益：[獲利/虧損 %]
       建議：[續抱 / 減碼 / 清倉 / 加碼]
       🛑 停損：[請給出具體價格，例如 跌破 50]
       🚀 停利：[請給出具體價格，例如 目標 65]
       理由：[簡短一句話，例如：跌破月線轉弱，反彈先跑]
    
    若 currentPrice 為 "查無股價"，請提示用戶檢查代號。
  \`;

  var payload = {
    contents: [{ parts: [{ text: "請分析我的庫存，明確告訴我停損跟停利點位。" }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: { responseMimeType: "text/plain" }
  };

  var options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    var response = UrlFetchApp.fetch(url, options);
    var json = JSON.parse(response.getContentText());
    return json.candidates?.[0]?.content?.parts?.[0]?.text || "無法生成庫存建議";
  } catch (e) {
    return "分析庫存時發生錯誤: " + e.toString();
  }
}

// AI 選股推薦 (維持原有機制)
function fetchGeminiRecommendations() {
  var url = \`https://generativelanguage.googleapis.com/v1beta/models/\${MODEL_NAME}:generateContent?key=\${GEMINI_API_KEY}\`;
  
  var systemPrompt = \`
    任務：選出 5 支台股潛力股 (股價 < 150)。
    規則：
    1. **必須使用 Google Search 查詢今日收盤價**。
    2. 必須符合 [型態, 籌碼, 題材] 優勢。
    3. 計算買點、停損點、獲利點。
  \`;

  var schema = {
    type: "ARRAY",
    items: {
      type: "OBJECT",
      properties: {
        symbol: { type: "STRING" },
        name: { type: "STRING" },
        currentPrice: { type: "NUMBER" },
        buyPoint: { type: "NUMBER" },
        finalTakeProfit: { type: "NUMBER" },
        stopLossPoint: { type: "NUMBER" },
        suggestion: { type: "STRING", enum: ["BUY_NOW", "WAIT"] }
      },
      required: ["symbol", "name", "currentPrice", "buyPoint", "finalTakeProfit", "stopLossPoint", "suggestion"]
    }
  };

  var payload = {
    contents: [{ parts: [{ text: "請搜尋今日最新股價，推薦 5 支高勝率股票。" }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    tools: [{googleSearch: {}}],
    generationConfig: { responseMimeType: "application/json", responseSchema: schema }
  };

  try {
    var response = UrlFetchApp.fetch(url, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    var json = JSON.parse(response.getContentText());
    var text = json.candidates?.[0]?.content?.parts?.[0]?.text;
    return text ? JSON.parse(text) : [];
  } catch (e) {
    Logger.log("選股錯誤: " + e.toString());
    return [];
  }
}

// Fugle 查價
function getFuglePrice(symbol) {
  var url = "https://api.fugle.tw/marketdata/v1.0/stock/intraday/quote/" + symbol;
  try {
    var response = UrlFetchApp.fetch(url, {
      headers: { "X-API-KEY": FUGLE_API_KEY },
      muteHttpExceptions: true
    });
    if (response.getResponseCode() !== 200) return null;
    var data = JSON.parse(response.getContentText());
    if (data.lastTrade?.price) return data.lastTrade.price;
    if (data.closePrice) return data.closePrice;
    return null;
  } catch (e) { return null; }
}

// 發送 LINE
function sendLineMessage(message) {
  UrlFetchApp.fetch("https://api.line.me/v2/bot/message/push", {
    method: "post",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + LINE_CHANNEL_TOKEN
    },
    payload: JSON.stringify({
      "to": LINE_USER_ID,
      "messages": [{ "type": "text", "text": message }]
    }),
    muteHttpExceptions: true
  });
}
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(gasCode).then(() => {
      alert("程式碼已複製到剪貼簿！");
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-cardBg rounded-xl p-6 shadow-xl border-l-4 border-purple-500">
        <h2 className="text-2xl font-bold text-white mb-2">Google Apps Script (庫存診斷 v3.0)</h2>
        <div className="text-gray-400 space-y-2 text-sm">
          <p>此版本強化了對 Sheet 讀取的相容性，即使分頁名稱不叫「庫存」也能運作。</p>
          <ul className="list-disc list-inside text-gray-300">
            <li>✅ <strong>智慧讀取庫存</strong>：優先讀取「庫存」分頁，若無則讀取第一個分頁。</li>
            <li>✅ <strong>明確操作指令</strong>：AI 將針對每檔庫存給出明確的 <span className="text-red-400">🛑 停損價</span> 與 <span className="text-green-400">🚀 停利價</span>。</li>
            <li>✅ <strong>全自動整合</strong>：您的 ID、Key 皆已填入，複製後直接覆蓋 GAS 即可。</li>
          </ul>
        </div>
      </div>

      {!hasKeys ? (
        <div className="bg-yellow-900/30 border border-yellow-600 p-4 rounded-lg text-yellow-200">
          ⚠️ 偵測到設定資訊不完整，程式碼可能無法正常運作。
        </div>
      ) : (
        <div className="bg-darkBg border border-gray-700 rounded-xl overflow-hidden">
          <div className="flex justify-between items-center bg-gray-800 px-4 py-2 border-b border-gray-700">
            <span className="text-sm text-gray-400 font-mono">Code.gs</span>
            <button 
              onClick={copyToClipboard}
              className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded transition-colors"
            >
              複製程式碼
            </button>
          </div>
          <pre className="p-4 overflow-x-auto text-sm font-mono text-green-400 leading-relaxed custom-scrollbar whitespace-pre">
            {gasCode}
          </pre>
        </div>
      )}
    </div>
  );
};

export default GasGenerator;