import { NextResponse } from 'next/server';

interface MarketIndex {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
  isPositive: boolean;
  category: string;
}

interface YahooMeta {
  regularMarketPrice?: number;
  chartPreviousClose?: number;
}

const MARKET_SYMBOLS = {
  indices: [
    { url: '^BVSP', name: 'Ibovespa', symbol: 'IBOV' },
    { url: '^GSPC', name: 'S&P 500', symbol: 'SPX' },
    { url: '^DJI', name: 'Dow Jones', symbol: 'DJI' },
    { url: '^IXIC', name: 'NASDAQ', symbol: 'IXIC' },
    { url: '^FTSE', name: 'FTSE 100', symbol: 'FTSE' },
    { url: '^N225', name: 'Nikkei 225', symbol: 'N225' }
  ],
  currencies: [
    { url: 'BRL=X', name: 'Dólar Americano', symbol: 'USD' },
    { url: 'EURBRL=X', name: 'Euro', symbol: 'EUR' },
    { url: 'GBPBRL=X', name: 'Libra Esterlina', symbol: 'GBP' },
    { url: 'JPYBRL=X', name: 'Iene Japonês', symbol: 'JPY' },
    { url: 'BTC-USD', name: 'Bitcoin', symbol: 'BTC' },
    { url: 'ETH-USD', name: 'Ethereum', symbol: 'ETH' }
  ],
  commodities: [
    { url: 'CL=F', name: 'Petróleo WTI', symbol: 'WTI' },
    { url: 'BZ=F', name: 'Petróleo Brent', symbol: 'BRENT' },
    { url: 'GC=F', name: 'Ouro', symbol: 'GOLD' },
    { url: 'SI=F', name: 'Prata', symbol: 'SILVER' },
    { url: 'HG=F', name: 'Cobre', symbol: 'COPPER' },
    { url: 'ZS=F', name: 'Soja', symbol: 'SOY' }
  ],
  stocks: [
    { url: 'PETR4.SA', name: 'Petrobras', symbol: 'PETR4' },
    { url: 'VALE3.SA', name: 'Vale', symbol: 'VALE3' },
    { url: 'AAPL', name: 'Apple', symbol: 'AAPL' },
    { url: 'MSFT', name: 'Microsoft', symbol: 'MSFT' },
    { url: 'TSLA', name: 'Tesla', symbol: 'TSLA' },
    { url: 'AMZN', name: 'Amazon', symbol: 'AMZN' }
  ]
};

const MOCK_DATA: Record<string, Omit<MarketIndex, 'category'>> = {
  IBOV: { symbol: 'IBOV', name: 'Ibovespa', value: 129540.00, change: 1260, changePercent: 0.98, isPositive: true },
  SPX: { symbol: 'SPX', name: 'S&P 500', value: 5920.00, change: 35.50, changePercent: 0.60, isPositive: true },
  DJI: { symbol: 'DJI', name: 'Dow Jones', value: 43627.00, change: 210.25, changePercent: 0.48, isPositive: true },
  IXIC: { symbol: 'IXIC', name: 'NASDAQ', value: 19285.00, change: 145.75, changePercent: 0.76, isPositive: true },
  FTSE: { symbol: 'FTSE', name: 'FTSE 100', value: 8325.00, change: -35.30, changePercent: -0.42, isPositive: false },
  N225: { symbol: 'N225', name: 'Nikkei 225', value: 39130.00, change: 320.15, changePercent: 0.82, isPositive: true },
  
  USD: { symbol: 'USD', name: 'Dólar Americano', value: 5.72, change: 0.03, changePercent: 0.53, isPositive: true },
  EUR: { symbol: 'EUR', name: 'Euro', value: 6.22, change: -0.02, changePercent: -0.32, isPositive: false },
  GBP: { symbol: 'GBP', name: 'Libra Esterlina', value: 7.42, change: 0.04, changePercent: 0.54, isPositive: true },
  JPY: { symbol: 'JPY', name: 'Iene Japonês', value: 0.038, change: 0.0002, changePercent: 0.53, isPositive: true },
  BTC: { symbol: 'BTC', name: 'Bitcoin', value: 96520.00, change: 2880.0, changePercent: 3.08, isPositive: true },
  ETH: { symbol: 'ETH', name: 'Ethereum', value: 3580.00, change: 125.50, changePercent: 3.63, isPositive: true },
  
  WTI: { symbol: 'WTI', name: 'Petróleo WTI', value: 72.80, change: -0.95, changePercent: -1.29, isPositive: false },
  BRENT: { symbol: 'BRENT', name: 'Petróleo Brent', value: 76.45, change: -0.85, changePercent: -1.10, isPositive: false },
  GOLD: { symbol: 'GOLD', name: 'Ouro', value: 2658.00, change: 18.50, changePercent: 0.70, isPositive: true },
  SILVER: { symbol: 'SILVER', name: 'Prata', value: 31.25, change: 0.55, changePercent: 1.79, isPositive: true },
  COPPER: { symbol: 'COPPER', name: 'Cobre', value: 4.22, change: -0.06, changePercent: -1.40, isPositive: false },
  SOY: { symbol: 'SOY', name: 'Soja', value: 1058.00, change: 7.25, changePercent: 0.69, isPositive: true },
  
  PETR4: { symbol: 'PETR4', name: 'Petrobras', value: 40.85, change: 0.65, changePercent: 1.62, isPositive: true },
  VALE3: { symbol: 'VALE3', name: 'Vale', value: 58.40, change: -0.95, changePercent: -1.60, isPositive: false },
  AAPL: { symbol: 'AAPL', name: 'Apple', value: 231.50, change: 4.25, changePercent: 1.87, isPositive: true },
  MSFT: { symbol: 'MSFT', name: 'Microsoft', value: 426.00, change: 6.75, changePercent: 1.61, isPositive: true },
  TSLA: { symbol: 'TSLA', name: 'Tesla', value: 352.30, change: -3.15, changePercent: -0.89, isPositive: false },
  AMZN: { symbol: 'AMZN', name: 'Amazon', value: 196.75, change: 2.85, changePercent: 1.47, isPositive: true }
};

