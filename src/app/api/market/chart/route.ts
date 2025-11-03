import { NextResponse } from 'next/server';

// 🎯 MAPEAMENTO COMPLETO DE SÍMBOLOS PARA TODAS AS CATEGORIAS
const symbolMapping: Record<string, string> = {
  // ÍNDICES
  'IBOV': '^BVSP',
  'SPX': '^GSPC',
  'DJI': '^DJI',
  'IXIC': '^IXIC',
  'FTSE': '^FTSE',
  'N225': '^N225',
  
  // MOEDAS
  'USD': 'BRL=X',
  'EUR': 'EURBRL=X',
  'GBP': 'GBPBRL=X',
  'JPY': 'JPYBRL=X',
  'BTC': 'BTC-USD',
  'ETH': 'ETH-USD',
  
  // COMMODITIES
  'WTI': 'CL=F',
  'BRENT': 'BZ=F',
  'GOLD': 'GC=F',
  'SILVER': 'SI=F',
  'COPPER': 'HG=F',
  'SOY': 'ZS=F',
  
  // AÇÕES
  'PETR4': 'PETR4.SA',
  'VALE3': 'VALE3.SA',
  'AAPL': 'AAPL',
  'MSFT': 'MSFT',
  'TSLA': 'TSLA',
  'AMZN': 'AMZN'
};

// 🎯 CORREÇÃO: Mapeamento de timeframe para parâmetros do Yahoo
const timeframeMapping: Record<string, { range: string; interval: string }> = {
  '1D': { range: '1d', interval: '5m' }, // Mudado para 5m para mais estabilidade
  '1S': { range: '5d', interval: '1d' },
  '1M': { range: '1mo', interval: '1d' },
  '6M': { range: '6mo', interval: '1d' },
  '1A': { range: '1y', interval: '1d' },
  '5A': { range: '5y', interval: '1wk' },
  'Máx.': { range: 'max', interval: '1mo' }
};

interface ChartDataPoint {
  time: string;
  value: number;
}

// 🎯 MELHORIA: Função para processar timestamps de forma mais robusta
function processTimestamps(timestamps: number[], closePrices: number[], range: string): ChartDataPoint[] {
  return timestamps.map((timestamp: number, index: number) => {
    const date = new Date(timestamp * 1000);
    let timeLabel = '';
    
    if (range === '1d') {
      // Para intraday, mostra horas no formato HH:MM
      timeLabel = date.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } else if (range === '5d') {
      // Para 1 semana, mostra dias da semana
      timeLabel = date.toLocaleDateString('pt-BR', { 
        weekday: 'short',
        day: '2-digit'
      });
    } else if (range === '1mo' || range === '6mo') {
      // Para 1 mês e 6 meses, mostra datas
      timeLabel = date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit' 
      });
    } else {
      // Para períodos maiores, mostra meses/anos
      timeLabel = date.toLocaleDateString('pt-BR', { 
        month: 'short',
        year: '2-digit'
      });
    }
    
    return {
      time: timeLabel,
      value: closePrices[index] || 0
    };
  }).filter((point: ChartDataPoint, index: number) => {
    // Remove pontos sem valor e faz amostragem para não sobrecarregar
    return point.value > 0 && index % 1 === 0; // Mantém todos os pontos, ajuste se necessário
  });
}

