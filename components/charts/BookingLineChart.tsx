"use client";

import React from 'react';
import { Line } from 'react-chartjs-2';
import './ChartConfig'; // Ensure registration
import { ChartOptions, ChartData } from 'chart.js';

import { useTheme } from 'next-themes';

interface LineChartProps {
  data: ChartData<'line'>;
  title?: string;
}

export const BookingLineChart: React.FC<LineChartProps> = ({ data, title }) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: isDark ? '#94A3B8' : '#64748B',
          font: { family: 'Inter, sans-serif', weight: 'bold' as any },
          usePointStyle: true,
          padding: 20
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
        cornerRadius: 12,
        titleFont: { size: 14, weight: 'bold' as any },
        bodyFont: { size: 12 },
        displayColors: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          color: isDark ? '#94A3B8' : '#64748B',
          stepSize: 1,
          font: { family: 'Inter, sans-serif' }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: isDark ? '#94A3B8' : '#64748B',
          font: { family: 'Inter, sans-serif' }
        }
      }
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    }
  };

  return (
    <div className="w-full h-full min-h-[300px]">
      <Line data={data} options={options} />
    </div>
  );
};
