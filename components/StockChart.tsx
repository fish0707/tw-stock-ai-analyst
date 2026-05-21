import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface Props {
  currentPrice: number;
  predictedHigh: number;
  predictedLow: number;
  buyPoint: number;
  sellPoint: number;
}

const StockChart: React.FC<Props> = ({ currentPrice, predictedHigh, predictedLow, buyPoint, sellPoint }) => {
  // Simulate a month of future trend data points for visualization based on the prediction
  const data = [
    { name: 'Now', price: currentPrice },
    { name: 'W1', price: (currentPrice + predictedLow) / 2 },
    { name: 'W2', price: (currentPrice + predictedHigh) / 2 },
    { name: 'W3', price: predictedLow },
    { name: 'W4', price: predictedHigh },
  ];

  return (
    <div className="h-64 w-full bg-darkBg rounded-lg p-4 mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="name" stroke="#94a3b8" />
          <YAxis domain={['auto', 'auto']} stroke="#94a3b8" />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#fff' }}
            itemStyle={{ color: '#fff' }}
          />
          <ReferenceLine y={buyPoint} label={{ value: "Buy", fill: '#22c55e' }} stroke="#22c55e" strokeDasharray="3 3" />
          <ReferenceLine y={sellPoint} label={{ value: "Sell", fill: '#ef4444' }} stroke="#ef4444" strokeDasharray="3 3" />
          <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} dot={{r: 4}} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StockChart;