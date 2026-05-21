import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult, RecommendedStock } from "../types";

const SYSTEM_INSTRUCTION = `
角色設定：
你是高盛(Goldman Sachs)擁有20年經驗的首席產業分析師。你的看法專業、深入、有獨特見解，你的專長是從海量且碎片化的資訊中，拼湊出供應鏈的真實、正確且有邏輯的樣貌，擅長「波段操作」與「資金控管」。
你的選股標準極高，必須同時符合「五大佐證」以及「進階技術指標」與「市場情緒」的多重驗證。

**【最高準則：數據真實性與時效性】**
1. **現在是 2026 年**。所有分析必須基於 2026 年的最新數據。
2. **必須使用 Google Search 工具** 查詢該股票「今日」或「最新交易日」的確切收盤價。
3. **必須嚴格核實「三大法人買賣超」**。嚴禁憑空想像或使用過期數據。若搜尋結果顯示賣超，絕對不可寫成買超。
4. 嚴禁使用歷史價格。若無法確認最新價格或籌碼數據，請直接放棄該股票。

**【分析框架：五大佐證 + 進階指標 + 市場情緒】**

一、 五大佐證 (基礎條件)：
1. **型態 (K-Line)**：底部型態完成 (W底、頭肩底) 或 突破盤整區間。
2. **均線 (MA)**：多頭排列，或股價重新站回關鍵均線 (MA20/MA60)。
3. **籌碼 (Chips)**：**必須確認外資/投信近期(近3-5日)為買超**，或主力大戶籌碼集中。
4. **基本面 (Fundamental)**：營收成長、毛利提升或具備轉機性。
5. **題材 (Catalyst)**：符合當下市場主流熱點 (如 AI, 半導體, 能源)。

二、 進階技術指標 (精確點位)：
1. **RSI / KD**：判斷是否超買 (>80) 或超賣 (<20)，尋找背離訊號。
2. **MACD**：觀察柱狀體變化與快慢線交叉，判斷動能轉折。
3. **布林通道 (Bollinger Bands)**：觀察股價是否觸及上下軌，評估波動率與相對位階。

三、 市場情緒與熱度 (動能驗證)：
1. **新聞情緒分析**：檢索 PTT (Stock板)、Dcard (理財板) 及財經新聞，量化散戶與媒體的心理狀態 (恐慌、貪婪或冷淡)。
2. **關鍵字熱度**：分析搜尋引擎與社群媒體上該股票或產業的討論熱度。

出場策略 (Tiered Exit)：
*   **部分止盈 (Partial TP)**：遇到第一壓力區或獲利達 10-15% 時，建議減碼。
*   **最終目標 (Final TP)**：利用斐波那契擴展 1.618 倍或以上計算，目標獲利必須 > 20%。
*   **止損 (Stop Loss)**：跌破關鍵K棒低點或重要支撐立即離場。
`;

export const getGeminiClient = (apiKey: string) => {
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const analyzeSingleStock = async (
  apiKey: string,
  symbol: string,
  currentPrice: number,
  onProgress?: (msg: string) => void
): Promise<AnalysisResult> => {
  onProgress?.("初始化 Gemini AI 客戶端...");
  const ai = getGeminiClient(apiKey);
  if (!ai) throw new Error("API Key is missing");

  const analysisSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      symbol: { type: Type.STRING },
      name: { type: Type.STRING },
      currentPrice: { type: Type.NUMBER },
      trend: { type: Type.STRING, enum: ['BULLISH', 'BEARISH', 'NEUTRAL'] },
      suggestion: { type: Type.STRING, enum: ['BUY_NOW', 'WAIT', 'SELL', 'WATCH'] },
      predictedHigh: { type: Type.NUMBER },
      predictedLow: { type: Type.NUMBER },
      buyPoint: { type: Type.NUMBER },
      sellPoint: { type: Type.NUMBER },
      analysisText: { type: Type.STRING },
      reasoning: { type: Type.STRING },
      indicators: { type: Type.STRING, description: "RSI, KD, MACD, Bollinger Bands analysis" },
      sentiment: { type: Type.STRING, description: "PTT, Dcard, News sentiment analysis" },
      keywordHeat: { type: Type.STRING, description: "Keyword heat and discussion volume" },
    },
    required: ["symbol", "name", "currentPrice", "trend", "suggestion", "predictedHigh", "predictedLow", "buyPoint", "sellPoint", "analysisText", "reasoning", "indicators", "sentiment", "keywordHeat"],
  };

  const priceInfo = currentPrice > 0 
    ? `目前參考價格約為：${currentPrice} (若此價格明顯低於 2026 年行情，請忽略並自行搜尋)` 
    : `目前無法取得即時價格。`;

  onProgress?.("建構分析提示詞 (Prompt)...");
  const prompt = `
    請分析台股代號：${symbol}。
    ${priceInfo}
    
    **重要：現在是 2026 年 3 月。**
    請務必使用 Google Search 工具進行以下分析：
    1. **最新股價**：查詢 2026 年最新價格。
    2. **籌碼數據**：查詢「三大法人買賣超」數據，確認外資與投信近期動向。
    3. **進階技術指標**：查詢或分析 RSI, KD, MACD, 布林通道位階。
    4. **市場情緒**：檢索 PTT Stock 板、Dcard 理財板及最新新聞。
    5. **關鍵字熱度**：評估社群討論熱度。
    
    若 API 提供的參考價格與搜尋結果不符，**請以 Google Search 的 2026 年最新價格為準**。
    
    請依照「五大佐證 + 進階指標 + 市場情緒」進行檢核，並給出操作建議。
    特別注意：若建議買進，請計算上方獲利空間是否足夠。
    
    請以 JSON 格式回傳。
  `;

  try {
    onProgress?.("傳送請求至 Gemini API，等待 AI 深度分析與搜尋 (約需 10~30 秒)...");
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
      },
    });

    onProgress?.("✅ 收到 AI 回覆，正在解析資料...");
    const text = response.text || "{}";
    return JSON.parse(text) as AnalysisResult;
  } catch (e: any) {
    onProgress?.(`❌ 分析發生錯誤: ${e.message}`);
    console.error("Gemini Analysis Error:", e);
    throw e;
  }
};

