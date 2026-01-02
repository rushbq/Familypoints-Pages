import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { ScoreRecord, User } from '../types';

interface RechartsWrapperProps {
  data: ScoreRecord[];
  users: User[];
}

export const RechartsWrapper: React.FC<RechartsWrapperProps> = ({ data, users }) => {
  const child1 = users.find(u => u.id === 'child_1');
  const child2 = users.find(u => u.id === 'child_2');

  if (!child1 || !child2) return null;

  // Process data for chart: Group by day? Or just total?
  // Let's do a simple comparison bar chart for "Current Total" and "Positives vs Negatives"
  
  const calcStats = (childId: string) => {
    const records = data.filter(r => r.childId === childId);
    const positive = records.filter(r => r.pointsChange > 0).reduce((a, b) => a + b.pointsChange, 0);
    const negative = records.filter(r => r.pointsChange < 0).reduce((a, b) => a + Math.abs(b.pointsChange), 0);
    const total = positive - negative;
    return { name: users.find(u => u.id === childId)?.name, 加分: positive, 扣分: negative, 總分: total };
  };

  const chartData = [
    calcStats(child1.id),
    calcStats(child2.id)
  ];

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ResponsiveContainer>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
          <XAxis type="number" hide />
          <YAxis dataKey="name" type="category" width={60} tick={{fill: '#64748b', fontSize: 14, fontWeight: 'bold'}} axisLine={false} tickLine={false} />
          <Tooltip 
            cursor={{fill: '#f1f5f9'}}
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend />
          <Bar dataKey="加分" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
          <Bar dataKey="扣分" fill="#f43f5e" radius={[0, 4, 4, 0]} barSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};