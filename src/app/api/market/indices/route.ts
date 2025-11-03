import { NextResponse } from 'next/server';

async function fetchQuote(url: string) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    
    // Defesa mais robusta contra estruturas inesperadas
    const result = json.chart?.result?.[0];
    return result?.meta || null;
  } catch (error) {
    console.error(`Erro ao buscar quote: ${error}`);
    return null;
  }
}

// 🎯 INTERFACE para tipagem correta
interface MarketIndex {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
  isPositive: boolean;
  category: string;
}

export async function GET() {
  try {
    // 🎯 ATUALIZAÇÃO: Busca dados para todas as 4 categorias
    const [
      // ÍNDICES
      ibov, spx, dji, ixic, ftse, n225,
      
      // MOEDAS
      usd, eur, gbp, jpy, btc, eth,
      
      // COMMODITIES
      wti, brent, gold, silver, copper, soy,
      
      // AÇÕES
      petr4, vale3, aapl, msft, tsla, amzn
      
    ] = await Promise.allSettled([
      // ÍNDICES
      fetchQuote('https://query1.finance.yahoo.com/v8/finance/chart/^BVSP?range=1d&interval=1d'),
      fetchQuote('https://query1.finance.yahoo.com/v8/finance/chart/^GSPC?range=1d&interval=1d'),
      fetchQuote('https://query1.finance.yahoo.com/v8/finance/chart/^DJI?range=1d&interval=1d'),
      fetchQuote('https://query1.finance.yahoo.com/v8/finance/chart/^IXIC?range=1d&interval=1d'),
      fetchQuote('https://query1.finance.yahoo.com/v8/finance/chart/^FTSE?range=1d&interval=1d'),
      fetchQuote('https://query1.finance.yahoo.com/v8/finance/chart/^N225?range=1d&interval=1d'),
      
      // MOEDAS
      fetchQuote('https://query1.finance.yahoo.com/v8/finance/chart/BRL=X?range=1d&interval=1d'),
      fetchQuote('https://query1.finance.yahoo.com/v8/finance/chart/EURBRL=X?range=1d&interval=1d'),
      fetchQuote('https://query1.finance.yahoo.com/v8/finance/chart/GBPBRL=X?range=1d&interval=1d'),
      fetchQuote('https://query1.finance.yahoo.com/v8/finance/chart/JPYBRL=X?range=1d&interval=1d'),
      fetchQuote('https://query1.finance.yahoo.com/v8/finance/chart/BTC-USD?range=1d&interval=1d'),
      fetchQuote('https://query1.finance.yahoo.com/v8/finance/chart/ETH-USD?range=1d&interval=1d'),
      
      // COMMODITIES
      fetchQuote('https://query1.finance.yahoo.com/v8/finance/chart/CL=F?range=1d&interval=1d'),
      fetchQuote('https://query1.finance.yahoo.com/v8/finance/chart/BZ=F?range=1d&interval=1d'),
      fetchQuote('https://query1.finance.yahoo.com/v8/finance/chart/GC=F?range=1d&interval=1d'),
      fetchQuote('https://query1.finance.yahoo.com/v8/finance/chart/SI=F?range=1d&interval=1d'),
      fetchQuote('https://query1.finance.yahoo.com/v8/finance/chart/HG=F?range=1d&interval=1d'),
      fetchQuote('https://query1.finance.yahoo.com/v8/finance/chart/ZS=F?range=1d&interval=1d'),
      
      // AÇÕES
      fetchQuote('https://query1.finance.yahoo.com/v8/finance/chart/PETR4.SA?range=1d&interval=1d'),
      fetchQuote('https://query1.finance.yahoo.com/v8/finance/chart/VALE3.SA?range=1d&interval=1d'),
      fetchQuote('https://query1.finance.yahoo.com/v8/finance/chart/AAPL?range=1d&interval=1d'),
      fetchQuote('https://query1.finance.yahoo.com/v8/finance/chart/MSFT?range=1d&interval=1d'),
      fetchQuote('https://query1.finance.yahoo.com/v8/finance/chart/TSLA?range=1d&interval=1d'),
      fetchQuote('https://query1.finance.yahoo.com/v8/finance/chart/AMZN?range=1d&interval=1d'),
    ]);

    const parseQuote = (result: PromiseSettledResult<any>, name: string, symbol: string, category: string): MarketIndex | null => {
      if (result.status !== 'fulfilled' || !result.value) return null;
      
      const meta = result.value;
      const last = meta.regularMarketPrice;
      const prev = meta.chartPreviousClose;
      
      // Verificação adicional para evitar NaN
      if (typeof last !== 'number' || typeof prev !== 'number') {
        return null;
      }
      
      const change = last - prev;
      const changePercent = prev !== 0 ? (change / prev) * 100 : 0;
      
      return {
        symbol,
        name,
        value: last,
        change,
        changePercent: Number(changePercent.toFixed(2)),
        isPositive: change >= 0,
        category
      };
    };

    // 🎯 ATUALIZAÇÃO: Construção do array final com todas as categorias
    const indices = [
      // ÍNDICES
      parseQuote(ibov, 'Ibovespa', 'IBOV', 'indices'),
      parseQuote(spx, 'S&P 500', 'SPX', 'indices'),
      parseQuote(dji, 'Dow Jones', 'DJI', 'indices'),
      parseQuote(ixic, 'NASDAQ', 'IXIC', 'indices'),
      parseQuote(ftse, 'FTSE 100', 'FTSE', 'indices'),
      parseQuote(n225, 'Nikkei 225', 'N225', 'indices'),
      
      // MOEDAS
      parseQuote(usd, 'Dólar Americano', 'USD', 'currencies'),
      parseQuote(eur, 'Euro', 'EUR', 'currencies'),
      parseQuote(gbp, 'Libra Esterlina', 'GBP', 'currencies'),
      parseQuote(jpy, 'Iene Japonês', 'JPY', 'currencies'),
      parseQuote(btc, 'Bitcoin', 'BTC', 'currencies'),
      parseQuote(eth, 'Ethereum', 'ETH', 'currencies'),
      
      // COMMODITIES
      parseQuote(wti, 'Petróleo WTI', 'WTI', 'commodities'),
      parseQuote(brent, 'Petróleo Brent', 'BRENT', 'commodities'),
      parseQuote(gold, 'Ouro', 'GOLD', 'commodities'),
      parseQuote(silver, 'Prata', 'SILVER', 'commodities'),
      parseQuote(copper, 'Cobre', 'COPPER', 'commodities'),
      parseQuote(soy, 'Soja', 'SOY', 'commodities'),
      
      // AÇÕES
      parseQuote(petr4, 'Petrobras', 'PETR4', 'stocks'),
      parseQuote(vale3, 'Vale', 'VALE3', 'stocks'),
      parseQuote(aapl, 'Apple', 'AAPL', 'stocks'),
      parseQuote(msft, 'Microsoft', 'MSFT', 'stocks'),
      parseQuote(tsla, 'Tesla', 'TSLA', 'stocks'),
      parseQuote(amzn, 'Amazon', 'AMZN', 'stocks'),
      
    ].filter((idx): idx is MarketIndex => idx !== null); // 🎯 CORREÇÃO: Type guard para remover null

    // 🎯 CORREÇÃO: Filtro seguro com type assertion
    const validIndices = indices as MarketIndex[];

    return NextResponse.json({ 
      indices: validIndices,
      timestamp: new Date().toISOString(),
      total: validIndices.length,
      categories: {
        currencies: validIndices.filter(idx => idx.category === 'currencies').length,
        indices: validIndices.filter(idx => idx.category === 'indices').length,
        commodities: validIndices.filter(idx => idx.category === 'commodities').length,
        stocks: validIndices.filter(idx => idx.category === 'stocks').length
      }
    }, { 
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
    
  } catch (error) {
    console.error('Erro ao buscar índices:', error);
    
    // 🎯 MELHORIA: Retorna dados mock em caso de erro
    const mockIndices = generateMockIndices();
    
    return NextResponse.json({ 
      indices: mockIndices,
      error: 'Usando dados mock devido a erro na API',
      timestamp: new Date().toISOString()
    }, { 
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    });
  }
}

// 🎯 NOVA FUNÇÃO: Gera dados mock para fallback
function generateMockIndices(): MarketIndex[] {
  return [
    // ÍNDICES
    { symbol: 'IBOV', name: 'Ibovespa', value: 149540.00, change: 760, changePercent: 0.51, isPositive: true, category: 'indices' },
    { symbol: 'SPX', name: 'S&P 500', value: 5480.00, change: 25.50, changePercent: 0.47, isPositive: true, category: 'indices' },
    { symbol: 'DJI', name: 'Dow Jones', value: 39127.00, change: 150.25, changePercent: 0.39, isPositive: true, category: 'indices' },
    { symbol: 'IXIC', name: 'NASDAQ', value: 17785.00, change: 120.75, changePercent: 0.68, isPositive: true, category: 'indices' },
    { symbol: 'FTSE', name: 'FTSE 100', value: 8175.00, change: -45.30, changePercent: -0.55, isPositive: false, category: 'indices' },
    { symbol: 'N225', name: 'Nikkei 225', value: 38630.00, change: 280.15, changePercent: 0.73, isPositive: true, category: 'indices' },
    
    // MOEDAS
    { symbol: 'USD', name: 'Dólar Americano', value: 5.45, change: 0.02, changePercent: 0.37, isPositive: true, category: 'currencies' },
    { symbol: 'EUR', name: 'Euro', value: 5.95, change: -0.01, changePercent: -0.17, isPositive: false, category: 'currencies' },
    { symbol: 'GBP', name: 'Libra Esterlina', value: 6.92, change: 0.03, changePercent: 0.44, isPositive: true, category: 'currencies' },
    { symbol: 'JPY', name: 'Iene Japonês', value: 0.034, change: 0.0001, changePercent: 0.29, isPositive: true, category: 'currencies' },
    { symbol: 'BTC', name: 'Bitcoin', value: 110320.00, change: 3880.0, changePercent: 3.65, isPositive: true, category: 'currencies' },
    { symbol: 'ETH', name: 'Ethereum', value: 3250.00, change: 85.50, changePercent: 2.70, isPositive: true, category: 'currencies' },
    
    // COMMODITIES
    { symbol: 'WTI', name: 'Petróleo WTI', value: 78.50, change: -1.20, changePercent: -1.51, isPositive: false, category: 'commodities' },
    { symbol: 'BRENT', name: 'Petróleo Brent', value: 82.75, change: -1.05, changePercent: -1.25, isPositive: false, category: 'commodities' },
    { symbol: 'GOLD', name: 'Ouro', value: 2345.00, change: 12.50, changePercent: 0.54, isPositive: true, category: 'commodities' },
    { symbol: 'SILVER', name: 'Prata', value: 29.40, change: 0.35, changePercent: 1.21, isPositive: true, category: 'commodities' },
    { symbol: 'COPPER', name: 'Cobre', value: 4.45, change: -0.08, changePercent: -1.77, isPositive: false, category: 'commodities' },
    { symbol: 'SOY', name: 'Soja', value: 1185.00, change: 5.25, changePercent: 0.45, isPositive: true, category: 'commodities' },
    
    // AÇÕES
    { symbol: 'PETR4', name: 'Petrobras', value: 38.50, change: 0.45, changePercent: 1.18, isPositive: true, category: 'stocks' },
    { symbol: 'VALE3', name: 'Vale', value: 68.20, change: -0.80, changePercent: -1.16, isPositive: false, category: 'stocks' },
    { symbol: 'AAPL', name: 'Apple', value: 214.50, change: 3.25, changePercent: 1.54, isPositive: true, category: 'stocks' },
    { symbol: 'MSFT', name: 'Microsoft', value: 442.00, change: 5.75, changePercent: 1.32, isPositive: true, category: 'stocks' },
    { symbol: 'TSLA', name: 'Tesla', value: 182.30, change: -2.15, changePercent: -1.17, isPositive: false, category: 'stocks' },
    { symbol: 'AMZN', name: 'Amazon', value: 183.75, change: 1.85, changePercent: 1.02, isPositive: true, category: 'stocks' },
  ];
}

// Adicione isso para suporte a CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}