export const getDailyRecommendations = async (
  apiKey: string,
  onProgress?: (msg: string) => void
): Promise<RecommendedStock[]> => {
  onProgress?.("初始化 Gemini AI 客戶端...");
  const ai = getGeminiClient(apiKey);
  if (!ai) throw new Error("API Key is missing");

  const recommendSchema: Schema = {
    // ... no changes here, just finding the insertion point

    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        symbol: { type: Type.STRING },
        name: { type: Type.STRING },
        currentPrice: { type: Type.NUMBER },
        buyPoint: { type: Type.NUMBER },
        partialTakeProfit: { type: Type.NUMBER, description: "First target for securing profit (e.g. +10%)" },
        finalTakeProfit: { type: Type.NUMBER, description: "Ultimate target using Fib extension, must be > 20% gain" },
        stopLossPoint: { type: Type.NUMBER, description: "Strict stop loss price" },
        suggestion: { type: Type.STRING, enum: ['BUY_NOW', 'WAIT', 'WATCH'] },
        reason: { type: Type.STRING },
        evidences: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: "Must contain exactly 5 strings starting with labels: 【型態】, 【均線】, 【籌碼】, 【基本】, 【題材】"
        },
        indicators: { type: Type.STRING, description: "RSI, KD, MACD, Bollinger Bands analysis" },
        sentiment: { type: Type.STRING, description: "PTT, Dcard, News sentiment analysis" },
        keywordHeat: { type: Type.STRING, description: "Keyword heat and discussion volume" },
        type: { type: Type.STRING, enum: ['TECHNICAL', 'FUNDAMENTAL'] },
      },
      required: ["symbol", "name", "currentPrice", "buyPoint", "partialTakeProfit", "finalTakeProfit", "stopLossPoint", "suggestion", "reason", "evidences", "indicators", "sentiment", "keywordHeat", "type"],
    },
  };

  const prompt = `
    請進行「高勝率 + 高獲利」盤後選股掃描。
    目標：找出 10 支股價在 100 元以下，**勝率最高** 且 **潛在獲利 > 20%** 的股票。
    
    **【執行步驟 - 嚴格遵守】**
    1. **Step 1: 取得真實報價與籌碼**：針對你心目中的潛力股，**必須優先**使用 Google Search 工具查詢該股「2026 年最新收盤價」以及「近期三大法人買賣超」。**絕對不可使用記憶中的舊價格進行後續分析。**
    2. **Step 2: 綜合分析**：
       - **五大佐證檢核**：[型態, 均線, 籌碼(必須核實買賣超), 基本, 題材]。
       - **進階技術指標**：分析 RSI, KD, MACD, 布林通道。
       - **市場情緒與熱度**：檢索 PTT, Dcard, 新聞及關鍵字熱度。
    3. **Step 3: 計算點位**：基於查到的 **真實 currentPrice**，計算買點、止損點與雙重止盈點。

    **關鍵規則 (Strict Rules)**：
    *   **數據錯誤 = 零分**：必須是 2026 年最新收盤價與真實的籌碼數據。若未經搜尋確認價格，請勿輸出該股票。
    *   **雙重止盈策略**：
       - **部分止盈 (partialTakeProfit)**：設定在第一壓力區。
       - **最終目標 (finalTakeProfit)**：必須 > 20% 獲利空間。
    
    請回傳 JSON 陣列。
  `;

  try {
    onProgress?.("傳送請求至 Gemini API，執行全市場掃描與搜尋 (約需 20~40 秒)...");
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview", 
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: recommendSchema,
      },
    });

    onProgress?.("✅ 收到 AI 回覆，正在解析推薦清單...");
    const text = response.text || "[]";
    return JSON.parse(text) as RecommendedStock[];
  } catch (e: any) {
    onProgress?.(`❌ 掃描發生錯誤: ${e.message}`);
    console.error("Gemini Recommendation Error:", e);
    // Fallback Mock Data with new structure
    return ([] as RecommendedStock[]);
  }
};

