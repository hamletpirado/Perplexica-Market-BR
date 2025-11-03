// ============================================
// FILE: src/components/Discover/FinancialChart.tsx (DADOS POR MINUTO - 1D)
// ============================================
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock } from 'lucide-react';

interface MarketIndex {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
  isPositive: boolean;
  category: string;
}

interface ChartDataPoint {
  time: string;
  value: number;
}

const FinancialChart = () => {
  const [activeTab, setActiveTab] = useState('indices');
  const [selectedIndex, setSelectedIndex] = useState('IBOV');
  const [timeframe, setTimeframe] = useState('1D');
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [filteredIndices, setFilteredIndices] = useState<MarketIndex[]>([]);
  const [loading, setLoading] = useState(false);
  const [chartLoading, setChartLoading] = useState(false);
  const [currentValue, setCurrentValue] = useState<number | null>(null);
  const [yAxisDomain, setYAxisDomain] = useState<[number, number] | ['auto', 'auto']>(['auto', 'auto']);
  const [animationKey, setAnimationKey] = useState(0);

  // 🎯 DADOS ATUALIZADOS SEM COMMODITIES
  const mockIndices: MarketIndex[] = [
    // ÍNDICES (indices)
    { symbol: 'IBOV', name: 'Ibovespa', value: 149540.00, change: 760, changePercent: 0.51, isPositive: true, category: 'indices' },
    { symbol: 'SPX', name: 'S&P 500', value: 5480.00, change: 25.50, changePercent: 0.47, isPositive: true, category: 'indices' },
    { symbol: 'DJI', name: 'Dow Jones', value: 39127.00, change: 150.25, changePercent: 0.39, isPositive: true, category: 'indices' },
    { symbol: 'IXIC', name: 'NASDAQ', value: 17785.00, change: 120.75, changePercent: 0.68, isPositive: true, category: 'indices' },
    { symbol: 'FTSE', name: 'FTSE 100', value: 8175.00, change: -45.30, changePercent: -0.55, isPositive: false, category: 'indices' },
    { symbol: 'N225', name: 'Nikkei 225', value: 38630.00, change: 280.15, changePercent: 0.73, isPositive: true, category: 'indices' },
    
    // MOEDAS (currencies)
    { symbol: 'USD', name: 'Dólar Americano', value: 5.45, change: 0.02, changePercent: 0.37, isPositive: true, category: 'currencies' },
    { symbol: 'EUR', name: 'Euro', value: 5.95, change: -0.01, changePercent: -0.17, isPositive: false, category: 'currencies' },
    { symbol: 'GBP', name: 'Libra Esterlina', value: 6.92, change: 0.03, changePercent: 0.44, isPositive: true, category: 'currencies' },
    { symbol: 'JPY', name: 'Iene Japonês', value: 0.034, change: 0.0001, changePercent: 0.29, isPositive: true, category: 'currencies' },
    { symbol: 'BTC', name: 'Bitcoin', value: 110320.00, change: 3880.0, changePercent: 3.65, isPositive: true, category: 'currencies' },
    { symbol: 'ETH', name: 'Ethereum', value: 3250.00, change: 85.50, changePercent: 2.70, isPositive: true, category: 'currencies' },
    
    // AÇÕES (stocks)
    { symbol: 'PETR4', name: 'Petrobras', value: 38.50, change: 0.45, changePercent: 1.18, isPositive: true, category: 'stocks' },
    { symbol: 'VALE3', name: 'Vale', value: 68.20, change: -0.80, changePercent: -1.16, isPositive: false, category: 'stocks' },
    { symbol: 'AAPL', name: 'Apple', value: 214.50, change: 3.25, changePercent: 1.54, isPositive: true, category: 'stocks' },
    { symbol: 'MSFT', name: 'Microsoft', value: 442.00, change: 5.75, changePercent: 1.32, isPositive: true, category: 'stocks' },
    { symbol: 'TSLA', name: 'Tesla', value: 182.30, change: -2.15, changePercent: -1.17, isPositive: false, category: 'stocks' },
    { symbol: 'AMZN', name: 'Amazon', value: 183.75, change: 1.85, changePercent: 1.02, isPositive: true, category: 'stocks' },
  ];

  // 🎯 CONFIGURAÇÃO DO EIXO X POR TIMEFRAME (PRÁTICA DE MERCADO)
  const getXAxisConfig = () => {
    switch (timeframe) {
      case '1D':
        // Intraday: mostrar horas do pregão
        return {
          interval: 12 as const,
          tickFormatter: (value: string) => {
            // Formato HH:MM ou DD/MM HH:MM
            if (value.includes(':')) {
              const timePart = value.includes(' ') ? value.split(' ')[1] : value;
              const [hour] = timePart.split(':');
              return `${hour}h`;
            }
            return value;
          }
        };
      
      case '1S':
        // 1 Semana: formato DD/MM ou dias da semana
        return {
          interval: 0 as const,
          tickFormatter: (value: string) => {
            // Se for DD/MM, converte para dia da semana
            if (value.match(/^\d{2}\/\d{2}/)) {
              const [day, month] = value.split('/');
              return `${day}/${month}`;
            }
            // Mantém dias da semana abreviados
            const days: Record<string, string> = {
              'Seg': 'Seg', 'Ter': 'Ter', 'Qua': 'Qua', 
              'Qui': 'Qui', 'Sex': 'Sex'
            };
            return days[value] || value;
          },
        };
      
      case '1M':
        // 1 Mês: mostrar apenas alguns dias
        return {
          interval: 4 as const, // Mostra ~1 por semana
          tickFormatter: (value: string) => {
            if (value.match(/^\d{2}\/\d{2}/)) {
              const [day, month] = value.split('/');
              return `${day}/${month}`;
            }
            return value.replace('Sem ', 'S');
          },
        };
      
      case '6M':
        // 6 Meses: mostrar apenas primeiros dias de cada mês
        return {
          interval: 20 as const, // Reduz drasticamente os pontos
          tickFormatter: (value: string) => {
            if (value.match(/^\d{2}\/\d{2}/)) {
              const [day, month] = value.split('/');
              const monthNames = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
                                  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
              const monthName = monthNames[parseInt(month)] || month;
              
              // Mostra apenas se for início do mês (dia <= 5) ou múltiplo de 15
              if (parseInt(day) <= 5 || parseInt(day) === 15) {
                return monthName;
              }
              return '';
            }
            return value;
          },
        };
      
      case '1A':
        // 1 Ano: mostrar meses
        return {
          interval: 20 as const,
          tickFormatter: (value: string) => {
            if (value.match(/^\d{2}\/\d{2}/)) {
              const [day, month] = value.split('/');
              const monthNames = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
                                  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
              
              // Mostra apenas início de cada mês
              if (parseInt(day) <= 5) {
                return monthNames[parseInt(month)] || month;
              }
              return '';
            }
            
            const monthAbbrev: Record<string, string> = {
              'Jan': 'Jan', 'Fev': 'Fev', 'Mar': 'Mar', 
              'Abr': 'Abr', 'Mai': 'Mai', 'Jun': 'Jun',
              'Jul': 'Jul', 'Ago': 'Ago', 'Set': 'Set', 
              'Out': 'Out', 'Nov': 'Nov', 'Dez': 'Dez'
            };
            return monthAbbrev[value] || value;
          },
        };
      
      case '5A':
        // 5 Anos: mostrar todos os meses
        return {
          interval: 'preserveStartEnd' as const,
          tickFormatter: (value: string) => {
            // Formato: "mês. de ano" -> extrair mês e ano
            const match = value.match(/^([a-z]+)\.\s*de\s*(\d{2})$/i);
            if (match) {
              const [, month, year] = match;
              const monthMap: Record<string, string> = {
                'jan': 'Jan', 'fev': 'Fev', 'mar': 'Mar', 'abr': 'Abr',
                'mai': 'Mai', 'jun': 'Jun', 'jul': 'Jul', 'ago': 'Ago',
                'set': 'Set', 'out': 'Out', 'nov': 'Nov', 'dez': 'Dez'
              };
              
              const monthName = month.toLowerCase();
              const monthAbbrev = monthMap[monthName];
              
              // Mostrar todos os meses com formato compacto
              return `${monthAbbrev}/${year}`;
            }
            
            // Se for data DD/MM/YYYY, extrai mês e ano
            if (value.match(/^\d{2}\/\d{2}\/\d{4}/)) {
              const [day, month, year] = value.split('/');
              const monthNames = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
                                  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
              
              return `${monthNames[parseInt(month)]}/${year.slice(-2)}`;
            }
            
            // Se for ano direto (fallback)
            if (/^\d{4}$/.test(value)) {
              return `'${value.slice(-2)}`;
            }
            
            return value;
          },
        };
      
      default:
        // Máx.: formato adaptativo
        return {
          interval: 'preserveStartEnd' as const,
          tickFormatter: (value: string) => {
            if (value.match(/^\d{2}\/\d{2}\/\d{4}/)) {
              const year = value.split('/')[2];
              return `'${year.slice(-2)}`;
            }
            if (/^\d{4}$/.test(value)) {
              return `'${value.slice(-2)}`;
            }
            return value;
          },
        };
    }
  };

  // 🎯 FUNÇÃO: Gera dados realistas para diferentes timeframes
  function generateMockChartData(min: number, max: number, period: string, isCurrency: boolean = false): Record<string, ChartDataPoint[]> {
    
    if (period === '1D') {
      // 🎯 DADOS POR MINUTO PARA 1D - Horário real do pregão B3 (10h às 17h)
      const baseData1D = Array.from({ length: 65 }, (_, i) => {
        const hour = Math.floor(i / 10) + 10; // 10h às 16h
        const minute = (i % 10) * 6; // 0, 6, 12, 18, 24, 30, 36, 42, 48, 54
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        // Variação mais realista baseada no horário de mercado
        const marketOpenEffect = hour === 10 ? -0.002 : hour === 16 ? 0.001 : 0;
        const baseValue = min + (max - min) * 0.5;
        const variation = (Math.sin(i * 0.1) + (Math.random() - 0.5) * 0.3 + marketOpenEffect) * (max - min) * 0.005;
        const value = Number((baseValue + variation).toFixed(isCurrency ? 3 : 2));
        
        return { time, value };
      });

      return { '1D': baseData1D };
    }

    // Dados para outros períodos (estrutura básica)
    const generatePeriodData = (points: number, labels: string[]) => 
      Array.from({ length: points }, (_, i) => ({
        time: labels[i] || `Ponto ${i + 1}`,
        value: Number((min + (Math.random() * (max - min))).toFixed(isCurrency ? 3 : 2))
      }));

    // 🎯 CORREÇÃO: Labels específicos para cada período
    return {
      '1D': generatePeriodData(5, ['10h', '11h', '12h', '13h', '14h']),
      '1S': generatePeriodData(5, ['Seg', 'Ter', 'Qua', 'Qui', 'Sex']),
      '1M': generatePeriodData(4, ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4']),
      '6M': generatePeriodData(6, ['Jan 15', 'Fev 15', 'Mar 15', 'Abr 15', 'Mai 15', 'Jun 15']),
      '1A': generatePeriodData(12, ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']),
      '5A': generatePeriodData(5, ['2020', '2021', '2022', '2023', '2024']),
      'Máx.': generatePeriodData(5, ['2019', '2020', '2021', '2022', '2023']),
    };
  }

  // 🎯 FUNÇÃO: Calcula o domínio do eixo Y
  const calculateYAxisDomain = useCallback((data: ChartDataPoint[]): [number, number] | ['auto', 'auto'] => {
    if (data.length === 0) return ['auto', 'auto'];

    const values = data.map(p => p.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    const range = maxValue - minValue;
    const margin = Math.max(range * 0.05, 0.01);

    const finalMin = minValue - margin;
    const finalMax = maxValue + margin;

    return [finalMin, finalMax];
  }, []);

  // 🎯 DADOS DE GRÁFICO MOCK ATUALIZADOS
  const mockChartDataSets: Record<string, Record<string, ChartDataPoint[]>> = {
    'IBOV': generateMockChartData(148000, 150000, '1D'),
    'SPX': generateMockChartData(5450, 5490, '1D'),
    'DJI': generateMockChartData(39000, 39200, '1D'),
    'USD': generateMockChartData(5.40, 5.47, '1D', true),
    'EUR': generateMockChartData(5.92, 5.97, '1D', true),
    'BTC': generateMockChartData(106000, 111000, '1D'),
    'PETR4': generateMockChartData(37.5, 39.0, '1D', true),
    'VALE3': generateMockChartData(67.5, 69.0, '1D', true),
    'AAPL': generateMockChartData(210, 215, '1D'),
    
    // 🎯 ADICIONAR DADOS PARA OUTROS TIMEFRAMES
    ...Object.fromEntries(
      ['IBOV', 'SPX', 'DJI', 'USD', 'EUR', 'BTC', 'PETR4', 'VALE3', 'AAPL'].map(symbol => [
        symbol,
        {
          '1D': generateMockChartData(
            symbol === 'IBOV' ? 148000 : symbol === 'SPX' ? 5450 : symbol === 'DJI' ? 39000 : 
            symbol === 'USD' ? 5.40 : symbol === 'EUR' ? 5.92 : symbol === 'BTC' ? 106000 :
            symbol === 'PETR4' ? 37.5 : symbol === 'VALE3' ? 67.5 : 210,
            symbol === 'IBOV' ? 150000 : symbol === 'SPX' ? 5490 : symbol === 'DJI' ? 39200 : 
            symbol === 'USD' ? 5.47 : symbol === 'EUR' ? 5.97 : symbol === 'BTC' ? 111000 :
            symbol === 'PETR4' ? 39.0 : symbol === 'VALE3' ? 69.0 : 215,
            '1D',
            ['USD', 'EUR', 'PETR4', 'VALE3'].includes(symbol)
          )['1D'],
          '6M': generateMockChartData(
            symbol === 'IBOV' ? 140000 : symbol === 'SPX' ? 5200 : symbol === 'DJI' ? 38000 : 
            symbol === 'USD' ? 5.20 : symbol === 'EUR' ? 5.70 : symbol === 'BTC' ? 90000 :
            symbol === 'PETR4' ? 35.0 : symbol === 'VALE3' ? 65.0 : 200,
            symbol === 'IBOV' ? 155000 : symbol === 'SPX' ? 5600 : symbol === 'DJI' ? 40000 : 
            symbol === 'USD' ? 5.60 : symbol === 'EUR' ? 6.10 : symbol === 'BTC' ? 120000 :
            symbol === 'PETR4' ? 42.0 : symbol === 'VALE3' ? 72.0 : 230,
            '6M',
            ['USD', 'EUR', 'PETR4', 'VALE3'].includes(symbol)
          )['6M'],
          '1A': generateMockChartData(
            symbol === 'IBOV' ? 130000 : symbol === 'SPX' ? 5000 : symbol === 'DJI' ? 35000 : 
            symbol === 'USD' ? 5.00 : symbol === 'EUR' ? 5.50 : symbol === 'BTC' ? 80000 :
            symbol === 'PETR4' ? 32.0 : symbol === 'VALE3' ? 60.0 : 180,
            symbol === 'IBOV' ? 160000 : symbol === 'SPX' ? 5800 : symbol === 'DJI' ? 42000 : 
            symbol === 'USD' ? 5.80 : symbol === 'EUR' ? 6.30 : symbol === 'BTC' ? 130000 :
            symbol === 'PETR4' ? 45.0 : symbol === 'VALE3' ? 75.0 : 250,
            '1A',
            ['USD', 'EUR', 'PETR4', 'VALE3'].includes(symbol)
          )['1A']
        }
      ])
    )
  };

  // 🎯 BUSCA ÍNDICES DA API
  const fetchIndices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/market/indices', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (res.ok) {
        const data = await res.json();
        const apiIndices = data.indices || [];
        
        if (apiIndices.length > 0) {
          setIndices(apiIndices);
        } else {
          setIndices(mockIndices);
        }
      } else {
        setIndices(mockIndices);
      }
    } catch (error) {
      console.error('Erro ao buscar índices:', error);
      setIndices(mockIndices);
    } finally {
      setLoading(false);
    }
  }, []);

  // 🎯 BUSCA DADOS DO GRÁFICO
  const fetchChartData = useCallback(async (symbol: string, period: string) => {
    setChartLoading(true);
    try {
      console.log(`[Frontend] Buscando gráfico para: ${symbol} período: ${period}`);
      
      const res = await fetch(`/api/market/chart?symbol=${symbol}&period=${period}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      let chartDataToSet: ChartDataPoint[] = [];

      if (res.ok) {
        const data = await res.json();
        chartDataToSet = data.data || mockChartDataSets[symbol]?.[period] || mockChartDataSets['IBOV']['1D'];
        console.log(`[Frontend] Dados recebidos para ${symbol}:`, chartDataToSet.length, 'pontos');
      } else {
        chartDataToSet = mockChartDataSets[symbol]?.[period] || mockChartDataSets['IBOV']['1D'];
        console.log(`[Frontend] Usando dados mock para ${symbol}`);
      }

      // Otimização: reduz densidade para melhor performance
      if (period === '1D' && chartDataToSet.length > 40) {
        chartDataToSet = chartDataToSet.filter((_, index) => index % 2 === 0);
      }

      setChartData(chartDataToSet);
      setYAxisDomain(calculateYAxisDomain(chartDataToSet));
      setAnimationKey(prev => prev + 1);
      
      const selectedAsset = indices.find(idx => idx.symbol === symbol) || mockIndices.find(idx => idx.symbol === symbol);
      if (selectedAsset) {
        setCurrentValue(selectedAsset.value);
      }
      
    } catch (error) {
      console.error('Erro ao buscar dados do gráfico:', error);
      const fallbackData = mockChartDataSets[symbol]?.[period] || mockChartDataSets['IBOV']['1D'];
      setChartData(fallbackData);
      setYAxisDomain(calculateYAxisDomain(fallbackData));
      setAnimationKey(prev => prev + 1);
      
      const selectedAsset = indices.find(idx => idx.symbol === symbol) || mockIndices.find(idx => idx.symbol === symbol);
      if (selectedAsset) {
        setCurrentValue(selectedAsset.value);
      }
    } finally {
      setChartLoading(false);
    }
  }, [calculateYAxisDomain, indices]);

  // 🎯 EFEITOS E HANDLERS
  useEffect(() => {
    const filtered = indices.filter(index => index.category === activeTab);
    setFilteredIndices(filtered);
    
    if (filtered.length > 0 && !filtered.find(idx => idx.symbol === selectedIndex)) {
      const firstSymbol = filtered[0].symbol;
      setSelectedIndex(firstSymbol);
    }
  }, [activeTab, indices, selectedIndex]);

  useEffect(() => {
    const initializeData = async () => {
      await fetchIndices();
    };
    initializeData();

    const interval = setInterval(() => {
      fetchIndices();
    }, 300000);

    return () => clearInterval(interval);
  }, [fetchIndices]);

  const handleIndexClick = useCallback((symbol: string) => {
    console.log(`[Frontend] Usuário clicou em: ${symbol}`);
    setSelectedIndex(symbol);
    setChartLoading(true);
    fetchChartData(symbol, timeframe);
  }, [fetchChartData, timeframe]);

  const handleTimeframeChange = useCallback((period: string) => {
    console.log(`[Frontend] Mudança de timeframe para: ${period}`);
    setTimeframe(period);
    setChartLoading(true);
    fetchChartData(selectedIndex, period);
  }, [selectedIndex, fetchChartData]);

  const handleTabChange = useCallback((tabKey: string) => {
    console.log(`[Frontend] Mudança de aba para: ${tabKey}`);
    setActiveTab(tabKey);
  }, []);

  // 🎯 CONFIGURAÇÃO DAS ABAS
  const tabs = [
    { key: 'currencies', label: 'Moedas' },
    { key: 'indices', label: 'Índices' },
    { key: 'stocks', label: 'Ações' },
  ];

  const timeframes = ['1D', '1S', '1M', '6M', '1A', '5A', 'Máx.'];

  // 🎯 TOOLTIP PERSONALIZADO
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const selectedAsset = filteredIndices.find(idx => idx.symbol === selectedIndex) || 
                           mockIndices.find(idx => idx.symbol === selectedIndex);
      
      return (
        <div className="bg-black/90 text-white px-3 py-2 rounded-lg text-sm border border-gray-600">
          <p className="font-semibold">{selectedAsset?.name}</p>
          <p className="font-medium">
            {payload[0].value.toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <p className="text-xs opacity-80">{payload[0].payload.time}</p>
        </div>
      );
    }
    return null;
  };

  const xAxisConfig = getXAxisConfig();

  return (
    <div className="bg-white dark:bg-dark-secondary rounded-xl shadow-sm border border-light-200/20 dark:border-dark-200/20 overflow-hidden mb-6">
      {/* ABAS */}
      <div className="flex border-b border-light-200/20 dark:border-dark-200/20">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`px-5 py-3 text-sm font-medium transition-colors relative ${
              activeTab === tab.key
                ? 'text-cyan-700 dark:text-cyan-300'
                : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-700 dark:bg-cyan-300" />
            )}
          </button>
        ))}
      </div>

      {/* TIMEFRAMES E VALOR ATUAL */}
      <div className="flex justify-between items-center px-5 py-3 bg-light-secondary/30 dark:bg-[#1a1a1a] border-b border-light-200/20 dark:border-dark-200/20">
        <div className="flex gap-2 flex-wrap">
          {timeframes.map((period) => (
            <button
              key={period}
              onClick={() => handleTimeframeChange(period)}
              disabled={chartLoading}
              className={`px-3 py-1.5 text-xs rounded border transition-all ${
                timeframe === period
                  ? 'bg-cyan-300/20 text-cyan-700 dark:text-cyan-300 border-cyan-700/60 dark:border-cyan-300/40'
                  : 'bg-white dark:bg-dark-secondary text-black/70 dark:text-white/70 border-black/20 dark:border-white/20 hover:border-black/40 dark:hover:border-white/40'
              } ${chartLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {period}
            </button>
          ))}
        </div>
        {currentValue ? (
          <div className="text-sm font-semibold text-black dark:text-white hidden sm:block">
            {currentValue.toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        ) : (
          <div className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
            Clique em um ativo
          </div>
        )}
      </div>

      {/* 🎯 GRÁFICO COM EIXO X CORRIGIDO */}
      <div className="p-5 h-[280px]">
        {chartLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-700 dark:border-cyan-300 mb-2"></div>
            <p className="text-sm">Carregando gráfico...</p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="relative h-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={Array.from({ length: 65 }, (_, i) => {
                const hour = Math.floor(i / 10) + 10;
                const minute = (i % 10) * 6;
                const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                const baseValue = 149000;
                const variation = Math.sin(i * 0.1) * 500;
                return { time, value: baseValue + variation };
              })}>
                <XAxis 
                  dataKey="time" 
                  stroke="#d1d5db"
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#9ca3af' }}
                  interval={10}
                  tickFormatter={(value) => {
                    const hour = value.split(':')[0];
                    return `${hour}h`;
                  }}
                />
                <YAxis 
                  stroke="#d1d5db"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  orientation="right"
                  domain={[148000, 150000]}
                  tick={{ fill: '#9ca3af' }}
                  tickFormatter={(value) => (value / 1000).toFixed(0) + 'K'}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#d1d5db"
                  strokeWidth={1}
                  dot={false}
                  activeDot={false}
                  strokeDasharray="3 3"
                />
              </LineChart>
            </ResponsiveContainer>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 dark:bg-dark-secondary/90 backdrop-blur-sm rounded-lg">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Gráfico Financeiro
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                Selecione um ativo para visualizar<br />os dados em tempo real
              </p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              key={animationKey}
              data={chartData}
              margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
            >
              <XAxis 
                dataKey="time" 
                stroke="#888888"
                fontSize={9}
                tickLine={false}
                axisLine={false}
                interval={xAxisConfig.interval}
                tickFormatter={xAxisConfig.tickFormatter}
              />
              <YAxis 
                stroke="#888888"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                orientation="right"
                domain={yAxisDomain}
                tickFormatter={(value) => {
                  if (value >= 1000) {
                    return (value / 1000).toFixed(1) + 'K';
                  }
                  return value.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  });
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#0891b2"
                strokeWidth={1.5}
                dot={false}
                activeDot={false}
                animationDuration={1000}
                animationEasing="ease-in-out"
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* LISTA DE ATIVOS FILTRADOS */}
      <div className="px-3 pb-5 max-h-60 overflow-y-auto">
        {filteredIndices.map((index, i) => (
          <div
            key={i}
            onClick={() => handleIndexClick(index.symbol)}
            className={`flex justify-between items-center px-3 py-3 rounded-lg cursor-pointer transition-colors ${
              selectedIndex === index.symbol
                ? 'bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800'
                : 'hover:bg-light-secondary/30 dark:hover:bg-white/5'
            }`}
          >
            <span className="text-sm font-medium text-black dark:text-white flex-1">
              {index.name}
            </span>
            <span className="text-sm font-semibold text-black dark:text-white mx-4">
              {index.value.toLocaleString('pt-BR', {
                minimumFractionDigits: index.category === 'currencies' ? 3 : 2,
                maximumFractionDigits: index.category === 'currencies' ? 3 : 2,
              })}
            </span>
            <div className="flex items-center gap-2 text-sm">
              <span className={index.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                {index.isPositive ? '+' : ''}{index.change.toLocaleString('pt-BR', {
                  minimumFractionDigits: index.change >= 1 ? 0 : 2,
                  maximumFractionDigits: index.change >= 1 ? 0 : 3,
                })}
              </span>
              <span className={index.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                {index.isPositive ? '+' : ''}{index.changePercent.toFixed(2)}%
              </span>
              <Clock size={14} className={index.isPositive ? "text-green-500" : "text-red-500"} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FinancialChart;