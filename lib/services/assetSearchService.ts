import AsyncStorage from '@react-native-async-storage/async-storage';
import { searchCoins as searchCoinsFromGecko } from './cryptoPriceService';
import { searchSymbol, getApiKey } from './stockPriceService';

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  type: 'crypto' | 'stock' | 'etf';
  imageUrl?: string;
}

const ASSET_CACHE_KEY = 'assets_cache';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface AssetCache {
  crypto: Asset[];
  stocks: Asset[];
  etfs: Asset[];
  timestamp: number;
}

async function getCachedAssets(): Promise<AssetCache | null> {
  try {
    const cached = await AsyncStorage.getItem(ASSET_CACHE_KEY);
    console.log('[AssetService] AsyncStorage getItem:', cached ? 'found' : 'not found');
    if (!cached) return null;
    const data: AssetCache = JSON.parse(cached);
    if (Date.now() - data.timestamp < CACHE_TTL_MS) {
      console.log('[AssetService] Cache valid, age:', Date.now() - data.timestamp, 'ms');
      return data;
    }
    console.log('[AssetService] Cache expired');
    return null;
  } catch (error) {
    console.error('[AssetService] getCachedAssets error:', error);
    return null;
  }
}

async function saveAssetCache(cache: AssetCache): Promise<void> {
  try {
    await AsyncStorage.setItem(ASSET_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('[AssetService] Failed to save cache:', error);
  }
}

export async function getPopularCryptoAssets(): Promise<Asset[]> {
  return [
    { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', type: 'crypto' },
    { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', type: 'crypto' },
    { id: 'binancecoin', symbol: 'BNB', name: 'BNB', type: 'crypto' },
    { id: 'solana', symbol: 'SOL', name: 'Solana', type: 'crypto' },
    { id: 'ripple', symbol: 'XRP', name: 'XRP', type: 'crypto' },
    { id: 'cardano', symbol: 'ADA', name: 'Cardano', type: 'crypto' },
    { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', type: 'crypto' },
    { id: 'polkadot', symbol: 'DOT', name: 'Polkadot', type: 'crypto' },
    { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche', type: 'crypto' },
    { id: 'chainlink', symbol: 'LINK', name: 'Chainlink', type: 'crypto' },
    { id: 'polygon', symbol: 'MATIC', name: 'Polygon', type: 'crypto' },
    { id: 'litecoin', symbol: 'LTC', name: 'Litecoin', type: 'crypto' },
    { id: 'uniswap', symbol: 'UNI', name: 'Uniswap', type: 'crypto' },
    { id: 'cosmos', symbol: 'ATOM', name: 'Cosmos', type: 'crypto' },
    { id: 'stellar', symbol: 'XLM', name: 'Stellar', type: 'crypto' },
    { id: 'monero', symbol: 'XMR', name: 'Monero', type: 'crypto' },
    { id: 'tron', symbol: 'TRX', name: 'TRON', type: 'crypto' },
    { id: 'near', symbol: 'NEAR', name: 'NEAR Protocol', type: 'crypto' },
    { id: 'aptos', symbol: 'APT', name: 'Aptos', type: 'crypto' },
    { id: 'arbitrum', symbol: 'ARB', name: 'Arbitrum', type: 'crypto' },
  ];
}

export async function getPopularStockAssets(): Promise<Asset[]> {
  return [
    { id: 'AAPL', symbol: 'AAPL', name: 'Apple Inc.', type: 'stock' },
    { id: 'MSFT', symbol: 'MSFT', name: 'Microsoft Corporation', type: 'stock' },
    { id: 'GOOGL', symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'stock' },
    { id: 'AMZN', symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'stock' },
    { id: 'NVDA', symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'stock' },
    { id: 'META', symbol: 'META', name: 'Meta Platforms Inc.', type: 'stock' },
    { id: 'TSLA', symbol: 'TSLA', name: 'Tesla Inc.', type: 'stock' },
    { id: 'BRK.B', symbol: 'BRK.B', name: 'Berkshire Hathaway', type: 'stock' },
    { id: 'JPM', symbol: 'JPM', name: 'JPMorgan Chase & Co.', type: 'stock' },
    { id: 'V', symbol: 'V', name: 'Visa Inc.', type: 'stock' },
    { id: 'UNH', symbol: 'UNH', name: 'UnitedHealth Group', type: 'stock' },
    { id: 'HD', symbol: 'HD', name: 'Home Depot Inc.', type: 'stock' },
    { id: 'MA', symbol: 'MA', name: 'Mastercard Inc.', type: 'stock' },
    { id: 'PG', symbol: 'PG', name: 'Procter & Gamble', type: 'stock' },
    { id: 'CVX', symbol: 'CVX', name: 'Chevron Corporation', type: 'stock' },
    { id: 'ABBV', symbol: 'ABBV', name: 'AbbVie Inc.', type: 'stock' },
    { id: 'LLY', symbol: 'LLY', name: 'Eli Lilly and Co.', type: 'stock' },
    { id: 'PEP', symbol: 'PEP', name: 'PepsiCo Inc.', type: 'stock' },
    { id: 'KO', symbol: 'KO', name: 'Coca-Cola Co.', type: 'stock' },
    { id: 'COST', symbol: 'COST', name: 'Costco Wholesale', type: 'stock' },
  ];
}

export async function getPopularETFAssets(): Promise<Asset[]> {
  return [
    { id: 'SPY', symbol: 'SPY', name: 'SPDR S&P 500 ETF', type: 'etf' },
    { id: 'QQQ', symbol: 'QQQ', name: 'Invesco QQQ Trust', type: 'etf' },
    { id: 'VOO', symbol: 'VOO', name: 'Vanguard S&P 500 ETF', type: 'etf' },
    { id: 'VTI', symbol: 'VTI', name: 'Vanguard Total Stock Market', type: 'etf' },
    { id: 'IVV', symbol: 'IVV', name: 'iShares Core S&P 500', type: 'etf' },
    { id: 'VEA', symbol: 'VEA', name: 'Vanguard FTSE Developed Markets', type: 'etf' },
    { id: 'BND', symbol: 'BND', name: 'Vanguard Total Bond Market', type: 'etf' },
    { id: 'GLD', symbol: 'GLD', name: 'SPDR Gold Shares', type: 'etf' },
    { id: 'VNQ', symbol: 'VNQ', name: 'Vanguard Real Estate ETF', type: 'etf' },
    { id: 'VWO', symbol: 'VWO', name: 'Vanguard FTSE Emerging Markets', type: 'etf' },
    { id: 'IWM', symbol: 'IWM', name: 'iShares Russell 2000', type: 'etf' },
    { id: 'EFA', symbol: 'EFA', name: 'iShares MSCI EAFE', type: 'etf' },
    { id: 'AGG', symbol: 'AGG', name: 'iShares Core US Aggregate Bond', type: 'etf' },
    { id: 'VIG', symbol: 'VIG', name: 'Vanguard Dividend Appreciation', type: 'etf' },
    { id: 'SCHD', symbol: 'SCHD', name: 'Schwab US Dividend Equity', type: 'etf' },
    { id: 'JEPI', symbol: 'JEPI', name: 'JPMorgan Equity Premium Income', type: 'etf' },
    { id: 'JEPQ', symbol: 'JEPQ', name: 'JPMorgan Nasdaq Equity Premium', type: 'etf' },
    { id: 'QYLD', symbol: 'QYLD', name: 'Global X Nasdaq 100 Covered Call', type: 'etf' },
    { id: 'TSLY', symbol: 'TSLY', name: 'YieldMax TSLA Option Income', type: 'etf' },
    { id: 'META', symbol: 'META', name: 'Meta Platforms', type: 'etf' },
  ];
}

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

async function fetchTopCryptoFromCoinGecko(): Promise<Asset[]> {
  console.log('[AssetService] Fetching top 100 crypto from CoinGecko...');
  try {
    const response = await fetch(
      `${COINGECKO_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false`
    );
    
    if (!response.ok) {
      console.error('[AssetService] CoinGecko markets error:', response.status);
      return getPopularCryptoAssets();
    }
    
    const data = await response.json();
    console.log('[AssetService] CoinGecko markets returned:', data.length, 'coins');
    
    return data.map((c: any) => ({
      id: c.id,
      symbol: c.symbol.toUpperCase(),
      name: c.name,
      type: 'crypto' as const,
      imageUrl: c.image,
    }));
  } catch (error) {
    console.error('[AssetService] CoinGecko markets failed:', error);
    return getPopularCryptoAssets();
  }
}

async function fetchTopStocksFromAlphaVantage(): Promise<Asset[]> {
  console.log('[AssetService] Fetching stocks from Alpha Vantage...');
  try {
    const apiKey = await getApiKey();
    if (!apiKey) {
      console.log('[AssetService] No Alpha Vantage key, using fallback');
      return getPopularStockAssets();
    }
    
    const popularSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'JPM', 'V', 'UNH', 'HD', 'MA', 'PG', 'CVX', 'ABBV', 'LLY', 'PEP', 'KO', 'COST', 'DIS'];
    
    const results: Asset[] = [];
    for (const symbol of popularSymbols) {
      const searchResults = await searchSymbol(symbol);
      if (searchResults.length > 0) {
        const r = searchResults[0];
        results.push({
          id: r.symbol,
          symbol: r.symbol,
          name: r.name,
          type: 'stock',
        });
      }
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log('[AssetService] Alpha Vantage fetched:', results.length, 'stocks');
    return results.length > 0 ? results : getPopularStockAssets();
  } catch (error) {
    console.error('[AssetService] Alpha Vantage fetch failed:', error);
    return getPopularStockAssets();
  }
}

export async function getAllAssets(): Promise<{ crypto: Asset[]; stocks: Asset[]; etfs: Asset[] }> {
  console.log('[AssetService] getAllAssets called');
  const cached = await getCachedAssets();
  console.log('[AssetService] Cache result:', cached ? `hit (${cached.crypto.length} crypto, ${cached.stocks.length} stocks)` : 'miss');
  
  if (cached) {
    return { crypto: cached.crypto, stocks: cached.stocks, etfs: cached.etfs };
  }

  console.log('[AssetService] Cache miss - fetching from APIs...');
  
  const [crypto, stocks] = await Promise.all([
    fetchTopCryptoFromCoinGecko(),
    fetchTopStocksFromAlphaVantage(),
  ]);

  const etfs = await getPopularETFAssets();
  console.log('[AssetService] Loaded:', crypto.length, 'crypto,', stocks.length, 'stocks,', etfs.length, 'etfs');
  
  const cache: AssetCache = {
    crypto,
    stocks,
    etfs,
    timestamp: Date.now(),
  };
  
  await saveAssetCache(cache);

  return { crypto, stocks, etfs };
}

export async function searchAssets(
  query: string,
  typeFilter?: 'crypto' | 'stock' | 'etf'
): Promise<Asset[]> {
  console.log('[AssetService] searchAssets called:', query, typeFilter);
  
  if (!query.trim()) {
    const { crypto, stocks, etfs } = await getAllAssets();
    if (typeFilter === 'crypto') return crypto;
    if (typeFilter === 'stock') return stocks;
    if (typeFilter === 'etf') return etfs;
    return [...crypto, ...stocks, ...etfs].slice(0, 50);
  }

  let results: Asset[] = [];

  if (!typeFilter || typeFilter === 'crypto') {
    console.log('[AssetService] Searching crypto live from CoinGecko...');
    const cryptoResults = await searchCryptoLive(query);
    console.log('[AssetService] CoinGecko results:', cryptoResults.length);
    results = [...results, ...cryptoResults];
  }

  if (!typeFilter || typeFilter === 'stock' || typeFilter === 'etf') {
    console.log('[AssetService] Searching stocks/ETFs from Alpha Vantage...');
    const stockResults = await searchStocksLive(query);
    console.log('[AssetService] Alpha Vantage results:', stockResults.length);
    results = [...results, ...stockResults];
  }

  console.log('[AssetService] Total results:', results.length);
  return results.slice(0, 50);
}

export async function searchCryptoLive(query: string): Promise<Asset[]> {
  console.log('[AssetService] searchCryptoLive calling CoinGecko API...');
  try {
    const results = await searchCoinsFromGecko(query);
    console.log('[AssetService] CoinGecko returned:', results.length, 'coins');
    return results.map(r => ({
      id: r.id,
      symbol: r.symbol.toUpperCase(),
      name: r.name,
      type: 'crypto' as const,
    }));
  } catch (error) {
    console.error('[AssetService] CoinGecko search failed:', error);
    return [];
  }
}

export async function searchStocksLive(query: string): Promise<Asset[]> {
  console.log('[AssetService] searchStocksLive calling Alpha Vantage...');
  try {
    const apiKey = await getApiKey();
    if (!apiKey) {
      console.log('[AssetService] No Alpha Vantage API key, using fallback');
      const { stocks, etfs } = await getAllAssets();
      const q = query.toLowerCase();
      const fallback = [...stocks, ...etfs].filter(
        a => a.name.toLowerCase().includes(q) || a.symbol.toLowerCase().includes(q)
      );
      return fallback;
    }
    
    const results = await searchSymbol(query);
    console.log('[AssetService] Alpha Vantage returned:', results.length, 'results');
    
    return results.map(r => ({
      id: r.symbol,
      symbol: r.symbol,
      name: r.name,
      type: (r.type?.toLowerCase().includes('etf') ? 'etf' : 'stock') as 'stock' | 'etf',
    }));
  } catch (error) {
    console.error('[AssetService] Alpha Vantage search failed:', error);
    return [];
  }
}

export async function clearAssetCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ASSET_CACHE_KEY);
    console.log('[AssetService] Cache cleared');
  } catch (error) {
    console.error('[AssetService] Failed to clear cache:', error);
  }
}