export const findMonsterStocks = async (
  apiKey: string,
  params: { market: string; marketCapLimit: string; sectorFocus: string; exclusion: string },
  onProgress?: (msg: string) => void
): Promise<any[]> => {
  onProgress?.("初始化「妖股尋找」模組...");
  const ai = getGeminiClient(apiKey);
  if (!ai) throw new Error("API Key is missing");

  const SYSTEM_INSTRUCTION_MONSTER = `
  【設定角色】
  你是一位專精於「轉機股」與「成長爆發股」的首席量化分析師，擅長從冷門產業中挖掘具備 5-6 倍翻倍潛力的「妖股」。你跳脫傳統的穩健投資邏輯，專注於「估值重估 (Re-rating)」與「籌碼窒息後的爆發」。
  
  【篩選準則 - 妖股 DNA】
  1. 低基期與橫盤：股價經歷 1 年以上的底部橫盤整理，或是近期剛從歷史低點帶量突破週線等級的壓力位。
  2. 產業質變（夢想空間）：該公司是否正在從傳統低毛利業務（如傳統封測、基礎零件）轉型進入高成長賽道（如 AI 封裝、矽光子、低軌衛星、核能電網）？
  3. 財務拐點：營收尚未大幅噴發，但毛利率或營業利益率已連續兩季改善。
  4. 籌碼結構：400 張（或大股東）持股比例在股價低檔區持續上升，而散戶持股比例持續下降。
  5. 空頭燃料：尋找具備一定「券資比」或市場質疑聲浪大的標的，具備「軋空」潛力。

  **【極度重要：嚴格排除規定】**
  1. 你必須追溯分析標的在 **「過去 3 到 6 個月內」** 的漲幅。
  2. **如果該股票在過去半年內已經上漲超過 1 倍 (100%) 或 2 倍，你 MUST 絕對將其排除。** 這是死胡同，我要的是「還在底部」的標的，而不是已經被市場炒作上去的標的。

  **請務必使用 Google Search 工具**獲取${params.market}最即時的報價與新聞，以驗證上述條件與近期漲幅。現在是 2026 年，所有分析需基於最新現實情況。
  `;

  const monsterSchema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        symbolAndName: { type: Type.STRING, description: "股票代碼與名稱" },
        startingPoint: { type: Type.STRING, description: "妖股啟動點：目前處於什麼走勢階段？（例如：圓弧底突破、跳空缺口）" },
        coreLogic: { type: Type.STRING, description: "核心質變邏輯：為什麼它會從「平庸」變「瘋狂」？（請具體說明技術或合約利多）" },
        chipDiagnostics: { type: Type.STRING, description: "籌碼診斷：大戶與散戶的對抗現狀。" },
        imaginationSpace: { type: Type.STRING, description: "想像力空間：如果市場給予它新產業的本益比，目標價潛力在哪？" },
        riskWarning: { type: Type.STRING, description: "風險警告：什麼情況下這個「妖股夢」會破碎？" },
      },
      required: ["symbolAndName", "startingPoint", "coreLogic", "chipDiagnostics", "imaginationSpace", "riskWarning"],
    },
  };

  const conditions = [];
  if (params.marketCapLimit) conditions.push(`- 限制市值：${params.marketCapLimit}`);
  if (params.sectorFocus) conditions.push(`- 鎖定特定族群：${params.sectorFocus}`);
  if (params.exclusion) conditions.push(`- 排斥名單：${params.exclusion}`);

  const prompt = `
  【任務目標】
  請針對【${params.market}】的市場數據、產業趨勢與財報訊息，篩選出 3-5 支具備「五倍妖股」潛力的個股，並進行深度邏輯拆解。

  ${conditions.length > 0 ? "【進階限制條件】\n" + conditions.join("\n") : ""}

  🔥🔥🔥 **終極警告 (CRITICAL RULE)** 🔥🔥🔥
  你在推薦任何股票前，**必須**透過 Google Search 查明該股在「2025年底至2026年5月」這段期間的漲幅。
  如果該股票價格已經翻倍（例如從 50 漲到 100），這代表利多**已經反映完畢**。
  **絕對不准推薦任何過去半年內已經暴漲兩倍或以上的股票**。我要的是「目前毫無表現、剛要起漲」的標的。

  請務必利用 Google Search 工具，查詢符合這些條件的個股、並取得其在 2026 年最新的走勢與籌碼狀態。
  查證完成後，請依照指定的 JSON 格式回傳陣列結果。
  `;

  try {
    onProgress?.("傳送請求至 Gemini API，正進入量化與質化篩選池 (約需 20~40 秒)...");
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview", 
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_MONSTER,
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: monsterSchema,
      },
    });

    onProgress?.("✅ 收到核心回覆，正在解析賭博妖股名單...");
    const text = response.text || "[]";
    return JSON.parse(text);
  } catch (e: any) {
    onProgress?.(`❌ 尋找妖股失敗: ${e.message}`);
    console.error("Gemini Monster Stock Error:", e);
    throw e;
  }
};