import AsyncStorage from '@react-native-async-storage/async-storage';

const ALPHA_VANTAGE_BASE = 'https://www.alphavantage.co/query';

const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000;

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: number;
  latestTradingDay: string;
}

export async function getApiKey(): Promise<string | null> {
  return await AsyncStorage.getItem('alpha_vantage_api_key');
}

export async function getStockQuote(symbol: string): Promise<StockQuote | null> {
  const cacheKey = `stock_${symbol}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const apiKey = await getApiKey();
  if (!apiKey) {
    console.warn('[AlphaVantage] No API key configured');
    return null;
  }

  try {
    const response = await fetch(
      `${ALPHA_VANTAGE_BASE}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`
    );
    
    if (!response.ok) {
      console.error(`[AlphaVantage] Error fetching ${symbol}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const quote = data['Global Quote'];

    if (!quote || Object.keys(quote).length === 0) {
      console.error(`[AlphaVantage] No data for ${symbol}`);
      return null;
    }

    const result: StockQuote = {
      symbol: quote['01. symbol'],
      price: parseFloat(quote['05. price']) || 0,
      change: parseFloat(quote['09. change']) || 0,
      changePercent: parseFloat(quote['10. change percent']?.replace('%', '')) || 0,
      high: parseFloat(quote['03. high']) || 0,
      low: parseFloat(quote['04. low']) || 0,
      volume: parseInt(quote['06. volume']) || 0,
      latestTradingDay: quote['07. latest trading day'],
    };

    cache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  } catch (error) {
    console.error(`[AlphaVantage] Failed to fetch ${symbol}:`, error);
    return null;
  }
}

export async function getStockQuotes(symbols: string[]): Promise<Map<string, StockQuote>> {
  const result = new Map<string, StockQuote>();
  
  if (symbols.length === 0) return result;

  for (const symbol of symbols) {
    const quote = await getStockQuote(symbol);
    if (quote) {
      result.set(symbol, quote);
    }
  }

  return result;
}

export async function searchSymbol(query: string): Promise<Array<{ symbol: string; name: string; type: string }>> {
  const apiKey = await getApiKey();
  if (!apiKey) return [];

  try {
    const response = await fetch(
      `${ALPHA_VANTAGE_BASE}?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(query)}&apikey=${apiKey}`
    );
    
    if (!response.ok) return [];
    
    const data = await response.json();
    const matches = data.bestMatches || [];
    
    return matches.map((m: any) => ({
      symbol: m['1. symbol'],
      name: m['2. name'],
      type: m['3. type'],
    })).slice(0, 10);
  } catch (error) {
    console.error(`[AlphaVantage] Search failed:`, error);
    return [];
  }
}

export function clearCache() {
  cache.clear();
}