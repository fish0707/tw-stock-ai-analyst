/**
 * Fetch real-time stock price from Fugle Market Data API v1.0
 * Documentation: https://developer.fugle.tw/
 */
export const fetchFuglePrice = async (symbol: string, apiKey: string): Promise<number | null> => {
  if (!apiKey || !symbol) return null;

  try {
    // Standard Fugle Market Data API v1.0 endpoint
    const url = `https://api.fugle.tw/marketdata/v1.0/stock/intraday/quote/${symbol}`;
    
    // Note: In a real 2026 scenario, we would expect this API to return 2026 data.
    // If the API returns old data (e.g. 2024 prices), it means the API provider is serving historical data
    // or the environment is restricted.
    // We will return the data as is, and let the UI/AI handle the discrepancy via Google Search fallback.
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-KEY': apiKey,
      },
    });

    if (!response.ok) {
      console.warn(`Fugle API Error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    
    // Attempt to find the most relevant price: lastTrade price, or close price if market closed
    if (data.lastTrade && data.lastTrade.price) {
      return data.lastTrade.price;
    }
    
    if (data.closePrice) {
      return data.closePrice;
    }
    
    return null;
  } catch (error) {
    console.error("Failed to fetch price from Fugle:", error);
    return null;
  }
};