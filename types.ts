export interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  date: string;
}

export interface AnalysisResult {
  symbol: string;
  name: string;
  currentPrice: number;
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  suggestion: 'BUY_NOW' | 'WAIT' | 'SELL' | 'WATCH';
  predictedHigh: number;
  predictedLow: number;
  analysisText: string;
  buyPoint: number;
  sellPoint: number;
  reasoning: string;
  indicators?: string;
  sentiment?: string;
  keywordHeat?: string;
}

export interface RecommendedStock {
  symbol: string;
  name: string;
  currentPrice: number;
  buyPoint: number;
  partialTakeProfit: number; // New: Initial target for taking some profit
  finalTakeProfit: number;   // New: Ultimate target (> 20% gain)
  stopLossPoint: number;
  suggestion: 'BUY_NOW' | 'WAIT' | 'WATCH';
  reason: string;
  evidences: string[]; // Must strictly contain the 5 categories
  indicators?: string;
  sentiment?: string;
  keywordHeat?: string;
  type: 'TECHNICAL' | 'FUNDAMENTAL';
}

export interface AppSettings {
  geminiKey: string;
  fugleKey: string;
  lineChannelToken: string;
  lineUserId: string;
  sheetId: string;
}

export interface MonsterStock {
  symbolAndName: string;
  startingPoint: string;
  coreLogic: string;
  chipDiagnostics: string;
  imaginationSpace: string;
  riskWarning: string;
}

export enum Tab {
  DASHBOARD = 'DASHBOARD',
  ANALYSIS = 'ANALYSIS',
  AUTOMATION = 'AUTOMATION',
  SETTINGS = 'SETTINGS',
  MONSTER_STOCK = 'MONSTER_STOCK',
}