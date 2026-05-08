const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

interface CoinGeckoPrice {
  mxn: number;
  usd: number;
}

export async function getCryptoPrice(coinId: string): Promise<CoinGeckoPrice | null> {
  const cacheKey = `price_${coinId}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const response = await fetch(
      `${COINGECKO_BASE}/simple/price?ids=${coinId}&vs_currencies=mxn,usd`
    );
    
    if (!response.ok) {
      console.error(`[CoinGecko] Error fetching ${coinId}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const price = data[coinId];

    if (!price) {
      console.error(`[CoinGecko] No data for ${coinId}`);
      return null;
    }

    const result = { mxn: price.mxn, usd: price.usd };
    cache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  } catch (error) {
    console.error(`[CoinGecko] Failed to fetch ${coinId}:`, error);
    return null;
  }
}

export async function getCryptoPrices(coinIds: string[]): Promise<Map<string, CoinGeckoPrice>> {
  const result = new Map<string, CoinGeckoPrice>();
  
  if (coinIds.length === 0) return result;

  const cacheKey = `price_batch_${coinIds.sort().join(',')}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const ids = coinIds.join(',');
    const response = await fetch(
      `${COINGECKO_BASE}/simple/price?ids=${ids}&vs_currencies=mxn,usd`
    );
    
    if (!response.ok) {
      console.error(`[CoinGecko] Batch fetch error: ${response.status}`);
      return result;
    }

    const data = await response.json();
    
    for (const coinId of coinIds) {
      const price = data[coinId];
      if (price) {
        result.set(coinId, { mxn: price.mxn, usd: price.usd });
      }
    }

    cache.set(cacheKey, { data: result, timestamp: Date.now() });
  } catch (error) {
    console.error(`[CoinGecko] Batch fetch failed:`, error);
  }

  return result;
}

export async function searchCoins(query: string): Promise<Array<{ id: string; name: string; symbol: string }>> {
  try {
    const response = await fetch(
      `${COINGECKO_BASE}/search?query=${encodeURIComponent(query)}`
    );
    
    if (!response.ok) return [];
    
    const data = await response.json();
    return (data.coins || []).slice(0, 10).map((c: any) => ({
      id: c.id,
      name: c.name,
      symbol: c.symbol.toUpperCase(),
    }));
  } catch (error) {
    console.error(`[CoinGecko] Search failed:`, error);
    return [];
  }
}

export function clearCache() {
  cache.clear();
}

export const COIN_IDS = {
  bitcoin: 'bitcoin',
  ethereum: 'ethereum',
  binancecoin: 'binancecoin',
  solana: 'solana',
  cardano: 'cardano',
  ripple: 'ripple',
  dogecoin: 'dogecoin',
  polkadot: 'polkadot',
  avalanche: 'avalanche-2',
  chainlink: 'chainlink',
} as const;