"use client";

import React from 'react';
import { Bar } from 'react-chartjs-2';
import './ChartConfig';
import { ChartOptions, ChartData } from 'chart.js';

import { useTheme } from 'next-themes';

interface BarChartProps {
  data: ChartData<'bar'>;
  title?: string;
  horizontal?: boolean;
}

export const BookingBarChart: React.FC<BarChartProps> = ({ data, title, horizontal = false }) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const options: ChartOptions<'bar'> = {
    indexAxis: horizontal ? 'y' as const : 'x' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
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
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: !horizontal,
          color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          color: isDark ? '#94A3B8' : '#64748B',
        }
      },
      x: {
        grid: {
          display: horizontal,
          color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          color: isDark ? '#94A3B8' : '#64748B',
        }
      }
    }
  };

  return (
    <div className="w-full h-full min-h-[300px]">
      <Bar data={data} options={options} />
    </div>
  );
};