async function fetchChartData(symbol: string, range: string, interval: string): Promise<ChartDataPoint[]> {
  try {
    // Usa o símbolo mapeado ou o original
    const mappedSymbol = symbolMapping[symbol] || symbol;
    
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${mappedSymbol}?range=${range}&interval=${interval}`;
    
    console.log(`[API Chart] Buscando dados para: ${symbol} (${mappedSymbol}) com range: ${range}, interval: ${interval}`);

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      },
      next: { revalidate: 60 } // Cache de 60 segundos
    });
    
    if (!res.ok) {
      console.log(`[API Chart] Erro na requisição externa (${res.status}): ${res.statusText}`);
      throw new Error(`Erro HTTP: ${res.status}`);
    }
    
    const json = await res.json();
    
    const result = json.chart?.result?.[0];
    if (!result) {
      console.log('[API Chart] Estrutura de dados inválida:', json);
      throw new Error('Estrutura de dados inválida da API');
    }

    const timestamps = result.timestamp || [];
    const quotes = result.indicators?.quote?.[0] || {};
    const closePrices = quotes.close || [];

    console.log(`[API Chart] Dados recebidos: ${timestamps.length} pontos para ${symbol}`);

    if (timestamps.length === 0) {
      throw new Error('Nenhum dado retornado pela API');
    }

    // Processa os dados para o formato do gráfico
    const chartData = processTimestamps(timestamps, closePrices, range);

    // 🎯 CORREÇÃO: Para dados intraday, garante que temos dados suficientes
    if (range === '1d' && chartData.length < 5) {
      console.log('[API Chart] Dados intraday insuficientes, usando fallback');
      throw new Error('Dados intraday insuficientes');
    }

    return chartData;
  } catch (error) {
    console.error('[API Chart] Erro ao buscar dados do gráfico:', error);
    throw error;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'IBOV';
  const period = searchParams.get('period') || '1D';

  console.log(`[API Chart] Requisição recebida - symbol: ${symbol}, period: ${period}`);

  try {
    const timeframeConfig = timeframeMapping[period] || timeframeMapping['1D'];
    
    const chartData = await fetchChartData(symbol, timeframeConfig.range, timeframeConfig.interval);

    console.log(`[API Chart] Dados processados: ${chartData.length} pontos para ${symbol}`);

    return NextResponse.json({ 
      data: chartData,
      symbol,
      period,
      source: 'yahoo'
    }, { 
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    });

  } catch (error) {
    console.error('[API Chart] Erro geral:', error);
    
    // 🎯 MELHORIA: Retorna dados mock mais realistas
    const mockData = generateMockData(symbol, period);
    
    return NextResponse.json({ 
      data: mockData,
      error: 'Usando dados mock devido a erro na API externa',
      symbol: symbol,
      period: period,
      source: 'mock'
    }, { 
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache'
      }
    });
  }
}

// 🎯 MELHORIA: Função para gerar dados mock específicos para cada tipo de ativo e período
function generateMockData(symbol: string, period: string): ChartDataPoint[] {
  // Valores base diferentes para cada categoria
  const baseValues: Record<string, number> = {
    // Índices
    'IBOV': 149000,
    'SPX': 5480,
    'DJI': 39100,
    'IXIC': 17700,
    'FTSE': 8150,
    'N225': 38500,
    
    // Moedas
    'USD': 5.45,
    'EUR': 5.95,
    'GBP': 6.90,
    'JPY': 0.034,
    'BTC': 110000,
    'ETH': 3200,
    
    // Commodities
    'WTI': 78.0,
    'BRENT': 82.0,
    'GOLD': 2340,
    'SILVER': 29.0,
    'COPPER': 4.40,
    'SOY': 1180,
    
    // Ações
    'PETR4': 38.0,
    'VALE3': 68.0,
    'AAPL': 214.0,
    'MSFT': 440.0,
    'TSLA': 180.0,
    'AMZN': 182.0
  };

  const baseValue = baseValues[symbol] || 1000;
  
  // 🎯 CORREÇÃO: Número de pontos baseado no período
  let dataPoints = 65; // padrão para 1D
  
  switch (period) {
    case '1D': dataPoints = 65; break; // 6.5 horas de trading
    case '1S': dataPoints = 5; break;  // 5 dias
    case '1M': dataPoints = 20; break; // ~20 dias úteis
    case '6M': dataPoints = 24; break; // ~24 semanas
    case '1A': dataPoints = 12; break; // 12 meses
    case '5A': dataPoints = 20; break; // 20 trimestres
    default: dataPoints = 10;
  }

  const data: ChartDataPoint[] = [];

  // Determina a volatilidade baseado no tipo de ativo
  let volatility = 0.02; // 2% padrão
  if (symbol === 'BTC' || symbol === 'ETH') volatility = 0.05; // 5% para cripto
  if (symbol.includes('USD') || symbol.includes('EUR') || symbol.includes('JPY')) volatility = 0.005; // 0.5% para moedas
  if (symbol === 'WTI' || symbol === 'BRENT') volatility = 0.03; // 3% para petróleo

  // 🎯 CORREÇÃO: Gera timestamps realistas baseados no período
  for (let i = 0; i < dataPoints; i++) {
    let timeLabel = '';
    
    if (period === '1D') {
      // Para intraday: horário de trading 10h-17h
      const hour = Math.floor(i / 10) + 10;
      const minute = (i % 10) * 6;
      timeLabel = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    } else {
      // Para outros períodos, usa labels genéricos
      timeLabel = `Ponto ${i + 1}`;
    }

    const trend = Math.sin(i * 0.3) * 0.5; // Tendência suave
    const noise = (Math.random() - 0.5) * volatility;
    const value = baseValue * (1 + trend + noise);
    
    data.push({
      time: timeLabel,
      value: Number(value.toFixed(symbol === 'JPY' ? 4 : (symbol.includes('USD') || symbol.includes('EUR') || symbol.includes('GBP')) ? 3 : 2))
    });
  }

  console.log(`[API Chart] Gerados ${data.length} pontos mock para ${symbol} (${period})`);
  
  return data;
}

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