'use client';

import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

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
  volume?: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
}

const MOCK_INDICES: MarketIndex[] = [
  { symbol: 'IBOV', name: 'Ibovespa', value: 129540, change: 1260, changePercent: 0.98, isPositive: true, category: 'indices' },
  { symbol: 'SPX', name: 'S&P 500', value: 5920, change: 35.5, changePercent: 0.6, isPositive: true, category: 'indices' },
  { symbol: 'DJI', name: 'Dow Jones', value: 43627, change: 210.25, changePercent: 0.48, isPositive: true, category: 'indices' },
  { symbol: 'IXIC', name: 'NASDAQ', value: 19285, change: 145.75, changePercent: 0.76, isPositive: true, category: 'indices' },
  { symbol: 'FTSE', name: 'FTSE 100', value: 8325, change: -35.3, changePercent: -0.42, isPositive: false, category: 'indices' },
  { symbol: 'N225', name: 'Nikkei 225', value: 39130, change: 320.15, changePercent: 0.82, isPositive: true, category: 'indices' },
  { symbol: 'USD', name: 'Dólar Americano', value: 5.72, change: 0.03, changePercent: 0.53, isPositive: true, category: 'currencies' },
  { symbol: 'EUR', name: 'Euro', value: 6.22, change: -0.02, changePercent: -0.32, isPositive: false, category: 'currencies' },
  { symbol: 'GBP', name: 'Libra Esterlina', value: 7.42, change: 0.04, changePercent: 0.54, isPositive: true, category: 'currencies' },
  { symbol: 'JPY', name: 'Iene Japonês', value: 0.038, change: 0.0002, changePercent: 0.53, isPositive: true, category: 'currencies' },
  { symbol: 'BTC', name: 'Bitcoin', value: 96520, change: 2880, changePercent: 3.08, isPositive: true, category: 'currencies' },
  { symbol: 'ETH', name: 'Ethereum', value: 3580, change: 125.5, changePercent: 3.63, isPositive: true, category: 'currencies' },
  { symbol: 'PETR4', name: 'Petrobras', value: 40.85, change: 0.65, changePercent: 1.62, isPositive: true, category: 'stocks' },
  { symbol: 'VALE3', name: 'Vale', value: 58.4, change: -0.95, changePercent: -1.6, isPositive: false, category: 'stocks' },
  { symbol: 'AAPL', name: 'Apple', value: 231.5, change: 4.25, changePercent: 1.87, isPositive: true, category: 'stocks' },
  { symbol: 'MSFT', name: 'Microsoft', value: 426, change: 6.75, changePercent: 1.61, isPositive: true, category: 'stocks' },
  { symbol: 'TSLA', name: 'Tesla', value: 352.3, change: -3.15, changePercent: -0.89, isPositive: false, category: 'stocks' },
  { symbol: 'AMZN', name: 'Amazon', value: 196.75, change: 2.85, changePercent: 1.47, isPositive: true, category: 'stocks' },
];

const TABS = [
  { key: 'currencies', label: 'Moedas' },
  { key: 'indices', label: 'Índices' },
  { key: 'stocks', label: 'Ações' },
];

const TIMEFRAMES = ['1D', '1S', '1M', '6M', '1A', '5A', 'Máx.'];

function generateChartData(min: number, max: number, count: number): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  const baseValue = (min + max) / 2;
  const range = max - min;
  const baseVolume = baseValue > 1000 ? 10000000 : 50000000;

  for (let i = 0; i < count; i++) {
    const progress = i / count;
    const trend = Math.sin(progress * Math.PI * 2) * 0.4;
    const noise = (Math.random() - 0.5) * 0.2;
    const close = baseValue + range * (trend + noise);
    
    const dailyVolatility = 0.01;
    const open = close * (1 + (Math.random() - 0.5) * dailyVolatility);
    const high = Math.max(open, close) * (1 + Math.random() * dailyVolatility);
    const low = Math.min(open, close) * (1 - Math.random() * dailyVolatility);
    const volume = Math.floor(baseVolume * (0.8 + Math.random() * 0.4));
    
    data.push({ 
      time: `${i}`, 
      value: Number(close.toFixed(2)),
      close: Number(close.toFixed(2)),
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      volume
    });
  }

  return data;
}

