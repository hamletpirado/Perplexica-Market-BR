import { NextResponse } from 'next/server';

const symbolMapping: Record<string, string> = {
  'IBOV': '^BVSP',
  'SPX': '^GSPC',
  'DJI': '^DJI',
  'IXIC': '^IXIC',
  'FTSE': '^FTSE',
  'N225': '^N225',
  'USD': 'BRL=X',
  'EUR': 'EURBRL=X',
  'GBP': 'GBPBRL=X',
  'JPY': 'JPYBRL=X',
  'BTC': 'BTC-USD',
  'ETH': 'ETH-USD',
  'WTI': 'CL=F',
  'BRENT': 'BZ=F',
  'GOLD': 'GC=F',
  'SILVER': 'SI=F',
  'COPPER': 'HG=F',
  'SOY': 'ZS=F',
  'PETR4': 'PETR4.SA',
  'VALE3': 'VALE3.SA',
  'AAPL': 'AAPL',
  'MSFT': 'MSFT',
  'TSLA': 'TSLA',
  'AMZN': 'AMZN'
};

const timeframeMapping: Record<string, { range: string; interval: string }> = {
  '1D': { range: '1d', interval: '5m' },
  '1S': { range: '5d', interval: '1h' },
  '1M': { range: '1mo', interval: '1d' },
  '6M': { range: '6mo', interval: '1d' },
  '1A': { range: '1y', interval: '1d' },
  '5A': { range: '5y', interval: '1wk' },
  'Máx.': { range: 'max', interval: '1mo' }
};

const baseValues: Record<string, number> = {
  'IBOV': 129000, 'SPX': 5900, 'DJI': 43500, 'IXIC': 19200,
  'FTSE': 8300, 'N225': 39000, 'USD': 5.70, 'EUR': 6.20,
  'GBP': 7.40, 'JPY': 0.038, 'BTC': 95000, 'ETH': 3500,
  'WTI': 72.0, 'BRENT': 76.0, 'GOLD': 2650, 'SILVER': 31.0,
  'COPPER': 4.20, 'SOY': 1050, 'PETR4': 40.5, 'VALE3': 58.0,
  'AAPL': 230.0, 'MSFT': 425.0, 'TSLA': 350.0, 'AMZN': 195.0
};

interface ChartDataPoint {
  time: string;
  value: number;
  volume?: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
}

interface YahooChartResponse {
  chart?: {
    result?: Array<{
      timestamp?: number[];
      indicators?: {
        quote?: Array<{
          close?: number[];
          open?: number[];
          high?: number[];
          low?: number[];
          volume?: number[];
        }>;
      };
    }>;
  };
}

function formatTimeLabel(timestamp: number, range: string): string {
  const date = new Date(timestamp * 1000);
  
  const formatters: Record<string, Intl.DateTimeFormatOptions> = {
    '1d': { hour: '2-digit', minute: '2-digit', hour12: false },
    '5d': { weekday: 'short', day: '2-digit' },
    '1mo': { day: '2-digit', month: '2-digit' },
    '6mo': { day: '2-digit', month: '2-digit' },
    default: { month: 'short', year: '2-digit' }
  };

  const format = formatters[range] || formatters.default;
  return date.toLocaleString('pt-BR', format);
}

function processChartData(
  timestamps: number[],
  closePrices: number[],
  openPrices: number[],
  highPrices: number[],
  lowPrices: number[],
  volumes: number[],
  range: string
): ChartDataPoint[] {
  return timestamps
    .map((timestamp, index) => ({
      time: formatTimeLabel(timestamp, range),
      value: closePrices[index] || 0,
      close: closePrices[index] || 0,
      open: openPrices[index] || 0,
      high: highPrices[index] || 0,
      low: lowPrices[index] || 0,
      volume: volumes[index] || 0
    }))
    .filter(point => point.value > 0);
}