async function fetchQuote(url: string): Promise<YahooMeta | null> {
  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${url}?range=1d&interval=1d`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.chart?.result?.[0]?.meta || null;
  } catch (error) {
    return null;
  }
}

function parseQuote(
  result: PromiseSettledResult<YahooMeta | null>,
  name: string,
  symbol: string,
  category: string
): MarketIndex | null {
  if (result.status !== 'fulfilled' || !result.value) {
    return null;
  }

  const meta = result.value;
  const currentPrice = meta.regularMarketPrice;
  const previousClose = meta.chartPreviousClose;

  if (typeof currentPrice !== 'number' || typeof previousClose !== 'number') {
    return null;
  }

  const change = currentPrice - previousClose;
  const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;

  return {
    symbol,
    name,
    value: currentPrice,
    change,
    changePercent: Number(changePercent.toFixed(2)),
    isPositive: change >= 0,
    category
  };
}

function generateMockIndices(): MarketIndex[] {
  const allCategories = Object.entries(MARKET_SYMBOLS).flatMap(([category, symbols]) =>
    symbols.map(({ symbol }) => ({
      ...MOCK_DATA[symbol],
      category
    }))
  );

  return allCategories;
}

export async function GET() {
  try {
    const allSymbols = Object.entries(MARKET_SYMBOLS).flatMap(([category, symbols]) =>
      symbols.map(item => ({ ...item, category }))
    );

    const fetchPromises = allSymbols.map(({ url }) => fetchQuote(url));
    const results = await Promise.allSettled(fetchPromises);

    const indices = results
      .map((result, index) => {
        const { name, symbol, category } = allSymbols[index];
        return parseQuote(result, name, symbol, category);
      })
      .filter((item): item is MarketIndex => item !== null);

    const categoryCounts = {
      indices: indices.filter(idx => idx.category === 'indices').length,
      currencies: indices.filter(idx => idx.category === 'currencies').length,
      commodities: indices.filter(idx => idx.category === 'commodities').length,
      stocks: indices.filter(idx => idx.category === 'stocks').length
    };

    return NextResponse.json(
      {
        indices,
        timestamp: new Date().toISOString(),
        total: indices.length,
        categories: categoryCounts
      },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      }
    );
  } catch (error) {
    const mockIndices = generateMockIndices();

    return NextResponse.json(
      {
        indices: mockIndices,
        timestamp: new Date().toISOString(),
        total: mockIndices.length,
        source: 'fallback'
      },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}