function formatXAxis(value: string, timeframe: string): string {
  if (timeframe === '1D' && value.includes(':')) {
    return value.split(':')[0] + 'h';
  }
  if (timeframe === '5A' || timeframe === 'Máx.') {
    return /^\d{4}$/.test(value) ? "'" + value.slice(-2) : value;
  }
  return value;
}

function formatYAxis(value: number): string {
  return value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value.toFixed(0);
}

function calculateDomain(data: ChartDataPoint[]): [number, number] {
  if (!data.length) return [0, 100];
  
  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = (max - min) * 0.1;
  
  return [min - padding, max + padding];
}

const CustomTooltip = ({ active, payload, selectedIndex }: any) => {
  if (!active || !payload?.[0]) return null;

  const point = payload[0].payload;
  const isCurrency = ['USD', 'EUR', 'GBP', 'JPY'].includes(selectedIndex);
  const isCrypto = ['BTC', 'ETH'].includes(selectedIndex);
  const prefix = isCurrency ? 'R$ ' : isCrypto ? '' : 'US$ ';

  const format = (val: number | undefined) => {
    if (!val) return 'N/A';
    return prefix + val.toLocaleString('pt-BR', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  const formatVolume = (vol: number | undefined) => {
    if (!vol || vol === 0) return 'N/A';
    if (vol >= 1000000000) return (vol / 1000000000).toFixed(2) + 'B';
    if (vol >= 1000000) return (vol / 1000000).toFixed(2) + 'M';
    if (vol >= 1000) return (vol / 1000).toFixed(2) + 'K';
    return vol.toLocaleString('pt-BR');
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-md text-xs shadow-lg border border-gray-300 dark:border-gray-600">
      <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">
        {point.time}
      </p>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-gray-600 dark:text-gray-400">Fechar</span>
          <span className="text-gray-900 dark:text-white font-medium">{format(point.close || point.value)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-600 dark:text-gray-400">Abrir</span>
          <span className="text-gray-900 dark:text-white font-medium">{format(point.open)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-600 dark:text-gray-400">Máximo</span>
          <span className="text-gray-900 dark:text-white font-medium">{format(point.high)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-600 dark:text-gray-400">Mínimo</span>
          <span className="text-gray-900 dark:text-white font-medium">{format(point.low)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-600 dark:text-gray-400">Volume</span>
          <span className="text-gray-900 dark:text-white font-medium">
            {formatVolume(point.volume)}
          </span>
        </div>
      </div>
    </div>
  );
};

const FinancialChart = () => {
  const [activeTab, setActiveTab] = useState('indices');
  const [selectedIndex, setSelectedIndex] = useState('IBOV');
  const [timeframe, setTimeframe] = useState('1D');
  const [indices, setIndices] = useState<MarketIndex[]>(MOCK_INDICES);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(false);

  const filteredIndices = indices.filter(idx => idx.category === activeTab);
  const selectedAsset = indices.find(idx => idx.symbol === selectedIndex);
  const isPositive = chartData.length > 1 && chartData[chartData.length - 1].value >= chartData[0].value;
  const chartColor = isPositive ? '#10b981' : '#ef4444';

  useEffect(() => {
    const fetchIndices = async () => {
      try {
        const res = await fetch('/api/market/indices');
        if (res.ok) {
          const data = await res.json();
          if (data.indices?.length) setIndices(data.indices);
        }
      } catch (error) {
        console.error('Failed to fetch indices:', error);
      }
    };

    fetchIndices();
    const interval = setInterval(fetchIndices, 300000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!filteredIndices.find(idx => idx.symbol === selectedIndex)) {
      setSelectedIndex(filteredIndices[0]?.symbol || 'IBOV');
    }
  }, [activeTab, filteredIndices, selectedIndex]);

  useEffect(() => {
    const fetchChart = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/market/chart?symbol=${selectedIndex}&period=${timeframe}`);
        const data = await res.json();
        
        if (data.data?.length) {
          setChartData(data.data);
        } else {
          const baseValue = selectedAsset?.value || 1000;
          const mockData = generateChartData(
            baseValue * 0.98,
            baseValue * 1.02,
            timeframe === '1D' ? 78 : 20
          );
          setChartData(mockData);
        }
      } catch (error) {
        const baseValue = selectedAsset?.value || 1000;
        const mockData = generateChartData(
          baseValue * 0.98,
          baseValue * 1.02,
          timeframe === '1D' ? 78 : 20
        );
        setChartData(mockData);
      } finally {
        setLoading(false);
      }
    };

    fetchChart();
  }, [selectedIndex, timeframe, selectedAsset]);

  return (
    <div className="bg-white dark:bg-dark-secondary rounded-xl shadow-sm border border-light-200/20 dark:border-dark-200/20 overflow-hidden mb-6">
      <div className="flex border-b border-light-200/20 dark:border-dark-200/20">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
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

      <div className="flex justify-between items-center px-5 py-3 bg-light-secondary/30 dark:bg-[#1a1a1a] border-b border-light-200/20 dark:border-dark-200/20">
        <div className="flex gap-2 flex-wrap">
          {TIMEFRAMES.map(period => (
            <button
              key={period}
              onClick={() => setTimeframe(period)}
              disabled={loading}
              className={`px-3 py-1.5 text-xs font-medium rounded border transition-all ${
                timeframe === period
                  ? 'bg-cyan-300/20 text-cyan-700 dark:text-cyan-300 border-cyan-700/60'
                  : 'bg-white dark:bg-dark-secondary text-black/70 dark:text-white/70 border-black/20 dark:border-white/20'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {period}
            </button>
          ))}
        </div>
        
        {selectedAsset && (
          <div className="flex items-center gap-2">
            {isPositive ? <TrendingUp size={16} className="text-emerald-500" /> : <TrendingDown size={16} className="text-rose-500" />}
            <span className="text-sm font-semibold text-black dark:text-white hidden sm:block">
              {selectedAsset.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        )}
      </div>

      <div className="p-5 h-[300px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-700 dark:border-cyan-300 mb-2" />
            <p className="text-sm text-gray-500">Carregando gráfico...</p>
          </div>
        ) : !chartData.length ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Gráfico Financeiro</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Selecione um ativo para visualizar</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                stroke="#888"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb', strokeWidth: 1 }}
                tick={{ fill: '#6b7280' }}
                interval={timeframe === '1D' ? 12 : 'preserveStartEnd'}
                tickFormatter={(val) => formatXAxis(val, timeframe)}
              />
              <YAxis
                stroke="#888"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb', strokeWidth: 1 }}
                orientation="right"
                domain={calculateDomain(chartData)}
                tick={{ fill: '#6b7280' }}
                tickFormatter={formatYAxis}
              />
              <Tooltip content={<CustomTooltip selectedIndex={selectedIndex} />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={chartColor}
                strokeWidth={2}
                fill="url(#gradient)"
                dot={false}
                activeDot={{ r: 4, fill: chartColor }}
                animationDuration={800}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="px-3 pb-5 max-h-60 overflow-y-auto">
        {filteredIndices.map((index, i) => (
          <div
            key={i}
            onClick={() => setSelectedIndex(index.symbol)}
            className={`flex justify-between items-center px-3 py-3 rounded-lg cursor-pointer transition-colors ${
              selectedIndex === index.symbol
                ? 'bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800'
                : 'hover:bg-light-secondary/30 dark:hover:bg-white/5'
            }`}
          >
            <span className="text-sm font-medium text-black dark:text-white flex-1">{index.name}</span>
            <span className="text-sm font-semibold text-black dark:text-white mx-4">
              {index.value.toLocaleString('pt-BR', {
                minimumFractionDigits: index.category === 'currencies' ? 3 : 2,
                maximumFractionDigits: index.category === 'currencies' ? 3 : 2,
              })}
            </span>
            <div className="flex items-center gap-2 text-sm">
              <span className={index.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                {index.isPositive ? '+' : ''}{index.change.toLocaleString('pt-BR', {
                  minimumFractionDigits: index.change >= 1 ? 0 : 2,
                  maximumFractionDigits: index.change >= 1 ? 0 : 3,
                })}
              </span>
              <span className={`font-medium ${index.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {index.isPositive ? '+' : ''}{index.changePercent.toFixed(2)}%
              </span>
              {index.isPositive ? <TrendingUp size={14} className="text-emerald-500" /> : <TrendingDown size={14} className="text-rose-500" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FinancialChart;