async function fetchYahooFinance(
  symbol: string,
  range: string,
  interval: string
): Promise<ChartDataPoint[]> {
  const mappedSymbol = symbolMapping[symbol] || symbol;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${mappedSymbol}?range=${range}&interval=${interval}`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json'
    },
    next: { revalidate: 60 }
  });

  if (!response.ok) {
    throw new Error(`Yahoo Finance API error: ${response.status}`);
  }

  const data: YahooChartResponse = await response.json();
  const result = data.chart?.result?.[0];

  if (!result || !result.timestamp || result.timestamp.length === 0) {
    throw new Error('Invalid or empty data from Yahoo Finance');
  }

  const timestamps = result.timestamp;
  const quote = result.indicators?.quote?.[0] || {};
  const closePrices = quote.close || [];
  const openPrices = quote.open || [];
  const highPrices = quote.high || [];
  const lowPrices = quote.low || [];
  const volumes = quote.volume || [];

  const chartData = processChartData(
    timestamps, 
    closePrices, 
    openPrices, 
    highPrices, 
    lowPrices, 
    volumes, 
    range
  );

  if (range === '1d' && chartData.length < 5) {
    throw new Error('Insufficient intraday data');
  }

  return chartData;
}

function getVolatility(symbol: string): number {
  if (symbol === 'BTC' || symbol === 'ETH') return 0.05;
  if (symbol.match(/USD|EUR|GBP|JPY/)) return 0.005;
  if (symbol === 'WTI' || symbol === 'BRENT') return 0.03;
  return 0.02;
}

function getDataPointsCount(period: string): number {
  const counts: Record<string, number> = {
    '1D': 65, '1S': 5, '1M': 20, '6M': 24, '1A': 12, '5A': 20
  };
  return counts[period] || 10;
}

function generateMockTimeLabel(index: number, period: string): string {
  if (period === '1D') {
    const hour = Math.floor(index / 10) + 10;
    const minute = (index % 10) * 6;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }
  
  const date = new Date();
  date.setDate(date.getDate() - (getDataPointsCount(period) - index));
  
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit'
  });
}

function generateMockData(symbol: string, period: string): ChartDataPoint[] {
  const baseValue = baseValues[symbol] || 1000;
  const dataPoints = getDataPointsCount(period);
  const volatility = getVolatility(symbol);
  const precision = symbol === 'JPY' ? 4 : symbol.match(/USD|EUR|GBP/) ? 3 : 2;

  const getBaseVolume = (sym: string): number => {
    if (sym === 'BTC' || sym === 'ETH') return 50000000;
    if (sym.match(/USD|EUR|GBP|JPY/)) return 0;
    if (sym === 'IBOV' || sym === 'SPX' || sym === 'DJI') return 0;
    return 10000000;
  };

  const baseVolume = getBaseVolume(symbol);

  return Array.from({ length: dataPoints }, (_, i) => {
    const trend = Math.sin(i * 0.3) * 0.5;
    const noise = (Math.random() - 0.5) * volatility;
    const close = baseValue * (1 + trend + noise);
    
    const dailyVolatility = volatility * 0.5;
    const open = close * (1 + (Math.random() - 0.5) * dailyVolatility);
    const high = Math.max(open, close) * (1 + Math.random() * dailyVolatility);
    const low = Math.min(open, close) * (1 - Math.random() * dailyVolatility);
    const volume = baseVolume > 0 ? Math.floor(baseVolume * (0.8 + Math.random() * 0.4)) : 0;

    return {
      time: generateMockTimeLabel(i, period),
      value: Number(close.toFixed(precision)),
      close: Number(close.toFixed(precision)),
      open: Number(open.toFixed(precision)),
      high: Number(high.toFixed(precision)),
      low: Number(low.toFixed(precision)),
      volume
    };
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'IBOV';
  const period = searchParams.get('period') || '1D';

  const timeframeConfig = timeframeMapping[period] || timeframeMapping['1D'];

  try {
    const chartData = await fetchYahooFinance(
      symbol,
      timeframeConfig.range,
      timeframeConfig.interval
    );

    return NextResponse.json(
      {
        data: chartData,
        symbol,
        period,
        source: 'yahoo'
      },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
        }
      }
    );
  } catch (error) {
    const mockData = generateMockData(symbol, period);

    return NextResponse.json(
      {
        data: mockData,
        symbol,
        period,
        source: 'fallback',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache'
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