import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCryptoPrice, getCryptoPrices, COIN_IDS } from './cryptoPriceService';
import { getStockQuote, getStockQuotes } from './stockPriceService';
import { useInvestmentService, Investment } from '@/lib/database/investmentService';

const LAST_MARKET_UPDATE_KEY = 'lastMarketUpdate';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

export interface MarketUpdateResult {
  success: boolean;
  updated: number;
  failed: number;
  timestamp: number;
}

export async function shouldRefreshMarketPrices(): Promise<boolean> {
  try {
    const last = await AsyncStorage.getItem(LAST_MARKET_UPDATE_KEY);
    if (!last) return true;
    return (Date.now() - parseInt(last)) > CACHE_DURATION_MS;
  } catch {
    return true;
  }
}

export async function getLastMarketUpdate(): Promise<number | null> {
  try {
    const last = await AsyncStorage.getItem(LAST_MARKET_UPDATE_KEY);
    return last ? parseInt(last) : null;
  } catch {
    return null;
  }
}

export async function refreshAllMarketPrices(investments: Investment[]): Promise<MarketUpdateResult> {
  const result: MarketUpdateResult = {
    success: true,
    updated: 0,
    failed: 0,
    timestamp: Date.now(),
  };

  const cryptoInvestments = investments.filter(i => i.type_id === 'crypto');
  const stockInvestments = investments.filter(i => i.type_id === 'stock');

  if (cryptoInvestments.length > 0) {
    const coinIds = cryptoInvestments
      .map(i => (i as any).coin_id)
      .filter(Boolean);

    if (coinIds.length > 0) {
      const prices = await getCryptoPrices(coinIds as string[]);
      
      for (const inv of cryptoInvestments) {
        const coinId = (inv as any).coin_id;
        const price = prices.get(coinId);
        
        if (price) {
          result.updated++;
        } else {
          result.failed++;
        }
      }
    }
  }

  if (stockInvestments.length > 0) {
    const symbols = stockInvestments
      .map(i => (i as any).stock_symbol)
      .filter(Boolean);

    if (symbols.length > 0) {
      const quotes = await getStockQuotes(symbols as string[]);
      
      for (const inv of stockInvestments) {
        const symbol = (inv as any).stock_symbol;
        const quote = quotes.get(symbol);
        
        if (quote) {
          result.updated++;
        } else {
          result.failed++;
        }
      }
    }
  }

  await AsyncStorage.setItem(LAST_MARKET_UPDATE_KEY, result.timestamp.toString());
  
  result.success = result.failed === 0;
  return result;
}

export async function refreshMarketPricesForInvestment(investment: Investment): Promise<number | null> {
  if (investment.type_id === 'crypto') {
    const coinId = (investment as any).coin_id;
    if (!coinId) return null;
    
    const price = await getCryptoPrice(coinId);
    return price?.mxn || null;
  }
  
  if (investment.type_id === 'stock') {
    const symbol = (investment as any).stock_symbol;
    if (!symbol) return null;
    
    const quote = await getStockQuote(symbol);
    return quote?.price || null;
  }
  
  return null;
}

export function formatLastUpdate(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Hace un momento';
  if (minutes < 60) return `Hace ${minutes} minutos`;
  if (hours < 24) return `Hace ${hours} horas`;
  return `Hace ${days} días`;
}