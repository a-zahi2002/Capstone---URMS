"use client";

import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import './ChartConfig';
import { ChartOptions, ChartData } from 'chart.js';

import { useTheme } from 'next-themes';

interface PieChartProps {
  data: ChartData<'doughnut'>;
  title?: string;
}

export const BookingPieChart: React.FC<PieChartProps> = ({ data, title }) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: isDark ? '#94A3B8' : '#64748B',
          padding: 20,
          usePointStyle: true,
          font: { weight: 'bold' as any }
        }
      },
      title: {
        display: !!title,
        text: title,
        color: isDark ? '#F8FAF6' : '#020617',
        font: { size: 16, weight: 'bold' as any }
      },
      tooltip: {
        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        titleColor: isDark ? '#F8FAF6' : '#020617',
        bodyColor: isDark ? '#94A3B8' : '#64748B',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 12
      }
    }
  };

  return (
    <div className="w-full h-full min-h-[300px]">
      <Doughnut data={data} options={options} />
    </div>
  );
};
